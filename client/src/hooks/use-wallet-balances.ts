import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/* =========================================
   TYPES
========================================= */
export interface Wallet {
  id: string;
  user_id: string;
  crypto_symbol: string;
  balance: number;
  locked_balance: number;
  deposit_address: string | null;
  chain_id: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type:
    | 'deposit'
    | 'withdrawal'
    | 'swap'
    | 'p2p_buy'
    | 'p2p_sell'
    | 'escrow_lock'
    | 'escrow_release'
    | 'fee';
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
   CHAIN RESOLVER
   Maps DB chain_id values to edge function chain keys
========================================= */

function resolveChain(chainId: string): { chain: string; isToken: boolean; tokenSymbol?: string } {
  const id = chainId.toLowerCase();

  // Token-specific wallets (USDT-Ethereum, USDC-Tron, etc.)
  if (id.startsWith('usdt-') || id.startsWith('usdc-')) {
    const rest = id.replace(/^usdt-|^usdc-/, '');
    const tokenSymbol = id.startsWith('usdt-') ? 'USDT' : 'USDC';
    const baseChain = resolveChain(rest.charAt(0).toUpperCase() + rest.slice(1));
    return { chain: baseChain.chain, isToken: true, tokenSymbol };
  }

  if (id.includes('bitcoin') || id.includes('segwit') || id === 'btc') return { chain: 'BTC', isToken: false };
  if (id.includes('ethereum') || id.includes('erc-20') || id === 'eth') return { chain: 'ETH', isToken: false };
  if (id.includes('binance') || id.includes('bep-20') || id === 'bsc' || id === 'bnb') return { chain: 'BSC', isToken: false };
  if (id.includes('solana') || id === 'sol') return { chain: 'SOL', isToken: false };
  if (id.includes('tron') || id.includes('trc-20') || id === 'trx') return { chain: 'TRX', isToken: false };
  if (id.includes('polygon') || id === 'matic') return { chain: 'POLYGON', isToken: false };
  if (id.includes('arbitrum') || id === 'arb') return { chain: 'ARBITRUM', isToken: false };
  if (id.includes('optimism') || id === 'op') return { chain: 'OPTIMISM', isToken: false };
  if (id.includes('xrp') || id.includes('ripple')) return { chain: 'XRP', isToken: false };

  return { chain: chainId.toUpperCase(), isToken: false };
}

/* =========================================
   GET USER WALLETS
   Fetches active wallets from DB, deduplicates
   by address+chain, calls edge function once per
   unique pair, maps native + token balances back.
========================================= */

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  // 1. Get all active wallets from DB
  const { data: dbWallets, error: dbError } = await supabase
    .from('user_wallets')
    .select('id, address, chain_id, is_active')
    .eq('user_id', userId)
    .eq('is_active', 'true');

  if (dbError || !dbWallets || dbWallets.length === 0) return [];

  // 2. Deduplicate: group by (address + resolved chain)
  const seen = new Map<string, { address: string; chain: string; walletIds: string[]; chainIds: string[] }>();
  const tokenWallets: { id: string; chainId: string; address: string; tokenSymbol: string; resolvedChain: string }[] = [];

  for (const w of dbWallets) {
    const resolved = resolveChain(w.chain_id);
    if (resolved.isToken) {
      tokenWallets.push({ id: w.id, chainId: w.chain_id, address: w.address, tokenSymbol: resolved.tokenSymbol!, resolvedChain: resolved.chain });
      const key = `${w.address}::${resolved.chain}`;
      if (!seen.has(key)) {
        seen.set(key, { address: w.address, chain: resolved.chain, walletIds: [], chainIds: [] });
      }
    } else {
      const key = `${w.address}::${resolved.chain}`;
      if (!seen.has(key)) {
        seen.set(key, { address: w.address, chain: resolved.chain, walletIds: [w.id], chainIds: [w.chain_id] });
      } else {
        seen.get(key)!.walletIds.push(w.id);
        seen.get(key)!.chainIds.push(w.chain_id);
      }
    }
  }

  // 3. Fetch balances from edge function for each unique chain+address
  const wallets: Wallet[] = [];
  const now = new Date().toISOString();

  const fetchPromises = Array.from(seen.entries()).map(async ([_key, entry]) => {
    try {
      const { data, error } = await supabase.functions.invoke('monitor-deposits', {
        body: { address: entry.address, chain: entry.chain },
      });

      if (error || !data?.success || !data?.native) return;

      // Add native balance wallet
      if (entry.walletIds.length > 0) {
        wallets.push({
          id: entry.walletIds[0],
          user_id: userId,
          crypto_symbol: data.native.symbol,
          balance: parseFloat(data.native.balance) || 0,
          locked_balance: 0,
          deposit_address: entry.address,
          chain_id: entry.chainIds[0],
          created_at: now,
          updated_at: now,
        });
      }

      // Match token wallets to the tokens array from the response
      const tokens: any[] = data.tokens || [];
      for (const tw of tokenWallets) {
        if (tw.address === entry.address && tw.resolvedChain === entry.chain) {
          const match = tokens.find((t: any) => t.symbol === tw.tokenSymbol);
          wallets.push({
            id: tw.id,
            user_id: userId,
            crypto_symbol: tw.tokenSymbol,
            balance: match ? parseFloat(match.balance) || 0 : 0,
            locked_balance: 0,
            deposit_address: tw.address,
            chain_id: tw.chainId,
            created_at: now,
            updated_at: now,
          });
        }
      }
    } catch (err) {
      console.error(`[getUserWallets] Exception for ${entry.chain}:`, err);
    }
  });

  await Promise.all(fetchPromises);
  return wallets;
}

/* =========================================
   REACT QUERY HOOK
========================================= */

export function useWalletBalances() {
  return useQuery({
    queryKey: ['wallet-balances'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return [];
      return getUserWallets(user.id);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/* =========================================
   OTHER HELPERS
========================================= */

export async function getWalletBalance(userId: string, cryptoSymbol: string): Promise<Wallet | null> {
  const wallets = await getUserWallets(userId);
  return wallets.find((w) => w.crypto_symbol === cryptoSymbol) || null;
}

export async function getWalletTransactions(userId: string, limit: number = 50): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as unknown as WalletTransaction[]) ?? [];
}

export async function getDepositAddress(userId: string, cryptoSymbol: string): Promise<string> {
  const wallets = await getUserWallets(userId);
  const wallet = wallets.find((w) => w.crypto_symbol === cryptoSymbol);
  if (wallet?.deposit_address) return wallet.deposit_address;
  throw new Error('No deposit address found for this wallet.');
}
