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
    const { data: market, isLoading } = useMarketDetail(params?.id);
    const [side, setSide] = useState<"buy" | "sell">("buy");
    const [outcome, setOutcome] = useState<number>(0);
    const [amount, setAmount] = useState("");

    const outcomes = useMemo(() => JSON.parse(market?.outcomes || "[]"), [market]);
    const prices = useMemo(() => JSON.parse(market?.outcomePrices || "[]"), [market]);

    // Mock graph data since the API doesn't provide history easily in this hook
    const chartData = useMemo(() => {
      return Array.from({ length: 20 }, (_, i) => ({
        name: i,
        value: 30 + Math.random() * 40
      }));
    }, []);

    if (isLoading) {
      return (
        <div className="container mx-auto py-8 px-4 space-y-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-[400px] w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      );
    }

    if (!market) return <div>Market not found</div>;

    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto py-4 px-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/prediction")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
               <img src={market.image} alt="" className="w-6 h-6 rounded-full" />
               <span className="text-sm font-medium text-muted-foreground">{market.tags?.[0]}</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                  {market.question}
                </h1>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Chance</span>
                    <span className="text-2xl font-black text-primary">
                      {Math.round(parseFloat(prices[0] || "0") * 100)}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="text-lg font-bold">
                      ${parseFloat(market.volumeNum?.toString() || "0").toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Ends</span>
                    <span className="text-lg font-bold">
                      {market.endDate ? format(new Date(market.endDate), 'MMM d, yyyy') : 'TBD'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <Card className="border-border/50 overflow-hidden bg-card/30">
                <CardContent className="p-0">
                  <div className="h-[350px] w-full pt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" hide />
                        <YAxis domain={[0, 100]} orientation="right" tick={{fontSize: 12}} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-2 p-4 border-t border-border/50">
                     {['1H', '6H', '1D', '1W', '1M', 'ALL'].map(t => (
                       <Button key={t} variant="ghost" size="sm" className="text-[10px] h-7 px-2 font-bold">{t}</Button>
                     ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Book Placeholder */}
              <Card className="border-border/50 bg-card/30">
                <CardHeader className="p-4 border-b border-border/50 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Order Book</CardTitle>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-2 text-[11px] font-bold uppercase tracking-tighter text-muted-foreground p-3 border-b border-border/50">
                    <div className="flex justify-between px-2"><span>Qty</span><span>Price</span></div>
                    <div className="flex justify-between px-2"><span>Price</span><span>Qty</span></div>
                  </div>
                  <div className="grid grid-cols-2 h-40 overflow-hidden">
                    <div className="border-r border-border/50 p-2 space-y-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between text-xs px-2 text-green-500 font-medium">
                          <span>{100 * (i+1)}</span>
                          <span>{Math.round(parseFloat(prices[0] || "0") * 100 - i)}¢</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 space-y-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between text-xs px-2 text-red-500 font-medium">
                          <span>{Math.round(parseFloat(prices[1] || "1") * 100 + i)}¢</span>
                          <span>{150 * (i+1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                 <h3 className="font-bold text-lg">Rules</h3>
                 <p className="text-sm text-muted-foreground leading-relaxed">
                   {market.description || "This market will resolve based on the official outcome of the event. Payouts are distributed to the holders of the correct outcome tokens."}
                 </p>
              </div>
            </div>

            {/* Sidebar Trade */}
            <div className="space-y-6">
              <Card className="border-border/50 shadow-lg sticky top-24">
                <CardContent className="p-0">
                  <Tabs value={side} onValueChange={(v) => setSide(v as any)}>
                    <TabsList className="w-full h-12 rounded-none border-b bg-muted/30">
                      <TabsTrigger value="buy" className="flex-1 h-full rounded-none font-bold uppercase tracking-widest text-xs">Buy</TabsTrigger>
                      <TabsTrigger value="sell" className="flex-1 h-full rounded-none font-bold uppercase tracking-widest text-xs">Sell</TabsTrigger>
                    </TabsList>
                    
                    <div className="p-6 space-y-6">
                      <div className="flex gap-2">
                        {outcomes.map((o: string, i: number) => {
                          const isYes = o.toLowerCase() === 'yes';
                          return (
                            <Button 
                              key={o}
                              variant={outcome === i ? "default" : "outline"}
                              className={`flex-1 h-14 flex-col gap-0 rounded-xl transition-all ${
                                outcome === i 
                                  ? (isYes ? "bg-[#1E8E3E] hover:bg-[#1E8E3E]/90" : "bg-[#D93025] hover:bg-[#D93025]/90") 
                                  : ""
                              }`}
                              onClick={() => setOutcome(i)}
                            >
                              <span className="text-[10px] font-bold uppercase opacity-80">{o}</span>
                              <span className="text-base font-black">{Math.round(parseFloat(prices[i] || "0") * 100)}¢</span>
                            </Button>
                          );
                        })}
                      </div>

                      <div className="space-y-2">
                         <div className="flex justify-between items-end">
                           <label className="text-xs font-bold uppercase text-muted-foreground">Amount</label>
                           <span className="text-2xl font-black">${amount || "0"}</span>
                         </div>
                         <div className="relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                           <Input 
                             type="number" 
                             placeholder="0" 
                             className="pl-8 h-12 text-lg font-bold bg-muted/20 border-border/50"
                             value={amount}
                             onChange={(e) => setAmount(e.target.value)}
                           />
                         </div>
                         <div className="flex gap-2">
                           {['+1', '+5', '+10', '+100', 'Max'].map(v => (
                             <Button key={v} variant="outline" size="sm" className="flex-1 text-[10px] h-8 font-bold" onClick={() => {
                               if(v === 'Max') setAmount("1000");
                               else setAmount((prev) => (parseFloat(prev || "0") + parseFloat(v.replace('+', ''))).toString());
                             }}>{v}</Button>
                           ))}
                         </div>
                      </div>

                      <Button className="w-full h-14 text-base font-black uppercase tracking-widest rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700">
                        Trade
                      </Button>
                      
                      <p className="text-[10px] text-center text-muted-foreground font-medium">
                        By trading, you agree to the <span className="underline cursor-pointer">Terms of Use</span>.
                      </p>
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
  
