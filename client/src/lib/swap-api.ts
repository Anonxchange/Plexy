import { createClient } from "./supabase";
import { getWalletBalance } from "./wallet-api";
import { getRocketxQuote } from "./rocketx-api";

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
}

/**
 * Execute a swap using Rocketx exchange rates
 * Non-custodial swap that directly updates wallet balances
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
}): Promise<SwapTransaction> {
  const supabase = createClient();

  // Validate balances
  const fromWallet = await getWalletBalance(params.userId, params.fromCrypto);
  if (!fromWallet) {
    throw new Error(`No ${params.fromCrypto} wallet found. Please create a wallet first.`);
  }

  const availableBalance = fromWallet.balance - fromWallet.locked_balance;
  if (availableBalance < params.fromAmount) {
    throw new Error(`Insufficient ${params.fromCrypto} balance. Available: ${availableBalance.toFixed(8)}`);
  }

  // Get or create destination wallet
  let toWallet = await getWalletBalance(params.userId, params.toCrypto);
  if (!toWallet) {
    // Create wallet if it doesn't exist
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({
        user_id: params.userId,
        crypto_symbol: params.toCrypto,
        balance: 0,
        locked_balance: 0,
      })
      .select()
      .single();

    if (createError) throw new Error(`Failed to create ${params.toCrypto} wallet: ${createError.message}`);
    if (!newWallet) throw new Error(`Failed to create ${params.toCrypto} wallet`);
    toWallet = newWallet;
  }

  // Ensure toWallet is not null
  if (!toWallet) throw new Error(`Wallet for ${params.toCrypto} not found`);

  try {
    // Start transaction - deduct from source wallet
    const { error: deductError } = await supabase
      .from('wallets')
      .update({
        balance: fromWallet.balance - params.fromAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', fromWallet.id);

    if (deductError) throw new Error(`Failed to deduct balance: ${deductError.message}`);

    // Add to destination wallet (after fee)
    const netAmount = params.toAmount - params.fee;
    const { error: addError } = await supabase
      .from('wallets')
      .update({
        balance: toWallet.balance + netAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', toWallet.id);

    if (addError) {
      // Rollback - add back to source wallet
      await supabase
        .from('wallets')
        .update({
          balance: fromWallet.balance,
          updated_at: new Date().toISOString()
        })
        .eq('id', fromWallet.id);
      
      throw new Error(`Failed to add balance: ${addError.message}`);
    }

    // Record withdrawal transaction
    const { error: withdrawalError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: params.userId,
        wallet_id: fromWallet.id,
        type: 'swap',
        crypto_symbol: params.fromCrypto,
        amount: -params.fromAmount,
        fee: 0,
        status: 'completed',
        notes: `Swapped to ${params.toCrypto}`,
        completed_at: new Date().toISOString()
      });

    if (withdrawalError) console.error('Failed to record withdrawal transaction:', withdrawalError);

    // Record deposit transaction
    const { error: depositError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: params.userId,
        wallet_id: toWallet.id,
        type: 'swap',
        crypto_symbol: params.toCrypto,
        amount: netAmount,
        fee: params.fee,
        status: 'completed',
        notes: `Swapped from ${params.fromCrypto}`,
        completed_at: new Date().toISOString()
      });

    if (depositError) console.error('Failed to record deposit transaction:', depositError);

    // Create swap transaction record (if table exists)
    const swapTransaction: SwapTransaction = {
      id: crypto.randomUUID(),
      user_id: params.userId,
      from_crypto: params.fromCrypto,
      to_crypto: params.toCrypto,
      from_amount: params.fromAmount,
      to_amount: netAmount,
      swap_rate: params.swapRate,
      market_rate: params.marketRate,
      fee: params.fee,
      status: 'completed',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };

    return swapTransaction;
  } catch (error) {
    console.error('Swap execution error:', error);
    throw error;
  }
}

export async function getSwapHistory(userId: string, limit: number = 20): Promise<any[]> {
  const supabase = createClient();
  
  // Get swap transactions from wallet_transactions
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'swap')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching swap history:', error);
    return [];
  }

  return data || [];
}
