import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowUpDown, TrendingDown, Shield, Gift, Loader2, Lock, BarChart3 } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useSchema, swapPageSchema } from "@/hooks/use-schema";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useSwapPrice, calculateSwapAmount } from "@/hooks/use-swap-price";
import { getCryptoPrices } from "@/lib/crypto-prices";
import { useToast } from "@/hooks/use-toast";
import { swapExecutionService, type ExecutionOrder } from "@/lib/swap-execution";

const formatDistanceToNow = (date: Date | number | string, _options?: any) => {
  const d = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const currencies = [
  { symbol: "BTC", name: "Bitcoin", iconUrl: cryptoIconUrls.BTC, chain: "BTC", identifier: "BTC.BTC" },
  { symbol: "USDT", name: "Tether", iconUrl: cryptoIconUrls.USDT, chain: "ETH", identifier: "ETH.USDT-0xdac17f958d2ee523a2206206994597C13D831ec7" },
  { symbol: "ETH", name: "Ethereum", iconUrl: cryptoIconUrls.ETH, chain: "ETH", identifier: "ETH.ETH" },
  { symbol: "USDC", name: "USD Coin", iconUrl: cryptoIconUrls.USDC, chain: "ETH", identifier: "ETH.USDC-0xa0b86991c6218b36c1d19D4a2e9Eb0ce3606eb48" },
  { symbol: "SOL", name: "Solana", iconUrl: cryptoIconUrls.SOL, chain: "SOL", identifier: "SOL.SOL" },
  { symbol: "TRX", name: "Tron", iconUrl: cryptoIconUrls.TRX, chain: "TRX", identifier: "TRX.TRX" },
  { symbol: "BNB", name: "BNB", iconUrl: cryptoIconUrls.BNB, chain: "BSC", identifier: "BSC.BNB" },
  { symbol: "XRP", name: "XRP", iconUrl: cryptoIconUrls.XRP, chain: "XRP", identifier: "XRP.XRP" },
  { symbol: "MATIC", name: "Polygon", iconUrl: cryptoIconUrls.MATIC, chain: "POLYGON", identifier: "POLYGON.MATIC" },
  { symbol: "ARB", name: "Arbitrum", iconUrl: cryptoIconUrls.ARB, chain: "ARBITRUM", identifier: "ARBITRUM.ARB" },
  { symbol: "OP", name: "Optimism", iconUrl: cryptoIconUrls.OP, chain: "OPTIMISM", identifier: "OPTIMISM.OP" },
];

export function Swap() {
  useSchema(swapPageSchema, "swap-page-schema");
  const { user, sessionPassword, setSessionPassword } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [fromAmount, setFromAmount] = useState("0.00001");
  const [toAmount, setToAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("BTC");
  const [toCurrency, setToCurrency] = useState("USDT");
  const [isUpdatingFromInput, setIsUpdatingFromInput] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");

  // Fetch live swap prices
  const { marketRate, swapRate, percentageDiff, isLoading } = useSwapPrice(
    fromCurrency,
    toCurrency
  );

  const [isSwapping, setIsSwapping] = useState(false);
  const [history, setHistory] = useState<ExecutionOrder[]>([]);
  const [estFees, setEstFees] = useState<Record<string, string>>({
    BTC: "0.0001 BTC",
    ETH: "0.002 ETH",
    BSC: "0.001 BNB",
    SOL: "0.000005 SOL",
    TRX: "15 TRX"
  });

  useEffect(() => {
    const fetchFees = async () => {
      try {
        // Fetch Bitcoin fees
        const btcRes = await fetch('https://mempool.space/api/v1/fees/recommended');
        if (btcRes.ok) {
          const btcData = await btcRes.json();
          // Average tx is ~140 vBytes, convert sat/vB to BTC
          const btcFee = (btcData.hourFee * 140) / 1e8;
          setEstFees(prev => ({ ...prev, BTC: `${btcFee.toFixed(6)} BTC` }));
        }

        // Fetch Ethereum Gas Price
        const ethRes = await fetch('https://api.etherscan.io/api?module=proxy&action=eth_gasPrice');
        if (ethRes.ok) {
          const ethData = await ethRes.json();
          const gasPrice = parseInt(ethData.result, 16);
          // Typical swap is ~150k gas
          const ethFee = (gasPrice * 150000) / 1e18;
          setEstFees(prev => ({ ...prev, ETH: `${ethFee.toFixed(5)} ETH` }));
        }
      } catch (e) {
        console.error("Failed to fetch live fees", e);
      }
    };

    fetchFees();
    setHistory(swapExecutionService.getOrderHistory());
  }, []);

  // Auto-update toAmount when prices change or fromAmount changes
  useEffect(() => {
    if (isUpdatingFromInput && swapRate > 0) {
      const amount = parseFloat(fromAmount) || 0;
      const calculated = calculateSwapAmount(amount, swapRate);
      // Round to 8 decimal places for better precision, especially for BTC
      setToAmount(calculated.toLocaleString('en-US', { 
        useGrouping: false, 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 8 
      }));
    }
  }, [fromAmount, swapRate, isUpdatingFromInput]);

  // Auto-update fromAmount when toAmount is manually changed
  useEffect(() => {
    if (!isUpdatingFromInput && swapRate > 0) {
      const amount = parseFloat(toAmount) || 0;
      const calculated = amount / swapRate;
      setFromAmount(calculated.toLocaleString('en-US', { 
        useGrouping: false, 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 8 
      }));
    }
  }, [toAmount, swapRate, isUpdatingFromInput]);

  const handleSwapCurrencies = () => {
    const tempCurrency = fromCurrency;
    const tempAmount = fromAmount;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleFromAmountChange = (value: string) => {
    setIsUpdatingFromInput(true);
    setFromAmount(value);
  };

  const handleToAmountChange = (value: string) => {
    setIsUpdatingFromInput(false);
    setToAmount(value);
  };

  const formatRate = (rate: number) => {
    if (rate >= 1000) {
      return rate.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 5 
      });
    } else if (rate >= 1) {
      return rate.toFixed(2);
    } else {
      return rate.toFixed(6);
    }
  };

  const handleSwap = async () => {
    if (!user) {
      setLocation("/signin");
      return;
    }

    const fromAmountNum = parseFloat(fromAmount);
    const toAmountNum = parseFloat(toAmount);

    if (fromAmountNum <= 0 || toAmountNum <= 0) {
      return;
    }

    // If we have a cached session password, execute directly
    if (sessionPassword) {
      await performSwap(sessionPassword);
    } else {
      // Otherwise prompt for password (will be cached for session)
      setShowPasswordDialog(true);
    }
  };

  const performSwap = async (password: string) => {
    const fromAmountNum = parseFloat(fromAmount);
    const toAmountNum = parseFloat(toAmount);
    const feeAmount = 0;

    setIsSwapping(true);
    try {
      const { data, error } = await supabase.functions.invoke('rocketx-swap', {
        body: {
          userId: user!.id,
          fromCrypto: fromCurrency,
          toCrypto: toCurrency,
          fromAmount: fromAmountNum,
          toAmount: toAmountNum,
          swapRate,
          marketRate,
          fee: feeAmount,
          userPassword: password
        }
      });

      if (error) throw error;

      toast({
        title: "Swap Successful!",
        description: `Swapped ${fromAmountNum} ${fromCurrency} to ${data.to_amount.toFixed(6)} ${toCurrency}`,
      });

      setHistory(swapExecutionService.getOrderHistory());
      setFromAmount("0.00001");
      setToAmount("");
      setShowPasswordDialog(false);
    } catch (error: any) {
      console.error('Swap error:', error);
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to execute swap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (walletPassword.length > 0) {
      setSessionPassword(walletPassword);
      performSwap(walletPassword);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
        {/* Background Decorative Shapes */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-[10%] left-[5%] rotate-12">
            <div className="h-24 w-24 rounded-full border-4 border-primary/20" />
          </div>
          <div className="absolute top-[20%] right-[10%] -rotate-12">
            <div className="h-32 w-32 border-2 border-primary/30 rotate-45" />
          </div>
          <div className="absolute bottom-[30%] left-[15%] rotate-45">
            <div className="h-16 w-16 bg-primary/10 rounded-lg" />
          </div>
          <div className="absolute bottom-[10%] right-[20%] -rotate-6">
            <div className="h-40 w-40 rounded-full border border-primary/20 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full border border-primary/10" />
            </div>
          </div>
          <div className="absolute top-[50%] left-[2%] -rotate-12">
            <div className="h-12 w-48 bg-primary/5 rounded-full rotate-45" />
          </div>
          <div className="absolute top-[40%] right-[5%] rotate-12">
            <div className="h-20 w-20 border-t-4 border-l-4 border-primary/20 rounded-tl-3xl" />
          </div>
        </div>

        <div className="flex-1 relative z-10">
          {/* Hero Section */}
          <section className="relative py-20 px-4 overflow-hidden">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight">
                Exchange cryptocurrencies<br />seamlessly
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
                Instantly convert digital assets with competitive rates and high-speed execution
              </p>

              <Card className="max-w-lg mx-auto bg-card border-none shadow-2xl overflow-hidden rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  {/* From Box */}
                  <div className="bg-accent/5 p-6 rounded-xl border border-border/40 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-foreground font-bold text-sm">From</Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-muted-foreground/30">0</span>
                      <div className="ml-auto flex items-center gap-2 bg-card border border-border/40 px-3 py-1.5 rounded-full shadow-sm">
                        <img src={currencies.find(c => c.symbol === fromCurrency)?.iconUrl} alt="" className="w-5 h-5 rounded-full" />
                        <span className="font-bold">{fromCurrency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Swap Button Middle */}
                  <div className="flex justify-center -my-6 relative z-10">
                    <div className="rounded-full bg-[#B4F22E] text-black h-10 w-10 flex items-center justify-center border-4 border-card shadow-lg">
                      <ArrowUpDown className="h-5 w-5" />
                    </div>
                  </div>

                  {/* To Box */}
                  <div className="bg-accent/5 p-6 rounded-xl border border-border/40 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-foreground font-bold text-sm">To</Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-muted-foreground/30">0</span>
                      <div className="ml-auto flex items-center gap-2 bg-card border border-border/40 px-3 py-1.5 rounded-full shadow-sm">
                        <img src={currencies.find(c => c.symbol === toCurrency)?.iconUrl} alt="" className="w-5 h-5 rounded-full" />
                        <span className="font-bold">{toCurrency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left pt-2">
                    <span className="text-xs text-muted-foreground block mb-1 text-[10px] uppercase font-bold tracking-wider">Market rate</span>
                    <div className="flex items-center gap-1 min-h-[16px] overflow-hidden">
                      {isLoading ? (
                        <Skeleton className="h-3 w-32" />
                      ) : (
                        <span className="text-xs font-bold truncate">1 {fromCurrency} = {formatRate(marketRate)} {toCurrency}</span>
                      )}
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 text-lg font-bold bg-[#B4F22E] hover:bg-[#a3db29] text-black rounded-xl shadow-sm transition-all" 
                    onClick={() => setLocation("/signin")}
                  >
                    Log in/Join us
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Why Exchange Section */}
          <section className="py-20 bg-background">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black mb-4">Why use Pexly</h2>
                <p className="text-muted-foreground">Easily trade digital assets with Pexly in just a few clicks</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: "Best rates", desc: "Exchange assets at the most competitive market rates", icon: <TrendingDown className="h-6 w-6 text-primary" /> },
                  { title: "Privacy first", desc: "Secure and confidential transactions for all users", icon: <Shield className="h-6 w-6 text-primary" /> },
                  { title: "Fast execution", desc: "Benefit from rapid processing and instant settlements", icon: <Gift className="h-6 w-6 text-primary" /> }
                ].map((item, i) => (
                  <Card key={i} className="bg-card/50 border-none shadow-sm hover:shadow-md transition-shadow p-8 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-accent/5 flex items-center justify-center mb-6">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Asset Pairs Section */}
          <section className="py-20 bg-accent/5">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black mb-4">Wide range of trading pairs</h2>
                <p className="text-muted-foreground">Easily trade between a variety of digital assets</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { pair: "BTC/USDT", color: "from-orange-500/10 to-transparent", icon: cryptoIconUrls.BTC },
                  { pair: "XMR/USDT", color: "from-orange-600/10 to-transparent", icon: cryptoIconUrls.BTC }, // Placeholder for XMR
                  { pair: "SOL/USDT", color: "from-purple-500/10 to-transparent", icon: cryptoIconUrls.SOL },
                  { pair: "ETH/USDT", color: "from-blue-500/10 to-transparent", icon: cryptoIconUrls.ETH }
                ].map((item, i) => (
                  <Card key={i} className="bg-card border-none shadow-sm overflow-hidden p-4 group cursor-pointer hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={item.icon} className="w-8 h-8 rounded-full" alt="" />
                      <span className="font-bold text-sm uppercase">{item.pair} ↑</span>
                    </div>
                    <div className={`h-24 w-full rounded-lg bg-gradient-to-t ${item.color} relative overflow-hidden`}>
                      <div className="absolute inset-0 flex items-end">
                        <div className="w-full h-1/2 bg-gradient-to-t from-background/20 to-transparent" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-20 bg-background border-t">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black mb-4">How it works</h2>
                <p className="text-muted-foreground">Log in to your Pexly account and select Swap from the Trade menu in the header</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  { step: "1. Join Pexly today", desc: "Register your Pexly account and log in", img: "/assets/IMG_3627.jpeg" },
                  { step: "2. Open Trade page", desc: "From the Trade menu in the header, select Exchange", img: "/assets/IMG_3628.jpeg" },
                  { step: "3. Choose a pair and execute", desc: "Enter the amount, select your assets, and proceed with the transaction", img: "/assets/IMG_3629.jpeg" }
                ].map((item, i) => (
                  <div key={i} className="space-y-6">
                    <h3 className="text-xl font-bold">{item.step}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                    <div className="rounded-xl overflow-hidden border border-border/40 shadow-sm bg-accent/5 p-4">
                      <img src={item.img} className="w-full rounded-lg" alt="" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-20">
                <Button 
                  className="px-12 h-14 text-lg font-bold bg-[#B4F22E] hover:bg-[#a3db29] text-black rounded-full shadow-lg transition-all"
                  onClick={() => setLocation("/signin")}
                >
                  Start now
                </Button>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-20 bg-background border-t">
            <div className="max-w-3xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">Frequently asked questions</h2>
                <p className="text-muted-foreground">Find answers to the most popular questions asked by our users</p>
              </div>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {[
                  "Are there any fees for transactions on Pexly?",
                  "My transaction failed. What should I do next?",
                  "My transaction failed, and my funds are either reserved or missing. What should I do?",
                  "What are the minimum transaction amounts?"
                ].map((q, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border rounded-xl px-4 bg-card shadow-sm border-border/40 overflow-hidden">
                    <AccordionTrigger className="text-left font-bold py-6 hover:no-underline">{q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-6">
                      Detailed information about this topic will be provided here for users to understand the process.
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        </div>
        <PexlyFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8">
          {/* Left Column: Swap Card */}
          <div className="space-y-6">
            <Card className="bg-card border-none shadow-sm">
              <CardContent className="p-6 space-y-4">
                {/* From Box */}
                <div className="bg-accent/5 p-6 rounded-xl border border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-foreground font-bold text-sm">From</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      className="flex-1 h-12 text-2xl font-semibold bg-transparent border-none p-0 focus-visible:ring-0 shadow-none"
                      placeholder="0.00"
                    />
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger className="w-[120px] h-10 bg-card border-border/40 rounded-full shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.symbol} value={curr.symbol}>
                            <div className="flex items-center gap-2">
                              <img src={curr.iconUrl} alt={curr.symbol} className="w-5 h-5 rounded-full" />
                              <span className="font-bold">{curr.symbol}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Swap Button Middle */}
                <div className="flex justify-center -my-6 relative z-10">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 border-4 border-card shadow-lg"
                    onClick={handleSwapCurrencies}
                  >
                    <ArrowUpDown className="h-5 w-5" />
                  </Button>
                </div>

                {/* To Box */}
                <div className="bg-accent/5 p-6 rounded-xl border border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-foreground font-bold text-sm">To</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={toAmount}
                      onChange={(e) => handleToAmountChange(e.target.value)}
                      className="flex-1 h-12 text-2xl font-semibold bg-transparent border-none p-0 focus-visible:ring-0 shadow-none"
                      placeholder="0.00"
                    />
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="w-[120px] h-10 bg-card border-border/40 rounded-full shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.symbol} value={curr.symbol}>
                            <div className="flex items-center gap-2">
                              <img src={curr.iconUrl} alt={curr.symbol} className="w-5 h-5 rounded-full" />
                              <span className="font-bold">{curr.symbol}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rates Info */}
                <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Swap rate</span>
                    <div className="flex items-center flex-wrap gap-1 min-h-[16px] overflow-hidden">
                      {isLoading ? (
                        <Skeleton className="h-3 w-32" />
                      ) : (
                        <>
                          <span className="text-xs font-bold truncate">1 {fromCurrency} = {formatRate(swapRate)} {toCurrency}</span>
                          {percentageDiff > 0 && (
                            <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 px-1 py-0 h-4 text-[10px] flex-shrink-0">
                              {percentageDiff.toFixed(2)}%
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Market rate</span>
                    <div className="min-h-[16px] flex items-center overflow-hidden">
                      {isLoading ? (
                        <Skeleton className="h-3 w-32" />
                      ) : (
                        <span className="text-xs font-bold block truncate">1 {fromCurrency} = {formatRate(marketRate)} {toCurrency}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-xs text-muted-foreground block">Rate will refresh in</span>
                    <span className="text-xs font-bold">Updating</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-14 text-lg font-bold bg-[#58B383] hover:bg-[#4da175] text-white rounded-xl shadow-sm transition-all" 
                  onClick={handleSwap}
                  disabled={isSwapping || isLoading || parseFloat(fromAmount) <= 0}
                >
                  {isSwapping ? <Loader2 className="animate-spin h-6 w-6" /> : "Swap"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Chart Section */}
          <div className="space-y-4">
            <Card className="bg-card border-none shadow-sm overflow-hidden h-[450px] relative rounded-xl">
              <div className="p-4 border-b border-border/40 flex items-center justify-between">
                <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                  <img src={currencies.find(c => c.symbol === fromCurrency)?.iconUrl} className="w-4 h-4 rounded-full" alt="" />
                  {fromCurrency} / {toCurrency}
                </h2>
              </div>
              <iframe
                key={`${fromCurrency}-${toCurrency}`}
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=BINANCE:${fromCurrency}${toCurrency}&interval=60&hidesidetoolbar=1&symboledit=0&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=light&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=pexly.com&utm_medium=widget&utm_campaign=chart`}
                className="absolute top-12 bottom-0 left-0 right-0 w-full h-[calc(100%-48px)]"
                title="TradingView Chart"
              ></iframe>
            </Card>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="space-y-6 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent activity</h2>
          </div>
          
          <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-sm font-medium text-muted-foreground">Filters</span>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="h-8 w-[120px] bg-accent/5 text-xs">
                <span className="text-muted-foreground mr-1">Asset</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {currencies.map(c => (
                  <SelectItem key={c.symbol} value={c.symbol}>{c.symbol}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="h-8 w-[120px] bg-accent/5 text-xs">
                <span className="text-muted-foreground mr-1">Status</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="beginning">
              <SelectTrigger className="h-8 w-[180px] bg-accent/5 text-xs">
                <span className="text-muted-foreground mr-1">Date:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginning">From the beginning</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card border-none rounded-xl shadow-sm overflow-hidden">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-border/40">
                  <thead className="bg-accent/5">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-border/40">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-sm text-muted-foreground">
                          No recent swap activity found
                        </td>
                      </tr>
                    ) : (
                      history.map((order) => (
                        <tr key={order.id} className="hover:bg-accent/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{order.amount} {order.fromToken}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-bold">{order.quote.toAmount} {order.toToken}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {formatDistanceToNow(order.createdAt)} ago
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={order.status === 'submitted' ? 'default' : 'secondary'} className="bg-[#58B383]/10 text-[#58B383] border-none text-[10px] px-2 py-0.5 uppercase font-bold">
                              {order.status === 'submitted' ? 'Pending' : order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Wallet Password Required
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Enter your non-custodial wallet password to authorize this swap. Your password is only stored for this session.
              </p>
              <Input
                type="password"
                placeholder="Enter wallet password"
                value={walletPassword}
                onChange={(e) => setWalletPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
              <Button onClick={handlePasswordSubmit} disabled={isSwapping || walletPassword.length === 0}>
                {isSwapping ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Confirm Swap"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <PexlyFooter />
    </div>
  );
}
