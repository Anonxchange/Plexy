import { useState } from "react";
import { Search, Menu, X, TrendingUp, TrendingDown, ArrowRight, Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

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

const blocksList = [
  { number: 929566, hash: "0000-b45b", txCount: 737, fill: 34.83 },
  { number: 929565, hash: "0000-eceb", txCount: 201, fill: 6.42 },
  { number: 929564, hash: "0000-764b", txCount: 3658, fill: 155.66 },
  { number: 929563, hash: "0000-0fc5", txCount: 4097, fill: 152.51 },
  { number: 929562, hash: "0000-c1d1", txCount: 2156, fill: 60.86 },
  { number: 929561, hash: "0000-8a3e", txCount: 3421, fill: 98.23 },
  { number: 929560, hash: "0000-f5a2", txCount: 2847, fill: 75.34 },
  { number: 929559, hash: "0000-d7bc", txCount: 1923, fill: 42.17 },
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

const BlocksTicker = () => (
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

const BlocksHeader = () => (
  <section className="py-12 md:py-16 bg-gray-100 dark:bg-gray-900">
    <div className="container">
      <div className="max-w-3xl mx-auto text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          <span className="gradient-text">Latest BTC Blocks</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-4">
          View recent blockchain blocks and transaction activity
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

export default function Blocks() {
  return (
    <>
      <style>{`
        /* Blocks Page Custom Styles */
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

        .fill-bar {
          height: 4px;
          background: linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%);
          border-radius: 2px;
          margin-top: 4px;
        }
      `}</style>
      <div className="min-h-screen flex flex-col explorer-wrapper bg-gray-100 dark:bg-gray-900 overflow-x-hidden">
        <Header />
        
        <main className="flex-1">
          <BlocksTicker />
          <BlocksHeader />
          
          {/* Blocks Table */}
          <section className="py-8 bg-gray-100 dark:bg-gray-900">
            <div className="container">
              <Card>
                <CardHeader className="flex-row items-center justify-between border-b">
                  <CardTitle>Latest Bitcoin Blocks</CardTitle>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/50">
                          <th className="text-left p-4 font-semibold text-sm">Number</th>
                          <th className="text-left p-4 font-semibold text-sm">Hash</th>
                          <th className="text-center p-4 font-semibold text-sm">Tx Count</th>
                          <th className="text-left p-4 font-semibold text-sm">Fill</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blocksList.map((block, index) => (
                          <tr 
                            key={block.number} 
                            className="border-b border-border hover:bg-secondary/50 transition-colors last:border-0"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">₿</span>
                                </div>
                                <span className="font-semibold text-foreground">#{block.number}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <code className="text-sm font-mono text-primary hover:underline cursor-pointer">
                                {block.hash}
                              </code>
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-semibold text-foreground">{block.txCount}</span>
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="text-sm font-semibold text-foreground mb-1">{block.fill.toFixed(2)}%</p>
                                <div className="w-full bg-secondary rounded-full h-1 overflow-hidden">
                                  <div 
                                    className="bg-orange-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(block.fill, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
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
