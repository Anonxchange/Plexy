import { ArrowLeft, TrendingUp, TrendingDown, Globe, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Link } from "wouter";

const assetData: { [key: string]: any } = {
  BTC: {
    name: "Bitcoin",
    symbol: "BTC",
    price: 88696.00,
    change24h: 1.57,
    marketCap: 1752000000000,
    volume24h: 42000000000,
    supply: 21000000,
    maxSupply: 21000000,
    description: "Bitcoin is a decentralized digital currency created in 2009. It operates on a peer-to-peer network and uses cryptography to secure transactions.",
    chartData: [{ value: 85000 }, { value: 85500 }, { value: 86000 }, { value: 86200 }, { value: 87000 }, { value: 87500 }, { value: 88000 }, { value: 88500 }, { value: 88696 }],
  },
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    price: 2970.09,
    change24h: 1.80,
    marketCap: 357000000000,
    volume24h: 18000000000,
    supply: 120000000,
    maxSupply: null,
    description: "Ethereum is a decentralized platform for applications that run exactly as programmed without any chance of fraud, censorship or third-party interference.",
    chartData: [{ value: 2900 }, { value: 2910 }, { value: 2920 }, { value: 2930 }, { value: 2940 }, { value: 2955 }, { value: 2965 }, { value: 2970 }, { value: 2970.09 }],
  },
  SOL: {
    name: "Solana",
    symbol: "SOL",
    price: 123.68,
    change24h: -0.42,
    marketCap: 56000000000,
    volume24h: 4200000000,
    supply: 453000000,
    maxSupply: null,
    description: "Solana is a fast, secure and sustainable blockchain that provides the infrastructure for Web3.",
    chartData: [{ value: 125 }, { value: 124.5 }, { value: 124 }, { value: 123.8 }, { value: 123.7 }, { value: 123.68 }, { value: 123.68 }, { value: 123.68 }, { value: 123.68 }],
  },
  BNB: {
    name: "Binance Coin",
    symbol: "BNB",
    price: 631.42,
    change24h: 0.85,
    marketCap: 95000000000,
    volume24h: 1800000000,
    supply: 150000000,
    maxSupply: 200000000,
    description: "Binance Coin (BNB) is the native cryptocurrency of the Binance ecosystem.",
    chartData: [{ value: 625 }, { value: 626 }, { value: 627 }, { value: 628 }, { value: 629 }, { value: 630 }, { value: 630.5 }, { value: 631 }, { value: 631.42 }],
  },
  USDT: {
    name: "Tether",
    symbol: "USDT",
    price: 1.00,
    change24h: 0.00,
    marketCap: 143000000000,
    volume24h: 82000000000,
    supply: 143000000000,
    maxSupply: null,
    description: "Tether (USDT) is a stablecoin that aims to keep the value of 1 token equal to 1 US Dollar.",
    chartData: [{ value: 1.00 }, { value: 1.00 }, { value: 1.00 }, { value: 1.00 }, { value: 1.00 }, { value: 1.00 }, { value: 1.00 }, { value: 1.00 }, { value: 1.00 }],
  },
};

export default function ExplorerAsset() {
  const location = useLocation();
  const symbol = location[0].split('/').pop()?.toUpperCase() || '';
  const asset = assetData[symbol];

  if (!asset) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Link href="/explorer/prices">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">Asset not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isPositive = asset.change24h >= 0;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/explorer/prices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-sm text-muted-foreground">PRICES &gt; {symbol}</h1>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold">
              {symbol[0]}
            </div>
            <div>
              <h2 className="text-4xl font-bold">{asset.name}</h2>
              <p className="text-muted-foreground text-lg">{asset.symbol}</p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl">{asset.description}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">CURRENT PRICE</p>
                  <p className="text-4xl font-bold">${asset.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className={`flex items-center gap-1 px-3 py-2 rounded-lg ${isPositive ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {isPositive ? (
                    <TrendingUp className={`h-5 w-5 text-success`} />
                  ) : (
                    <TrendingDown className={`h-5 w-5 text-destructive`} />
                  )}
                  <span className={`text-lg font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                    {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>24h Price Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={asset.chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="value" hide />
                  <YAxis hide domain="dataMin-5% dataMax+5%" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value) => `$${value.toFixed(2)}`} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">MARKET CAPITALIZATION</p>
              <p className="text-2xl font-bold">${(asset.marketCap / 1000000000).toFixed(0)}B</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">24H TRADING VOLUME</p>
              <p className="text-2xl font-bold">${(asset.volume24h / 1000000000).toFixed(1)}B</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">CIRCULATING SUPPLY</p>
              <p className="text-2xl font-bold">{(asset.supply / 1000000).toFixed(0)}M {symbol}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">MAX SUPPLY</p>
              <p className="text-2xl font-bold">
                {asset.maxSupply ? `${(asset.maxSupply / 1000000).toFixed(0)}M ${symbol}` : 'Unlimited'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card variant="default">
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Asset
                </span>
                <span className="font-bold">{asset.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Symbol
                </span>
                <code className="font-mono text-sm">{asset.symbol}</code>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Current Price</span>
                <span className="font-bold">${asset.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">24h Change</span>
                <span className={`font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
