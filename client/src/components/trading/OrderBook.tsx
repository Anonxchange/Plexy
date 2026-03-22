import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { asterMarket } from "@/lib/asterdex-service";
import { useQuery } from "@tanstack/react-query";

const TICK_OPTIONS = ["0.01", "0.1", "1", "10"];

interface OrderRow {
  price: string;
  rawPrice: number;
  size: string;
  percent: number;
}

interface OrderBookProps {
  symbol: string;
  mode?: "spot" | "futures";
  count?: number;
}

const toSymbol = (pair: string) => pair.replace("/", "");

const fmtPrice = (n: number): string => {
  const decimals = n >= 10000 ? 1 : n >= 100 ? 2 : n >= 1 ? 4 : 6;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const fmtSize = (qty: number): string =>
  qty >= 1000 ? (qty / 1000).toFixed(2) + "K" : qty.toFixed(2);

const fmtCountdown = (ms: number): string => {
  if (ms <= 0) return "00:00:00";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const OrderBook = ({ symbol, mode = "spot", count: countProp }: OrderBookProps) => {
  const isMobile = useIsMobile();
  const count = countProp ?? (isMobile ? 6 : 12);

  const [asks, setAsks] = useState<OrderRow[]>([]);
  const [bids, setBids] = useState<OrderRow[]>([]);
  const [midPrice, setMidPrice] = useState<string>("");
  const [midRaw, setMidRaw] = useState<number>(0);
  const [tickSize, setTickSize] = useState("0.1");
  const [tickOpen, setTickOpen] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<HTMLDivElement>(null);

  const apiSymbol = toSymbol(symbol);

  const { data: fundingData } = useQuery({
    queryKey: ["funding-rate", apiSymbol],
    queryFn: () => asterMarket.futuresFundingRate(apiSymbol),
    enabled: mode === "futures" && isMobile,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const fundingEntry = Array.isArray(fundingData) ? fundingData[0] : fundingData;
  const fundingRate = fundingEntry?.fundingRate
    ? (parseFloat(fundingEntry.fundingRate) * 100).toFixed(4) + "%"
    : "—";
  const fundingTime: number = fundingEntry?.fundingTime ?? 0;

  useEffect(() => {
    if (!fundingTime || mode !== "futures" || !isMobile) return;
    const tick = () => setCountdown(fmtCountdown(fundingTime - Date.now()));
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [fundingTime, mode, isMobile]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tickRef.current && !tickRef.current.contains(e.target as Node)) {
        setTickOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOrderBook = async () => {
    try {
      const validLimit = count <= 5 ? 10 : 20;
      const data = mode === "futures"
        ? await asterMarket.futuresOrderBook(toSymbol(symbol), String(validLimit))
        : await asterMarket.spotOrderBook(toSymbol(symbol), String(validLimit));
      if (!data?.bids || !data?.asks) return;

      const rawAsks: [string, string][] = data.asks;
      const rawBids: [string, string][] = data.bids;

      const maxQty = Math.max(
        ...rawAsks.slice(0, count).map(([, q]: [string, string]) => parseFloat(q)),
        ...rawBids.slice(0, count).map(([, q]: [string, string]) => parseFloat(q)),
      );

      const formattedAsks: OrderRow[] = rawAsks.slice(0, count).map(([p, q]: [string, string]) => {
        const qty = parseFloat(q);
        const price = parseFloat(p);
        return {
          price: fmtPrice(price),
          rawPrice: price,
          size: fmtSize(qty),
          percent: Math.min((qty / maxQty) * 100, 100),
        };
      }).reverse();

      const formattedBids: OrderRow[] = rawBids.slice(0, count).map(([p, q]: [string, string]) => {
        const qty = parseFloat(q);
        const price = parseFloat(p);
        return {
          price: fmtPrice(price),
          rawPrice: price,
          size: fmtSize(qty),
          percent: Math.min((qty / maxQty) * 100, 100),
        };
      });

      setAsks(formattedAsks);
      setBids(formattedBids);

      if (rawAsks[0] && rawBids[0]) {
        const bestAsk = parseFloat(rawAsks[0][0]);
        const bestBid = parseFloat(rawBids[0][0]);
        const mid = (bestAsk + bestBid) / 2;
        setMidRaw(mid);
        setMidPrice(fmtPrice(mid));
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchOrderBook();
    intervalRef.current = setInterval(fetchOrderBook, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [symbol, mode]);

  const quote = symbol.split("/")[1] || "USDT";

  return (
    <div className="flex flex-col bg-background h-full select-none">

      {/* Funding / Countdown — futures mobile only */}
      {mode === "futures" && isMobile && (
        <div className="px-2 pt-1 pb-0.5 flex-shrink-0">
          <span className="text-[9px] text-muted-foreground leading-none block">Funding (8h) / Countdown</span>
          <span className="text-[10px] font-mono-num text-foreground leading-none font-medium">
            {fundingRate} / {countdown || "—"}
          </span>
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center justify-between px-2 pt-1 pb-0.5 flex-shrink-0">
        <span className="text-[9px] text-muted-foreground leading-none">Price ({quote})</span>
        <button className="flex items-center gap-0.5 text-[9px] text-muted-foreground leading-none">
          Size ({quote}) <ChevronDown className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Asks */}
      <div className="flex flex-col flex-shrink-0">
        {asks.map((order, i) => (
          <div key={`ask-${i}`} className="relative flex items-center justify-between px-2 py-[3px]">
            <div
              className="absolute right-0 top-0 bottom-0 bg-trading-red/10"
              style={{ width: `${order.percent}%` }}
            />
            <span className="relative font-mono-num text-[11px] font-medium text-trading-red leading-tight">
              {order.price}
            </span>
            <span className="relative font-mono-num text-[11px] text-muted-foreground leading-tight">
              {order.size}
            </span>
          </div>
        ))}
      </div>

      {/* Mid price */}
      <div className="flex flex-col px-2 py-1 border-y border-border/40 flex-shrink-0">
        <span className="font-mono-num text-[13px] font-bold text-foreground leading-tight">
          {midPrice || "—"}
        </span>
        {midRaw > 0 && (
          <span className="font-mono-num text-[9px] text-muted-foreground leading-tight">
            ${fmtPrice(midRaw)}
          </span>
        )}
      </div>

      {/* Bids */}
      <div className="flex flex-col flex-shrink-0">
        {bids.map((order, i) => (
          <div key={`bid-${i}`} className="relative flex items-center justify-between px-2 py-[3px]">
            <div
              className="absolute right-0 top-0 bottom-0 bg-trading-green/10"
              style={{ width: `${order.percent}%` }}
            />
            <span className="relative font-mono-num text-[11px] font-medium text-trading-green leading-tight">
              {order.price}
            </span>
            <span className="relative font-mono-num text-[11px] text-muted-foreground leading-tight">
              {order.size}
            </span>
          </div>
        ))}
      </div>

      {/* Tick size selector */}
      <div className="flex items-center justify-between px-2 py-1 border-t border-border/40 flex-shrink-0 relative mt-auto" ref={tickRef}>
        <div className="grid grid-cols-2 gap-0.5 opacity-60">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-1.5 h-1 rounded-[1px] ${i < 2 ? "bg-trading-red" : "bg-trading-green"}`} />
          ))}
        </div>
        <button
          onClick={() => setTickOpen((o) => !o)}
          className="flex items-center gap-0.5 text-[10px] text-foreground font-mono-num hover:text-muted-foreground transition-colors"
        >
          {tickSize}
          <ChevronDown className={`w-2.5 h-2.5 text-muted-foreground transition-transform ${tickOpen ? "rotate-180" : ""}`} />
        </button>
        {tickOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 rounded-md border border-border bg-popover shadow-lg overflow-hidden min-w-[70px]">
            {TICK_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => { setTickSize(opt); setTickOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[11px] font-mono-num transition-colors ${
                  tickSize === opt ? "text-trading-green bg-trading-green/5" : "text-foreground hover:bg-accent"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderBook;
