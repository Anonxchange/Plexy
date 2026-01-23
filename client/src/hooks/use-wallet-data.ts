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
  XRP: "XRP",
  MATIC: "Polygon",
  ARB: "Arbitrum",
  OP: "Optimism",
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

        const symbols = wallets.map(w => w.crypto_symbol).filter(Boolean);
        const prices = await getCryptoPrices(symbols.length > 0 ? symbols : VALID_CRYPTO_SYMBOLS);
        
        const assetMap = new Map();
        let totalBalance = 0;
        
        // Add real wallets first (with balance)
        wallets.forEach(wallet => {
          try {
            const rawSymbol = wallet?.crypto_symbol || '';
            if (!rawSymbol) return;
            const baseSymbol = rawSymbol.includes('-') ? rawSymbol.split('-')[0].toUpperCase() : rawSymbol.toUpperCase();
            const normalizedKey = baseSymbol; // Deduplicate by base symbol (e.g., USDT-ERC20 and USDT-TRC20 become USDT)
            
            let priceData = { current_price: 0, price_change_percentage_24h: 0 };
            if (prices) {
              const found = Array.isArray(prices) 
                ? prices.find((p: any) => p && (p.symbol === rawSymbol || p.symbol === baseSymbol))
                : (prices[rawSymbol] || prices[baseSymbol]);
              
              if (found) {
                priceData = { 
                  current_price: Number(found.price || found.current_price || 0), 
                  price_change_percentage_24h: Number(found.change24h || found.price_change_percentage_24h || 0) 
                };
              }
            }

            const balance = typeof wallet.balance === 'number' ? wallet.balance : 0;
            const value = balance * (priceData.current_price || 0);
            totalBalance += value;
            
            const existing = assetMap.get(normalizedKey);
            if (existing) {
              // Combine balances for same asset on different chains
              existing.balance += balance;
              existing.value += value;
            } else {
              assetMap.set(normalizedKey, {
                symbol: normalizedKey,
                name: ASSET_NAMES[normalizedKey] || normalizedKey,
                balance: balance,
                value: value,
                change24h: priceData.price_change_percentage_24h || 0
              });
            }
          } catch (e) {
            console.error("Error processing wallet asset:", e);
          }
        });

        // Add missing main assets with 0 balance
        Object.keys(ASSET_NAMES).forEach(symbol => {
          if (!assetMap.has(symbol)) {
            const priceData = (prices && !Array.isArray(prices) && prices[symbol]) || { current_price: 0, price_change_percentage_24h: 0 };
            assetMap.set(symbol, {
              symbol,
              name: ASSET_NAMES[symbol],
              balance: 0,
              value: 0,
              change24h: Number(priceData.price_change_percentage_24h || 0)
            });
          }
        });

        const assets = Array.from(assetMap.values());

        // Defined custom order for a professional look
        const SORT_ORDER: Record<string, number> = {
          BTC: 1, ETH: 2, SOL: 3, TRX: 4, USDT: 5, USDC: 6, BNB: 7, XRP: 8, MATIC: 9, ARB: 10, OP: 11
        };

        return {
          totalBalance,
          userId: user?.id,
          assets: assets.sort((a, b) => {
            if (b.value !== a.value) return b.value - a.value;
            const orderA = SORT_ORDER[a.symbol.toUpperCase()] || 99;
            const orderB = SORT_ORDER[b.symbol.toUpperCase()] || 99;
            return orderA - orderB || a.symbol.localeCompare(b.symbol);
          })
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
