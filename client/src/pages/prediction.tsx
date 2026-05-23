import { useHead } from "@unhead/react";
import { useEvents, useGeoblock, PolymarketEvent, PolymarketMarket } from "@/hooks/use-polymarket";
import { PolymarketImage } from "@/components/polymarket-image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, Search, Flame, BarChart2,
  AlertTriangle, Zap, Sparkles, Bookmark, Globe,
  SlidersHorizontal, ChevronDown, Check, X, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

// ─── Top-level categories (16 — matching Polymarket's full nav) ───────────────
interface CategoryDef {
  key:       string;
  label:     string;
  icon?:     React.ReactNode;
  tag_slug?: string;
  sort:      string;
  ascending: boolean;
}

const CATEGORIES: CategoryDef[] = [
  { key: "trending",    label: "Trending",    icon: <TrendingUp className="w-3.5 h-3.5" />, sort: "volume_24hr",  ascending: false },
  { key: "breaking",    label: "Breaking",    icon: <Zap        className="w-3.5 h-3.5" />, sort: "start_date",   ascending: false },
  { key: "new",         label: "New",         icon: <Sparkles   className="w-3.5 h-3.5" />, sort: "start_date",   ascending: false },
  { key: "politics",    label: "Politics",    tag_slug: "politics",    sort: "volume_24hr", ascending: false },
  { key: "crypto",      label: "Crypto",      tag_slug: "crypto",      sort: "volume_24hr", ascending: false },
  { key: "sports",      label: "Sports",      tag_slug: "sports",      sort: "volume_24hr", ascending: false },
  { key: "finance",     label: "Finance",     tag_slug: "finance",     sort: "volume_24hr", ascending: false },
  { key: "science",     label: "Science",     tag_slug: "science",     sort: "volume_24hr", ascending: false },
  { key: "tech",        label: "Tech",        tag_slug: "tech",        sort: "volume_24hr", ascending: false },
  { key: "culture",     label: "Culture",     tag_slug: "pop-culture", sort: "volume_24hr", ascending: false },
  { key: "world",       label: "World",       icon: <Globe className="w-3.5 h-3.5" />, tag_slug: "world", sort: "volume_24hr", ascending: false },
  { key: "business",    label: "Business",    tag_slug: "business",    sort: "volume_24hr", ascending: false },
  { key: "elections",   label: "Elections",   tag_slug: "elections",   sort: "volume_24hr", ascending: false },
  { key: "geopolitics", label: "Geopolitics", tag_slug: "geopolitics", sort: "volume_24hr", ascending: false },
  { key: "ai",          label: "AI",          tag_slug: "ai",          sort: "volume_24hr", ascending: false },
  { key: "climate",     label: "Climate",     tag_slug: "climate",     sort: "volume_24hr", ascending: false },
];

// ─── Sort options (matching Polymarket's "24hr Volume" dropdown) ──────────────
type SortKey = "volume_24hr" | "volume" | "end_date" | "start_date";
const SORT_OPTIONS: { key: SortKey; label: string; ascending: boolean }[] = [
  { key: "volume_24hr", label: "24hr Volume", ascending: false },
  { key: "volume",      label: "Total Volume", ascending: false },
  { key: "end_date",    label: "Closing Soon",  ascending: true  },
  { key: "start_date",  label: "Opening",       ascending: false },
];

// ─── Type filter ──────────────────────────────────────────────────────────────
type TypeFilter = "all" | "binary" | "multi";
const TYPE_OPTIONS: { key: TypeFilter; label: string }[] = [
  { key: "all",    label: "All" },
  { key: "binary", label: "Binary" },
  { key: "multi",  label: "Multi-outcome" },
];

// ─── Status filter ────────────────────────────────────────────────────────────
type StatusFilter = "active" | "closed" | "all";
const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "closed", label: "Closed" },
  { key: "all",    label: "All" },
];

// Tags that should never appear as sub-tags
const HIDDEN_SUB_TAGS = new Set([
  "featured", "hide-from-new", "test", "demo", "other", "all",
  "2025-predictions", "2026-predictions", "2024-predictions",
  "crypto-new-hide", "hit-price",
]);

// ─── Outcome parsing ──────────────────────────────────────────────────────────
function parseOutcomes(market: PolymarketMarket): { name: string; price: number }[] {
  try {
    const names  = JSON.parse(market.outcomes      || "[]") as string[];
    const prices = JSON.parse(market.outcomePrices || "[]") as string[];
    if (!names.length) return [];
    return names.map((name, i) => ({ name, price: parseFloat(prices[i] ?? "0") || 0 }));
  } catch { return []; }
}

function isBinary(outcomes: { name: string; price: number }[]): boolean {
  if (outcomes.length !== 2) return false;
  const n = outcomes.map(o => o.name.toLowerCase());
  return n.includes("yes") && n.includes("no");
}

function extractShortName(question: string): string {
  let q = question;
  q = q.replace(/^will\s+the\s+/i, "").replace(/^will\s+/i, "")
        .replace(/^does\s+/i, "").replace(/^is\s+/i, "");
  const cutPatterns = [
    /\s+win\s+.+\??$/i, /\s+be\s+.+\??$/i, /\s+reach\s+.+\??$/i,
    /\s+finish\s+.+\??$/i, /\s+make\s+.+\??$/i, /\s+qualify\s+.+\??$/i,
    /\s+get\s+.+\??$/i, /\s+advance\s+.+\??$/i, /\s+become\s+.+\??$/i,
  ];
  for (const pat of cutPatterns) {
    const trimmed = q.replace(pat, "").trim();
    if (trimmed.length > 0 && trimmed.length < q.length) { q = trimmed; break; }
  }
  q = q.replace(/[?!.,]+$/, "").trim();
  return q.length > 0 ? q[0].toUpperCase() + q.slice(1) : question;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

// ─── Simple dropdown component ────────────────────────────────────────────────
function FilterDropdown({
  label, value, options, onSelect, icon,
}: {
  label:    string;
  value:    string;
  options:  { key: string; label: string }[];
  onSelect: (key: string) => void;
  icon?:    React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find(o => o.key === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-semibold whitespace-nowrap transition-all",
          open
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted border-border/50 text-foreground hover:border-primary/30 hover:bg-muted/80",
        )}
      >
        {icon}
        {selected?.label ?? label}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 z-50 min-w-[140px] rounded-xl border border-border bg-popover shadow-lg py-1 overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.key}
              onClick={() => { onSelect(opt.key); setOpen(false); }}
              className={cn(
                "flex items-center justify-between w-full px-3.5 py-2 text-xs hover:bg-muted transition-colors",
                value === opt.key ? "font-bold text-primary" : "text-foreground",
              )}
            >
              {opt.label}
              {value === opt.key && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PredictionPage() {
  useHead({
    title: "Prediction Markets | Pexly",
    meta: [{ name: "description", content: "Forecast real-world events and compete with the community on prediction markets." }],
  });

  const [activeCatKey,  setActiveCatKey]  = useState<string>("trending");
  const [activeSubTag,  setActiveSubTag]  = useState<string | null>(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [sortKey,       setSortKey]       = useState<SortKey>("volume_24hr");
  const [typeFilter,    setTypeFilter]    = useState<TypeFilter>("all");
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("active");
  const [hideSports,    setHideSports]    = useState(false);
  const [hideCrypto,    setHideCrypto]    = useState(false);
  const [hideEarnings,  setHideEarnings]  = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);
  const [offset,        setOffset]        = useState(0);
  const [allEvents,     setAllEvents]     = useState<PolymarketEvent[]>([]);
  const [hasMore,       setHasMore]       = useState(true);
  const [, setLocation] = useLocation();

  const activeCat = CATEGORIES.find(c => c.key === activeCatKey) ?? CATEGORIES[0];

  // Effective sort (user's sort pick overrides category default, unless category
  // explicitly uses start_date for "Breaking" / "New")
  const effectiveSort =
    (activeCat.key === "breaking" || activeCat.key === "new")
      ? activeCat.sort
      : sortKey;
  const sortOpt      = SORT_OPTIONS.find(s => s.key === effectiveSort) ?? SORT_OPTIONS[0];
  const effectiveAsc = sortOpt.ascending;

  // Status → API closed param
  const closedParam =
    statusFilter === "active" ? false :
    statusFilter === "closed" ? true  : undefined;

  // Tag slug: sub-tag overrides top category
  const queryTagSlug = activeSubTag ?? activeCat.tag_slug;

  const filterKey = `${queryTagSlug}|${effectiveSort}|${String(effectiveAsc)}|${String(closedParam)}`;

  const { data: events, isLoading, isFetching } = useEvents({
    limit:    60,
    offset,
    tag_slug: queryTagSlug,
    sort:     effectiveSort,
    ascending: effectiveAsc,
    closed:   closedParam,
  });

  // Reset pagination when filters/category change
  useEffect(() => {
    setOffset(0);
    setAllEvents([]);
    setHasMore(true);
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Accumulate pages
  useEffect(() => {
    if (!events) return;
    setAllEvents(prev =>
      offset === 0
        ? events
        : [...prev, ...events.filter(e => !prev.some(p => p.id === e.id))]
    );
    setHasMore(events.length >= 60);
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: geo } = useGeoblock();

  // Sub-tags derived from loaded events
  const subTags = useMemo(() => {
    if (!allEvents?.length) return [];
    const freq = new Map<string, { slug: string; label: string; count: number }>();
    const mainCatSlug = activeCat.tag_slug;
    for (const ev of allEvents) {
      const seen = new Set<string>();
      for (const t of (ev.tags ?? [])) {
        const slug  = typeof t === "string" ? t : t.slug;
        const label = typeof t === "string" ? t : (t.label ?? t.slug);
        if (!slug || slug === mainCatSlug || HIDDEN_SUB_TAGS.has(slug) || seen.has(slug)) continue;
        seen.add(slug);
        const e = freq.get(slug);
        e ? e.count++ : freq.set(slug, { slug, label, count: 1 });
      }
    }
    return [...freq.values()].sort((a, b) => b.count - a.count).slice(0, 16)
      .map(t => ({ slug: t.slug, label: t.label }));
  }, [allEvents, activeCat.tag_slug]);

  // Client-side filters: search + category hides
  const displayedEvents = useMemo(() => {
    if (!allEvents.length) return [];
    let list = allEvents;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(ev =>
        ev.title?.toLowerCase().includes(q) ||
        ev.markets?.some(m => m.question?.toLowerCase().includes(q))
      );
    }

    if (typeFilter === "binary") {
      list = list.filter(ev => ev.markets?.length === 1 && isBinary(parseOutcomes(ev.markets[0])));
    } else if (typeFilter === "multi") {
      list = list.filter(ev =>
        ev.markets?.length > 1 ||
        (ev.markets?.length === 1 && !isBinary(parseOutcomes(ev.markets[0])))
      );
    }

    if (hideSports) {
      list = list.filter(ev => !(ev.tags ?? []).some((t: any) => {
        const s = typeof t === "string" ? t : t.slug;
        return s === "sports" || s === "sport";
      }));
    }
    if (hideCrypto) {
      list = list.filter(ev => !(ev.tags ?? []).some((t: any) => {
        const s = typeof t === "string" ? t : t.slug;
        return s === "crypto" || s === "cryptocurrency";
      }));
    }
    if (hideEarnings) {
      list = list.filter(ev => !(ev.tags ?? []).some((t: any) => {
        const s = typeof t === "string" ? t : t.slug;
        return s === "earnings" || s === "finance";
      }));
    }

    return list;
  }, [allEvents, searchQuery, typeFilter, hideSports, hideCrypto, hideEarnings]);

  const handleCategoryClick = useCallback((cat: CategoryDef) => {
    setActiveCatKey(cat.key);
    setActiveSubTag(null);
  }, []);

  // Reset sort to 24hr volume when switching to a normal category
  const handleCategoryClickFull = useCallback((cat: CategoryDef) => {
    handleCategoryClick(cat);
    if (cat.key !== "breaking" && cat.key !== "new") setSortKey("volume_24hr");
  }, [handleCategoryClick]);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top category nav (sticky) ── */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => handleCategoryClickFull(cat)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px",
                  activeCatKey === cat.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search + sub-tags + filter bar ── */}
      <div className="border-b border-border/30 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 space-y-2.5">

          {/* Search bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search markets…"
                className="pl-9 h-10 text-sm bg-background border-border/50 rounded-xl"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={cn(
                "w-10 h-10 rounded-xl border flex items-center justify-center transition-all shrink-0",
                showFilters
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30",
              )}
              aria-label="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              className="w-10 h-10 rounded-xl border border-border/50 bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all shrink-0"
              aria-label="Saved"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-tags row */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => setActiveSubTag(null)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                activeSubTag === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              All
            </button>
            {isLoading
              ? [1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="px-3.5 py-1.5 bg-muted rounded-full">
                  <Skeleton className="h-3 w-14 rounded-full" />
                </div>
              ))
              : subTags.map(({ slug, label }) => (
                <button
                  key={slug}
                  onClick={() => setActiveSubTag(slug)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize",
                    activeSubTag === slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))
            }
          </div>

          {/* Filter bar — matches Polymarket: Active ▼ · Hide sports · Hide crypto · Hide earnings */}
          {showFilters && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {activeCat.key !== "breaking" && activeCat.key !== "new" ? (
                <FilterDropdown
                  label="Sort"
                  value={sortKey}
                  options={SORT_OPTIONS}
                  onSelect={v => setSortKey(v as SortKey)}
                  icon={<TrendingUp className="w-3 h-3" />}
                />
              ) : (
                <div className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-border/30 bg-muted/50 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  <TrendingUp className="w-3 h-3" />
                  {activeCat.key === "breaking" ? "Latest" : "Opening"}
                </div>
              )}
              <FilterDropdown
                label="Type"
                value={typeFilter}
                options={TYPE_OPTIONS}
                onSelect={v => setTypeFilter(v as TypeFilter)}
              />
              <FilterDropdown
                label="Status"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onSelect={v => setStatusFilter(v as StatusFilter)}
              />
              {(["Hide sports", "Hide crypto", "Hide earnings"] as const).map((label, i) => {
                const checked = [hideSports, hideCrypto, hideEarnings][i];
                const toggle  = [() => setHideSports(v => !v), () => setHideCrypto(v => !v), () => setHideEarnings(v => !v)][i];
                return (
                  <button
                    key={label}
                    onClick={toggle}
                    className="flex items-center gap-2 h-8 px-3 text-sm font-medium whitespace-nowrap text-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <span className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                      checked ? "bg-primary border-primary" : "border-muted-foreground/50",
                    )}>
                      {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">

        {/* Geo-restriction banner */}
        {geo?.blocked && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Polymarket trading is not available in your region. You can still browse markets.</span>
          </div>
        )}


        {/* Events grid — Breaking uses a full-width ranked list */}
        <div className={cn(
          "gap-3",
          activeCatKey === "breaking"
            ? "grid grid-cols-1 max-w-2xl"
            : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
        )}>
          {isLoading
            ? [...Array(6)].map((_, i) => <EventCardSkeleton key={i} />)
            : displayedEvents.length > 0
              ? displayedEvents.map((ev, idx) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  rank={idx + 1}
                  variant={activeCatKey === "breaking" ? "breaking" : "default"}
                  onNavigate={id => setLocation(`/prediction/${id}`)}
                />
              ))
              : (
                <div className="col-span-full py-16 text-center text-muted-foreground">
                  <BarChart2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No markets found</p>
                  <p className="text-xs mt-1 opacity-60">Try a different category, filter, or search term</p>
                </div>
              )
          }
        </div>

        {/* Load more */}
        {!isLoading && hasMore && displayedEvents.length > 0 && (
          <div className="flex justify-center mt-8 mb-4">
            <button
              onClick={() => setOffset(prev => prev + 60)}
              disabled={isFetching}
              className="h-10 px-8 rounded-full border border-border/60 bg-card text-sm font-semibold hover:bg-muted hover:border-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetching ? "Loading…" : "Load more"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Event Card ────────────────────────────────────────────────────────────────
function EventCard({
  event, rank, variant = "default", onNavigate,
}: {
  event:      PolymarketEvent;
  rank?:      number;
  variant?:   "default" | "breaking";
  onNavigate: (id: string) => void;
}) {
  const markets = event.markets ?? [];
  const isMulti = markets.length > 1;
  const isLive  = event.active && !event.closed;
  const volume  = formatVolume(event.volume ?? 0);
  const navId   = markets[0]?.conditionId ?? event.id;

  // ── Multi-market: sub-markets each with Yes/No binary outcomes ──────────────
  const rankedMarkets = useMemo(() => {
    if (!isMulti) return [];
    return markets
      .map(m => {
        const outs   = parseOutcomes(m);
        const yesOut = outs.find(o => o.name.toLowerCase() === "yes");
        const noOut  = outs.find(o => o.name.toLowerCase() === "no");
        return { m, yesPrice: yesOut?.price ?? 0, noPrice: noOut?.price ?? 0, isBin: !!(yesOut && noOut) };
      })
      .filter(({ yesPrice }) => yesPrice > 0)
      .sort((a, b) => b.yesPrice - a.yesPrice)
      .slice(0, 5);
  }, [markets, isMulti]);

  // ── Single market outcomes ──────────────────────────────────────────────────
  const singleOutcomes = useMemo(() => {
    if (isMulti || !markets[0]) return [];
    return parseOutcomes(markets[0]);
  }, [markets, isMulti]);

  const singleBinary = useMemo(() => {
    if (!isBinary(singleOutcomes)) return null;
    const yes = singleOutcomes.find(o => o.name.toLowerCase() === "yes")!;
    const no  = singleOutcomes.find(o => o.name.toLowerCase() === "no")!;
    return { yesPct: Math.round(yes.price * 100), noPct: Math.round(no.price * 100) };
  }, [singleOutcomes]);

  // Leading outcome for Breaking view
  const leadingPct = useMemo(() => {
    if (singleBinary) return singleBinary.yesPct;
    if (singleOutcomes.length) return Math.round(Math.max(...singleOutcomes.map(o => o.price)) * 100);
    if (rankedMarkets.length)  return Math.round(rankedMarkets[0].yesPrice * 100);
    return null;
  }, [singleBinary, singleOutcomes, rankedMarkets]);

  // ── BREAKING variant — compact ranked list, no buy buttons ─────────────────
  if (variant === "breaking") {
    return (
      <div
        className="group flex items-center gap-3 bg-card border border-border/60 rounded-2xl px-4 py-3 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all duration-200"
        onClick={() => onNavigate(navId)}
      >
        {rank && (
          <span className="text-sm font-bold text-muted-foreground w-5 shrink-0 tabular-nums">{rank}</span>
        )}
        <PolymarketImage
          src={event.image || markets[0]?.image}
          className="w-12 h-12 rounded-xl object-cover border border-border/60 shrink-0"
          fallback={
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5 text-muted-foreground" />
            </div>
          }
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {event.title || markets[0]?.question}
          </p>
        </div>
        {leadingPct !== null && (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold tabular-nums leading-none">{leadingPct}%</p>
            <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">↑ {volume}</p>
          </div>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    );
  }

  // ── DEFAULT variant ─────────────────────────────────────────────────────────
  return (
    <div
      className="group flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all duration-200"
      onClick={() => onNavigate(navId)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {(event.image || markets[0]?.image) && (
          <PolymarketImage
            src={event.image || markets[0]?.image}
            className="w-11 h-11 rounded-xl object-cover border border-border/60 shrink-0"
            fallback={
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <BarChart2 className="w-5 h-5 text-muted-foreground" />
              </div>
            }
          />
        )}
        <div className="flex-1 min-w-0">
          {isLive && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
          )}
          <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {event.title || markets[0]?.question}
          </h3>
        </div>
        <button
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          onClick={e => e.stopPropagation()}
          aria-label="Save"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 pb-3">
        {isMulti ? (
          /* Multi sub-market rows: each sub-market is binary (label + % + Yes/No) */
          <div className="space-y-1.5">
            {rankedMarkets.map(({ m, yesPrice, noPrice, isBin }) => {
              const shortName = extractShortName(m.question);
              const yesPct    = Math.round(yesPrice * 100);
              const noPct     = Math.round(noPrice  * 100);
              const navMkt    = m.conditionId ?? m.id;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg hover:bg-muted/50 px-1 py-0.5 transition-colors"
                  onClick={e => { e.stopPropagation(); onNavigate(navMkt); }}
                >
                  <span className="flex-1 text-xs font-medium text-foreground truncate">{shortName}</span>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground w-7 text-right shrink-0">{yesPct}%</span>
                  {isBin && <>
                    <button
                      className="h-6 px-2.5 rounded-md text-[11px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 transition-colors shrink-0"
                      onClick={e => { e.stopPropagation(); onNavigate(navMkt); }}
                    >Yes</button>
                    <button
                      className="h-6 px-2.5 rounded-md text-[11px] font-bold bg-red-500/15 hover:bg-red-500/25 text-red-500 transition-colors shrink-0"
                      onClick={e => { e.stopPropagation(); onNavigate(navMkt); }}
                    >No</button>
                  </>}
                </div>
              );
            })}
            {markets.length > 5 && (
              <p className="text-[11px] text-muted-foreground px-1 mt-0.5">
                +{markets.length - 5} more outcomes
              </p>
            )}
          </div>
        ) : singleBinary ? (
          /* Single binary market: progress bar + Yes/No buttons */
          <div className="space-y-2">
            <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                style={{ width: `${singleBinary.yesPct}%` }} />
              <div className="absolute right-0 top-0 h-full bg-red-500 rounded-r-full transition-all duration-500"
                style={{ width: `${singleBinary.noPct}%` }} />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex-1 h-9 rounded-xl text-sm font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 transition-colors"
                onClick={e => { e.stopPropagation(); onNavigate(navId); }}
              >Yes · {singleBinary.yesPct}¢</button>
              <button
                className="flex-1 h-9 rounded-xl text-sm font-bold bg-red-500/15 hover:bg-red-500/25 text-red-500 transition-colors"
                onClick={e => { e.stopPropagation(); onNavigate(navId); }}
              >No · {singleBinary.noPct}¢</button>
            </div>
          </div>
        ) : singleOutcomes.filter(o => o.price > 0).length > 0 ? (
          /* Single market with named outcomes (e.g. team matchup, multi-choice) */
          <div className="space-y-1.5">
            {singleOutcomes.filter(o => o.price > 0).slice(0, 4).map((o, i) => {
              const pct = Math.round(o.price * 100);
              const isTop = i === 0;
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg hover:bg-muted/50 px-1 py-0.5 transition-colors"
                  onClick={e => { e.stopPropagation(); onNavigate(navId); }}>
                  <span className="flex-1 text-xs font-medium truncate">{o.name}</span>
                  <span className="text-xs font-bold tabular-nums shrink-0">{pct}%</span>
                  <button
                    className={cn(
                      "h-6 px-2.5 rounded-md text-[11px] font-bold transition-colors shrink-0",
                      isTop
                        ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground",
                    )}
                    onClick={e => { e.stopPropagation(); onNavigate(navId); }}
                  >Buy</button>
                </div>
              );
            })}
            {singleOutcomes.filter(o => o.price > 0).length > 4 && (
              <p className="text-[11px] text-muted-foreground px-1">
                +{singleOutcomes.filter(o => o.price > 0).length - 4} more
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40 mt-auto">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Flame className="w-3 h-3" />
          <span className="font-semibold">{volume}</span>
          <span>Vol.</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {markets.length} market{markets.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden p-4 gap-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="flex-1 h-3" />
            <Skeleton className="w-8 h-3" />
            <Skeleton className="w-10 h-6 rounded-md" />
            <Skeleton className="w-10 h-6 rounded-md" />
          </div>
        ))}
      </div>
      <div className="border-t border-border/40 pt-2.5 flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}
