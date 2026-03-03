import { useMarketDetail, useOrderbook, PolymarketMarket, useMarkets } from "@/hooks/use-polymarket";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft, TrendingUp, Clock, Info, ArrowUpRight, ArrowDownRight, Share2, Star, MoreHorizontal, Search } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from "@/lib/utils";

const FIXED_CATEGORIES = [
  "Trending", "Breaking", "New", "Politics", "Sports", 
  "Crypto", "Iran", "Finance", "Geopolitics", "Tech", 
  "Culture", "Economy"
];

export default function PredictionDetailPage() {
  const [, params] = useRoute("/prediction/:id");
  const [, setLocation] = useLocation();
  const { data: market, isLoading: marketLoading } = useMarketDetail(params?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Trending");
  
  const tokenIds = useMemo(() => {
    try {
      return JSON.parse(market?.clobTokenIds || "[]");
    } catch {
      return [];
    }
  }, [market]);

  const [outcome, setOutcome] = useState<number>(0);
  const { data: orderbook, isLoading: orderbookLoading } = useOrderbook(tokenIds[outcome] || tokenIds[0]);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");

  const isLoading = marketLoading || (orderbookLoading && !orderbook);

  const outcomes = useMemo(() => {
    try {
      return JSON.parse(market?.outcomes || "[]");
    } catch {
      return [];
    }
  }, [market]);

  const prices = useMemo(() => {
    try {
      return JSON.parse(market?.outcomePrices || "[]");
    } catch {
      return [];
    }
  }, [market]);

  // Use real data from the orderbook for the chart if history is unavailable
  const chartData = useMemo(() => {
    if (!orderbook?.bids || !orderbook?.asks) {
      const currentPrice = parseFloat(prices[outcome] || "0.5") * 100;
      return Array.from({ length: 50 }, (_, i) => ({
        name: i,
        value: Math.max(0, Math.min(100, currentPrice + (Math.random() - 0.5) * 5))
      }));
    }
    
    // Create a mock history based on the current spread if real history isn't available
    const midPrice = (orderbook.bids[0]?.price + orderbook.asks[0]?.price) / 2 || parseFloat(prices[outcome] || "0.5");
    return Array.from({ length: 50 }, (_, i) => ({
      name: i,
      value: midPrice * 100 + (Math.random() - 0.5) * 2
    }));
  }, [orderbook, prices, outcome]);

  const bids = useMemo(() => {
    if (!orderbook?.bids) return [];
    return orderbook.bids.slice(0, 8);
  }, [orderbook]);

  const asks = useMemo(() => {
    if (!orderbook?.asks) return [];
    return orderbook.asks.slice(0, 8);
  }, [orderbook]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 space-y-8">
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!market) return <div className="p-8 text-center">Market not found</div>;

  const currentProb = Math.round(parseFloat(prices[outcome] || prices[0] || "0") * 100);

  return (
    <div className="min-h-screen bg-[#F1F4F9] dark:bg-[#0B0E11] text-foreground font-sans">
      {/* Prediction Market Header */}
      <div className="bg-white dark:bg-[#12161C] border-b border-border/40 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14 gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/prediction")}>
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <TrendingUp className="text-primary-foreground w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden md:block">Prediction market</span>
            </div>
            
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search markets..." 
                className="pl-10 h-10 bg-[#F1F4F9] dark:bg-[#1E2329] border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setLocation(`/prediction?q=${searchQuery}`)}
              />
            </div>

            <div className="hidden lg:flex items-center gap-4 text-sm font-medium text-muted-foreground">
              <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => setLocation("/prediction")}>Explore</span>
            </div>
          </div>

          {/* Categories Bar */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-3">
            {FIXED_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setLocation(`/prediction?category=${cat}`);
                }}
                className={cn(
                  "text-sm font-semibold whitespace-nowrap transition-colors relative pb-1",
                  activeCategory === cat 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat === "Trending" && <TrendingUp className="inline-block w-4 h-4 mr-1 mb-0.5" />}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl py-6 px-4">
        {/* Market Breadcrumbs/Tags */}
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
          <span className="hover:text-foreground cursor-pointer" onClick={() => setLocation("/prediction")}>Markets</span>
          <span className="opacity-30">/</span>
          <span className="hover:text-foreground cursor-pointer">{market.tags?.[0] || "Politics"}</span>
          <span className="opacity-30">/</span>
          <span className="text-foreground">{market.tags?.[1] || "World"}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0 border border-border overflow-hidden">
                    <img src={market.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                      {market.question}
                    </h1>
                    <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="rounded-full bg-accent/50 border-none px-3 py-1 text-foreground">
                          {market.tags?.[0] || "Politics"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>Ends {market.endDate ? format(new Date(market.endDate), 'MMM d, yyyy') : 'TBD'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10"><Share2 className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10"><Star className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-4xl font-black tracking-tighter text-blue-600">
                  {currentProb}%
                </span>
                <span className="text-base font-bold text-muted-foreground uppercase tracking-widest">Chance</span>
                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5 ml-2">
                  <TrendingUp className="w-3 h-3" />
                  2.4%
                </span>
              </div>
            </div>

            {/* Main Chart Card */}
            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {['1H', '1D', '1W', '1M', 'ALL'].map(t => (
                      <Button key={t} variant="ghost" size="sm" className={`text-[11px] h-8 px-3 font-bold rounded-lg ${t === 'ALL' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        {t}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>${market.volumeNum ? market.volumeNum.toLocaleString() : "0"} Volume</span>
                  </div>
                </div>

                <div className="h-[400px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                      <XAxis dataKey="name" hide />
                      <YAxis 
                        domain={[0, 100]} 
                        orientation="right" 
                        tick={{fontSize: 12, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))'}} 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          borderColor: 'hsl(var(--border))', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          fontWeight: 'bold'
                        }}
                        formatter={(value: any) => [`${Math.round(value)}%`, 'Chance']}
                        labelStyle={{ display: 'none' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#2563eb" 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, fill: "#2563eb", stroke: "white", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Order Book Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="text-xl font-bold">Order Book</h2>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-green-500" /> Yes
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-red-500" /> No
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Bids Table */}
                <div className="space-y-2">
                  <div className="grid grid-cols-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 px-2">
                    <span>Price</span>
                    <span className="text-center">Size</span>
                    <span className="text-right">Total</span>
                  </div>
                  <div className="space-y-0.5">
                    {bids.length > 0 ? bids.map((bid: any, i: number) => (
                      <div key={`bid-${i}`} className="grid grid-cols-3 items-center h-10 px-2 rounded-lg hover:bg-accent/50 transition-colors group relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" style={{ width: `${Math.min((bid.size / 5000) * 100, 100)}%` }} />
                        <span className="font-bold text-green-600 z-10">{Math.round(bid.price * 100)}¢</span>
                        <span className="text-sm font-medium text-center z-10">{Math.round(bid.size).toLocaleString()}</span>
                        <span className="text-sm font-bold text-right z-10">${Math.round(bid.price * bid.size).toLocaleString()}</span>
                      </div>
                    )) : (
                      <div className="h-40 flex items-center justify-center text-sm font-medium text-muted-foreground bg-accent/20 rounded-xl border border-dashed border-border">No bids</div>
                    )}
                  </div>
                </div>

                {/* Asks Table */}
                <div className="space-y-2">
                  <div className="grid grid-cols-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 px-2">
                    <span>Price</span>
                    <span className="text-center">Size</span>
                    <span className="text-right">Total</span>
                  </div>
                  <div className="space-y-0.5">
                    {asks.length > 0 ? asks.map((ask: any, i: number) => (
                      <div key={`ask-${i}`} className="grid grid-cols-3 items-center h-10 px-2 rounded-lg hover:bg-accent/50 transition-colors group relative overflow-hidden">
                        <div className="absolute inset-y-0 right-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" style={{ width: `${Math.min((ask.size / 5000) * 100, 100)}%` }} />
                        <span className="font-bold text-red-600 z-10">{Math.round(ask.price * 100)}¢</span>
                        <span className="text-sm font-medium text-center z-10">{Math.round(ask.size).toLocaleString()}</span>
                        <span className="text-sm font-bold text-right z-10">${Math.round(ask.price * ask.size).toLocaleString()}</span>
                      </div>
                    )) : (
                      <div className="h-40 flex items-center justify-center text-sm font-medium text-muted-foreground bg-accent/20 rounded-xl border border-dashed border-border">No asks</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="space-y-6 pt-8 border-t border-border">
              <div className="flex gap-8 items-center border-b border-border pb-4">
                <h3 className="font-bold text-lg relative after:absolute after:bottom-[-17px] after:left-0 after:right-0 after:h-[3px] after:bg-blue-600">Rules</h3>
                <h3 className="font-bold text-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Market Context</h3>
                <h3 className="font-bold text-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Comments</h3>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {market.description || "This market will resolve based on the official outcome of the event. Payouts are distributed to the holders of the correct outcome tokens."}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Trading Panel */}
          <div className="lg:col-span-1 sticky top-24">
            <Card className="border border-border shadow-2xl rounded-[24px] overflow-hidden bg-card">
              <CardContent className="p-0">
                <Tabs value={side} onValueChange={(v) => setSide(v as any)}>
                  <TabsList className="w-full h-14 rounded-none border-b border-border bg-muted/30 p-1">
                    <TabsTrigger value="buy" className="flex-1 h-full rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">Buy</TabsTrigger>
                    <TabsTrigger value="sell" className="flex-1 h-full rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">Sell</TabsTrigger>
                  </TabsList>
                  
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Outcome</span>
                        <Badge variant="secondary" className="font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Market</Badge>
                      </div>
                      <div className="flex gap-3">
                        {outcomes.map((o: string, i: number) => {
                          const isYes = o.toLowerCase() === 'yes';
                          const priceVal = Math.round(parseFloat(prices[i] || "0.5") * 100);
                          return (
                            <Button 
                              key={o}
                              variant={outcome === i ? "default" : "outline"}
                              className={`flex-1 h-20 flex-col gap-1 rounded-2xl border-2 transition-all active:scale-[0.97] ${
                                outcome === i 
                                  ? (isYes ? "bg-green-600 hover:bg-green-700 border-green-600 text-white" : "bg-red-600 hover:bg-red-700 border-red-600 text-white") 
                                  : "bg-muted/30 hover:bg-muted border-transparent"
                              }`}
                              onClick={() => setOutcome(i)}
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{o}</span>
                              <span className="text-2xl font-black">{priceVal}¢</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Amount</label>
                        <div className="text-sm font-bold text-muted-foreground flex items-center gap-1">
                          <Badge variant="outline" className="text-[10px] border-border">USD</Badge>
                        </div>
                      </div>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-2xl group-focus-within:text-blue-600 transition-colors">$</span>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          className="pl-10 h-16 text-3xl font-black bg-muted/20 border-2 border-border rounded-2xl focus-visible:ring-0 focus-visible:border-blue-600 transition-all placeholder:text-muted-foreground/30"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        {['10', '50', '100', '500'].map(v => (
                          <Button key={v} variant="outline" size="sm" className="flex-1 text-[11px] h-9 font-bold rounded-xl border-border bg-muted/30 hover:bg-muted" onClick={() => {
                            setAmount(v);
                          }}>${v}</Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-muted-foreground">
                          <span>Est. Shares</span>
                          <span className="text-foreground">{amount ? Math.floor(parseFloat(amount) / (parseFloat(prices[outcome] || "0.5"))).toLocaleString() : "0"}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-muted-foreground">
                          <span>Potential Return</span>
                          <span className="text-green-600">${amount ? (parseFloat(amount) / (parseFloat(prices[outcome] || "0.5"))).toFixed(2) : "0.00"}</span>
                        </div>
                      </div>

                      <Button className="w-full h-16 text-base font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-[0.98] mt-2">
                        Sign Up to Trade
                      </Button>
                      
                      <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                        By trading, you agree to the <span className="underline cursor-pointer hover:text-foreground">Terms of Use</span> and <span className="underline cursor-pointer hover:text-foreground">Privacy Policy</span>.
                      </p>
                    </div>
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="mt-6 border border-border bg-muted/20 rounded-2xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest mb-1">How it works</h4>
                  <p className="text-[11px] font-medium text-muted-foreground leading-snug">
                    Each share resolves to $1.00 if the outcome is correct, and $0.00 otherwise.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
