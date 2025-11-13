import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { OfferCard, OfferCardProps } from "@/components/offer-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { currencies } from "@/lib/currencies";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { 
  Bitcoin, 
  MapPin,
  Search,
  RotateCw,
  Menu,
  TrendingUp,
  Coins,
  Wallet,
  CreditCard,
  Gift,
  Building2,
  Smartphone,
  Circle,
  ArrowRight,
  ThumbsUp
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { Separator } from "@/components/ui/separator";

const cryptocurrencies = [
  { symbol: "BTC", name: "Bitcoin", iconUrl: cryptoIconUrls.BTC, price: 123592.33 },
  { symbol: "ETH", name: "Ethereum", iconUrl: cryptoIconUrls.ETH, price: 5789.12 },
  { symbol: "USDT", name: "Tether", iconUrl: cryptoIconUrls.USDT, price: 1.00 },
];

// Helper function to get country flag emoji
const getCountryFlag = (countryName: string | undefined | null): string => {
  if (!countryName) return '🌍';
  switch (countryName.toLowerCase()) {
    case 'united states': return '🇺🇸';
    case 'nigeria': return '🇳🇬';
    case 'united kingdom': return '🇬🇧';
    case 'canada': return '🇨🇦';
    case 'ghana': return '🇬🇭';
    case 'kenya': return '🇰🇪';
    case 'south africa': return '🇿🇦';
    default: return '🌍';
  }
};

export function P2P() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [offerLocation, setOfferLocation] = useState("worldwide");
  const [traderLocation, setTraderLocation] = useState("usa");
  const [openCurrencyDialog, setOpenCurrencyDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("All Payment Methods");
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [offers, setOffers] = useState<OfferCardProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("All countries");
  const [sortingMethod, setSortingMethod] = useState("Recommended");
  const [showTopRatedOnly, setShowTopRatedOnly] = useState(false);
  const [verifiedUsersOnly, setVerifiedUsersOnly] = useState(false);
  const [recentlyActive, setRecentlyActive] = useState(false);
  const [acceptableOnly, setAcceptableOnly] = useState(false);
  const [rememberFilters, setRememberFilters] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchOffers();
    fetchActiveTrades();

    // Subscribe to trade status changes
    if (user?.id) {
      const channel = supabase
        .channel('active-trades-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'p2p_trades',
          },
          () => {
            // Refresh active trades when any trade is updated
            fetchActiveTrades();
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [activeTab, selectedCrypto, user?.id]);

  const fetchActiveTrades = async () => {
    if (!user?.id) return;

    try {

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!userProfile) return;

      // Fetch active trades where user is buyer or seller (only pending and payment_sent)
      const { data: trades, error } = await supabase
        .from("p2p_trades")
        .select("*")
        .or(`buyer_id.eq.${userProfile.id},seller_id.eq.${userProfile.id}`)
        .in("status", ["pending", "payment_sent"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately for each trade
      const tradesWithProfiles = await Promise.all(
        (trades || []).map(async (trade) => {
          const { data: buyerProfile } = await supabase
            .from("user_profiles")
            .select("username, avatar_url, avatar_type, positive_ratings, total_trades, response_time_avg, country")
            .eq("id", trade.buyer_id)
            .single();

          const { data: sellerProfile } = await supabase
            .from("user_profiles")
            .select("username, avatar_url, avatar_type, positive_ratings, total_trades, response_time_avg, country")
            .eq("id", trade.seller_id)
            .single();

          return {
            ...trade,
            buyer_profile: buyerProfile,
            seller_profile: sellerProfile,
          };
        })
      );

      setActiveTrades(tradesWithProfiles);
    } catch (error) {
      console.error("Error fetching active trades:", error);
    }
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      // Fetch offers first
      const { data: basicOffersData, error: basicError } = await supabase
        .from("p2p_offers")
        .select("*")
        .eq("crypto_symbol", selectedCrypto)
        .eq("offer_type", activeTab)
        .eq("is_active", true);

      if (basicError) {
        console.error("Error fetching offers:", basicError);
        setOffers([]);
        setLoading(false);
        return;
      }

      // If we have offers, fetch user profiles for each one
      if (basicOffersData && basicOffersData.length > 0) {
        const offersWithProfiles = await Promise.all(
          basicOffersData.map(async (offer: any) => {
            const { data: userProfile } = await supabase
              .from("user_profiles")
              .select("id, username, display_name, avatar_url, avatar_type, positive_ratings, total_trades, response_time_avg, country")
              .eq("id", offer.user_id)
              .single();

            return {
              ...offer,
              user_profiles: userProfile
            };
          })
        );

        // Format offers with user profile data
        const formattedOffers: OfferCardProps[] = offersWithProfiles.map((offer: any) => {
          const user = offer.user_profiles;
          const vendorName = user?.username || user?.display_name || "Trader";

          // Use the user's actual avatar from profile
          let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${vendorName}`;

          if (user?.avatar_url) {
            // User has uploaded a custom avatar
            avatarUrl = user.avatar_url;
          } else if (user?.avatar_type) {
            // User has selected an avatar type
            const avatarTypes = [
              { id: 'default', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' },
              { id: 'trader', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader' },
              { id: 'crypto', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto' },
              { id: 'robot', image: 'https://api.dicebear.com/7.x/bottts/svg?seed=robot' },
              { id: 'ninja', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ninja' },
              { id: 'astronaut', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=astronaut' },
              { id: 'developer', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer' },
              { id: 'artist', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist' },
            ];
            const selectedAvatar = avatarTypes.find(a => a.id === user.avatar_type);
            if (selectedAvatar) {
              avatarUrl = selectedAvatar.image;
            }
          }

          return {
            id: offer.id,
            vendor: {
              id: user?.id || offer.user_id,
              name: vendorName,
              avatar: avatarUrl,
              isVerified: (user?.positive_ratings || 0) > 10,
              trades: user?.total_trades || 0,
              responseTime: user?.response_time_avg 
                ? `${Math.floor(user.response_time_avg / 60)} min` 
                : "5 min",
              country: user?.country || undefined,
            },
            paymentMethod: Array.isArray(offer.payment_methods) ? offer.payment_methods[0] : "Bank Transfer",
            pricePerBTC: offer.price_type === "fixed" ? offer.fixed_price : 123592.33,
            currency: offer.fiat_currency,
            availableRange: { 
              min: offer.min_amount, 
              max: offer.available_amount || offer.max_amount 
            },
            limits: { 
              min: offer.min_amount, 
              max: offer.max_amount 
            },
            type: offer.offer_type,
            cryptoSymbol: offer.crypto_symbol,
            time_limit_minutes: offer.time_limit_minutes || 30
          };
        });

        setOffers(formattedOffers);
      } else {
        // No offers found
        setOffers([]);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const paymentCategories = [
    { id: "all", name: "All payment methods" },
    { id: "bank", name: "Bank transfers" },
    { id: "wallet", name: "Online wallets" },
    { id: "card", name: "Debit/credit cards" },
    { id: "gift", name: "Gift cards" },
    { id: "digital", name: "Digital currencies" },
    { id: "goods", name: "Goods and services" },
  ];

  const popularPaymentMethods = [
    { id: "bank-transfer", name: "Bank Transfer", icon: Building2, category: "bank" },
    { id: "google-pay", name: "Google Pay", icon: Smartphone, category: "wallet" },
    { id: "apple-pay", name: "ApplePay", icon: Smartphone, category: "wallet" },
    { id: "paypal", name: "PayPal", icon: Wallet, category: "wallet" },
    { id: "mtn", name: "MTN Mobile Money", icon: Smartphone, category: "wallet" },
    { id: "wire", name: "Domestic Wire Transfer", icon: Building2, category: "bank" },
  ];

  const allPaymentMethods = [
    // Bank Transfers
    { id: "bank-transfer", name: "Bank Transfer", icon: Building2, category: "bank" },
    { id: "wire", name: "Domestic Wire Transfer", icon: Building2, category: "bank" },
    { id: "ach", name: "ACH Transfer", icon: Building2, category: "bank" },
    { id: "sepa", name: "SEPA Transfer", icon: Building2, category: "bank" },
    { id: "swift", name: "SWIFT Transfer", icon: Building2, category: "bank" },

    // Online Wallets
    { id: "paypal", name: "PayPal", icon: Wallet, category: "wallet" },
    { id: "google-pay", name: "Google Pay", icon: Smartphone, category: "wallet" },
    { id: "apple-pay", name: "Apple Pay", icon: Smartphone, category: "wallet" },
    { id: "advcash", name: "AdvCash", icon: Wallet, category: "wallet" },
    { id: "airtel", name: "Airtel Money", icon: Smartphone, category: "wallet" },
    { id: "alipay", name: "Alipay", icon: Smartphone, category: "wallet" },
    { id: "mtn", name: "MTN Mobile Money", icon: Smartphone, category: "wallet" },
    { id: "skrill", name: "Skrill", icon: Wallet, category: "wallet" },
    { id: "neteller", name: "Neteller", icon: Wallet, category: "wallet" },
    { id: "venmo", name: "Venmo", icon: Smartphone, category: "wallet" },
    { id: "cashapp", name: "Cash App", icon: Smartphone, category: "wallet" },
    { id: "zelle", name: "Zelle", icon: Smartphone, category: "wallet" },
    { id: "wechat", name: "WeChat Pay", icon: Smartphone, category: "wallet" },

    // Debit/Credit Cards
    { id: "visa", name: "Visa", icon: CreditCard, category: "card" },
    { id: "mastercard", name: "Mastercard", icon: CreditCard, category: "card" },
    { id: "amex", name: "American Express", icon: CreditCard, category: "card" },
    { id: "discover", name: "Discover", icon: CreditCard, category: "card" },
    { id: "debit", name: "Debit Card", icon: CreditCard, category: "card" },
    { id: "credit", name: "Credit Card", icon: CreditCard, category: "card" },

    // Gift Cards
    { id: "amazon", name: "Amazon Gift Card", icon: Gift, category: "gift" },
    { id: "apple-gift", name: "Apple Gift Card", icon: Gift, category: "gift" },
    { id: "google-play", name: "Google Play", icon: Gift, category: "gift" },
    { id: "steam", name: "Steam", icon: Gift, category: "gift" },
    { id: "itunes", name: "iTunes Gift Card", icon: Gift, category: "gift" },
    { id: "xbox", name: "Xbox Gift Card", icon: Gift, category: "gift" },
    { id: "playstation", name: "PlayStation Gift Card", icon: Gift, category: "gift" },
    { id: "netflix", name: "Netflix Gift Card", icon: Gift, category: "gift" },
    { id: "spotify", name: "Spotify Gift Card", icon: Gift, category: "gift" },

    // Digital Currencies
    { id: "bitcoin", name: "Bitcoin (BTC)", icon: Bitcoin, category: "digital" },
    { id: "ethereum", name: "Ethereum (ETH)", icon: Coins, category: "digital" },
    { id: "usdt", name: "Tether (USDT)", icon: Coins, category: "digital" },
    { id: "usdc", name: "USD Coin (USDC)", icon: Coins, category: "digital" },
    { id: "arweave", name: "Arweave (AR)", icon: Coins, category: "digital" },
    { id: "litecoin", name: "Litecoin (LTC)", icon: Coins, category: "digital" },

    // Goods and Services
    { id: "merchandise", name: "Merchandise", icon: MapPin, category: "goods" },
    { id: "services", name: "Services", icon: MapPin, category: "goods" },
    { id: "vouchers", name: "Vouchers", icon: Gift, category: "goods" },
  ];

  const popularCurrencies = ["USD", "GBP", "CAD", "EUR", "INR", "KES", "NGN", "CNY"];
  const selectedCurrencyData = currencies.find(c => c.code === currency);


  const selectedCryptoData = cryptocurrencies.find(c => c.symbol === selectedCrypto) || cryptocurrencies[0];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* Mobile View */}
        <div className="lg:hidden px-4 py-6">
          {/* Buy/Sell Tabs */}
          <div className="flex gap-0 mb-8 border-b">
            <button
              onClick={() => setActiveTab("buy")}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 font-semibold text-base sm:text-lg transition-colors relative ${
                activeTab === "buy" 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Buy
              {activeTab === "buy" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("sell")}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 font-semibold text-base sm:text-lg transition-colors relative ${
                activeTab === "sell" 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sell
              {activeTab === "sell" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"></div>
              )}
            </button>
          </div>

          <div className="space-y-6">
          {/* Title */}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {activeTab === "buy" ? "Buy" : "Sell"} Bitcoin (BTC).
              </h1>
              <p className="text-muted-foreground">
                {activeTab === "buy" 
                  ? "Buy Bitcoin with over 500 payment methods to choose from, including bank transfers, online wallets, and gift cards."
                  : "Sell your Bitcoin and get paid via over 500 payment methods, including bank transfers, online wallets, and gift cards."
                }
              </p>
            </div>

          {/* Cryptocurrency Selector */}
            <div className="space-y-2">
            <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
              <SelectTrigger className="w-full h-14 text-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedCryptoData.iconUrl} 
                    alt={selectedCryptoData.symbol}
                    className="h-6 w-6 rounded-full"
                  />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {cryptocurrencies.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                    <div className="flex items-center gap-3">
                      <img 
                        src={crypto.iconUrl} 
                        alt={crypto.symbol}
                        className="h-5 w-5 rounded-full"
                      />
                      <span>{crypto.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Display */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                1 {selectedCrypto} = {selectedCryptoData.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-4">
            <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder={selectedPaymentMethod}
                    className="pl-10 pr-12 h-14 text-base cursor-pointer"
                    readOnly
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-accent rounded-md transition-colors">
                    <Menu className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md h-full sm:h-auto max-h-screen p-0 flex flex-col">
                <div className="sticky top-0 bg-background z-10 border-b">
                  {/* Search Bar with Back Arrow */}
                  <div className="flex items-center gap-3 p-4 pb-0">
                    <button 
                      onClick={() => setOpenPaymentDialog(false)}
                      className="p-1 hover:bg-muted rounded-md transition-colors"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Search"
                        value={paymentSearchQuery}
                        onChange={(e) => setPaymentSearchQuery(e.target.value)}
                        className="pl-10 h-12 border-0 focus-visible:ring-0 bg-muted"
                      />
                    </div>
                  </div>

                  {/* Category Tabs */}
                  <div className="overflow-x-auto px-4 pt-4">
                    <div className="flex gap-3 pb-3 border-b">
                      {paymentCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            "pb-2 px-1 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                            selectedCategory === cat.id
                              ? "border-foreground text-foreground"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select All Button */}
                  <div className="px-4 py-3 flex justify-center">
                    <Button
                      variant="outline"
                      className="rounded-full px-6"
                      onClick={() => {
                        setSelectedPaymentMethod("All Payment Methods");
                        setOpenPaymentDialog(false);
                      }}
                    >
                      Select All
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="px-4 py-4 space-y-6">
                    {selectedCategory === "all" ? (
                      // Show all categories with their methods
                      paymentCategories.slice(1).map((category) => {
                        const categoryMethods = allPaymentMethods.filter(
                          (method) => 
                            method.category === category.id &&
                            method.name.toLowerCase().includes(paymentSearchQuery.toLowerCase())
                        );

                        if (categoryMethods.length === 0) return null;

                        return (
                          <div key={category.id}>
                            <h3 className="text-sm font-semibold mb-3 capitalize">
                              {category.name}
                            </h3>
                            <div className="space-y-0 bg-card rounded-lg overflow-hidden border">
                              {categoryMethods.map((method, index) => (
                                <button
                                  key={method.id}
                                  onClick={() => {
                                    setSelectedPaymentMethod(method.name);
                                    setOpenPaymentDialog(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left",
                                    index !== 0 && "border-t"
                                  )}
                                >
                                  <method.icon className="h-5 w-5 text-muted-foreground" />
                                  <span className="font-medium">{method.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // Show only selected category
                      <div>
                        <h3 className="text-sm font-semibold mb-3 capitalize">
                          {paymentCategories.find(c => c.id === selectedCategory)?.name}
                        </h3>
                        <div className="space-y-0 bg-card rounded-lg overflow-hidden border">
                          {allPaymentMethods
                            .filter((method) => {
                              const matchesSearch = method.name.toLowerCase().includes(paymentSearchQuery.toLowerCase());
                              const matchesCategory = method.category === selectedCategory;
                              return matchesSearch && matchesCategory;
                            })
                            .map((method, index) => (
                              <button
                                key={method.id}
                                onClick={() => {
                                  setSelectedPaymentMethod(method.name);
                                  setOpenPaymentDialog(false);
                                }}
                                className={cn(
                                  "w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left",
                                  index !== 0 && "border-t"
                                )}
                              >
                                <method.icon className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{method.name}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Amount Selector */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-24 h-14 text-base"
                type="number"
              />
              <Dialog open={openCurrencyDialog} onOpenChange={setOpenCurrencyDialog}>
                <DialogTrigger asChild>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button variant="ghost" className="h-10 px-3 font-semibold">
                      {selectedCurrencyData?.flag} {currency}
                    </Button>
                    <button className="p-1 hover:bg-accent rounded-md transition-colors">
                      <Menu className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Preferred currency</DialogTitle>
                    </DialogHeader>
                    <Command>
                      <CommandInput placeholder="Search for your currency" />
                      <CommandEmpty>No currency found.</CommandEmpty>

                      <div className="max-h-[400px] overflow-y-auto">
                        <CommandGroup heading="MOST POPULAR">
                          <CommandItem
                            value="any"
                            onSelect={() => {
                              setCurrency("USD");
                              setOpenCurrencyDialog(false);
                            }}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🌐</span>
                              <span>Any currency</span>
                            </div>
                            <span className="text-sm font-semibold">$£€</span>
                          </CommandItem>
                          {popularCurrencies.map((code) => {
                            const curr = currencies.find(c => c.code === code);
                            if (!curr) return null;
                            return (
                              <CommandItem
                                key={code}
                                value={code}
                                onSelect={() => {
                                  setCurrency(code);
                                  setOpenCurrencyDialog(false);
                                }}
                                className={cn(
                                  "flex items-center justify-between",
                                  currency === code && "bg-primary/10"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">{curr.flag}</span>
                                  <span>{curr.name}</span>
                                </div>
                                <span className={cn(
                                  "text-sm font-semibold px-3 py-1 rounded",
                                  currency === code ? "bg-green-500 text-white" : "bg-muted"
                                )}>
                                  {code}
                                </span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>

                        <CommandGroup heading="ALL CURRENCIES">
                          {currencies.filter(c => !popularCurrencies.includes(c.code)).map((curr) => (
                            <CommandItem
                              key={curr.code}
                              value={curr.code}
                              onSelect={() => {
                                setCurrency(curr.code);
                                setOpenCurrencyDialog(false);
                              }}
                              className={cn(
                                "flex items-center justify-between",
                                currency === curr.code && "bg-primary/10"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{curr.flag}</span>
                                <span>{curr.name}</span>
                              </div>
                              <span className={cn(
                                "text-sm font-semibold px-3 py-1 rounded",
                                currency === curr.code ? "bg-green-500 text-white" : "bg-muted"
                              )}>
                                {curr.code}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </div>
                    </Command>
                  </DialogContent>
                </Dialog>
            </div>
          </div>

          {/* Offer Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Offer Location</Label>
              <button className="p-1 rounded-full hover:bg-accent transition-colors">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <Select value={offerLocation} onValueChange={setOfferLocation}>
              <SelectTrigger className="w-full h-14 text-base">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worldwide">Worldwide</SelectItem>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="ng">Nigeria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trader Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Trader Location</Label>
              <button className="p-1 rounded-full hover:bg-accent transition-colors">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <Select value={traderLocation} onValueChange={setTraderLocation}>
              <SelectTrigger className="w-full h-14 text-base">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usa">United States (USA)</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="ng">Nigeria</SelectItem>
                <SelectItem value="worldwide">Worldwide</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Find Offers Button */}
          <div className="flex gap-3">
            <Button 
              className="flex-1 h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
              onClick={fetchOffers}
            >
              Find Offers
              <RotateCw className={`ml-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline"
              className="h-14 w-14 p-0"
              onClick={() => setOpenFiltersDialog(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </Button>
          </div>

          {/* Filters Dialog */}
          <Dialog open={openFiltersDialog} onOpenChange={setOpenFiltersDialog}>
            <DialogContent className="sm:max-w-md h-full sm:h-auto max-h-screen p-0 flex flex-col">
              <div className="sticky top-0 bg-background z-10 border-b p-4">
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle className="text-xl font-bold">Filters</DialogTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      className="text-sm"
                      onClick={() => {
                        setSelectedCountry("All countries");
                        setSortingMethod("Recommended");
                        setShowTopRatedOnly(false);
                        setVerifiedUsersOnly(false);
                        setRecentlyActive(false);
                        setAcceptableOnly(false);
                      }}
                    >
                      Reset all filters
                    </Button>
                    <button 
                      onClick={() => setOpenFiltersDialog(false)}
                      className="p-1 hover:bg-muted rounded-md transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {/* Country Filter */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Country</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All countries">All countries</SelectItem>
                        <SelectItem value="United States">🇺🇸 United States</SelectItem>
                        <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                        <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                        <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                        <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                        <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sorting */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Sorting</Label>
                    <Select value={sortingMethod} onValueChange={setSortingMethod}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Recommended">Recommended</SelectItem>
                        <SelectItem value="Price: Low to High">Price: Low to High</SelectItem>
                        <SelectItem value="Price: High to Low">Price: High to Low</SelectItem>
                        <SelectItem value="Most Trades">Most Trades</SelectItem>
                        <SelectItem value="Newest First">Newest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Offer tags */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Offer tags</Label>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="text-muted-foreground">Select tags</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>

                  <Separator />

                  {/* Toggle Filters */}
                  <div className="space-y-4">
                    {/* Top-rated traders */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">Show only top-rated traders</div>
                        <div className="text-sm text-muted-foreground">Experienced traders with badges</div>
                      </div>
                      <Button
                        variant="ghost"
                        className={cn(
                          "ml-4 h-8 w-14 rounded-full p-0 transition-colors",
                          showTopRatedOnly ? "bg-green-500" : "bg-muted"
                        )}
                        onClick={() => setShowTopRatedOnly(!showTopRatedOnly)}
                      >
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full bg-white transition-transform",
                            showTopRatedOnly ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </Button>
                    </div>

                    {/* Verified users only */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">Verified users only</div>
                        <div className="text-sm text-muted-foreground">Show offers from ID-verified users</div>
                      </div>
                      <Button
                        variant="ghost"
                        className={cn(
                          "ml-4 h-8 w-14 rounded-full p-0 transition-colors",
                          verifiedUsersOnly ? "bg-green-500" : "bg-muted"
                        )}
                        onClick={() => setVerifiedUsersOnly(!verifiedUsersOnly)}
                      >
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full bg-white transition-transform",
                            verifiedUsersOnly ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </Button>
                    </div>

                    {/* Recently active */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">Recently active</div>
                        <div className="text-sm text-muted-foreground">Last seen 30 mins ago</div>
                      </div>
                      <Button
                        variant="ghost"
                        className={cn(
                          "ml-4 h-8 w-14 rounded-full p-0 transition-colors",
                          recentlyActive ? "bg-green-500" : "bg-muted"
                        )}
                        onClick={() => setRecentlyActive(!recentlyActive)}
                      >
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full bg-white transition-transform",
                            recentlyActive ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </Button>
                    </div>

                    {/* Acceptable only */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">Acceptable only</div>
                        <div className="text-sm text-muted-foreground">Show only offers that I can accept now</div>
                      </div>
                      <Button
                        variant="ghost"
                        className={cn(
                          "ml-4 h-8 w-14 rounded-full p-0 transition-colors",
                          acceptableOnly ? "bg-green-500" : "bg-muted"
                        )}
                        onClick={() => setAcceptableOnly(!acceptableOnly)}
                      >
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full bg-white transition-transform",
                            acceptableOnly ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="sticky bottom-0 bg-background border-t p-4 space-y-3">
                <Button 
                  className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold"
                  onClick={() => {
                    setOpenFiltersDialog(false);
                    fetchOffers();
                  }}
                >
                  Apply
                </Button>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember-filters"
                    checked={rememberFilters}
                    onChange={(e) => setRememberFilters(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="remember-filters" className="text-sm">
                    Remember my filters
                  </label>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Active Trades Section - Always show if there are active trades */}
          {activeTrades.length > 0 && (
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  Active Trades ({activeTrades.length})
                </h2>
                <Button 
                  variant="ghost" 
                  className="text-primary hover:text-primary/90 font-semibold"
                  onClick={() => window.location.href = '/trade-history'}
                >
                  View All →
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeTrades.slice(0, 3).map((trade) => {
                  const isUserBuyer = trade.buyer_id === user?.id;
                  const counterparty = isUserBuyer ? trade.seller_profile : trade.buyer_profile;

                  // Use the vendor's (counterparty's) avatar with proper type handling
                  let vendorAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${counterparty?.username || 'vendor'}`;

                  if (counterparty?.avatar_url) {
                    vendorAvatarUrl = counterparty.avatar_url;
                  } else if (counterparty?.avatar_type) {
                    const avatarTypes = [
                      { id: 'default', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' },
                      { id: 'trader', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader' },
                      { id: 'crypto', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto' },
                      { id: 'robot', image: 'https://api.dicebear.com/7.x/bottts/svg?seed=robot' },
                      { id: 'ninja', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ninja' },
                      { id: 'astronaut', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=astronaut' },
                      { id: 'developer', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer' },
                      { id: 'artist', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist' },
                    ];
                    const selectedAvatar = avatarTypes.find(a => a.id === counterparty.avatar_type);
                    if (selectedAvatar) {
                      vendorAvatarUrl = selectedAvatar.image;
                    }
                  }

                  return (
                    <Card 
                      key={trade.id} 
                      className="hover:shadow-lg transition-shadow border-2 border-primary/50 cursor-pointer"
                      onClick={() => window.location.href = `/trade/${trade.id}`}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Vendor Info Row */}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={vendorAvatarUrl} />
                            <AvatarFallback className="text-base font-semibold bg-primary/10">
                              {counterparty?.username?.substring(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-base">{counterparty?.username || "Vendor"}</span>
                              {counterparty?.country && (
                                <span className="text-base">
                                  {getCountryFlag(counterparty.country)}
                                </span>
                              )}
                              {(counterparty?.positive_ratings || 0) > 10 && (
                                <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                                  <Circle className="h-2 w-2 fill-green-600" />
                                  POWER
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <ThumbsUp className="h-3 w-3" />
                              <span>100%</span>
                              <span>{counterparty?.total_trades || 0} Trades</span>
                              <Circle className="h-1 w-1 fill-green-500" />
                              <span className="text-green-500">Active now</span>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-1" />

                        {/* Pay and Receive Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                              {isUserBuyer ? "Pay" : "Receive"} {trade.payment_method}
                              {trade.fiat_currency === "NGN" && " 🇳🇬"}
                              {trade.fiat_currency === "USD" && " 🇺🇸"}
                              {trade.fiat_currency === "EUR" && " 🇪🇺"}
                              {trade.fiat_currency === "GBP" && " 🇬🇧"}
                            </div>
                            <div className="text-xl font-bold">
                              {trade.fiat_amount.toLocaleString()} {trade.fiat_currency}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">
                              {isUserBuyer ? "Receive" : "Pay"} ({trade.crypto_symbol})
                            </div>
                            <div className="text-xl font-bold">
                              {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}
                            </div>
                          </div>
                        </div>

                        {/* Status and Button Row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-green-600 flex items-center gap-1">
                              <Circle className="h-2 w-2 fill-green-600 animate-pulse" />
                              {trade.buyer_paid_at ? "Waiting for release" : "Awaiting payment"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Trade ID: {trade.id.substring(0, 8)}...
                            </div>
                          </div>
                          <Button 
                            className="bg-[#C4F82A] hover:bg-[#b5e625] text-black font-bold gap-2 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/trade/${trade.id}`;
                            }}
                          >
                            View Trade
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Offers List */}
          {offers.length > 0 && (
            <div className={activeTrades.length > 0 ? "space-y-4" : "mt-8 space-y-4"}>
              <h2 className="text-2xl font-bold">
                {activeTab === "buy" ? "Buy" : "Sell"} Offers ({offers.length})
              </h2>
              <div className="grid gap-4">
                {offers.map((offer) => (
                  <OfferCard key={offer.id} {...offer} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && offers.length === 0 && (
            <Card className="mt-8">
              <CardContent className="p-12 text-center">
                <h3 className="text-xl font-semibold mb-2">No offers found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or create your own offer to {activeTab === "buy" ? "sell" : "buy"} {selectedCrypto}.
                </p>
                <Button 
                  className="mt-6" 
                  variant="outline"
                  onClick={() => window.location.href = '/create-offer'}
                >
                  Create an Offer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* How to Get Started Section */}
            <div className="mt-12 space-y-6">
            <div className="text-left space-y-3">
              <h2 className="text-3xl font-bold">
                How to Get Started With Pexly P2P
              </h2>
              <p className="text-muted-foreground">
                Ready to begin your P2P trading journey? Follow this step-by-step guide to complete your first P2P transaction on Pexly.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <button 
                onClick={() => setActiveTab("buy")}
                className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === "buy" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Buy Coins
              </button>
              <button 
                onClick={() => setActiveTab("sell")}
                className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === "sell" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Sell Coins
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-6 py-6">
              {/* Step 1 */}
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <img 
                    src="/assets/IMG_1764.png"
                    alt="Select an Ad"
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Step 1: Select an Ad
                  </h3>
                  <p className="text-muted-foreground">
                    Browse the ads, choose your preferred one, and click <span className="font-semibold">{activeTab === "buy" ? "Buy" : "Sell"}</span>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <img 
                    src="/assets/IMG_1766.png"
                    alt="Confirm Payment"
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Step 2: Confirm Payment
                  </h3>
                  <p className="text-muted-foreground">
                    Click <span className="font-semibold">Payment Completed</span> after making the transfer to the {activeTab === "buy" ? "seller's" : "buyer's"} bank account.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <img 
                    src="/assets/IMG_1766.png"
                    alt="Receive Coins"
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Step 3: Receive Coins
                  </h3>
                  <p className="text-muted-foreground">
                    Once the {activeTab === "buy" ? "seller confirms receipt of payment" : "buyer completes payment"}, the coins will be released to your {activeTab === "buy" ? "Pexly" : "buyer's"} account.
                  </p>
                </div>
              </div>

              {/* Video Card */}
              <Card className="bg-gradient-to-r from-blue-600 to-orange-400 border-0 overflow-hidden relative">
                <CardContent className="p-8 relative">
                  <div className="flex items-center justify-between">
                    <div className="text-white space-y-2">
                      <h3 className="text-3xl font-bold">P2P?</h3>
                      <p className="text-white/90 max-w-md">
                        Learn how peer-to-peer trading works on Pexly
                      </p>
                    </div>
                    <button className="bg-white rounded-full p-6 hover:scale-110 transition-transform shadow-lg">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                  <div className="absolute bottom-0 right-0 opacity-20">
                    <svg width="200" height="120" viewBox="0 0 200 120" fill="none">
                      <circle cx="180" cy="100" r="60" fill="white" />
                      <circle cx="140" cy="80" r="40" fill="white" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Benefits of P2P Section */}
            <div className="mt-12 space-y-8">
              <h2 className="text-3xl font-bold">Benefits of P2P</h2>

              {/* First Benefits Image */}
              <div className="flex justify-center">
                <img 
                  src="/assets/IMG_1767.jpeg"
                  alt="Benefits of P2P Trading"
                  className="max-w-md w-full object-contain"
                />
              </div>

              {/* Why Choose P2P */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Why Choose P2P?</h3>
                <ul className="space-y-3">
                  <li>
                    <span className="font-semibold">Lower Fees:</span> Save on transaction fees compared to traditional exchanges.
                  </li>
                  <li>
                    <span className="font-semibold">Global Accessibility:</span> Trade anytime, anywhere, 24/7.
                  </li>
                  <li>
                    <span className="font-semibold">Customizable Trading:</span> Filter ads by price, payment method, and other preferences.
                  </li>
                </ul>
              </div>

              {/* Second Benefits Image */}
              <div className="flex justify-center">
                <img 
                  src="/assets/IMG_1759.jpeg"
                  alt="Why Choose Pexly P2P"
                  className="max-w-md w-full object-contain"
                />
              </div>

              {/* Why Choose Pexly P2P */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Why Choose Pexly P2P?</h3>
                <ul className="space-y-3">
                  <li>
                    <span className="font-semibold">Zero Fees:</span> Enjoy zero fees on crypto transactions.
                  </li>
                  <li>
                    <span className="font-semibold">Diverse Payment Options:</span> Choose from over 600 payment options.
                  </li>
                  <li>
                    <span className="font-semibold">24/7 Customer Support:</span> Access multilingual support anytime and find instant solutions in our Help Center.
                  </li>
                  <li>
                    <span className="font-semibold">Secure Escrow System:</span> Trade with confidence — your assets will only be released upon your confirmation.
                  </li>
                </ul>
              </div>

              {/* Learn About P2P */}
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold">Learn About P2P</h2>
                  <a href="#" className="text-primary hover:underline font-medium inline-flex items-center gap-2">
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>

                <div className="space-y-6">
                  {/* Card 1: P2P on Pexly Trading */}
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="w-full">
                        <img 
                          src="/assets/IMG_1750.jpeg"
                          alt="P2P Trading"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <div className="text-xs text-muted-foreground mb-2 uppercase font-semibold">PEXLY LEARN</div>
                        <h3 className="text-xl font-bold mb-2">P2P on Pexly Trading</h3>
                        <p className="text-muted-foreground mb-3">
                          Everything you need to know for a seamless and secure peer-to-peer trading experience.
                        </p>
                        <a href="#" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                          Read More <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 2: Avoid P2P Crypto Scams */}
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="w-full">
                        <img 
                          src="/assets/IMG_1754.jpeg"
                          alt="Avoid Scams"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <div className="text-xs text-muted-foreground mb-2 uppercase font-semibold">PEXLY LEARN</div>
                        <h3 className="text-xl font-bold mb-2">Avoid P2P Crypto Scams and Fraud</h3>
                        <p className="text-muted-foreground mb-3">
                          Learn about common tactics like fake escrow services, chargebacks, phishing, and non-payment schemes to stay safe in P2P trading.
                        </p>
                        <a href="#" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                          Read More <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 3: Earn Money With P2P Trading */}
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="w-full">
                        <img 
                          src="/assets/IMG_1755.jpeg"
                          alt="Earn Money"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <div className="text-xs text-muted-foreground mb-2 uppercase font-semibold">PEXLY LEARN</div>
                        <h3 className="text-xl font-bold mb-2">
                          How to Earn Money with <span className="text-primary">Pexly</span> P2P HotSwap
                        </h3>
                        <p className="text-muted-foreground mb-3">
                          Discover 5 essential tips to help you earn money safely on Pexly P2P.
                        </p>
                        <a href="#" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                          Read More <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Payment Methods Section */}
              <div className="mt-12 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Payment Methods</h2>
                  <p className="text-muted-foreground">
                    Trade effortlessly with popular payment methods
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    "ABA", "ACB", "ACLEDA",
                    "AirTM", "Akbank", "Altyn Bank",
                    "Al Rajhi Bank", "Ameriabank", "Apple Pay"
                  ].map((method) => (
                    <Card key={method} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div className="font-semibold">{method}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* FAQs Section */}
              <div className="mt-12 space-y-6">
                <h2 className="text-3xl font-bold">FAQs</h2>

                <div className="overflow-x-auto scrollbar-hide border-b">
                  <div className="flex gap-2 pb-2 min-w-max">
                    {["Beginner", "Advanced", "Advertiser", "Safe"].map((tab) => (
                      <Button
                        key={tab}
                        variant="ghost"
                        className="font-semibold whitespace-nowrap"
                      >
                        {tab}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    "What is P2P on Pexly?",
                    "Are there any transaction fees on the P2P platform?",
                    "Do I need Identity Verification (KYC) to perform P2P trading?",
                    "Can I trade with users in other countries or regions?",
                    "What payment methods are supported for P2P trade?",
                    "How to buy and sell on P2P?",
                    "What are the order limits on the P2P trading platform?",
                    "Why am I ineligible to buy or sell my coin?"
                  ].map((question) => (
                    <Card key={question} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <span className="font-medium">{question}</span>
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6">
                  <a href="#" className="text-primary hover:underline font-medium inline-flex items-center gap-2">
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Desktop View - Two Column Layout */}
        <div className="hidden lg:block">
          <div className="container mx-auto max-w-7xl px-6 py-8">
            {/* Buy/Sell Tabs - Desktop */}
            <div className="flex gap-6 mb-8 border-b">
              <button
                onClick={() => setActiveTab("buy")}
                className={`py-4 px-8 font-semibold text-lg transition-colors relative ${
                  activeTab === "buy" 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Buy Crypto
                {activeTab === "buy" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("sell")}
                className={`py-4 px-8 font-semibold text-lg transition-colors relative ${
                  activeTab === "sell" 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sell Crypto
                {activeTab === "sell" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left Sidebar - Filters */}
              <div className="col-span-3">
                <Card className="sticky top-6">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4 text-lg">Filters</h3>
                    </div>

                    {/* Cryptocurrency Selector */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cryptocurrency</Label>
                      <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                        <SelectTrigger className="w-full">
                          <div className="flex items-center gap-2">
                            <img 
                              src={selectedCryptoData.iconUrl} 
                              alt={selectedCryptoData.symbol}
                              className="h-5 w-5 rounded-full"
                            />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {cryptocurrencies.map((crypto) => (
                            <SelectItem key={crypto.symbol} value={crypto.symbol}>
                              <div className="flex items-center gap-2">
                                <img 
                                  src={crypto.iconUrl} 
                                  alt={crypto.symbol}
                                  className="h-4 w-4 rounded-full"
                                />
                                <span>{crypto.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-muted-foreground">
                        1 {selectedCrypto} ≈ ${selectedCryptoData.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <Separator />

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Payment Method</Label>
                      <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <span className="truncate">{selectedPaymentMethod}</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md h-full sm:h-auto max-h-screen p-0 flex flex-col">
                          <div className="sticky top-0 bg-background z-10 border-b">
                            <div className="flex items-center gap-3 p-4 pb-0">
                              <button 
                                onClick={() => setOpenPaymentDialog(false)}
                                className="p-1 hover:bg-muted rounded-md transition-colors"
                              >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                  placeholder="Search payment methods"
                                  value={paymentSearchQuery}
                                  onChange={(e) => setPaymentSearchQuery(e.target.value)}
                                  className="pl-10 h-12 border-0 focus-visible:ring-0 bg-muted"
                                />
                              </div>
                            </div>
                            <div className="overflow-x-auto px-4 pt-4">
                              <div className="flex gap-3 pb-3 border-b">
                                {paymentCategories.map((cat) => (
                                  <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                      "pb-2 px-1 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                                      selectedCategory === cat.id
                                        ? "border-foreground text-foreground"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    {cat.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="px-4 py-3 flex justify-center">
                              <Button
                                variant="outline"
                                className="rounded-full px-6"
                                onClick={() => {
                                  setSelectedPaymentMethod("All Payment Methods");
                                  setOpenPaymentDialog(false);
                                }}
                              >
                                Select All
                              </Button>
                            </div>
                          </div>
                          <ScrollArea className="flex-1">
                            <div className="px-4 py-4 space-y-6">
                              {selectedCategory === "all" ? (
                                paymentCategories.slice(1).map((category) => {
                                  const categoryMethods = allPaymentMethods.filter(
                                    (method) => 
                                      method.category === category.id &&
                                      method.name.toLowerCase().includes(paymentSearchQuery.toLowerCase())
                                  );
                                  if (categoryMethods.length === 0) return null;
                                  return (
                                    <div key={category.id}>
                                      <h3 className="text-sm font-semibold mb-3 capitalize">{category.name}</h3>
                                      <div className="space-y-0 bg-card rounded-lg overflow-hidden border">
                                        {categoryMethods.map((method, index) => (
                                          <button
                                            key={method.id}
                                            onClick={() => {
                                              setSelectedPaymentMethod(method.name);
                                              setOpenPaymentDialog(false);
                                            }}
                                            className={cn(
                                              "w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left",
                                              index !== 0 && "border-t"
                                            )}
                                          >
                                            <method.icon className="h-5 w-5 text-muted-foreground" />
                                            <span className="font-medium">{method.name}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div>
                                  <h3 className="text-sm font-semibold mb-3 capitalize">
                                    {paymentCategories.find(c => c.id === selectedCategory)?.name}
                                  </h3>
                                  <div className="space-y-0 bg-card rounded-lg overflow-hidden border">
                                    {allPaymentMethods
                                      .filter((method) => {
                                        const matchesSearch = method.name.toLowerCase().includes(paymentSearchQuery.toLowerCase());
                                        const matchesCategory = method.category === selectedCategory;
                                        return matchesSearch && matchesCategory;
                                      })
                                      .map((method, index) => (
                                        <button
                                          key={method.id}
                                          onClick={() => {
                                            setSelectedPaymentMethod(method.name);
                                            setOpenPaymentDialog(false);
                                          }}
                                          className={cn(
                                            "w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left",
                                            index !== 0 && "border-t"
                                          )}
                                        >
                                          <method.icon className="h-5 w-5 text-muted-foreground" />
                                          <span className="font-medium">{method.name}</span>
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Separator />

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Amount</Label>
                      <div className="relative">
                        <Input
                          placeholder="Enter amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pr-16"
                          type="number"
                        />
                        <Dialog open={openCurrencyDialog} onOpenChange={setOpenCurrencyDialog}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-xs font-semibold">
                              {selectedCurrencyData?.flag} {currency}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Preferred currency</DialogTitle>
                            </DialogHeader>
                            <Command>
                              <CommandInput placeholder="Search for your currency" />
                              <CommandEmpty>No currency found.</CommandEmpty>
                              <div className="max-h-[400px] overflow-y-auto">
                                <CommandGroup heading="MOST POPULAR">
                                  <CommandItem
                                    value="any"
                                    onSelect={() => {
                                      setCurrency("USD");
                                      setOpenCurrencyDialog(false);
                                    }}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-xl">🌐</span>
                                      <span>Any currency</span>
                                    </div>
                                    <span className="text-sm font-semibold">$£€</span>
                                  </CommandItem>
                                  {popularCurrencies.map((code) => {
                                    const curr = currencies.find(c => c.code === code);
                                    if (!curr) return null;
                                    return (
                                      <CommandItem
                                        key={code}
                                        value={code}
                                        onSelect={() => {
                                          setCurrency(code);
                                          setOpenCurrencyDialog(false);
                                        }}
                                        className={cn(
                                          "flex items-center justify-between",
                                          currency === code && "bg-primary/10"
                                        )}
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="text-xl">{curr.flag}</span>
                                          <span>{curr.name}</span>
                                        </div>
                                        <span className={cn(
                                          "text-sm font-semibold px-3 py-1 rounded",
                                          currency === code ? "bg-green-500 text-white" : "bg-muted"
                                        )}>
                                          {code}
                                        </span>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                                <CommandGroup heading="ALL CURRENCIES">
                                  {currencies.filter(c => !popularCurrencies.includes(c.code)).map((curr) => (
                                    <CommandItem
                                      key={curr.code}
                                      value={curr.code}
                                      onSelect={() => {
                                        setCurrency(curr.code);
                                        setOpenCurrencyDialog(false);
                                      }}
                                      className={cn(
                                        "flex items-center justify-between",
                                        currency === curr.code && "bg-primary/10"
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-xl">{curr.flag}</span>
                                        <span>{curr.name}</span>
                                      </div>
                                      <span className={cn(
                                        "text-sm font-semibold px-3 py-1 rounded",
                                        currency === curr.code ? "bg-green-500 text-white" : "bg-muted"
                                      )}>
                                        {curr.code}
                                      </span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </div>
                            </Command>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <Separator />

                    {/* Location Filters */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Trader Location</Label>
                        <Select value={traderLocation} onValueChange={setTraderLocation}>
                          <SelectTrigger className="w-full">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usa">United States (USA)</SelectItem>
                            <SelectItem value="uk">United Kingdom</SelectItem>
                            <SelectItem value="ng">Nigeria</SelectItem>
                            <SelectItem value="worldwide">Worldwide</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90 font-semibold"
                        onClick={fetchOffers}
                      >
                        Find Offers
                        <RotateCw className={`ml-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-10 h-10 p-0"
                        onClick={() => setOpenFiltersDialog(true)}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Content Area - Offers */}
              <div className="col-span-9 space-y-6">
                {/* Active Trades */}
                {activeTrades.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                        Active Trades ({activeTrades.length})
                      </h2>
                      <Button 
                        variant="ghost" 
                        className="text-primary hover:text-primary/90 font-semibold"
                        onClick={() => window.location.href = '/trade-history'}
                      >
                        View All →
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {activeTrades.slice(0, 4).map((trade) => {
                        const isUserBuyer = trade.buyer_id === user?.id;
                        const counterparty = isUserBuyer ? trade.seller_profile : trade.buyer_profile;
                        let vendorAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${counterparty?.username || 'vendor'}`;
                        if (counterparty?.avatar_url) {
                          vendorAvatarUrl = counterparty.avatar_url;
                        } else if (counterparty?.avatar_type) {
                          const avatarTypes = [
                            { id: 'default', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' },
                            { id: 'trader', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader' },
                            { id: 'crypto', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto' },
                            { id: 'robot', image: 'https://api.dicebear.com/7.x/bottts/svg?seed=robot' },
                            { id: 'ninja', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ninja' },
                            { id: 'astronaut', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=astronaut' },
                            { id: 'developer', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer' },
                            { id: 'artist', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist' },
                          ];
                          const selectedAvatar = avatarTypes.find(a => a.id === counterparty.avatar_type);
                          if (selectedAvatar) {
                            vendorAvatarUrl = selectedAvatar.image;
                          }
                        }
                        return (
                          <Card 
                            key={trade.id} 
                            className="hover:shadow-lg transition-shadow border-2 border-primary/50 cursor-pointer"
                            onClick={() => window.location.href = `/trade/${trade.id}`}
                          >
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={vendorAvatarUrl} />
                                  <AvatarFallback className="text-sm font-semibold bg-primary/10">
                                    {counterparty?.username?.substring(0, 2).toUpperCase() || "??"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-sm">{counterparty?.username || "Vendor"}</span>
                                    {counterparty?.country && (
                                      <span className="text-sm">{getCountryFlag(counterparty.country)}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <ThumbsUp className="h-3 w-3" />
                                    <span>100%</span>
                                    <span>{counterparty?.total_trades || 0} Trades</span>
                                  </div>
                                </div>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {isUserBuyer ? "Pay" : "Receive"}
                                  </div>
                                  <div className="text-lg font-bold">
                                    {trade.fiat_amount.toLocaleString()} {trade.fiat_currency}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {isUserBuyer ? "Receive" : "Pay"}
                                  </div>
                                  <div className="text-lg font-bold">
                                    {trade.crypto_amount.toFixed(6)} {trade.crypto_symbol}
                                  </div>
                                </div>
                              </div>
                              <Button 
                                className="w-full bg-[#C4F82A] hover:bg-[#b5e625] text-black font-bold"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/trade/${trade.id}`;
                                }}
                              >
                                View Trade <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Offers List */}
                {offers.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">
                        {activeTab === "buy" ? "Buy" : "Sell"} Offers ({offers.length})
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {offers.map((offer) => (
                        <OfferCard key={offer.id} {...offer} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!loading && offers.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <h3 className="text-xl font-semibold mb-2">No offers found</h3>
                      <p className="text-muted-foreground mb-6">
                        Try adjusting your filters or create your own offer to {activeTab === "buy" ? "sell" : "buy"} {selectedCrypto}.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => window.location.href = '/create-offer'}
                      >
                        Create an Offer
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* How to Get Started Section - Desktop */}
                <div className="mt-16 space-y-8">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold">
                      How to Get Started With Pexly P2P
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      Ready to begin your P2P trading journey? Follow this step-by-step guide to complete your first P2P transaction on Pexly.
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="grid md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          <img 
                            src="/assets/IMG_1764.png"
                            alt="Select an Ad"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-3">Step 1: Select an Ad</h3>
                          <p className="text-muted-foreground">
                            Browse the ads, choose your preferred one, and click <span className="font-semibold">{activeTab === "buy" ? "Buy" : "Sell"}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Step 2 */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          <img 
                            src="/assets/IMG_1766.png"
                            alt="Confirm Payment"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-3">Step 2: Confirm Payment</h3>
                          <p className="text-muted-foreground">
                            Click <span className="font-semibold">Payment Completed</span> after making the transfer to the {activeTab === "buy" ? "seller's" : "buyer's"} bank account.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Step 3 */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          <img 
                            src="/assets/IMG_1766.png"
                            alt="Receive Coins"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-3">Step 3: Receive Coins</h3>
                          <p className="text-muted-foreground">
                            Once the {activeTab === "buy" ? "seller confirms receipt of payment" : "buyer completes payment"}, the coins will be released to your {activeTab === "buy" ? "Pexly" : "buyer's"} account.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Video Card */}
                  <Card className="bg-gradient-to-r from-blue-600 to-orange-400 border-0 overflow-hidden">
                    <CardContent className="p-12 relative">
                      <div className="flex items-center justify-between">
                        <div className="text-white space-y-3">
                          <h3 className="text-4xl font-bold">P2P?</h3>
                          <p className="text-white/90 text-lg max-w-md">
                            Learn how peer-to-peer trading works on Pexly
                          </p>
                        </div>
                        <button className="bg-white rounded-full p-8 hover:scale-110 transition-transform shadow-lg">
                          <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Benefits of P2P */}
                  <div className="space-y-8">
                    <h2 className="text-3xl font-bold">Benefits of P2P</h2>

                    <div className="flex justify-center">
                      <img 
                        src="/assets/IMG_1767.jpeg"
                        alt="Benefits of P2P Trading"
                        className="max-w-2xl w-full rounded-lg"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-2xl font-bold mb-4">Why Choose P2P?</h3>
                        <ul className="space-y-4">
                          <li className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-semibold">Lower Fees:</span> Save on transaction fees compared to traditional exchanges.
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-semibold">Global Accessibility:</span> Trade anytime, anywhere, 24/7.
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-semibold">Customizable Trading:</span> Filter ads by price, payment method, and other preferences.
                            </div>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold mb-4">Why Choose Pexly P2P?</h3>
                        <ul className="space-y-4">
                          <li className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-semibold">Zero Fees:</span> Enjoy zero fees on crypto transactions.
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-semibold">Diverse Payment Options:</span> Choose from over 600 payment options.
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-semibold">24/7 Customer Support:</span> Access multilingual support anytime.
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-semibold">Secure Escrow System:</span> Trade with confidence.
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Learn About P2P */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold">Learn About P2P</h2>
                      <a href="#" className="text-primary hover:underline font-medium inline-flex items-center gap-2">
                        Learn More
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <img 
                            src="/assets/IMG_1750.jpeg"
                            alt="P2P Trading"
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-6">
                            <div className="text-xs text-primary mb-2 uppercase font-semibold">PEXLY LEARN</div>
                            <h3 className="text-xl font-bold mb-2">P2P on Pexly Trading</h3>
                            <p className="text-muted-foreground text-sm mb-3">
                              Everything you need to know for a seamless and secure peer-to-peer trading experience.
                            </p>
                            <a href="#" className="text-primary hover:underline font-medium inline-flex items-center gap-1 text-sm">
                              Read More <ArrowRight className="h-3 w-3" />
                            </a>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <img 
                            src="/assets/IMG_1754.jpeg"
                            alt="Avoid Scams"
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-6">
                            <div className="text-xs text-primary mb-2 uppercase font-semibold">PEXLY LEARN</div>
                            <h3 className="text-xl font-bold mb-2">Avoid P2P Crypto Scams</h3>
                            <p className="text-muted-foreground text-sm mb-3">
                              Learn about common tactics to stay safe in P2P trading.
                            </p>
                            <a href="#" className="text-primary hover:underline font-medium inline-flex items-center gap-1 text-sm">
                              Read More <ArrowRight className="h-3 w-3" />
                            </a>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <img 
                            src="/assets/IMG_1755.jpeg"
                            alt="Earn Money"
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-6">
                            <div className="text-xs text-primary mb-2 uppercase font-semibold">PEXLY LEARN</div>
                            <h3 className="text-xl font-bold mb-2">Earn Money with P2P</h3>
                            <p className="text-muted-foreground text-sm mb-3">
                              Discover essential tips to earn money safely on Pexly P2P.
                            </p>
                            <a href="#" className="text-primary hover:underline font-medium inline-flex items-center gap-1 text-sm">
                              Read More <ArrowRight className="h-3 w-3" />
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Payment Methods</h2>
                      <p className="text-muted-foreground">
                        Trade effortlessly with popular payment methods
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {[
                        "ABA", "ACB", "ACLEDA",
                        "AirTM", "Akbank", "Altyn Bank",
                        "Al Rajhi Bank", "Ameriabank", "Apple Pay",
                        "Bank Transfer", "Google Pay", "PayPal"
                      ].map((method) => (
                        <Card key={method} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4 text-center">
                            <div className="font-medium text-sm">{method}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* FAQs */}
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold">FAQs</h2>

                    <div className="flex gap-2 overflow-x-auto pb-2 border-b">
                      {["Beginner", "Advanced", "Advertiser", "Safe"].map((tab) => (
                        <Button
                          key={tab}
                          variant="ghost"
                          className="font-semibold whitespace-nowrap"
                        >
                          {tab}
                        </Button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {[
                        "What is P2P on Pexly?",
                        "Are there any transaction fees on the P2P platform?",
                        "Do I need Identity Verification (KYC) to perform P2P trading?",
                        "Can I trade with users in other countries or regions?",
                        "What payment methods are supported for P2P trade?",
                        "How to buy and sell on P2P?",
                        "What are the order limits on the P2P trading platform?",
                        "Why am I ineligible to buy or sell my coin?"
                      ].map((question) => (
                        <Card key={question} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4 flex items-center justify-between">
                            <span className="font-medium">{question}</span>
                            <svg className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-6">
                      <a href="#" className="text-primary hover:underline font-medium inline-flex items-center gap-2">
                        Learn More
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}