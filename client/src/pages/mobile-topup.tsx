import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

export default function MobileTopup() {
  const [phoneNumber, setPhoneNumber] = useState("813 447 8949");
  const [countryCode, setCountryCode] = useState("+234");
  const [amount, setAmount] = useState("600");
  const [selectedTab, setSelectedTab] = useState("recharge");
  const [selectedNetwork, setSelectedNetwork] = useState("mtn");

  const quickAmounts = [200, 600, 1800];
  const exchangeRate = 0.000724; // Example rate for NGN to USDT

  const networks = [
    { id: "mtn", name: "MTN", fullName: "Nigeria MTN", color: "bg-yellow-400", textColor: "text-black" },
    { id: "glo", name: "Glo", fullName: "Nigeria Glo", color: "bg-green-600", textColor: "text-white" },
    { id: "airtel", name: "Airtel", fullName: "Nigeria Airtel", color: "bg-red-600", textColor: "text-white" },
    { id: "9mobile", name: "9mobile", fullName: "Nigeria 9mobile", color: "bg-emerald-700", textColor: "text-white" },
  ];

  const selectedNetworkData = networks.find(n => n.id === selectedNetwork) || networks[0];

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const calculateUSDT = () => {
    return (parseFloat(amount || "0") * exchangeRate).toFixed(6);
  };

  const hasEnoughBalance = false; // Mock balance check

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Mobile Top-up
        </h1>

        {/* Phone Number Input */}
        <div className="mb-6">
          <Label htmlFor="phone" className="text-base font-semibold mb-3 block">
            Phone number
          </Label>
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-32 h-14 text-base border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+234">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇳🇬</span>
                    <span>+234</span>
                  </div>
                </SelectItem>
                <SelectItem value="+1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇺🇸</span>
                    <span>+1</span>
                  </div>
                </SelectItem>
                <SelectItem value="+44">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🇬🇧</span>
                    <span>+44</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1 h-14 text-base border-2"
              placeholder="Enter phone number"
            />
          </div>
        </div>

        {/* Network Provider Selection */}
        <div className="mb-6">
          <Label className="text-base font-semibold mb-3 block">
            Select Network
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {networks.map((network) => (
              <Card
                key={network.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedNetwork === network.id
                    ? `${network.color} border-primary ring-2 ring-primary`
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedNetwork(network.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-12 h-12 ${
                        selectedNetwork === network.id ? network.color : "bg-muted"
                      } rounded flex items-center justify-center font-bold ${
                        selectedNetwork === network.id ? network.textColor : "text-foreground"
                      }`}
                    >
                      {network.name === "9mobile" ? "9M" : network.name.substring(0, 3).toUpperCase()}
                    </div>
                    <span className={`text-sm font-bold ${selectedNetwork === network.id ? network.textColor : ""}`}>
                      {network.name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 h-14">
            <TabsTrigger value="recharge" className="text-base font-semibold">
              Mobile Recharge
            </TabsTrigger>
            <TabsTrigger value="data" className="text-base font-semibold">
              Data Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recharge" className="mt-6 space-y-6">
            {/* Amount Input */}
            <div>
              <Label htmlFor="amount" className="text-base font-semibold mb-3 block">
                Enter amount
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-16 pr-20 text-xl font-bold border-2"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                  NGN
                </span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {quickAmounts.map((value) => (
                <Button
                  key={value}
                  variant={amount === value.toString() ? "default" : "outline"}
                  onClick={() => handleQuickAmount(value)}
                  className={`h-14 text-base font-bold border-2 ${
                    amount === value.toString()
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50"
                  }`}
                >
                  {value} NGN
                </Button>
              ))}
            </div>

            {/* Select Plan Section */}
            <div className="pt-4">
              <h3 className="text-xl font-bold mb-6">Select Plan</h3>

              {/* Payment Calculation */}
              <Card className="bg-muted/30 border-2 mb-6">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-muted-foreground">To pay</span>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{calculateUSDT()} USDT</div>
                      <div className="text-lg text-muted-foreground">{amount} NGN</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Error Message */}
              {!hasEnoughBalance && parseFloat(amount) > 0 && (
                <Card className="bg-red-900/80 border-red-800 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 text-red-100">
                      <AlertCircle className="h-6 w-6 flex-shrink-0" />
                      <p className="font-semibold">
                        You don't have enough USDT in your Wallet.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button className="h-14 text-base font-bold">
                  Buy USDT
                </Button>
                <Button className="h-14 text-base font-bold">
                  Deposit USDT
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">Data plan options coming soon</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-10 bg-muted/30 border-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-3">About Mobile Top-up</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Instant top-up to any mobile number in Nigeria</li>
              <li>• Support for all major networks (MTN, Airtel, Glo, 9mobile)</li>
              <li>• Pay with crypto from your wallet</li>
              <li>• Competitive exchange rates</li>
              <li>• 24/7 service availability</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
