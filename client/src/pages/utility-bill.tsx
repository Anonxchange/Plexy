import { useState, useMemo } from "react";
import { ChevronDown, ArrowRight, Search, Zap, Bot, Check, Receipt, Filter, Lock } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  useUtilityCountries,
  useUtilityBillers,
  payUtilityBill,
  SERVICE_TYPES,
  Biller,
} from "@/hooks/use-utility-billers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sanitizeImageUrl } from "@/lib/sanitize";
import { devLog } from "@/lib/dev-logger";
import NowPaymentsCheckout from "@/components/nowpayments-checkout";
import { usePayPal } from "@/hooks/usePaypal";

const FALLBACK_COUNTRIES = [
  { isoName: "NG", name: "Nigeria" },
  { isoName: "KE", name: "Kenya" },
  { isoName: "GH", name: "Ghana" },
  { isoName: "ZA", name: "South Africa" },
  { isoName: "GB", name: "United Kingdom" },
  { isoName: "US", name: "United States" },
  { isoName: "IN", name: "India" },
  { isoName: "BR", name: "Brazil" },
  { isoName: "MX", name: "Mexico" },
  { isoName: "PH", name: "Philippines" },
];

const ProviderCard = ({
  name,
  logo,
  priceRange,
  onClick,
}: {
  name: string;
  logo?: string;
  priceRange: string;
  onClick?: () => void;
}) => {
  const safeLogo = sanitizeImageUrl(logo);
  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="relative bg-card rounded-3xl aspect-[4/3] flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg overflow-hidden border border-border p-4">
        {safeLogo ? (
          <img
            src={safeLogo}
            alt={name}
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
            }}
          />
        ) : null}
        <div className={`w-full h-full items-center justify-center ${safeLogo ? "hidden" : "flex"}`}>
          <Zap className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-3 px-1">
        <h3 className="font-semibold text-foreground truncate text-sm">{name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{priceRange}</p>
      </div>
    </div>
  );
};

const UtilityBill = () => {
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<Biller | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [view, setView] = useState<"countries" | "providers" | "pay">("countries");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: countriesData, isLoading: isLoadingCountries } = useUtilityCountries();
  const { data: billersData, isLoading: isLoadingBillers } = useUtilityBillers(
    selectedCountry || undefined,
    selectedService || undefined
  );
  const { createAndCaptureOrder, loading: paypalLoading } = usePayPal();

  const countries = useMemo(() => {
    if (countriesData && Array.isArray(countriesData) && countriesData.length > 0) {
      return countriesData.map((c: any) => ({ isoName: c.isoName, name: c.name }));
    }
    return FALLBACK_COUNTRIES;
  }, [countriesData]);

  const currentCountry = useMemo(
    () => countries.find((c) => c.isoName === selectedCountry),
    [countries, selectedCountry]
  );

  const filteredCountries = useMemo(
    () =>
      countries.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.isoName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [countries, searchQuery]
  );

  const providers = billersData?.content || [];
  const filteredProviders = useMemo(
    () => providers.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [providers, searchQuery]
  );

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSearchQuery("");
    setView("providers");
  };

  const handleProviderClick = (provider: Biller) => {
    setSelectedProvider(provider);
    setSearchQuery("");
    setView("pay");
    setAmount("");
  };

  const handlePayment = async () => {
    if (!amount || !accountNumber || !selectedProvider) {
      toast.error("Please enter both account number and amount");
      return;
    }
    setIsSubmitting(true);
    try {
      await payUtilityBill({
        subscriberAccountNumber: accountNumber,
        amount: Number(amount),
        billerId: selectedProvider.id,
        billerName: selectedProvider.name,
        countryCode: selectedProvider.countryCode,
      });
      toast.success("Utility bill payment processed successfully!");
      setView("providers");
      setAmount("");
      setAccountNumber("");
    } catch (error: any) {
      toast.error(error.message || "Failed to process utility payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <section className="relative bg-primary pt-8 pb-16 px-4">
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-2xl" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground leading-tight mb-3">
            Pay Utility Bills with Crypto
          </h1>
          <p className="text-primary-foreground/70 text-base mb-6">
            Pay electricity, water, TV, and more in 100+ countries using Bitcoin, USDT, and more.
          </p>
        </div>

        {/* Floating account input */}
        <div className="absolute left-4 right-4 -bottom-6 z-20">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
              <button
                className="flex items-center gap-2 px-4 py-4 border-r border-border text-foreground font-semibold text-sm shrink-0 hover:bg-muted transition-colors"
                onClick={() => { setSelectedCountry(""); setView("countries"); }}
              >
                {selectedCountry ? (
                  <>
                    <img
                      src={`https://flagcdn.com/w40/${selectedCountry.toLowerCase()}.png`}
                      alt=""
                      className="w-5 h-3.5 object-cover rounded-sm"
                    />
                    <span>{selectedCountry}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Country</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account or Meter Number"
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base py-4 px-4 min-w-0"
              />
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-4 font-bold text-sm shrink-0 transition-all active:scale-95"
                onClick={() => { if (selectedCountry) setView("providers"); else setView("countries"); }}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="pt-16 pb-10 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Countries view */}
          {view === "countries" && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-foreground">Select Country</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search countries..."
                    className="pl-10 h-11 rounded-2xl bg-card border-border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {isLoadingCountries ? (
                  Array(18).fill(0).map((_, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-border bg-card space-y-2">
                      <Skeleton className="h-5 w-9 rounded" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-5 h-3.5 rounded-sm" />
                        <Skeleton className="h-3 w-16 rounded" />
                      </div>
                    </div>
                  ))
                ) : filteredCountries.map((c) => (
                  <button
                    key={c.isoName}
                    onClick={() => handleCountrySelect(c.isoName)}
                    className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      selectedCountry === c.isoName
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <img
                        src={`https://flagcdn.com/w40/${c.isoName.toLowerCase()}.png`}
                        alt=""
                        className="w-6 h-4 object-cover rounded-sm shadow-sm"
                        loading="lazy"
                      />
                      <span className="font-bold text-sm text-foreground">{c.isoName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate block">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Providers view */}
          {view === "providers" && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setSelectedCountry(""); setSelectedProvider(null); setSearchQuery(""); setView("countries"); }}
                    className="rounded-full hover:bg-muted shrink-0"
                  >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </Button>
                  <h2 className="text-xl font-bold text-foreground">
                    Providers in {currentCountry?.name || "Selected Country"}
                  </h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-2xl bg-card border-border">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Service Type" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search providers..."
                      className="pl-10 h-11 rounded-2xl bg-card border-border"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                {isLoadingBillers ? (
                  Array(8).fill(0).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  ))
                ) : filteredProviders.length > 0 ? (
                  filteredProviders.map((provider, index) => (
                    <div key={provider.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.04}s` }}>
                      <ProviderCard
                        name={provider.name}
                        priceRange={
                          provider.denominationType === "FIXED"
                            ? `${provider.fixedAmounts?.[0] || "Fixed"} ${provider.localTransactionCurrencyCode}`
                            : `${provider.minLocalTransactionAmount ?? 0} – ${provider.maxLocalTransactionAmount ?? "Any"} ${provider.localTransactionCurrencyCode}`
                        }
                        onClick={() => handleProviderClick(provider)}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
                    <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground font-medium">No providers found for the selected criteria</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pay view */}
          {view === "pay" && selectedProvider && (
            <div className="animate-fade-in max-w-2xl mx-auto space-y-4">

              {/* Back */}
              <Button
                variant="ghost"
                onClick={() => setView("providers")}
                className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to providers
              </Button>

              {/* Provider header */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center p-2.5 border border-border shrink-0">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate">{selectedProvider.name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {currentCountry?.name} · {selectedProvider.serviceType.replace(/_/g, " ")} · {selectedProvider.localTransactionCurrencyCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account number */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">Account Information</h3>
                </div>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account or meter number"
                  className="h-14 text-lg px-5 bg-background border-border focus-visible:ring-primary rounded-2xl"
                />
              </div>

              {/* Amount */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">
                    Payment Amount
                    <span className="ml-1.5 text-muted-foreground font-normal text-sm">({selectedProvider.localTransactionCurrencyCode})</span>
                  </h3>
                </div>

                {selectedProvider.denominationType !== "FIXED" && (
                  <>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-14 text-lg px-5 bg-background border-border focus-visible:ring-primary rounded-2xl mb-2"
                    />
                    {(selectedProvider.minLocalTransactionAmount || selectedProvider.maxLocalTransactionAmount) && (
                      <p className="text-xs text-muted-foreground px-1 mb-4">
                        Range: {selectedProvider.localTransactionCurrencyCode} {selectedProvider.minLocalTransactionAmount ?? 0} – {selectedProvider.maxLocalTransactionAmount ?? "Any"}
                      </p>
                    )}
                  </>
                )}

                {selectedProvider.fixedAmounts && selectedProvider.fixedAmounts.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5">
                    {selectedProvider.fixedAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAmount(amt.toString())}
                        className={`py-3 px-2 rounded-2xl border transition-all flex flex-col items-center justify-center gap-0.5 ${
                          amount === amt.toString()
                            ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/30"
                            : "border-border bg-background hover:border-primary/50 text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-base font-bold">
                          {selectedProvider.localTransactionCurrencyCode} {amt}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment tabs */}
              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="px-6 pt-6 pb-2">
                  <h3 className="font-bold text-foreground">Pay With</h3>
                </div>
                <Tabs defaultValue="crypto" className="w-full">
                  <TabsList className="w-full h-auto p-0 bg-transparent border-b border-border rounded-none grid grid-cols-4">
                    <TabsTrigger value="crypto" className="flex flex-col gap-1.5 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <div className="flex gap-1">
                        <img src={cryptoIconUrls.BTC} className="h-4 w-4 rounded-full" alt="BTC" />
                        <img src={cryptoIconUrls.ETH} className="h-4 w-4 rounded-full" alt="ETH" />
                        <img src={cryptoIconUrls.USDT} className="h-4 w-4 rounded-full" alt="USDT" />
                      </div>
                      <span className="text-[11px] font-bold">Crypto</span>
                    </TabsTrigger>
                    <TabsTrigger value="paypal" className="flex flex-col gap-1.5 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="Paypal" />
                      <span className="text-[11px] font-bold">PayPal</span>
                    </TabsTrigger>
                    <TabsTrigger value="card" className="flex flex-col gap-1.5 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <div className="flex gap-1">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="Mastercard" />
                      </div>
                      <span className="text-[11px] font-bold">Card</span>
                    </TabsTrigger>
                    <TabsTrigger value="oxxo" className="flex flex-col gap-1.5 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/66/Oxxo_Logo.svg" className="h-4" alt="OXXO" />
                      <span className="text-[11px] font-bold">OXXO</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="crypto" className="p-6 focus-visible:outline-none focus-visible:ring-0">
                    <NowPaymentsCheckout
                      amount={Number(amount) || 0}
                      currency={selectedProvider.localTransactionCurrencyCode?.toLowerCase() || "usd"}
                      description={`Utility bill — ${selectedProvider.name}`}
                      metadata={{
                        service: "utility-bill",
                        billerId: selectedProvider.id,
                        accountNumber,
                        countryCode: selectedProvider.countryCode,
                      }}
                      onPaymentSuccess={async () => {
                        devLog.info("Utility bill payment successful");
                        await handlePayment();
                      }}
                      onPaymentClose={() => devLog.info("Utility bill payment cancelled")}
                    />
                  </TabsContent>

                  <TabsContent value="paypal" className="p-6 text-center space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <p className="text-sm text-muted-foreground">You will be redirected to PayPal to complete your payment securely.</p>
                    <Button
                      className="w-full h-12 bg-[#0070BA] text-white hover:bg-[#005ea6] font-bold rounded-2xl gap-2"
                      disabled={paypalLoading || isSubmitting}
                      onClick={async () => {
                        await createAndCaptureOrder(Number(amount) || 0);
                        await handlePayment();
                      }}
                    >
                      {paypalLoading || isSubmitting ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
                      ) : (
                        <><img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="" />Continue to PayPal</>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="card" className="p-6 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground">Card Number</label>
                        <Input placeholder="1234 5678 9012 3456" className="h-12 bg-background border-border rounded-2xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-foreground">Expiry</label>
                          <Input placeholder="MM / YY" className="h-12 bg-background border-border rounded-2xl" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-foreground">CVV</label>
                          <Input placeholder="•••" className="h-12 bg-background border-border rounded-2xl" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground">Postal Code</label>
                        <Input placeholder="Postal Code" className="h-12 bg-background border-border rounded-2xl" />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Checkbox id="save-card-utility" />
                        <label htmlFor="save-card-utility" className="text-sm text-foreground">Save this payment method</label>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground py-1">
                      <Lock className="h-3.5 w-3.5" />
                      <span className="text-xs">256-bit encrypted payment</span>
                    </div>
                    <Button
                      className="w-full h-12 bg-[#FFC107] text-black hover:bg-[#FFB300] font-bold rounded-2xl gap-2"
                      onClick={handlePayment}
                      disabled={isSubmitting}
                    >
                      <Lock className="h-4 w-4" />
                      {isSubmitting ? "Processing..." : "Place Secure Order"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="oxxo" className="p-6 text-center space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <p className="text-sm text-muted-foreground">Generate an OXXO voucher to pay in cash at any store.</p>
                    <Button className="w-full h-12 bg-[#E20613] text-white hover:bg-[#c90511] font-bold rounded-2xl">
                      Generate OXXO Voucher
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>

            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-14 px-4 md:px-6 lg:px-8 bg-muted/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">How utility payments work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "1",
                title: "Select provider & enter details",
                desc: "Choose your utility provider and enter your account or meter number.",
              },
              {
                icon: "2",
                title: "Pay with crypto",
                desc: "Send the required amount using Bitcoin, USDT, or any supported cryptocurrency.",
              },
              {
                icon: "3",
                title: "Instant confirmation",
                desc: "Your bill is paid instantly once the transaction is confirmed on-chain.",
              },
            ].map((step) => (
              <div key={step.icon} className="bg-card border border-border rounded-3xl p-6 text-center">
                <div className="w-10 h-10 bg-primary/10 text-primary font-bold text-lg rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
};

export default UtilityBill;
