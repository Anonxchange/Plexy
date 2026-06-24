import { useState, useEffect, useRef } from "react";
import { ChevronDown } from '@/lib/icons';
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

const toApiSym = (pair: string) => pair.replace("/", "");

const fmtPrice = (n: number): string => {
  const d = n >= 10000 ? 1 : n >= 100 ? 2 : n >= 1 ? 4 : 6;
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
};

const fmtSize = (qty: number): string =>
  qty >= 1000 ? (qty / 1000).toFixed(2) + "K" : qty.toFixed(2);

const fmtCountdown = (ms: number): string => {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
};

const OrderBook = ({ symbol, mode = "spot", count: countProp }: OrderBookProps) => {
  const isMobile = useIsMobile();
  const count = countProp ?? (isMobile ? 15 : 12);

  const [asks, setAsks]       = useState<OrderRow[]>([]);
  const [bids, setBids]       = useState<OrderRow[]>([]);
  const [midPrice, setMid]    = useState("");
  const [midRaw, setMidRaw]   = useState(0);
  const [tickSize, setTick]   = useState("0.1");
  const [tickOpen, setTickO]  = useState(false);
  const [countdown, setCd]    = useState("");

  const loopRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef      = useRef<HTMLDivElement>(null);

  const apiSymbol = toApiSym(symbol);

  const { data: markPriceData } = useQuery({
    queryKey: ["mark-price", apiSymbol],
    queryFn: () => asterMarket.futuresMarkPrice(apiSymbol),
    enabled: mode === "futures",
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const fundingEntry = Array.isArray(markPriceData) ? markPriceData[0] : markPriceData;
  const fundingRate  = fundingEntry?.lastFundingRate
    ? (parseFloat(fundingEntry.lastFundingRate) * 100).toFixed(4) + "%"
    : "—";
  const nextFundingTime: number = fundingEntry?.nextFundingTime
    ? parseInt(fundingEntry.nextFundingTime) : 0;

  useEffect(() => {
    if (!nextFundingTime || mode !== "futures") return;
    const tick = () => setCd(fmtCountdown(nextFundingTime - Date.now()));
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [nextFundingTime, mode]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tickRef.current && !tickRef.current.contains(e.target as Node)) setTickO(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Main polling loop — one `cancelled` flag per mount/symbol change ── */
  useEffect(() => {
    let cancelled = false;

    setAsks([]); setBids([]); setMid(""); setMidRaw(0);

    const limit = String(count <= 5 ? 10 : 20);

    const loop = async () => {
      if (cancelled) return;

      try {
        const data = mode === "futures"
          ? await asterMarket.futuresOrderBook(toApiSym(symbol), limit)
          : await asterMarket.spotOrderBook(toApiSym(symbol), limit);

        if (!cancelled && data?.bids && data?.asks) {
          const rawAsks: [string, string][] = data.asks;
          const rawBids: [string, string][] = data.bids;

          const maxQty = Math.max(
            ...rawAsks.slice(0, count).map(([, q]: [string,string]) => parseFloat(q)),
            ...rawBids.slice(0, count).map(([, q]: [string,string]) => parseFloat(q)),
            1,
          );

          setAsks(rawAsks.slice(0, count).map(([p, q]: [string,string]) => {
            const qty = parseFloat(q), price = parseFloat(p);
            return { price: fmtPrice(price), rawPrice: price, size: fmtSize(qty), percent: Math.min((qty/maxQty)*100, 100) };
          }).reverse());

          setBids(rawBids.slice(0, count).map(([p, q]: [string,string]) => {
            const qty = parseFloat(q), price = parseFloat(p);
            return { price: fmtPrice(price), rawPrice: price, size: fmtSize(qty), percent: Math.min((qty/maxQty)*100, 100) };
          }));

          if (rawAsks[0] && rawBids[0]) {
            const mid = (parseFloat(rawAsks[0][0]) + parseFloat(rawBids[0][0])) / 2;
            setMidRaw(mid);
            setMid(fmtPrice(mid));
          }
        }
      } catch (_) {}

      if (!cancelled) {
        loopRef.current = setTimeout(loop, 150);
      }
    };

    loop();

    return () => {
      cancelled = true;
      if (loopRef.current) { clearTimeout(loopRef.current); loopRef.current = null; }
    };
  }, [symbol, mode]);

  const quote = symbol.split("/")[1] || "USDT";

  return (
    <div className="flex flex-col bg-background h-full select-none">

      {mode === "futures" && isMobile && (
        <div className="px-2 pt-1 pb-0.5 flex-shrink-0">
          <span className="text-[9px] text-muted-foreground leading-none block">Funding (8h) / Countdown</span>
          <span className="text-[10px] font-mono-num text-foreground leading-none font-medium">
            {fundingRate} / {countdown || "—"}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between px-2 pt-1 pb-0.5 flex-shrink-0">
        <span className="text-[9px] text-muted-foreground leading-none">Price ({quote})</span>
        <button className="flex items-center gap-0.5 text-[9px] text-muted-foreground leading-none">
          Size ({quote}) <ChevronDown className="w-2.5 h-2.5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-end overflow-hidden">
        {asks.map((o, i) => (
          <div key={`a${i}`} className="relative flex items-center justify-between px-2 py-[3px]">
            <div className="absolute right-0 top-0 bottom-0 bg-trading-red/10" style={{ width: `${o.percent}%` }} />
            <span className="relative font-mono-num text-[11px] font-medium text-trading-red leading-tight">{o.price}</span>
            <span className="relative font-mono-num text-[11px] text-muted-foreground leading-tight">{o.size}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col px-2 py-1 border-y border-border/40 flex-shrink-0">
        <span className="font-mono-num text-[13px] font-bold text-foreground leading-tight">{midPrice || "—"}</span>
        {midRaw > 0 && (
          <span className="font-mono-num text-[9px] text-muted-foreground leading-tight">${fmtPrice(midRaw)}</span>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {bids.map((o, i) => (
          <div key={`b${i}`} className="relative flex items-center justify-between px-2 py-[3px]">
            <div className="absolute right-0 top-0 bottom-0 bg-trading-green/10" style={{ width: `${o.percent}%` }} />
            <span className="relative font-mono-num text-[11px] font-medium text-trading-green leading-tight">{o.price}</span>
            <span className="relative font-mono-num text-[11px] text-muted-foreground leading-tight">{o.size}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-2 py-1 border-t border-border/40 flex-shrink-0 relative" ref={tickRef}>
        <div className="grid grid-cols-2 gap-0.5 opacity-60">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-1.5 h-1 rounded-[1px] ${i < 2 ? "bg-trading-red" : "bg-trading-green"}`} />
          ))}
        </div>
        <button
          onClick={() => setTickO(o => !o)}
          className="flex items-center gap-0.5 text-[10px] text-foreground font-mono-num hover:text-muted-foreground transition-colors"
        >
          {tickSize}
          <ChevronDown className={`w-2.5 h-2.5 text-muted-foreground transition-transform ${tickOpen ? "rotate-180" : ""}`} />
        </button>
        {tickOpen && (
          <div className="absolute right-0 bottom-full mb-1 z-50 rounded-md border border-border bg-popover shadow-lg overflow-hidden min-w-[70px]">
            {TICK_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => { setTick(opt); setTickO(false); }}
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
