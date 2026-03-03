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
                <Zap className="text-primary-foreground w-5 h-5" />
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-4 text-sm font-medium text-muted-foreground ml-auto">
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

        {/* Search Bar after Hero */}
        <div className="mb-8 max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search markets..." 
            className="pl-10 h-12 bg-white dark:bg-[#12161C] border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
  const outcomes = JSON.parse(market.outcomes || "[]");
  const prices = JSON.parse(market.outcomePrices || "[]");
  
  return (
    <Card 
      className="bg-white dark:bg-[#12161C] border-none shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
      onClick={() => setLocation(`/prediction/${market.conditionId}`)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-2">
            {market.image && (
              <img src={market.image} alt="" className="w-10 h-10 rounded-md object-cover border" />
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {market.tags?.[0] || 'Market'}
              </span>
              <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {market.question}
              </h3>
            </div>
          </div>
          <div className="bg-[#F1F4F9] dark:bg-[#1E2329] p-1.5 rounded-full flex flex-col items-center justify-center min-w-[3rem]">
            <span className="text-xs font-black text-primary">
              {prices[0] ? Math.round(parseFloat(prices[0]) * 100) : 0}%
            </span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase">chance</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" className="h-10 border-green-500/20 bg-green-500/5 hover:bg-green-500/10 text-green-600 dark:text-green-400 font-bold">
            Yes
          </Button>
          <Button variant="outline" className="h-10 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-bold">
            No
          </Button>
        </div>

        <div className="flex items-center justify-between mt-4 text-[10px] text-muted-foreground font-bold">
          <div className="flex items-center gap-1">
            <span>${parseFloat(market.volumeNum?.toString() || "0").toLocaleString(undefined, { maximumFractionDigits: 0 })} Vol.</span>
          </div>
          <div className="flex items-center gap-2">
            <Share2 className="w-3 h-3 hover:text-primary cursor-pointer" />
            <Bookmark className="w-3 h-3 hover:text-primary cursor-pointer" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedMarketCard({ market, allMarkets }: { market: PolymarketMarket, allMarkets: PolymarketMarket[] }) {
  const [, setLocation] = useLocation();
  const prices = JSON.parse(market.outcomePrices || "[]");
  const price = prices[0] ? Math.round(parseFloat(prices[0]) * 100) : 0;

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
            <span className="text-xs font-bold text-muted-foreground uppercase">{market.tags?.[0] || 'Market'}</span>
          </div>
          <h2 className="text-2xl font-black mb-6 leading-tight">
            {market.question}
          </h2>
          
          <div className="flex items-center gap-8 mb-8">
            <div className="flex flex-col">
              <span className="text-4xl font-black text-primary">{price}% chance</span>
              <span className="text-xs font-bold text-green-500 mt-1">▲ 2%</span>
            </div>
            
            <div className="flex-1 hidden md:block h-24 bg-[#F1F4F9] dark:bg-[#1E2329] rounded-lg p-2 relative">
               {/* Simple visualization of a line chart */}
               <div className="absolute inset-x-2 bottom-4 h-1 bg-primary/20 rounded-full overflow-hidden">
                 <div className="h-full bg-primary w-2/3" />
               </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button size="lg" className="flex-1 bg-[#E6F4EA] hover:bg-[#D2E9D8] text-[#1E8E3E] border-[#CEEAD6] border font-bold text-lg">Yes</Button>
            <Button size="lg" className="flex-1 bg-[#FCE8E6] hover:bg-[#F9D7D3] text-[#D93025] border-[#FAD2CF] border font-bold text-lg">No</Button>
          </div>
        </div>

        <div className="bg-[#F8FAFC] dark:bg-[#1E2329] p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Breaking news</span>
            <ChevronRight className="w-4 h-4" />
          </div>

          <div className="space-y-4">
            {breakingNews.length > 0 ? (
              breakingNews.map((newsMarket, i) => {
                const newsPrices = JSON.parse(newsMarket.outcomePrices || "[]");
                const newsPrice = newsPrices[0] ? Math.round(parseFloat(newsPrices[0]) * 100) : 0;
                return (
                  <div key={newsMarket.id} className="flex gap-4 cursor-pointer hover:opacity-80" onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/prediction/${newsMarket.conditionId}`);
                  }}>
                    <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold leading-snug line-clamp-2">{newsMarket.question}</p>
                      <span className="text-[10px] text-muted-foreground">{newsMarket.tags?.[0] || 'Politics'}</span>
                    </div>
                    <span className="text-xs font-bold">{newsPrice}%</span>
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
          <Button variant="outline" className="w-full font-bold" onClick={(e) => {
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

