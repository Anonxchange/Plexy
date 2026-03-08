import { useState } from "react";
import { X, Search, Star } from "lucide-react";

const categories = ["Favorites", "Futures", "Spot"];
const filters = ["All markets", "Rocket Launch", "Meme"];

const markets = [
  { symbol: "ASTER/USDT", volume: "$6,095,720", price: "0.68570", change: "-1.25%", tags: ["Spot", "Hot"], negative: true },
  { symbol: "BTC/USDT", volume: "$1,742,315", price: "67,139.25", change: "-1.02%", tags: ["Spot", "Hot"], negative: true },
  { symbol: "ETH/USDT", volume: "$1,675,335", price: "1,941.02", change: "-2.04%", tags: ["Spot", "Hot"], negative: true },
  { symbol: "CMC20/USDT", volume: "$65,887", price: "137.501", change: "-1.03%", tags: ["Spot"], negative: true },
  { symbol: "USD1/USDT", volume: "$32,229", price: "0.9995", change: "-0.04%", tags: ["Spot"], negative: true },
  { symbol: "BNB/USDT", volume: "$186,359", price: "614.07", change: "-1.72%", tags: ["Spot"], negative: true },
  { symbol: "USDC/USDT", volume: "$288,446", price: "0.9999", change: "+0.00%", tags: ["Spot"], negative: false },
  { symbol: "B/USD1", volume: "$58,287", price: "0.20715", change: "-2.55%", tags: ["Spot"], negative: true },
];

interface SymbolSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
}

const SymbolSelector = ({ open, onClose, onSelect }: SymbolSelectorProps) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Spot");
  const [activeFilter, setActiveFilter] = useState("All markets");

  if (!open) return null;

  const filtered = markets.filter((m) =>
    m.symbol.toLowerCase().includes(search.toLowerCase())
  );

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
        <span className="w-24 text-right">Price<br />24h change</span>
      </div>

      {/* Market list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((m) => (
          <button
            key={m.symbol}
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
        ))}
      </div>
    </div>
  );
};

export default SymbolSelector;
