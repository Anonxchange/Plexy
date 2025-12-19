import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MulticolorIcons } from "@/components/multicolor-icons";
import { medals, isMedalEarned } from "@/lib/medals";
import { getUserMedalStats } from "@/lib/medals-api";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { getCryptoPrices, type CryptoPrice } from "@/lib/crypto-prices";
import { getVerificationLevel } from "@shared/verification-levels";


export function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string>("");
  const [medalStats, setMedalStats] = useState<any>(null);
  const [spotPrices, setSpotPrices] = useState<Record<string, CryptoPrice>>({});
  const supabase = createClient();

  const avatarTypes = [
    { id: 'default', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' },
    { id: 'trader', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader' },
    { id: 'crypto', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto' },
    { id: 'robot', image: 'https://api.dicebear.com/7.x/bottts/svg?seed=robot' },
    { id: 'ninja', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ninja' },
    { id: 'astronaut', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=astronaut' },
    { id: 'developer', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer' },
    { id: 'artist', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist' },
  ];

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    } else if (user) {
      fetchProfileAvatar();
      fetchMedals();
      loadCryptoPrices();
    }
  }, [user, loading, setLocation]);

  // Fetch crypto prices periodically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(loadCryptoPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const fetchProfileAvatar = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('avatar_url, avatar_type')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile avatar:', error);
        return;
      }

      if (data?.avatar_url) {
        setProfileAvatar(data.avatar_url);
      } else if (data?.avatar_type) {
        const selectedAvatar = avatarTypes.find(a => a.id === data.avatar_type);
        if (selectedAvatar) {
          setProfileAvatar(selectedAvatar.image);
        }
      }
    } catch (error) {
      console.error('Error fetching profile avatar:', error);
    }
  };

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

  // Use real crypto prices from API
  const spotPairs = [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDT", name: "Tether" },
    { symbol: "BNB", name: "BNB" },
    { symbol: "SOL", name: "Solana" },
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "XRP", name: "Ripple" },
    { symbol: "TRX", name: "Tron" },
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
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* My Assets Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-2xl font-bold">My Assets</h2>
            <div className="w-5 h-5 text-muted-foreground">👁️</div>
          </div>
          <Card>
            <CardContent className="p-8">
              <div className="space-y-4">
                <div>
                  <div className="text-4xl font-bold">0.39 <span className="text-lg text-muted-foreground">USD</span></div>
                  <div className="text-sm text-muted-foreground mt-1">≈ 0.00000462 BTC</div>
                </div>
                <Button variant="ghost" className="text-primary font-semibold p-0 h-auto">
                  Asset Details →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Events/Promotions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="text-3xl">🏆</div>
              <div>
                <h3 className="font-semibold">Boost Battle is live!</h3>
                <p className="text-xs text-muted-foreground mt-1">Join now to compete</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="text-3xl">🎁</div>
              <div>
                <h3 className="font-semibold">Special Rewards Available</h3>
                <p className="text-xs text-muted-foreground mt-1">Claim your bonus</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product & Services Section - Compact */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Product & services</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 3).map((product, index) => {
              const IconComponent = MulticolorIcons[product.icon as keyof typeof MulticolorIcons];
              return (
                <div
                  key={index}
                  onClick={() => product.href !== '#' && setLocation(product.href)}
                  className={`relative group cursor-pointer transition-all duration-300 ${product.href !== '#' ? 'hover:scale-105' : 'opacity-75'}`}
                >
                  <Card className="relative h-full border border-primary/20 hover:border-primary/50 hover:shadow-lg transition-all">
                    <CardContent className="p-6 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent />
                      </div>
                      <span className="text-xs text-center font-semibold text-foreground">{product.label}</span>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
            {/* More Button */}
            <Dialog open={productsModalOpen} onOpenChange={setProductsModalOpen}>
              <DialogTrigger asChild>
                <div className="cursor-pointer transition-all hover:scale-105">
                  <Card className="relative h-full border border-primary/20 hover:border-primary/50 hover:shadow-lg transition-all">
                    <CardContent className="p-6 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                        ⋯
                      </div>
                      <span className="text-xs text-center font-semibold text-foreground">More</span>
                    </CardContent>
                  </Card>
                </div>
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

        {/* Account Settings */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Account & settings</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {accountSettings.slice(0, 3).map((setting, index) => {
              const IconComponent = MulticolorIcons[setting.icon as keyof typeof MulticolorIcons];
              return (
                <div
                  key={index}
                  onClick={() => setting.href !== '#' && setLocation(setting.href)}
                  className="relative group cursor-pointer transition-all duration-300 hover:scale-105"
                >
                  <Card className="relative h-full border border-primary/20 hover:border-primary/50 hover:shadow-lg transition-all">
                    <CardContent className="p-6 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent />
                      </div>
                      <span className="text-xs text-center font-semibold text-foreground">{setting.label}</span>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
            {/* More Button */}
            <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
              <DialogTrigger asChild>
                <div className="cursor-pointer transition-all hover:scale-105">
                  <Card className="relative h-full border border-primary/20 hover:border-primary/50 hover:shadow-lg transition-all">
                    <CardContent className="p-6 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                        ⋯
                      </div>
                      <span className="text-xs text-center font-semibold text-foreground">More</span>
                    </CardContent>
                  </Card>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Account & Settings</DialogTitle>
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
        </div>

        {/* Medals Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <div className="w-5 h-5">
                <MulticolorIcons.Award />
              </div>
              Your Medals
            </h2>
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
                      <div key={medal.id} className="text-center p-3 rounded-lg bg-primary/5">
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
                    <div key={`placeholder-${index}`} className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 mx-auto mb-2 grayscale opacity-50">
                        <MulticolorIcons.Award />
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">Locked</div>
                      <div className="text-xs text-muted-foreground mt-1">...</div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="w-4 h-4">
                  <MulticolorIcons.Trophy />
                </div>
                <span className="text-sm font-medium">{medalStats?.earnedMedals?.length || 0} Medal{medalStats?.earnedMedals?.length !== 1 ? 's' : ''} Earned</span>
                <span className="text-xs text-muted-foreground">• Keep trading to unlock more!</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spot Exchange */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Spot exchange</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View all 50+ coins →
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-2 mb-4 overflow-x-auto">
                <Button size="sm" variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                  🔥 Hot pairs
                </Button>
                <Button size="sm" variant="outline">
                  Top movers
                </Button>
                <Button size="sm" variant="outline">
                  Recently added
                </Button>
              </div>
              <div className="space-y-3">
                {spotPairs.map((pair, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setLocation('/spot')}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={pair.iconUrl}
                        alt={pair.symbol}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${pair.symbol}&background=random`;
                        }}
                      />
                      <div>
                        <div className="font-semibold">{pair.symbol}</div>
                        <div className="text-xs text-muted-foreground">{pair.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${pair.price > 0 ? pair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: pair.price < 1 ? 4 : 2 }) : '0.00'}
                      </div>
                      <div className={`text-xs font-semibold ${pair.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sign Out */}
        <div className="flex justify-center pt-6">
          <Button onClick={handleSignOut} variant="outline" size="lg">
            Log out
          </Button>
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}