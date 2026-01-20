import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchema, marketsPageSchema } from "@/hooks/use-schema";
import { Badge } from "@/components/ui/badge";
import { Search, Star, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function MarketsPage() {
  useSchema(marketsPageSchema, "markets-page-schema");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("spot");
  const [currentPage, setCurrentPage] = useState(1);
  const [mainTab, setMainTab] = useState("overview");
  const [contractSubTab, setContractSubTab] = useState("perpetual");

  const filteredPairs = useMemo(() => marketPairs.filter(pair => {
    return pair.pair.toLowerCase().includes(searchQuery.toLowerCase());
  }), [searchQuery]);

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 pt-4">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="bg-white border-b mb-4 rounded-t-xl overflow-hidden">
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList className="w-full justify-start h-14 bg-transparent p-0 px-6 gap-8">
              <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-0 font-bold text-base">Overview</TabsTrigger>
              <TabsTrigger value="key-metrics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-0 font-bold text-base">Key Metrics</TabsTrigger>
              <TabsTrigger value="contract-data" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full px-0 font-bold text-base">Contract Data</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {mainTab === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white border-none shadow-sm rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold text-slate-700">Market Sentiment</CardTitle>
                  <Button variant="link" className="text-primary font-bold p-0 flex items-center gap-1">View More <ChevronRight className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-6">
                  <div className="relative w-48 h-24 mb-4">
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
                      <path d="M10,50 A40,40 0 0,1 50,10" fill="none" stroke="#22C55E" strokeWidth="8" strokeLinecap="round" />
                      <path d="M50,10 A40,40 0 0,1 90,50" fill="none" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                      <span className="text-3xl font-bold text-primary">44</span>
                      <span className="text-xs font-bold text-muted-foreground">Neutral</span>
                    </div>
                  </div>
                  <div className="w-full flex justify-between text-[10px] font-bold text-muted-foreground mt-2 px-4">
                    <div className="flex flex-col items-start"><span className="text-green-500">25</span><span>Long</span></div>
                    <div className="flex flex-col items-end"><span className="text-red-500">75</span><span>Short</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-none shadow-sm rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold text-slate-700">Market Data</CardTitle>
                  <Button variant="link" className="text-primary font-bold p-0 flex items-center gap-1">View More <ChevronRight className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Current ETH Gas Price</p>
                    <p className="text-sm font-bold text-slate-900">0.034972676 Gwei ≈ <span className="text-muted-foreground">0.002 USD</span></p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Trading Vol.</p>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-red-500">-25.65%</span>
                      <span className="text-lg font-bold text-slate-900">529.48 B USD</span>
                    </div>
                    <div className="h-8 mt-2 w-full bg-red-50/30 rounded overflow-hidden">
                      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full opacity-50">
                        <path d="M0,40 L20,35 L40,38 L60,25 L80,30 L100,20 L100,40 Z" fill="#FEE2E2" />
                        <path d="M0,40 L20,35 L40,38 L60,25 L80,30 L100,20" fill="none" stroke="#EF4444" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-none shadow-sm rounded-xl">
                <CardHeader><CardTitle className="text-lg font-bold text-slate-700">Trending Sectors</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Privacy Coins", change: "16.55%", coin: "ROSE", coinPrice: "44.26%" },
                    { name: "AI", change: "12.80%", coin: "ROSE", coinPrice: "44.26%" },
                    { name: "Pantera Portfolio", change: "7.79%", coin: "ROSE", coinPrice: "44.26%" },
                    { name: "Polychain Portfolio", change: "7.37%", coin: "ROSE", coinPrice: "44.26%" }
                  ].map((sector, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{sector.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-green-500">{sector.change}</span>
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded uppercase tracking-tighter w-24 text-right">
                          {sector.coin} <span className="text-green-500">{sector.coinPrice}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-20">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold">Markets</h2>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-[#F9FAFB] border-none font-medium" />
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start h-12 bg-transparent p-0 border-none gap-6 mb-6">
                    {["Favorites", "Spot", "Derivatives", "TradFi", "Newly Listed"].map((tab) => (
                      <TabsTrigger key={tab} value={tab.toLowerCase()} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 h-full font-bold text-sm text-muted-foreground">{tab}</TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <TabsContent value="spot" className="mt-0 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b">
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Top Gainers</h4>
                        <div className="space-y-3">
                          {[{ pair: "ROSE/USDT", price: "0.01897", change: "+44.26%" }, { pair: "RESOLV/USDT", price: "0.1026", change: "+41.13%" }, { pair: "SERAPH/USDT", price: "0.01426", change: "+37.12%" }].map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm font-bold">
                              <span className="text-slate-700">{item.pair}</span>
                              <div className="flex gap-4"><span>{item.price}</span><span className="text-green-500">{item.change}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Newly Listed</h4>
                        <div className="space-y-3">
                          {[{ pair: "LIT/USDT", price: "1.663", change: "-7.09%" }, { pair: "FOGO/USDT", price: "0.03142", change: "+2.18%" }, { pair: "FRAX/USDT", price: "1.1432", change: "-0.22%" }].map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm font-bold">
                              <span className="text-slate-700">{item.pair}</span>
                              <div className="flex gap-4"><span>{item.price}</span><span className={`${item.change.startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>{item.change}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Trending</h4>
                        <div className="space-y-3">
                          {[{ pair: "BTC/USDT", price: "92,739.6", change: "--" }, { pair: "ETH/USDT", price: "3,194.96", change: "-1.47%" }, { pair: "SOL/USDT", price: "133.57", change: "-0.47%" }].map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm font-bold">
                              <span className="text-slate-700">{item.pair}</span>
                              <div className="flex gap-4"><span>{item.price}</span><span className={`${item.change === '--' ? 'text-slate-400' : item.change.startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>{item.change}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <MarketList pairs={filteredPairs} />
                    
                    <div className="flex items-center justify-center gap-2 mt-8 py-4 border-t">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                      {[1, 2, 3, 4].map((page) => (
                        <Button key={page} variant={currentPage === page ? "default" : "ghost"} size="sm" className={`h-9 w-9 rounded-lg font-bold ${currentPage === page ? 'bg-primary' : ''}`} onClick={() => setCurrentPage(page)}>{page}</Button>
                      ))}
                      <span className="text-sm font-bold text-muted-foreground">...</span>
                      <Button variant="ghost" size="sm" className="h-9 font-bold" onClick={() => setCurrentPage(34)}>34</Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}

        {mainTab === "key-metrics" && (
          <div className="space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-none shadow-sm rounded-xl">
                <CardHeader className="pb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Market Sentiment</span>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-4">
                  <div className="relative w-40 h-20">
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
                      <path d="M10,50 A40,40 0 0,1 50,10" fill="none" stroke="#22C55E" strokeWidth="8" strokeLinecap="round" />
                      <path d="M50,10 A40,40 0 0,1 90,50" fill="none" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                      <span className="text-2xl font-bold text-primary">44</span>
                      <span className="text-[10px] font-bold text-muted-foreground">Neutral</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-none shadow-sm rounded-xl">
                <CardHeader className="pb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">Market Cap <ExternalLink className="h-3 w-3" /></span>
                </CardHeader>
                <CardContent>
                  <div className="text-red-500 text-lg font-bold">-2.77%</div>
                  <div className="text-slate-900 font-bold">3362.53 B USD</div>
                  <div className="h-8 mt-2 w-full bg-red-50/50 rounded overflow-hidden">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                      <path d="M0,40 L20,35 L40,38 L60,25 L80,30 L100,20 L100,40 Z" fill="#FEE2E2" />
                      <path d="M0,40 L20,35 L40,38 L60,25 L80,30 L100,20" fill="none" stroke="#EF4444" strokeWidth="2" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-none shadow-sm rounded-xl">
                <CardHeader className="pb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">Trading Vol. <ExternalLink className="h-3 w-3" /></span>
                </CardHeader>
                <CardContent>
                  <div className="text-red-500 text-lg font-bold">-25.65%</div>
                  <div className="text-slate-900 font-bold">529.48 B USD</div>
                  <div className="h-8 mt-2 w-full bg-red-50/50 rounded overflow-hidden">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                      <path d="M0,40 L20,38 L40,35 L60,30 L80,32 L100,28 L100,40 Z" fill="#FEE2E2" />
                      <path d="M0,40 L20,38 L40,35 L60,30 L80,32 L100,28" fill="none" stroke="#EF4444" strokeWidth="2" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-none shadow-sm rounded-xl">
                <CardHeader className="pb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current ETH Gas Price</span>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-slate-900">0.038831084 Gwei</div>
                  <div className="text-xs font-bold text-muted-foreground">≈ 0.003 USD</div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Section: Trend Distribution and Top Movers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white border-none shadow-sm rounded-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-700">Price Trend Distribution</CardTitle>
                    <Button variant="link" className="text-xs font-bold text-muted-foreground p-0 flex items-center gap-1">View More <ChevronRight className="h-3 w-3" /></Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-5 w-full rounded-full overflow-hidden mb-6">
                      <div className="bg-red-500 h-full" style={{ width: '85%' }}></div>
                      <div className="bg-slate-300 h-full" style={{ width: '5%' }}></div>
                      <div className="bg-green-500 h-full" style={{ width: '10%' }}></div>
                    </div>
                    <div className="grid grid-cols-3 text-center">
                      <div className="flex flex-col">
                        <span className="text-red-500 text-base font-bold">429</span>
                        <span className="text-[10px] font-bold text-muted-foreground">Down</span>
                      </div>
                      <div className="flex flex-col border-x">
                        <span className="text-slate-700 text-base font-bold">16</span>
                        <span className="text-[10px] font-bold text-muted-foreground">No Change</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-green-500 text-base font-bold">45</span>
                        <span className="text-[10px] font-bold text-muted-foreground">Up</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm rounded-xl">
                  <CardHeader><CardTitle className="text-lg font-bold text-slate-700">Trending Sectors</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: "Privacy Coins", change: "15.77%", coin: "ROSE", coinPrice: "39.92%" },
                      { name: "AI", change: "12.76%", coin: "ROSE", coinPrice: "39.92%" },
                      { name: "Pantera Portfolio", change: "7.88%", coin: "ROSE", coinPrice: "39.92%" },
                      { name: "Polychain Portfolio", change: "7.86%", coin: "ROSE", coinPrice: "39.92%" },
                      { name: "a16z Portfolio", change: "7.51%", coin: "ROSE", coinPrice: "39.92%" },
                      { name: "Rollups", change: "3.89%", coin: "MINA", coinPrice: "7.44%" },
                      { name: "DeFi", change: "3.66%", coin: "RPL", coinPrice: "10.16%" },
                      { name: "Liquid Staking", change: "3.48%", coin: "RPL", coinPrice: "10.16%" }
                    ].map((sector, i) => (
                      <div key={i} className="p-4 bg-[#F9FAFB] rounded-xl border border-transparent hover:border-primary transition-colors cursor-pointer group">
                        <div className="text-xs font-bold text-slate-700 mb-1">{sector.name}</div>
                        <div className="text-green-500 font-bold text-lg mb-1">{sector.change}</div>
                        <div className="text-[10px] font-bold text-muted-foreground flex items-center justify-between">
                          <span>{sector.coin}</span>
                          <span className="text-green-500">{sector.coinPrice}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-white border-none shadow-sm rounded-xl">
                  <CardHeader><CardTitle className="text-lg font-bold text-slate-700">Top Movers</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-[#F9FAFB]/50 border-b">
                          <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3 text-right">Type</th>
                            <th className="px-4 py-3 text-right">24H Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {[
                            { name: "VOOI/USDT", time: "01/20 00:30", type: "15m Gainers", change: "+15.55%" },
                            { name: "VOOI/USDT", time: "01/20 00:28", type: "15m Gainers", change: "+15.55%" },
                            { name: "RESOLV/USDT", time: "01/20 00:23", type: "24h Gainers", change: "+54.29%" },
                            { name: "NAKA/USDT", time: "01/20 00:19", type: "24h Gainers", change: "+36.35%" },
                            { name: "BERA/USDT", time: "01/20 00:10", type: "24h Gainers", change: "+23.65%" },
                            { name: "AXS/USDT", time: "01/20 00:07", type: "15m Gainers", change: "+6.59%" }
                          ].map((mover, i) => (
                            <tr key={i} className="text-xs hover:bg-[#F9FAFB] transition-colors cursor-pointer group">
                              <td className="px-4 py-4">
                                <div className="font-bold text-slate-900">{mover.name}</div>
                                <div className="text-[10px] text-muted-foreground">{mover.time}</div>
                              </td>
                              <td className="px-4 py-4 text-right font-medium text-muted-foreground">{mover.type}</td>
                              <td className="px-4 py-4 text-right font-bold text-green-500">{mover.change}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t">
                      <Button className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold rounded-lg h-12 shadow-sm">Trade</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom Markets Lists */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {[
                { title: "Most Traded", data: [{ p: "BTC/USDT", v: "92,661", c: "+0.10%" }, { p: "ETH/USDT", v: "3,187.38", ch: "-0.65%" }, { p: "USDC/USDT", v: "1.0004", ch: "+0.03%" }, { p: "XRP/USDT", v: "1.9863", ch: "+2.48%" }, { p: "SOL/USDT", v: "133.61", ch: "-0.63%" }] },
                { title: "Trending", data: [{ p: "BTC/USDT", v: "92,661", c: "+0.10%" }, { p: "ETH/USDT", v: "3,187.38", ch: "-0.65%" }, { p: "XRP/USDT", v: "1.9863", ch: "+2.48%" }, { p: "SOL/USDT", v: "133.61", ch: "-0.63%" }, { p: "MNT/USDT", v: "0.9174", ch: "+1.08%" }] },
                { title: "Newly Listed", data: [{ p: "LIT/USDT", v: "1.642", ch: "-8.52%" }, { p: "FOGO/USDT", v: "0.03048", ch: "+3.78%" }, { p: "FRAX/USDT", v: "1.1698", ch: "-3.91%" }, { p: "BREV/USDT", v: "0.2692", ch: "-3.30%" }, { p: "WHITEWHALE/USDT", v: "0.03953", ch: "-40.61%" }] }
              ].map((list, i) => (
                <Card key={i} className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 bg-[#F9FAFB]/50 border-b">
                    <CardTitle className="text-base font-bold">{list.title}</CardTitle>
                    <Select defaultValue="spot">
                      <SelectTrigger className="w-[80px] h-7 bg-white border-none text-[10px] font-bold">
                        <SelectValue placeholder="Spot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spot">Spot</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-left">
                      <thead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b">
                        <tr><th className="px-4 py-2">Market</th><th className="px-4 py-2 text-right">Price</th><th className="px-4 py-2 text-right">24H Change</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {list.data.map((item, j) => (
                          <tr key={j} className="text-xs hover:bg-[#F9FAFB] transition-colors cursor-pointer">
                            <td className="px-4 py-3 font-bold text-slate-700 flex items-center gap-2">
                              <span className="text-muted-foreground/50 w-3">{j + 1}</span>
                              {item.p}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">{item.v}</td>
                            <td className={`px-4 py-3 text-right font-bold ${(item.c || item.ch).startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>{item.c || item.ch}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {mainTab === "contract-data" && (
          <div className="space-y-6">
            <div className="flex items-center gap-8 mb-6">
              {["Perpetual", "Futures", "Options"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setContractSubTab(tab.toLowerCase())}
                  className={`text-xl font-bold transition-colors ${contractSubTab === tab.toLowerCase() ? "text-slate-900" : "text-muted-foreground"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-sm font-bold text-primary border-b-2 border-primary w-fit pb-1">Trading Data</h3>
                    <div className="flex items-center gap-3">
                      <Select defaultValue="usdt-based">
                        <SelectTrigger className="w-[140px] h-9 bg-[#F9FAFB] border-none font-bold text-xs">
                          <SelectValue placeholder="USDT-based" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usdt-based">USDT-based</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="btcusdt">
                        <SelectTrigger className="w-[140px] h-9 bg-[#F9FAFB] border-none font-bold text-xs">
                          <SelectValue placeholder="BTCUSDT" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="btcusdt">BTCUSDT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg px-6">Trade Now</Button>
                </div>

                <div className="pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold">Open Interest</h4>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Select defaultValue="5m">
                      <SelectTrigger className="w-[80px] h-8 bg-[#F9FAFB] border-none font-bold text-xs">
                        <SelectValue placeholder="5m" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5m">5m</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="h-[300px] w-full bg-slate-50/30 rounded-lg flex flex-col justify-end p-4 border relative">
                    <div className="absolute top-4 left-4 text-[10px] font-bold text-muted-foreground space-y-8">
                      <div>49.91K</div><div>45.70K</div><div>41.49K</div><div>37.27K</div><div>33.06K</div><div>28.85K</div><div>24.64K</div>
                    </div>
                    <div className="flex items-end justify-between h-48 px-12">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="w-1.5 bg-slate-400 rounded-t h-20"></div>
                      ))}
                    </div>
                    <div className="w-full h-[1px] bg-slate-300 relative my-2">
                      <div className="absolute top-[-40px] w-full h-[1px] bg-slate-400/30"></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-12">
                      <span>14:10</span><span>14:40</span><span>15:10</span><span>15:40</span><span>16:05</span><span>16:35</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4 text-[10px] font-bold text-muted-foreground">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Open Interest</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Notional Value of Open Interest</div>
                    </div>
                  </div>
                </div>

                <div className="pt-12">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold">Top 100 Trader Long/Short Ratio</h4>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Select defaultValue="5m">
                      <SelectTrigger className="w-[80px] h-8 bg-[#F9FAFB] border-none font-bold text-xs">
                        <SelectValue placeholder="5m" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5m">5m</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="h-[300px] w-full bg-slate-50/30 rounded-lg flex flex-col justify-end p-4 border">
                    <div className="flex items-end justify-between h-48 px-12">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="w-2 flex flex-col h-full justify-end">
                          <div className="bg-green-500 w-full h-24 rounded-t"></div>
                          <div className="bg-red-500 w-full h-20"></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-12 mt-2">
                      <span>14:10</span><span>14:40</span><span>15:10</span><span>15:40</span><span>16:05</span><span>16:35</span>
                    </div>
                  </div>
                </div>

                <div className="pt-12">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold">Active Trading Volume</h4>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="5m">
                        <SelectTrigger className="w-[80px] h-8 bg-[#F9FAFB] border-none font-bold text-xs">
                          <SelectValue placeholder="5m" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5m">5m</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex bg-[#F9FAFB] rounded-lg p-0.5">
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold bg-white shadow-sm">Notional</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-muted-foreground">Contract</Button>
                      </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full bg-slate-50/30 rounded-lg flex flex-col justify-end p-4 border relative">
                    <div className="absolute inset-0 flex items-center px-12">
                      <div className="w-full h-[1px] bg-slate-300"></div>
                    </div>
                    <div className="flex items-center justify-between px-12 h-48 relative">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const h = Math.random() * 40 + 10;
                        const isPos = Math.random() > 0.4;
                        return (
                          <div key={i} className="w-1.5 flex flex-col items-center">
                            {isPos ? <div className="bg-green-500 w-full rounded-t" style={{ height: `${h}px` }}></div> : <div className="h-[1px]"></div>}
                            <div className="h-[1px]"></div>
                            {!isPos ? <div className="bg-red-500 w-full rounded-b" style={{ height: `${h}px` }}></div> : <div className="h-[1px]"></div>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-12 mt-2">
                      <span>14:10</span><span>14:40</span><span>15:10</span><span>15:40</span><span>16:05</span><span>16:35</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketList({ pairs }: { pairs: MarketPair[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b bg-[#F9FAFB]/50">
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
                    <path d="M0,40 L10,35 L20,38 L30,25 L40,30 L50,10 L60,15 L70,5 L80,12 L90,8 L100,2" fill="none" stroke={pair.change24h >= 0 ? "#22C55E" : "#EF4444"} strokeWidth="2" />
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
