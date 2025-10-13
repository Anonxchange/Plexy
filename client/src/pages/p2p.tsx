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

// Custom icon components for crypto
const EthIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
  </svg>
);

const UsdtIcon = () => (
  <svg viewBox="0 0 2000 2000" fill="currentColor" className="h-6 w-6">
    <path d="M1000,0c552.26,0,1000,447.74,1000,1000S1552.24,2000,1000,2000,0,1552.38,0,1000,447.68,0,1000,0" fill="#53ae94"/>
    <path d="M1123.42,866.76V718h340.18V491.34H537.28V718H877.5V866.64C601,879.34,393.1,934.1,393.1,999.7s208,120.36,484.4,133.14v476.5h246V1132.8c276-12.74,483.48-67.46,483.48-133s-207.48-120.26-483.48-133m0,225.64v-0.12c-6.94.44-42.6,2.58-122,2.58-63.48,0-108.14-1.8-123.88-2.62v0.2C633.34,1081.66,451,1039.12,451,988.22S633.36,894.84,877.62,884V1050.1c16,1.1,61.76,3.8,124.92,3.8,75.86,0,114-3.16,121-3.8V884c243.8,10.86,425.72,53.44,425.72,104.16s-182,93.32-425.72,104.18" fill="#fff"/>
  </svg>
);

const cryptocurrencies = [
  { symbol: "BTC", name: "Bitcoin", icon: Bitcoin, price: 123592.33 },
  { symbol: "ETH", name: "Ethereum", icon: EthIcon, price: 5789.12 },
  { symbol: "USDT", name: "Tether", icon: UsdtIcon, price: 1.00 },
];

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
            .select("username, avatar_url, avatar_type, positive_ratings, total_trades, response_time_avg")
            .eq("id", trade.buyer_id)
            .single();

          const { data: sellerProfile } = await supabase
            .from("user_profiles")
            .select("username, avatar_url, avatar_type, positive_ratings, total_trades, response_time_avg")
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

      // Fetch offers with user profiles using the foreign key relationship
      const { data: offersData, error: offersError } = await supabase
        .from("p2p_offers")
        .select(`
          *,
          user_profiles!p2p_offers_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            avatar_type,
            positive_ratings,
            total_trades,
            response_time_avg
          )
        `)
        .eq("crypto_symbol", selectedCrypto)
        .eq("offer_type", activeTab)
        .eq("is_active", true);

      if (offersError) {
        console.error("Error fetching offers:", offersError);
        // If the join fails, fall back to fetching without user data
        const { data: basicOffersData, error: basicError } = await supabase
          .from("p2p_offers")
          .select("*")
          .eq("crypto_symbol", selectedCrypto)
          .eq("offer_type", activeTab)
          .eq("is_active", true);

        if (basicError) throw basicError;

        const formattedOffers: OfferCardProps[] = (basicOffersData || []).map((offer) => {
          const traderName = `Trader${Math.floor(Math.random() * 10000)}`;
          return {
            id: offer.id,
            vendor: {
              id: offer.user_id,
              name: traderName,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${offer.user_id}`,
              isVerified: false,
              trades: 0,
              responseTime: "5 min"
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
        return;
      }

      const formattedOffers: OfferCardProps[] = (offersData || []).map((offer: any) => {
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
              : "5 min"
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
    } catch (error) {
      console.error("Error fetching offers:", error);
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
    { id: "ethereum", name: "Ethereum (ETH)", icon: EthIcon, category: "digital" },
    { id: "usdt", name: "Tether (USDT)", icon: UsdtIcon, category: "digital" },
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
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Buy/Sell Tabs */}
        <div className="flex gap-0 mb-8 border-b">
          <button
            onClick={() => setActiveTab("buy")}
            className={`flex-1 py-4 px-6 font-semibold text-lg transition-colors relative ${
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
            className={`flex-1 py-4 px-6 font-semibold text-lg transition-colors relative ${
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
                  <selectedCryptoData.icon className="h-6 w-6 text-orange-500" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {cryptocurrencies.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                    <div className="flex items-center gap-3">
                      <crypto.icon className="h-5 w-5 text-orange-500" />
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
          <Button 
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
            onClick={fetchOffers}
          >
            Find Offers
            <RotateCw className={`ml-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

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
              <div className="grid gap-4">
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
                              <span className="text-base">🇳🇬</span>
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
                        <div className="grid grid-cols-2 gap-4">
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

          {/* Educational Content */}
          <Card className="mt-8">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bitcoin className="h-12 w-12 text-primary" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center">
                How to {activeTab === "buy" ? "Buy" : "Sell"} Bitcoin on Pexly
              </h2>

              <p className="text-muted-foreground text-center">
                {activeTab === "buy" ? (
                  <>
                    It's now easy to buy Bitcoin on Pexly. You have access to over 300 payment 
                    options to purchase Bitcoin. As Pexly is a peer-to-peer marketplace, you can 
                    buy Bitcoin directly from over 3 million users worldwide. Our platform makes it 
                    extremely easy for beginners and veterans alike to start trading.
                  </>
                ) : (
                  <>
                    It's now easy to sell Bitcoin as a Pexly vendor. You have the freedom to set your own rates, 
                    and also the luxury of over 300 payment options to get paid for the Bitcoin you sell. As Pexly 
                    is a peer-to-peer marketplace, you can sell your Bitcoin directly to over 3 million users worldwide. 
                    Our platform makes it extremely easy for beginners and veterans alike to make a profit.
                  </>
                )}
              </p>

              <div className="space-y-4 mt-6">
                <p className="text-sm text-muted-foreground">
                  To {activeTab === "buy" ? "buy" : "sell"} Bitcoin instantly,{" "}
                  <a href="#" className="text-primary hover:underline">create a Pexly account</a>
                  {" "}or{" "}
                  <a href="#" className="text-primary hover:underline">log in to your existing one</a>
                  . Once logged in, just follow these steps:
                </p>

                <ol className="space-y-4 list-decimal list-inside">
                  <li className="text-sm">
                    <span className="font-semibold">Set your requirements</span> – Choose your preferred 
                    payment method and the {activeTab === "buy" ? "amount of Bitcoin you want to buy" : "maximum amount of Bitcoin you're willing to sell"}. You may also 
                    indicate your location and your preferred currency. Once you're done, click{" "}
                    <span className="font-semibold">Search For Offers</span>. You will see a list of 
                    relevant offers to choose from.
                  </li>
                  <li className="text-sm">
                    <span className="font-semibold">Review offers</span> – Before selecting an offer, 
                    be sure to check all vital information about the {activeTab === "buy" ? "seller" : "buyer"}, including but not limited to 
                    their name, reputation, verification level, and rate per Bitcoin. Once you've found a 
                    suitable offer, click <span className="font-semibold">{activeTab === "buy" ? "Buy" : "Sell"}</span>. It won't open a 
                    trade yet, but will guide you through the offer terms and conditions set by the {activeTab === "buy" ? "seller" : "buyer"}.
                  </li>
                  <li className="text-sm">
                    <span className="font-semibold">Start the trade</span> – If you are satisfied with 
                    the {activeTab === "buy" ? "seller's" : "buyer's"} terms, enter the amount you're willing to trade for and click{" "}
                    <span className="font-semibold">{activeTab === "buy" ? "Buy" : "Sell"} Now</span>. This will open a live trade chat 
                    and move {activeTab === "buy" ? "the seller's" : "your"} Bitcoin to our secured escrow. Read the instructions provided carefully, 
                    and follow them. {activeTab === "buy" ? "Once you complete your payment and the seller confirms, you can receive the Bitcoin." : "Once your buyer completes their end of the trade and you receive the payment, you can release the Bitcoin."} You can download a public receipt after the trade.
                  </li>
                  <li className="text-sm">
                    <span className="font-semibold">Leave feedback</span> – After successfully {activeTab === "buy" ? "buying" : "selling"} {" "}
                    your Bitcoin, don't forget to give your trade partner feedback. This is important for 
                    our platform as it helps build a user's reputation.
                  </li>
                </ol>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  For more information, watch our{" "}
                  <a href="#" className="text-primary hover:underline">detailed video tutorial</a>
                  {" "}on how to {activeTab === "buy" ? "buy" : "sell"} Bitcoin quickly. You can also create an offer to {activeTab === "buy" ? "buy" : "sell"} Bitcoin by 
                  following{" "}
                  <a href="#" className="text-primary hover:underline">our guide to creating an offer on Pexly</a>.
                </p>
              </div>

              <p className="text-sm text-center text-muted-foreground mt-6">
                Pexly peer-to-peer marketplace is easy to use, secured by escrow, and accessible across the globe. 
                Start trading today!
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}