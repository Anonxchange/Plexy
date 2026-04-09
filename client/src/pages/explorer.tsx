import { useState, useEffect } from "react";
import { Search, Menu, X, TrendingUp, TrendingDown, Box, ArrowRightLeft, ArrowRight, Github, Twitter, Database, Loader } from "lucide-react";
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-xl">
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
                <span className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary cursor-pointer">
                  {link.name}
                </span>
              </Link>
            ) : (
              <a key={link.name} href={link.href} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
                {link.name}
              </a>
            )
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50">
            <span className="text-xs text-muted-foreground">Chain:</span>
            <Button variant={currentChain === 'BTC' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => { setBlockchain('BTC'); window.location.reload(); }}>BTC</Button>
            <Button variant={currentChain === 'ETH' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => { setBlockchain('ETH'); window.location.reload(); }}>ETH</Button>
          </div>
          <Button variant="outline" size="icon" className="hidden md:flex"><Search className="h-4 w-4" /></Button>
          <Button variant="default" className="hidden md:flex">Connect Wallet</Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card animate-slide-up">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              link.href.startsWith('/') ? (
                <Link key={link.name} href={link.href}>
                  <span className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary block cursor-pointer" onClick={() => setMobileOpen(false)}>
                    {link.name}
                  </span>
                </Link>
              ) : (
                <a key={link.name} href={link.href} className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(false)}>
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
    <div className="w-full overflow-hidden border-b border-border bg-white dark:bg-gray-800 py-4 shadow-sm">
      <div className="flex ticker-scroll">
        {items.map((item, index) => (
          <div key={`${item.symbol}-${index}`} className="flex items-center gap-4 px-6 border-r border-border/20 whitespace-nowrap">
            <span className="font-semibold text-foreground">{item.symbol}</span>
            <span className="text-muted-foreground text-sm">{item.name}</span>
            <span className="font-medium text-foreground">
              ${item.price > 0 ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: item.price < 1 ? 4 : 2 }) : '—'}
            </span>
            <span className={`flex items-center gap-1 font-medium ${item.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
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
          setError(`Detected ${chain} address. Pexly Explorer currently supports Bitcoin. Multi-chain support is coming soon!`);
        }
      } else {
        setError('Invalid search query. Please enter a valid block hash, transaction hash, or address');
      }
    } catch (err: any) {
      setError(`Search error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-gray-100 dark:bg-gray-900">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Explore the <span className="gradient-text">Blockchain</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Search transactions, addresses, blocks, and more across multiple chains
          </p>
          <div className="relative max-w-2xl mx-auto flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md">
            <Search className="h-5 w-5 text-muted-foreground ml-3" />
            <Input
              placeholder="Search BTC, ETH, SOL, BNB, TRON addresses or Txn Hash"
              className="flex-1 border-0 bg-transparent focus-visible:ring-0"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading} className="px-8 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
          {error && <p className="text-destructive mt-3 text-sm">{error}</p>}
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
  const changeValue = price > 0 ? `${Math.abs(price * change24h / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '';

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
      <CardContent className="p-0">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {iconUrl ? (
              <img src={iconUrl} alt={symbol} className="w-12 h-12 rounded-full" />
            ) : (
              <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white text-xl font-bold`}>
                {icon}
              </div>
            )}
            <div>
              <span className="font-bold text-lg">{name}</span>
              <span className="text-muted-foreground text-sm ml-2">{symbol}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-xl">{formattedPrice}</span>
            <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>{formattedChange}</span>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <div className="h-40 w-full bg-white dark:bg-gray-800 p-4">
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
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <div className="h-40 w-full bg-gradient-to-b from-success/20 to-transparent relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData.length > 0 ? chartData : [{ value: 0 }]} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="networkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#networkGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
        {stats.length > 0 ? stats.map((stat) => (
          <div key={stat.label} className="bg-card p-4 hover:bg-secondary/50 transition-colors">
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">
              {stat.label}
              {stat.sub && <span className="ml-1">• {stat.sub}</span>}
            </p>
          </div>
        )) : Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card p-4">
            <div className="h-8 w-24 bg-muted/50 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-muted/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const HashrateChart = ({ distribution }: { distribution: PoolEntry[] }) => (
  <Card>
    <CardHeader className="flex-row items-center justify-between">
      <div>
        <CardTitle>Charts</CardTitle>
        <p className="text-sm text-muted-foreground">Bitcoin Hashrate Distribution (7d)</p>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {distribution.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} cx="50%" cy="50%" innerRadius={0} outerRadius={100} paddingAngle={1} dataKey="value">
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {distribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.name} {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </CardContent>
  </Card>
);

const QuickStats = ({ fastestFee, pendingCount }: { fastestFee: number; pendingCount: number }) => (
  <Card className="border-0 bg-transparent shadow-none">
    <CardContent className="p-0 flex items-center gap-8">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">
          {fastestFee > 0 ? `${fastestFee} sat/vB` : '—'}
        </span>
        <span className="text-muted-foreground text-sm">Fastest Fee</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">
          {pendingCount > 0 ? pendingCount.toLocaleString() : '—'}
        </span>
        <a href="/explorer/transactions" className="text-muted-foreground text-sm underline hover:text-foreground">Pending Transactions</a>
      </div>
    </CardContent>
  </Card>
);

const PriceBarsChart = ({ coins }: { coins: LiveCoinData[] }) => (
  <Card>
    <CardHeader className="flex-row items-center justify-between">
      <div>
        <CardTitle>Prices</CardTitle>
        <p className="text-sm text-muted-foreground">Live Market Data</p>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent className="p-0">
      {coins.length > 0 ? (
        <div className="space-y-0">
          {coins.map((coin) => {
            const iconUrl = cryptoIconUrls[coin.symbol as keyof typeof cryptoIconUrls] || '';
            const isPositive = coin.change24h >= 0;
            return (
              <div key={coin.symbol} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  {iconUrl ? (
                    <img src={iconUrl} alt={coin.symbol} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold">
                      {coin.symbol[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{coin.name}</p>
                    <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-sm min-w-24 text-right">
                    {coin.price > 0
                      ? (coin.price < 10
                        ? `$${coin.price.toFixed(4)}`
                        : `$${coin.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`)
                      : '—'}
                  </span>
                  <span className={`text-sm font-medium min-w-16 text-right ${isPositive ? 'text-success' : 'text-destructive'}`}>
                    {coin.price > 0 ? `${isPositive ? '+' : ''}${coin.change24h.toFixed(2)}%` : '—'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 flex justify-center">
          <Loader className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </CardContent>
  </Card>
);

const LatestBlocksSection = ({ blocks }: { blocks: FormattedBlock[] }) => (
  <Card className="h-full">
    <CardHeader className="flex-row items-center justify-between border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">₿</div>
        <div>
          <CardTitle>Latest Blocks</CardTitle>
          <p className="text-sm text-muted-foreground">Bitcoin</p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent className="p-0">
      {blocks.length > 0 ? blocks.map((block, index) => (
        <div key={block.number || index} className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-200 to-orange-100 flex items-center justify-center">
            <Box className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <Link href={`/explorer/block/${block.number || block.hash}`}>
              <p className="font-bold text-primary hover:underline cursor-pointer">{block.number}</p>
            </Link>
            <p className="text-sm text-muted-foreground">{block.date} • {block.time}</p>
            <p className="text-sm text-muted-foreground">{typeof block.txns === 'number' ? block.txns.toLocaleString() : block.txns} Txs • {block.size}</p>
          </div>
        </div>
      )) : Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
          <div className="w-12 h-12 rounded-xl bg-muted/30 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
            <div className="h-3 w-40 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const SearchResultsSection = ({ results }: { results: any }) => {
  if (!results) return null;
  return (
    <Card className="border-success/50 bg-success/5">
      <CardHeader className="flex-row items-center justify-between border-b">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-success" />
          Search Results
        </CardTitle>
        <span className="text-sm font-medium text-success">{results.type}</span>
      </CardHeader>
      <CardContent className="pt-6">
        {results.type === 'block' && results.data && (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Block Hash</p>
                <Link href={`/explorer/block/${results.data.hash}`}>
                  <code className="text-primary font-mono text-sm break-all hover:underline cursor-pointer">{results.data.hash}</code>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Height</p><p className="font-bold text-lg">{results.data.height}</p></div>
              <div><p className="text-sm text-muted-foreground">Transactions</p><p className="font-bold text-lg">{results.data.n_tx || 0}</p></div>
              <div><p className="text-sm text-muted-foreground">Size</p><p className="font-bold text-lg">{((results.data.size || 0) / 1024).toFixed(2)} KB</p></div>
              <div><p className="text-sm text-muted-foreground">Time</p><p className="font-bold text-sm">{formatTimestamp(results.data.time)}</p></div>
            </div>
          </div>
        )}
        {results.type === 'transaction' && results.data && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Transaction Hash</p>
              <Link href={`/explorer/transaction/${results.data.hash}`}>
                <code className="text-primary font-mono text-sm break-all hover:underline cursor-pointer">{results.data.hash}</code>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Inputs</p><p className="font-bold text-lg">{results.data.inputs?.length || 0}</p></div>
              <div><p className="text-sm text-muted-foreground">Outputs</p><p className="font-bold text-lg">{results.data.out?.length || 0}</p></div>
              <div><p className="text-sm text-muted-foreground">Total</p><p className="font-bold text-lg">{(results.data.total / 100000000).toFixed(8)} BTC</p></div>
              <div><p className="text-sm text-muted-foreground">Block Height</p><p className="font-bold text-lg">{results.data.block_height || 'N/A'}</p></div>
            </div>
          </div>
        )}
        {results.type === 'address' && results.data && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <code className="text-primary font-mono text-sm break-all">{results.data.address}</code>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Transactions</p><p className="font-bold text-lg">{results.data.n_tx || 0}</p></div>
              <div><p className="text-sm text-muted-foreground">Total Received</p><p className="font-bold text-lg">{(results.data.total_received / 100000000).toFixed(4)} BTC</p></div>
              <div><p className="text-sm text-muted-foreground">Total Sent</p><p className="font-bold text-lg">{(results.data.total_sent / 100000000).toFixed(4)} BTC</p></div>
              <div><p className="text-sm text-muted-foreground">Balance</p><p className="font-bold text-lg text-success">{(results.data.final_balance / 100000000).toFixed(8)} BTC</p></div>
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
                if (diff < 60) timeStr = `${Math.max(0, diff)} secs ago`;
                else if (diff < 3600) timeStr = `${Math.floor(diff / 60)} mins ago`;
                else timeStr = `${Math.floor(diff / 3600)} hrs ago`;
              } else {
                if (timeVal < 60) timeStr = `${timeVal} secs ago`;
                else if (timeVal < 3600) timeStr = `${Math.floor(timeVal / 60)} mins ago`;
                else timeStr = `${Math.floor(timeVal / 3600)} hrs ago`;
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
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Latest Transactions</CardTitle>
            <p className="text-sm text-muted-foreground">Bitcoin</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-0">
        {loading && txns.length === 0 ? (
          <div className="p-8 flex justify-center">
            <Loader className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          txns.map((tx, index) => (
            <div key={tx.fullHash || index} className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <Link href={`/explorer/transaction/${tx.fullHash}`}>
                  <p className="font-bold text-primary truncate max-w-[150px] hover:underline cursor-pointer">{tx.hash}</p>
                </Link>
                <p className="text-sm text-muted-foreground">{tx.time}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{tx.amount}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>From: {tx.from}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>To: {tx.to}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

const Footer = () => (
  <footer className="border-t border-border bg-card py-12">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <a href="/" className="flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <PexlyIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Pexly Explorer</span>
          </a>
          <p className="text-sm text-muted-foreground">Explore blockchain data across multiple networks with powerful search and analytics.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="/explorer/blocks" className="hover:text-foreground transition-colors">Blocks</a></li>
            <li><a href="/explorer/transactions" className="hover:text-foreground transition-colors">Transactions</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Tokens</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">NFTs</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Resources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Charts</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
            <li><a href="/support" className="hover:text-foreground transition-colors">Support</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="/about" className="hover:text-foreground transition-colors">About</a></li>
            <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a></li>
            <li><a href="/terms" className="hover:text-foreground transition-colors">Terms</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
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
        .glass-card { background-color: hsl(var(--card) / 0.8); backdrop-filter: blur(12px); border: 1px solid hsl(var(--border) / 0.5); box-shadow: var(--shadow-card); }
        .glass-card:hover { box-shadow: var(--shadow-card-hover); }
        .gradient-text { background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-image: linear-gradient(135deg, hsl(var(--primary)), #a855f7); }
        .ticker-scroll { animation: ticker 60s linear infinite; will-change: transform; }
        .ticker-scroll:hover { animation-play-state: paused; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
        .card-default { background-color: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: var(--radius); box-shadow: var(--shadow-card); }
        .card-interactive { background-color: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: var(--radius); transition: all 0.3s ease; }
        .card-interactive:hover { border-color: hsl(var(--primary)); box-shadow: var(--shadow-card-hover); }
        .card-flat { background-color: transparent; border: none; }
        .container { width: 100%; max-width: 1200px; margin-left: auto; margin-right: auto; padding-left: 2rem; padding-right: 2rem; }
        @media (max-width: 640px) { .container { padding-left: 1rem; padding-right: 1rem; } }
      `}</style>
      <div className="min-h-screen flex flex-col explorer-wrapper bg-gray-100 dark:bg-gray-900">
        <Header />

        <main className="flex-1">
          <SearchBar onSearchResults={setSearchResults} />

          <PriceTicker coins={liveCoins} />

          <section className="py-6 border-b border-border bg-gray-100 dark:bg-gray-900">
            <div className="container">
              <QuickStats fastestFee={fastestFee} pendingCount={pendingCount} />
            </div>
          </section>

          <section id="prices" className="py-8 bg-gray-100 dark:bg-gray-900">
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

          <section className="py-8 bg-gray-100 dark:bg-gray-900">
            <div className="container">
              <NetworkStatsGrid stats={networkStats} chartData={btcChartData} />
            </div>
          </section>

          <section className="py-8 bg-gray-100 dark:bg-gray-900">
            <div className="container">
              <PriceBarsChart coins={priceListCoins} />
            </div>
          </section>

          <section className="py-8 bg-gray-100 dark:bg-gray-900">
            <div className="container">
              <div className="grid lg:grid-cols-2 gap-6">
                <HashrateChart distribution={poolDistribution} />
                <LatestBlocksSection blocks={blocks} />
              </div>
            </div>
          </section>

          <section className="py-8 bg-gray-100 dark:bg-gray-900">
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

          {searchResults && (
            <section className="py-8 bg-gray-100 dark:bg-gray-900">
              <div className="container">
                <SearchResultsSection results={searchResults} />
              </div>
            </section>
          )}

          <section id="blocks" className="py-8 bg-gray-100 dark:bg-gray-900">
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
