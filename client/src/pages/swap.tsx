
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
  const [fromAmount, setFromAmount] = useState("0.00001");
  const [toAmount, setToAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("BTC");
  const [toCurrency, setToCurrency] = useState("USDT");
  const [fromNetwork, setFromNetwork] = useState("BTC");
  const [toNetwork, setToNetwork] = useState("ETH");
  const [isUpdatingFromInput, setIsUpdatingFromInput] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");

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
    const fetchFees = async () => {
      try {
        if (bestQuote && bestQuote.gasFee) {
          // Already handled in the bestQuote sync useEffect
          return;
        }

        // Fallback to manual fetch if no quote
        const btcRes = await fetch('https://mempool.space/api/v1/fees/recommended');
        if (btcRes.ok) {
          const btcData = await btcRes.json();
          // Average tx is ~140 vBytes, convert sat/vB to BTC
          const btcFee = (btcData.hourFee * 140) / 1e8;
          // Get BTC price to show in USD
          try {
            const prices = await getCryptoPrices(['BTC']);
            const btcPrice = prices.BTC?.current_price || 0;
            const feeInUsd = btcFee * btcPrice;
            setEstFees(prev => ({ ...prev, BTC: `$${feeInUsd.toFixed(2)}` }));
          } catch {
            setEstFees(prev => ({ ...prev, BTC: `${btcFee.toFixed(6)} BTC` }));
          }
        }

        // Fetch Ethereum Gas Price
        const ethRes = await fetch('https://api.etherscan.io/api?module=proxy&action=eth_gasPrice');
        if (ethRes.ok) {
          const ethData = await ethRes.json();
          if (ethData && ethData.result) {
            const gasPrice = parseInt(ethData.result, 16);
            // Typical swap is ~150k gas
            const ethFee = (gasPrice * 150000) / 1e18;
            try {
              const prices = await getCryptoPrices(['ETH']);
              const ethPrice = prices.ETH?.current_price || 0;
              const feeInUsd = ethFee * ethPrice;
              setEstFees(prev => ({ ...prev, ETH: `$${feeInUsd.toFixed(2)}` }));
            } catch {
              setEstFees(prev => ({ ...prev, ETH: `${ethFee.toFixed(5)} ETH` }));
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch live fees", e);
      }
    };

    fetchFees();
    // setHistory(swapExecutionService.getOrderHistory());
  }, []);

  // Auto-update toAmount when prices change or fromAmount changes
  useEffect(() => {
    if (isUpdatingFromInput && bestQuote) {
      // Use exact amount from RocketX quote
      const toAmt = bestQuote.toAmount;
      const formattedToAmount = (toAmt !== undefined && toAmt !== null) 
        ? toAmt.toLocaleString('en-US', { 
            useGrouping: false, 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 8 
          })
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
  }, [fromAmount, swapRate, isUpdatingFromInput, bestQuote, toAmount]);

  // Auto-update fromAmount when toAmount is manually changed
  useEffect(() => {
    if (!isUpdatingFromInput && swapRate > 0) {
      const amount = parseFloat(toAmount) || 0;
      const calculated = (amount / swapRate) || 0;
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
    
    // Swap the amounts and keep the update flag consistent
    if (isUpdatingFromInput) {
      setFromAmount(tempToAmount);
      setToAmount(tempFromAmount);
    } else {
      setFromAmount(tempToAmount);
      setToAmount(tempFromAmount);
    }
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

  const handleGetQuote = async () => {
    // This is now redundant as hook fetches it, but keeping signature for handleSwap
    return bestQuote;
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

    // Refresh quote one last time before execution to be safe
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
    if (sessionPassword) {
      await performSwap(sessionPassword, finalQuote);
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
    const fromCurrObj = currencies.find(c => c.symbol === fromCurrency);
    const toCurrObj = currencies.find(c => c.symbol === toCurrency);

    const fromNetObj = fromCurrObj?.networks?.find(n => n.chain === fromNetwork);
    const toNetObj = toCurrObj?.networks?.find(n => n.chain === toNetwork);

    // STEP 1: Get wallet addresses
    console.log("Fetching non-custodial wallets for user:", user!.id);
    const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user!.id);
    console.log("Found wallets:", wallets.map(w => ({ chainId: w.chainId, address: w.address, walletType: w.walletType })));
    
    // Normalize networks/currencies for comparison
    const fromTarget = fromNetwork.toLowerCase();
    const fromSymbolTarget = fromCurrency.toLowerCase();
    const toTarget = toNetwork.toLowerCase();
    const toSymbolTarget = toCurrency.toLowerCase();

    // Improved matching logic to find correct wallet
    const findCorrectWallet = (targetNetwork: string, targetSymbol: string) => {
      const net = targetNetwork.toLowerCase();
      const sym = targetSymbol.toLowerCase();
      
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

    console.log("Selected fromWallet:", fromWallet?.address, "for target:", fromNetwork);
    console.log("Selected toWallet:", toWallet?.address, "for target:", toNetwork);

    if (!fromWallet?.address || !toWallet?.address) {
      console.error("Wallet missing. From:", fromWallet?.address, "To:", toWallet?.address);
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
      quoteId: activeQuoteToUse?.id // Pass quote ID if available
    });

    if (!swapResponse?.id) {
      throw new Error("Swap creation failed");
    }

    const swapId = swapResponse.id;

    toast({
      title: "Swap Initiated",
      description: "Waiting for blockchain confirmation...",
    });

    // STEP 2: Poll status
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
                      <div className="ml-auto flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 bg-card border border-border/40 px-3 py-1.5 rounded-full shadow-sm">
                          <img src={getCurrency(fromCurrency)?.iconUrl} alt="" className="w-5 h-5 rounded-full" />
                          <span className="font-bold">{fromCurrency}</span>
                        </div>
                        {getCurrency(fromCurrency)?.networks && (
                          <span className="text-[10px] text-muted-foreground font-medium px-2 uppercase tracking-tighter">
                            {getCurrency(fromCurrency)?.networks?.find(n => n.chain === fromNetwork)?.name || fromNetwork}
                          </span>
                        )}
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
                      <div className="ml-auto flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 bg-card border border-border/40 px-3 py-1.5 rounded-full shadow-sm">
                          <img src={getCurrency(toCurrency)?.iconUrl} alt="" className="w-5 h-5 rounded-full" />
                          <span className="font-bold">{toCurrency}</span>
                        </div>
                        {getCurrency(toCurrency)?.networks && (
                          <span className="text-[10px] text-muted-foreground font-medium px-2 uppercase tracking-tighter">
                            {getCurrency(toCurrency)?.networks?.find(n => n.chain === toNetwork)?.name || toNetwork}
                          </span>
                        )}
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
                    <Input
                      type="number"
                      value={toAmount}
                      onChange={(e) => handleToAmountChange(e.target.value)}
                      className="flex-1 h-12 text-2xl font-semibold bg-transparent border-none p-0 focus-visible:ring-0 shadow-none"
                      placeholder="0.00"
                    />
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
                          src="https://cdn.rocketx.exchange/pd135zq/images/exchange/rocketx_pool_10.png" 
                          alt="RocketX" 
                          className="h-4 w-4 rounded-full" 
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
