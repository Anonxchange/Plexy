import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  BookOpen, 
  Search, 
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  History,
  Info,
  Settings2,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet-manager";
import { asterdexService } from "@/lib/asterdex-service";

// Mock trading pairs for selection
const tradingPairs = [
  { pair: "BTC/USDT", symbol: "BTC", price: 64250.50, change: 2.45, high: 65100.00, low: 63800.00, volume: "1.2B", favorite: true, leverage: "10x" },
  { pair: "ETH/USDT", symbol: "ETH", price: 3450.75, change: -1.20, high: 3520.00, low: 3410.00, volume: "850M", favorite: true, leverage: "5x" },
  { pair: "SOL/USDT", symbol: "SOL", price: 145.20, change: 5.60, high: 148.50, low: 138.20, volume: "420M", favorite: false, leverage: "10x" },
  { pair: "BNB/USDT", symbol: "BNB", price: 580.40, change: 0.85, high: 592.00, low: 575.00, volume: "210M", favorite: false, leverage: "5x" },
  { pair: "XRP/USDT", symbol: "XRP", price: 0.62, change: -0.45, high: 0.64, low: 0.61, volume: "150M", favorite: false },
];

export default function SpotTrading() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [orderType, setOrderType] = useState<"limit" | "market">("market");
  const [buyAmount, setBuyAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [buyPercentage, setBuyPercentage] = useState([0]);
  const [sellPercentage, setSellPercentage] = useState([0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");
  const [sessionPassword, setSessionPassword] = useState<string | null>(null);
  const [pendingTrade, setPendingTrade] = useState<{ type: "buy" | "sell" } | null>(null);
  const [chartInterval, setChartInterval] = useState("60");
  const [liveOrderBook, setLiveOrderBook] = useState<{ bids: any[], asks: any[] }>({ bids: [], asks: [] });
  const [showMarketList, setShowMarketList] = useState(false);
  const [searchPair, setSearchPair] = useState("");
  const [activeMarketTab, setActiveMarketTab] = useState("hot");
  const [isDesktop, setIsDesktop] = useState(true);
  const [isTPEnabled, setIsTPEnabled] = useState(false);
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [isPostOnlyEnabled, setIsPostOnlyEnabled] = useState(false);
  const [gtcType, setGtcType] = useState("GTC");
  const [tradeQuote, setTradeQuote] = useState<any>(null);

  // Mock wallet data
  const userWallets = [{ id: 1, balance: 10000, type: 'USDT' }];
  const quoteWallet = userWallets.find(w => w.type === 'USDT');
  const baseWallet = userWallets.find(w => w.type === selectedPair.symbol);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch live order book data via Binance WebSocket
  useEffect(() => {
    const symbol = selectedPair.symbol.toLowerCase() + "usdt";
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@depth20@100ms`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLiveOrderBook({
        bids: data.bids || [],
        asks: data.asks || []
      });
    };

    return () => ws.close();
  }, [selectedPair]);

  const filteredPairs = tradingPairs.filter(p => 
    p.pair.toLowerCase().includes(searchPair.toLowerCase())
  );

  const SlippageSelector = () => (
    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2 px-1">
      <div className="flex items-center gap-1">
        <span>Slippage</span>
        <Info className="w-2.5 h-2.5" />
      </div>
      <div className="flex gap-1.5">
        {["0.1%", "0.5%", "1.0%"].map((s) => (
          <button key={s} className="hover:text-primary transition-colors">{s}</button>
        ))}
        <Settings2 className="w-2.5 h-2.5 ml-0.5 cursor-pointer hover:text-primary" />
      </div>
    </div>
  );

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

    if (sessionPassword) {
      await executeTrade("buy", sessionPassword);
    } else {
      setPendingTrade({ type: "buy" });
      setShowPasswordDialog(true);
    }
  };

  const executeTrade = async (type: "buy" | "sell", password: string) => {
    if (!user) return;
    setIsExecuting(true);
    try {
      const amountStr = type === "buy" ? buyAmount : sellAmount;
      const amountValue = parseFloat(amountStr);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Invalid trade amount. Please enter a positive number.");
      }

      toast({
        title: "Order Executed",
        description: `Your ${type} order for ${amountValue} ${selectedPair.symbol} has been successfully submitted.`,
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
        description: error.message || "Failed to execute trade",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
      setShowPasswordDialog(false);
      setWalletPassword("");
      setPendingTrade(null);
    }
  };

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

    if (sessionPassword) {
      await executeTrade("sell", sessionPassword);
    } else {
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
            </div>
          </div>
        </div>

        <div className="p-4">
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
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{pair.volume} USDT</div>
                </div>
                <div className="col-span-3 text-right">
                  <div className="font-semibold">{pair.price.toLocaleString()}</div>
                </div>
                <div className="col-span-3 text-right">
                  <Badge variant={pair.change >= 0 ? "default" : "destructive"}>
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
              <Badge variant={selectedPair.change >= 0 ? "default" : "destructive"}>
                {selectedPair.change >= 0 ? '+' : ''}{selectedPair.change}%
              </Badge>
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

          <div className="flex flex-col lg:flex-row gap-0 overflow-hidden lg:h-[calc(100vh-180px)]">
            {/* Chart Area */}
            <div className="p-2 md:p-4 border-b lg:border-b-0 lg:border-r border-border flex flex-col w-full lg:flex-[3] h-[400px] lg:h-full">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <div className="flex items-center gap-1">
                  {["1", "5", "15", "60", "D"].map(interval => (
                    <Button 
                      key={interval}
                      variant={chartInterval === interval ? "default" : "outline"} 
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setChartInterval(interval)}
                    >
                      {interval === "60" ? "1H" : interval === "D" ? "1D" : interval + "m"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-background rounded-lg overflow-hidden relative">
                <iframe
                  key={`${selectedPair.pair}-${chartInterval}`}
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=BINANCE:${encodeURIComponent(selectedPair.pair.replace('/', ''))}&interval=${encodeURIComponent(chartInterval)}&theme=dark&style=1&timezone=Etc%2FUTC&locale=en`}
                  className="absolute inset-0 w-full h-full"
                  title="TradingView Chart"
                ></iframe>
              </div>
            </div>

            {/* Sidebar with Order Book and Sticky Trade Panel */}
            <div className="w-full lg:w-[600px] lg:flex-[2] flex flex-row border-t lg:border-t-0 h-auto lg:h-full overflow-hidden">
              {/* Column 1: Order Book */}
              <div className="flex-[1.2] border-r border-border flex flex-col overflow-hidden h-full">
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
                    {(liveOrderBook.asks || []).slice(0, 10).reverse().map((ask, i) => (
                      <div key={i} className="grid grid-cols-2 text-[10px] px-1 py-0.5 hover:bg-red-500/10 cursor-pointer">
                        <div className="text-red-500">{parseFloat(ask[0]).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="text-right">{parseFloat(ask[1]).toFixed(3)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center py-1 my-1 bg-muted/30 rounded border-y border-border/50">
                    <span className={`text-xs font-bold ${selectedPair.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedPair.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Bids */}
                  <div className="space-y-0.5">
                    {(liveOrderBook.bids || []).slice(0, 10).map((bid, i) => (
                      <div key={i} className="grid grid-cols-2 text-[10px] px-1 py-0.5 hover:bg-green-500/10 cursor-pointer">
                        <div className="text-green-500">{parseFloat(bid[0]).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="text-right">{parseFloat(bid[1]).toFixed(3)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Sticky Trade Panel */}
              <div className="flex-[1.2] flex flex-col h-full relative border-l border-border min-h-0">
                <Tabs defaultValue="buy" className="flex-1 flex flex-col min-h-0">
                  <TabsList className="w-full grid grid-cols-2 rounded-none h-9 border-b border-border bg-transparent shrink-0">
                    <TabsTrigger value="buy" className="text-xs data-[state=active]:text-green-500 data-[state=active]:bg-green-500/10 rounded-none border-b-2 border-transparent data-[state=active]:border-green-500">Buy</TabsTrigger>
                    <TabsTrigger value="sell" className="text-xs data-[state=active]:text-red-500 data-[state=active]:bg-red-500/10 rounded-none border-b-2 border-transparent data-[state=active]:border-red-500">Sell</TabsTrigger>
                  </TabsList>

                  <TabsContent value="buy" className="m-0 flex-1 flex flex-col min-h-0 relative">
                    <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-3 pb-16">
                      <Select defaultValue="market" onValueChange={(v) => setOrderType(v as any)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Order Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="limit">Limit</SelectItem>
                          <SelectItem value="market">Market</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                          <span>Price</span>
                          <span>USDT</span>
                        </div>
                        {orderType === "limit" ? (
                          <Input 
                            className="h-8 text-xs bg-muted/20" 
                            value={buyPrice}
                            onChange={(e) => setBuyPrice(e.target.value)}
                          />
                        ) : (
                          <div className="h-8 flex items-center px-3 rounded-md bg-muted/40 text-xs text-muted-foreground">
                            Market Price
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                          <span>Amount</span>
                          <span>USDT</span>
                        </div>
                        <Input 
                          className="h-8 text-xs bg-muted/20" 
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          placeholder="0.00"
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
                        <div className="flex justify-between text-[8px] text-muted-foreground">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-border/50">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Available</span>
                          <span className="font-medium">{quoteWallet?.balance.toFixed(2)} USDT</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/95 backdrop-blur-sm border-t border-border z-20">
                      <Button 
                        className="w-full h-10 text-xs bg-green-500 hover:bg-green-600 text-white font-bold uppercase"
                        onClick={handleBuy}
                        disabled={isExecuting}
                      >
                        {isExecuting ? "Processing..." : `Buy ${selectedPair.symbol}`}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="sell" className="m-0 flex-1 flex flex-col min-h-0 relative">
                    <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-3 pb-16">
                      <Select defaultValue="market" onValueChange={(v) => setOrderType(v as any)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Order Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="limit">Limit</SelectItem>
                          <SelectItem value="market">Market</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                          <span>Price</span>
                          <span>USDT</span>
                        </div>
                        {orderType === "limit" ? (
                          <Input 
                            className="h-8 text-xs bg-muted/20" 
                            value={sellPrice}
                            onChange={(e) => setSellPrice(e.target.value)}
                          />
                        ) : (
                          <div className="h-8 flex items-center px-3 rounded-md bg-muted/40 text-xs text-muted-foreground">
                            Market Price
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                          <span>Amount</span>
                          <span>{selectedPair.symbol}</span>
                        </div>
                        <Input 
                          className="h-8 text-xs bg-muted/20" 
                          value={sellAmount}
                          onChange={(e) => setSellAmount(e.target.value)}
                          placeholder="0.00"
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
                        <div className="flex justify-between text-[8px] text-muted-foreground">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-border/50">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Available</span>
                          <span className="font-medium">0.00 {selectedPair.symbol}</span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/95 backdrop-blur-sm border-t border-border z-20">
                      <Button 
                        className="w-full h-10 text-xs bg-red-500 hover:bg-red-600 text-white font-bold uppercase"
                        onClick={handleSell}
                        disabled={isExecuting}
                      >
                        {isExecuting ? "Processing..." : `Sell ${selectedPair.symbol}`}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-border p-4 bg-background">
            <Tabs defaultValue="orders">
              <TabsList className="bg-transparent h-auto p-0 gap-4 mb-4">
                <TabsTrigger value="orders" className="text-sm p-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Open Orders</TabsTrigger>
                <TabsTrigger value="assets" className="text-sm p-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Assets</TabsTrigger>
              </TabsList>
              <TabsContent value="orders">
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <p className="text-sm">No open orders found</p>
                </div>
              </TabsContent>
              <TabsContent value="assets">
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <p className="text-sm">No assets found</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Enter Wallet Password</h3>
                <Input
                  type="password"
                  placeholder="Wallet Password"
                  value={walletPassword}
                  onChange={(e) => setWalletPassword(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={() => {
                    setSessionPassword(walletPassword);
                    executeTrade(pendingTrade!.type, walletPassword);
                  }}>Confirm</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
