import { useState, useEffect } from "react";
import { Search, Menu, X, TrendingUp, TrendingDown, Box, ArrowRightLeft, ArrowRight, Github, Twitter, Database, Loader, Zap, Activity } from "lucide-react";
import { PexlyIcon } from "@/components/pexly-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from "recharts";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import {
  getLatestBlocks, getStats, formatHash, formatTimestamp,
  getBlock, getTransaction, getAddress, setBlockchain, getBlockchain,
  getLiveCoinPrices, getCoinPriceHistory, getMiningPoolDistribution, getLiveNetworkStats,
  type LiveCoinData, type PoolEntry, type LiveNetworkStat,
} from "@/lib/blockchain-api";
import { getMempoolTransactions } from "@/lib/mempool-api";
import { Link, useLocation } from "wouter";

// ==================== TYPES ====================

interface FormattedBlock {
  number: number;
  hash: string;
  date: string;
  time: string;
  txns: number;
  size: string;
}

// ==================== STATIC DATA ====================

const navLinks = [
  { name: "Home", href: "/explorer" },
  { name: "Prices", href: "/explorer/prices" },
  { name: "Blocks", href: "/explorer/blocks" },
  { name: "Transactions", href: "/explorer/transactions" },
];

const TICKER_SYMBOLS = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'BNB', 'XRP', 'ADA'];
const PRICE_LIST_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'USDC', 'USDT'];

// ==================== COMPONENTS ====================

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentChain = getBlockchain();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <PexlyIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Pexly Explorer</span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            link.href.startsWith('/') ? (
              <Link key={link.name} href={link.href}>
                <span className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted cursor-pointer">
                  {link.name}
                </span>
              </Link>
            ) : (
              <a key={link.name} href={link.href} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
                {link.name}
              </a>
            )
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border bg-muted/40">
            <span className="text-xs text-muted-foreground px-1">Chain:</span>
            <Button variant={currentChain === 'BTC' ? 'default' : 'ghost'} size="sm" className="h-7 px-2.5 text-xs" onClick={() => { setBlockchain('BTC'); window.location.reload(); }}>BTC</Button>
            <Button variant={currentChain === 'ETH' ? 'default' : 'ghost'} size="sm" className="h-7 px-2.5 text-xs" onClick={() => { setBlockchain('ETH'); window.location.reload(); }}>ETH</Button>
          </div>
          <Button variant="default" className="hidden md:flex h-9 text-sm">Connect Wallet</Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-up">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              link.href.startsWith('/') ? (
                <Link key={link.name} href={link.href}>
                  <span className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted block cursor-pointer" onClick={() => setMobileOpen(false)}>
                    {link.name}
                  </span>
                </Link>
              ) : (
                <a key={link.name} href={link.href} className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted" onClick={() => setMobileOpen(false)}>
                  {link.name}
                </a>
              )
            ))}
            <Button variant="default" className="mt-2">Connect Wallet</Button>
          </nav>
        </div>
      )}
    </header>
  );
};

const PriceTicker = ({ coins }: { coins: LiveCoinData[] }) => {
  if (coins.length === 0) return null;
  const items = [...coins, ...coins, ...coins];
  return (
    <div className="w-full overflow-hidden border-b border-border bg-card/60 backdrop-blur-sm py-3">
      <div className="flex ticker-scroll">
        {items.map((item, index) => (
          <div key={`${item.symbol}-${index}`} className="flex items-center gap-3 px-5 border-r border-border/30 whitespace-nowrap">
            <span className="font-semibold text-sm text-foreground">{item.symbol}</span>
            <span className="font-medium text-sm text-foreground">
              ${item.price > 0 ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: item.price < 1 ? 4 : 2 }) : '—'}
            </span>
            <span className={`flex items-center gap-0.5 text-xs font-medium ${item.change24h >= 0 ? 'text-[#B4F22E]' : 'text-destructive'}`}>
              {item.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SearchBar = ({ onSearchResults }: { onSearchResults: (results: any) => void }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [, navigate] = useLocation();

  const detectSearchType = (input: string): { type: 'block' | 'tx' | 'address' | 'unknown', chain?: string } => {
    const trimmed = input.trim();
    if (/^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(trimmed)) return { type: 'address', chain: 'BTC' };
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return { type: 'address', chain: 'ETH' };
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) return { type: 'address', chain: 'SOL' };
    if (/^T[a-zA-Z0-9]{33}$/.test(trimmed)) return { type: 'address', chain: 'TRON' };
    if (/^[0-9a-f]{64}$/i.test(trimmed)) return { type: 'tx' };
    if (/^\d+$/.test(trimmed) && trimmed.length <= 10) return { type: 'block', chain: 'BTC' };
    return { type: 'unknown' };
  };

  const handleSearch = async () => {
    if (!query.trim()) { setError('Please enter a search query'); return; }
    setLoading(true); setError('');
    const { type: searchType, chain } = detectSearchType(query.trim());
    try {
      if (searchType === 'block') {
        const data = await getBlock(query.trim());
        if (data) navigate(`/explorer/block/${query.trim()}`);
        else setError('Block not found');
      } else if (searchType === 'tx') {
        const data = await getTransaction(query.trim());
        if (data) navigate(`/explorer/transaction/${query.trim()}`);
        else setError('Transaction not found');
      } else if (searchType === 'address') {
        if (chain === 'BTC') {
          const data = await getAddress(query.trim());
          if (data) navigate(`/explorer/address/${query.trim()}`);
          else setError('Address not found');
        } else {
          setError(`Detected ${chain} address. Pexly Explorer currently supports Bitcoin. Multi-chain support coming soon!`);
        }
      } else {
        setError('Invalid search query. Please enter a valid block hash, transaction hash, or address.');
      }
    } catch (err: any) {
      setError(`Search error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-b-[2.5rem] md:rounded-b-[3.5rem]" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #0f1208 50%, #0a1400 100%)" }}>
      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#B4F22E]/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-[#B4F22E]/6 blur-3xl" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 container py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <p className="text-[#B4F22E]/70 text-xs font-semibold uppercase tracking-widest mb-4">Pexly Explorer</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Explore the Blockchain
          </h1>
          <p className="text-white/55 text-lg mb-10">
            Search transactions, addresses, blocks, and more across multiple chains
          </p>
          <div className="relative max-w-2xl mx-auto flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 shadow-2xl">
            <Search className="h-5 w-5 text-white/50 ml-2 flex-shrink-0" />
            <Input
              placeholder="Search BTC, ETH, SOL, BNB, TRON addresses or Txn Hash"
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-white/40"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading} className="px-6 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold flex-shrink-0">
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
          {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
        </div>
      </div>
    </section>
  );
};

const CryptoCard = ({ name, symbol, price, change24h, chartData, color, icon }: {
  name: string; symbol: string; price: number; change24h: number;
  chartData: { value: number }[]; color: string; icon: string;
}) => {
  const iconUrl = cryptoIconUrls[symbol as keyof typeof cryptoIconUrls] || '';
  const isPositive = change24h >= 0;
  const formattedPrice = price > 0
    ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';
  const formattedChange = price > 0 ? `${isPositive ? '+' : ''}${change24h.toFixed(2)}%` : '—';

  return (
    <Card className="overflow-hidden border-border hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-0">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {iconUrl ? (
              <img src={iconUrl} alt={symbol} className="w-11 h-11 rounded-full" />
            ) : (
              <div className={`w-11 h-11 rounded-full ${color} flex items-center justify-center text-white text-lg font-bold`}>
                {icon}
              </div>
            )}
            <div>
              <span className="font-bold text-base text-foreground">{name}</span>
              <span className="text-muted-foreground text-sm ml-2">{symbol}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-xl text-foreground">{formattedPrice}</span>
            <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${isPositive ? 'bg-[#B4F22E]/15 text-[#B4F22E]' : 'bg-destructive/10 text-destructive'}`}>
              {formattedChange}
            </span>
          </div>
        </div>
        <div className="h-40 w-full bg-muted/20 px-2 pb-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="value" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill={`url(#gradient-${symbol})`} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const NetworkStatsGrid = ({ stats, chartData }: { stats: LiveNetworkStat[]; chartData: { value: number }[] }) => (
  <Card className="overflow-hidden border-border">
    <CardHeader className="pb-0 border-b border-border">
      <div className="flex items-center gap-2 pb-4">
        <div className="w-8 h-8 rounded-lg bg-[#B4F22E]/15 flex items-center justify-center">
          <Activity className="h-4 w-4 text-[#B4F22E]" />
        </div>
        <div>
          <CardTitle className="text-base">Network Stats</CardTitle>
          <p className="text-xs text-muted-foreground">Live Bitcoin network data</p>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="h-36 w-full relative bg-gradient-to-b from-[#B4F22E]/10 to-transparent">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData.length > 0 ? chartData : [{ value: 0 }]} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="networkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B4F22E" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#B4F22E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="#B4F22E" strokeWidth={2} fill="url(#networkGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
        {stats.length > 0 ? stats.map((stat) => (
          <div key={stat.label} className="bg-card p-4 hover:bg-muted/40 transition-colors">
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stat.label}
              {stat.sub && <span className="ml-1">· {stat.sub}</span>}
            </p>
          </div>
        )) : Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card p-4">
            <div className="h-6 w-20 bg-muted/50 rounded animate-pulse mb-2" />
            <div className="h-3 w-28 bg-muted/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const HashrateChart = ({ distribution }: { distribution: PoolEntry[] }) => (
  <Card className="border-border hover:border-border/80 transition-colors">
    <CardHeader className="flex-row items-center justify-between border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
          <Database className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <CardTitle className="text-base">Hashrate Distribution</CardTitle>
          <p className="text-xs text-muted-foreground">Bitcoin — 7 day average</p>
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-6">
      {distribution.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="w-56 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} cx="50%" cy="50%" innerRadius={45} outerRadius={100} paddingAngle={2} dataKey="value">
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
            {distribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.name} <span className="font-medium text-foreground">{item.value}%</span></span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-56">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </CardContent>
  </Card>
);

const QuickStats = ({ fastestFee, pendingCount }: { fastestFee: number; pendingCount: number }) => (
  <div className="flex flex-wrap items-center gap-6 md:gap-10">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#B4F22E]/15 flex items-center justify-center flex-shrink-0">
        <Zap className="h-4 w-4 text-[#B4F22E]" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{fastestFee > 0 ? `${fastestFee} sat/vB` : '—'}</p>
        <p className="text-xs text-muted-foreground">Fastest Fee</p>
      </div>
    </div>
    <div className="w-px h-10 bg-border hidden md:block" />
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
        <ArrowRightLeft className="h-4 w-4 text-orange-500" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{pendingCount > 0 ? pendingCount.toLocaleString() : '—'}</p>
        <a href="/explorer/transactions" className="text-xs text-muted-foreground hover:text-primary transition-colors">Pending Transactions</a>
      </div>
    </div>
  </div>
);

const PriceBarsChart = ({ coins }: { coins: LiveCoinData[] }) => (
  <Card className="border-border">
    <CardHeader className="flex-row items-center justify-between border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <CardTitle className="text-base">Live Prices</CardTitle>
          <p className="text-xs text-muted-foreground">Real-time market data</p>
        </div>
      </div>
      <Link href="/explorer/prices">
        <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </span>
      </Link>
    </CardHeader>
    <CardContent className="p-0">
      {coins.length > 0 ? (
        <div>
          {coins.map((coin) => {
            const iconUrl = cryptoIconUrls[coin.symbol as keyof typeof cryptoIconUrls] || '';
            const isPositive = coin.change24h >= 0;
            return (
              <div key={coin.symbol} className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  {iconUrl ? (
                    <img src={iconUrl} alt={coin.symbol} className="w-9 h-9 rounded-full" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {coin.symbol[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-foreground">{coin.name}</p>
                    <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-foreground min-w-[90px] text-right">
                    {coin.price > 0
                      ? (coin.price < 10 ? `$${coin.price.toFixed(4)}` : `$${coin.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`)
                      : '—'}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full min-w-[60px] text-center ${isPositive ? 'bg-[#B4F22E]/15 text-[#B4F22E]' : 'bg-destructive/10 text-destructive'}`}>
                    {coin.price > 0 ? `${isPositive ? '+' : ''}${coin.change24h.toFixed(2)}%` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 flex justify-center">
          <Loader className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </CardContent>
  </Card>
);

const LatestBlocksSection = ({ blocks }: { blocks: FormattedBlock[] }) => (
  <Card className="h-full border-border">
    <CardHeader className="flex-row items-center justify-between border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
          <Box className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <CardTitle className="text-base">Latest Blocks</CardTitle>
          <p className="text-xs text-muted-foreground">Bitcoin</p>
        </div>
      </div>
      <Link href="/explorer/blocks">
        <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </span>
      </Link>
    </CardHeader>
    <CardContent className="p-0">
      {blocks.length > 0 ? blocks.map((block, index) => (
        <div key={block.number || index} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
            <Box className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/explorer/block/${block.number || block.hash}`}>
              <p className="font-bold text-primary hover:underline cursor-pointer text-sm">{block.number}</p>
            </Link>
            <p className="text-xs text-muted-foreground">{block.date} · {block.time}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-medium text-foreground">{typeof block.txns === 'number' ? block.txns.toLocaleString() : block.txns} txns</p>
            <p className="text-xs text-muted-foreground">{block.size}</p>
          </div>
        </div>
      )) : Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0">
          <div className="w-10 h-10 rounded-xl bg-muted/30 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-16 bg-muted/50 rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const SearchResultsSection = ({ results }: { results: any }) => {
  if (!results) return null;
  return (
    <Card className="border-[#B4F22E]/30 bg-[#B4F22E]/5">
      <CardHeader className="flex-row items-center justify-between border-b border-[#B4F22E]/20">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-[#B4F22E]" />
          Search Results
        </CardTitle>
        <span className="text-sm font-medium text-[#B4F22E] px-2.5 py-0.5 rounded-full bg-[#B4F22E]/15">{results.type}</span>
      </CardHeader>
      <CardContent className="pt-6">
        {results.type === 'block' && results.data && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Block Hash</p>
              <Link href={`/explorer/block/${results.data.hash}`}>
                <code className="text-primary font-mono text-sm break-all hover:underline cursor-pointer">{results.data.hash}</code>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground mb-0.5">Height</p><p className="font-bold">{results.data.height}</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Transactions</p><p className="font-bold">{results.data.n_tx || 0}</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Size</p><p className="font-bold">{((results.data.size || 0) / 1024).toFixed(2)} KB</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Time</p><p className="font-bold text-sm">{formatTimestamp(results.data.time)}</p></div>
            </div>
          </div>
        )}
        {results.type === 'transaction' && results.data && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
              <Link href={`/explorer/transaction/${results.data.hash}`}>
                <code className="text-primary font-mono text-sm break-all hover:underline cursor-pointer">{results.data.hash}</code>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground mb-0.5">Inputs</p><p className="font-bold">{results.data.inputs?.length || 0}</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Outputs</p><p className="font-bold">{results.data.out?.length || 0}</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Total</p><p className="font-bold">{(results.data.total / 100000000).toFixed(8)} BTC</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Block Height</p><p className="font-bold">{results.data.block_height || 'N/A'}</p></div>
            </div>
          </div>
        )}
        {results.type === 'address' && results.data && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <code className="text-primary font-mono text-sm break-all">{results.data.address}</code>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground mb-0.5">Transactions</p><p className="font-bold">{results.data.n_tx || 0}</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Total Received</p><p className="font-bold">{(results.data.total_received / 100000000).toFixed(4)} BTC</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Total Sent</p><p className="font-bold">{(results.data.total_sent / 100000000).toFixed(4)} BTC</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Balance</p><p className="font-bold text-[#B4F22E]">{(results.data.final_balance / 100000000).toFixed(8)} BTC</p></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const LatestTransactionsSection = ({ initialTxns = [] }: { initialTxns?: any[] }) => {
  const [txns, setTxns] = useState<any[]>(initialTxns);
  const [loading, setLoading] = useState(initialTxns.length === 0);

  useEffect(() => {
    const fetchTxns = async () => {
      try {
        const rawTxns = await getMempoolTransactions();
        if (rawTxns && rawTxns.length > 0) {
          const transformed = rawTxns.map(tx => {
            let timeStr = "Just now";
            const timeVal = Number(tx.time);
            if (!isNaN(timeVal) && timeVal > 0) {
              if (timeVal > 1000000000) {
                const now = Math.floor(Date.now() / 1000);
                const diff = now - timeVal;
                if (diff < 60) timeStr = `${Math.max(0, diff)}s ago`;
                else if (diff < 3600) timeStr = `${Math.floor(diff / 60)}m ago`;
                else timeStr = `${Math.floor(diff / 3600)}h ago`;
              } else {
                if (timeVal < 60) timeStr = `${timeVal}s ago`;
                else if (timeVal < 3600) timeStr = `${Math.floor(timeVal / 60)}m ago`;
                else timeStr = `${Math.floor(timeVal / 3600)}h ago`;
              }
            }
            return {
              hash: formatHash(tx.hash || tx.txid || "", 4),
              fullHash: tx.hash || tx.txid || "",
              from: tx.from || "Mempool",
              to: tx.to || "Multiple Outputs",
              amount: tx.amount_btc ? `${tx.amount_btc} BTC` : "0.0000 BTC",
              time: timeStr,
            };
          });
          setTxns(transformed);
        }
      } catch (e) {
        console.error("Failed to fetch latest txns:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchTxns();
    const interval = setInterval(fetchTxns, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full border-border">
      <CardHeader className="flex-row items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Latest Transactions</CardTitle>
            <p className="text-xs text-muted-foreground">Bitcoin · Live</p>
          </div>
        </div>
        <Link href="/explorer/transactions">
          <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {loading && txns.length === 0 ? (
          <div className="p-10 flex justify-center">
            <Loader className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          txns.map((tx, index) => (
            <div key={tx.fullHash || index} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/explorer/transaction/${tx.fullHash}`}>
                  <p className="font-bold text-primary text-sm truncate hover:underline cursor-pointer">{tx.hash}</p>
                </Link>
                <p className="text-xs text-muted-foreground">{tx.time}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm text-foreground">{tx.amount}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

const Footer = () => (
  <footer className="border-t border-border bg-card/50 py-12">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <a href="/" className="flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <PexlyIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Pexly Explorer</span>
          </a>
          <p className="text-sm text-muted-foreground leading-relaxed">Explore blockchain data across multiple networks with powerful search and analytics.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-sm">Explore</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><a href="/explorer/blocks" className="hover:text-foreground transition-colors">Blocks</a></li>
            <li><a href="/explorer/transactions" className="hover:text-foreground transition-colors">Transactions</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Tokens</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">NFTs</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-sm">Resources</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Charts</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
            <li><a href="/support" className="hover:text-foreground transition-colors">Support</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-sm">Company</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><a href="/about" className="hover:text-foreground transition-colors">About</a></li>
            <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a></li>
            <li><a href="/terms" className="hover:text-foreground transition-colors">Terms</a></li>
            <li><a href="/contact" className="hover:text-foreground transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">© 2025 Pexly Explorer. All rights reserved.</p>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <a href="#" aria-label="Follow Pexly on Twitter" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="h-5 w-5" /></a>
          <a href="#" aria-label="Pexly on GitHub" className="text-muted-foreground hover:text-foreground transition-colors"><Github className="h-5 w-5" /></a>
        </div>
      </div>
    </div>
  </footer>
);

// ==================== MAIN PAGE ====================

const Index = () => {
  const [blocks, setBlocks] = useState<FormattedBlock[]>([]);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [liveCoins, setLiveCoins] = useState<LiveCoinData[]>([]);
  const [btcChartData, setBtcChartData] = useState<{ value: number }[]>([]);
  const [ethChartData, setEthChartData] = useState<{ value: number }[]>([]);
  const [poolDistribution, setPoolDistribution] = useState<PoolEntry[]>([]);
  const [networkStats, setNetworkStats] = useState<LiveNetworkStat[]>([]);
  const [fastestFee, setFastestFee] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [blocksData, coinsData, btcHistory, ethHistory, pools, netResult] = await Promise.all([
          getLatestBlocks(5),
          getLiveCoinPrices(TICKER_SYMBOLS),
          getCoinPriceHistory('BTC'),
          getCoinPriceHistory('ETH'),
          getMiningPoolDistribution(),
          getLiveNetworkStats(),
        ]);

        if (blocksData.length > 0) {
          setBlocks(blocksData.map((block: any) => ({
            number: block.height || 0,
            hash: block.hash || '',
            date: new Date(block.time * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: new Date(block.time * 1000).toLocaleTimeString('en-GB'),
            txns: block.n_tx || 0,
            size: `${(block.size / 1024 / 1024).toFixed(2)} MB`,
          })));
        }

        if (coinsData.length > 0) setLiveCoins(coinsData);
        if (btcHistory.length > 0) setBtcChartData(btcHistory);
        if (ethHistory.length > 0) setEthChartData(ethHistory);
        if (pools.length > 0) setPoolDistribution(pools);
        if (netResult.stats.length > 0) setNetworkStats(netResult.stats);
        if (netResult.fastestFee > 0) setFastestFee(netResult.fastestFee);
        if (netResult.pendingCount > 0) setPendingCount(netResult.pendingCount);
      } catch (error) {
        console.error('Error fetching explorer data:', error);
      }
    };

    fetchAll();
  }, []);

  const btcCoin = liveCoins.find(c => c.symbol === 'BTC');
  const ethCoin = liveCoins.find(c => c.symbol === 'ETH');
  const priceListCoins = PRICE_LIST_SYMBOLS
    .map(s => liveCoins.find(c => c.symbol === s))
    .filter(Boolean) as LiveCoinData[];

  return (
    <>
      <style>{`
        .explorer-wrapper { font-family: 'Inter', system-ui, sans-serif; }
        .ticker-scroll { animation: ticker 60s linear infinite; will-change: transform; }
        .ticker-scroll:hover { animation-play-state: paused; }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
        .container { width: 100%; max-width: 1400px; margin-left: auto; margin-right: auto; padding-left: 1.5rem; padding-right: 1.5rem; }
        @media (max-width: 640px) { .container { padding-left: 1rem; padding-right: 1rem; } }
      `}</style>

      <div className="min-h-screen flex flex-col explorer-wrapper bg-background">
        <Header />

        <main className="flex-1">
          {/* Hero / Search */}
          <SearchBar onSearchResults={setSearchResults} />

          {/* Ticker */}
          <PriceTicker coins={liveCoins} />

          {/* Quick stats bar */}
          <section className="py-5 border-b border-border bg-background">
            <div className="container">
              <QuickStats fastestFee={fastestFee} pendingCount={pendingCount} />
            </div>
          </section>

          {/* BTC Price Card */}
          <section className="pt-8 pb-4 bg-background">
            <div className="container">
              <CryptoCard
                name="Bitcoin"
                symbol="BTC"
                price={btcCoin?.price ?? 0}
                change24h={btcCoin?.change24h ?? 0}
                chartData={btcChartData}
                color="bg-orange-500"
                icon="₿"
              />
            </div>
          </section>

          {/* Network Stats */}
          <section className="py-4 bg-background">
            <div className="container">
              <NetworkStatsGrid stats={networkStats} chartData={btcChartData} />
            </div>
          </section>

          {/* Live Prices list */}
          <section className="py-4 bg-background">
            <div className="container">
              <PriceBarsChart coins={priceListCoins} />
            </div>
          </section>

          {/* Hashrate + Latest Blocks */}
          <section className="py-4 bg-background">
            <div className="container">
              <div className="grid lg:grid-cols-2 gap-5">
                <HashrateChart distribution={poolDistribution} />
                <LatestBlocksSection blocks={blocks} />
              </div>
            </div>
          </section>

          {/* ETH Price Card */}
          <section className="py-4 bg-background">
            <div className="container">
              <CryptoCard
                name="Ethereum"
                symbol="ETH"
                price={ethCoin?.price ?? 0}
                change24h={ethCoin?.change24h ?? 0}
                chartData={ethChartData}
                color="bg-blue-500"
                icon="Ξ"
              />
            </div>
          </section>

          {/* Search Results */}
          {searchResults && (
            <section className="py-4 bg-background">
              <div className="container">
                <SearchResultsSection results={searchResults} />
              </div>
            </section>
          )}

          {/* Latest Transactions */}
          <section className="pt-4 pb-10 bg-background">
            <div className="container">
              <LatestTransactionsSection initialTxns={[]} />
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Index;
