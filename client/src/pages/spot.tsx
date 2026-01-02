import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSchema, spotPageSchema } from "@/hooks/use-schema";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Star,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Search,
  ArrowUpDown,
  BookOpen,
  Clock,
  BarChart3,
  Flame,
  Sparkles,
  DollarSign,
  Activity,
} from "lucide-react";
import { getCryptoPrices, type CryptoPrice } from "@/lib/crypto-prices";
import { asterdexService } from "@/lib/asterdex-service";
import { swapExecutionService } from "@/lib/swap-execution";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";
import { useAuth } from "@/lib/auth-context";
import { useWallets, useWalletBalance } from "@/hooks/use-wallets";
import { feeCalculator } from "@/lib/fee-calculator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";

interface TradingPair {
  pair: string;
  price: number;
  change: number;
  volume: string;
  high: number;
  low: number;
  favorite: boolean;
  leverage: string;
  symbol: string;
}

const initialTradingPairs: TradingPair[] = [
  { pair: "BTC/USDT", symbol: "BTC", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: true, leverage: "10x" },
  { pair: "ETH/USDT", symbol: "ETH", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: true, leverage: "10x" },
  { pair: "SOL/USDT", symbol: "SOL", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: true, leverage: "10x" },
  { pair: "BNB/USDT", symbol: "BNB", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: true, leverage: "10x" },
  { pair: "XRP/USDT", symbol: "XRP", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
  { pair: "TON/USDT", symbol: "TON", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
  { pair: "TRX/USDT", symbol: "TRX", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
  { pair: "LTC/USDT", symbol: "LTC", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
  { pair: "ADA/USDT", symbol: "ADA", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
];

const orderBook = {
  asks: [
    { price: 122260.50, amount: 0.524, total: 64064.54 },
    { price: 122259.00, amount: 1.243, total: 151964.00 },
    { price: 122258.50, amount: 0.892, total: 109054.58 },
    { price: 122257.00, amount: 2.156, total: 263578.09 },
    { price: 122256.50, amount: 0.673, total: 82258.62 },
  ],
  bids: [
    { price: 122255.50, amount: 1.234, total: 150863.49 },
    { price: 122254.00, amount: 0.756, total: 92424.02 },
    { price: 122253.50, amount: 2.145, total: 262234.01 },
    { price: 122252.00, amount: 0.892, total: 109048.78 },
    { price: 122251.50, amount: 1.567, total: 191570.11 },
  ],
};

const recentTrades = [
  { price: 122256.50, amount: 0.0234, time: "18:42:15", type: "sell" },
  { price: 122257.00, amount: 0.1543, time: "18:42:14", type: "buy" },
  { price: 122256.00, amount: 0.0892, time: "18:42:13", type: "sell" },
  { price: 122258.50, amount: 0.2156, time: "18:42:12", type: "buy" },
  { price: 122255.50, amount: 0.0673, time: "18:42:11", type: "sell" },
];

export function Spot() {
  useSchema(spotPageSchema, "spot-page-schema");
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>(initialTradingPairs);
  const [selectedPair, setSelectedPair] = useState(initialTradingPairs[0]);
  const [searchPair, setSearchPair] = useState("");
  const [showMarketList, setShowMarketList] = useState(false);
  const [activeMarketTab, setActiveMarketTab] = useState("hot");
  const [chartInterval, setChartInterval] = useState("60");
  const [liveOrderBook, setLiveOrderBook] = useState({ bids: [] as Array<[string, string]>, asks: [] as Array<[string, string]> });
  const [liveTrades, setLiveTrades] = useState<Array<{ id: number; price: string; qty: string; quoteQty: string; time: number; isBuyerMaker: boolean }>>([]);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Track desktop/mobile for order book display
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Trading Panel State
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [buyAmount, setBuyAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [buyPercentage, setBuyPercentage] = useState([0]);
  const [sellPercentage, setSellPercentage] = useState([0]);
  const [buyFee, setBuyFee] = useState(0);
  const [sellFee, setSellFee] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");
  const [pendingTrade, setPendingTrade] = useState<{ type: "buy" | "sell" } | null>(null);
  const { sessionPassword, setSessionPassword } = useAuth();

  // Get wallet balances and list for the trading pair
  const baseCrypto = selectedPair.symbol;
  const quoteCrypto = "USDT";
  const { data: baseWallet } = useWalletBalance(baseCrypto);
  const { data: quoteWallet } = useWalletBalance(quoteCrypto);
  const { data: userWallets = [] } = useWallets();

  // Fetch real-time prices from Asterdex
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const symbols = tradingPairs.map(p => p.symbol);
        const asterdexSymbols = symbols.map(s => `${s}USDT`);
        
        const tickers = await asterdexService.getTickers(asterdexSymbols);
        
        if (tickers && tickers.length > 0) {
          setTradingPairs(prevPairs => 
            prevPairs.map(pair => {
              const ticker = tickers.find(t => t.symbol === `${pair.symbol}USDT`);
                
              if (ticker) {
                const price = parseFloat(ticker.lastPrice);
                const change = parseFloat(ticker.priceChangePercent);
                const quoteVolume = parseFloat(ticker.quoteVolume);
                
                return {
                  ...pair,
                  price,
                  change,
                  volume: `${(quoteVolume / 1e9).toFixed(2)}B`,
                  high: parseFloat(ticker.highPrice),
                  low: parseFloat(ticker.lowPrice),
                };
              }
              return pair;
            })
          );
        }
      } catch (error) {
        console.error('Error fetching crypto prices from Asterdex:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Update selected pair when trading pairs change
  useEffect(() => {
    const updatedPair = tradingPairs.find(p => p.pair === selectedPair.pair);
    if (updatedPair) {
      setSelectedPair(updatedPair);
    }
  }, [tradingPairs]);

  // Fetch order book and recent trades when pair changes
  useEffect(() => {
    const fetchOrderBookAndTrades = async () => {
      try {
        const symbol = `${selectedPair.symbol}USDT`;
        const [orderBookData, tradesData] = await Promise.all([
          asterdexService.getOrderBook(symbol, 20),
          asterdexService.getRecentTrades(symbol, 20),
        ]);
        
        if (orderBookData) {
          setLiveOrderBook(orderBookData);
        }
        if (tradesData) {
          setLiveTrades(tradesData);
        }
      } catch (error) {
        console.error('Error fetching order book/trades:', error);
      }
    };

    fetchOrderBookAndTrades();
    const interval = setInterval(fetchOrderBookAndTrades, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [selectedPair]);

  // Calculate buy fee
  useEffect(() => {
    const calculateBuyFee = async () => {
      if (!buyAmount || parseFloat(buyAmount) <= 0) {
        setBuyFee(0);
        return;
      }

      try {
        const amount = parseFloat(buyAmount);
        const price = orderType === 'limit' ? parseFloat(buyPrice) || selectedPair.price : selectedPair.price;
        const totalUSDT = amount * price;

        // Spot trading fee: 0.16% as average for taker
        const feePercentage = 0.16;
        const fee = totalUSDT * (feePercentage / 100);
        setBuyFee(fee);
      } catch (error) {
        console.error('Error calculating buy fee:', error);
        setBuyFee(0);
      }
    };

    calculateBuyFee();
  }, [buyAmount, buyPrice, orderType, selectedPair.price]);

  // Calculate sell fee
  useEffect(() => {
    const calculateSellFee = async () => {
      if (!sellAmount || parseFloat(sellAmount) <= 0) {
        setSellFee(0);
        return;
      }

      try {
        const amount = parseFloat(sellAmount);
        const price = orderType === 'limit' ? parseFloat(sellPrice) || selectedPair.price : selectedPair.price;
        const totalUSDT = amount * price;

        // Spot trading fee: 0.16% as average for taker
        const feePercentage = 0.16;
        const fee = totalUSDT * (feePercentage / 100);
        setSellFee(fee);
      } catch (error) {
        console.error('Error calculating sell fee:', error);
        setSellFee(0);
      }
    };

    calculateSellFee();
  }, [sellAmount, sellPrice, orderType, selectedPair.price]);

  const getFilteredPairs = (type: string) => {
    let filtered = tradingPairs.filter(pair =>
      pair.pair.toLowerCase().includes(searchPair.toLowerCase())
    );

    switch (type) {
      case "favorites":
        return filtered.filter(p => p.favorite);
      case "hot":
        return filtered.slice(0, 5);
      case "new":
        return filtered.filter(p => ["ZORA/USDT", "ASTER/USDT", "APT/USDT", "ARB/USDT", "OP/USDT"].includes(p.pair));
      case "gainers":
        return filtered.filter(p => p.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
      case "losers":
        return filtered.filter(p => p.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
      case "turnover":
        return filtered.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume)).slice(0, 5);
      case "opportunities":
        return filtered.filter(p => Math.abs(p.change) > 3).slice(0, 5);
      default:
        return filtered;
    }
  };

  const filteredPairs = getFilteredPairs(activeMarketTab);

  // Execute buy order with AsterDEX
  const handleBuy = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to trade",
        variant: "destructive",
      });
      setLocation("/signin");
      return;
    }

    // Check if user has a wallet
    if (!userWallets || userWallets.length === 0) {
      toast({
        title: "No Wallet Connected",
        description: "Please create or connect a wallet to trade",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(buyAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // If we have a cached session password, execute directly
    if (sessionPassword) {
      await executeTrade("buy", sessionPassword);
    } else {
      // Otherwise prompt for password (will be cached for session)
      setPendingTrade({ type: "buy" });
      setShowPasswordDialog(true);
    }
  };

  // Execute the actual trade with cached or provided password
  const executeTrade = async (type: "buy" | "sell", password: string) => {
    if (!user) return;
    
    setIsExecuting(true);
    try {
      const fromToken = type === "buy" ? "USDT" : selectedPair.symbol;
      const toToken = type === "buy" ? selectedPair.symbol : "USDT";
      const amountStr = type === "buy" ? buyAmount : sellAmount;

      const quote = await swapExecutionService.getSwapQuote(
        fromToken,
        toToken,
        amountStr
      );

      toast({
        title: "Quote Fetched",
        description: `Price: ${quote.price} | Slippage: ${quote.slippage}% | Fee: ${quote.fee.toFixed(2)} USDT`,
      });

      const order = swapExecutionService.createExecutionOrder(
        type,
        fromToken,
        toToken,
        amountStr,
        quote
      );

      toast({
        title: "Confirm Transaction",
        description: `You will ${type === "buy" ? "receive" : "pay"} ~${type === "buy" ? quote.toAmount : quote.fromAmount} ${selectedPair.symbol}. Confirm in your wallet.`,
      });

      const activeWallet = userWallets[0] as any;

      // Execute swap with provided password
      // Use RocketX via swapExecutionService which now handles token normalization
      const result = await swapExecutionService.executeSwap(
        activeWallet,
        fromToken,
        toToken,
        amountStr,
        password,
        user.id
      );

      toast({
        title: "Order Submitted",
        description: `${type === "buy" ? "Buy" : "Sell"} order submitted. TX: ${result.txHash?.slice(0, 10)}... Waiting for on-chain confirmation...`,
      });

      if (type === "buy") {
        setBuyAmount("");
        setBuyPrice("");
        setBuyPercentage([0]);
      } else {
        setSellAmount("");
        setSellPrice("");
        setSellPercentage([0]);
      }
    } catch (error: any) {
      console.error('Trade execution error:', error);
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to execute trade via AsterDEX",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
      setShowPasswordDialog(false);
      setWalletPassword("");
      setPendingTrade(null);
    }
  };

  // Execute sell order with AsterDEX
  const handleSell = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to trade",
        variant: "destructive",
      });
      setLocation("/signin");
      return;
    }

    // Check if user has a wallet
    if (!userWallets || userWallets.length === 0) {
      toast({
        title: "No Wallet Connected",
        description: "Please create or connect a wallet to trade",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(sellAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // If we have a cached session password, execute directly
    if (sessionPassword) {
      await executeTrade("sell", sessionPassword);
    } else {
      // Otherwise prompt for password (will be cached for session)
      setPendingTrade({ type: "sell" });
      setShowPasswordDialog(true);
    }
  };


  if (showMarketList) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="🔥 2Z/USDT"
                className="pl-9"
                value={searchPair}
                onChange={(e) => setSearchPair(e.target.value)}
              />
            </div>

            <Tabs value={activeMarketTab} onValueChange={setActiveMarketTab} className="w-full">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="inline-flex min-w-full w-auto rounded-none border-b h-auto p-0">
                  <TabsTrigger value="favorites" className="text-xs flex-shrink-0">Favorites</TabsTrigger>
                  <TabsTrigger value="hot" className="text-xs flex-shrink-0">Hot</TabsTrigger>
                  <TabsTrigger value="new" className="text-xs flex-shrink-0">New</TabsTrigger>
                  <TabsTrigger value="gainers" className="text-xs flex-shrink-0">Gainers</TabsTrigger>
                  <TabsTrigger value="losers" className="text-xs flex-shrink-0">Losers</TabsTrigger>
                  <TabsTrigger value="turnover" className="text-xs flex-shrink-0">Turnover</TabsTrigger>
                  <TabsTrigger value="opportunities" className="text-xs flex-shrink-0">Opportunities</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowMarketList(false)}>
                Spot
              </Button>
              <Button variant="ghost" size="sm">Derivatives</Button>
              <div className="ml-auto flex gap-2">
                <Select defaultValue="usdt">
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usdt">USDT</SelectItem>
                    <SelectItem value="btc">BTC</SelectItem>
                    <SelectItem value="eth">ETH</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="5x">5x</SelectItem>
                    <SelectItem value="10x">10x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <p className="text-sm">📢 Pexly Spot Trading - Trade with confidence</p>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-3 py-2">
              <div className="col-span-1"></div>
              <div className="col-span-5">Trading Pairs / Vol</div>
              <div className="col-span-3 text-right">Price</div>
              <div className="col-span-3 text-right">24H Change</div>
            </div>

            {filteredPairs.map((pair, index) => (
              <div
                key={pair.pair}
                className="grid grid-cols-12 gap-2 items-center px-3 py-3 hover:bg-muted/50 cursor-pointer rounded-lg transition-colors"
                onClick={() => {
                  setSelectedPair(pair);
                  setShowMarketList(false);
                }}
              >
                <div className="col-span-1 text-muted-foreground text-sm">{index + 1}</div>
                <div className="col-span-5">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold flex items-center gap-1">
                      {pair.pair.split('/')[0]}
                      <span className="text-muted-foreground">/ {pair.pair.split('/')[1]}</span>
                      {pair.favorite && <Flame className="h-3 w-3 text-orange-500" />}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{pair.volume} USDT</div>
                </div>
                <div className="col-span-3 text-right">
                  <div className="font-semibold">{pair.price.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{pair.price.toLocaleString()} USD</div>
                </div>
                <div className="col-span-3 text-right">
                  <Badge
                    variant={pair.change >= 0 ? "default" : "destructive"}
                    className={pair.change >= 0 ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {pair.change >= 0 ? '+' : ''}{pair.change}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-auto">
        {/* Main Content Area */}
        <div className="flex flex-col">
          {/* Price Header */}
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold">{selectedPair.pair}</h2>
                <Select value={selectedPair.pair} onValueChange={(value) => {
                  const pair = tradingPairs.find(p => p.pair === value);
                  if (pair) setSelectedPair(pair);
                }}>
                  <SelectTrigger className="w-32 h-8 hidden lg:flex">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tradingPairs.map((pair) => (
                      <SelectItem key={pair.pair} value={pair.pair}>
                        {pair.pair}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant={selectedPair.change >= 0 ? "default" : "destructive"} className={selectedPair.change >= 0 ? "bg-green-600" : ""}>
                {selectedPair.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {selectedPair.change >= 0 ? '+' : ''}{selectedPair.change}%
              </Badge>
              {selectedPair.leverage && <Badge variant="outline" className="hidden sm:inline-flex">{selectedPair.leverage}</Badge>}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto lg:hidden"
                onClick={() => setShowMarketList(true)}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Pairs
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-sm">
              <div className="bg-card p-2 md:p-3 rounded-lg border border-border shadow-sm">
                <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">Last Price</p>
                <p className="text-base md:text-lg font-bold">${selectedPair.price.toLocaleString()}</p>
              </div>
              <div className="bg-card p-2 md:p-3 rounded-lg border border-border shadow-sm">
                <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">24h High</p>
                <p className="text-base md:text-lg font-bold text-green-600">${selectedPair.high.toLocaleString()}</p>
              </div>
              <div className="bg-card p-2 md:p-3 rounded-lg border border-border shadow-sm">
                <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">24h Low</p>
                <p className="text-base md:text-lg font-bold text-red-600">${selectedPair.low.toLocaleString()}</p>
              </div>
              <div className="bg-card p-2 md:p-3 rounded-lg border border-border shadow-sm">
                <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">24h Volume</p>
                <p className="text-base md:text-lg font-bold">{selectedPair.volume}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-0">
            {/* Chart Area */}
            <div className="p-2 md:p-4 border-b lg:border-b-0 lg:border-r border-border flex flex-col w-full lg:flex-[3] h-[500px]">
              <div className="flex items-center justify-between mb-2 md:mb-4 flex-shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 md:gap-2">
                  <Button 
                    variant={chartInterval === "1" ? "default" : "outline"} 
                    size="sm"
                    className="h-7 px-2 md:h-9 md:px-4 text-xs"
                    onClick={() => setChartInterval("1")}
                  >
                    1m
                  </Button>
                  <Button 
                    variant={chartInterval === "5" ? "default" : "outline"} 
                    size="sm"
                    className="h-7 px-2 md:h-9 md:px-4 text-xs"
                    onClick={() => setChartInterval("5")}
                  >
                    5m
                  </Button>
                  <Button 
                    variant={chartInterval === "15" ? "default" : "outline"} 
                    size="sm"
                    className="h-7 px-2 md:h-9 md:px-4 text-xs"
                    onClick={() => setChartInterval("15")}
                  >
                    15m
                  </Button>
                  <Button 
                    variant={chartInterval === "60" ? "default" : "outline"} 
                    size="sm"
                    className="h-7 px-2 md:h-9 md:px-4 text-xs"
                    onClick={() => setChartInterval("60")}
                  >
                    1H
                  </Button>
                  <Button 
                    variant={chartInterval === "D" ? "default" : "outline"} 
                    size="sm"
                    className="h-7 px-2 md:h-9 md:px-4 text-xs"
                    onClick={() => setChartInterval("D")}
                  >
                    1D
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-h-0 bg-background rounded-lg overflow-hidden relative lg:flex-1">
                <iframe
                  key={`${selectedPair.pair}-${chartInterval}`}
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=BINANCE:${selectedPair.pair.replace('/', '')}&interval=${chartInterval}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget_new&utm_campaign=chart&utm_term=BINANCE:${selectedPair.pair.replace('/', '')}`}
                  className="absolute inset-0 w-full h-full"
                  title="TradingView Chart"
                ></iframe>
              </div>
            </div>

            {/* Combined Sidebar: Order Book and Trade Panel */}
            <div className="w-full lg:w-[480px] lg:flex-[1.5] flex flex-row border-t lg:border-t-0 h-auto lg:h-[500px] overflow-hidden">
              {/* Column 1: Order Book */}
              <div className="flex-[0.8] border-r border-border flex flex-col overflow-hidden h-full">
                <div className="p-2 border-b border-border text-xs font-semibold flex items-center flex-shrink-0">
                  <BookOpen className="h-3 w-3 mr-1" /> Order Book
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                  <div className="grid grid-cols-2 text-[10px] text-muted-foreground mb-1 px-1">
                    <div>Price</div>
                    <div className="text-right">Size</div>
                  </div>

                  {/* Asks */}
                  <div className="space-y-0.5 mb-2">
                    {liveOrderBook.asks.slice(-(isDesktop ? 10 : 6)).reverse().map((ask, i) => {
                      const price = parseFloat(ask[0]);
                      const amount = parseFloat(ask[1]);
                      return (
                        <div key={i} className="grid grid-cols-2 text-[10px] px-1 py-0.5 hover:bg-red-500/10 cursor-pointer relative">
                          <div className="absolute inset-y-0 right-0 bg-red-500/10" style={{ width: `${(amount / Math.max(...liveOrderBook.asks.map(a => parseFloat(a[1])))) * 100}%` }}></div>
                          <div className="text-red-500 relative z-10">{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</div>
                          <div className="text-right relative z-10">{amount.toFixed(3)}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Spread/Mid Price */}
                  <div className="text-center py-1 my-1 bg-muted/30 rounded border-y border-border/50">
                    <span className={`text-xs font-bold ${selectedPair.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedPair.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Bids */}
                  <div className="space-y-0.5">
                    {liveOrderBook.bids.slice(0, isDesktop ? 10 : 6).map((bid, i) => {
                      const price = parseFloat(bid[0]);
                      const amount = parseFloat(bid[1]);
                      return (
                        <div key={i} className="grid grid-cols-2 text-[10px] px-1 py-0.5 hover:bg-green-500/10 cursor-pointer relative">
                          <div className="absolute inset-y-0 right-0 bg-green-500/10" style={{ width: `${(amount / Math.max(...liveOrderBook.bids.map(b => parseFloat(b[1])))) * 100}%` }}></div>
                          <div className="text-green-500 relative z-10">{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</div>
                          <div className="text-right relative z-10">{amount.toFixed(3)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Column 2: Trade Panel */}
              <div className="flex-[1.2] flex flex-col overflow-hidden h-full">
                    <Tabs defaultValue="buy" className="flex-1 flex flex-col">
                      <TabsList className="w-full grid grid-cols-2 rounded-none h-9 border-b border-border bg-transparent">
                        <TabsTrigger value="buy" className="text-xs data-[state=active]:text-green-500 data-[state=active]:bg-green-500/10 rounded-none border-b-2 border-transparent data-[state=active]:border-green-500">Buy</TabsTrigger>
                        <TabsTrigger value="sell" className="text-xs data-[state=active]:text-red-500 data-[state=active]:bg-red-500/10 rounded-none border-b-2 border-transparent data-[state=active]:border-red-500">Sell</TabsTrigger>
                      </TabsList>

                      <TabsContent value="buy" className="m-0 flex-1 flex flex-col overflow-hidden">
                        <div className="p-2 space-y-3 overflow-y-auto no-scrollbar flex-1">
                          <Select defaultValue="market" onValueChange={(v) => setOrderType(v as any)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Order Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="limit">Limit</SelectItem>
                              <SelectItem value="market">Market</SelectItem>
                            </SelectContent>
                          </Select>

                          {orderType === "limit" ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Price</span>
                                <span>USDT</span>
                              </div>
                              <Input 
                                className="h-8 text-xs bg-muted/20" 
                                value={buyPrice}
                                onChange={(e) => setBuyPrice(e.target.value)}
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Price</span>
                                <span>USDT</span>
                              </div>
                              <div className="h-8 flex items-center px-3 rounded-md bg-muted/40 text-xs text-muted-foreground">
                                Market Price
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Amount</span>
                              <span>{selectedPair.symbol}</span>
                            </div>
                            <Input 
                              className="h-8 text-xs bg-muted/20" 
                              value={buyAmount}
                              onChange={(e) => setBuyAmount(e.target.value)}
                            />
                          </div>

                          <div className="pt-1">
                            <Slider
                              value={buyPercentage}
                              onValueChange={setBuyPercentage}
                              max={100}
                              step={25}
                              className="py-2"
                            />
                            <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
                              <span>0%</span>
                              <span>25%</span>
                              <span>50%</span>
                              <span>75%</span>
                              <span>100%</span>
                            </div>
                          </div>

                          <div className="space-y-1 pt-2 border-t border-border/50">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">Avbl</span>
                              <span>{quoteWallet?.balance.toFixed(2) || "0.00"} USDT</span>
                            </div>
                          </div>

                          <Button 
                            className="w-full h-9 text-xs bg-green-500 hover:bg-green-600 text-white font-bold uppercase tracking-wider"
                            onClick={handleBuy}
                            disabled={isExecuting}
                          >
                            {isExecuting ? "Processing..." : "Buy"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="sell" className="m-0 flex-1 flex flex-col overflow-hidden">
                        <div className="p-2 space-y-3 overflow-y-auto no-scrollbar flex-1">
                          <Select defaultValue="market" onValueChange={(v) => setOrderType(v as any)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Order Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="limit">Limit</SelectItem>
                              <SelectItem value="market">Market</SelectItem>
                            </SelectContent>
                          </Select>

                          {orderType === "limit" ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Price</span>
                                <span>USDT</span>
                              </div>
                              <Input 
                                className="h-8 text-xs bg-muted/20" 
                                value={sellPrice}
                                onChange={(e) => setSellPrice(e.target.value)}
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Price</span>
                                <span>USDT</span>
                              </div>
                              <div className="h-8 flex items-center px-3 rounded-md bg-muted/40 text-xs text-muted-foreground">
                                Market Price
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Amount</span>
                              <span>{selectedPair.symbol}</span>
                            </div>
                            <Input 
                              className="h-8 text-xs bg-muted/20" 
                              value={sellAmount}
                              onChange={(e) => setSellAmount(e.target.value)}
                            />
                          </div>

                          <div className="pt-1">
                            <Slider
                              value={sellPercentage}
                              onValueChange={setSellPercentage}
                              max={100}
                              step={25}
                              className="py-2"
                            />
                            <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
                              <span>0%</span>
                              <span>25%</span>
                              <span>50%</span>
                              <span>75%</span>
                              <span>100%</span>
                            </div>
                          </div>

                          <div className="space-y-1 pt-2 border-t border-border/50">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">Avbl</span>
                              <span>{baseWallet?.balance.toFixed(4) || "0.00"} {selectedPair.symbol}</span>
                            </div>
                          </div>

                          <Button 
                            className="w-full h-9 text-xs bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wider"
                            onClick={handleSell}
                            disabled={isExecuting}
                          >
                            {isExecuting ? "Processing..." : "Sell"}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
              </div>
            </div>
          </div>

          {/* Bottom Section: Open Orders / Assets */}
          <div className="border-t border-border p-4 bg-background">
            <Tabs defaultValue="orders">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-transparent h-auto p-0 gap-4">
                  <TabsTrigger value="orders" className="text-sm p-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Open Orders</TabsTrigger>
                  <TabsTrigger value="assets" className="text-sm p-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Assets</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="hide-low-top" className="rounded border-border bg-muted h-3 w-3" />
                    <label htmlFor="hide-low-top" className="text-[10px] text-muted-foreground whitespace-nowrap">Hide low balance assets</label>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <TabsContent value="orders">
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No open orders found</p>
                </div>
              </TabsContent>
              <TabsContent value="assets">
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">No assets found</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Password Dialog - for first-time password entry in session */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Enter Wallet Password</h3>
                <p className="text-sm text-muted-foreground">Password will be cached for this session (until logout)</p>
                <Input
                  type="password"
                  placeholder="Wallet Password"
                  value={walletPassword}
                  onChange={(e) => setWalletPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && walletPassword) {
                      setSessionPassword(walletPassword);
                      executeTrade(pendingTrade!.type, walletPassword);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowPasswordDialog(false);
                      setWalletPassword("");
                      setPendingTrade(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setSessionPassword(walletPassword);
                      executeTrade(pendingTrade!.type, walletPassword);
                    }}
                    disabled={!walletPassword || isExecuting}
                  >
                    {isExecuting ? "Processing..." : "Confirm"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
