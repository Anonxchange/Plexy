
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpFromLine, ArrowDownToLine, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { walletClient } from "@/lib/wallet-client";
import { getCryptoPrices, convertToNGN } from "@/lib/crypto-prices";
import type { CryptoPrice } from "@/lib/crypto-prices";

const cryptoData: Record<string, { name: string; icon: string; color: string }> = {
  BTC: { name: "Bitcoin", icon: "₿", color: "text-orange-500" },
  ETH: { name: "Ethereum", icon: "Ξ", color: "text-blue-500" },
  SOL: { name: "Solana", icon: "◎", color: "text-purple-500" },
  TON: { name: "Toncoin", icon: "💎", color: "text-blue-400" },
  USDC: { name: "USD Coin", icon: "⊙", color: "text-blue-600" },
  USDT: { name: "Tether", icon: "₮", color: "text-green-500" },
  XMR: { name: "Monero", icon: "ɱ", color: "text-orange-600" },
};

export default function AssetDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/wallet/asset/:symbol");
  const [, setLocation] = useLocation();
  const symbol = params?.symbol || "";
  
  const [balance, setBalance] = useState(0);
  const [price, setPrice] = useState(0);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [avgCost, setAvgCost] = useState(0);
  
  const assetInfo = cryptoData[symbol] || { name: symbol, icon: symbol[0], color: "text-gray-500" };
  
  useEffect(() => {
    if (!user) {
      setLocation("/signin");
      return;
    }
    loadAssetData();
  }, [user, symbol]);
  
  const loadAssetData = async () => {
    try {
      // Load wallet balance
      const walletResponse = await walletClient.getWallets();
      const wallets = walletResponse.wallets || walletResponse || [];
      const wallet = wallets.find((w: any) => w.currency === symbol);
      const assetBalance = wallet?.balance || 0;
      setBalance(assetBalance);
      
      // Load price data
      const prices = await getCryptoPrices([symbol]);
      const priceData = prices[symbol];
      if (priceData) {
        setPrice(priceData.current_price);
        setPriceChange24h(priceData.price_change_percentage_24h);
      }
      
      // Mock average cost (should come from trade history)
      setAvgCost(priceData?.current_price * 0.95 || 0);
    } catch (error) {
      console.error("Error loading asset data:", error);
    }
  };
  
  const usdValue = balance * price;
  const costBasis = balance * avgCost;
  const pnlUsd = usdValue - costBasis;
  const pnlPercentage = costBasis > 0 ? ((usdValue - costBasis) / costBasis) * 100 : 0;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/wallet")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center text-lg ${assetInfo.color}`}>
              {assetInfo.icon}
            </div>
            <span className="font-semibold text-lg">{symbol}</span>
          </div>
          <div className="w-10" />
        </div>
      </div>
      
      <div className="px-4 py-6 space-y-6">
        {/* Equity Section */}
        <div>
          <div className="text-sm text-muted-foreground mb-2">Equity</div>
          <div className="text-4xl font-bold mb-1">{balance.toFixed(8)}</div>
          <div className="text-sm text-muted-foreground">≈ {usdValue.toFixed(2)} USD</div>
        </div>
        
        {/* PnL Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Cumulative PnL (USD)</div>
            <div className={`text-2xl font-semibold ${pnlUsd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pnlUsd >= 0 ? '+' : ''}{pnlUsd.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Cumulative ROI%</div>
            <div className={`text-2xl font-semibold ${pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Avg. Cost (USD)</div>
            <div className="text-xl font-semibold">{avgCost.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Index Price (USD)</div>
            <div className="text-xl font-semibold">{price.toLocaleString()}</div>
          </div>
        </div>
        
        {/* Distribution */}
        <div>
          <h3 className="text-xl font-bold mb-4">Distribution</h3>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-primary flex items-center justify-center">
                    <span className="text-xs font-semibold">100%</span>
                  </div>
                  <div>
                    <div className="font-semibold">Unified Trading Account</div>
                    <div className="text-sm text-muted-foreground">≈ {usdValue.toFixed(2)} USD</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{balance.toFixed(8)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Trading Pairs */}
        <div>
          <h3 className="text-xl font-bold mb-4">Trade</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="font-semibold mb-1">{symbol}/USDT</div>
                <div className="text-2xl font-bold mb-1">{price.toLocaleString()}</div>
                <div className={`text-sm ${priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="font-semibold mb-1">{symbol}/USDC</div>
                <div className="text-2xl font-bold mb-1">{price.toLocaleString()}</div>
                <div className={`text-sm ${priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-6">
          <Button variant="outline" size="lg" className="h-20 flex-col gap-2">
            <ArrowLeftRight className="h-6 w-6" />
            <span>Transfer</span>
          </Button>
          <Button variant="outline" size="lg" className="h-20 flex-col gap-2">
            <ArrowLeftRight className="h-6 w-6" />
            <span>Convert</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
