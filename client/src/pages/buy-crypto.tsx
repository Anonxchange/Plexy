
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  ArrowRight, 
  Info,
  Shield,
  Zap,
  Check,
  Clock,
  DollarSign,
  Globe,
  AlertCircle,
  Lock
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { createClient } from "@/lib/supabase";
import { getUserWallets } from "@/lib/wallet-api";

declare global {
  interface Window {
    transak?: any;
  }
}

export default function BuyCrypto() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "mobile">("card");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [fiatCurrency, setFiatCurrency] = useState("USD");
  const [userVerificationLevel, setUserVerificationLevel] = useState<number>(0);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string>("");

  const cryptoOptions = [
    { symbol: "BTC", name: "Bitcoin", price: 122256.00 },
    { symbol: "ETH", name: "Ethereum", price: 4362.20 },
    { symbol: "USDT", name: "Tether", price: 1.00 },
    { symbol: "USDC", name: "USD Coin", price: 1.00 },
    { symbol: "SOL", name: "Solana", price: 222.75 },
  ];

  const selectedCryptoData = cryptoOptions.find(c => c.symbol === selectedCrypto);
  const cryptoAmount = amount ? (parseFloat(amount) / (selectedCryptoData?.price || 1)).toFixed(8) : "0";

  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        const supabase = createClient();

        const metadata = user.user_metadata || {};
        if (metadata.verification_level !== undefined) {
          setUserVerificationLevel(Number(metadata.verification_level) || 0);
          setLoadingVerification(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('verification_level')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error loading user profile:", error);
          setUserVerificationLevel(0);
        } else if (data) {
          setUserVerificationLevel(Number(data.verification_level) || 0);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setUserVerificationLevel(0);
      } finally {
        setLoadingVerification(false);
      }
    };

    const loadWalletAddress = async () => {
      try {
        const wallets = await getUserWallets(user.id);
        const ethWallet = wallets.find(w => w.crypto_symbol === 'ETH');
        if (ethWallet?.deposit_address) {
          setWalletAddress(ethWallet.deposit_address);
        }
      } catch (error) {
        console.error("Error loading wallet address:", error);
      }
    };

    loadUserData();
    loadWalletAddress();
  }, [user]);

  const openTransakWidget = () => {
    if (!user) {
      setLocation("/signin");
      return;
    }

    if (userVerificationLevel < 2) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://global.transak.com/sdk/v1.2/transakSDK.js';
    script.async = true;
    script.onload = () => {
      const transak = new window.transak.default({
        apiKey: import.meta.env.VITE_TRANSAK_API_KEY || 'YOUR_API_KEY_HERE',
        environment: import.meta.env.VITE_TRANSAK_ENVIRONMENT || 'STAGING',
        defaultCryptoCurrency: selectedCrypto,
        walletAddress: walletAddress,
        themeColor: 'B4F22E',
        fiatCurrency: fiatCurrency,
        fiatAmount: amount || undefined,
        email: user.email || '',
        redirectURL: window.location.origin + '/wallet',
        hostURL: window.location.origin,
        widgetHeight: '625px',
        widgetWidth: '500px',
      });

      transak.init();

      transak.on('TRANSAK_ORDER_SUCCESSFUL', (orderData: any) => {
        console.log('Transak order successful:', orderData);
        transak.close();
        setLocation('/wallet');
      });

      transak.on('TRANSAK_ORDER_FAILED', (error: any) => {
        console.error('Transak order failed:', error);
      });

      transak.on('TRANSAK_WIDGET_CLOSE', () => {
        console.log('Transak widget closed');
      });
    };
    document.body.appendChild(script);
  };

  // Non-logged-in user view
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 pb-20">
          {/* Buy Interface at the top */}
          <div className="bg-gradient-to-br from-primary/10 to-background py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Buy Crypto Instantly
              </h1>
              <p className="text-base text-muted-foreground mb-4">
                Purchase cryptocurrency using your credit card, bank transfer, or mobile money
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 -mt-4">
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Buy Form */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Choose crypto
                      </Label>
                      <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                        <SelectTrigger className="h-14">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cryptoOptions.map((crypto) => (
                            <SelectItem key={crypto.symbol} value={crypto.symbol}>
                              <div className="flex items-center justify-between w-full">
                                <span className="font-semibold">{crypto.name} ({crypto.symbol})</span>
                                <span className="text-muted-foreground ml-4">${crypto.price.toLocaleString()}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Amount to spend
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-14 pr-20 text-lg"
                        />
                        <Select value={fiatCurrency} onValueChange={setFiatCurrency}>
                          <SelectTrigger className="absolute right-2 top-2 w-20 h-10 border-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="NGN">NGN</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {amount && (
                        <p className="text-sm text-muted-foreground mt-2">
                          ≈ {cryptoAmount} {selectedCrypto}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {[100, 500, 1000, 5000].map((quickAmount) => (
                        <Button
                          key={quickAmount}
                          variant="outline"
                          size="sm"
                          onClick={() => setAmount(quickAmount.toString())}
                          className="flex-1"
                        >
                          ${quickAmount}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <Label className="text-sm font-semibold mb-3 block">Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-semibold text-sm">Credit/Debit Card</div>
                            <div className="text-xs text-muted-foreground">Instant delivery</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="bank" id="bank" />
                        <Label htmlFor="bank" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Building2 className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-semibold text-sm">Bank Transfer</div>
                            <div className="text-xs text-muted-foreground">Lower fees</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="mobile" id="mobile" />
                        <Label htmlFor="mobile" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-semibold text-sm">Mobile Money</div>
                            <div className="text-xs text-muted-foreground">M-Pesa, MTN, Airtel</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground text-sm">You pay</span>
                    <span className="font-semibold">
                      {amount || "0"} {fiatCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground text-sm">You receive</span>
                    <span className="font-semibold">
                      {cryptoAmount} {selectedCrypto}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground text-sm">Exchange rate</span>
                    <span className="font-medium text-sm">
                      1 {selectedCrypto} = ${selectedCryptoData?.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground text-sm">Processing fee</span>
                    <span className="font-medium text-sm">
                      {paymentMethod === "card" ? "2.5%" : paymentMethod === "bank" ? "0.5%" : "1.5%"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground text-sm">Estimated delivery</span>
                    <span className="font-medium text-sm">
                      {paymentMethod === "card" ? "Instant" : paymentMethod === "bank" ? "1-3 days" : "5-10 min"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Log in/Join us CTA */}
            <div className="max-w-4xl mx-auto mb-8">
              <Button 
                className="w-full h-16 text-lg bg-primary hover:bg-primary/90"
                onClick={() => setLocation("/signin")}
              >
                Log in/Join us
              </Button>
            </div>

            {/* Why Buy on Pexly */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">Why Buy on Pexly</h2>
                <p className="text-muted-foreground">
                  The easiest way to buy cryptocurrency with confidence
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-card/80">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Instant Delivery</h3>
                    <p className="text-sm text-muted-foreground">
                      Get your crypto delivered to your wallet instantly with card payments
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/80">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Secure & Safe</h3>
                    <p className="text-sm text-muted-foreground">
                      Bank-grade security with 256-bit SSL encryption and 2FA protection
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/80">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Best Rates</h3>
                    <p className="text-sm text-muted-foreground">
                      Competitive rates with transparent fees - no hidden charges
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Payment Method</h2>
              <div className="space-y-4">
                <Card className="bg-card/60">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Credit/Debit Card</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Instant delivery with a 2.5% processing fee. We accept Visa, Mastercard, and American Express.
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="secondary">Instant</Badge>
                          <Badge variant="secondary">2.5% fee</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Bank Transfer</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Lower fees at just 0.5%, but delivery takes 1-3 business days. Perfect for larger purchases.
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="secondary">1-3 days</Badge>
                          <Badge variant="secondary">0.5% fee</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Mobile Money</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Fast delivery in 5-10 minutes with 1.5% fee. Available for M-Pesa, MTN, Airtel, and more.
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="secondary">5-10 min</Badge>
                          <Badge variant="secondary">1.5% fee</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQ */}
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="item-1" className="bg-card/60 rounded-lg px-6 border-0">
                  <AccordionTrigger className="text-left hover:no-underline py-5">
                    <span className="text-base font-semibold">What payment methods do you accept?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    We accept credit/debit cards (Visa, Mastercard, Amex), bank transfers, and mobile money (M-Pesa, MTN, Airtel, Orange, and Vodafone).
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="bg-card/60 rounded-lg px-6 border-0">
                  <AccordionTrigger className="text-left hover:no-underline py-5">
                    <span className="text-base font-semibold">How long does it take to receive my crypto?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    Card payments are instant, mobile money takes 5-10 minutes, and bank transfers take 1-3 business days.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="bg-card/60 rounded-lg px-6 border-0">
                  <AccordionTrigger className="text-left hover:no-underline py-5">
                    <span className="text-base font-semibold">Is there a minimum purchase amount?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    The minimum purchase amount varies by payment method and currency, but typically starts at $10 USD or equivalent.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="bg-card/60 rounded-lg px-6 border-0">
                  <AccordionTrigger className="text-left hover:no-underline py-5">
                    <span className="text-base font-semibold">Is my payment information secure?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    Yes, we use 256-bit SSL encryption and are PCI DSS compliant. Your payment information is never stored on our servers and all transactions are encrypted.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
        <PexlyFooter />
      </div>
    );
  }

  // Logged-in user view - full buy interface
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Buy Crypto Instantly
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Purchase cryptocurrency using your credit card, bank transfer, or mobile money
          </p>
          <div className="flex flex-wrap gap-4">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Secure & Safe
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              Instant Delivery
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Check className="h-4 w-4 mr-2" />
              Best Rates
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Level 2 Verification Requirement Alert */}
        {loadingVerification ? (
          <div className="mb-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading verification status...</p>
              </CardContent>
            </Card>
          </div>
        ) : userVerificationLevel < 2 ? (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <Lock className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-900 dark:text-orange-400 font-semibold">
              Level 2 Verification Required
            </AlertTitle>
            <AlertDescription className="text-orange-800 dark:text-orange-300">
              To buy crypto with card or bank transfer, you need to complete Level 2 verification (ID + live video).
              This ensures secure transactions and protects against fraud.
              <Link href="/verification">
                <Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto border-orange-300 text-orange-900 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-950">
                  Complete Verification →
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
            <Check className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900 dark:text-green-400 font-semibold">
              Verification Complete - Level {userVerificationLevel}
            </AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-300">
              You're verified! You can now buy crypto with card or bank transfer instantly.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Payment Form */}
          <div className="space-y-6">
            {/* Crypto Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Select Cryptocurrency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="crypto" className="text-sm font-semibold mb-2 block">
                    Choose crypto
                  </Label>
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                    <SelectTrigger className="h-14">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptoOptions.map((crypto) => (
                        <SelectItem key={crypto.symbol} value={crypto.symbol}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold">{crypto.name} ({crypto.symbol})</span>
                            <span className="text-muted-foreground ml-4">${crypto.price.toLocaleString()}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount" className="text-sm font-semibold mb-2 block">
                    Amount to spend
                  </Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-14 pr-20 text-lg"
                    />
                    <Select value={fiatCurrency} onValueChange={setFiatCurrency}>
                      <SelectTrigger className="absolute right-2 top-2 w-20 h-10 border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="NGN">NGN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {amount && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ≈ {cryptoAmount} {selectedCrypto}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {[100, 500, 1000, 5000].map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount.toString())}
                      className="flex-1"
                    >
                      ${quickAmount}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold">Credit/Debit Card</div>
                        <div className="text-xs text-muted-foreground">Instant • Visa, Mastercard, Amex</div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold">Bank Transfer</div>
                        <div className="text-xs text-muted-foreground">1-3 business days • Lower fees</div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="mobile" id="mobile" />
                    <Label htmlFor="mobile" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold">Mobile Money</div>
                        <div className="text-xs text-muted-foreground">Instant • M-Pesa, MTN, Airtel</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethod === "card" && (
                  <>
                    <div>
                      <Label htmlFor="cardNumber" className="text-sm font-semibold mb-2 block">
                        Card Number
                      </Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardExpiry" className="text-sm font-semibold mb-2 block">
                          Expiry Date
                        </Label>
                        <Input
                          id="cardExpiry"
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCvv" className="text-sm font-semibold mb-2 block">
                          CVV
                        </Label>
                        <Input
                          id="cardCvv"
                          type="text"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>
                  </>
                )}

                {paymentMethod === "bank" && (
                  <>
                    <div>
                      <Label htmlFor="bankName" className="text-sm font-semibold mb-2 block">
                        Bank Name
                      </Label>
                      <Select value={bankName} onValueChange={setBankName}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chase">Chase Bank</SelectItem>
                          <SelectItem value="bofa">Bank of America</SelectItem>
                          <SelectItem value="wells">Wells Fargo</SelectItem>
                          <SelectItem value="citi">Citibank</SelectItem>
                          <SelectItem value="gtb">GTBank (Nigeria)</SelectItem>
                          <SelectItem value="firstbank">First Bank (Nigeria)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="accountNumber" className="text-sm font-semibold mb-2 block">
                        Account Number
                      </Label>
                      <Input
                        id="accountNumber"
                        type="text"
                        placeholder="Enter account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </>
                )}

                {paymentMethod === "mobile" && (
                  <>
                    <div>
                      <Label htmlFor="mobileProvider" className="text-sm font-semibold mb-2 block">
                        Mobile Money Provider
                      </Label>
                      <Select value={mobileProvider} onValueChange={setMobileProvider}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                          <SelectItem value="airtel">Airtel Money</SelectItem>
                          <SelectItem value="orange">Orange Money</SelectItem>
                          <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="mobileNumber" className="text-sm font-semibold mb-2 block">
                        Mobile Number
                      </Label>
                      <Input
                        id="mobileNumber"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Button 
              onClick={openTransakWidget} 
              className="w-full h-14 text-lg font-semibold"
              disabled={!amount || parseFloat(amount) <= 0 || userVerificationLevel < 2 || loadingVerification}
            >
              {userVerificationLevel < 2 ? (
                <>
                  <Lock className="mr-2 h-5 w-5" />
                  Level 2 Required
                </>
              ) : (
                <>
                  Buy {selectedCrypto} Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            {userVerificationLevel < 2 && !loadingVerification && (
              <p className="text-sm text-center text-muted-foreground">
                Complete Level 2 verification to buy crypto with card or bank transfer
              </p>
            )}
          </div>

          {/* Right Column - Order Summary & Info */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-muted-foreground">You pay</span>
                  <span className="font-semibold text-lg">
                    {amount || "0"} {fiatCurrency}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-muted-foreground">You receive</span>
                  <span className="font-semibold text-lg">
                    {cryptoAmount} {selectedCrypto}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-muted-foreground">Exchange rate</span>
                  <span className="font-medium">
                    1 {selectedCrypto} = ${selectedCryptoData?.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-muted-foreground">Processing fee</span>
                  <span className="font-medium">
                    {paymentMethod === "card" ? "2.5%" : paymentMethod === "bank" ? "0.5%" : "1.5%"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-muted-foreground">Estimated delivery</span>
                  <span className="font-medium">
                    {paymentMethod === "card" ? "Instant" : paymentMethod === "bank" ? "1-3 days" : "5-10 min"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Secure & Protected</h3>
                    <p className="text-sm text-muted-foreground">
                      Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>256-bit SSL encryption</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>PCI DSS compliant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Two-factor authentication</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Card payments:</strong> Instant delivery with a 2.5% processing fee.
                    </p>
                    <p>
                      <strong className="text-foreground">Bank transfers:</strong> Lower fees (0.5%) but takes 1-3 business days.
                    </p>
                    <p>
                      <strong className="text-foreground">Mobile money:</strong> Fast delivery (5-10 min) with 1.5% fee.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
