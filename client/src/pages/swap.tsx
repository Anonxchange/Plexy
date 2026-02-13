
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
import { rocketXApi } from "@/lib/rocketx-api";
import { nonCustodialWalletManager, NonCustodialWallet } from "@/lib/non-custodial-wallet";


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
  { symbol: "USDT", name: "Tether", iconUrl: cryptoIconUrls.USDT, networks: [
    { chain: "ETH", identifier: "ETH.USDT-0xdac17f958d2ee523a2206206994597C13D831ec7", name: "Ethereum (ERC20)" },
    { chain: "BSC", identifier: "BSC.USDT-0x55d398326f99059ff775485246999027b3197955", name: "BNB Smart Chain (BEP20)" },
    { chain: "TRX", identifier: "TRX.USDT-TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", name: "Tron (TRC20)" },
    { chain: "SOL", identifier: "SOL.USDT-Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8En2vQK", name: "Solana" },
    { chain: "ARBITRUM", identifier: "ARBITRUM.USDT-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", name: "Arbitrum One" },
  ]},
  { symbol: "ETH", name: "Ethereum", iconUrl: cryptoIconUrls.ETH, chain: "ETH", identifier: "ETH.ETH" },
  { symbol: "USDC", name: "USD Coin", iconUrl: cryptoIconUrls.USDC, networks: [
    { chain: "ETH", identifier: "ETH.USDC-0xa0b86991c6218b36c1d19D4a2e9Eb0ce3606eb48", name: "Ethereum (ERC20)" },
    { chain: "BSC", identifier: "BSC.USDC-0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", name: "BNB Smart Chain (BEP20)" },
    { chain: "SOL", identifier: "SOL.USDC-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", name: "Solana" },
    { chain: "ARBITRUM", identifier: "ARBITRUM.USDC-0xaf88d065e77c8cc2239327c5edb3a432268e5831", name: "Arbitrum One" },
    { chain: "BASE", identifier: "BASE.USDC-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", name: "Base" },
  ]},
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
  const [fromAmount, setFromAmount] = useState("1");
  const [toAmount, setToAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("BTC");
  const [toCurrency, setToCurrency] = useState("SOL");
  const [fromNetwork, setFromNetwork] = useState("BTC");
  const [toNetwork, setToNetwork] = useState("SOL");
  const [isUpdatingFromInput, setIsUpdatingFromInput] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");
  const [userWallets, setUserWallets] = useState<NonCustodialWallet[]>([]);

  // Helper to get currency object
  const getCurrency = (symbol: string) => currencies.find(c => c.symbol === symbol);

  // Load wallets for balance checking
  useEffect(() => {
    if (user?.id) {
      nonCustodialWalletManager.getNonCustodialWallets(user.id).then(setUserWallets);
    }
  }, [user?.id]);

  // Sync network when currency changes
  useEffect(() => {
    const curr = getCurrency(fromCurrency);
    if (curr) {
      if (curr.networks) {
        const hasNetwork = curr.networks.some(n => n.chain === fromNetwork);
        if (!hasNetwork) setFromNetwork(curr.networks[0].chain);
      } else {
        setFromNetwork(curr.chain!);
      }
    }
  }, [fromCurrency]);

  useEffect(() => {
    const curr = getCurrency(toCurrency);
    if (curr) {
      if (curr.networks) {
        const hasNetwork = curr.networks.some(n => n.chain === toNetwork);
        if (!hasNetwork) setToNetwork(curr.networks[0].chain);
      } else {
        setToNetwork(curr.chain!);
      }
    }
  }, [toCurrency]);

  // Fetch live swap prices
  const { marketRate, swapRate, percentageDiff, isLoading: isPriceLoading } = useSwapPrice(
    fromCurrency,
    toCurrency,
    fromNetwork,
    toNetwork,
    parseFloat(fromAmount) || 1
  );

  const [isSwapping, setIsSwapping] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [activeQuote, setActiveQuote] = useState<any>(null);

  // Auto-fetch quote when inputs change
  useEffect(() => {
    const amount = parseFloat(fromAmount);
    if (amount > 0 && !isSwapping) {
      const timer = setTimeout(() => {
        handleGetQuote();
      }, 1000); // Debounce
      return () => clearTimeout(timer);
    }
  }, [fromAmount, fromCurrency, toCurrency, fromNetwork, toNetwork]);

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
        const btcRes = await fetch('https://mempool.space/api/v1/fees/recommended');
        if (btcRes.ok) {
          const btcData = await btcRes.json();
          const btcFee = (btcData.hourFee * 140) / 1e8;
          setEstFees(prev => ({ ...prev, BTC: `${btcFee.toFixed(6)} BTC` }));
        }

        const ethRes = await fetch('https://api.etherscan.io/api?module=proxy&action=eth_gasPrice');
        if (ethRes.ok) {
          const ethData = await ethRes.json();
          const gasPrice = parseInt(ethData.result, 16);
          const ethFee = (gasPrice * 150000) / 1e18;
          setEstFees(prev => ({ ...prev, ETH: `${ethFee.toFixed(5)} ETH` }));
        }
      } catch (e) {
        console.error("Failed to fetch live fees", e);
      }
    };

    fetchFees();
  }, []);

  // Balance checking
  const fromWallet = userWallets.find(w => {
    const chainMatch = w.chainId?.toLowerCase() === fromNetwork.toLowerCase();
    const symbolMatch = w.assetType?.toLowerCase() === fromCurrency.toLowerCase();
    return chainMatch || symbolMatch;
  });
  
  const fromBalance = fromWallet?.balance || 0;
  const insufficientBalance = parseFloat(fromAmount) > fromBalance;

  useEffect(() => {
    if (isUpdatingFromInput && swapRate > 0 && !activeQuote) {
      const amount = parseFloat(fromAmount) || 0;
      const calculated = calculateSwapAmount(amount, swapRate);
      setToAmount(calculated.toLocaleString('en-US', { 
        useGrouping: false, 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 8 
      }));
    }
  }, [fromAmount, swapRate, isUpdatingFromInput, activeQuote]);

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
    setActiveQuote(null);
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

  const handleGetQuote = async () => {
    if (!user) return;

    const fromAmountNum = parseFloat(fromAmount);
    if (fromAmountNum <= 0) return;

    setIsFetchingQuote(true);
    try {
      const fromCurrObj = currencies.find(c => c.symbol === fromCurrency);
      const toCurrObj = currencies.find(c => c.symbol === toCurrency);
      const fromNetObj = fromCurrObj?.networks?.find(n => n.chain === fromNetwork);
      const toNetObj = toCurrObj?.networks?.find(n => n.chain === toNetwork);

      const quotes = await rocketXApi.getQuotation({
        fromToken: fromNetObj?.identifier || fromCurrObj?.identifier || fromCurrency,
        fromNetwork,
        toToken: toNetObj?.identifier || toCurrObj?.identifier || toCurrency,
        toNetwork,
        amount: fromAmountNum,
      });

      if (quotes && quotes.length > 0) {
        const bestQuote = quotes.reduce((prev: any, current: any) => {
          return (prev.toAmount > current.toAmount) ? prev : current;
        });
        setActiveQuote(bestQuote);
        setToAmount(bestQuote.toAmount.toLocaleString('en-US', { 
          useGrouping: false, 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 8 
        }));
      }
    } catch (error: any) {
      console.error("Quote fetching failed", error);
    } finally {
      setIsFetchingQuote(false);
    }
  };

  const handleSwap = async () => {
    if (!activeQuote) {
      await handleGetQuote();
      return;
    }
    if (sessionPassword) {
      await performSwap(sessionPassword);
    } else {
      setShowPasswordDialog(true);
    }
  };

  const performSwap = async (password: string) => {
    const fromAmountNum = parseFloat(fromAmount);
    const toAmountNum = parseFloat(toAmount);
    setIsSwapping(true);

    try {
      const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user!.id);
      const findWallet = (targetNetwork: string, targetSymbol: string) => {
        return wallets.find(w => {
          const chainIdLower = w.chainId?.toLowerCase();
          const walletTypeLower = w.walletType?.toLowerCase();
          const assetTypeLower = w.assetType?.toLowerCase();
          
          const isBTCMatch = (target: string) => ["btc", "bitcoin"].includes(target);
          const isETHMatch = (target: string) => ["eth", "ethereum", "erc20"].includes(target);
          const isBSCMatch = (target: string) => ["bsc", "bnb", "binance", "bep20"].includes(target);
          const isSolMatch = (target: string) => ["sol", "solana"].includes(target);
          const isTronMatch = (target: string) => ["trx", "tron", "trc20"].includes(target);

          const matchesChain = (target: string, value: string | undefined) => {
            if (!value) return false;
            if (isBTCMatch(target)) return isBTCMatch(value);
            if (isETHMatch(target)) return isETHMatch(value);
            if (isBSCMatch(target)) return isBSCMatch(value);
            if (isSolMatch(target)) return isSolMatch(value);
            if (isTronMatch(target)) return isTronMatch(value);
            return target === value;
          };

          return matchesChain(targetNetwork, chainIdLower) || 
                 matchesChain(targetSymbol, chainIdLower) ||
                 matchesChain(targetNetwork, walletTypeLower) ||
                 matchesChain(targetSymbol, walletTypeLower) ||
                 matchesChain(targetSymbol, assetTypeLower);
        });
      };

      const fromWalletMatch = findWallet(fromNetwork.toLowerCase(), fromCurrency.toLowerCase());
      const toWalletMatch = findWallet(toNetwork.toLowerCase(), toCurrency.toLowerCase());

      if (!fromWalletMatch?.address || !toWalletMatch?.address) {
        throw new Error(`Wallet missing. Please generate wallets first.`);
      }

      const swapResponse = await rocketXApi.executeSwap({
        userId: user!.id,
        fromToken: activeQuote?.fromToken,
        fromNetwork,
        fromAmount: activeQuote?.fromAmount || fromAmountNum,
        fromAddress: fromWalletMatch.address,
        toToken: activeQuote?.toToken,
        toNetwork,
        toAmount: activeQuote?.toAmount || toAmountNum,
        toAddress: toWalletMatch.address,
        slippage: 1,
        quoteId: activeQuote?.id
      });

      if (!swapResponse?.id) throw new Error("Swap creation failed");

      toast({ title: "Swap Initiated", description: "Waiting for blockchain confirmation..." });

      let attempts = 0;
      let completed = false;
      while (attempts < 30) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await rocketXApi.getStatus(swapResponse.id);
        if (statusRes?.status === "completed") { completed = true; break; }
        if (statusRes?.status === "failed") throw new Error("Swap failed");
        attempts++;
      }

      if (!completed) throw new Error("Swap timeout");

      toast({ title: "Swap Successful!", description: `Successfully swapped ${fromAmountNum} ${fromCurrency} → ${toCurrency}` });
    } catch (error: any) {
      toast({ title: "Swap Failed", description: error.message || "Transaction failed", variant: "destructive" });
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
        </div>

        <div className="flex-1 relative z-10">
          <section className="relative py-20 px-4 overflow-hidden">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight">
                Exchange cryptocurrencies<br />seamlessly
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
                Instantly convert digital assets with competitive rates and high-speed execution
              </p>

              <Card className="max-w-lg mx-auto bg-card border-none shadow-2xl overflow-hidden rounded-3xl p-1">
                <CardContent className="p-4 space-y-4">
                  {/* From Box */}
                  <div className="bg-accent/5 p-4 rounded-2xl border border-border/40 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-muted-foreground font-medium text-xs">From</Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-muted-foreground/30">0</span>
                      <div className="ml-auto flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 bg-card border border-border/40 px-3 py-1.5 rounded-full shadow-sm">
                          <img src={getCurrency(fromCurrency)?.iconUrl} alt="" className="w-5 h-5 rounded-full" />
                          <span className="font-bold">{fromCurrency}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium px-2 uppercase tracking-tighter">
                          {fromNetwork}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center -my-7 relative z-10">
                    <div className="rounded-full bg-[#B4F22E] text-black h-10 w-10 flex items-center justify-center border-4 border-card shadow-lg">
                      <ArrowUpDown className="h-5 w-5" />
                    </div>
                  </div>

                  {/* To Box */}
                  <div className="bg-accent/5 p-4 rounded-2xl border border-border/40 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-muted-foreground font-medium text-xs">To</Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-muted-foreground/30">0</span>
                      <div className="ml-auto flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 bg-card border border-border/40 px-3 py-1.5 rounded-full shadow-sm">
                          <img src={getCurrency(toCurrency)?.iconUrl} alt="" className="w-5 h-5 rounded-full" />
                          <span className="font-bold">{toCurrency}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium px-2 uppercase tracking-tighter">
                          {toNetwork}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/5 rounded-2xl p-4 space-y-3 border border-border/40 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Provider</span>
                      <div className="flex items-center gap-2">
                        <img src="https://cdn.rocketx.exchange/pd135zq/images/exchange/rocketx_pool_10.png" alt="" className="w-4 h-4" />
                        <span className="text-xs font-bold text-foreground">RocketX</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 rounded-2xl text-lg font-black bg-[#B4F22E] hover:bg-[#B4F22E]/90 text-black shadow-xl"
                    onClick={() => setLocation("/signin")}
                  >
                    Log in/Join us
                  </Button>
                </CardContent>
              </Card>
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
          <div className="space-y-6">
            <Card className="bg-card border-none shadow-2xl overflow-hidden rounded-3xl p-1">
              <CardContent className="p-4 space-y-4">
                {/* From Box */}
                <div className="bg-accent/5 p-4 rounded-2xl border border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-muted-foreground font-medium text-xs">From</Label>
                    <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full">
                      <span className="text-[10px] font-bold text-primary uppercase">{fromNetwork}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      className="text-2xl font-black bg-transparent border-none p-0 focus-visible:ring-0 shadow-none h-auto w-full"
                      placeholder="0"
                    />
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger className="w-auto min-w-[110px] bg-background border-border/40 rounded-2xl font-bold h-10 shadow-sm gap-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/40 shadow-xl">
                        {currencies.map(c => (
                          <SelectItem key={c.symbol} value={c.symbol} className="font-bold py-2.5">
                            <div className="flex items-center gap-2">
                              <img src={c.iconUrl} alt="" className="w-5 h-5 rounded-full" />
                              {c.symbol}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      ${((parseFloat(fromAmount) || 0) * (marketRate || 67000)).toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-bold ${insufficientBalance ? 'text-destructive' : 'text-muted-foreground'}`}>
                      Balance: {fromBalance.toFixed(6)} {fromCurrency}
                    </span>
                  </div>
                </div>

                {/* Swap Button Middle */}
                <div className="flex justify-center -my-7 relative z-10">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSwapCurrencies}
                    className="rounded-full bg-card hover:bg-accent border-4 border-background h-10 w-10 shadow-lg transition-transform hover:rotate-180"
                  >
                    <ArrowUpDown className="h-5 w-5 text-primary" />
                  </Button>
                </div>

                {/* To Box */}
                <div className="bg-accent/5 p-4 rounded-2xl border border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-muted-foreground font-medium text-xs">To</Label>
                    <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full">
                      <span className="text-[10px] font-bold text-primary uppercase">{toNetwork}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      value={toAmount}
                      onChange={(e) => handleToAmountChange(e.target.value)}
                      className="text-2xl font-black bg-transparent border-none p-0 focus-visible:ring-0 shadow-none h-auto w-full"
                      placeholder="0"
                      readOnly={isFetchingQuote}
                    />
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="w-auto min-w-[110px] bg-background border-border/40 rounded-2xl font-bold h-10 shadow-sm gap-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/40 shadow-xl">
                        {currencies.map(c => (
                          <SelectItem key={c.symbol} value={c.symbol} className="font-bold py-2.5">
                            <div className="flex items-center gap-2">
                              <img src={c.iconUrl} alt="" className="w-5 h-5 rounded-full" />
                              {c.symbol}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      ${((parseFloat(toAmount) || 0) * (marketRate || 67000)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Quote Info Panel */}
                <div className="bg-accent/5 rounded-2xl p-4 space-y-3 border border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Swapper fee</span>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-foreground">
                        {activeQuote ? `$${activeQuote.gasFee?.toFixed(2)}` : '--'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {activeQuote ? `${activeQuote.gasFee?.toFixed(6)} ${fromCurrency}` : '--'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Provider</span>
                    <div className="flex items-center gap-2">
                      <img src="https://cdn.rocketx.exchange/pd135zq/images/exchange/rocketx_pool_10.png" alt="" className="w-4 h-4" />
                      <span className="text-xs font-bold text-foreground">RocketX</span>
                    </div>
                  </div>
                  {activeQuote && (
                    <div className="flex items-center justify-between pt-1 border-t border-border/20">
                      <span className="text-xs text-muted-foreground font-medium">Est. Time</span>
                      <span className="text-xs font-bold text-primary">{activeQuote.estimatedTime || '2-5 min'}</span>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSwap}
                  disabled={isSwapping || isFetchingQuote || insufficientBalance || parseFloat(fromAmount) <= 0}
                  className={`w-full h-14 rounded-2xl text-lg font-black shadow-xl transition-all active:scale-95 ${
                    insufficientBalance ? 'bg-destructive hover:bg-destructive/90' : 'bg-[#B4F22E] hover:bg-[#B4F22E]/90 text-black'
                  }`}
                >
                  {isSwapping ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Executing...
                    </div>
                  ) : isFetchingQuote ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Fetching Best Price...
                    </div>
                  ) : insufficientBalance ? (
                    `Not Enough ${fromCurrency}`
                  ) : (
                    "Swap Now"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

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
      </div>
      <PexlyFooter />
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Wallet Password Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
  );
}
