import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bitcoin, Building2, Lock, Shield, Award, TrendingUp, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getCryptoPrices, convertToNGN } from "@/lib/crypto-prices";
import { useVerificationGuard } from "@/hooks/use-verification-guard";
import { canCreateOffer } from "@shared/verification-levels";
import { getMerchantLevel } from "@shared/merchant-levels";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CreateOfferAdvanced() {
  const { 
    checkCanCreateOffer, 
    isLevel0, 
    verificationLevel,
    levelConfig 
  } = useVerificationGuard();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("user_profiles")
        .select("merchant_status, verification_level")
        .eq("id", user.id)
        .single();

      return data;
    },
  });

  const { data: userOfferCount } = useQuery({
    queryKey: ["userOfferCount"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count } = await supabase
        .from("p2p_offers")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("is_active", true);

      return count || 0;
    },
  });

  const merchantStatus = userProfile?.merchant_status || "none";
  const merchantLevel = getMerchantLevel(merchantStatus);
  const offerLimits = canCreateOffer(verificationLevel, merchantStatus);
  const [priceType, setPriceType] = useState<"fixed" | "floating">("floating");
  const [fixedPrice, setFixedPrice] = useState("");
  const [priceOffset, setPriceOffset] = useState([0]);
  const [crypto, setCrypto] = useState("BTC");
  const [offerType, setOfferType] = useState<"buy" | "sell">("sell");
  const [offerStatus, setOfferStatus] = useState<"online" | "private">("online");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [country, setCountry] = useState("");
  const [minAmount, setMinAmount] = useState("14777");
  const [maxAmount, setMaxAmount] = useState("147769");
  const [totalQuantity, setTotalQuantity] = useState("");
  const [offerTerms, setOfferTerms] = useState("");
  const [offerLabel, setOfferLabel] = useState("");
  const [timeLimit, setTimeLimit] = useState("30");
  const [requireVerification, setRequireVerification] = useState(false);
  const [autoReply, setAutoReply] = useState("");
  const [minTradeCount, setMinTradeCount] = useState("0");
  const [allowNewTraders, setAllowNewTraders] = useState(true);
  const [blockList, setBlockList] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marketRate, setMarketRate] = useState(0);
  const [loading, setLoading] = useState(true);

  // Counterparty requirements
  const [completedOrders, setCompletedOrders] = useState("60");
  const [completionRate, setCompletionRate] = useState("95");
  const [requireMobile, setRequireMobile] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);
  const [noTradesWithOthers, setNoTradesWithOthers] = useState(false);
  const [maxOrdersPerUser, setMaxOrdersPerUser] = useState("1");
  const [registeredFor, setRegisteredFor] = useState("15");
  const [regionRestrictions, setRegionRestrictions] = useState<string[]>([]);

  // Payment method selection
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
    const interval = setInterval(fetchLivePrices, 30000); // Update every 30 seconds

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

  const yourRate = priceType === "fixed" 
    ? parseFloat(fixedPrice) || marketRate
    : marketRate * (1 + priceOffset[0] / 100);

  const handleCreateOffer = async () => {
    if (!checkCanCreateOffer()) {
      toast({
        title: "Verification Required",
        description: `You need to be at least Level 1 to create offers. Please complete verification first.`,
        variant: "destructive",
      });
      setLocation("/verification");
      return;
    }

    // Check offer limits
    if (offerLimits.maxOffers && userOfferCount !== undefined && userOfferCount >= offerLimits.maxOffers) {
      toast({
        title: "Offer Limit Reached",
        description: `You have reached your limit of ${offerLimits.maxOffers} active offers. Deactivate an existing offer or upgrade to Merchant for more slots.`,
        variant: "destructive",
      });
      setLocation("/merchant-application");
      return;
    }

    if (!paymentMethod || !currency) {
      toast({
        title: "Missing Information",
        description: "Please select a payment method and currency",
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

      const { error } = await supabase.from("p2p_offers").insert({
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
        country_restrictions: country && country !== "ALL" ? [country] : null,
        // Payment method reference
        payment_method_id: selectedPaymentMethodId || null,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Offer Created!",
        description: "Your advanced offer has been successfully listed on the P2P marketplace",
      });

      setLocation("/p2p");
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/create-offer")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-4xl font-bold">Create Advanced Offer</h1>
          </div>
          <Badge variant="default">ADVANCED</Badge>
        </div>

        <p className="text-muted-foreground mb-8">
          Create a detailed P2P offer with advanced settings and custom requirements.
        </p>

        {/* Verification Alert */}
        {isLevel0 && (
          <Alert className="mb-6 border-orange-500/50 bg-orange-500/10">
            <Lock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <p className="font-semibold mb-1">Cannot Create Offers</p>
              <p className="text-sm">
                Level 0 users cannot create offers. Please{" "}
                <button 
                  onClick={() => setLocation("/verification")}
                  className="underline font-semibold hover:text-orange-900"
                >
                  complete verification
                </button>{" "}
                to Level 1 or higher to start creating offers.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {!isLevel0 && levelConfig && (
          <Alert className="mb-6 border-green-500/50 bg-green-500/10">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <p className="font-semibold mb-1">You can create offers - {levelConfig.name}</p>
              <p className="text-sm">
                Your verification level allows you to create and publish offers on the P2P marketplace.
              </p>
              {merchantStatus !== "none" && (
                <p className="text-sm mt-2">
                  <strong>{merchantLevel.name}</strong> - {offerLimits.maxOffers ? `Up to ${offerLimits.maxOffers} offers` : "Unlimited offers"} • {offerLimits.feePercentage}% trading fees
                </p>
              )}
              {merchantStatus === "none" && offerLimits.maxOffers && (
                <p className="text-sm mt-2">
                  You can create up to <strong>{offerLimits.maxOffers} active offers</strong>. 
                  <button 
                    onClick={() => setLocation("/merchant-application")}
                    className="underline ml-1 font-semibold hover:text-green-900"
                  >
                    Upgrade to Merchant
                  </button> for more offers and lower fees.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Merchant Upgrade Tabs - Only show for regular users */}
        {!isLevel0 && merchantStatus === "none" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Become an Advertiser
              </CardTitle>
              <CardDescription>
                Unlock enhanced benefits: more offers, lower fees, and priority placement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="verified" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="verified" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Verified Merchant
                  </TabsTrigger>
                  <TabsTrigger value="block" className="gap-2">
                    <Award className="h-4 w-4" />
                    Block Merchant
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="verified" className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">Security Deposit</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Refundable anytime</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">$200</div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Benefits Include:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Up to 50 active offers</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>0.5% trading fees (50% discount)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Verified Merchant badge</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Priority customer support</span>
                      </li>
                    </ul>
                  </div>

                  <Button 
                    onClick={() => setLocation("/merchant-application")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Apply for Verified Merchant
                  </Button>
                </TabsContent>

                <TabsContent value="block" className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div>
                      <p className="font-semibold text-purple-900 dark:text-purple-100">Security Deposit</p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">Refundable anytime</p>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">$500</div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Premium Benefits:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Unlimited active offers</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>0% trading fees (free forever)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Top priority placement</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Exclusive Block Merchant badge</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Premium support & perks</span>
                      </li>
                    </ul>
                  </div>

                  <Button 
                    onClick={() => setLocation("/merchant-application")}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                  >
                    Apply for Block Merchant
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {!isLevel0 && offerLimits.maxOffers && userOfferCount !== undefined && userOfferCount >= offerLimits.maxOffers && (
          <Alert className="mb-6 border-orange-500/50 bg-orange-500/10">
            <Lock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <p className="font-semibold mb-1">Offer Limit Reached</p>
              <p className="text-sm">
                You have {userOfferCount} active offers out of {offerLimits.maxOffers} allowed. 
                Deactivate an existing offer or{" "}
                <button 
                  onClick={() => setLocation("/merchant-application")}
                  className="underline font-semibold hover:text-orange-900"
                >
                  upgrade to Merchant
                </button>{" "}
                for more offer slots.
              </p>
            </AlertDescription>
          </Alert>
        )}

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
                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                <SelectItem value="USDT">Tether (USDT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment & Currency */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              {offerType === "buy" ? "I will pay with" : "I want"}
            </Label>
            <div className="space-y-3">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12 bg-elevate-1">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Cash App">Cash App</SelectItem>
                  <SelectItem value="Zelle">Zelle</SelectItem>
                </SelectContent>
              </Select>

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

          {/* Price Type Selection */}
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
              </CardContent>
            </Card>
          </div>

          {/* Offer Status */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Offer Status</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={offerStatus === "online" ? "default" : "outline"}
                className="h-12"
                onClick={() => setOfferStatus("online")}
              >
                Online
              </Button>
              <Button
                type="button"
                variant={offerStatus === "private" ? "default" : "outline"}
                className="h-12"
                onClick={() => setOfferStatus("private")}
              >
                Private
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {offerStatus === "online" 
                ? "Your offer will be visible to all users" 
                : "Your offer will only be visible to users you share the link with"}
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

          {/* Limit section */}
          <div>
            <Label className="text-sm text-muted-foreground mb-4 block">
              Trade limits
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Minimum</Label>
                <Input 
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="bg-elevate-1 text-center text-lg font-bold"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Maximum</Label>
                <Input 
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="bg-elevate-1 text-center text-lg font-bold"
                />
              </div>
            </div>
          </div>

          {/* Bank Payment Method Selection */}
          {paymentMethod === "Bank Transfer" && (
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

          {/* Advanced Settings */}
          <Card className="bg-elevate-1 border-border">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-bold">Advanced Settings</h3>

              {/* Offer Label */}
              <div>
                <Label className="text-sm mb-2 block">Offer Label (Optional)</Label>
                <Input 
                  value={offerLabel}
                  onChange={(e) => setOfferLabel(e.target.value)}
                  placeholder="e.g., Fast & Reliable"
                  className="bg-elevate-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add a short label to make your offer stand out
                </p>
              </div>

              {/* Payment Time Limit */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Payment Time Limit (minutes)</Label>
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
              </div>

              {/* Auto Reply */}
              <div>
                <Label className="text-sm mb-2 block">Auto Reply Message</Label>
                <Textarea 
                  value={autoReply}
                  onChange={(e) => setAutoReply(e.target.value)}
                  placeholder="This message will be sent automatically when a trade starts..."
                  className="bg-elevate-1 min-h-20"
                />
              </div>

              {/* Offer Terms */}
              <div>
                <Label className="text-sm mb-2 block">Offer Terms & Conditions</Label>
                <Textarea 
                  value={offerTerms}
                  onChange={(e) => setOfferTerms(e.target.value)}
                  placeholder="Enter your trading terms and conditions..."
                  className="bg-elevate-1 min-h-32"
                />
              </div>

              {/* Counterparty Requirements */}
              <div className="space-y-4">
                <h4 className="font-semibold">Requirements for Counterparty</h4>
                <p className="text-xs text-muted-foreground">
                  This setting allows you to screen out credible counterparties but may also reduce the exposure of your advertisements.
                </p>

                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="completed-orders"
                    checked={completedOrders !== "0"}
                    onCheckedChange={(checked) => setCompletedOrders(checked ? "60" : "0")}
                  />
                  <div className="flex-1">
                    <Label htmlFor="completed-orders" className="text-sm">
                      Completed Order(s) in 30 Days≥
                    </Label>
                    {completedOrders !== "0" && (
                      <Select value={completedOrders} onValueChange={setCompletedOrders}>
                        <SelectTrigger className="mt-2 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="60">60</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="completion-rate"
                    checked={completionRate !== "0"}
                    onCheckedChange={(checked) => setCompletionRate(checked ? "95" : "0")}
                  />
                  <div className="flex-1">
                    <Label htmlFor="completion-rate" className="text-sm">
                      30-Day Order Completion Rate (%)≥
                    </Label>
                    {completionRate !== "0" && (
                      <Select value={completionRate} onValueChange={setCompletionRate}>
                        <SelectTrigger className="mt-2 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50%</SelectItem>
                          <SelectItem value="75">75%</SelectItem>
                          <SelectItem value="85">85%</SelectItem>
                          <SelectItem value="95">95%</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="mobile-linked"
                    checked={requireMobile}
                    onCheckedChange={setRequireMobile}
                  />
                  <Label htmlFor="mobile-linked" className="text-sm">
                    Mobile No. Linked
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="email-linked"
                    checked={requireEmail}
                    onCheckedChange={setRequireEmail}
                  />
                  <Label htmlFor="email-linked" className="text-sm">
                    Email Linked
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="require-verification"
                    checked={requireVerification}
                    onCheckedChange={setRequireVerification}
                  />
                  <Label htmlFor="require-verification" className="text-sm">
                    Require Identity Verification
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="no-trades"
                    checked={noTradesWithOthers}
                    onCheckedChange={setNoTradesWithOthers}
                  />
                  <Label htmlFor="no-trades" className="text-sm">
                    No Trades With Other Advertisers
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="max-orders"
                    checked={maxOrdersPerUser !== "999"}
                    onCheckedChange={(checked) => setMaxOrdersPerUser(checked ? "1" : "999")}
                  />
                  <div className="flex-1">
                    <Label htmlFor="max-orders" className="text-sm">
                      Each user can place up to orders on this ad.≥
                    </Label>
                    {maxOrdersPerUser !== "999" && (
                      <Select value={maxOrdersPerUser} onValueChange={setMaxOrdersPerUser}>
                        <SelectTrigger className="mt-2 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="registered-for"
                    checked={registeredFor !== "0"}
                    onCheckedChange={(checked) => setRegisteredFor(checked ? "15" : "0")}
                  />
                  <div className="flex-1">
                    <Label htmlFor="registered-for" className="text-sm">
                      Registered For≥
                    </Label>
                    {registeredFor !== "0" && (
                      <Select value={registeredFor} onValueChange={setRegisteredFor}>
                        <SelectTrigger className="mt-2 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="15">15 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="region-restrictions"
                    checked={regionRestrictions.length > 0}
                    onCheckedChange={(checked) => setRegionRestrictions(checked ? [] : [])}
                  />
                  <div className="flex-1">
                    <Label htmlFor="region-restrictions" className="text-sm">
                      Only available to users from select regions.
                    </Label>
                    {regionRestrictions.length > 0 && (
                      <Select>
                        <SelectTrigger className="mt-2 bg-background">
                          <SelectValue placeholder="Please Select" />
                        </SelectTrigger>
                        <SelectContent>
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
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Block List (Optional)</Label>
                  <Textarea 
                    value={blockList}
                    onChange={(e) => setBlockList(e.target.value)}
                    placeholder="Enter usernames to block, separated by commas..."
                    className="bg-background"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>ⓘ</span>
                  <p>
                    Once the Identity Verification is completed, you can easily place an order on the P2P trading platform without any extra setup.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee info */}
          <Card className="bg-elevate-1 border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-medium">Pexly fee:</span>
              <span className="font-bold">0.75% for each trade</span>
            </CardContent>
          </Card>

          {/* Submit button */}
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6"
            onClick={handleCreateOffer}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating offer..." : "Place Advanced Offer"}
          </Button>
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}