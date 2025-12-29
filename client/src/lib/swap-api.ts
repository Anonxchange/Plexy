import { getRocketxRate, executeRocketxSwap, RocketxSwapRequest } from "./rocketx-api";
import { nonCustodialWalletManager } from "./non-custodial-wallet";
import { swapHistoryStorage } from "./swap-history-storage";

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
 * Execute a non-custodial swap using Rocketx API
 * Performs actual on-chain swap through Rocketx
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
}): Promise<SwapTransaction> {
  try {
    // Get user's wallet address from non-custodial wallet manager
    const userWallets = nonCustodialWalletManager.getNonCustodialWallets(params.userId);
    const fromWallet = userWallets.find(w => w.chainId === params.fromCrypto.toLowerCase());
    
    if (!fromWallet) {
      throw new Error(`No wallet found for ${params.fromCrypto}. Please create a wallet first.`);
    }

    const fromAddress = params.fromAddress || fromWallet.address;
    const toAddress = params.toAddress || fromAddress; // Send to same address by default

    // Prepare Rocketx swap request
    const swapRequest: RocketxSwapRequest = {
      fromToken: params.fromCrypto,
      toToken: params.toCrypto,
      fromAmount: params.fromAmount.toString(),
      fromAddress,
      toAddress,
      slippage: params.slippage || '1', // 1% default
    };

    // Execute swap through Rocketx API
    const rocketxResponse = await executeRocketxSwap(swapRequest);

    // Create swap transaction record
    const swapTransaction: SwapTransaction = {
      id: rocketxResponse.transactionHash || crypto.randomUUID(),
      user_id: params.userId,
      from_crypto: params.fromCrypto,
      to_crypto: params.toCrypto,
      from_amount: params.fromAmount,
      to_amount: parseFloat(rocketxResponse.toAmount),
      swap_rate: rocketxResponse.rate,
      market_rate: params.marketRate,
      fee: rocketxResponse.fee,
      status: rocketxResponse.status as any,
      created_at: new Date().toISOString(),
      completed_at: rocketxResponse.status === 'completed' ? new Date().toISOString() : null,
      txHash: rocketxResponse.transactionHash
    };

    // Store in local history for non-custodial tracking
    swapHistoryStorage.addSwap({
      id: swapTransaction.id,
      fromCrypto: params.fromCrypto,
      toCrypto: params.toCrypto,
      fromAmount: params.fromAmount,
      toAmount: parseFloat(rocketxResponse.toAmount),
      swapRate: rocketxResponse.rate,
      fee: rocketxResponse.fee,
      status: rocketxResponse.status as any,
      txHash: rocketxResponse.transactionHash,
      createdAt: new Date().toISOString(),
    });

    return swapTransaction;
  } catch (error) {
    console.error('Swap execution error:', error);
    throw error;
  }
}

export async function getSwapHistory(userId: string, limit: number = 20): Promise<any[]> {
  // Return swap history from local storage for non-custodial tracking
  return swapHistoryStorage.getHistory(limit);
}
