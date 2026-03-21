import { useState } from "react";
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
}

function formatVol(v: number): string {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + "B";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(2);
}

const PerpetualPairInfo = ({ pair, onPairChange, chartVisible, onToggleChart }: PerpetualPairInfoProps) => {
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

  return (
    <>
      <div className="flex items-center h-12 px-3 gap-0 bg-background overflow-x-auto scrollbar-none">

        {/* ── Pair selector ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pr-4 border-r border-panel-border h-full">
          {!isMobile && (
            <button
              onClick={() => setStarred(s => !s)}
              className="p-1 rounded hover:bg-accent transition-colors flex-shrink-0"
              aria-label="Favourite"
            >
              <Star
                className={`w-3.5 h-3.5 transition-colors ${starred ? "fill-trading-amber text-trading-amber" : "text-muted-foreground"}`}
              />
            </button>
          )}
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

        {/* ── Stats strip (desktop only) ── */}
        {!isMobile && (
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
        )}

        {/* ── Right actions ── mobile: star + chart toggle; desktop: nothing ── */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0 pl-3">
          {isMobile && (
            <button
              onClick={() => setStarred(s => !s)}
              className="p-1.5 rounded hover:bg-accent transition-colors"
              aria-label="Favourite"
            >
              <Star
                className={`w-4 h-4 transition-colors ${starred ? "fill-trading-amber text-trading-amber" : "text-muted-foreground"}`}
              />
            </button>
          )}
          {isMobile && (
            <button
              onClick={onToggleChart}
              className="p-1.5 rounded hover:bg-accent transition-colors"
              aria-label="Toggle chart"
            >
              <BarChart3 className={`w-4 h-4 ${chartVisible ? "text-foreground" : "text-muted-foreground"}`} />
            </button>
          )}
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
        variant={isMobile ? "fullscreen" : "dialog"}
      />
    </>
  );
};

export default PerpetualPairInfo;
