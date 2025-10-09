import { TrendingUp, TrendingDown } from "lucide-react";

//todo: remove mock functionality
const cryptoPrices = [
  { symbol: "BTC", name: "Bitcoin", price: 121626.05, change: 2.34, isPositive: true },
  { symbol: "ETH", name: "Ethereum", price: 3845.23, change: -1.12, isPositive: false },
  { symbol: "USDT", name: "Tether", price: 1.00, change: 0.01, isPositive: true },
  { symbol: "BNB", name: "BNB", price: 645.89, change: 3.45, isPositive: true },
];

export function CryptoTicker() {
  return (
    <div className="bg-muted border-y border-border py-4">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 relative">
        <div className="flex overflow-x-auto gap-8 scrollbar-hide">
          {cryptoPrices.map((crypto) => (
            <div key={crypto.symbol} className="flex items-center gap-3 min-w-fit">
              <div className="font-mono font-semibold text-foreground">{crypto.symbol}</div>
              <div className="text-sm text-muted-foreground">{crypto.name}</div>
              <div className="font-semibold tabular-nums">${crypto.price.toLocaleString()}</div>
              <div className={`flex items-center gap-1 text-sm font-medium ${crypto.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {crypto.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(crypto.change)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}