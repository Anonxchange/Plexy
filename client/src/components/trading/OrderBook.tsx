import { ChevronDown, LayoutGrid } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
      price: price.toFixed(5),
      size: size >= 1000 ? (size / 1000).toFixed(2) + "K" : size.toFixed(2),
      sizeRaw: size,
      percent: Math.min((size / maxSize) * 100, 100),
    });
  }
  return side === "ask" ? orders.reverse() : orders;
};

const basePrice = 0.68270;

const OrderBook = () => {
  const isMobile = useIsMobile();
  const count = isMobile ? 6 : 12;
  const asks = generateOrders(basePrice, "ask", count);
  const bids = generateOrders(basePrice, "bid", count);

  return (
    <div className="flex flex-col bg-background">
      {/* Column headers */}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
        <span>Price<br />(USDT)</span>
        <div className="flex items-center gap-1">
          <span>Size<br />(USDT)</span>
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      {/* Asks (sells) - red */}
      <div className="flex flex-col">
        {asks.map((order, i) => (
          <div key={`ask-${i}`} className="relative flex items-center justify-between px-3 py-[3px] text-xs">
            <div
              className="absolute right-0 top-0 bottom-0 bg-trading-red/15"
              style={{ width: `${order.percent}%` }}
            />
            <span className="relative font-mono-num text-trading-red">{order.price}</span>
            <span className="relative font-mono-num text-foreground">{order.size}</span>
          </div>
        ))}
      </div>

      {/* Spread / current price */}
      <div className="flex flex-col items-center py-2">
        <span className="font-mono-num text-lg font-bold text-foreground">{basePrice.toFixed(5)}</span>
        <span className="text-xs text-muted-foreground">${basePrice.toFixed(4)}</span>
      </div>

      {/* Bids (buys) - green */}
      <div className="flex flex-col">
        {bids.map((order, i) => (
          <div key={`bid-${i}`} className="relative flex items-center justify-between px-3 py-[3px] text-xs">
            <div
              className="absolute right-0 top-0 bottom-0 bg-trading-green/15"
              style={{ width: `${order.percent}%` }}
            />
            <span className="relative font-mono-num text-trading-green">{order.price}</span>
            <span className="relative font-mono-num text-foreground">{order.size}</span>
          </div>
        ))}
      </div>

      {/* Tick size */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border">
        <LayoutGrid className="w-4 h-4 text-muted-foreground" />
        <button className="flex items-center gap-1 text-xs text-foreground font-mono-num">
          0.00001 <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default OrderBook;
