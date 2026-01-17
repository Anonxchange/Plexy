import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { getUserWallets } from "@/lib/wallet-api";
import { getCryptoPrices } from "@/lib/crypto-prices";

export interface WalletData {
  totalBalance: number;
  userId?: string;
  assets: {
    symbol: string;
    name: string;
    balance: number;
    value: number;
    change24h: number;
  }[];
}

const ASSET_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  USDT: "Tether",
  USDC: "USD Coin",
  BNB: "BNB",
  SOL: "Solana",
  TRX: "Tron",
};

export function useWalletData() {
  const { user } = useAuth();
  
  return useQuery<WalletData>({
    queryKey: ["/api/wallet", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        const wallets = await getUserWallets(user!.id);
        const symbols = wallets.map(w => w.crypto_symbol);
        const prices = await getCryptoPrices(symbols.length > 0 ? symbols : Object.keys(ASSET_NAMES));
        
        let totalBalance = 0;
        const assets = wallets.map(wallet => {
          const priceData = prices[wallet.crypto_symbol] || { current_price: 0, price_change_percentage_24h: 0 };
          const value = wallet.balance * priceData.current_price;
          totalBalance += value;
          
          return {
            symbol: wallet.crypto_symbol,
            name: ASSET_NAMES[wallet.crypto_symbol] || wallet.crypto_symbol,
            balance: wallet.balance,
            value: value,
            change24h: priceData.price_change_percentage_24h
          };
        });

        // Ensure we always show the main assets even if 0 balance
        const mainSymbols = Object.keys(ASSET_NAMES);
        mainSymbols.forEach(symbol => {
          if (!assets.find(a => a.symbol === symbol)) {
            const priceData = prices[symbol] || { current_price: 0, price_change_percentage_24h: 0 };
            assets.push({
              symbol,
              name: ASSET_NAMES[symbol],
              balance: 0,
              value: 0,
              change24h: priceData.price_change_percentage_24h
            });
          }
        });

        return {
          totalBalance,
          userId: user?.id,
          assets: assets.sort((a, b) => b.value - a.value || a.symbol.localeCompare(b.symbol))
        };
      } catch (error) {
        console.error("Failed to fetch real wallet data:", error);
        return {
          totalBalance: 0,
          userId: user?.id,
          assets: Object.entries(ASSET_NAMES).map(([symbol, name]) => ({
            symbol,
            name,
            balance: 0,
            value: 0,
            change24h: 0
          }))
        };
      }
    },
    refetchInterval: 30000,
  });
}
