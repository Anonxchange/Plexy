import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight, 
  Smartphone,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ChevronRight,
  CreditCard,
  Wallet as WalletIcon,
  Landmark,
  ShoppingBag,
  TrendingUp,
  Gift,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { SendCryptoDialog } from "@/components/send-crypto-dialog";
import { ReceiveCryptoDialog } from "@/components/receive-crypto-dialog";
import { walletClient, type Wallet } from "@/lib/wallet-client";
import { getCryptoPrices, convertToNGN, formatPrice } from "@/lib/crypto-prices";
import type { CryptoPrice } from "@/lib/crypto-prices";
import { getVerificationLevel, getVerificationRequirements } from "@shared/verification-levels";
import { createClient } from "@/lib/supabase";

const cryptoAssets = [
  { symbol: "BTC", name: "Bitcoin", balance: 0, ngnValue: 0, icon: "₿", color: "text-orange-500" },
  { symbol: "ETH", name: "Ethereum", balance: 0, ngnValue: 0, icon: "Ξ", color: "text-blue-500" },
  { symbol: "SOL", name: "Solana", balance: 0, ngnValue: 0, icon: "◎", color: "text-purple-500" },
  { symbol: "TON", name: "Toncoin", balance: 0, ngnValue: 0, icon: "💎", color: "text-blue-400" },
  { symbol: "USDC", name: "USD Coin", balance: 0, ngnValue: 0, icon: "⊙", color: "text-blue-600" },
  { symbol: "USDT", name: "Tether", balance: 0, ngnValue: 0, icon: "₮", color: "text-green-500" },
  { symbol: "XMR", name: "Monero", balance: 0, ngnValue: 0, icon: "ɱ", color: "text-orange-600" },
];

const initialSpotPairs = [
  { symbol: "BTC", name: "Bitcoin", price: 122256.00, change: -0.58 },
  { symbol: "ETH", name: "Ethereum", price: 4362.20, change: -2.98 },
  { symbol: "BNB", name: "BNB", price: 1284.45, change: -2.19 },
  { symbol: "TRX", name: "Tron", price: 0.34, change: -0.12 },
  { symbol: "SOL", name: "Solana", price: 222.75, change: 0.58 },
  { symbol: "LTC", name: "Litecoin", price: 116.75, change: 0.15 },
];

const recentActivities = [
  {
    id: 1,
    type: "P2P Trade",
    action: "Buy BTC",
    amount: "2000 USD",
    cryptoAmount: "0.01988403 BTC",
    status: "completed",
    date: "Mar 12, 2025 at 6:20 PM",
    partner: "JASON168"
  },
  {
    id: 2,
    type: "P2P Trade",
    action: "Sell BTC",
    amount: "500 USD",
    cryptoAmount: "0.00495 BTC",
    status: "completed",
    date: "Mar 10, 2025 at 3:15 PM",
    partner: "CryptoKing99"
  },
  {
    id: 3,
    type: "P2P Trade",
    action: "Buy ETH",
    amount: "1500 USD",
    cryptoAmount: "0.34 ETH",
    status: "pending",
    date: "Mar 8, 2025 at 11:30 AM",
    partner: "TraderPro"
  }
];

const allOperations = [
  {
    id: 1,
    type: "P2P Trade",
    action: "Buy BTC",
    amount: "2000 USD",
    cryptoAmount: "0.01988403 BTC",
    status: "completed",
    date: "Mar 12, 2025 at 6:20 PM",
    partner: "JASON168"
  },
  {
    id: 2,
    type: "P2P Trade",
    action: "Sell BTC",
    amount: "500 USD",
    cryptoAmount: "0.00495 BTC",
    status: "completed",
    date: "Mar 10, 2025 at 3:15 PM",
    partner: "CryptoKing99"
  },
  {
    id: 3,
    type: "Spot Trade",
    action: "Buy BTC/USDT",
    amount: "1000 USDT",
    cryptoAmount: "0.00818 BTC",
    status: "completed",
    date: "Mar 9, 2025 at 2:45 PM",
    partner: "Spot Exchange"
  },
  {
    id: 4,
    type: "P2P Trade",
    action: "Buy ETH",
    amount: "1500 USD",
    cryptoAmount: "0.34 ETH",
    status: "pending",
    date: "Mar 8, 2025 at 11:30 AM",
    partner: "TraderPro"
  },
  {
    id: 5,
    type: "Airtime Purchase",
    action: "MTN Airtime",
    amount: "50 NGN",
    cryptoAmount: "0.00004 BTC",
    status: "completed",
    date: "Mar 7, 2025 at 9:15 AM",
    partner: "MTN Nigeria"
  },
  {
    id: 6,
    type: "Spot Trade",
    action: "Sell ETH/USDT",
    amount: "2500 USDT",
    cryptoAmount: "0.573 ETH",
    status: "completed",
    date: "Mar 6, 2025 at 4:30 PM",
    partner: "Spot Exchange"
  },
  {
    id: 7,
    type: "Gift Card",
    action: "Amazon Gift Card",
    amount: "100 USD",
    cryptoAmount: "0.00082 BTC",
    status: "completed",
    date: "Mar 5, 2025 at 1:20 PM",
    partner: "Gift Card Store"
  },
  {
    id: 8,
    type: "Airtime Purchase",
    action: "Airtel Data",
    amount: "100 NGN",
    cryptoAmount: "0.00008 BTC",
    status: "completed",
    date: "Mar 4, 2025 at 10:00 AM",
    partner: "Airtel Nigeria"
  }
];

export default function Wallet() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeWalletTab, setActiveWalletTab] = useState("wallet");
  const [activeAssetTab, setActiveAssetTab] = useState("assets");
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeSpotTab, setActiveSpotTab] = useState("hot");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, CryptoPrice>>({});
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [spotPairs, setSpotPairs] = useState(initialSpotPairs);
  const [limitsExpanded, setLimitsExpanded] = useState(false);
  const [userVerificationLevel, setUserVerificationLevel] = useState<number>(0);
  const [lifetimeTradeVolume, setLifetimeTradeVolume] = useState<number>(0);
  const [lifetimeSendVolume, setLifetimeSendVolume] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      setLocation("/signin");
    } else {
      loadUserProfile();
      loadWalletData();
      loadCryptoPrices();
      const priceInterval = setInterval(loadCryptoPrices, 60000);
      return () => clearInterval(priceInterval);
    }
  }, [user, setLocation]);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      
      // First try to get from user metadata
      const metadata = user.user_metadata || {};
      if (metadata.verification_level !== undefined) {
        setUserVerificationLevel(Number(metadata.verification_level) || 0);
        setLifetimeTradeVolume(Number(metadata.lifetime_trade_volume) || 0);
        setLifetimeSendVolume(Number(metadata.lifetime_send_volume) || 0);
        console.log("Loaded user level from metadata:", metadata.verification_level);
        return;
      }

      // Try to fetch from database table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('verification_level, lifetime_trade_volume, lifetime_send_volume')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error loading user profile from DB:", error);
        // Default to Level 0 if no data found
        setUserVerificationLevel(0);
        return;
      }

      if (data) {
        setUserVerificationLevel(Number(data.verification_level) || 0);
        setLifetimeTradeVolume(Number(data.lifetime_trade_volume) || 0);
        setLifetimeSendVolume(Number(data.lifetime_send_volume) || 0);
        console.log("Loaded user level from DB:", data.verification_level);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUserVerificationLevel(0);
    }
  };

  const loadWalletData = async () => {
    if (!user) return;
    try {
      const response = await walletClient.getWallets();
      console.log("Wallet API response:", response);
      // Handle both possible response formats
      const userWallets = response.wallets || response || [];
      setWallets(Array.isArray(userWallets) ? userWallets : []);
    } catch (error) {
      console.error("Error loading wallets:", error);
    } finally {
      setLoadingWallets(false);
    }
  };

  const loadCryptoPrices = async () => {
    try {
      const symbols = ['BTC', 'ETH', 'BNB', 'TRX', 'SOL', 'LTC', 'USDT', 'USDC', 'TON', 'XMR'];
      const prices = await getCryptoPrices(symbols);
      setCryptoPrices(prices);

      setSpotPairs(prevPairs => 
        prevPairs.map(pair => {
          const priceData = prices[pair.symbol];
          return priceData ? {
            ...pair,
            price: priceData.current_price,
            change: priceData.price_change_percentage_24h
          } : pair;
        })
      );
    } catch (error) {
      console.error("Error loading crypto prices:", error);
    }
  };

  if (!user) {
    return null;
  }

  const mergedAssets = cryptoAssets.map(asset => {
    const wallet = wallets.find(w => w.currency === asset.symbol);
    const priceData = cryptoPrices[asset.symbol];
    const balance = wallet?.balance || asset.balance;
    const usdValue = priceData ? balance * priceData.current_price : 0;
    const ngnValue = convertToNGN(usdValue);

    return {
      ...asset,
      balance,
      ngnValue
    };
  });

  const totalBalance = mergedAssets.reduce((sum, asset) => sum + asset.ngnValue, 0);

  const filteredAssets = hideZeroBalance 
    ? mergedAssets.filter(asset => asset.balance > 0)
    : mergedAssets;

  const walletsForDialog = cryptoAssets.map(asset => ({
    symbol: asset.symbol,
    name: asset.name,
    icon: asset.icon,
    balance: mergedAssets.find(a => a.symbol === asset.symbol)?.balance || 0
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
        {/* My Assets Header */}
        <h1 className="text-xl sm:text-2xl font-bold mb-4">My assets</h1>

        {/* Withdraw Limits Card */}
        <Card className="mb-4">
          <CardContent className="p-3 sm:p-4">
            <div 
              className="flex items-center justify-between flex-wrap gap-2 cursor-pointer"
              onClick={() => setLimitsExpanded(!limitsExpanded)}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm sm:text-base">Withdraw limits</span>
                <Badge variant="default" className="text-xs">
                  Level {userVerificationLevel}
                </Badge>
                <Link href="/verification">
                  <span className="text-xs sm:text-sm text-primary cursor-pointer hover:underline">
                    {userVerificationLevel < 3 ? "Upgrade" : "Learn more"}
                  </span>
                </Link>
              </div>
              {limitsExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {limitsExpanded && (
              <div className="mt-4 pt-4 border-t space-y-4">
                {/* Current Level Details */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    {getVerificationLevel(userVerificationLevel).name}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {getVerificationLevel(userVerificationLevel).description}
                  </p>
                  
                  {/* Limits Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-muted-foreground mb-1">Daily Limit</div>
                      <div className="font-medium">
                        {getVerificationLevel(userVerificationLevel).dailyLimit !== null
                          ? `$${getVerificationLevel(userVerificationLevel).dailyLimit?.toLocaleString()}` 
                          : "Unlimited"}
                      </div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-muted-foreground mb-1">Per Trade</div>
                      <div className="font-medium">
                        {getVerificationLevel(userVerificationLevel).perTradeLimit !== null
                          ? `$${getVerificationLevel(userVerificationLevel).perTradeLimit?.toLocaleString()}`
                          : "Unlimited"}
                      </div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-muted-foreground mb-1">Lifetime Trade</div>
                      <div className="font-medium">
                        {getVerificationLevel(userVerificationLevel).lifetimeTradeLimit !== null
                          ? `$${lifetimeTradeVolume.toLocaleString()} / $${getVerificationLevel(userVerificationLevel).lifetimeTradeLimit?.toLocaleString()}`
                          : "Unlimited"}
                      </div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-muted-foreground mb-1">Lifetime Send</div>
                      <div className="font-medium">
                        {getVerificationLevel(userVerificationLevel).lifetimeSendLimit !== null
                          ? `$${lifetimeSendVolume.toLocaleString()} / $${getVerificationLevel(userVerificationLevel).lifetimeSendLimit?.toLocaleString()}`
                          : "Unlimited"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Level Progress */}
                {userVerificationLevel < 3 && getVerificationRequirements(userVerificationLevel) && (
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">
                        Next: Level {getVerificationRequirements(userVerificationLevel)?.nextLevel}
                      </h4>
                      <Link href="/verification">
                        <Button size="sm" variant="default">Upgrade Now</Button>
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {getVerificationRequirements(userVerificationLevel)?.description}
                    </p>
                    <div className="space-y-1">
                      <div className="text-xs font-medium mb-1">Requirements:</div>
                      {getVerificationRequirements(userVerificationLevel)?.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          {req}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="text-xs font-medium mb-1">Benefits:</div>
                      {getVerificationRequirements(userVerificationLevel)?.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Type Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <Button
            variant={activeWalletTab === "wallet" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveWalletTab("wallet")}
            className="whitespace-nowrap"
          >
            <WalletIcon className="h-4 w-4 mr-2" />
            Wallet
          </Button>
          <Link href="/spot">
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Spot
            </Button>
          </Link>
          <Button
            variant={activeWalletTab === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveWalletTab("card")}
            className="whitespace-nowrap"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Visa card
          </Button>
        </div>

        {/* Wallet Balance Card */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Wallet balance</span>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="h-8 w-8"
              >
                {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>

            <div className="text-3xl sm:text-4xl font-bold text-primary mb-6">
              {balanceVisible ? `${totalBalance.toFixed(2)} NGN` : "••••••"}
            </div>

            {/* Action Buttons - Horizontal Layout */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Button variant="outline" className="h-14" onClick={() => setReceiveDialogOpen(true)}>
                <ArrowDownToLine className="mr-2 h-5 w-5" />
                Receive
              </Button>
              <Button variant="outline" className="h-14" onClick={() => setSendDialogOpen(true)}>
                <ArrowUpFromLine className="mr-2 h-5 w-5" />
                Send
              </Button>
              <Button className="h-14 bg-primary hover:bg-primary/90">
                <ArrowLeftRight className="mr-2 h-5 w-5" />
                Swap
              </Button>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                <Landmark className="h-4 w-4 mr-2" />
                Crypto to Bank
              </Button>
              <Button className="w-full">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Buy crypto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Asset Tabs */}
        <div className="flex gap-4 sm:gap-6 mb-4 border-b overflow-x-auto">
          {[
            { id: "assets", label: "Wallet assets" },
            { id: "activity", label: "Recent activity" },
            { id: "operations", label: "All operations" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAssetTab(tab.id)}
              className={`pb-3 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeAssetTab === tab.id
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Wallet Assets Tab Content */}
        {activeAssetTab === "assets" && (
          <>
            {/* Hide 0 Balance Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <Switch 
                checked={hideZeroBalance}
                onCheckedChange={setHideZeroBalance}
              />
              <span className="text-sm text-muted-foreground">Hide 0 balance</span>
            </div>

            {/* Asset List Header */}
            <div className="hidden sm:grid grid-cols-3 gap-4 px-4 mb-2">
              <div className="text-xs text-muted-foreground">Asset</div>
              <div className="text-xs text-muted-foreground text-right">Balance</div>
              <div className="text-xs text-muted-foreground text-right">Action</div>
            </div>

            {/* Asset List */}
            <div className="space-y-2 mb-8">
              {filteredAssets.map((asset) => (
                  <Card key={asset.symbol}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center text-lg sm:text-xl ${asset.color}`}>
                            {asset.icon}
                          </div>
                          <span className="font-medium text-sm sm:text-base">{asset.symbol}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm sm:text-base">{asset.balance.toFixed(7)}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">{asset.ngnValue.toFixed(2)} NGN</div>
                        </div>
                        <div className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          </>
        )}

        {/* Recent Activity Tab Content */}
        {activeAssetTab === "activity" && (
          <div className="space-y-3 mb-8">
            <p className="text-sm text-muted-foreground mb-4">Recent P2P trading activity</p>
            {recentActivities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{activity.type}</span>
                        <Badge 
                          variant="outline" 
                          className={
                            activity.status === "completed" 
                              ? "bg-green-500/10 text-green-600 border-green-500/20" 
                              : activity.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                              : "bg-red-500/10 text-red-600 border-red-500/20"
                          }
                        >
                          {activity.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {activity.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                          {activity.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">with {activity.partner}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{activity.amount}</p>
                      <p className="text-sm text-muted-foreground">{activity.cryptoAmount}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.date}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* All Operations Tab Content */}
        {activeAssetTab === "operations" && (
          <div className="space-y-3 mb-8">
            <p className="text-sm text-muted-foreground mb-4">All wallet operations including trades, purchases, and transfers</p>
            {allOperations.map((operation) => (
              <Card key={operation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {operation.type}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={
                            operation.status === "completed" 
                              ? "bg-green-500/10 text-green-600 border-green-500/20" 
                              : operation.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                              : "bg-red-500/10 text-red-600 border-red-500/20"
                          }
                        >
                          {operation.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {operation.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                          {operation.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                          {operation.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{operation.action}</p>
                      <p className="text-xs text-muted-foreground">{operation.partner}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{operation.amount}</p>
                      <p className="text-sm text-muted-foreground">{operation.cryptoAmount}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{operation.date}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recommended Section */}
        <h2 className="text-xl font-bold mb-4">Recommended for you</h2>

        {/* P2P Trading Card */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">P2P Trading</h3>
              <Link href="/p2p">
                <span className="text-primary text-sm cursor-pointer flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">MKUU_</span>
                        <span className="text-xs">🇰🇪 🇳🇬</span>
                        <Badge variant="default" className="text-xs">EXPERT</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <span>👍</span>
                        <span>2929</span>
                      </div>
                    </div>
                  </div>
                  <Button>
                    Buy BTC ₿
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Payment</div>
                    <div className="font-medium">Bank Transfer</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground mb-1">Price</div>
                    <div className="font-medium">₿ KES 13,300,000.00</div>
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <div className="text-muted-foreground">Range</div>
                  <div className="font-medium">KES 3,000.00 - KES 110,931.00</div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Spot Exchange Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Spot exchange</h3>
              <span className="text-primary text-sm cursor-pointer flex items-center gap-1 hover:underline">
                View all 50+ coins <ChevronRight className="h-4 w-4" />
              </span>
            </div>

            {/* Spot Tabs */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeSpotTab === "hot" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSpotTab("hot")}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Hot pairs
              </Button>
              <Button
                variant={activeSpotTab === "movers" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSpotTab("movers")}
              >
                Top movers
              </Button>
              <Button
                variant={activeSpotTab === "added" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSpotTab("added")}
              >
                Recently added
              </Button>
            </div>

            {/* Spot Pairs List */}
            <div className="space-y-2">
              {spotPairs.map((pair) => (
                <div 
                  key={pair.symbol}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      {pair.symbol === "BTC" && "₿"}
                      {pair.symbol === "ETH" && "Ξ"}
                      {pair.symbol === "BNB" && "B"}
                      {pair.symbol === "TRX" && "T"}
                      {pair.symbol === "SOL" && "◎"}
                      {pair.symbol === "LTC" && "Ł"}
                    </div>
                    <span className="font-medium">{pair.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${pair.price.toLocaleString()}</div>
                  </div>
                  <div className={`text-sm font-medium ${pair.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {pair.change >= 0 ? '+' : ''}{pair.change}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Promotions Card */}
        <h2 className="text-xl font-bold mb-4">Check out our promotions</h2>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-none text-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-3xl font-bold mb-2">Save up to</h3>
            <p className="text-4xl font-bold text-orange-100 mb-4">20% on gift cards</p>
            <p className="text-sm mb-6 opacity-90">
              Exclusive discounts on the gift cards you love—shop now and save more!
            </p>
            <Button className="bg-white text-orange-600 hover:bg-gray-100">
              <Gift className="h-4 w-4 mr-2" />
              Buy a gift card
            </Button>
          </CardContent>
        </Card>
      </div>

      <PexlyFooter />

      <SendCryptoDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        wallets={walletsForDialog}
        onSuccess={loadWalletData}
      />

      <ReceiveCryptoDialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        wallets={walletsForDialog}
      />
    </div>
  );
}