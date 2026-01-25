import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import heroImage from "@assets/generated_images/Crypto_P2P_trading_hero_641f4218.png";
import { cryptoIconUrls } from "@/lib/crypto-icons";

import { currencies } from "@/lib/currencies";
const cryptoCurrencies = [
  { code: "BTC", name: "Bitcoin" },
  { code: "ETH", name: "Ethereum" },
  { code: "USDT", name: "Tether" },
  { code: "USDC", name: "USD Coin" },
];
import { paymentMethods } from "@/lib/payment-methods";

const popularPaymentMethods = [
  { id: "all", name: "All Payment Methods" },
  { id: "bank-transfer", name: "Bank Transfer" },
  { id: "paypal", name: "PayPal" },
  { id: "apple-pay", name: "Apple Pay" },
  { id: "google-pay", name: "Google Pay" },
  { id: "zelle", name: "Zelle" },
];
import { Globe } from "@/components/globe";
import { getCryptoPrices } from "@/lib/crypto-prices";

// Simple ErrorBoundary for the Globe component
class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function HeroSection() {
  const [tradeType, setTradeType] = useState("buy");
  const [crypto, setCrypto] = useState("BTC");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("All Payment Methods");
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [openCurrency, setOpenCurrency] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openCrypto, setOpenCrypto] = useState(false);

  const [openCurrencyDesktop, setOpenCurrencyDesktop] = useState(false);
  const [openPaymentDesktop, setOpenPaymentDesktop] = useState(false);
  const [openCryptoDesktop, setOpenCryptoDesktop] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const symbols = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC', 'SHIB', 'LTC', 'TRX', 'LINK'];
        const prices = await getCryptoPrices(symbols);

        // Convert to the format needed for display
        const pricesMap: Record<string, number> = {};
        Object.values(prices).forEach((crypto) => {
          pricesMap[crypto.symbol] = crypto.current_price;
        });

        if (Object.keys(pricesMap).length > 0) {
          setCryptoPrices(pricesMap);
        }
      } catch (error) {
        console.error("Failed to fetch crypto prices:", error);
        // Fallback to mock prices on error
        const mockPrices = {
          BTC: 98750.50,
          ETH: 3420.75,
          USDT: 1.00,
          BNB: 680.25,
          SOL: 245.80,
          XRP: 2.45,
          ADA: 1.05,
          DOGE: 0.38,
          AVAX: 89.50,
          DOT: 18.75,
          MATIC: 2.15,
          SHIB: 0.00003,
          LTC: 165.40,
          TRX: 0.25,
          LINK: 28.90
        };
        setCryptoPrices(mockPrices);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const currentPrice = cryptoPrices[crypto] || 0;

  const [, setLocation] = useLocation();

  const handleFindOffers = () => {
    const params = new URLSearchParams();
    params.set("tab", tradeType);
    params.set("crypto", crypto);
    params.set("currency", currency);
    params.set("payment", paymentMethod);
    
    window.location.href = `/p2p?${params.toString()}`;
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background min-h-[85vh] flex items-center">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Animated Globe Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-15 pointer-events-none">
        <ErrorBoundary fallback={<div className="w-full h-full bg-primary/5 rounded-full blur-3xl" />}>
          <Globe />
        </ErrorBoundary>
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 relative z-10 w-full">
        {/* Mobile & Tablet - Original Centered Layout */}
        <div className="lg:hidden">
          <div className="text-center space-y-6 max-w-4xl mx-auto mb-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-xl shadow-lg">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-semibold">Trusted by 14M+ users worldwide</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tight">
              <span className="block text-foreground">Trade crypto</span>
              <span className="block bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                your way
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with traders worldwide. 500+ payment methods. Zero hassle.
            </p>

            {/* Stats - Fixed dimensions to prevent layout shift */}
            <div className="flex flex-wrap justify-center gap-8 pt-4 h-[80px]">
              <div className="text-center w-[100px]">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">140+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div className="text-center w-[160px]">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Payment methods</div>
              </div>
              <div className="text-center w-[100px]">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">14M+</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
            </div>
          </div>

          {/* Trade Form Card */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
              {/* Trade Type Tabs */}
              <div className="flex gap-2 p-1 bg-muted rounded-xl">
                <button
                  onClick={() => setTradeType("buy")}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    tradeType === "buy"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buy Crypto
                </button>
                <button
                  onClick={() => setTradeType("sell")}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    tradeType === "sell"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sell Crypto
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Cryptocurrency</label>
                  <Popover open={openCrypto} onOpenChange={setOpenCrypto}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCrypto}
                        className="h-14 w-full justify-between text-base"
                        data-testid="select-crypto"
                      >
                        <div className="flex items-center">
                          {crypto && <img src={cryptoIconUrls[crypto]} alt={crypto} className="w-5 h-5 mr-2" />}
                          {crypto ? cryptoCurrencies.find((c) => c.code === crypto)?.name + ` (${crypto})` : "Select crypto..."}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0">
                      <Command>
                        <CommandInput placeholder="Search crypto..." />
                        <CommandEmpty>No crypto found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {cryptoCurrencies.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={c.code}
                              onSelect={() => {
                                setCrypto(c.code.toUpperCase());
                                setOpenCrypto(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  crypto === c.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <img src={cryptoIconUrls[c.code]} alt={c.name} className="w-5 h-5 mr-2" />
                              {c.name} ({c.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Currency</label>
                  <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCurrency}
                        className="h-14 w-full justify-between text-base"
                        data-testid="select-currency"
                      >
                        {currency ? currencies.find((c) => c.code === currency)?.flag + " " + currency : "Select currency..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {currencies.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={c.code}
                              onSelect={() => {
                                setCurrency(c.code.toUpperCase());
                                setOpenCurrency(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  currency === c.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.flag} {c.name} ({c.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Price Display for Mobile */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">Current Market Price</div>
                <div className="text-2xl font-bold tabular-nums text-foreground">
                  {currentPrice > 0 ? (
                    `1 ${crypto} ≈ $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>1 {crypto} ≈ </span>
                      <div className="h-8 w-32 bg-primary/20 animate-pulse rounded" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Payment Method</label>
                <Popover open={openPayment} onOpenChange={setOpenPayment}>
                  <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPayment}
                        className="h-14 w-full justify-between text-base"
                        data-testid="select-payment-method"
                      >
                        {paymentMethod || "Select method..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                  </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0">
                      <Command>
                        <CommandInput placeholder="Search payment method..." />
                        <CommandEmpty>No payment method found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {popularPaymentMethods.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.id}
                              onSelect={() => {
                                setPaymentMethod(p.name);
                                setOpenPayment(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  paymentMethod === p.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>

              {/* CTA Button */}
              <Button 
                className="w-full h-16 text-lg font-bold shadow-xl hover:shadow-2xl transition-all" 
                size="lg"
                onClick={handleFindOffers}
                data-testid="button-find-offers"
              >
                Find offers
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop - Two Column Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-xl shadow-lg">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-semibold">Trusted by 14M+ users worldwide</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl xl:text-7xl 2xl:text-8xl font-bold leading-[1.05] tracking-tight">
              <span className="block text-foreground">Trade crypto</span>
              <span className="block bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                your way
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl xl:text-2xl text-muted-foreground max-w-xl">
              Connect with traders worldwide. 500+ payment methods. Zero hassle.
            </p>

            {/* Stats - Fixed dimensions for stability */}
            <div className="flex gap-12 pt-4 h-[90px]">
              <div className="w-[120px]">
                <div className="text-4xl xl:text-5xl font-bold text-foreground">140+</div>
                <div className="text-sm text-muted-foreground mt-1">Countries</div>
              </div>
              <div className="w-[180px]">
                <div className="text-4xl xl:text-5xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground mt-1">Payment methods</div>
              </div>
              <div className="w-[120px]">
                <div className="text-4xl xl:text-5xl font-bold text-foreground">14M+</div>
                <div className="text-sm text-muted-foreground mt-1">Users</div>
              </div>
            </div>
          </div>

          {/* Trade Form Card */}
          <div>
            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-8 space-y-6">
              {/* Trade Type Tabs */}
              <div className="flex gap-2 p-1 bg-muted rounded-xl">
                <button
                  onClick={() => setTradeType("buy")}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    tradeType === "buy"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buy Crypto
                </button>
                <button
                  onClick={() => setTradeType("sell")}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    tradeType === "sell"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sell Crypto
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Cryptocurrency</label>
                  <Popover open={openCryptoDesktop} onOpenChange={setOpenCryptoDesktop}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCryptoDesktop}
                        className="h-14 w-full justify-between text-base"
                        data-testid="select-crypto-desktop"
                        type="button"
                      >
                        <div className="flex items-center">
                          {crypto && <img src={cryptoIconUrls[crypto]} alt={crypto} className="w-5 h-5 mr-2" />}
                          {crypto ? cryptoCurrencies.find((c) => c.code === crypto)?.name + ` (${crypto})` : "Select crypto..."}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0">
                      <Command>
                        <CommandInput placeholder="Search crypto..." />
                        <CommandEmpty>No crypto found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {cryptoCurrencies.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={c.code}
                              onSelect={() => {
                                setCrypto(c.code.toUpperCase());
                                setOpenCryptoDesktop(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  crypto === c.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <img src={cryptoIconUrls[c.code]} alt={c.name} className="w-5 h-5 mr-2" />
                              {c.name} ({c.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Currency</label>
                  <Popover open={openCurrencyDesktop} onOpenChange={setOpenCurrencyDesktop}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCurrencyDesktop}
                        className="h-14 w-full justify-between text-base"
                        data-testid="select-currency-desktop"
                        type="button"
                      >
                        {currency ? currencies.find((c) => c.code === currency)?.flag + " " + currency : "Select currency..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {currencies.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={c.code}
                              onSelect={() => {
                                setCurrency(c.code.toUpperCase());
                                setOpenCurrencyDesktop(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  currency === c.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.flag} {c.name} ({c.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Price Display */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">Current Market Price</div>
                <div className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                  {currentPrice > 0 ? (
                    `1 ${crypto} ≈ $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>1 {crypto} ≈ </span>
                      <div className="h-8 w-32 bg-primary/20 animate-pulse rounded" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Payment Method</label>
                <Popover open={openPaymentDesktop} onOpenChange={setOpenPaymentDesktop}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPaymentDesktop}
                      className="h-14 w-full justify-between text-base"
                      data-testid="select-payment-method-desktop"
                      type="button"
                    >
                      {paymentMethod || "Select method..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0">
                      <Command>
                        <CommandInput placeholder="Search payment method..." />
                        <CommandEmpty>No payment method found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {popularPaymentMethods.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.id}
                              onSelect={() => {
                                setPaymentMethod(p.name);
                                setOpenPaymentDesktop(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  paymentMethod === p.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>

              {/* CTA Button */}
              <Button 
                className="w-full h-16 text-lg font-bold shadow-xl hover:shadow-2xl transition-all" 
                size="lg"
                onClick={handleFindOffers}
                data-testid="button-find-offers"
              >
                Find offers
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
