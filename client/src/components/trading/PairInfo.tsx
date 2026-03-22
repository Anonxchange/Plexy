import { useState } from "react";
import { Star, ChevronDown, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { asterMarket } from "@/lib/asterdex-service";
import SymbolSelector from "./SymbolSelector";
import { CoinIcon } from "./CoinIcon";

interface PairInfoProps {
  pair: string;
  onPairChange: (pair: string) => void;
  chartVisible: boolean;
  onToggleChart: () => void;
  viewMode?: "list" | "chart";
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + "B";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(2);
}

const PairInfo = ({ pair, onPairChange, chartVisible, onToggleChart, viewMode = "list" }: PairInfoProps) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [starred, setStarred] = useState(false);
  const isMobile = useIsMobile();

  const apiSymbol = pair.replace("/", "");

  const { data: ticker } = useQuery({
    queryKey: ["spot-ticker", apiSymbol],
    queryFn: () => asterMarket.spotTicker(apiSymbol),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });

  const { data: exchangeInfo } = useQuery({
    queryKey: ["spot-exchange-info"],
    queryFn: () => asterMarket.spotExchangeInfo(),
    staleTime: 300_000,
  });

  const baseAsset = pair.split("/")[0];
  const quoteAsset = pair.split("/")[1] || "USDT";
  const baseAddress: string | undefined = (exchangeInfo?.symbols ?? [])
    .find((s: any) => s.baseAsset === baseAsset)?.baseAssetAddress ?? undefined;

  const lastPrice = ticker?.lastPrice
    ? parseFloat(ticker.lastPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 })
    : "—";
  const priceChangePercent = ticker?.priceChangePercent ? parseFloat(ticker.priceChangePercent) : null;
  const priceChange = ticker?.priceChange ? parseFloat(ticker.priceChange) : null;
  const isPositive = priceChangePercent !== null && priceChangePercent >= 0;
  const changeStr = priceChangePercent !== null
    ? (priceChangePercent >= 0 ? "+" : "") + priceChangePercent.toFixed(2) + "%"
    : "—";
  const changeColor = priceChangePercent === null
    ? "text-muted-foreground"
    : isPositive ? "text-trading-green" : "text-trading-red";

  const high24h = ticker?.highPrice
    ? parseFloat(ticker.highPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 })
    : "—";
  const low24h = ticker?.lowPrice
    ? parseFloat(ticker.lowPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 })
    : "—";
  const volume24h = ticker?.quoteVolume
    ? formatVolume(parseFloat(ticker.quoteVolume))
    : "—";
  const baseVolume = ticker?.volume
    ? formatVolume(parseFloat(ticker.volume))
    : "—";

  const lastPriceRaw = ticker?.lastPrice ? parseFloat(ticker.lastPrice).toFixed(4) : null;

  if (isMobile) {
    const selector = (
      <SymbolSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(selectedPair) => { onPairChange(selectedPair); setSelectorOpen(false); }}
        variant="fullscreen"
      />
    );

    const pairButton = (
      <button onClick={() => setSelectorOpen(true)} className="flex items-center gap-2 flex-shrink-0">
        <CoinIcon symbol={baseAsset} address={baseAddress} className="w-7 h-7" />
        <span className="text-foreground font-bold text-sm leading-none tracking-tight">{baseAsset}/{quoteAsset}</span>
        <span className="text-[11px] font-medium text-muted-foreground bg-accent px-1.5 py-0.5 rounded leading-none">Spot</span>
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
          <div className="ml-auto flex items-center gap-0.5">{starBtn}</div>
        </div>

        <div className="flex items-center px-3 py-2.5 bg-background gap-4">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-[11px] text-muted-foreground leading-none">Last price</span>
            <span className={`text-2xl font-bold font-mono-num leading-none ${changeColor}`}>{lastPrice}</span>
            <div className="flex items-center gap-1.5">
              {lastPriceRaw && <span className="text-[11px] text-muted-foreground font-mono-num">≈${lastPriceRaw}</span>}
              <span className={`text-[11px] font-semibold font-mono-num ${changeColor}`}>{changeStr}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2 flex-shrink-0">
            <div>
              <div className="text-[10px] text-muted-foreground leading-none border-b border-dashed border-border/60 pb-0.5 mb-0.5">24h High</div>
              <div className="text-[11px] font-mono-num text-foreground leading-none">{high24h}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground leading-none border-b border-dashed border-border/60 pb-0.5 mb-0.5">24h Vol ({baseAsset})</div>
              <div className="text-[11px] font-mono-num text-foreground leading-none">{baseVolume}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground leading-none border-b border-dashed border-border/60 pb-0.5 mb-0.5">24h Low</div>
              <div className="text-[11px] font-mono-num text-foreground leading-none">{low24h}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground leading-none border-b border-dashed border-border/60 pb-0.5 mb-0.5">24h Vol ({quoteAsset})</div>
              <div className="text-[11px] font-mono-num text-foreground leading-none">{volume24h}</div>
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
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Spot</span>
            </div>
          </button>
        </div>

        {/* ── Price + 24h change ── */}
        <div className="flex items-center gap-3 px-4 border-r border-panel-border h-full flex-shrink-0">
          <div>
            <div className={`text-lg font-bold font-mono-num leading-none ${changeColor}`}>
              {lastPrice}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[11px] font-mono-num leading-none ${changeColor}`}>
                {priceChange !== null
                  ? (priceChange >= 0 ? "+" : "") + priceChange.toFixed(5)
                  : "—"}
              </span>
              <span className={`text-[11px] font-semibold leading-none ${changeColor}`}>
                ({changeStr})
              </span>
            </div>
          </div>
          {priceChangePercent !== null && (
            isPositive
              ? <TrendingUp className="w-4 h-4 text-trading-green flex-shrink-0" />
              : <TrendingDown className="w-4 h-4 text-trading-red flex-shrink-0" />
          )}
        </div>

        {/* ── Stats strip ── */}
        <div className="flex items-center gap-5 px-4 overflow-x-auto scrollbar-none flex-1">
          <div className="flex flex-col flex-shrink-0">
            <span className="text-[10px] text-muted-foreground leading-none">24h Change</span>
            <span className={`text-xs font-mono-num font-semibold leading-none mt-1 ${changeColor}`}>{changeStr}</span>
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
            <span className="text-[10px] text-muted-foreground leading-none">24h Vol ({baseAsset})</span>
            <span className="text-xs font-mono-num text-foreground leading-none mt-1">{baseVolume}</span>
          </div>
          <div className="flex flex-col flex-shrink-0">
            <span className="text-[10px] text-muted-foreground leading-none">24h Vol ({quoteAsset})</span>
            <span className="text-xs font-mono-num text-foreground leading-none mt-1">{volume24h}</span>
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
        variant={isMobile ? "fullscreen" : "dialog"}
      />
    </>
  );
};

export default PairInfo;
