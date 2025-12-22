import { useState } from "react";
import { ChevronDown, ArrowRight, Search, Clock, Wallet, Bot, Bitcoin, Zap, DollarSign, Smartphone } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { cryptoIconUrls } from "@/lib/crypto-icons";

const mtnImage = "/assets/IMG_3123.webp";
const airtelImage = "/assets/IMG_3124.webp";
const gloImage = "/assets/IMG_3125.webp";
const etisalatImage = "/assets/IMG_3126.webp";
const spectranetImage = "/assets/IMG_3127.webp";

// Provider Card Component
interface ProviderCardProps {
  name: string;
  logo?: React.ReactNode;
  image?: string;
  priceRange: string;
  bgColor?: string;
  badge?: string;
  outOfStock?: boolean;
}

const ProviderCard = ({ name, logo, image, priceRange, bgColor = "bg-card", badge, outOfStock }: ProviderCardProps) => (
  <div className="group cursor-pointer">
    <div className={`relative ${bgColor} rounded-xl aspect-[4/3] flex items-center justify-center shadow-card group-hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-1 overflow-hidden border border-border`}>
      {badge && (
        <span className="absolute top-2 left-2 bg-success text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <span>💰</span> {badge}
        </span>
      )}
      {outOfStock && (
        <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-semibold px-2 py-1 rounded-md">
          Out Of Stock
        </span>
      )}
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        logo
      )}
    </div>
    <div className="mt-3">
      <h3 className="font-semibold text-foreground">{name}</h3>
      <p className="text-sm text-muted-foreground">{priceRange}</p>
    </div>
  </div>
);

const providers = [
  { name: "MTN", image: mtnImage, priceRange: "5 NGN - 50000 NGN", bgColor: "bg-card" },
  { name: "Airtel", image: airtelImage, priceRange: "50 NGN - 50000 NGN", bgColor: "bg-card" },
  { name: "Airtel Data", image: airtelImage, priceRange: "50 NGN - 150000 NGN", bgColor: "bg-card" },
  { name: "Glo Mobile bundles", image: gloImage, priceRange: "50 NGN - 150000 NGN", bgColor: "bg-card" },
  { name: "GLO", image: gloImage, priceRange: "2856 NGN - 39554 NGN", bgColor: "bg-card" },
  { name: "9Mobile", image: etisalatImage, priceRange: "50 NGN - 10000 NGN", bgColor: "bg-card", badge: "2%" },
  { name: "Spectranet PIN", image: spectranetImage, priceRange: "500 NGN - 7000 NGN", bgColor: "bg-card" },
  { name: "Airtel PIN", image: airtelImage, priceRange: "100 NGN - 50000 NGN", bgColor: "bg-card", outOfStock: true },
];

const steps = [
  {
    title: "Enter a phone number & amount",
    description: "Type in the phone number and the amount you want us to refill.",
    visual: (
      <div className="bg-muted rounded-xl p-6 flex items-center justify-center gap-3">
        <div className="bg-card rounded-md px-4 py-2 text-lg font-mono text-foreground shadow-sm">342934</div>
        <button className="bg-cta text-cta-foreground p-2 rounded-lg">
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    ),
  },
  {
    title: "Pay with any payment method",
    description: "Your payment is confirmed the same minute in most cases.",
    visual: (
      <div className="bg-muted rounded-xl p-6 flex items-center justify-center gap-6">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-border shadow-sm">
          <img src={cryptoIconUrls.BTC} alt="Bitcoin" className="w-8 h-8" />
        </div>
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-border shadow-sm">
          <img src={cryptoIconUrls.USDT} alt="Tether" className="w-8 h-8" />
        </div>
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-border shadow-sm">
          <img src={cryptoIconUrls.USDC} alt="USDC" className="w-8 h-8" />
        </div>
      </div>
    ),
  },
  {
    title: "That's it, here is your refill",
    description: "Once your payment is confirmed you will get your refill sent out.",
    visual: (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 flex items-center justify-center border border-green-200">
        <div className="relative">
          <div className="w-16 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-300 shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform">
            <span className="text-2xl">🎫</span>
          </div>
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <span className="text-white text-sm font-bold">✓</span>
          </div>
        </div>
      </div>
    ),
  },
];

const benefits = [
  { icon: Clock, title: "Instant digital delivery" },
  { icon: Bot, title: "Live Bankless" },
  { icon: Wallet, title: "Save on exchange fees" },
];

const cryptoIcons = [
  { name: "Bitcoin", symbol: "BTC", iconUrl: cryptoIconUrls.BTC },
  { name: "Ethereum", symbol: "ETH", iconUrl: cryptoIconUrls.ETH },
  { name: "Litecoin", symbol: "LTC", iconUrl: cryptoIconUrls.LTC },
  { name: "Solana", symbol: "SOL", iconUrl: cryptoIconUrls.SOL },
  { name: "USDC", symbol: "USDC", iconUrl: cryptoIconUrls.USDC },
  { name: "Tether", symbol: "USDT", iconUrl: cryptoIconUrls.USDT },
];

const paymentMethods = [
  { name: "Apple Pay", display: " Pay" },
  { name: "Google Pay", display: "G Pay" },
  { name: "Visa", display: "VISA" },
  { name: "Mastercard", display: "●●" },
];

const Index = () => {
  const [phoneNumber, setPhoneNumber] = useState("");

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
              <button className="flex items-center gap-1.5 hover:bg-muted transition-colors px-3 py-3 md:px-6 md:py-4 border-r border-border">
                <span className="text-base md:text-lg">🇳🇬</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0802 123 4567"
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base md:text-lg py-3 md:py-5 px-3 md:px-6 min-w-0"
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
              Popular Phone Refill products in Nigeria
            </h2>
            <button className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-full transition-colors text-sm font-medium w-fit">
              <Search className="w-4 h-4" />
              <span>Search for</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
            {providers.map((provider, index) => (
              <div key={provider.name + index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <ProviderCard {...provider} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 md:px-6 lg:px-8 bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">How refills work</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.title} className="animate-fade-in" style={{ animationDelay: `${index * 0.15}s` }}>
                {step.visual}
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={benefit.title} className="flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-14 h-14 rounded-full border-2 border-cta flex items-center justify-center mb-3">
                  <benefit.icon className="w-6 h-6 text-cta" />
                </div>
                <h3 className="font-semibold text-foreground">{benefit.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crypto Payments */}
      <section className="py-10 px-4 md:px-6 lg:px-8 bg-muted">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-foreground font-medium italic mb-6">
            Refill your airtime with Bitcoin, Ethereum, Litecoin, Dash, Dogecoin, or Lightning!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {cryptoIcons.map((crypto) => (
              <div
                key={crypto.name}
                className="w-10 h-10 rounded-full bg-white shadow-sm hover:scale-110 transition-transform cursor-pointer border border-border flex items-center justify-center"
                title={crypto.name}
              >
                <img src={crypto.iconUrl} alt={crypto.name} className="w-6 h-6" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.name}
                className="px-4 py-2 bg-card rounded-md border border-border text-foreground text-sm font-medium hover:shadow-card transition-shadow cursor-pointer"
              >
                {method.display}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <PexlyFooter />
    </div>
  );
};

export default Index;
