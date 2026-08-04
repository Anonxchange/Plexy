import { useEffect } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { resolveWalletChain } from '@/lib/wallet-chain-monitor';

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
   PUSH REFRESH EVENT (replaces polling)

   Alchemy's Address Activity webhook is the
   trigger for a balance refresh. Whatever
   receives that push (realtime channel, SSE,
   deposit modal, manual "Refresh" button)
   dispatches this event and the hook re-reads
   the chain exactly once. No interval timer,
   so idle tabs consume zero compute units.

   BTC (Tatum + public Esplora fallback) and XRP
   (public rippled nodes) have no Alchemy Notify
   push, so they are refreshed by the same manual
   / focus / reconnect signals — still no polling.
========================================= */

export const WALLET_REFRESH_EVENT = 'pexly:wallet-refresh';

export function requestWalletRefresh(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(WALLET_REFRESH_EVENT));
}

/* =========================================
   CHAIN RESOLVER
   Maps DB chain_id values to edge function chain keys.

   `supported` means "monitor-deposits can read this
   chain". BTC is served by Tatum with public Esplora
   fallbacks, XRP by public rippled nodes, everything
   else by Alchemy — so both are supported now.
   Unsupported chains are skipped instead of firing a
   request that is guaranteed to 400.
========================================= */

/** Native symbol fallback when the edge function response is unusable. */
const NATIVE_SYMBOL: Record<string, string> = {
  BTC: 'BTC',
  XRP: 'XRP',
  ETH: 'ETH',
  BSC: 'BNB',
  POLYGON: 'POL',
  ARBITRUM: 'ETH',
  OPTIMISM: 'ETH',
  BASE: 'ETH',
  AVAX: 'AVAX',
  SOL: 'SOL',
  TRX: 'TRX',
};

/** Chains that never carry tokens in this app — skip token matching entirely. */
const TOKENLESS_CHAINS = new Set(['BTC', 'XRP']);

/** Safe numeric parse: the edge function returns decimal strings, never floats. */
function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

/* =========================================
   GET USER WALLETS (non-custodial, chain-first)

   Reads wallet *addresses* from user_wallets
   (metadata only — never balances). Fetches live
   balances directly from each chain via the
   monitor-deposits edge function in `balances`
   mode, which returns:
     { success, chain, address,
       native: { symbol, balance, decimals },
       tokens: [{ symbol, balance, contract, decimals }],
       reserve?, accountFunded?, unconfirmed?, provider? }

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
    .eq('is_active', true);

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

  const wallets: Wallet[] = [];
  const now = new Date().toISOString();

  /** Rebuild a wallet row from the last known snapshot (unsupported / failed chain). */
  const carryOver = (id: string, symbol: string, address: string | null, chainId: string): Wallet => {
    const prev = prevById.get(id) ?? prevBySymbol.get(symbol);
    return {
      id,
      user_id: userId,
      crypto_symbol: prev?.crypto_symbol ?? symbol,
      balance: prev?.balance ?? 0,
      locked_balance: prev?.locked_balance ?? 0,
      deposit_address: address ?? prev?.deposit_address ?? null,
      chain_id: chainId,
      created_at: prev?.created_at ?? now,
      updated_at: prev?.updated_at ?? now,
    };
  };

  const seen = new Map<string, { address: string; chain: string; walletIds: string[]; chainIds: string[] }>();
  const tokenWallets: { id: string; chainId: string; address: string; tokenSymbol: string; resolvedChain: string }[] = [];

  for (const w of dbWallets) {
    const resolved = resolveWalletChain(w.chain_id);
    const address = String(w.address ?? '').trim();

    // A row with no usable address can never be read on-chain.
    if (!resolved.supported || !address) {
      wallets.push(
        carryOver(
          w.id,
          resolved.tokenSymbol ?? NATIVE_SYMBOL[resolved.chain] ?? resolved.chain,
          address || null,
          w.chain_id,
        ),
      );
      continue;
    }

    // BTC/XRP have no token layer — a "USDT on Bitcoin" row is a data error,
    // and asking the indexer for it would waste a request.
    if (resolved.isToken && TOKENLESS_CHAINS.has(resolved.chain)) {
      wallets.push(carryOver(w.id, resolved.tokenSymbol!, address, w.chain_id));
      continue;
    }

    const key = `${address}::${resolved.chain}`;

    if (resolved.isToken) {
      tokenWallets.push({ id: w.id, chainId: w.chain_id, address, tokenSymbol: resolved.tokenSymbol!, resolvedChain: resolved.chain });
      if (!seen.has(key)) {
        seen.set(key, { address, chain: resolved.chain, walletIds: [], chainIds: [] });
      }
    } else {
      if (!seen.has(key)) {
        seen.set(key, { address, chain: resolved.chain, walletIds: [w.id], chainIds: [w.chain_id] });
      } else {
        seen.get(key)!.walletIds.push(w.id);
        seen.get(key)!.chainIds.push(w.chain_id);
      }
    }
  }

  // One request per (address, chain) pair — a native wallet and its USDT/USDC
  // siblings on the same address share a single call.
  const fetchPromises = Array.from(seen.entries()).map(async ([_key, entry]) => {
    let data: any = null;
    let fetchFailed = false;

    try {
      const res = await client.functions.invoke('monitor-deposits', {
        body: { address: entry.address, chain: entry.chain, mode: 'balances' },
      });
      if (res.error || !res.data?.success || !res.data?.native) {
        console.warn('[getUserWallets] balance read failed:', entry.chain, res.error ?? res.data?.error);
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
      const nativeSymbol = data?.native?.symbol ?? prev?.crypto_symbol ?? NATIVE_SYMBOL[entry.chain] ?? entry.chain;
      const nativeBalance = fetchFailed ? prev?.balance ?? 0 : toNumber(data.native.balance);

      // XRP keeps a base reserve that cannot be spent — surface it as locked
      // rather than pretending the full balance is withdrawable. An unfunded
      // (never-deposited) XRP account has no reserve to lock yet.
      let lockedBalance = prev?.locked_balance ?? 0;
      if (!fetchFailed && entry.chain === 'XRP') {
        lockedBalance = data?.accountFunded === false ? 0 : Math.min(toNumber(data?.reserve, 10), nativeBalance);
      }

      wallets.push({
        id,
        user_id: userId,
        crypto_symbol: nativeSymbol,
        balance: nativeBalance,
        locked_balance: lockedBalance,
        deposit_address: entry.address,
        chain_id: entry.chainIds[0],
        created_at: prev?.created_at ?? now,
        updated_at: fetchFailed ? prev?.updated_at ?? now : now,
      });
    }

    const tokens: any[] = Array.isArray(data?.tokens) ? data.tokens : [];
    for (const tw of tokenWallets) {
      if (tw.address !== entry.address || tw.resolvedChain !== entry.chain) continue;
      const prev = prevById.get(tw.id) ?? prevBySymbol.get(tw.tokenSymbol);
      const match = tokens.find(
        (t: any) => String(t.symbol).toUpperCase() === tw.tokenSymbol.toUpperCase(),
      );
      // A successful read with no matching token means the balance really is 0
      // (zero balances are omitted upstream) — only a *failed* read falls back to prev.
      const tokenBalance = fetchFailed
        ? prev?.balance ?? 0
        : match
          ? toNumber(match.balance)
          : 0;

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

   Chain-first, fully non-custodial, POLL-FREE:
   1. Hydrate instantly from sessionStorage so
      the UI paints on reload with no flicker.
   2. Fetch live balances from the chain once on
      mount, then only on a real signal:
        • the Alchemy webhook push, relayed as
          WALLET_REFRESH_EVENT
        • window focus / network reconnect
        • an explicit refetch()
      There is no refetchInterval, so an open tab
      costs nothing while nothing is happening.
      BTC (Tatum) and XRP (public rippled) ride the
      same signals — no interval, no quota burn.
   3. sessionStorage is wiped at logout so
      balances never leak across sessions.
========================================= */

export function useWalletBalances() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Keep the in-memory query key in sync with the cache key used below
  // so any invalidation from elsewhere correctly targets the right entry.
  const queryKey = ['wallet-balances', userId ?? 'anon'] as const;

  // Push-driven refresh: this is what replaces the old 90 s interval.
  // Dispatch WALLET_REFRESH_EVENT from wherever the Alchemy webhook lands.
  useEffect(() => {
    if (!userId) return;
    if (typeof window === 'undefined') return;

    const onRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balances', userId] });
    };

    window.addEventListener(WALLET_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(WALLET_REFRESH_EVENT, onRefresh);
  }, [userId, queryClient]);

  return useQuery<Wallet[]>({
    queryKey,
    enabled: !!userId,
    // Hydrate immediately from the client-side session cache so the
    // first render shows real numbers without waiting for the chain.
    // updatedAt 0 marks it stale, so a live read still runs on mount.
    initialData: () => (userId ? readSessionSnapshot(userId) ?? undefined : undefined),
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      if (!userId) return [];

      const inMem = queryClient.getQueryData<Wallet[]>([...queryKey]);
      const cached = inMem ?? readSessionSnapshot(userId) ?? undefined;

      // Fetch live balances from the chain (non-custodial, no server balance store).
      // Awaited: returning early with stale data made the query settle before the
      // real numbers arrived, so a failed chain read looked like a successful one.
      const fresh = await getUserWallets(userId, cached).catch((err) => {
        console.warn('[wallet-balances] chain refresh failed:', err);
        return cached ?? [];
      });

      writeSessionSnapshot(userId, fresh);
      return fresh;
    },
    // Cached rows stay on screen while the live read is in flight.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchInterval: false,
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
