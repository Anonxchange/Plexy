import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { currencies } from "@/lib/currencies";
import { 
  Bitcoin, 
  MapPin,
  Search,
  RotateCw,
  Menu,
  TrendingUp
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";

const cryptocurrencies = [
  { symbol: "BTC", name: "Bitcoin", icon: Bitcoin, price: 123592.33 },
  { symbol: "ETH", name: "Ethereum", icon: Bitcoin, price: 5789.12 },
  { symbol: "USDT", name: "Tether", icon: Bitcoin, price: 1.00 },
];

export function P2P() {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [offerLocation, setOfferLocation] = useState("worldwide");
  const [traderLocation, setTraderLocation] = useState("usa");
  const [openCurrencyDialog, setOpenCurrencyDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("All Payment Methods");
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const paymentCategories = [
    { id: "all", name: "All payment methods" },
    { id: "bank", name: "Bank transfers" },
    { id: "wallet", name: "Online wallets" },
    { id: "card", name: "Debit/credit cards" },
    { id: "gift", name: "Gift cards" },
    { id: "digital", name: "Digital currencies" },
    { id: "goods", name: "Goods and services" },
  ];

  const popularPaymentMethods = [
    { id: "bank-transfer", name: "Bank Transfer", icon: MapPin, category: "bank" },
    { id: "google-pay", name: "Google Pay", icon: Bitcoin, category: "wallet" },
    { id: "apple-pay", name: "ApplePay", icon: Bitcoin, category: "wallet" },
    { id: "paypal", name: "PayPal", icon: Bitcoin, category: "wallet" },
    { id: "mtn", name: "MTN Mobile Money", icon: Bitcoin, category: "wallet" },
    { id: "wire", name: "Domestic Wire Transfer", icon: MapPin, category: "bank" },
  ];

  const allPaymentMethods = [
    // Bank Transfers
    { id: "bank-transfer", name: "Bank Transfer", icon: MapPin, category: "bank" },
    { id: "wire", name: "Domestic Wire Transfer", icon: MapPin, category: "bank" },
    { id: "ach", name: "ACH Transfer", icon: MapPin, category: "bank" },
    { id: "sepa", name: "SEPA Transfer", icon: MapPin, category: "bank" },
    { id: "swift", name: "SWIFT Transfer", icon: MapPin, category: "bank" },

    // Online Wallets
    { id: "paypal", name: "PayPal", icon: Bitcoin, category: "wallet" },
    { id: "google-pay", name: "Google Pay", icon: Bitcoin, category: "wallet" },
    { id: "apple-pay", name: "Apple Pay", icon: Bitcoin, category: "wallet" },
    { id: "advcash", name: "AdvCash", icon: Bitcoin, category: "wallet" },
    { id: "airtel", name: "Airtel Money", icon: Bitcoin, category: "wallet" },
    { id: "alipay", name: "Alipay", icon: Bitcoin, category: "wallet" },
    { id: "mtn", name: "MTN Mobile Money", icon: Bitcoin, category: "wallet" },
    { id: "skrill", name: "Skrill", icon: Bitcoin, category: "wallet" },
    { id: "neteller", name: "Neteller", icon: Bitcoin, category: "wallet" },
    { id: "venmo", name: "Venmo", icon: Bitcoin, category: "wallet" },
    { id: "cashapp", name: "Cash App", icon: Bitcoin, category: "wallet" },
    { id: "zelle", name: "Zelle", icon: Bitcoin, category: "wallet" },
    { id: "wechat", name: "WeChat Pay", icon: Bitcoin, category: "wallet" },

    // Debit/Credit Cards
    { id: "visa", name: "Visa", icon: Bitcoin, category: "card" },
    { id: "mastercard", name: "Mastercard", icon: Bitcoin, category: "card" },
    { id: "amex", name: "American Express", icon: Bitcoin, category: "card" },
    { id: "discover", name: "Discover", icon: Bitcoin, category: "card" },
    { id: "debit", name: "Debit Card", icon: Bitcoin, category: "card" },
    { id: "credit", name: "Credit Card", icon: Bitcoin, category: "card" },

    // Gift Cards
    { id: "amazon", name: "Amazon Gift Card", icon: Bitcoin, category: "gift" },
    { id: "apple-gift", name: "Apple Gift Card", icon: Bitcoin, category: "gift" },
    { id: "google-play", name: "Google Play", icon: Bitcoin, category: "gift" },
    { id: "steam", name: "Steam", icon: Bitcoin, category: "gift" },
    { id: "itunes", name: "iTunes Gift Card", icon: Bitcoin, category: "gift" },
    { id: "xbox", name: "Xbox Gift Card", icon: Bitcoin, category: "gift" },
    { id: "playstation", name: "PlayStation Gift Card", icon: Bitcoin, category: "gift" },
    { id: "netflix", name: "Netflix Gift Card", icon: Bitcoin, category: "gift" },
    { id: "spotify", name: "Spotify Gift Card", icon: Bitcoin, category: "gift" },

    // Digital Currencies
    { id: "bitcoin", name: "Bitcoin (BTC)", icon: Bitcoin, category: "digital" },
    { id: "ethereum", name: "Ethereum (ETH)", icon: Bitcoin, category: "digital" },
    { id: "usdt", name: "Tether (USDT)", icon: Bitcoin, category: "digital" },
    { id: "usdc", name: "USD Coin (USDC)", icon: Bitcoin, category: "digital" },
    { id: "arweave", name: "Arweave (AR)", icon: Bitcoin, category: "digital" },
    { id: "litecoin", name: "Litecoin (LTC)", icon: Bitcoin, category: "digital" },

    // Goods and Services
    { id: "merchandise", name: "Merchandise", icon: Bitcoin, category: "goods" },
    { id: "services", name: "Services", icon: Bitcoin, category: "goods" },
    { id: "vouchers", name: "Vouchers", icon: Bitcoin, category: "goods" },
  ];

  const popularCurrencies = ["USD", "GBP", "CAD", "EUR", "INR", "KES", "NGN", "CNY"];
  const selectedCurrencyData = currencies.find(c => c.code === currency);


  const selectedCryptoData = cryptocurrencies.find(c => c.symbol === selectedCrypto) || cryptocurrencies[0];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Buy/Sell Tabs */}
        <div className="flex gap-0 mb-8 border-b">
          <button
            onClick={() => setActiveTab("buy")}
            className={`flex-1 py-4 px-6 font-semibold text-lg transition-colors relative ${
              activeTab === "buy" 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Buy
            {activeTab === "buy" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={`flex-1 py-4 px-6 font-semibold text-lg transition-colors relative ${
              activeTab === "sell" 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sell
            {activeTab === "sell" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"></div>
            )}
          </button>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {activeTab === "buy" ? "Buy" : "Sell"} Bitcoin (BTC).
            </h1>
            <p className="text-muted-foreground">
              {activeTab === "buy" 
                ? "Buy Bitcoin with over 500 payment methods to choose from, including bank transfers, online wallets, and gift cards."
                : "Sell your Bitcoin and get paid via over 500 payment methods, including bank transfers, online wallets, and gift cards."
              }
            </p>
          </div>

          {/* Cryptocurrency Selector */}
          <div className="space-y-2">
            <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
              <SelectTrigger className="w-full h-14 text-lg">
                <div className="flex items-center gap-3">
                  <selectedCryptoData.icon className="h-6 w-6 text-orange-500" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {cryptocurrencies.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                    <div className="flex items-center gap-3">
                      <crypto.icon className="h-5 w-5 text-orange-500" />
                      <span>{crypto.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Display */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                1 {selectedCrypto} = {selectedCryptoData.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-4">
            <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder={selectedPaymentMethod}
                    className="pl-10 pr-12 h-14 text-base cursor-pointer"
                    readOnly
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-accent rounded-md transition-colors">
                    <Menu className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md h-full sm:h-auto max-h-screen p-0 flex flex-col">
                <div className="sticky top-0 bg-background z-10 border-b">
                  {/* Search Bar with Back Arrow */}
                  <div className="flex items-center gap-3 p-4 pb-0">
                    <button 
                      onClick={() => setOpenPaymentDialog(false)}
                      className="p-1 hover:bg-muted rounded-md transition-colors"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Search"
                        value={paymentSearchQuery}
                        onChange={(e) => setPaymentSearchQuery(e.target.value)}
                        className="pl-10 h-12 border-0 focus-visible:ring-0 bg-muted"
                      />
                    </div>
                  </div>

                  {/* Category Tabs */}
                  <div className="overflow-x-auto px-4 pt-4">
                    <div className="flex gap-3 pb-3 border-b">
                      {paymentCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            "pb-2 px-1 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                            selectedCategory === cat.id
                              ? "border-foreground text-foreground"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select All Button */}
                  <div className="px-4 py-3 flex justify-center">
                    <Button
                      variant="outline"
                      className="rounded-full px-6"
                      onClick={() => {
                        setSelectedPaymentMethod("All Payment Methods");
                        setOpenPaymentDialog(false);
                      }}
                    >
                      Select All
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="px-4 py-4 space-y-6">
                    {selectedCategory === "all" ? (
                      // Show all categories with their methods
                      paymentCategories.slice(1).map((category) => {
                        const categoryMethods = allPaymentMethods.filter(
                          (method) => 
                            method.category === category.id &&
                            method.name.toLowerCase().includes(paymentSearchQuery.toLowerCase())
                        );

                        if (categoryMethods.length === 0) return null;

                        return (
                          <div key={category.id}>
                            <h3 className="text-sm font-semibold mb-3 capitalize">
                              {category.name}
                            </h3>
                            <div className="space-y-0 bg-card rounded-lg overflow-hidden border">
                              {categoryMethods.map((method, index) => (
                                <button
                                  key={method.id}
                                  onClick={() => {
                                    setSelectedPaymentMethod(method.name);
                                    setOpenPaymentDialog(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left",
                                    index !== 0 && "border-t"
                                  )}
                                >
                                  <method.icon className="h-5 w-5 text-muted-foreground" />
                                  <span className="font-medium">{method.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // Show only selected category
                      <div>
                        <h3 className="text-sm font-semibold mb-3 capitalize">
                          {paymentCategories.find(c => c.id === selectedCategory)?.name}
                        </h3>
                        <div className="space-y-0 bg-card rounded-lg overflow-hidden border">
                          {allPaymentMethods
                            .filter((method) => {
                              const matchesSearch = method.name.toLowerCase().includes(paymentSearchQuery.toLowerCase());
                              const matchesCategory = method.category === selectedCategory;
                              return matchesSearch && matchesCategory;
                            })
                            .map((method, index) => (
                              <button
                                key={method.id}
                                onClick={() => {
                                  setSelectedPaymentMethod(method.name);
                                  setOpenPaymentDialog(false);
                                }}
                                className={cn(
                                  "w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left",
                                  index !== 0 && "border-t"
                                )}
                              >
                                <method.icon className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{method.name}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-24 h-14 text-base"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Dialog open={openCurrencyDialog} onOpenChange={setOpenCurrencyDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="h-10 px-3 font-semibold">
                      {currency}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Preferred currency</DialogTitle>
                    </DialogHeader>
                    <Command>
                      <CommandInput placeholder="Search for your currency" />
                      <CommandEmpty>No currency found.</CommandEmpty>

                      <div className="max-h-[400px] overflow-y-auto">
                        <CommandGroup heading="MOST POPULAR">
                          <CommandItem
                            value="any"
                            onSelect={() => {
                              setCurrency("USD");
                              setOpenCurrencyDialog(false);
                            }}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🌐</span>
                              <span>Any currency</span>
                            </div>
                            <span className="text-sm font-semibold">$£€</span>
                          </CommandItem>
                          {popularCurrencies.map((code) => {
                            const curr = currencies.find(c => c.code === code);
                            if (!curr) return null;
                            return (
                              <CommandItem
                                key={code}
                                value={code}
                                onSelect={() => {
                                  setCurrency(code);
                                  setOpenCurrencyDialog(false);
                                }}
                                className={cn(
                                  "flex items-center justify-between",
                                  currency === code && "bg-primary/10"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">{curr.flag}</span>
                                  <span>{curr.name}</span>
                                </div>
                                <span className={cn(
                                  "text-sm font-semibold px-3 py-1 rounded",
                                  currency === code ? "bg-green-500 text-white" : "bg-muted"
                                )}>
                                  {code}
                                </span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>

                        <CommandGroup heading="ALL CURRENCIES">
                          {currencies.filter(c => !popularCurrencies.includes(c.code)).map((curr) => (
                            <CommandItem
                              key={curr.code}
                              value={curr.code}
                              onSelect={() => {
                                setCurrency(curr.code);
                                setOpenCurrencyDialog(false);
                              }}
                              className={cn(
                                "flex items-center justify-between",
                                currency === curr.code && "bg-primary/10"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{curr.flag}</span>
                                <span>{curr.name}</span>
                              </div>
                              <span className={cn(
                                "text-sm font-semibold px-3 py-1 rounded",
                                currency === curr.code ? "bg-green-500 text-white" : "bg-muted"
                              )}>
                                {curr.code}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </div>
                    </Command>
                  </DialogContent>
                </Dialog>
                <button className="p-1 hover:bg-accent rounded-md transition-colors">
                  <Menu className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Offer Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Offer Location</Label>
              <button className="p-1 rounded-full hover:bg-accent transition-colors">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <Select value={offerLocation} onValueChange={setOfferLocation}>
              <SelectTrigger className="w-full h-14 text-base">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worldwide">Worldwide</SelectItem>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="ng">Nigeria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trader Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Trader Location</Label>
              <button className="p-1 rounded-full hover:bg-accent transition-colors">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <Select value={traderLocation} onValueChange={setTraderLocation}>
              <SelectTrigger className="w-full h-14 text-base">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usa">United States (USA)</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="ng">Nigeria</SelectItem>
                <SelectItem value="worldwide">Worldwide</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Find Offers Button */}
          <Button 
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
          >
            Find Offers
            <RotateCw className="ml-2 h-5 w-5" />
          </Button>

          {/* Educational Content */}
          <Card className="mt-8">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bitcoin className="h-12 w-12 text-primary" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center">
                How to {activeTab === "buy" ? "Buy" : "Sell"} Bitcoin on Pexly
              </h2>

              <p className="text-muted-foreground text-center">
                {activeTab === "buy" ? (
                  <>
                    It's now easy to buy Bitcoin on Pexly. You have access to over 300 payment 
                    options to purchase Bitcoin. As Pexly is a peer-to-peer marketplace, you can 
                    buy Bitcoin directly from over 3 million users worldwide. Our platform makes it 
                    extremely easy for beginners and veterans alike to start trading.
                  </>
                ) : (
                  <>
                    It's now easy to sell Bitcoin as a Pexly vendor. You have the freedom to set your own rates, 
                    and also the luxury of over 300 payment options to get paid for the Bitcoin you sell. As Pexly 
                    is a peer-to-peer marketplace, you can sell your Bitcoin directly to over 3 million users worldwide. 
                    Our platform makes it extremely easy for beginners and veterans alike to make a profit.
                  </>
                )}
              </p>

              <div className="space-y-4 mt-6">
                <p className="text-sm text-muted-foreground">
                  To {activeTab === "buy" ? "buy" : "sell"} Bitcoin instantly,{" "}
                  <a href="#" className="text-primary hover:underline">create a Pexly account</a>
                  {" "}or{" "}
                  <a href="#" className="text-primary hover:underline">log in to your existing one</a>
                  . Once logged in, just follow these steps:
                </p>

                <ol className="space-y-4 list-decimal list-inside">
                  <li className="text-sm">
                    <span className="font-semibold">Set your requirements</span> – Choose your preferred 
                    payment method and the {activeTab === "buy" ? "amount of Bitcoin you want to buy" : "maximum amount of Bitcoin you're willing to sell"}. You may also 
                    indicate your location and your preferred currency. Once you're done, click{" "}
                    <span className="font-semibold">Search For Offers</span>. You will see a list of 
                    relevant offers to choose from.
                  </li>
                  <li className="text-sm">
                    <span className="font-semibold">Review offers</span> – Before selecting an offer, 
                    be sure to check all vital information about the {activeTab === "buy" ? "seller" : "buyer"}, including but not limited to 
                    their name, reputation, verification level, and rate per Bitcoin. Once you've found a 
                    suitable offer, click <span className="font-semibold">{activeTab === "buy" ? "Buy" : "Sell"}</span>. It won't open a 
                    trade yet, but will guide you through the offer terms and conditions set by the {activeTab === "buy" ? "seller" : "buyer"}.
                  </li>
                  <li className="text-sm">
                    <span className="font-semibold">Start the trade</span> – If you are satisfied with 
                    the {activeTab === "buy" ? "seller's" : "buyer's"} terms, enter the amount you're willing to trade for and click{" "}
                    <span className="font-semibold">{activeTab === "buy" ? "Buy" : "Sell"} Now</span>. This will open a live trade chat 
                    and move {activeTab === "buy" ? "the seller's" : "your"} Bitcoin to our secured escrow. Read the instructions provided carefully, 
                    and follow them. {activeTab === "buy" ? "Once you complete your payment and the seller confirms, you can receive the Bitcoin." : "Once your buyer completes their end of the trade and you receive the payment, you can release the Bitcoin."} You can download a public receipt after the trade.
                  </li>
                  <li className="text-sm">
                    <span className="font-semibold">Leave feedback</span> – After successfully {activeTab === "buy" ? "buying" : "selling"} {" "}
                    your Bitcoin, don't forget to give your trade partner feedback. This is important for 
                    our platform as it helps build a user's reputation.
                  </li>
                </ol>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  For more information, watch our{" "}
                  <a href="#" className="text-primary hover:underline">detailed video tutorial</a>
                  {" "}on how to {activeTab === "buy" ? "buy" : "sell"} Bitcoin quickly. You can also create an offer to {activeTab === "buy" ? "buy" : "sell"} Bitcoin by 
                  following{" "}
                  <a href="#" className="text-primary hover:underline">our guide to creating an offer on Pexly</a>.
                </p>
              </div>

              <p className="text-sm text-center text-muted-foreground mt-6">
                Pexly peer-to-peer marketplace is easy to use, secured by escrow, and accessible across the globe. 
                Start trading today!
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}