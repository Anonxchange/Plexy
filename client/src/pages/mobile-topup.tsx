import { useState, useMemo } from "react";
import { ChevronDown, ArrowRight, Search, Clock, Wallet, Bot, Smartphone, Check } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useAirtime } from "@/hooks/user-airtime";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [selectedCountry, setSelectedCountry] = useState<string>("NG");
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [amount, setAmount] = useState<string>("");
  const [isTopupDialogOpen, setIsTopupDialogOpen] = useState(false);

  const { countries, isLoadingCountries, getOperators, processTopup } = useAirtime();
  const { data: operators, isLoading: isLoadingOperators } = getOperators(selectedCountry);

  const currentCountry = useMemo(() => 
    countries.find(c => c.countryCode === selectedCountry), 
    [countries, selectedCountry]
  );

  const handleProviderClick = (operator: any) => {
    setSelectedOperator(operator);
    setIsTopupDialogOpen(true);
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
        setIsTopupDialogOpen(false);
        setAmount("");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process top-up");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground pt-12 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-8 animate-fade-in">
            Top up prepaid mobile phones with Bitcoin and other cryptocurrencies from anywhere in the world
          </h1>
        </div>

        {/* Floating phone input */}
        <div className="absolute left-4 right-4 -bottom-7 z-10">
          <div className="max-w-sm md:max-w-lg mx-auto">
            <div className="flex items-center bg-card rounded-lg shadow-lg overflow-hidden animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="relative">
                <select 
                  className="appearance-none bg-white px-3 py-3 md:px-6 md:py-4 border-r border-gray-200 text-gray-900 font-medium cursor-pointer outline-none min-w-[80px]"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  {countries.map(c => (
                    <option key={c.countryCode} value={c.countryCode}>
                      {c.countryCode}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
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

      {/* Provider Grid */}
      <section className="pt-14 pb-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              {isLoadingCountries ? <Skeleton className="h-8 w-64" /> : `Popular Phone Refill products in ${currentCountry?.name || 'Nigeria'}`}
            </h2>
            <button className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-full transition-colors text-sm font-medium w-fit">
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
            {isLoadingOperators ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : (
              operators?.map((operator: any, index: number) => (
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
      </section>

      {/* Topup Dialog */}
      <Dialog open={isTopupDialogOpen} onOpenChange={setIsTopupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Top up {selectedOperator?.name}</DialogTitle>
            <DialogDescription>
              Enter the amount you want to send to {phoneNumber || 'the recipient'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="amount" className="text-sm font-medium">Amount ({selectedOperator?.senderCurrencyCode})</label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={selectedOperator?.minAmount}
                max={selectedOperator?.maxAmount}
              />
              <p className="text-xs text-muted-foreground">
                Min: {selectedOperator?.minAmount} {selectedOperator?.senderCurrencyCode} / 
                Max: {selectedOperator?.maxAmount} {selectedOperator?.senderCurrencyCode}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-cta hover:bg-cta/90 text-cta-foreground" 
              onClick={handleTopup}
              disabled={processTopup.isPending}
            >
              {processTopup.isPending ? "Processing..." : "Confirm Top-up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
