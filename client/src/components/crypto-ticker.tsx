
import { TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getCryptoPrices, type CryptoPrice } from "@/lib/crypto-prices";

const fallbackPrices: CryptoPrice[] = [
  { symbol: 'BTC', name: 'Bitcoin', current_price: 95234.12, price_change_percentage_24h: 2.45, market_cap: 0, total_volume: 0 },
  { symbol: 'ETH', name: 'Ethereum', current_price: 3456.78, price_change_percentage_24h: -1.23, market_cap: 0, total_volume: 0 },
  { symbol: 'USDT', name: 'Tether', current_price: 1.00, price_change_percentage_24h: 0.01, market_cap: 0, total_volume: 0 },
  { symbol: 'USDC', name: 'USD Coin', current_price: 1.00, price_change_percentage_24h: -0.02, market_cap: 0, total_volume: 0 },
  { symbol: 'SOL', name: 'Solana', current_price: 187.45, price_change_percentage_24h: 5.67, market_cap: 0, total_volume: 0 },
  { symbol: 'TON', name: 'Toncoin', current_price: 5.23, price_change_percentage_24h: 3.21, market_cap: 0, total_volume: 0 },
  { symbol: 'XMR', name: 'Monero', current_price: 178.90, price_change_percentage_24h: -0.45, market_cap: 0, total_volume: 0 },
];

export function CryptoTicker() {
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>(fallbackPrices);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const symbols = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'TON', 'XMR'];
        const prices = await getCryptoPrices(symbols);
        
        // Convert the prices object to an array
        const pricesArray = Object.values(prices);
        if (pricesArray.length > 0) {
          setCryptoPrices(pricesArray);
        }
      } catch (error) {
        console.error("Failed to fetch crypto prices:", error);
        // Keep using fallback prices on error
        setCryptoPrices(fallbackPrices);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Duplicate the array to create seamless loop
  const duplicatedPrices = [...cryptoPrices, ...cryptoPrices];

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
