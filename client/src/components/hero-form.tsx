import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { currencies } from "@/lib/currencies";

const cryptoCurrencies = [
  { code: "BTC", name: "Bitcoin" },
  { code: "ETH", name: "Ethereum" },
  { code: "USDT", name: "Tether" },
  { code: "USDC", name: "USD Coin" },
];

const popularPaymentMethods = [
  { id: "all", name: "All Payment Methods" },
  { id: "bank-transfer", name: "Bank Transfer" },
  { id: "paypal", name: "PayPal" },
  { id: "apple-pay", name: "Apple Pay" },
  { id: "google-pay", name: "Google Pay" },
  { id: "zelle", name: "Zelle" },
];

const FALLBACK_PRICES: Record<string, number> = {
  BTC: 98750.50, ETH: 3420.75, USDT: 1.00, BNB: 680.25,
  SOL: 245.80, XRP: 2.45, ADA: 1.05, DOGE: 0.38,
  AVAX: 89.50, DOT: 18.75, MATIC: 2.15, SHIB: 0.00003,
  LTC: 165.40, TRX: 0.25, LINK: 28.90,
};

export function HeroForm() {
  const [tradeType, setTradeType] = useState("buy");
  const [crypto, setCrypto] = useState("BTC");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("All Payment Methods");
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [openCurrency, setOpenCurrency] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [openCrypto, setOpenCrypto] = useState(false);

  const hasFetchedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPricesDeferred = useCallback(async () => {
    try {
      const { getCryptoPrices } = await import("@/lib/crypto-prices");
      const symbols = ["BTC","ETH","USDT","BNB","SOL","XRP","ADA","DOGE","AVAX","DOT","MATIC","SHIB","LTC","TRX","LINK"];
      const prices = await getCryptoPrices(symbols);
      const pricesMap: Record<string, number> = {};
      Object.values(prices).forEach((c: any) => { pricesMap[c.symbol] = c.current_price; });
      if (Object.keys(pricesMap).length > 0) setCryptoPrices(pricesMap);
    } catch {
      setCryptoPrices(FALLBACK_PRICES);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => fetchPricesDeferred(), { timeout: 3000 });
    } else {
      setTimeout(fetchPricesDeferred, 100);
    }
    intervalRef.current = setInterval(fetchPricesDeferred, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchPricesDeferred]);

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
    <div className="relative bg-white/95 dark:bg-card/90 backdrop-blur-2xl border border-black/[0.07] dark:border-white/10 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.13)] p-6 sm:p-8 space-y-6 overflow-hidden">

      {/* Top accent line */}
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      {/* Buy / Sell toggle */}
      <div className="flex gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl">
        <button
          onClick={() => setTradeType("buy")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
            tradeType === "buy"
              ? "bg-primary text-black shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Buy Crypto
        </button>
        <button
          onClick={() => setTradeType("sell")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
            tradeType === "sell"
              ? "bg-primary text-black shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sell Crypto
        </button>
      </div>

      {/* Crypto + Currency row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cryptocurrency</label>
          <Popover open={openCrypto} onOpenChange={setOpenCrypto}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCrypto}
                aria-label={`Select cryptocurrency, currently ${cryptoCurrencies.find(c => c.code === crypto)?.name ?? crypto}`}
                className="h-14 w-full justify-between text-base border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.05] rounded-xl font-semibold"
                data-testid="select-crypto"
                type="button"
              >
                <div className="flex items-center gap-2">
                  {crypto && <img src={cryptoIconUrls[crypto]} alt={crypto} className="w-6 h-6 rounded-full" fetchPriority="high" />}
                  <span>{crypto ? cryptoCurrencies.find((c) => c.code === crypto)?.name + ` (${crypto})` : "Select crypto..."}</span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
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
                      onSelect={() => { setCrypto(c.code.toUpperCase()); setOpenCrypto(false); }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", crypto === c.code ? "opacity-100" : "opacity-0")} />
                      <img src={cryptoIconUrls[c.code]} alt={c.name} className="w-5 h-5 mr-2 rounded-full" />
                      {c.name} ({c.code})
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Currency</label>
          <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCurrency}
                aria-label={`Select currency, currently ${currency ? currencies.find(c => c.code === currency)?.name ?? currency : "none"}`}
                className="h-14 w-full justify-between text-base border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.05] rounded-xl font-semibold"
                data-testid="select-currency"
                type="button"
              >
                <span className="text-lg">{currency ? currencies.find((c) => c.code === currency)?.flag + " " + currency : "Select currency..."}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
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
                      onSelect={() => { setCurrency(c.code.toUpperCase()); setOpenCurrency(false); }}
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

      {/* Live price display */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/60 bg-muted/20">
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            {crypto}/{currency} Market Price
          </div>
          {currentPrice > 0 ? (
            <div className="text-lg font-bold tabular-nums text-foreground tracking-tight">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-medium text-muted-foreground ml-1.5">/ 1 {crypto}</span>
            </div>
          ) : (
            <div className="h-6 w-36 bg-muted animate-pulse rounded" />
          )}
        </div>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          {/* Expanding ring 1 */}
          <circle cx="18" cy="18" r="6" stroke="#22c55e" strokeWidth="1.2" opacity="0">
            <animate attributeName="r" values="6;17" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.65;0" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* Expanding ring 2 — offset */}
          <circle cx="18" cy="18" r="6" stroke="#22c55e" strokeWidth="1.2" opacity="0">
            <animate attributeName="r" values="6;17" dur="2s" begin="0.75s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.65;0" dur="2s" begin="0.75s" repeatCount="indefinite" />
          </circle>
          {/* Static mid ring */}
          <circle cx="18" cy="18" r="10" stroke="#22c55e" strokeWidth="0.75" opacity="0.2" />
          {/* Outer glow disc */}
          <circle cx="18" cy="18" r="7" fill="#22c55e" opacity="0.12" />
          {/* Center solid dot */}
          <circle cx="18" cy="18" r="4.5" fill="#22c55e" />
          {/* Inner highlight */}
          <circle cx="16.5" cy="16.5" r="1.5" fill="white" opacity="0.45" />
        </svg>
      </div>

      {/* Payment method */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Payment Method</label>
        <Popover open={openPayment} onOpenChange={setOpenPayment}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openPayment}
              aria-label={`Select payment method, currently ${paymentMethod || "none"}`}
              className="h-14 w-full justify-between text-base border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.05] rounded-xl font-semibold"
              data-testid="select-payment-method"
              type="button"
            >
              {paymentMethod || "Select method..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
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
                    onSelect={() => { setPaymentMethod(p.name); setOpenPayment(false); }}
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

      {/* CTA */}
      <Button
        className="w-full h-16 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
        size="lg"
        onClick={handleFindOffers}
        data-testid="button-find-offers"
      >
        Find offers
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}
