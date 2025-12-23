import { useState } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  X,
  ListFilter,
  CreditCard,
  Gift,
  Play,
  Wallet,
  ShieldCheck,
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  Banknote,
  Lock,
  BarChart3,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PexlyFooter } from "@/components/pexly-footer";
import { MoonPayWidget } from "@/components/moonpay-widget";
import { MoonPayIcon } from "@/components/icons/moonpay-icon";
import { CryptoCurrencySelector } from "@/components/crypto-currency-selector";
import { FiatCurrencySelector } from "@/components/fiat-currency-selector";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { countries as localizationCountries } from "@/lib/localization";
import { useEffect } from "react";

// ==================== TYPES ====================
interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  price?: string;
  badge?: string;
  subtitle?: string;
}

interface Currency {
  code: string;
  icon: string;
  color: string;
}

// ==================== DATA ====================
const tabs = [
  { id: "one-click", label: "One-Click Buy" },
  { id: "p2p", label: "P2P" },
  { id: "block", label: "Block", badge: "NEW" },
  { id: "fiat", label: "Fiat Deposit" },
];

const trendingEvents = [
  {
    id: "1",
    title: "Pexly Flat & Pay Christmas",
    description: "Earn from a 25,000 USDT Christmas Prize Pool!",
    status: "Ongoing",
    endDate: "2026-01-09",
    image: "🎄",
    tasks: [
      { label: "Lucky Draw", description: "1 Chance(s)", reward: "Random" },
      { label: "Lucky Draw", description: "1 Chance(s)", reward: "Pay $25 (or its equivalent with Pexly Pay)" },
    ],
    participants: 0,
  },
  {
    id: "2",
    title: "New Year Trading Bonuses",
    description: "Get exclusive bonuses for your first trade of 2026!",
    status: "Upcoming",
    endDate: "2026-02-01",
    image: "🎉",
    tasks: [
      { label: "Sign Up Bonus", description: "1 Chance(s)", reward: "Up to 500 USDT" },
    ],
    participants: 0,
  },
  {
    id: "3",
    title: "Referral Rewards Season",
    description: "Earn commissions by referring friends to Pexly!",
    status: "Ongoing",
    endDate: "2026-03-31",
    image: "👥",
    tasks: [
      { label: "Referral Bonus", description: "Unlimited", reward: "10% of friend's trading fees" },
    ],
    participants: 0,
  },
];

const paymentMethods: PaymentMethod[] = [
  {
    id: "bank-p2p",
    name: "Bank Transfer",
    icon: "P2P",
    iconBg: "#F7A600",
    price: "₦ 1,471",
    badge: "Highest Trade",
    subtitle: "From P2P:",
  },
  {
    id: "bank",
    name: "Bank Transfer",
    icon: "🏦",
    iconBg: "#E3F2FD",
    price: "₦ 1,481.48",
  },
  {
    id: "onramp",
    name: "Onramp",
    icon: "⚡",
    iconBg: "#E8F5E9",
    price: "₦ 1,486.47",
    subtitle: "UPI, IMPS, FAST, SPEI, VietQR",
  },
  {
    id: "moonpay",
    name: "Moonpay",
    icon: "moonpay-icon",
    iconBg: "#627EEA",
    price: "₦ 1,514.8",
    subtitle: "Credit Card, Maestro, Google Pay",
  },
];

const steps = [
  { step: 1, icon: ListFilter, title: "Enter an amount and select the payment method" },
  { step: 2, icon: CreditCard, title: "Confirm order" },
  { step: 3, icon: Gift, title: "Receive crypto" },
];

const features = [
  {
    icon: Banknote,
    title: "Transact Seamlessly Through Bank Transfers",
    description: "Transact effortlessly with an extensive selection of banks and payment networks, including SEPA, FPS, Visa and Mastercard.",
    iconBg: "bg-muted/30",
    iconColor: "text-muted-foreground",
  },
  {
    icon: ShieldCheck,
    title: "Swift Transactions With Robust Security",
    description: "Experience rapid transactions and rest easy knowing your funds are secure.",
    iconBg: "bg-muted/30",
    iconColor: "text-muted-foreground",
  },
  {
    icon: DollarSign,
    title: "Zero Fees & Competitive Rates",
    description: "Maximize your investment with zero fees and competitive currency rates.",
    iconBg: "bg-muted/30",
    iconColor: "text-muted-foreground",
  },
  {
    icon: Building2,
    title: "Tailored for Large Transactions",
    description: "Our platform is optimized to handle and support all transaction sizes.",
    iconBg: "bg-muted/30",
    iconColor: "text-muted-foreground",
  },
];

const faqTabs = ["Beginner", "Advanced", "Advertiser"];

const faqData = {
  Beginner: [
    { question: "What is P2P on Pexly?", answer: "P2P (Peer-to-Peer) trading on Pexly allows users to buy and sell cryptocurrencies directly with each other using various payment methods. It provides a secure escrow service to protect both buyers and sellers during transactions." },
    { question: "Are there any transaction fees on the P2P platform?", answer: "Pexly P2P platform offers zero trading fees for both makers and takers. You only pay the network fees when withdrawing your crypto." },
    { question: "Do I need Identity Verification (KYC) to perform P2P trading?", answer: "Yes, you need to complete basic identity verification (KYC Level 1) to access P2P trading on Pexly. This helps ensure the security of all users on the platform." },
    { question: "Can I trade with users in other countries or regions?", answer: "Yes, you can trade with users from different countries. However, payment methods may vary by region, and you should ensure you can receive payments through the selected method." },
    { question: "What payment methods are supported for P2P trade?", answer: "Pexly P2P supports various payment methods including bank transfer, mobile payment apps, digital wallets, and more. Available methods vary by region." },
    { question: "How to buy and sell on P2P?", answer: "To buy: Select an offer, enter amount, confirm order, make payment, and click 'Payment Completed'. To sell: Post an ad or accept a buy order, wait for payment, then release the crypto." },
    { question: "What are the order limits on the P2P trading platform?", answer: "Order limits vary depending on the advertiser's settings and your account verification level. Higher KYC levels typically allow for larger transaction limits." },
    { question: "Why am I ineligible to buy or sell my coin?", answer: "This may be due to incomplete KYC verification, regional restrictions, or account security measures. Please check your account status or contact support for assistance." },
  ],
  Advanced: [
    { question: "How do I become a P2P merchant?", answer: "To become a P2P merchant, you need to meet certain requirements including trading volume, account age, and verification level. Apply through the P2P merchant program in your account." },
    { question: "What is the escrow service?", answer: "The escrow service holds the seller's cryptocurrency during a trade until the buyer confirms payment. This protects both parties from fraud." },
  ],
  Advertiser: [
    { question: "How do I post an advertisement?", answer: "Go to P2P trading, click 'Post Ad', set your price, amount, payment methods, and trading terms. Your ad will be visible to other users once published." },
    { question: "What are the requirements to become an advertiser?", answer: "Advertisers need to maintain a good trading history, complete advanced verification, and meet minimum deposit requirements." },
  ],
};

// ==================== MAIN COMPONENT ====================
const Index = () => {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("one-click");
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [spendAmount, setSpendAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("USDT");
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [faqActiveTab, setFaqActiveTab] = useState("Beginner");
  const [eventTab, setEventTab] = useState<"trending" | "ongoing">("trending");

  const supabase = createClient();

  const fiatCurrencyMap: Record<string, { icon: string; color: string }> = {
    NGN: { icon: "₦", color: "#2E7D32" },
    USD: { icon: "$", color: "#1E40AF" },
    EUR: { icon: "€", color: "#DC2626" },
    GBP: { icon: "£", color: "#4B5563" },
    CAD: { icon: "$", color: "#FF6B35" },
    INR: { icon: "₹", color: "#FF9500" },
    KES: { icon: "KSh", color: "#06B6D4" },
    GHS: { icon: "₵", color: "#059669" },
  };

  const fiatCurrency = fiatCurrencyMap[selectedFiatCurrency] || fiatCurrencyMap["NGN"];
  
  const getCryptoDisplay = (symbol: string) => {
    const iconMap: Record<string, { icon: string; color: string }> = {
      BTC: { icon: "₿", color: "#F7931A" },
      ETH: { icon: "Ξ", color: "#627EEA" },
      SOL: { icon: "◎", color: "#00D4AA" },
      BNB: { icon: "⬡", color: "#F3BA2F" },
      TRX: { icon: "Ⓣ", color: "#EB0029" },
      USDC: { icon: "$", color: "#2775CA" },
      USDT: { icon: "₮", color: "#26A69A" },
      LTC: { icon: "Ł", color: "#345D9D" },
    };
    return iconMap[symbol] || { icon: "$", color: "#999" };
  };

  const cryptoCurrencyDisplay = getCryptoDisplay(selectedCrypto);

  const recommendedMethods = paymentMethods.filter((m) => m.badge || m.id === "bank-p2p");
  const thirdPartyMethods = paymentMethods.filter((m) => !m.badge && m.id !== "bank-p2p" && m.id !== "bank");

  useEffect(() => {
    const loadUserCurrency = async () => {
      if (user?.id && !selectedFiatCurrency) {
        try {
          const { data: profileData } = await supabase
            .from("user_profiles")
            .select("country, preferred_currency")
            .eq("id", user.id)
            .single();

          if (profileData) {
            if (profileData.preferred_currency) {
              setSelectedFiatCurrency(profileData.preferred_currency);
            } else if (profileData.country) {
              const userCountry = localizationCountries.find(
                c => c.name.toLowerCase() === profileData.country.toLowerCase() || 
                     c.code.toLowerCase() === profileData.country.toLowerCase()
              );
              if (userCountry) {
                setSelectedFiatCurrency(userCountry.currencyCode);
              } else {
                setSelectedFiatCurrency("USD");
              }
            } else {
              setSelectedFiatCurrency("USD");
            }
          } else {
            setSelectedFiatCurrency("USD");
          }
        } catch (error) {
          console.error("Error loading user currency:", error);
          setSelectedFiatCurrency("USD");
        }
      } else if (!user?.id && !selectedFiatCurrency) {
        setSelectedFiatCurrency("USD");
      }
    };

    loadUserCurrency();
  }, [user?.id, selectedFiatCurrency, supabase]);

  return (
    <>
      <Helmet>
        <title>Buy Crypto with Fiat | Fast & Secure Trading</title>
        <meta name="description" content="Buy USDT and other cryptocurrencies instantly with bank transfer. Zero fees, competitive rates, and secure transactions." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="overflow-x-hidden">
          {/* Hero + Trading Form + Events */}
          <div className="bg-background px-4 md:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trading Form Column */}
                <div>
                  {/* Buy/Sell Toggle */}
                  <div className="flex justify-between pb-4 border-b border-border mb-6">
                    <button
                      onClick={() => setMode("buy")}
                      className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                        mode === "buy" 
                          ? "bg-white text-foreground" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setMode("sell")}
                      className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                        mode === "sell" 
                          ? "bg-white text-foreground" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Sell
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Spend Input */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">Spend</label>
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-4">
                        <input
                          type="text"
                          value={spendAmount}
                          onChange={(e) => setSpendAmount(e.target.value)}
                          placeholder="4,500 - 23,000,000"
                          className="flex-1 bg-transparent text-base font-medium placeholder:text-muted-foreground/60 focus:outline-none"
                        />
                        <FiatCurrencySelector 
                          value={selectedFiatCurrency}
                          onChange={setSelectedFiatCurrency}
                        />
                      </div>
                    </div>

                    {/* Receive Input */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">Receive ≈</label>
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-4">
                        <input
                          type="text"
                          value={receiveAmount}
                          onChange={(e) => setReceiveAmount(e.target.value)}
                          placeholder="Enter purchase amount"
                          className="flex-1 bg-transparent text-base font-medium placeholder:text-muted-foreground/60 focus:outline-none"
                        />
                        <div className="w-full max-w-[180px]">
                          <CryptoCurrencySelector 
                            value={selectedCrypto}
                            onChange={setSelectedCrypto}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Exchange rate */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                      <span>1 USDT ≈ 1,471 NGN</span>
                      <button className="p-1 hover:bg-muted rounded transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground text-base">Payment Methods</h3>
                      <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="w-full flex items-center gap-3 border border-border rounded-xl p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden" style={{ backgroundColor: selectedPaymentMethod.iconBg }}>
                          {selectedPaymentMethod.icon === "moonpay-icon" ? (
                            <MoonPayIcon />
                          ) : (
                            selectedPaymentMethod.icon
                          )}
                        </div>
                        <span className="flex-1 text-left font-semibold text-foreground">{selectedPaymentMethod.name}</span>
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>

                    {/* MoonPay Widget or Login */}
                    {selectedPaymentMethod.id === "moonpay" && (
                      <>
                        {user ? (
                          <MoonPayWidget
                            amount={spendAmount ? parseFloat(spendAmount.replace(/,/g, '')) : undefined}
                            currency="usd"
                            onSuccess={() => {
                              console.log('MoonPay payment completed');
                            }}
                            onError={(error) => {
                              console.error('MoonPay error:', error);
                            }}
                          />
                        ) : (
                          <Button
                            onClick={() => navigate("/signin")}
                            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                          >
                            Login to Buy
                          </Button>
                        )}
                      </>
                    )}

                    {selectedPaymentMethod.id !== "moonpay" && (
                      <>
                        {user ? (
                          <Button className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg" disabled={!spendAmount}>
                            Buy With NGN
                          </Button>
                        ) : (
                          <Button
                            onClick={() => navigate("/signin")}
                            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                          >
                            Login to Buy
                          </Button>
                        )}
                      </>
                    )}

                    <button className="w-full flex items-center justify-center gap-2 py-3 text-foreground font-medium hover:opacity-70 transition-opacity">
                      <RefreshCw className="w-4 h-4" />
                      Recurring Buy
                    </button>
                  </div>
                </div>

                {/* Events Column */}
                <div>
                  <h2 className="text-2xl font-bold mb-6">One-Click Buy Trending Events</h2>
                  
                  {/* Event Tabs */}
                  <div className="flex gap-4 mb-6 border-b border-border pb-4">
                    <button
                      onClick={() => setEventTab("trending")}
                      className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                        eventTab === "trending"
                          ? "text-primary border-primary -mb-4"
                          : "text-muted-foreground border-transparent hover:text-foreground"
                      }`}
                    >
                      Trending Events
                    </button>
                    <button
                      onClick={() => setEventTab("ongoing")}
                      className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                        eventTab === "ongoing"
                          ? "text-primary border-primary -mb-4"
                          : "text-muted-foreground border-transparent hover:text-foreground"
                      }`}
                    >
                      Ongoing ({trendingEvents.filter((e) => e.status === "Ongoing").length})
                    </button>
                  </div>

                  {/* Events Grid - 2 columns */}
                  <div className="grid grid-cols-1 gap-6">
                    {trendingEvents
                      .filter((event) => (eventTab === "trending" ? true : event.status === "Ongoing"))
                      .slice(0, 2)
                      .map((event) => (
                        <div
                          key={event.id}
                          className="rounded-2xl overflow-hidden bg-card border border-border hover:shadow-lg transition-shadow"
                        >
                          {/* Event Image/Header */}
                          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>
                              <p className="text-xs text-slate-300">{event.description}</p>
                            </div>
                            <div className="text-3xl shrink-0">{event.image}</div>
                          </div>

                          {/* Event Content */}
                          <div className="p-4 space-y-3">
                            {/* Status */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">
                                {event.status === "Ongoing" && "✓ Ongoing"}
                                {event.status === "Upcoming" && "⏱️ Upcoming"}
                              </span>
                              <span className="text-muted-foreground">
                                Ends {new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </div>

                            {/* Tasks */}
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-foreground block">Tasks and Rewards</span>
                              {event.tasks.slice(0, 1).map((task, idx) => (
                                <div key={idx} className="bg-muted/50 rounded-lg p-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-medium text-foreground">{task.label}</span>
                                    <span className="text-xs text-primary font-semibold">{task.description}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{task.reward}</p>
                                </div>
                              ))}
                            </div>

                            {/* Register Button */}
                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg h-9 text-sm">
                              Register Now
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How to Buy Section */}
          <section className="py-12 px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">How to Buy Crypto in Real Time?</h2>
              <div className="bg-muted/30 rounded-2xl p-6 md:p-8">
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {steps.map((step, index) => (
                    <div key={step.step} className="text-center">
                      <div className="flex justify-center mb-4">
                        <step.icon className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 font-medium">Step {step.step}</p>
                      <p className="text-foreground font-semibold leading-snug">{step.title}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
                  <span className="text-foreground font-semibold">Click to View</span>
                  <button className="flex items-center gap-2 px-6 py-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors">
                    <Play className="w-4 h-4" />
                    Video
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-12 px-4 md:px-6 lg:px-8 bg-muted/10">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Deposit Local Fiat Currencies to Buy Crypto</h2>
              <p className="text-muted-foreground mb-10 text-lg">Convert cash into crypto. Deposit over 65+ fiat currencies to get started with crypto trading.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="bg-card border border-border rounded-2xl p-8 text-center animate-fade-in hover:shadow-md transition-shadow" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${feature.iconBg} flex items-center justify-center`}>
                      <feature.icon className={`w-10 h-10 ${feature.iconColor}`} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-12 px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Leading Crypto Trading Platform</h2>
              <div className="bg-muted/30 rounded-2xl p-8">
                <div className="mb-8">
                  <p className="text-base text-muted-foreground mb-4">More than</p>
                  <h3 className="text-2xl font-bold mb-2">65+ fiat currencies</h3>
                  <h3 className="text-2xl font-bold mb-4">100+ cryptocurrencies</h3>
                  <p className="text-sm text-muted-foreground">EUR、USD、GBP、BRL、JPY、TRY、BTC、ETH</p>
                </div>
                <div className="pt-8 border-t border-border">
                  <p className="text-lg font-semibold mb-8">Millions of registered users and billions of US dollars in daily trading volume</p>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="text-center">
                      <div className="text-5xl mb-4">👥</div>
                      <p className="text-2xl font-bold mb-2">20 Millions+</p>
                      <p className="text-muted-foreground font-medium">Registered Users</p>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl mb-4">📊</div>
                      <p className="text-2xl font-bold mb-2">10 Billions+</p>
                      <p className="text-muted-foreground font-medium">Daily Trading Volume (USD)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Fiat Section - Top Crypto-Fiat Pairs */}
          <section className="py-12 px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Top Crypto-Fiat Pairs</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 font-semibold text-muted-foreground">Crypto</th>
                      <th className="text-left py-4 px-4 font-semibold text-muted-foreground">Euro</th>
                      <th className="text-left py-4 px-4 font-semibold text-muted-foreground">Brazilian Real</th>
                      <th className="text-left py-4 px-4 font-semibold text-muted-foreground">Polish Zloty</th>
                      <th className="text-left py-4 px-4 font-semibold text-muted-foreground">United States Dollar</th>
                      <th className="text-left py-4 px-4 font-semibold text-muted-foreground">Japanese Yen</th>
                      <th className="text-left py-4 px-4 font-semibold text-muted-foreground">Indian Rupee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">₮</div>
                          <div>
                            <p className="font-medium">USDT</p>
                            <p className="text-xs text-muted-foreground">Tether USDT</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium">0.84994</td>
                      <td className="py-4 px-4 font-medium">5.62725</td>
                      <td className="py-4 px-4 font-medium">3.66365</td>
                      <td className="py-4 px-4 font-medium">1.0015</td>
                      <td className="py-4 px-4 font-medium">161.91059</td>
                      <td className="py-4 px-4 font-medium">91.87173</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold">₿</div>
                          <div>
                            <p className="font-medium">BTC</p>
                            <p className="text-xs text-muted-foreground">Bitcoin</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium">74,888.39651</td>
                      <td className="py-4 px-4 font-medium">495,122.45902</td>
                      <td className="py-4 px-4 font-medium">322,237.20881</td>
                      <td className="py-4 px-4 font-medium">88,118.68434</td>
                      <td className="py-4 px-4 font-medium">13,919,663.93</td>
                      <td className="py-4 px-4 font-medium">7,855,943.63</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-sm font-bold text-white">Ξ</div>
                          <div>
                            <p className="font-medium">ETH</p>
                            <p className="text-xs text-muted-foreground">Ethereum</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium">2,535.89107</td>
                      <td className="py-4 px-4 font-medium">16,765.97018</td>
                      <td className="py-4 px-4 font-medium">10,897.53075</td>
                      <td className="py-4 px-4 font-medium">2,983.89864</td>
                      <td className="py-4 px-4 font-medium">471,577.67</td>
                      <td className="py-4 px-4 font-medium">265,994.73</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold">T</div>
                          <div>
                            <p className="font-medium">TON</p>
                            <p className="text-xs text-muted-foreground">TON</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium">1.24507</td>
                      <td className="py-4 px-4 font-medium">8.24005</td>
                      <td className="py-4 px-4 font-medium">5.36259</td>
                      <td className="py-4 px-4 font-medium">1.46651</td>
                      <td className="py-4 px-4 font-medium">231.35</td>
                      <td className="py-4 px-4 font-medium">130.54</td>
                    </tr>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold">S</div>
                          <div>
                            <p className="font-medium">SOL</p>
                            <p className="text-xs text-muted-foreground">Solana</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium">106.34017</td>
                      <td className="py-4 px-4 font-medium">703.76946</td>
                      <td className="py-4 px-4 font-medium">457.46013</td>
                      <td className="py-4 px-4 font-medium">125.25232</td>
                      <td className="py-4 px-4 font-medium">19,750.84</td>
                      <td className="py-4 px-4 font-medium">11,143.78</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-8 px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">FAQs</h2>
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {faqTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFaqActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                      faqActiveTab === tab ? "bg-card border border-border shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0 hidden md:block" />
              </div>
              <Accordion type="single" collapsible className="space-y-0">
                {faqData[faqActiveTab as keyof typeof faqData].map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b border-border py-2">
                    <AccordionTrigger className="text-left font-medium hover:no-underline py-4 [&[data-state=open]]:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <button className="flex items-center gap-2 text-primary font-medium mt-6 hover:opacity-80 transition-opacity">
                Learn More
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <PexlyFooter />

        {/* Payment Method Modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="sm:max-w-md p-0 gap-0 rounded-t-3xl sm:rounded-2xl">
            <DialogHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-bold">Select Payment Method</DialogTitle>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </DialogHeader>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Recommended</span>
                </div>
                <div className="space-y-2">
                  {recommendedMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => { setSelectedPaymentMethod(method); setIsPaymentModalOpen(false); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                        selectedPaymentMethod.id === method.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: method.iconBg }}>
                        {method.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{method.name}</span>
                          {method.badge && <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">{method.badge}</span>}
                        </div>
                        {method.subtitle && <p className="text-xs text-muted-foreground">{method.subtitle}</p>}
                      </div>
                      {method.price && <span className="font-semibold text-sm">{method.price}</span>}
                    </button>
                  ))}
                </div>
              </div>
              {thirdPartyMethods.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-sm">Third Party</span>
                  <div className="space-y-2">
                    {thirdPartyMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => { setSelectedPaymentMethod(method); setIsPaymentModalOpen(false); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                          selectedPaymentMethod.id === method.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: method.iconBg }}>
                          {method.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-medium">{method.name}</span>
                          {method.subtitle && <p className="text-xs text-muted-foreground">{method.subtitle}</p>}
                        </div>
                        {method.price && <span className="font-semibold text-sm">{method.price}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Index;
