
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  ArrowRight, 
  Info,
  Shield,
  Zap,
  Check
} from "lucide-react";

export default function BuyCrypto() {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "mobile">("card");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [fiatCurrency, setFiatCurrency] = useState("USD");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const cryptoOptions = [
    { symbol: "BTC", name: "Bitcoin", price: 122256.00 },
    { symbol: "ETH", name: "Ethereum", price: 4362.20 },
    { symbol: "USDT", name: "Tether", price: 1.00 },
    { symbol: "USDC", name: "USD Coin", price: 1.00 },
    { symbol: "SOL", name: "Solana", price: 222.75 },
  ];

  const selectedCryptoData = cryptoOptions.find(c => c.symbol === selectedCrypto);
  const cryptoAmount = amount ? (parseFloat(amount) / (selectedCryptoData?.price || 1)).toFixed(8) : "0";

  const handlePurchase = () => {
    console.log("Processing purchase with:", {
      paymentMethod,
      selectedCrypto,
      amount,
      fiatCurrency,
    });
  };

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
              onClick={handlePurchase} 
              className="w-full h-14 text-lg font-semibold"
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Complete Purchase
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
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
