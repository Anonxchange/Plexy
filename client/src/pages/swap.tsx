
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowUpDown, FileText, TrendingDown, Shield, Gift, BookOpen, Headphones, ChevronRight } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useSwapFee } from "@/hooks/use-fees";

const currencies = [
  { symbol: "BTC", name: "Bitcoin", iconUrl: cryptoIconUrls.BTC },
  { symbol: "USDT", name: "Tether", iconUrl: cryptoIconUrls.USDT },
  { symbol: "ETH", name: "Ethereum", iconUrl: cryptoIconUrls.ETH },
  { symbol: "USDC", name: "USD Coin", iconUrl: cryptoIconUrls.USDC },
];

export function Swap() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [fromAmount, setFromAmount] = useState("0.00001");
  const [toAmount, setToAmount] = useState("1.222411");
  const [fromCurrency, setFromCurrency] = useState("BTC");
  const [toCurrency, setToCurrency] = useState("USDT");

  // Fetch swap fee
  const { data: swapFee } = useSwapFee(
    fromCurrency,
    toCurrency,
    parseFloat(fromAmount) || 0
  );

  const handleSwapCurrencies = () => {
    const tempCurrency = fromCurrency;
    const tempAmount = fromAmount;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const swapRate = "122,470.25";
  const marketRate = "122,470.25";
  const percentageDiff = "0.19%";

  // Show landing page for non-logged-in users
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 px-4 py-8">
          {/* Swap Interface at the top */}
          <div className="mb-8">
            <Card className="bg-card/50">
              <CardContent className="p-6 space-y-6">
                {/* From Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-base">From</Label>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="flex-1 h-16 text-2xl bg-background"
                    />
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger className="w-36 h-16 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.symbol} value={curr.symbol}>
                            <div className="flex items-center gap-2">
                              <img 
                                src={curr.iconUrl} 
                                alt={curr.symbol}
                                className="w-5 h-5 rounded-full"
                              />
                              {curr.symbol}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Swap Direction Button */}
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

                {/* To Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-base">To</Label>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={toAmount}
                      onChange={(e) => setToAmount(e.target.value)}
                      className="flex-1 h-16 text-2xl bg-background"
                    />
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="w-36 h-16 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.symbol} value={curr.symbol}>
                            <div className="flex items-center gap-2">
                              <img 
                                src={curr.iconUrl} 
                                alt={curr.symbol}
                                className="w-5 h-5 rounded-full"
                              />
                              {curr.symbol}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rate Info */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Swap rate:</span>
                    <span className="font-medium">
                      1 {fromCurrency} = {swapRate} {toCurrency}{" "}
                      <Badge variant="secondary" className="ml-2">
                        {percentageDiff}
                      </Badge>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Market rate:</span>
                    <span className="font-medium">
                      1 {fromCurrency} = {marketRate} {toCurrency}
                    </span>
                  </div>
                  {swapFee && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Swap fee:</span>
                        <span className="font-medium">
                          {swapFee.feePercentage ? `${swapFee.feePercentage}%` : `$${swapFee.totalFee.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">You will receive:</span>
                        <span className="font-semibold text-primary">
                          {(parseFloat(toAmount) - swapFee.totalFee).toFixed(6)} {toCurrency}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Log in/Join us CTA */}
          <div className="mb-8">
            <Button 
              className="w-full h-16 text-lg bg-primary hover:bg-primary/90"
              onClick={() => setLocation("/signin")}
            >
              Log in/Join us
            </Button>
          </div>

          {/* Hero Section */}
          <div className="mb-12">
            <div className="text-center space-y-6">
              <div className="flex justify-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-yellow-600 flex items-center justify-center shadow-lg transform rotate-12">
                  <img src={cryptoIconUrls.ETH} alt="ETH" className="w-12 h-12" />
                </div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-lg transform -rotate-6">
                  <img src={cryptoIconUrls.USDT} alt="USDT" className="w-12 h-12" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Why Swap on Pexly
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Easily exchange cryptocurrencies with Pexly Swap in just a few clicks
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4 mb-12">
            <Card className="bg-card/80 hover:bg-card transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Lowest fees</h3>
                    <p className="text-muted-foreground">
                      Swap coins at the best available market rates
                    </p>
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
                    <h3 className="text-xl font-semibold mb-2">Monero supported</h3>
                    <p className="text-muted-foreground">
                      Buy and sell XMR for USDT anonymously
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 hover:bg-card transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Gift className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Earn on swaps</h3>
                    <p className="text-muted-foreground">
                      Earn from SOL, TON, and BTC price movements
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits of Swap Section */}
          <div className="mt-12 space-y-8">
            <h2 className="text-3xl font-bold">Benefits of Swap</h2>

            {/* First Benefits Image */}
            <div className="flex justify-center">
              <img 
                src="/assets/IMG_1827.jpeg"
                alt="Benefits of Swap on Pexly"
                className="max-w-md w-full object-contain"
              />
            </div>

            {/* Why Use Swap */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Why Use Swap?</h3>
              <ul className="space-y-3">
                <li>
                  <span className="font-semibold">Instant Exchange:</span> Swap cryptocurrencies instantly without waiting for order matching.
                </li>
                <li>
                  <span className="font-semibold">Best Rates:</span> Access competitive market rates from multiple liquidity providers.
                </li>
                <li>
                  <span className="font-semibold">Simple Interface:</span> Easy-to-use swap interface - just select, enter amount, and exchange.
                </li>
              </ul>
            </div>

            </div>

          {/* Video Card */}
          <Card className="mb-12 mt-12 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 overflow-hidden">
            <CardContent className="p-0 relative h-80">
              <div className="absolute inset-0 flex items-center justify-center">
                <Button className="gap-2 h-14 px-6 text-lg font-semibold bg-primary/90 hover:bg-primary">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Watch video
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How to Swap Guide */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">
              How to Swap on Pexly
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Follow these simple steps to seamlessly exchange your cryptocurrencies
            </p>

            <div className="space-y-8">
              {/* Step 1 */}
              <Card className="bg-card/60">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      1
                    </div>
                    <h3 className="text-2xl font-semibold">Select Your Cryptocurrencies</h3>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-border mb-4">
                    <img 
                      src="/assets/IMG_1832.jpeg" 
                      alt="Select cryptocurrencies to swap"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Choose the cryptocurrency you want to swap from and the one you want to receive. Our swap interface supports multiple popular cryptocurrencies including BTC, ETH, USDT, USDC, and more. Simply select from the dropdown menus to get started with your exchange.
                  </p>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="bg-card/60">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      2
                    </div>
                    <h3 className="text-2xl font-semibold">Enter Swap Amount</h3>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-border mb-4">
                    <img 
                      src="/assets/IMG_1828.jpeg" 
                      alt="Enter amount to swap"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Enter the amount you wish to swap in the "From" field. The platform will automatically calculate and display the amount you'll receive in the "To" field based on the current market rate. Review the swap rate and market rate to ensure you're getting the best value for your exchange.
                  </p>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="bg-card/60">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      3
                    </div>
                    <h3 className="text-2xl font-semibold">Review Swap Rate and Fees</h3>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-border mb-4">
                    <img 
                      src="/assets/IMG_1830.jpeg" 
                      alt="Review swap rates and fees"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Before confirming your swap, carefully review the exchange rate, any applicable fees, and the final amount you'll receive. Pexly displays transparent pricing with competitive rates from multiple liquidity providers to ensure you always get the best deal.
                  </p>
                </CardContent>
              </Card>

              {/* Step 4 */}
              <Card className="bg-card/60">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      4
                    </div>
                    <h3 className="text-2xl font-semibold">Complete Your Swap Transaction</h3>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-border mb-4">
                    <img 
                      src="/assets/IMG_1831.jpeg" 
                      alt="Complete swap transaction"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Once you're satisfied with the swap details, click the swap button to execute your transaction. Your cryptocurrency will be instantly exchanged and deposited into your wallet. Track the status of your swap in real-time and view completed swaps in your transaction history.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">
              Frequently asked questions
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Find answers to the most popular questions asked by our users
            </p>
            
            <Accordion type="single" collapsible className="space-y-3">
              <AccordionItem value="item-1" className="bg-card/60 rounded-lg px-6 border-0">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg">Are there any fees for swapping on Pexly?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Pexly charges competitive fees for swaps. The exact fee depends on the trading pair and market conditions, but we always show you the total cost upfront before you confirm your swap.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-card/60 rounded-lg px-6 border-0">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg">My swap failed. What should I do next?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  If your swap fails, your funds will be automatically returned to your wallet. Check your transaction history and contact our support team if you don't see your funds within 24 hours.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-card/60 rounded-lg px-6 border-0">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg">My swap failed, and my funds are either reserved or missing. What should I do?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Don't worry - your funds are safe. Reserved funds typically get released within 1-2 hours. If they're still reserved after 24 hours, please contact our 24/7 support team with your transaction ID.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-card/60 rounded-lg px-6 border-0">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg">What are the minimum swap amounts for cryptocurrencies?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  Minimum swap amounts vary by cryptocurrency. Generally: BTC: 0.0001, ETH: 0.001, USDT: 10, USDC: 10. Check the swap interface for specific minimums for each pair.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Support Cards */}
          <div className="space-y-4 mb-12">
            <Card className="bg-card/80 hover:bg-card transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">Pexly academy</h3>
                      <p className="text-sm text-muted-foreground">
                        Join millions of traders and learn by trading P2P
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 hover:bg-card transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Headphones className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">24/7 support</h3>
                      <p className="text-sm text-muted-foreground">
                        Reach out to us for answers to your specific questions
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <PexlyFooter />
      </div>
    );
  }

  // Logged-in user view with swap interface
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Layout */}
      <div className="flex-1 px-4 py-8 lg:hidden">
        {/* Swap Interface */}
        <Card className="bg-card/50 mb-8">
          <CardContent className="p-6 space-y-6">
            {/* From Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-base">From</Label>
                <span className="text-sm text-muted-foreground">
                  Available: {fromCurrency === "BTC" ? "0.0000001" : "0.001259"} {fromCurrency}
                </span>
              </div>
              <div className="flex gap-3">
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="flex-1 h-16 text-2xl bg-background"
                />
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-36 h-16 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.symbol} value={curr.symbol}>
                        <div className="flex items-center gap-2">
                          <img 
                            src={curr.iconUrl} 
                            alt={curr.symbol}
                            className="w-5 h-5 rounded-full"
                          />
                          {curr.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Swap Direction Button */}
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

            {/* To Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-base">To</Label>
                <span className="text-sm text-muted-foreground">
                  Available: {toCurrency === "USDT" ? "0.001259" : "0.0000001"} {toCurrency}
                </span>
              </div>
              <div className="flex gap-3">
                <Input
                  type="number"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  className="flex-1 h-16 text-2xl bg-background"
                />
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-36 h-16 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.symbol} value={curr.symbol}>
                        <div className="flex items-center gap-2">
                          <img 
                            src={curr.iconUrl} 
                            alt={curr.symbol}
                            className="w-5 h-5 rounded-full"
                          />
                          {curr.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rate Info */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Swap rate:</span>
                <span className="font-medium">
                  1 {fromCurrency} = {swapRate} {toCurrency}{" "}
                  <Badge variant="secondary" className="ml-2">
                    {percentageDiff}
                  </Badge>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Market rate:</span>
                <span className="font-medium">
                  1 {fromCurrency} = {marketRate} {toCurrency}
                </span>
              </div>
              {swapFee && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Swap fee:</span>
                    <span className="font-medium">
                      {swapFee.feePercentage ? `${swapFee.feePercentage}%` : `$${swapFee.totalFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">You will receive:</span>
                    <span className="font-semibold text-primary">
                      {(parseFloat(toAmount) - swapFee.totalFee).toFixed(6)} {toCurrency}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Swap Button */}
        <Button className="w-full h-14 text-lg bg-primary hover:bg-primary/90 mb-8">
          <ArrowUpDown className="mr-2 h-5 w-5" />
          Swap
        </Button>

        {/* Recent Activity */}
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent activity</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-lg bg-muted p-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-2 text-muted-foreground">Nothing to show yet</h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                You haven't made any swaps yet. Once you do, your swap history will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Layout - Centered with max-width */}
      <div className="hidden lg:block flex-1">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">Swap Cryptocurrency</h1>
            <p className="text-lg text-muted-foreground">
              Exchange your crypto instantly at competitive rates
            </p>
          </div>

          {/* Swap Interface Card */}
          <Card className="bg-card/50 mb-8 shadow-lg">
            <CardContent className="p-8 space-y-6">
              {/* From Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-base">From</Label>
                  <span className="text-sm text-muted-foreground">
                    Available: {fromCurrency === "BTC" ? "0.0000001" : "0.001259"} {fromCurrency}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="flex-1 h-16 text-2xl bg-background"
                  />
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger className="w-40 h-16 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.symbol} value={curr.symbol}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={curr.iconUrl} 
                              alt={curr.symbol}
                              className="w-5 h-5 rounded-full"
                            />
                            {curr.symbol}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Swap Direction Button */}
              <div className="flex justify-center py-2">
                <Button
                  size="icon"
                  variant="default"
                  className="rounded-full bg-primary hover:bg-primary/90 h-14 w-14"
                  onClick={handleSwapCurrencies}
                >
                  <ArrowUpDown className="h-6 w-6" />
                </Button>
              </div>

              {/* To Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-base">To</Label>
                  <span className="text-sm text-muted-foreground">
                    Available: {toCurrency === "USDT" ? "0.001259" : "0.0000001"} {toCurrency}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    className="flex-1 h-16 text-2xl bg-background"
                  />
                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger className="w-40 h-16 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.symbol} value={curr.symbol}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={curr.iconUrl} 
                              alt={curr.symbol}
                              className="w-5 h-5 rounded-full"
                            />
                            {curr.symbol}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rate Info */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Swap rate:</span>
                  <span className="font-medium">
                    1 {fromCurrency} = {swapRate} {toCurrency}{" "}
                    <Badge variant="secondary" className="ml-2">
                      {percentageDiff}
                    </Badge>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Market rate:</span>
                  <span className="font-medium">
                    1 {fromCurrency} = {marketRate} {toCurrency}
                  </span>
                </div>
                {swapFee && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Swap fee:</span>
                      <span className="font-medium">
                        {swapFee.feePercentage ? `${swapFee.feePercentage}%` : `$${swapFee.totalFee.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">You will receive:</span>
                      <span className="font-semibold text-primary">
                        {(parseFloat(toAmount) - swapFee.totalFee).toFixed(6)} {toCurrency}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Swap Button */}
              <Button className="w-full h-14 text-lg bg-primary hover:bg-primary/90 mt-6">
                <ArrowUpDown className="mr-2 h-5 w-5" />
                Swap Now
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card className="bg-card/50 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Recent Activity</h3>
              </div>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-lg bg-muted p-4">
                  <FileText className="h-14 w-14 text-muted-foreground" />
                </div>
                <h4 className="text-xl font-medium mb-2 text-muted-foreground">Nothing to show yet</h4>
                <p className="text-base text-muted-foreground max-w-md">
                  You haven't made any swaps yet. Once you do, your swap history will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <PexlyFooter />
    </div>
  );
}
