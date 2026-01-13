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
        totalBalance: 0,
        assets: [
          { symbol: "BTC", name: "Bitcoin", balance: 0, value: 0, change24h: 0 },
          { symbol: "ETH", name: "Ethereum", balance: 0, value: 0, change24h: 0 },
          { symbol: "USDT", name: "Tether", balance: 0, value: 0, change24h: 0 },
          { symbol: "USDC", name: "USD Coin", balance: 0, value: 0, change24h: 0 },
          { symbol: "BNB", name: "BNB", balance: 0, value: 0, change24h: 0 },
          { symbol: "SOL", name: "Solana", balance: 0, value: 0, change24h: 0 },
          { symbol: "TRX", name: "Tron", balance: 0, value: 0, change24h: 0 },
        ]
      };
    }
  });
}
