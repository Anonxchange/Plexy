import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  Package,
  History,
  Users,
  Star,
  ThumbsUp,
  Lock,
  BarChart3,
  Award,
  QrCode,
  Medal,
  Settings,
  Code,
  ChevronDown,
  Menu,
  ExternalLink,
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
import { cryptoIconUrls } from "@/lib/crypto-icons";

interface TradeStats {
  monthlyTradedBTC: number;
  previousMonthBTC: number;
  monthlyTradedUSDT: number;
  previousMonthUSDT: number;
  monthlySuccessfulTrades: Record<string, number>;
  previousMonthSuccessfulTrades: Record<string, number>;
  monthlyTotalUSD: number;
  previousMonthTotalUSD: number;
  monthlyClosingRatio: number;
}

interface SuccessfulTrade {
  id: string;
  payment_method: string;
  amount: number;
  crypto_symbol: string;
  partner_username: string;
  partner_id: string;
}

interface TrustedUser {
  id: string;
  username: string;
  added_at: string;
}

const CRYPTO_LIST = ['BTC', 'USDT', 'ETH', 'USDC', 'BNB', 'LTC', 'SOL', 'TON', 'TRX', 'XMR'];

export function TradeStatistics() {
  const [stats, setStats] = useState<TradeStats>({
    monthlyTradedBTC: 0,
    previousMonthBTC: 0,
    monthlyTradedUSDT: 0,
    previousMonthUSDT: 0,
    monthlySuccessfulTrades: {},
    previousMonthSuccessfulTrades: {},
    monthlyTotalUSD: 0,
    previousMonthTotalUSD: 0,
    monthlyClosingRatio: 0,
  });
  const [successfulTrades, setSuccessfulTrades] = useState<SuccessfulTrade[]>([]);
  const [trustedUsers, setTrustedUsers] = useState<TrustedUser[]>([]);
  const [expiredOffers, setExpiredOffers] = useState<any[]>([]);
  const [cancelledOffers, setCancelledOffers] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user) {
      fetchTradeStatistics();
    }
  }, [user]);

  const fetchTradeStatistics = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const currentMonthStart = new Date(currentYear, currentMonth, 1).toISOString();
      const previousMonthStart = new Date(previousMonthYear, previousMonth, 1).toISOString();
      const previousMonthEnd = new Date(currentYear, currentMonth, 1).toISOString();

      const { data: trades, error: tradesError } = await supabase
        .from("p2p_trades")
        .select(`
          id,
          crypto_amount,
          crypto_symbol,
          fiat_amount,
          fiat_currency,
          status,
          created_at,
          completed_at,
          payment_method,
          buyer_id,
          seller_id,
          buyer:buyer_id (id, username),
          seller:seller_id (id, username)
        `)
        .eq("status", "completed")
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order("completed_at", { ascending: false });

      if (!tradesError && trades) {
        const monthlyTrades: Record<string, number> = {};
        const previousMonthTrades: Record<string, number> = {};
        let monthlyBTC = 0;
        let prevMonthBTC = 0;
        let monthlyUSDT = 0;
        let prevMonthUSDT = 0;
        let monthlyTotal = 0;
        let prevMonthTotal = 0;

        CRYPTO_LIST.forEach(crypto => {
          monthlyTrades[crypto] = 0;
          previousMonthTrades[crypto] = 0;
        });

        trades.forEach((trade: any) => {
          const tradeDate = new Date(trade.completed_at || trade.created_at);
          const isCurrentMonth = tradeDate >= new Date(currentMonthStart);
          const isPreviousMonth = tradeDate >= new Date(previousMonthStart) && tradeDate < new Date(previousMonthEnd);

          if (isCurrentMonth) {
            monthlyTrades[trade.crypto_symbol] = (monthlyTrades[trade.crypto_symbol] || 0) + 1;
            if (trade.crypto_symbol === 'BTC') monthlyBTC += parseFloat(trade.crypto_amount) || 0;
            if (trade.crypto_symbol === 'USDT') monthlyUSDT += parseFloat(trade.crypto_amount) || 0;
            monthlyTotal += parseFloat(trade.fiat_amount) || 0;
          }
          if (isPreviousMonth) {
            previousMonthTrades[trade.crypto_symbol] = (previousMonthTrades[trade.crypto_symbol] || 0) + 1;
            if (trade.crypto_symbol === 'BTC') prevMonthBTC += parseFloat(trade.crypto_amount) || 0;
            if (trade.crypto_symbol === 'USDT') prevMonthUSDT += parseFloat(trade.crypto_amount) || 0;
            prevMonthTotal += parseFloat(trade.fiat_amount) || 0;
          }
        });

        const last5Trades = trades.slice(0, 5).map((trade: any) => ({
          id: trade.id,
          payment_method: trade.payment_method || "Unknown",
          amount: parseFloat(trade.crypto_amount) || 0,
          crypto_symbol: trade.crypto_symbol,
          partner_username: trade.buyer_id === user?.id 
            ? (trade.seller as any)?.username || "Unknown"
            : (trade.buyer as any)?.username || "Unknown",
          partner_id: trade.buyer_id === user?.id ? trade.seller_id : trade.buyer_id,
        }));

        setSuccessfulTrades(last5Trades);

        setStats({
          monthlyTradedBTC: monthlyBTC,
          previousMonthBTC: prevMonthBTC,
          monthlyTradedUSDT: monthlyUSDT,
          previousMonthUSDT: prevMonthUSDT,
          monthlySuccessfulTrades: monthlyTrades,
          previousMonthSuccessfulTrades: previousMonthTrades,
          monthlyTotalUSD: monthlyTotal,
          previousMonthTotalUSD: prevMonthTotal,
          monthlyClosingRatio: trades.length > 0 ? 100 : 0,
        });
      }

      const { data: trusted, error: trustedError } = await supabase
        .from("trusted_users")
        .select(`
          id,
          created_at,
          profiles:trusted_user_id (username)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!trustedError && trusted) {
        setTrustedUsers(trusted.map((t: any) => ({
          id: t.id,
          username: t.profiles?.username || "Unknown",
          added_at: t.created_at,
        })));
      }

      const { data: offers, error: offersError } = await supabase
        .from("p2p_offers")
        .select("payment_methods")
        .eq("user_id", user?.id);

      if (!offersError && offers) {
        const methods = new Set<string>();
        offers.forEach((offer: any) => {
          if (Array.isArray(offer.payment_methods)) {
            offer.payment_methods.forEach((m: string) => methods.add(m));
          }
        });
        setPaymentMethods(Array.from(methods));
      }

    } catch (error) {
      console.error("Error fetching trade statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPreviousMonthName = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    return months[prevMonth];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-6">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Trade Statistics</h1>
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
                    <DropdownMenuItem onClick={() => navigate('/favorite-offers')}>
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
                    <DropdownMenuItem onClick={() => navigate('/trade-statistics')} className="bg-primary/10">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Trade Statistics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
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
                    <DropdownMenuItem onClick={() => navigate('/favorite-offers')}>
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
                    <DropdownMenuItem onClick={() => navigate('/trade-statistics')} className="bg-primary/10">
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

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading statistics...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Balance Section */}
                <div>
                  <h2 className="text-xl font-bold mb-4">Balance</h2>
                  
                  <Card className="bg-card border-border mb-4">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">Monthly traded Bitcoin in total</p>
                      <div className="flex items-center gap-3 mb-3">
                        <img src={cryptoIconUrls.BTC} alt="BTC" className="w-10 h-10" />
                        <span className="text-2xl font-bold">{stats.monthlyTradedBTC.toFixed(8)} BTC</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="text-foreground font-medium">{stats.previousMonthBTC.toFixed(8)} BTC</span> were sold and bought
                        <br />in the previous month ({getPreviousMonthName()})
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">Monthly traded Tether in total</p>
                      <div className="flex items-center gap-3 mb-3">
                        <img src={cryptoIconUrls.USDT} alt="USDT" className="w-10 h-10" />
                        <span className="text-2xl font-bold">{stats.monthlyTradedUSDT.toFixed(0)} USDT</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="text-foreground font-medium">{stats.previousMonthUSDT.toFixed(0)} USDT</span> were sold and bought
                        <br />in the previous month ({getPreviousMonthName()})
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Trades Section */}
                <div>
                  <h2 className="text-xl font-bold mb-4">Trades</h2>
                  
                  <Card className="bg-card border-border mb-4">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-4">Monthly successful trades</p>
                      <div className="space-y-3">
                        {CRYPTO_LIST.map((crypto) => (
                          <p key={crypto} className="text-lg font-bold">
                            {stats.monthlySuccessfulTrades[crypto] || 0} {crypto} trades
                          </p>
                        ))}
                      </div>
                      <Separator className="my-4" />
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {CRYPTO_LIST.map((crypto) => (
                          <p key={`prev-${crypto}`}>
                            <span className="text-foreground font-medium">{stats.previousMonthSuccessfulTrades[crypto] || 0}</span> successful {crypto} trades
                          </p>
                        ))}
                        <p className="pt-2">in the previous month ({getPreviousMonthName()})</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border mb-4">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">Monthly total</p>
                      <p className="text-2xl font-bold mb-3">{stats.monthlyTotalUSD.toFixed(6)} USD</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="text-foreground font-medium">{stats.previousMonthTotalUSD.toFixed(6)} USD</span> were sold and bought
                        <br />in the previous month ({getPreviousMonthName()})
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">Monthly closing ratio</p>
                      <p className="text-2xl font-bold">{stats.monthlyClosingRatio.toFixed(2)}%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Successful Offers */}
                <div>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">Top successful offers</h3>
                      <p className="text-sm text-muted-foreground mb-4">Best offers by closing ratio</p>
                      <p className="text-muted-foreground">No successful sell trades yet.</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Expired Offers */}
                <div>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">Expired</h3>
                      <p className="text-sm text-muted-foreground mb-4">Most expired offers</p>
                      <p className="text-muted-foreground">No expired offers yet.</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Cancelled Offers */}
                <div>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">Cancelled</h3>
                      <p className="text-sm text-muted-foreground mb-4">Most cancelled offers by buyers</p>
                      <p className="text-muted-foreground">No cancelled trades with surveys yet.</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Methods */}
                <div>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">Payment methods</h3>
                      <p className="text-sm text-muted-foreground mb-4">Payment methods</p>
                      {paymentMethods.length === 0 ? (
                        <p className="text-muted-foreground">No payment methods.</p>
                      ) : (
                        <div className="space-y-2">
                          {paymentMethods.map((method, idx) => (
                            <p key={idx}>{method}</p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Last 5 Successful Trades */}
                <div>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-4">Last 5 successful trades</h3>
                      {successfulTrades.length === 0 ? (
                        <p className="text-muted-foreground">No successful trades yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {successfulTrades.map((trade) => (
                            <div 
                              key={trade.id}
                              className="flex items-center justify-between py-2 border-b border-border last:border-0"
                            >
                              <div>
                                <p className="font-medium">{trade.payment_method} ({trade.amount.toFixed(8)} {trade.crypto_symbol})</p>
                                <p className="text-sm text-muted-foreground">Partner: {trade.partner_username}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/profile/${trade.partner_id}`)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {successfulTrades.length > 0 && (
                        <Button 
                          className="w-full mt-4 bg-primary text-primary-foreground"
                          onClick={() => navigate('/trade-history')}
                        >
                          SHOW ALL
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recently Trusted Users */}
                <div>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-4">Recently trusted users</h3>
                      {trustedUsers.length === 0 ? (
                        <p className="text-muted-foreground">No trusted users yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {trustedUsers.map((user) => (
                            <div 
                              key={user.id}
                              className="flex items-center justify-between py-2 border-b border-border last:border-0"
                            >
                              <div>
                                <p className="font-medium">{user.username}</p>
                                <p className="text-sm text-muted-foreground">Added: {formatDate(user.added_at)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {trustedUsers.length > 0 && (
                        <Button 
                          className="w-full mt-4 bg-primary text-primary-foreground"
                          onClick={() => navigate('/trusted-users')}
                        >
                          SHOW ALL
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
                      className="w-full justify-start"
                      onClick={() => navigate('/favorite-offers')}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Favorite Offers
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/trusted-users')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/blocked-users')}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Blocked Users
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start bg-primary/10"
                      onClick={() => navigate('/trade-statistics')}
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
                <h1 className="text-3xl font-bold">Trade Statistics</h1>
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
                    <DropdownMenuItem onClick={() => navigate('/favorite-offers')}>
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
                    <DropdownMenuItem onClick={() => navigate('/trade-statistics')} className="bg-primary/10">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Trade Statistics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {loading ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">Loading statistics...</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Balance Section */}
                  <div>
                    <h2 className="text-xl font-bold mb-4">Balance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-card border-border">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-2">Monthly traded Bitcoin in total</p>
                          <div className="flex items-center gap-3 mb-3">
                            <img src={cryptoIconUrls.BTC} alt="BTC" className="w-10 h-10" />
                            <span className="text-2xl font-bold">{stats.monthlyTradedBTC.toFixed(8)} BTC</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <span className="text-foreground font-medium">{stats.previousMonthBTC.toFixed(8)} BTC</span> were sold and bought
                            <br />in the previous month ({getPreviousMonthName()})
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-card border-border">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-2">Monthly traded Tether in total</p>
                          <div className="flex items-center gap-3 mb-3">
                            <img src={cryptoIconUrls.USDT} alt="USDT" className="w-10 h-10" />
                            <span className="text-2xl font-bold">{stats.monthlyTradedUSDT.toFixed(0)} USDT</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <span className="text-foreground font-medium">{stats.previousMonthUSDT.toFixed(0)} USDT</span> were sold and bought
                            <br />in the previous month ({getPreviousMonthName()})
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Trades Section */}
                  <div>
                    <h2 className="text-xl font-bold mb-4">Trades</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-card border-border">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-4">Monthly successful trades</p>
                          <div className="space-y-2">
                            {CRYPTO_LIST.map((crypto) => (
                              <p key={crypto} className="text-lg font-bold">
                                {stats.monthlySuccessfulTrades[crypto] || 0} {crypto} trades
                              </p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-card border-border">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-2">Monthly total</p>
                          <p className="text-2xl font-bold mb-3">{stats.monthlyTotalUSD.toFixed(6)} USD</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="text-foreground font-medium">{stats.previousMonthTotalUSD.toFixed(6)} USD</span> were sold and bought
                            <br />in the previous month ({getPreviousMonthName()})
                          </p>
                          <Separator className="my-4" />
                          <p className="text-sm text-muted-foreground mb-2">Monthly closing ratio</p>
                          <p className="text-2xl font-bold">{stats.monthlyClosingRatio.toFixed(2)}%</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Additional Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">Top successful offers</h3>
                        <p className="text-sm text-muted-foreground mb-4">Best offers by closing ratio</p>
                        <p className="text-muted-foreground">No successful sell trades yet.</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">Expired</h3>
                        <p className="text-sm text-muted-foreground mb-4">Most expired offers</p>
                        <p className="text-muted-foreground">No expired offers yet.</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">Cancelled</h3>
                        <p className="text-sm text-muted-foreground mb-4">Most cancelled offers by buyers</p>
                        <p className="text-muted-foreground">No cancelled trades with surveys yet.</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">Payment methods</h3>
                        <p className="text-sm text-muted-foreground mb-4">Payment methods</p>
                        {paymentMethods.length === 0 ? (
                          <p className="text-muted-foreground">No payment methods.</p>
                        ) : (
                          <div className="space-y-2">
                            {paymentMethods.map((method, idx) => (
                              <p key={idx}>{method}</p>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Last 5 Successful Trades */}
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-4">Last 5 successful trades</h3>
                      {successfulTrades.length === 0 ? (
                        <p className="text-muted-foreground">No successful trades yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {successfulTrades.map((trade) => (
                            <div 
                              key={trade.id}
                              className="flex items-center justify-between py-2 border-b border-border last:border-0"
                            >
                              <div>
                                <p className="font-medium">{trade.payment_method} ({trade.amount.toFixed(8)} {trade.crypto_symbol})</p>
                                <p className="text-sm text-muted-foreground">Partner: {trade.partner_username}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/profile/${trade.partner_id}`)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {successfulTrades.length > 0 && (
                        <Button 
                          className="w-full mt-4 bg-primary text-primary-foreground"
                          onClick={() => navigate('/trade-history')}
                        >
                          SHOW ALL
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recently Trusted Users */}
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-4">Recently trusted users</h3>
                      {trustedUsers.length === 0 ? (
                        <p className="text-muted-foreground">No trusted users yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {trustedUsers.map((user) => (
                            <div 
                              key={user.id}
                              className="flex items-center justify-between py-2 border-b border-border last:border-0"
                            >
                              <div>
                                <p className="font-medium">{user.username}</p>
                                <p className="text-sm text-muted-foreground">Added: {formatDate(user.added_at)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {trustedUsers.length > 0 && (
                        <Button 
                          className="w-full mt-4 bg-primary text-primary-foreground"
                          onClick={() => navigate('/trusted-users')}
                        >
                          SHOW ALL
                        </Button>
                      )}
                    </CardContent>
                  </Card>
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

export default TradeStatistics;
