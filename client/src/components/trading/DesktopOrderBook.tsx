import { useState } from "react";
import { ChevronDown, LayoutGrid, Rows3, AlignJustify } from "lucide-react";

const generateOrders = (basePrice: number, side: "ask" | "bid", count: number) => {
  const orders = [];
  const askSizes = [997.85, 552.50, 4770, 302.03, 101.06, 4770, 199.08, 301.94, 562.58, 4770, 577.07, 2660];
  const bidSizes = [991.81, 166.65, 198.94, 5310, 4770, 301.67, 499.93, 301.63, 2860, 4770, 2030, 859.98];
  const sizes = side === "ask" ? askSizes : bidSizes;

  let cumulative = 0;
  const rawOrders = [];
  for (let i = 0; i < count; i++) {
    const offset = (i + 1) * 0.00001 * (side === "ask" ? 1 : -1);
    const price = basePrice + offset;
    const size = sizes[i % sizes.length];
    cumulative += size;
    rawOrders.push({ price, size, cumulative });
  }

  const maxCumulative = cumulative;
  const formatted = rawOrders.map((o) => ({
    price: o.price.toFixed(5),
    size: o.size >= 1000 ? (o.size / 1000).toFixed(2) + "K" : o.size.toFixed(2),
    total: o.cumulative >= 1000 ? (o.cumulative / 1000).toFixed(2) + "K" : o.cumulative.toFixed(2),
    percent: Math.min((o.cumulative / maxCumulative) * 100, 100),
  }));

  return side === "ask" ? formatted.reverse() : formatted;
};

const basePrice = 0.69699;
const asks = generateOrders(basePrice, "ask", 12);
const bids = generateOrders(basePrice, "bid", 12);

const DesktopOrderBook = () => {
  const [activeTab, setActiveTab] = useState<"orderbook" | "trades">("orderbook");
  const [viewMode, setViewMode] = useState<"both" | "bids" | "asks">("both");

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-4 px-3 pt-3 pb-2">
        <button
          onClick={() => setActiveTab("orderbook")}
          className={`text-sm font-medium transition-colors ${
            activeTab === "orderbook" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Order book
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={`text-sm font-medium transition-colors ${
            activeTab === "trades" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Trades
        </button>
      </div>

      {activeTab === "orderbook" ? (
        <>
          {/* Controls row */}
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("both")}
                className={`p-1 rounded transition-colors ${viewMode === "both" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("bids")}
                className={`p-1 rounded transition-colors ${viewMode === "bids" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Rows3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("asks")}
                className={`p-1 rounded transition-colors ${viewMode === "asks" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <AlignJustify className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-xs text-foreground font-mono-num">
                0.00001 <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1 text-xs text-foreground font-mono-num">
                USDT <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-3 px-3 py-1.5 text-[11px] text-muted-foreground">
            <span>Price (USDT)</span>
            <span className="text-right">Size (USDT)</span>
            <span className="text-right">Total (USDT)</span>
          </div>

          {/* Order book content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Asks */}
            {viewMode !== "bids" && (
              <div className={`flex flex-col overflow-y-auto ${viewMode === "both" ? "flex-1" : "flex-[2]"}`}>
                <div className="flex flex-col mt-auto">
                  {asks.map((order, i) => (
                    <div key={`ask-${i}`} className="relative grid grid-cols-3 px-3 py-[2.5px] text-xs">
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-trading-red/15"
                        style={{ width: `${order.percent}%` }}
                      />
                      <span className="relative font-mono-num text-trading-red">{order.price}</span>
                      <span className="relative font-mono-num text-foreground text-right">{order.size}</span>
                      <span className="relative font-mono-num text-foreground text-right">{order.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spread / current price */}
            <div className="flex items-center gap-3 px-3 py-2 border-y border-border/50">
              <span className="font-mono-num text-lg font-bold text-foreground">{basePrice.toFixed(5)}</span>
              <span className="text-xs text-muted-foreground">${basePrice.toFixed(5)}</span>
            </div>

            {/* Bids */}
            {viewMode !== "asks" && (
              <div className={`flex flex-col overflow-y-auto ${viewMode === "both" ? "flex-1" : "flex-[2]"}`}>
                {bids.map((order, i) => (
                  <div key={`bid-${i}`} className="relative grid grid-cols-3 px-3 py-[2.5px] text-xs">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-trading-green/15"
                      style={{ width: `${order.percent}%` }}
                    />
                    <span className="relative font-mono-num text-trading-green">{order.price}</span>
                    <span className="relative font-mono-num text-foreground text-right">{order.size}</span>
                    <span className="relative font-mono-num text-foreground text-right">{order.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Trades tab placeholder */
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Recent trades</span>
        </div>
      )}
    </div>
  );
};

export default DesktopOrderBook;
