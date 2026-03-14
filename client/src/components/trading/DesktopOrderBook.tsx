import { useState, useEffect, useRef } from "react";
import { ChevronDown, LayoutGrid, Rows3, AlignJustify } from "lucide-react";
import { asterMarket } from "@/lib/asterdex-service";

interface OrderRow {
  price: string;
  size: string;
  total: string;
  percent: number;
}

interface DesktopOrderBookProps {
  symbol: string;
}

const toSymbol = (pair: string) => pair.replace("/", "");

const DesktopOrderBook = ({ symbol }: DesktopOrderBookProps) => {
  const count = 12;
  const [activeTab, setActiveTab] = useState<"orderbook" | "trades">("orderbook");
  const [viewMode, setViewMode] = useState<"both" | "bids" | "asks">("both");
  const [asks, setAsks] = useState<OrderRow[]>([]);
  const [bids, setBids] = useState<OrderRow[]>([]);
  const [midPrice, setMidPrice] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrderBook = async () => {
    try {
      const data = await asterMarket.spotOrderBook(toSymbol(symbol), "20");
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
    <div className="flex flex-col h-full bg-background overflow-hidden">
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

          <div className="grid grid-cols-3 px-3 py-1.5 text-[11px] text-muted-foreground">
            <span>Price (USDT)</span>
            <span className="text-right">Size (USDT)</span>
            <span className="text-right">Total (USDT)</span>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {viewMode !== "bids" && (
              <div className={`flex flex-col overflow-y-auto ${viewMode === "both" ? "flex-1" : "flex-[2]"}`}>
                <div className="flex flex-col mt-auto">
                  {asks.map((order, i) => (
                    <div key={`ask-${i}`} className="relative grid grid-cols-3 px-3 py-[2.5px] text-xs">
                      <div className="absolute right-0 top-0 bottom-0 bg-trading-red/15" style={{ width: `${order.percent}%` }} />
                      <span className="relative font-mono-num text-trading-red">{order.price}</span>
                      <span className="relative font-mono-num text-foreground text-right">{order.size}</span>
                      <span className="relative font-mono-num text-foreground text-right">{order.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 px-3 py-2 border-y border-border/50">
              <span className="font-mono-num text-lg font-bold text-foreground">{midPrice || "—"}</span>
              {midPrice && <span className="text-xs text-muted-foreground">${midPrice}</span>}
            </div>

            {viewMode !== "asks" && (
              <div className={`flex flex-col overflow-y-auto ${viewMode === "both" ? "flex-1" : "flex-[2]"}`}>
                {bids.map((order, i) => (
                  <div key={`bid-${i}`} className="relative grid grid-cols-3 px-3 py-[2.5px] text-xs">
                    <div className="absolute right-0 top-0 bottom-0 bg-trading-green/15" style={{ width: `${order.percent}%` }} />
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
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Recent trades</span>
        </div>
      )}
    </div>
  );
};

export default DesktopOrderBook;
