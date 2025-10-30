
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Star, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";

interface MarketPair {
  id: string;
  symbol: string;
  pair: string;
  icon: string;
  price: number;
  change24h: number;
  leverage?: string;
  fees?: boolean;
  isFavorite: boolean;
  volume?: string;
}

const marketPairs: MarketPair[] = [
  { id: "1", symbol: "BTC", pair: "BTC/USDT", icon: "₿", price: 110553.3, change24h: -1.78, leverage: "10X", isFavorite: true },
  { id: "2", symbol: "ETH", pair: "ETH/USDT", icon: "Ξ", price: 3920.26, change24h: -1.59, leverage: "10X", isFavorite: true },
  { id: "3", symbol: "USDC", pair: "USDC/USDT", icon: "⊙", price: 0.9998, change24h: -0.01, leverage: "10X", fees: true, isFavorite: false },
  { id: "4", symbol: "SOL", pair: "SOL/USDT", icon: "◎", price: 194.42, change24h: 0.12, leverage: "10X", isFavorite: false },
  { id: "5", symbol: "TRUMP", pair: "TRUMP/USDT", icon: "🇺🇸", price: 8.53, change24h: 15.27, leverage: "10X", isFavorite: false },
  { id: "6", symbol: "ENSO", pair: "ENSO/USDT", icon: "⚡", price: 1.609, change24h: -5.02, isFavorite: false },
  { id: "7", symbol: "XAUT", pair: "XAUT/USDT", icon: "🪙", price: 3957.6, change24h: -0.33, leverage: "10X", isFavorite: false },
  { id: "8", symbol: "PUMP", pair: "PUMP/USDT", icon: "💎", price: 0.005215, change24h: 13.59, leverage: "10X", isFavorite: false },
  { id: "9", symbol: "XPL", pair: "XPL/USDT", icon: "🔷", price: 0.3306, change24h: -9.03, leverage: "10X", isFavorite: false },
  { id: "10", symbol: "ASTER", pair: "ASTER/USDT", icon: "⭐", price: 1.022, change24h: -4.80, leverage: "10X", isFavorite: false },
  { id: "11", symbol: "BNB", pair: "BNB/USDT", icon: "💛", price: 1117.9, change24h: 1.30, leverage: "10X", isFavorite: false },
  { id: "12", symbol: "STETH", pair: "STETH/USDT", icon: "💧", price: 3920.32, change24h: -1.54, isFavorite: false },
];

const trendingSectors = [
  { name: "Paradigm Portfolio", change: "1.61%", topCoin: "DYDX", topCoinChange: "4.21%" },
  { name: "Zero Knowledge", change: "1.46%", topCoin: "CELO", topCoinChange: "3.98%" },
  { name: "DCG Portfolio", change: "1.35%", topCoin: "ZEN", topCoinChange: "3.86%" },
  { name: "DEX", change: "1.25%", topCoin: "DYDX", topCoinChange: "4.21%" },
  { name: "Layer 2 (L2)", change: "1.21%", topCoin: "BOBA", topCoinChange: "2.97%" },
  { name: "Liquid Staking", change: "1.17%", topCoin: "FXS", topCoinChange: "2.46%" },
];

const topMovers = [
  { rank: 1, symbol: "BTC", pair: "BTC/USDT", price: 110577.1, change24h: -1.76, type: "Most Traded" },
  { rank: 2, symbol: "RECALL", pair: "RECALL/USDT", price: 0.3882, change24h: -3.00, type: "Most Traded" },
  { rank: 3, symbol: "ETH", pair: "ETH/USDT", price: 3925.36, change24h: -1.44, type: "Most Traded" },
  { rank: 4, symbol: "USDC", pair: "USDC/USDT", price: 0.9998, change24h: 0, type: "Most Traded" },
  { rank: 5, symbol: "SOL", pair: "SOL/USDT", price: 194.55, change24h: 0.18, type: "Most Traded" },
  { rank: 6, symbol: "HYPE", pair: "HYPE/USDT", price: 47.82, change24h: -0.02, type: "Most Traded" },
];

const topGainers = [
  { rank: 1, symbol: "EAT", pair: "EAT/USDT", price: 0.046, change24h: 53.33 },
  { rank: 2, symbol: "OL", pair: "OL/USDT", price: 0.04194, change24h: 45.87 },
  { rank: 3, symbol: "AURORA", pair: "AURORA/USDT", price: 0.07243, change24h: 42.13 },
  { rank: 4, symbol: "PUMP", pair: "PUMP/MNT", price: 0.0033, change24h: 16.12 },
  { rank: 5, symbol: "AO", pair: "AO/USDT", price: 5.4, change24h: 15.95 },
  { rank: 6, symbol: "TRUMP", pair: "TRUMP/MNT", price: 5.32, change24h: 15.47 },
];

export default function MarketsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("spot");
  const [selectedQuote, setSelectedQuote] = useState("All");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPairs = marketPairs.filter(pair => {
    const matchesSearch = pair.pair.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesQuote = selectedQuote === "All" || pair.pair.includes(selectedQuote);
    return matchesSearch && matchesQuote;
  });

  const favoritesPairs = filteredPairs.filter(pair => pair.isFavorite);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-16 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Markets</h1>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Main Tabs */}
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="spot">Spot</TabsTrigger>
              <TabsTrigger value="derivatives">Derivatives</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
            </TabsList>

            <TabsContent value="favorites" className="mt-0">
              <div className="flex gap-2 mb-4">
                <Button
                  variant={selectedFilter === "All" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter("All")}
                >
                  All
                </Button>
                <Button
                  variant={selectedFilter === "xStocks" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter("xStocks")}
                >
                  xStocks
                </Button>
                <Button
                  variant={selectedFilter === "0 Fees" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter("0 Fees")}
                >
                  0 Fees
                </Button>
                <Button
                  variant={selectedFilter === "Margin Trading" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter("Margin Trading")}
                >
                  Margin Trading
                </Button>
              </div>

              <MarketList pairs={favoritesPairs} />
            </TabsContent>

            <TabsContent value="spot" className="mt-0">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {["All", "USDT", "USDC", "USDE", "MNT", "USD1", "ETH"].map((quote) => (
                  <Button
                    key={quote}
                    variant={selectedQuote === quote ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedQuote(quote)}
                  >
                    {quote}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <Button
                  variant={selectedFilter === "All" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter("All")}
                >
                  All
                </Button>
                <Button
                  variant={selectedFilter === "xStocks" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter("xStocks")}
                >
                  xStocks
                </Button>
                <Button
                  variant={selectedFilter === "0 Fees" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter("0 Fees")}
                >
                  0 Fees
                </Button>
                <Button
                  variant={selectedFilter === "Margin Trading" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter("Margin Trading")}
                >
                  Margin Trading
                </Button>
              </div>

              <MarketList pairs={filteredPairs} />

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button variant="ghost" size="icon" disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[1, 2, 3, 4].map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <span className="text-sm text-muted-foreground">...</span>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(34)}>
                  34
                </Button>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="derivatives" className="mt-0">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Derivatives markets coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="trading" className="mt-0">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Trading view coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Key Metrics Tab Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Trending Sectors */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Trending Sectors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingSectors.map((sector, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="font-semibold mb-2">{sector.name}</div>
                  <div className="text-2xl font-bold text-green-600 mb-2">{sector.change}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{sector.topCoin}</span>
                    <span className="text-green-600">{sector.topCoinChange}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Top Movers */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Most Traded</h2>
            <Select defaultValue="spot">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spot">Spot</SelectItem>
                <SelectItem value="derivatives">Derivatives</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-sm text-muted-foreground">
                      <th className="text-left p-4">Market</th>
                      <th className="text-right p-4">Price</th>
                      <th className="text-right p-4">24H Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMovers.map((mover) => (
                      <tr key={mover.rank} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{mover.rank}</span>
                            <span className="font-semibold">{mover.symbol}</span>
                            <span className="text-muted-foreground text-sm">/{mover.pair.split('/')[1]}</span>
                          </div>
                        </td>
                        <td className="text-right p-4 font-medium">{mover.price.toLocaleString()}</td>
                        <td className={`text-right p-4 font-medium ${mover.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {mover.change24h >= 0 ? '+' : ''}{mover.change24h}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Trending */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Trending</h2>
            <Select defaultValue="spot">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spot">Spot</SelectItem>
                <SelectItem value="derivatives">Derivatives</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-sm text-muted-foreground">
                      <th className="text-left p-4">Market</th>
                      <th className="text-right p-4">Price</th>
                      <th className="text-right p-4">24H Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMovers.slice(0, 4).map((mover) => (
                      <tr key={mover.rank} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{mover.rank}</span>
                            <span className="font-semibold">{mover.symbol}</span>
                            <span className="text-muted-foreground text-sm">/{mover.pair.split('/')[1]}</span>
                          </div>
                        </td>
                        <td className="text-right p-4 font-medium">{mover.price.toLocaleString()}</td>
                        <td className={`text-right p-4 font-medium ${mover.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {mover.change24h >= 0 ? '+' : ''}{mover.change24h}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Top Gainers */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Top Gainers</h2>
            <Select defaultValue="spot">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spot">Spot</SelectItem>
                <SelectItem value="derivatives">Derivatives</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-sm text-muted-foreground">
                      <th className="text-left p-4">Market</th>
                      <th className="text-right p-4">Price</th>
                      <th className="text-right p-4">24H Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topGainers.map((gainer) => (
                      <tr key={gainer.rank} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{gainer.rank}</span>
                            <span className="font-semibold">{gainer.symbol}</span>
                            <span className="text-muted-foreground text-sm">/{gainer.pair.split('/')[1]}</span>
                          </div>
                        </td>
                        <td className="text-right p-4 font-medium">{gainer.price.toLocaleString()}</td>
                        <td className="text-right p-4 font-medium text-green-600">
                          +{gainer.change24h}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function MarketList({ pairs }: { pairs: MarketPair[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-sm text-muted-foreground">
                <th className="text-left p-4">Trading Pairs</th>
                <th className="text-right p-4">Last Traded Price/24H Change %</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((pair) => (
                <tr key={pair.id} className="border-b hover:bg-muted/50 cursor-pointer">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Star className={`h-4 w-4 ${pair.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{pair.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{pair.pair}</span>
                            {pair.leverage && (
                              <Badge variant="secondary" className="text-xs">
                                {pair.leverage}
                              </Badge>
                            )}
                            {pair.fees && (
                              <Badge variant="outline" className="text-xs text-green-600">
                                0 fees
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right p-4">
                    <div className="font-semibold">{pair.price.toLocaleString()}</div>
                    <div className={`text-sm ${pair.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pair.change24h >= 0 ? '+' : ''}{pair.change24h}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
