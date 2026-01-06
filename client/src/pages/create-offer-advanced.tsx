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
import { getCryptoPrices, getRealtimeCryptoPrices, convertToNGN, getOfferLimits, calculateFloatingPrice, getPriceRange, getExchangeRates } from "@/lib/crypto-prices";
import { useVerificationGuard } from "@/hooks/use-verification-guard";
import { canCreateOffer } from "@shared/verification-levels";
import { getMerchantLevel } from "@shared/merchant-levels";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PexlyFooter } from "@/components/pexly-footer";
import { getCountryInfo } from "@/lib/localization";

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
        .select("merchant_status, verification_level, country, preferred_currency")
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
  const [currency, setCurrency] = useState("USD");
  const [country, setCountry] = useState("");
  const [currencyInitialized, setCurrencyInitialized] = useState(false);
  const [minAmount, setMinAmount] = useState("3");
  const [maxAmount, setMaxAmount] = useState("50000");
  const [totalQuantity, setTotalQuantity] = useState("");
  const [quantityInputMode, setQuantityInputMode] = useState<"crypto" | "fiat">("crypto");
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
  const [marketRateUSD, setMarketRateUSD] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [premiumInput, setPremiumInput] = useState("");

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
    const defaultValue = 0;
    setPriceOffset([defaultValue]);
    setPremiumInput(defaultValue.toFixed(1));
  }, [offerType]);

  // Set currency based on user's preferred currency or country
  useEffect(() => {
    if (!currencyInitialized && userProfile) {
      if (userProfile.preferred_currency) {
        setCurrency(userProfile.preferred_currency.toUpperCase());
      } else if (userProfile.country) {
        const countryInfo = getCountryInfo(userProfile.country);
        setCurrency(countryInfo.currencyCode);
      }
      setCurrencyInitialized(true);
    }
  }, [userProfile, currencyInitialized]);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (currency !== "USD") {
        const rates = await getExchangeRates();
        setExchangeRate(rates[currency] || 1);
      } else {
        setExchangeRate(1);
      }
    };
    fetchExchangeRate();
  }, [currency]);

  // Auto-update min/max amounts when currency changes
  useEffect(() => {
    const updateLimitsForCurrency = async () => {
      try {
        const limits = await getOfferLimits(currency);
        setMinAmount(Math.round(limits.min).toString());
        setMaxAmount(Math.round(limits.max).toString());
      } catch (error) {
        console.error('Error fetching currency limits:', error);
      }
    };
    updateLimitsForCurrency();
  }, [currency]);

  useEffect(() => {
    const fetchLivePrices = async () => {
      if (loading) setLoading(true);

      const prices = await getRealtimeCryptoPrices([crypto]);
      if (prices[crypto]) {
        const usdPrice = prices[crypto].current_price;
        setMarketRateUSD(usdPrice);

        const priceInCurrency = usdPrice * exchangeRate;
        setMarketRate(priceInCurrency);
        setLastUpdated(new Date());
      }
      setLoading(false);
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 3000);

    return () => clearInterval(interval);
  }, [crypto, currency, exchangeRate]);

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
    : calculateFloatingPrice(marketRate, priceOffset[0]);

  const marginLimits = offerType === "buy" 
    ? { min: -3, max: 0 }  
    : { min: 0, max: 5 };   

  const priceRange = getPriceRange(marketRate, marginLimits.min, marginLimits.max);

  const handlePremiumInputChange = (value: string) => {
    setPremiumInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= marginLimits.min && numValue <= marginLimits.max) {
      setPriceOffset([numValue]);
    }
  };

  const handlePremiumSliderChange = (value: number[]) => {
    setPriceOffset(value);
    setPremiumInput(value[0].toFixed(1));
  };

  const handleCreateOffer = async () => {
    if (!checkCanCreateOffer().allowed) {
      toast({
        title: "Verification Required",
        description: checkCanCreateOffer().reason || "You need to be at least Level 2 to create offers. Please complete verification first.",
        variant: "destructive",
      });
      setLocation("/verification");
      return;
    }

    // Check offer limits only when creating new offers (skip when editing)
    // Note: Advanced mode doesn't have edit functionality yet, but adding for consistency
    if (offerLimits.maxOffers && userOfferCount !== undefined && userOfferCount >= offerLimits.maxOffers) {
      toast({
        title: "Offer Limit Reached",
        description: `You have ${userOfferCount} active offers out of ${offerLimits.maxOffers} allowed. Please deactivate an existing offer or upgrade to Merchant for unlimited offers.`,
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
    const totalQuantityNum = totalQuantity ? parseFloat(totalQuantity) : null;

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

    // Check if offer amount exceeds user's per-trade limit based on verification level
    const perTradeLimit = levelConfig.perTradeLimit;
    if (perTradeLimit && maxAmountNum > perTradeLimit) {
      toast({
        title: "Amount Exceeds Per-Trade Limit",
        description: `Your per-trade limit is ${perTradeLimit.toLocaleString()} ${currency}. You cannot create an offer with a maximum of ${maxAmountNum.toLocaleString()} ${currency}. Please reduce the maximum amount to ${perTradeLimit.toLocaleString()} ${currency} or less.`,
        variant: "destructive",
      });
      return;
    }

    // Validate wallet balance for SELL offers only
    // For BUY offers, total quantity can be any amount (no wallet balance check needed)
    if (offerType === "sell") {
      if (!totalQuantityNum || totalQuantityNum <= 0) {
        toast({
          title: "Total Quantity Required",
          description: `Please enter the total amount of ${crypto} you want to sell`,
          variant: "destructive",
        });
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .eq('crypto_symbol', crypto)
          .single();

        if (!wallet || !wallet.balance) {
          toast({
            title: "No Wallet Found",
            description: `You don't have a ${crypto} wallet yet`,
            variant: "destructive",
          });
          return;
        }

        const walletBalance = parseFloat(wallet.balance.toString());

        // Check minimum balance requirement
        const minBalanceRequired = 0.0001; // Minimum balance to create an offer
        if (walletBalance < minBalanceRequired) {
          toast({
            title: "Balance Too Low",
            description: `You need at least ${minBalanceRequired} ${crypto} to create a sell offer. Current balance: ${walletBalance} ${crypto}`,
            variant: "destructive",
          });
          return;
        }

        if (totalQuantityNum > walletBalance) {
          toast({
            title: "Insufficient Balance",
            description: `You only have ${walletBalance} ${crypto} available. Cannot create offer for ${totalQuantityNum} ${crypto}`,
            variant: "destructive",
          });
          return;
        }
      }
    } else if (offerType === "buy") {
      // For BUY offers, ensure a total quantity is entered but no wallet balance check
      if (!totalQuantityNum || totalQuantityNum <= 0) {
        toast({
          title: "Total Quantity Required",
          description: `Please enter the total amount of ${crypto} you want to buy`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const limits = await getOfferLimits(currency);

      if (minAmountNum < limits.min) {
        toast({
          title: "Amount Too Low",
          description: `Minimum amount must be at least ${limits.min.toLocaleString()} ${currency} ($3 USD equivalent)`,
          variant: "destructive",
        });
        return;
      }

      if (maxAmountNum > limits.max) {
        toast({
          title: "Amount Too High",
          description: `Maximum amount cannot exceed ${limits.max.toLocaleString()} ${currency} ($50,000 USD equivalent)`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      toast({
        title: "Currency Error",
        description: error instanceof Error ? error.message : "Unable to validate amount for selected currency",
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

      let totalQuantityNum = totalQuantity ? parseFloat(totalQuantity) : null;
      let fiatAmountToSave = totalQuantityNum;

      // For BUY offers: Convert crypto to fiat if user entered in crypto mode
      if (offerType === "buy" && quantityInputMode === "crypto" && totalQuantityNum && marketRate > 0) {
        fiatAmountToSave = totalQuantityNum * marketRate;
      }
      // If in fiat mode for BUY, fiatAmountToSave is already the correct value

      // For SELL offers: Always convert crypto amount to fiat for storage
      // Sell offers are always entered in crypto amount (BTC, ETH, etc.)
      if (offerType === "sell" && totalQuantityNum && marketRate > 0) {
        fiatAmountToSave = totalQuantityNum * marketRate;
      }

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
        available_amount: fiatAmountToSave, // Always save as fiat amount
        total_available: fiatAmountToSave, // Always save as fiat amount
        country_restrictions: country && country !== "ALL" ? [country] : null,
        // Payment method reference
        payment_method_id: selectedPaymentMethodId || null,
        time_limit_minutes: parseInt(timeLimit),
        offer_terms: offerTerms || null,
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
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-6 max-w-2xl lg:max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/create-offer")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl lg:text-4xl font-bold">Create Advanced Offer</h1>
          </div>
          <Badge variant="default" className="text-sm lg:text-base px-3 lg:px-4 py-1 lg:py-1.5">ADVANCED</Badge>
        </div>

        <p className="text-muted-foreground mb-8 text-base lg:text-lg">
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

        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
          {/* Left Column */}
          <div className="space-y-6 lg:space-y-8">
          {/* Offer Type Selection */}
          <div>
            <Label className="text-sm lg:text-base text-muted-foreground mb-3 block">Offer Type</Label>
            <div className="grid grid-cols-2 gap-3 lg:gap-4 max-w-md">
              <Button
                type="button"
                variant={offerType === "buy" ? "default" : "outline"}
                className="h-12 lg:h-14 text-base lg:text-lg"
                onClick={() => setOfferType("buy")}
              >
                Buy
              </Button>
              <Button
                type="button"
                variant={offerType === "sell" ? "default" : "outline"}
                className="h-12 lg:h-14 text-base lg:text-lg"
                onClick={() => setOfferType("sell")}
              >
                Sell
              </Button>
            </div>
          </div>

          {/* Cryptocurrency Selection */}
          <div>
            <Label className="text-sm lg:text-base text-muted-foreground mb-3 block">
              {offerType === "buy" ? "I want to buy" : "I have"}
            </Label>
            <Select value={crypto} onValueChange={setCrypto}>
              <SelectTrigger className="h-12 lg:h-14 bg-elevate-1 text-base max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png" 
                      alt="BTC" 
                      className="h-5 w-5 rounded-full object-contain"
                    />
                    <span>Bitcoin (BTC)</span>
                  </div>
                </SelectItem>
                <SelectItem value="ETH">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://assets.coingecko.com/coins/images/279/small/ethereum.png" 
                      alt="ETH" 
                      className="h-5 w-5 rounded-full object-contain"
                    />
                    <span>Ethereum (ETH)</span>
                  </div>
                </SelectItem>
                <SelectItem value="USDC">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://assets.coingecko.com/coins/images/6319/small/usdc.png" 
                      alt="USDC" 
                      className="h-5 w-5 rounded-full object-contain"
                    />
                    <span>USD Coin (USDC)</span>
                  </div>
                </SelectItem>
                <SelectItem value="USDT">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://assets.coingecko.com/coins/images/325/small/Tether.png" 
                      alt="USDT" 
                      className="h-5 w-5 rounded-full object-contain"
                    />
                    <span>Tether (USDT)</span>
                  </div>
                </SelectItem>
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

          {/* Total Quantity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-muted-foreground">
                {offerType === "buy" 
                  ? `Total amount you plan to buy` 
                  : `Total amount of ${crypto} you intend to sell`}
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-elevate-1 rounded-lg p-1">
                  <Button
                    type="button"
                    variant={quantityInputMode === "crypto" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => {
                      if (quantityInputMode === "fiat" && totalQuantity && marketRate > 0) {
                        const fiatAmount = parseFloat(totalQuantity);
                        if (!isNaN(fiatAmount)) {
                          const cryptoAmount = fiatAmount / marketRate;
                          setTotalQuantity(cryptoAmount.toFixed(8));
                        }
                      }
                      setQuantityInputMode("crypto");
                    }}
                  >
                    {crypto}
                  </Button>
                  <Button
                    type="button"
                    variant={quantityInputMode === "fiat" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => {
                      if (quantityInputMode === "crypto" && totalQuantity && marketRate > 0) {
                        const cryptoAmount = parseFloat(totalQuantity);
                        if (!isNaN(cryptoAmount)) {
                          const fiatAmount = cryptoAmount * marketRate;
                          setTotalQuantity(Math.round(fiatAmount).toString());
                        }
                      }
                      setQuantityInputMode("fiat");
                    }}
                  >
                    {currency}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-primary hover:text-primary/80"
                  onClick={async () => {
                    if (offerType === "sell") {
                      try {
                        const supabase = createClient();
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                          const { data: wallet } = await supabase
                            .from('wallets')
                            .select('balance')
                            .eq('user_id', user.id)
                            .eq('crypto_symbol', crypto)
                            .single();

                          if (wallet && wallet.balance) {
                            const balance = parseFloat(wallet.balance.toString());
                            if (quantityInputMode === "fiat" && marketRate > 0) {
                              const fiatEquivalent = balance * marketRate;
                              setTotalQuantity(Math.round(fiatEquivalent).toString());
                            } else {
                              setTotalQuantity(balance.toString());
                            }
                            toast({
                              title: "Wallet Balance Loaded",
                              description: `Available: ${balance} ${crypto}`,
                            });
                          } else {
                            toast({
                              title: "No Wallet Found",
                              description: `You don't have a ${crypto} wallet yet`,
                              variant: "destructive",
                            });
                          }
                        }
                      } catch (error) {
                        console.error('Error fetching wallet balance:', error);
                        toast({
                          title: "Error",
                          description: "Failed to fetch wallet balance",
                          variant: "destructive",
                        });
                      }
                    } else {
                      if (quantityInputMode === "fiat") {
                        setTotalQuantity(maxAmount);
                      } else {
                        if (marketRate > 0) {
                          const maxFiat = parseFloat(maxAmount);
                          const cryptoEquivalent = maxFiat / marketRate;
                          setTotalQuantity(cryptoEquivalent.toFixed(8));
                        }
                      }
                    }
                  }}
                >
                  Max
                </Button>
              </div>
            </div>
            <div className="relative">
              <Input 
                type="number"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                placeholder={
                  quantityInputMode === "crypto" 
                    ? `Enter amount in ${crypto}` 
                    : `Enter amount in ${currency}`
                }
                className="bg-elevate-1 text-lg font-bold pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                {quantityInputMode === "crypto" ? crypto : currency}
              </span>
            </div>
            {totalQuantity && marketRate > 0 && (
              <p className="text-sm text-primary mt-2 font-medium">
                {quantityInputMode === "crypto" 
                  ? `≈ ${(parseFloat(totalQuantity) * marketRate).toLocaleString()} ${currency}`
                  : `≈ ${(parseFloat(totalQuantity) / marketRate).toFixed(8)} ${crypto}`
                }
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {offerType === "buy" 
                ? "The total amount of cryptocurrency you want to purchase. You can enter in crypto or fiat." 
                : "The total amount you're willing to sell. You can enter in crypto or fiat."}
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

          {/* Price Type Selection */}
          <div>
            <Label className="text-sm lg:text-base text-muted-foreground mb-3 block">Price Type</Label>
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <Button
                type="button"
                variant={priceType === "fixed" ? "default" : "outline"}
                className="h-12 lg:h-14 text-base lg:text-lg"
                onClick={() => setPriceType("fixed")}
              >
                Fixed Price
              </Button>
              <Button
                type="button"
                variant={priceType === "floating" ? "default" : "outline"}
                className="h-12 lg:h-14 text-base lg:text-lg"
                onClick={() => setPriceType("floating")}
              >
                Floating Price
              </Button>
            </div>
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

          {/* Price section */}
          <div>
            <Label className="text-sm lg:text-base text-muted-foreground mb-4 block">Set price</Label>
            <Card className="bg-elevate-1 border-border max-w-2xl">
              <CardContent className="p-6 lg:p-8">
                {priceType === "fixed" ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm mb-2 block">Fixed Price per {crypto}</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={fixedPrice}
                          onChange={(e) => setFixedPrice(e.target.value)}
                          placeholder={`Enter price in ${currency}`}
                          className="bg-background pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          {currency}
                        </span>
                      </div>
                      {fixedPrice && marketRate > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          This is {((parseFloat(fixedPrice) / marketRate - 1) * 100).toFixed(2)}% {parseFloat(fixedPrice) >= marketRate ? "above" : "below"} market price
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm mb-2 block">Premium Percentage</Label>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-10 w-10"
                          onClick={() => {
                            const newValue = Math.max(marginLimits.min, priceOffset[0] - 0.5);
                            setPriceOffset([newValue]);
                            setPremiumInput(newValue.toFixed(1));
                          }}
                        >
                          -
                        </Button>
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            value={premiumInput || priceOffset[0].toString()}
                            onChange={(e) => handlePremiumInputChange(e.target.value)}
                            className="bg-background text-center text-lg font-bold pr-8"
                            step="0.1"
                            min={marginLimits.min}
                            max={marginLimits.max}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                            %
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-10 w-10"
                          onClick={() => {
                            const newValue = Math.min(marginLimits.max, priceOffset[0] + 0.5);
                            setPriceOffset([newValue]);
                            setPremiumInput(newValue.toFixed(1));
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={priceOffset}
                      onValueChange={handlePremiumSliderChange}
                      min={marginLimits.min}
                      max={marginLimits.max}
                      step={0.1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{marginLimits.min}%</span>
                      <span>{marginLimits.max > 0 ? "0%" : ""}</span>
                      <span>{marginLimits.max > 0 ? `+${marginLimits.max}%` : `${marginLimits.max}%`}</span>
                    </div>

                    <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span>Premium Indicator</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Price range: </span>
                        <span className="font-mono">{priceRange.minPrice.toLocaleString()} - {priceRange.maxPrice.toLocaleString()} {currency}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Market rate ({crypto}):</span>
                      {lastUpdated && (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          Live
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-medium">
                      {loading ? "Loading..." : `${marketRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`}
                    </span>
                  </div>
                  {marketRateUSD > 0 && currency !== "USD" && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>USD rate:</span>
                      <span className="font-mono">${marketRateUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your rate ({crypto}):</span>
                    <span className={`font-bold font-mono ${priceType === "floating" && priceOffset[0] > 0 ? "text-green-500" : priceType === "floating" && priceOffset[0] < 0 ? "text-red-500" : ""}`}>
                      {yourRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </span>
                  </div>
                  {priceType === "floating" && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Difference:</span>
                      <span className={`font-mono ${priceOffset[0] > 0 ? "text-green-500" : priceOffset[0] < 0 ? "text-red-500" : ""}`}>
                        {priceOffset[0] >= 0 ? "+" : ""}{(yourRate - marketRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                      </span>
                    </div>
                  )}
                </div>

                {priceType === "floating" && (
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs text-muted-foreground">
                      {offerType === "sell" ? (
                        <>Your offer will sell at <span className="font-bold text-foreground">market price {priceOffset[0] >= 0 ? "+" : ""}{priceOffset[0]}%</span>. Price updates every 3 seconds.</>
                      ) : (
                        <>Your offer will buy at <span className="font-bold text-foreground">market price {priceOffset[0] >= 0 ? "+" : ""}{priceOffset[0]}%</span>. Price updates every 3 seconds.</>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:space-y-8">
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg lg:text-xl py-6 lg:py-7"
            onClick={handleCreateOffer}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating offer..." : "Place Advanced Offer"}
          </Button>
          </div>
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}