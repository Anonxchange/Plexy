
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
import { ArrowUpDown, TrendingDown, Shield, Gift, Loader2, Lock, BarChart3, ArrowRight } from "lucide-react";
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
import { useWalletData } from "@/hooks/use-wallet-data";


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
  const [fromAmount, setFromAmount] = useState("0.00001");
  const [toAmount, setToAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("BTC");
  const [toCurrency, setToCurrency] = useState("USDT");
  const [fromNetwork, setFromNetwork] = useState("BTC");
  const [toNetwork, setToNetwork] = useState("ETH");
  const [isUpdatingFromInput, setIsUpdatingFromInput] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");

  const { data: walletData } = useWalletData();
  const monitoredBalances = walletData?.assets || [];

  // Helper to get currency object
  const getCurrency = (symbol: string) => currencies.find(c => c.symbol === symbol);

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
  const [swapHistory, setSwapHistory] = useState<any[]>([]);
  const [estFees, setEstFees] = useState<Record<string, string>>({
    BTC: "0.0001 BTC",
    ETH: "0.002 ETH",
    BSC: "0.001 BNB",
    SOL: "0.000005 SOL",
    TRX: "15 TRX"
  });

  // Automatically sync activeQuote with bestQuote from the hook
  useEffect(() => {
    if (bestQuote) {
      setActiveQuote(bestQuote);
    }
  }, [bestQuote]);

  // Fetch balance for the selected "From" asset
  useEffect(() => {
    const fromWallet = monitoredBalances.find(b => 
      b.symbol.toLowerCase() === fromCurrency.toLowerCase()
    );
    
    setBalance(fromWallet?.balance || 0);
  }, [fromCurrency, fromNetwork, monitoredBalances]);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        if (bestQuote && bestQuote.gasFee) {
          const feeStr = `${bestQuote.gasFee.toFixed(6)} ${fromCurrency}`;
          setEstFees(prev => ({ ...prev, [fromNetwork]: feeStr }));
          return;
        }

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

  useEffect(() => {
    if (isUpdatingFromInput && bestQuote) {
      const formattedToAmount = bestQuote.toAmount.toLocaleString('en-US', { 
        useGrouping: false, 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 8 
      });
      if (toAmount !== formattedToAmount) {
        setToAmount(formattedToAmount);
      }
    } else if (isUpdatingFromInput && swapRate > 0) {
      const amount = parseFloat(fromAmount) || 0;
      const calculated = calculateSwapAmount(amount, swapRate);
      const formattedToAmount = calculated.toLocaleString('en-US', { 
        useGrouping: false, 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 8 
      });
      if (toAmount !== formattedToAmount) {
        setToAmount(formattedToAmount);
      }
    }
  }, [fromAmount, swapRate, isUpdatingFromInput, bestQuote, toAmount]);

  useEffect(() => {
    if (!isUpdatingFromInput && swapRate > 0) {
      const amount = parseFloat(toAmount) || 0;
      const calculated = amount / swapRate;
      const formattedFromAmount = calculated.toLocaleString('en-US', { 
        useGrouping: false, 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 8 
      });
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

    if (!activeQuote) {
      toast({
        title: "No Quote",
        description: "Please wait for a valid quote to be fetched.",
        variant: "destructive",
      });
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
    
    const fromTarget = fromNetwork.toLowerCase();
    const fromSymbolTarget = fromCurrency.toLowerCase();
    const toTarget = toNetwork.toLowerCase();
    const toSymbolTarget = toCurrency.toLowerCase();

    const fromWallet = wallets.find(w => {
      const chainIdLower = w.chainId?.toLowerCase();
      const walletTypeLower = w.walletType?.toLowerCase();
      const assetTypeLower = w.assetType?.toLowerCase();
      
      const isBTCMatch = (target: string) => ["btc", "bitcoin", "bitcoin (segwit)"].includes(target);
      const isETHMatch = (target: string) => ["eth", "ethereum", "erc20"].includes(target);
      const isBSCMatch = (target: string) => ["bsc", "bnb", "binance", "bep20", "binance coin"].includes(target);
      const isSolMatch = (target: string) => ["sol", "solana"].includes(target);
      const isTronMatch = (target: string) => ["trx", "tron", "trc20", "tron (trc-20)"].includes(target);
      const isXRPMatch = (target: string) => ["xrp", "ripple"].includes(target);
      const isPolygonMatch = (target: string) => ["matic", "polygon"].includes(target);

      const matchesChain = (target: string, value: string | undefined) => {
        if (!value) return false;
        if (isBTCMatch(target)) return isBTCMatch(value);
        if (isETHMatch(target)) return isETHMatch(value);
        if (isBSCMatch(target)) return isBSCMatch(value);
        if (isSolMatch(target)) return isSolMatch(value);
        if (isTronMatch(target)) return isTronMatch(value);
        if (isXRPMatch(target)) return isXRPMatch(value);
        if (isPolygonMatch(target)) return isPolygonMatch(value);
        return target === value;
      };

      return matchesChain(fromTarget, chainIdLower) || 
             matchesChain(fromSymbolTarget, chainIdLower) ||
             matchesChain(fromTarget, walletTypeLower) ||
             matchesChain(fromSymbolTarget, walletTypeLower) ||
             matchesChain(fromSymbolTarget, assetTypeLower) ||
             (["usdt", "usdc"].includes(fromSymbolTarget) && 
              (walletTypeLower === "evm-token" || isETHMatch(walletTypeLower) || isBSCMatch(walletTypeLower)));
    });
    
    const toWallet = wallets.find(w => {
      const chainIdLower = w.chainId?.toLowerCase();
      const walletTypeLower = w.walletType?.toLowerCase();
      const assetTypeLower = w.assetType?.toLowerCase();
      
      const isBTCMatch = (target: string) => ["btc", "bitcoin", "bitcoin (segwit)"].includes(target);
      const isETHMatch = (target: string) => ["eth", "ethereum", "erc20"].includes(target);
      const isBSCMatch = (target: string) => ["bsc", "bnb", "binance", "bep20", "binance coin"].includes(target);
      const isSolMatch = (target: string) => ["sol", "solana"].includes(target);
      const isTronMatch = (target: string) => ["trx", "tron", "trc20", "tron (trc-20)"].includes(target);
      const isXRPMatch = (target: string) => ["xrp", "ripple"].includes(target);
      const isPolygonMatch = (target: string) => ["matic", "polygon"].includes(target);

      const matchesChain = (target: string, value: string | undefined) => {
        if (!value) return false;
        if (isBTCMatch(target)) return isBTCMatch(value);
        if (isETHMatch(target)) return isETHMatch(value);
        if (isBSCMatch(target)) return isBSCMatch(value);
        if (isSolMatch(target)) return isSolMatch(value);
        if (isTronMatch(target)) return isTronMatch(value);
        if (isXRPMatch(target)) return isXRPMatch(value);
        if (isPolygonMatch(target)) return isPolygonMatch(value);
        return target === value;
      };

      return matchesChain(toTarget, chainIdLower) || 
             matchesChain(toSymbolTarget, chainIdLower) ||
             matchesChain(toTarget, walletTypeLower) ||
             matchesChain(toSymbolTarget, walletTypeLower) ||
             matchesChain(toSymbolTarget, assetTypeLower) ||
             (["usdt", "usdc"].includes(toSymbolTarget) && 
              (walletTypeLower === "evm-token" || isETHMatch(walletTypeLower) || isBSCMatch(walletTypeLower)));
    });

    if (!fromWallet?.address || !toWallet?.address) {
      const missing = !fromWallet?.address ? fromCurrency : toCurrency;
      throw new Error(`Please generate a ${missing} wallet first. Go to the Assets page to create it.`);
    }

    const swapResponse = await rocketXApi.executeSwap({
      userId: user!.id,
      fromToken: activeQuote?.fromToken,
      fromNetwork,
      fromAmount: activeQuote?.fromAmount || fromAmountNum,
      fromAddress: fromWallet.address,
      toToken: activeQuote?.toToken,
      toNetwork,
      toAmount: activeQuote?.toAmount || toAmountNum,
      toAddress: toWallet.address,
      slippage: 1,
      quoteId: activeQuote?.id
    });

    if (!swapResponse?.id) {
      throw new Error("Swap creation failed");
    }

    const swapId = swapResponse.id;

    toast({
      title: "Swap Initiated",
      description: "Waiting for blockchain confirmation...",
    });

    let attempts = 0;
    let completed = false;

    while (attempts < 30) {
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

    if (!completed) {
      throw new Error("Swap timeout: The transaction is taking longer than expected. Please check your wallet history.");
    }

    toast({
      title: "Swap Successful!",
      description: `Successfully swapped ${fromAmountNum} ${fromCurrency} → ${toCurrency}`,
    });

  } catch (error: any) {
    console.error("Swap execution failed:", error);
    toast({
      title: "Swap Failed",
      description: error.message || "Transaction failed. Please ensure your wallet has sufficient balance and the swap service is available.",
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
          <section className="relative py-20 px-4 overflow-hidden">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight">
                Swap assets instantly with Pexly
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Swap between BTC, ETH, SOL, USDT and more.
              </p>

              <Card className="max-w-lg mx-auto bg-card border-none shadow-2xl overflow-hidden rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex justify-between mb-2">
                      <Label className="text-muted-foreground">You Pay</Label>
                    </div>
                    <div className="flex gap-4">
                      <Input 
                        type="number" 
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="text-2xl font-bold bg-transparent border-none focus-visible:ring-0 p-0 h-auto"
                      />
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm h-fit">BTC</Badge>
                    </div>
                  </div>

                  <div className="flex justify-center -my-2 relative z-10">
                    <Button size="icon" variant="outline" className="rounded-full h-10 w-10 bg-background border-border shadow-md">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex justify-between mb-2">
                      <Label className="text-muted-foreground">You Receive</Label>
                    </div>
                    <div className="flex gap-4">
                      <Input 
                        type="number" 
                        readOnly
                        value={toAmount}
                        className="text-2xl font-bold bg-transparent border-none focus-visible:ring-0 p-0 h-auto"
                      />
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm h-fit">USDT</Badge>
                    </div>
                  </div>

                  <Button className="w-full h-14 text-lg font-bold rounded-xl mt-4" onClick={() => setLocation("/signin")}>
                    Log in to swap
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
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-[10%] left-[5%] rotate-12">
          <div className="h-24 w-24 rounded-full border-4 border-primary/20" />
        </div>
        <div className="absolute bottom-[10%] right-[20%] -rotate-6">
          <div className="h-40 w-40 rounded-full border border-primary/20 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full border border-primary/10" />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-foreground">Swap Assets</h1>
              <p className="text-muted-foreground">Swap between hundreds of assets across different networks.</p>
            </div>

            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">From</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Balance:</span>
                      <span className="text-xs font-bold text-foreground">
                        {balance === null ? <Loader2 className="h-3 w-3 animate-spin inline" /> : `${balance.toFixed(6)} ${fromCurrency}`}
                      </span>
                      <button 
                        onClick={() => balance !== null && setFromAmount(balance.toString())}
                        className="text-[10px] font-black text-primary hover:opacity-80 transition-opacity uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative group">
                      <Input 
                        type="number"
                        placeholder="0.00"
                        value={fromAmount}
                        onChange={(e) => handleFromAmountChange(e.target.value)}
                        className="h-16 text-2xl font-bold bg-muted/50 border-border/50 rounded-2xl focus:bg-muted focus:ring-primary/20 transition-all pl-4"
                      />
                    </div>
                    
                    <div className="flex gap-2 min-w-[200px]">
                      <Select value={fromCurrency} onValueChange={setFromCurrency}>
                        <SelectTrigger className="h-16 bg-muted/50 border-border/50 rounded-2xl font-bold text-lg flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(c => (
                            <SelectItem key={c.symbol} value={c.symbol}>
                              <div className="flex items-center gap-2">
                                <img src={c.iconUrl} alt={c.name} className="w-6 h-6 rounded-full" />
                                <span>{c.symbol}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center -my-4 relative z-10">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={handleSwapCurrencies}
                    className="rounded-full h-12 w-12 bg-background border-border shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <ArrowUpDown className="h-5 w-5 text-primary" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">To (Estimated)</Label>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Input 
                        type="number"
                        placeholder="0.00"
                        value={toAmount}
                        onChange={(e) => handleToAmountChange(e.target.value)}
                        className="h-16 text-2xl font-bold bg-muted/50 border-border/50 rounded-2xl focus:bg-muted transition-all pl-4"
                      />
                    </div>
                    
                    <div className="flex gap-2 min-w-[200px]">
                      <Select value={toCurrency} onValueChange={setToCurrency}>
                        <SelectTrigger className="h-16 bg-muted/50 border-border/50 rounded-2xl font-bold text-lg flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(c => (
                            <SelectItem key={c.symbol} value={c.symbol}>
                              <div className="flex items-center gap-2">
                                <img src={c.iconUrl} alt={c.name} className="w-6 h-6 rounded-full" />
                                <span>{c.symbol}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-4 bg-primary/5 rounded-2xl animate-pulse">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                    <span className="text-sm font-medium text-primary">Finding best routes...</span>
                  </div>
                ) : (
                  marketRate > 0 && (
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium mb-1">Exchange Rate</span>
                        <span className="text-sm font-bold text-foreground">
                          1 {fromCurrency} ≈ {formatRate(swapRate)} {toCurrency}
                        </span>
                      </div>
                      <Badge variant={percentageDiff <= 1 ? "secondary" : "destructive"} className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        Best Rate
                      </Badge>
                    </div>
                  )
                )}

                <Button 
                  className="w-full h-16 text-xl font-black rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 group overflow-hidden relative"
                  disabled={isLoading || isSwapping || !fromAmount || parseFloat(fromAmount) <= 0}
                  onClick={handleSwap}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary group-hover:scale-105 transition-transform" />
                  <span className="relative flex items-center gap-2">
                    {isSwapping ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Swap {fromCurrency}
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-card border border-border/50 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Secure Swap</h4>
                  <p className="text-[10px] text-muted-foreground">End-to-end encrypted transactions</p>
                </div>
              </div>
              <div className="p-4 bg-card border border-border/50 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Low Slippage</h4>
                  <p className="text-[10px] text-muted-foreground">Optimized for best price execution</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-3xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  Swap Details
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">From Network</span>
                    <Badge variant="outline" className="font-bold border-primary/20 bg-primary/5">{fromNetwork}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">To Network</span>
                    <Badge variant="outline" className="font-bold border-primary/20 bg-primary/5">{toNetwork}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Est. Network Fee</span>
                    <span className="font-bold">{estFees[fromNetwork] || "Fetching..."}</span>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-muted-foreground">Minimum Received</span>
                      <span className="font-bold text-foreground">
                        {(parseFloat(toAmount) * 0.99).toFixed(6)} {toCurrency}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right italic">1% Max Slippage Applied</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md rounded-3xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                  Recent Swaps
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-primary px-2">VIEW ALL</Button>
                </h3>
                <div className="space-y-3">
                  {swapHistory.length === 0 ? (
                    <div className="py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 opacity-20">
                        <Lock className="h-6 w-6" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">No recent transactions</p>
                    </div>
                  ) : (
                    swapHistory.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <img src={cryptoIconUrls[item.fromToken] || cryptoIconUrls.BTC} className="w-6 h-6 rounded-full border border-background" />
                            <img src={cryptoIconUrls[item.toToken] || cryptoIconUrls.USDT} className="w-6 h-6 rounded-full border border-background" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{item.fromAmount} {item.fromToken} → {item.toToken}</p>
                            <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(item.timestamp)}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none">
                          SUCCESS
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-primary-foreground shadow-lg shadow-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <h4 className="text-lg font-black mb-2 flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Earn Rewards
                </h4>
                <p className="text-sm opacity-90 leading-snug mb-4">Invite your friends to swap and get up to 0.5% of their trade volume in USDT.</p>
                <Button variant="secondary" className="w-full font-bold bg-white text-primary hover:bg-white/90">Invite Friends</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <PexlyFooter />

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border/50 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center">Confirm Swap</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Pay</p>
                <p className="text-xl font-black">{fromAmount} {fromCurrency}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Receive</p>
                <p className="text-xl font-black">{toAmount} {toCurrency}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Wallet Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your wallet password"
                value={walletPassword}
                onChange={(e) => setWalletPassword(e.target.value)}
                className="h-12 bg-muted/50 border-border/50 rounded-xl font-bold"
              />
              <p className="text-xs text-muted-foreground italic">Required to decrypt your private keys for the transaction.</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full h-14 text-lg font-black rounded-2xl"
              onClick={() => {
                setShowPasswordDialog(false);
                handlePasswordSubmit();
              }}
              disabled={!walletPassword}
            >
              Authorize Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
