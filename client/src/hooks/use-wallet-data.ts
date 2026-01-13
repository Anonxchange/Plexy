import { useQuery } from "@tanstack/react-query";

export interface WalletData {
  totalBalance: number;
  assets: {
    symbol: string;
    name: string;
    balance: number;
    value: number;
    change24h: number;
  }[];
}

export function useWalletData() {
  return useQuery<WalletData>({
    queryKey: ["/api/wallet"],
    queryFn: async () => {
      // Mock data for initial implementation
      return {
        totalBalance: 12500.50,
        assets: [
          { symbol: "BTC", name: "Bitcoin", balance: 0.25, value: 10500.00, change24h: 2.5 },
          { symbol: "ETH", name: "Ethereum", balance: 1.5, value: 2000.50, change24h: -1.2 },
        ]
      };
    }
  });
}
