import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowRight, Info, ExternalLink, FileText, Github, Twitter, Search, Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useQuery } from "@tanstack/react-query";

const navLinks = [
  { name: "Home", href: "/explorer" },
  { name: "Prices", href: "/explorer/prices" },
  { name: "Blocks", href: "/explorer/blocks" },
  { name: "Transactions", href: "/explorer/transactions" },
];

// Static per-coin metadata (descriptions, history, project info — doesn't change)
const COIN_META: Record<string, {
  symbol: string;
  name: string;
  description: string;
  history: string;
  details: string;
  algorithm: string;
  genesisDate: string;
  website: string;
  coingeckoId: string;
}> = {
  btc: {
    symbol: "BTC", name: "Bitcoin", coingeckoId: "bitcoin",
    description: "Bitcoin (BTC) is a decentralized currency that eliminates the need for central authorities such as banks or governments by using a peer-to-peer internet network to confirm transactions directly between users.",
    history: "Bitcoin was created in 2009 by Satoshi Nakamoto, a pseudonymous developer. Bitcoin is designed to be completely decentralized and not controlled by any single authority. With a total supply of 21 million, its scarcity and decentralized nature make it almost impossible to inflate or manipulate.",
    details: "For this reason, many consider bitcoin to be the ultimate store of value or 'Digital Gold'. Bitcoin is fully open-source and operates on a proof-of-work blockchain, a shared public ledger and history of transactions organized into \"blocks\" that are \"chained\" together to prevent tampering.",
    algorithm: "SHA-256", genesisDate: "2009-01-03", website: "Bitcoin.org",
  },
  eth: {
    symbol: "ETH", name: "Ethereum", coingeckoId: "ethereum",
    description: "Ethereum (ETH) is a decentralized platform that runs smart contracts and decentralized applications (dApps). It enables developers to build and deploy applications on a blockchain with a native cryptocurrency.",
    history: "Ethereum was proposed in 2013 by programmer Vitalik Buterin when he was just 19 years old. It launched in 2015 and has since become the leading smart contract platform, revolutionizing how decentralized applications are built.",
    details: "The Ethereum network uses a consensus mechanism called Proof of Stake (PoS) to validate transactions and secure the network. Unlike Bitcoin, Ethereum's primary use is enabling complex smart contracts and decentralized applications.",
    algorithm: "Proof of Stake", genesisDate: "2015-07-30", website: "Ethereum.org",
  },
  usdt: {
    symbol: "USDT", name: "Tether", coingeckoId: "tether",
    description: "Tether (USDT) is a stablecoin that represents the US Dollar on the blockchain. Each USDT token is backed by a reserve of real US Dollars.",
    history: "Tether was launched in 2014 (originally as Realcoin) and is one of the first and most widely used stablecoins in the cryptocurrency market. It operates on multiple blockchains including Bitcoin, Ethereum, and others.",
    details: "USDT provides a way for users to transact in USD-equivalent value on blockchain networks without the volatility associated with other cryptocurrencies. It is widely used for trading, remittances, and storing value.",
    algorithm: "Stablecoin", genesisDate: "2014-11-06", website: "Tether.to",
  },
  bnb: {
    symbol: "BNB", name: "BNB", coingeckoId: "binancecoin",
    description: "BNB (Binance Coin) is the native token of the Binance Smart Chain, one of the largest blockchain ecosystems. It powers transactions and smart contracts on BSC.",
    history: "BNB was created by Binance in 2017 as a utility token for the Binance exchange. It later evolved to power the Binance Smart Chain, a parallel blockchain to Ethereum with lower fees and faster transactions.",
    details: "BNB has utility across the Binance ecosystem including trading discounts, staking rewards, and fuel for decentralized applications on the Binance Smart Chain.",
    algorithm: "Proof of Authority", genesisDate: "2017-07-25", website: "Binance.com",
  },
  sol: {
    symbol: "SOL", name: "Solana", coingeckoId: "solana",
    description: "Solana (SOL) is a high-performance blockchain platform designed for fast, scalable, and cost-efficient transactions and smart contracts.",
    history: "Solana was created by Anatoly Yakovenko and launched in 2020. It has gained popularity for its exceptional transaction throughput and low fees compared to other major blockchains.",
    details: "Solana uses a unique consensus mechanism called Proof of History (PoH) which allows it to process thousands of transactions per second, making it ideal for high-frequency applications and NFTs.",
    algorithm: "Proof of History", genesisDate: "2020-03-16", website: "Solana.com",
  },
  xrp: {
    symbol: "XRP", name: "XRP", coingeckoId: "ripple",
    description: "XRP is a digital asset designed for efficient cross-border payments. It operates on the XRP Ledger, a decentralized platform for value exchange.",
    history: "XRP was created by Ripple Labs in 2012 and has been designed to facilitate fast and affordable international payments. It differs from Bitcoin in that it doesn't rely on traditional mining.",
    details: "The XRP Ledger uses a consensus mechanism where trusted validators vote on the state of transactions. This allows for very fast transaction settlement times, ideal for global remittances.",
    algorithm: "XRP Ledger Consensus", genesisDate: "2012-06-02", website: "Ripple.com",
  },
  trx: {
    symbol: "TRX", name: "Tron", coingeckoId: "tron",
    description: "Tron (TRX) is a blockchain platform designed for decentralized content and entertainment. It enables creators to publish and distribute digital content directly.",
    history: "Tron was founded by Justin Sun in 2017. It started as an ERC-20 token on Ethereum before launching its own mainnet in 2018, focusing on content sharing and decentralized entertainment.",
    details: "The Tron network emphasizes high scalability and low transaction costs. It uses a delegated Proof of Stake (DPoS) consensus mechanism and has become a hub for DeFi applications and content sharing.",
    algorithm: "Delegated Proof of Stake", genesisDate: "2017-08-31", website: "Tron.network",
  },
  usdc: {
    symbol: "USDC", name: "USD Coin", coingeckoId: "usd-coin",
    description: "USD Coin (USDC) is a fully collateralized US Dollar stablecoin. It is issued by the Centre consortium and provides a transparent blockchain-based representation of the US Dollar.",
    history: "USDC was launched in 2018 as a joint initiative between Coinbase and Circle. It has become a widely trusted and transparent alternative to other stablecoins.",
    details: "Unlike some other stablecoins, USDC publishes monthly attestations showing that every token is backed 1:1 with US Dollars. This transparency has made it popular with institutions.",
    algorithm: "Stablecoin", genesisDate: "2018-09-26", website: "Circle.com",
  },
  ada: {
    symbol: "ADA", name: "Cardano", coingeckoId: "cardano",
    description: "Cardano (ADA) is a proof-of-stake blockchain platform that aims to provide a more balanced and sustainable ecosystem for cryptocurrencies.",
    history: "Cardano was founded by Charles Hoskinson, one of the co-founders of Ethereum. Development began in 2015 and the network launched in 2017 with a focus on academic research and formal verification.",
    details: "Cardano uses the Ouroboros proof-of-stake protocol, which is designed to be energy-efficient while maintaining the security and decentralization properties of blockchain networks.",
    algorithm: "Proof of Stake (Ouroboros)", genesisDate: "2017-09-29", website: "Cardano.org",
  },
};

// ==================== LIVE DATA HOOKS ====================

interface CoinMarket {
  current_price: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency: number;
  circulating_supply: number;
  max_supply: number | null;
}

function useCoinMarket(coingeckoId: string) {
  return useQuery<CoinMarket>({
    queryKey: ["coin-market", coingeckoId],
    queryFn: async () => {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coingeckoId}&price_change_percentage=1h,24h`
      );
      if (!res.ok) throw new Error("Failed to fetch market data");
      const arr = await res.json();
      if (!arr.length) throw new Error("No market data");
      return arr[0] as CoinMarket;
    },
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    retry: 1,
  });
}

interface ChartPoint {
  time: string;
  price: number;
}

function useCoinChart(coingeckoId: string, days: number) {
  return useQuery<ChartPoint[]>({
    queryKey: ["coin-chart", coingeckoId, days],
    queryFn: async () => {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}`
      );
      if (!res.ok) throw new Error("Failed to fetch chart data");
      const json = await res.json();
      const prices: [number, number][] = json.prices;
      const step = Math.max(1, Math.floor(prices.length / 24));
      return prices
        .filter((_, i) => i % step === 0)
        .map(([ts, price]) => ({
          time: new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          price: parseFloat(price.toFixed(2)),
        }));
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
  });
}

const ROI_PERIODS = [
  { period: "6H", hoursBack: 6 },
  { period: "1D", hoursBack: 24 },
  { period: "1W", hoursBack: 24 * 7 },
  { period: "1M", hoursBack: 24 * 30 },
  { period: "6M", hoursBack: 24 * 180 },
  { period: "1Y", hoursBack: 24 * 365 },
];

function pctChange(prices: [number, number][], hoursBack: number): number {
  if (prices.length < 2) return 0;
  const now = prices[prices.length - 1][0];
  const targetTs = now - hoursBack * 60 * 60 * 1000;
  const ref = prices.reduce((prev, curr) =>
    Math.abs(curr[0] - targetTs) < Math.abs(prev[0] - targetTs) ? curr : prev
  );
  const current = prices[prices.length - 1][1];
  return ((current - ref[1]) / ref[1]) * 100;
}

function useCoinRoi(coingeckoId: string) {
  return useQuery<{ period: string; usd: number; eth: number }[]>({
    queryKey: ["coin-roi", coingeckoId],
    queryFn: async () => {
      const [coinRes, ethRes] = await Promise.all([
        fetch(`https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=365`),
        fetch(`https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=365`),
      ]);
      if (!coinRes.ok || !ethRes.ok) throw new Error("ROI fetch failed");
      const [coinJson, ethJson] = await Promise.all([coinRes.json(), ethRes.json()]);
      const coinPrices: [number, number][] = coinJson.prices;
      const ethPrices: [number, number][] = ethJson.prices;

      return ROI_PERIODS.map(({ period, hoursBack }) => ({
        period,
        usd: parseFloat(pctChange(coinPrices, hoursBack).toFixed(2)),
        eth: parseFloat(pctChange(ethPrices, hoursBack).toFixed(2)),
      }));
    },
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}

// ==================== HELPERS ====================

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString("en-US")}`;
}

function formatSupply(n: number | null): string {
  if (n === null) return "∞";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatPct(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

const timeRanges = ["1D", "1W", "1M", "1Y", "MAX"];

// ==================== COMPONENTS ====================

const StatItem = ({
  label, value, isPositive, isNegative, showProgress, progressValue,
}: {
  label: string; value: string; isPositive?: boolean; isNegative?: boolean;
  showProgress?: boolean; progressValue?: number;
}) => (
  <div className="py-3">
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      {label} <Info className="h-3.5 w-3.5" />
    </div>
    <p className={`mt-1 text-lg font-semibold ${isPositive ? "text-success" : isNegative ? "text-destructive" : "text-foreground"}`}>
      {value}
    </p>
    {showProgress && progressValue !== undefined && (
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressValue}%` }} />
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
          {navLinks.map((link) =>
            link.href.startsWith("/") ? (
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
          )}
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
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
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
            )}
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
        <p className="text-sm text-muted-foreground text-center md:text-left">© {new Date().getFullYear()} Pexly Explorer. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="h-5 w-5" /></a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Github className="h-5 w-5" /></a>
        </div>
      </div>
    </div>
  </footer>
);

// ==================== MAIN PAGE ====================

const Index = () => {
  const location = useLocation();
  const [activeRange, setActiveRange] = useState("1D");
  const [activeTab, setActiveTab] = useState<"USD" | "ETH">("USD");

  const coin = location[0].split("/").pop()?.toLowerCase() || "btc";
  const meta = COIN_META[coin] ?? COIN_META.btc;
  const iconUrl = cryptoIconUrls[meta.symbol as keyof typeof cryptoIconUrls] || "";

  const rangeToDays: Record<string, number> = { "1D": 1, "1W": 7, "1M": 30, "1Y": 365, "MAX": 1825 };

  const { data: market, isLoading: marketLoading } = useCoinMarket(meta.coingeckoId);
  const { data: chartData, isLoading: chartLoading } = useCoinChart(meta.coingeckoId, rangeToDays[activeRange] ?? 1);
  const { data: roiData, isLoading: roiLoading } = useCoinRoi(meta.coingeckoId);

  const change24h = market?.price_change_percentage_24h;
  const change1h = market?.price_change_percentage_1h_in_currency;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main>
        {/* Coin Header */}
        <div className="border-b border-border bg-card px-4 py-6 animate-fade-in">
          <div className="flex items-start gap-4">
            {iconUrl ? (
              <img src={iconUrl} alt={meta.name} className="h-14 w-14 rounded-full shadow-lg shadow-primary/20" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/30 flex items-center justify-center text-lg font-bold">
                {meta.symbol[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{meta.name}</h1>
                <span className="text-lg font-medium text-primary">{meta.symbol}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{meta.description}</p>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="border-b border-border bg-card px-4 py-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-semibold text-foreground">Price History</h2>

          <div className="mt-4">
            {marketLoading ? (
              <div className="h-10 bg-muted rounded w-40 animate-pulse" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    ${market?.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "—"}
                  </span>
                  {change24h !== undefined && (
                    <span className={`text-sm font-medium ${change24h >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatPct(change24h)} (24h)
                    </span>
                  )}
                </div>
                {market && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Vol {formatLargeNumber(market.total_volume)} USD
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-1">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeRange === range ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground">USD</button>
          </div>

          <div className="mt-6 h-48">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                Loading chart…
              </div>
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value}`}
                    domain={["dataMin - 1%", "dataMax + 1%"]}
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
                  <Area type="monotone" dataKey="price" stroke="hsl(33, 93%, 54%)" strokeWidth={2} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Chart unavailable.
              </div>
            )}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="gradient-peach px-4 py-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-2xl font-bold leading-tight text-foreground">
            Trade <span className="text-primary">{meta.name}</span> with the world's most popular crypto wallet.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">Over 83 million wallets created to buy, sell, and earn crypto.</p>
          <Button className="mt-6 w-full justify-between rounded-full bg-foreground px-6 py-6 text-base font-medium text-background hover:bg-foreground/90">
            Buy {meta.symbol} <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Market Info */}
        <div className="border-b border-border bg-card px-4 py-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-lg font-semibold text-foreground">Market Info</h2>

          {marketLoading ? (
            <div className="mt-4 space-y-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : market ? (
            <div className="mt-4 grid grid-cols-2 gap-x-8">
              <StatItem label="Market Cap" value={formatLargeNumber(market.market_cap)} />
              <StatItem label="Vol / Market Cap" value={(market.total_volume / market.market_cap).toFixed(4)} />
              <StatItem label="Vol 24h" value={formatLargeNumber(market.total_volume)} />
              <StatItem
                label="1h Change" value={formatPct(change1h)}
                isNegative={change1h !== undefined && change1h < 0}
                isPositive={change1h !== undefined && change1h > 0}
              />
              <StatItem
                label="24h Change" value={formatPct(change24h)}
                isNegative={change24h !== undefined && change24h < 0}
                isPositive={change24h !== undefined && change24h > 0}
              />
              <StatItem label="24h High" value={`$${market.high_24h.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} isPositive />
              <StatItem label="24h Low" value={`$${market.low_24h.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} isNegative />
              <StatItem
                label="Circulating Supply"
                value={formatSupply(market.circulating_supply)}
                showProgress={market.max_supply !== null}
                progressValue={market.max_supply ? Math.min(100, (market.circulating_supply / market.max_supply) * 100) : undefined}
              />
              <StatItem label="Max Supply" value={formatSupply(market.max_supply)} />
              <StatItem label="Algorithm" value={meta.algorithm} />
              <StatItem label="Genesis Block Date" value={meta.genesisDate} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Market data unavailable.</p>
          )}

          <p className="mt-6 text-xs text-muted-foreground">Data provided by CoinGecko</p>
        </div>

        {/* About Section */}
        <div className="border-b border-border bg-card px-4 py-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-lg font-semibold text-foreground">About</h2>

          <div className="mt-4">
            <h3 className="font-semibold text-foreground">A brief history</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{meta.history}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{meta.details}</p>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <h3 className="font-semibold text-foreground">Project Links</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ExternalLink className="h-4 w-4" /> Website
                </div>
                <a href="#" className="mt-1 block font-medium text-primary hover:underline">{meta.website}</a>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" /> Documents
                </div>
                <a href="#" className="mt-1 block font-medium text-primary hover:underline">Whitepaper</a>
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
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
                    className={`cursor-pointer px-4 py-3 text-center text-sm font-medium transition-colors ${activeTab === "USD" ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    USD
                  </th>
                  <th
                    onClick={() => setActiveTab("ETH")}
                    className={`cursor-pointer px-4 py-3 text-center text-sm font-medium transition-colors ${activeTab === "ETH" ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    ETH
                  </th>
                </tr>
              </thead>
              <tbody>
                {roiLoading
                  ? ROI_PERIODS.map(({ period }) => (
                      <tr key={period} className="border-b border-border animate-pulse">
                        <td className="px-4 py-3 text-sm text-muted-foreground">{period}</td>
                        <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-12 mx-auto" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-12 mx-auto" /></td>
                      </tr>
                    ))
                  : roiData?.map((row, index) => (
                      <tr key={row.period} className={index !== (roiData.length - 1) ? "border-b border-border" : ""}>
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
