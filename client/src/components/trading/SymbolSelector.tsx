import { useState, useEffect, useMemo } from "react";
import { X, Search, Star, Loader2, Zap, Flame, TrendingUp, Bot, Globe, Tag, BarChart2 } from '@/lib/icons';
import { useQuery } from "@tanstack/react-query";
import { asterMarket, Ticker24h } from "@/lib/asterdex-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CoinIcon } from "./CoinIcon";
import { useFavorites } from "@/hooks/use-favorites";

const NEW_LISTING_DAYS = 60;

const FUTURES_FILTER_LABELS: Record<string, string> = {
  "All markets": "All markets",
  Top:           "Top",
  New:           "New",
  Meme:          "Meme",
  AI:            "AI",
  STOCK:         "Stocks",
  RWA:           "RWA",
  "pre-launch":  "Pre-launch",
};

const FUTURES_FILTER_ORDER = ["All markets", "Top", "New", "Meme", "AI", "STOCK", "RWA", "pre-launch"];
const SPOT_FILTERS         = ["All markets", "Rocket Launch", "Meme"];

type IconComp = React.ComponentType<{ className?: string }>;
const FILTER_ICONS: Record<string, IconComp | null> = {
  "All markets":   null,
  "Rocket Launch": Zap,
  "Meme":          Flame,
  "Top":           TrendingUp,
  "New":           Zap,
  "AI":            Bot,
  "Stocks":        BarChart2,
  "RWA":           Globe,
  "Pre-launch":    Tag,
};

const categories = ["Favorites", "Futures", "Spot"];

interface SymbolSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (symbol: string, category: string) => void;
  defaultCategory?: "Spot" | "Futures" | "Favorites";
  variant?: "fullscreen" | "dialog";
  initialSearch?: string;
}

function getBaseSymbol(displayPair: string): string {
  return displayPair.split("/")[0] ?? displayPair;
}

function toDisplayPair(symbol: string): string {
  const quotes = ["USDT", "USDC", "BTC", "ETH", "BNB", "BUSD", "USD1"];
  for (const q of quotes) {
    if (symbol.endsWith(q)) return symbol.slice(0, -q.length) + "/" + q;
  }
  return symbol;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return "$" + (v / 1_000_000_000).toFixed(2) + "B";
  if (v >= 1_000_000)     return "$" + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000)         return "$" + (v / 1_000).toFixed(1) + "K";
  return "$" + v.toFixed(2);
}

function formatChange(pct: string): string {
  const n = parseFloat(pct);
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

interface MarketRow {
  symbol:     string;
  base:       string;
  address:    string | undefined;
  volume:     string;
  rawVolume:  number;
  price:      string;
  change:     string;
  changePct:  number;
  subTypes:   string[];
  isNew:      boolean;
  hotTag:     boolean;
  negative:   boolean;
}

function buildRows(
  tickers: Ticker24h[],
  tag: "Spot" | "Futures",
  subTypeMap: Record<string, string[]>,
  newSet: Set<string>,
  addressMap: Record<string, string> = {},
): MarketRow[] {
  return tickers
    .filter(t => !t.symbol.includes("_"))
    .map(t => {
      const pct         = parseFloat(t.priceChangePercent);
      const displayPair = toDisplayPair(t.symbol);
      const base        = getBaseSymbol(displayPair);
      const subTypes    = subTypeMap[base] ?? [];
      return {
        symbol:    displayPair,
        base,
        address:   addressMap[base],
        volume:    formatVolume(parseFloat(t.quoteVolume)),
        rawVolume: parseFloat(t.quoteVolume),
        price:     parseFloat(t.lastPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }),
        change:    formatChange(t.priceChangePercent),
        changePct: pct,
        subTypes,
        isNew:     newSet.has(t.symbol),
        hotTag:    Math.abs(pct) > 2,
        negative:  pct < 0,
      };
    })
    .sort((a, b) => b.rawVolume - a.rawVolume);
}


const SymbolSelector = ({ open, onClose, onSelect, defaultCategory = "Spot", variant = "fullscreen", initialSearch = "" }: SymbolSelectorProps) => {
  const [search,         setSearch]         = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [activeFilter,   setActiveFilter]   = useState("All markets");
  const { toggle, isFavorite } = useFavorites();

  const { data: spotTickers,    isLoading: spotLoading }    = useQuery({
    queryKey: ["spot-tickers-all"],
    queryFn:  () => asterMarket.spotTicker(),
    enabled:  open && (activeCategory === "Spot" || search.length > 0),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: futuresTickers, isLoading: futuresLoading } = useQuery({
    queryKey: ["futures-tickers-all"],
    queryFn:  () => asterMarket.futuresTicker(),
    enabled:  open && (activeCategory === "Futures" || search.length > 0),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: spotExchangeInfo } = useQuery({
    queryKey: ["spot-exchange-info"],
    queryFn:  () => asterMarket.spotExchangeInfo(),
    enabled:  open,
    staleTime: 300_000,
  });

  const { data: futuresExchangeInfo } = useQuery({
    queryKey: ["futures-exchange-info"],
    queryFn:  () => asterMarket.futuresExchangeInfo(),
    enabled:  open,
    staleTime: 300_000,
  });

  const cutoff = useMemo(() => Date.now() - NEW_LISTING_DAYS * 24 * 60 * 60 * 1000, []);

  const futuresSubTypeMap: Record<string, string[]> = useMemo(() => {
    const symbols: any[] = futuresExchangeInfo?.symbols ?? [];
    const map: Record<string, string[]> = {};
    symbols.forEach(s => {
      const sub: string[] = (s.underlyingSubType ?? []).filter((t: string) => t !== "Commodities");
      if (sub.length) map[s.baseAsset] = sub;
    });
    return map;
  }, [futuresExchangeInfo]);

  const futuresMemeSet: Set<string> = useMemo(() => {
    const s = new Set<string>();
    Object.entries(futuresSubTypeMap).forEach(([base, types]) => {
      if (types.includes("Meme")) s.add(base);
    });
    return s;
  }, [futuresSubTypeMap]);

  const spotMemeSubTypeMap: Record<string, string[]> = useMemo(() => {
    const map: Record<string, string[]> = {};
    futuresMemeSet.forEach(base => {
      map[base] = ["Meme"];
      // Futures prefix "1000SHIB" → spot base "SHIB", "1000PEPE" → "PEPE" etc.
      if (/^\d+/.test(base)) map[base.replace(/^\d+/, "")] = ["Meme"];
    });
    return map;
  }, [futuresMemeSet]);

  const futuresNewSet: Set<string> = useMemo(() => {
    const s = new Set<string>();
    const symbols: any[] = futuresExchangeInfo?.symbols ?? [];
    symbols.forEach(sym => {
      if (sym.onboardDate && sym.onboardDate >= cutoff) s.add(sym.symbol);
    });
    return s;
  }, [futuresExchangeInfo, cutoff]);

  const spotNewSet: Set<string> = useMemo(() => {
    const s = new Set<string>();
    const symbols: any[] = spotExchangeInfo?.symbols ?? [];
    symbols.forEach(sym => {
      if (sym.listingTime && sym.listingTime >= cutoff) s.add(sym.symbol);
    });
    return s;
  }, [spotExchangeInfo, cutoff]);

  const presentFuturesSubTypes: string[] = useMemo(() => {
    const all = new Set<string>();
    Object.values(futuresSubTypeMap).forEach(arr => arr.forEach(s => all.add(s)));
    const hasNew = futuresNewSet.size > 0;
    return FUTURES_FILTER_ORDER.filter(f => {
      if (f === "All markets") return true;
      if (f === "New")         return hasNew;
      return all.has(f);
    });
  }, [futuresSubTypeMap, futuresNewSet]);

  const spotAddressMap: Record<string, string> = useMemo(() => {
    const symbols: any[] = spotExchangeInfo?.symbols ?? [];
    const map: Record<string, string> = {};
    symbols.forEach(s => { if (s.baseAssetAddress) map[s.baseAsset] = s.baseAssetAddress; });
    return map;
  }, [spotExchangeInfo]);

  const futuresAddressMap: Record<string, string> = useMemo(() => {
    const symbols: any[] = futuresExchangeInfo?.symbols ?? [];
    const map: Record<string, string> = {};
    symbols.forEach(s => { if (s.baseAssetAddress) map[s.baseAsset] = s.baseAssetAddress; });
    return map;
  }, [futuresExchangeInfo]);

  // Filter tickers to only symbols present in exchangeInfo — these are confirmed
  // listed pairs with real order books. Symbols that only appear in tickers
  // (pre-launch, suspended, index-only) are excluded. Falls back to showing all
  // tickers if exchangeInfo hasn't loaded yet (set size === 0).
  const spotExchangeSet: Set<string> = useMemo(() => {
    const symbols: any[] = spotExchangeInfo?.symbols ?? [];
    return new Set(symbols.map((s: any) => s.symbol));
  }, [spotExchangeInfo]);

  const futuresExchangeSet: Set<string> = useMemo(() => {
    const symbols: any[] = futuresExchangeInfo?.symbols ?? [];
    return new Set(symbols.map((s: any) => s.symbol));
  }, [futuresExchangeInfo]);

  const spotRows: MarketRow[] = useMemo(() =>
    Array.isArray(spotTickers)
      ? buildRows(
          spotTickers.filter((t: Ticker24h) => spotExchangeSet.size === 0 || spotExchangeSet.has(t.symbol)),
          "Spot", spotMemeSubTypeMap, spotNewSet, spotAddressMap,
        )
      : [],
    [spotTickers, spotExchangeSet, spotMemeSubTypeMap, spotNewSet, spotAddressMap],
  );

  const futuresRows: MarketRow[] = useMemo(() =>
    Array.isArray(futuresTickers)
      ? buildRows(
          futuresTickers.filter((t: Ticker24h) => futuresExchangeSet.size === 0 || futuresExchangeSet.has(t.symbol)),
          "Futures", futuresSubTypeMap, futuresNewSet, futuresAddressMap,
        )
      : [],
    [futuresTickers, futuresExchangeSet, futuresSubTypeMap, futuresNewSet, futuresAddressMap],
  );

  const isLoading = (activeCategory === "Spot" && spotLoading) ||
                    (activeCategory === "Futures" && futuresLoading);

  useEffect(() => {
    if (open) {
      setActiveCategory(defaultCategory);
      setSearch(initialSearch);
      setActiveFilter("All markets");
    }
  }, [open, defaultCategory, initialSearch]);

  const currentFilters = activeCategory === "Spot" ? SPOT_FILTERS : presentFuturesSubTypes.map(f => FUTURES_FILTER_LABELS[f] ?? f);

  const filtered: MarketRow[] = (() => {
    if (activeCategory === "Favorites") {
      const allRows = [...spotRows, ...futuresRows];
      const seen = new Set<string>();
      return allRows.filter(m => {
        if (!isFavorite(m.symbol) || seen.has(m.symbol)) return false;
        seen.add(m.symbol);
        return true;
      });
    }

    if (search.length > 0) {
      return [...spotRows, ...futuresRows].filter(m =>
        m.symbol.toLowerCase().includes(search.toLowerCase()),
      );
    }

    const base = activeCategory === "Spot" ? spotRows : futuresRows;

    if (activeFilter === "All markets") return base;

    // "Rocket Launch" = top gainers (coins up >3% in 24h), sorted biggest first
    if (activeFilter === "Rocket Launch")
      return base.filter(m => m.changePct > 3).sort((a, b) => b.changePct - a.changePct);

    if (activeFilter === "Meme") return base.filter(m => m.subTypes.includes("Meme"));

    if (activeFilter === "New" || activeFilter === FUTURES_FILTER_LABELS["New"])
      return base.filter(m => m.isNew);

    const rawFilter = Object.entries(FUTURES_FILTER_LABELS).find(([, v]) => v === activeFilter)?.[0] ?? activeFilter;
    return base.filter(m => m.subTypes.includes(rawFilter));
  })();

  const body = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <h2 className="text-foreground text-xl font-bold">Symbol</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded border border-border bg-secondary">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-4 px-4 pb-2 shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setActiveFilter("All markets"); }}
            className={`text-sm flex items-center gap-1 ${
              activeCategory === cat ? "text-foreground font-semibold" : "text-muted-foreground"
            }`}
          >
            {cat === "Favorites" && <Star className="w-3.5 h-3.5" />}
            {cat}
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar shrink-0">
        {currentFilters.map(f => {
          const Icon = FILTER_ICONS[f] ?? null;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded text-xs border transition-colors ${
                activeFilter === f
                  ? "border-trading-amber text-trading-amber bg-trading-amber/10"
                  : "border-border text-muted-foreground bg-transparent"
              }`}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {f}
            </button>
          );
        })}
      </div>

      {/* Column headers */}
      <div className="flex items-center px-4 pb-2 text-xs text-muted-foreground shrink-0">
        <span className="flex-1">Symbols</span>
        <span className="w-28 text-center">Volume</span>
        <span className="w-24 text-right">Price / 24h</span>
      </div>

      {/* Market list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex justify-center py-12 text-sm text-muted-foreground">
            {activeCategory === "Favorites"
              ? "No favorites yet"
              : `No ${activeFilter} markets found`}
          </div>
        ) : (
          filtered.map((m, idx) => (
            <button
              key={m.symbol + idx}
              onClick={() => { onSelect(m.symbol, activeCategory); onClose(); }}
              className="flex items-center w-full px-4 py-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={e => { e.stopPropagation(); toggle(m.symbol); }}
                  className="p-0.5 flex-shrink-0"
                  aria-label={isFavorite(m.symbol) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className={`w-4 h-4 transition-colors ${isFavorite(m.symbol) ? "fill-trading-amber text-trading-amber" : "text-muted-foreground"}`} />
                </button>
                <CoinIcon symbol={m.base} address={m.address} />
                <div className="flex flex-col items-start">
                  <span className="text-sm text-foreground font-medium">{m.symbol}</span>
                  <div className="flex gap-1 flex-wrap">
                    {m.hotTag && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-trading-amber/20 text-trading-amber">Hot</span>
                    )}
                    {m.isNew && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">New</span>
                    )}
                    {m.subTypes.filter(t => t !== "Commodities").map(st => (
                      <span key={st} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <span className="w-28 text-center text-sm text-foreground font-mono-num">
                {m.volume}
              </span>
              <div className="w-24 text-right">
                <div className="text-sm text-foreground font-mono-num">{m.price}</div>
                <div className={`text-xs font-mono-num ${m.negative ? "text-trading-red" : "text-trading-green"}`}>
                  {m.change}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="bg-background border-border flex flex-col max-w-2xl h-[80vh] p-0 gap-0 overflow-hidden [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Select Symbol</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {body}
    </div>
  );
};

export default SymbolSelector;
