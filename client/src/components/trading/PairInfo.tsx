import { useState } from "react";
import { Star, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
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
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + "B";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(2);
}

const PairInfo = ({ pair, onPairChange, chartVisible, onToggleChart }: PairInfoProps) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
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
  const baseAddress: string | undefined = (exchangeInfo?.symbols ?? [])
    .find((s: any) => s.baseAsset === baseAsset)?.baseAssetAddress ?? undefined;

  const lastPrice = ticker?.lastPrice ? parseFloat(ticker.lastPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—";
  const priceChangePercent = ticker?.priceChangePercent ? parseFloat(ticker.priceChangePercent) : null;
  const changeStr = priceChangePercent !== null
    ? (priceChangePercent >= 0 ? "+" : "") + priceChangePercent.toFixed(2) + "%"
    : "—";
  const changeColor = priceChangePercent === null
    ? "text-muted-foreground"
    : priceChangePercent >= 0 ? "text-trading-green" : "text-trading-red";

  const high24h = ticker?.highPrice ? parseFloat(ticker.highPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—";
  const low24h = ticker?.lowPrice ? parseFloat(ticker.lowPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—";
  const volume24h = ticker?.quoteVolume ? formatVolume(parseFloat(ticker.quoteVolume)) : "—";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 md:gap-4 px-3 md:px-5 py-3 border-b border-border bg-background">

        {/* Clickable pair area */}
        <button
          onClick={() => setSelectorOpen(true)}
          className="flex items-center gap-2 md:gap-4 flex-shrink-0"
        >
          <CoinIcon symbol={baseAsset} address={baseAddress} className="w-8 md:w-10 h-8 md:h-10" />

          <span className="text-foreground font-bold text-base md:text-xl tracking-tight">
            {pair}
          </span>

          <span className="text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1 rounded bg-secondary text-muted-foreground">
            Spot
          </span>

          {selectorOpen ? (
            <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
          )}
        </button>

        <span className={`font-mono-num text-xs md:text-sm ml-1 md:ml-3 ${changeColor}`}>
          {changeStr}
        </span>

        {/* Desktop stats */}
        {!isMobile && (
          <div className="hidden md:flex items-center gap-6 ml-4 text-xs">
            <div>
              <span className="text-muted-foreground">Last Price</span>
              <div className={`font-mono-num ${priceChangePercent !== null && priceChangePercent >= 0 ? "text-trading-green" : "text-trading-red"}`}>{lastPrice}</div>
            </div>

            <div>
              <span className="text-muted-foreground">24h High</span>
              <div className="font-mono-num text-foreground">{high24h}</div>
            </div>

            <div>
              <span className="text-muted-foreground">24h Low</span>
              <div className="font-mono-num text-foreground">{low24h}</div>
            </div>

            <div>
              <span className="text-muted-foreground">24h Vol</span>
              <div className="font-mono-num text-foreground">{volume24h}</div>
            </div>
          </div>
        )}

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-4">
          <Star className="w-5 h-5 text-muted-foreground cursor-pointer" />

          <button onClick={onToggleChart}>
            <BarChart3
              className={`w-5 h-5 ${
                chartVisible ? "text-foreground" : "text-muted-foreground"
              }`}
            />
          </button>
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
