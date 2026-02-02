import { ChevronDown, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketsSectionProps {
  markets: any[];
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  className?: string;
}

export const MarketsSection = ({ markets, tabs, activeTab, setActiveTab, className = "" }: MarketsSectionProps) => {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Markets</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm font-medium text-foreground">
          Spot
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap relative ${
                activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 py-2">
          <span>Trading Pairs</span>
          <div className="flex">
            <span className="w-24 text-center">Price</span>
            <span className="w-20 text-right">24H Change</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {markets.map((market) => (
            <button
              key={market.symbol}
              className="w-full flex items-center justify-between py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={cryptoIconUrls[market.symbol] || `https://ui-avatars.com/api/?name=${market.symbol}&background=random`}
                  alt={market.name}
                  className="w-9 h-9 rounded-full"
                />
                <div className="text-left">
                  <span className="font-semibold text-foreground">{market.symbol}</span>
                  <span className="text-muted-foreground">/USDT</span>
                </div>
              </div>

              <div className="flex items-center">
                <span className="w-24 text-center font-medium text-foreground">${market.price}</span>
                <div className={`w-20 text-right flex items-center justify-end gap-0.5 font-medium ${
                  market.change >= 0 ? "text-primary" : "text-destructive"
                }`}>
                  {market.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(market.change).toFixed(2)}%
                </div>
              </div>
            </button>
          ))}
        </div>

        <button className="flex items-center gap-1 text-primary font-medium text-sm mt-4 hover:gap-2 transition-all">
          Market Overview
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const MarketsSectionSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
    <div className="flex gap-6">
      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-4 w-12" />)}
    </div>
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
