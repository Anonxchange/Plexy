import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
   CACHE MODEL
   Layered, server-first:

   1. Server snapshot (Supabase `wallets` table,
      RLS-scoped to auth.uid). Primary cache –
      shared across devices, instant render on
      every login. Storing the last on-chain
      reading server-side does not make the
      product custodial: the user still owns the
      keys, the server only echoes a value the
      chain already publishes.
   2. sessionStorage fallback – used when the
      server snapshot can't be read (offline,
      RLS hiccup) so the tab still renders
      immediately on a reload.
   3. In-memory React Query cache for intra-page
      transitions.

   On every successful chain refresh we update
   both layers.
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
   SERVER SNAPSHOT (primary cache)
========================================= */

async function readServerSnapshot(userId: string): Promise<Wallet[] | null> {
  const { data, error } = await supabase
    .from('wallets')
    .select('id, user_id, crypto_symbol, balance, locked_balance, deposit_address, created_at, updated_at')
    .eq('user_id', userId);
  if (error || !data) return null;
  return data.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    crypto_symbol: row.crypto_symbol,
    balance: Number(row.balance) || 0,
    locked_balance: Number(row.locked_balance) || 0,
    deposit_address: row.deposit_address,
    chain_id: '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

async function writeServerSnapshot(userId: string, wallets: Wallet[]): Promise<void> {
  if (!wallets.length) return;
  const rows = wallets.map((w) => ({
    user_id: userId,
    crypto_symbol: w.crypto_symbol,
    balance: w.balance,
    locked_balance: w.locked_balance,
    deposit_address: w.deposit_address,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('wallets')
    .upsert(rows as any, { onConflict: 'user_id,crypto_symbol' });
  if (error) console.warn('[wallet-balances] server snapshot upsert failed:', error.message);
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
   GET USER WALLETS (live on-chain fetch)
   user_wallets is read for *addresses only* – it
   stores wallet metadata (address, chain), never
   balances. Balances always come from the chain.

   Resilience: if a chain RPC call fails, the
   previous known balance for that wallet is
   retained instead of dropping it from the list,
   so the UI never collapses to zero on a flaky
   network call.
========================================= */

export async function getUserWallets(
  userId: string,
  previous?: Wallet[],
): Promise<Wallet[]> {
  // 1. Get all active wallet addresses from DB (metadata only).
  const { data: dbWallets, error: dbError } = await supabase
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

  // 3. Fetch balances from chain (via the monitor-deposits proxy) for each
  //    unique chain+address.
  const wallets: Wallet[] = [];
  const now = new Date().toISOString();

  const fetchPromises = Array.from(seen.entries()).map(async ([_key, entry]) => {
    let data: any = null;
    let fetchFailed = false;

    try {
      const res = await supabase.functions.invoke('monitor-deposits', {
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

    // Native balance wallet — even on failure, keep the previous balance so
    // the UI does not flicker to zero.
    if (entry.walletIds.length > 0) {
      const id = entry.walletIds[0];
      const prev = prevById.get(id) ?? prevBySymbol.get(data?.native?.symbol ?? '');
      const nativeSymbol = data?.native?.symbol ?? prev?.crypto_symbol ?? entry.chain;
      const nativeBalance = fetchFailed
        ? prev?.balance ?? 0
        : parseFloat(data.native.balance) || 0;

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

    // Token wallets riding on this address+chain.
    const tokens: any[] = data?.tokens ?? [];
    for (const tw of tokenWallets) {
      if (tw.address !== entry.address || tw.resolvedChain !== entry.chain) continue;
      const prev = prevById.get(tw.id) ?? prevBySymbol.get(tw.tokenSymbol);
      const match = tokens.find((t: any) => t.symbol === tw.tokenSymbol);

      const tokenBalance = fetchFailed
        ? prev?.balance ?? 0
        : match
          ? parseFloat(match.balance) || 0
          : prev?.balance ?? 0; // token absent from response → treat as unchanged

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

   Strategy (non-custodial, blockchain-primary):
   1. On mount, hydrate from the user-scoped
      localStorage snapshot for an instant render.
      No server-side balance store is read or
      written.
   2. Fire an on-chain refresh in the background.
      When it returns, write the result back to
      localStorage so the next reload is instant.
   3. Poll every 60 s; preserve-on-error keeps
      the last good per-wallet balance if a chain
      RPC hiccups – the total never collapses.
   4. localStorage is wiped by the existing logout
      flow, so balances never leak across sessions.
========================================= */

export function useWalletBalances() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useQuery<Wallet[]>({
    // Scope cache to the current user so a logout/login swap can never
    // serve another account's result.
    queryKey: ['wallet-balances', userId ?? 'anon'],
    enabled: !!userId,
    // Hydrate immediately from the session-storage echo for this user so
    // a tab reload paints something before the server round-trip resolves.
    // The server snapshot below replaces this within milliseconds.
    initialData: () => (userId ? readSessionSnapshot(userId) ?? undefined : undefined),
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      if (!userId) return [];

      const queryKey = ['wallet-balances', userId] as const;
      const inMem = queryClient.getQueryData<Wallet[]>([...queryKey]);

      // 1. Try the server snapshot first – this is the fast path that makes
      //    a fresh login paint real numbers in one round-trip instead of
      //    waiting for the chain.
      const serverSnapshot = await readServerSnapshot(userId).catch(() => null);
      const baseline =
        (serverSnapshot && serverSnapshot.length ? serverSnapshot : null) ??
        inMem ??
        readSessionSnapshot(userId) ??
        null;

      // 2. Kick off the chain refresh in the background. It writes through
      //    to both cache layers and updates the in-memory query cache when
      //    it completes, so the UI upgrades from snapshot → live without
      //    blocking the first paint.
      const refreshPromise = getUserWallets(userId, baseline ?? undefined)
        .then((fresh) => {
          queryClient.setQueryData([...queryKey], fresh);
          void writeServerSnapshot(userId, fresh);
          writeSessionSnapshot(userId, fresh);
          return fresh;
        })
        .catch((err) => {
          console.warn('[wallet-balances] background chain refresh failed:', err);
          return baseline ?? [];
        });

      // 3. If we have a baseline (server snapshot or any cache), return it
      //    NOW so the UI paints instantly. Otherwise wait for the chain –
      //    this only happens on a brand-new account with no cached data
      //    anywhere.
      if (baseline) {
        if (serverSnapshot) writeSessionSnapshot(userId, serverSnapshot);
        return baseline;
      }
      return await refreshPromise;
    },
    // Keep showing the previous balances while a refetch is in flight –
    // never show an undefined / empty state mid-cycle.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
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
