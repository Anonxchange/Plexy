import { useState, useEffect, useRef } from "react";
import { ChevronDown, LayoutGrid, Rows3, AlignJustify } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { asterMarket } from "@/lib/asterdex-service";

interface OrderRow {
  price: string;
  size: string;
  percent: number;
}

interface PerpetualOrderBookProps {
  symbol: string;
}

const toSymbol = (pair: string) => pair.replace("/", "");

const PerpetualOrderBook = ({ symbol }: PerpetualOrderBookProps) => {
  const isMobile = useIsMobile();
  const count = isMobile ? 5 : 12;
  const [viewMode, setViewMode] = useState<"both" | "bids" | "asks">("both");
  const [sizeUnit, setSizeUnit] = useState<"USDT" | "ASTER">("USDT");
  const [sizeDropOpen, setSizeDropOpen] = useState(false);

  const [asks, setAsks] = useState<OrderRow[]>([]);
  const [bids, setBids] = useState<OrderRow[]>([]);
  const [midPrice, setMidPrice] = useState<string>("");
  const [fundingRate, setFundingRate] = useState<string>("—");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrderBook = async () => {
    try {
      // Valid AsterDEX limits: [5, 10, 20, 50, 100, 500, 1000]
      const validLimit = count <= 5 ? 10 : 20;
      const data = await asterMarket.futuresOrderBook(toSymbol(symbol), String(validLimit));
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
          price: parseFloat(p).toFixed(4),
          size: qty >= 1000 ? (qty / 1000).toFixed(2) + "K" : qty.toFixed(0),
          percent: Math.min((cumA / maxCum) * 100, 100),
        };
      }).reverse();

      let cumB = 0;
      const formattedBids: OrderRow[] = rawBids.slice(0, count).map(([p, q]: [string, string]) => {
        const qty = parseFloat(q);
        cumB += qty;
        return {
          price: parseFloat(p).toFixed(4),
          size: qty >= 1000 ? (qty / 1000).toFixed(2) + "K" : qty.toFixed(0),
          percent: Math.min((cumB / maxCum) * 100, 100),
        };
      });

      setAsks(formattedAsks);
      setBids(formattedBids);

      if (rawAsks[0] && rawBids[0]) {
        const mid = (parseFloat(rawAsks[0][0]) + parseFloat(rawBids[0][0])) / 2;
        setMidPrice(mid.toFixed(4));
      }
    } catch (_) {}
  };

  const fetchFundingRate = async () => {
    try {
      const data = await asterMarket.futuresFundingRate(toSymbol(symbol));
      const rate = Array.isArray(data) ? data[0]?.fundingRate : data?.fundingRate;
      if (rate !== undefined) {
        setFundingRate((parseFloat(rate) * 100).toFixed(4) + "%");
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchOrderBook();
    fetchFundingRate();
    intervalRef.current = setInterval(fetchOrderBook, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [symbol]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Funding rate header */}
      <div className="px-3 pt-3 pb-2 border-b border-border">
        <div className="text-[10px] text-muted-foreground mb-0.5">Funding Rate</div>
        <div className="font-mono-num text-xs text-foreground">
          <span className="text-trading-green">{fundingRate}</span>
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
                  <div className="absolute right-0 top-0 bottom-0 bg-trading-red/15" style={{ width: `${order.percent}%` }} />
                  <span className="relative font-mono-num text-trading-red">{order.price}</span>
                  <span className="relative font-mono-num text-foreground text-right">{order.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current price */}
        <div className="flex flex-col items-center py-2 border-y border-border/50">
          <span className="font-mono-num text-lg font-bold text-trading-green">{midPrice || "—"}</span>
          {midPrice && <span className="text-xs text-muted-foreground">${midPrice}</span>}
        </div>

        {/* Bids */}
        {viewMode !== "asks" && (
          <div className={`flex flex-col overflow-y-auto ${viewMode === "both" ? "flex-1" : "flex-[2]"}`}>
            {bids.map((order, i) => (
              <div key={`bid-${i}`} className="relative grid grid-cols-2 px-3 py-[3px] text-xs">
                <div className="absolute right-0 top-0 bottom-0 bg-trading-green/15" style={{ width: `${order.percent}%` }} />
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
