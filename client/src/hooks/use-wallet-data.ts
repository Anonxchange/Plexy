import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { getUserWallets } from "@/lib/wallet-api";
import { getCryptoPrices, convertCurrency } from "@/lib/crypto-prices";
import { useWalletBalances } from "./use-wallet-balances";
import { useState, useEffect, useMemo } from "react";

export interface WalletData {
  totalBalance: number;
  userId?: string;
  preferredCurrency: string;
  isConverting: boolean;
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

const VALID_CRYPTO_SYMBOLS = Object.keys(ASSET_NAMES);

const SORT_ORDER: Record<string, number> = {
  BTC: 1,
  ETH: 2,
  SOL: 3,
  TRX: 4,
  USDT: 5,
  USDC: 6,
  BNB: 7,
  XRP: 8,
  MATIC: 9,
  ARB: 10,
  OP: 11,
};

export function useWalletData() {
  const { user } = useAuth();
  const { balances: monitoredBalances } = useWalletBalances();
  const [preferredCurrency, setPreferredCurrency] = useState<string>(() => {
    if (typeof window !== "undefined" && user?.id) {
      return (localStorage.getItem(`pexly_currency_${user.id}`) || "USD").toUpperCase();
    }
    return "USD";
  });
  const [isConverting, setIsConverting] = useState(false);

  // Prefer context/state over polling for currency preference
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!user?.id) return;
      if (e.key === `pexly_currency_${user.id}` && e.newValue) {
        setPreferredCurrency(e.newValue.toUpperCase());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [user?.id]);

  // Memoize monitored balances signature to avoid triggering refetch too often
  const balancesKey = useMemo(() => {
    if (!monitoredBalances) return "";
    return monitoredBalances.map(b => `${b.symbol}:${b.balance}`).join(",");
  }, [monitoredBalances]);

  const query = useQuery<WalletData>({
    queryKey: ["wallet-data", user?.id, balancesKey, preferredCurrency],
    enabled: !!user?.id,
    staleTime: 30_000, // cache data for 30s before refetch
    refetchInterval: 15_000, // poll every 15s
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Use monitored balances if available
      const wallets = monitoredBalances && monitoredBalances.length > 0
        ? monitoredBalances.map(mb => ({ crypto_symbol: mb.symbol, balance: Number(mb.balance) || 0 }))
        : await getUserWallets(user.id);

      // Normalize & filter
      const normalizedWallets = wallets
        .map(w => {
          const raw = (w.crypto_symbol || "").toUpperCase();
          const baseSymbol = raw.split("-")[0];
          return { symbol: baseSymbol, balance: typeof w.balance === "number" ? w.balance : 0 };
        })
        .filter(w => VALID_CRYPTO_SYMBOLS.includes(w.symbol));

      const symbols = [...new Set(normalizedWallets.map(w => w.symbol))];
      const priceResponse = await getCryptoPrices(symbols.length > 0 ? symbols : VALID_CRYPTO_SYMBOLS);

      const prices: Record<string, { price: number; change24h: number }> = {};
      if (Array.isArray(priceResponse)) {
        priceResponse.forEach(p => {
          if (p?.symbol) prices[p.symbol.toUpperCase()] = {
            price: Number(p.current_price ?? p.price ?? 0),
            change24h: Number(p.price_change_percentage_24h ?? p.change24h ?? 0),
          };
        });
      } else if (priceResponse && typeof priceResponse === "object") {
        Object.entries(priceResponse).forEach(([symbol, p]: any) => {
          prices[symbol.toUpperCase()] = {
            price: Number(p.current_price ?? p.price ?? 0),
            change24h: Number(p.price_change_percentage_24h ?? p.change24h ?? 0),
          };
        });
      }

      // Aggregate assets
      const assetMap = new Map<string, WalletData["assets"][number]>();
      normalizedWallets.forEach(({ symbol, balance }) => {
        const priceInfo = prices[symbol] || { price: 0, change24h: 0 };
        const value = balance * priceInfo.price;
        const existing = assetMap.get(symbol);
        if (existing) {
          existing.balance += balance;
          existing.value += value;
        } else {
          assetMap.set(symbol, { symbol, name: ASSET_NAMES[symbol] || symbol, balance, value, change24h: priceInfo.change24h });
        }
      });

      // Ensure all assets exist
      VALID_CRYPTO_SYMBOLS.forEach(symbol => {
        if (!assetMap.has(symbol)) {
          assetMap.set(symbol, { symbol, name: ASSET_NAMES[symbol], balance: 0, value: 0, change24h: prices[symbol]?.change24h || 0 });
        }
      });

      const assets = Array.from(assetMap.values());
      let totalBalanceUSD = assets.reduce((sum, asset) => sum + asset.value, 0);

      let finalTotalBalance = totalBalanceUSD;

      // Handle conversion
      if (preferredCurrency !== "USD") {
        setIsConverting(true);
        try {
          finalTotalBalance = await convertCurrency(totalBalanceUSD, preferredCurrency);
        } catch (e) {
          console.error("useWalletData: Currency conversion failed", e);
        } finally {
          setIsConverting(false);
        }
      }

      // Sort assets
      assets.sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        const orderA = SORT_ORDER[a.symbol] ?? 99;
        const orderB = SORT_ORDER[b.symbol] ?? 99;
        return orderA - orderB || a.symbol.localeCompare(b.symbol);
      });

      return { totalBalance: finalTotalBalance, userId: user.id, preferredCurrency, isConverting, assets };
    },
  });

  // Return query with the converting state (from local state)
  return { ...query, data: query.data ? { ...query.data, isConverting } : undefined };
}