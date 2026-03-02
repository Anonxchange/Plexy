import { useMarkets, PolymarketMarket } from "@/hooks/use-polymarket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Clock } from "lucide-react";
import { format } from "date-fns";

export default function PredictionPage() {
  const { data: markets, isLoading } = useMarkets({ limit: 10 });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Prediction Markets</h1>
        <p className="text-muted-foreground">
          Bet on real-world events and earn rewards for correct predictions.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-32 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets?.map((market: PolymarketMarket) => (
            <Card key={market.id} className="overflow-hidden hover:shadow-lg transition-shadow border-primary/10">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <CardTitle className="text-lg leading-tight line-clamp-2">
                    {market.question}
                  </CardTitle>
                  {market.image && (
                    <img src={market.image} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {market.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {JSON.parse(market.outcomes || "[]").map((outcome: string, idx: number) => {
                      const prices = JSON.parse(market.outcomePrices || "[]");
                      const price = prices[idx] ? (parseFloat(prices[idx]) * 100).toFixed(1) : "0";
                      return (
                        <div key={outcome} className="flex flex-col p-3 rounded-lg bg-secondary/30 border border-primary/5 hover:bg-secondary/50 transition-colors cursor-pointer">
                          <span className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-tighter">{outcome}</span>
                          <span className="text-xl font-bold text-primary">{price}%</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-primary/5">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>${parseFloat(market.volumeNum?.toString() || "0").toLocaleString()} Vol</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{market.endDate ? format(new Date(market.endDate), 'MMM d, yyyy') : 'TBD'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
