import { useState, useEffect } from "react";
import { Star, ChevronDown, BarChart3 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { asterMarket } from "@/lib/asterdex-service";
import SymbolSelector from "./SymbolSelector";
import { CoinIcon } from "./CoinIcon";

interface PerpetualPairInfoProps {
  pair: string;
  onPairChange: (pair: string) => void;
  chartVisible: boolean;
  onToggleChart: () => void;
  viewMode?: "list" | "chart";
}

function formatVol(v: number): string {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + "B";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(2);
}

const PerpetualPairInfo = ({ pair, onPairChange, chartVisible, onToggleChart, viewMode = "list" }: PerpetualPairInfoProps) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [starred, setStarred] = useState(false);
  const isMobile = useIsMobile();

  const apiSymbol = pair.replace("/", "");

  const { data: ticker } = useQuery({
    queryKey: ["futures-ticker", apiSymbol],
    queryFn: () => asterMarket.futuresTicker(apiSymbol),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });

  const { data: exchangeInfo } = useQuery({
    queryKey: ["futures-exchange-info"],
    queryFn: () => asterMarket.futuresExchangeInfo(),
    staleTime: 300_000,
  });

  const baseAsset = pair.split("/")[0];
  const quoteAsset = pair.split("/")[1] || "USDT";
  const baseAddress: string | undefined = (exchangeInfo?.symbols ?? [])
    .find((s: any) => s.baseAsset === baseAsset)?.baseAssetAddress ?? undefined;

  const t = Array.isArray(ticker) ? ticker[0] : ticker;

  const lastPrice = t?.lastPrice
    ? parseFloat(t.lastPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 })
    : "—";
  const priceChangePercent = t?.priceChangePercent ? parseFloat(t.priceChangePercent) : null;
  const isPositive = priceChangePercent !== null && priceChangePercent >= 0;
  const changeStr = priceChangePercent !== null
    ? (priceChangePercent >= 0 ? "+" : "") + priceChangePercent.toFixed(2) + "%"
    : "—";
  const changeColor = priceChangePercent === null
    ? "text-muted-foreground"
    : isPositive ? "text-trading-green" : "text-trading-red";

  const markPrice = t?.markPrice
    ? parseFloat(t.markPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 })
    : "—";
  const indexPrice = t?.indexPrice
    ? parseFloat(t.indexPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 })
    : "—";
  const fundingRate = t?.lastFundingRate
    ? (parseFloat(t.lastFundingRate) * 100).toFixed(4) + "%"
    : "—";
  const volume24h = t?.quoteVolume
    ? formatVol(parseFloat(t.quoteVolume))
    : "—";
  const openInterest = t?.openInterest
    ? formatVol(parseFloat(t.openInterest))
    : "—";
  const high24h = t?.highPrice
    ? parseFloat(t.highPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 })
    : "—";
  const low24h = t?.lowPrice
    ? parseFloat(t.lowPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 })
    : "—";

  const { data: fundingData } = useQuery({
    queryKey: ["perp-funding-countdown", apiSymbol],
    queryFn: () => asterMarket.futuresFundingRate(apiSymbol),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: isMobile,
  });
  const fd = Array.isArray(fundingData) ? fundingData[0] : fundingData;
  const nextFundingTime = fd?.nextFundingTime ? parseInt(fd.nextFundingTime) : null;
  const [countdown, setCountdown] = useState("--:--:--");
  useEffect(() => {
    if (!nextFundingTime) return;
    const tick = () => {
      const diff = nextFundingTime - Date.now();
      if (diff <= 0) { setCountdown("00:00:00"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [nextFundingTime]);

  if (isMobile) {
    const selector = (
      <SymbolSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(selectedPair) => { onPairChange(selectedPair); setSelectorOpen(false); }}
        defaultCategory="Futures"
        variant="fullscreen"
      />
    );

    const pairButton = (
      <button onClick={() => setSelectorOpen(true)} className="flex items-center gap-2 flex-shrink-0">
        <CoinIcon symbol={baseAsset} address={baseAddress} className="w-7 h-7" />
        <span className="text-foreground font-bold text-sm leading-none tracking-tight">{baseAsset}{quoteAsset}</span>
        <span className="text-[11px] font-medium text-trading-green bg-trading-green/10 px-1.5 py-0.5 rounded leading-none">Perp</span>
        <span className="text-muted-foreground text-[10px] leading-none">▼</span>
      </button>
    );

    const starBtn = (
      <button onClick={() => setStarred(s => !s)} className="p-1.5 rounded hover:bg-accent transition-colors" aria-label="Favourite">
        <Star className={`w-[18px] h-[18px] transition-colors ${starred ? "fill-trading-amber text-trading-amber" : "text-muted-foreground"}`} />
      </button>
    );

    /* ── List view: compact single-row + chart toggle ── */
    if (viewMode === "list") {
      return (
        <>
          <div className="flex items-center h-11 px-3 bg-background border-b border-border/40">
            {pairButton}
            <span className={`ml-2 text-sm font-semibold font-mono-num leading-none ${changeColor}`}>{changeStr}</span>
            <div className="ml-auto flex items-center gap-0.5">
              {starBtn}
              <button onClick={onToggleChart} className="p-1.5 rounded hover:bg-accent transition-colors" aria-label="Toggle chart">
                <BarChart3 className={`w-[18px] h-[18px] ${chartVisible ? "text-foreground" : "text-muted-foreground"}`} />
              </button>
            </div>
          </div>
          {selector}
        </>
      );
    }

    /* ── Chart view: expanded stats ── */
    return (
      <>
        <div className="flex items-center h-11 px-3 bg-background border-b border-border/40">
          {pairButton}
          <span className={`ml-2 text-sm font-semibold font-mono-num leading-none ${changeColor}`}>{changeStr}</span>
          <div className="ml-auto flex items-center gap-0.5">{starBtn}</div>
        </div>

        <div className="flex items-center px-3 py-2.5 bg-background gap-4">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-[11px] text-muted-foreground leading-none flex items-center gap-0.5">
              Last price <span className="text-[9px]">▼</span>
            </span>
            <span className={`text-2xl font-bold font-mono-num leading-none ${changeColor}`}>{lastPrice}</span>
            <span className="text-[11px] text-muted-foreground font-mono-num leading-none mt-0.5">Mark price {markPrice}</span>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="grid grid-cols-2 gap-x-5">
              <div>
                <div className="text-[10px] text-muted-foreground leading-none border-b border-dashed border-border/60 pb-0.5 mb-0.5">24h Vol ({quoteAsset})</div>
                <div className="text-[11px] font-mono-num text-foreground leading-none">{volume24h}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground leading-none border-b border-dashed border-border/60 pb-0.5 mb-0.5">OI ({quoteAsset})</div>
                <div className="text-[11px] font-mono-num text-foreground leading-none">{openInterest}</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground leading-none border-b border-dashed border-border/60 pb-0.5 mb-0.5">Funding / Countdown</div>
              <div className="text-[11px] font-mono-num text-foreground leading-none">{fundingRate} / {countdown}</div>
            </div>
          </div>
        </div>

        {selector}
      </>
    );
  }

  return (
    <>
      <div className="flex items-center h-12 px-3 gap-0 bg-background overflow-x-auto scrollbar-none">

        {/* ── Pair selector ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pr-4 border-r border-panel-border h-full">
          <button
            onClick={() => setStarred(s => !s)}
            className="p-1 rounded hover:bg-accent transition-colors flex-shrink-0"
            aria-label="Favourite"
          >
            <Star
              className={`w-3.5 h-3.5 transition-colors ${starred ? "fill-trading-amber text-trading-amber" : "text-muted-foreground"}`}
            />
          </button>
          <button
            onClick={() => setSelectorOpen(true)}
            className="flex items-center gap-2 group"
          >
            <CoinIcon symbol={baseAsset} address={baseAddress} className="w-7 h-7" />
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1">
                <span className="text-foreground font-bold text-sm leading-none tracking-tight">{baseAsset}</span>
                <span className="text-muted-foreground text-xs leading-none">/{quoteAsset}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <span className="text-[10px] text-trading-green leading-none mt-0.5 font-medium">Perp</span>
            </div>
          </button>
        </div>

        {/* ── Price + 24h change ── */}
        <div className="flex items-center gap-2 px-4 border-r border-panel-border h-full flex-shrink-0">
          <div>
            <div className={`text-lg font-bold font-mono-num leading-none ${changeColor}`}>
              {lastPrice}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[11px] font-semibold leading-none font-mono-num ${changeColor}`}>
                {changeStr}
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="flex items-center gap-5 px-4 overflow-x-auto scrollbar-none flex-1">
          <div className="flex flex-col flex-shrink-0">
            <span className="text-[10px] text-muted-foreground leading-none">Mark</span>
            <span className="text-xs font-mono-num text-trading-green leading-none mt-1">{markPrice}</span>
          </div>
          <div className="flex flex-col flex-shrink-0">
            <span className="text-[10px] text-muted-foreground leading-none">Index</span>
            <span className="text-xs font-mono-num text-foreground leading-none mt-1">{indexPrice}</span>
          </div>
          <div className="flex flex-col flex-shrink-0">
            <span className="text-[10px] text-muted-foreground leading-none">Funding Rate</span>
            <span className="text-xs font-mono-num text-trading-green leading-none mt-1">{fundingRate}</span>
          </div>
          <div className="flex flex-col flex-shrink-0">
            <span className="text-[10px] text-muted-foreground leading-none">24h High</span>
            <span className="text-xs font-mono-num text-foreground leading-none mt-1">{high24h}</span>
          </div>
          <div className="flex flex-col flex-shrink-0">
            <span className="text-[10px] text-muted-foreground leading-none">24h Low</span>
            <span className="text-xs font-mono-num text-foreground leading-none mt-1">{low24h}</span>
          </div>
          <div className="flex flex-col flex-shrink-0">
            <span className="text-[10px] text-muted-foreground leading-none">24h Vol ({quoteAsset})</span>
            <span className="text-xs font-mono-num text-foreground leading-none mt-1">{volume24h}</span>
          </div>
          <div className="flex flex-col flex-shrink-0">
            <span className="text-[10px] text-muted-foreground leading-none">Open Interest</span>
            <span className="text-xs font-mono-num text-foreground leading-none mt-1">{openInterest}</span>
          </div>
        </div>

      </div>

      <SymbolSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(selectedPair) => {
          onPairChange(selectedPair);
          setSelectorOpen(false);
        }}
        defaultCategory="Futures"
        variant="dialog"
      />
    </>
  );
};

export default PerpetualPairInfo;
