import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  SlidersHorizontal, 
  Download, 
  Copy,
  Bitcoin,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
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
  Code
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { useIsMobile } from "@/hooks/use-mobile";

interface Trade {
  id: string;
  buyer_id: string;
  seller_id: string;
  crypto_symbol: string;
  crypto_amount: number;
  fiat_currency: string;
  fiat_amount: number;
  price: number;
  payment_method: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  buyer_profile?: {
    username: string;
    avatar_url: string | null;
  };
  seller_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export function TradeHistory() {
  const { user } = useAuth();
  const supabase = createClient();
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [completedTradesOpen, setCompletedTradesOpen] = useState(false);
  const [tradeVolumes, setTradeVolumes] = useState({
    BTC: 0,
    USDT: 0,
    ETH: 0,
    USDC: 0,
    SOL: 0,
    TON: 0,
    XMR: 0
  });
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [canceledCount, setCanceledCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCurrentUserProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    if (currentUserProfileId) {
      fetchTradeStatistics();
      fetchAllTrades();
    }
  }, [currentUserProfileId]);

  const fetchCurrentUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setCurrentUserProfileId(data.id);
      }
    } catch (error) {
      console.error("Error fetching current user profile:", error);
    }
  };

  const fetchTradeStatistics = async () => {
    if (!currentUserProfileId) return;

    try {
      // Fetch all user trades
      const { data: tradesData, error } = await supabase
        .from('p2p_trades')
        .select('*')
        .or(`buyer_id.eq.${currentUserProfileId},seller_id.eq.${currentUserProfileId}`);

      if (error) throw error;

      if (tradesData) {
        setTotalCount(tradesData.length);

        const active = tradesData.filter(t => t.status === 'active' || t.status === 'pending' || t.status === 'payment_made');
        const completed = tradesData.filter(t => t.status === 'completed');
        const canceled = tradesData.filter(t => t.status === 'cancelled' || t.status === 'expired');

        setActiveCount(active.length);
        setCompletedCount(completed.length);
        setCanceledCount(canceled.length);

        // Calculate volumes by crypto
        const volumes: any = {
          BTC: 0,
          USDT: 0,
          ETH: 0,
          USDC: 0,
          SOL: 0,
          TON: 0,
          XMR: 0
        };

        completed.forEach(trade => {
          const symbol = trade.crypto_symbol;
          if (volumes.hasOwnProperty(symbol)) {
            volumes[symbol] += parseFloat(trade.crypto_amount) || 0;
          }
        });

        setTradeVolumes(volumes);
      }
    } catch (error) {
      console.error('Error fetching trade statistics:', error);
    }
  };

  const fetchAllTrades = async () => {
    if (!currentUserProfileId) return;

    setLoading(true);
    try {
      const { data: tradesData, error } = await supabase
        .from('p2p_trades')
        .select('*')
        .or(`buyer_id.eq.${currentUserProfileId},seller_id.eq.${currentUserProfileId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for each trade
      const tradesWithProfiles = await Promise.all(
        (tradesData || []).map(async (trade) => {
          const { data: buyerProfile } = await supabase
            .from("user_profiles")
            .select("username, avatar_url")
            .eq("id", trade.buyer_id)
            .single();

          const { data: sellerProfile } = await supabase
            .from("user_profiles")
            .select("username, avatar_url")
            .eq("id", trade.seller_id)
            .single();

          return {
            ...trade,
            buyer_profile: buyerProfile,
            seller_profile: sellerProfile,
          };
        })
      );

      setTrades(tradesWithProfiles);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "expired":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "expired":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with Account */}
        <div className="flex items-center justify-between mb-6 relative">
          <h1 className="text-3xl font-bold">Trade History</h1>
          <Collapsible open={accountOpen} onOpenChange={setAccountOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2"
              >
                <span className="font-semibold">Account</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute right-0 top-12 z-50 w-full max-w-md">
              <Card className="shadow-lg border">
                <CardContent className="p-6 space-y-4">
                  {/* Account Level */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="text-lg font-semibold mb-2">Account Level: 3</div>
                    <div className="text-sm text-muted-foreground mb-2">Account Limit: Unlimited</div>
                    <Button variant="link" className="p-0 h-auto text-primary">
                      Learn more
                    </Button>
                  </div>

                  {/* 2FA Status */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <XCircle className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-red-500 mb-1">2FA Not Enabled</div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Enabling two-factor authentication is great way to secure your account.
                        </p>
                        <Button variant="link" className="p-0 h-auto text-primary">
                          Setup 2FA Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Desktop: Sidebar + Content layout, Mobile: Single column */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Desktop Left Sidebar - Navigation Menu (hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-3">
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
                    className="w-full justify-start bg-primary/10"
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
                    onClick={() => navigate('/p2p')}
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

          {/* Main Content Area (9/12 width on desktop, full on mobile) */}
          <div className="lg:col-span-9 space-y-6">
            {/* Date Range Info */}
            <p className="text-muted-foreground">
              You are viewing all trades from March 01, 2025 to March 31, 2025
            </p>

            {/* Desktop: Statistics (shown before filters) */}
            {!isMobile && (
              <div className="space-y-6">
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between h-14"
                      >
                        <span>Filters</span>
                        <SlidersHorizontal className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Filters</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-4">
                        {/* Asset Selection */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Asset</Label>
                          <div className="grid grid-cols-4 gap-2">
                            <Button variant="outline" className="h-10">All</Button>
                            <Button variant="outline" className="h-10">BTC</Button>
                            <Button variant="outline" className="h-10">USDT</Button>
                            <Button variant="outline" className="h-10">ETH</Button>
                            <Button variant="outline" className="h-10">USDC</Button>
                            <Button variant="outline" className="h-10">SOL</Button>
                            <Button variant="outline" className="h-10">BNB</Button>
                            <Button variant="outline" className="h-10">TRX</Button>
                          </div>
                        </div>

                        {/* Status Selection */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Status</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="h-10">All</Button>
                            <Button variant="outline" className="h-10">In progress</Button>
                            <Button variant="outline" className="h-10">Completed</Button>
                            <Button variant="outline" className="h-10">Failed</Button>
                          </div>
                        </div>

                        {/* Date Selection */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Date</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="h-10">Past 7 days</Button>
                            <Button variant="outline" className="h-10">Past 30 days</Button>
                            <Button variant="outline" className="h-10 col-span-2">From the beginning</Button>
                            <Button variant="outline" className="h-10 col-span-2">Custom dates</Button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <Button 
                            variant="outline" 
                            className="h-12"
                            onClick={() => setFiltersOpen(false)}
                          >
                            Clear all
                          </Button>
                          <Button 
                            className="h-12"
                            onClick={() => setFiltersOpen(false)}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={exportOpen} onOpenChange={setExportOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between h-14"
                      >
                        <span>Export Trades</span>
                        <Download className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Export Trade History</DialogTitle>
                        <DialogDescription>
                          Download your trade history in your preferred format
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Export as CSV
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Export as PDF
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Export as Excel
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Trade Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 shadow-lg border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{activeCount}</div>
                      <div className="text-sm text-muted-foreground">Active Trades</div>
                    </div>
                  </Card>
                  <Card className="p-4 shadow-lg border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{completedCount}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                  </Card>
                  <Card className="p-4 shadow-lg border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">{canceledCount}</div>
                      <div className="text-sm text-muted-foreground">Canceled</div>
                    </div>
                  </Card>
                </div>

                {/* Completion Stats with Crypto Volumes */}
                <Collapsible open={completedTradesOpen} onOpenChange={setCompletedTradesOpen}>
                  <Card className="shadow-lg border">
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between h-14 px-6"
                      >
                        <span className="font-semibold">
                          Completed Trades: {completionRate}% (trades {completedCount} out of {totalCount})
                        </span>
                        <ChevronDown className={`h-5 w-5 transition-transform ${completedTradesOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-4 pb-6 space-y-3">
                        {/* BTC */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                              <Bitcoin className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.BTC.toFixed(8)} BTC</div>
                              <div className="text-xs text-muted-foreground">Bitcoin Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* USDT */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                              <span className="text-lg">₮</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.USDT.toFixed(2)} USDT</div>
                              <div className="text-xs text-muted-foreground">Tether Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* ETH */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <span className="text-lg">◆</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.ETH.toFixed(6)} ETH</div>
                              <div className="text-xs text-muted-foreground">Ethereum Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* USDC */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                              <span className="text-lg">$</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.USDC.toFixed(2)} USDC</div>
                              <div className="text-xs text-muted-foreground">USD Coin Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* SOL */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                              <span className="text-lg">◎</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.SOL.toFixed(4)} SOL</div>
                              <div className="text-xs text-muted-foreground">Solana Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* XMR */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-600/10 flex items-center justify-center">
                              <span className="text-lg">Ɱ</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.XMR.toFixed(6)} XMR</div>
                              <div className="text-xs text-muted-foreground">Monero Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* TON */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-400/10 flex items-center justify-center">
                              <span className="text-lg">💎</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.TON.toFixed(4)} TON</div>
                              <div className="text-xs text-muted-foreground">TON Trade Volume</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            )}

            {/* Mobile: Filters and Stats (shown before trades) */}
            {isMobile && (
              <div className="space-y-6">
                {/* Action Buttons */}
                <div className="space-y-4">
                  <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between h-14"
                      >
                        <span>Filters</span>
                        <SlidersHorizontal className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Filters</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-4">
                        {/* Asset Selection */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Asset</Label>
                          <div className="grid grid-cols-4 gap-2">
                            <Button variant="outline" className="h-10">All</Button>
                            <Button variant="outline" className="h-10">BTC</Button>
                            <Button variant="outline" className="h-10">USDT</Button>
                            <Button variant="outline" className="h-10">ETH</Button>
                            <Button variant="outline" className="h-10">USDC</Button>
                            <Button variant="outline" className="h-10">SOL</Button>
                            <Button variant="outline" className="h-10">BNB</Button>
                            <Button variant="outline" className="h-10">TRX</Button>
                          </div>
                        </div>

                        {/* Status Selection */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Status</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="h-10">All</Button>
                            <Button variant="outline" className="h-10">In progress</Button>
                            <Button variant="outline" className="h-10">Completed</Button>
                            <Button variant="outline" className="h-10">Failed</Button>
                          </div>
                        </div>

                        {/* Date Selection */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Date</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="h-10">Past 7 days</Button>
                            <Button variant="outline" className="h-10">Past 30 days</Button>
                            <Button variant="outline" className="h-10 col-span-2">From the beginning</Button>
                            <Button variant="outline" className="h-10 col-span-2">Custom dates</Button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <Button 
                            variant="outline" 
                            className="h-12"
                            onClick={() => setFiltersOpen(false)}
                          >
                            Clear all
                          </Button>
                          <Button 
                            className="h-12"
                            onClick={() => setFiltersOpen(false)}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={exportOpen} onOpenChange={setExportOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between h-14"
                      >
                        <span>Export Trades</span>
                        <Download className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Export Trade History</DialogTitle>
                        <DialogDescription>
                          Download your trade history in your preferred format
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Export as CSV
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Export as PDF
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Export as Excel
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Trade Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 shadow-lg border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{activeCount}</div>
                      <div className="text-sm text-muted-foreground">Active Trades</div>
                    </div>
                  </Card>
                  <Card className="p-4 shadow-lg border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{completedCount}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                  </Card>
                  <Card className="p-4 shadow-lg border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">{canceledCount}</div>
                      <div className="text-sm text-muted-foreground">Canceled</div>
                    </div>
                  </Card>
                </div>

                {/* Completion Stats with Crypto Volumes */}
                <Collapsible open={completedTradesOpen} onOpenChange={setCompletedTradesOpen}>
                  <Card className="shadow-lg border">
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between h-14 px-6"
                      >
                        <span className="font-semibold">
                          Completed Trades: {completionRate}% (trades {completedCount} out of {totalCount})
                        </span>
                        <ChevronDown className={`h-5 w-5 transition-transform ${completedTradesOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-4 pb-6 space-y-3">
                        {/* BTC */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                              <Bitcoin className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.BTC.toFixed(8)} BTC</div>
                              <div className="text-xs text-muted-foreground">Bitcoin Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* USDT */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                              <span className="text-lg">₮</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.USDT.toFixed(2)} USDT</div>
                              <div className="text-xs text-muted-foreground">Tether Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* ETH */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <span className="text-lg">◆</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.ETH.toFixed(6)} ETH</div>
                              <div className="text-xs text-muted-foreground">Ethereum Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* USDC */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                              <span className="text-lg">$</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.USDC.toFixed(2)} USDC</div>
                              <div className="text-xs text-muted-foreground">USD Coin Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* SOL */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                              <span className="text-lg">◎</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.SOL.toFixed(4)} SOL</div>
                              <div className="text-xs text-muted-foreground">Solana Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* XMR */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-600/10 flex items-center justify-center">
                              <span className="text-lg">Ɱ</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.XMR.toFixed(6)} XMR</div>
                              <div className="text-xs text-muted-foreground">Monero Trade Volume</div>
                            </div>
                          </div>
                        </div>

                        {/* TON */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-400/10 flex items-center justify-center">
                              <span className="text-lg">💎</span>
                            </div>
                            <div>
                              <div className="font-semibold">{tradeVolumes.TON.toFixed(4)} TON</div>
                              <div className="text-xs text-muted-foreground">TON Trade Volume</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            )}

            {/* My Past Trades Section */}
            <Card className="shadow-lg border">
              <div className="flex items-center justify-between p-4">
                <div>
                  <h2 className="text-lg font-semibold">My Past Trades</h2>
                  <p className="text-sm text-muted-foreground">Mar 1, 2025 - Mar 31, 2025</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* Trade List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading trade history...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {trades.map((trade) => {
                  const isUserBuyer = currentUserProfileId === trade.buyer_id;
                  const counterparty = isUserBuyer ? trade.seller_profile : trade.buyer_profile;
                  const type = isUserBuyer ? "buy" : "sell";

                  return (
                    <Card key={trade.id} className="overflow-hidden shadow-lg border">
                      <Collapsible
                        open={expandedTrade === trade.id}
                        onOpenChange={() => setExpandedTrade(expandedTrade === trade.id ? null : trade.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={counterparty?.avatar_url || ""} />
                                  <AvatarFallback>
                                    {counterparty?.username?.substring(0, 2).toUpperCase() || "??"}
                                  </AvatarFallback>
                                </Avatar>

                                {/* Trade Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold">{trade.payment_method}</h3>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm mb-2">
                                    <span className="font-medium">{counterparty?.username || "Unknown"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Bitcoin className="h-4 w-4 text-orange-500" />
                                    <span className="capitalize">{type}</span>
                                    <span>•</span>
                                    <span>{new Date(trade.created_at).toLocaleString()}</span>
                                  </div>
                                </div>

                                {/* Expand Arrow */}
                                <ChevronDown className={`h-5 w-5 transition-transform ${expandedTrade === trade.id ? "rotate-180" : ""}`} />
                              </div>
                            </CardContent>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0 pb-6 px-6 border-t">
                            <div className="space-y-4 pt-4">
                              {/* Amount Details */}
                              <div>
                                <div className="text-2xl font-bold mb-1">
                                  {trade.fiat_amount.toLocaleString()} {trade.fiat_currency}
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Rate: {trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {trade.fiat_currency} / {trade.crypto_symbol}
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div>
                                <Badge 
                                  variant="outline" 
                                  className={`${getStatusColor(trade.status)} flex items-center gap-1 w-fit`}
                                >
                                  {getStatusIcon(trade.status)}
                                  <span className="capitalize">{trade.status}</span>
                                </Badge>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                <Button 
                                  className="flex-1"
                                  onClick={() => window.location.href = `/trade/${trade.id}`}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Empty State (when no trades) */}
            {!loading && trades.length === 0 && (
              <Card className="p-12 text-center shadow-lg border">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Bitcoin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">No trades yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start trading to see your history here
                    </p>
                    <Button onClick={() => window.location.href = '/p2p'}>Start Trading</Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}
