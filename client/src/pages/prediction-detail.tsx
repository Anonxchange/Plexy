import { useMarketDetail, useOrderbook, PolymarketMarket } from "@/hooks/use-polymarket";
  import { useRoute, useLocation } from "wouter";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Badge } from "@/components/ui/badge";
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
  import { ChevronLeft, TrendingUp, Clock, Info, ArrowUpRight, ArrowDownRight } from "lucide-react";
  import { format } from "date-fns";
  import { useState, useMemo } from "react";
  import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

  export default function PredictionDetailPage() {
    const [, params] = useRoute("/prediction/:id");
    const [, setLocation] = useLocation();
    const { data: market, isLoading: marketLoading } = useMarketDetail(params?.id);
    
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

    const outcomes = useMemo(() => JSON.parse(market?.outcomes || "[]"), [market]);
    const prices = useMemo(() => JSON.parse(market?.outcomePrices || "[]"), [market]);

    const bids = useMemo(() => {
      if (!orderbook?.bids) return [];
      return orderbook.bids.slice(0, 8);
    }, [orderbook]);

    const asks = useMemo(() => {
      if (!orderbook?.asks) return [];
      return orderbook.asks.slice(0, 8);
    }, [orderbook]);

    // Mock graph data since the API doesn't provide history easily in this hook
    const chartData = useMemo(() => {
      return Array.from({ length: 20 }, (_, i) => ({
        name: i,
        value: 30 + Math.random() * 40
      }));
    }, []);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#0E1114] p-8 space-y-8">
          <Skeleton className="h-12 w-48 bg-white/5" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full bg-white/5" />
              <Skeleton className="h-[400px] w-full bg-white/5" />
            </div>
            <Skeleton className="h-[500px] w-full bg-white/5" />
          </div>
        </div>
      );
    }

    if (!market) return <div>Market not found</div>;

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="bg-background sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-accent rounded-full" 
              onClick={() => setLocation("/prediction")}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1 rounded-md">
                <img src="/favicon.svg" alt="Polymarket" className="w-6 h-6 invert dark:invert-0" />
              </div>
              <span className="text-xl font-bold tracking-tight">Polymarket</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="text-muted-foreground"><Clock className="w-5 h-5" /></Button>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" />
          </div>
        </div>

        <div className="container mx-auto py-6 px-4">
          <div className="flex gap-6 overflow-x-auto no-scrollbar mb-8 border-b border-border/50 pb-2">
            {['Trending', 'Breaking', 'New', 'Politics', 'Sports', 'Crypto'].map((tab, i) => (
              <span key={tab} className={`text-sm font-bold whitespace-nowrap cursor-pointer transition-colors ${i === 0 ? 'text-foreground border-b-2 border-primary pb-2' : 'text-muted-foreground hover:text-foreground'}`}>
                {tab}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0 border border-border">
                       <img src={market.image} alt="" className="w-8 h-8 rounded-full" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                         <span>{market.tags?.[0] || 'Market'}</span>
                         {market.tags?.[1] && <span>• {market.tags[1]}</span>}
                      </div>
                      <h1 className="text-2xl font-bold leading-tight max-w-xl">
                        {market.question}
                      </h1>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground"><ArrowUpRight className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground"><Info className="w-5 h-5" /></Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold tracking-tighter text-blue-500">
                      {Math.round(parseFloat(prices[0] || "0") * 100)}% chance
                      <span className="text-sm font-bold text-green-500 ml-2">▲ 20%</span>
                    </p>
                  </div>
                  <div className="text-muted-foreground text-xs font-bold flex items-center gap-1 uppercase tracking-widest">
                    <img src="/favicon.svg" alt="" className="w-4 h-4 opacity-20" />
                    Polymarket
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="space-y-4">
                <div className="h-[300px] w-full pt-6 relative border-t border-b border-border/30 border-dashed">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(59 130 246)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="rgb(59 130 246)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                      <XAxis dataKey="name" hide />
                      <YAxis domain={[0, 100]} orientation="right" tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="rgb(59 130 246)" 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={{ r: 4, fill: "rgb(59 130 246)", strokeWidth: 2, stroke: "white" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <span className="text-sm font-bold text-foreground">
                       ${parseFloat(market.volumeNum?.toString() || "0").toLocaleString()} Vol.
                     </span>
                     <span className="text-sm font-bold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {market.endDate ? format(new Date(market.endDate), 'MMM d, yyyy') : 'TBD'}
                     </span>
                   </div>
                   <div className="flex gap-1">
                      {['1H', '1D', '1W', '1M', 'MAX'].map(t => (
                        <Button key={t} variant="ghost" size="sm" className={`text-[10px] h-7 px-2 font-bold ${t === 'MAX' ? 'text-foreground underline' : 'text-muted-foreground'}`}>{t}</Button>
                      ))}
                   </div>
                </div>
              </div>

              {/* Order Book */}
              <Card className="border-border/50 bg-card/30 shadow-none overflow-hidden rounded-2xl">
                <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">Order Book</CardTitle>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <ChevronLeft className="w-5 h-5 rotate-90 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex gap-8 px-6 py-4 border-b border-border/50">
                    <span className="text-sm font-bold text-foreground border-b-2 border-foreground pb-4 -mb-4">Trade Yes</span>
                    <span className="text-sm font-bold text-muted-foreground">Trade No</span>
                    <div className="ml-auto flex gap-4 text-muted-foreground">
                       <Button variant="ghost" size="icon" className="h-5 w-5"><ArrowUpRight className="w-4 h-4" /></Button>
                       <Button variant="ghost" size="icon" className="h-5 w-5"><Clock className="w-4 h-4" /></Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4 mb-2 px-6">
                    <div>Order Type</div>
                    <div className="text-center">Price</div>
                    <div className="text-center">Shares</div>
                    <div className="text-right">Total</div>
                  </div>
                  
                  <div className="space-y-1 pb-4">
                    {asks && asks.length > 0 && asks.map((ask: any, i: number) => (
                      <div key={`ask-${i}`} className="grid grid-cols-4 items-center h-10 px-6 relative group cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="absolute inset-y-1 right-0 bg-red-500/5 z-0" style={{ width: `${Math.min((ask.size / 5000) * 100, 100)}%` }} />
                        <div className="z-10 text-[10px] font-bold text-red-500/50 uppercase">Ask</div>
                        <div className="z-10 text-sm font-bold text-red-500 text-center">{Math.round(ask.price * 100)}¢</div>
                        <div className="z-10 text-sm font-bold text-foreground/70 text-center">{Math.round(ask.size).toLocaleString()}</div>
                        <div className="z-10 text-sm font-bold text-foreground/70 text-right">${Math.round(ask.price * ask.size).toLocaleString()}</div>
                      </div>
                    ))}
                    {bids && bids.length > 0 && bids.map((bid: any, i: number) => (
                      <div key={`bid-${i}`} className="grid grid-cols-4 items-center h-10 px-6 relative group cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="absolute inset-y-1 right-0 bg-green-500/5 z-0" style={{ width: `${Math.min((bid.size / 5000) * 100, 100)}%` }} />
                        <div className="z-10 text-[10px] font-bold text-green-500/50 uppercase">Bid</div>
                        <div className="z-10 text-sm font-bold text-green-500 text-center">{Math.round(bid.price * 100)}¢</div>
                        <div className="z-10 text-sm font-bold text-foreground/70 text-center">{Math.round(bid.size).toLocaleString()}</div>
                        <div className="z-10 text-sm font-bold text-foreground/70 text-right">${Math.round(bid.price * bid.size).toLocaleString()}</div>
                      </div>
                    ))}
                    {(!bids || bids.length === 0) && (!asks || asks.length === 0) && (
                      <div className="py-10 text-center text-muted-foreground/50 font-bold">No active orders</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6 pt-4">
                 <div className="flex gap-6 border-b border-border/50 pb-2">
                    <h3 className="font-bold text-base border-b-2 border-foreground pb-2 -mb-2">Rules</h3>
                    <h3 className="font-bold text-base text-muted-foreground">Market Context</h3>
                 </div>
                 <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                   {market.description || "This market will resolve based on the official outcome of the event. Payouts are distributed to the holders of the correct outcome tokens."}
                 </p>
              </div>
            </div>

            {/* Sidebar Trade */}
            <div className="space-y-6">
              <Card className="border-border shadow-xl sticky top-24 rounded-2xl overflow-hidden bg-card">
                <CardContent className="p-0">
                  <Tabs value={side} onValueChange={(v) => setSide(v as any)}>
                    <TabsList className="w-full h-14 rounded-none border-b border-border/50 bg-transparent p-1">
                      <TabsTrigger value="buy" className="flex-1 h-full rounded-xl font-bold text-xs data-[state=active]:bg-accent">Buy</TabsTrigger>
                      <TabsTrigger value="sell" className="flex-1 h-full rounded-xl font-bold text-xs data-[state=active]:bg-accent">Sell</TabsTrigger>
                    </TabsList>
                    
                    <div className="p-6 space-y-6">
                      <div className="flex gap-2">
                        {outcomes.map((o: string, i: number) => {
                          const isYes = o.toLowerCase() === 'yes';
                          return (
                            <Button 
                              key={o}
                              variant={outcome === i ? "default" : "outline"}
                              className={`flex-1 h-16 flex-col gap-0 rounded-2xl border-border transition-all ${
                                outcome === i 
                                  ? (isYes ? "bg-green-600 hover:bg-green-700 border-transparent text-white" : "bg-red-600 hover:bg-red-700 border-transparent text-white") 
                                  : "bg-accent/50 hover:bg-accent"
                              }`}
                              onClick={() => setOutcome(i)}
                            >
                              <span className="text-[10px] font-bold uppercase opacity-60">{o} {Math.round(parseFloat(prices[i] || "0") * 100)}¢</span>
                            </Button>
                          );
                        })}
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between items-center">
                           <label className="text-sm font-bold text-foreground">Amount</label>
                           <span className="text-3xl font-bold text-muted-foreground/30">${amount || "0"}</span>
                         </div>
                         <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">$</span>
                           <Input 
                             type="number" 
                             placeholder="0" 
                             className="pl-10 h-14 text-xl font-bold bg-accent/30 border-border rounded-2xl focus-visible:ring-primary/20"
                             value={amount}
                             onChange={(e) => setAmount(e.target.value)}
                           />
                         </div>
                         <div className="flex gap-2">
                           {['+1', '+5', '+10', '+100', 'Max'].map(v => (
                             <Button key={v} variant="ghost" size="sm" className="flex-1 text-[10px] h-9 font-bold bg-accent rounded-xl hover:bg-accent/80" onClick={() => {
                               if(v === 'Max') setAmount("1000");
                               else setAmount((prev) => (parseFloat(prev || "0") + parseFloat(v.replace('+', ''))).toString());
                             }}>{v}</Button>
                           ))}
                         </div>
                      </div>

                      <Button className="w-full h-16 text-sm font-black uppercase tracking-[0.1em] rounded-2xl shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-[0.98]">
                        Trade
                      </Button>
                      
                      <p className="text-[11px] text-center text-muted-foreground font-medium">
                        By trading, you agree to the <span className="underline cursor-pointer">Terms of Use</span>.
                      </p>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
              
              <div className="space-y-4">
                 {['Iran', 'Geopolitics', 'Politics', 'Middle East'].map(tag => (
                    <div key={tag} className="flex items-center justify-between p-3 rounded-xl bg-accent/30 border border-border/50 cursor-pointer hover:bg-accent/50 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center">
                             <img src="/favicon.svg" alt="" className="w-4 h-4 opacity-50" />
                          </div>
                          <span className="text-sm font-bold text-foreground/80">{tag} related market</span>
                       </div>
                       <span className="text-sm font-black text-foreground">37%</span>
                    </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

              <div className="space-y-4">
                 <h3 className="font-bold text-lg">Rules</h3>
                 <p className="text-sm text-white/40 leading-relaxed">
                   {market.description || "This market will resolve based on the official outcome of the event. Payouts are distributed to the holders of the correct outcome tokens."}
                 </p>
              </div>
            </div>

            {/* Sidebar Trade */}
            <div className="space-y-6">
              <Card className="border-white/5 bg-[#1A1D21] shadow-2xl sticky top-24 rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <Tabs value={side} onValueChange={(v) => setSide(v as any)}>
                    <TabsList className="w-full h-14 rounded-none border-b border-white/5 bg-transparent p-1">
                      <TabsTrigger value="buy" className="flex-1 h-full rounded-xl font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-white/10">Buy</TabsTrigger>
                      <TabsTrigger value="sell" className="flex-1 h-full rounded-xl font-bold uppercase tracking-widest text-[10px] data-[state=active]:bg-white/10">Sell</TabsTrigger>
                    </TabsList>
                    
                    <div className="p-6 space-y-6">
                      <div className="flex gap-2">
                        {outcomes.map((o: string, i: number) => {
                          const isYes = o.toLowerCase() === 'yes';
                          return (
                            <Button 
                              key={o}
                              variant={outcome === i ? "default" : "outline"}
                              className={`flex-1 h-16 flex-col gap-0 rounded-2xl border-white/10 transition-all ${
                                outcome === i 
                                  ? (isYes ? "bg-[#00C853] hover:bg-[#00C853]/90 border-transparent" : "bg-[#FF5252] hover:bg-[#FF5252]/90 border-transparent") 
                                  : "bg-white/5 hover:bg-white/10"
                              }`}
                              onClick={() => setOutcome(i)}
                            >
                              <span className="text-[10px] font-bold uppercase opacity-60">{o}</span>
                              <span className="text-lg font-black">{Math.round(parseFloat(prices[i] || "0") * 100)}¢</span>
                            </Button>
                          );
                        })}
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between items-end">
                           <label className="text-[10px] font-bold uppercase text-white/40 tracking-widest">Amount</label>
                           <span className="text-2xl font-black">${amount || "0"}</span>
                         </div>
                         <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold text-lg">$</span>
                           <Input 
                             type="number" 
                             placeholder="0" 
                             className="pl-10 h-14 text-xl font-bold bg-white/5 border-white/10 rounded-2xl focus-visible:ring-white/20"
                             value={amount}
                             onChange={(e) => setAmount(e.target.value)}
                           />
                         </div>
                         <div className="flex gap-2">
                           {['+1', '+5', '+10', '+100', 'Max'].map(v => (
                             <Button key={v} variant="ghost" size="sm" className="flex-1 text-[10px] h-9 font-bold bg-white/5 rounded-xl hover:bg-white/10" onClick={() => {
                               if(v === 'Max') setAmount("1000");
                               else setAmount((prev) => (parseFloat(prev || "0") + parseFloat(v.replace('+', ''))).toString());
                             }}>{v}</Button>
                           ))}
                         </div>
                      </div>

                      <Button className="w-full h-16 text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.98]">
                        Trade
                      </Button>
                      
                      <div className="pt-2">
                        <div className="flex justify-between text-[11px] font-bold text-white/30 uppercase tracking-wider mb-2">
                          <span>Est. Shares</span>
                          <span className="text-white/70">0</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-white/30 uppercase tracking-wider">
                          <span>Potential Return</span>
                          <span className="text-[#00C853]">$0.00 (0%)</span>
                        </div>
                      </div>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
