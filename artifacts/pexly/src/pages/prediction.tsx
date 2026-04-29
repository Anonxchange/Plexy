import { useHead } from "@unhead/react";
import { useMarkets, PolymarketMarket } from "@/hooks/use-polymarket";
import { PolymarketImage } from "@/components/polymarket-image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, Search, ArrowUpRight, Flame, Zap, Globe, BarChart2,
  ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "Trending", icon: <Flame className="w-3.5 h-3.5" /> },
  { key: "Breaking", icon: <Zap className="w-3.5 h-3.5" /> },
  { key: "Politics", icon: null },
  { key: "Crypto", icon: null },
  { key: "Sports", icon: null },
  { key: "Finance", icon: null },
  { key: "Geopolitics", icon: <Globe className="w-3.5 h-3.5" /> },
  { key: "Tech", icon: null },
  { key: "Economy", icon: null },
  { key: "Culture", icon: null },
];

export default function PredictionPage() {
  useHead({ title: "Prediction Markets | Pexly", meta: [{ name: "description", content: "Forecast real-world events and compete with the community on prediction markets." }] });
  const [limit, setLimit] = useState(36);
  const [activeCategory, setActiveCategory] = useState("Trending");
  const { data: markets, isLoading } = useMarkets({ limit: 1000 });
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    return markets.filter(m => {
      const matchesSearch =
        m.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      if (activeCategory === "Trending") return matchesSearch;
      const matchesCategory =
        m.tags?.some(t => {
          const tag = t.toLowerCase();
          const cat = activeCategory.toLowerCase();
          return tag.includes(cat) || cat.includes(tag);
        }) || m.question.toLowerCase().includes(activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [markets, searchQuery, activeCategory]);

  const displayedMarkets = filteredMarkets?.slice(0, limit);
  const featuredMarket = !isLoading && displayedMarkets?.length > 0 && searchQuery === "" && activeCategory === "Trending"
    ? displayedMarkets[0]
    : null;
  const gridMarkets = featuredMarket ? displayedMarkets.slice(1) : displayedMarkets;

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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0">
            {CATEGORIES.map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px",
                  activeCategory === key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {icon}
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">

        {/* Featured Market */}
        {featuredMarket && (
          <div className="mb-6">
            <FeaturedCard market={featuredMarket} allMarkets={markets || []} />
          </div>
        )}

        {/* Market stats bar */}
        {!isLoading && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground font-medium">
              {filteredMarkets.length.toLocaleString()} markets
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-xs text-muted-foreground font-medium">{activeCategory}</span>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {isLoading
            ? [...Array(8)].map((_, i) => <MarketSkeleton key={i} />)
            : gridMarkets?.map(market => <MarketCard key={market.id} market={market} />)
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

/* ────────────────────────────────────────────────
   Featured Card
──────────────────────────────────────────────── */
function FeaturedCard({ market, allMarkets }: { market: PolymarketMarket; allMarkets: PolymarketMarket[] }) {
  const [, setLocation] = useLocation();

  const prices = useMemo(() => {
    try { return JSON.parse(market.outcomePrices || "[]"); } catch { return []; }
  }, [market.outcomePrices]);

  const yesChance = prices[0] ? Math.round(parseFloat(prices[0]) * 100) : 0;
  const noChance = 100 - yesChance;

  const related = useMemo(() => {
    if (!allMarkets) return [];
    return [...allMarkets]
      .filter(m => m.id !== market.id)
      .sort((a, b) => (Number(b.volumeNum) || 0) - (Number(a.volumeNum) || 0))
      .slice(0, 4);
  }, [allMarkets, market.id]);

  return (
    <div
      className="grid lg:grid-cols-5 rounded-2xl overflow-hidden border border-border bg-background shadow-sm cursor-pointer"
      onClick={() => setLocation(`/prediction/${market.id}`)}
    >
      {/* Left — main market */}
      <div className="lg:col-span-3 p-6 md:p-8 flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          {market.image && (
            <PolymarketImage src={market.image} className="w-8 h-8 rounded-lg object-cover border border-border" />
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {market.tags?.[0] || "Market"}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Featured
            </span>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold leading-snug tracking-tight">
          {market.question}
        </h2>

        {/* Probability display */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black tracking-tight text-foreground">{yesChance}%</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">chance of Yes</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-muted-foreground">{noChance}%</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">chance of No</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-700 rounded-l-full"
              style={{ width: `${yesChance}%` }}
            />
            <div
              className="h-full bg-red-400 transition-all duration-700 rounded-r-full"
              style={{ width: `${noChance}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-auto pt-2">
          <button
            onClick={e => { e.stopPropagation(); setLocation(`/prediction/${market.id}`); }}
            className="flex-1 h-11 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm transition-all"
          >
            Yes · {yesChance}¢
          </button>
          <button
            onClick={e => { e.stopPropagation(); setLocation(`/prediction/${market.id}`); }}
            className="flex-1 h-11 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-sm transition-all"
          >
            No · {noChance}¢
          </button>
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
            ? related.map((m, i) => <RelatedMarketRow key={m.id} market={m} index={i + 1} />)
            : [1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 p-2">
                <Skeleton className="w-4 h-4 rounded shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-2/3" />
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function RelatedMarketRow({ market, index }: { market: PolymarketMarket; index: number }) {
  const [, setLocation] = useLocation();
  const chance = useMemo(() => {
    try {
      const p = JSON.parse(market.outcomePrices || "[]");
      return p[0] ? Math.round(parseFloat(p[0]) * 100) : 0;
    } catch { return 0; }
  }, [market.outcomePrices]);

  return (
    <button
      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-background/60 transition-colors text-left group"
      onClick={() => setLocation(`/prediction/${market.id}`)}
    >
      <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 pt-0.5">{index}</span>
      {market.image && (
        <PolymarketImage src={market.image} className="w-7 h-7 rounded-md object-cover border border-border shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {market.question}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{market.tags?.[0] || "Market"}</p>
      </div>
      <span className={cn(
        "text-xs font-bold shrink-0 tabular-nums pt-0.5",
        chance >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
      )}>
        {chance}%
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────
   Market Card
──────────────────────────────────────────────── */
function MarketCard({ market }: { market: PolymarketMarket }) {
  const [, setLocation] = useLocation();

  const prices = useMemo(() => {
    try { return JSON.parse(market.outcomePrices || "[]"); } catch { return []; }
  }, [market.outcomePrices]);

  const yesChance = prices[0] ? Math.round(parseFloat(prices[0]) * 100) : 0;
  const noChance = 100 - yesChance;
  const volume = parseFloat(market.volumeNum?.toString() || "0");

  const formattedVolume = volume >= 1_000_000
    ? `$${(volume / 1_000_000).toFixed(1)}M`
    : volume >= 1_000
    ? `$${(volume / 1_000).toFixed(0)}K`
    : `$${volume.toFixed(0)}`;

  return (
    <div
      className="group flex flex-col bg-background border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-border/80 hover:shadow-md transition-all duration-200"
      onClick={() => setLocation(`/prediction/${market.id}`)}
    >
      {/* Card top */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start gap-2.5">
          {market.image ? (
            <PolymarketImage src={market.image} className="w-9 h-9 rounded-lg object-cover border border-border shrink-0" fallback={
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
              </div>
            } />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
              {market.tags?.[0] || "Market"}
            </span>
            <h3 className="text-sm font-semibold leading-snug line-clamp-3 mt-0.5 group-hover:text-primary transition-colors">
              {market.question}
            </h3>
          </div>
        </div>

        {/* Probability */}
        <div className="space-y-2 mt-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-foreground tabular-nums">{yesChance}%</span>
              <span className="text-xs text-muted-foreground">Yes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">No</span>
              <span className="text-sm font-bold text-muted-foreground tabular-nums">{noChance}%</span>
            </div>
          </div>
          {/* Slim probability bar */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
              style={{ width: `${yesChance}%` }}
            />
            <div
              className="h-full bg-red-400 transition-all duration-500 rounded-r-full"
              style={{ width: `${noChance}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-4 pb-4 flex flex-col gap-2.5">
        {/* Yes / No buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={e => { e.stopPropagation(); setLocation(`/prediction/${market.id}`); }}
            className="h-9 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all"
          >
            Yes · {yesChance}¢
          </button>
          <button
            onClick={e => { e.stopPropagation(); setLocation(`/prediction/${market.id}`); }}
            className="h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition-all"
          >
            No · {noChance}¢
          </button>
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

/* ────────────────────────────────────────────────
   Skeleton
──────────────────────────────────────────────── */
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
