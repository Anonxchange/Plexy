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
  { pair: "USDC/USDT", symbol: "USDC", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "3x" },
  { pair: "XRP/USDT", symbol: "XRP", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
  { pair: "TON/USDT", symbol: "TON", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
  { pair: "TRX/USDT", symbol: "TRX", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
  { pair: "LTC/USDT", symbol: "LTC", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
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

export default function Spot() {
  useSchema(spotPageSchema, "spot-page-schema");
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>(initialTradingPairs);
  const [selectedPair, setSelectedPair] = useState(initialTradingPairs[0]);
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [buyAmount, setBuyAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [buyPercentage, setBuyPercentage] = useState([0]);
  const [sellPercentage, setSellPercentage] = useState([0]);
  const [searchPair, setSearchPair] = useState("");
  const [showMarketList, setShowMarketList] = useState(false);
  const [activeMarketTab, setActiveMarketTab] = useState("hot");
  const [chartInterval, setChartInterval] = useState("60");
  const [buyFee, setBuyFee] = useState(0);
  const [sellFee, setSellFee] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  // Get wallet balances for the trading pair
  const baseCrypto = selectedPair.symbol;
  const quoteCrypto = "USDT";
  const { data: baseWallet } = useWalletBalance(baseCrypto);
  const { data: quoteWallet } = useWalletBalance(quoteCrypto);

  // Fetch real-time prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const symbols = tradingPairs.map(p => p.symbol);
        const prices = await getCryptoPrices(symbols);
        
        setTradingPairs(prevPairs => 
          prevPairs.map(pair => {
            const priceData = prices[pair.symbol];
            if (priceData) {
              return {
                ...pair,
                price: priceData.current_price,
                change: priceData.price_change_percentage_24h,
                volume: `${(priceData.total_volume / 1e9).toFixed(2)}B`,
                high: priceData.current_price * 1.02,
                low: priceData.current_price * 0.98,
              };
            }
            return pair;
          })
        );
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
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

        // Spot trading fee: 0.15% - 0.19% (we'll use 0.16% as average for taker)
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

        // Spot trading fee: 0.15% - 0.19% (we'll use 0.16% as average for taker)
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

  // Execute buy order
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

    const amount = parseFloat(buyAmount);
    const price = orderType === 'limit' ? parseFloat(buyPrice) : selectedPair.price;
    const totalCost = amount * price + buyFee;

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!quoteWallet || quoteWallet.balance < totalCost) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${totalCost.toFixed(2)} USDT to complete this trade`,
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      // Execute the trade by updating wallet balances
      const { error } = await supabase.rpc('execute_spot_trade', {
        p_user_id: user.id,
        p_buy_crypto: baseCrypto,
        p_sell_crypto: quoteCrypto,
        p_buy_amount: amount,
        p_sell_amount: totalCost,
        p_price: price,
        p_fee: buyFee,
        p_trade_type: 'buy'
      });

      if (error) throw error;

      toast({
        title: "Trade Executed",
        description: `Successfully bought ${amount} ${baseCrypto}`,
      });

      setBuyAmount("");
      setBuyPrice("");
      setBuyPercentage([0]);
    } catch (error: any) {
      console.error('Trade execution error:', error);
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to execute trade",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Execute sell order
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

    const amount = parseFloat(sellAmount);
    const price = orderType === 'limit' ? parseFloat(sellPrice) : selectedPair.price;
    const totalRevenue = (amount * price) - sellFee;

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!baseWallet || baseWallet.balance < amount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${amount} ${baseCrypto} to complete this trade`,
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      // Execute the trade by updating wallet balances
      const { error } = await supabase.rpc('execute_spot_trade', {
        p_user_id: user.id,
        p_buy_crypto: quoteCrypto,
        p_sell_crypto: baseCrypto,
        p_buy_amount: totalRevenue,
        p_sell_amount: amount,
        p_price: price,
        p_fee: sellFee,
        p_trade_type: 'sell'
      });

      if (error) throw error;

      toast({
        title: "Trade Executed",
        description: `Successfully sold ${amount} ${baseCrypto}`,
      });

      setSellAmount("");
      setSellPrice("");
      setSellPercentage([0]);
    } catch (error: any) {
      console.error('Trade execution error:', error);
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to execute trade",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
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
      <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Trading Pairs */}
        <div className="w-full md:w-80 border-r border-border">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pairs..."
                className="pl-9"
                value={searchPair}
                onChange={(e) => setSearchPair(e.target.value)}
              />
            </div>
          </div>

          <Tabs value={activeMarketTab} onValueChange={setActiveMarketTab} className="w-full">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex min-w-full w-auto rounded-none border-b">
                <TabsTrigger value="favorites" className="flex-shrink-0">
                  <Star className="h-4 w-4 mr-1" />
                  Favorites
                </TabsTrigger>
                <TabsTrigger value="hot" className="flex-shrink-0">
                  <Flame className="h-4 w-4 mr-1" />
                  Hot
                </TabsTrigger>
                <TabsTrigger value="gainers" className="flex-shrink-0">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Gainers
                </TabsTrigger>
                <TabsTrigger value="losers" className="flex-shrink-0">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Losers
                </TabsTrigger>
                <TabsTrigger value="new" className="flex-shrink-0">
                  <Sparkles className="h-4 w-4 mr-1" />
                  New
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeMarketTab} className="mt-0">
              <div className="overflow-y-auto max-h-[calc(100vh-20rem)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Pair</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredPairs(activeMarketTab).slice(0, 5).map((pair) => (
                      <TableRow
                        key={pair.pair}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedPair(pair)}
                      >
                        <TableCell>
                          <Star className={`h-4 w-4 ${pair.favorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium flex items-center gap-1">
                            {pair.pair}
                            {pair.leverage && <Badge variant="outline" className="text-xs ml-1">{pair.leverage}</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{pair.volume} USDT</div>
                        </TableCell>
                        <TableCell className="text-right">{pair.price.toLocaleString()}</TableCell>
                        <TableCell className={`text-right ${pair.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pair.change >= 0 ? '+' : ''}{pair.change}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => setShowMarketList(true)}
                >
                  More →
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Price Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-2xl font-bold">{selectedPair.pair}</h2>
              <Badge variant={selectedPair.change >= 0 ? "default" : "destructive"} className={selectedPair.change >= 0 ? "bg-green-600" : ""}>
                {selectedPair.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {selectedPair.change >= 0 ? '+' : ''}{selectedPair.change}%
              </Badge>
              {selectedPair.leverage && <Badge variant="outline">{selectedPair.leverage}</Badge>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Last Price</p>
                <p className="text-lg font-semibold">${selectedPair.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">24h High</p>
                <p className="text-lg font-semibold text-green-600">${selectedPair.high.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">24h Low</p>
                <p className="text-lg font-semibold text-red-600">${selectedPair.low.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">24h Volume</p>
                <p className="text-lg font-semibold">{selectedPair.volume}</p>
              </div>
            </div>
          </div>

          {/* Chart and Order Book Area */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Chart Area */}
            <div className="flex-1 p-4 border-r border-border min-h-[400px] md:min-h-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant={chartInterval === "1" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setChartInterval("1")}
                  >
                    1m
                  </Button>
                  <Button 
                    variant={chartInterval === "5" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setChartInterval("5")}
                  >
                    5m
                  </Button>
                  <Button 
                    variant={chartInterval === "15" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setChartInterval("15")}
                  >
                    15m
                  </Button>
                  <Button 
                    variant={chartInterval === "60" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setChartInterval("60")}
                  >
                    1H
                  </Button>
                  <Button 
                    variant={chartInterval === "240" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setChartInterval("240")}
                  >
                    4H
                  </Button>
                  <Button 
                    variant={chartInterval === "D" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setChartInterval("D")}
                  >
                    1D
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="h-[400px] md:h-[500px] bg-background rounded-lg overflow-hidden">
                <iframe
                  key={`${selectedPair.pair}-${chartInterval}`}
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=BINANCE:${selectedPair.pair.replace('/', '')}&interval=${chartInterval}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget_new&utm_campaign=chart&utm_term=BINANCE:${selectedPair.pair.replace('/', '')}`}
                  className="w-full h-full"
                  title="TradingView Chart"
                ></iframe>
              </div>
            </div>

            {/* Order Book and Recent Trades */}
            <div className="w-full md:w-96">
              <Tabs defaultValue="orderbook" className="h-full">
                <TabsList className="w-full grid grid-cols-2 rounded-none">
                  <TabsTrigger value="orderbook">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Order Book
                  </TabsTrigger>
                  <TabsTrigger value="trades">
                    <Clock className="h-4 w-4 mr-2" />
                    Recent Trades
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="orderbook" className="mt-0 h-full">
                  <div className="p-2">
                    <div className="grid grid-cols-3 text-xs text-muted-foreground mb-2 px-2">
                      <div>Price(USDT)</div>
                      <div className="text-right">Amount(BTC)</div>
                      <div className="text-right">Total</div>
                    </div>

                    {/* Asks */}
                    <div className="space-y-1 mb-4">
                      {orderBook.asks.reverse().map((ask, i) => (
                        <div key={i} className="grid grid-cols-3 text-sm px-2 py-1 hover:bg-red-500/10 cursor-pointer relative">
                          <div className="absolute inset-0 bg-red-500/10" style={{ width: `${(ask.amount / 2.5) * 100}%` }}></div>
                          <div className="text-red-600 relative z-10">{ask.price.toLocaleString()}</div>
                          <div className="text-right relative z-10">{ask.amount.toFixed(3)}</div>
                          <div className="text-right text-muted-foreground relative z-10">{ask.total.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>

                    {/* Current Price */}
                    <div className="text-center py-2 my-2 bg-muted/50 rounded">
                      <span className={`text-lg font-bold ${selectedPair.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedPair.price.toLocaleString()}
                      </span>
                    </div>

                    {/* Bids */}
                    <div className="space-y-1">
                      {orderBook.bids.map((bid, i) => (
                        <div key={i} className="grid grid-cols-3 text-sm px-2 py-1 hover:bg-green-500/10 cursor-pointer relative">
                          <div className="absolute inset-0 bg-green-500/10" style={{ width: `${(bid.amount / 2.5) * 100}%` }}></div>
                          <div className="text-green-600 relative z-10">{bid.price.toLocaleString()}</div>
                          <div className="text-right relative z-10">{bid.amount.toFixed(3)}</div>
                          <div className="text-right text-muted-foreground relative z-10">{bid.total.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trades" className="mt-0">
                  <div className="p-2">
                    <div className="grid grid-cols-3 text-xs text-muted-foreground mb-2 px-2">
                      <div>Price(USDT)</div>
                      <div className="text-right">Amount(BTC)</div>
                      <div className="text-right">Time</div>
                    </div>
                    <div className="space-y-1">
                      {recentTrades.map((trade, i) => (
                        <div key={i} className="grid grid-cols-3 text-sm px-2 py-1 hover:bg-muted/50">
                          <div className={trade.type === "buy" ? "text-green-600" : "text-red-600"}>
                            {trade.price.toLocaleString()}
                          </div>
                          <div className="text-right">{trade.amount.toFixed(4)}</div>
                          <div className="text-right text-muted-foreground text-xs">{trade.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="border-t border-border">
            <Tabs defaultValue="buy" className="w-full">
              <div className="flex items-center justify-between px-4 pt-4">
                <TabsList>
                  <TabsTrigger value="buy" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                    Buy
                  </TabsTrigger>
                  <TabsTrigger value="sell" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    Sell
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <Button
                    variant={orderType === "limit" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOrderType("limit")}
                  >
                    Limit
                  </Button>
                  <Button
                    variant={orderType === "market" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOrderType("market")}
                  >
                    Market
                  </Button>
                </div>
              </div>

              <TabsContent value="buy" className="mt-0 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <span className="text-sm font-medium">
                          {quoteWallet ? quoteWallet.balance.toFixed(2) : '0.00'} USDT
                        </span>
                      </div>

                      {orderType === "limit" && (
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Price</label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={buyPrice}
                              onChange={(e) => setBuyPrice(e.target.value)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              USDT
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Amount</label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={buyAmount}
                            onChange={(e) => setBuyAmount(e.target.value)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            BTC
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                        <Slider
                          value={buyPercentage}
                          onValueChange={setBuyPercentage}
                          max={100}
                          step={25}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Fee (0.16%)</span>
                          <span className="text-sm font-medium">{buyFee.toFixed(2)} USDT</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="text-sm font-medium">
                            {buyAmount && buyPrice ? 
                              (parseFloat(buyAmount) * (orderType === 'limit' ? parseFloat(buyPrice) : selectedPair.price) + buyFee).toFixed(2) 
                              : '0.00'} USDT
                          </span>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700" 
                        size="lg"
                        onClick={handleBuy}
                        disabled={isExecuting || !buyAmount || parseFloat(buyAmount) <= 0}
                      >
                        {isExecuting ? 'Executing...' : `Buy ${baseCrypto}`}
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Account Balance</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">USDT</span>
                            <span className="text-sm font-medium">
                              {quoteWallet ? quoteWallet.balance.toFixed(2) : '0.00'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{baseCrypto}</span>
                            <span className="text-sm font-medium">
                              {baseWallet ? baseWallet.balance.toFixed(8) : '0.00'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sell" className="mt-0 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <span className="text-sm font-medium">
                          {baseWallet ? baseWallet.balance.toFixed(8) : '0.00'} {baseCrypto}
                        </span>
                      </div>

                      {orderType === "limit" && (
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Price</label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={sellPrice}
                              onChange={(e) => setSellPrice(e.target.value)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              USDT
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Amount</label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={sellAmount}
                            onChange={(e) => setSellAmount(e.target.value)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            BTC
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                        <Slider
                          value={sellPercentage}
                          onValueChange={setSellPercentage}
                          max={100}
                          step={25}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Fee (0.16%)</span>
                          <span className="text-sm font-medium">{sellFee.toFixed(2)} USDT</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="text-sm font-medium">
                            {sellAmount && sellPrice ? 
                              (parseFloat(sellAmount) * (orderType === 'limit' ? parseFloat(sellPrice) : selectedPair.price) - sellFee).toFixed(2) 
                              : '0.00'} USDT
                          </span>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700" 
                        size="lg"
                        onClick={handleSell}
                        disabled={isExecuting || !sellAmount || parseFloat(sellAmount) <= 0}
                      >
                        {isExecuting ? 'Executing...' : `Sell ${baseCrypto}`}
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Account Balance</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">BTC</span>
                            <span className="text-sm font-medium">0.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">USDT</span>
                            <span className="text-sm font-medium">0.00</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
