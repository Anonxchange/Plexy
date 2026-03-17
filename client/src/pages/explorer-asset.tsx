import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowRight, Info, ExternalLink, FileText, Github, Twitter, Search, Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { cryptoIconUrls } from "@/lib/crypto-icons";

const navLinks = [
  { name: "Home", href: "/explorer" },
  { name: "Prices", href: "/explorer/prices" },
  { name: "Blocks", href: "/explorer/blocks" },
  { name: "Transactions", href: "/explorer/transactions" },
];

const coinData: Record<string, any> = {
  btc: {
    symbol: "BTC",
    name: "Bitcoin",
    price: 88668.01,
    volume: "37,765,013,220",
    description: "Bitcoin (BTC) is a decentralized currency that eliminates the need for central authorities such as banks or governments by using a peer-to-peer internet network to confirm transactions directly between users.",
    history: "Bitcoin was created in 2009 by Satoshi Nakamoto, a pseudonymous developer. Bitcoin is designed to be completely decentralized and not controlled by any single authority. With a total supply of 21 million, its scarcity and decentralized nature make it almost impossible to inflate or manipulate.",
    details: "For this reason, many consider bitcoin to be the ultimate store of value or 'Digital Gold'. Bitcoin is fully open-source and operates on a proof-of-work blockchain, a shared public ledger and history of transactions organized into \"blocks\" that are \"chained\" together to prevent tampering.",
    marketCap: "$1.76T",
    volMarketCap: "0.02",
    vol24h: "$37.8B",
    change1h: "-0.03%",
    change24h: "1.27%",
    high24h: "$89,405.00",
    low24h: "$86,937.00",
    circulating: "19,967,318",
    maxSupply: "21,000,000",
    algorithm: "SHA-256",
    genesisDate: "2009-01-03",
    website: "Bitcoin.org",
  },
  eth: {
    symbol: "ETH",
    name: "Ethereum",
    price: 2970.09,
    volume: "20,345,123,456",
    description: "Ethereum (ETH) is a decentralized platform that runs smart contracts and decentralized applications (dApps). It enables developers to build and deploy applications on a blockchain with a native cryptocurrency.",
    history: "Ethereum was proposed in 2013 by programmer Vitalik Buterin when he was just 19 years old. It launched in 2015 and has since become the leading smart contract platform, revolutionizing how decentralized applications are built.",
    details: "The Ethereum network uses a consensus mechanism called Proof of Stake (PoS) to validate transactions and secure the network. Unlike Bitcoin, Ethereum's primary use is enabling complex smart contracts and decentralized applications.",
    marketCap: "$356.8B",
    volMarketCap: "0.05",
    vol24h: "$15.2B",
    change1h: "0.12%",
    change24h: "1.80%",
    high24h: "$3,041.00",
    low24h: "$2,945.00",
    circulating: "120,564,000",
    maxSupply: "∞",
    algorithm: "Proof of Stake",
    genesisDate: "2015-07-30",
    website: "Ethereum.org",
  },
  usdt: {
    symbol: "USDT",
    name: "Tether",
    price: 1.00,
    volume: "45,123,456,789",
    description: "Tether (USDT) is a stablecoin that represents the US Dollar on the blockchain. Each USDT token is backed by a reserve of real US Dollars.",
    history: "Tether was launched in 2014 (originally as Realcoin) and is one of the first and most widely used stablecoins in the cryptocurrency market. It operates on multiple blockchains including Bitcoin, Ethereum, and others.",
    details: "USDT provides a way for users to transact in USD-equivalent value on blockchain networks without the volatility associated with other cryptocurrencies. It is widely used for trading, remittances, and storing value.",
    marketCap: "$140.5B",
    volMarketCap: "0.32",
    vol24h: "$45.1B",
    change1h: "0.00%",
    change24h: "0.00%",
    high24h: "$1.01",
    low24h: "$0.99",
    circulating: "140,500,000,000",
    maxSupply: "∞",
    algorithm: "Stablecoin",
    genesisDate: "2014-11-06",
    website: "Tether.to",
  },
  bnb: {
    symbol: "BNB",
    name: "BNB",
    price: 631.42,
    volume: "4,456,789,123",
    description: "BNB (Binance Coin) is the native token of the Binance Smart Chain, one of the largest blockchain ecosystems. It powers transactions and smart contracts on BSC.",
    history: "BNB was created by Binance in 2017 as a utility token for the Binance exchange. It later evolved to power the Binance Smart Chain, a parallel blockchain to Ethereum with lower fees and faster transactions.",
    details: "BNB has utility across the Binance ecosystem including trading discounts, staking rewards, and fuel for decentralized applications on the Binance Smart Chain.",
    marketCap: "$76.9B",
    volMarketCap: "0.18",
    vol24h: "$1.8B",
    change1h: "0.05%",
    change24h: "0.85%",
    high24h: "$644.50",
    low24h: "$625.30",
    circulating: "121,800,000",
    maxSupply: "200,000,000",
    algorithm: "Proof of Authority",
    genesisDate: "2017-07-25",
    website: "Binance.com",
  },
  sol: {
    symbol: "SOL",
    name: "Solana",
    price: 123.68,
    volume: "2,123,456,789",
    description: "Solana (SOL) is a high-performance blockchain platform designed for fast, scalable, and cost-efficient transactions and smart contracts.",
    history: "Solana was created by Anatoly Yakovenko and launched in 2020. It has gained popularity for its exceptional transaction throughput and low fees compared to other major blockchains.",
    details: "Solana uses a unique consensus mechanism called Proof of History (PoH) which allows it to process thousands of transactions per second, making it ideal for high-frequency applications and NFTs.",
    marketCap: "$56.2B",
    volMarketCap: "0.08",
    vol24h: "$2.1B",
    change1h: "-0.15%",
    change24h: "-0.42%",
    high24h: "$127.89",
    low24h: "$121.45",
    circulating: "455,000,000",
    maxSupply: "∞",
    algorithm: "Proof of History",
    genesisDate: "2020-03-16",
    website: "Solana.com",
  },
  xrp: {
    symbol: "XRP",
    name: "XRP",
    price: 1.87,
    volume: "1,234,567,890",
    description: "XRP is a digital asset designed for efficient cross-border payments. It operates on the XRP Ledger, a decentralized platform for value exchange.",
    history: "XRP was created by Ripple Labs in 2012 and has been designed to facilitate fast and affordable international payments. It differs from Bitcoin in that it doesn't rely on traditional mining.",
    details: "The XRP Ledger uses a consensus mechanism where trusted validators vote on the state of transactions. This allows for very fast transaction settlement times, ideal for global remittances.",
    marketCap: "$85.3B",
    volMarketCap: "0.15",
    vol24h: "$3.2B",
    change1h: "0.25%",
    change24h: "2.14%",
    high24h: "$1.92",
    low24h: "$1.82",
    circulating: "45,600,000,000",
    maxSupply: "100,000,000,000",
    algorithm: "XRP Ledger Consensus",
    genesisDate: "2012-06-02",
    website: "Ripple.com",
  },
  trx: {
    symbol: "TRX",
    name: "Tron",
    price: 0.28,
    volume: "890,123,456",
    description: "Tron (TRX) is a blockchain platform designed for decentralized content and entertainment. It enables creators to publish and distribute digital content directly.",
    history: "Tron was founded by Justin Sun in 2017. It started as an ERC-20 token on Ethereum before launching its own mainnet in 2018, focusing on content sharing and decentralized entertainment.",
    details: "The Tron network emphasizes high scalability and low transaction costs. It uses a delegated Proof of Stake (DPoS) consensus mechanism and has become a hub for DeFi applications and content sharing.",
    marketCap: "$23.4B",
    volMarketCap: "0.04",
    vol24h: "$645M",
    change1h: "-0.05%",
    change24h: "-0.01%",
    high24h: "$0.29",
    low24h: "$0.27",
    circulating: "83,600,000,000",
    maxSupply: "∞",
    algorithm: "Delegated Proof of Stake",
    genesisDate: "2017-08-31",
    website: "Tron.network",
  },
  usdc: {
    symbol: "USDC",
    name: "USD Coin",
    price: 1.00,
    volume: "25,678,901,234",
    description: "USD Coin (USDC) is a fully collateralized US Dollar stablecoin. It is issued by the Centre consortium and provides a transparent blockchain-based representation of the US Dollar.",
    history: "USDC was launched in 2018 as a joint initiative between Coinbase and Circle. It has become a widely trusted and transparent alternative to other stablecoins.",
    details: "Unlike some other stablecoins, USDC publishes monthly attestations showing that every token is backed 1:1 with US Dollars. This transparency has made it popular with institutions.",
    marketCap: "$35.2B",
    volMarketCap: "0.22",
    vol24h: "$5.8B",
    change1h: "0.00%",
    change24h: "0.01%",
    high24h: "$1.01",
    low24h: "$0.99",
    circulating: "35,200,000,000",
    maxSupply: "∞",
    algorithm: "Stablecoin",
    genesisDate: "2018-09-26",
    website: "Circle.com",
  },
};

// Chart data - same for all coins for now
const mockData = [
  { time: "13:20", price: 87200 },
  { time: "15:00", price: 87400 },
  { time: "17:00", price: 87100 },
  { time: "19:25", price: 87600 },
  { time: "21:00", price: 88200 },
  { time: "23:00", price: 88800 },
  { time: "01:32", price: 89200 },
  { time: "03:00", price: 89400 },
  { time: "05:00", price: 88900 },
  { time: "07:35", price: 88600 },
  { time: "09:00", price: 88700 },
  { time: "11:26", price: 88668 },
];

const timeRanges = ["1D", "1W", "1M", "1Y", "MAX"];

const roiData = [
  { period: "6H", usd: 0.07, eth: -0.33 },
  { period: "1D", usd: 1.15, eth: -0.15 },
  { period: "1W", usd: 0.27, eth: 0.60 },
  { period: "1M", usd: -2.95, eth: -1.38 },
  { period: "6M", usd: -17.31, eth: -30.67 },
  { period: "1Y", usd: -6.08, eth: 5.31 },
];

// Stat Item Component
const StatItem = ({ 
  label, 
  value, 
  isPositive, 
  isNegative, 
  showProgress, 
  progressValue 
}: { 
  label: string; 
  value: string; 
  isPositive?: boolean; 
  isNegative?: boolean; 
  showProgress?: boolean; 
  progressValue?: number; 
}) => (
  <div className="py-3">
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      {label}
      <Info className="h-3.5 w-3.5" />
    </div>
    <p className={`mt-1 text-lg font-semibold ${isPositive ? "text-success" : isNegative ? "text-destructive" : "text-foreground"}`}>
      {value}
    </p>
    {showProgress && progressValue !== undefined && (
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progressValue}%` }}
        />
      </div>
    )}
  </div>
);

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/explorer">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Pexly Explorer</span>
          </div>
        </Link>

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

const Footer = () => (
  <footer className="border-t border-border bg-card text-muted-foreground mt-12 py-8">
    <div className="container px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h4 className="font-semibold mb-4 text-foreground">Pexly</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Career</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-foreground">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-foreground transition-colors">Blocks</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Transactions</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Addresses</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Charts</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Charts</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-foreground">Company</h4>
          <ul className="space-y-2 text-sm">
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

const Index = () => {
  const location = useLocation();
  const [activeRange, setActiveRange] = useState("1D");
  const [activeTab, setActiveTab] = useState<"USD" | "ETH">("USD");

  // Extract coin from URL
  const coin = location[0].split('/').pop()?.toLowerCase() || 'btc';
  const data = coinData[coin] || coinData.btc;
  const iconUrl = cryptoIconUrls[data.symbol as keyof typeof cryptoIconUrls] || '';

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main>
        {/* Coin Header */}
        <div className="border-b border-border bg-card px-4 py-6 animate-fade-in">
          <div className="flex items-start gap-4">
            {iconUrl ? (
              <img src={iconUrl} alt={data.name} className="h-14 w-14 rounded-full shadow-lg shadow-primary/20" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/30 flex items-center justify-center text-lg font-bold">
                {data.symbol[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{data.name}</h1>
                <span className="text-lg font-medium text-primary">{data.symbol}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {data.description}
              </p>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="border-b border-border bg-card px-4 py-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-semibold text-foreground">Price History</h2>
          
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-sm text-muted-foreground">• 11:26</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Vol {data.volume} {data.symbol}</p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-1">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeRange === range
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground">
              USD
            </button>
          </div>

          <div className="mt-6 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(33, 93%, 54%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(33, 93%, 54%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
                  domain={["dataMin - 500", "dataMax + 500"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 91%)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(33, 93%, 54%)"
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="gradient-peach px-4 py-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-2xl font-bold leading-tight text-foreground">
            Trade <span className="text-primary">{data.name}</span> with the world's most popular crypto wallet.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Over 83 million wallets created to buy, sell, and earn crypto.
          </p>
          <Button className="mt-6 w-full justify-between rounded-full bg-foreground px-6 py-6 text-base font-medium text-background hover:bg-foreground/90">
            Buy {data.symbol}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Market Info */}
        <div className="border-b border-border bg-card px-4 py-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-lg font-semibold text-foreground">Market Info</h2>
          
          <div className="mt-4 grid grid-cols-2 gap-x-8">
            <StatItem label="Market Cap" value={data.marketCap} />
            <StatItem label="Vol / Market Cap" value={data.volMarketCap} />
            <StatItem label="Vol 24h" value={data.vol24h} />
            <StatItem label="1h Change" value={data.change1h} isNegative={data.change1h.startsWith('-')} isPositive={!data.change1h.startsWith('-') && data.change1h !== '0.00%'} />
            <StatItem label="24h Change" value={data.change24h} isNegative={data.change24h.startsWith('-')} isPositive={!data.change24h.startsWith('-') && data.change24h !== '0.00%'} />
            <StatItem label="24h High" value={data.high24h} isPositive />
            <StatItem label="24h Low" value={data.low24h} isNegative />
            <StatItem label="Circulating Supply" value={data.circulating} showProgress progressValue={95} />
            <StatItem label="Max Supply" value={data.maxSupply} />
            <StatItem label="Algorithm" value={data.algorithm} />
            <StatItem label="Genesis Block Date" value={data.genesisDate} />
          </div>
          
          <p className="mt-6 text-xs text-muted-foreground">Data provided by CoinGecko</p>
        </div>

        {/* About Section */}
        <div className="border-b border-border bg-card px-4 py-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-lg font-semibold text-foreground">About</h2>
          
          <div className="mt-4">
            <h3 className="font-semibold text-foreground">A brief history</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {data.history}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {data.details}
            </p>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <h3 className="font-semibold text-foreground">Project Links</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ExternalLink className="h-4 w-4" />
                  Website
                </div>
                <a href="#" className="mt-1 block font-medium text-primary hover:underline">
                  {data.website}
                </a>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Documents
                </div>
                <a href="#" className="mt-1 block font-medium text-primary hover:underline">
                  Whitepaper
                </a>
              </div>
            </div>
            
            <div className="mt-4 flex gap-4">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </a>
            </div>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Please verify all project links, data may change over time. Be vigilant of scams interpreting official projects.
          </p>
        </div>

        {/* ROI Table */}
        <div className="border-b border-border bg-card px-4 py-6 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">ROI</th>
                  <th
                    onClick={() => setActiveTab("USD")}
                    className={`cursor-pointer px-4 py-3 text-center text-sm font-medium transition-colors ${
                      activeTab === "USD" ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    USD
                  </th>
                  <th
                    onClick={() => setActiveTab("ETH")}
                    className={`cursor-pointer px-4 py-3 text-center text-sm font-medium transition-colors ${
                      activeTab === "ETH" ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    ETH
                  </th>
                </tr>
              </thead>
              <tbody>
                {roiData.map((row, index) => (
                  <tr key={row.period} className={index !== roiData.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.period}</td>
                    <td className={`px-4 py-3 text-center text-sm font-medium ${row.usd >= 0 ? "text-success" : "text-destructive"}`}>
                      {row.usd.toFixed(2)}%
                    </td>
                    <td className={`px-4 py-3 text-center text-sm font-medium ${row.eth >= 0 ? "text-success" : "text-destructive"}`}>
                      {row.eth.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
