
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
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { getCryptoPrices } from "@/lib/crypto-prices";
import { useToast } from "@/hooks/use-toast";
import { rocketXApi } from "@/lib/rocketx-api";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";

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
    { chain: "ETH", identifier: "ETH.USDT-0xdac17f958d2ee523a2206206994597C13D831ec7", name: "Ether (ERC20)" },
    { chain: "BSC", identifier: "BSC.USDT-0x55d398326f99059ff775485246999027b3197955", name: "BNB  (BEP20)" },
    { chain: "TRX", identifier: "TRX.USDT-TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", name: "Tron (TRC20)" },
    { chain: "SOL", identifier: "SOL.USDT-Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8En2vQK", name: "Solana" },
    { chain: "ARBITRUM", identifier: "ARBITRUM.USDT-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", name: "Arbitrum One" },
    { chain: "POLYGON", identifier: "POLYGON.USDT-0xc2132d05d31c914a87c6611c10748aeb04b58e8f", name: "Polygon" },
    { chain: "OPTIMISM", identifier: "OPTIMISM.USDT-0x94b008aa205766a30e1ed85f482b439f76a8a489", name: "Optimism" },
  ]},
  { symbol: "ETH", name: "Ethereum", iconUrl: cryptoIconUrls.ETH, chain: "ETH", identifier: "ETH.ETH" },
  { symbol: "USDC", name: "USD Coin", iconUrl: cryptoIconUrls.USDC, networks: [
    { chain: "ETH", identifier: "ETH.USDC-0xa0b86991c6218b36c1d19D4a2e9Eb0ce3606eb48", name: "Ether (ERC20)" },
    { chain: "BSC", identifier: "BSC.USDC-0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", name: "BNB  (BEP20)" },
    { chain: "SOL", identifier: "SOL.USDC-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", name: "Solana" },
    { chain: "ARBITRUM", identifier: "ARBITRUM.USDC-0xaf88d065e77c8cc2239327c5edb3a432268e5831", name: "Arbitrum One" },
    { chain: "BASE", identifier: "BASE.USDC-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", name: "Base" },
    { chain: "POLYGON", identifier: "POLYGON.USDC-0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", name: "Polygon" },
    { chain: "OPTIMISM", identifier: "OPTIMISM.USDC-0x0b2c639c533813f4aa9d7837caf62653d097ff85", name: "Optimism" },
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
  const [fromAmount, setFromAmount] = useState("0.00");
  const [toAmount, setToAmount] = useState("0.00");
  const [fromCurrency, setFromCurrency] = useState("BTC");
  const [toCurrency, setToCurrency] = useState("USDT");
  const [fromNetwork, setFromNetwork] = useState("BTC");
  const [toNetwork, setToNetwork] = useState("ETH");
  const [isUpdatingFromInput, setIsUpdatingFromInput] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");
  const [quoteTimestamp, setQuoteTimestamp] = useState<number | null>(null);
  const [debouncedAmount, setDebouncedAmount] = useState(fromAmount);

  useEffect(() => {
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      setDebouncedAmount("0.00");
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedAmount(fromAmount);
    }, 500);
    return () => clearTimeout(timer);
  }, [fromAmount]);

  const getCurrency = (symbol: string) => currencies.find(c => c.symbol === symbol);

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

  const { marketRate, swapRate, percentageDiff, isLoading, bestQuote, refetch } = useSwapPrice(
    fromCurrency,
    toCurrency,
    fromNetwork,
    toNetwork,
    parseFloat(debouncedAmount) || 0
  ) as any;

  const [isSwapping, setIsSwapping] = useState(false);
  const [activeQuote, setActiveQuote] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [estFees, setEstFees] = useState<Record<string, string>>({});

  useEffect(() => {
    if (bestQuote && parseFloat(debouncedAmount) > 0) {
      setActiveQuote(bestQuote);
      setQuoteTimestamp(Date.now());
      if (bestQuote.gasFee) {
        const feeStr = \`$\${bestQuote.gasFee.toFixed(2)}\`;
        setEstFees(prev => ({ ...prev, [fromNetwork]: feeStr }));
      }
    } else {
      setActiveQuote(null);
      setQuoteTimestamp(null);
    }
  }, [bestQuote, fromNetwork, debouncedAmount]);

  useEffect(() => {
    if (parseFloat(debouncedAmount) <= 0) return;
    const interval = setInterval(() => {
      refetch();
    }, 20000);
    return () => clearInterval(interval);
  }, [debouncedAmount, fromCurrency, toCurrency, fromNetwork, toNetwork, refetch]);

  const { data: monitoredBalancesData } = useWalletBalances();
  const monitoredBalances = monitoredBalancesData || [];

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      try {
        const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
        const symbolMap: Record<string, string> = {
          'BTC': 'Bitcoin (SegWit)',
          'ETH': 'Ethereum',
          'SOL': 'Solana',
          'BNB': 'Binance Smart Chain (BEP-20)',
          'TRX': 'Tron (TRC-20)',
          'USDT': 'USDT',
          'USDC': 'USDC'
        };
        const chainIdToFind = symbolMap[fromCurrency] || fromNetwork;
        const fromWallet = wallets.find(w => {
          const chainIdToMatch = (w.chainId || "").toLowerCase();
          const targetToMatch = chainIdToFind.toLowerCase();
          return chainIdToMatch === targetToMatch || chainIdToMatch === fromCurrency.toLowerCase();
        });
        if (fromWallet) {
          const monitored = monitoredBalances.find(b => 
            b.deposit_address?.toLowerCase() === fromWallet.address.toLowerCase() &&
            (b.crypto_symbol.toLowerCase() === fromCurrency.toLowerCase() || b.chain_id.toLowerCase() === fromNetwork.toLowerCase())
          );
          if (monitored) setBalance(monitored.balance);
          else setBalance(fromWallet.balance || 0);
        } else {
          setBalance(0);
        }
      } catch (e) {
        console.error("Failed to fetch balance", e);
      }
    };
    fetchBalance();
  }, [user, fromCurrency, fromNetwork, monitoredBalances]);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        if (bestQuote && bestQuote.gasFee) return;
        const btcRes = await fetch('https://mempool.space/api/v1/fees/recommended');
        if (btcRes.ok) {
          const btcData = await btcRes.json();
          const btcFee = (btcData.hourFee * 140) / 1e8;
          try {
            const prices = await getCryptoPrices(['BTC']);
            const btcPrice = prices.BTC?.current_price || 0;
            const feeInUsd = btcFee * btcPrice;
            setEstFees(prev => ({ ...prev, BTC: \`$\${feeInUsd.toFixed(2)}\` }));
          } catch {
            setEstFees(prev => ({ ...prev, BTC: \`\${btcFee.toFixed(6)} BTC\` }));
          }
        }
        const ethRes = await fetch('https://api.etherscan.io/api?module=proxy&action=eth_gasPrice');
        if (ethRes.ok) {
          const ethData = await ethRes.json();
          if (ethData && ethData.result) {
            const gasPrice = parseInt(ethData.result, 16);
            const ethFee = (gasPrice * 150000) / 1e18;
            try {
              const prices = await getCryptoPrices(['ETH']);
              const ethPrice = prices.ETH?.current_price || 0;
              const feeInUsd = ethFee * ethPrice;
              setEstFees(prev => ({ ...prev, ETH: \`$\${feeInUsd.toFixed(2)}\` }));
            } catch {
              setEstFees(prev => ({ ...prev, ETH: \`\${ethFee.toFixed(5)} ETH\` }));
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch live fees", e);
      }
    };
    fetchFees();
  }, [bestQuote]);

  useEffect(() => {
    if (parseFloat(fromAmount) <= 0) {
      setToAmount("0.00");
      return;
    }
    if (isLoading || parseFloat(debouncedAmount) !== parseFloat(fromAmount)) return;
    if (isUpdatingFromInput && bestQuote) {
      const toAmt = bestQuote.toAmount;
      const formattedToAmount = (toAmt !== undefined && toAmt !== null) 
        ? (typeof toAmt === 'number' ? toAmt.toLocaleString('en-US', { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 8 }) : String(toAmt))
        : "0.00";
      if (toAmount !== formattedToAmount) setToAmount(formattedToAmount);
    } else if (isUpdatingFromInput && swapRate > 0) {
      const amount = parseFloat(fromAmount) || 0;
      const calculated = calculateSwapAmount(amount, swapRate) || 0;
      const formattedToAmount = calculated.toLocaleString('en-US', { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 8 });
      if (toAmount !== formattedToAmount) setToAmount(formattedToAmount);
    }
  }, [fromAmount, debouncedAmount, swapRate, isUpdatingFromInput, bestQuote, toAmount, isLoading]);

  useEffect(() => {
    if (!isUpdatingFromInput && swapRate > 0) {
      const amount = parseFloat(toAmount) || 0;
      const calculated = (amount / (swapRate || 1)) || 0;
      const formattedFromAmount = calculated.toLocaleString('en-US', { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 8 });
      if (fromAmount !== formattedFromAmount) setFromAmount(formattedFromAmount);
    }
  }, [toAmount, swapRate, isUpdatingFromInput, fromAmount]);

  const handleSwapCurrencies = () => {
    const tempCurrency = fromCurrency;
    const tempFromAmount = fromAmount;
    const tempToAmount = toAmount;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    setFromAmount(tempToAmount);
    setToAmount(tempFromAmount);
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
    if (rate === undefined || rate === null) return "0.00";
    if (rate >= 1000) return rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 });
    if (rate >= 1) return rate.toFixed(2);
    return rate.toFixed(6);
  };

  const handleSwap = async () => {
    if (!user) {
      setLocation("/signin");
      return;
    }
    const fromAmountNum = parseFloat(fromAmount);
    if (fromAmountNum <= 0) return;
    if (balance !== null && fromAmountNum > balance) {
      toast({ title: "Insufficient Balance", description: \`You need \${fromAmountNum} \${fromCurrency} but only have \${balance}\`, variant: "destructive" });
      return;
    }
    const isExpired = !quoteTimestamp || (Date.now() - quoteTimestamp > 20000);
    let finalQuote = activeQuote || bestQuote;
    if (isExpired || !finalQuote) {
      toast({ title: "Refreshing Quote", description: "Your quote has expired. Fetching a fresh one..." });
      const refreshed = await refetch();
      finalQuote = refreshed.data?.bestQuote;
      if (!finalQuote) {
        toast({ title: "No Quote", description: "Could not fetch a fresh quote. Please try again.", variant: "destructive" });
        return;
      }
    }
    if (sessionPassword) await performSwap(sessionPassword, finalQuote);
    else setShowPasswordDialog(true);
  };

  const performSwap = async (password: string, quoteOverride?: any) => {
    const fromAmountNum = parseFloat(fromAmount);
    const toAmountNum = parseFloat(toAmount);
    const activeQuoteToUse = quoteOverride || activeQuote || bestQuote;
    setIsSwapping(true);
    try {
      const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user!.id);
      const findCorrectWallet = (targetNetwork: string) => {
        const net = targetNetwork.toLowerCase();
        return wallets.find(w => {
          const wChainId = (w.chainId || "").toLowerCase();
          const wWalletType = (w.walletType || "").toLowerCase();
          if (wChainId === net || wWalletType === net) return true;
          if (net === 'btc' || net === 'bitcoin') return wWalletType === 'bitcoin' || wChainId.includes('bitcoin');
          if (net === 'eth' || net === 'ethereum') return wWalletType === 'ethereum' || wChainId.includes('ethereum');
          if (net === 'bsc' || net === 'binance') return wWalletType === 'binance' || wChainId.includes('binance') || wChainId === 'bsc';
          if (net === 'trx' || net === 'tron') return wWalletType === 'tron' || wChainId.includes('tron');
          if (net === 'sol' || net === 'solana') return wWalletType === 'solana' || wChainId.includes('solana');
          if (net === 'polygon' || net === 'matic') return wWalletType === 'polygon' || wChainId.includes('polygon');
          return false;
        });
      };
      const fromWallet = findCorrectWallet(fromNetwork);
      const toWallet = findCorrectWallet(toNetwork);
      if (!fromWallet?.address || !toWallet?.address) {
        const missing = !fromWallet?.address ? fromCurrency : toCurrency;
        throw new Error(\`Please generate a \${missing} wallet first.\`);
      }
      const swapResponse = await rocketXApi.executeSwap({
        userId: user!.id,
        fromToken: activeQuoteToUse?.fromToken,
        fromNetwork,
        fromAmount: activeQuoteToUse?.fromAmount || fromAmountNum,
        fromAddress: fromWallet.address,
        toToken: activeQuoteToUse?.toToken,
        toNetwork,
        toAmount: activeQuoteToUse?.toAmount || toAmountNum,
        toAddress: toWallet.address,
        slippage: 1,
        quoteId: activeQuoteToUse?.id
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
      toast({ title: "Swap Successful!", description: \`Successfully swapped \${fromAmountNum} \${fromCurrency} → \${toCurrency}\` });
    } catch (error: any) {
      toast({ title: "Swap Failed", description: error.message || "Transaction failed.", variant: "destructive" });
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
        <div className="flex-1 relative z-10">
          <section className="relative py-20 px-4 overflow-hidden">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight">Exchange cryptocurrencies seamlessly</h1>
              <Card className="max-w-lg mx-auto bg-card border-none shadow-2xl overflow-hidden rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="bg-accent/5 p-6 rounded-xl border border-border/40 text-left">
                    <Label className="text-foreground font-bold text-sm">From</Label>
                    <div className="flex items-center gap-4">
                      <Input type="number" value={fromAmount} onChange={(e) => handleFromAmountChange(e.target.value)} className="bg-transparent border-none text-3xl font-bold p-0 focus-visible:ring-0 h-auto w-full" placeholder="0.00" />
                      <div className="ml-auto flex flex-col items-end gap-1">
                        <Select value={fromCurrency} onValueChange={setFromCurrency}>
                          <SelectTrigger className="w-auto bg-card border border-border/40 px-3 py-1.5 rounded-full shadow-sm h-auto font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>{currencies.map(c => <SelectItem key={c.symbol} value={c.symbol}>{c.symbol}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center -my-6 relative z-10">
                    <Button variant="outline" size="icon" className="rounded-full bg-card border-2 border-border shadow-md" onClick={handleSwapCurrencies}><ArrowUpDown className="h-4 w-4" /></Button>
                  </div>
                  <div className="bg-accent/5 p-6 rounded-xl border border-border/40 text-left">
                    <Label className="text-foreground font-bold text-sm">To</Label>
                    <div className="flex items-center gap-4">
                      {isLoading || (parseFloat(debouncedAmount) !== parseFloat(fromAmount) && parseFloat(fromAmount) > 0) ? <Skeleton className="h-10 w-full bg-accent/20" /> : <Input type="number" value={toAmount} onChange={(e) => handleToAmountChange(e.target.value)} className="bg-transparent border-none text-3xl font-bold p-0 focus-visible:ring-0 h-auto w-full" placeholder="0.00" />}
                      <div className="ml-auto flex flex-col items-end gap-1">
                        <Select value={toCurrency} onValueChange={setToCurrency}>
                          <SelectTrigger className="w-auto bg-card border border-border/40 px-3 py-1.5 rounded-full shadow-sm h-auto font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>{currencies.map(c => <SelectItem key={c.symbol} value={c.symbol}>{c.symbol}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full h-14 text-lg font-bold bg-[#B4F22E] hover:bg-[#a3db29] text-black rounded-xl shadow-sm" onClick={() => setLocation("/signin")}>Log in/Join us</Button>
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
            <Card className="bg-card border-none shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="bg-accent/5 p-6 rounded-xl border border-border/40">
                  <Label className="text-foreground font-bold text-sm">From</Label>
                  <div className="flex items-center gap-4">
                    <Input type="number" value={fromAmount} onChange={(e) => handleFromAmountChange(e.target.value)} className="flex-1 h-12 text-2xl font-semibold bg-transparent border-none p-0 focus-visible:ring-0 shadow-none" placeholder="0.00" />
                    <div className="flex flex-col gap-2 items-end">
                      <Select value={fromCurrency} onValueChange={setFromCurrency}>
                        <SelectTrigger className="w-[120px] h-10 bg-card border-border/40 rounded-full shadow-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{currencies.map(curr => <SelectItem key={curr.symbol} value={curr.symbol}>{curr.symbol}</SelectItem>)}</SelectContent>
                      </Select>
                      {getCurrency(fromCurrency)?.networks && (
                        <Select value={fromNetwork} onValueChange={setFromNetwork}>
                          <SelectTrigger className="h-7 min-w-[100px] bg-transparent border-none text-[10px] font-bold uppercase px-2 py-0"><SelectValue /></SelectTrigger>
                          <SelectContent>{getCurrency(fromCurrency)?.networks?.map(net => <SelectItem key={net.chain} value={net.chain}>{net.name}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-center -my-6 relative z-10">
                  <Button size="icon" variant="outline" className="rounded-full bg-primary text-primary-foreground h-10 w-10 border-4 border-card shadow-lg" onClick={handleSwapCurrencies}><ArrowUpDown className="h-5 w-5" /></Button>
                </div>
                <div className="bg-accent/5 p-6 rounded-xl border border-border/40">
                  <Label className="text-foreground font-bold text-sm">To</Label>
                  <div className="flex items-center gap-4">
                    {isLoading || (parseFloat(debouncedAmount) !== parseFloat(fromAmount) && parseFloat(fromAmount) > 0) ? <Skeleton className="h-10 w-full bg-accent/20" /> : <Input type="number" value={toAmount} onChange={(e) => handleToAmountChange(e.target.value)} className="flex-1 h-12 text-2xl font-semibold bg-transparent border-none p-0 focus-visible:ring-0 shadow-none" placeholder="0.00" />}
                    <div className="flex flex-col gap-2 items-end">
                      <Select value={toCurrency} onValueChange={setToCurrency}>
                        <SelectTrigger className="w-[120px] h-10 bg-card border-border/40 rounded-full shadow-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{currencies.map(curr => <SelectItem key={curr.symbol} value={curr.symbol}>{curr.symbol}</SelectItem>)}</SelectContent>
                      </Select>
                      {getCurrency(toCurrency)?.networks && (
                        <Select value={toNetwork} onValueChange={setToNetwork}>
                          <SelectTrigger className="h-7 min-w-[100px] bg-transparent border-none text-[10px] font-bold uppercase px-2 py-0"><SelectValue /></SelectTrigger>
                          <SelectContent>{getCurrency(toCurrency)?.networks?.map(net => <SelectItem key={net.chain} value={net.chain}>{net.name}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-sm px-1">
                    <span className="text-muted-foreground font-medium">Exchange Rate</span>
                    <span className="text-foreground font-bold">{isLoading ? <Skeleton className="h-4 w-24" /> : \`1 \${fromCurrency} ≈ \${formatRate(swapRate)} \${toCurrency}\`}</span>
                  </div>
                  <Button className="w-full h-14 text-lg font-black bg-[#B4F22E] hover:bg-[#B4F22E]/90 text-black rounded-xl shadow-lg" onClick={handleSwap} disabled={isSwapping || (balance !== null && parseFloat(fromAmount) > balance)}>
                    {isSwapping ? <Loader2 className="h-6 w-6 animate-spin" /> : (balance !== null && parseFloat(fromAmount) > balance) ? "Insufficient Balance" : "Swap Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="bg-card border-none shadow-sm h-[450px] relative rounded-xl">
              <iframe key={\`\${fromCurrency}-\${toCurrency}\`} src={\`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=BINANCE:\${fromCurrency}\${toCurrency}&interval=60&theme=light&style=1&timezone=Etc%2FUTC&withdateranges=1&locale=en\`} className="absolute inset-0 w-full h-full" title="TradingView Chart"></iframe>
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Wallet Password Required</DialogTitle></DialogHeader>
          <div className="py-4"><Input type="password" placeholder="Enter wallet password" value={walletPassword} onChange={(e) => setWalletPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} autoFocus /></div>
          <DialogFooter><Button onClick={handlePasswordSubmit} disabled={isSwapping || walletPassword.length === 0}>{isSwapping ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Confirm Swap"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <PexlyFooter />
    </div>
  );
}
