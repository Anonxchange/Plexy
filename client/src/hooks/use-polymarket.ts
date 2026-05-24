import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapPolymarketMarket } from '@/lib/mappers/polymarket';
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
  id:         string;
  label:      string;
  slug:       string;
  forceShow?: boolean;      // pinned to the top of the tag list
  forceHide?: boolean;      // suppressed from all UI surfaces
  isCarousel?: boolean;     // shown in the carousel on the homepage
}

export interface PolymarketCategory {
  id:              string;
  label:           string;
  slug:            string;
  parentCategory?: string;  // slug of the parent category (e.g. "sports" → "politics")
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
  volume24hr:     number;          // 24-hour rolling volume
  volume1wk:      number;
  volume1mo:      number;
  volume1yr:      number;
  liquidity:      string;
  liquidityNum:   number;
  endDate:        string;
  startDate:      string;
  tags:           PolymarketTag[];              // always objects per Gamma API schema
  bestBid:        number;
  bestAsk:        number;
  lastTradePrice: number;
  negRisk:        boolean;
  negRiskOther:   boolean;         // this market is the "other" leg of a neg-risk group
  minimumTickSize?: string;
  enableOrderBook?: boolean;
  acceptingOrders:  boolean;       // whether the order book is currently accepting orders
  // price movement
  oneDayPriceChange:   number;
  oneHourPriceChange:  number;
  oneWeekPriceChange:  number;
  oneMonthPriceChange: number;
  oneYearPriceChange:  number;
  // market quality
  spread:           number;        // current bid-ask spread
  competitive:      number;        // competitiveness score (0-1)
  curationOrder:    number;        // manual ordering hint
  // display hints
  wideFormat:       boolean;       // render in wide card layout
  // range / scalar markets
  lowerBound:       string;
  upperBound:       string;
  lowerBoundDate:   string;
  upperBoundDate:   string;
  // grouped / series markets
  groupItemTitle:    string;       // team/candidate name for grouped markets
  groupItemRange:    string;       // range label for grouped markets
  shortOutcomes:     string;       // JSON-encoded abbreviated outcome names
  // sports fields
  teamAID:           string;       // team A identifier
  teamBID:           string;       // team B identifier
  marketType:        string;       // e.g. "binary", "categorical"
  formatType:        string;       // display format hint
  sportsMarketType:  string;       // "moneyline" | "spread" | "totals"
  gameId:            string;       // game identifier
  gameStartTime:     string;       // ISO datetime when the game starts
  eventStartTime:    string;       // ISO datetime when the event starts
  line:              number;       // spread / totals line value
  seriesColor:       string;       // hex colour for team/series branding
  chartColor:        string;       // hex colour for probability chart
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
  featuredImage:    string;        // hero/banner image used on the event page
  active:           boolean;
  closed:           boolean;
  volume:           number;
  volume24hr:       number;
  volume1wk:        number;
  volume1mo:        number;
  volume1yr:        number;
  liquidity:        number;
  openInterest:     number;        // total open interest across all markets
  tags:             PolymarketTag[];
  categories:       PolymarketCategory[];  // e.g. Politics, Sports, Crypto
  markets:          PolymarketMarket[];
  // neg-risk
  enableNegRisk:    boolean;
  negRiskAugmented: boolean;
  negRisk:          boolean;       // event-level neg-risk flag
  negRiskMarketID:  string;        // ID of the companion neg-risk market
  negRiskFeeBips:   number;        // fee charged for neg-risk resolution (basis points)
  endDate:          string;
  startDate:        string;
  commentCount:     number;
  competitive:      number;        // competitiveness score (0-1)
  // sports live-game fields
  live:             boolean;       // game is currently in progress
  ended:            boolean;       // game has finished
  score:            string;        // live score string e.g. "3 - 1"
  elapsed:          string;        // time elapsed in game e.g. "72'"
  period:           string;        // current period / quarter / half
  gameStatus:       string;        // full status string from data provider
  eventDate:        string;        // date of the sporting event
  startTime:        string;        // ISO kickoff / tip-off time
  seriesSlug:       string;        // slug of the series this event belongs to
  spreadsMainLine:  number;        // primary spread line for this event
  totalsMainLine:   number;        // primary totals (over/under) line
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

function applyMarketMapper(ev: PolymarketEvent): PolymarketEvent {
  return { ...ev, markets: (ev.markets ?? []).map(mapPolymarketMarket) };
}

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
    queryFn:  async () => {
      const events = await gammaFetch<PolymarketEvent[]>('/events', {
        active:    params?.closed ? 'false' : 'true',
        closed:    String(params?.closed ?? false),
        limit:     params?.limit  ?? 20,
        offset:    params?.offset ?? 0,
        order:     params?.sort ?? 'volume_24hr',
        ascending: String(params?.ascending ?? false),
        ...(params?.tag_slug ? { tag_slug: params.tag_slug } : {}),
      });
      return events.map(applyMarketMapper);
    },
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
    queryFn:  async () => {
      const markets = await gammaFetch<PolymarketMarket[]>('/markets', {
        active:    'true',
        closed:    String(params?.closed ?? false),
        limit:     params?.limit  ?? 20,
        offset:    params?.offset ?? 0,
        order:     'volume_24hr',
        ascending: 'false',
        ...(params?.tag_slug ? { tag_slug: params.tag_slug } : {}),
      });
      return markets.map(mapPolymarketMarket);
    },
    staleTime: 30_000,
  });
}

// ─── Tags ─────────────────────────────────────────────────────────────────────
// forceShowOnHomepage=true (query param) filters to the curated category-level
// tags (Politics, Crypto, Sports…) and excludes event-specific sub-tags.
// The field on returned tag objects is "forceShow", not "forceShowOnHomepage".
export function useTags() {
  return useQuery({
    queryKey: ['polymarket', 'tags'],
    queryFn:  () => gammaFetch<PolymarketTag[]>('/tags', {
      limit:                100,
      forceShowOnHomepage:  true,
    }),
    staleTime: 5 * 60_000,
  });
}

// ─── Comments (real Polymarket comments, entity type must be "Event") ─────────
export interface PolymarketComment {
  id:               string;
  body:             string;
  parentEntityType: string;
  parentEntityID:   number;
  parentCommentID?: string;
  userAddress:      string;
  createdAt:        string;
  updatedAt:        string;
  reactionCount:    number;
  reportCount:      number;
  profile?: {
    name:                  string;
    pseudonym:             string;
    displayUsernamePublic: boolean;
    bio?:                  string;
    proxyWallet:           string;
    baseAddress:           string;
    profileImage?:         string;
  };
}

export function useComments(eventId: string | undefined, offset = 0, limit = 30) {
  return useQuery({
    queryKey: ['polymarket', 'comments', eventId, offset, limit],
    queryFn:  () => gammaFetch<PolymarketComment[]>('/comments', {
      parent_entity_id:   eventId!,
      parent_entity_type: 'Event',
      limit:              String(limit),
      offset:             String(offset),
    }),
    enabled:   !!eventId,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

// ─── Event detail (fetches full event by numeric ID, includes all markets) ────
export function useEventDetail(eventId: string | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'event', eventId],
    queryFn:  async () => {
      const ev = await gammaFetch<PolymarketEvent>(`/events/${eventId}`);
      if (!ev || !ev.markets) throw new Error('Event not found');
      return applyMarketMapper(ev);
    },
    enabled:  !!eventId,
    staleTime: 30_000,
  });
}

// ─── Market detail ─────────────────────────────────────────────────────────────
// Gamma API supports /markets/:numericId directly.
export function useMarketDetail(marketId: string | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'market', marketId],
    queryFn:  async () => {
      const market = await gammaFetch<PolymarketMarket>(`/markets/${marketId}`);
      if (!market) throw new Error('Market not found');
      return mapPolymarketMarket(market);
    },
    enabled:  !!marketId,
    staleTime: 30_000,
  });
}

// ─── Orderbook (live, polled) ─────────────────────────────────────────────────
export interface OrderbookLevel {
  price: string;
  size:  string;
}
export interface PolymarketOrderbook {
  market:    string;
  asset_id:  string;
  bids:      OrderbookLevel[];
  asks:      OrderbookLevel[];
  timestamp: string;
  hash:      string;
}
export function useOrderbook(tokenId: string | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'orderbook', tokenId],
    queryFn:  () => clobFetch<PolymarketOrderbook>('/book', { token_id: tokenId }),
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
