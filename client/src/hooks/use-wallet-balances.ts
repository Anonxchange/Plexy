import { useEffect } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

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
  type: 'deposit' | 'withdrawal' | 'swap';
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
   SESSION STORAGE CACHE
   Client-side only — never touches a server.
   Gives instant render on tab reload while the
   chain fetch is in flight.
========================================= */

const CACHE_KEY_PREFIX = 'pexly_wallet_balances_v3';

function cacheKey(userId: string) {
  return `${CACHE_KEY_PREFIX}_${userId}`;
}

function readSessionSnapshot(userId: string): Wallet[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as Wallet[];
  } catch {
    return null;
  }
}

function writeSessionSnapshot(userId: string, wallets: Wallet[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(cacheKey(userId), JSON.stringify(wallets));
  } catch {
    // Quota exceeded or storage disabled – non-fatal.
  }
}

/* =========================================
   CHAIN RESOLVER
   Maps DB chain_id values to edge function chain keys
========================================= */

function resolveChain(chainId: string): { chain: string; isToken: boolean; tokenSymbol?: string } {
  const id = chainId.toLowerCase();

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
   GET USER WALLETS (non-custodial, chain-first)

   Reads wallet *addresses* from user_wallets
   (metadata only — never balances). Fetches live
   balances directly from each chain via the
   monitor-deposits edge function.

   Resilience: if a chain RPC call fails, the
   previous known balance is kept so the UI never
   collapses to zero on a flaky network call.
========================================= */

export async function getUserWallets(
  userId: string,
  previous?: Wallet[],
): Promise<Wallet[]> {
  const client = await getSupabase();

  const { data: dbWallets, error: dbError } = await client
    .from('user_wallets')
    .select('id, address, chain_id, is_active')
    .eq('user_id', userId)
    .eq('is_active', 'true');

  if (dbError) {
    if (previous && previous.length) return previous;
    return [];
  }
  if (!dbWallets || dbWallets.length === 0) return [];

  const prevById = new Map<string, Wallet>();
  const prevBySymbol = new Map<string, Wallet>();
  (previous ?? []).forEach((w) => {
    if (w.id) prevById.set(w.id, w);
    prevBySymbol.set(w.crypto_symbol, w);
  });

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

  const wallets: Wallet[] = [];
  const now = new Date().toISOString();

  const fetchPromises = Array.from(seen.entries()).map(async ([_key, entry]) => {
    let data: any = null;
    let fetchFailed = false;

    try {
      const res = await client.functions.invoke('monitor-deposits', {
        body: { address: entry.address, chain: entry.chain },
      });
      if (res.error || !res.data?.success || !res.data?.native) {
        fetchFailed = true;
      } else {
        data = res.data;
      }
    } catch (err) {
      console.error('[getUserWallets] Exception for chain:', entry.chain, err);
      fetchFailed = true;
    }

    if (entry.walletIds.length > 0) {
      const id = entry.walletIds[0];
      const prev = prevById.get(id) ?? prevBySymbol.get(data?.native?.symbol ?? '');
      const nativeSymbol = data?.native?.symbol ?? prev?.crypto_symbol ?? entry.chain;
      const nativeBalance = fetchFailed ? prev?.balance ?? 0 : parseFloat(data.native.balance) || 0;

      wallets.push({
        id,
        user_id: userId,
        crypto_symbol: nativeSymbol,
        balance: nativeBalance,
        locked_balance: prev?.locked_balance ?? 0,
        deposit_address: entry.address,
        chain_id: entry.chainIds[0],
        created_at: prev?.created_at ?? now,
        updated_at: fetchFailed ? prev?.updated_at ?? now : now,
      });
    }

    const tokens: any[] = data?.tokens ?? [];
    for (const tw of tokenWallets) {
      if (tw.address !== entry.address || tw.resolvedChain !== entry.chain) continue;
      const prev = prevById.get(tw.id) ?? prevBySymbol.get(tw.tokenSymbol);
      const match = tokens.find((t: any) => t.symbol === tw.tokenSymbol);
      const tokenBalance = fetchFailed
        ? prev?.balance ?? 0
        : match
          ? parseFloat(match.balance) || 0
          : prev?.balance ?? 0;

      wallets.push({
        id: tw.id,
        user_id: userId,
        crypto_symbol: tw.tokenSymbol,
        balance: tokenBalance,
        locked_balance: prev?.locked_balance ?? 0,
        deposit_address: tw.address,
        chain_id: tw.chainId,
        created_at: prev?.created_at ?? now,
        updated_at: fetchFailed ? prev?.updated_at ?? now : now,
      });
    }
  });

  await Promise.all(fetchPromises);
  return wallets;
}

/* =========================================
   REACT QUERY HOOK

   Chain-first, fully non-custodial:
   1. Hydrate instantly from sessionStorage so
      the UI paints on reload with no flicker.
   2. Fetch live balances from the chain in the
      background and write the result back to
      sessionStorage for the next reload.
   3. Poll every 90 s as a safety net; window
      focus and reconnect trigger a refetch too.
   4. sessionStorage is wiped at logout so
      balances never leak across sessions.
========================================= */

export function useWalletBalances() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Keep the in-memory query key in sync with the cache key used below
  // so any invalidation from elsewhere correctly targets the right entry.
  const queryKey = ['wallet-balances', userId ?? 'anon'] as const;

  // Invalidate on window focus / reconnect is handled by React Query options
  // below — no manual useEffect needed for that.
  useEffect(() => {
    if (!userId) return;
    // Nothing to set up; cleanup clears the session cache on unmount
    // only if the user has logged out (handled by the logout flow).
  }, [userId]);

  return useQuery<Wallet[]>({
    queryKey,
    enabled: !!userId,
    // Hydrate immediately from the client-side session cache so the
    // first render shows real numbers without waiting for the chain.
    initialData: () => (userId ? readSessionSnapshot(userId) ?? undefined : undefined),
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      if (!userId) return [];

      const inMem = queryClient.getQueryData<Wallet[]>([...queryKey]);
      const cached = inMem ?? readSessionSnapshot(userId) ?? undefined;

      // Fetch live balances from the chain (non-custodial, no server balance store).
      const freshPromise = getUserWallets(userId, cached)
        .then((fresh) => {
          // Push fresh data into both the React Query cache and sessionStorage
          // so the UI updates even when we returned early with cached data.
          queryClient.setQueryData([...queryKey], fresh);
          writeSessionSnapshot(userId, fresh);
          return fresh;
        })
        .catch((err) => {
          console.warn('[wallet-balances] chain refresh failed:', err);
          return cached ?? [];
        });

      // If we already have something cached, return it immediately so the UI
      // paints instantly. The freshPromise above will push the live result
      // into the cache once the chain responds.
      if (cached) return cached;
      return await freshPromise;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchInterval: 90_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });
}

/* =========================================
   HELPERS
========================================= */

export async function getWalletBalance(userId: string, cryptoSymbol: string): Promise<Wallet | null> {
  const wallets = await getUserWallets(userId);
  return wallets.find((w) => w.crypto_symbol === cryptoSymbol) || null;
}

export async function getDepositAddress(userId: string, cryptoSymbol: string): Promise<string> {
  const wallets = await getUserWallets(userId);
  const wallet = wallets.find((w) => w.crypto_symbol === cryptoSymbol);
  if (wallet?.deposit_address) return wallet.deposit_address;
  throw new Error('No deposit address found for this wallet.');
}
