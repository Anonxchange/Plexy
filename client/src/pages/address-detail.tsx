import { useState, useEffect } from "react";
import { Copy, TrendingUp, TrendingDown, Clock, DollarSign, Search, Menu, X, Github, Twitter, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAddress, formatAddress, satoshiToBTC, formatTimestamp, formatHash } from "@/lib/blockchain-api";
import { Link } from "wouter";

const navLinks = [
  { name: "Home", href: "/explorer" },
  { name: "Prices", href: "/explorer/prices" },
  { name: "Blocks", href: "/explorer/blocks" },
  { name: "Transactions", href: "/explorer/transactions" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/explorer">
          <a className="flex items-center gap-2 cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">P</span>
            </div>
            <span className="text-xl font-bold">Pexly Explorer</span>
          </a>
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

export default function AddressDetail() {
  const location = useLocation();
  const address = location[0].split('/').pop();
  const [addressData, setAddressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAddress = async () => {
      if (!address) return;
      try {
        setLoading(true);
        const data = await getAddress(address);
        if (data) {
          setAddressData(data);
        } else {
          setError('Address not found');
        }
      } catch (err: any) {
        setError(`Error loading address: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [address]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
            <p className="mt-4 text-muted-foreground">Loading address details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !addressData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8">
          <Card variant="default" className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error || 'Address not found'}</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const balance = satoshiToBTC(addressData.final_balance);
  const received = satoshiToBTC(addressData.total_received);
  const sent = satoshiToBTC(addressData.total_sent);
  const transactions = addressData.txs || [];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Title */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-2">Bitcoin Address</h2>
            <p className="text-muted-foreground">View address details, balance, and transaction history</p>
          </div>

          {/* Address Hash Card */}
          <Card variant="default" className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">ADDRESS HASH</p>
                  <div className="flex items-center gap-3 bg-secondary/50 p-4 rounded-lg break-all">
                    <code className="text-primary font-mono text-sm flex-1">{addressData.address}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(addressData.address)}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card variant="default">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">MAIN BALANCE</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">{balance.toFixed(8)} BTC</p>
                    <p className="text-sm text-muted-foreground">
                      ≈ ${(balance * 88696).toFixed(2)} USD
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="default">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">TRANSACTIONS</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold">{addressData.n_tx || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card variant="default">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">TOTAL RECEIVED</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">+{received.toFixed(8)} BTC</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="default">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">TOTAL SENT</p>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">-{sent.toFixed(8)} BTC</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Address Info */}
          <Card variant="default" className="mb-6">
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Address</span>
                  <code className="font-mono text-sm">{formatAddress(addressData.address)}</code>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Hash160</span>
                  <code className="font-mono text-sm">{addressData.hash160}</code>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-bold">{balance.toFixed(8)} BTC</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Transactions */}
          {transactions.length > 0 && (
            <Card variant="default" className="mb-6">
              <CardHeader>
                <CardTitle>Transactions ({transactions.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="text-left p-4 font-semibold text-sm">Transaction Hash</th>
                        <th className="text-right p-4 font-semibold text-sm">Amount (BTC)</th>
                        <th className="text-right p-4 font-semibold text-sm">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 50).map((tx: any, index: number) => {
                        const txAmount = satoshiToBTC(tx.result || 0);
                        const isIncoming = txAmount > 0;
                        
                        return (
                          <tr key={tx.hash || index} className="border-b border-border hover:bg-secondary/50 transition-colors last:border-0">
                            <td className="p-4">
                              <code className="font-mono text-sm text-primary hover:underline cursor-pointer">
                                {formatHash(tx.hash, 12)}
                              </code>
                            </td>
                            <td className="p-4 text-right">
                              <span className={`font-bold ${isIncoming ? 'text-success' : 'text-destructive'}`}>
                                {isIncoming ? '+' : ''}{txAmount.toFixed(8)} BTC
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-muted-foreground text-sm">
                                {tx.time ? formatTimestamp(tx.time) : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {transactions.length > 50 && (
                  <div className="p-4 border-t border-border text-center">
                    <p className="text-sm text-muted-foreground">
                      Showing 50 of {transactions.length} transactions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
