import { Eye, EyeOff, ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetCardProps {
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  totalBalance: number;
  isLoading: boolean;
  cryptoPrices: any;
  pnlUSD?: number;
  pnlPercent?: number;
}

export const AssetCard = ({ showBalance, setShowBalance, totalBalance, isLoading, cryptoPrices, pnlUSD = 0, pnlPercent = 0 }: AssetCardProps) => {
  const pnlPositive = pnlUSD >= 0;
  const pnlUSDStr = `${pnlPositive ? "+" : ""}${pnlUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  const pnlPctStr = `(${pnlPositive ? "+" : ""}${pnlPercent.toFixed(2)}%)`;

  return (
    <div className="bg-card rounded-2xl p-5 mx-4 mt-4 lg:mx-0 lg:mt-0 shadow-sm border border-border animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">Total Assets</span>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            {showBalance ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <Skeleton className="h-10 w-40 mt-1" />
            ) : (
              <span className="text-4xl font-bold text-foreground">
                {showBalance ? totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
              </span>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-lg font-medium">USD</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-4 w-24 mt-2" />
          ) : (
            <p className="text-muted-foreground text-sm mt-1">
              ≈ {showBalance ? (totalBalance / (cryptoPrices.BTC?.current_price || 1)).toFixed(5) : "••••••"} BTC
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground">Today's P&L</span>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <div className={`flex items-center gap-1 ${pnlPositive ? "text-green-500" : "text-destructive"}`}>
                {pnlPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-sm font-medium">
                  {showBalance ? `${pnlUSDStr} ${pnlPctStr}` : "••••••"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="w-24 h-12">
          <svg viewBox="0 0 100 40" className="w-full h-full">
            <path
              d="M0,30 Q10,25 20,28 T40,22 T60,25 T80,20 T100,15"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const AssetCardSkeleton = () => (
  <div className="bg-card rounded-2xl p-5 mx-4 mt-4 lg:mx-0 lg:mt-0 shadow-sm border border-border">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="flex items-end justify-between">
      <div className="space-y-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-12 w-24" />
    </div>
  </div>
);
