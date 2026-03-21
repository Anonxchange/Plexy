import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { asterMarket } from "@/lib/asterdex-service";

interface OrderRow {
  price: string;
  size: string;
  total: string;
  percent: number;
}

interface RecentTrade {
  price: string;
  qty: string;
  time: string;
  isBuy: boolean;
}

interface DesktopOrderBookProps {
  symbol: string;
}

const toSymbol = (pair: string) => pair.replace("/", "");

const ViewBothIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="2" width="6" height="5" rx="1" fill="currentColor" opacity="0.35" className="text-trading-red" style={{fill:"#ef4444",opacity:0.5}}/>
    <rect x="1" y="9" width="6" height="5" rx="1" fill="currentColor" opacity="0.35" className="text-trading-green" style={{fill:"#22c55e",opacity:0.5}}/>
    <rect x="9" y="2" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="5.5" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="9" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="12.5" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
  </svg>
);

const ViewBuysIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="2" width="6" height="12" rx="1" style={{fill:"#22c55e",opacity:0.5}}/>
    <rect x="9" y="2" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="5.5" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="9" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="12.5" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
  </svg>
);

const ViewSellsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="2" width="6" height="12" rx="1" style={{fill:"#ef4444",opacity:0.5}}/>
    <rect x="9" y="2" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="5.5" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="9" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="12.5" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
  </svg>
);

const DesktopOrderBook = ({ symbol }: DesktopOrderBookProps) => {
  const count = 14;
  const [activeTab, setActiveTab] = useState<"orderbook" | "trades">("orderbook");
  const [viewMode, setViewMode] = useState<"both" | "bids" | "asks">("both");
  const [asks, setAsks] = useState<OrderRow[]>([]);
  const [bids, setBids] = useState<OrderRow[]>([]);
  const [midPrice, setMidPrice] = useState<string>("");
  const [midChange, setMidChange] = useState<"up" | "down" | null>(null);
  const [spread, setSpread] = useState<string>("");
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevMidRef = useRef<number>(0);

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
        const bestAsk = parseFloat(rawAsks[0][0]);
        const bestBid = parseFloat(rawBids[0][0]);
        const mid = (bestAsk + bestBid) / 2;
        const spreadVal = bestAsk - bestBid;
        const spreadPct = ((spreadVal / bestAsk) * 100).toFixed(3);
        setSpread(`${spreadVal.toFixed(5)} (${spreadPct}%)`);

        setMidChange(mid > prevMidRef.current ? "up" : mid < prevMidRef.current ? "down" : null);
        prevMidRef.current = mid;
        setMidPrice(mid.toFixed(5));
      }
    } catch (_) {}
  };

  const fetchTrades = async () => {
    try {
      const data = await asterMarket.spotTrades(toSymbol(symbol), "20");
      if (!Array.isArray(data)) return;
      const trades: RecentTrade[] = data.map((t: any) => ({
        price: parseFloat(t.price).toFixed(5),
        qty: parseFloat(t.qty) >= 1000
          ? (parseFloat(t.qty) / 1000).toFixed(2) + "K"
          : parseFloat(t.qty).toFixed(2),
        time: new Date(t.time).toLocaleTimeString("en-US", { hour12: false }),
        isBuy: t.isBuyerMaker === false,
      }));
      setRecentTrades(trades);
    } catch (_) {}
  };

  useEffect(() => {
    fetchOrderBook();
    intervalRef.current = setInterval(fetchOrderBook, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [symbol]);

  useEffect(() => {
    if (activeTab === "trades") {
      fetchTrades();
      const t = setInterval(fetchTrades, 3000);
      return () => clearInterval(t);
    }
  }, [activeTab, symbol]);

  const quote = symbol.split("/")[1] || "USDT";
  const base = symbol.split("/")[0];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">

      {/* Tab header */}
      <div className="flex items-center gap-4 px-3 pt-2.5 pb-0 border-b border-border flex-shrink-0">
        <button
          onClick={() => setActiveTab("orderbook")}
          className={`pb-2 text-xs font-medium transition-colors border-b-2 ${
            activeTab === "orderbook"
              ? "text-foreground border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Order Book
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={`pb-2 text-xs font-medium transition-colors border-b-2 ${
            activeTab === "trades"
              ? "text-foreground border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Trades
        </button>
      </div>

      {activeTab === "orderbook" ? (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between px-2.5 py-1.5 flex-shrink-0">
            <div className="flex items-center gap-0.5">
              {([
                ["both", <ViewBothIcon />],
                ["bids", <ViewBuysIcon />],
                ["asks", <ViewSellsIcon />],
              ] as const).map(([mode, icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as "both" | "bids" | "asks")}
                  className={`p-1 rounded transition-colors ${viewMode === mode ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-0.5 text-[11px] text-muted-foreground font-mono-num hover:text-foreground transition-colors">
              0.00001 <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-3 px-2.5 py-1 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground">Price ({quote})</span>
            <span className="text-[10px] text-muted-foreground text-right">Qty ({base})</span>
            <span className="text-[10px] text-muted-foreground text-right">Total ({base})</span>
          </div>

          {/* Order rows */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

            {/* Asks */}
            {viewMode !== "bids" && (
              <div className={`flex flex-col overflow-hidden ${viewMode === "both" ? "flex-1" : "flex-[2]"}`}>
                <div className="flex flex-col justify-end h-full">
                  {asks.map((order, i) => (
                    <div key={`ask-${i}`} className="relative grid grid-cols-3 px-2.5 py-[2px] hover:bg-accent/20 transition-colors cursor-pointer">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-trading-red/12"
                        style={{ width: `${order.percent}%` }}
                      />
                      <span className="relative font-mono-num text-[11px] text-trading-red">{order.price}</span>
                      <span className="relative font-mono-num text-[11px] text-foreground text-right">{order.size}</span>
                      <span className="relative font-mono-num text-[11px] text-muted-foreground text-right">{order.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mid price + spread */}
            <div className="flex items-center justify-between px-2.5 py-1.5 border-y border-border/40 flex-shrink-0 bg-accent/10">
              <div className="flex items-center gap-1.5">
                <span className={`font-mono-num text-sm font-bold transition-colors ${
                  midChange === "up" ? "text-trading-green" : midChange === "down" ? "text-trading-red" : "text-foreground"
                }`}>
                  {midPrice || "—"}
                </span>
                {midChange === "up" && <span className="text-trading-green text-xs">▲</span>}
                {midChange === "down" && <span className="text-trading-red text-xs">▼</span>}
              </div>
              {spread && (
                <span className="text-[10px] text-muted-foreground font-mono-num">
                  {spread}
                </span>
              )}
            </div>

            {/* Bids */}
            {viewMode !== "asks" && (
              <div className={`flex flex-col overflow-hidden ${viewMode === "both" ? "flex-1" : "flex-[2]"}`}>
                {bids.map((order, i) => (
                  <div key={`bid-${i}`} className="relative grid grid-cols-3 px-2.5 py-[2px] hover:bg-accent/20 transition-colors cursor-pointer">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-trading-green/12"
                      style={{ width: `${order.percent}%` }}
                    />
                    <span className="relative font-mono-num text-[11px] text-trading-green">{order.price}</span>
                    <span className="relative font-mono-num text-[11px] text-foreground text-right">{order.size}</span>
                    <span className="relative font-mono-num text-[11px] text-muted-foreground text-right">{order.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Recent trades header */}
          <div className="grid grid-cols-3 px-2.5 py-2 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground">Price ({quote})</span>
            <span className="text-[10px] text-muted-foreground text-right">Qty ({base})</span>
            <span className="text-[10px] text-muted-foreground text-right">Time</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recentTrades.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                Loading trades…
              </div>
            ) : (
              recentTrades.map((trade, i) => (
                <div key={i} className="grid grid-cols-3 px-2.5 py-[2.5px] hover:bg-accent/20 transition-colors">
                  <span className={`font-mono-num text-[11px] ${trade.isBuy ? "text-trading-green" : "text-trading-red"}`}>
                    {trade.price}
                  </span>
                  <span className="font-mono-num text-[11px] text-foreground text-right">{trade.qty}</span>
                  <span className="font-mono-num text-[10px] text-muted-foreground text-right">{trade.time}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopOrderBook;
