 import { useState, useEffect } from "react";
import { Eye, EyeOff, ChevronDown, TrendingDown, TrendingUp, MoreHorizontal, ArrowRight, Star, ChevronRight, Gift } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { DashboardMoreModal } from "@/components/dashboard-more-modal";
import { useAuth } from "@/lib/auth-context";
import { getUserWallets, type Wallet } from "@/lib/wallet-api";
import { getCryptoPrices, type CryptoPrice } from "@/lib/crypto-prices";
import { cryptoIconUrls } from "@/lib/crypto-icons";

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
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState("Hot");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, CryptoPrice>>({});
  const [totalBalance, setTotalBalance] = useState(0);
  const [equivalentBtc, setEquivalentBtc] = useState(0);
  const [markets, setMarkets] = useState(defaultMarkets);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        const userWallets = await getUserWallets(user.id);
        setWallets(userWallets);
        
        const symbols = userWallets.map(w => w.crypto_symbol);
        const prices = await getCryptoPrices(symbols.length > 0 ? symbols : ["BTC", "ETH", "SOL", "BNB", "USDC", "USDT"]);
        setCryptoPrices(prices);

        // Calculate total balance in USD
        let total = 0;
        let btcEquivalent = 0;
        userWallets.forEach(wallet => {
          const price = prices[wallet.crypto_symbol]?.current_price || 0;
          const usdValue = wallet.balance * price;
          total += usdValue;
        });

        setTotalBalance(total);
        if (prices.BTC?.current_price) {
          setEquivalentBtc(total / prices.BTC.current_price);
        }

        // Update markets with real prices
        const updatedMarkets = defaultMarkets.map(market => {
          const priceData = prices[market.symbol];
          return {
            ...market,
            price: priceData ? priceData.current_price.toFixed(market.symbol === "USDT" || market.symbol === "USDC" ? 4 : 2) : market.price,
            change: priceData?.price_change_percentage_24h || 0
          };
        });
        setMarkets(updatedMarkets);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    loadData();
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Desktop 2-column layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:p-6">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-7 xl:col-span-8">
            {/* Asset Card */}
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
                    <span className="text-4xl font-bold text-foreground">
                      {showBalance ? totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
                    </span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="text-lg font-medium">USD</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    ≈ {showBalance ? equivalentBtc.toFixed(5) : "••••••"} BTC
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-muted-foreground">Today's P&L</span>
                    <div className="flex items-center gap-1 text-destructive">
                      <TrendingDown className="h-3 w-3" />
                      <span className="text-sm font-medium">-12.87 USD (-0.33%)</span>
                    </div>
                  </div>
                </div>

                {/* Mini Chart */}
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

            {/* Quick Actions */}
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

            {/* Event Banner */}
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

            {/* Markets Section - Shows on mobile, hidden on desktop (will be in right column) */}
            <div className="mt-6 animate-fade-in lg:hidden" style={{ animationDelay: "0.2s" }}>
              {/* Header with Spot dropdown */}
              <div className="px-4 flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Markets</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm font-medium text-foreground">
                  Spot
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Tabs with underline */}
              <div className="px-4 overflow-x-auto scrollbar-hide">
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

              {/* Column Headers */}
              <div className="mt-4 px-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 py-2">
                  <span>Trading Pairs</span>
                  <div className="flex">
                    <span className="w-24 text-center">Price</span>
                    <span className="w-20 text-right">24H Change</span>
                  </div>
                </div>

                {/* Market Rows */}
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

            {/* Divider - mobile only */}
            <div className="h-3 bg-muted mt-6 lg:hidden"></div>

            {/* My Rewards Section */}
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

          {/* Right Column - Markets (Desktop only) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="bg-card rounded-2xl border border-border p-5 sticky top-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {/* Header with Spot dropdown */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Markets</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm font-medium text-foreground">
                  Spot
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Tabs with underline */}
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

              {/* Column Headers */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 py-2">
                  <span>Trading Pairs</span>
                  <div className="flex">
                    <span className="w-24 text-center">Price</span>
                    <span className="w-20 text-right">24H Change</span>
                  </div>
                </div>

                {/* Market Rows */}
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
          </div>
        </div>
      </div>
      <PexlyFooter />
      
      {/* More Services Modal */}
      <DashboardMoreModal
        isOpen={isMoreModalOpen}
        onClose={() => setIsMoreModalOpen(false)}
      />
    </div>
  );
};
