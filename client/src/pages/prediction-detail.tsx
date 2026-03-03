import { useMarketDetail, useOrderbook, PolymarketMarket, useMarkets } from "@/hooks/use-polymarket";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, Calendar, Link2, Bookmark, Share2, Search, TrendingUp, Info, Star } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";


const FIXED_CATEGORIES = [
  "Trending", "Breaking", "New", "Politics", "Sports", 
  "Crypto", "Iran", "Finance", "Geopolitics", "Tech", 
  "Culture", "Economy"
];

const QUICK_AMOUNTS = [1, 5, 10, 100];

export default function PredictionDetailPage() {
  const [, params] = useRoute("/prediction/:id");
  const [, setLocation] = useLocation();
  const { data: market, isLoading: marketLoading } = useMarketDetail(params?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Trending");
  
  const outcomes = useMemo(() => {
    try {
      const names = JSON.parse(market?.outcomes || "[]");
      const prices = JSON.parse(market?.outcomePrices || "[]");
      const clobTokenIds = JSON.parse(market?.clobTokenIds || "[]");
      return names.map((name: string, i: number) => ({
        name,
        price: parseFloat(prices[i] || "0.5"),
        tokenId: clobTokenIds[i]
      }));
    } catch {
      return [];
    }
  }, [market]);

  const isBinary = outcomes.length === 2 &&
    ['yes', 'no'].includes(outcomes[0]?.name.toLowerCase()) &&
    ['yes', 'no'].includes(outcomes[1]?.name.toLowerCase());

  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState(0);
  const [amount, setAmount] = useState('');
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [orderbookOpen, setOrderbookOpen] = useState(true);
  const [rulesTab, setRulesTab] = useState<'rules' | 'context'>('rules');

  const selectedOutcome = outcomes[selectedOutcomeIdx];
  const { data: orderbook, isLoading: orderbookLoading } = useOrderbook(selectedOutcome?.tokenId);

  const isLoading = marketLoading || (orderbookLoading && !orderbook);

  const endDate = market?.endDate ? format(new Date(market.endDate), 'MMM d, yyyy') : null;

  const yesPrice = outcomes[0]?.price ?? 0.5;
  const noPrice = outcomes[1]?.price ?? 0.5;
  const yesCents = Math.round(yesPrice * 100);
  const noCents = Math.round(noPrice * 100);
  const selectedPrice = selectedOutcome?.price ?? 0.5;
  const selectedCents = Math.round(selectedPrice * 100);

  const amountNum = Number(amount) || 0;
  const estimatedShares = selectedCents > 0 ? amountNum / (selectedCents / 100) : 0;
  const potentialReturn = estimatedShares > 0 ? (estimatedShares - amountNum).toFixed(2) : '0.00';

  const chartData = useMemo(() => {
    if (!orderbook?.history?.length) {
      const currentPrice = selectedCents;
      return Array.from({ length: 50 }, (_, i) => ({
        name: i,
        value: Math.max(0, Math.min(100, currentPrice + (Math.random() - 0.5) * 5))
      }));
    }
    return orderbook.history.map((h: any, i: number) => ({
      name: i,
      value: h.price * 100
    }));
  }, [orderbook, selectedCents]);

  const handleTrade = async () => {
    if (amountNum <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Sign up to start trading!" });
  };

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
            <div className="flex items-start gap-4">
              {market.image && (
                <img
                  src={market.image}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                {market.tags?.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted-foreground">
                    {market.tags.map((tag, i) => (
                      <span key={tag}>
                        {i > 0 && <span className="mx-1">·</span>}
                        <span className="hover:underline cursor-pointer">{tag}</span>
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="text-xl md:text-2xl font-bold font-display leading-tight">
                  {market.question}
                </h1>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                  <Link2 className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Price Chart */}
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="p-6">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold font-display text-blue-600">{selectedCents}%</span>
                  <span className="text-sm text-muted-foreground">chance</span>
                </div>

                <div className="h-[300px] w-full relative mb-4">
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      ${market.volumeNum ? market.volumeNum.toLocaleString() : "0"} Vol.
                    </span>
                    {endDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {endDate}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {['1H', '6H', '1D', '1W', '1M', 'ALL'].map((t) => (
                      <button
                        key={t}
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded transition-colors",
                          t === 'ALL'
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Book (collapsible) */}
            <Collapsible open={orderbookOpen} onOpenChange={setOrderbookOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between rounded-xl border bg-card p-4 hover:bg-secondary/30 transition-colors">
                  <span className="font-semibold text-sm">Order Book</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      orderbookOpen && "rotate-180"
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border border-t-0 rounded-b-xl bg-card p-4">
                  {orderbook ? (
                    <div className="grid grid-cols-2 gap-6 text-xs">
                      <div>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Bids</p>
                        {(orderbook.bids || []).slice(0, 8).map((bid: any, i: number) => (
                          <div key={i} className="flex justify-between py-0.5">
                            <span>{(Number(bid.price) * 100).toFixed(1)}¢</span>
                            <span className="text-muted-foreground">{Number(bid.size).toLocaleString()}</span>
                          </div>
                        ))}
                        {(!orderbook.bids || orderbook.bids.length === 0) && (
                          <p className="text-muted-foreground">No bids</p>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-rose-500 dark:text-rose-400 mb-2">Asks</p>
                        {(orderbook.asks || []).slice(0, 8).map((ask: any, i: number) => (
                          <div key={i} className="flex justify-between py-0.5">
                            <span>{(Number(ask.price) * 100).toFixed(1)}¢</span>
                            <span className="text-muted-foreground">{Number(ask.size).toLocaleString()}</span>
                          </div>
                        ))}
                        {(!orderbook.asks || orderbook.asks.length === 0) && (
                          <p className="text-muted-foreground">No asks</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Loading orderbook…</p>
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
                    "px-5 py-3 text-sm font-semibold transition-colors",
                    rulesTab === 'rules'
                      ? "text-foreground border-b-2 border-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Rules
                </button>
                <button
                  onClick={() => setRulesTab('context')}
                  className={cn(
                    "px-5 py-3 text-sm font-semibold transition-colors",
                    rulesTab === 'context'
                      ? "text-foreground border-b-2 border-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Market Context
                </button>
              </div>
              <div className="p-5">
                {rulesTab === 'rules' ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {market.description || 'No rules specified for this market.'}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This market tracks the probability of the stated outcome. Trade based on your own research and judgment.
                  </p>
                )}
              </div>
            </div>

            {/* All Outcomes (for multi-outcome markets) */}
            {!isBinary && outcomes.length > 2 && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3">All Outcomes</h3>
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
                          "w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                          isSelected
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/40"
                        )}
                      >
                        <span className="font-medium text-sm">{o.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-bold text-sm w-10 text-right">{pct}%</span>
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
                <div className="flex border-b">
                  <button
                    onClick={() => setTradeTab('buy')}
                    className={cn(
                      "flex-1 pb-2.5 text-sm font-semibold transition-colors text-center",
                      tradeTab === 'buy'
                        ? "text-foreground border-b-2 border-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTradeTab('sell')}
                    className={cn(
                      "flex-1 pb-2.5 text-sm font-semibold transition-colors text-center",
                      tradeTab === 'sell'
                        ? "text-foreground border-b-2 border-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Sell
                  </button>
                  <div className="ml-auto pb-2.5">
                    <Badge variant="outline" className="text-xs">Market</Badge>
                  </div>
                </div>

                {/* Outcome selector */}
                {isBinary ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedOutcomeIdx(0)}
                      className={cn(
                        "py-4 rounded-xl font-bold text-lg transition-all flex flex-col items-center justify-center gap-1",
                        selectedOutcomeIdx === 0
                          ? "bg-[#00C076] text-white shadow-md"
                          : "bg-[#EBEBEB] dark:bg-[#2B2E33] text-[#757575] hover:bg-[#E0E0E0]"
                      )}
                    >
                      <span>Yes {yesCents}¢</span>
                    </button>
                    <button
                      onClick={() => setSelectedOutcomeIdx(1)}
                      className={cn(
                        "py-4 rounded-xl font-bold text-lg transition-all flex flex-col items-center justify-center gap-1",
                        selectedOutcomeIdx === 1
                          ? "bg-[#FF3B30] text-white shadow-md"
                          : "bg-[#EBEBEB] dark:bg-[#2B2E33] text-[#757575] hover:bg-[#E0E0E0]"
                      )}
                    >
                      <span>No {noCents}¢</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-1.5" style={{ gridTemplateColumns: outcomes.length <= 3 ? `repeat(${outcomes.length}, 1fr)` : 'repeat(2, 1fr)' }}>
                    {outcomes.map((o, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedOutcomeIdx(i)}
                        className={cn(
                          "py-3 px-2 rounded-xl border text-sm font-bold transition-all truncate flex flex-col items-center gap-0.5",
                          i === selectedOutcomeIdx
                            ? "border-primary bg-primary text-white shadow-md"
                            : "border-border bg-[#EBEBEB] dark:bg-[#2B2E33] text-[#757575] hover:bg-[#E0E0E0]"
                        )}
                      >
                        <span className="truncate w-full text-center">{o.name}</span>
                        <span className="text-xs opacity-80">{Math.round(o.price * 100)}¢</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Amount */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-muted-foreground">
                      Amount
                    </label>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl font-bold text-[#757575]">$</span>
                    <Input
                      type="number"
                      min={0}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="pl-12 h-20 text-5xl font-bold bg-white dark:bg-[#12161C] border-2 border-[#EBEBEB] focus-visible:ring-0 focus-visible:border-primary/30 rounded-xl text-right pr-6"
                    />
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {QUICK_AMOUNTS.map(amt => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(String((Number(amount) || 0) + amt))}
                        className="h-12 text-sm font-bold bg-white dark:bg-[#12161C] border-[#EBEBEB] hover:bg-secondary transition-all rounded-xl"
                      >
                        +${amt}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount('1000')}
                      className="h-12 text-sm font-bold bg-white dark:bg-[#12161C] border-[#EBEBEB] hover:bg-secondary transition-all rounded-xl"
                    >
                      Max
                    </Button>
                  </div>
                </div>

                {/* Trade button */}
                <Button 
                  onClick={handleTrade}
                  className={cn(
                    "w-full h-20 text-2xl font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] bg-[#9B9B9B] hover:bg-[#8A8A8A] text-white"
                  )}
                >
                  {tradeTab === 'buy' ? 'Buy' : 'Sell'} {selectedOutcome?.name || 'Yes'}
                </Button>

                <p className="text-center text-sm text-[#757575] font-medium">
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
