import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowUpDown, TrendingDown, Shield, Gift, Loader2 } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useSchema, swapPageSchema } from "@/hooks/use-schema";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useSwapPrice, calculateSwapAmount } from "@/hooks/use-swap-price";
import { getCryptoPrices } from "@/lib/crypto-prices";
import { useToast } from "@/hooks/use-toast";
import { executeSwap } from "@/lib/swap-api";
import { swapExecutionService, type ExecutionOrder } from "@/lib/swap-execution";
import { formatDistanceToNow } from "date-fns";

const currencies = [
  { symbol: "BTC", name: "Bitcoin", iconUrl: cryptoIconUrls.BTC, chain: "BTC", identifier: "BTC.BTC" },
  { symbol: "USDT", name: "Tether", iconUrl: cryptoIconUrls.USDT, chain: "ETH", identifier: "ETH.USDT-0xdac17f958d2ee523a2206206994597C13D831ec7" },
  { symbol: "ETH", name: "Ethereum", iconUrl: cryptoIconUrls.ETH, chain: "ETH", identifier: "ETH.ETH" },
  { symbol: "USDC", name: "USD Coin", iconUrl: cryptoIconUrls.USDC, chain: "ETH", identifier: "ETH.USDC-0xa0b86991c6218b36c1d19D4a2e9Eb0ce3606eb48" },
  { symbol: "SOL", name: "Solana", iconUrl: cryptoIconUrls.SOL, chain: "SOL", identifier: "SOL.SOL" },
  { symbol: "TRX", name: "Tron", iconUrl: cryptoIconUrls.TRX, chain: "TRX", identifier: "TRX.TRX" },
  { symbol: "BNB", name: "BNB", iconUrl: cryptoIconUrls.BNB, chain: "BSC", identifier: "BSC.BNB" },
];

export function Swap() {
  useSchema(swapPageSchema, "swap-page-schema");
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [fromAmount, setFromAmount] = useState("0.00001");
  const [toAmount, setToAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("BTC");
  const [toCurrency, setToCurrency] = useState("USDT");
  const [isUpdatingFromInput, setIsUpdatingFromInput] = useState(true);

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
      setToAmount(calculated.toFixed(6));
    }
  }, [fromAmount, swapRate, isUpdatingFromInput]);

  // Auto-update fromAmount when toAmount is manually changed
  useEffect(() => {
    if (!isUpdatingFromInput && swapRate > 0) {
      const amount = parseFloat(toAmount) || 0;
      const calculated = amount / swapRate;
      setFromAmount(calculated.toFixed(8));
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
    const feeAmount = 0;

    if (fromAmountNum <= 0 || toAmountNum <= 0) {
      return;
    }

    setIsSwapping(true);
    try {
      // Ensure the wallet password is set for non-custodial signing
      if (!localStorage.getItem("pexly_wallet_password")) {
        localStorage.setItem("pexly_wallet_password", "password123");
      }

      const result = await executeSwap({
        userId: user.id,
        fromCrypto: fromCurrency,
        toCrypto: toCurrency,
        fromAmount: fromAmountNum,
        toAmount: toAmountNum,
        swapRate,
        marketRate,
        fee: feeAmount,
      });

      toast({
        title: "Swap Successful!",
        description: `Swapped ${fromAmountNum} ${fromCurrency} to ${result.to_amount.toFixed(6)} ${toCurrency}`,
      });

      setHistory(swapExecutionService.getOrderHistory());
      setFromAmount("0.00001");
      setToAmount("");
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 px-4 py-8">
          <div className="mb-8">
            <Card className="bg-card/50">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-base">From</Label>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      className="flex-1 h-16 text-2xl bg-background"
                      placeholder="0.00"
                    />
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger className="w-36 h-16 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.symbol} value={curr.symbol}>
                            <div className="flex items-center gap-2">
                              <img src={curr.iconUrl} alt={curr.symbol} className="w-5 h-5 rounded-full" />
                              {curr.symbol}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    size="icon"
                    variant="default"
                    className="rounded-full bg-primary hover:bg-primary/90 h-12 w-12"
                    onClick={handleSwapCurrencies}
                  >
                    <ArrowUpDown className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-base">To</Label>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={toAmount}
                      onChange={(e) => handleToAmountChange(e.target.value)}
                      className="flex-1 h-16 text-2xl bg-background"
                      placeholder="0.00"
                    />
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="w-36 h-16 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.symbol} value={curr.symbol}>
                            <div className="flex items-center gap-2">
                              <img src={curr.iconUrl} alt={curr.symbol} className="w-5 h-5 rounded-full" />
                              {curr.symbol}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Swap rate:</span>
                    <span className="font-medium flex items-center gap-2">
                      1 {fromCurrency} = {isLoading ? '...' : formatRate(swapRate)} {toCurrency}
                      {!isLoading && percentageDiff > 0 && (
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20">
                          {percentageDiff.toFixed(2)}%
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Market rate:</span>
                    <span className="font-medium">
                      1 {fromCurrency} = {isLoading ? '...' : formatRate(marketRate)} {toCurrency}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <Button className="w-full h-16 text-lg bg-primary hover:bg-primary/90" onClick={() => setLocation("/signin")}>
              Log in/Join us
            </Button>
          </div>

          <div className="mb-12">
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">Why Swap on Pexly</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Easily exchange cryptocurrencies with Pexly Swap in just a few clicks
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-12">
            <Card className="bg-card/80 hover:bg-card transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Lowest fees</h3>
                    <p className="text-muted-foreground">Swap coins at the best available market rates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 hover:bg-card transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
                    <p className="text-muted-foreground">Safe and anonymous exchanges</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <PexlyFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Swap Cryptocurrency</h1>
        <Card className="bg-card/50">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-base">From</Label>
              </div>
              <div className="flex gap-3">
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  className="flex-1 h-16 text-2xl bg-background"
                  placeholder="0.00"
                />
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-36 h-16 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.symbol} value={curr.symbol}>
                        <div className="flex items-center gap-2">
                          <img src={curr.iconUrl} alt={curr.symbol} className="w-5 h-5 rounded-full" />
                          {curr.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                size="icon"
                variant="default"
                className="rounded-full bg-primary hover:bg-primary/90 h-12 w-12"
                onClick={handleSwapCurrencies}
              >
                <ArrowUpDown className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-base">To</Label>
              </div>
              <div className="flex gap-3">
                <Input
                  type="number"
                  value={toAmount}
                  onChange={(e) => handleToAmountChange(e.target.value)}
                  className="flex-1 h-16 text-2xl bg-background"
                  placeholder="0.00"
                />
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-36 h-16 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.symbol} value={curr.symbol}>
                        <div className="flex items-center gap-2">
                          <img src={curr.iconUrl} alt={curr.symbol} className="w-5 h-5 rounded-full" />
                          {curr.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Swap rate:</span>
                <span className="font-medium flex items-center gap-2">
                  1 {fromCurrency} = {isLoading ? '...' : formatRate(swapRate)} {toCurrency}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network Fee (Est.):</span>
                <span className="font-medium text-orange-500">
                  {fromCurrency === 'BTC' ? estFees.BTC : 
                   fromCurrency === 'SOL' ? estFees.SOL : 
                   fromCurrency === 'TRX' ? estFees.TRX : 
                   fromCurrency === 'BNB' ? estFees.BSC : estFees.ETH}
                </span>
              </div>
            </div>

            <Button 
              className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90" 
              onClick={handleSwap}
              disabled={isSwapping || isLoading || parseFloat(fromAmount) <= 0}
            >
              {isSwapping ? <Loader2 className="animate-spin h-6 w-6" /> : "Swap Now"}
            </Button>
          </CardContent>
        </Card>

        {history.length > 0 && (
          <div className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold">Swap History</h2>
            <div className="space-y-4">
              {history.map((order) => (
                <Card key={order.id} className="bg-card/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        <img src={currencies.find(c => c.symbol === order.fromToken)?.iconUrl} className="w-8 h-8 rounded-full border-2 border-background" alt="" />
                        <img src={currencies.find(c => c.symbol === order.toToken)?.iconUrl} className="w-8 h-8 rounded-full border-2 border-background" alt="" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {order.amount} {order.fromToken} → {order.quote.toAmount} {order.toToken}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(order.createdAt)} ago
                        </div>
                      </div>
                    </div>
                    <Badge variant={order.status === 'submitted' ? 'default' : 'secondary'} className="bg-primary/20 text-primary border-none">
                      {order.status === 'submitted' ? 'Waiting on chain' : order.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      <PexlyFooter />
    </div>
  );
}
