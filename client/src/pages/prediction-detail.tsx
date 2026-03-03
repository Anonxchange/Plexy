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
      <div className="min-h-screen bg-[#0E1114] text-white">
        <div className="bg-[#0E1114] sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-white/10 rounded-full" 
              onClick={() => setLocation("/prediction")}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-white p-1 rounded-md">
                <img src="/favicon.svg" alt="Polymarket" className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">Polymarket</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="text-white/70"><Clock className="w-5 h-5" /></Button>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" />
          </div>
        </div>

        <div className="container mx-auto py-6 px-4">
          <div className="flex gap-6 overflow-x-auto no-scrollbar mb-8 border-b border-white/5 pb-2">
            {['Trending', 'Breaking', 'New', 'Politics', 'Sports', 'Crypto'].map((tab, i) => (
              <span key={tab} className={`text-sm font-bold whitespace-nowrap cursor-pointer ${i === 0 ? 'text-white border-b-2 border-white pb-2' : 'text-white/50'}`}>
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
                    <div className="w-12 h-12 rounded-xl bg-[#F7931A] flex items-center justify-center shrink-0">
                       <img src={market.image} alt="" className="w-8 h-8 rounded-full" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold leading-tight max-w-xl">
                        {market.question}
                      </h1>
                      <p className="text-white/40 text-sm mt-1">
                        {market.endDate ? format(new Date(market.endDate), 'MMM d, h:mm a') : 'TBD'} ET
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-white/70"><ArrowUpRight className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-white/70"><Info className="w-5 h-5" /></Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/40">Price to beat</p>
                    <p className="text-3xl font-bold tracking-tighter">
                      ${parseFloat(market.volumeNum?.toString() || "0").toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-bold">Live</span>
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="space-y-4">
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
                  <Button variant="ghost" size="sm" className="bg-white/10 rounded-lg h-8 px-3"><TrendingUp className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-white/40 h-8 px-3"><div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px] text-orange-500 font-bold">B</div></Button>
                  <Button variant="ghost" size="sm" className="text-white/40 h-8 px-3"><div className="flex gap-0.5"><div className="w-1 h-4 bg-white/40" /><div className="w-1 h-3 bg-white/40" /></div></Button>
                </div>

                <div className="flex gap-2 py-4">
                  {['Past', '8:30 AM', '8:35 AM', '8:40 AM'].map((t, i) => (
                    <Button key={t} variant="ghost" size="sm" className={`rounded-full h-10 px-5 text-sm font-bold ${i === 1 ? 'bg-white text-black hover:bg-white' : 'bg-white/5 text-white'}`}>
                      {i === 2 && <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />}
                      {t}
                      {i === 0 && <ChevronLeft className="w-4 h-4 rotate-270 ml-2" />}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Order Book */}
              <Card className="border-white/5 bg-transparent shadow-none overflow-hidden">
                <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold">Order Book</CardTitle>
                    <Info className="w-4 h-4 text-white/30" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/40 font-bold">${(parseFloat(market.volumeNum?.toString() || "0") / 1000).toFixed(1)}K Vol.</span>
                    <ChevronLeft className="w-5 h-5 rotate-90 text-white/70" />
                  </div>
                </CardHeader>
                <CardContent className="p-0 border-t border-white/5">
                  <div className="flex gap-8 py-6">
                    <span className="text-lg font-bold text-white underline underline-offset-8">Trade Up</span>
                    <span className="text-lg font-bold text-white/30">Trade Down</span>
                    <div className="ml-auto flex gap-4 text-orange-500">
                       <TrendingUp className="w-5 h-5" />
                       <div className="w-5 h-5 border-2 border-orange-500 rounded-md" />
                       <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4 px-2">
                    <div>Trade Up</div>
                    <div className="text-center">Price</div>
                    <div className="text-center">Shares</div>
                    <div className="text-right">Total</div>
                  </div>
                  
                  <div className="space-y-1">
                    {bids.length > 0 ? bids.map((bid: any, i: number) => (
                      <div key={i} className="grid grid-cols-4 items-center h-10 px-2 relative group cursor-pointer hover:bg-white/5 rounded-lg transition-colors">
                        <div className="absolute inset-0 bg-green-500/5 left-0" style={{ width: `${Math.min((bid.size / 5000) * 100, 100)}%` }} />
                        <div className="z-10 text-xs font-bold text-white/40">
                           <div className="w-5 h-5 border border-white/20 rounded-sm" />
                        </div>
                        <div className="z-10 text-sm font-bold text-green-500 text-center">{Math.round(bid.price * 100)}¢</div>
                        <div className="z-10 text-sm font-bold text-white/70 text-center">{Math.round(bid.size).toLocaleString()}</div>
                        <div className="z-10 text-sm font-bold text-white/70 text-right">${Math.round(bid.price * bid.size).toLocaleString()}</div>
                      </div>
                    )) : (
                      <div className="py-10 text-center text-white/20 font-bold">No active orders</div>
                    )}
                  </div>
                </CardContent>
              </Card>

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
  
