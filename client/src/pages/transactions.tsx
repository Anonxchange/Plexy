import { useState, useEffect } from "react";
import { Search, Menu, X, TrendingUp, TrendingDown, ArrowRight, Github, Twitter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { Link } from "wouter";
import { getUnconfirmedTransactions, satoshiToBTC, formatTimestamp, formatHash, getAverageTransactionsPerBlock, getTotalTransactionsData, getConfirmationsPerDayData, getAverageTransactionTimeData, getMempoolBytesPerFee } from "@/lib/blockchain-api";

// ==================== DATA ====================

const navLinks = [
  { name: "Home", href: "/explorer" },
  { name: "Prices", href: "/explorer/prices" },
  { name: "Blocks", href: "/explorer/blocks" },
  { name: "Transactions", href: "/explorer/transactions" },
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

const defaultMempoolData = [
  { time: "12:00", bytes: 1.2 },
  { time: "12:15", bytes: 1.8 },
  { time: "12:30", bytes: 2.1 },
  { time: "12:45", bytes: 1.5 },
  { time: "13:00", bytes: 2.3 },
  { time: "13:15", bytes: 1.9 },
  { time: "13:30", bytes: 2.4 },
  { time: "13:45", bytes: 1.7 },
  { time: "14:00", bytes: 2.0 },
  { time: "14:15", bytes: 1.4 },
];

const defaultAvgTransactionTimeData = [
  { date: "Dec 18", time: 450 },
  { date: "Dec 19", time: 380 },
  { date: "Dec 20", time: 420 },
  { date: "Dec 21", time: 520 },
  { date: "Dec 22", time: 390 },
  { date: "Dec 23", time: 410 },
  { date: "Dec 24", time: 480 },
];

const defaultConfirmationsPerDayData = [
  { date: "Dec 27", confirmations: 580000 },
  { date: "Dec 28", confirmations: 620000 },
  { date: "Dec 29", confirmations: 590000 },
  { date: "Dec 30", confirmations: 640000 },
  { date: "Dec 31", confirmations: 610000 },
  { date: "Jan 01", confirmations: 580000 },
  { date: "Jan 02", confirmations: 620000 },
  { date: "Jan 03", confirmations: 650000 },
];

const defaultTotalTransactionsData = [
  { date: "Dec 27", txs: 1.15 },
  { date: "Dec 28", txs: 1.17 },
  { date: "Dec 29", txs: 1.19 },
  { date: "Dec 30", txs: 1.21 },
  { date: "Jan 01", txs: 1.23 },
  { date: "Jan 02", txs: 1.25 },
  { date: "Jan 03", txs: 1.28 },
  { date: "Jun 26", txs: 1.32 },
];

const defaultAvgTxPerBlockData: any[] = [
  { date: "Dec 27", avg: 3200 },
  { date: "Dec 28", avg: 3400 },
  { date: "Dec 29", avg: 3100 },
  { date: "Dec 30", avg: 3600 },
  { date: "Dec 31", avg: 3300 },
  { date: "Jan 01", avg: 3500 },
  { date: "Jan 02", avg: 3250 },
  { date: "Jun 26", avg: 3400 },
];

const defaultUnconfirmedTransactions = [
  { hash: "afd0-b359", timestamp: "12/26/2025, 14:47:23", amount: 0.00616443, value: 547.71 },
  { hash: "afd0-b359", timestamp: "12/26/2025, 14:47:24", amount: 0.00010935, value: 9.72 },
  { hash: "55ac-38ef", timestamp: "12/26/2025, 14:47:24", amount: 0.00871305, value: 774.16 },
  { hash: "8651-7b67", timestamp: "12/26/2025, 14:47:23", amount: 0.00026006, value: 23.11 },
  { hash: "c2a1-f445", timestamp: "12/26/2025, 14:47:35", amount: 0.10654720, value: 9466.78 },
  { hash: "44f5-8676", timestamp: "12/26/2025, 14:47:35", amount: 0.53341542, value: 47394.25 },
  { hash: "fabe-4e12", timestamp: "12/26/2025, 14:47:33", amount: 0.45056402, value: 40032.86 },
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
            <Button variant="hero" className="mt-2">Connect Wallet</Button>
          </nav>
        </div>
      )}
    </header>
  );
};

const TransactionsTicker = () => (
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

const TransactionsHeader = () => (
  <section className="py-12 md:py-16 bg-gray-100 dark:bg-gray-900">
    <div className="container">
      <div className="max-w-3xl mx-auto text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          <span className="gradient-text">Bitcoin Mempool</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-4">
          Dive into the Bitcoin mempool and discover economic trends onchain.
        </p>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-border bg-card py-8 md:py-12">
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div className="col-span-1 sm:col-span-2 md:col-span-1">
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
            <li><Link href="/explorer/blocks"><span className="hover:text-foreground transition-colors cursor-pointer">Blocks</span></Link></li>
            <li><Link href="/explorer/transactions"><span className="hover:text-foreground transition-colors cursor-pointer">Transactions</span></Link></li>
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
      <div className="flex flex-col md:flex-row items-center justify-between mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border gap-4">
        <p className="text-sm text-muted-foreground text-center md:text-left">© 2025 Pexly Explorer. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="h-5 w-5" /></a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Github className="h-5 w-5" /></a>
        </div>
      </div>
    </div>
  </footer>
);

// ==================== MAIN PAGE ====================

export default function Transactions() {
  const [unconfirmedTransactions, setUnconfirmedTransactions] = useState<any[]>(defaultUnconfirmedTransactions);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [realAvgTxPerBlockData, setRealAvgTxPerBlockData] = useState<any[]>(defaultAvgTxPerBlockData);
  const [realTotalTransactionsData, setRealTotalTransactionsData] = useState<any[]>(defaultTotalTransactionsData);
  const [realConfirmationsPerDayData, setRealConfirmationsPerDayData] = useState<any[]>(defaultConfirmationsPerDayData);
  const [realAvgTransactionTimeData, setRealAvgTransactionTimeData] = useState<any[]>(defaultAvgTransactionTimeData);
  const [realMempoolData, setRealMempoolData] = useState<any[]>(defaultMempoolData);
  const ITEMS_PER_PAGE = 50;

  // Fetch all real blockchain data
  useEffect(() => {
    const fetchAllRealData = async () => {
      try {
        // Fetch all data in parallel
        const [avgTxPerBlock, totalTxs, confirmPerDay, avgTxTime, mempoolBytes] = await Promise.all([
          getAverageTransactionsPerBlock(7),
          getTotalTransactionsData(7),
          getConfirmationsPerDayData(7),
          getAverageTransactionTimeData(7),
          getMempoolBytesPerFee()
        ]);

        // Update state with real data, fallback to defaults if empty
        if (avgTxPerBlock && avgTxPerBlock.length > 0) {
          setRealAvgTxPerBlockData(avgTxPerBlock.map(stat => ({
            date: stat.date,
            avg: stat.avgTransactionsPerBlock
          })));
        }

        if (totalTxs && totalTxs.length > 0) {
          setRealTotalTransactionsData(totalTxs.map(stat => ({
            date: stat.date,
            txs: stat.value
          })));
        }

        if (confirmPerDay && confirmPerDay.length > 0) {
          setRealConfirmationsPerDayData(confirmPerDay.map(stat => ({
            date: stat.date,
            confirmations: stat.value
          })));
        }

        if (avgTxTime && avgTxTime.length > 0) {
          setRealAvgTransactionTimeData(avgTxTime.map(stat => ({
            date: stat.date,
            time: stat.value
          })));
        }

        if (mempoolBytes && mempoolBytes.length > 0) {
          setRealMempoolData(mempoolBytes);
        }
      } catch (error) {
        console.error('Error fetching blockchain data:', error);
        // Falls back to mock data automatically
      }
    };
    fetchAllRealData();
  }, []);

  const fetchUnconfirmedTxs = async () => {
    setLoading(true);
    try {
      const data = await getUnconfirmedTransactions();
      if (data && data.length > 0) {
        const formatted = data.map((tx: any) => {
          // Calculate total from outputs since inputs may not be fully available in mempool
          let totalValue = 0;
          if (tx.out && Array.isArray(tx.out)) {
            totalValue = tx.out.reduce((sum: number, output: any) => sum + (output.value || 0), 0);
          }
          return {
            fullHash: tx.hash,
            hash: formatHash(tx.hash, 12),
            timestamp: formatTimestamp(tx.time),
            amount: satoshiToBTC(totalValue),
            value: satoshiToBTC(totalValue) * 88696,
          };
        });
        setUnconfirmedTransactions(formatted);
        setLastUpdated(new Date());
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error fetching unconfirmed transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnconfirmedTxs();
    const interval = setInterval(fetchUnconfirmedTxs, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalPages = Math.ceil(unconfirmedTransactions.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedTransactions = unconfirmedTransactions.slice(startIdx, endIdx);

  return (
    <>
      <style>{`
        /* Transactions Page Custom Styles */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .explorer-wrapper {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
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

        .chart-container {
          width: 100%;
          height: 300px;
          margin-bottom: 1.5rem;
        }
      `}</style>
      <div className="min-h-screen flex flex-col explorer-wrapper bg-gray-100 dark:bg-gray-900 overflow-x-hidden">
        <Header />
        
        <main className="flex-1">
          <TransactionsTicker />
          <TransactionsHeader />
          
          {/* Charts Section */}
          <section className="py-8 bg-gray-100 dark:bg-gray-900">
            <div className="container space-y-8">
              {/* Mempool Chart */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Mempool Bytes Per Fee Level</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={realMempoolData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorMempool" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'MvB', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Area type="monotone" dataKey="bytes" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMempool)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Average Transaction Time */}
              <Card>
                <CardHeader className="flex-row items-center justify-between border-b">
                  <div>
                    <CardTitle>Average Transaction Time</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">Dec 18 · 36 Minutes</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={realAvgTransactionTimeData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Bar dataKey="time" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Confirmations Per Day */}
              <Card>
                <CardHeader className="flex-row items-center justify-between border-b">
                  <div>
                    <CardTitle>Confirmations Per Day</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">Dec 25 · 464 Confirmations</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={realConfirmationsPerDayData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorConfirm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Area type="monotone" dataKey="confirmations" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorConfirm)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Total Transactions */}
              <Card>
                <CardHeader className="flex-row items-center justify-between border-b">
                  <div>
                    <CardTitle>Total Transactions</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">Dec 25 · 1 Txs</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={realTotalTransactionsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorTxs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Area type="monotone" dataKey="txs" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTxs)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Average Transactions Per Block */}
              <Card>
                <CardHeader className="flex-row items-center justify-between border-b">
                  <div>
                    <CardTitle>Average Transactions Per Block</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">Dec 25 · 3 Txs</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={realAvgTxPerBlockData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Unconfirmed Transactions */}
          <section className="py-8 bg-gray-100 dark:bg-gray-900">
            <div className="container">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Unconfirmed BTC Transactions (Live Mempool)</h2>
                  <p className="text-sm text-muted-foreground mt-1">Last updated: {lastUpdated.toLocaleTimeString()} • Total: {unconfirmedTransactions.length} pending</p>
                </div>
                <Button 
                  onClick={fetchUnconfirmedTxs} 
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh Now'}
                </Button>
              </div>
              <div className="space-y-4">
                {paginatedTransactions.map((tx, index) => (
                  <Link key={index} href={`/explorer/transaction/${tx.fullHash}`}>
                    <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-sm font-mono text-primary font-semibold hover:text-cyan-400">{tx.hash}</code>
                              <span className="text-xs text-muted-foreground">{tx.timestamp}</span>
                            </div>
                            <p className="text-lg font-bold text-foreground">{tx.amount} BTC</p>
                            <p className="text-sm text-muted-foreground">${tx.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-card rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIdx + 1} to {Math.min(endIdx, unconfirmedTransactions.length)} of {unconfirmedTransactions.length} transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="px-4 py-2 bg-secondary/50 rounded-lg text-sm font-medium">
                      {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
