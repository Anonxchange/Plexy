import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
  console.log("[getUserWallets] Fetching balances for user:", userId);

  const { data: result, error } = await supabase.functions.invoke('monitor-deposits');

  if (error) {
    console.error("[getUserWallets] Edge function error:", error);
    throw new Error(error.message);
  }

  if (result?.error) {
    console.error("[getUserWallets] API error:", result.error);
    throw new Error(result.error);
  }

  const balances = result?.balances ?? [];
  
  const wallets: Wallet[] = balances.map((b: any) => ({
    id: b.wallet_id || b.address,
    user_id: userId,
    crypto_symbol: b.symbol,
    balance: typeof b.balance === 'number' ? b.balance : 0,
    locked_balance: 0,
    deposit_address: b.address,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  console.log("[getUserWallets] Synced wallets:", wallets.map(w => `${w.crypto_symbol}: ${w.balance}`));
  return wallets;
}

export async function getWalletBalance(userId: string, cryptoSymbol: string): Promise<Wallet | null> {
  const wallets = await getUserWallets(userId);
  return wallets.find(w => w.crypto_symbol === cryptoSymbol) || null;
}

export async function getWalletTransactions(userId: string, limit: number = 50): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getWalletTransactions] Error:", error);
    throw new Error(error.message);
  }

  return (data as unknown as WalletTransaction[]) ?? [];
}

export async function getDepositAddress(userId: string, cryptoSymbol: string): Promise<string> {
  const wallets = await getUserWallets(userId);
  const wallet = wallets.find(w => w.crypto_symbol === cryptoSymbol);
  
  if (wallet?.deposit_address) {
    return wallet.deposit_address;
  }
  
  throw new Error('No deposit address found for this wallet.');
}
