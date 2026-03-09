import { useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";

const generateOrders = (basePrice: number, side: "ask" | "bid", count: number) => {
  const orders = [];
  const sizes = side === "ask"
    ? [93.04, 634.41, 1140, 1430, 2020, 2560, 3260, 3560, 997, 4770, 302, 577]
    : [19.94, 564.67, 1260, 1270, 1720, 2300, 5170, 991, 166, 198, 5310, 4770];

  for (let i = 0; i < count; i++) {
    const offset = (i + 1) * 0.00001 * (side === "ask" ? 1 : -1);
    const price = basePrice + offset;
    const size = sizes[i] || Math.floor(Math.random() * 3000 + 500);
    const maxSize = 5500;
    orders.push({
      price: parseFloat(price.toFixed(5)),
      priceStr: price.toFixed(5),
      size: size >= 1000 ? (size / 1000).toFixed(2) + "K" : size.toFixed(2),
      sizeRaw: size,
      totalUsdt: (price * size).toFixed(2),
      percent: Math.min((size / maxSize) * 100, 100),
    });
  }
  return side === "ask" ? orders.reverse() : orders;
};

const basePrice = 0.68270;
const asks = generateOrders(basePrice, "ask", 12);
const bids = generateOrders(basePrice, "bid", 12);

const OrderBook = () => {
  const [activeTab, setActiveTab] = useState("orderbook");

  return (
    <div className="flex flex-col bg-background h-full">
      {/* Header with tabs and grid icon */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("orderbook")}
            className={`text-sm transition-colors ${
              activeTab === "orderbook"
                ? "text-foreground font-semibold"
                : "text-muted-foreground"
            }`}
          >
            Order book
          </button>
          <button
            onClick={() => setActiveTab("trades")}
            className={`text-sm transition-colors ${
              activeTab === "trades"
                ? "text-foreground font-semibold"
                : "text-muted-foreground"
            }`}
          >
            Trades
          </button>
        </div>
        <LayoutGrid className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Order book content */}
      {activeTab === "orderbook" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs text-muted-foreground border-b border-border sticky top-0 bg-background">
            <div className="text-right">Price (USDT)</div>
            <div className="text-right">Size</div>
            <div className="text-right flex items-center justify-end gap-1">
              <span>Total USDT</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {/* Asks (sells) - red */}
          <div className="flex flex-col overflow-y-auto">
            {asks.map((order, i) => (
              <div
                key={`ask-${i}`}
                className="relative grid grid-cols-3 gap-2 px-3 py-[6px] text-xs hover:bg-secondary/50 transition-colors"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-trading-red/10"
                  style={{ width: `${order.percent}%` }}
                />
                <span className="relative font-mono-num text-trading-red text-right">
                  {order.priceStr}
                </span>
                <span className="relative font-mono-num text-foreground text-right">
                  {order.size}
                </span>
                <span className="relative font-mono-num text-muted-foreground text-right">
                  {order.totalUsdt}
                </span>
              </div>
            ))}
          </div>

          {/* Spread / current price */}
          <div className="flex flex-col items-center justify-center py-3 border-y border-border bg-secondary/30">
            <span className="font-mono-num text-lg font-bold text-foreground">
              {basePrice.toFixed(5)}
            </span>
            <span className="text-xs text-muted-foreground">${basePrice.toFixed(4)}</span>
          </div>

          {/* Bids (buys) - green */}
          <div className="flex flex-col overflow-y-auto">
            {bids.map((order, i) => (
              <div
                key={`bid-${i}`}
                className="relative grid grid-cols-3 gap-2 px-3 py-[6px] text-xs hover:bg-secondary/50 transition-colors"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-trading-green/10"
                  style={{ width: `${order.percent}%` }}
                />
                <span className="relative font-mono-num text-trading-green text-right">
                  {order.priceStr}
                </span>
                <span className="relative font-mono-num text-foreground text-right">
                  {order.size}
                </span>
                <span className="relative font-mono-num text-muted-foreground text-right">
                  {order.totalUsdt}
                </span>
              </div>
            ))}
          </div>

          {/* Tick size footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-background">
            <span className="text-xs text-muted-foreground">Tick size</span>
            <button className="flex items-center gap-1 text-xs text-foreground font-mono-num hover:text-accent transition-colors">
              0.00001 <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Trades tab placeholder */}
      {activeTab === "trades" && (
        <div className="flex items-center justify-center flex-1">
          <span className="text-sm text-muted-foreground">No trades yet</span>
        </div>
      )}
    </div>
  );
};

export default OrderBook;
