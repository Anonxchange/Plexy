
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";

const currencies = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿" },
  { symbol: "USDT", name: "Tether", icon: "₮" },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ" },
  { symbol: "USDC", name: "USD Coin", icon: "⊙" },
];

export function Swap() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [fromAmount, setFromAmount] = useState("0.00001");
  const [toAmount, setToAmount] = useState("1.222411");
  const [fromCurrency, setFromCurrency] = useState("BTC");
  const [toCurrency, setToCurrency] = useState("USDT");

  if (!user) {
    setLocation("/signin");
    return null;
  }

  const handleSwapCurrencies = () => {
    const tempCurrency = fromCurrency;
    const tempAmount = fromAmount;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const swapRate = "122,470.25";
  const marketRate = "122,470.25";
  const percentageDiff = "0.19%";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 max-w-2xl mx-auto px-4 py-8">
        {/* Swap Interface */}
        <Card className="bg-card/50 mb-8">
          <CardContent className="p-6 space-y-6">
            {/* From Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-base">From</Label>
                <span className="text-sm text-muted-foreground">
                  Available: {fromCurrency === "BTC" ? "0.0000001" : "0.001259"} {fromCurrency}
                </span>
              </div>
              <div className="flex gap-3">
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="flex-1 h-16 text-2xl bg-background"
                />
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-36 h-16 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.symbol} value={curr.symbol}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{curr.icon}</span>
                          {curr.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center">
              <Button
                size="icon"
                variant="default"
                className="rounded-full bg-primary hover:bg-primary/90 h-12 w-12"
                onClick={handleSwapCurrencies}
              >
                <ArrowUpDown className="h-5 w-5" />
              </Button>
            </div>

            {/* To Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-base">To</Label>
                <span className="text-sm text-muted-foreground">
                  Available: {toCurrency === "USDT" ? "0.001259" : "0.0000001"} {toCurrency}
                </span>
              </div>
              <div className="flex gap-3">
                <Input
                  type="number"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  className="flex-1 h-16 text-2xl bg-background"
                />
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-36 h-16 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.symbol} value={curr.symbol}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{curr.icon}</span>
                          {curr.symbol}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rate Info */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Swap rate:</span>
                <span className="font-medium">
                  1 {fromCurrency} = {swapRate} {toCurrency}{" "}
                  <Badge variant="secondary" className="ml-2">
                    {percentageDiff}
                  </Badge>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Market rate:</span>
                <span className="font-medium">
                  1 {fromCurrency} = {marketRate} {toCurrency}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Swap Button */}
        <Button className="w-full h-14 text-lg bg-primary hover:bg-primary/90 mb-8">
          <ArrowUpDown className="mr-2 h-5 w-5" />
          Swap
        </Button>

        {/* Recent Activity */}
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent activity</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-lg bg-muted p-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium mb-2 text-muted-foreground">Nothing to show yet</h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                You haven't made any swaps yet. Once you do, your swap history will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <PexlyFooter />
    </div>
  );
}
