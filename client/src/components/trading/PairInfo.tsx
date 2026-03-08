import { useState } from "react";
import { Star, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import SymbolSelector from "./SymbolSelector";

interface PairInfoProps {
  chartVisible: boolean;
  onToggleChart: () => void;
}

const PairInfo = ({ chartVisible, onToggleChart }: PairInfoProps) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [pair, setPair] = useState("ASTER/USDT");
  const isMobile = useIsMobile();

  return (
    <>
      <div className="flex items-center gap-2 md:gap-4 h-16 md:h-[68px] px-3 md:px-5 border-b border-border bg-background">
        {/* Clickable pair area */}
        <button
          onClick={() => setSelectorOpen(true)}
          className="flex items-center gap-2 md:gap-4"
        >
          <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-trading-amber/20 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="hsl(36, 80%, 55%)" />
              <circle cx="12" cy="4" r="2" fill="hsl(36, 80%, 55%)" />
              <circle cx="12" cy="20" r="2" fill="hsl(36, 80%, 55%)" />
              <circle cx="4" cy="12" r="2" fill="hsl(36, 80%, 55%)" />
              <circle cx="20" cy="12" r="2" fill="hsl(36, 80%, 55%)" />
            </svg>
          </div>
          <span className="text-foreground font-bold text-base md:text-xl tracking-tight">{pair}</span>
          <span className="text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1 rounded bg-secondary text-muted-foreground">Spot</span>
          {selectorOpen ? (
            <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
          )}
        </button>

        <span className="font-mono-num text-xs md:text-sm text-trading-amber ml-1 md:ml-3">-1.52%</span>

        {/* Desktop: inline price stats */}
        {!isMobile && (
          <div className="hidden md:flex items-center gap-6 ml-4 text-xs">
            <div>
              <span className="text-muted-foreground">Last Price</span>
              <div className="font-mono-num text-trading-green">0.68251</div>
            </div>
            <div>
              <span className="text-muted-foreground">24h High</span>
              <div className="font-mono-num text-foreground">0.69546</div>
            </div>
            <div>
              <span className="text-muted-foreground">24h Low</span>
              <div className="font-mono-num text-foreground">0.67759</div>
            </div>
            <div>
              <span className="text-muted-foreground">24h Vol</span>
              <div className="font-mono-num text-foreground">5.71M</div>
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-4">
          <Star className="w-5 h-5 text-muted-foreground" />
          <button onClick={onToggleChart}>
            <BarChart3 className={`w-5 h-5 ${chartVisible ? "text-foreground" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>

      <SymbolSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(symbol) => setPair(symbol)}
      />
    </>
  );
};

export default PairInfo;
