import { useHead } from "@unhead/react";
import { useEvents, useGeoblock, useTags, PolymarketMarket } from "@/hooks/use-polymarket";
import { PolymarketImage } from "@/components/polymarket-image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, Search, ArrowUpRight, Flame, BarChart2,
  ChevronDown, AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

// ─── Pinned entries that always appear before the live API tags ───────────────
// These have no Polymarket tag_slug — they use the default volume_24hr sort.
const PINNED: { key: string; icon?: React.ReactNode }[] = [
  { key: "Trending", icon: <Flame className="w-3.5 h-3.5" /> },
];

// Tags that Polymarket returns but are not useful as UI filter pills
const HIDDEN_TAG_SLUGS = new Set(["all", "test", "demo", "other"]);

// Labels the API sometimes returns with poor capitalisation — override them
const LABEL_OVERRIDES: Record<string, string> = {
  "crypto":       "Crypto",
  "politics":     "Politics",
  "sports":       "Sports",
  "finance":      "Finance",
  "geopolitics":  "Geopolitics",
  "technology":   "Tech",
  "economics":    "Economy",
  "culture":      "Culture",
  "entertainment":"Entertainment",
  "science":      "Science",
};

// ─── Outcome parsing helpers ──────────────────────────────────────────────────
// Parse outcomes and prices from a market's JSON-encoded string fields.
// Returns an array of { name, price } pairs, never hardcoded "Yes"/"No".
function parseOutcomes(market: PolymarketMarket): { name: string; price: number }[] {
  try {
    const names  = JSON.parse(market.outcomes      || "[]") as string[];
    const prices = JSON.parse(market.outcomePrices || "[]") as string[];
    if (!names.length) return [];
    return names.map((name, i) => ({
      name,
      price: parseFloat(prices[i] ?? "0") || 0,
    }));
  } catch {
    return [];
  }
}

// For a binary Yes/No market, return [yes, no] always in that order.
function binaryChances(outcomes: { name: string; price: number }[]): {
  yes: { name: string; pct: number };
  no:  { name: string; pct: number };
} | null {
  if (outcomes.length !== 2) return null;
  const yesIdx = outcomes.findIndex(o => o.name.toLowerCase() === "yes");
  const noIdx  = outcomes.findIndex(o => o.name.toLowerCase() === "no");
  if (yesIdx === -1 || noIdx === -1) return null;
  return {
    yes: { name: outcomes[yesIdx].name, pct: Math.round(outcomes[yesIdx].price * 100) },
    no:  { name: outcomes[noIdx].name,  pct: Math.round(outcomes[noIdx].price  * 100) },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PredictionPage() {
  useHead({
    title: "Prediction Markets | Pexly",
    meta: [{ name: "description", content: "Forecast real-world events and compete with the community on prediction markets." }],
  });

  // activeCategory is either "Trending" (pinned, no filter) or a live tag slug
  const [activeSlug,  setActiveSlug]  = useState<string | null>(null); // null = Trending
  const [searchQuery, setSearchQuery] = useState("");
  const [limit,       setLimit]       = useState(36);
  const [, setLocation] = useLocation();

  // Fetch live tags directly from the Polymarket Gamma API
  const { data: apiTags, isLoading: tagsLoading } = useTags();

  // Build the full pill list: pinned + live API tags (filtered + normalised).
  // forceShowOnHomepage is a *response* field — filter client-side to get only
  // curated category-level tags (Politics, Crypto, Sports…).
  // Fall back to showing all non-hidden tags if none have the flag set.
  const categoryPills = useMemo(() => {
    const all = (apiTags ?? []).filter(t => t.slug && !HIDDEN_TAG_SLUGS.has(t.slug));
    const curated = all.filter(t => t.forceShowOnHomepage === true);
    const source  = curated.length > 0 ? curated : all;
    return source.map(t => ({
      slug:  t.slug,
      label: LABEL_OVERRIDES[t.slug] ?? t.label ?? t.slug,
    }));
  }, [apiTags]);

  // Events come from Gamma API directly — no Supabase proxy
  const { data: events, isLoading } = useEvents({
    limit:    60,
    tag_slug: activeSlug ?? undefined,
  });
  const { data: geo } = useGeoblock();

  // Flatten events → markets for display, keeping event metadata attached
  const allMarkets = useMemo<(PolymarketMarket & { _eventTitle?: string; _eventImage?: string; _eventVolume?: number })[]>(() => {
    if (!events) return [];
    return events.flatMap(ev =>
      (ev.markets ?? []).map(m => ({
        ...m,
        _eventTitle:  ev.title,
        _eventImage:  ev.image || m.image,
        _eventVolume: ev.volume,
      }))
    );
  }, [events]);

  // Client-side search (category filtering is server-side via tag_slug)
  const filteredMarkets = useMemo(() => {
    if (!searchQuery) return allMarkets;
    const q = searchQuery.toLowerCase();
    return allMarkets.filter(m =>
      m.question.toLowerCase().includes(q) ||
      (m._eventTitle && m._eventTitle.toLowerCase().includes(q))
    );
  }, [allMarkets, searchQuery]);

  const displayedMarkets = filteredMarkets.slice(0, limit);
  const featuredMarket   = !isLoading && displayedMarkets.length > 0 && !searchQuery && activeSlug === null
    ? displayedMarkets[0]
    : null;
  const gridMarkets = featuredMarket ? displayedMarkets.slice(1) : displayedMarkets;

  // Label shown in the stats bar under the grid
  const activeCategoryLabel = activeSlug === null
    ? "Trending"
    : (categoryPills.find(p => p.slug === activeSlug)?.label ?? activeSlug);

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0D0F12]">

      {/* ── Page Hero ── */}
      <div className="border-b border-border/40 bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-8 pb-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                <BarChart2 className="w-3.5 h-3.5" />
                Prediction Markets
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">What will happen next?</h1>
            </div>

            {/* Search */}
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search markets…"
                className="pl-9 h-10 text-sm bg-muted border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Pills — live from Polymarket /tags API */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0">
            {/* Pinned "Trending" pill (no tag filter) */}
            {PINNED.map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => { setActiveSlug(null); setLimit(36); }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px",
                  activeSlug === null
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {icon}{key}
              </button>
            ))}

            {/* Live API tags */}
            {tagsLoading
              ? [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="px-4 py-2.5 -mb-px">
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
              ))
              : categoryPills.map(({ label, slug }) => (
                <button
                  key={slug}
                  onClick={() => { setActiveSlug(slug); setLimit(36); }}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px capitalize",
                    activeSlug === slug
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))
            }
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">

        {/* Geo-restriction banner */}
        {geo?.blocked && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Polymarket trading is not available in your region. You can still browse markets.
            </span>
          </div>
        )}

        {/* Featured Market */}
        {featuredMarket && (
          <div className="mb-6">
            <FeaturedCard market={featuredMarket} allMarkets={allMarkets} />
          </div>
        )}

        {/* Market stats bar */}
        {!isLoading && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground font-medium">
              {filteredMarkets.length.toLocaleString()} markets
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-xs text-muted-foreground font-medium">{activeCategoryLabel}</span>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {isLoading
            ? [...Array(8)].map((_, i) => <MarketSkeleton key={i} />)
            : gridMarkets.map(market => <MarketCard key={market.conditionId || market.id} market={market} />)
          }
        </div>

        {/* Load more */}
        {!isLoading && filteredMarkets.length > limit && (
          <div className="mt-10 flex justify-center">
            <Button
              variant="outline"
              size="default"
              className="gap-2 font-semibold px-8 rounded-full"
              onClick={() => setLimit(p => p + 36)}
            >
              Load more markets
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Featured Card ─────────────────────────────────────────────────────────────
function FeaturedCard({
  market,
  allMarkets,
}: {
  market: PolymarketMarket & { _eventTitle?: string; _eventImage?: string };
  allMarkets: PolymarketMarket[];
}) {
  const [, setLocation] = useLocation();

  const outcomes  = useMemo(() => parseOutcomes(market), [market]);
  const binary    = useMemo(() => binaryChances(outcomes), [outcomes]);

  // For binary: show yes/no bar; for multi: show top-2 outcomes
  const primary   = outcomes[0];
  const secondary = outcomes[1];
  const primaryPct   = primary   ? Math.round(primary.price * 100)   : 0;
  const secondaryPct = secondary ? Math.round(secondary.price * 100) : 0;

  const related = useMemo(() => {
    return [...allMarkets]
      .filter(m => m.id !== market.id)
      .sort((a, b) => (Number(b.volumeNum) || 0) - (Number(a.volumeNum) || 0))
      .slice(0, 4);
  }, [allMarkets, market.id]);

  const navId = market.conditionId || market.id;

  return (
    <div
      className="grid lg:grid-cols-5 rounded-2xl overflow-hidden border border-border bg-background shadow-sm cursor-pointer"
      onClick={() => setLocation(`/prediction/${navId}`)}
    >
      {/* Left — main market */}
      <div className="lg:col-span-3 p-6 md:p-8 flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          {(market._eventImage || market.image) && (
            <PolymarketImage
              src={market._eventImage || market.image}
              className="w-8 h-8 rounded-lg object-cover border border-border"
            />
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {typeof market.tags?.[0] === "string"
                ? market.tags[0]
                : (market.tags?.[0] as any)?.label || "Market"}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Featured
            </span>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold leading-snug tracking-tight">
          {market._eventTitle || market.question}
        </h2>

        {/* Probability display — dynamic outcome names */}
        <div className="space-y-3">
          {binary ? (
            <>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-black tracking-tight text-foreground">{binary.yes.pct}%</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    chance of {binary.yes.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-muted-foreground">{binary.no.pct}%</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    chance of {binary.no.name}
                  </p>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all duration-700 rounded-l-full"
                     style={{ width: `${binary.yes.pct}%` }} />
                <div className="h-full bg-red-400 transition-all duration-700 rounded-r-full"
                     style={{ width: `${binary.no.pct}%` }} />
              </div>
            </>
          ) : outcomes.length > 0 ? (
            <div className="space-y-2">
              {outcomes.slice(0, 3).map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center justify-between text-sm">
                    <span className="font-semibold truncate mr-2">{o.name}</span>
                    <span className="font-black tabular-nums shrink-0">{Math.round(o.price * 100)}%</span>
                  </div>
                </div>
              ))}
              {outcomes.length > 3 && (
                <p className="text-xs text-muted-foreground">+{outcomes.length - 3} more outcomes</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Action buttons — dynamic labels */}
        <div className="flex gap-3 mt-auto pt-2">
          {binary ? (
            <>
              <button
                onClick={e => { e.stopPropagation(); setLocation(`/prediction/${navId}`); }}
                className="flex-1 h-11 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm transition-all"
              >
                {binary.yes.name} · {binary.yes.pct}¢
              </button>
              <button
                onClick={e => { e.stopPropagation(); setLocation(`/prediction/${navId}`); }}
                className="flex-1 h-11 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-sm transition-all"
              >
                {binary.no.name} · {binary.no.pct}¢
              </button>
            </>
          ) : primary ? (
            <button
              onClick={e => { e.stopPropagation(); setLocation(`/prediction/${navId}`); }}
              className="flex-1 h-11 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold text-sm transition-all"
            >
              View all {outcomes.length} outcomes →
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="font-semibold">
            ${parseFloat(market.volumeNum?.toString() || "0").toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span>total volume</span>
        </div>
      </div>

      {/* Right — related markets */}
      <div
        className="lg:col-span-2 bg-muted/40 dark:bg-white/[0.03] border-t lg:border-t-0 lg:border-l border-border p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold">Also trending</span>
        </div>

        <div className="space-y-1 flex-1">
          {related.length > 0
            ? related.map((m, i) => <RelatedMarketRow key={m.conditionId || m.id} market={m} index={i + 1} />)
            : [1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 p-2">
                <Skeleton className="w-4 h-4 rounded shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-2/3" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function RelatedMarketRow({ market, index }: { market: PolymarketMarket; index: number }) {
  const [, setLocation] = useLocation();

  const outcomes = useMemo(() => parseOutcomes(market), [market]);
  const binary   = useMemo(() => binaryChances(outcomes), [outcomes]);
  const topPct   = binary ? binary.yes.pct : (outcomes[0] ? Math.round(outcomes[0].price * 100) : 0);
  const isHigh   = topPct >= 50;

  const navId = market.conditionId || market.id;

  return (
    <button
      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-background/60 transition-colors text-left group"
      onClick={() => setLocation(`/prediction/${navId}`)}
    >
      <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 pt-0.5">{index}</span>
      {market.image && (
        <PolymarketImage src={market.image} className="w-7 h-7 rounded-md object-cover border border-border shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {market.question}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {typeof market.tags?.[0] === "string"
            ? market.tags[0]
            : (market.tags?.[0] as any)?.label || "Market"}
        </p>
      </div>
      <span className={cn(
        "text-xs font-bold shrink-0 tabular-nums pt-0.5",
        isHigh ? "text-emerald-600 dark:text-emerald-400" : "text-red-500",
      )}>
        {topPct}%
      </span>
    </button>
  );
}

// ─── Market Card ──────────────────────────────────────────────────────────────
function MarketCard({
  market,
}: {
  market: PolymarketMarket & { _eventTitle?: string; _eventImage?: string };
}) {
  const [, setLocation] = useLocation();

  const outcomes = useMemo(() => parseOutcomes(market), [market]);
  const binary   = useMemo(() => binaryChances(outcomes), [outcomes]);

  const volume = parseFloat(market.volumeNum?.toString() || "0");
  const formattedVolume = volume >= 1_000_000
    ? `$${(volume / 1_000_000).toFixed(1)}M`
    : volume >= 1_000
    ? `$${(volume / 1_000).toFixed(0)}K`
    : `$${volume.toFixed(0)}`;

  const navId = market.conditionId || market.id;

  const tagLabel = typeof market.tags?.[0] === "string"
    ? market.tags[0]
    : (market.tags?.[0] as any)?.label || "Market";

  return (
    <div
      className="group flex flex-col bg-background border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-border/80 hover:shadow-md transition-all duration-200"
      onClick={() => setLocation(`/prediction/${navId}`)}
    >
      {/* Card top */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start gap-2.5">
          {(market._eventImage || market.image) ? (
            <PolymarketImage
              src={market._eventImage || market.image}
              className="w-9 h-9 rounded-lg object-cover border border-border shrink-0"
              fallback={
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <BarChart2 className="w-4 h-4 text-muted-foreground" />
                </div>
              }
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
              {tagLabel}
            </span>
            <h3 className="text-sm font-semibold leading-snug line-clamp-3 mt-0.5 group-hover:text-primary transition-colors">
              {market.question}
            </h3>
          </div>
        </div>

        {/* Probability — dynamic outcome names */}
        <div className="space-y-2 mt-auto">
          {binary ? (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black text-foreground tabular-nums">{binary.yes.pct}%</span>
                  <span className="text-xs text-muted-foreground">{binary.yes.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{binary.no.name}</span>
                  <span className="text-sm font-bold text-muted-foreground tabular-nums">{binary.no.pct}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
                     style={{ width: `${binary.yes.pct}%` }} />
                <div className="h-full bg-red-400 transition-all duration-500 rounded-r-full"
                     style={{ width: `${binary.no.pct}%` }} />
              </div>
            </>
          ) : outcomes.length > 0 ? (
            <div className="space-y-1.5">
              {outcomes.slice(0, 2).map((o, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground truncate mr-2">{o.name}</span>
                  <span className="font-bold tabular-nums shrink-0">{Math.round(o.price * 100)}%</span>
                </div>
              ))}
              {outcomes.length > 2 && (
                <p className="text-[10px] text-muted-foreground">+{outcomes.length - 2} more</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Card footer */}
      <div className="px-4 pb-4 flex flex-col gap-2.5">
        {/* Action buttons — dynamic labels */}
        <div className="grid grid-cols-2 gap-2">
          {binary ? (
            <>
              <button
                onClick={e => { e.stopPropagation(); setLocation(`/prediction/${navId}`); }}
                className="h-9 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all"
              >
                {binary.yes.name} · {binary.yes.pct}¢
              </button>
              <button
                onClick={e => { e.stopPropagation(); setLocation(`/prediction/${navId}`); }}
                className="h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition-all"
              >
                {binary.no.name} · {binary.no.pct}¢
              </button>
            </>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); setLocation(`/prediction/${navId}`); }}
              className="col-span-2 h-9 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold transition-all"
            >
              {outcomes.length > 0 ? `${outcomes.length} outcomes` : "View market"} →
            </button>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-medium">{formattedVolume} vol.</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function MarketSkeleton() {
  return (
    <div className="flex flex-col bg-background border border-border rounded-2xl overflow-hidden p-4 gap-3">
      <div className="flex gap-2.5">
        <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-2.5 w-1/3 rounded" />
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-4/5 rounded" />
        </div>
      </div>
      <div className="space-y-2 mt-2">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-4 w-8 rounded" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Skeleton className="h-9 rounded-lg" />
        <Skeleton className="h-9 rounded-lg" />
      </div>
    </div>
  );
}
