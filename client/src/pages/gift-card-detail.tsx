import { useHead } from "@unhead/react";
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Wallet, Building2, ShoppingCart } from "lucide-react";
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
import { useGiftCardProduct, useCreateGiftCardOrder } from "@/hooks/use-reloadly";
import { toast } from "sonner";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { Badge } from "@/components/ui/badge";
import { GiftCardCartSheet } from "@/components/gift-card-cart-sheet";

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

export function GiftCardDetail() {
  useHead({ title: "Gift Card | Pexly", meta: [{ name: "description", content: "View and purchase this digital gift card with cryptocurrency. Instant delivery after payment." }] });
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/gift-cards/:id");
  const [cardValue, setCardValue] = useState("");
  const [numberOfCards, setNumberOfCards] = useState("1");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showExternalWalletDialog, setShowExternalWalletDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("usdt-tron");

  const cardId = params?.id;
  const { data: card, isLoading, error } = useGiftCardProduct(cardId);
  const { mutate: createOrder, isPending: isOrdering } = useCreateGiftCardOrder();
  const { items: cartItems, addToCart, isLoading: isAddingToCart } = useGiftCardCart();
  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (card && !cardValue) {
      setCardValue(String(card.minRecipientDenomination || 10));
    }
  }, [card, cardValue]);

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
      onSuccess: () => {
        toast.success("Order placed successfully!");
        setShowExternalWalletDialog(false);
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

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Gift Card Not Found</h1>
          <p className="text-muted-foreground mb-4">{error ? (error as Error).message : "The requested gift card could not be found."}</p>
          <Button onClick={() => setLocation("/gift-cards")}>
            Back to Gift Cards
          </Button>
        </div>
      </div>
    );
  }

  const discountPercentage = card?.discountPercentage || 0;
  const value = parseFloat(cardValue) || 0;
  const discountAmount = value * (discountPercentage / 100);
  const finalPrice = value - discountAmount;

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
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setLocation("/gift-cards")}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground flex-1">{card.productName}</h1>
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:order-1">
            <div className="h-80 bg-secondary/30 border border-border rounded-2xl overflow-hidden flex items-center justify-center p-8 shadow-lg mb-4">
              <img
                src={card.logoUrls?.[0] || ""}
                alt={card.productName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">About</h3>
              <p className="text-muted-foreground leading-relaxed">
                {card.redeemInstruction?.verbose || card.redeemInstruction?.concise || ""}
              </p>
            </div>
          </div>

          <div className="lg:order-2">
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
                  Price for {card.productName || "Gift Card"}:
                </p>
                {discountPercentage > 0 && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none">
                    Save {discountPercentage}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">
                  {(finalPrice * (parseInt(numberOfCards) || 1)).toFixed(2)} {card.recipientCurrencyCode}
                </span>
                {discountPercentage > 0 && (
                  <span className="text-sm text-muted-foreground line-through opacity-50">
                    {(value * (parseInt(numberOfCards) || 1)).toFixed(2)} {card.recipientCurrencyCode}
                  </span>
                )}
              </div>
            </div>

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
                className="flex-1 h-12 font-bold bg-[#B4F22E] text-black hover:opacity-90 shadow-lg shadow-[#B4F22E]/20 rounded-xl"
              >
                {isAddingToCart ? "Adding..." : "Add to Cart"}
              </Button>

              <Button 
                variant="outline"
                className="h-12 w-24 rounded-xl border-border bg-card/50 hover:bg-secondary flex gap-2"
                onClick={handleBuyCard}
              >
                <span role="img" aria-label="gift">🎁</span>
                <span className="font-bold">Buy</span>
              </Button>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-foreground mb-3">
                Accepted networks
              </h4>
              <div className="flex gap-3">
                <img src={cryptoIconUrls.BTC} alt="Bitcoin" className="h-8 w-8 rounded-full" />
                <img src={cryptoIconUrls.ETH} alt="Ethereum" className="h-8 w-8 rounded-full" />
                <img src={cryptoIconUrls.USDT} alt="USDT" className="h-8 w-8 rounded-full" />
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">+</div>
              </div>
            </div>

            <div className="mt-4 pb-8 border-b border-border">
              <h4 className="font-semibold text-foreground mb-2">How to redeem?</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {card.redeemInstruction?.verbose || card.redeemInstruction?.concise || "Instructions will be provided after purchase."}
              </p>
            </div>

            <GiftCardCartSheet open={cartOpen} onOpenChange={setCartOpen} />

            <div className="pt-8">
              <h3 className="text-lg font-semibold text-foreground mb-6">Frequently asked questions</h3>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-sm">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </main>

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
                handleContinueOrder();
              }}
            >
              <Wallet className="h-5 w-5 mr-3" />
              <span className="flex-1 text-left">Pexly balance</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showExternalWalletDialog} onOpenChange={setShowExternalWalletDialog}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-2xl">Email & network</SheetTitle>
            <SheetDescription>
              Please enter your email below to proceed with purchasing {cardValue} {card?.recipientCurrencyCode} {card?.productName}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
              />
            </div>
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
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setShowExternalWalletDialog(false)}>Cancel</Button>
              <Button className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90" disabled={!email || isOrdering} onClick={handleContinueOrder}>
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
