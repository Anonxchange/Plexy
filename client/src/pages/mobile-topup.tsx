import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronDown, ArrowRight, Search, Bot, Smartphone } from '@/lib/icons';
import { PexlyFooter } from "@/components/pexly-footer";
import { useAirtime } from "@/hooks/user-airtime";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sanitizeImageUrl } from "@/lib/sanitize";
import { devLog } from "@/lib/dev-logger";
import { useProxiedImage } from "@/lib/image-proxy";

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
  const proxiedLogo = useProxiedImage(safeLogo);
  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative bg-card rounded-3xl aspect-[4/3] flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg overflow-hidden border border-border p-4">
        {proxiedLogo ? (
          <img
            src={proxiedLogo}
            alt={name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
            }}
          />
        ) : null}
        <div className={`w-full h-full items-center justify-center ${safeLogo ? "hidden" : "flex"}`}>
          <Smartphone className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-3 px-1">
        <h3 className="font-semibold text-foreground truncate text-sm">{name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{priceRange}</p>
      </div>
    </div>
  );
};

const Index = () => {
  const [, setLocation] = useLocation();
  useEffect(() => { localStorage.removeItem("pexly_pending_order"); }, []);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [amount, setAmount] = useState<string>("");
  const [view, setView] = useState<"countries" | "operators" | "topup">("countries");
  const [searchQuery, setSearchQuery] = useState("");

  const { countries: countriesQuery, operators: operatorsQuery, processTopup } = useAirtime(selectedCountry);
  const countries = countriesQuery.data || [];
  const isLoadingCountries = countriesQuery.isLoading;
  const operators = operatorsQuery.data || [];
  const isLoadingOperators = operatorsQuery.isLoading;

  const filteredCountries = useMemo(() =>
    countries.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c as any).isoName?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [countries, searchQuery]);

  const filteredOperators = useMemo(() =>
    operators?.filter((op: any) =>
      op.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [operators, searchQuery]);

  const currentCountry = useMemo(() =>
    countries.find(c => (c as any).isoName === selectedCountry),
    [countries, selectedCountry]);

  const proxiedOperatorLogo = useProxiedImage(
    sanitizeImageUrl(selectedOperator?.logoUrls?.[0])
  );

  const suggestedAmounts = useMemo(() => {
    if (!selectedOperator) return [];
    if ((selectedOperator.bundle || selectedOperator.data) && selectedOperator.fixedAmountsDescriptions) {
      return Object.entries(selectedOperator.fixedAmountsDescriptions).map(([amt, description]) => ({
        amount: Number(amt),
        description: String(description),
      }));
    }
    const min = selectedOperator.minAmount || 2;
    const max = selectedOperator.maxAmount || 120;
    const fixed = selectedOperator.fixedAmounts || [];
    if (fixed.length > 0) return fixed.map((f: any) => ({ amount: Number(f), description: null }));
    return [2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120]
      .filter(a => a >= min && a <= max)
      .map(a => ({ amount: a, description: null }));
  }, [selectedOperator]);

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSearchQuery("");
    setView("operators");
  };

  const handleProviderClick = (operator: any) => {
    setSelectedOperator(operator);
    setSearchQuery("");
    setView("topup");
    setAmount("");
  };

  const handleTopup = async () => {
    if (!amount || !phoneNumber) {
      toast.error("Please enter both phone number and amount");
      return;
    }
    try {
      const result = await processTopup.mutateAsync({
        operatorId: selectedOperator.operatorId,
        amount: Number(amount),
        recipientPhone: phoneNumber,
        recipientCountryCode: selectedCountry,
        operatorName: selectedOperator.name,
      });
      if (result.success) {
        // Save to My Orders history
        try {
          const saved = JSON.parse(localStorage.getItem("pexly_digital_orders") || "[]");
          saved.unshift({
            id: `topup_${Date.now()}`,
            type: "topup",
            title: `${selectedOperator.name} Top-up`,
            amount: Number(amount),
            currency: "USD",
            phone: phoneNumber,
            paypalOrderId: "",
            placedAt: new Date().toISOString(),
            status: "fulfilled",
          });
          localStorage.setItem("pexly_digital_orders", JSON.stringify(saved.slice(0, 100)));
        } catch {}
        toast.success("Top-up processed successfully!");
        setView("operators");
        setAmount("");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process top-up");
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
            Mobile Top-Up with Crypto
          </h1>
          <p className="text-primary-foreground/70 text-base mb-6">
            Refill any prepaid phone in 140+ countries using Bitcoin, USDT, and more.
          </p>
        </div>

        {/* Floating phone input */}
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
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base py-4 px-4 min-w-0"
              />
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-4 font-bold text-sm shrink-0 transition-all active:scale-95"
                onClick={() => { if (selectedCountry) setView("operators"); else setView("countries"); }}
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
                    key={(c as any).isoName}
                    onClick={() => handleCountrySelect((c as any).isoName)}
                    className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      selectedCountry === (c as any).isoName
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <img
                        src={`https://flagcdn.com/w40/${(c as any).isoName.toLowerCase()}.png`}
                        alt=""
                        className="w-6 h-4 object-cover rounded-sm shadow-sm"
                        loading="lazy"
                      />
                      <span className="font-bold text-sm text-foreground">{(c as any).isoName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate block">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Operators view */}
          {view === "operators" && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setSelectedCountry(""); setSelectedOperator(null); setSearchQuery(""); setView("countries"); }}
                    className="rounded-full hover:bg-muted shrink-0"
                  >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </Button>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {isLoadingCountries
                        ? <Skeleton className="h-7 w-52" />
                        : `Operators in ${currentCountry?.name || "Selected Country"}`}
                    </h2>
                  </div>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search operators..."
                    className="pl-10 h-11 rounded-2xl bg-card border-border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                {isLoadingOperators ? (
                  Array(8).fill(0).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  ))
                ) : filteredOperators?.map((operator: any, index: number) => (
                  <div key={operator.operatorId} className="animate-fade-in" style={{ animationDelay: `${index * 0.04}s` }}>
                    <ProviderCard
                      name={operator.name}
                      logo={operator.logoUrls?.[0]}
                      priceRange={
                        operator.denominationType === "FIXED" && operator.fixedAmounts?.length
                          ? `${Math.min(...operator.fixedAmounts)} – ${Math.max(...operator.fixedAmounts)} ${operator.senderCurrencyCode}`
                          : `${operator.minAmount ?? "?"} – ${operator.maxAmount ?? "?"} ${operator.senderCurrencyCode}`
                      }
                      onClick={() => handleProviderClick(operator)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topup view */}
          {view === "topup" && selectedOperator && (
            <div className="animate-fade-in max-w-2xl mx-auto space-y-4">

              {/* Back */}
              <Button
                variant="ghost"
                onClick={() => setView("operators")}
                className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to operators
              </Button>

              {/* Operator header */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center p-2.5 border border-border shrink-0">
                    {proxiedOperatorLogo ? (
                      <img
                        src={proxiedOperatorLogo}
                        alt={selectedOperator.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                          (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full items-center justify-center ${selectedOperator.logoUrls?.[0] ? "hidden" : "flex"}`}>
                      <Smartphone className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate">{selectedOperator.name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {currentCountry?.name} · {selectedOperator.senderCurrencyCode}
                    </p>
                    <span className="inline-block mt-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                      4% discount
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipient phone */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">Recipient Phone</h3>
                </div>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="h-14 text-lg px-5 bg-background border-border focus-visible:ring-primary rounded-2xl"
                />
                <p className="text-xs text-muted-foreground mt-2 px-1">Enter number without country code prefix</p>
              </div>

              {/* Amount */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">
                    Select Amount
                    <span className="ml-1.5 text-muted-foreground font-normal text-sm">({selectedOperator.senderCurrencyCode})</span>
                  </h3>
                </div>

                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={selectedOperator.minAmount}
                  max={selectedOperator.maxAmount}
                  className="h-14 text-lg px-5 bg-background border-border focus-visible:ring-primary rounded-2xl mb-2"
                />
                {(selectedOperator.minAmount || selectedOperator.maxAmount) && (
                  <p className="text-xs text-muted-foreground px-1 mb-4">
                    Range: {selectedOperator.senderCurrencyCode} {selectedOperator.minAmount} – {selectedOperator.maxAmount}
                  </p>
                )}

                {suggestedAmounts.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5">
                    {suggestedAmounts.map((item: any) => (
                      <button
                        key={item.amount}
                        onClick={() => setAmount(item.amount.toString())}
                        className={`py-3 px-2 rounded-2xl border transition-all flex flex-col items-center justify-center gap-0.5 ${
                          amount === item.amount.toString()
                            ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/30"
                            : "border-border bg-background hover:border-primary/50 text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-base font-bold">
                          {selectedOperator.senderCurrencySymbol || "$"}{item.amount}
                        </span>
                        {item.description && (
                          <span className={`text-[10px] line-clamp-2 text-center font-medium ${
                            amount === item.amount.toString() ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}>
                            {item.description}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Proceed to Checkout */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <Button
                  className="w-full h-13 text-base font-bold rounded-2xl gap-2"
                  disabled={!amount || !phoneNumber}
                  onClick={() => {
                    if (!amount || !phoneNumber) {
                      toast.error("Please enter both phone number and amount");
                      return;
                    }
                    localStorage.setItem("pexly_pending_order", JSON.stringify({
                      type: "topup",
                      title: `${selectedOperator.name} Top-Up`,
                      description: `Mobile top-up — ${selectedOperator.name}`,
                      amount: Number(amount),
                      currency: selectedOperator.senderCurrencyCode?.toLowerCase() || "usd",
                      metadata: {
                        service: "mobile-topup",
                        operatorId: selectedOperator.operatorId,
                        recipientPhone: phoneNumber,
                        recipientCountryCode: selectedCountry,
                        operatorName: selectedOperator.name,
                      },
                    }));
                    devLog.info("Redirecting to checkout for topup");
                    const seg = window.location.pathname.split("/")[1];
                    const langBase = seg && seg.length === 2 ? `/${seg}` : "/en";
                    window.open(`${langBase}/checkout`, "_blank");
                  }}
                >
                  Proceed to Checkout →
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-14 px-4 md:px-6 lg:px-8 bg-muted/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">How refills work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "1",
                title: "Enter phone & amount",
                desc: "Type in the phone number and the amount you want us to refill.",
              },
              {
                icon: "2",
                title: "Pay with crypto",
                desc: "Pay with Bitcoin, USDT, or any supported cryptocurrency.",
              },
              {
                icon: "3",
                title: "Instant delivery",
                desc: "Your refill is sent out the moment your payment is confirmed.",
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

export default Index;
