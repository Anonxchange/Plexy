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
import { ChevronDown, ChevronUp, Award as AwardIcon, Trophy as TrophyIcon } from "lucide-react";
import { MulticolorIcons } from "@/components/multicolor-icons";
import { medals, isMedalEarned } from "@/lib/medals";
import { getUserMedalStats } from "@/lib/medals-api";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { getCryptoPrices, type CryptoPrice } from "@/lib/crypto-prices";


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
    { icon: "Bitcoin", label: "P2P Trading", href: "/p2p" },
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
    { icon: "DollarSign", label: "Fees", href: "/fees" },
    { icon: "Award", label: "Medals", href: "/medals" },
    { icon: "Rocket", label: "Quick start", href: "#" },
    { icon: "Users", label: "Invite and earn", href: "#" },
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
        {/* Dashboard Title */}
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {/* Welcome Card */}
        <Collapsible open={welcomeOpen} onOpenChange={setWelcomeOpen} className="mb-6">
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={profileAvatar || user?.user_metadata?.avatar_url} alt="User avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {user?.user_metadata?.full_name?.substring(0, 2)?.toUpperCase() ?? 
                       user?.email?.substring(0, 2)?.toUpperCase() ?? 
                       "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <CardTitle>Welcome,</CardTitle>
                    <CardDescription>{user.email?.split('@')[0] || 'User'}</CardDescription>
                  </div>
                </div>
                {welcomeOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Joined</span>
                  <span className="text-sm">{new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current badge</span>
                  <span className="text-sm flex items-center gap-1">
                    {medalStats?.earnedMedals && medalStats.earnedMedals.length > 0 ? (
                      <img src={medals.find(m => m.id === medalStats.earnedMedals[0])?.icon} alt="Medal Icon" className="w-5 h-5" />
                    ) : (
                      <AwardIcon className="h-5 w-5 text-yellow-500" />
                    )}
                    {medalStats?.earnedMedals && medalStats.earnedMedals.length > 0 ? medals.find(m => m.id === medalStats.earnedMedals[0])?.name.toUpperCase() : "NEWBIE"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Limits</span>
                  <span className="text-sm">Unlimited</span>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Partner Program Card */}
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">New Partner Program:</h3>
                <p className="text-sm text-muted-foreground">
                  Earn <span className="text-primary font-semibold">up to 40%</span> commission lifetime and{" "}
                  <span className="font-semibold">other perks!</span>
                </p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                Join program →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="hover-elevate cursor-pointer transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10">
                  <MulticolorIcons.Rocket />
                </div>
                <div>
                  <h3 className="font-semibold">Launch hub</h3>
                  <p className="text-xs text-muted-foreground">Start trading now</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate cursor-pointer transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10">
                  <MulticolorIcons.BarChart />
                </div>
                <div>
                  <h3 className="font-semibold">Trades</h3>
                  <p className="text-xs text-muted-foreground">View your trades</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products & Services */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Product & services</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {products.slice(0, 6).map((product, index) => {
              const IconComponent = MulticolorIcons[product.icon as keyof typeof MulticolorIcons];
              return (
                <Card 
                  key={index} 
                  className="hover-elevate cursor-pointer transition-all group"
                  onClick={() => product.href !== '#' && setLocation(product.href)}
                >
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <div className="w-12 h-12">
                      <IconComponent />
                    </div>
                    <span className="text-xs text-center font-medium">{product.label}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Dialog open={productsModalOpen} onOpenChange={setProductsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Show more
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>All Products & Services</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {products.map((product, index) => {
                  const IconComponent = MulticolorIcons[product.icon as keyof typeof MulticolorIcons];
                  return (
                    <Card 
                      key={index} 
                      className="hover-elevate cursor-pointer transition-all group"
                      onClick={() => {
                        if (product.href !== '#') {
                          setLocation(product.href);
                          setProductsModalOpen(false);
                        }
                      }}
                    >
                      <CardContent className="p-4 flex flex-col items-center gap-2">
                        <div className="w-12 h-12">
                          <IconComponent />
                        </div>
                        <span className="text-xs text-center font-medium">{product.label}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Account Settings */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Account & settings</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {accountSettings.slice(0, 6).map((setting, index) => {
              const IconComponent = MulticolorIcons[setting.icon as keyof typeof MulticolorIcons];
              return (
                <Card 
                  key={index} 
                  className="hover-elevate cursor-pointer transition-all group"
                  onClick={() => setting.href !== '#' && setLocation(setting.href)}
                >
                  <CardContent className="p-4 flex flex-col items-center gap-2">
                    <div className="w-12 h-12">
                      <IconComponent />
                    </div>
                    <span className="text-xs text-center font-medium">{setting.label}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Show more
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Account & Settings</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {accountSettings.map((setting, index) => {
                  const IconComponent = MulticolorIcons[setting.icon as keyof typeof MulticolorIcons];
                  return (
                    <Card 
                      key={index} 
                      className="hover-elevate cursor-pointer transition-all group"
                      onClick={() => {
                        if (setting.href !== '#') {
                          setLocation(setting.href);
                          setAccountModalOpen(false);
                        }
                      }}
                    >
                      <CardContent className="p-4 flex flex-col items-center gap-2">
                        <div className="w-12 h-12">
                          <IconComponent />
                        </div>
                        <span className="text-xs text-center font-medium">{setting.label}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Medals Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AwardIcon className="h-5 w-5 text-yellow-500" />
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
                    <div className="text-3xl mb-2">
                      <AwardIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">No Medals Yet</div>
                    <div className="text-xs text-muted-foreground mt-1">Start trading to unlock them!</div>
                  </div>
                )}
                {medalStats?.earnedMedals && medalStats.earnedMedals.length < 4 && (
                  Array.from({ length: 4 - medalStats.earnedMedals.length }).map((_, index) => (
                    <div key={`placeholder-${index}`} className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-3xl mb-2 grayscale opacity-50">
                        <AwardIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">Locked</div>
                      <div className="text-xs text-muted-foreground mt-1">...</div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <TrophyIcon className="h-4 w-4 text-yellow-500" />
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