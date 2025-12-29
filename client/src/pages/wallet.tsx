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
  Send,
  ArrowRight,
  Newspaper,
  ExternalLink
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { SendCryptoDialog } from "@/components/send-crypto-dialog";
import { ReceiveCryptoDialog } from "@/components/receive-crypto-dialog";
import { type Wallet, type WalletTransaction, getWalletTransactions, getUserWallets } from "@/lib/wallet-api";
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

const tabs = ["Hot", "New", "Gainers", "Losers", "Turnover"];

const defaultMarkets = [
  { symbol: "BTC", name: "Bitcoin", pair: "USDT", price: "85,451.2", change: -0.79 },
  { symbol: "ETH", name: "Ethereum", pair: "USDT", price: "2,826.06", change: -0.13 },
  { symbol: "SOL", name: "Solana", pair: "USDT", price: "119.38", change: -3.11 },
  { symbol: "BNB", name: "Binance Coin", pair: "USDT", price: "600", change: -2.0 },
  { symbol: "USDC", name: "USD Coin", pair: "USDT", price: "1.0004", change: 0.02 },
  { symbol: "USDT", name: "Tether", pair: "USDT", price: "1.0000", change: 0.0 },
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


interface CryptoNews {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string;
  source: string;
  published_at: string;
}

export default function Wallet() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeWalletTab, setActiveWalletTab] = useState("wallet");
  const [activeAssetTab, setActiveAssetTab] = useState("assets");
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeSpotTab, setActiveSpotTab] = useState("hot");
  const [activeTab, setActiveTab] = useState("Hot");
  const [markets, setMarkets] = useState(defaultMarkets);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletsLoaded, setWalletsLoaded] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, CryptoPrice>>({});
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [pricesLoadedSuccessfully, setPricesLoadedSuccessfully] = useState(false);
  const [cryptoNews, setCryptoNews] = useState<CryptoNews[]>([]);
  const [newsLoaded, setNewsLoaded] = useState(false);
  
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

  const loadCryptoNews = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/news?language=en&per_page=5');
      const data = await response.json();
      if (data && data.data && Array.isArray(data.data)) {
        const news: CryptoNews[] = data.data.slice(0, 5).map((item: any) => ({
          id: item.id || Math.random().toString(),
          title: item.title || 'Crypto News',
          description: item.description || '',
          url: item.url || '#',
          image: item.image?.small || item.image?.thumb || item.image || '',
          source: item.sources?.[0]?.name || 'Crypto News',
          published_at: item.published_at || new Date().toISOString(),
        }));
        setCryptoNews(news);
      }
      setNewsLoaded(true);
    } catch (error) {
      console.error('Error loading crypto news:', error);
      // Use fallback news if API fails
      setCryptoNews([
        {
          id: '1',
          title: 'Bitcoin reaches new heights in 2024',
          description: 'Latest market updates on Bitcoin',
          url: 'https://coingecko.com',
          image: '',
          source: 'Crypto Updates',
          published_at: new Date().toISOString(),
        }
      ]);
      setNewsLoaded(true);
    }
  };

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Load initial data
    loadUserProfile();
    loadWalletData();
    loadCryptoPrices();
    loadCryptoNews();
    // loadTransactions(); // Removed for non-custodial pure mode

    // Increase price update interval to reduce calls
    const priceInterval = setInterval(loadCryptoPrices, 120000); // 2 minutes
    const newsInterval = setInterval(loadCryptoNews, 600000); // 10 minutes

    return () => {
      clearInterval(priceInterval);
      clearInterval(newsInterval);
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
      const userWallets = await getUserWallets(user.id);
      console.log("Loaded wallets from API:", userWallets);
      setWallets(userWallets);
      setWalletsLoaded(true);
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
        
        {/* My Assets Header */}
        <h1 className="text-2xl font-bold mb-6">My Wallet</h1>

        {/* Total Assets Card */}
        <div className="bg-card rounded-2xl p-5 mb-3 shadow-sm border border-border">
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
              <div className="flex items-center gap-2 mt-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLocation("/analysis")}>
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

        {/* 2-Column Layout for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* LEFT COLUMN - Main Wallet Content */}
          <div className="lg:col-span-2.5 space-y-4">

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

            {/* Sell Gift Cards Hero Section */}
            <div className="mb-4 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-visible" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
              <div className="relative z-10 max-w-md">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Sell Gift Cards
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Instantly convert the gift cards you don't need to cash.
                </p>
                <Link href="/gift-cards">
                  <button className="inline-flex items-center gap-2 text-primary font-semibold group">
                    <span>Sell Gift Cards Now</span>
                    <span className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <ArrowRight size={18} />
                    </span>
                  </button>
                </Link>
              </div>

              {/* Brand Logos Image */}
              <div className="relative -mt-2 -mx-8 -mb-8 md:mx-0 md:mb-0 w-[calc(100%+4rem)] md:w-[60%] lg:w-[50%] md:absolute md:-bottom-6 md:-right-4 md:mt-0 pointer-events-none">
                <img 
                  src="/assets/IMG_2941.webp" 
                  alt="Popular gift card brands including Nike, Amazon, Netflix, PlayStation, and more"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Markets Card */}
            <Card className="mb-6">
              <CardContent className="p-5">
                {/* Header with Market dropdown */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Markets</h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm font-medium text-foreground">
                    Market
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
                          <img 
                            src={cryptoIconUrls[market.symbol] || `https://ui-avatars.com/api/?name=${market.symbol}&background=random`}
                            alt={market.name}
                            className="w-9 h-9 rounded-full"
                          />
                          <div className="text-left">
                            <span className="font-semibold text-foreground">{market.symbol}</span>
                            <span className="text-muted-foreground">/USDT</span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <span className="w-24 text-center font-medium text-foreground">${market.price}</span>
                          <div className={`w-20 text-right flex items-center justify-end gap-0.5 font-medium ${
                            market.change >= 0 ? "text-primary" : "text-destructive"
                          }`}>
                            {market.change >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(market.change).toFixed(2)}%
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
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN - Live Crypto News */}
          <div className="lg:col-span-1.5">
            <div className="space-y-4 lg:sticky lg:top-6">

            {/* Crypto News Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Latest Crypto News</h3>
                  </div>
                  <p className="text-sm opacity-90">Stay informed with live updates</p>
                </div>
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {!newsLoaded ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Loading news...
                    </div>
                  ) : cryptoNews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No news available
                    </div>
                  ) : (
                    cryptoNews.map((article) => (
                      <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer block"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {article.image && (
                            <img
                              src={article.image}
                              alt={article.title}
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                              {article.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{article.source}</span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                      </a>
                    ))
                  )}
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
