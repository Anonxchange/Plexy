import { useHead } from "@unhead/react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSchema, marketsPageSchema } from "@/hooks/use-schema";
import {
  Search, Star, TrendingUp, TrendingDown,
  ChevronUp, ChevronDown, Loader2, ArrowUpDown,
} from "lucide-react";
import { asterMarket, Ticker24h } from "@/lib/asterdex-service";
import { CoinIcon } from "@/components/trading/CoinIcon";

// ─── helpers ────────────────────────────────────────────────────────────────

const QUOTES = ["USDT", "USDC", "BTC", "ETH", "BNB", "BUSD", "USD1"];

function toDisplayPair(symbol: string): string {
  for (const q of QUOTES) {
    if (symbol.endsWith(q)) return `${symbol.slice(0, -q.length)}/${q}`;
  }
  return symbol;
}

function getBase(displayPair: string) { return displayPair.split("/")[0] ?? displayPair; }

function fmtPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (v >= 1)    return v.toFixed(4);
  return v.toFixed(6);
}

function fmtVol(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// ─── types ───────────────────────────────────────────────────────────────────

interface Row {
  symbol:     string;
  base:       string;
  address?:   string;
  price:      number;
  change:     number;
  volume:     number;
  high:       number;
  low:        number;
  isNew:      boolean;
  subTypes:   string[];
}

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ up }: { up: boolean }) {
  const color   = up ? "#22C55E" : "#EF4444";
  const fill    = up ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)";
  const lineUp  = "M0,28 L18,22 L36,24 L54,16 L72,12 L90,8 L108,4";
  const lineDn  = "M0,4  L18,9  L36,12 L54,18 L72,22 L90,26 L108,30";
  const d = up ? lineUp : lineDn;
  const fd = up ? `${lineUp} L108,36 L0,36 Z` : `${lineDn} L108,36 L0,36 Z`;
  return (
    <svg viewBox="0 0 108 36" className="w-[72px] h-7" fill="none" aria-hidden>
      <path d={fd} fill={fill} />
      <path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Change badge ─────────────────────────────────────────────────────────────

function ChangePill({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${
        up ? "text-green-600 bg-green-500/10" : "text-red-500 bg-red-500/10"
      }`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
    </span>
  );
}

// ─── Stats bar ───────────────────────────────────────────────────────────────

const STATS = [
  { label: "Total Mkt Cap",  value: "$2.71T", change: "+1.8%",  up: true  },
  { label: "24h Volume",     value: "$217.4B",change: "-3.1%",  up: false },
  { label: "BTC Dominance",  value: "54.3%",  change: "+0.4%",  up: true  },
  { label: "Fear & Greed",   value: "68 — Greed", change: "", up: true },
  { label: "ETH Gas",        value: "0.035 Gwei",  change: "", up: true },
];

function StatsBar() {
  return (
    <div className="bg-card rounded-xl px-5 py-4 flex flex-wrap gap-x-8 gap-y-3 overflow-x-auto">
      {STATS.map((s, i) => (
        <div key={i} className="flex flex-col min-w-[90px]">
          <span className="text-[11px] font-semibold text-muted-foreground mb-0.5">{s.label}</span>
          <span className="text-sm font-bold text-foreground">{s.value}</span>
          {s.change && (
            <span className={`text-[11px] font-bold ${s.up ? "text-green-500" : "text-red-500"}`}>
              {s.change}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Sort helper ──────────────────────────────────────────────────────────────

type SortKey = "price" | "change" | "volume" | "high" | "low";

function SortBtn({ col, active, dir, onClick }: {
  col: SortKey; active: SortKey; dir: "asc"|"desc"; onClick: () => void;
}) {
  const isActive = col === active;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-0.5 transition-colors ${
        isActive ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"
      }`}
    >
      {isActive
        ? (dir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)
        : <ArrowUpDown className="w-3 h-3" />}
    </button>
  );
}

// ─── Category filter labels (futures) ────────────────────────────────────────

const FUTURES_FILTER_ORDER  = ["All", "Top", "New", "Meme", "AI", "STOCK", "RWA", "pre-launch"];
const FUTURES_FILTER_LABELS: Record<string, string> = {
  "All":         "All",
  Top:           "Top",
  New:           "New",
  Meme:          "Meme",
  AI:            "AI",
  STOCK:         "Stocks",
  RWA:           "RWA",
  "pre-launch":  "Pre-launch",
};
const SPOT_FILTERS = ["All", "Rocket Launch", "Meme"];

const NEW_LISTING_DAYS = 60;
const cutoff = Date.now() - NEW_LISTING_DAYS * 24 * 60 * 60 * 1000;

// ─── Page ────────────────────────────────────────────────────────────────────

type MarketTab = "Spot" | "Futures";
type MainTab   = "overview" | "key-metrics" | "contract-data";

export default function MarketsPage() {
  useHead({
    title: "Crypto Markets | Pexly",
    meta: [{ name: "description", content: "Live spot and futures market data from AsterDEX." }],
  });
  useSchema(marketsPageSchema, "markets-page-schema");

  const [, navigate] = useLocation();

  const [mainTab,      setMainTab]      = useState<MainTab>("overview");
  const [marketTab,    setMarketTab]    = useState<MarketTab>("Spot");
  const [filter,       setFilter]       = useState("All");
  const [search,       setSearch]       = useState("");
  const [sortKey,      setSortKey]      = useState<SortKey>("volume");
  const [sortDir,      setSortDir]      = useState<"asc"|"desc">("desc");
  const [favorites,    setFavorites]    = useState<Set<string>>(new Set());
  const [page,         setPage]         = useState(1);

  const PER_PAGE = 20;

  // Navigate to coin detail page
  function openCoin(row: Row) {
    const slug = row.symbol.replace("/", "-");
    navigate(`/markets/${slug}?type=${marketTab.toLowerCase()}`);
  }

  // ── data fetching (same query keys as SymbolSelector → shared cache) ──────
  const { data: spotTickers,   isLoading: spotLoading } = useQuery<Ticker24h[]>({
    queryKey:       ["spot-tickers-all"],
    queryFn:        () => asterMarket.spotTicker(),
    staleTime:      15_000,
    refetchInterval: 30_000,
  });

  const { data: futuresTickers, isLoading: futuresLoading } = useQuery<Ticker24h[]>({
    queryKey:       ["futures-tickers-all"],
    queryFn:        () => asterMarket.futuresTicker(),
    staleTime:      15_000,
    refetchInterval: 30_000,
  });

  const { data: spotExInfo } = useQuery({
    queryKey:  ["spot-exchange-info"],
    queryFn:   () => asterMarket.spotExchangeInfo(),
    staleTime: 300_000,
  });

  const { data: futuresExInfo } = useQuery({
    queryKey:  ["futures-exchange-info"],
    queryFn:   () => asterMarket.futuresExchangeInfo(),
    staleTime: 300_000,
  });

  // ── build helper maps from exchange info ──────────────────────────────────
  const spotAddressMap = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    (spotExInfo?.symbols ?? []).forEach((s: any) => {
      if (s.baseAssetAddress) m[s.baseAsset] = s.baseAssetAddress;
    });
    return m;
  }, [spotExInfo]);

  const futuresAddressMap = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    (futuresExInfo?.symbols ?? []).forEach((s: any) => {
      if (s.baseAssetAddress) m[s.baseAsset] = s.baseAssetAddress;
    });
    return m;
  }, [futuresExInfo]);

  const futuresSubTypeMap = useMemo<Record<string, string[]>>(() => {
    const m: Record<string, string[]> = {};
    (futuresExInfo?.symbols ?? []).forEach((s: any) => {
      const sub: string[] = (s.underlyingSubType ?? []).filter((t: string) => t !== "Commodities");
      if (sub.length) m[s.baseAsset] = sub;
    });
    return m;
  }, [futuresExInfo]);

  const futuresMemeSet = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    Object.entries(futuresSubTypeMap).forEach(([base, types]) => {
      if (types.includes("Meme")) s.add(base);
    });
    return s;
  }, [futuresSubTypeMap]);

  const futuresNewSet = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    (futuresExInfo?.symbols ?? []).forEach((sym: any) => {
      if (sym.onboardDate && sym.onboardDate >= cutoff) s.add(sym.symbol);
    });
    return s;
  }, [futuresExInfo]);

  const spotNewSet = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    (spotExInfo?.symbols ?? []).forEach((sym: any) => {
      if (sym.listingTime && sym.listingTime >= cutoff) s.add(sym.symbol);
    });
    return s;
  }, [spotExInfo]);

  // ── build rows ────────────────────────────────────────────────────────────
  function buildRows(
    tickers: Ticker24h[] | undefined,
    addrMap: Record<string, string>,
    subTypeMap: Record<string, string[]>,
    newSet: Set<string>,
  ): Row[] {
    if (!Array.isArray(tickers)) return [];
    return tickers
      .filter(t => !t.symbol.startsWith("TEST"))
      .map(t => {
        const dp   = toDisplayPair(t.symbol);
        const base = getBase(dp);
        return {
          symbol:   dp,
          base,
          address:  addrMap[base],
          price:    parseFloat(t.lastPrice),
          change:   parseFloat(t.priceChangePercent),
          volume:   parseFloat(t.quoteVolume),
          high:     parseFloat(t.highPrice),
          low:      parseFloat(t.lowPrice),
          isNew:    newSet.has(t.symbol),
          subTypes: subTypeMap[base] ?? [],
        };
      });
  }

  const spotRows    = useMemo(() => buildRows(spotTickers,    spotAddressMap,    {},                 spotNewSet),    [spotTickers, spotAddressMap, spotNewSet]);
  const futuresRows = useMemo(() => buildRows(futuresTickers, futuresAddressMap, futuresSubTypeMap,  futuresNewSet), [futuresTickers, futuresAddressMap, futuresSubTypeMap, futuresNewSet]);

  // ── available filters ─────────────────────────────────────────────────────
  const availableFilters: string[] = useMemo(() => {
    if (marketTab === "Spot") return SPOT_FILTERS;
    const subTypes = new Set<string>();
    Object.values(futuresSubTypeMap).forEach(arr => arr.forEach(s => subTypes.add(s)));
    return FUTURES_FILTER_ORDER.filter(f => {
      if (f === "All") return true;
      if (f === "New") return futuresNewSet.size > 0;
      return subTypes.has(f);
    }).map(f => FUTURES_FILTER_LABELS[f] ?? f);
  }, [marketTab, futuresSubTypeMap, futuresNewSet]);

  // ── filter + sort ─────────────────────────────────────────────────────────
  const allRows = marketTab === "Spot" ? spotRows : futuresRows;
  const isLoading = marketTab === "Spot" ? spotLoading : futuresLoading;

  const filteredRows: Row[] = useMemo(() => {
    let rows = allRows;
    if (search) rows = rows.filter(r =>
      r.symbol.toLowerCase().includes(search.toLowerCase()) ||
      r.base.toLowerCase().includes(search.toLowerCase())
    );
    if (filter !== "All") {
      if (filter === "Rocket Launch" || filter === "New") rows = rows.filter(r => r.isNew);
      else if (filter === "Meme") rows = rows.filter(r => r.subTypes.includes("Meme"));
      else {
        const raw = Object.entries(FUTURES_FILTER_LABELS).find(([, v]) => v === filter)?.[0] ?? filter;
        rows = rows.filter(r => r.subTypes.includes(raw));
      }
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => (a[sortKey] - b[sortKey]) * dir);
  }, [allRows, search, filter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const totalPages = Math.ceil(filteredRows.length / PER_PAGE);
  const pageRows   = filteredRows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggleFav(symbol: string) {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
    setPage(1);
  }

  function changeFilter(f: string) { setFilter(f); setPage(1); }
  function changeMarketTab(t: MarketTab) { setMarketTab(t); setFilter("All"); setSearch(""); setPage(1); }

  // ── top movers (top gainers / trending / new) ─────────────────────────────
  const topGainers  = useMemo(() => [...allRows].sort((a, b) => b.change - a.change).slice(0, 5), [allRows]);
  const topLosers   = useMemo(() => [...allRows].sort((a, b) => a.change - b.change).slice(0, 5), [allRows]);
  const byVolume    = useMemo(() => [...allRows].sort((a, b) => b.volume - a.volume).slice(0, 5), [allRows]);

  // ── SVG gauge (for Key Metrics sentiment) ─────────────────────────────────
  function Gauge({ value }: { value: number }) {
    const pct = value / 100;
    const r = 40, cx = 50, cy = 50;
    const start = { x: cx - r, y: cy };
    const end   = { x: cx + r, y: cy };
    const angle = Math.PI * pct;
    const ex = cx + r * Math.cos(Math.PI - angle);
    const ey = cy - r * Math.sin(angle);
    const largeArc = pct > 0.5 ? 1 : 0;
    return (
      <svg viewBox="0 0 100 60" className="w-full max-w-[160px]">
        <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
          fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${ex} ${ey}`}
          fill="none" stroke="#B4F22E" strokeWidth="10" strokeLinecap="round" />
        <text x="50" y="48" textAnchor="middle" className="font-bold" fontSize="14" fill="hsl(var(--foreground))">{value}</text>
        <text x="50" y="58" textAnchor="middle" fontSize="6" fill="hsl(var(--muted-foreground))">Neutral</text>
      </svg>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-20 pt-4">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl space-y-3">

        {/* ── Main nav tabs ─────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl overflow-hidden">
          <div className="flex border-b px-4 sm:px-6">
            {(["overview", "key-metrics", "contract-data"] as MainTab[]).map(t => (
              <button
                key={t}
                onClick={() => setMainTab(t)}
                className={`py-4 px-0 mr-6 text-sm font-bold border-b-2 transition-colors capitalize whitespace-nowrap ${
                  mainTab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════ OVERVIEW ════════════ */}
        {mainTab === "overview" && (
          <>
            {/* Stats bar */}
            <StatsBar />

            {/* Top movers panels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: "Top Gainers", rows: topGainers },
                { title: "Most Volume", rows: byVolume },
                { title: "Top Losers",  rows: topLosers },
              ].map(({ title, rows }) => (
                <div key={title} className="bg-card rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="text-sm font-bold text-foreground">{title}</span>
                    <button className="text-xs font-semibold text-primary">View all</button>
                  </div>
                  <div className="divide-y">
                    {rows.length === 0 && isLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 bg-muted rounded w-20" />
                              <div className="h-2.5 bg-muted rounded w-14" />
                            </div>
                            <div className="space-y-1.5">
                              <div className="h-3 bg-muted rounded w-16" />
                              <div className="h-2.5 bg-muted rounded w-10 ml-auto" />
                            </div>
                          </div>
                        ))
                      : rows.map((r, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => openCoin(r)}>
                            <CoinIcon symbol={r.base} address={r.address} className="w-8 h-8 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground leading-none truncate">{r.symbol}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{fmtVol(r.volume)}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-foreground tabular-nums">${fmtPrice(r.price)}</p>
                              <ChangePill pct={r.change} />
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Market table ─────────────────────────────────────────── */}
            <div className="bg-card rounded-xl overflow-hidden">

              {/* Toolbar */}
              <div className="px-4 sm:px-6 pt-4 pb-3 border-b space-y-3">
                {/* Market type tabs */}
                <div className="flex items-center gap-1">
                  {(["Spot", "Futures"] as MarketTab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => changeMarketTab(t)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                        marketTab === t ? "bg-primary text-black" : "text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Category filters + search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
                    {availableFilters.map(f => (
                      <button
                        key={f}
                        onClick={() => changeFilter(f)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap border transition-colors flex-shrink-0 ${
                          filter === f
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full sm:w-60 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search pair or coin…"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                      className="pl-9 h-9 bg-muted border-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Table — desktop */}
              <div className="overflow-x-auto hidden sm:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b">
                      <th className="px-4 py-3 w-10">#</th>
                      <th className="px-2 py-3 w-8"></th>
                      <th className="px-3 py-3">Coin</th>
                      <th className="px-3 py-3 text-right">
                        <span className="inline-flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("price")}>
                          Price <SortBtn col="price" active={sortKey} dir={sortDir} onClick={() => toggleSort("price")} />
                        </span>
                      </th>
                      <th className="px-3 py-3 text-right">
                        <span className="inline-flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("change")}>
                          24h % <SortBtn col="change" active={sortKey} dir={sortDir} onClick={() => toggleSort("change")} />
                        </span>
                      </th>
                      <th className="px-3 py-3 text-right hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("high")}>
                          24h High <SortBtn col="high" active={sortKey} dir={sortDir} onClick={() => toggleSort("high")} />
                        </span>
                      </th>
                      <th className="px-3 py-3 text-right hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("low")}>
                          24h Low <SortBtn col="low" active={sortKey} dir={sortDir} onClick={() => toggleSort("low")} />
                        </span>
                      </th>
                      <th className="px-3 py-3 text-right">
                        <span className="inline-flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("volume")}>
                          Volume <SortBtn col="volume" active={sortKey} dir={sortDir} onClick={() => toggleSort("volume")} />
                        </span>
                      </th>
                      <th className="px-3 py-3 hidden lg:table-cell">7d</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {isLoading && pageRows.length === 0
                      ? Array.from({ length: 12 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-4 py-4"><div className="h-3 bg-muted rounded w-4" /></td>
                            <td className="px-2 py-4"><div className="h-4 w-4 bg-muted rounded" /></td>
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                                <div className="space-y-1.5">
                                  <div className="h-3 bg-muted rounded w-24" />
                                  <div className="h-2.5 bg-muted rounded w-16" />
                                </div>
                              </div>
                            </td>
                            {Array.from({ length: 6 }).map((_, j) => (
                              <td key={j} className="px-3 py-4 text-right"><div className="h-3 bg-muted rounded w-16 ml-auto" /></td>
                            ))}
                            <td className="px-4 py-4"><div className="h-8 bg-muted rounded w-16 ml-auto" /></td>
                          </tr>
                        ))
                      : pageRows.map((row, i) => (
                          <tr key={row.symbol} className="group hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => openCoin(row)}>
                            <td className="px-4 py-3.5 text-sm font-semibold text-muted-foreground tabular-nums">
                              {(page - 1) * PER_PAGE + i + 1}
                            </td>
                            <td className="px-2 py-3.5">
                              <button
                                onClick={e => { e.stopPropagation(); toggleFav(row.symbol); }}
                                className="transition-colors"
                                aria-label={favorites.has(row.symbol) ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Star className={`h-4 w-4 ${favorites.has(row.symbol) ? "fill-primary text-primary" : "text-muted-foreground/30 hover:text-muted-foreground"}`} />
                              </button>
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <CoinIcon symbol={row.base} address={row.address} className="w-9 h-9 flex-shrink-0" />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-foreground">{row.symbol}</span>
                                    {row.isNew && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">New</span>
                                    )}
                                    {Math.abs(row.change) > 5 && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">Hot</span>
                                    )}
                                  </div>
                                  <div className="flex gap-1 mt-0.5 flex-wrap">
                                    {row.subTypes.slice(0, 2).map(st => (
                                      <span key={st} className="text-[9px] font-semibold px-1 py-0.5 rounded bg-muted text-muted-foreground">{st}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-right font-bold text-foreground text-sm tabular-nums">
                              ${fmtPrice(row.price)}
                            </td>
                            <td className="px-3 py-3.5 text-right">
                              <ChangePill pct={row.change} />
                            </td>
                            <td className="px-3 py-3.5 text-right text-sm text-muted-foreground hidden md:table-cell tabular-nums">
                              ${fmtPrice(row.high)}
                            </td>
                            <td className="px-3 py-3.5 text-right text-sm text-muted-foreground hidden md:table-cell tabular-nums">
                              ${fmtPrice(row.low)}
                            </td>
                            <td className="px-3 py-3.5 text-right text-sm font-semibold text-muted-foreground tabular-nums">
                              {fmtVol(row.volume)}
                            </td>
                            <td className="px-3 py-3.5 hidden lg:table-cell">
                              <Sparkline up={row.change >= 0} />
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-black font-bold text-xs h-8 px-4 rounded-lg"
                                onClick={e => { e.stopPropagation(); openCoin(row); }}
                              >
                                Trade
                              </Button>
                            </td>
                          </tr>
                        ))}
                    {!isLoading && pageRows.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-20 text-center text-muted-foreground font-medium">
                          No markets match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table — mobile cards */}
              <div className="sm:hidden divide-y">
                {isLoading && pageRows.length === 0
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-28" />
                          <div className="h-2.5 bg-muted rounded w-20" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded w-20" />
                          <div className="h-2.5 bg-muted rounded w-14 ml-auto" />
                        </div>
                      </div>
                    ))
                  : pageRows.map((row, i) => (
                      <div key={row.symbol} className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => openCoin(row)}>
                        <CoinIcon symbol={row.base} address={row.address} className="w-10 h-10 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-foreground">{row.symbol}</span>
                            {row.isNew && (
                              <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-blue-500/10 text-blue-500">New</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{fmtVol(row.volume)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-foreground tabular-nums">${fmtPrice(row.price)}</p>
                          <ChangePill pct={row.change} />
                        </div>
                        <div className="flex-shrink-0">
                          <Sparkline up={row.change >= 0} />
                        </div>
                      </div>
                    ))}
                {!isLoading && pageRows.length === 0 && (
                  <p className="py-16 text-center text-muted-foreground font-medium text-sm">
                    No markets match your search.
                  </p>
                )}
              </div>

              {/* Pagination */}
              {filteredRows.length > PER_PAGE && (
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t">
                  <span className="text-xs text-muted-foreground font-medium">
                    {filteredRows.length} markets · page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                      <Button
                        key={p}
                        variant={page === p ? "default" : "ghost"}
                        size="sm"
                        className={`h-8 w-8 rounded-lg font-bold text-xs ${page === p ? "bg-primary text-black hover:bg-primary/90" : ""}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════════ KEY METRICS ════════════ */}
        {mainTab === "key-metrics" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Market Sentiment", gauge: true },
                { label: "Market Cap",   value: "$3.36T", change: "-2.77%", red: true },
                { label: "24h Volume",   value: "$529.5B", change: "-25.65%", red: true },
                { label: "ETH Gas",      value: "0.039 Gwei", sub: "≈ $0.003" },
              ].map((m, i) => (
                <div key={i} className="bg-card rounded-xl p-5">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">{m.label}</p>
                  {m.gauge
                    ? <div className="flex flex-col items-center"><Gauge value={44} /></div>
                    : <>
                        <p className={`text-lg font-bold ${m.red ? "text-red-500" : "text-foreground"} mb-0.5`}>{m.value}</p>
                        {m.change && <p className="text-xs font-semibold text-red-400">{m.change}</p>}
                        {m.sub && <p className="text-xs text-muted-foreground">{m.sub}</p>}
                        {m.red && (
                          <div className="h-6 mt-3 w-full rounded overflow-hidden">
                            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                              <path d="M0,40 L20,35 L40,38 L60,25 L80,30 L100,20 L100,40 Z" fill="#FEE2E2" />
                              <path d="M0,40 L20,35 L40,38 L60,25 L80,30 L100,20" fill="none" stroke="#EF4444" strokeWidth="2" />
                            </svg>
                          </div>
                        )}
                      </>
                  }
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 space-y-3">
                <div className="bg-card rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground">Price Trend Distribution</h3>
                  </div>
                  <div className="flex h-3 w-full rounded-full overflow-hidden mb-4">
                    <div className="bg-red-500 h-full" style={{ width: "85%" }} />
                    <div className="bg-muted h-full" style={{ width: "5%" }} />
                    <div className="bg-green-500 h-full" style={{ width: "10%" }} />
                  </div>
                  <div className="grid grid-cols-3 text-center gap-2">
                    {[["429", "Down", "text-red-500"], ["16", "No Change", "text-foreground/70"], ["45", "Up", "text-green-500"]].map(([n, l, c]) => (
                      <div key={l}>
                        <p className={`text-xl font-bold ${c}`}>{n}</p>
                        <p className="text-xs text-muted-foreground font-semibold">{l}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-xl p-5">
                  <h3 className="font-bold text-foreground mb-4">Trending Sectors</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: "Privacy Coins", change: "+15.77%", coin: "ROSE", cp: "+39.92%" },
                      { name: "AI Tokens",     change: "+12.76%", coin: "ROSE", cp: "+39.92%" },
                      { name: "Pantera",       change: "+7.88%",  coin: "ROSE", cp: "+39.92%" },
                      { name: "Polychain",     change: "+7.86%",  coin: "ROSE", cp: "+39.92%" },
                      { name: "a16z",          change: "+7.51%",  coin: "ROSE", cp: "+39.92%" },
                      { name: "Rollups",       change: "+3.89%",  coin: "MINA", cp: "+7.44%" },
                      { name: "DeFi",          change: "+3.66%",  coin: "RPL",  cp: "+10.16%" },
                      { name: "Liquid Staking",change: "+3.48%",  coin: "RPL",  cp: "+10.16%" },
                    ].map((s, i) => (
                      <div key={i} className="p-3 bg-muted/50 rounded-xl hover:border-primary border border-transparent transition-colors cursor-pointer">
                        <p className="text-xs font-bold text-foreground/80 mb-1">{s.name}</p>
                        <p className="text-green-500 font-bold text-base">{s.change}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-muted-foreground font-semibold">{s.coin}</span>
                          <span className="text-[10px] text-green-500 font-bold">{s.cp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <h3 className="font-bold text-foreground">Top Movers</h3>
                </div>
                <div className="divide-y">
                  {topGainers.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => openCoin(r)}>
                      <div className="flex items-center gap-2.5">
                        <CoinIcon symbol={r.base} address={r.address} className="w-8 h-8" />
                        <div>
                          <p className="text-sm font-bold text-foreground leading-none">{r.symbol}</p>
                          <p className="text-[11px] text-muted-foreground">{fmtVol(r.volume)}</p>
                        </div>
                      </div>
                      <ChangePill pct={r.change} />
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t">
                  <Button className="w-full bg-primary text-black font-bold rounded-lg h-10">Trade Now</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ CONTRACT DATA ════════════ */}
        {mainTab === "contract-data" && (
          <div className="space-y-3">
            <div className="bg-card rounded-xl px-6 py-4 flex items-center gap-6">
              {["Perpetual", "Futures", "Options"].map(t => (
                <button
                  key={t}
                  className={`text-sm font-bold pb-1 border-b-2 transition-colors ${
                    t === "Perpetual" ? "text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="bg-card rounded-xl p-6 space-y-10">
              {["Open Interest", "Top 100 Trader Long/Short Ratio", "Active Trading Volume"].map((title, ci) => (
                <div key={ci}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-foreground">{title}</h4>
                    <select className="text-xs font-bold bg-muted border-none rounded-lg px-3 py-1.5 text-foreground">
                      {["5m", "15m", "1h"].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="h-52 w-full bg-muted/50 rounded-xl border flex flex-col justify-end p-4 overflow-hidden">
                    {/* SVG bar chart */}
                    <svg viewBox={`0 0 ${30 * 7} 80`} preserveAspectRatio="none" className="w-full h-full">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const h = 20 + Math.sin(i * 0.6) * 15 + Math.random() * 20;
                        return (
                          <rect
                            key={i}
                            x={i * 7 + 1}
                            y={80 - h}
                            width="5"
                            height={h}
                            rx="2"
                            fill={i % 3 === 0 ? "#B4F22E" : "hsl(var(--border))"}
                          />
                        );
                      })}
                    </svg>
                    <div className="flex justify-between text-[10px] font-semibold text-muted-foreground px-2 mt-2">
                      {["14:10", "14:40", "15:10", "15:40", "16:05"].map(t => <span key={t}>{t}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
