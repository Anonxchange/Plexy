import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts";

interface ChartPoint {
  date: string;
  bitcoin: number;
  ethereum: number;
}

async function fetchCoinChart(coinId: string, days: number): Promise<[number, number][]> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
  );
  if (!res.ok) throw new Error(`Failed to fetch chart for ${coinId}`);
  const json = await res.json();
  return json.prices as [number, number][];
}

function toPercentChange(prices: [number, number][]): Map<number, number> {
  if (!prices.length) return new Map();
  const base = prices[0][1];
  const map = new Map<number, number>();
  for (const [ts, price] of prices) {
    map.set(ts, ((price - base) / base) * 100);
  }
  return map;
}

function usePerformanceChart(days: number) {
  return useQuery<ChartPoint[]>({
    queryKey: ["price-chart-performance", days],
    queryFn: async () => {
      const [btcPrices, ethPrices] = await Promise.all([
        fetchCoinChart("bitcoin", days),
        fetchCoinChart("ethereum", days),
      ]);

      const btcPct = toPercentChange(btcPrices);
      const ethPct = toPercentChange(ethPrices);

      const btcTimestamps = btcPrices.map(([ts]) => ts);
      const step = Math.max(1, Math.floor(btcTimestamps.length / 60));

      return btcTimestamps
        .filter((_, i) => i % step === 0)
        .map((ts) => {
          const date = new Date(ts);
          const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const btcVal = btcPct.get(ts);
          const closestEth = [...ethPct.entries()].reduce((prev, curr) =>
            Math.abs(curr[0] - ts) < Math.abs(prev[0] - ts) ? curr : prev
          );
          return {
            date: label,
            bitcoin: btcVal !== undefined ? parseFloat(btcVal.toFixed(2)) : 0,
            ethereum: parseFloat(closestEth[1].toFixed(2)),
          };
        });
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });
}

export const PriceChart = () => {
  const { data: chartData, isLoading } = usePerformanceChart(365);

  const lastBtc = chartData?.at(-1)?.bitcoin ?? null;
  const lastEth = chartData?.at(-1)?.ethereum ?? null;

  const formatPct = (v: number | null) =>
    v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Chart</h2>
        <Button variant="outline" size="sm" className="rounded-full text-xs px-4">
          1Y
        </Button>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-4 mb-1">
          <span className="text-sm font-medium text-foreground">Bitcoin</span>
          <span className={`text-sm ${lastBtc !== null && lastBtc >= 0 ? "text-success" : "text-destructive"}`}>
            {formatPct(lastBtc)}
          </span>
        </div>
        <div className="flex items-center gap-4 mb-1">
          <span className="text-sm font-medium text-foreground">Ethereum</span>
          <span className={`text-sm ${lastEth !== null && lastEth >= 0 ? "text-success" : "text-destructive"}`}>
            {formatPct(lastEth)}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">vs. 1 year ago</span>
      </div>

      <div className="h-64 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground animate-pulse">
            Loading chart…
          </div>
        ) : chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Tooltip
                formatter={(value: number) => [`${value > 0 ? "+" : ""}${value.toFixed(2)}%`]}
                contentStyle={{ fontSize: 12 }}
              />
              <Line type="monotone" dataKey="bitcoin" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ethereum" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Chart data unavailable.
          </div>
        )}
      </div>
    </section>
  );
};
