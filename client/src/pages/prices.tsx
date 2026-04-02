import { useState } from "react";
import { MarketInfo } from "@/components/market-info";
import { PriceChart } from "@/components/price-chart";
import { Search, Menu, X, TrendingUp, TrendingDown, ArrowRight, Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useCryptoPrices } from "@/lib/crypto-prices";
import { Link } from "wouter";

// ==================== CONSTANTS ====================

const SYMBOLS = ["BTC", "ETH", "USDT", "BNB", "SOL", "XRP", "TRX", "USDC", "ADA"] as const;

const COIN_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  USDT: "Tether",
  BNB: "BNB",
  SOL: "Solana",
  XRP: "XRP",
  TRX: "Tron",
  USDC: "USD Coin",
  ADA: "Cardano",
};

const navLinks = [
  { name: "Home", href: "/explorer" },
  { name: "Prices", href: "/explorer/prices" },
  { name: "Blocks", href: "/explorer/blocks" },
  { name: "Transactions", href: "/explorer/transactions" },
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
          <Button variant="hero" className="hidden md:flex">Connect Wallet</Button>
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
            <Button variant="hero" className="mt-2">Connect Wallet</Button>
          </nav>
        </div>
      )}
    </header>
  );
};

const PriceTicker = () => {
  const { data: prices } = useCryptoPrices([...SYMBOLS]);

  const tickerItems = SYMBOLS.map((symbol) => ({
    symbol,
    name: COIN_NAMES[symbol] ?? symbol,
    price: prices?.[symbol]?.current_price ?? null,
    change: prices?.[symbol]?.price_change_percentage_24h ?? null,
  }));

  return (
    <div className="w-full overflow-hidden border-b border-border bg-white dark:bg-gray-800 py-4 shadow-sm">
      <div className="flex ticker-scroll">
        {[...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => (
          <div key={`${item.symbol}-${index}`} className="flex items-center gap-4 px-6 border-r border-border/20 whitespace-nowrap">
            <span className="font-semibold text-foreground">{item.symbol}</span>
            <span className="text-muted-foreground text-sm">{item.name}</span>
            <span className="font-medium text-foreground">
              {item.price !== null
                ? `$${item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—"}
            </span>
            {item.change !== null && (
              <span className={`flex items-center gap-1 font-medium ${item.change >= 0 ? "text-success" : "text-destructive"}`}>
                {item.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

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

export default function Prices() {
  const { data: prices, isLoading } = useCryptoPrices([...SYMBOLS]);

  const pricesList = SYMBOLS.map((symbol) => ({
    symbol,
    name: COIN_NAMES[symbol] ?? symbol,
    price: prices?.[symbol]?.current_price ?? null,
    change24h: prices?.[symbol]?.price_change_percentage_24h ?? null,
  }));

  return (
    <>
      <style>{`
        .explorer-wrapper {
          font-family: 'Inter', system-ui, sans-serif;
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
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
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
      <div className="min-h-screen flex flex-col explorer-wrapper bg-gray-100 dark:bg-gray-900 overflow-x-hidden">
        <Header />

        <main className="flex-1">
          <PriceTicker />
          <div className="bg-gray-100 dark:bg-gray-900">
            <MarketInfo />
            <PriceChart />
          </div>

          {/* Prices Table */}
          <section className="py-4 bg-gray-100 dark:bg-gray-900">
            <div className="container">
              <Card>
                <CardHeader className="flex-row items-center justify-between border-b py-3">
                  <CardTitle className="text-lg">Top Cryptocurrencies</CardTitle>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/50">
                          <th className="text-left px-4 py-2 font-semibold text-xs uppercase tracking-wider">Name</th>
                          <th className="text-right px-4 py-2 font-semibold text-xs uppercase tracking-wider">Price</th>
                          <th className="text-right px-4 py-2 font-semibold text-xs uppercase tracking-wider">24h</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading
                          ? Array.from({ length: SYMBOLS.length }).map((_, i) => (
                              <tr key={i} className="border-b border-border animate-pulse">
                                <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-24" /></td>
                                <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-16 ml-auto" /></td>
                                <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-12 ml-auto" /></td>
                              </tr>
                            ))
                          : pricesList.map((coin) => {
                              const iconUrl = cryptoIconUrls[coin.symbol as keyof typeof cryptoIconUrls] || "";
                              const isPositive24h = coin.change24h !== null && coin.change24h >= 0;

                              return (
                                <tr
                                  key={coin.symbol}
                                  className="border-b border-border hover:bg-secondary/50 transition-colors last:border-0 cursor-pointer"
                                  onClick={() => window.location.href = `/explorer/asset/${coin.symbol.toLowerCase()}`}
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {iconUrl ? (
                                        <img src={iconUrl} alt={coin.symbol} className="w-8 h-8 rounded-full" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-bold">
                                          {coin.symbol[0]}
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-semibold text-sm">{coin.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{coin.symbol}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <p className="font-bold text-sm">
                                      {coin.price !== null
                                        ? `$${coin.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : "—"}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    {coin.change24h !== null ? (
                                      <p className={`flex items-center justify-end gap-1 font-medium text-xs ${isPositive24h ? "text-success" : "text-destructive"}`}>
                                        {isPositive24h ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {isPositive24h ? "+" : ""}{coin.change24h.toFixed(2)}%
                                      </p>
                                    ) : (
                                      <p className="text-xs text-muted-foreground text-right">—</p>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
