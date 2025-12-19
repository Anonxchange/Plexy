import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingDown,
  Gift,
  CheckCircle2,
  Clock,
  XCircle,
  Send
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { SendCryptoDialog } from "@/components/send-crypto-dialog";
import { ReceiveCryptoDialog } from "@/components/receive-crypto-dialog";
import { type Wallet, type WalletTransaction, getWalletTransactions } from "@/lib/wallet-api";
import { getCryptoPrices, convertToNGN, formatPrice } from "@/lib/crypto-prices";
import type { CryptoPrice } from "@/lib/crypto-prices";
import { getVerificationLevel, getVerificationRequirements } from "@shared/verification-levels";
import { createClient } from "@/lib/supabase";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { Sparkline } from "@/components/ui/sparkline";
import { useToast } from "@/hooks/use-toast";
import { useWalletMonitoring } from "@/hooks/use-wallet-monitoring";

const cryptoAssets = [
  { symbol: "BTC", name: "Bitcoin", balance: 0, ngnValue: 0, iconUrl: cryptoIconUrls.BTC, color: "text-orange-500", avgCost: 0 },
  { symbol: "ETH", name: "Ethereum", balance: 0, ngnValue: 0, iconUrl: cryptoIconUrls.ETH, color: "text-blue-500", avgCost: 0 },
  { symbol: "SOL", name: "Solana", balance: 0, ngnValue: 0, iconUrl: cryptoIconUrls.SOL, color: "text-purple-500", avgCost: 0 },
  { symbol: "BNB", name: "Binance Coin", balance: 0, ngnValue: 0, iconUrl: cryptoIconUrls.BNB, color: "text-yellow-500", avgCost: 0 },
  { symbol: "TRX", name: "Tron", balance: 0, ngnValue: 0, iconUrl: cryptoIconUrls.TRX, color: "text-red-500", avgCost: 0 },
  { symbol: "USDC", name: "USD Coin", balance: 0, ngnValue: 0, iconUrl: cryptoIconUrls.USDC, color: "text-blue-600", avgCost: 0 },
  { symbol: "USDT", name: "Tether", balance: 0, ngnValue: 0, iconUrl: cryptoIconUrls.USDT, color: "text-green-500", avgCost: 0 },
];

const initialSpotPairs = [
  { symbol: "BTC", name: "Bitcoin", price: 122256.00, change: -0.58 },
  { symbol: "ETH", name: "Ethereum", price: 4362.20, change: -2.98 },
  { symbol: "BNB", name: "BNB", price: 1284.45, change: -2.19 },
  { symbol: "TRX", name: "Tron", price: 0.34, change: -0.12 },
  { symbol: "SOL", name: "Solana", price: 222.75, change: 0.58 },
  { symbol: "LTC", name: "Litecoin", price: 116.75, change: 0.15 },
];


const generateSparklineData = (baseValue: number, trend: 'up' | 'down' | 'neutral', points: number = 20): number[] => {
  const data: number[] = [];
  let current = baseValue;
  const volatility = 0.03;
  const trendStrength = trend === 'up' ? 0.015 : trend === 'down' ? -0.015 : 0;

  for (let i = 0; i < points; i++) {
    const random = (Math.random() - 0.5) * volatility;
    current = current * (1 + random + trendStrength);
    data.push(current);
  }
  return data;
};


export default function Wallet() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeWalletTab, setActiveWalletTab] = useState("wallet");
  const [activeAssetTab, setActiveAssetTab] = useState("assets");
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeSpotTab, setActiveSpotTab] = useState("hot");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletsLoaded, setWalletsLoaded] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, CryptoPrice>>({});
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [pricesLoadedSuccessfully, setPricesLoadedSuccessfully] = useState(false);
  
  // Initialize cached values from sessionStorage to prevent 0 display on refresh
  const [cachedBalance, setCachedBalance] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('wallet_cached_balance');
      return stored ? parseFloat(stored) : null;
    }
    return null;
  });
  const [cachedPnL, setCachedPnL] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('wallet_cached_pnl');
      return stored ? parseFloat(stored) : null;
    }
    return null;
  });
  const [cachedPnLPercentage, setCachedPnLPercentage] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('wallet_cached_pnl_percentage');
      return stored ? parseFloat(stored) : null;
    }
    return null;
  });
  const [spotPairs, setSpotPairs] = useState(initialSpotPairs);
  const [limitsExpanded, setLimitsExpanded] = useState(false);
  const [userVerificationLevel, setUserVerificationLevel] = useState<number>(0);
  const [lifetimeTradeVolume, setLifetimeTradeVolume] = useState<number>(0);
  const [lifetimeSendVolume, setLifetimeSendVolume] = useState<number>(0);
  const [preferredCurrency, setPreferredCurrency] = useState<string>("USD");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const { toast } = useToast();

  useWalletMonitoring(['BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'USDC', 'USDT'], !!user);

  // Redirect to signin if not logged in (no loading state)
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    }
  }, [user, loading, setLocation]);

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    loadUserProfile();
    loadWalletData();
    loadCryptoPrices();
    loadTransactions();

    // Increase price update interval to reduce calls
    const priceInterval = setInterval(loadCryptoPrices, 120000); // 2 minutes instead of 1

    const supabase = createClient();

    // Debounce wallet updates to prevent rapid successive calls
    let walletUpdateTimeout: NodeJS.Timeout;

    // Subscribe to wallet changes for real-time balance updates
    const walletChannel = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Wallet changed, debouncing refresh...');
          // Debounce: only refresh after 1 second of no changes
          clearTimeout(walletUpdateTimeout);
          walletUpdateTimeout = setTimeout(() => {
            loadWalletData();
          }, 1000);
        }
      )
      .subscribe();

    // Subscribe to real-time transaction updates
    const transactionChannel = supabase
      .channel('wallet-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New transaction detected:', payload);

          // Debounce wallet reload
          clearTimeout(walletUpdateTimeout);
          walletUpdateTimeout = setTimeout(() => {
            loadWalletData();
            loadTransactions();
          }, 1000);

          // Show toast notification
          toast({
            title: 'New Transaction!',
            description: `${payload.new.amount} ${payload.new.crypto_symbol} transaction detected`,
          });
        }
      )
      .subscribe();

    return () => {
      clearInterval(priceInterval);
      clearTimeout(walletUpdateTimeout);
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(transactionChannel);
    };
  }, [user]);

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
        .select('verification_level, lifetime_trade_volume, lifetime_send_volume, preferred_currency')
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
        const currency = data.preferred_currency?.toUpperCase() || 'USD';
        setPreferredCurrency(currency);
        console.log("Loaded user level from DB:", data.verification_level);
        console.log("Loaded preferred currency:", data.preferred_currency, "=>", currency);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUserVerificationLevel(0);
    }
  };

  const loadWalletData = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('crypto_symbol', { ascending: true });

      if (error) {
        console.error("Error loading wallets:", error);
        // Don't reset wallets on error - keep previous data
      } else {
        console.log("Loaded wallets from database:", data);
        setWallets(data || []);
        setWalletsLoaded(true);
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
      // Don't reset wallets on error - keep previous data
    }
  };

  const loadCryptoPrices = async () => {
    try {
      const symbols = ['BTC', 'ETH', 'BNB', 'TRX', 'SOL', 'LTC', 'USDT', 'USDC', 'TON', 'XMR'];
      const prices = await getCryptoPrices(symbols);
      setCryptoPrices(prices);
      setPricesLoaded(true);
      // Only mark as successfully loaded if we actually got price data
      if (Object.keys(prices).length > 0) {
        setPricesLoadedSuccessfully(true);
      }

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
      // Set prices loaded to true even on error to show cached data
      // But DON'T set pricesLoadedSuccessfully - this prevents caching bad data
      setPricesLoaded(true);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    try {
      const txs = await getWalletTransactions(user.id, 50);
      setTransactions(txs);
      setTransactionsLoaded(true);
    } catch (error) {
      console.error("Error loading transactions:", error);
      setTransactionsLoaded(true);
    }
  };

  // Redirect immediately if not logged in (no loading state shown)
  if (!loading && !user) {
    return null;
  }

  const mergedAssets = cryptoAssets.map(asset => {
    const wallet = wallets.find(w => w.crypto_symbol === asset.symbol);
    const priceData = cryptoPrices[asset.symbol];
    const balance = wallet?.balance || asset.balance;
    const lockedBalance = wallet?.locked_balance || 0;
    const totalAssetBalance = balance + lockedBalance; // Sum both balances
    const currentPrice = priceData?.current_price || 0;
    const usdValue = totalAssetBalance * currentPrice; // Use total for display

    if (totalAssetBalance > 0) {
      console.log(`Wallet Page - ${asset.symbol}: ${totalAssetBalance} (${balance} available + ${lockedBalance} locked) × $${currentPrice} = $${usdValue.toFixed(2)}`);
    }
    const ngnValue = convertToNGN(usdValue);

    // Calculate PnL based on actual market movements
    // Use 24h price change to simulate realistic entry price
    let avgCost = asset.avgCost || currentPrice;
    if (!asset.avgCost && priceData && totalAssetBalance > 0) {
      // Simulate realistic entry based on 24h movement
      const changeMultiplier = 1 - (priceData.price_change_percentage_24h / 100);
      avgCost = currentPrice * changeMultiplier;
    }
    
    const costBasis = totalAssetBalance * avgCost;
    const pnlUsd = usdValue - costBasis;
    const pnlPercentage = costBasis > 0 ? ((usdValue - costBasis) / costBasis) * 100 : 0;

    const trend = pnlPercentage > 0 ? 'up' : pnlPercentage < 0 ? 'down' : 'neutral';
    const sparklineData = generateSparklineData(avgCost, trend);

    return {
      ...asset,
      balance: totalAssetBalance, // Show total in display
      availableBalance: balance, // Keep track of available separately
      lockedBalance: lockedBalance, // Keep track of locked separately
      ngnValue,
      usdValue,
      currentPrice,
      avgCost,
      pnlUsd,
      pnlPercentage,
      priceChange24h: priceData?.price_change_percentage_24h || 0,
      sparklineData
    };
  });

  // Calculate total balance in the user's preferred currency (USD by default)
  const calculatedBalance = preferredCurrency === 'USD' 
    ? mergedAssets.reduce((sum, asset) => sum + asset.usdValue, 0)
    : mergedAssets.reduce((sum, asset) => sum + asset.ngnValue, 0);

  // Calculate total PnL in the user's preferred currency
  const calculatedPnL = preferredCurrency === 'USD'
    ? mergedAssets.reduce((sum, asset) => sum + asset.pnlUsd, 0)
    : mergedAssets.reduce((sum, asset) => sum + (convertToNGN(asset.pnlUsd)), 0);

  const totalCostBasis = mergedAssets.reduce((sum, asset) => sum + (asset.balance * asset.avgCost), 0);
  const calculatedPnLPercentage = totalCostBasis > 0
    ? (mergedAssets.reduce((sum, asset) => sum + asset.pnlUsd, 0) / totalCostBasis) * 100
    : 0;

  // Use cached values ONLY while fresh data is loading
  // Both wallets AND prices must be successfully loaded before showing calculated values
  // This prevents showing 0 during loading or when price fetch fails
  const hasFreshReliableData = walletsLoaded && pricesLoadedSuccessfully && Object.keys(cryptoPrices).length > 0;
  const totalBalance = (!hasFreshReliableData && cachedBalance !== null) 
    ? cachedBalance 
    : calculatedBalance;
  const totalPnL = (!hasFreshReliableData && cachedPnL !== null) 
    ? cachedPnL 
    : calculatedPnL;
  const totalPnLPercentage = (!hasFreshReliableData && cachedPnLPercentage !== null) 
    ? cachedPnLPercentage 
    : calculatedPnLPercentage;

  // Cache balance ONLY when we have confirmed fresh reliable data from BOTH sources
  // This prevents caching bad data from failed price fetches
  useEffect(() => {
    if (hasFreshReliableData) {
      setCachedBalance(calculatedBalance);
      setCachedPnL(calculatedPnL);
      setCachedPnLPercentage(calculatedPnLPercentage);
      // Persist to sessionStorage (including zeros for accurate display)
      sessionStorage.setItem('wallet_cached_balance', calculatedBalance.toString());
      sessionStorage.setItem('wallet_cached_pnl', calculatedPnL.toString());
      sessionStorage.setItem('wallet_cached_pnl_percentage', calculatedPnLPercentage.toString());
    }
  }, [calculatedBalance, calculatedPnL, calculatedPnLPercentage, hasFreshReliableData]);

  const portfolioTrend = totalPnLPercentage > 0 ? 'up' : totalPnLPercentage < 0 ? 'down' : 'neutral';
  const portfolioSparklineData = generateSparklineData(totalBalance * 0.95, portfolioTrend, 30);

  const filteredAssets = hideZeroBalance
    ? mergedAssets.filter(asset => asset.balance > 0)
    : mergedAssets;

  const walletsForDialog = cryptoAssets.map(asset => {
    const merged = mergedAssets.find(a => a.symbol === asset.symbol);
    return {
      symbol: asset.symbol,
      name: asset.name,
      icon: asset.symbol,
      balance: merged?.availableBalance || 0 // Use available balance for transactions
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
        
        {/* My Assets Header - Moved to top */}
        <h1 className="text-xl sm:text-2xl font-bold mb-6">My assets</h1>

        {/* Total Assets Card */}
        <div className="bg-card rounded-2xl p-5 mb-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">Total Assets</span>
              <button 
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                {balanceVisible ? (
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
                  {balanceVisible ? totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
                </span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-lg font-medium">{preferredCurrency}</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                ≈ {balanceVisible ? (totalBalance / (cryptoPrices.BTC?.current_price || 1)).toFixed(5) : "••••••"} BTC
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-muted-foreground">Today's P&L</span>
                <div className={`flex items-center gap-1 ${totalPnL >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {totalPnL >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="text-sm font-medium">{balanceVisible ? `${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} ${preferredCurrency}` : '••••••'} ({totalPnLPercentage.toFixed(2)}%)</span>
                </div>
              </div>
            </div>

            {/* Mini Sparkline Chart */}
            <div className="w-24 h-12">
              <Sparkline data={portfolioSparklineData} color={portfolioTrend === 'up' ? '#10b981' : portfolioTrend === 'down' ? '#ef4444' : '#6b7280'} />
            </div>
          </div>
        </div>

        {/* Quick Actions - Below Total Assets Card */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => setReceiveDialogOpen(true)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-95 group"
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1))`,
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }}
            >
              <ArrowDownToLine className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-foreground text-center leading-tight">Receive</span>
          </button>

          <button
            onClick={() => setSendDialogOpen(true)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-95 group"
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(168, 85, 247, 0.1))`,
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
              }}
            >
              <ArrowUpFromLine className="h-6 w-6 text-purple-500" />
            </div>
            <span className="text-xs font-medium text-foreground text-center leading-tight">Send</span>
          </button>

          <button
            onClick={() => setLocation("/swap")}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-95 group"
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.1))`,
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              <ArrowLeftRight className="h-6 w-6 text-green-500" />
            </div>
            <span className="text-xs font-medium text-foreground text-center leading-tight">Swap</span>
          </button>

          <button
            onClick={() => setLocation("/wallet/mobile-topup")}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-all active:scale-95 group"
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(249, 115, 22, 0.1))`,
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(249, 115, 22, 0.3)",
              }}
            >
              <Smartphone className="h-6 w-6 text-orange-500" />
            </div>
            <span className="text-xs font-medium text-foreground text-center leading-tight">Topup</span>
          </button>
        </div>

        {/* Wallet Assets Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredAssets.filter(asset => asset.balance > 0).slice(0, 6).map((asset) => (
            <Link key={asset.symbol} href={`/wallet/asset/${asset.symbol}`} className="block">
              <Card className="hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={asset.iconUrl}
                        alt={asset.name}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${asset.symbol}&background=random`;
                        }}
                      />
                      <div>
                        <div className="font-semibold text-sm">{asset.symbol}</div>
                        <div className="text-xs text-muted-foreground">{asset.name}</div>
                      </div>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      asset.priceChange24h >= 0 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Balance</div>
                      <div className="font-semibold">{asset.balance.toFixed(8)} {asset.symbol}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Value</div>
                      <div className="font-semibold text-lg">${asset.usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">${asset.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 3-Column Layout for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN - Navigation Sidebar */}
          <div className="lg:col-span-3">
            <div className="space-y-4 lg:sticky lg:top-6">
            {/* Limits Card */}
            <Card>
              <CardContent className="p-4">
                <div
                  className="cursor-pointer"
                  onClick={() => setLimitsExpanded(!limitsExpanded)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Limits</span>
                    {limitsExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      Level {userVerificationLevel}
                    </Badge>
                    <Link href="/verification">
                      <span className="text-xs text-primary cursor-pointer hover:underline">
                        {userVerificationLevel < 3 ? "Upgrade" : "Details"}
                      </span>
                    </Link>
                  </div>
                </div>

                {limitsExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="space-y-3">
                      {/* Current Level Info */}
                      <div className="bg-primary/5 p-3 rounded-lg space-y-2">
                        <div className="font-medium text-xs text-primary">
                          {getVerificationLevel(userVerificationLevel).name}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getVerificationLevel(userVerificationLevel).description}
                        </p>
                      </div>

                      {/* Limits */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Daily Limit</span>
                          <span className="font-medium">
                            {getVerificationLevel(userVerificationLevel).dailyLimit !== null
                              ? `$${getVerificationLevel(userVerificationLevel).dailyLimit?.toLocaleString()}`
                              : "Unlimited"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Per Trade</span>
                          <span className="font-medium">
                            {getVerificationLevel(userVerificationLevel).perTradeLimit !== null
                              ? `$${getVerificationLevel(userVerificationLevel).perTradeLimit?.toLocaleString()}`
                              : "Unlimited"}
                          </span>
                        </div>
                      </div>

                      {/* What you can do */}
                      {getVerificationLevel(userVerificationLevel).permissions.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium">What you can do:</div>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {getVerificationLevel(userVerificationLevel).permissions.slice(0, 3).map((permission, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-primary mt-0.5">•</span>
                                <span>{permission}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {userVerificationLevel < 3 && (
                      <Link href="/verification" className="block">
                        <Button size="sm" className="w-full" variant="default">
                          Upgrade to Level {userVerificationLevel + 1}
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Access Card */}
            <Card className="overflow-hidden hidden lg:block">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 border-b">
                  <h3 className="font-semibold text-sm">Quick Access</h3>
                </div>
                <nav className="p-2 space-y-1">
                  <Button
                    variant={activeWalletTab === "wallet" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveWalletTab("wallet")}
                  >
                    <WalletIcon className="h-4 w-4 mr-3" />
                    Wallet
                  </Button>
                  <Link href="/spot" className="block">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <ArrowLeftRight className="h-4 w-4 mr-3" />
                      Spot Trading
                    </Button>
                  </Link>
                  <Link href="/wallet/visa-card" className="block">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <CreditCard className="h-4 w-4 mr-3" />
                      Visa Card
                    </Button>
                  </Link>
                  <Link href="/wallet/pexly-pay" className="block">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Send className="h-4 w-4 mr-3" />
                      Pexly Pay
                    </Button>
                  </Link>
                  <Link href="/wallet/mobile-topup" className="block">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Smartphone className="h-4 w-4 mr-3" />
                      Mobile Top-up
                    </Button>
                  </Link>
                  <Link href="/gift-cards" className="block">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Gift className="h-4 w-4 mr-3" />
                      Gift Cards
                    </Button>
                  </Link>
                </nav>
              </CardContent>
            </Card>

            {/* Mobile Horizontal Quick Access */}
            <div className="overflow-x-auto lg:hidden -mx-4 px-4">
              <div className="flex gap-2 min-w-max pb-2">
                <Button
                  variant={activeWalletTab === "wallet" ? "default" : "outline"}
                  className="h-9 text-sm whitespace-nowrap"
                  onClick={() => setActiveWalletTab("wallet")}
                >
                  <WalletIcon className="h-4 w-4 mr-2" />
                  Wallet
                </Button>
                <Link href="/spot">
                  <Button
                    variant="outline"
                    className="h-9 text-sm whitespace-nowrap"
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Spot
                  </Button>
                </Link>
                <Link href="/wallet/visa-card">
                  <Button
                    variant="outline"
                    className="h-9 text-sm whitespace-nowrap"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Visa card
                  </Button>
                </Link>
                <Link href="/wallet/pexly-pay">
                  <Button
                    variant="outline"
                    className="h-9 text-sm whitespace-nowrap"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Pexly Pay
                  </Button>
                </Link>
                <Link href="/wallet/mobile-topup">
                  <Button
                    variant="outline"
                    className="h-9 text-sm whitespace-nowrap"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Top-up
                  </Button>
                </Link>
                <Link href="/gift-cards">
                  <Button
                    variant="outline"
                    className="h-9 text-sm whitespace-nowrap"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Gift Cards
                  </Button>
                </Link>
              </div>
            </div>
            </div>
          </div>

          {/* MIDDLE COLUMN - Main Wallet Content */}
          <div className="lg:col-span-6 space-y-4">

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
                      <Card 
                        key={asset.symbol} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setLocation(`/wallet/asset/${asset.symbol}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={asset.iconUrl} 
                                alt={asset.symbol}
                                className="w-10 h-10 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${asset.symbol}&background=random`;
                                }}
                              />
                              <div>
                                <div className="font-medium text-sm sm:text-base">{asset.symbol}</div>
                                <div className="text-xs text-muted-foreground">{asset.name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm sm:text-base">
                                {balanceVisible ? asset.balance.toFixed(7) : "••••••"}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {balanceVisible ? `≈ ${preferredCurrency === 'USD' ? asset.usdValue.toFixed(2) : asset.ngnValue.toFixed(2)} ${preferredCurrency}` : "••••••"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium text-sm ${asset.pnlUsd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {balanceVisible ? (asset.pnlUsd >= 0 ? '+' : '') + (preferredCurrency === 'USD' ? asset.pnlUsd.toFixed(2) : convertToNGN(asset.pnlUsd).toFixed(2)) : "••••"}
                              </div>
                              <div className={`text-xs ${asset.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {balanceVisible ? (asset.pnlPercentage >= 0 ? '+' : '') + asset.pnlPercentage.toFixed(2) + '%' : "••••"}
                              </div>
                            </div>
                          </div>
                          {balanceVisible && asset.balance > 0 && (
                            <div className="h-10 w-full mt-2 opacity-50">
                              <Sparkline 
                                data={asset.sparklineData} 
                                color="auto"
                                height={40}
                                strokeWidth={1.5}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </>
            )}

            {/* Recent Activity Tab Content */}
            {activeAssetTab === "activity" && (
              <div className="space-y-3 mb-8">
                <p className="text-sm text-muted-foreground mb-4">Recent wallet activity</p>
                {!transactionsLoaded ? (
                  <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No recent activity</div>
                ) : (
                  transactions.slice(0, 5).map((tx) => (
                    <Card key={tx.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm capitalize">{tx.type.replace(/_/g, ' ')}</span>
                              <Badge
                                variant="outline"
                                className={
                                  tx.status === "completed"
                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                    : tx.status === "pending"
                                    ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                    : "bg-red-500/10 text-red-600 border-red-500/20"
                                }
                              >
                                {tx.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {tx.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                {(tx.status === "failed" || tx.status === "cancelled") && <XCircle className="h-3 w-3 mr-1" />}
                                {tx.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{tx.crypto_symbol}</p>
                            {tx.to_address && (
                              <p className="text-xs text-muted-foreground">To: {tx.to_address.slice(0, 8)}...{tx.to_address.slice(-6)}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(8)} {tx.crypto_symbol}
                            </p>
                            {tx.fee > 0 && (
                              <p className="text-xs text-muted-foreground">Fee: {tx.fee} {tx.crypto_symbol}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* All Operations Tab Content */}
            {activeAssetTab === "operations" && (
              <div className="space-y-3 mb-8">
                <p className="text-sm text-muted-foreground mb-4">All wallet operations including trades, purchases, and transfers</p>
                {!transactionsLoaded ? (
                  <div className="text-center py-8 text-muted-foreground">Loading operations...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No operations yet</div>
                ) : (
                  transactions.map((tx) => (
                    <Card key={tx.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {tx.type.replace(/_/g, ' ')}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  tx.status === "completed"
                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                    : tx.status === "pending"
                                    ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                    : "bg-red-500/10 text-red-600 border-red-500/20"
                                }
                              >
                                {tx.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {tx.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                {(tx.status === "failed" || tx.status === "cancelled") && <XCircle className="h-3 w-3 mr-1" />}
                                {tx.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{tx.crypto_symbol}</p>
                            {tx.to_address && (
                              <p className="text-xs text-muted-foreground">To: {tx.to_address.slice(0, 8)}...{tx.to_address.slice(-6)}</p>
                            )}
                            {tx.from_address && (
                              <p className="text-xs text-muted-foreground">From: {tx.from_address.slice(0, 8)}...{tx.from_address.slice(-6)}</p>
                            )}
                            {tx.notes && (
                              <p className="text-xs text-muted-foreground">{tx.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(8)} {tx.crypto_symbol}
                            </p>
                            {tx.fee > 0 && (
                              <p className="text-xs text-muted-foreground">Fee: {tx.fee} {tx.crypto_symbol}</p>
                            )}
                            {tx.tx_hash && (
                              <p className="text-xs text-muted-foreground">TX: {tx.tx_hash.slice(0, 8)}...</p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
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
                        <img 
                          src={cryptoIconUrls[pair.symbol as keyof typeof cryptoIconUrls] || `https://ui-avatars.com/api/?name=${pair.symbol}&background=random`}
                          alt={pair.symbol}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${pair.symbol}&background=random`;
                          }}
                        />
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

          </div>

          {/* RIGHT COLUMN - Rewards & Referrals */}
          <div className="lg:col-span-3">
            <div className="space-y-4 lg:sticky lg:top-6">

            {/* Rewards Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Rewards</h3>
                  </div>
                  <p className="text-sm opacity-90">Earn while you trade</p>
                </div>
                <div className="p-4 space-y-3">
                  <Link href="/rewards" className="block">
                    <div className="p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Trading Rewards</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Earn up to 0.5% cashback</p>
                    </div>
                  </Link>
                  <Link href="/medals" className="block">
                    <div className="p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Achievement Medals</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Unlock exclusive badges</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Referral Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-green-600 to-green-500 p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Referrals</h3>
                  </div>
                  <p className="text-sm opacity-90">Invite & earn together</p>
                </div>
                <div className="p-4 space-y-3">
                  <Link href="/referral" className="block">
                    <div className="p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Invite Friends</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Get $10 per referral</p>
                    </div>
                  </Link>
                  <Link href="/affiliate" className="block">
                    <div className="p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Affiliate Program</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Earn up to 40% commission</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Promotions Card */}
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-none text-white overflow-hidden">
              <CardContent className="p-4">
                <div className="mb-3">
                  <h3 className="text-2xl font-bold mb-1">Save up to</h3>
                  <p className="text-3xl font-bold text-orange-100">20% on gift cards</p>
                </div>
                <p className="text-xs mb-4 opacity-90">
                  Exclusive discounts on the gift cards you love!
                </p>
                <Link href="/gift-cards">
                  <Button className="w-full bg-white text-orange-600 hover:bg-gray-100" size="sm">
                    <Gift className="h-4 w-4 mr-2" />
                    Buy a gift card
                  </Button>
                </Link>
              </CardContent>
            </Card>

            </div>
          </div>
        </div>

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
