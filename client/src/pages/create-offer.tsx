import { useState } from "react";
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
import { ArrowDownUp, Edit } from "lucide-react";

export function CreateOffer() {
  const [priceOffset, setPriceOffset] = useState([0]);
  const [crypto, setCrypto] = useState("BTC");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currency, setCurrency] = useState("");
  const [country, setCountry] = useState("");
  const [minAmount, setMinAmount] = useState("14777");
  const [maxAmount, setMaxAmount] = useState("147769");

  const marketRate = 177374519.15;
  const yourRate = marketRate * (1 + priceOffset[0] / 100);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Create an offer</h1>
          <Badge variant="outline">LITE</Badge>
        </div>

        <p className="text-muted-foreground mb-8">
          List your ad in our P2P marketplace. More settings in the{" "}
          <a href="#" className="underline">advanced version</a>.
        </p>

        <div className="space-y-6">
          {/* I have section */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">I have</Label>
            <Card className="bg-elevate-1 border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                    ₿
                  </div>
                  <span className="font-bold text-lg">{crypto}</span>
                </div>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <Button 
              size="icon"
              className="rounded-lg bg-primary hover:bg-primary/90"
            >
              <ArrowDownUp className="h-5 w-5" />
            </Button>
          </div>

          {/* I want section */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">I want</Label>
            <div className="space-y-3">
              <Card className="bg-elevate-1 border-border">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {paymentMethod || "Payment method"}
                  </span>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

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

          {/* Price section */}
          <div>
            <Label className="text-sm text-muted-foreground mb-4 block">Set price</Label>
            <Card className="bg-elevate-1 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="outline" size="sm">-10%</Button>
                  <span className="text-lg font-bold">
                    {priceOffset[0] > 0 ? "+" : ""}{priceOffset[0]}%
                  </span>
                  <Button variant="outline" size="sm">+100%</Button>
                </div>
                <Slider
                  value={priceOffset}
                  onValueChange={setPriceOffset}
                  min={-10}
                  max={100}
                  step={1}
                  className="mb-6"
                />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market rate ({crypto}):</span>
                    <span>{marketRate.toFixed(2)} NGN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your rate ({crypto}):</span>
                    <span className="font-bold">{yourRate.toFixed(2)} NGN</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  *You will sell at <span className="font-bold">market price</span>
                </p>
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
          >
            Place an offer
          </Button>
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}
