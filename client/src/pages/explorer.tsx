import { useState } from "react";
import { Search, Menu, X, TrendingUp, TrendingDown, Box, ArrowRightLeft, ArrowRight, Blocks, Users, Activity, Github, Twitter, Database, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from "recharts";
import { cryptoIconUrls } from "@/lib/crypto-icons";

// ==================== DATA ====================

const navLinks = [
  { name: "Home", href: "#" },
  { name: "Prices", href: "#prices" },
  { name: "Blocks", href: "#blocks" },
  { name: "Transactions", href: "#blocks" },
];

const tickerData = [
  { symbol: "BTC", name: "Bitcoin", price: "$88,696.00", change: 1.57 },
  { symbol: "ETH", name: "Ethereum", price: "$2,970.09", change: 1.80 },
  { symbol: "USDT", name: "Tether", price: "$1.00", change: 0.00 },
  { symbol: "USDC", name: "USDC", price: "$1.00", change: 0.01 },
  { symbol: "SOL", name: "Solana", price: "$123.68", change: -0.42 },
  { symbol: "BNB", name: "BNB", price: "$631.42", change: 0.85 },
  { symbol: "XRP", name: "XRP", price: "$1.87", change: 2.14 },
  { symbol: "ADA", name: "Cardano", price: "$0.56", change: -1.23 },
];

const btcChartData = [
  { value: 85000 }, { value: 86200 }, { value: 85800 }, { value: 87100 }, { value: 86500 },
  { value: 87800 }, { value: 88200 }, { value: 87500 }, { value: 88100 }, { value: 88696 },
];

const ethChartData = [
  { value: 2850 }, { value: 2920 }, { value: 2880 }, { value: 2950 }, { value: 2910 },
  { value: 2940 }, { value: 2890 }, { value: 2960 }, { value: 2930 }, { value: 2970 },
];

const hashrateData = [
  { name: "Unknown", value: 28, color: "#FF69B4" },
  { name: "AntPool", value: 18, color: "#DA70D6" },
  { name: "ViaBTC", value: 14, color: "#8A2BE2" },
  { name: "F2Pool", value: 12, color: "#4169E1" },
  { name: "SBI Crypto", value: 8, color: "#00BFFF" },
  { name: "Braiins Pool", value: 7, color: "#00CED1" },
  { name: "Poolin", value: 6, color: "#3CB371" },
  { name: "BTC.com", value: 4, color: "#7FFF00" },
  { name: "Ultimus", value: 3, color: "#ADFF2F" },
];

const networkStats = [
  { label: "Transactions", value: "442,668", sub: "5.12 TPs" },
  { label: "Sent Today", value: "$3.7T", sub: "" },
  { label: "Blocks", value: "929,555", sub: "Last 0m32s" },
  { label: "Network Hashrate", value: "980.21 EH/s", sub: "" },
  { label: "Blockchain Size", value: "708.29 GB", sub: "" },
  { label: "Unique Addresses 24Hr", value: "520,980", sub: "" },
];

const latestBlocks = [
  { number: 929556, date: "26 Dec 2025", time: "12:42:46 GMT+1", txns: 4146, size: "1.75 Mb" },
  { number: 929555, date: "26 Dec 2025", time: "12:41:57 GMT+1", txns: 3988, size: "1.74 Mb" },
  { number: 929554, date: "26 Dec 2025", time: "12:40:23 GMT+1", txns: 4021, size: "1.72 Mb" },
  { number: 929553, date: "26 Dec 2025", time: "12:39:45 GMT+1", txns: 3876, size: "1.68 Mb" },
  { number: 929552, date: "26 Dec 2025", time: "12:38:12 GMT+1", txns: 4234, size: "1.79 Mb" },
];

const latestTxns = [
  { hash: "0x8d2e1a...3f5c", from: "0x742d35...8892", to: "0x95222290...6b9d", amount: "0.523 ETH", time: "5 secs ago" },
  { hash: "0x7c4b2e...9a1d", from: "0x1f9090...2c4d", to: "0x388c818c...7438", amount: "1.204 ETH", time: "12 secs ago" },
  { hash: "0x5a9f3c...2b8e", from: "0xdafea4...afab", to: "0x742d35...8892", amount: "0.087 ETH", time: "18 secs ago" },
  { hash: "0x3e7d1b...4c9f", from: "0x388c81...7438", to: "0x95222290...6b9d", amount: "2.341 ETH", time: "25 secs ago" },
  { hash: "0x2c5a8e...1d7b", from: "0x95222...397c", to: "0x1f9090...2c4d", amount: "0.156 ETH", time: "32 secs ago" },
];

// ==================== COMPONENTS ====================

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">P</span>
          </div>
          <span className="text-xl font-bold">Pexly Explorer</span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
              {link.name}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="hidden md:flex">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="hero" className="hidden md:flex">Connect Wallet</Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card animate-slide-up">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(false)}>
                {link.name}
              </a>
            ))}
            <Button variant="hero" className="mt-2">Connect Wallet</Button>
          </nav>
        </div>
      )}
    </header>
  );
};

const PriceTicker = () => (
  <div className="w-full overflow-hidden border-b border-border bg-white dark:bg-gray-800 py-4 shadow-sm">
    <div className="flex ticker-scroll">
      {[...tickerData, ...tickerData, ...tickerData].map((item, index) => (
        <div key={`${item.symbol}-${index}`} className="flex items-center gap-4 px-6 border-r border-border/20 whitespace-nowrap">
          <span className="font-semibold text-foreground">{item.symbol}</span>
          <span className="text-muted-foreground text-sm">{item.name}</span>
          <span className="font-medium text-foreground">{item.price}</span>
          <span className={`flex items-center gap-1 font-medium ${item.change >= 0 ? "text-success" : "text-destructive"}`}>
            {item.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {item.change >= 0 ? "+" : ""}{item.change}%
          </span>
        </div>
      ))}
    </div>
  </div>
);

const SearchBar = () => (
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
          <Input placeholder="Search by Address / Txn Hash / Block / Token" className="flex-1 border-0 bg-transparent focus-visible:ring-0" />
          <Button className="px-8 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">Search</Button>
        </div>
      </div>
    </div>
  </section>
);

const CryptoCard = ({ name, symbol, price, change, changeValue, chartData, color, icon }: {
  name: string; symbol: string; price: string; change: string; changeValue: string;
  chartData: { value: number }[]; color: string; icon: string;
}) => {
  const iconUrl = cryptoIconUrls[symbol as keyof typeof cryptoIconUrls] || '';
  
  return (
    <Card variant="interactive" className="overflow-hidden">
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
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{name}</span>
                <span className="text-muted-foreground text-sm">{symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl">{price}</span>
                <span className="text-success text-sm font-medium">{change}</span>
                <span className="text-success text-sm">{changeValue}</span>
              </div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="h-40 w-full bg-white dark:bg-gray-800 p-4">
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
              <YAxis hide domain="dataMin-5% dataMax+5%" />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill={`url(#gradient-${symbol})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const NetworkStatsGrid = () => (
  <Card variant="default" className="overflow-hidden">
    <CardContent className="p-0">
      <div className="h-40 w-full bg-gradient-to-b from-success/20 to-transparent relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={btcChartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
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
        {networkStats.map((stat, index) => (
          <div key={stat.label} className="bg-card p-4 hover:bg-secondary/50 transition-colors">
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">
              {stat.label}
              {stat.sub && <span className="ml-1">• {stat.sub}</span>}
            </p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const HashrateChart = () => (
  <Card variant="default">
    <CardHeader className="flex-row items-center justify-between">
      <div>
        <CardTitle>Charts</CardTitle>
        <p className="text-sm text-muted-foreground">Bitcoin Hashrate Distribution</p>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="flex flex-col items-center">
        <div className="w-64 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={hashrateData} cx="50%" cy="50%" innerRadius={0} outerRadius={100} paddingAngle={1} dataKey="value">
                {hashrateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {hashrateData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

const QuickStats = () => (
  <Card variant="flat" className="border-0 bg-transparent">
    <CardContent className="p-0 flex items-center gap-8">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">0.000028 BCH</span>
        <span className="text-muted-foreground text-sm">Average Fee</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">100</span>
        <a href="#" className="text-muted-foreground text-sm underline hover:text-foreground">Pending Transactions</a>
      </div>
    </CardContent>
  </Card>
);

const LatestBlocksSection = () => (
  <Card variant="default" className="h-full">
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
      {latestBlocks.map((block, index) => (
        <div key={block.number} className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-200 to-orange-100 flex items-center justify-center">
            <Box className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold">{block.number}</p>
            <p className="text-sm text-muted-foreground">{block.date} • {block.time}</p>
            <p className="text-sm text-muted-foreground">{block.txns.toLocaleString()} Txs • {block.size}</p>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const LatestTransactionsSection = () => (
  <Card variant="default" className="h-full">
    <CardHeader className="flex-row items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <ArrowRightLeft className="h-5 w-5 text-primary" />
        Latest Transactions
      </CardTitle>
      <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
        View all <ArrowRight className="h-4 w-4" />
      </a>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {latestTxns.map((txn, index) => (
          <div key={txn.hash} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <a href="#" className="font-semibold text-primary hover:underline">{txn.hash}</a>
                <p className="text-sm text-muted-foreground">{txn.time}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm">
                <span className="text-muted-foreground">From </span>
                <a href="#" className="font-medium hover:text-primary transition-colors">{txn.from}</a>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">To </span>
                <a href="#" className="font-medium hover:text-primary transition-colors">{txn.to}</a>
              </p>
            </div>
            <div className="hidden sm:block">
              <span className="inline-flex items-center rounded-lg border border-border bg-secondary px-3 py-1 text-sm font-medium">{txn.amount}</span>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const Footer = () => (
  <footer className="border-t border-border bg-card py-12">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <a href="/" className="flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">P</span>
            </div>
            <span className="text-xl font-bold">Pexly Explorer</span>
          </a>
          <p className="text-sm text-muted-foreground">Explore blockchain data across multiple networks with powerful search and analytics.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition-colors">Blocks</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Transactions</a></li>
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
            <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">© 2025 Pexly Explorer. All rights reserved.</p>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="h-5 w-5" /></a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Github className="h-5 w-5" /></a>
        </div>
      </div>
    </div>
  </footer>
);

// ==================== MAIN PAGE ====================

const Index = () => {
  return (
    <>
      <style>{`
        /* Explorer Page Custom Styles */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .explorer-wrapper {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }

        .glass-card {
          background-color: hsl(var(--card) / 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid hsl(var(--border) / 0.5);
          box-shadow: var(--shadow-card);
        }

        .glass-card:hover {
          box-shadow: var(--shadow-card-hover);
        }

        .gradient-text {
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-image: var(--gradient-hero);
        }

        .ticker-scroll {
          animation: ticker 60s linear infinite;
          will-change: transform;
        }
        
        .ticker-scroll:hover {
          animation-play-state: paused;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .card-default {
          background-color: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          box-shadow: var(--shadow-card);
        }

        .card-interactive {
          background-color: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          transition: all 0.3s ease;
        }

        .card-interactive:hover {
          border-color: hsl(var(--primary));
          box-shadow: var(--shadow-card-hover);
        }

        .card-flat {
          background-color: transparent;
          border: none;
        }

        .container {
          width: 100%;
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }

        @media (max-width: 640px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
      <div className="min-h-screen flex flex-col explorer-wrapper bg-gray-100 dark:bg-gray-900">
        <Header />
        
        <main className="flex-1">
        <SearchBar />
        <PriceTicker />
        
        {/* Quick Stats */}
        <section className="py-6 border-b border-border bg-gray-100 dark:bg-gray-900">
          <div className="container">
            <QuickStats />
          </div>
        </section>

        {/* Crypto Cards */}
        <section id="prices" className="py-8 bg-gray-100 dark:bg-gray-900">
          <div className="container">
            <CryptoCard
              name="Bitcoin"
              symbol="BTC"
              price="$88,501.10"
              change="+1.18%"
              changeValue="1,029.57"
              chartData={btcChartData}
              color="bg-orange-500"
              icon="₿"
            />
          </div>
        </section>

        {/* Network Stats with Chart */}
        <section className="py-8 bg-gray-100 dark:bg-gray-900">
          <div className="container">
            <NetworkStatsGrid />
          </div>
        </section>

        {/* Charts & Hashrate */}
        <section className="py-8 bg-gray-100 dark:bg-gray-900">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-6">
              <HashrateChart />
              <LatestBlocksSection />
            </div>
          </div>
        </section>

        {/* Ethereum Card */}
        <section className="py-8 bg-gray-100 dark:bg-gray-900">
          <div className="container">
            <CryptoCard
              name="Ethereum"
              symbol="ETH"
              price="$2,964.31"
              change="+1.42%"
              changeValue="41.40"
              chartData={ethChartData}
              color="bg-blue-500"
              icon="Ξ"
            />
          </div>
        </section>

        {/* Transactions */}
        <section id="blocks" className="py-8 bg-gray-100 dark:bg-gray-900">
          <div className="container">
            <LatestTransactionsSection />
          </div>
        </section>
      </main>
      
      <Footer />
      </div>
    </>
  );
};

export default Index;
