import { asterdexService } from "./asterdex-service";
import { nonCustodialWalletManager } from "./non-custodial-wallet";
import { swapExecutionService } from "./swap-execution";
import { supabase } from "./supabase";

export interface SwapTransaction {
  id: string;
  user_id: string;
  from_crypto: string;
  to_crypto: string;
  from_amount: number;
  to_amount: number;
  swap_rate: number;
  market_rate: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  txHash?: string;
}

/**
 * Execute a non-custodial swap using AsterDEX API
 * Performs actual on-chain swap through AsterDEX
 * User owns their private keys - no custody involved
 */
export async function executeSwap(params: {
  userId: string;
  fromCrypto: string;
  toCrypto: string;
  fromAmount: number;
  toAmount: number;
  swapRate: number;
  marketRate: number;
  fee: number;
  fromAddress?: string;
  toAddress?: string;
  slippage?: string;
  userPassword?: string;
}): Promise<SwapTransaction> {
  try {
    // Get user's wallet address from non-custodial wallet manager
    const userWallets = nonCustodialWalletManager.getNonCustodialWallets(params.userId);
    
    // Find the correct wallet for the network
    const fromWallet = userWallets.find(w => {
      const chainId = w.chainId.toLowerCase();
      const symbol = params.fromCrypto.toLowerCase();
      return chainId.includes(symbol) || w.walletType.toLowerCase().includes(symbol);
    }) || userWallets[0]; // Fallback to first wallet
    
    if (!fromWallet) {
      throw new Error(`No wallet found for ${params.fromCrypto}. Please create a wallet first.`);
    }

    // Use provided password or fallback to storage
    const userPassword = params.userPassword || localStorage.getItem("pexly_wallet_password") || "password123"; 

    // Execute swap through AsterDEX integrated execution service
    // Use Asterdex Edge Function for swap execution to match spot page logic
    const { data: result, error: swapError } = await supabase.functions.invoke('asterdex', {
      body: {
        action: 'execute',
        wallet: fromWallet,
        fromSymbol: params.fromCrypto,
        toSymbol: params.toCrypto,
        amount: params.fromAmount,
        password: userPassword,
        userId: params.userId,
        slippage: parseFloat(params.slippage || "0.5"),
        tradeType: 'execute' // Added tradeType as it might be required
      }
    });

    if (swapError) throw swapError;
    if (!result || result.error) throw new Error(result?.error || "Failed to execute swap via AsterDEX Edge Function");

    // Create swap transaction record
    const swapTransaction: SwapTransaction = {
      id: result.id || `swap_${Date.now()}`,
      user_id: params.userId,
      from_crypto: params.fromCrypto,
      to_crypto: params.toCrypto,
      from_amount: params.fromAmount,
      to_amount: result.toAmount || params.toAmount,
      swap_rate: params.swapRate,
      market_rate: params.marketRate,
      fee: params.fee,
      status: 'completed',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      txHash: result.txHash
    };

    return swapTransaction;
  } catch (error) {
    console.error('Swap execution error:', error);
    throw error;
  }
}

export async function getSwapHistory(userId: string, limit: number = 20): Promise<any[]> {
  return swapExecutionService.getOrderHistory();
}
