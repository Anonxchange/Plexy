import { useState, useEffect, useMemo } from "react";
import { X, Search, Star, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { asterMarket, Ticker24h } from "@/lib/asterdex-service";

const ICON_BASE = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color";

const SUBTYPE_LABELS: Record<string, string> = {
  Top:          "⭐ Top",
  Meme:         "🐸 Meme",
  AI:           "🤖 AI",
  STOCK:        "📈 Stocks",
  RWA:          "🏆 RWA",
  Commodities:  "🏆 RWA",
  "pre-launch": "🚀 Pre-launch",
};

const FILTER_ORDER = ["All markets", "Rocket Launch", "Top", "Meme", "AI", "STOCK", "RWA", "pre-launch"];

const categories = ["Favorites", "Futures", "Spot"];

interface SymbolSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  defaultCategory?: "Spot" | "Futures" | "Favorites";
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
  volume:     string;
  rawVolume:  number;
  price:      string;
  change:     string;
  changePct:  number;
  subTypes:   string[];
  tags:       string[];
  negative:   boolean;
}

function buildRows(
  tickers: Ticker24h[],
  tag: "Spot" | "Futures",
  subTypeMap: Record<string, string[]>,
): MarketRow[] {
  return tickers
    .filter(t => !t.symbol.startsWith("TEST"))
    .map(t => {
      const pct        = parseFloat(t.priceChangePercent);
      const displayPair = toDisplayPair(t.symbol);
      const base        = getBaseSymbol(displayPair);
      const subTypes    = subTypeMap[base] ?? [];
      const badgeTags: string[] = [];
      if (Math.abs(pct) > 2) badgeTags.push("Hot");
      return {
        symbol:    displayPair,
        base,
        volume:    formatVolume(parseFloat(t.quoteVolume)),
        rawVolume: parseFloat(t.quoteVolume),
        price:     parseFloat(t.lastPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }),
        change:    formatChange(t.priceChangePercent),
        changePct: pct,
        subTypes,
        tags:      [tag, ...badgeTags],
        negative:  pct < 0,
      };
    })
    .sort((a, b) => b.rawVolume - a.rawVolume);
}

function CoinIcon({ symbol }: { symbol: string }) {
  const [errored, setErrored] = useState(false);
  const src = `${ICON_BASE}/${symbol.toLowerCase()}.svg`;
  if (errored) {
    return (
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-muted-foreground">{symbol.slice(0, 2)}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={symbol}
      className="w-8 h-8 rounded-full flex-shrink-0 bg-secondary"
      onError={() => setErrored(true)}
    />
  );
}

const SymbolSelector = ({ open, onClose, onSelect, defaultCategory = "Spot" }: SymbolSelectorProps) => {
  const [search,         setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [activeFilter,   setActiveFilter]   = useState("All markets");

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

  const { data: futuresExchangeInfo } = useQuery({
    queryKey: ["futures-exchange-info"],
    queryFn:  () => asterMarket.futuresExchangeInfo(),
    enabled:  open,
    staleTime: 300_000,
  });

  const subTypeMap: Record<string, string[]> = useMemo(() => {
    const symbols: any[] = futuresExchangeInfo?.symbols ?? [];
    const map: Record<string, string[]> = {};
    symbols.forEach(s => {
      const base: string = s.baseAsset;
      const sub: string[] = (s.underlyingSubType ?? []).filter(
        (t: string) => t !== "Commodities"
      );
      if (sub.length) map[base] = sub;
    });
    return map;
  }, [futuresExchangeInfo]);

  const presentSubTypes: string[] = useMemo(() => {
    const all = new Set<string>();
    Object.values(subTypeMap).forEach(arr => arr.forEach(s => all.add(s)));
    return FILTER_ORDER.filter(f => f !== "All markets" && f !== "Rocket Launch" && all.has(f));
  }, [subTypeMap]);

  const filters = useMemo(
    () => ["All markets", "Rocket Launch", ...presentSubTypes],
    [presentSubTypes],
  );

  const spotRows:    MarketRow[] = useMemo(() =>
    Array.isArray(spotTickers)    ? buildRows(spotTickers,    "Spot",    subTypeMap) : [],
    [spotTickers, subTypeMap],
  );
  const futuresRows: MarketRow[] = useMemo(() =>
    Array.isArray(futuresTickers) ? buildRows(futuresTickers, "Futures", subTypeMap) : [],
    [futuresTickers, subTypeMap],
  );

  const isLoading = (activeCategory === "Spot" && spotLoading) ||
                    (activeCategory === "Futures" && futuresLoading);

  useEffect(() => {
    if (open) {
      setActiveCategory(defaultCategory);
      setSearch("");
      setActiveFilter("All markets");
    }
  }, [open, defaultCategory]);

  if (!open) return null;

  const filtered: MarketRow[] = (() => {
    if (activeCategory === "Favorites") return [];

    if (search.length > 0) {
      return [...spotRows, ...futuresRows].filter(m =>
        m.symbol.toLowerCase().includes(search.toLowerCase()),
      );
    }

    const base = activeCategory === "Spot" ? spotRows : futuresRows;

    if (activeFilter === "All markets") return base;

    if (activeFilter === "Rocket Launch") {
      return [...base]
        .filter(m => m.changePct > 0)
        .sort((a, b) => b.changePct - a.changePct)
        .slice(0, 30);
    }

    return base.filter(m => m.subTypes.includes(activeFilter));
  })();

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        <h2 className="text-foreground text-xl font-bold">Symbol</h2>
        <button onClick={onClose} className="text-muted-foreground">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
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
      <div className="flex items-center gap-4 px-4 pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
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
      <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`shrink-0 px-3 py-1 rounded text-xs border transition-colors ${
              activeFilter === f
                ? "border-trading-amber text-trading-amber bg-trading-amber/10"
                : "border-border text-muted-foreground bg-transparent"
            }`}
          >
            {f === "Rocket Launch" ? "🚀 Rocket Launch" : (SUBTYPE_LABELS[f] ?? f)}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="flex items-center px-4 pb-2 text-xs text-muted-foreground">
        <span className="flex-1">Symbols</span>
        <span className="w-28 text-center">Volume</span>
        <span className="w-24 text-right">Price / 24h</span>
      </div>

      {/* Market list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex justify-center py-12 text-sm text-muted-foreground">
            {activeCategory === "Favorites"
              ? "No favorites yet"
              : activeFilter === "Rocket Launch"
              ? "No top gainers right now"
              : `No ${activeFilter} markets found`}
          </div>
        ) : (
          filtered.map((m, idx) => (
            <button
              key={m.symbol + idx}
              onClick={() => { onSelect(m.symbol); onClose(); }}
              className="flex items-center w-full px-4 py-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Star className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <CoinIcon symbol={m.base} />
                <div className="flex flex-col items-start">
                  <span className="text-sm text-foreground font-medium">{m.symbol}</span>
                  <div className="flex gap-1 flex-wrap">
                    {m.tags.filter(t => t !== "Spot" && t !== "Futures").map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-trading-amber/20 text-trading-amber"
                      >
                        {tag}
                      </span>
                    ))}
                    {m.subTypes.map(st => (
                      <span
                        key={st}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                      >
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
    </div>
  );
};

export default SymbolSelector;
