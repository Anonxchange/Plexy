import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, ChevronDown, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { PexlyFooter } from "@/components/pexly-footer";

const giftCards = [
  {
    id: 1,
    name: "iTunes Gift Card",
    brand: "Apple",
    priceRange: "$5 - $200",
    cryptoRange: "4.97 USDT - 198.85 USDT",
    discount: "-0.58%",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop",
    gradient: "from-gray-100 to-white",
    description: "Get access to millions of songs, movies, TV shows, and more with an iTunes Gift Card. Use it to download from the Apple App Store, iTunes Store, or buy Apple Music.",
    minValue: 5,
    maxValue: 200,
    available: 999,
    redeemInfo: "Visit the iTunes Store on your device, select 'Redeem Gift Card,' and enter your code. Your balance will be added instantly to your Apple Account.",
  },
  {
    id: 2,
    name: "PlayStation Store",
    brand: "Sony",
    priceRange: "$10 - $100",
    cryptoRange: "9.95 USDT - 99.50 USDT",
    discount: "-0.50%",
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop",
    gradient: "from-blue-600 to-blue-800",
    description: "Add funds to your PlayStation Network wallet. Buy games, in-game currency, subscriptions, and more from the PlayStation Store.",
    minValue: 10,
    maxValue: 100,
    available: 850,
    redeemInfo: "Go to your PlayStation console, navigate to the Store, select 'Redeem Code,' and enter your gift card code to add funds to your wallet.",
  },
  {
    id: 3,
    name: "Amazon Gift Card",
    brand: "Amazon",
    priceRange: "$25 - $500",
    cryptoRange: "24.75 USDT - 495.00 USDT",
    discount: "-1.00%",
    image: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400&h=300&fit=crop",
    gradient: "from-orange-400 to-yellow-500",
    description: "Shop millions of products at Amazon with an Amazon Gift Card. Use it for everything from electronics to clothing, delivered to your door.",
    minValue: 25,
    maxValue: 500,
    available: 750,
    redeemInfo: "Visit Amazon.com, go to 'Gift Cards,' select 'Redeem a Gift Card,' and enter your code. The balance will be credited to your account immediately.",
  },
  {
    id: 4,
    name: "Netflix Gift Card",
    brand: "Netflix",
    priceRange: "$15 - $100",
    cryptoRange: "14.85 USDT - 99.00 USDT",
    discount: "-1.00%",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=300&fit=crop",
    gradient: "from-red-600 to-red-800",
    description: "Enjoy unlimited streaming of TV shows, movies, and more. A Netflix Gift Card is the perfect gift for entertainment lovers.",
    minValue: 15,
    maxValue: 100,
    available: 999,
    redeemInfo: "Log into Netflix, go to Account settings, select 'Redeem a gift card,' and enter your code to add funds or start a subscription.",
  },
  {
    id: 5,
    name: "Spotify Premium",
    brand: "Spotify",
    priceRange: "$10 - $60",
    cryptoRange: "9.90 USDT - 59.40 USDT",
    discount: "-1.00%",
    image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=300&fit=crop",
    gradient: "from-green-500 to-green-700",
    description: "Enjoy millions of songs ad-free with Spotify Premium. Create playlists, download offline, and enjoy high-quality audio.",
    minValue: 10,
    maxValue: 60,
    available: 500,
    redeemInfo: "Visit spotify.com/redeem, enter your code, and follow the prompts to activate your Spotify Premium subscription.",
  },
  {
    id: 6,
    name: "Steam Wallet",
    brand: "Valve",
    priceRange: "$20 - $100",
    cryptoRange: "19.60 USDT - 98.00 USDT",
    discount: "-2.00%",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop",
    gradient: "from-slate-700 to-slate-900",
    description: "Add funds to your Steam account. Purchase games, in-game items, and digital content from the world's largest PC gaming platform.",
    minValue: 20,
    maxValue: 100,
    available: 1200,
    redeemInfo: "Open Steam, go to Help > Redeem a Steam Gift Card or Wallet Code, and enter your code to add funds to your Steam Wallet.",
  },
];

export function GiftCardDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/gift-cards/:id");
  const [cardValue, setCardValue] = useState(String(giftCards[0]?.minValue || 10));
  const [numberOfCards, setNumberOfCards] = useState("1");

  const cardId = params?.id ? parseInt(params.id) : null;
  const card = giftCards.find((c) => c.id === cardId);

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Gift Card Not Found</h1>
          <Button onClick={() => setLocation("/gift-cards")}>
            Back to Gift Cards
          </Button>
        </div>
      </div>
    );
  }

  const value = parseFloat(cardValue) || card.minValue;
  const priceInCrypto = (value * 0.9985).toFixed(4);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setLocation("/gift-cards")}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">{card.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image and Info */}
          <div className="lg:order-1">
            <div
              className={`h-80 bg-gradient-to-br ${card.gradient} rounded-2xl overflow-hidden shadow-lg mb-6`}
            >
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">About</h3>
              <p className="text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </div>
          </div>

          {/* Right: Purchase Form */}
          <div className="lg:order-2">
            {/* Enter Card Value */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Enter card value
              </label>
              <Input
                type="number"
                value={cardValue}
                onChange={(e) => setCardValue(e.target.value)}
                min={card.minValue}
                max={card.maxValue}
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Range: {card.minValue} - {card.maxValue}
              </p>
            </div>

            {/* Number of Cards */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Number of cards
              </label>
              <Select value={numberOfCards} onValueChange={setNumberOfCards}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 10, 15, 20].map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Available: {card.available}
              </p>
            </div>

            {/* Price Display */}
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-2">
                Price for {card.brand}: {value}
              </p>
              <div className="flex items-center gap-2">
                <img
                  src={cryptoIconUrls.USDT}
                  alt="USDT"
                  className="h-6 w-6 rounded-full"
                />
                <span className="text-2xl font-bold text-foreground">
                  {priceInCrypto} USDT
                </span>
              </div>
            </div>

            {/* Buy Button */}
            <Button className="w-full h-12 font-semibold mb-6 bg-primary text-primary-foreground hover:bg-primary/90">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Buy card
            </Button>

            {/* Accepted Networks */}
            <div className="mb-6">
              <h4 className="font-semibold text-foreground mb-3">
                Accepted networks
              </h4>
              <div className="flex gap-3">
                <img
                  src={cryptoIconUrls.BTC}
                  alt="Bitcoin"
                  className="h-8 w-8 rounded-full"
                />
                <img
                  src={cryptoIconUrls.ETH}
                  alt="Ethereum"
                  className="h-8 w-8 rounded-full"
                />
                <img
                  src={cryptoIconUrls.USDT}
                  alt="USDT"
                  className="h-8 w-8 rounded-full"
                />
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                  +
                </div>
              </div>
            </div>

            {/* How to Redeem */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="redeem">
                <AccordionTrigger className="text-sm font-semibold">
                  How to redeem?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  {card.redeemInfo}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}
