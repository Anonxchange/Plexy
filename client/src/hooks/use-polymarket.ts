import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  getPolymarketWalletInfo,
  getPolymarketTradeHistory,
  approveUsdcToPolymarket,
  revokeUsdcFromPolymarket,
} from '@/lib/polymarket-clob';

// ─── API base URLs ─────────────────────────────────────────────────────────────
// Public endpoints (open CORS, no auth required) → called directly from the
// browser. Never proxy public data through a backend — it adds latency and
// a single point of failure with zero security benefit.
const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API  = 'https://clob.polymarket.com';

// ─── Authenticated actions ONLY go through the Supabase edge function ─────────
// Authenticated endpoints (postOrder, cancelOrder, getOpenOrders) require
// L2 HMAC signing using server-side secrets. They must NEVER be called
// directly from the browser where credentials would be exposed.
async function polymarketAuthRequest(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('polymarket', {
    body: { action, params },
  });
  if (error) throw new Error(error.message);
  return data;
}

// ─── Gamma API fetch helper ───────────────────────────────────────────────────
async function gammaFetch<T>(
  path:   string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(`${GAMMA_API}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      'Accept':          'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer':         'https://polymarket.com/',
    },
  });
  if (!res.ok) throw new Error(`Polymarket API error ${res.status}: ${url.pathname}`);
  return res.json() as Promise<T>;
}

// ─── CLOB API fetch helper ────────────────────────────────────────────────────
async function clobFetch<T>(
  path:   string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(`${CLOB_API}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`CLOB API error ${res.status}: ${url.pathname}`);
  return res.json() as Promise<T>;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PolymarketTag {
  id:    string;
  label: string;
  slug:  string;
  forceShowOnHomepage?: boolean;
}

export interface PolymarketMarket {
  id:             string;
  question:       string;
  description:    string;
  conditionId:    string;
  slug:           string;
  image:          string;
  icon:           string;
  active:         boolean;
  closed:         boolean;
  archived:       boolean;
  clobTokenIds:   string;          // JSON-encoded string[]
  outcomePrices:  string;          // JSON-encoded string[]
  outcomes:       string;          // JSON-encoded string[]
  volume:         string;
  volumeNum:      number;
  liquidity:      string;
  liquidityNum:   number;
  endDate:        string;
  startDate:      string;
  tags:           Array<string | PolymarketTag>;
  bestBid:        number;
  bestAsk:        number;
  lastTradePrice: number;
  negRisk:        boolean;
  minimumTickSize?: string;
  enableOrderBook?: boolean;
}

// An Event groups one or more related markets under a shared headline.
// Polymarket's primary listing unit is the event, not the market.
export interface PolymarketEvent {
  id:               string;
  title:            string;
  description:      string;
  slug:             string;
  image:            string;
  icon:             string;
  active:           boolean;
  closed:           boolean;
  volume:           number;
  volume24hr:       number;
  liquidity:        number;
  tags:             PolymarketTag[];
  markets:          PolymarketMarket[];
  enableNegRisk:    boolean;
  negRiskAugmented: boolean;
  endDate:          string;
  startDate:        string;
}

export interface PricePoint {
  t: number;
  p: number;
}

// ─── Geoblock check ───────────────────────────────────────────────────────────
// Polymarket blocks US, UK, France, Germany, Australia, and other regions.
// Check before showing the trading UI to avoid confusing silent failures.
export function useGeoblock() {
  return useQuery({
    queryKey: ['polymarket', 'geoblock'],
    queryFn: async () => {
      try {
        const res = await fetch('https://polymarket.com/api/geoblock', {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return { blocked: false };
        return res.json() as Promise<{ blocked: boolean; country?: string }>;
      } catch {
        // If the check fails, don't block the UI — fail open for read access
        return { blocked: false };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry:     1,
  });
}

// ─── Events (primary listing feed) ────────────────────────────────────────────
// Fetches events from Gamma API directly. Each event contains nested markets[].
// The tag_slug parameter is the correct way to filter by category
// (NOT "tag=" which the Gamma API silently ignores).
const INTERVAL_API: Record<string, string> = {
  '1H': 'max', '6H': 'max', '1D': '1d', '1W': '1w', '1M': '1m',
};
const FIDELITY_API: Record<string, number> = {
  '1H': 1, '6H': 5, '1D': 60, '1W': 60, '1M': 1440,
};

export function useEvents(params?: {
  limit?:     number;
  offset?:    number;
  tag_slug?:  string;
  closed?:    boolean;
  sort?:      string;
  ascending?: boolean;
}) {
  return useQuery({
    queryKey: ['polymarket', 'events', params],
    queryFn:  () => gammaFetch<PolymarketEvent[]>('/events', {
      active:    'true',
      closed:    String(params?.closed ?? false),
      limit:     params?.limit  ?? 20,
      offset:    params?.offset ?? 0,
      order:     params?.sort ?? 'volume_24hr',
      ascending: String(params?.ascending ?? false),
      ...(params?.tag_slug ? { tag_slug: params.tag_slug } : {}),
    }),
    staleTime: 30_000,
  });
}

// ─── Markets (flat list, used for listings when events aren't needed) ──────────
export function useMarkets(params?: {
  limit?:    number;
  offset?:   number;
  tag_slug?: string;
  closed?:   boolean;
}) {
  return useQuery({
    queryKey: ['polymarket', 'markets', params],
    queryFn:  () => gammaFetch<PolymarketMarket[]>('/markets', {
      active:    'true',
      closed:    String(params?.closed ?? false),
      limit:     params?.limit  ?? 20,
      offset:    params?.offset ?? 0,
      order:     'volume_24hr',
      ascending: 'false',
      ...(params?.tag_slug ? { tag_slug: params.tag_slug } : {}),
    }),
    staleTime: 30_000,
  });
}

// ─── Tags ─────────────────────────────────────────────────────────────────────
// forceShowOnHomepage=true returns only the curated category-level tags
// (Politics, Crypto, Sports…) and excludes event-specific tags.
export function useTags() {
  return useQuery({
    queryKey: ['polymarket', 'tags'],
    queryFn:  () => gammaFetch<PolymarketTag[]>('/tags', { limit: 100 }),
    staleTime: 5 * 60_000,
  });
}

// ─── Market detail ─────────────────────────────────────────────────────────────
export function useMarketDetail(conditionId: string | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'market', conditionId],
    queryFn:  () => gammaFetch<PolymarketMarket>(`/markets/${conditionId}`),
    enabled:  !!conditionId,
    staleTime: 30_000,
  });
}

// ─── Orderbook (live, polled) ─────────────────────────────────────────────────
export function useOrderbook(tokenId: string | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'orderbook', tokenId],
    queryFn:  () => clobFetch<unknown>('/book', { token_id: tokenId }),
    enabled:  !!tokenId,
    refetchInterval: 10_000,
  });
}

// ─── Price history ────────────────────────────────────────────────────────────
export function usePriceHistory(tokenId: string | undefined, interval: string) {
  return useQuery({
    queryKey: ['polymarket', 'priceHistory', tokenId, interval],
    queryFn:  () => clobFetch<{ history: PricePoint[] }>('/prices-history', {
      market:   tokenId,
      interval: INTERVAL_API[interval] ?? '1d',
      fidelity: FIDELITY_API[interval] ?? 60,
    }),
    enabled:  !!tokenId,
    staleTime: 60_000,
  });
}

// ─── Open orders — authenticated, server-side HMAC ────────────────────────────
export function useOpenOrders() {
  return useQuery({
    queryKey: ['polymarket', 'openOrders'],
    queryFn:  () => polymarketAuthRequest('getOpenOrders'),
    refetchInterval: 15_000,
    retry:    false,
  });
}

// ─── Place order — authenticated, server-side HMAC ───────────────────────────
// Security: order payload goes to the Supabase edge function which signs
// it with L2 HMAC credentials stored in Supabase secrets — never in
// the browser. Note: full EIP-712 signing requires the edge function
// to be updated with a proper order-signing implementation.
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: Record<string, unknown>) =>
      polymarketAuthRequest('postOrder', { order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'openOrders'] });
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'walletInfo'] });
    },
  });
}

// ─── Cancel order — authenticated, server-side HMAC ──────────────────────────
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      polymarketAuthRequest('cancelOrder', { orderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'openOrders'] });
    },
  });
}

// ─── Wallet info ──────────────────────────────────────────────────────────────
export function usePolymarketWalletInfo(address: string | null | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'walletInfo', address],
    queryFn:  () => getPolymarketWalletInfo(address!),
    enabled:  !!address,
    staleTime:      30_000,
    refetchInterval: 60_000,
  });
}

// ─── Trade history ─────────────────────────────────────────────────────────────
export function usePolymarketTradeHistory(address: string | null | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'tradeHistory', address],
    queryFn:  () => getPolymarketTradeHistory(address!, 50),
    enabled:  !!address,
    staleTime: 60_000,
    retry:     1,
  });
}

// ─── Approve pUSD to CTF Exchange ─────────────────────────────────────────────
export function usePolymarketApprove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mnemonic, amount }: { mnemonic: string; amount: string }) =>
      approveUsdcToPolymarket(mnemonic, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'walletInfo'] });
    },
  });
}

// ─── Revoke pUSD approval ─────────────────────────────────────────────────────
export function usePolymarketRevoke() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mnemonic }: { mnemonic: string }) =>
      revokeUsdcFromPolymarket(mnemonic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'walletInfo'] });
    },
  });
}
