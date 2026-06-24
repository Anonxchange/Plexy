import { useState, useEffect, useRef } from "react";
import { ChevronDown } from '@/lib/icons';
import { asterMarket } from "@/lib/asterdex-service";

interface OrderRow { price: string; size: string; total: string; percent: number; }
interface RecentTrade { price: string; qty: string; time: string; isBuy: boolean; }
interface DesktopOrderBookProps { symbol: string; mode?: "spot" | "futures"; }

const toApiSym = (pair: string) => pair.replace("/", "");

const ViewBothIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="2" width="6" height="5" rx="1" style={{fill:"#ef4444",opacity:0.5}}/>
    <rect x="1" y="9" width="6" height="5" rx="1" style={{fill:"#22c55e",opacity:0.5}}/>
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

const DesktopOrderBook = ({ symbol, mode = "spot" }: DesktopOrderBookProps) => {
  const count = 11;
  const [activeTab, setActiveTab] = useState<"orderbook"|"trades">("orderbook");
  const [viewMode,  setViewMode]  = useState<"both"|"bids"|"asks">("both");
  const [asks,      setAsks]      = useState<OrderRow[]>([]);
  const [bids,      setBids]      = useState<OrderRow[]>([]);
  const [midPrice,  setMid]       = useState("");
  const [midChange, setChange]    = useState<"up"|"down"|null>(null);
  const [spread,    setSpread]    = useState("");
  const [trades,    setTrades]    = useState<RecentTrade[]>([]);

  const depthLoopRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const tradeLoopRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const prevMidRef   = useRef(0);

  const quote = symbol.split("/")[1] || "USDT";
  const base  = symbol.split("/")[0];

  /* ── Depth loop ── */
  useEffect(() => {
    let cancelled = false;
    setAsks([]); setBids([]); setMid(""); setChange(null); setSpread(""); prevMidRef.current = 0;

    const loop = async () => {
      if (cancelled) return;
      try {
        const data = mode === "futures"
          ? await asterMarket.futuresOrderBook(toApiSym(symbol), "20")
          : await asterMarket.spotOrderBook(toApiSym(symbol), "20");

        if (!cancelled && data?.bids && data?.asks) {
          const rawAsks: [string,string][] = data.asks;
          const rawBids: [string,string][] = data.bids;
          const maxQty = Math.max(
            ...rawAsks.slice(0,count).map(([,q]:[string,string]) => parseFloat(q)),
            ...rawBids.slice(0,count).map(([,q]:[string,string]) => parseFloat(q)),
            1,
          );
          let cumA = 0;
          setAsks(rawAsks.slice(0,count).map(([p,q]:[string,string]) => {
            const qty = parseFloat(q); cumA += qty;
            return { price: parseFloat(p).toFixed(5), size: qty>=1000?(qty/1000).toFixed(2)+"K":qty.toFixed(2), total: cumA>=1000?(cumA/1000).toFixed(2)+"K":cumA.toFixed(2), percent: Math.min((qty/maxQty)*100,100) };
          }).reverse());
          let cumB = 0;
          setBids(rawBids.slice(0,count).map(([p,q]:[string,string]) => {
            const qty = parseFloat(q); cumB += qty;
            return { price: parseFloat(p).toFixed(5), size: qty>=1000?(qty/1000).toFixed(2)+"K":qty.toFixed(2), total: cumB>=1000?(cumB/1000).toFixed(2)+"K":cumB.toFixed(2), percent: Math.min((qty/maxQty)*100,100) };
          }));
          if (rawAsks[0] && rawBids[0]) {
            const bA = parseFloat(rawAsks[0][0]), bB = parseFloat(rawBids[0][0]);
            const mid = (bA+bB)/2, spr = bA-bB;
            setSpread(`${spr.toFixed(5)} (${((spr/bA)*100).toFixed(3)}%)`);
            setChange(mid > prevMidRef.current ? "up" : mid < prevMidRef.current ? "down" : null);
            prevMidRef.current = mid;
            setMid(mid.toFixed(5));
          }
        }
      } catch (_) {}
      if (!cancelled) depthLoopRef.current = setTimeout(loop, 150);
    };

    loop();
    return () => {
      cancelled = true;
      if (depthLoopRef.current) { clearTimeout(depthLoopRef.current); depthLoopRef.current = null; }
    };
  }, [symbol, mode]);

  /* ── Trades loop ── */
  useEffect(() => {
    if (activeTab !== "trades") return;
    let cancelled = false;
    setTrades([]);

    const loop = async () => {
      if (cancelled) return;
      try {
        const data = mode === "futures"
          ? await asterMarket.futuresTrades(toApiSym(symbol), "20")
          : await asterMarket.spotTrades(toApiSym(symbol), "20");
        if (!cancelled && Array.isArray(data)) {
          setTrades(data.map((t:any) => ({
            price: parseFloat(t.price).toFixed(5),
            qty: parseFloat(t.qty)>=1000?(parseFloat(t.qty)/1000).toFixed(2)+"K":parseFloat(t.qty).toFixed(2),
            time: new Date(t.time).toLocaleTimeString("en-US",{hour12:false}),
            isBuy: t.isBuyerMaker === false,
          })));
        }
      } catch (_) {}
      if (!cancelled) tradeLoopRef.current = setTimeout(loop, 500);
    };

    loop();
    return () => {
      cancelled = true;
      if (tradeLoopRef.current) { clearTimeout(tradeLoopRef.current); tradeLoopRef.current = null; }
    };
  }, [activeTab, symbol, mode]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center gap-4 px-3 pt-2.5 pb-0 border-b border-border flex-shrink-0">
        {(["orderbook","trades"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-2 text-xs font-medium transition-colors border-b-2 ${activeTab===tab ? "text-foreground border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            {tab === "orderbook" ? "Order Book" : "Trades"}
          </button>
        ))}
      </div>

      {activeTab === "orderbook" ? (
        <>
          <div className="flex items-center justify-between px-2.5 py-1.5 flex-shrink-0">
            <div className="flex items-center gap-0.5">
              {([["both",<ViewBothIcon/>],["bids",<ViewBuysIcon/>],["asks",<ViewSellsIcon/>]] as const).map(([vm,icon]) => (
                <button key={vm} onClick={() => setViewMode(vm as any)}
                  className={`p-1 rounded transition-colors ${viewMode===vm ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {icon}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-0.5 text-[11px] text-muted-foreground font-mono-num hover:text-foreground transition-colors">
              0.00001 <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 px-2.5 py-1 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground">Price ({quote})</span>
            <span className="text-[10px] text-muted-foreground text-right">Qty ({base})</span>
            <span className="text-[10px] text-muted-foreground text-right">Total ({base})</span>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {viewMode !== "bids" && (
              <div className={`flex flex-col overflow-hidden ${viewMode==="both" ? "flex-1" : "flex-[2]"}`}>
                <div className="flex flex-col justify-end h-full">
                  {asks.map((o,i) => (
                    <div key={`a${i}`} className="relative grid grid-cols-3 px-2.5 py-[2px] hover:bg-accent/20 cursor-pointer">
                      <div className="absolute right-0 top-0 bottom-0 bg-trading-red/15" style={{width:`${o.percent}%`}}/>
                      <span className="relative font-mono-num text-[11px] text-trading-red">{o.price}</span>
                      <span className="relative font-mono-num text-[11px] text-foreground text-right">{o.size}</span>
                      <span className="relative font-mono-num text-[11px] text-muted-foreground text-right">{o.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-2.5 py-1.5 border-y border-border/40 flex-shrink-0 bg-accent/10">
              <div className="flex items-center gap-1.5">
                <span className={`font-mono-num text-sm font-bold transition-colors ${midChange==="up" ? "text-trading-green" : midChange==="down" ? "text-trading-red" : "text-foreground"}`}>
                  {midPrice || "—"}
                </span>
                {midChange==="up"   && <span className="text-trading-green text-xs">▲</span>}
                {midChange==="down" && <span className="text-trading-red   text-xs">▼</span>}
              </div>
              {spread && <span className="text-[10px] text-muted-foreground font-mono-num">{spread}</span>}
            </div>

            {viewMode !== "asks" && (
              <div className={`flex flex-col overflow-hidden ${viewMode==="both" ? "flex-1" : "flex-[2]"}`}>
                {bids.map((o,i) => (
                  <div key={`b${i}`} className="relative grid grid-cols-3 px-2.5 py-[2px] hover:bg-accent/20 cursor-pointer">
                    <div className="absolute left-0 top-0 bottom-0 bg-trading-green/15" style={{width:`${o.percent}%`}}/>
                    <span className="relative font-mono-num text-[11px] text-trading-green">{o.price}</span>
                    <span className="relative font-mono-num text-[11px] text-foreground text-right">{o.size}</span>
                    <span className="relative font-mono-num text-[11px] text-muted-foreground text-right">{o.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 px-2.5 py-2 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground">Price ({quote})</span>
            <span className="text-[10px] text-muted-foreground text-right">Qty ({base})</span>
            <span className="text-[10px] text-muted-foreground text-right">Time</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {trades.length === 0
              ? <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading trades…</div>
              : trades.map((t,i) => (
                <div key={i} className="grid grid-cols-3 px-2.5 py-[2.5px] hover:bg-accent/20">
                  <span className={`font-mono-num text-[11px] ${t.isBuy ? "text-trading-green" : "text-trading-red"}`}>{t.price}</span>
                  <span className="font-mono-num text-[11px] text-foreground text-right">{t.qty}</span>
                  <span className="font-mono-num text-[10px] text-muted-foreground text-right">{t.time}</span>
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopOrderBook;
