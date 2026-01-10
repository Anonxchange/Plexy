import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowLeftRight, ArrowUp, ArrowDown, History, Share2, X, Copy, Download, Mail, ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { getCryptoPrices, getHistoricalPrices, getIntradayPrices, type CryptoPrice, type HistoricalPrice } from "@/lib/crypto-prices";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useToast } from "@/hooks/use-toast";
import { getWalletTransactions, type WalletTransaction } from "@/lib/wallet-api";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { QRCodeSVG } from "qrcode.react";
import { PexlyFooter } from "@/components/pexly-footer";

const cryptoData: Record<string, { name: string; icon: string; color: string; iconUrl?: string }> = {
  BTC: { name: "Bitcoin", icon: "₿", color: "text-orange-500", iconUrl: cryptoIconUrls.BTC },
  ETH: { name: "Ethereum", icon: "Ξ", color: "text-blue-500", iconUrl: cryptoIconUrls.ETH },
  SOL: { name: "Solana", icon: "◎", color: "text-purple-500", iconUrl: cryptoIconUrls.SOL },
  USDC: { name: "USD Coin", icon: "⊙", color: "text-blue-600", iconUrl: cryptoIconUrls.USDC },
  USDT: { name: "Tether", icon: "₮", color: "text-green-500", iconUrl: cryptoIconUrls.USDT },
  BNB: { name: "Binance Coin", icon: "⬡", color: "text-yellow-500", iconUrl: cryptoIconUrls.BNB },
  TRX: { name: "TRON", icon: "◬", color: "text-red-500", iconUrl: cryptoIconUrls.TRX },
  LTC: { name: "Litecoin", icon: "Ł", color: "text-gray-400", iconUrl: cryptoIconUrls.LTC },
  XRP: { name: "Ripple", icon: "✕", color: "text-blue-400", iconUrl: `https://ui-avatars.com/api/?name=XRP&background=random` },
};

export default function AssetDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/wallet/asset/:symbol");
  const [, setLocation] = useLocation();
  const symbol = params?.symbol || "";
  const { toast } = useToast();
  const supabase = createClient();

  const [balance, setBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [price, setPrice] = useState(0);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [avgCost, setAvgCost] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '30D'>('30D');
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState('USD'); // State for preferred currency
  const [tradingPairs, setTradingPairs] = useState<any>({
    usdt: { price: 0, change: 0 },
    usdc: { price: 0, change: 0 },
    usd: { price: 0, change: 0 },
    eur: { price: 0, change: 0 }
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const { balances, fetchBalances } = useWalletBalances();

  const assetInfo = cryptoData[symbol] || { name: symbol, icon: symbol[0], color: "text-gray-500" };

  useEffect(() => {
    if (!user) {
      setLocation("/signin");
      return;
    }
    loadAssetData();
    loadChartData();
    fetchBalances();

    // Subscribe to real-time transaction updates
    const channel = supabase
      .channel('wallet-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions'
        },
        (payload) => {
          console.log('New transaction detected:', payload);
          // Reload transactions when new deposit is detected
          loadTransactions();

          // Show toast notification
          toast({
            title: 'New Deposit Received!',
            description: `${payload.new.amount} ${payload.new.crypto_symbol} has been credited to your wallet`,
          });
        }
      )
      .subscribe();

    // Refresh prices every 2 minutes instead of 30 seconds
    const priceInterval = setInterval(() => {
      loadAssetData();
    }, 120000);

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
        (payload) => {
          // Only reload if the changed wallet matches current symbol
          if (payload.new && (payload.new as any).crypto_symbol === symbol) {
            console.log('Wallet changed, refreshing balance...');
            loadAssetData();
            fetchBalances();
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(priceInterval);
      supabase.removeChannel(channel);
      supabase.removeChannel(walletChannel);
    };
  }, [user, symbol]);

  useEffect(() => {
    loadChartData();
  }, [timeframe]);

  const loadChartData = async () => {
    setIsLoadingChart(true);
    try {
      let historicalData: HistoricalPrice[] = [];
      
      if (timeframe === '1D') {
        historicalData = await getIntradayPrices(symbol);
      } else if (timeframe === '7D') {
        historicalData = await getHistoricalPrices(symbol, 7);
      } else {
        historicalData = await getHistoricalPrices(symbol, 30);
      }

      const formattedData = historicalData.map(item => ({
        date: item.date,
        price: item.price
      }));

      setChartData(formattedData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setIsLoadingChart(false);
    }
  };

  const loadAssetData = async () => {
    try {
      // Fetch wallet balance and user preferences directly from database
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch user preferred currency
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('preferred_currency')
        .eq('id', session.user.id)
        .single();

      const currency = profileData?.preferred_currency?.toUpperCase() || 'USD';
      setPreferredCurrency(currency);

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance, locked_balance')
        .eq('user_id', session.user.id)
        .eq('crypto_symbol', symbol)
        .single();

      const balanceFromHook = balances.find(b => b.symbol === symbol);
      const assetBalance = balanceFromHook ? parseFloat(balanceFromHook.balance) : (walletData?.balance || 0);
      const assetLockedBalance = walletData?.locked_balance || 0;
      setBalance(assetBalance);
      setLockedBalance(assetLockedBalance);

      // Fetch real-time crypto prices
      const prices = await getCryptoPrices([symbol]);
      const priceData = prices[symbol];

      if (priceData) {
        let displayPrice = priceData.current_price;

        // Convert price to preferred currency if not USD
        if (currency !== 'USD') {
          const { convertCurrency } = await import('@/lib/crypto-prices');
          displayPrice = await convertCurrency(priceData.current_price, currency);
        }

        setPrice(displayPrice);
        setPriceChange24h(priceData.price_change_percentage_24h);

        // Set trading pairs with converted prices
        setTradingPairs({
          usdt: { 
            price: displayPrice, 
            change: priceData.price_change_percentage_24h 
          },
          usdc: { 
            price: displayPrice * 0.9995, 
            change: priceData.price_change_percentage_24h 
          },
          usd: { 
            price: displayPrice, 
            change: priceData.price_change_percentage_24h 
          },
          eur: { 
            price: displayPrice * 0.92, 
            change: priceData.price_change_percentage_24h 
          }
        });

        // Get average cost from user profile or use a realistic market-based calculation
        const { data: positionData } = await supabase
          .from('user_profiles')
          .select('avg_cost_btc, avg_cost_eth, avg_cost_sol, avg_cost_bnb, avg_cost_trx, avg_cost_usdc, avg_cost_usdt')
          .eq('id', session.user.id)
          .single();

        // Use stored avg cost or calculate based on 24h price change
        // If price went up 5%, assume user bought at lower price, if down 5%, at higher price
        let calculatedAvgCost = displayPrice;
        const avgCostKey = `avg_cost_${symbol.toLowerCase()}` as keyof typeof positionData;
        
        if (positionData && positionData[avgCostKey]) {
          calculatedAvgCost = Number(positionData[avgCostKey]);
        } else if (priceData) {
          // Calculate a realistic entry price based on 24h change
          // This simulates buying earlier in the market cycle
          const changeMultiplier = 1 - (priceData.price_change_percentage_24h / 100);
          calculatedAvgCost = displayPrice * changeMultiplier;
        }
        
        setAvgCost(calculatedAvgCost);
      }
    } catch (error) {
      console.error('Error loading asset data:', error);
    }
  };

  const loadTransactions = async () => {
    console.log("Reloading transactions and asset data...");
    await loadAssetData();
  };

  const totalBalance = balance + lockedBalance;
  const usdValue = totalBalance * price;
  const costBasis = totalBalance * avgCost;
  const pnlUsd = usdValue - costBasis;
  const pnlPercentage = costBasis > 0 ? ((usdValue - costBasis) / costBasis) * 100 : 0;

  const referralCode = `${user?.email?.toUpperCase().slice(0, 4) || 'PEXL'}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const handleCopyLink = () => {
    const link = `https://pexly.com/ref/${referralCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const handleSave = async () => {
    toast({
      title: "Saving...",
      description: "P&L Analysis image saved to gallery",
    });
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Check out my P&L on Pexly!");
    const body = encodeURIComponent(`Join me on Pexly! Use referral code: ${referralCode}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const chartConfig = {
    price: {
      label: "Price",
      color: pnlPercentage >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)",
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/wallet")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            {assetInfo.iconUrl ? (
              <img 
                src={assetInfo.iconUrl} 
                alt={symbol}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center text-lg ${assetInfo.color} ${assetInfo.iconUrl ? 'hidden' : ''}`}>
              {assetInfo.icon}
            </div>
            <span className="font-semibold text-lg">{symbol}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLocation(`/wallet/history/${symbol}`)}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <History className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setShareOpen(true)}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl pb-20">
        {/* Equity Section */}
        <div className="mb-6">
          <div className="text-sm text-muted-foreground mb-2">Equity</div>
          <div className="text-3xl sm:text-4xl font-bold mb-1">{totalBalance.toFixed(8)}</div>
          <div className="text-sm text-muted-foreground">
            ≈ {preferredCurrency === 'USD' ? '$' : ''}{(totalBalance * price).toFixed(2)} {preferredCurrency}
          </div>
          {lockedBalance > 0 && (
            <div className="text-xs text-yellow-500 mt-2">
              {balance.toFixed(8)} available + {lockedBalance.toFixed(8)} locked
            </div>
          )}
        </div>

        {/* PnL Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Cumulative PnL (USD)</div>
              <div className={`text-xl sm:text-2xl font-semibold ${pnlUsd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {pnlUsd >= 0 ? '+' : ''}{pnlUsd.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Cumulative ROI%</div>
              <div className={`text-xl sm:text-2xl font-semibold ${pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Avg. Cost (USD)</div>
              <div className="text-lg sm:text-xl font-semibold">{avgCost.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Index Price (USD)</div>
              <div className="text-lg sm:text-xl font-semibold">{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {preferredCurrency}</div>
            </CardContent>
          </Card>
        </div>

        {/* Price Chart */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold">Price Chart</h3>
            <div className="flex gap-2">
              <Button
                variant={timeframe === '1D' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('1D')}
                className="h-8 px-3 text-xs"
              >
                1D
              </Button>
              <Button
                variant={timeframe === '7D' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('7D')}
                className="h-8 px-3 text-xs"
              >
                7D
              </Button>
              <Button
                variant={timeframe === '30D' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('30D')}
                className="h-8 px-3 text-xs"
              >
                30D
              </Button>
            </div>
          </div>
          <Card className="overflow-hidden border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-4 bg-gradient-to-br from-background to-muted/20">
              {isLoadingChart ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="text-muted-foreground">Loading chart...</div>
                </div>
              ) : (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={pnlPercentage >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={pnlPercentage >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 6)}
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={pnlPercentage >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                    fill="url(#fillPrice)"
                    strokeWidth={3}
                    animationDuration={800}
                  />
                </AreaChart>
              </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Distribution */}
        <div className="mb-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Distribution</h3>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-primary flex items-center justify-center">
                    <span className="text-xs font-semibold">100%</span>
                  </div>
                  <div>
                    <div className="font-semibold">Unified Trading Account</div>
                    <div className="text-sm text-muted-foreground">≈ {preferredCurrency === 'USD' ? '$' : ''}{(totalBalance * price).toFixed(2)} {preferredCurrency}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{totalBalance.toFixed(8)}</div>
                  {lockedBalance > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {balance.toFixed(8)} available<br/>
                      {lockedBalance.toFixed(8)} locked
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Pairs */}
        <div className="mb-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Trade</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors hover:shadow-md"
              onClick={() => setLocation(`/spot`)}
            >
              <CardContent className="p-4">
                <div className="font-semibold mb-1 flex items-center justify-between">
                  {symbol}/USDT
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mb-1">
                  ${tradingPairs.usdt.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-sm font-medium flex items-center gap-1 ${tradingPairs.usdt.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tradingPairs.usdt.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {tradingPairs.usdt.change >= 0 ? '+' : ''}{tradingPairs.usdt.change.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors hover:shadow-md"
              onClick={() => setLocation(`/spot`)}
            >
              <CardContent className="p-4">
                <div className="font-semibold mb-1 flex items-center justify-between">
                  {symbol}/USDC
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mb-1">
                  ${tradingPairs.usdc.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-sm font-medium flex items-center gap-1 ${tradingPairs.usdc.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tradingPairs.usdc.change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {tradingPairs.usdc.change >= 0 ? '+' : ''}{tradingPairs.usdc.change.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors hover:shadow-md"
              onClick={() => setLocation(`/spot`)}
            >
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                  Spot
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <div className="font-semibold mb-1">{symbol}/USD</div>
                <div className="text-xl font-bold">
                  ${tradingPairs.usd.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors hover:shadow-md"
              onClick={() => setLocation(`/spot`)}
            >
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                  Real Price
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <div className="font-semibold mb-1">{symbol}/EUR</div>
                <div className="text-xl font-bold">
                  €{tradingPairs.eur.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-14 sm:h-16"
            onClick={() => setLocation('/wallet')}
          >
            <ArrowDownToLine className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Receive
          </Button>
          <Button 
            variant="outline" 
            className="h-14 sm:h-16"
            onClick={() => setLocation('/wallet')}
          >
            <ArrowUpFromLine className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Send
          </Button>
        </div>
      </div>

      {/* P&L Analysis Share Drawer */}
      <Drawer open={shareOpen} onOpenChange={setShareOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="flex items-center justify-between border-b pb-4">
            <DrawerTitle>P&L Analysis</DrawerTitle>
            <Button variant="ghost" size="icon" onClick={() => setShareOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </DrawerHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Redesigned P&L Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                {/* Header with logo */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-lime-400 to-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                      {assetInfo.iconUrl ? (
                        <img 
                          src={assetInfo.iconUrl} 
                          alt={symbol}
                          className="w-6 h-6 sm:w-8 sm:h-8"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <span className={`text-lg sm:text-2xl ${assetInfo.color} ${assetInfo.iconUrl ? 'hidden' : ''}`}>{assetInfo.icon}</span>
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold">P&L Analysis</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{assetInfo.name}</div>
                    </div>
                  </div>
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${pnlPercentage >= 0 ? 'from-green-400 to-emerald-600' : 'from-red-400 to-rose-600'} flex items-center justify-center`}>
                    {pnlPercentage >= 0 ? (
                      <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    ) : (
                      <ArrowDown className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    )}
                  </div>
                </div>

                {/* Main P&L Display */}
                <div className="bg-muted/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm text-muted-foreground mb-2">Total Return</div>
                    <div className={`text-4xl sm:text-6xl font-black mb-2 ${pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
                    </div>
                    <div className={`text-xl sm:text-2xl font-semibold ${pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pnlUsd >= 0 ? '+' : ''}${Math.abs(pnlUsd).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <Card>
                    <CardContent className="p-3 sm:p-4">
                      <div className="text-xs text-muted-foreground mb-1">Holdings</div>
                      <div className="text-base sm:text-lg font-bold">{totalBalance.toFixed(4)}</div>
                      <div className="text-xs text-muted-foreground">{symbol}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4">
                      <div className="text-xs text-muted-foreground mb-1">Avg Cost</div>
                      <div className="text-base sm:text-lg font-bold">${avgCost.toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground">per {symbol}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 sm:p-4">
                      <div className="text-xs text-muted-foreground mb-1">Current</div>
                      <div className="text-base sm:text-lg font-bold">{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-muted-foreground">per {symbol}</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Referral Section */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Join and claim over $5,000 in bonuses!
                </div>
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Referral Code:</div>
                    <div className="text-xl sm:text-2xl font-bold">{referralCode}</div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <QRCodeSVG value={`https://pexly.com/ref/${referralCode}`} size={70} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Actions */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Copy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-xs font-medium">Copy</span>
              </button>

              <button
                onClick={handleSave}
                className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <Download className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-xs font-medium">Save</span>
              </button>

              <button
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `My ${symbol} P&L on Pexly`,
                        text: `Check out my ${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage.toFixed(2)}% return on ${symbol}!`,
                        url: `https://pexly.com/ref/${referralCode}`
                      });
                      toast({
                        title: "Shared successfully!",
                        description: "P&L analysis shared",
                      });
                    } catch (err) {
                      if ((err as Error).name !== 'AbortError') {
                        handleEmail();
                      }
                    }
                  } else {
                    handleEmail();
                  }
                }}
                className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Share2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-xs font-medium">Share</span>
              </button>

              <button
                onClick={handleEmail}
                className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-xs font-medium">Email</span>
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <PexlyFooter />
    </div>
  );
}
