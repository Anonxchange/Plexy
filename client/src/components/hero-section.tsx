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

        const pricesMap: Record<string, number> = {};
        Object.values(prices).forEach((crypto) => {
          pricesMap[crypto.symbol] = crypto.current_price;
        });

        if (Object.keys(pricesMap).length > 0) {
          setCryptoPrices(pricesMap);
        }
      } catch (error) {
        console.error("Failed to fetch crypto prices:", error);
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
    const interval = setInterval(fetchPrices, 30000);

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
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

      {/* Animated Globe Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <ErrorBoundary fallback={<div className="w-[800px] h-[800px] rounded-full bg-primary/5" />}>
          <Globe className="w-[800px] h-[800px]" />
        </ErrorBoundary>
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container relative z-10 px-4 py-8 md:py-12">
        {/* Mobile & Tablet - Original Centered Layout */}
        <div className="lg:hidden flex flex-col items-center">
          <div className="text-center mb-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-foreground">Trusted by 14M+ users worldwide</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
              Trade crypto
              <span className="block text-primary">your way</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
              Connect with traders worldwide. 500+ payment methods. Zero hassle.
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center min-w-[80px]">
                <p className="text-2xl font-bold text-foreground">140+</p>
                <p className="text-sm text-muted-foreground">Countries</p>
              </div>
              <div className="text-center min-w-[80px]">
                <p className="text-2xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Payment methods</p>
              </div>
              <div className="text-center min-w-[80px]">
                <p className="text-2xl font-bold text-foreground">14M+</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </div>
            </div>
          </div>

          {/* Trade Form Card */}
          <div className="w-full max-w-md">
            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl">
              {/* Trade Type Tabs */}
              <div className="flex bg-muted/50 rounded-lg p-1 mb-6">
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

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cryptocurrency</label>
                  <Popover open={openCrypto} onOpenChange={setOpenCrypto}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openCrypto} className="w-full justify-between bg-background/50 border-border/50">
                        <span className="flex items-center gap-2">
                          {crypto && <img src={cryptoIconUrls[crypto]} alt={crypto} className="w-5 h-5" />}
                          {crypto ? cryptoCurrencies.find((c) => c.code === crypto)?.name + ` (${crypto})` : "Select crypto..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover border border-border z-50">
                      <Command>
                        <CommandInput placeholder="Search crypto..." />
                        <CommandEmpty>No crypto found.</CommandEmpty>
                        <CommandGroup>
                          {cryptoCurrencies.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={c.code}
                              onSelect={() => {
                                setCrypto(c.code.toUpperCase());
                                setOpenCrypto(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", crypto === c.code ? "opacity-100" : "opacity-0")} />
                              <img src={cryptoIconUrls[c.code]} alt={c.code} className="w-5 h-5 mr-2" />
                              {c.name} ({c.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Currency</label>
                  <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openCurrency} className="w-full justify-between bg-background/50 border-border/50">
                        {currency ? currencies.find((c) => c.code === currency)?.flag + " " + currency : "Select currency..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover border border-border z-50">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {currencies.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={c.code}
                              onSelect={() => {
                                setCurrency(c.code.toUpperCase());
                                setOpenCurrency(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", currency === c.code ? "opacity-100" : "opacity-0")} />
                              {c.flag} {c.name} ({c.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-foreground">Payment Method</label>
                <Popover open={openPayment} onOpenChange={setOpenPayment}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={openPayment} className="w-full justify-between bg-background/50 border-border/50">
                      {paymentMethod || "Select method..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-popover border border-border z-50">
                    <Command>
                      <CommandInput placeholder="Search payment method..." />
                      <CommandEmpty>No payment method found.</CommandEmpty>
                      <CommandGroup>
                        {popularPaymentMethods.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.name}
                            onSelect={() => {
                              setPaymentMethod(p.name);
                              setOpenPayment(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", paymentMethod === p.name ? "opacity-100" : "opacity-0")} />
                            {p.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* CTA Button */}
              <Button onClick={handleFindOffers} className="w-full h-12 text-base font-semibold" size="lg">
                Find offers
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop - Two Column Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-foreground">Trusted by 14M+ users worldwide</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl xl:text-6xl font-bold text-foreground mb-6 leading-tight">
              Trade crypto
              <span className="block text-primary">your way</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground max-w-lg mb-8">
              Connect with traders worldwide. 500+ payment methods. Zero hassle.
            </p>

            {/* Stats */}
            <div className="flex gap-8">
              <div className="text-left min-w-[100px]">
                <p className="text-3xl font-bold text-foreground">140+</p>
                <p className="text-sm text-muted-foreground">Countries</p>
              </div>
              <div className="text-left min-w-[100px]">
                <p className="text-3xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Payment methods</p>
              </div>
              <div className="text-left min-w-[100px]">
                <p className="text-3xl font-bold text-foreground">14M+</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </div>
            </div>
          </div>

          {/* Trade Form Card */}
          <div className="w-full max-w-md ml-auto">
            <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl">
              {/* Trade Type Tabs */}
              <div className="flex bg-muted/50 rounded-lg p-1 mb-6">
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

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cryptocurrency</label>
                  <Popover open={openCryptoDesktop} onOpenChange={setOpenCryptoDesktop}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openCryptoDesktop} className="w-full justify-between bg-background/50 border-border/50">
                        <span className="flex items-center gap-2">
                          {crypto && <img src={cryptoIconUrls[crypto]} alt={crypto} className="w-5 h-5" />}
                          {crypto ? cryptoCurrencies.find((c) => c.code === crypto)?.name + ` (${crypto})` : "Select crypto..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover border border-border z-50">
                      <Command>
                        <CommandInput placeholder="Search crypto..." />
                        <CommandEmpty>No crypto found.</CommandEmpty>
                        <CommandGroup>
                          {cryptoCurrencies.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={c.code}
                              onSelect={() => {
                                setCrypto(c.code.toUpperCase());
                                setOpenCryptoDesktop(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", crypto === c.code ? "opacity-100" : "opacity-0")} />
                              <img src={cryptoIconUrls[c.code]} alt={c.code} className="w-5 h-5 mr-2" />
                              {c.name} ({c.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Currency</label>
                  <Popover open={openCurrencyDesktop} onOpenChange={setOpenCurrencyDesktop}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openCurrencyDesktop} className="w-full justify-between bg-background/50 border-border/50">
                        {currency ? currencies.find((c) => c.code === currency)?.flag + " " + currency : "Select currency..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover border border-border z-50">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {currencies.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={c.code}
                              onSelect={() => {
                                setCurrency(c.code.toUpperCase());
                                setOpenCurrencyDesktop(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", currency === c.code ? "opacity-100" : "opacity-0")} />
                              {c.flag} {c.name} ({c.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Price Display - FIXED: Single instance with skeleton loading */}
              <div className="pt-2 border-t border-border/50 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Current Market Price</p>
                <p className="text-lg font-semibold text-foreground">
                  {currentPrice > 0 ? (
                    `1 ${crypto} ≈ $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ) : (
                    <span className="flex items-center gap-1">
                      1 {crypto} ≈ 
                      <span className="inline-block w-24 h-5 bg-muted animate-pulse rounded" />
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-foreground">Payment Method</label>
                <Popover open={openPaymentDesktop} onOpenChange={setOpenPaymentDesktop}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={openPaymentDesktop} className="w-full justify-between bg-background/50 border-border/50">
                      {paymentMethod || "Select method..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-popover border border-border z-50">
                    <Command>
                      <CommandInput placeholder="Search payment method..." />
                      <CommandEmpty>No payment method found.</CommandEmpty>
                      <CommandGroup>
                        {popularPaymentMethods.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.name}
                            onSelect={() => {
                              setPaymentMethod(p.name);
                              setOpenPaymentDesktop(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", paymentMethod === p.name ? "opacity-100" : "opacity-0")} />
                            {p.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* CTA Button */}
              <Button onClick={handleFindOffers} className="w-full h-12 text-base font-semibold" size="lg">
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
