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
  XCircle
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";

const mockTrades = [
  {
    id: 1,
    paymentMethod: "Cash app",
    tradingPartner: {
      name: "JASON168",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=JASON168",
      status: "Active now"
    },
    type: "buy",
    date: "Mar 12, 2025 at 6:20 PM",
    amount: 2000,
    currency: "USD",
    cryptoAmount: 0.01988403,
    cryptoCurrency: "BTC",
    rate: 100583.25,
    status: "expired"
  },
  {
    id: 2,
    paymentMethod: "PayPal",
    tradingPartner: {
      name: "CryptoKing99",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoKing99",
      status: "Seen 2h ago"
    },
    type: "sell",
    date: "Mar 10, 2025 at 3:15 PM",
    amount: 500,
    currency: "USD",
    cryptoAmount: 0.00495,
    cryptoCurrency: "BTC",
    rate: 101010.10,
    status: "completed"
  },
  {
    id: 3,
    paymentMethod: "Bank Transfer",
    tradingPartner: {
      name: "TraderPro",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TraderPro",
      status: "Active now"
    },
    type: "buy",
    date: "Mar 8, 2025 at 11:30 AM",
    amount: 1500,
    currency: "USD",
    cryptoAmount: 0.01485,
    cryptoCurrency: "BTC",
    rate: 101010.10,
    status: "completed"
  },
  {
    id: 4,
    paymentMethod: "Amazon Gift Card",
    tradingPartner: {
      name: "GiftCardGuru",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GiftCardGuru",
      status: "Seen 1d ago"
    },
    type: "sell",
    date: "Mar 5, 2025 at 9:45 AM",
    amount: 250,
    currency: "USD",
    cryptoAmount: 0.00248,
    cryptoCurrency: "BTC",
    rate: 100806.45,
    status: "cancelled"
  }
];

export function TradeHistory() {
  const { user } = useAuth();
  const supabase = createClient();
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
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchTradeStatistics();
    }
  }, [user]);

  const fetchTradeStatistics = async () => {
    try {
      // Fetch all user trades
      const { data: trades, error } = await supabase
        .from('p2p_trades')
        .select('*')
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`);

      if (error) throw error;

      if (trades) {
        setTotalCount(trades.length);
        const completed = trades.filter(t => t.status === 'completed');
        setCompletedCount(completed.length);

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
      <div className="container mx-auto px-4 py-6 max-w-4xl">
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
              <Card className="shadow-lg border-2">
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

        {/* Date Range Info */}
        <p className="text-muted-foreground mb-6">
          You are viewing all trades from March 01, 2025 to March 31, 2025
        </p>

        {/* Action Buttons */}
        <div className="space-y-4 mb-6">
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
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      All
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      BTC
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      USDT
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      ETH
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      USDC
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      SOL
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      TON
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      XMR
                    </Button>
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      All
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      In progress
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      Completed
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      Failed
                    </Button>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Date</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      Past 7 days
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10"
                    >
                      Past 30 days
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10 col-span-2"
                    >
                      From the beginning
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10 col-span-2"
                    >
                      Custom dates
                    </Button>
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

        {/* Completion Stats with Crypto Volumes */}
        <Collapsible open={completedTradesOpen} onOpenChange={setCompletedTradesOpen} className="mb-6">
          <Card>
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

        {/* My Past Trades Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <h2 className="text-lg font-semibold">My Past Trades</h2>
              <p className="text-sm text-muted-foreground">Mar 1, 2025 - Mar 31, 2025</p>
            </div>
            <Button variant="ghost" size="icon">
              <Copy className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Trade List */}
        <div className="space-y-4">
          {mockTrades.map((trade) => (
            <Card key={trade.id} className="overflow-hidden">
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
                          <AvatarImage src={trade.tradingPartner.avatar} />
                          <AvatarFallback>
                            {trade.tradingPartner.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Trade Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{trade.paymentMethod}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <span className="font-medium">{trade.tradingPartner.name}</span>
                            <span className="flex items-center gap-1 text-xs text-green-500">
                              <span className="h-2 w-2 rounded-full bg-green-500"></span>
                              {trade.tradingPartner.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Bitcoin className="h-4 w-4 text-orange-500" />
                            <span className="capitalize">{trade.type}</span>
                            <span>•</span>
                            <span>{trade.date}</span>
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
                          {trade.amount.toLocaleString()} {trade.currency}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {trade.cryptoAmount} {trade.cryptoCurrency}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Rate: {trade.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {trade.currency} / {trade.cryptoCurrency}
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
                        <Button variant="outline" className="flex-1">
                          View Details
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Contact Trader
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Empty State (when no trades) */}
        {mockTrades.length === 0 && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Bitcoin className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">No trades yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start trading to see your history here
                </p>
                <Button>Start Trading</Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <PexlyFooter />
    </div>
  );
}
