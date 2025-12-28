import { nonCustodialWalletManager } from "./non-custodial-wallet";
import { createClient } from "./supabase";

export interface Wallet {
  id: string;
  user_id: string;
  crypto_symbol: string;
  balance: number;
  locked_balance: number;
  deposit_address: string | null;
  created_at: string;
  updated_at: string;
  isNonCustodial?: boolean;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | 'swap' | 'p2p_buy' | 'p2p_sell' | 'escrow_lock' | 'escrow_release' | 'fee';
  crypto_symbol: string;
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  reference_id: string | null;
  notes: string | null;
  confirmations: number | null;
  created_at: string;
  completed_at: string | null;
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('crypto_symbol', { ascending: true });

  if (error) throw error;
  
  const custodialWallets: Wallet[] = (data || []).map(wallet => ({
    ...wallet,
    balance: typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance,
    locked_balance: typeof wallet.locked_balance === 'string' ? parseFloat(wallet.locked_balance) : wallet.locked_balance,
  }));

  // Fetch non-custodial wallets from local storage
  const localWallets = nonCustodialWalletManager.getNonCustodialWallets();
  const nonCustodialWallets: Wallet[] = localWallets.map(w => ({
    id: w.id,
    user_id: userId,
    crypto_symbol: w.chainId === 'ethereum' ? 'ETH' : w.chainId.toUpperCase(),
    balance: 0,
    locked_balance: 0,
    deposit_address: w.address,
    created_at: w.createdAt,
    updated_at: w.createdAt,
    isNonCustodial: true
  }));

  return [...custodialWallets, ...nonCustodialWallets];
}

export async function getWalletBalance(userId: string, cryptoSymbol: string): Promise<Wallet | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('crypto_symbol', cryptoSymbol)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  if (!data) return null;
  
  return {
    ...data,
    balance: typeof data.balance === 'string' ? parseFloat(data.balance) : data.balance,
    locked_balance: typeof data.locked_balance === 'string' ? parseFloat(data.locked_balance) : data.locked_balance,
  };
}

export async function sendCrypto(
  userId: string,
  cryptoSymbol: string,
  toAddress: string,
  amount: number,
  notes?: string
): Promise<WalletTransaction> {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-withdrawal`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      crypto_symbol: cryptoSymbol,
      amount: amount,
      to_address: toAddress,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process withdrawal');
  }

  const result = await response.json();
  
  return {
    id: result.transaction.id,
    user_id: userId,
    wallet_id: result.transaction.wallet_id,
    type: 'withdrawal',
    crypto_symbol: cryptoSymbol,
    amount: -amount,
    fee: result.transaction.fee,
    status: result.transaction.status,
    tx_hash: result.tx_hash || null,
    from_address: null,
    to_address: toAddress,
    reference_id: null,
    notes: notes || null,
    confirmations: 0,
    created_at: new Date().toISOString(),
    completed_at: null,
  };
}

export async function getDepositAddress(userId: string, cryptoSymbol: string): Promise<string> {
  const supabase = createClient();
  
  const wallet = await getWalletBalance(userId, cryptoSymbol);

  if (wallet?.deposit_address) {
    return wallet.deposit_address;
  }

  // Call Supabase edge function to generate real address
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ crypto_symbol: cryptoSymbol }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate deposit address');
  }

  const result = await response.json();
  return result.wallet.deposit_address;
}

export async function getWalletTransactions(
  userId: string,
  limit: number = 20
): Promise<WalletTransaction[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  
  return (data || []).map(tx => ({
    ...tx,
    amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount,
    fee: typeof tx.fee === 'string' ? parseFloat(tx.fee) : tx.fee,
    confirmations: tx.confirmations !== null && tx.confirmations !== undefined
      ? (typeof tx.confirmations === 'string' ? parseInt(tx.confirmations, 10) : tx.confirmations)
      : null,
  }));
}

export async function monitorDeposits(userId: string, cryptoSymbol: string): Promise<{
  detected: boolean;
  transactions?: any[];
  message?: string;
}> {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const wallet = await getWalletBalance(userId, cryptoSymbol);
  if (!wallet?.deposit_address) {
    throw new Error('No deposit address found. Please generate a deposit address first.');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monitor-deposits`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      crypto_symbol: cryptoSymbol,
      deposit_address: wallet.deposit_address,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to monitor deposits');
  }

  return await response.json();
}

export async function monitorWithdrawals(userId: string): Promise<{
  monitored: number;
  updated: any[];
  message?: string;
}> {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monitor-withdrawals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to monitor withdrawals');
  }

  return await response.json();
}

export function startDepositMonitoring(
  userId: string,
  cryptoSymbol: string,
  onDeposit: (transactions: any[]) => void,
  intervalMs: number = 30000
): () => void {
  const checkDeposits = async () => {
    try {
      const result = await monitorDeposits(userId, cryptoSymbol);
      if (result.detected && result.transactions && result.transactions.length > 0) {
        onDeposit(result.transactions);
      }
    } catch (error) {
      console.error('Deposit monitoring error:', error);
    }
  };

  const intervalId = setInterval(checkDeposits, intervalMs);
  checkDeposits();

  return () => clearInterval(intervalId);
}

export function startWithdrawalMonitoring(
  userId: string,
  onUpdate: (transactions: any[]) => void,
  intervalMs: number = 30000
): () => void {
  const checkWithdrawals = async () => {
    try {
      const result = await monitorWithdrawals(userId);
      if (result.updated && result.updated.length > 0) {
        onUpdate(result.updated);
      }
    } catch (error) {
      console.error('Withdrawal monitoring error:', error);
    }
  };

  const intervalId = setInterval(checkWithdrawals, intervalMs);
  checkWithdrawals();

  return () => clearInterval(intervalId);
}

export async function sendPexlyPayment(
  senderId: string,
  recipientId: string,
  amount: number,
  cryptoSymbol: string = 'USDT',
  note?: string
): Promise<{
  success: boolean;
  transactionId?: string;
  error?: string;
}> {
  const supabase = createClient();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    console.log('🚀 DEBUG: Calling pexly-pay-send edge function:', {
      sender_id: senderId,
      recipient_id: recipientId,
      amount,
      crypto_symbol: cryptoSymbol,
      note
    });

    // Call the pexly-pay-send edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pexly-pay-send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_id: senderId,
        recipient_id: recipientId,
        amount,
        crypto_symbol: cryptoSymbol,
        note: note || null,
      }),
    });

    console.log('📡 DEBUG: Edge function response status:', response.status);

    const result = await response.json();
    
    console.log('📦 DEBUG: Edge function response:', result);

    if (!response.ok) {
      console.error('❌ Edge function error:', result);
      return { 
        success: false, 
        error: result.error || result.message || 'Failed to process transfer' 
      };
    }

    return {
      success: true,
      transactionId: result.transaction_id || result.transactionId,
    };
  } catch (error) {
    console.error('❌ Error in sendPexlyPayment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
