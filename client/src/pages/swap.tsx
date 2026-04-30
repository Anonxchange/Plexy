
import { useHead } from "@unhead/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowUpDown, TrendingDown, Shield, Gift, Loader2, Lock, BarChart3, Zap, CheckCircle2, ChevronRight, ArrowRight } from "lucide-react";
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
    { chain: "SOL", identifier: "SOL.USDT-Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", name: "Solana" },
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
  useHead({ title: "Swap Crypto | Pexly", meta: [{ name: "description", content: "Instantly swap cryptocurrencies at competitive rates directly from your wallet — no intermediaries, no custody risk." }] });
  useSchema(swapPageSchema, "swap-page-schema");
  const { user, getSessionPassword, setSessionPassword } = useAuth();
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

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Helper to get currency object
  const getCurrency = (symbol: string) => currencies.find(c => c.symbol === symbol);

  // Sync network when currency changes
  useEffect(() => {
    const curr = getCurrency(fromCurrency);
    if (curr) {
      if (curr.networks) {
        // Keep current network if available for new currency, otherwise default to first
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
  const { marketRate, swapRate, percentageDiff, isLoading, bestQuote } = useSwapPrice(
    fromCurrency,
    toCurrency,
    fromNetwork,
    toNetwork,
    parseFloat(fromAmount) || 1
  );

  const [isSwapping, setIsSwapping] = useState(false);
  const [activeQuote, setActiveQuote] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [estFees, setEstFees] = useState<Record<string, string>>({});

  // Clear stale quote immediately when the pair or network changes
  useEffect(() => {
    setActiveQuote(null);
  }, [fromCurrency, toCurrency, fromNetwork, toNetwork]);

  // Automatically sync activeQuote with bestQuote from the hook
  useEffect(() => {
    if (bestQuote) {
      setActiveQuote(bestQuote);
      if (bestQuote.gasFee) {
        const feeStr = `$${bestQuote.gasFee.toFixed(2)}`;
        setEstFees(prev => ({ ...prev, [fromNetwork]: feeStr }));
      }
    }
  }, [bestQuote, fromNetwork]);

  const { data: monitoredBalancesData } = useWalletBalances();
  const monitoredBalances = monitoredBalancesData || [];

  // Fetch balance for the selected "From" asset
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      try {
        const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
        
        // Map display symbols to internal chain IDs for matching
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
          const chainIdToMatch = w.chainId?.toLowerCase();
          const targetToMatch = chainIdToFind.toLowerCase();
          
          return chainIdToMatch === targetToMatch || 
                 chainIdToMatch === fromCurrency.toLowerCase();
        });
        
        if (fromWallet) {
          // Try to get balance from monitored balances first (more accurate)
          const monitored = monitoredBalances.find(b => 
            b.deposit_address?.toLowerCase() === fromWallet.address.toLowerCase() &&
            (b.crypto_symbol.toLowerCase() === fromCurrency.toLowerCase() || b.chain_id.toLowerCase() === fromNetwork.toLowerCase())
          );
          
          if (monitored) {
            setBalance(monitored.balance);
          } else {
            setBalance(fromWallet.balance || 0);
          }
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
    let isMounted = true;

    const fetchFees = async () => {
      try {
        if (bestQuote && bestQuote.gasFee) {
          // Already handled in the bestQuote sync useEffect
          return;
        }

        // Fallback to manual fetch if no quote
        const btcRes = await fetch('https://mempool.space/api/v1/fees/recommended');
        if (btcRes.ok && isMounted) {
          const btcData = await btcRes.json();
          // Average tx is ~140 vBytes, convert sat/vB to BTC
          const btcFee = (btcData.hourFee * 140) / 1e8;
          try {
            const prices = await getCryptoPrices(['BTC']);
            const btcPrice = prices.BTC?.current_price || 0;
            const feeInUsd = btcFee * btcPrice;
            if (isMounted) setEstFees(prev => ({ ...prev, BTC: `$${feeInUsd.toFixed(2)}` }));
          } catch {
            if (isMounted) setEstFees(prev => ({ ...prev, BTC: `${btcFee.toFixed(6)} BTC` }));
          }
        }

        // Fetch Ethereum Gas Price
        const ethRes = await fetch('https://api.etherscan.io/api?module=proxy&action=eth_gasPrice');
        if (ethRes.ok && isMounted) {
          const ethData = await ethRes.json();
          if (ethData && ethData.result) {
            const gasPrice = parseInt(ethData.result, 16);
            // Typical swap is ~150k gas
            const ethFee = (gasPrice * 150000) / 1e18;
            try {
              const prices = await getCryptoPrices(['ETH']);
              const ethPrice = prices.ETH?.current_price || 0;
              const feeInUsd = ethFee * ethPrice;
              if (isMounted) setEstFees(prev => ({ ...prev, ETH: `$${feeInUsd.toFixed(2)}` }));
            } catch {
              if (isMounted) setEstFees(prev => ({ ...prev, ETH: `${ethFee.toFixed(5)} ETH` }));
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch live fees", e);
      }
    };

    fetchFees();
    return () => { isMounted = false; };
  }, []);

  // Auto-update toAmount when prices change or fromAmount changes
  useEffect(() => {
    const fromAmtNum = parseFloat(fromAmount);
    if (fromAmtNum === 0 || isNaN(fromAmtNum)) {
      // Only reset toAmount when the user is editing the from field, not the to field
      if (isUpdatingFromInput) {
        setToAmount("0.00");
      }
      return;
    }

    if (isLoading) {
      // Don't update toAmount while loading to allow skeleton to show
      return;
    }

    if (isUpdatingFromInput && bestQuote) {
      // Use exact amount from RocketX quote
      const toAmt = bestQuote.toAmount;
      const formattedToAmount = (toAmt !== undefined && toAmt !== null) 
        ? (typeof toAmt === 'number' 
            ? toAmt.toLocaleString('en-US', { 
                useGrouping: false, 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 8 
              })
            : String(toAmt))
        : "";
      if (toAmount !== formattedToAmount) {
        setToAmount(formattedToAmount);
      }
    } else if (isUpdatingFromInput && swapRate > 0) {
      // Fallback to calculated market rate if no specific quote
      const amount = parseFloat(fromAmount) || 0;
      const calculated = calculateSwapAmount(amount, swapRate) || 0;
      const formattedToAmount = (calculated !== undefined && calculated !== null)
        ? calculated.toLocaleString('en-US', { 
            useGrouping: false, 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 8 
          })
        : "";
      if (toAmount !== formattedToAmount) {
        setToAmount(formattedToAmount);
      }
    }
  }, [fromAmount, swapRate, isUpdatingFromInput, bestQuote, toAmount, isLoading]);

  // Auto-update fromAmount when toAmount is manually changed
  useEffect(() => {
    if (!isUpdatingFromInput && swapRate > 0) {
      const amount = parseFloat(toAmount) || 0;
      const calculated = (amount / (swapRate || 1)) || 0;
      const formattedFromAmount = (calculated !== undefined && calculated !== null)
        ? calculated.toLocaleString('en-US', { 
            useGrouping: false, 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 8 
          })
        : "";
      if (fromAmount !== formattedFromAmount) {
        setFromAmount(formattedFromAmount);
      }
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
    if (fromAmountNum <= 0) return;

    if (balance !== null && fromAmountNum > balance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${fromAmountNum} ${fromCurrency} but only have ${balance}`,
        variant: "destructive",
      });
      return;
    }

    const finalQuote = activeQuote || bestQuote;

    if (!finalQuote) {
      toast({
        title: "No Quote",
        description: "Please wait for a valid quote to be fetched.",
        variant: "destructive",
      });
      return;
    }

    // If we have a cached session password, execute directly
    if (getSessionPassword()) {
      await performSwap(getSessionPassword()!, finalQuote);
    } else {
      setShowPasswordDialog(true);
    }
  };

  const performSwap = async (password: string, quoteOverride?: any) => {
    const fromAmountNum = parseFloat(fromAmount);
    const toAmountNum = parseFloat(toAmount);
    const activeQuoteToUse = quoteOverride || activeQuote || bestQuote;

    setIsSwapping(true);

    try {
      // STEP 1: Get wallet addresses
      const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user!.id);

      const findCorrectWallet = (targetNetwork: string, _targetSymbol: string) => {
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

      const fromWallet = findCorrectWallet(fromNetwork, fromCurrency);
      const toWallet = findCorrectWallet(toNetwork, toCurrency);


      if (!fromWallet?.address || !toWallet?.address) {
        const missing = !fromWallet?.address ? fromCurrency : toCurrency;
        throw new Error(`Please generate a ${missing} wallet first. Go to the Assets page to create it.`);
      }

      // STEP 2: Create swap
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
        quoteId: activeQuoteToUse?.id,
      });

      if (!swapResponse?.id) {
        throw new Error("Swap creation failed");
      }

      const swapId = swapResponse.id;

      if (isMountedRef.current) {
        toast({
          title: "Swap Initiated",
          description: "Waiting for blockchain confirmation...",
        });
      }

      // STEP 3: Poll status
      let attempts = 0;
      let completed = false;

      while (attempts < 30 && isMountedRef.current) {
        await new Promise(r => setTimeout(r, 3000));

        const statusRes = await rocketXApi.getStatus(swapId);
        const status = statusRes?.status;

        if (status === "completed") {
          completed = true;
          break;
        }

        if (status === "failed") {
          throw new Error("Swap failed (insufficient balance or rejected)");
        }

        attempts++;
      }

      if (!completed && isMountedRef.current) {
        throw new Error("Swap timeout: The transaction is taking longer than expected. Please check your wallet history.");
      }

      if (isMountedRef.current) {
        toast({
          title: "Swap Successful!",
          description: `Successfully swapped ${fromAmountNum} ${fromCurrency} → ${toCurrency}`,
        });
      }
    } catch (error: any) {
      console.error("Swap execution failed:", error);
      if (isMountedRef.current) {
        toast({
          title: "Swap Failed",
          description: error.message || "Transaction failed. Please ensure your wallet has sufficient balance and the swap service is available.",
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSwapping(false);
      }
    }
  };

  const handlePasswordSubmit = async () => {
    if (walletPassword.length > 0) {
      setSessionPassword(walletPassword);
      await performSwap(walletPassword);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden">
          {/* Subtle radial glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
            <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">

              {/* Left — headline + trust signals */}
              <div className="space-y-5">
                <div className="space-y-3">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight text-foreground">
                    Swap crypto<br />
                    <span className="text-gradient-brand">your way</span>
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                    Convert any digital asset at the best available rate — no middlemen, no custody risk, no hidden fees.
                  </p>
                </div>

                {/* Trust bullets */}
                <ul className="space-y-3">
                  {[
                    "Best-price routing across 50+ liquidity sources",
                    "Non-custodial — your keys, your crypto",
                    "Supports 140+ countries and 500+ payment methods",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Stats strip */}
                <div className="flex flex-wrap gap-6 pt-2">
                  {[
                    { value: "14M+", label: "Users" },
                    { value: "500+", label: "Payment methods" },
                    { value: "140+", label: "Countries" },
                  ].map((s, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-2xl font-black text-foreground">{s.value}</span>
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Mobile CTA (hidden on lg, widget handles it on desktop) */}
                <div className="flex items-center gap-3 lg:hidden">
                  <Button
                    className="h-12 px-7 font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm shadow-md"
                    onClick={() => setLocation("/signup")}
                  >
                    Get started free
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-12 px-4 font-semibold text-sm"
                    onClick={() => setLocation("/signin")}
                  >
                    Sign in <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Right — live swap widget */}
              <div className="w-full">
                <Card className="bg-card border border-border/40 shadow-2xl rounded-2xl overflow-hidden">
                  {/* Widget header */}
                  <div className="px-6 pt-5 pb-4 border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-[#4ADE80] animate-pulse" />
                      <span className="text-sm font-bold text-foreground">Live rates</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Powered by RocketX</span>
                  </div>

                  <CardContent className="p-5 space-y-3">
                    {/* From token box */}
                    <div className="bg-accent/5 hover:bg-accent/8 transition-colors p-4 rounded-xl border border-border/40">
                      <Label className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 block">You send</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={fromAmount}
                          onChange={(e) => handleFromAmountChange(e.target.value)}
                          className="bg-transparent border-none text-3xl font-black p-0 focus-visible:ring-0 h-auto flex-1 min-w-0"
                          placeholder="0"
                        />
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Select value={fromCurrency} onValueChange={setFromCurrency}>
                            <SelectTrigger className="w-auto bg-card border border-border/50 px-3 py-2 rounded-full h-auto font-bold text-sm gap-2 shadow-sm hover:bg-accent/5 transition-colors">
                              <div className="flex items-center gap-2">
                                <img src={getCurrency(fromCurrency)?.iconUrl} alt="" className="w-5 h-5 rounded-full" />
                                <SelectValue placeholder="Select" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map(c => (
                                <SelectItem key={c.symbol} value={c.symbol}>
                                  <div className="flex items-center gap-2">
                                    <img src={c.iconUrl} alt="" className="w-4 h-4 rounded-full" />
                                    <span className="font-semibold">{c.symbol}</span>
                                    <span className="text-muted-foreground text-xs">{c.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {getCurrency(fromCurrency)?.networks && (
                            <Select value={fromNetwork} onValueChange={setFromNetwork}>
                              <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[10px] text-muted-foreground font-semibold px-1 uppercase tracking-wider focus:ring-0">
                                <SelectValue placeholder="Network" />
                              </SelectTrigger>
                              <SelectContent>
                                {getCurrency(fromCurrency)?.networks?.map(n => (
                                  <SelectItem key={n.chain} value={n.chain}>{n.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                      <div className="mt-2.5 flex justify-between items-center">
                        <span className="text-[11px] text-muted-foreground">Balance: — {fromCurrency}</span>
                        <span className="text-[11px] text-primary font-bold cursor-pointer hover:underline" onClick={() => setLocation("/signin")}>Sign in to see</span>
                      </div>
                    </div>

                    {/* Swap direction button */}
                    <div className="flex justify-center -my-1.5 relative z-10">
                      <button
                        className="h-9 w-9 rounded-full bg-primary text-black flex items-center justify-center shadow-md hover:bg-primary/90 active:scale-95 transition-all border-4 border-card"
                        onClick={handleSwapCurrencies}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </div>

                    {/* To token box */}
                    <div className="bg-accent/5 hover:bg-accent/8 transition-colors p-4 rounded-xl border border-border/40">
                      <Label className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3 block">You receive</Label>
                      <div className="flex items-center gap-3">
                        {isLoading ? (
                          <Skeleton className="h-9 w-28 rounded-lg" />
                        ) : (
                          <span className="text-3xl font-black flex-1 min-w-0 truncate text-foreground">
                            {toAmount !== "0.00" ? toAmount : <span className="text-muted-foreground/40">0</span>}
                          </span>
                        )}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Select value={toCurrency} onValueChange={setToCurrency}>
                            <SelectTrigger className="w-auto bg-card border border-border/50 px-3 py-2 rounded-full h-auto font-bold text-sm gap-2 shadow-sm hover:bg-accent/5 transition-colors">
                              <div className="flex items-center gap-2">
                                <img src={getCurrency(toCurrency)?.iconUrl} alt="" className="w-5 h-5 rounded-full" />
                                <SelectValue placeholder="Select" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map(c => (
                                <SelectItem key={c.symbol} value={c.symbol}>
                                  <div className="flex items-center gap-2">
                                    <img src={c.iconUrl} alt="" className="w-4 h-4 rounded-full" />
                                    <span className="font-semibold">{c.symbol}</span>
                                    <span className="text-muted-foreground text-xs">{c.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {getCurrency(toCurrency)?.networks && (
                            <Select value={toNetwork} onValueChange={setToNetwork}>
                              <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[10px] text-muted-foreground font-semibold px-1 uppercase tracking-wider focus:ring-0">
                                <SelectValue placeholder="Network" />
                              </SelectTrigger>
                              <SelectContent>
                                {getCurrency(toCurrency)?.networks?.map(n => (
                                  <SelectItem key={n.chain} value={n.chain}>{n.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rate details row */}
                    <div className="grid grid-cols-3 gap-2 px-1 pt-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Rate</span>
                        <span className="text-xs font-bold text-foreground truncate">
                          {isLoading ? <Skeleton className="h-3 w-20 mt-0.5" /> : `1 ${fromCurrency} ≈ ${formatRate(swapRate)} ${toCurrency}`}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Fee</span>
                        <span className="text-xs font-bold text-amber-500">
                          {isLoading ? <Skeleton className="h-3 w-12 mt-0.5" /> : (estFees[fromNetwork] || "—")}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Impact</span>
                        <span className="text-xs font-bold text-[#4ADE80]">
                          {isLoading ? <Skeleton className="h-3 w-10 mt-0.5" /> : (bestQuote?.priceImpact !== undefined ? `${bestQuote.priceImpact.toFixed(2)}%` : "< 0.01%")}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button
                      className="w-full h-13 text-base font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-all duration-150 active:scale-[0.98] mt-1"
                      onClick={() => setLocation("/signin")}
                    >
                      Sign in to swap
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>

                    <p className="text-center text-[11px] text-muted-foreground">
                      New to Pexly?{" "}
                      <button className="text-primary font-bold hover:underline" onClick={() => setLocation("/signup")}>
                        Create a free account
                      </button>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <div className="border-y border-border/40 bg-accent/3 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-xs text-muted-foreground font-medium">
              {[
                { icon: <Shield className="h-3.5 w-3.5 text-primary" />, text: "Non-custodial & self-sovereign" },
                { icon: <Zap className="h-3.5 w-3.5 text-primary" />, text: "Sub-second rate updates" },
                { icon: <CheckCircle2 className="h-3.5 w-3.5 text-primary" />, text: "Best-price routing across 50+ DEXs" },
                { icon: <TrendingDown className="h-3.5 w-3.5 text-primary" />, text: "Competitive low fees" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-black mb-3">Why use Pexly Swap</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">Built for traders who want control, speed, and the best price every time.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Best rates */}
              <Card className="bg-card border border-border/40 rounded-2xl p-7 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Source nodes */}
                    <circle cx="4" cy="8" r="2.5" fill="#B4F22E" opacity="0.7"/>
                    <circle cx="4" cy="14" r="2.5" fill="#B4F22E" opacity="0.5"/>
                    <circle cx="4" cy="20" r="2.5" fill="#B4F22E" opacity="0.35"/>
                    {/* Hub / router node */}
                    <circle cx="13" cy="14" r="3.5" fill="#B4F22E"/>
                    <circle cx="13" cy="14" r="2" fill="black" opacity="0.18"/>
                    {/* Destination node */}
                    <circle cx="24" cy="14" r="3" fill="#B4F22E"/>
                    {/* Grey fan lines (non-optimal paths) */}
                    <line x1="6.5" y1="8" x2="9.6" y2="12" stroke="#B4F22E" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round"/>
                    <line x1="6.5" y1="14" x2="9.4" y2="14" stroke="#B4F22E" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round"/>
                    <line x1="6.5" y1="20" x2="9.6" y2="16" stroke="#B4F22E" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round"/>
                    {/* Highlighted best-path line */}
                    <line x1="16.5" y1="14" x2="21" y2="14" stroke="#B4F22E" strokeWidth="2" strokeLinecap="round"/>
                    {/* Arrow head on destination */}
                    <polyline points="20,11.5 23,14 20,16.5" fill="none" stroke="#B4F22E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    {/* Small tick / checkmark on hub */}
                    <polyline points="11.2,14.2 12.6,15.6 15.2,12.6" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Best rates, always</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Our routing engine queries 50+ liquidity sources simultaneously and selects the optimal path for your swap — so you always get more out.</p>
              </Card>

              {/* Zero custody risk */}
              <Card className="bg-card border border-border/40 rounded-2xl p-7 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Shield body */}
                    <path d="M14 3L5 7V14.5C5 19.2 9 23.4 14 25C19 23.4 23 19.2 23 14.5V7L14 3Z" fill="#B4F22E" fillOpacity="0.18" stroke="#B4F22E" strokeWidth="1.6" strokeLinejoin="round"/>
                    {/* Inner shield highlight */}
                    <path d="M14 6L8 9.5V14.5C8 17.7 10.7 20.6 14 21.8C17.3 20.6 20 17.7 20 14.5V9.5L14 6Z" fill="#B4F22E" fillOpacity="0.10"/>
                    {/* Key circle */}
                    <circle cx="13" cy="13" r="3" fill="none" stroke="#B4F22E" strokeWidth="1.6"/>
                    {/* Key shaft */}
                    <line x1="15.8" y1="15.2" x2="19" y2="18.4" stroke="#B4F22E" strokeWidth="1.6" strokeLinecap="round"/>
                    {/* Key teeth */}
                    <line x1="17.2" y1="16.6" x2="18.4" y2="15.4" stroke="#B4F22E" strokeWidth="1.4" strokeLinecap="round"/>
                    <line x1="18.2" y1="17.6" x2="19.4" y2="16.4" stroke="#B4F22E" strokeWidth="1.4" strokeLinecap="round"/>
                    {/* Corner dots / circuit feel */}
                    <circle cx="8.5" cy="19.5" r="1" fill="#B4F22E" opacity="0.4"/>
                    <circle cx="19.5" cy="8.5" r="1" fill="#B4F22E" opacity="0.4"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Zero custody risk</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Your assets never leave your non-custodial wallet during the swap. Pexly acts as a coordinator, not a custodian. Your keys stay yours.</p>
              </Card>

              {/* Lightning-fast execution */}
              <Card className="bg-card border border-border/40 rounded-2xl p-7 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Speed lines left */}
                    <line x1="2" y1="10" x2="8" y2="10" stroke="#B4F22E" strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
                    <line x1="2" y1="14" x2="6" y2="14" stroke="#B4F22E" strokeWidth="1.4" strokeLinecap="round" opacity="0.3"/>
                    <line x1="2" y1="18" x2="8" y2="18" stroke="#B4F22E" strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
                    {/* Main lightning bolt */}
                    <path d="M17 3L9 15.5H14.5L11 25L22 12H16L17 3Z" fill="#B4F22E" stroke="#B4F22E" strokeWidth="0.6" strokeLinejoin="round"/>
                    {/* Glow core */}
                    <path d="M16.2 7L11.5 15.5H15.8L13 21.5L20.5 12H15.8L16.2 7Z" fill="white" fillOpacity="0.22"/>
                    {/* Small dot accents */}
                    <circle cx="24" cy="8" r="1.2" fill="#B4F22E" opacity="0.5"/>
                    <circle cx="25.5" cy="14" r="0.9" fill="#B4F22E" opacity="0.35"/>
                    <circle cx="24" cy="20" r="1.2" fill="#B4F22E" opacity="0.5"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Lightning-fast execution</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Swaps settle in seconds. Real-time price feeds and direct on-chain transactions mean no waiting, no slippage surprises.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* ── POPULAR PAIRS ── */}
        <section className="py-12 lg:py-14 bg-accent/4 border-y border-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-black mb-1">Popular pairs</h2>
                <p className="text-muted-foreground text-sm">Trade between the most liquid assets on any network</p>
              </div>
              <button
                className="text-sm font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
                onClick={() => setLocation("/signin")}
              >
                View all pairs <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { from: "BTC", to: "USDT", fromIcon: cryptoIconUrls.BTC, toIcon: cryptoIconUrls.USDT, change: "+2.4%", up: true },
                { from: "ETH", to: "USDT", fromIcon: cryptoIconUrls.ETH, toIcon: cryptoIconUrls.USDT, change: "+1.1%", up: true },
                { from: "SOL", to: "USDT", fromIcon: cryptoIconUrls.SOL, toIcon: cryptoIconUrls.USDT, change: "-0.7%", up: false },
                { from: "BNB", to: "USDT", fromIcon: cryptoIconUrls.BNB, toIcon: cryptoIconUrls.USDT, change: "+0.9%", up: true },
              ].map((pair, i) => (
                <Card
                  key={i}
                  className="bg-card border border-border/40 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                  onClick={() => setLocation("/signin")}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex items-center">
                      <img src={pair.fromIcon} alt={pair.from} className="w-8 h-8 rounded-full z-10 ring-2 ring-card" />
                      <img src={pair.toIcon} alt={pair.to} className="w-8 h-8 rounded-full -ml-2 ring-2 ring-card" />
                    </div>
                    <div>
                      <div className="font-black text-sm">{pair.from}/{pair.to}</div>
                      <div className={`text-xs font-bold ${pair.up ? "text-[#4ADE80]" : "text-red-400"}`}>{pair.change}</div>
                    </div>
                  </div>
                  <div className="h-12 w-full rounded-lg overflow-hidden relative bg-accent/10">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                      <polyline
                        points={pair.up
                          ? "0,35 15,30 30,28 45,22 55,25 65,18 80,12 100,8"
                          : "0,8 15,12 30,15 45,20 55,18 65,25 80,28 100,32"}
                        fill="none"
                        stroke={pair.up ? "#4ADE80" : "#EF4444"}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Swap now</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-12 lg:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-black mb-3">How to swap in 3 steps</h2>
              <p className="text-muted-foreground text-lg">No experience required. Start swapping in under 2 minutes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line (desktop only) */}
              <div className="hidden md:block absolute top-7 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-border/50 pointer-events-none" />
              {[
                {
                  step: "01",
                  title: "Create your account",
                  desc: "Sign up in seconds with just an email address. No KYC required to start swapping.",
                },
                {
                  step: "02",
                  title: "Choose your pair",
                  desc: "Select the assets you want to swap. Preview live rates before you commit — no surprises.",
                },
                {
                  step: "03",
                  title: "Confirm & execute",
                  desc: "Review the quote and hit swap. Your assets land in your non-custodial wallet within seconds.",
                },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-black font-black text-lg shadow-lg relative z-10">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Button
                className="h-13 px-10 text-base font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-all active:scale-[0.98]"
                onClick={() => setLocation("/signup")}
              >
                Start swapping free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-12 lg:py-14 border-t border-border/30 bg-accent/3">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-black mb-3">Frequently asked questions</h2>
              <p className="text-muted-foreground">Find answers to the most popular questions about Pexly Swap</p>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {[
                {
                  q: "Are there any fees for swapping on Pexly?",
                  a: "Pexly charges a small protocol fee that is already included in the quoted rate you see. There are also network (gas) fees charged by the blockchain, which vary based on network congestion. You'll always see the total cost before confirming."
                },
                {
                  q: "Is my crypto safe while swapping?",
                  a: "Yes. Pexly is fully non-custodial, meaning your assets stay in your own wallet throughout the swap process. We coordinate the transaction but never hold your funds."
                },
                {
                  q: "My transaction failed. What should I do?",
                  a: "Failed swaps typically happen due to price slippage or insufficient gas. Your funds remain in your wallet and are not lost. Try again with a slightly higher slippage tolerance, or wait for network congestion to ease."
                },
                {
                  q: "What are the minimum and maximum swap amounts?",
                  a: "Minimums vary by asset and network, typically $10 equivalent or more. There are no maximums — large swaps are routed across multiple liquidity sources automatically to minimize price impact."
                },
              ].map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border border-border/40 rounded-xl px-5 bg-card shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="text-left font-bold py-5 text-sm hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="py-10 lg:py-12 bg-primary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-black leading-tight">
              Ready to swap smarter?
            </h2>
            <p className="text-black/70 text-lg font-medium max-w-xl mx-auto">
              Join 14 million users already trading on Pexly. No hidden fees, no custody risk — just fast, fair swaps.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                className="h-13 px-10 text-base font-black bg-black text-white hover:bg-black/85 rounded-xl shadow-lg active:scale-[0.98] transition-all"
                onClick={() => setLocation("/signup")}
              >
                Create free account
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                className="h-13 px-6 text-base font-bold text-black/80 hover:text-black hover:bg-black/10 rounded-xl"
                onClick={() => setLocation("/signin")}
              >
                Already have an account? Sign in
              </Button>
            </div>
          </div>
        </section>

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
                    <div className="flex flex-col gap-2 items-end">
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

                      {getCurrency(fromCurrency)?.networks && (
                        <Select value={fromNetwork} onValueChange={setFromNetwork}>
                          <SelectTrigger className="h-7 min-w-[100px] bg-transparent border-none text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground focus:ring-0 shadow-none px-2 py-0">
                            <div className="flex items-center gap-1 justify-end w-full">
                              <span>Network: {getCurrency(fromCurrency)?.networks?.find(n => n.chain === fromNetwork)?.name}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent align="end">
                            {getCurrency(fromCurrency)?.networks?.map((net) => (
                              <SelectItem key={net.chain} value={net.chain} className="text-[10px] font-bold uppercase">
                                {net.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
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
                    {isLoading ? (
                      <Skeleton className="h-10 w-24 bg-foreground/10" />
                    ) : (
                      <Input
                        type="number"
                        value={toAmount}
                        onChange={(e) => handleToAmountChange(e.target.value)}
                        className="flex-1 h-12 text-2xl font-semibold bg-transparent border-none p-0 focus-visible:ring-0 shadow-none"
                        placeholder="0.00"
                      />
                    )}
                    <div className="flex flex-col gap-2 items-end">
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

                      {getCurrency(toCurrency)?.networks && (
                        <Select value={toNetwork} onValueChange={setToNetwork}>
                          <SelectTrigger className="h-7 min-w-[100px] bg-transparent border-none text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground focus:ring-0 shadow-none px-2 py-0">
                            <div className="flex items-center gap-1 justify-end w-full">
                              <span>Network: {getCurrency(toCurrency)?.networks?.find(n => n.chain === toNetwork)?.name}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent align="end">
                            {getCurrency(toCurrency)?.networks?.map((net) => (
                              <SelectItem key={net.chain} value={net.chain} className="text-[10px] font-bold uppercase">
                                {net.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rates Info */}
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 pt-2">
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
                </div>

                  {/* Swap Details */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-sm px-1">
                      <span className="text-muted-foreground font-medium">Provider</span>
                      <div className="flex items-center gap-2">
                        <img 
                          src="/logos/IMG_4589.webp" 
                          alt="RocketX" 
                          className="h-4 w-4 rounded-full object-contain"
                          draggable="false"
                        />
                        <span className="text-foreground font-bold">RocketX</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm px-1">
                      <span className="text-muted-foreground font-medium">Swapper Fee</span>
                      <span className="text-foreground font-bold">
                        {bestQuote?.gasFee ? (bestQuote.gasFee < 0.01 ? `< $0.01 USD` : `$${bestQuote.gasFee.toFixed(2)} USD`) : (estFees[fromNetwork] || "Calculated at swap")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm px-1">
                      <span className="text-muted-foreground font-medium">Price Impact</span>
                      <span className="text-emerald-500 font-bold">
                        {isLoading ? "..." : (percentageDiff < 0.01 ? "< 0.01%" : `${percentageDiff.toFixed(2)}%`)}
                      </span>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <Button 
                    className="w-full h-14 text-lg font-black bg-[#B4F22E] hover:bg-[#B4F22E]/90 text-black rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                    onClick={handleSwap}
                    disabled={isSwapping || (balance !== null && parseFloat(fromAmount) > balance)}
                  >
                    {isSwapping ? (
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    ) : (balance !== null && parseFloat(fromAmount) > balance) ? (
                      "Insufficient Balance"
                    ) : (
                      "Swap Now"
                    )}
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
                            {formatDistanceToNow(order.createdAt)}
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
