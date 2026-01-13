import { useQuery } from "@tanstack/react-query";

export interface CryptoNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
}

export function useCryptoNews() {
  return useQuery<CryptoNews[]>({
    queryKey: ["crypto-news"],
    queryFn: async () => {
      return [
        {
          id: "1",
          title: "Bitcoin Reaches New High",
          summary: "Bitcoin price surged past expectations today.",
          source: "CryptoNews",
          timestamp: new Date().toISOString()
        }
      ];
    }
  });
}
