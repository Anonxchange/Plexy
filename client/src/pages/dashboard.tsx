import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, ChevronDown, TrendingDown, TrendingUp, MoreHorizontal, ArrowRight, Gift, Star, ChevronRight } from "lucide-react";
import { MulticolorIcons } from "@/components/multicolor-icons";
import { medals } from "@/lib/medals";
import { getUserMedalStats } from "@/lib/medals-api";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { getCryptoPrices, type CryptoPrice } from "@/lib/crypto-prices";

const tabs = ["Hot", "New", "Gainers", "Losers", "Turnover"];

const rewards = [
  { chances: 1, type: "Lucky Draw" },
  { chances: 2, type: "Lucky Draw" },
  { chances: 2, type: "Lucky Draw" },
  { chances: 1, type: "Lucky Draw" },
];

export function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState("Hot");
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [medalStats, setMedalStats] = useState<any>(null);
  const [spotPrices, setSpotPrices] = useState<Record<string, CryptoPrice>>({});
  const supabase = createClient();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    } else if (user) {
      fetchMedals();
      loadCryptoPrices();
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(loadCryptoPrices, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchMedals = async () => {
    try {
      if (!user?.id) return;
      const stats = await getUserMedalStats(user.id);
      setMedalStats(stats);
    } catch (error) {
      console.error('Error fetching medal stats:', error);
    }
  };

  const loadCryptoPrices = async () => {
    try {
      const symbols = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'BNB', 'XRP', 'TRX'];
      const prices = await getCryptoPrices(symbols);
      setSpotPrices(prices);
    } catch (error) {
      console.error('Error loading crypto prices:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const products = [
    { icon: "Users", label: "P2P Trading", href: "/p2p" },
    { icon: "Store", label: "Shop", href: "#" },
    { icon: "Wallet", label: "Wallet", href: "/wallet" },
    { icon: "Gift", label: "Gift card store", href: "#" },
    { icon: "CreditCard", label: "Visa card", href: "#" },
    { icon: "Bitcoin", label: "Buy crypto", href: "/buy" },
    { icon: "Swap", label: "Swap", href: "#" },
    { icon: "TrendingUp", label: "Spot", href: "#" },
    { icon: "Building", label: "Crypto to Bank", href: "#" },
    { icon: "Mobile", label: "Mobile top-up", href: "#" },
    { icon: "BarChart", label: "OTC Desk", href: "#" },
    { icon: "Scan", label: "Gift card checker", href: "#" },
    { icon: "Gift", label: "Pexly gift card", href: "#" },
    { icon: "Award", label: "Fees", href: "/fees" },
    { icon: "Trophy", label: "Medals", href: "/medals" },
    { icon: "Rocket", label: "Quick start", href: "#" },
    { icon: "DollarSign", label: "Invite and earn", href: "#" },
  ];

  const accountSettings = [
    { icon: "FileText", label: "My offers", href: "#" },
    { icon: "User", label: "Account settings", href: "#" },
    { icon: "Settings", label: "Trader settings", href: "#" },
    { icon: "BarChart", label: "Trade history", href: "#" },
    { icon: "CreditCard", label: "Payment accounts", href: "#" },
    { icon: "Mobile", label: "Devices", href: "#" },
    { icon: "Shield", label: "Security", href: "#" },
    { icon: "GraduationCap", label: "NoOnes academy", href: "#" },
    { icon: "Dashboard", label: "CEO dashboard", href: "#" },
    { icon: "MessageSquare", label: "Discord", href: "#" },
    { icon: "Bell", label: "Status", href: "#" },
    { icon: "HelpCircle", label: "Help center", href: "#" },
  ];

  const actions = [
    { icon: "Users", label: "P2P Trading", href: "/p2p" },
    { icon: "Gift", label: "Events", href: "#" },
    { icon: "Zap", label: "Quick Access", href: "#" },
  ];

  const spotPairs = [
    { symbol: "BTC", name: "Bitcoin", color: "bg-amber-500" },
    { symbol: "SOL", name: "Solana", color: "bg-gradient-to-r from-purple-500 to-cyan-400" },
    { symbol: "ETH", name: "Ethereum", color: "bg-slate-600" },
    { symbol: "USDC", name: "USD Coin", color: "bg-blue-500" },
    { symbol: "USDT", name: "Tether", color: "bg-green-600" },
    { symbol: "BNB", name: "BNB", color: "bg-yellow-600" },
  ].map(pair => {
    const priceData = spotPrices[pair.symbol];
    return {
      ...pair,
      price: priceData?.current_price || 0,
      change: priceData?.price_change_percentage_24h || 0,
      iconUrl: cryptoIconUrls[pair.symbol] || `https://ui-avatars.com/api/?name=${pair.symbol}&background=random`
    };
  });

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Asset Card */}
      <div className="bg-card rounded-2xl p-5 mx-4 mt-4 shadow-sm border border-border">
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
      <div className="px-4 mt-6">
        <div className="grid grid-cols-4 gap-3">
          {actions.map((action, idx) => {
            const IconComp = MulticolorIcons[action.icon as keyof typeof MulticolorIcons];
            return (
              <button
                key={idx}
                onClick={() => action.href !== '#' && setLocation(action.href)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 transition-transform hover:scale-105 hover:bg-primary/20">
                  <IconComp />
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight">
                  {action.label}
                </span>
              </button>
            );
          })}
          {/* More Products Button */}
          <Dialog open={productsModalOpen} onOpenChange={setProductsModalOpen}>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-95">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 transition-transform hover:scale-105 hover:bg-primary/20">
                  <MoreHorizontal className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight">
                  More
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">All Products & Services</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                {products.map((product, index) => {
                  const IconComponent = MulticolorIcons[product.icon as keyof typeof MulticolorIcons];
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (product.href !== '#') {
                          setLocation(product.href);
                          setProductsModalOpen(false);
                        }
                      }}
                      className={`cursor-pointer transition-all ${product.href !== '#' ? 'hover:scale-105' : 'opacity-75'}`}
                    >
                      <Card className="h-full border border-primary/20 hover:border-primary/50">
                        <CardContent className="p-4 flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <IconComponent />
                          </div>
                          <span className="text-xs text-center font-semibold">{product.label}</span>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Event Banner */}
      <div className="px-4 mt-6">
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

      {/* Markets Section */}
      <div className="mt-6">
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
            {spotPairs.map((pair) => (
              <button
                key={pair.symbol}
                onClick={() => setLocation('/spot')}
                className="w-full flex items-center justify-between py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${pair.color}`}>
                    {pair.symbol[0]}
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-foreground">{pair.symbol}</span>
                    <span className="text-muted-foreground">/USDT</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="w-24 text-center font-medium text-foreground">
                    ${pair.price > 0 ? pair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: pair.price < 1 ? 4 : 2 }) : '0.00'}
                  </span>
                  <div className={`w-20 text-right flex items-center justify-end gap-0.5 font-medium ${
                    pair.change >= 0 ? "text-primary" : "text-destructive"
                  }`}>
                    {pair.change >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(pair.change).toFixed(2)}%
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button onClick={() => setLocation('/spot')} className="flex items-center gap-1 text-primary font-medium text-sm mt-4 hover:gap-2 transition-all">
            Market Overview
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-3 bg-muted mt-6"></div>

      {/* Account Settings Section */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-foreground">Account & Settings</h2>
          <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1 px-4 py-2 bg-muted rounded-full text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
                More Options
                <ChevronRight className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">All Account & Settings</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                {accountSettings.map((setting, index) => {
                  const IconComponent = MulticolorIcons[setting.icon as keyof typeof MulticolorIcons];
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (setting.href !== '#') {
                          setLocation(setting.href);
                          setAccountModalOpen(false);
                        }
                      }}
                      className="cursor-pointer transition-all hover:scale-105"
                    >
                      <Card className="h-full border border-primary/20 hover:border-primary/50">
                        <CardContent className="p-4 flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <IconComponent />
                          </div>
                          <span className="text-xs text-center font-semibold">{setting.label}</span>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          Manage your account and preferences
        </p>

        <div className="space-y-3">
          {accountSettings.slice(0, 3).map((setting, index) => {
            const IconComponent = MulticolorIcons[setting.icon as keyof typeof MulticolorIcons];
            return (
              <div
                key={index}
                onClick={() => setting.href !== '#' && setLocation(setting.href)}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                  <IconComponent />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {setting.label}
                  </h3>
                  <p className="text-muted-foreground text-sm">Manage settings</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Rewards Section */}
      <div className="px-4 py-6">
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

        <div className="space-y-3">
          {rewards.map((reward, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
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

      {/* Medals Section */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Your Medals</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={() => setLocation("/medals")}
          >
            View all →
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {medalStats?.earnedMedals && medalStats.earnedMedals.length > 0 ? (
                medalStats.earnedMedals.slice(0, 4).map((medalId: string) => {
                  const medal = medals.find(m => m.id === medalId);
                  if (!medal) return null;
                  return (
                    <div key={medal.id} className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <img src={medal.icon} alt={medal.name} className="text-3xl mb-2 w-10 h-10 mx-auto" />
                      <div className="text-sm font-medium">{medal.name.toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground mt-1">{medal.description}</div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-3 rounded-lg bg-muted/50 col-span-4">
                  <div className="w-8 h-8 mx-auto mb-2">
                    <MulticolorIcons.Award />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">No Medals Yet</div>
                  <div className="text-xs text-muted-foreground mt-1">Start trading to unlock them!</div>
                </div>
              )}
              {medalStats?.earnedMedals && medalStats.earnedMedals.length < 4 && (
                Array.from({ length: 4 - medalStats.earnedMedals.length }).map((_, index) => (
                  <div key={`placeholder-${index}`} className="text-center p-3 rounded-lg bg-muted/50 border border-muted-foreground/20">
                    <div className="w-8 h-8 mx-auto mb-2 grayscale opacity-50">
                      <MulticolorIcons.Award />
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">Locked</div>
                    <div className="text-xs text-muted-foreground mt-1">Coming soon</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sign Out */}
      <div className="flex justify-center p-6">
        <Button onClick={handleSignOut} variant="outline" size="lg" className="hover:bg-destructive/10 hover:text-destructive">
          Log out
        </Button>
      </div>

      <PexlyFooter />
    </div>
  );
}
