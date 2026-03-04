import { useState, useMemo } from "react";
import { ChevronDown, ArrowRight, Search, Zap, Wallet, Bot, Lightbulb, Check, Receipt, Filter } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUtilityBillers, payUtilityBill, SERVICE_TYPES, Biller } from "@/hooks/use-utility-billers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Provider Card Component
interface ProviderCardProps {
  name: string;
  logo?: string;
  priceRange: string;
  bgColor?: string;
  badge?: string;
  onClick?: () => void;
}

const ProviderCard = ({ name, logo, priceRange, bgColor = "bg-white", badge, onClick }: ProviderCardProps) => (
  <div className="group cursor-pointer" onClick={onClick}>
    <div className={`relative ${bgColor} rounded-xl aspect-[4/3] flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 overflow-hidden border border-border p-4`}>
      {badge && (
        <span className="absolute top-2 left-2 bg-success text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <span>💰</span> {badge}
        </span>
      )}
      {logo ? (
        <img src={logo} alt={name} className="w-full h-full object-contain" />
      ) : (
        <Zap className="w-12 h-12 text-muted-foreground" />
      )}
    </div>
    <div className="mt-3">
      <h3 className="font-semibold text-foreground truncate">{name}</h3>
      <p className="text-sm text-muted-foreground">{priceRange}</p>
    </div>
  </div>
);

const UtilityBill = () => {
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<Biller | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [view, setView] = useState<"countries" | "providers" | "pay">("countries");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: billersData, isLoading: isLoadingBillers } = useUtilityBillers(
    selectedCountry || undefined,
    selectedService || undefined
  );

  const countries = [
    { name: "Nigeria", isoName: "NG" },
    { name: "Kenya", isoName: "KE" },
    { name: "Ghana", isoName: "GH" },
    { name: "South Africa", isoName: "ZA" },
    { name: "United Kingdom", isoName: "GB" },
    { name: "United States", isoName: "US" },
  ];

  const filteredCountries = useMemo(() => {
    return countries.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.isoName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const providers = billersData?.content || [];

  const filteredProviders = useMemo(() => {
    return providers.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [providers, searchQuery]);

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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground pt-12 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-8 animate-fade-in text-primary-foreground">
            Pay your utility bills with Bitcoin and other cryptocurrencies securely and instantly
          </h1>
        </div>

        {/* Floating input */}
        <div className="absolute left-4 right-4 -bottom-7 z-10">
          <div className="max-w-sm md:max-w-lg mx-auto">
            <div className="flex items-center bg-card rounded-lg shadow-lg overflow-hidden animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="relative">
                <button 
                  className="appearance-none bg-white px-3 py-3 md:px-6 md:py-4 border-r border-gray-200 text-gray-900 font-medium cursor-pointer outline-none min-w-[80px] flex items-center gap-2"
                  onClick={() => {
                    setSelectedCountry("");
                    setView("countries");
                  }}
                >
                  {selectedCountry || "Select"}
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account or Meter Number"
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
                    className="pl-10 h-12 rounded-2xl bg-white border-border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredCountries.map((c) => (
                  <button
                    key={c.isoName}
                    onClick={() => handleCountrySelect(c.isoName)}
                    className={`p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      selectedCountry === c.isoName 
                        ? "border-primary bg-white ring-2 ring-primary/20" 
                        : "border-border bg-white hover:border-primary/50"
                    }`}
                  >
                    <span className="font-bold block text-xl mb-1">{c.isoName}</span>
                    <div className="flex items-center gap-2">
                      <img 
                        src={`https://flagcdn.com/w40/${c.isoName.toLowerCase()}.png`} 
                        alt="" 
                        className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                        loading="lazy"
                      />
                      <span className="text-sm text-muted-foreground truncate block font-medium">{c.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "providers" && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => setView("countries")} className="p-2 h-auto rounded-full hover:bg-muted">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </Button>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    Utility Providers
                  </h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-2xl bg-card border-border">
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
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search providers..." 
                      className="pl-10 h-12 rounded-2xl bg-card border-border"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {isLoadingBillers ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredProviders.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
                  {filteredProviders.map((provider, index) => (
                    <div key={provider.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                      <ProviderCard 
                        name={provider.name}
                        priceRange={
                          provider.denominationType === "FIXED" 
                            ? `${provider.fixedAmounts?.[0] || 'Fixed'} ${provider.localTransactionCurrencyCode}`
                            : `${provider.minLocalTransactionAmount || '0'} - ${provider.maxLocalTransactionAmount || 'Any'} ${provider.localTransactionCurrencyCode}`
                        }
                        onClick={() => handleProviderClick(provider)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
                  <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground font-medium">No providers found for the selected criteria</p>
                </div>
              )}
            </div>
          )}

          {view === "pay" && selectedProvider && (
            <div className="animate-fade-in max-w-2xl mx-auto space-y-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setView("providers")} className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back
                </Button>
              </div>

              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 border border-border shadow-sm">
                    <Zap className="w-10 h-10 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground leading-tight">{selectedProvider.name}</h2>
                    <p className="text-muted-foreground text-lg">{selectedProvider.serviceType.replace(/_/g, ' ')} • {selectedProvider.localTransactionCurrencyCode}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Receipt className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Account Information</h3>
                </div>
                <div className="space-y-3">
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account or meter number"
                    className="text-xl py-7 px-6 bg-background border-border focus-visible:ring-primary rounded-2xl"
                  />
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Bot className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-bold text-foreground">Payment Amount ({selectedProvider.localTransactionCurrencyCode})</h3>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-base text-muted-foreground px-1">
                      {selectedProvider.denominationType === "FIXED" 
                        ? "Choose a fixed amount below"
                        : `Range: ${selectedProvider.localTransactionCurrencyCode} ${selectedProvider.minLocalTransactionAmount || 0} - ${selectedProvider.maxLocalTransactionAmount || 'Any'}`
                      }
                    </p>
                    {selectedProvider.denominationType !== "FIXED" && (
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-xl py-7 px-6 bg-background border-border focus-visible:ring-primary rounded-2xl"
                      />
                    )}
                  </div>

                  {selectedProvider.fixedAmounts && selectedProvider.fixedAmounts.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedProvider.fixedAmounts.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setAmount(amt.toString())}
                          className={`py-4 px-2 rounded-2xl border transition-all shadow-sm flex flex-col items-center justify-center gap-1 ${
                            amount === amt.toString()
                              ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20"
                              : "border-border bg-card hover:border-primary/50 text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <span className="text-lg font-bold">
                            {selectedProvider.localTransactionCurrencyCode} {amt}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <Button 
                    className="w-full py-8 text-xl font-bold bg-[#555a64] hover:bg-[#444952] text-white flex items-center justify-center gap-3 rounded-2xl shadow-lg mt-4 transition-transform active:scale-[0.98]" 
                    onClick={handlePayment}
                    disabled={isSubmitting}
                  >
                    <Check className="w-6 h-6" />
                    {isSubmitting ? "Processing..." : "Pay Bill"}
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
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">How utility payments work</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="animate-fade-in">
              <div className="bg-muted rounded-xl p-6 flex items-center justify-center gap-3">
                <div className="bg-card rounded-md px-4 py-2 text-lg font-mono text-foreground shadow-sm">{accountNumber || "123456..."}</div>
                <button className="bg-cta text-cta-foreground p-2 rounded-lg">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-foreground">Select provider & enter details</h3>
                <p className="text-muted-foreground mt-1">Choose your utility provider and enter your account or meter number.</p>
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
                <h3 className="text-lg font-bold text-foreground">Pay with crypto</h3>
                <p className="text-muted-foreground mt-1">Send the required amount using your preferred cryptocurrency.</p>
              </div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 flex items-center justify-center border border-green-200">
                <div className="relative">
                  <div className="w-16 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-300 shadow-lg flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-foreground">Instant confirmation</h3>
                <p className="text-muted-foreground mt-1">Your bill is paid instantly once the transaction is confirmed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
};

export default UtilityBill;
