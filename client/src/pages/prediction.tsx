import { useMarkets, PolymarketMarket } from "@/hooks/use-polymarket";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Clock, Search, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";

export default function PredictionPage() {
    const [limit, setLimit] = useState(36);
    const [activeCategory, setActiveCategory] = useState("All");
  const { data: markets, isLoading } = useMarkets({ limit });
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const filteredMarkets = markets?.filter(m => {
      const matchesSearch = m.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === "All" || m.tags?.includes(activeCategory);
      return matchesSearch && matchesCategory;
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Search Area */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto py-4 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">Markets</h1>
            <div className="flex gap-2">
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">New</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Crypto</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Politics</Badge>
            </div>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search markets..." 
              className="pl-10 bg-background/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-border/50 shadow-sm">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1 rounded-md" />
                    <Skeleton className="h-10 flex-1 rounded-md" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMarkets?.map((market: PolymarketMarket) => {
              const outcomes = JSON.parse(market.outcomes || "[]");
              const prices = JSON.parse(market.outcomePrices || "[]");
              
              // Standard Polymarket-like Yes/No color scheme
              const getOutcomeStyles = (outcome: string, price: string) => {
                const lower = outcome.toLowerCase();
                const isYes = lower === 'yes' || lower === 'up' || lower === 'will';
                const isNo = lower === 'no' || lower === 'down' || lower === 'won\'t';
                
                if (isYes) return "bg-[#E6F4EA] dark:bg-green-950/30 text-[#1E8E3E] dark:text-green-400 border-[#CEEAD6] dark:border-green-900/50 hover:bg-[#D2E9D8]";
                if (isNo) return "bg-[#FCE8E6] dark:bg-red-950/30 text-[#D93025] dark:text-red-400 border-[#FAD2CF] dark:border-red-900/50 hover:bg-[#F9D7D3]";
                return "bg-secondary/50 text-foreground border-transparent hover:bg-secondary";
              };

              return (
                <Card key={market.id} className="group overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer" onClick={() => setLocation(`/prediction/${market.conditionId}`)}>
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase text-muted-foreground border-muted-foreground/20">
                            {market.tags?.[0] || 'Market'}
                          </Badge>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                            <TrendingUp className="w-2.5 h-2.5" />
                            ${parseFloat(market.volumeNum?.toString() || "0").toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-3 min-h-[3rem]">
                          {market.question}
                        </h3>
                      </div>
                      {market.image && (
                        <img src={market.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border bg-muted" />
                      )}
                    </div>

                    <div className="mt-auto pt-4 space-y-2">
                      <div className="flex gap-2">
                        {outcomes.slice(0, 2).map((outcome: string, idx: number) => {
                          const pricePercent = prices[idx] ? Math.round(parseFloat(prices[idx]) * 100) : 0;
                          const styles = getOutcomeStyles(outcome, pricePercent.toString());
                          
                          return (
                            <Button 
                              key={outcome} 
                              variant="outline" 
                              className={`flex-1 h-12 flex-col items-center justify-center gap-0 border shadow-none ${styles}`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-tight opacity-80">{outcome}</span>
                              <span className="text-sm font-black">{pricePercent}¢</span>
                            </Button>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium px-0.5">
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{market.endDate ? format(new Date(market.endDate), 'MMM d') : 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-0.5 group-hover:text-primary transition-colors cursor-pointer">
                          <span>View Details</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
            {!isLoading && filteredMarkets && filteredMarkets.length >= limit && (
              <div className="mt-12 flex justify-center">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="font-bold uppercase tracking-widest px-12 rounded-xl border-primary/20 hover:bg-primary/5"
                  onClick={() => setLimit(prev => prev + 36)}
                >
                  Show More
                </Button>
              </div>
            )}
          )}
        
        {!isLoading && filteredMarkets?.length === 0 && (
          <div className="text-center py-20 border rounded-xl bg-card/50">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No markets found</h3>
            <p className="text-muted-foreground">Try adjusting your search query</p>
          </div>
        )}
      </div>
    </div>
  );
}
