import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Eye, EyeOff, ChevronDown, TrendingDown, TrendingUp, MoreHorizontal, ArrowRight, Star, ChevronRight, Gift, ShieldAlert } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { DashboardMoreModal } from "@/components/dashboard-more-modal";
import { useAuth } from "@/lib/auth-context";
import { getUserWallets, type Wallet } from "@/lib/wallet-api";
import { useCryptoPrices, type CryptoPrice } from "@/lib/crypto-prices";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";
import { Button } from "@/components/ui/button";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { PageSkeleton } from "@/components/page-skeleton";
import { AssetCardSkeleton } from "@/components/dashboard/AssetCard";
import { MarketsSectionSkeleton } from "@/components/dashboard/MarketsSection";
import { useWalletData } from "@/hooks/use-wallet-data";

const AssetCard = lazy(() => import("@/components/dashboard/AssetCard").then(m => ({ default: m.AssetCard })));
const MarketsSection = lazy(() => import("@/components/dashboard/MarketsSection").then(m => ({ default: m.MarketsSection })));

const tabs = ["Hot", "New", "Gainers", "Losers", "Turnover"];

const defaultMarkets = [
  { symbol: "BTC", name: "Bitcoin", pair: "USDT", price: "85,451.2", change: -0.79 },
  { symbol: "ETH", name: "Ethereum", pair: "USDT", price: "2,826.06", change: -0.13 },
  { symbol: "SOL", name: "Solana", pair: "USDT", price: "119.38", change: -3.11 },
  { symbol: "BNB", name: "Binance Coin", pair: "USDT", price: "600", change: -2.0 },
  { symbol: "USDC", name: "USD Coin", pair: "USDT", price: "1.0004", change: 0.02 },
  { symbol: "USDT", name: "Tether", pair: "USDT", price: "1.0000", change: 0.0 },
];

const QuickActionIcon = ({ type, color }: { type: string; color: string }) => {
  const icons: Record<string, JSX.Element> = {
    p2p: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="22" cy="32" r="12" fill={color} />
        <circle cx="42" cy="32" r="12" fill={color} opacity="0.7" />
        <path d="M34 28l8 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M30 36l8 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    quick_trade: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="24" fill={color} opacity="0.2" />
        <path d="M40 22l8 8-8 8" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M16 30h32" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M24 42l-8-8 8-8" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M48 34H16" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    rewards: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="22" r="10" fill={color} />
        <rect x="20" y="34" width="24" height="18" rx="2" fill={color} opacity="0.8" />
        <rect x="26" y="40" width="12" height="6" fill="white" opacity="0.8" />
        <path d="M20 32l-6 8l6 4" stroke={color} strokeWidth="2" fill="none" />
        <path d="M44 32l6 8l-6 4" stroke={color} strokeWidth="2" fill="none" />
      </svg>
    ),
  };
  return icons[type] || null;
};

const actions = [
  { type: "p2p", label: "P2P Trading", color: "#4FACFE" },
  { type: "quick_trade", label: "Quick Trade", color: "#7C3AED" },
  { type: "rewards", label: "Rewards", color: "#F59E0B" },
  { type: "more", label: "More", color: "#6B7280" },
];

const rewards = [
  { chances: 1, type: "Lucky Draw" },
  { chances: 2, type: "Lucky Draw" },
  { chances: 2, type: "Lucky Draw" },
  { chances: 1, type: "Lucky Draw" },
];

export const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState("Hot");
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);
  const [walletBackupProcessed, setWalletBackupProcessed] = useState(false);
  
  const { data: walletData, isLoading: walletLoading } = useWalletData();
  
  const symbols = useMemo(() => ["BTC", "ETH", "SOL", "BNB", "USDC", "USDT"], []);
  const { data: cryptoPricesMap, isLoading: pricesLoading } = useCryptoPrices(symbols);
  
  const isLoading = walletLoading || pricesLoading || authLoading;
  const cryptoPrices = cryptoPricesMap || {};

  const totalBalance = walletData?.totalBalance || 0;

  const markets = useMemo(() => {
    return defaultMarkets.map(market => {
      const priceData = cryptoPrices[market.symbol];
      return {
        ...market,
        price: priceData ? priceData.current_price.toFixed(market.symbol === "USDT" || market.symbol === "USDC" ? 4 : 2) : market.price,
        change: priceData?.price_change_percentage_24h || 0
      };
    });
  }, [cryptoPrices]);

  useEffect(() => {
    if (user) {
      const checkWallets = async () => {
        const existingWallets = await nonCustodialWalletManager.getWalletsFromStorage(user.id);
        setWalletBackupProcessed(existingWallets.length > 0);
      };
      checkWallets();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:p-6">
          <div className="lg:col-span-7 xl:col-span-8">
            <Suspense fallback={<AssetCardSkeleton />}>
              <AssetCard 
                showBalance={showBalance}
                setShowBalance={setShowBalance}
                totalBalance={totalBalance}
                isLoading={isLoading}
                cryptoPrices={cryptoPrices}
              />
            </Suspense>

            <div className="px-4 lg:px-0 mt-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="grid grid-cols-4 gap-3">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => action.label === "More" && setIsMoreModalOpen(true)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-95 group"
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))`,
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      {action.type === "more" ? (
                        <MoreHorizontal className="h-7 w-7 text-muted-foreground" />
                      ) : (
                        <div className="w-10 h-10">
                          <QuickActionIcon type={action.type} color={action.color} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-foreground text-center leading-tight">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 lg:px-0 mt-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary rounded-2xl p-4 border border-primary/20 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Events</span>
                    <h3 className="text-foreground font-semibold mt-0.5">
                      Claim your share of $125,000 in Christmas prize!
                    </h3>
                    <button className="flex items-center gap-1 text-primary font-medium text-sm mt-2 hover:gap-2 transition-all">
                      Explore Now
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-center gap-1.5 mt-4">
                  <div className="w-6 h-1.5 bg-primary rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="mt-6 animate-fade-in lg:hidden" style={{ animationDelay: "0.2s" }}>
              <Suspense fallback={<MarketsSectionSkeleton />}>
                <MarketsSection 
                  markets={markets}
                  tabs={tabs}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  className="px-4"
                />
              </Suspense>
            </div>

            <div className="h-3 bg-muted mt-6 lg:hidden"></div>

            <div className="px-4 lg:px-0 py-6 animate-fade-in" style={{ animationDelay: "0.25s" }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-foreground">My Rewards</h2>
                <button className="flex items-center gap-1 px-4 py-2 bg-muted rounded-full text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
                  0 Available
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Win the rewards below by completing simple tasks!
              </p>

              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                {rewards.map((reward, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-full bg-pink-100 border-2 border-pink-300 flex items-center justify-center">
                      <Star className="h-6 w-6 text-pink-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {reward.chances} Chance(s)
                      </h3>
                      <p className="text-muted-foreground text-sm">{reward.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="bg-card rounded-2xl border border-border p-5 sticky top-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Suspense fallback={<MarketsSectionSkeleton />}>
                <MarketsSection 
                  markets={markets}
                  tabs={tabs}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
      <PexlyFooter />
      
      <DashboardMoreModal
        isOpen={isMoreModalOpen}
        onClose={() => setIsMoreModalOpen(false)}
      />
    </div>
  );
};
