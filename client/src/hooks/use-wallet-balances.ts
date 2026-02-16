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

/* =========================================
   FETCH USER WALLETS + LIVE BALANCES
========================================= */
export async function getUserWallets(userId: string): Promise<Wallet[]> {
  console.log('[getUserWallets] Fetching wallets for user:', userId);

  // 1️⃣ Fetch user wallets from DB
  const { data: userWallets, error: walletError } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId);

  if (walletError) {
    console.error('[getUserWallets] DB error:', walletError);
    throw new Error(walletError.message);
  }

  if (!userWallets || userWallets.length === 0) {
    return [];
  }

  const wallets: Wallet[] = [];

  // 2️⃣ Call edge function per wallet
  for (const w of userWallets) {
    if (!w.deposit_address || !w.chain_id) continue;

    try {
      const { data, error } = await supabase.functions.invoke(
        'monitor-deposits',
        {
          body: {
            address: w.deposit_address,
            chain: w.chain_id,
          },
        }
      );

      if (error) {
        console.error('[getUserWallets] Edge error:', error);
        continue;
      }

      if (!data?.success) {
        console.error('[getUserWallets] API error:', data?.error);
        continue;
      }

      wallets.push({
        id: w.id,
        user_id: userId,
        crypto_symbol: w.crypto_symbol,
        balance: Number(data.balance ?? 0),
        locked_balance: 0,
        deposit_address: w.deposit_address,
        created_at: w.created_at,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[getUserWallets] Invoke failed:', err);
    }
  }

  console.log(
    '[getUserWallets] Synced:',
    wallets.map((w) => `${w.crypto_symbol}: ${w.balance}`)
  );

  return wallets;
}

/* =========================================
   REACT QUERY HOOK (FIXES BUILD ERROR)
========================================= */
export function useWalletBalances() {
  return useQuery({
    queryKey: ['wallet-balances'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return [];

      return await getUserWallets(user.id);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/* =========================================
   GET SINGLE WALLET
========================================= */
export async function getWalletBalance(
  userId: string,
  cryptoSymbol: string
): Promise<Wallet | null> {
  const wallets = await getUserWallets(userId);
  return wallets.find((w) => w.crypto_symbol === cryptoSymbol) || null;
}

/* =========================================
   GET WALLET TRANSACTIONS
========================================= */
export async function getWalletTransactions(
  userId: string,
  limit: number = 50
): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getWalletTransactions] Error:', error);
    throw new Error(error.message);
  }

  return (data as unknown as WalletTransaction[]) ?? [];
}

/* =========================================
   GET DEPOSIT ADDRESS
========================================= */
export async function getDepositAddress(
  userId: string,
  cryptoSymbol: string
): Promise<string> {
  const { data, error } = await supabase
    .from('user_wallets')
    .select('deposit_address')
    .eq('user_id', userId)
    .eq('crypto_symbol', cryptoSymbol)
    .single();

  if (error || !data?.deposit_address) {
    throw new Error('No deposit address found for this wallet.');
  }

  return data.deposit_address;
}
