import { useMarkets, PolymarketMarket } from "@/hooks/use-polymarket";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Clock, Search, ChevronRight, Share2, Bookmark } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function parseOutcomes(market: PolymarketMarket) {
  try {
    const outcomes = JSON.parse(market.outcomes || '["Yes","No"]');
    const prices = JSON.parse(market.outcomePrices || '[0.5,0.5]');
    const tokenIds = JSON.parse(market.clobTokenIds || '[]');
    return outcomes.map((name: string, i: number) => ({
      name,
      price: Number(prices[i] || 0),
      tokenId: tokenIds[i] || '',
    }));
  } catch {
    return [
      { name: 'Yes', price: 0.5, tokenId: '' },
      { name: 'No', price: 0.5, tokenId: '' },
    ];
  }
}

export function formatVolume(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

const FIXED_CATEGORIES = [
  "Trending", "Breaking", "New", "Politics", "Sports", 
  "Crypto", "Iran", "Finance", "Geopolitics", "Tech", 
  "Culture", "Economy"
];

export default function PredictionPage() {
    const [limit, setLimit] = useState(36);
    const [activeCategory, setActiveCategory] = useState("Trending");
  const { data: markets, isLoading } = useMarkets({ limit: 1000 });
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    
    return markets.filter(m => {
      const matchesSearch = m.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (activeCategory === "Trending") return matchesSearch;

      const matchesCategory = activeCategory === "All" || 
                             m.tags?.some(t => {
                               const tag = t.toLowerCase();
                               const category = activeCategory.toLowerCase();
                               return tag.includes(category) || category.includes(tag);
                             }) ||
                             m.question.toLowerCase().includes(activeCategory.toLowerCase());
      
      return matchesSearch && matchesCategory;
    });
  }, [markets, searchQuery, activeCategory]);

  const displayedMarkets = filteredMarkets?.slice(0, limit);

  return (
    <div className="min-h-screen bg-[#F1F4F9] dark:bg-[#0B0E11]">
      {/* Polymarket Style Header */}
      <div className="bg-white dark:bg-[#12161C] border-b border-border/40 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14 gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
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
              />
            </div>

            <div className="hidden lg:flex items-center gap-4 text-sm font-medium text-muted-foreground">
              <span className="hover:text-primary cursor-pointer transition-colors">How it works</span>
            </div>
          </div>

          {/* Categories Bar */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-3">
            {FIXED_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
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

      <div className="container mx-auto py-8 px-4">
        {/* Featured Market (Hero Style) */}
        {!isLoading && displayedMarkets && displayedMarkets.length > 0 && searchQuery === "" && activeCategory === "Trending" && (
          <div className="mb-8">
            <FeaturedMarketCard market={displayedMarkets[0]} allMarkets={markets || []} />
          </div>
        )}

        {/* Market Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            [...Array(8)].map((_, i) => <MarketSkeleton key={i} />)
          ) : (
            displayedMarkets?.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))
          )}
        </div>

        {!isLoading && filteredMarkets.length > limit && (
          <div className="mt-12 flex justify-center">
            <Button 
              variant="outline" 
              size="lg" 
              className="font-bold rounded-xl px-12"
              onClick={() => setLimit(prev => prev + 36)}
            >
              Explore all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketCard({ market }: { market: PolymarketMarket }) {
  const [, setLocation] = useLocation();
  const outcomes = parseOutcomes(market);
  const isBinary = outcomes.length === 2 && 
    ['yes', 'no'].includes(outcomes[0].name.toLowerCase()) && 
    ['yes', 'no'].includes(outcomes[1].name.toLowerCase());
  
  return (
    <Card 
      className="bg-white dark:bg-[#12161C] border-none shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
      onClick={() => setLocation(`/prediction/${market.conditionId}`)}
    >
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-start gap-3 mb-3 flex-1">
          {market.image && (
            <img 
              src={market.image} 
              alt="" 
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0" 
              loading="lazy"
            />
          )}
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {market.tags?.[0] || 'Market'}
            </span>
            <h3 className="font-bold text-sm leading-tight line-clamp-3 group-hover:text-primary transition-colors">
              {market.question}
            </h3>
          </div>
        </div>

        {isBinary ? (
          <div className="mb-3">
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-lg font-bold">{Math.round(outcomes[0].price * 100)}%</span>
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">chance</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-10 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                onClick={(e) => e.stopPropagation()}
              >
                Yes {Math.round(outcomes[0].price * 100)}¢
              </Button>
              <Button 
                variant="outline" 
                className="h-10 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                onClick={(e) => e.stopPropagation()}
              >
                No {Math.round(outcomes[1].price * 100)}¢
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            {outcomes
              .sort((a, b) => b.price - a.price)
              .slice(0, 4)
              .map((o, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate mr-2 max-w-[60%] font-medium">{o.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${Math.round(o.price * 100)}%` }}
                    />
                  </div>
                  <span className="font-bold w-8 text-right">{Math.round(o.price * 100)}%</span>
                </div>
              </div>
            ))}
            {outcomes.length > 4 && (
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">+{outcomes.length - 4} more</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
          <span>{formatVolume(market.volumeNum || 0)} Vol.</span>
          <div className="flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 hover:text-primary cursor-pointer transition-colors" onClick={(e) => e.stopPropagation()} />
            <Bookmark className="w-3.5 h-3.5 hover:text-primary cursor-pointer transition-colors" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedMarketCard({ market, allMarkets }: { market: PolymarketMarket, allMarkets: PolymarketMarket[] }) {
  const [, setLocation] = useLocation();
  const outcomes = parseOutcomes(market);
  const price = outcomes[0] ? Math.round(outcomes[0].price * 100) : 0;

  // Get breaking news from other markets
  const breakingNews = useMemo(() => {
    if (!allMarkets) return [];
    return allMarkets
      .filter(m => m.id !== market.id)
      .sort((a, b) => (b.volumeNum || 0) - (a.volumeNum || 0))
      .slice(0, 3);
  }, [allMarkets, market.id]);

  return (
    <Card 
      className="bg-white dark:bg-[#12161C] border-none shadow-sm overflow-hidden cursor-pointer"
      onClick={() => setLocation(`/prediction/${market.conditionId}`)}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            {market.image && <img src={market.image} className="w-6 h-6 rounded" />}
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{market.tags?.[0] || 'Market'}</span>
          </div>
          <h2 className="text-2xl font-black mb-6 leading-tight">
            {market.question}
          </h2>
          
          <div className="flex items-center gap-8 mb-8">
            <div className="flex flex-col">
              <span className="text-4xl font-black text-primary">{price}% chance</span>
              <span className="text-xs font-bold text-emerald-500 mt-1 uppercase tracking-widest">▲ 2.4% last 24h</span>
            </div>
            
            <div className="flex-1 hidden md:block h-24 bg-[#F1F4F9] dark:bg-[#1E2329] rounded-xl p-2 relative overflow-hidden">
               {/* Simple visualization of a line chart */}
               <div className="absolute inset-0 flex items-end">
                 <div className="w-full h-[60%] bg-primary/5 border-t-2 border-primary/20" style={{ clipPath: 'polygon(0 100%, 0 40%, 20% 60%, 40% 30%, 60% 50%, 80% 20%, 100% 40%, 100% 100%)' }} />
               </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button size="lg" className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 border-2 font-black text-lg h-14 rounded-2xl">
              Yes {price}¢
            </Button>
            <Button size="lg" className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20 border-2 font-black text-lg h-14 rounded-2xl">
              No {100 - price}¢
            </Button>
          </div>
        </div>

        <div className="bg-[#F8FAFC] dark:bg-[#1E2329] p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-widest">Breaking news</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {breakingNews.length > 0 ? (
              breakingNews.map((newsMarket, i) => {
                const newsOutcomes = parseOutcomes(newsMarket);
                const newsPrice = newsOutcomes[0] ? Math.round(newsOutcomes[0].price * 100) : 0;
                return (
                  <div key={newsMarket.id} className="flex gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/prediction/${newsMarket.conditionId}`);
                  }}>
                    <span className="text-xs font-black text-muted-foreground/50">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold leading-snug line-clamp-2">{newsMarket.question}</p>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{newsMarket.tags?.[0] || 'Politics'}</span>
                    </div>
                    <span className="text-xs font-black text-primary">{newsPrice}%</span>
                  </div>
                );
              })
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <span className="text-xs font-bold text-muted-foreground">{i}</span>
                  <div className="flex-1">
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-2 w-1/2" />
                  </div>
                  <Skeleton className="h-3 w-6" />
                </div>
              ))
            )}
          </div>
          <Button variant="outline" className="w-full font-black uppercase tracking-widest h-12 rounded-xl border-2" onClick={(e) => {
            e.stopPropagation();
            setActiveCategory("Trending");
          }}>Explore all</Button>
        </div>
      </div>
    </Card>
  );
}

function MarketSkeleton() {
  return (
    <Card className="border-none shadow-sm overflow-hidden p-4 space-y-4">
      <div className="flex gap-3">
        <Skeleton className="w-10 h-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  );
}

