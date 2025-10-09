import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import heroImage from "@assets/generated_images/Crypto_P2P_trading_hero_641f4218.png";
import { currencies, cryptoCurrencies } from "@/lib/currencies";
import { paymentMethods } from "@/lib/payment-methods";

export function HeroSection() {
  const [tradeType, setTradeType] = useState("buy");
  const [crypto, setCrypto] = useState("BTC");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [openCurrency, setOpenCurrency] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openCrypto, setOpenCrypto] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/crypto/prices');
        if (response.ok) {
          const prices = await response.json();
          setCryptoPrices(prices);
        }
      } catch (error) {
        console.error('Failed to fetch crypto prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentPrice = cryptoPrices[crypto] || 0;

  const handleFindOffers = () => {
    console.log("Finding offers:", { tradeType, crypto, currency, paymentMethod });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-20 lg:py-32 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  Trusted by 14M+ users worldwide
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight">
                The people-powered way to move money
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed">
                Trade cryptocurrency with 500+ payment methods across 140 countries. Fast, secure, and reliable P2P marketplace.
              </p>
            </div>

            <div className="bg-card border border-card-border rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">I want to</label>
                  <Select value={tradeType} onValueChange={setTradeType}>
                    <SelectTrigger className="h-12" data-testid="select-trade-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Cryptocurrency</label>
                  <Popover open={openCrypto} onOpenChange={setOpenCrypto}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCrypto}
                        className="h-12 w-full justify-between"
                        data-testid="select-crypto"
                      >
                        {crypto ? cryptoCurrencies.find((c) => c.code === crypto)?.name + ` (${crypto})` : "Select crypto..."}
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
                              onSelect={(currentValue) => {
                                setCrypto(currentValue.toUpperCase());
                                setOpenCrypto(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  crypto === c.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.name} ({c.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-center border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Current Market Price</div>
                <div className="text-2xl font-bold tabular-nums text-foreground">
                  1 {crypto} ≈ ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Currency</label>
                  <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCurrency}
                        className="h-12 w-full justify-between"
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
                              onSelect={(currentValue) => {
                                setCurrency(currentValue.toUpperCase());
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

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Payment Method</label>
                  <Popover open={openPayment} onOpenChange={setOpenPayment}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPayment}
                        className="h-12 w-full justify-between"
                        data-testid="select-payment-method"
                      >
                        {paymentMethod ? paymentMethods.find((p) => p.id === paymentMethod)?.name : "Select method..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0">
                      <Command>
                        <CommandInput placeholder="Search payment method..." />
                        <CommandEmpty>No payment method found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {paymentMethods.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.id}
                              onSelect={(currentValue) => {
                                setPaymentMethod(currentValue);
                                setOpenPayment(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  paymentMethod === p.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.name}
                              {p.category !== "All" && (
                                <span className="ml-auto text-xs text-muted-foreground">{p.category}</span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button 
                className="w-full h-14 text-lg font-semibold shadow-lg" 
                size="lg"
                onClick={handleFindOffers}
                data-testid="button-find-offers"
              >
                Find offers
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="relative lg:block hidden">
            <img
              src={heroImage}
              alt="Cryptocurrency P2P Trading"
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}