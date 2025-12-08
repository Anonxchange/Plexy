import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  Package,
  History,
  Users,
  Star,
  ThumbsUp,
  ThumbsDown,
  Lock,
  BarChart3,
  Award,
  QrCode,
  Medal,
  Settings,
  Code,
  MoreVertical,
  ChevronDown,
  ArrowUpDown,
  Menu,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FavoriteOffer {
  id: string;
  offer_id: string;
  offer_type: "buy" | "sell";
  user_id: string;
  username: string;
  avatar_url?: string;
  positive_feedback: number;
  negative_feedback: number;
  is_online: boolean;
  last_seen?: string;
  total_trades: number;
  success_rate: number;
  crypto_symbol: string;
  fiat_currency: string;
}

const getCountryFlag = (countryName: string | undefined | null): string => {
  if (!countryName) return '🌍';
  switch (countryName.toLowerCase()) {
    case 'united states': return '🇺🇸';
    case 'nigeria': return '🇳🇬';
    case 'ghana': return '🇬🇭';
    case 'kenya': return '🇰🇪';
    case 'south africa': return '🇿🇦';
    case 'united kingdom': return '🇬🇧';
    default: return '🌍';
  }
};

export function FavoriteOffers() {
  const [activeTab, setActiveTab] = useState<"sell" | "buy">("sell");
  const [sortBy, setSortBy] = useState("recommended");
  const [favorites, setFavorites] = useState<FavoriteOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data: favoriteData, error } = await supabase
        .from("favorite_offers")
        .select(`
          id,
          offer_id,
          p2p_offers (
            id,
            offer_type,
            user_id,
            crypto_symbol,
            fiat_currency,
            profiles (
              id,
              username,
              avatar_url,
              positive_feedback,
              negative_feedback,
              is_online,
              last_seen,
              total_trades,
              success_rate
            )
          )
        `)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error fetching favorites:", error);
        setFavorites([]);
        return;
      }

      const mapped = (favoriteData || []).map((fav: any) => ({
        id: fav.id,
        offer_id: fav.offer_id,
        offer_type: fav.p2p_offers?.offer_type || "sell",
        user_id: fav.p2p_offers?.user_id || "",
        username: fav.p2p_offers?.profiles?.username || "Unknown",
        avatar_url: fav.p2p_offers?.profiles?.avatar_url,
        positive_feedback: fav.p2p_offers?.profiles?.positive_feedback || 0,
        negative_feedback: fav.p2p_offers?.profiles?.negative_feedback || 0,
        is_online: fav.p2p_offers?.profiles?.is_online || false,
        last_seen: fav.p2p_offers?.profiles?.last_seen,
        total_trades: fav.p2p_offers?.profiles?.total_trades || 0,
        success_rate: fav.p2p_offers?.profiles?.success_rate || 0,
        crypto_symbol: fav.p2p_offers?.crypto_symbol || "BTC",
        fiat_currency: fav.p2p_offers?.fiat_currency || "USD",
      }));

      setFavorites(mapped);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFavorites = favorites.filter(
    (f) => f.offer_type === activeTab
  );

  const sellCount = favorites.filter((f) => f.offer_type === "sell").length;
  const buyCount = favorites.filter((f) => f.offer_type === "buy").length;

  const getActiveStatus = (isOnline: boolean, lastSeen?: string) => {
    if (isOnline) return "Active now";
    if (!lastSeen) return "Offline";
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / 60000);
    if (diffMinutes < 60) return `Active ${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `Active ${Math.floor(diffMinutes / 60)}h ago`;
    return `Active ${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-6">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Favorite Offers</h1>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      Account
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/my-offers')}>
                      <Package className="h-4 w-4 mr-2" />
                      My Offers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                      <History className="h-4 w-4 mr-2" />
                      Trade History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorite-offers')} className="bg-primary/10">
                      <Star className="h-4 w-4 mr-2" />
                      Favorite Offers
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                      <History className="h-4 w-4 mr-2" />
                      Trade History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/p2p')}>
                      <Users className="h-4 w-4 mr-2" />
                      Recent Trade Partners
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-offers')}>
                      <Package className="h-4 w-4 mr-2" />
                      My Offers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorite-offers')} className="bg-primary/10">
                      <Star className="h-4 w-4 mr-2" />
                      Favorite Offers
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/trusted-users')}>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/blocked-users')}>
                      <Lock className="h-4 w-4 mr-2" />
                      Blocked Users
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/trade-statistics')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Trade Statistics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/merchant-application')}>
                      <Award className="h-4 w-4 mr-2" />
                      Become a Merchant
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Share Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/medals')}>
                      <Medal className="h-4 w-4 mr-2" />
                      Medals
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open('https://docs.replit.com', '_blank')}>
                      <Code className="h-4 w-4 mr-2" />
                      Developer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-border">
              <button
                onClick={() => setActiveTab("sell")}
                className={`pb-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                  activeTab === "sell"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sell cryptocurrency
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                  {sellCount}
                </Badge>
              </button>
              <button
                onClick={() => setActiveTab("buy")}
                className={`pb-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                  activeTab === "buy"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Buy cryptocurrency
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                  {buyCount}
                </Badge>
              </button>
            </div>

            {/* Sort By */}
            <div className="flex justify-end mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-muted-foreground">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort By
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("recommended")}>
                    Recommended
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("trades")}>
                    Most Trades
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("rating")}>
                    Highest Rating
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("recent")}>
                    Recently Added
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Favorites List */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading favorites...</p>
              </div>
            ) : filteredFavorites.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No favorite offers yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Browse offers and add your favorites for quick access
                  </p>
                  <Link href="/p2p">
                    <Button>Browse Offers</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredFavorites.map((favorite) => (
                  <Card
                    key={favorite.id}
                    className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/offers/${favorite.offer_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12 border-2 border-primary">
                            <AvatarImage src={favorite.avatar_url} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                              {favorite.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {favorite.is_online && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">
                            {favorite.username}
                          </h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex items-center gap-1 text-green-500">
                              <ThumbsUp className="h-3.5 w-3.5" />
                              {favorite.positive_feedback.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                              <ThumbsDown className="h-3.5 w-3.5" />
                              {favorite.negative_feedback}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${favorite.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                              {getActiveStatus(favorite.is_online, favorite.last_seen)}
                            </span>
                            <span>
                              Trades: {favorite.total_trades.toLocaleString()} | <span className="text-green-500">{favorite.success_rate} %</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Desktop 2-Column Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Left Sidebar - Navigation Menu */}
            <div className="lg:col-span-3">
              <Card className="bg-card border-border sticky top-6">
                <CardContent className="p-4">
                  <h2 className="text-lg font-bold mb-4">Menu</h2>
                  <nav className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/my-offers')}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      My Offers
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/trade-history')}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Trade History
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/p2p')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Recent Trade Partners
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start bg-primary/10"
                      onClick={() => navigate('/favorite-offers')}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Favorite Offers
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/p2p')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/p2p')}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Blocked Users
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/trade-history')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Trade Statistics
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/merchant-application')}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Become a Merchant
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/profile')}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Share Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/medals')}
                    >
                      <Medal className="h-4 w-4 mr-2" />
                      Medals
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/account-settings')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => window.open('https://docs.replit.com', '_blank')}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Developer
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-9">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Favorite Offers</h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      Account
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/my-offers')}>
                      <Package className="h-4 w-4 mr-2" />
                      My Offers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                      <History className="h-4 w-4 mr-2" />
                      Trade History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorite-offers')} className="bg-primary/10">
                      <Star className="h-4 w-4 mr-2" />
                      Favorite Offers
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 mb-6 border-b border-border">
                <button
                  onClick={() => setActiveTab("sell")}
                  className={`pb-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeTab === "sell"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sell cryptocurrency
                  <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                    {sellCount}
                  </Badge>
                </button>
                <button
                  onClick={() => setActiveTab("buy")}
                  className={`pb-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeTab === "buy"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buy cryptocurrency
                  <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                    {buyCount}
                  </Badge>
                </button>
              </div>

              {/* Sort By */}
              <div className="flex justify-end mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 text-muted-foreground">
                      <ArrowUpDown className="h-4 w-4" />
                      Sort By
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy("recommended")}>
                      Recommended
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("trades")}>
                      Most Trades
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("rating")}>
                      Highest Rating
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("recent")}>
                      Recently Added
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Favorites List */}
              {loading ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">Loading favorites...</p>
                  </CardContent>
                </Card>
              ) : filteredFavorites.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No favorite offers yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Browse offers and add your favorites for quick access
                    </p>
                    <Link href="/p2p">
                      <Button>Browse Offers</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredFavorites.map((favorite) => (
                    <Card
                      key={favorite.id}
                      className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/offers/${favorite.offer_id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="w-14 h-14 border-2 border-primary">
                              <AvatarImage src={favorite.avatar_url} />
                              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                                {favorite.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {favorite.is_online && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                              {favorite.username}
                            </h3>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="flex items-center gap-1 text-green-500">
                                <ThumbsUp className="h-4 w-4" />
                                {favorite.positive_feedback.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1 text-red-500">
                                <ThumbsDown className="h-4 w-4" />
                                {favorite.negative_feedback}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${favorite.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {getActiveStatus(favorite.is_online, favorite.last_seen)}
                              </span>
                              <span>
                                Trades: {favorite.total_trades.toLocaleString()} | <span className="text-green-500">{favorite.success_rate} %</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <PexlyFooter />
      </div>
    </>
  );
}

export default FavoriteOffers;
