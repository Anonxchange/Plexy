import { useQuery } from "@tanstack/react-query";

export interface PortfolioMetrics {
  totalProfit: number;
  profitPercentage: number;
  topPerformer: string;
  volatility: number;
}

export function usePortfolioMetrics() {
  return useQuery<PortfolioMetrics>({
    queryKey: ["portfolio-metrics"],
    queryFn: async () => {
      return {
        totalProfit: 1200.50,
        profitPercentage: 10.5,
        topPerformer: "BTC",
        volatility: 0.15
      };
    }
  });
}
