import { useState } from "react";
import { Star, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import SymbolSelector from "./SymbolSelector";

interface PerpetualPairInfoProps {
  pair: string;
  onPairChange: (pair: string) => void;
  chartVisible: boolean;
  onToggleChart: () => void;
}

const PerpetualPairInfo = ({ pair, onPairChange, chartVisible, onToggleChart }: PerpetualPairInfoProps) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 md:gap-4 px-3 md:px-5 py-3 border-b border-border bg-background">

        {/* Clickable pair area */}
        <button
          onClick={() => setSelectorOpen(true)}
          className="flex items-center gap-2 md:gap-4 flex-shrink-0"
        >
          <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-trading-green/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="hsl(var(--trading-green))" />
              <circle cx="12" cy="4" r="2" fill="hsl(var(--trading-green))" />
              <circle cx="12" cy="20" r="2" fill="hsl(var(--trading-green))" />
              <circle cx="4" cy="12" r="2" fill="hsl(var(--trading-green))" />
              <circle cx="20" cy="12" r="2" fill="hsl(var(--trading-green))" />
            </svg>
          </div>

          <span className="text-foreground font-bold text-base md:text-xl tracking-tight">
            {pair}
          </span>

          <span className="text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1 rounded bg-trading-green/15 text-trading-green font-medium">
            Perp
          </span>

          {selectorOpen ? (
            <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
          )}
        </button>

        <span className="font-mono-num text-xs md:text-sm text-trading-red ml-1 md:ml-3">
          -1.52%
        </span>

        {/* Desktop stats — perpetual-specific */}
        {!isMobile && (
          <div className="hidden md:flex items-center gap-6 ml-4 text-xs">
            <div>
              <span className="text-muted-foreground">Mark Price</span>
              <div className="font-mono-num text-trading-green">0.68251</div>
            </div>

            <div>
              <span className="text-muted-foreground">Index Price</span>
              <div className="font-mono-num text-foreground">0.68198</div>
            </div>

            <div>
              <span className="text-muted-foreground">24h High</span>
              <div className="font-mono-num text-foreground">0.70200</div>
            </div>

            <div>
              <span className="text-muted-foreground">24h Low</span>
              <div className="font-mono-num text-foreground">0.67100</div>
            </div>

            <div>
              <span className="text-muted-foreground">24h Vol (USDT)</span>
              <div className="font-mono-num text-foreground">12.43M</div>
            </div>

            <div>
              <span className="text-muted-foreground">Open Interest</span>
              <div className="font-mono-num text-foreground">4.56M</div>
            </div>

            <div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Funding Rate</span>
                <span className="text-[10px] text-muted-foreground/60 font-mono-num">00:42:17</span>
              </div>
              <div className="font-mono-num text-trading-green">+0.0100%</div>
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
      />
    </>
  );
};

export default PerpetualPairInfo;
