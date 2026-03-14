import { useState, useEffect } from "react";
import { X, Search, Star, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { asterMarket, Ticker24h } from "@/lib/asterdex-service";

const categories = ["Favorites", "Futures", "Spot"];
const filters = ["All markets", "Rocket Launch", "Meme"];

interface SymbolSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  defaultCategory?: "Spot" | "Futures" | "Favorites";
}

function toDisplayPair(symbol: string): string {
  const quotes = ["USDT", "USDC", "BTC", "ETH", "BNB", "BUSD", "USD1"];
  for (const q of quotes) {
    if (symbol.endsWith(q)) {
      return symbol.slice(0, -q.length) + "/" + q;
    }
  }
  return symbol;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return "$" + (v / 1_000_000_000).toFixed(2) + "B";
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return "$" + (v / 1_000).toFixed(1) + "K";
  return "$" + v.toFixed(2);
}

function formatChange(pct: string): string {
  const n = parseFloat(pct);
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

interface MarketRow {
  symbol: string;
  volume: string;
  price: string;
  change: string;
  tags: string[];
  negative: boolean;
}

function tickersToRows(tickers: Ticker24h[], tag: "Spot" | "Futures"): MarketRow[] {
  return tickers
    .filter(t => !t.symbol.startsWith("TEST"))
    .map(t => {
      const pct = parseFloat(t.priceChangePercent);
      return {
        symbol: toDisplayPair(t.symbol),
        volume: formatVolume(parseFloat(t.quoteVolume)),
        price: parseFloat(t.lastPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }),
        change: formatChange(t.priceChangePercent),
        tags: [tag, Math.abs(pct) > 2 ? "Hot" : ""].filter(Boolean),
        negative: pct < 0,
      };
    })
    .sort((a, b) => parseFloat(b.volume.replace(/[^0-9.]/g, "")) - parseFloat(a.volume.replace(/[^0-9.]/g, "")));
}

const SymbolSelector = ({ open, onClose, onSelect, defaultCategory = "Spot" }: SymbolSelectorProps) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [activeFilter, setActiveFilter] = useState("All markets");

  const { data: spotTickers, isLoading: spotLoading } = useQuery({
    queryKey: ["spot-tickers-all"],
    queryFn: () => asterMarket.spotTicker(),
    enabled: open && (activeCategory === "Spot" || search.length > 0),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: futuresTickers, isLoading: futuresLoading } = useQuery({
    queryKey: ["futures-tickers-all"],
    queryFn: () => asterMarket.futuresTicker(),
    enabled: open && (activeCategory === "Futures" || search.length > 0),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const spotRows: MarketRow[] = Array.isArray(spotTickers) ? tickersToRows(spotTickers, "Spot") : [];
  const futuresRows: MarketRow[] = Array.isArray(futuresTickers) ? tickersToRows(futuresTickers, "Futures") : [];

  const allRows = [...spotRows, ...futuresRows];

  const isLoading = (activeCategory === "Spot" && spotLoading) || (activeCategory === "Futures" && futuresLoading);

  useEffect(() => {
    if (open) {
      setActiveCategory(defaultCategory);
      setSearch("");
    }
  }, [open, defaultCategory]);

  if (!open) return null;

  const filtered = allRows.filter((m) => {
    const matchesSearch = search.length > 0
      ? m.symbol.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesCategory =
      activeCategory === "Favorites"
        ? false
        : search.length > 0
        ? true
        : m.tags.includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-4 px-4 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-sm flex items-center gap-1 ${
              activeCategory === cat
                ? "text-foreground font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {cat === "Favorites" && <Star className="w-3.5 h-3.5" />}
            {cat}
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 px-4 pb-3">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 rounded text-xs border ${
              activeFilter === f
                ? "border-foreground text-foreground bg-secondary"
                : "border-border text-muted-foreground bg-transparent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="flex items-center px-4 pb-2 text-xs text-muted-foreground">
        <span className="flex-1">Symbols</span>
        <span className="w-28 text-center">Volume</span>
        <span className="w-24 text-right">Price{"\n"}24h change</span>
      </div>

      {/* Market list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex justify-center py-12 text-sm text-muted-foreground">
            {activeCategory === "Favorites" ? "No favorites yet" : "No markets found"}
          </div>
        ) : (
          filtered.map((m, idx) => (
            <button
              key={m.symbol + idx}
              onClick={() => {
                onSelect(m.symbol);
                onClose();
              }}
              className="flex items-center w-full px-4 py-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Star className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{m.symbol.charAt(0)}</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm text-foreground font-medium">{m.symbol}</span>
                  <div className="flex gap-1">
                    {m.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          tag === "Hot"
                            ? "bg-trading-amber/20 text-trading-amber"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {tag}
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
