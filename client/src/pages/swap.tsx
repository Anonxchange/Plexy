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
      const result = await executeSwap({
        userId: user!.id,
        fromCrypto: fromCurrency,
        toCrypto: toCurrency,
        fromAmount: fromAmountNum,
        toAmount: toAmountNum,
        swapRate,
        marketRate,
        fee: feeAmount,
        userPassword: password
      });

      toast({
        title: "Swap Successful!",
        description: `Swapped ${fromAmountNum} ${fromCurrency} to ${result.to_amount.toFixed(6)} ${toCurrency}`,
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
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Swap rate</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold whitespace-nowrap">1 {fromCurrency} = {isLoading ? '...' : formatRate(swapRate)} {toCurrency}</span>
                      {!isLoading && percentageDiff > 0 && (
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 px-1 py-0 h-4 text-[10px]">
                          {percentageDiff.toFixed(2)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground block">Market rate</span>
                    <span className="text-xs font-bold block">1 {fromCurrency} = {isLoading ? '...' : formatRate(marketRate)} {toCurrency}</span>
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
