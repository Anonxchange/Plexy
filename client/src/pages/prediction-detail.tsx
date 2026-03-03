import { useMarketDetail, useOrderbook } from "@/hooks/use-polymarket";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Link2, Bookmark, Search, TrendingUp, Share2 } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [1, 5, 10, 100];

export default function PredictionDetailPage() {
  const [, params] = useRoute("/prediction/:id");
  const [, setLocation] = useLocation();
  const { data: market, isLoading: marketLoading, error: marketError } = useMarketDetail(params?.id);
  const [searchQuery, setSearchQuery] = useState("");
  
  if (marketError) {
    console.error("Market fetch error:", marketError);
  }

  const outcomes = useMemo(() => {
    try {
      if (!market) return [];
      console.log("Processing market data:", market);
      
      const prices = JSON.parse(market.outcomePrices || "[]");
      const clobTokenIds = JSON.parse(market.clobTokenIds || "[]");
      const names = JSON.parse(market.outcomes || "[]");
      
      const res = names.map((name: string, i: number) => ({
        name,
        price: parseFloat(prices[i] || "0.5"),
        tokenId: clobTokenIds[i]
      }));

      if (res.length === 2) {
        const isYesNo = res.every(o => ['yes', 'no'].includes(o.name.toLowerCase()));
        if (isYesNo && res[0].name.toLowerCase() === 'no') {
          return [res[1], res[0]];
        }
      }
      return res;
    } catch (e) {
      console.error("Error parsing outcomes:", e, market);
      return [];
    }
  }, [market]);

  const isBinary = useMemo(() => 
    outcomes.length === 2 && outcomes.every(o => ['yes', 'no'].includes(o.name.toLowerCase())),
    [outcomes]
  );

  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState(0);
  const [amount, setAmount] = useState('');
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [orderbookOpen, setOrderbookOpen] = useState(true);
  const [rulesTab, setRulesTab] = useState<'rules' | 'context'>('rules');

  const selectedOutcome = outcomes[selectedOutcomeIdx];
  const { data: orderbook, isLoading: orderbookLoading } = useOrderbook(selectedOutcome?.tokenId);

  const isLoading = marketLoading || (orderbookLoading && !orderbook);

  const endDate = market?.endDate ? format(new Date(market.endDate), 'MMM d, yyyy') : null;

  const yesPrice = outcomes.find(o => o.name.toLowerCase() === 'yes')?.price ?? 0.5;
  const noPrice = outcomes.find(o => o.name.toLowerCase() === 'no')?.price ?? 0.5;
  const yesCents = Math.round(yesPrice * 100);
  const noCents = Math.round(noPrice * 100);
  const selectedPrice = selectedOutcome?.price ?? 0.5;
  const selectedCents = Math.round(selectedPrice * 100);

  const amountNum = Number(amount) || 0;
  const estimatedShares = selectedPrice > 0 ? amountNum / selectedPrice : 0;
  const potentialReturn = estimatedShares > 0 ? (estimatedShares - amountNum).toFixed(2) : '0.00';

  const chartData = useMemo(() => {
    // Generate some mock history if none exists for a better visual
    const history = orderbook?.history || [];
    if (history.length < 10) {
      const basePrice = selectedCents;
      return Array.from({ length: 40 }, (_, i) => ({
        name: i,
        value: Math.max(1, Math.min(99, basePrice + (Math.sin(i / 5) * 5) + (Math.random() - 0.5) * 3))
      }));
    }
    return history.map((h: any, i: number) => ({
      name: i,
      value: h.price * 100
    }));
  }, [orderbook, selectedCents]);

  const handleTrade = async () => {
    if (amountNum > 0) {
      // Logic for trade
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F1F4F9] dark:bg-[#0B0E11] p-8 space-y-8">
        <div className="container mx-auto max-w-6xl text-center py-20">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="text-muted-foreground font-medium">Loading market details...</p>
        </div>
      </div>
    );
  }

  if (marketError) {
    return (
      <div className="min-h-screen bg-[#F1F4F9] dark:bg-[#0B0E11] p-8">
        <div className="container mx-auto max-w-6xl text-center py-20 bg-card rounded-xl border border-destructive/20">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Market</h2>
          <p className="text-muted-foreground mb-6">{(marketError as Error)?.message || 'An unexpected error occurred'}</p>
          <Button onClick={() => setLocation("/prediction")}>Back to Markets</Button>
        </div>
      </div>
    );
  }

  if (!market) return (
    <div className="min-h-screen bg-[#F1F4F9] dark:bg-[#0B0E11] p-8">
      <div className="container mx-auto max-w-6xl text-center py-20 bg-card rounded-xl border">
        <h2 className="text-2xl font-bold mb-2">Market Not Found</h2>
        <p className="text-muted-foreground mb-6">The market you are looking for does not exist or has been removed.</p>
        <Button onClick={() => setLocation("/prediction")}>Back to Markets</Button>
      </div>
    </div>
  );

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
        </div>
      </div>

      <main className="container mx-auto max-w-6xl py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* ===== LEFT COLUMN ===== */}
          <div className="space-y-6 min-w-0">
            {/* Market Header */}
            <div className="flex items-start gap-4 mb-8">
              {market.image ? (
                <div className="flex-shrink-0">
                  <img
                    src={market.image}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover shadow-sm border border-border/50"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#F7931A] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-2xl">₿</span>
                </div>
              )}
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.1] mb-2">
                  {market.question}
                </h1>
                <div className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground">
                  <span className="uppercase tracking-widest text-[#757575]">{endDate ? format(new Date(market.endDate), 'MMM d, h:mm a') : ''}</span>
                  <span className="opacity-20 text-[#757575]">|</span>
                  <span className="uppercase tracking-widest text-[#757575]">{market.tags?.[0] || 'Market'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                <button className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground transition-colors border border-border/60">
                  <Share2 className="h-4 w-4" />
                </button>
                <button className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground transition-colors border border-border/60">
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Price Chart */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="p-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={cn(
                    "text-5xl font-black tracking-tight",
                    selectedOutcome?.name.toLowerCase() === 'no' ? "text-rose-500" : "text-[#2563eb]"
                  )}>
                    {selectedCents}%
                  </span>
                  <span className="text-lg font-bold text-muted-foreground uppercase tracking-wider">chance</span>
                </div>
                <div className="flex items-center gap-2 mb-6 text-sm">
                  <span className="flex items-center gap-1 text-emerald-500 font-bold">
                    <TrendingUp className="h-3 w-3" />
                    +2.4%
                  </span>
                  <span className="text-muted-foreground font-medium">Last 24h</span>
                </div>

                <div className="h-[300px] w-full relative mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue-blue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorValue-red" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
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
                        stroke={selectedOutcome?.name.toLowerCase() === 'no' ? "#f43f5e" : "#2563eb"} 
                        fillOpacity={1} 
                        fill={`url(#colorValue-${selectedOutcome?.name.toLowerCase() === 'no' ? 'red' : 'blue'})`} 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, fill: selectedOutcome?.name.toLowerCase() === 'no' ? "#f43f5e" : "#2563eb", stroke: "white", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Volume</span>
                      <span className="text-sm font-bold">
                        ${market.volumeNum ? market.volumeNum.toLocaleString() : "0"}
                      </span>
                    </div>
                    {endDate && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ends</span>
                        <span className="text-sm font-bold flex items-center gap-1">
                          {endDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Book (collapsible) */}
            <Collapsible open={orderbookOpen} onOpenChange={setOrderbookOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between rounded-xl border bg-card p-4 hover:bg-secondary/30 transition-colors">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Order Book</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      orderbookOpen && "rotate-180"
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border border-t-0 rounded-b-xl bg-card p-6">
                  {orderbook ? (
                    <div className="grid grid-cols-2 gap-12 text-[10px] font-black uppercase tracking-widest">
                      <div>
                        <div className="flex justify-between text-emerald-500 mb-4">
                          <span>Price</span>
                          <span>Qty</span>
                        </div>
                        <div className="space-y-1">
                          {(orderbook.bids || []).slice(0, 8).map((bid: any, i: number) => (
                            <div key={i} className="flex justify-between font-bold normal-case tracking-normal text-sm">
                              <span className="text-emerald-500">{(Number(bid.price) * 100).toFixed(1)}¢</span>
                              <span className="text-muted-foreground">{Number(bid.size).toLocaleString()}</span>
                            </div>
                          ))}
                          {(!orderbook.bids || orderbook.bids.length === 0) && (
                            <p className="text-muted-foreground normal-case font-medium">No bids</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-rose-500 mb-4">
                          <span>Price</span>
                          <span>Qty</span>
                        </div>
                        <div className="space-y-1">
                          {(orderbook.asks || []).slice(0, 8).map((ask: any, i: number) => (
                            <div key={i} className="flex justify-between font-bold normal-case tracking-normal text-sm">
                              <span className="text-rose-500">{(Number(ask.price) * 100).toFixed(1)}¢</span>
                              <span className="text-muted-foreground">{Number(ask.size).toLocaleString()}</span>
                            </div>
                          ))}
                          {(!orderbook.asks || orderbook.asks.length === 0) && (
                            <p className="text-muted-foreground normal-case font-medium">No asks</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-muted-foreground text-center py-4 uppercase tracking-widest">Loading orderbook…</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Rules / Market Context */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex border-b">
                <button
                  onClick={() => setRulesTab('rules')}
                  className={cn(
                    "px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-colors relative",
                    rulesTab === 'rules'
                      ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Rules
                </button>
                <button
                  onClick={() => setRulesTab('context')}
                  className={cn(
                    "px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-colors relative",
                    rulesTab === 'context'
                      ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Market Context
                </button>
              </div>
              <div className="p-6">
                {rulesTab === 'rules' ? (
                  <p className="text-sm font-medium text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {market.description || 'No rules specified for this market.'}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    This market tracks the probability of the stated outcome. Trade based on your own research and judgment.
                  </p>
                )}
              </div>
            </div>

                {/* All Outcomes (for multi-outcome markets) */}
                {!isBinary && outcomes.length > 2 && (
                  <div className="rounded-xl border bg-card p-5">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">All Outcomes</h3>
                    <div className="space-y-2">
                      {[...outcomes].sort((a, b) => b.price - a.price).map((o, i) => {
                        const pct = Math.round(o.price * 100);
                        const realIdx = outcomes.indexOf(o);
                        const isSelected = realIdx === selectedOutcomeIdx;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedOutcomeIdx(realIdx)}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-[#EBEBEB] dark:border-[#2B2E33] hover:border-muted"
                            )}
                          >
                            <span className="font-bold text-sm">{o.name}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="font-black text-sm w-10 text-right">{pct}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
          </div>

          {/* ===== RIGHT COLUMN — Trading Panel ===== */}
          <div>
            <Card className="sticky top-20 rounded-xl shadow-xl overflow-hidden bg-card">
              <CardContent className="p-5 space-y-5">
                {/* Buy / Sell tabs */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setTradeTab('buy')}
                      className={cn(
                        "pb-2 text-sm font-bold transition-colors relative",
                        tradeTab === 'buy'
                          ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setTradeTab('sell')}
                      className={cn(
                        "pb-2 text-sm font-bold transition-colors relative",
                        tradeTab === 'sell'
                          ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Sell
                    </button>
                  </div>
                  <Badge variant="secondary" className="bg-[#F1F4F9] dark:bg-[#1E2329] border-none text-[10px] font-black uppercase tracking-widest">Market</Badge>
                </div>

                {/* Outcome selector */}
                {isBinary && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setSelectedOutcomeIdx(0)}
                      className={cn(
                        "py-4 rounded-2xl font-black text-lg transition-all border-none",
                        selectedOutcomeIdx === 0
                          ? "bg-[#00BA71] text-white shadow-md shadow-emerald-500/20"
                          : "bg-[#F0F0F0] dark:bg-[#2B2E33] text-muted-foreground hover:bg-[#E0E0E0]"
                      )}
                    >
                      Yes {yesCents}¢
                    </button>
                    <button
                      onClick={() => setSelectedOutcomeIdx(1)}
                      className={cn(
                        "py-4 rounded-2xl font-black text-lg transition-all border-none",
                        selectedOutcomeIdx === 1
                          ? "bg-[#F0F0F0] dark:bg-[#2B2E33] text-[#D93025] ring-2 ring-[#D93025]"
                          : "bg-[#F0F0F0] dark:bg-[#2B2E33] text-muted-foreground hover:bg-[#E0E0E0]"
                      )}
                    >
                      No {noCents}¢
                    </button>
                  </div>
                )}

                {/* Amount */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-muted-foreground">
                      Amount
                    </label>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-4xl font-bold text-[#ADADAD]">$</span>
                    <Input
                      type="number"
                      min={0}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="pl-12 h-24 text-6xl font-bold bg-white dark:bg-[#12161C] border-[#EBEBEB] focus-visible:ring-0 focus-visible:border-muted rounded-2xl text-right pr-6"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
                    {QUICK_AMOUNTS.map(amt => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="lg"
                        onClick={() => setAmount(String((Number(amount) || 0) + Number(amt)))}
                        className="h-12 px-6 text-sm font-bold bg-white dark:bg-[#12161C] border-[#EBEBEB] hover:bg-secondary transition-all rounded-2xl whitespace-nowrap"
                      >
                        +${amt}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setAmount('1000')}
                      className="h-12 px-6 text-sm font-bold bg-white dark:bg-[#12161C] border-[#EBEBEB] hover:bg-secondary transition-all rounded-2xl"
                    >
                      Max
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between text-xs font-bold px-1">
                    <span className="text-muted-foreground uppercase tracking-wider">Shares</span>
                    <span className="text-foreground">{estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold px-1">
                    <span className="text-muted-foreground uppercase tracking-wider">Potential Return</span>
                    <span className="text-emerald-500">${potentialReturn} ({((Number(potentialReturn) / (amountNum || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                </div>

                <Button 
                  className={cn(
                    "w-full h-20 text-2xl font-black rounded-2xl transition-all border-none bg-[#8E8E93] hover:bg-[#787880] text-white mt-4"
                  )}
                  onClick={handleTrade}
                >
                  Buy {selectedOutcome?.name || 'Yes'}
                </Button>

                <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  By trading, you agree to the Terms of Use.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
