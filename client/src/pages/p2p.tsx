
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppFooter } from "@/components/app-footer";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bitcoin, 
  ArrowUpDown,
  Plus,
  SlidersHorizontal,
  RotateCw,
  List
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const currencies = [
  { symbol: "BTC", name: "Bitcoin", rate: 179260399.63 },
  { symbol: "ETH", name: "Ethereum", rate: 8500000 },
  { symbol: "USDT", name: "Tether", rate: 1471.15 },
  { symbol: "USDC", name: "USD Coin", rate: 1471.15 },
];

const paymentMethods = [
  "Bank Transfer",
  "Mobile Money",
  "PayPal",
  "Cash",
  "Gift Card",
];

export function P2P() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeMode, setActiveMode] = useState<"buy" | "sell" | "swap">("buy");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [paymentMethod, setPaymentMethod] = useState("");
  
  // Swap state
  const [fromAmount, setFromAmount] = useState("0.00001");
  const [toAmount, setToAmount] = useState("1.217364");
  const [fromCurrency, setFromCurrency] = useState("BTC");
  const [toCurrency, setToCurrency] = useState("USDT");

  const usdRate = 1471.15;
  const btcRate = 179260399.63;

  const mockOffers = [
    {
      id: 1,
      vendor: "Marxsmith",
      badges: ["AMBASSADOR", "EXPERT"],
      rating: 99.98,
      trades: 1270,
      status: "Active now",
      paymentMethod: "Bank Transfer",
      amount: "USDT",
      price: "1,485.50 NGN",
      limits: "50,000 - 500,000 NGN",
    },
    {
      id: 2,
      vendor: "QuickTrade",
      badges: ["VERIFIED"],
      rating: 98.5,
      trades: 856,
      status: "Active now",
      paymentMethod: "Mobile Money",
      amount: "BTC",
      price: "179,500,000 NGN",
      limits: "100,000 - 1,000,000 NGN",
    },
  ];

  if (!user) {
    setLocation("/signin");
    return null;
  }

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeMode === "buy" ? "default" : "outline"}
            onClick={() => setActiveMode("buy")}
            className="min-w-fit"
          >
            HOME
          </Button>
          <Button
            variant={activeMode === "buy" ? "default" : "outline"}
            onClick={() => setActiveMode("buy")}
            className="min-w-fit bg-primary text-primary-foreground hover:bg-primary/90"
          >
            P2P
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="min-w-fit"
          >
            SHOP
          </Button>
          <Button
            variant={activeMode === "swap" ? "default" : "outline"}
            onClick={() => setActiveMode("swap")}
            className="min-w-fit"
          >
            SWAP
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/wallet")}
            className="min-w-fit"
          >
            WALLET
          </Button>
        </div>

        {activeMode === "swap" ? (
          // Swap Interface
          <div className="space-y-6">
            <Card className="bg-card/50">
              <CardContent className="p-6 space-y-4">
                {/* From Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">From</Label>
                    <span className="text-sm text-muted-foreground">Available: 0.0000001 {fromCurrency}</span>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="flex-1 h-16 text-2xl"
                    />
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger className="w-32 h-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.symbol} value={curr.symbol}>
                            <div className="flex items-center gap-2">
                              <Bitcoin className="h-4 w-4" />
                              {curr.symbol}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <Button
                    size="icon"
                    variant="default"
                    className="rounded-full bg-primary hover:bg-primary/90"
                    onClick={handleSwapCurrencies}
                  >
                    <ArrowUpDown className="h-5 w-5" />
                  </Button>
                </div>

                {/* To Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">To</Label>
                    <span className="text-sm text-muted-foreground">Available: 0.001259 {toCurrency}</span>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={toAmount}
                      onChange={(e) => setToAmount(e.target.value)}
                      className="flex-1 h-16 text-2xl"
                    />
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="w-32 h-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.symbol} value={curr.symbol}>
                            <div className="flex items-center gap-2">
                              <Bitcoin className="h-4 w-4" />
                              {curr.symbol}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rate Info */}
                <div className="space-y-2 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Swap rate:</span>
                    <span className="font-medium">1 BTC = 121,992.88 USDT <Badge variant="secondary" className="ml-2">0.21%</Badge></span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Market rate:</span>
                    <span className="font-medium">1 BTC = 121,992.88 USDT</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Swap Button */}
            <Button className="w-full h-14 text-lg bg-primary hover:bg-primary/90">
              <ArrowUpDown className="mr-2 h-5 w-5" />
              Swap
            </Button>

            {/* Recent Activity */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent activity</h3>
                <Button variant="ghost" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No recent activity
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Buy/Sell Interface
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-4">Buy Crypto</h1>
              <div className="flex items-center gap-4 text-sm">
                <span>1 USD = {usdRate.toLocaleString()} NGN</span>
                <span>1 BTC = {btcRate.toLocaleString()} NGN</span>
              </div>
            </div>

            {/* Buy/Sell Toggle */}
            <div className="flex gap-3 mb-6">
              <Button
                variant={activeMode === "buy" ? "default" : "outline"}
                onClick={() => setActiveMode("buy")}
                className="px-8"
              >
                Buy
              </Button>
              <Button
                variant={activeMode === "sell" ? "default" : "outline"}
                onClick={() => setActiveMode("sell")}
                className="px-8"
              >
                Sell
              </Button>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All crypto</SelectItem>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.symbol} value={curr.symbol}>
                          {curr.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs text-muted-foreground mb-1 block">USING</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NGN">NGN</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Offers Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Offers</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Offer List Toggle */}
            <Button variant="outline" className="mb-4">
              <List className="mr-2 h-4 w-4" />
              Offer list (200)
            </Button>

            {/* Offers */}
            <div className="space-y-4">
              {mockOffers.map((offer) => (
                <Card key={offer.id} className="hover-elevate cursor-pointer transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{offer.vendor[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{offer.vendor}</h3>
                            {offer.badges.map((badge) => (
                              <Badge key={badge} variant="secondary" className="text-xs">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              👍 {offer.rating}%
                            </span>
                            <span>{offer.trades} Trades</span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              {offer.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Pay {offer.paymentMethod}</p>
                        <p className="text-sm text-muted-foreground">Receive ({offer.amount})</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{offer.price}</p>
                        <p className="text-sm text-muted-foreground">{offer.limits}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
      
      <AppFooter />
    </div>
  );
}
