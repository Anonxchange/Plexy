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
  
  return (data || []).map(wallet => ({
    ...wallet,
    balance: typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance,
    locked_balance: typeof wallet.locked_balance === 'string' ? parseFloat(wallet.locked_balance) : wallet.locked_balance,
  }));
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

    // Get sender's wallet balance (defaults to USDT for Pexly Pay)
    const senderWallet = await getWalletBalance(senderId, cryptoSymbol);
    if (!senderWallet) {
      return { success: false, error: 'Sender wallet not found' };
    }

    console.log(`💰 Pexly Pay Balance Check:`, {
      cryptoSymbol,
      available: senderWallet.balance,
      requested: amount,
      locked: senderWallet.locked_balance
    });

    if (senderWallet.balance < amount) {
      return { 
        success: false, 
        error: `Insufficient balance. Available: ${senderWallet.balance} ${cryptoSymbol}, Required: ${amount} ${cryptoSymbol}` 
      };
    }

    // Get or create recipient's wallet
    let recipientWallet = await getWalletBalance(recipientId, cryptoSymbol);
    if (!recipientWallet) {
      // Create wallet for recipient if it doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: recipientId,
          crypto_symbol: cryptoSymbol,
          balance: 0,
          locked_balance: 0,
        })
        .select()
        .single();

      if (createError || !newWallet) {
        return { success: false, error: 'Failed to create recipient wallet' };
      }
      recipientWallet = newWallet as Wallet;
    }

    // Update sender's wallet balance
    const { error: senderError } = await supabase
      .from('wallets')
      .update({ 
        balance: senderWallet.balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', senderWallet.id);

    if (senderError) {
      console.error('Error updating sender wallet:', senderError);
      return { success: false, error: 'Failed to update sender wallet' };
    }

    // Update recipient's wallet balance
    const { error: recipientError } = await supabase
      .from('wallets')
      .update({ 
        balance: recipientWallet.balance + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipientWallet.id);

    if (recipientError) {
      // Rollback sender's balance
      await supabase
        .from('wallets')
        .update({ 
          balance: senderWallet.balance,
          updated_at: new Date().toISOString()
        })
        .eq('id', senderWallet.id);
      
      console.error('Error updating recipient wallet:', recipientError);
      return { success: false, error: 'Failed to update recipient wallet' };
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('pexly_transactions')
      .insert({
        sender_id: senderId,
        receiver_id: recipientId,
        amount: amount.toString(),
        fee: '0',
        status: 'completed',
        note: note || null,
        transaction_type: 'transfer',
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction record:', txError);
    }

    // Create wallet transaction records
    await supabase.from('wallet_transactions').insert([
      {
        user_id: senderId,
        wallet_id: senderWallet.id,
        type: 'withdrawal',
        crypto_symbol: cryptoSymbol,
        amount: -amount,
        fee: 0,
        status: 'completed',
        notes: `Pexly Pay transfer to ${recipientId}`,
        completed_at: new Date().toISOString(),
      },
      {
        user_id: recipientId,
        wallet_id: recipientWallet.id,
        type: 'deposit',
        crypto_symbol: cryptoSymbol,
        amount: amount,
        fee: 0,
        status: 'completed',
        notes: `Pexly Pay transfer from ${senderId}`,
        completed_at: new Date().toISOString(),
      },
    ]);

    return {
      success: true,
      transactionId: transaction?.id,
    };
  } catch (error) {
    console.error('Error in sendPexlyPayment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
