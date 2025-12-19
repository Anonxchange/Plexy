 import { useState } from "react";
import { Eye, EyeOff, ChevronDown, TrendingDown, TrendingUp, Users, Calendar, Zap, MoreHorizontal, ArrowRight, Gift, Star, ChevronRight } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";

const tabs = ["Hot", "New", "Gainers", "Losers", "Turnover"];

const markets = [
  { symbol: "BTC", pair: "USDT", price: "85,451.2", change: -0.79, icon: "₿", color: "bg-amber-500" },
  { symbol: "SOL", pair: "USDT", price: "119.38", change: -3.11, icon: "◐", color: "bg-gradient-to-r from-purple-500 to-cyan-400" },
  { symbol: "MNT", pair: "USDT", price: "1.1489", change: -4.96, icon: "◎", color: "bg-teal-500" },
  { symbol: "ETH", pair: "USDT", price: "2,826.06", change: -0.13, icon: "Ξ", color: "bg-slate-600" },
  { symbol: "USDC", pair: "USDT", price: "1.0004", change: 0.02, icon: "$", color: "bg-blue-500" },
  { symbol: "VOOI", pair: "USDT", price: "0.04949", change: 64.97, icon: "◉", color: "bg-amber-400" },
];

const actions = [
  { icon: Users, label: "P2P Trading", color: "bg-primary/10 text-primary" },
  { icon: Calendar, label: "Daily Delight", color: "bg-secondary text-secondary-foreground" },
  { icon: Zap, label: "7UpBybit", color: "bg-accent text-accent-foreground" },
  { icon: MoreHorizontal, label: "More", color: "bg-muted text-muted-foreground" },
];

const rewards = [
  { chances: 1, type: "Lucky Draw" },
  { chances: 2, type: "Lucky Draw" },
  { chances: 2, type: "Lucky Draw" },
  { chances: 1, type: "Lucky Draw" },
];

export const Dashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState("Hot");

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
                      {showBalance ? "1,250.39" : "••••••"}
                    </span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="text-lg font-medium">USD</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    ≈ {showBalance ? "0.01462" : "••••••"} BTC
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
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-95"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${action.color} transition-transform hover:scale-105`}>
                      <action.icon className="h-5 w-5" />
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
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${market.color}`}>
                          {market.icon}
                        </div>
                        <div className="text-left">
                          <span className="font-semibold text-foreground">{market.symbol}</span>
                          <span className="text-muted-foreground">/USDT</span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <span className="w-24 text-center font-medium text-foreground">{market.price}</span>
                        <div className={`w-20 text-right flex items-center justify-end gap-0.5 font-medium ${
                          market.change >= 0 ? "text-primary" : "text-destructive"
                        }`}>
                          {market.change >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(market.change)}%
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
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${market.color}`}>
                          {market.icon}
                        </div>
                        <div className="text-left">
                          <span className="font-semibold text-foreground">{market.symbol}</span>
                          <span className="text-muted-foreground">/USDT</span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <span className="w-24 text-center font-medium text-foreground">{market.price}</span>
                        <div className={`w-20 text-right flex items-center justify-end gap-0.5 font-medium ${
                          market.change >= 0 ? "text-primary" : "text-destructive"
                        }`}>
                          {market.change >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(market.change)}%
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
    </div>
  );
};
