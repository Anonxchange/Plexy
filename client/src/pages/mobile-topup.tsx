import { useState, useMemo } from "react";
import { ChevronDown, ArrowRight, Search, Clock, Wallet, Bot, Smartphone, Check } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useAirtime } from "@/hooks/user-airtime";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Provider Card Component
interface ProviderCardProps {
  name: string;
  logo?: string;
  priceRange: string;
  bgColor?: string;
  badge?: string;
  onClick?: () => void;
}

const ProviderCard = ({ name, logo, priceRange, bgColor = "bg-card", badge, onClick }: ProviderCardProps) => (
  <div className="group cursor-pointer" onClick={onClick}>
    <div className={`relative ${bgColor} rounded-xl aspect-[4/3] flex items-center justify-center shadow-card group-hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-1 overflow-hidden border border-border p-4`}>
      {badge && (
        <span className="absolute top-2 left-2 bg-success text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <span>💰</span> {badge}
        </span>
      )}
      {logo ? (
        <img src={logo} alt={name} className="w-full h-full object-contain" />
      ) : (
        <Smartphone className="w-12 h-12 text-muted-foreground" />
      )}
    </div>
    <div className="mt-3">
      <h3 className="font-semibold text-foreground truncate">{name}</h3>
      <p className="text-sm text-muted-foreground">{priceRange}</p>
    </div>
  </div>
);

const Index = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [amount, setAmount] = useState<string>("");
  const [view, setView] = useState<"countries" | "operators" | "topup">("countries");
  const [searchQuery, setSearchQuery] = useState("");

  const { countries, isLoadingCountries, operators, isLoadingOperators, processTopup } = useAirtime(selectedCountry);

  const filteredCountries = useMemo(() => {
    return countries.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.countryCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [countries, searchQuery]);

  const filteredOperators = useMemo(() => {
    return operators?.filter((op: any) => 
      op.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [operators, searchQuery]);

  const currentCountry = useMemo(() => 
    countries.find(c => c.countryCode === selectedCountry), 
    [countries, selectedCountry]
  );

  const suggestedAmounts = useMemo(() => {
    if (!selectedOperator) return [];
    const min = selectedOperator.minAmount || 2;
    const max = selectedOperator.maxAmount || 120;
    const step = 5;
    const amounts = [];
    for (let i = Math.ceil(min / 5) * 5; i <= Math.min(max, 120); i += step) {
      if (i >= min) amounts.push(i);
      if (amounts.length >= 24) break;
    }
    return [2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120].filter(a => a >= min && a <= max);
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
    setAmount(""); // Reset amount when operator changes
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
        operatorName: selectedOperator.name
      });

      if (result.success) {
        toast.success("Top-up processed successfully!");
        setView("operators");
        setAmount("");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process top-up");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-[#d9f99d] text-primary-foreground pt-12 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-8 animate-fade-in text-gray-900">
            Top up prepaid mobile phones with Bitcoin and other cryptocurrencies from anywhere in the world
          </h1>
        </div>

        {/* Floating phone input */}
        <div className="absolute left-4 right-4 -bottom-7 z-10">
          <div className="max-w-sm md:max-w-lg mx-auto">
            <div className="flex items-center bg-card rounded-lg shadow-lg overflow-hidden animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="relative">
                <button 
                  className="appearance-none bg-white px-3 py-3 md:px-6 md:py-4 border-r border-gray-200 text-gray-900 font-medium cursor-pointer outline-none min-w-[80px] flex items-center gap-2"
                  onClick={() => setView("countries")}
                >
                  {selectedCountry}
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone number"
                className="flex-1 !bg-white border-none outline-none !text-gray-900 placeholder:!text-gray-500 text-base md:text-lg py-3 md:py-5 px-3 md:px-6 min-w-0"
              />
              <button className="bg-red-500 hover:bg-red-600 border-2 border-red-600 text-white p-3.5 md:p-5 transition-all hover:brightness-110 active:scale-95">
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="pt-14 pb-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {view === "countries" && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Select Country</h2>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search countries..." 
                    className="pl-10 h-12 rounded-2xl bg-card border-border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredCountries.map((c) => (
                  <button
                    key={c.countryCode}
                    onClick={() => handleCountrySelect(c.countryCode)}
                    className={`p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      selectedCountry === c.countryCode 
                        ? "border-primary bg-white ring-2 ring-primary/20" 
                        : "border-border bg-white hover:border-primary/50"
                    }`}
                  >
                    <span className="font-bold block text-xl mb-1">{c.countryCode}</span>
                    <span className="text-sm text-muted-foreground truncate block font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "operators" && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => setView("countries")} className="p-2 h-auto rounded-full hover:bg-muted">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </Button>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    {isLoadingCountries ? <Skeleton className="h-8 w-64" /> : `Operators in ${currentCountry?.name || 'Selected Country'}`}
                  </h2>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search operators..." 
                    className="pl-10 h-12 rounded-2xl bg-card border-border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
                {isLoadingOperators ? (
                  Array(8).fill(0).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  ))
                ) : (
                  filteredOperators?.map((operator: any, index: number) => (
                    <div key={operator.operatorId} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                      <ProviderCard 
                        name={operator.name}
                        logo={operator.logoUrls?.[0]}
                        priceRange={`${operator.minAmount || '50'} - ${operator.maxAmount || '50000'} ${operator.senderCurrencyCode}`}
                        onClick={() => handleProviderClick(operator)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {view === "topup" && selectedOperator && (
            <div className="animate-fade-in max-w-2xl mx-auto space-y-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setView("operators")} className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back
                </Button>
              </div>

              {/* Operator Header Card */}
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 border border-border shadow-sm">
                    {selectedOperator.logoUrls?.[0] ? (
                      <img src={selectedOperator.logoUrls[0]} alt={selectedOperator.name} className="w-full h-full object-contain" />
                    ) : (
                      <Smartphone className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground leading-tight">{selectedOperator.name}</h2>
                    <p className="text-muted-foreground text-lg">{currentCountry?.name} • {selectedOperator.senderCurrencyCode}</p>
                    <div className="mt-3">
                      <span className="bg-[#ff4d4d] text-white text-sm font-bold px-4 py-1.5 rounded-full">
                        4.0% discount
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Phone Card */}
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Smartphone className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Recipient Phone</h3>
                </div>
                <div className="space-y-3">
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="text-xl py-7 px-6 bg-background border-border focus-visible:ring-primary rounded-2xl"
                  />
                  <p className="text-sm text-muted-foreground px-1">
                    Enter number without country code prefix
                  </p>
                </div>
              </div>

              {/* Select Amount Card */}
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Bot className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Select Amount ({selectedOperator.senderCurrencyCode})</h3>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-base text-muted-foreground px-1">
                      Range: {selectedOperator.senderCurrencyCode} {selectedOperator.minAmount} - {selectedOperator.maxAmount}
                    </p>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={selectedOperator.minAmount}
                      max={selectedOperator.maxAmount}
                      className="text-xl py-7 px-6 bg-background border-border focus-visible:ring-primary rounded-2xl"
                    />
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {suggestedAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAmount(amt.toString())}
                        className={`py-4 px-2 rounded-2xl border text-base font-bold transition-all shadow-sm ${
                          amount === amt.toString()
                            ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20"
                            : "border-border bg-card hover:border-primary/50 text-foreground hover:bg-muted/50"
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>

                  <Button 
                    className="w-full py-8 text-xl font-bold bg-[#555a64] hover:bg-[#444952] text-white flex items-center justify-center gap-3 rounded-2xl shadow-lg mt-4 transition-transform active:scale-[0.98]" 
                    onClick={handleTopup}
                    disabled={processTopup.isPending}
                  >
                    <Check className="w-6 h-6" />
                    {processTopup.isPending ? "Processing..." : "Send Top-up"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 md:px-6 lg:px-8 bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">How refills work</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="animate-fade-in">
              <div className="bg-muted rounded-xl p-6 flex items-center justify-center gap-3">
                <div className="bg-card rounded-md px-4 py-2 text-lg font-mono text-foreground shadow-sm">{phoneNumber || "0802..."}</div>
                <button className="bg-cta text-cta-foreground p-2 rounded-lg">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-foreground">Enter a phone number & amount</h3>
                <p className="text-muted-foreground mt-1">Type in the phone number and the amount you want us to refill.</p>
              </div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <div className="bg-muted rounded-xl p-6 flex items-center justify-center gap-6">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-border shadow-sm">
                  <img src={cryptoIconUrls.BTC} alt="Bitcoin" className="w-8 h-8" />
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-border shadow-sm">
                  <img src={cryptoIconUrls.USDT} alt="Tether" className="w-8 h-8" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-foreground">Pay with any payment method</h3>
                <p className="text-muted-foreground mt-1">Your payment is confirmed the same minute in most cases.</p>
              </div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 flex items-center justify-center border border-green-200">
                <div className="relative">
                  <div className="w-16 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-300 shadow-lg flex items-center justify-center">
                    <span className="text-2xl">🎫</span>
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-foreground">That's it, here is your refill</h3>
                <p className="text-muted-foreground mt-1">Once your payment is confirmed you will get your refill sent out.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
};

export default Index;
