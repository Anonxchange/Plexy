import { ChevronDown, LayoutGrid, Rows3, Rows4 } from "lucide-react";
import { useState } from "react";

const generateOrders = (basePrice: number, side: "ask" | "bid", count: number) => {
  const orders = [];

  const sizes = side === "ask"
    ? [997.85, 552.50, 4.77, 302.03, 101.06, 4.77, 109.08, 301.94, 562.58, 4.77, 577.07, 2.66]
    : [991.81, 166.65, 198.94, 5.31, 4.77, 301.67, 499.93, 301.63, 2.86, 4.77, 2.03, 859.98];

  const prices = side === "ask"
    ? [0.69743,0.69742,0.69741,0.69740,0.69738,0.69727,0.69725,0.69719,0.69712,0.69710,0.69709,0.69704]
    : [0.69683,0.69682,0.69676,0.69674,0.69660,0.69658,0.69657,0.69648,0.69647,0.69646,0.69645,0.69640];

  let cumulativeTotal = 0;

  for (let i = 0; i < count; i++) {
    const price = parseFloat(
      prices[i]?.toString() ||
      (basePrice + (i + 1) * 0.00001 * (side === "ask" ? 1 : -1)).toFixed(5)
    );

    const size = sizes[i] || Math.floor(Math.random() * 3000 + 500);
    const maxSize = 5500;

    cumulativeTotal += size;

    orders.push({
      price: price.toFixed(5),
      size: size >= 1000 ? (size / 1000).toFixed(2) + "K" : size.toFixed(2),
      total:
        cumulativeTotal >= 1000
          ? (cumulativeTotal / 1000).toFixed(2) + "K"
          : cumulativeTotal.toFixed(2),
      percent: Math.min((size / maxSize) * 100, 100),
    });
  }

  return side === "ask" ? orders.reverse() : orders;
};

const basePrice = 0.69699;

const DesktopOrderBook = () => {
  const [activeTab, setActiveTab] = useState("orderbook");
  const [viewMode, setViewMode] = useState<"grid" | "rows4" | "rows3">("grid");
  const [currency] = useState("USDT");
  const [tickSize] = useState("0.00001");

  const asks = generateOrders(basePrice, "ask", 12);
  const bids = generateOrders(basePrice, "bid", 12);

  const ViewModeButton = ({ mode, icon: Icon, isActive }: any) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex flex-col h-[500px] bg-background border-l border-border">

      {/* Header */}
      <div className="border-b border-border">

        {/* Tabs */}
        <div className="flex items-center gap-6 px-4 h-10 border-b border-border">
          <button
            onClick={() => setActiveTab("orderbook")}
            className={`text-xs font-medium pb-2 border-b-2 ${
              activeTab === "orderbook"
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent"
            }`}
          >
            Order book
          </button>

          <button
            onClick={() => setActiveTab("trades")}
            className={`text-xs font-medium pb-2 border-b-2 ${
              activeTab === "trades"
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent"
            }`}
          >
            Trades
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1">
            <ViewModeButton mode="grid" icon={LayoutGrid} isActive={viewMode === "grid"} />
            <ViewModeButton mode="rows4" icon={Rows4} isActive={viewMode === "rows4"} />
            <ViewModeButton mode="rows3" icon={Rows3} isActive={viewMode === "rows3"} />
          </div>

          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-muted rounded">
              {tickSize}
              <ChevronDown className="w-3 h-3" />
            </button>

            <button className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-muted rounded">
              {currency}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Orderbook */}
      {activeTab === "orderbook" && (
        <div className="flex flex-col">

          {/* Headers */}
          <div className="grid grid-cols-3 px-2.5 py-2 bg-muted/30 border-b text-xs text-muted-foreground">
            <div>Price</div>
            <div className="text-right">Size</div>
            <div className="text-right">Total</div>
          </div>

          {/* Asks */}
          {asks.map((order, i) => (
            <div
              key={`ask-${i}`}
              className="relative grid grid-cols-3 px-2.5 py-1 text-xs border-b border-border/30"
            >
              <div
                className="absolute inset-0 bg-red-500/5"
                style={{ width: `${order.percent}%`, marginLeft: "auto" }}
              />
              <span className="text-red-500 font-mono">{order.price}</span>
              <span className="text-right font-mono">{order.size}</span>
              <span className="text-right font-mono text-muted-foreground">{order.total}</span>
            </div>
          ))}

          {/* Mid price */}
          <div className="text-center py-2 border-y bg-muted/40">
            <div className="font-bold">{basePrice.toFixed(5)}</div>
            <div className="text-xs text-muted-foreground">${basePrice.toFixed(5)}</div>
          </div>

          {/* Bids */}
          {bids.map((order, i) => (
            <div
              key={`bid-${i}`}
              className="relative grid grid-cols-3 px-2.5 py-1 text-xs border-b border-border/30"
            >
              <div
                className="absolute inset-0 bg-green-500/5"
                style={{ width: `${order.percent}%`, marginLeft: "auto" }}
              />
              <span className="text-green-500 font-mono">{order.price}</span>
              <span className="text-right font-mono">{order.size}</span>
              <span className="text-right font-mono text-muted-foreground">{order.total}</span>
            </div>
          ))}

        </div>
      )}

      {activeTab === "trades" && (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No recent trades
        </div>
      )}
    </div>
  );
};

export default DesktopOrderBook;
