import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchema, marketsPageSchema } from "@/hooks/use-schema";
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
  useSchema(marketsPageSchema, "markets-page-schema");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("spot");
  const [selectedQuote, setSelectedQuote] = useState("All");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [mainTab, setMainTab] = useState("overview");

  const filteredPairs = marketPairs.filter(pair => {
    const matchesSearch = pair.pair.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesQuote = selectedQuote === "All" || pair.pair.includes(selectedQuote);
    return matchesSearch && matchesQuote;
  });

  const favoritesPairs = filteredPairs.filter(pair => pair.isFavorite);

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 pt-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Main Tabs Header */}
        <div className="bg-white border-b mb-6 rounded-t-xl overflow-hidden">
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList className="w-full justify-start h-14 bg-transparent p-0 px-6 gap-8">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-0 font-bold text-base"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="key-metrics"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-0 font-bold text-base text-muted-foreground"
              >
                Key Metrics
              </TabsTrigger>
              <TabsTrigger 
                value="contract-data"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-0 font-bold text-base text-muted-foreground"
              >
                Contract Data
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Market Sentiment */}
          <Card className="bg-white border-none shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Market Sentiment</CardTitle>
              <Button variant="link" className="text-primary font-bold p-0 flex items-center gap-1">
                View More <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <div className="relative w-48 h-24 mb-4">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
                  <path d="M10,50 A40,40 0 0,1 50,10" fill="none" stroke="#22C55E" strokeWidth="8" strokeLinecap="round" />
                  <path d="M50,10 A40,40 0 0,1 90,50" fill="none" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="3" fill="#0F172A" />
                  <line x1="50" y1="50" x2="40" y2="25" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" transform="rotate(-15 50 50)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                  <span className="text-3xl font-bold text-primary">44</span>
                  <span className="text-xs font-bold text-muted-foreground">Neutral</span>
                </div>
              </div>
              <div className="w-full flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4">
                <span>Long</span>
                <span>Short</span>
              </div>
            </CardContent>
          </Card>

          {/* Market Data */}
          <Card className="bg-white border-none shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Market Data</CardTitle>
              <Button variant="link" className="text-primary font-bold p-0 flex items-center gap-1">
                View More <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Current ETH Gas Price</p>
                <p className="text-sm font-bold">0.034972676 Gwei ≈ <span className="text-muted-foreground">0.002 USD</span></p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Trading Vol.</p>
                <div className="flex items-end gap-3">
                  <span className="text-lg font-bold text-red-500">-25.65%</span>
                  <span className="text-lg font-bold">529.48 B USD</span>
                  <div className="h-10 w-24 bg-red-500/10 rounded overflow-hidden">
                    <svg viewBox="0 0 100 40" className="w-full h-full">
                      <path d="M0,40 L20,30 L40,35 L60,15 L80,25 L100,5" fill="none" stroke="#EF4444" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trending Sectors */}
          <Card className="bg-white border-none shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Trending Sectors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Privacy Coins", change: "16.55%", coin: "ROSE", coinPrice: "44.26%" },
                { name: "AI", change: "12.80%", coin: "ROSE", coinPrice: "44.26%" },
                { name: "Pantera Portfolio", change: "7.79%", coin: "ROSE", coinPrice: "44.26%" },
                { name: "Polychain Portfolio", change: "7.37%", coin: "ROSE", coinPrice: "44.26%" },
              ].map((sector, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{sector.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-green-500">{sector.change}</span>
                    <span className="text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded uppercase tracking-tighter w-24 text-right">
                      {sector.coin} <span className="text-green-500">{sector.coinPrice}</span>
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Markets Table Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-20">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">Markets</h2>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-[#F9FAFB] border-none font-medium"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start h-12 bg-transparent p-0 border-none gap-6 mb-6">
                {["Favorites", "Spot", "Derivatives", "TradFi", "Newly Listed"].map((tab) => (
                  <TabsTrigger 
                    key={tab} 
                    value={tab.toLowerCase()} 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 h-full font-bold text-sm text-muted-foreground"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="spot" className="mt-0 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Top Gainers</h4>
                    <div className="space-y-3">
                      {[
                        { pair: "ROSE/USDT", price: "0.01897", change: "+44.26%" },
                        { pair: "RESOLV/USDT", price: "0.1026", change: "+41.13%" },
                        { pair: "SERAPH/USDT", price: "0.01426", change: "+37.12%" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm font-bold">
                          <span className="text-slate-700">{item.pair}</span>
                          <div className="flex gap-4">
                            <span>{item.price}</span>
                            <span className="text-green-500">{item.change}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Newly Listed</h4>
                    <div className="space-y-3">
                      {[
                        { pair: "LIT/USDT", price: "1.664", change: "-7.04%" },
                        { pair: "FOGO/USDT", price: "0.03142", change: "+2.11%" },
                        { pair: "FRAX/USDT", price: "1.1432", change: "-0.22%" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm font-bold">
                          <span className="text-slate-700">{item.pair}</span>
                          <div className="flex gap-4">
                            <span>{item.price}</span>
                            <span className={`${item.change.startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>{item.change}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Trending</h4>
                    <div className="space-y-3">
                      {[
                        { pair: "BTC/USDT", price: "92,731", change: "-0.01%" },
                        { pair: "ETH/USDT", price: "3,194.25", change: "-1.49%" },
                        { pair: "SOL/USDT", price: "133.56", change: "-0.48%" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm font-bold">
                          <span className="text-slate-700">{item.pair}</span>
                          <div className="flex gap-4">
                            <span>{item.price}</span>
                            <span className={`${item.change.startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>{item.change}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 py-2">
                  {["All", "USDC", "USDT", "USDE", "MNT", "USD1", "EUR", "BRL", "PLN", "TRY", "SOL", "BTC", "ETH", "DAI", "XUSD", "RLUSD"].map(c => (
                    <Button key={c} variant="ghost" size="sm" className="h-8 font-bold text-xs text-muted-foreground px-3">{c}</Button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 pb-4">
                  {["All", "0 Fees", "Margin Trading", "SOL Ecosystem", "ETH Ecosystem", "BTC Ecosystem", "AI", "Modular-BCs", "DePIN", "DeFi", "GameFi", "Meme", "PoW", "Launchpad"].map(f => (
                    <Button key={f} variant="secondary" size="sm" className={`h-8 font-bold text-xs px-3 rounded-full ${f === "All" ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>{f}</Button>
                  ))}
                </div>

                <MarketList pairs={filteredPairs} />

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2 mt-8 py-4">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {[1, 2, 3, 4].map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      className={`h-9 w-9 rounded-lg font-bold ${currentPage === page ? 'bg-primary' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <span className="text-sm font-bold text-muted-foreground">...</span>
                  <Button variant="ghost" size="sm" className="h-9 font-bold" onClick={() => setCurrentPage(34)}>
                    34
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketList({ pairs }: { pairs: MarketPair[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-left border-b bg-[#F9FAFB]/50">
            <th className="p-4">Trading Pairs</th>
            <th className="p-4">Last Traded Price</th>
            <th className="p-4">24H Change %</th>
            <th className="p-4 hidden md:table-cell">24H High</th>
            <th className="p-4 hidden md:table-cell">24H Low</th>
            <th className="p-4 hidden lg:table-cell">24H Trading Volume</th>
            <th className="p-4">Charts</th>
            <th className="p-4 text-right">Trade</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {pairs.map((pair) => (
            <tr key={pair.id} className="group hover:bg-[#F9FAFB] transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <Star className={`h-4 w-4 cursor-pointer ${pair.isFavorite ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-lg">{pair.icon}</div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{pair.pair}</span>
                        {pair.leverage && <Badge className="bg-orange-100 text-orange-600 border-none font-bold text-[10px] h-4 py-0">{pair.leverage}</Badge>}
                        {pair.fees && <Badge className="bg-primary/10 text-primary border-none font-bold text-[10px] h-4 py-0">0 fees</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-4 font-bold text-slate-900">{pair.price.toLocaleString()}</td>
              <td className={`p-4 font-bold ${pair.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                {pair.change24h >= 0 ? "+" : ""}{pair.change24h}%
              </td>
              <td className="p-4 font-bold text-slate-700 hidden md:table-cell">{(pair.price * 1.05).toFixed(2)}</td>
              <td className="p-4 font-bold text-slate-700 hidden md:table-cell">{(pair.price * 0.95).toFixed(2)}</td>
              <td className="p-4 font-bold text-slate-500 hidden lg:table-cell">{pair.volume || "585.59M(USDT)"}</td>
              <td className="p-4">
                <div className="w-16 h-8 rounded overflow-hidden">
                  <svg viewBox="0 0 100 40" className="w-full h-full">
                    <path 
                      d="M0,40 L10,35 L20,38 L30,25 L40,30 L50,10 L60,15 L70,5 L80,12 L90,8 L100,2" 
                      fill="none" 
                      stroke={pair.change24h >= 0 ? "#22C55E" : "#EF4444"} 
                      strokeWidth="2" 
                    />
                  </svg>
                </div>
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <Button variant="link" className="text-xs font-bold text-muted-foreground p-0 h-auto">Details</Button>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 h-9 rounded-lg">Trade</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
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
