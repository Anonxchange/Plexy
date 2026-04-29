import { useState, useEffect } from "react";
import { Copy, Search, Menu, X, Github, Twitter, CheckCircle2, Download, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTransaction, formatAddress, satoshiToBTC, formatTimestamp, getLatestBlocks, getBlockchain, weiToETH } from "@/lib/blockchain-api";
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
              <Zap className="h-5 w-5 text-primary-foreground" />
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
  <footer className="border-t border-border/50 bg-secondary/20 text-muted-foreground py-12">
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="font-semibold mb-4 text-foreground">Pexly</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-foreground transition-colors">Home</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Explore</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-foreground">Developers</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-foreground transition-colors">GitHub</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Webhook</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Bug Bounty</a></li>
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

export default function TransactionDetail() {
  const location = useLocation();
  const txHash = location[0].split('/').pop();
  const [txData, setTxData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentBlockHeight, setCurrentBlockHeight] = useState<number>(0);
  const [showBTC, setShowBTC] = useState(false);
  const [inputPage, setInputPage] = useState(1);
  const [outputPage, setOutputPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    const fetchData = async () => {
      if (!txHash) return;
      try {
        setLoading(true);
        const [txResult, blocksData] = await Promise.all([
          getTransaction(txHash),
          getLatestBlocks(1)
        ]);
        
        if (txResult) {
          setTxData(txResult);
        } else {
          setError('Transaction not found');
        }
        
        if (blocksData && blocksData.length > 0) {
          setCurrentBlockHeight(blocksData[0].height);
        }
      } catch (err: any) {
        setError(`Error loading transaction: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [txHash]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading transaction details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !txData) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <p className="text-red-500">{error || 'Transaction not found'}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const confirmations = txData.block_height && currentBlockHeight 
    ? Math.max(0, currentBlockHeight - txData.block_height + 1)
    : 0;

  const totalInput = txData.inputs?.reduce((sum: number, inp: any) => {
    return sum + (inp.prev_out?.value || 0);
  }, 0) || 0;

  const totalOutput = txData.out?.reduce((sum: number, out: any) => {
    return sum + (out.value || 0);
  }, 0) || 0;

  const fee = totalInput - totalOutput;
  const feePerByte = txData.size ? Math.round(fee / (txData.size / 8)) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <span>BITCOIN</span>
          <span>{' > '}</span>
          <span className="text-foreground font-medium">TRANSACTION {txHash?.substring(0, 6)}...{txHash?.substring(txHash.length - 6)}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Title and Key Status Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold mb-2">Bitcoin</h1>
              <p className="text-muted-foreground text-lg">transaction</p>
            </div>

            {/* Hash Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-full">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Hash</p>
                    <code className="text-sm break-all text-cyan-500 mb-4 block font-mono bg-secondary/30 p-2 rounded">{txHash}</code>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(txHash || '')}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 bg-cyan-500/20 text-cyan-500 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
                    SegWit
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transaction Status */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Transaction Status</p>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <span>In block {txData.block_height?.toLocaleString()}</span>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Confirmations: {confirmations}</p>
                </CardContent>
              </Card>

              {/* Fee Information */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Fee</p>
                  <div className="flex items-center gap-2">
                    <span 
                      onClick={() => setShowBTC(!showBTC)}
                      className="text-lg font-semibold text-foreground cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {showBTC ? `${satoshiToBTC(fee).toFixed(8)} BTC` : `$${(satoshiToBTC(fee) * 88696).toFixed(2)} USD`}
                    </span>
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {feePerByte} sat/B · {(feePerByte * 4).toFixed(2)} sat/vB
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Inputs Section */}
            {txData.inputs && txData.inputs.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Inputs ({txData.inputs.length})</CardTitle>
                  {txData.inputs.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={inputPage === 1}
                        onClick={() => setInputPage(prev => prev - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm font-medium">
                        {inputPage} / {Math.ceil(txData.inputs.length / ITEMS_PER_PAGE)}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={inputPage >= Math.ceil(txData.inputs.length / ITEMS_PER_PAGE)}
                        onClick={() => setInputPage(prev => prev + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {txData.inputs.slice((inputPage - 1) * ITEMS_PER_PAGE, inputPage * ITEMS_PER_PAGE).map((input: any, idx: number) => (
                      <div key={idx} className="bg-secondary/20 p-4 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Input {(inputPage - 1) * ITEMS_PER_PAGE + idx}</p>
                        {input.prev_out?.addr ? (
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <Link href={`/explorer/address/${input.prev_out.addr}`}>
                              <code className="text-sm text-cyan-500 break-all font-mono hover:text-cyan-400 cursor-pointer transition-colors">
                                {input.prev_out.addr}
                              </code>
                            </Link>
                            <p 
                              onClick={() => setShowBTC(!showBTC)}
                              className="text-sm font-semibold text-foreground cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                            >
                              {showBTC ? `${satoshiToBTC(input.prev_out.value).toFixed(8)} BTC` : `$${(satoshiToBTC(input.prev_out.value) * 88696).toFixed(2)} USD`}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Coinbase</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Outputs Section */}
            {txData.out && txData.out.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Outputs ({txData.out.length})</CardTitle>
                  {txData.out.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={outputPage === 1}
                        onClick={() => setOutputPage(prev => prev - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm font-medium">
                        {outputPage} / {Math.ceil(txData.out.length / ITEMS_PER_PAGE)}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={outputPage >= Math.ceil(txData.out.length / ITEMS_PER_PAGE)}
                        onClick={() => setOutputPage(prev => prev + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {txData.out.slice((outputPage - 1) * ITEMS_PER_PAGE, outputPage * ITEMS_PER_PAGE).map((output: any, idx: number) => (
                      <div key={idx} className="bg-secondary/20 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Output {(outputPage - 1) * ITEMS_PER_PAGE + idx}</p>
                          {idx === 1 && outputPage === 1 && <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">CHANGE</span>}
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          {output.addr ? (
                            <Link href={`/explorer/address/${output.addr}`}>
                              <code className="text-sm text-cyan-500 break-all font-mono hover:text-cyan-400 cursor-pointer transition-colors">
                                {output.addr}
                              </code>
                            </Link>
                          ) : (
                            <code className="text-sm text-cyan-500 font-mono">OP_RETURN</code>
                          )}
                          <p 
                            onClick={() => setShowBTC(!showBTC)}
                            className="text-sm font-semibold text-foreground cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                          >
                            {showBTC ? `${satoshiToBTC(output.value).toFixed(8)} BTC` : `$${(satoshiToBTC(output.value) * 88696).toFixed(2)} USD`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Transaction Details Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Confirmations</span>
                    <span className="font-semibold">{confirmations}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Block Height</span>
                    <span className="font-semibold">{txData.block_height?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Timestamp</span>
                    <span className="font-semibold">{txData.time ? formatTimestamp(txData.time) : 'Pending'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-4">
                    <span className="text-muted-foreground">Total Input</span>
                    <span className="font-semibold text-cyan-500">{satoshiToBTC(totalInput).toFixed(8)} BTC</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Output</span>
                    <span className="font-semibold text-cyan-500">{satoshiToBTC(totalOutput).toFixed(8)} BTC</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-4">
                    <span className="text-muted-foreground">Fees</span>
                    <span className="font-semibold text-foreground">{satoshiToBTC(fee).toFixed(8)} BTC</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-semibold">{txData.size} bytes</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-semibold">{txData.weight || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
