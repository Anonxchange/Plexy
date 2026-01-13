import { useQuery } from "@tanstack/react-query";

export interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
}

export function useCryptoPrices() {
  return useQuery<CryptoPrice[]>({
    queryKey: ["crypto-prices"],
    queryFn: async () => {
      return [
        { symbol: "BTC", price: 42000, change24h: 2.5 },
        { symbol: "ETH", price: 2200, change24h: -1.2 },
      ];
    },
    refetchInterval: 30000,
  });
}
