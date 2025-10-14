import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PexlyFooter } from "@/components/pexly-footer";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDownUp, Edit, Bitcoin, Building2, Search, Menu, Wallet, CreditCard, Gift, Smartphone, Coins, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { getCryptoPrices, convertToNGN } from "@/lib/crypto-prices";
import { cn } from "@/lib/utils";

export function CreateOffer() {
  const [priceType, setPriceType] = useState<"fixed" | "floating">("floating");
  const [fixedPrice, setFixedPrice] = useState("");
  const [priceOffset, setPriceOffset] = useState([0]);
  const [crypto, setCrypto] = useState("BTC");
  const [offerType, setOfferType] = useState<"buy" | "sell">("sell");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [country, setCountry] = useState("");
  const [minAmount, setMinAmount] = useState("14777");
  const [maxAmount, setMaxAmount] = useState("147769");
  const [totalQuantity, setTotalQuantity] = useState("");
  const [timeLimit, setTimeLimit] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marketRate, setMarketRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/edit-offer/:offerId");
  const offerId = params?.offerId;
  const isEditMode = !!offerId;

  useEffect(() => {
    const fetchLivePrices = async () => {
      setLoading(true);
      const prices = await getCryptoPrices([crypto]);
      if (prices[crypto]) {
        const priceInNGN = currency === "NGN" 
          ? convertToNGN(prices[crypto].current_price)
          : prices[crypto].current_price;
        setMarketRate(priceInNGN);
      }
      setLoading(false);
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 30000);

    return () => clearInterval(interval);
  }, [crypto, currency]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', user.id)
            .eq('payment_type', 'Bank Transfer');

          if (!error && data) {
            setPaymentMethods(data);
          }
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Load existing offer when in edit mode
  useEffect(() => {
    if (isEditMode && offerId) {
      const loadOffer = async () => {
        try {
          setLoading(true);
          const supabase = createClient();
          const { data, error } = await supabase
            .from("p2p_offers")
            .select("*")
            .eq("id", offerId)
            .single();

          if (error) {
            console.error("Error loading offer:", error);
            toast({
              title: "Error",
              description: "Failed to load offer",
              variant: "destructive",
            });
            setLocation("/my-offers");
            return;
          }

          if (data) {
            // Pre-fill form with existing offer data
            setOfferType(data.offer_type);
            setCrypto(data.crypto_symbol);
            setPaymentMethod(Array.isArray(data.payment_methods) ? data.payment_methods[0] : data.payment_methods);
            setCurrency(data.fiat_currency);
            setCountry(data.country || "");
            setMinAmount(data.min_amount.toString());
            setMaxAmount(data.max_amount.toString());
            setTotalQuantity(data.available_amount.toString());
            setTimeLimit(data.time_limit?.toString() || "30");

            if (data.fixed_price) {
              setPriceType("fixed");
              setFixedPrice(data.fixed_price.toString());
            } else if (data.price_offset !== undefined) {
              setPriceType("floating");
              setPriceOffset([data.price_offset]);
            }
          }
        } catch (error) {
          console.error("Error loading offer:", error);
          toast({
            title: "Error",
            description: "Failed to load offer",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      loadOffer();
    }
  }, [isEditMode, offerId]);

  const yourRate = priceType === "fixed" 
    ? parseFloat(fixedPrice) || marketRate
    : marketRate * (1 + priceOffset[0] / 100);

  const paymentCategories = [
    { id: "all", name: "All payment methods" },
    { id: "bank", name: "Bank transfers" },
    { id: "wallet", name: "Online wallets" },
    { id: "card", name: "Debit/credit cards" },
    { id: "gift", name: "Gift cards" },
    { id: "digital", name: "Digital currencies" },
    { id: "goods", name: "Goods and services" },
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

  const handleCreateOffer = async () => {
    if (!paymentMethod || !currency) {
      toast({
        title: "Missing Information",
        description: "Please select a payment method and currency",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod && !selectedPaymentMethodId && paymentMethods.length > 0) {
      toast({
        title: "Bank Account Required",
        description: "Please select a bank account for your payment method",
        variant: "destructive",
      });
      return;
    }

    const minAmountNum = parseFloat(minAmount);
    const maxAmountNum = parseFloat(maxAmount);

    if (isNaN(minAmountNum) || isNaN(maxAmountNum) || minAmountNum <= 0 || maxAmountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter valid minimum and maximum amounts",
        variant: "destructive",
      });
      return;
    }

    if (minAmountNum > maxAmountNum) {
      toast({
        title: "Invalid Range",
        description: "Minimum amount cannot be greater than maximum amount",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsSubmitting(false);
        toast({
          title: "Authentication Required",
          description: "Please sign in to create an offer",
          variant: "destructive",
        });
        setLocation("/signin");
        return;
      }

      const totalQuantityNum = totalQuantity ? parseFloat(totalQuantity) : null;

      const offerData = {
        user_id: user.id,
        offer_type: offerType,
        crypto_symbol: crypto,
        payment_methods: [paymentMethod],
        fiat_currency: currency,
        price_type: priceType,
        fixed_price: priceType === "fixed" ? parseFloat(fixedPrice) : null,
        floating_margin: priceType === "floating" ? priceOffset[0] : null,
        min_amount: minAmountNum,
        max_amount: maxAmountNum,
        available_amount: maxAmountNum,
        total_quantity: totalQuantityNum,
        country_restrictions: country ? [country] : null,
        payment_method_id: selectedPaymentMethodId || null,
        time_limit_minutes: parseInt(timeLimit),
        is_active: true,
      };

      let error;
      if (isEditMode && offerId) {
        // Update existing offer
        const result = await supabase
          .from("p2p_offers")
          .update(offerData)
          .eq("id", offerId);
        error = result.error;
      } else {
        // Create new offer
        const result = await supabase.from("p2p_offers").insert(offerData);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: isEditMode ? "Offer Updated!" : "Offer Created!",
        description: isEditMode 
          ? "Your offer has been successfully updated" 
          : "Your offer has been successfully listed on the P2P marketplace",
      });

      setLocation("/my-offers");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create offer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">{isEditMode ? "Edit offer" : "Create an offer"}</h1>
          <Badge variant="outline">LITE</Badge>
        </div>

        <p className="text-muted-foreground mb-8">
          {isEditMode 
            ? "Update your offer details below." 
            : <>List your ad in our P2P marketplace. More settings in the{" "}
                <button 
                  onClick={() => setLocation("/create-offer-advanced")} 
                  className="underline text-primary hover:text-primary/80"
                >
                  advanced version
                </button>.</>
          }
        </p>

        <div className="space-y-6">
          {/* Offer Type Selection */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Offer Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={offerType === "buy" ? "default" : "outline"}
                className="h-12"
                onClick={() => setOfferType("buy")}
              >
                Buy
              </Button>
              <Button
                type="button"
                variant={offerType === "sell" ? "default" : "outline"}
                className="h-12"
                onClick={() => setOfferType("sell")}
              >
                Sell
              </Button>
            </div>
          </div>

          {/* Cryptocurrency Selection */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              {offerType === "buy" ? "I want to buy" : "I have"}
            </Label>
            <Select value={crypto} onValueChange={setCrypto}>
              <SelectTrigger className="h-12 bg-elevate-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">
                  <div className="flex items-center gap-3">
                    <Bitcoin className="h-5 w-5 text-orange-500" />
                    <span>Bitcoin (BTC)</span>
                  </div>
                </SelectItem>
                <SelectItem value="ETH">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">Ξ</span>
                    <span>Ethereum (ETH)</span>
                  </div>
                </SelectItem>
                <SelectItem value="USDT">
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-green-600">₮</span>
                    <span>Tether (USDT)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* I want section */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              {offerType === "buy" ? "I will pay with" : "I want"}
            </Label>
            <div className="space-y-3">
              <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
                <DialogTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder={paymentMethod || "Select payment method"}
                      className="pl-10 pr-12 h-12 bg-elevate-1 text-base cursor-pointer"
                      readOnly
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-accent rounded-md transition-colors">
                      <Menu className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
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
                          placeholder="Search"
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
                          setPaymentSearchQuery("");
                          setSelectedCategory("all");
                        }}
                      >
                        Clear Filter
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
                              <h3 className="text-sm font-semibold mb-3 capitalize">
                                {category.name}
                              </h3>
                              <div className="grid grid-cols-2 gap-2">
                                {categoryMethods.map((method) => (
                                  <button
                                    key={method.id}
                                    onClick={() => {
                                      setPaymentMethod(method.name);
                                      setOpenPaymentDialog(false);
                                    }}
                                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                                  >
                                    <method.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                                    <span className="text-sm">{method.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {allPaymentMethods
                            .filter(
                              (method) => 
                                method.category === selectedCategory &&
                                method.name.toLowerCase().includes(paymentSearchQuery.toLowerCase())
                            )
                            .map((method) => (
                              <button
                                key={method.id}
                                onClick={() => {
                                  setPaymentMethod(method.name);
                                  setOpenPaymentDialog(false);
                                }}
                                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                              >
                                <method.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                                <span className="text-sm">{method.name}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-12 bg-elevate-1">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">🇳🇬 Nigerian Naira (NGN)</SelectItem>
                  <SelectItem value="USD">🇺🇸 US Dollar (USD)</SelectItem>
                  <SelectItem value="GBP">🇬🇧 British Pound (GBP)</SelectItem>
                  <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
                  <SelectItem value="CAD">🇨🇦 Canadian Dollar (CAD)</SelectItem>
                  <SelectItem value="INR">🇮🇳 Indian Rupee (INR)</SelectItem>
                  <SelectItem value="KES">🇰🇪 Kenyan Shilling (KES)</SelectItem>
                  <SelectItem value="GHS">🇬🇭 Ghanaian Cedi (GHS)</SelectItem>
                  <SelectItem value="ZAR">🇿🇦 South African Rand (ZAR)</SelectItem>
                  <SelectItem value="AUD">🇦🇺 Australian Dollar (AUD)</SelectItem>
                  <SelectItem value="CNY">🇨🇳 Chinese Yuan (CNY)</SelectItem>
                  <SelectItem value="JPY">🇯🇵 Japanese Yen (JPY)</SelectItem>
                  <SelectItem value="PHP">🇵🇭 Philippine Peso (PHP)</SelectItem>
                  <SelectItem value="IDR">🇮🇩 Indonesian Rupiah (IDR)</SelectItem>
                  <SelectItem value="MYR">🇲🇾 Malaysian Ringgit (MYR)</SelectItem>
                  <SelectItem value="SGD">🇸🇬 Singapore Dollar (SGD)</SelectItem>
                  <SelectItem value="THB">🇹🇭 Thai Baht (THB)</SelectItem>
                  <SelectItem value="VND">🇻🇳 Vietnamese Dong (VND)</SelectItem>
                  <SelectItem value="AED">🇦🇪 UAE Dirham (AED)</SelectItem>
                  <SelectItem value="SAR">🇸🇦 Saudi Riyal (SAR)</SelectItem>
                  <SelectItem value="EGP">🇪🇬 Egyptian Pound (EGP)</SelectItem>
                  <SelectItem value="DZD">🇩🇿 Algerian Dinar (DZD)</SelectItem>
                  <SelectItem value="ETB">🇪🇹 Ethiopian Birr (ETB)</SelectItem>
                  <SelectItem value="BRL">🇧🇷 Brazilian Real (BRL)</SelectItem>
                  <SelectItem value="MXN">🇲🇽 Mexican Peso (MXN)</SelectItem>
                  <SelectItem value="ARS">🇦🇷 Argentine Peso (ARS)</SelectItem>
                  <SelectItem value="DOP">🇩🇴 Dominican Peso (DOP)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-12 bg-elevate-1">
                  <SelectValue placeholder="Country (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">🌍 Worldwide</SelectItem>
                  <SelectItem value="NG">🇳🇬 Nigeria</SelectItem>
                  <SelectItem value="US">🇺🇸 United States</SelectItem>
                  <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="GH">🇬🇭 Ghana</SelectItem>
                  <SelectItem value="KE">🇰🇪 Kenya</SelectItem>
                  <SelectItem value="ZA">🇿🇦 South Africa</SelectItem>
                  <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                  <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                  <SelectItem value="IN">🇮🇳 India</SelectItem>
                  <SelectItem value="PH">🇵🇭 Philippines</SelectItem>
                  <SelectItem value="ID">🇮🇩 Indonesia</SelectItem>
                  <SelectItem value="MY">🇲🇾 Malaysia</SelectItem>
                  <SelectItem value="SG">🇸🇬 Singapore</SelectItem>
                  <SelectItem value="TH">🇹🇭 Thailand</SelectItem>
                  <SelectItem value="VN">🇻🇳 Vietnam</SelectItem>
                  <SelectItem value="AE">🇦🇪 UAE</SelectItem>
                  <SelectItem value="SA">🇸🇦 Saudi Arabia</SelectItem>
                  <SelectItem value="EG">🇪🇬 Egypt</SelectItem>
                  <SelectItem value="DZ">🇩🇿 Algeria</SelectItem>
                  <SelectItem value="ET">🇪🇹 Ethiopia</SelectItem>
                  <SelectItem value="FR">🇫🇷 France</SelectItem>
                  <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                  <SelectItem value="IT">🇮🇹 Italy</SelectItem>
                  <SelectItem value="ES">🇪🇸 Spain</SelectItem>
                  <SelectItem value="BR">🇧🇷 Brazil</SelectItem>
                  <SelectItem value="MX">🇲🇽 Mexico</SelectItem>
                  <SelectItem value="AR">🇦🇷 Argentina</SelectItem>
                  <SelectItem value="DO">🇩🇴 Dominican Republic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Offer Type Selection */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Price Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={priceType === "fixed" ? "default" : "outline"}
                className="h-12"
                onClick={() => setPriceType("fixed")}
              >
                Fixed Price
              </Button>
              <Button
                type="button"
                variant={priceType === "floating" ? "default" : "outline"}
                className="h-12"
                onClick={() => setPriceType("floating")}
              >
                Floating Price
              </Button>
            </div>
          </div>

          {/* Price section */}
          <div>
            <Label className="text-sm text-muted-foreground mb-4 block">Set price</Label>
            <Card className="bg-elevate-1 border-border">
              <CardContent className="p-6">
                {priceType === "fixed" ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm mb-2 block">Fixed Price</Label>
                      <Input
                        type="number"
                        value={fixedPrice}
                        onChange={(e) => setFixedPrice(e.target.value)}
                        placeholder="Enter fixed price"
                        className="bg-background"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPriceOffset([Math.max(-10, priceOffset[0] - 1)])}
                      >
                        -1%
                      </Button>
                      <span className="text-lg font-bold">
                        {priceOffset[0] > 0 ? "+" : ""}{priceOffset[0]}%
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPriceOffset([Math.min(100, priceOffset[0] + 1)])}
                      >
                        +1%
                      </Button>
                    </div>
                    <Slider
                      value={priceOffset}
                      onValueChange={setPriceOffset}
                      min={-10}
                      max={100}
                      step={0.1}
                      className="mb-6"
                    />
                  </>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market rate ({crypto}):</span>
                    <span className="font-mono">
                      {loading ? "Loading..." : `${marketRate.toFixed(2)} ${currency}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your rate ({crypto}):</span>
                    <span className="font-bold font-mono">{yourRate.toFixed(2)} {currency}</span>
                  </div>
                </div>
                {priceType === "floating" && (
                  <p className="text-xs text-muted-foreground mt-4">
                    *You will sell at <span className="font-bold">market price {priceOffset[0] > 0 ? "+" : ""}{priceOffset[0]}%</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Time Limit */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Payment Time Limit</Label>
            <Select value={timeLimit} onValueChange={setTimeLimit}>
              <SelectTrigger className="h-12 bg-elevate-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Time allowed for the buyer to complete payment
            </p>
          </div>

          {/* Total Quantity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-muted-foreground">
                {offerType === "buy" 
                  ? `Total amount you plan to buy (${crypto})` 
                  : `Total amount of ${crypto} you intend to sell`}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-primary hover:text-primary/80"
                onClick={() => setTotalQuantity(maxAmount)}
              >
                Max
              </Button>
            </div>
            <Input 
              type="number"
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(e.target.value)}
              placeholder={offerType === "buy" ? "Enter total amount to buy" : "Enter total amount to sell"}
              className="bg-elevate-1 text-lg font-bold"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {offerType === "buy" 
                ? "The total amount of cryptocurrency you want to purchase" 
                : "The total amount from your wallet you're willing to sell"}
            </p>
          </div>

          {/* Bank Payment Method Selection */}
          {paymentMethod && (
            <Card className="bg-elevate-1 border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Bank Payment Method</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation("/account-settings")}
                  >
                    Add New Bank
                  </Button>
                </div>

                {paymentMethods.length > 0 ? (
                  <div>
                    <Label className="text-sm mb-2 block">Select Bank Account</Label>
                    <Select value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Choose a bank account" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.bank_name} - {method.account_number} ({method.account_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No bank accounts added yet</p>
                    <Button 
                      variant="outline"
                      onClick={() => setLocation("/account-settings")}
                    >
                      Add Bank Account in Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Limit section */}
          <div>
            <Label className="text-sm text-muted-foreground mb-4 block">
              Limit your offer to
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input 
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="bg-elevate-1 text-center text-lg font-bold"
                />
                <p className="text-xs text-muted-foreground text-center mt-1">
                  ≈0.00008331 {crypto}
                </p>
              </div>
              <div>
                <Input 
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="bg-elevate-1 text-center text-lg font-bold"
                />
                <p className="text-xs text-muted-foreground text-center mt-1">
                  ≈0.00083309 {crypto}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Checkbox id="exact-amounts" />
              <Label htmlFor="exact-amounts" className="text-sm">
                Use exact amounts
              </Label>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center py-4">
            We can't estimate your offer position at the moment. 
            Create an offer to view it in your offer list.
          </p>

          {/* Fee info */}
          <Card className="bg-elevate-1 border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-medium">Pexly fee:</span>
              <span className="font-bold">0.75% for each trade</span>
            </CardContent>
          </Card>

          {/* Offer terms */}
          <Button variant="ghost" className="w-full text-primary">
            Offer terms
          </Button>

          {/* Submit button */}
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6"
            onClick={handleCreateOffer}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isEditMode ? "Updating offer..." : "Creating offer...") 
              : (isEditMode ? "Update offer" : "Place an offer")}
          </Button>
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}