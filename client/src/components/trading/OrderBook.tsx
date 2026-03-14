import { useState, useEffect, useRef } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { asterMarket } from "@/lib/asterdex-service";

interface OrderRow {
  price: string;
  size: string;
  total: string;
  percent: number;
}

interface OrderBookProps {
  symbol: string;
}

const toSymbol = (pair: string) => pair.replace("/", "");

const OrderBook = ({ symbol }: OrderBookProps) => {
  const isMobile = useIsMobile();
  const count = isMobile ? 6 : 12;

  const [asks, setAsks] = useState<OrderRow[]>([]);
  const [bids, setBids] = useState<OrderRow[]>([]);
  const [midPrice, setMidPrice] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrderBook = async () => {
    try {
      // Valid AsterDEX limits: [5, 10, 20, 50, 100, 500, 1000]
      const validLimit = count <= 5 ? 10 : 20;
      const data = await asterMarket.spotOrderBook(toSymbol(symbol), String(validLimit));
      if (!data?.bids || !data?.asks) return;

      const rawAsks: [string, string][] = data.asks;
      const rawBids: [string, string][] = data.bids;

      const maxCum = Math.max(
        rawAsks.slice(0, count).reduce((s: number, [, q]: [string, string]) => s + parseFloat(q), 0),
        rawBids.slice(0, count).reduce((s: number, [, q]: [string, string]) => s + parseFloat(q), 0),
      );

      let cumA = 0;
      const formattedAsks: OrderRow[] = rawAsks.slice(0, count).map(([p, q]: [string, string]) => {
        const qty = parseFloat(q);
        cumA += qty;
        return {
          price: parseFloat(p).toFixed(5),
          size: qty >= 1000 ? (qty / 1000).toFixed(2) + "K" : qty.toFixed(2),
          total: cumA >= 1000 ? (cumA / 1000).toFixed(2) + "K" : cumA.toFixed(2),
          percent: Math.min((cumA / maxCum) * 100, 100),
        };
      }).reverse();

      let cumB = 0;
      const formattedBids: OrderRow[] = rawBids.slice(0, count).map(([p, q]: [string, string]) => {
        const qty = parseFloat(q);
        cumB += qty;
        return {
          price: parseFloat(p).toFixed(5),
          size: qty >= 1000 ? (qty / 1000).toFixed(2) + "K" : qty.toFixed(2),
          total: cumB >= 1000 ? (cumB / 1000).toFixed(2) + "K" : cumB.toFixed(2),
          percent: Math.min((cumB / maxCum) * 100, 100),
        };
      });

      setAsks(formattedAsks);
      setBids(formattedBids);

      if (rawAsks[0] && rawBids[0]) {
        const mid = (parseFloat(rawAsks[0][0]) + parseFloat(rawBids[0][0])) / 2;
        setMidPrice(mid.toFixed(5));
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchOrderBook();
    intervalRef.current = setInterval(fetchOrderBook, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [symbol]);

  return (
    <div className="flex flex-col bg-background">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Order Book</span>
        </div>
        <button className="flex items-center gap-1 text-xs text-muted-foreground font-mono-num">
          0.00001 <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 px-3 pb-1 text-[10px] text-muted-foreground">
        <span>Price (USDT)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {asks.map((order, i) => (
        <div key={`ask-${i}`} className="relative grid grid-cols-3 px-3 py-[2.5px] text-[11px]">
          <div className="absolute right-0 top-0 bottom-0 bg-trading-red/15" style={{ width: `${order.percent}%` }} />
          <span className="relative font-mono-num text-trading-red">{order.price}</span>
          <span className="relative font-mono-num text-foreground text-right">{order.size}</span>
          <span className="relative font-mono-num text-foreground text-right">{order.total}</span>
        </div>
      ))}

      <div className="flex items-center gap-2 px-3 py-1.5 border-y border-border/50">
        <span className="font-mono-num text-sm font-bold text-foreground">{midPrice || "—"}</span>
        {midPrice && <span className="text-[10px] text-muted-foreground">${midPrice}</span>}
      </div>

      {bids.map((order, i) => (
        <div key={`bid-${i}`} className="relative grid grid-cols-3 px-3 py-[2.5px] text-[11px]">
          <div className="absolute right-0 top-0 bottom-0 bg-trading-green/15" style={{ width: `${order.percent}%` }} />
          <span className="relative font-mono-num text-trading-green">{order.price}</span>
          <span className="relative font-mono-num text-foreground text-right">{order.size}</span>
          <span className="relative font-mono-num text-foreground text-right">{order.total}</span>
        </div>
      ))}
    </div>
  );
};

export default OrderBook;
