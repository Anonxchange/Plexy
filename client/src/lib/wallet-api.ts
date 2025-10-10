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
  return data || [];
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
  return data;
}

export async function sendCrypto(
  userId: string,
  cryptoSymbol: string,
  toAddress: string,
  amount: number,
  notes?: string
): Promise<WalletTransaction> {
  const supabase = createClient();
  
  const wallet = await getWalletBalance(userId, cryptoSymbol);
  if (!wallet) throw new Error('Wallet not found');
  if (wallet.balance < amount) throw new Error('Insufficient balance');

  const fee = amount * 0.001;
  const totalAmount = amount + fee;

  if (wallet.balance < totalAmount) throw new Error('Insufficient balance for transaction + fee');

  const { data: transaction, error: txError } = await supabase
    .from('wallet_transactions')
    .insert({
      user_id: userId,
      wallet_id: wallet.id,
      type: 'withdrawal',
      crypto_symbol: cryptoSymbol,
      amount: -amount,
      fee: fee,
      status: 'pending',
      to_address: toAddress,
      notes: notes || null
    })
    .select()
    .single();

  if (txError) throw txError;

  const { error: updateError } = await supabase
    .from('wallets')
    .update({ 
      balance: wallet.balance - totalAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id);

  if (updateError) throw updateError;

  setTimeout(async () => {
    await supabase
      .from('wallet_transactions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`
      })
      .eq('id', transaction.id);
  }, 2000);

  return transaction;
}

export async function getDepositAddress(userId: string, cryptoSymbol: string): Promise<string> {
  const supabase = createClient();
  
  const wallet = await getWalletBalance(userId, cryptoSymbol);
  if (!wallet) throw new Error('Wallet not found');

  if (wallet.deposit_address) {
    return wallet.deposit_address;
  }

  const address = generateDepositAddress(cryptoSymbol);
  
  await supabase
    .from('wallets')
    .update({ deposit_address: address })
    .eq('id', wallet.id);

  return address;
}

function generateDepositAddress(cryptoSymbol: string): string {
  const prefixes: Record<string, string> = {
    BTC: '1',
    ETH: '0x',
    USDT: '0x',
    USDC: '0x',
    SOL: '',
    TON: 'EQ',
    XMR: '4'
  };
  
  const prefix = prefixes[cryptoSymbol] || '0x';
  const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  if (cryptoSymbol === 'BTC') {
    return prefix + randomPart.substring(0, 33).toUpperCase();
  } else if (cryptoSymbol === 'ETH' || cryptoSymbol.includes('USD')) {
    return prefix + randomPart.substring(0, 40);
  } else {
    return prefix + randomPart.substring(0, 32);
  }
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
  return data || [];
}
