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
  SOL: "Solana",
  TRX: "Tron",
  USDT: "Tether",
  USDC: "USD Coin",
  BNB: "BNB",
};

// Valid crypto symbols to prevent junk data (like "message", "success", etc.)
const VALID_CRYPTO_SYMBOLS = Object.keys(ASSET_NAMES);

export function useWalletData() {
  const { user } = useAuth();
  
  // Initial placeholder data based on supported assets
  const initialData: WalletData = {
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

  return useQuery<WalletData>({
    queryKey: ["/api/wallet", user?.id],
    enabled: !!user?.id,
    placeholderData: initialData,
    queryFn: async () => {
      try {
        const rawWallets = await getUserWallets(user!.id);
        
        // Filter out junk data immediately
        const wallets = rawWallets.filter(w => {
          const symbol = (w.crypto_symbol || "").toUpperCase();
          // Filter out technical fields like "success", "message", "timestamp"
          return VALID_CRYPTO_SYMBOLS.includes(symbol) || 
                 VALID_CRYPTO_SYMBOLS.some(s => symbol.startsWith(s + "-"));
        });

        const symbols = wallets.map(w => w.crypto_symbol);
        const prices = await getCryptoPrices(symbols.length > 0 ? symbols : VALID_CRYPTO_SYMBOLS);
        
        let totalBalance = 0;
        const assets = wallets.map(wallet => {
          const rawSymbol = wallet.crypto_symbol || '';
          const baseSymbol = rawSymbol.includes('-') ? rawSymbol.split('-')[0].toUpperCase() : rawSymbol.toUpperCase();
          const priceData = prices[rawSymbol] || prices[baseSymbol] || { current_price: 0, price_change_percentage_24h: 0 };
          const balance = typeof wallet.balance === 'number' ? wallet.balance : 0;
          const value = balance * (priceData.current_price || 0);
          totalBalance += value;
          
          return {
            symbol: rawSymbol,
            name: ASSET_NAMES[rawSymbol] || ASSET_NAMES[baseSymbol] || rawSymbol,
            balance: balance,
            value: value,
            change24h: priceData.price_change_percentage_24h || 0
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
