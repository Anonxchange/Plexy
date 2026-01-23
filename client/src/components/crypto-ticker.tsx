
import { TrendingUp, TrendingDown } from "lucide-react";
import { useCryptoPrices, type CryptoPrice } from "@/lib/crypto-prices";
import { useMemo } from "react";

const symbols = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'TON', 'XMR'];

export function CryptoTicker() {
  const { data: pricesMap, isLoading } = useCryptoPrices(symbols);

  const cryptoPrices = useMemo(() => {
    if (!pricesMap) return [];
    return Object.values(pricesMap);
  }, [pricesMap]);

  // Duplicate the array to create seamless loop
  const duplicatedPrices = useMemo(() => [...cryptoPrices, ...cryptoPrices], [cryptoPrices]);

  if (isLoading && cryptoPrices.length === 0) {
    return <div className="h-14 bg-muted animate-pulse" />;
  }

  return (
    <div className="bg-muted border-y border-border py-4 overflow-hidden">
      <div className="relative">
        <div className="flex gap-8 animate-scroll">
          {duplicatedPrices.map((crypto, index) => (
            <div key={`${crypto.symbol}-${index}`} className="flex items-center gap-3 min-w-fit whitespace-nowrap">
              <div className="font-mono font-semibold text-foreground">{crypto.symbol}</div>
              <div className="text-sm text-muted-foreground">{crypto.name}</div>
              <div className="font-semibold tabular-nums">
                ${crypto.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${crypto.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {crypto.price_change_percentage_24h >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
