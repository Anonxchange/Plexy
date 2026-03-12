import { useState } from "react";
import { ChevronDown, LayoutGrid, Rows3, AlignJustify } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const generateOrders = (basePrice: number, side: "ask" | "bid", count: number) => {
  const askSizes = [40770, 69140, 38040, 26240, 34180, 21500, 48200, 17600, 29800, 55100, 12300, 43700];
  const bidSizes = [2990, 9220, 28300, 46030, 42790, 35600, 18400, 61200, 24500, 37800, 52100, 14800];
  const sizes = side === "ask" ? askSizes : bidSizes;

  let cumulative = 0;
  const rawOrders = [];
  for (let i = 0; i < count; i++) {
    const offset = (i + 1) * 0.0001 * (side === "ask" ? 1 : -1);
    const price = basePrice + offset;
    const size = sizes[i % sizes.length];
    cumulative += size;
    rawOrders.push({ price, size, cumulative });
  }

  const maxCumulative = cumulative;
  const formatted = rawOrders.map((o) => ({
    price: o.price.toFixed(4),
    size: o.size >= 1000 ? (o.size / 1000).toFixed(2) + "K" : o.size.toFixed(0),
    percent: Math.min((o.cumulative / maxCumulative) * 100, 100),
  }));

  return side === "ask" ? formatted.reverse() : formatted;
};

const basePrice = 0.7027;

const PerpetualOrderBook = () => {
  const isMobile = useIsMobile();
  const count = isMobile ? 5 : 12;
  const [viewMode, setViewMode] = useState<"both" | "bids" | "asks">("both");
  const [sizeUnit, setSizeUnit] = useState<"USDT" | "ASTER">("USDT");
  const [sizeDropOpen, setSizeDropOpen] = useState(false);
  const asks = generateOrders(basePrice, "ask", count);
  const bids = generateOrders(basePrice, "bid", count);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Funding rate header */}
      <div className="px-3 pt-3 pb-2 border-b border-border">
        <div className="text-[10px] text-muted-foreground mb-0.5">Funding (4h) / Countdown</div>
        <div className="font-mono-num text-xs text-foreground">
          <span className="text-trading-green">0.0008%</span>
          <span className="text-muted-foreground"> / </span>
          <span>00:42:17</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-2 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span>Price<br />(USDT)</span>
        <div className="flex items-center justify-end gap-1 relative">
          <span>Size</span>
          <button
            onClick={() => setSizeDropOpen(!sizeDropOpen)}
            className="flex items-center gap-0.5 text-muted-foreground"
          >
            ({sizeUnit}) <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {sizeDropOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 rounded border border-border bg-secondary shadow-lg min-w-[70px]">
              {["USDT", "ASTER"].map((u) => (
                <button
                  key={u}
                  onClick={() => { setSizeUnit(u as "USDT" | "ASTER"); setSizeDropOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${sizeUnit === u ? "text-trading-green" : "text-foreground hover:bg-accent"}`}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order book rows */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Asks */}
        {viewMode !== "bids" && (
          <div className={`flex flex-col overflow-y-auto ${viewMode === "both" ? "flex-1" : "flex-[2]"}`}>
            <div className="flex flex-col mt-auto">
              {asks.map((order, i) => (
                <div key={`ask-${i}`} className="relative grid grid-cols-2 px-3 py-[3px] text-xs">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-trading-red/15"
                    style={{ width: `${order.percent}%` }}
                  />
                  <span className="relative font-mono-num text-trading-red">{order.price}</span>
                  <span className="relative font-mono-num text-foreground text-right">{order.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current price */}
        <div className="flex flex-col items-center py-2 border-y border-border/50">
          <span className="font-mono-num text-lg font-bold text-trading-green">{basePrice.toFixed(4)}</span>
          <span className="text-xs text-muted-foreground">${basePrice.toFixed(4)}</span>
        </div>

        {/* Bids */}
        {viewMode !== "asks" && (
          <div className={`flex flex-col overflow-y-auto ${viewMode === "both" ? "flex-1" : "flex-[2]"}`}>
            {bids.map((order, i) => (
              <div key={`bid-${i}`} className="relative grid grid-cols-2 px-3 py-[3px] text-xs">
                <div
                  className="absolute right-0 top-0 bottom-0 bg-trading-green/15"
                  style={{ width: `${order.percent}%` }}
                />
                <span className="relative font-mono-num text-trading-green">{order.price}</span>
                <span className="relative font-mono-num text-foreground text-right">{order.size}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar — view toggle + tick size */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode("both")}
            className={`p-1 rounded transition-colors ${viewMode === "both" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("bids")}
            className={`p-1 rounded transition-colors ${viewMode === "bids" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Rows3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("asks")}
            className={`p-1 rounded transition-colors ${viewMode === "asks" ? "text-trading-red" : "text-muted-foreground hover:text-foreground"}`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>
        <button className="flex items-center gap-1 text-xs text-foreground font-mono-num">
          0.0001 <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default PerpetualOrderBook;
