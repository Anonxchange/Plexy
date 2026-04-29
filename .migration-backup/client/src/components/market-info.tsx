import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface GlobalData {
  total_market_cap: { usd: number };
  market_cap_change_percentage_24h_usd: number;
  markets: number;
  active_cryptocurrencies: number;
}

function useGlobalMarket() {
  return useQuery<GlobalData>({
    queryKey: ["coingecko-global"],
    queryFn: async () => {
      const res = await fetch("https://api.coingecko.com/api/v3/global");
      if (!res.ok) throw new Error("Failed to fetch global market data");
      const json = await res.json();
      return json.data as GlobalData;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
}

function formatMarketCap(usd: number): string {
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(1)}T`;
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
  return `$${(usd / 1e6).toFixed(0)}M`;
}

export const MarketInfo = () => {
  const { data, isLoading } = useGlobalMarket();

  const totalMarketCap = data ? formatMarketCap(data.total_market_cap.usd) : null;
  const change24h = data ? data.market_cap_change_percentage_24h_usd.toFixed(2) : null;
  const assetCount = data ? data.active_cryptocurrencies.toLocaleString() : null;
  const isPositive = data && data.market_cap_change_percentage_24h_usd >= 0;

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

      {isLoading ? (
        <p className="text-sm text-muted-foreground animate-pulse">Loading market data…</p>
      ) : data ? (
        <>
          <p className="text-sm text-amber-600 font-medium mb-3">{assetCount} Assets</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The cryptocurrency market is valued at{" "}
            <span className="font-medium text-foreground">{totalMarketCap}</span>, with a{" "}
            <span className={`font-medium ${isPositive ? "text-success" : "text-destructive"}`}>
              {isPositive ? "+" : ""}{change24h}%
            </span>{" "}
            change over the last 24 hours.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Market data unavailable.</p>
      )}

      <button className="text-sm text-blue-500 font-medium mt-2">Read More</button>
    </section>
  );
};
