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
import { useWalletBalances } from "@/hooks/use-wallet-balances";

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
  
  // Initialize cached values from localStorage to prevent 0 display on refresh
  const [cachedBalance, setCachedBalance] = useState<number | null>(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const stored = localStorage.getItem(`pexly_wallet_balance_${user.id}`);
      return stored ? parseFloat(stored) : null;
    }
    return null;
  });
  const [cachedPnL, setCachedPnL] = useState<number | null>(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const stored = localStorage.getItem(`pexly_wallet_pnl_${user.id}`);
      return stored ? parseFloat(stored) : null;
    }
    return null;
  });
  const [cachedPnLPercentage, setCachedPnLPercentage] = useState<number | null>(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const stored = localStorage.getItem(`pexly_wallet_pnl_percentage_${user.id}`);
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
  const { balances, fetchBalances, loading: balancesLoading } = useWalletBalances();

  // Redirect to signin if not logged in (no loading state)
  useEffect(() => {
    if (!loading && !user) {
      window.location.replace("/signin");
    }
  }, [user, loading]);

  const loadCryptoNews = async () => {
    try {
      const apiKey = import.meta.env.VITE_NEWSDATA_API_KEY;
      if (!apiKey) {
        setCryptoNews(getFallbackNews());
        setNewsLoaded(true);
        return;
      }
      
      const response = await fetch(`https://newsdata.io/api/1/news?apikey=${apiKey}&q=crypto&language=en&category=technology`);
      const data = await response.json();
      
      if (data && data.results && Array.isArray(data.results)) {
        const news: CryptoNews[] = data.results.slice(0, 10).map((item: any) => ({
          id: item.article_id || Math.random().toString(),
          title: item.title || 'Crypto News',
          description: item.description || '',
          url: item.link || '#',
          image: item.image_url || '',
          source: item.source_id || 'Crypto News',
          published_at: item.pubDate || new Date().toISOString(),
        }));
        setCryptoNews(news.length > 0 ? news : getFallbackNews());
      } else {
        setCryptoNews(getFallbackNews());
      }
      setNewsLoaded(true);
    } catch (error) {
      console.error('Error loading crypto news:', error);
      setCryptoNews(getFallbackNews());
      setNewsLoaded(true);
    }
  };

  const getFallbackNews = () => [
    {
      id: '1',
      title: 'Dogecon and Pepe Remain Viral Meme Coins as APEMARS Gains Early Attention Ahead of the Next Market Cycle',
      description: "Here's what many crypto investors often ov...",
      url: '#',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop',
      source: 'NewsData.io',
      published_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Top Bitcoin (BTC) Price Predictions for 2026',
      description: '"If the 4-year cycle is still in ...',
      url: '#',
      image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=2669&auto=format&fit=crop',
      source: 'NewsData.io',
      published_at: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'XRP Ledger Returns to Pre-Christmas Levels',
      description: 'Most traders realize XRP Led...',
      url: '#',
      image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1287&auto=format&fit=crop',
      source: 'NewsData.io',
      published_at: new Date().toISOString(),
    },
    {
      id: '4',
      title: "'Just The Beginning'- Bitcoin And Crypto Suddenly Braced For A 'Critical' $17.3 trillion Oil Price Shock",
      description: 'Analysts are braced for a $17.',
      url: '#',
      image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1287&auto=format&fit=crop',
      source: 'NewsData.io',
      published_at: new Date().toISOString(),
    }
  ];

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Load initial data
    loadUserProfile();
    loadWalletData();
    loadCryptoPrices();
    
    // Lazy load news to speed up initial render
    setTimeout(() => {
      loadCryptoNews();
    }, 1000);
    
    fetchBalances();
    // loadTransactions(); // Removed for non-custodial pure mode

    // Increase price update interval to reduce calls
    const priceInterval = setInterval(loadCryptoPrices, 120000); // 2 minutes
    const newsInterval = setInterval(loadCryptoNews, 600000); // 10 minutes
    const balanceInterval = setInterval(fetchBalances, 30000); // 30 seconds

    return () => {
      clearInterval(priceInterval);
      clearInterval(newsInterval);
      clearInterval(balanceInterval);
    };
  }, [user, fetchBalances]);

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
      console.log("Wallet Page: Refreshing all balances...");
      const userWallets = await getUserWallets(user.id);
      console.log("Wallet Page: API Response:", userWallets);
      
      if (userWallets && Array.isArray(userWallets)) {
        setWallets(userWallets);
        setWalletsLoaded(true);
      }
    } catch (error) {
      console.error("Wallet Page: Sync failed:", error);
      // Even on error, we should try to mark loaded if we have cached data
      if (wallets.length === 0) {
        setWalletsLoaded(true);
      }
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
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Loading your assets...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const mergedAssets = cryptoAssets.map(asset => {
    const balanceFromHook = balances.find(b => b.symbol === asset.symbol);
    const wallet = wallets.find(w => w.crypto_symbol === asset.symbol);
    const priceData = cryptoPrices[asset.symbol];
    const balance = balanceFromHook ? parseFloat(balanceFromHook.balance) : (wallet?.balance || 0);
    const lockedBalance = wallet?.locked_balance || 0;
    const totalAssetBalance = balance + lockedBalance;
    const currentPrice = priceData?.current_price || 0;
    const usdValue = totalAssetBalance * currentPrice;

    if (totalAssetBalance > 0) {
      console.log(`Wallet Page - ${asset.symbol}: ${totalAssetBalance} (${balance} available + ${lockedBalance} locked) × $${currentPrice} = $${usdValue.toFixed(2)}`);
    }
    const ngnValue = convertToNGN(usdValue);

    let avgCost = asset.avgCost || currentPrice;
    if (!asset.avgCost && priceData && totalAssetBalance > 0) {
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
      balance: totalAssetBalance,
      availableBalance: balance,
      lockedBalance: lockedBalance,
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
  // We also check localStorage for any globally pre-fetched data from AppHeader
  const hasFreshReliableData = walletsLoaded && pricesLoadedSuccessfully && Object.keys(cryptoPrices).length > 0;

  const getGlobalCachedBalance = () => {
    if (typeof window !== 'undefined' && user?.id) {
      const stored = localStorage.getItem(`pexly_balance_${user.id}`);
      return stored ? parseFloat(stored) : null;
    }
    return null;
  };

  const totalBalance = (!hasFreshReliableData && (cachedBalance !== null || getGlobalCachedBalance() !== null))
    ? (cachedBalance ?? getGlobalCachedBalance() ?? 0)
    : (calculatedBalance || 0);
  const totalPnL = (!hasFreshReliableData && cachedPnL !== null) 
    ? cachedPnL 
    : (calculatedPnL || 0);
  const totalPnLPercentage = (!hasFreshReliableData && cachedPnLPercentage !== null) 
    ? cachedPnLPercentage 
    : (calculatedPnLPercentage || 0);

  // Cache balance ONLY when we have confirmed fresh reliable data from BOTH sources
  // This prevents caching bad data from failed price fetches
  useEffect(() => {
    if (hasFreshReliableData) {
      setCachedBalance(calculatedBalance);
      setCachedPnL(calculatedPnL);
      setCachedPnLPercentage(calculatedPnLPercentage);
      // Persist to localStorage (including zeros for accurate display)
      if (user?.id) {
        localStorage.setItem(`pexly_wallet_balance_${user.id}`, calculatedBalance.toString());
        localStorage.setItem(`pexly_wallet_pnl_${user.id}`, calculatedPnL.toString());
        localStorage.setItem(`pexly_wallet_pnl_percentage_${user.id}`, calculatedPnLPercentage.toString());
      }
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

        {/* 2-Column Layout for Desktop */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">

          {/* LEFT COLUMN - Main Wallet Content */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
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

          </div>

          {/* RIGHT COLUMN - Markets & News */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* News Section */}
              <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Trending News</h2>
                  <button className="text-primary font-semibold text-sm hover:underline">See all</button>
                </div>

                <div className="space-y-8">
                  {/* Main Featured News */}
                  {cryptoNews[0] && (
                    <a 
                      href={cryptoNews[0].url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group block cursor-pointer"
                    >
                      <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden mb-4 bg-muted">
                        <img 
                          src={cryptoNews[0].image || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop"} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">
                        {cryptoNews[0].title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {cryptoNews[0].description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-medium text-primary">{cryptoNews[0].source}</span>
                        <span>•</span>
                        <span>{new Date(cryptoNews[0].published_at).toLocaleDateString()}</span>
                      </div>
                    </a>
                  )}

                  {/* List News */}
                  <div className="space-y-6 pt-6 border-t border-border">
                    {cryptoNews.slice(1, 10).map((article) => (
                      <a 
                        key={article.id} 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex gap-4 group cursor-pointer items-center"
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-muted">
                          <img 
                            src={article.image || "https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1287&auto=format&fit=crop"} 
                            alt="" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="font-medium text-primary">{article.source}</span>
                            <span>•</span>
                            <span>{new Date(article.published_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
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
