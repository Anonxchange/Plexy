import { Button } from "@/components/ui/button";

export const MarketInfo = () => {
  return (
    <section className="px-4 py-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">Cryptocurrency Prices</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <div className="flex gap-0.5">
              <div className="w-1.5 h-4 bg-current rounded-sm" />
              <div className="w-1.5 h-4 bg-current rounded-sm" />
            </div>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs px-3">
            USD
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-amber-600 font-medium mb-3">19068 Assets</p>
      
      <p className="text-sm text-muted-foreground leading-relaxed">
        The cryptocurrency market is valued at $3.1T, and on average a 1.05% increase over the last day. The total marketcap for stablecoins is $313.0B. The total marketcap for DeFi is $103.3B.
      </p>
      
      <button className="text-sm text-blue-500 font-medium mt-2">Read More</button>
    </section>
  );
};
