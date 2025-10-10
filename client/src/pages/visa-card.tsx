import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, DollarSign } from "lucide-react";

export default function VisaCard() {
  const [selectedCrypto, setSelectedCrypto] = useState("usdt");
  const [topUpAmount, setTopUpAmount] = useState("");

  const quickAmounts = [10, 100, 200, 500];

  const handleQuickAmount = (amount: number) => {
    setTopUpAmount(amount.toString());
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-background to-muted py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Add crypto and spend anywhere
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Top up with crypto, mobile money, or banks, and spend anywhere with the highest limits possible
          </p>
          <div className="flex items-center justify-center gap-2 text-primary mb-8">
            <div className="w-1 h-6 bg-primary rounded"></div>
            <span className="text-lg font-semibold">Nigeria supported</span>
          </div>
          <Button className="h-14 px-8 text-lg font-semibold">
            Get your card (±1 min)
          </Button>
        </div>
      </div>

      {/* Card Features */}
      <div className="max-w-2xl mx-auto px-4 py-8 -mt-16">
        <Card className="bg-primary/10 border-2 border-primary/20 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-6 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-semibold">Pay with crypto</span>
                </div>
              </div>
              <div className="p-6 bg-card/50 backdrop-blur border-l border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-semibold">Up to $50k per transaction</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Card Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">
          Create your crypto VISA card
        </h2>

        <div className="space-y-6">
          {/* Crypto Selection */}
          <div>
            <Label htmlFor="crypto" className="text-base font-semibold mb-3 block">
              Crypto to pay with
            </Label>
            <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
              <SelectTrigger className="w-full h-16 text-lg border-2">
                <SelectValue placeholder="Select cryptocurrency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usdt">Tether (USDT)</SelectItem>
                <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                <SelectItem value="usdc">USD Coin (USDC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Top-up Amount */}
          <div>
            <Label htmlFor="amount" className="text-base font-semibold mb-3 block">
              Top-up Amount
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-full h-16 pr-20 text-lg border-2"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                USD
              </span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-3">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => handleQuickAmount(amount)}
                className="h-14 text-base font-semibold border-2"
              >
                {amount} USD
              </Button>
            ))}
          </div>

          {/* Fee Breakdown */}
          <div className="space-y-4 pt-6">
            <div className="flex justify-between items-center text-base py-3 border-b">
              <span className="text-muted-foreground font-medium">Card Creation Fee</span>
              <div className="text-right">
                <div className="font-bold text-lg">0 USDT</div>
                <div className="text-sm text-muted-foreground">(0 USD)</div>
              </div>
            </div>
            <div className="flex justify-between items-center text-base py-3 border-b">
              <span className="text-muted-foreground font-medium">Top-up Fee</span>
              <div className="text-right">
                <div className="font-bold text-lg">0 USDT</div>
                <div className="text-sm text-muted-foreground">(0 USD)</div>
              </div>
            </div>
            <div className="flex justify-between items-center text-base py-3">
              <span className="text-muted-foreground font-medium">To pay</span>
              <div className="text-right">
                <div className="font-bold text-xl">0 USDT</div>
                <div className="text-sm text-muted-foreground">(0 USD)</div>
              </div>
            </div>
          </div>

          {/* Create Card Button */}
          <Button className="w-full h-16 text-lg font-bold mt-6">
            Create card
          </Button>

          {/* Info Card */}
          <Card className="mt-10 bg-card border-2">
            <CardContent className="p-8">
              <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
                Use your crypto virtual Visa USD card anywhere in the world!
              </p>
              
              {/* Brand Logos */}
              <div className="grid grid-cols-3 gap-8 mb-10">
                <div className="flex items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold text-[#E50914]">NETFLIX</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold text-[#0070BA]">PayPal</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold">Apple</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold text-[#FF9900]">amazon</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold text-[#003791]">PlayStation</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold text-[#FF6A00]">AliExpress</span>
                </div>
              </div>

              {/* Fee Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-semibold">
                    New Card Activation Fee
                  </div>
                  <div className="text-2xl font-bold">1 USDT</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-semibold">
                    Card Top-up Deposit
                  </div>
                  <div className="text-2xl font-bold">2 USDT or 1.5%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-semibold">
                    Withdrawal from Card
                  </div>
                  <div className="text-2xl font-bold text-primary">free</div>
                </div>
              </div>

              {/* See More Button */}
              <Link href="/wallet/visa-card/details">
                <Button 
                  variant="outline" 
                  className="w-full h-14 text-base font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  See More
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
