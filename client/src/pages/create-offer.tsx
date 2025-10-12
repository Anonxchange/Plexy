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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowDownUp, Edit, Bitcoin } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getCryptoPrices, convertToNGN } from "@/lib/crypto-prices";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marketRate, setMarketRate] = useState(0);
  const [loading, setLoading] = useState(true);
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
    const interval = setInterval(fetchLivePrices, 30000);
    
    return () => clearInterval(interval);
  }, [crypto, currency]);

  const yourRate = priceType === "fixed" 
    ? parseFloat(fixedPrice) || marketRate
    : marketRate * (1 + priceOffset[0] / 100);

  const handleCreateOffer = async () => {
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
        country_restrictions: country ? [country] : null,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Offer Created!",
        description: "Your offer has been successfully listed on the P2P marketplace",
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
          <h1 className="text-4xl font-bold">Create an offer</h1>
          <Badge variant="outline">LITE</Badge>
        </div>

        <p className="text-muted-foreground mb-8">
          List your ad in our P2P marketplace. More settings in the{" "}
          <button 
            onClick={() => setLocation("/create-offer-advanced")} 
            className="underline text-primary hover:text-primary/80"
          >
            advanced version
          </button>.
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
                  <SelectItem value="Venmo">Venmo</SelectItem>
                  <SelectItem value="Google Pay">Google Pay</SelectItem>
                  <SelectItem value="Apple Pay">Apple Pay</SelectItem>
                </SelectContent>
              </Select>

              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-12 bg-elevate-1">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">Nigerian Nairas (NGN)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                </SelectContent>
              </Select>

              {paymentMethod === "Bank Transfer" && (
                <>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-12 bg-elevate-1">
                      <SelectValue placeholder="🌍 Nigeria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NG">🇳🇬 Nigeria</SelectItem>
                      <SelectItem value="US">🇺🇸 United States</SelectItem>
                      <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger className="h-12 bg-elevate-1">
                      <SelectValue placeholder="🏦 Choose a bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account1">Bank Account 1</SelectItem>
                      <SelectItem value="account2">Bank Account 2</SelectItem>
                    </SelectContent>
                  </Select>

                  <Card className="bg-elevate-1 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox id="auto-share" />
                        <Label htmlFor="auto-share" className="text-sm leading-relaxed">
                          I agree to automatically share my bank account details with buyers in incoming trades
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Accepted bank names
                    </Label>
                    <Input 
                      placeholder="John Doe international bank"
                      className="bg-elevate-1"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      The bank names you can receive transfers from will appear with your offer. 
                      List multiple banks using spaces—for example: CBS SEB METROPOLITAN ALFA
                    </p>
                  </div>

                  <Card className="bg-elevate-1 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox id="verify-identity" defaultChecked />
                        <Label htmlFor="verify-identity" className="text-sm">
                          Require your trade partner to verify their identity
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-6 text-center">
                      <div className="text-6xl mb-4">
                        ⭐👍👍
                      </div>
                      <h3 className="text-xl font-bold mb-2">
                        No security deposit required
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Start trading on Pexly without a security deposit
                      </p>
                      <div className="flex justify-center gap-2 text-3xl mb-4">
                        ✓ 👍 👍
                      </div>
                      <Button variant="outline" size="sm">
                        AT A PRICE OF
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
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
                {priceType === "floating" && (
                  <p className="text-xs text-muted-foreground mt-4">
                    *You will sell at <span className="font-bold">market price {priceOffset[0] > 0 ? "+" : ""}{priceOffset[0]}%</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

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
            {isSubmitting ? "Creating offer..." : "Place an offer"}
          </Button>
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}
