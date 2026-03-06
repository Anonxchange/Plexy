import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, ChevronDown, ShoppingCart, Wallet, Building2 } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

const faqs = [
  {
    question: "What payment options do you accept?",
    answer: "We accept cryptocurrency payments including Bitcoin (BTC), Ethereum (ETH), and USDT. You can also use your Pexly balance for faster checkout."
  },
  {
    question: "How long does it take to receive my gift card?",
    answer: "Most gift cards are delivered instantly via email after your payment is confirmed. Delivery typically takes 5-15 minutes depending on network confirmation."
  },
  {
    question: "Can I use my Pexly balance to buy gift cards?",
    answer: "Yes! You can use your Pexly balance for instant purchases. Simply select 'Pexly balance' as your payment source at checkout."
  },
  {
    question: "What is the maximum number of cards I can buy at once?",
    answer: "You can purchase up to 20 gift cards in a single order. For bulk orders, contact our support team."
  },
  {
    question: "Are there any transaction fees?",
    answer: "We charge a small transaction fee when paying from an external wallet. Using your Pexly balance comes with reduced fees and faster processing."
  },
  {
    question: "Can I refund a gift card purchase?",
    answer: "Refunds are available within 24 hours of purchase if the gift card code hasn't been redeemed. Please contact support for refund requests."
  }
];

const networkOptions = [
  { id: "usdt-tron", name: "USDT (Tron)", symbol: "USDT", network: "TRX" },
  { id: "usdt-bsc", name: "USDT (BSC/BEP-20)", symbol: "USDT", network: "BSC" },
  { id: "usdt-ethereum", name: "USDT (Ethereum)", symbol: "USDT", network: "ETH" },
  { id: "btc", name: "Bitcoin", symbol: "BTC", network: "Bitcoin" },
  { id: "eth", name: "Ethereum", symbol: "ETH", network: "Ethereum" },
];

import { useGiftCardProduct, useCreateGiftCardOrder } from "@/hooks/use-reloadly";
import { toast } from "sonner";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { GiftCardCartSheet } from "@/components/gift-card-cart-sheet";

export function GiftCardDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/gift-cards/:id");
  const [cardValue, setCardValue] = useState("");
  const [numberOfCards, setNumberOfCards] = useState("1");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showExternalWalletDialog, setShowExternalWalletDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("usdt-tron");

  const cardId = params?.id;
  const { data: card, isLoading } = useGiftCardProduct(cardId);
  const { mutate: createOrder, isPending: isOrdering } = useCreateGiftCardOrder();

  useEffect(() => {
    if (card) {
      setCardValue(String(card.minRecipientDenomination || 10));
    }
  }, [card]);

  const handleBuyCard = () => {
    if (!user) {
      setShowExternalWalletDialog(true);
    } else {
      setShowPaymentDialog(true);
    }
  };

  const handleContinueOrder = () => {
    if (!card) return;
    
    createOrder({
      productId: card.productId,
      unitPrice: parseFloat(cardValue),
      quantity: parseInt(numberOfCards),
      recipientEmail: email,
    }, {
      onSuccess: (data) => {
        toast.success("Order placed successfully!");
        setShowExternalWalletDialog(false);
        // Maybe redirect to a success page or show redeem code
      },
      onError: (err) => {
        toast.error("Failed to place order: " + (err as Error).message);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading gift card...</p>
        </div>
      </div>
    );
  }

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

  const discountAmount = value * (card.discountPercentage / 100);
  const finalPrice = value - discountAmount;
  const priceInCrypto = (finalPrice * 0.9985).toFixed(4);

  const { addToCart, isLoading: isAddingToCart } = useGiftCardCart();
  const [cartOpen, setCartOpen] = useState(false);

  const handleAddToCart = async () => {
    if (!card) return;
    
    addToCart({
      productId: String(card.productId),
      title: card.productName,
      price: finalPrice,
      currency: card.recipientCurrencyCode,
      image: card.logoUrls?.[0]
    });
    setCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setLocation("/gift-cards")}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">{card.productName}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Image and Info */}
          <div className="lg:order-1">
            <div
              className={`h-80 bg-gradient-to-br from-gray-100 to-white rounded-2xl overflow-hidden shadow-lg mb-4`}
            >
              <img
                src={card.logoUrls?.[0] || ""}
                alt={card.productName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">About</h3>
              <p className="text-muted-foreground leading-relaxed">
                {card.redeemInstruction?.verbose || card.redeemInstruction?.concise || ""}
              </p>
            </div>
          </div>

          {/* Right: Purchase Form */}
          <div className="lg:order-2">
            {/* Enter Card Value */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Enter card value
              </label>
              <Input
                type="number"
                value={cardValue}
                onChange={(e) => setCardValue(e.target.value)}
                min={card.minRecipientDenomination}
                max={card.maxRecipientDenomination}
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Range: {card.minRecipientDenomination} - {card.maxRecipientDenomination} {card.recipientCurrencyCode}
              </p>
            </div>

            {/* Number of Cards */}
            <div className="mb-4">
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
            </div>

            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">
                  Price for {card.brand?.brandName || card.productName || "Gift Card"}:
                </p>
                {card.discountPercentage > 0 && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none">
                    Save {card.discountPercentage}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
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
                {card.discountPercentage > 0 && (
                  <span className="text-sm text-muted-foreground line-through opacity-50">
                    {(value * 0.9985).toFixed(2)} USDT
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Selector & Add to Cart */}
            <div className="flex gap-3 mb-4">
              <div className="flex items-center bg-background border border-border rounded-xl px-2 h-12">
                <button 
                  onClick={() => setNumberOfCards(prev => String(Math.max(1, parseInt(prev) - 1)))}
                  className="p-2 text-blue-500 hover:bg-secondary rounded-lg transition-colors"
                >
                  −
                </button>
                <input 
                  type="number" 
                  value={numberOfCards}
                  onChange={(e) => setNumberOfCards(e.target.value)}
                  className="w-10 text-center bg-transparent border-none focus:ring-0 font-medium"
                />
                <button 
                  onClick={() => setNumberOfCards(prev => String(parseInt(prev) + 1))}
                  className="p-2 text-blue-500 hover:bg-secondary rounded-lg transition-colors"
                >
                  +
                </button>
              </div>

              <Button 
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="flex-1 h-12 font-bold bg-gradient-to-r from-orange-400 to-yellow-500 text-white hover:opacity-90 shadow-lg shadow-orange-500/20 rounded-xl"
              >
                {isAddingToCart ? "Adding..." : "Add to Cart"}
              </Button>

              <Button 
                variant="outline"
                className="h-12 w-24 rounded-xl border-border bg-card/50 hover:bg-secondary flex gap-2"
              >
                <span role="img" aria-label="gift">🎁</span>
                <span className="font-bold">Gift</span>
              </Button>
            </div>


            {/* Accepted Networks */}
            <div className="mb-4">
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
            <div className="mt-4 pb-8 border-b border-border">
              <h4 className="font-semibold text-foreground mb-2">How to redeem?</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {card.redeemInfo}
              </p>
            </div>

            <GiftCardCartSheet open={cartOpen} onOpenChange={setCartOpen} />

            {/* FAQ Section */}
            <div className="pt-8">
              <h3 className="text-lg font-semibold text-foreground mb-6">Frequently asked questions</h3>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Source Sheet */}
      <Sheet open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
            <SheetTitle className="text-center text-2xl">Choose payment source</SheetTitle>
            <SheetDescription className="text-center">
              Would you like to purchase the gift card using your Pexly balance or by depositing funds from an external wallet?
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 mt-6">
            <Button
              variant="outline"
              className="w-full h-12 justify-start px-4 border-border hover:bg-secondary"
              onClick={() => {
                setShowPaymentDialog(false);
                setShowExternalWalletDialog(true);
              }}
            >
              <Building2 className="h-5 w-5 mr-3" />
              <span className="flex-1 text-left">External wallet</span>
            </Button>

            <Button
              className="w-full h-12 justify-start px-4 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setShowPaymentDialog(false);
                // Handle Pexly balance flow
              }}
            >
              <Wallet className="h-5 w-5 mr-3" />
              <span className="flex-1 text-left">Pexly balance</span>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            *Use your Pexly balance to save on transaction fees
          </p>
        </SheetContent>
      </Sheet>

      {/* External Wallet Payment Sheet */}
      <Sheet open={showExternalWalletDialog} onOpenChange={setShowExternalWalletDialog}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-2xl">Email & network</SheetTitle>
            <SheetDescription>
              Please enter your email below to proceed with purchasing ${cardValue} {card?.name} for {priceInCrypto} USDT
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground">
                An email address is mandatory; we will send the activation code for the selected gift card to this address
              </p>
            </div>

            {/* Network Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Network</label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {networkOptions.map((network) => (
                    <SelectItem key={network.id} value={network.id}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Make sure to choose right network for your deposit
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => setShowExternalWalletDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!email || isOrdering}
                onClick={handleContinueOrder}
              >
                {isOrdering ? "Processing..." : "Continue"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <PexlyFooter />
    </div>
  );
}
