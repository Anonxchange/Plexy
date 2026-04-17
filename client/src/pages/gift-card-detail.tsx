import { useHead } from "@unhead/react";
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  Wallet,
  Building2,
  ShoppingCart,
  Zap,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { sanitizeImageUrl } from "@/lib/sanitize";
import { PexlyFooter } from "@/components/pexly-footer";
import { useGiftCardProduct, useCreateGiftCardOrder } from "@/hooks/use-reloadly";
import { toast } from "sonner";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { GiftCardCartSheet } from "@/components/gift-card-cart-sheet";

const faqs = [
  {
    question: "What payment options do you accept?",
    answer: "We accept cryptocurrency payments including Bitcoin (BTC), Ethereum (ETH), and USDT. You can also use your Pexly balance for faster checkout.",
  },
  {
    question: "How long does it take to receive my gift card?",
    answer: "Most gift cards are delivered instantly via email after your payment is confirmed. Delivery typically takes 5–15 minutes depending on network confirmation.",
  },
  {
    question: "Can I use my Pexly balance to buy gift cards?",
    answer: "Yes! You can use your Pexly balance for instant purchases. Simply select 'Pexly balance' as your payment source at checkout.",
  },
  {
    question: "What is the maximum number of cards I can buy at once?",
    answer: "You can purchase up to 20 gift cards in a single order. For bulk orders, contact our support team.",
  },
  {
    question: "Are there any transaction fees?",
    answer: "We charge a small transaction fee when paying from an external wallet. Using your Pexly balance comes with reduced fees and faster processing.",
  },
  {
    question: "Can I refund a gift card purchase?",
    answer: "Refunds are available within 24 hours of purchase if the gift card code hasn't been redeemed. Please contact support for refund requests.",
  },
];

const networkOptions = [
  { id: "usdt-tron", name: "USDT (Tron)", symbol: "USDT", network: "TRX" },
  { id: "usdt-bsc", name: "USDT (BSC/BEP-20)", symbol: "USDT", network: "BSC" },
  { id: "usdt-ethereum", name: "USDT (Ethereum)", symbol: "USDT", network: "ETH" },
  { id: "btc", name: "Bitcoin", symbol: "BTC", network: "Bitcoin" },
  { id: "eth", name: "Ethereum", symbol: "ETH", network: "Ethereum" },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-none">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-medium">{question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <p className="text-sm text-muted-foreground pb-4 leading-relaxed">{answer}</p>
      )}
    </div>
  );
}

export function GiftCardDetail() {
  useHead({
    title: "Gift Card | Pexly",
    meta: [{ name: "description", content: "View and purchase this digital gift card with cryptocurrency. Instant delivery after payment." }],
  });
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
    createOrder(
      {
        productId: card.productId,
        unitPrice: parseFloat(cardValue),
        quantity: parseInt(numberOfCards),
        recipientEmail: email,
      },
      {
        onSuccess: () => {
          toast.success("Order placed successfully!");
          setShowExternalWalletDialog(false);
        },
        onError: (err) => {
          toast.error("Failed to place order: " + (err as Error).message);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading gift card...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Gift Card Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error ? (error as Error).message : "The requested gift card could not be found."}
          </p>
          <Button onClick={() => setLocation("/gift-cards")}>Back to Gift Cards</Button>
        </div>
      </div>
    );
  }

  const discountPercentage = card?.discountPercentage || 0;
  const qty = parseInt(numberOfCards) || 1;
  const value = parseFloat(cardValue) || 0;
  const discountAmount = value * (discountPercentage / 100);
  const unitFinalPrice = value - discountAmount;
  const totalFinalPrice = unitFinalPrice * qty;
  const totalOriginalPrice = value * qty;

  const handleAddToCart = async () => {
    if (!card) return;
    addToCart({
      productId: String(card.productId),
      title: card.productName,
      price: unitFinalPrice,
      currency: card.recipientCurrencyCode,
      image: sanitizeImageUrl(card.logoUrls?.[0]),
    });
    setCartOpen(true);
  };

  const briefDescription = card.redeemInstruction?.concise;
  const fullInstructions = card.redeemInstruction?.verbose || card.redeemInstruction?.concise;

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setLocation("/gift-cards")}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Gift Cards
          </button>
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
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">

          {/* ── LEFT COLUMN ─────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Hero card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-secondary/60 to-secondary/20 border border-border/60 shadow-sm">
              <div className="flex items-center justify-center p-10 min-h-[260px]">
                <img
                  src={sanitizeImageUrl(card.logoUrls?.[0])}
                  alt={card.productName}
                  className="max-h-44 max-w-full object-contain drop-shadow-xl"
                />
              </div>
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500 text-white border-none px-3 py-1 text-xs font-bold shadow">
                    <Tag className="h-3 w-3 mr-1" />
                    {discountPercentage}% OFF
                  </Badge>
                </div>
              )}
            </div>

            {/* Title + country */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold">{card.productName}</h1>
                {card.country?.isoName && (
                  <Badge variant="secondary" className="mt-1 flex-shrink-0">
                    {card.country.isoName}
                  </Badge>
                )}
              </div>
              {briefDescription && (
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  {briefDescription}
                </p>
              )}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Zap, label: "Instant delivery", sub: "5–15 min" },
                { icon: Shield, label: "Secure payment", sub: "Encrypted" },
                { icon: Clock, label: "24/7 support", sub: "Always on" },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border/60 bg-card p-4 text-center space-y-1"
                >
                  <Icon className="h-5 w-5 mx-auto text-primary" />
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>

            {/* How to redeem */}
            {fullInstructions && (
              <div className="rounded-xl border border-border/60 bg-card p-5 space-y-2">
                <h3 className="font-semibold text-sm">How to redeem</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{fullInstructions}</p>
              </div>
            )}

            {/* Accepted networks */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Pay with crypto</p>
              <div className="flex items-center gap-3">
                {[
                  { src: cryptoIconUrls.BTC, alt: "Bitcoin" },
                  { src: cryptoIconUrls.ETH, alt: "Ethereum" },
                  { src: cryptoIconUrls.USDT, alt: "USDT" },
                ].map(({ src, alt }) => (
                  <div key={alt} className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-3 py-1.5">
                    <img src={src} alt={alt} className="h-5 w-5 rounded-full" />
                    <span className="text-xs font-medium">{alt}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-3 py-1.5">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">+</div>
                  <span className="text-xs font-medium">More</span>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <h3 className="font-semibold mb-1">Frequently asked questions</h3>
              <div className="divide-y divide-border/60">
                {faqs.map((faq, i) => (
                  <FaqItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="sticky top-20 space-y-4">

              {/* Purchase card */}
              <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-5">

                {/* Value input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Card value ({card.recipientCurrencyCode})
                  </label>
                  <Input
                    type="number"
                    value={cardValue}
                    onChange={(e) => setCardValue(e.target.value)}
                    min={card.minRecipientDenomination}
                    max={card.maxRecipientDenomination}
                    className="h-12 text-base font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Range: {card.minRecipientDenomination} – {card.maxRecipientDenomination} {card.recipientCurrencyCode}
                  </p>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNumberOfCards((p) => String(Math.max(1, parseInt(p) - 1)))}
                      className="h-12 w-12 flex-shrink-0 rounded-xl border border-border bg-background hover:bg-secondary transition-colors text-lg font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={numberOfCards}
                      onChange={(e) => setNumberOfCards(e.target.value)}
                      className="flex-1 h-12 text-center text-base font-semibold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => setNumberOfCards((p) => String(parseInt(p) + 1))}
                      className="h-12 w-12 flex-shrink-0 rounded-xl border border-border bg-background hover:bg-secondary transition-colors text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Price summary */}
                <div className="space-y-2">
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Original price</span>
                      <span className="line-through text-muted-foreground">
                        {totalOriginalPrice.toFixed(2)} {card.recipientCurrencyCode}
                      </span>
                    </div>
                  )}
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">Discount ({discountPercentage}%)</span>
                      <span className="text-green-600 font-medium">
                        − {(totalOriginalPrice - totalFinalPrice).toFixed(2)} {card.recipientCurrencyCode}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold">
                      {totalFinalPrice.toFixed(2)} {card.recipientCurrencyCode}
                    </span>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="space-y-2.5 pt-1">
                  <Button
                    onClick={handleBuyCard}
                    className="w-full h-12 text-base font-bold bg-[#B4F22E] text-black hover:opacity-90 rounded-xl shadow-lg shadow-[#B4F22E]/20"
                  >
                    <span role="img" aria-label="gift" className="mr-2">🎁</span>
                    Buy Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="w-full h-12 text-base font-semibold rounded-xl"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </Button>
                </div>
              </div>

              {/* Security note */}
              <div className="flex items-start gap-2.5 rounded-xl bg-secondary/40 border border-border/40 px-4 py-3">
                <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your payment is protected by end-to-end encryption. Gift card codes are delivered securely to your email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <GiftCardCartSheet open={cartOpen} onOpenChange={setCartOpen} />

      {/* Payment source sheet */}
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
              Purchase using your Pexly balance or fund from an external wallet.
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

      {/* External wallet sheet */}
      <Sheet open={showExternalWalletDialog} onOpenChange={setShowExternalWalletDialog}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-2xl">Email & network</SheetTitle>
            <SheetDescription>
              Enter your email to receive{" "}
              {qty > 1 ? `${qty}x ` : ""}
              {cardValue} {card?.recipientCurrencyCode} {card?.productName}
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
