import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { placeReloadlyOrder } from "@/hooks/use-utility-billers";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PexlyIcon } from "@/components/pexly-icon";
import {
  Lock,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ChevronDown,
  ShieldCheck,
  Zap,
  Mail,
  Gift,
  TicketPercent,
  Smartphone,
} from '@/lib/icons';
import { getExchangeRates } from "@/lib/crypto-prices";
import NowPaymentsCheckout from "@/components/nowpayments-checkout";

type DeliveryTarget = "self" | "gift";
type PaymentMethod = "card" | "paypal" | "crypto";
type CheckoutStep = "contact" | "payment" | "paying";

// ── Payment method catalogue — swap these 8 when the user provides them ──
// `id` must match a NowPayments currency code (e.g. "btc", "eth") for crypto,
// or "paypal" / "card" for those flows.
// `networks` are the small chain badges shown on the right of each row.
type PaymentMethodDef = {
  id: string;
  label: string;
  bg: string;           // icon circle background color
  symbol: string;       // single glyph shown inside the circle
  networks?: { label: string; bg: string; text: string }[];
  fee?: string;         // e.g. "+$1.00" shown next to label
  kind: "crypto" | "paypal" | "card" | "gift";
};

const PAYMENT_METHODS: PaymentMethodDef[] = [
  {
    id: "btc",
    label: "BTC",
    bg: "#F7931A",
    symbol: "₿",
    kind: "crypto",
    networks: [
      { label: "BTC",       bg: "#F7931A", text: "₿" },
      { label: "Lightning", bg: "#F4BC00", text: "⚡" },
      { label: "Liquid",    bg: "#1A478E", text: "L" },
    ],
  },
  {
    id: "eth",
    label: "ETH",
    bg: "#627EEA",
    symbol: "Ξ",
    kind: "crypto",
    networks: [
      { label: "ETH",    bg: "#627EEA", text: "Ξ" },
      { label: "Arbitrum", bg: "#28A0F0", text: "A" },
    ],
  },
  {
    id: "usdcmatic",
    label: "USDC",
    bg: "#2775CA",
    symbol: "$",
    kind: "crypto",
    networks: [
      { label: "Polygon", bg: "#8247E5", text: "P" },
      { label: "ETH",     bg: "#627EEA", text: "Ξ" },
      { label: "Solana",  bg: "#9945FF", text: "◎" },
      { label: "AVAX",    bg: "#E84142", text: "A" },
    ],
  },
  {
    id: "usdtmatic",
    label: "USDT",
    bg: "#26A17B",
    symbol: "₮",
    kind: "crypto",
    networks: [
      { label: "Polygon", bg: "#8247E5", text: "P" },
      { label: "TRX",     bg: "#EB0029", text: "T" },
      { label: "SOL",     bg: "#9945FF", text: "◎" },
      { label: "BNB",     bg: "#F3BA2F", text: "B" },
    ],
  },
  {
    id: "sol",
    label: "SOL",
    bg: "#9945FF",
    symbol: "◎",
    kind: "crypto",
    networks: [
      { label: "Solana", bg: "#9945FF", text: "◎" },
    ],
  },
  {
    id: "ltc",
    label: "LTC",
    bg: "#BFBBBB",
    symbol: "Ł",
    kind: "crypto",
    networks: [
      { label: "LTC", bg: "#BFBBBB", text: "Ł" },
    ],
  },
  {
    id: "ton",
    label: "TON",
    bg: "#0088CC",
    symbol: "▼",
    kind: "crypto",
    networks: [
      { label: "TON", bg: "#0088CC", text: "T" },
    ],
  },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function SectionTitle({ step, title, sub }: { step: number; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
        {step}
      </div>
      <div>
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

type PendingOrder = {
  type: "topup" | "utility" | "giftcard";
  title: string;
  description: string;
  amount: number;
  currency: string;
  image?: string;
  metadata: Record<string, any>;
};

export function Checkout() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { items, updateQuantity, removeItem, clearCart } = useGiftCardCart();
  const [deliveryTarget, setDeliveryTarget] = useState<DeliveryTarget>("self");
  const [activePayment, setActivePayment] = useState<PaymentMethod>("card");
  const [fulfilling, setFulfilling] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("contact");
  const [sendAsGift, setSendAsGift] = useState(false);
  const [promoToggle, setPromoToggle] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(PAYMENT_METHODS[0].id);
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [pendingOrder] = useState<PendingOrder | null>(() => {
    try {
      const raw = localStorage.getItem("pexly_pending_order");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [pendingDeliveryEmail, setPendingDeliveryEmail] = useState("");
  const [pendingGiftDelivery, setPendingGiftDelivery] = useState<"self" | "gift">("self");
  const [pendingGiftRecipientEmail, setPendingGiftRecipientEmail] = useState("");
  const [pendingGiftRecipientName, setPendingGiftRecipientName] = useState("");
  const [pendingGiftMessageText, setPendingGiftMessageText] = useState("");
  const { checkout: paypalCheckout, loading: paypalLoading } = usePayPal();

  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getExchangeRates()
      .then((r) => { if (!cancelled) setRates(r); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const buyerEmail = user?.email || "";

  if ((!items || items.length === 0) && !pendingOrder) {
    return (
      <BrandShell>
        <div className="max-w-md mx-auto text-center py-20 px-4">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-5">
            <ShoppingBag className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Browse our gift card catalog to get started.
          </p>
          <Button className="mt-6" onClick={() => setLocation("/gift-cards")}>
            Browse gift cards
          </Button>
        </div>
      </BrandShell>
    );
  }

  if (pendingOrder) {
    const processingFee = pendingOrder.type === "giftcard" ? 0.55 : 0;
    const pendingTotal = pendingOrder.amount + processingFee;
    const pendingAmountUsd = pendingOrder.currency.toUpperCase() === "USD"
      ? pendingOrder.amount
      : rates[pendingOrder.currency.toUpperCase()]
        ? pendingOrder.amount / rates[pendingOrder.currency.toUpperCase()]
        : null;
    const pendingTotalUsd = pendingOrder.type === "giftcard"
      ? (pendingAmountUsd !== null ? pendingAmountUsd : pendingOrder.amount) + processingFee
      : pendingTotal;

    const contactEmail = pendingDeliveryEmail || buyerEmail;

    const handleOrderSuccess = () => {
      localStorage.removeItem("pexly_pending_order");
      try {
        const saved = JSON.parse(localStorage.getItem("pexly_digital_orders") || "[]");
        saved.unshift({
          id: `${pendingOrder.type}_${Date.now()}`,
          type: pendingOrder.type,
          title: pendingOrder.title,
          amount: pendingTotal,
          currency: pendingOrder.currency.toUpperCase(),
          placedAt: new Date().toISOString(),
          status: "fulfilled",
          ...pendingOrder.metadata,
        });
        localStorage.setItem("pexly_digital_orders", JSON.stringify(saved.slice(0, 100)));
      } catch {}
      toast({ title: "Payment confirmed!", description: "Your order has been placed successfully." });
      setLocation("/account-settings?section=shop-history");
    };

    const getPayPalPayload = () => {
      if (pendingOrder.type === "topup") {
        return { productType: "airtime" as const, operatorId: Number(pendingOrder.metadata.operatorId), amount: pendingOrder.amount };
      }
      return { productType: "total" as const, amount: pendingTotalUsd, currency: "USD" };
    };

    // Display label for amount
    const displayCurrency = pendingOrder.currency.toUpperCase();
    const displayAmount = pendingOrder.amount;
    const displayTotal = pendingAmountUsd !== null
      ? (pendingAmountUsd + processingFee)
      : pendingTotal;

    // Sub-line shown under product name in summary (phone / account / qty)
    const orderSubline = pendingOrder.metadata?.recipientPhone
      || pendingOrder.metadata?.accountNumber
      || (pendingOrder.metadata?.quantity > 1 ? `Qty: ${pendingOrder.metadata.quantity}` : "")
      || "";

    return (
      <BrandShell>
        <main className="max-w-md mx-auto px-4 py-8 space-y-5">

          {/* ── Step: Contact ── */}
          {checkoutStep === "contact" && (
            <>
              <h1 className="text-2xl font-extrabold text-foreground">
                Where should we send your order?
              </h1>

              {/* Email block */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Email</p>
                  <Input
                    type="email"
                    value={pendingDeliveryEmail || buyerEmail}
                    onChange={(e) => setPendingDeliveryEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 text-base bg-background border-border rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <span>We'll send your order and receipt here</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>No account needed</span>
                  </div>
                </div>
              </div>

              {/* Send as gift toggle */}
              <div className="rounded-2xl border border-border bg-card px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Send as gift</span>
                </div>
                <button
                  onClick={() => setSendAsGift(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    sendAsGift ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      sendAsGift ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Gift recipient fields */}
              {sendAsGift && (
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1.5">Recipient email</p>
                    <Input
                      type="email"
                      value={pendingGiftRecipientEmail}
                      onChange={(e) => setPendingGiftRecipientEmail(e.target.value)}
                      placeholder="friend@example.com"
                      className="h-11 bg-background border-border rounded-xl"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1.5">Recipient name (optional)</p>
                    <Input
                      value={pendingGiftRecipientName}
                      onChange={(e) => setPendingGiftRecipientName(e.target.value)}
                      placeholder="Their name"
                      className="h-11 bg-background border-border rounded-xl"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1.5">Personal message (optional)</p>
                    <Textarea
                      value={pendingGiftMessageText}
                      onChange={(e) => setPendingGiftMessageText(e.target.value)}
                      placeholder="Add a note…"
                      className="resize-none bg-background border-border rounded-xl"
                      rows={3}
                      maxLength={250}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{pendingGiftMessageText.length}/250</p>
                  </div>
                </div>
              )}

              {/* Continue CTA */}
              <button
                onClick={() => setCheckoutStep("payment")}
                disabled={!contactEmail}
                className="w-full py-4 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold text-base transition-all active:scale-[0.98] shadow-md"
              >
                Continue
              </button>

              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                By clicking 'Continue', you agree to our{" "}
                <a href="/terms" className="underline hover:text-foreground">Terms &amp; Conditions</a>
                {" "}and{" "}
                <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
              </p>

              {/* Summary accordion */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setShowOrderSummary(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <span className="font-semibold text-foreground">Summary</span>
                  {showOrderSummary
                    ? <ChevronDown className="h-5 w-5 text-muted-foreground rotate-180 transition-transform" />
                    : <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
                  }
                </button>

                {showOrderSummary && (
                  <div className="px-5 pb-5 space-y-4">
                    {/* Item row */}
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {pendingOrder.image
                          ? <img src={pendingOrder.image} alt={pendingOrder.title} className="w-full h-full object-contain p-1.5" />
                          : <Zap className="h-6 w-6 text-primary" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">{pendingOrder.title}</p>
                        {orderSubline ? (
                          <p className="text-xs text-muted-foreground mt-0.5">{orderSubline}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {displayCurrency} {displayAmount.toFixed(2)} value
                        </p>
                      </div>
                      {/* Quantity pill — fixed at 1 for pending orders, not hardcoded */}
                      <div className="flex items-center gap-1.5 border border-border rounded-full px-3 py-1 text-sm font-medium text-foreground">
                        <span>1</span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <button
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => {
                          localStorage.removeItem("pexly_pending_order");
                          setLocation("/");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Per-item total */}
                    <div className="flex justify-end">
                      <span className="text-sm font-semibold text-foreground">
                        {displayCurrency !== "USD" && pendingAmountUsd !== null
                          ? `${pendingAmountUsd.toFixed(2)}`
                          : `${displayAmount.toFixed(2)}`
                        }
                      </span>
                    </div>

                    <Separator />

                    {/* Promo code toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <TicketPercent className="h-4 w-4 text-foreground" />
                        <span className="text-sm font-medium text-foreground">Enter a Promo Code</span>
                      </div>
                      <button
                        onClick={() => setPromoToggle(v => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          promoToggle ? "bg-primary" : "bg-border"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            promoToggle ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {promoToggle && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Promo code"
                          value={promoCode}
                          onChange={(e) => { setPromoCode(e.target.value); setPromoApplied(false); }}
                          className="h-10 bg-background border-border rounded-xl"
                        />
                        <Button
                          variant="outline"
                          className="h-10 shrink-0"
                          disabled={!promoCode.trim() || promoApplied}
                          onClick={() => setPromoApplied(true)}
                        >
                          {promoApplied ? "Applied ✓" : "Apply"}
                        </Button>
                      </div>
                    )}

                    <Separator />

                    {/* Total */}
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-bold text-foreground">Total</span>
                      <span className="text-xl font-extrabold text-foreground">
                        ${displayTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Step: Payment method selection ── */}
          {checkoutStep === "payment" && (
            <>
              {/* Sticky total + continue row */}
              <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-5 py-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                  <p className="text-xl font-extrabold text-foreground">${displayTotal.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setCheckoutStep("paying")}
                  className="px-8 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>

              {/* Method selection */}
              <div>
                <h2 className="text-2xl font-extrabold text-foreground mb-1">Payment method</h2>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                  Choose a payment method
                </p>

                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => {
                    const selected = selectedMethodId === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethodId(method.id)}
                        className={`w-full flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all text-left ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                        }`}
                      >
                        {/* Radio indicator */}
                        <div className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                          selected ? "border-primary" : "border-muted-foreground/40"
                        }`}>
                          {selected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>

                        {/* Coin icon */}
                        <div
                          className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm"
                          style={{ backgroundColor: method.bg }}
                        >
                          {method.symbol}
                        </div>

                        {/* Label + fee */}
                        <div className="flex-1 min-w-0">
                          <span className="text-base font-semibold text-foreground">{method.label}</span>
                          {method.fee && (
                            <span className="ml-2 text-xs text-muted-foreground font-medium">{method.fee}</span>
                          )}
                        </div>

                        {/* Network badges */}
                        {method.networks && method.networks.length > 0 && (
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            {method.networks.map((net) => (
                              <div
                                key={net.label}
                                title={net.label}
                                className="h-6 w-6 rounded-full border-2 border-card flex items-center justify-center text-white text-[9px] font-bold shadow-sm"
                                style={{ backgroundColor: net.bg }}
                              >
                                {net.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary accordion */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setShowOrderSummary(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <span className="font-semibold text-foreground">Summary</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showOrderSummary ? "rotate-180" : ""}`} />
                </button>

                {showOrderSummary && (
                  <div className="px-5 pb-5 space-y-4">
                    {/* Item row */}
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {pendingOrder.image
                          ? <img src={pendingOrder.image} alt={pendingOrder.title} className="w-full h-full object-contain p-1.5" />
                          : <Zap className="h-6 w-6 text-primary" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">{pendingOrder.title}</p>
                        {orderSubline ? <p className="text-xs text-muted-foreground mt-0.5">{orderSubline}</p> : null}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {displayCurrency} {displayAmount.toFixed(2)} value
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 border border-border rounded-full px-3 py-1 text-sm font-medium text-foreground shrink-0">
                        <span>1</span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <button
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => { localStorage.removeItem("pexly_pending_order"); setLocation("/"); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex justify-end">
                      <span className="text-sm font-semibold text-foreground">
                        ${(pendingAmountUsd ?? displayAmount).toFixed(2)}
                      </span>
                    </div>

                    <Separator />

                    {/* Send as gift toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Gift className="h-4 w-4 text-foreground" />
                        <span className="text-sm font-medium text-foreground">Send as gift</span>
                      </div>
                      <button
                        onClick={() => setSendAsGift(v => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sendAsGift ? "bg-primary" : "bg-border"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${sendAsGift ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    {/* Promo code toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <TicketPercent className="h-4 w-4 text-foreground" />
                        <span className="text-sm font-medium text-foreground">Enter a Promo Code</span>
                      </div>
                      <button
                        onClick={() => setPromoToggle(v => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${promoToggle ? "bg-primary" : "bg-border"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${promoToggle ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    {promoToggle && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Promo code"
                          value={promoCode}
                          onChange={(e) => { setPromoCode(e.target.value); setPromoApplied(false); }}
                          className="h-10 bg-background border-border rounded-xl"
                        />
                        <Button variant="outline" className="h-10 shrink-0" disabled={!promoCode.trim() || promoApplied} onClick={() => setPromoApplied(true)}>
                          {promoApplied ? "Applied ✓" : "Apply"}
                        </Button>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-bold text-foreground">Total</span>
                      <span className="text-xl font-extrabold text-foreground">${displayTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom continue */}
              <button
                onClick={() => setCheckoutStep("paying")}
                className="w-full py-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-all active:scale-[0.98] shadow-md"
              >
                Continue
              </button>
            </>
          )}

          {/* ── Step: Actual payment widget ── */}
          {checkoutStep === "paying" && (() => {
            const method = PAYMENT_METHODS.find(m => m.id === selectedMethodId) ?? PAYMENT_METHODS[0];
            return (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => setCheckoutStep("payment")} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className="h-5 w-5 rotate-90" />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: method.bg }}>
                      {method.symbol}
                    </div>
                    <h1 className="text-xl font-extrabold text-foreground">Pay with {method.label}</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-4 py-2.5">
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Sending to <strong className="text-foreground">{contactEmail || "your email"}</strong></span>
                </div>

                {method.kind === "crypto" && (
                  <NowPaymentsCheckout
                    amount={pendingOrder.type === "giftcard" ? pendingTotalUsd : pendingTotal}
                    currency={pendingOrder.type === "giftcard" ? "usd" : pendingOrder.currency}
                    payCurrency={method.id}
                    description={pendingOrder.description}
                    metadata={pendingOrder.metadata}
                    onPaymentSuccess={handleOrderSuccess}
                    onChangeMethod={() => setCheckoutStep("payment")}
                    onChangeEmail={() => setCheckoutStep("contact")}
                    methodLabel={method.label}
                    methodBg={method.bg}
                    methodSymbol={method.symbol}
                    networkName={method.networks?.[0]?.label}
                    email={contactEmail}
                    orderTitle={pendingOrder.title}
                    orderSubline={orderSubline}
                    orderCurrency={displayCurrency}
                    orderAmount={displayAmount}
                    orderImage={pendingOrder.image}
                  />
                )}

                {method.kind === "paypal" && (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4">
                    <p className="text-sm text-muted-foreground">You will be redirected to PayPal to complete your payment securely.</p>
                    <Button
                      className="w-full h-12 bg-[#0070BA] text-white hover:bg-[#005ea6] font-bold rounded-2xl gap-2"
                      disabled={paypalLoading}
                      onClick={async () => {
                        const result = await paypalCheckout(getPayPalPayload());
                        if (result) handleOrderSuccess();
                      }}
                    >
                      {paypalLoading
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                        : <><img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="" /> Continue to PayPal</>
                      }
                    </Button>
                  </div>
                )}

                <p className="text-center text-xs text-muted-foreground pb-4">
                  By placing your order you agree to our{" "}
                  <a href="/terms" className="underline hover:text-foreground">Terms of service</a>{" "}
                  and <a href="/privacy" className="underline hover:text-foreground">Privacy policy</a>
                </p>
              </>
            );
          })()}
        </main>
      </BrandShell>
    );
  }

  const toUsd = (price: number, currency?: string) => {
    const code = (currency || "USD").toUpperCase();
    if (code === "USD") return price;
    const rate = rates[code];
    if (!rate || rate <= 0) return price;
    return price / rate;
  };

  const itemsUsd = items.map((item) => {
    const price = typeof item?.price === "number" ? item.price : parseFloat(String(item?.price || 0));
    const qty = typeof item?.quantity === "number" ? item.quantity : parseInt(String(item?.quantity || 0));
    const unitUsd = toUsd(price, item?.currency);
    return { ...item, _unitUsd: unitUsd, _qty: qty, _lineUsd: unitUsd * qty };
  });

  const subtotal = itemsUsd.reduce((acc, i) => acc + i._lineUsd, 0);
  const processingFee = 0.55;
  const discount = promoApplied ? Math.min(subtotal * 0.05, 10) : 0;
  const total = Math.max(0, subtotal + processingFee - discount);
  const totalItems = items.reduce((acc, i) => acc + (i.quantity || 0), 0);

  const deliveryEmail = deliveryTarget === "gift" ? recipientEmail : buyerEmail;
  const recipientValid = deliveryTarget === "self" || /^\S+@\S+\.\S+$/.test(recipientEmail);

  const handlePaypalCheckout = async () => {
    const result = await paypalCheckout({ productType: "total", amount: total, currency: "USD" });
    if (!result) return;
    setFulfilling(true);
    try {
      await Promise.all(
        items.map((item) =>
          placeReloadlyOrder({
            productId: Number(item.productId),
            quantity: item.quantity,
            unitPrice: item.price,
            recipientEmail: deliveryEmail || undefined,
          })
        )
      );
      clearCart();
      try {
        const saved = JSON.parse(localStorage.getItem("pexly_digital_orders") || "[]");
        saved.unshift({
          id: `gc_${Date.now()}`,
          type: "giftcard",
          title: items.length === 1 ? items[0].title : `${items.length} gift card${items.length > 1 ? "s" : ""}`,
          amount: total,
          currency: "USD",
          recipientEmail: deliveryEmail || undefined,
          placedAt: new Date().toISOString(),
          status: "fulfilled",
        });
        localStorage.setItem("pexly_digital_orders", JSON.stringify(saved.slice(0, 100)));
      } catch {}
      toast({ title: "Order placed!", description: "Your gift cards will be emailed to you shortly." });
      setLocation("/account-settings?section=shop-history");
    } catch (e: any) {
      toast({
        title: "Delivery error",
        description: e.message ?? "Payment captured but gift card delivery failed. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setFulfilling(false);
    }
  };

  return (
    <BrandShell>
      {/* Mobile order summary toggle */}
      <div className="lg:hidden border-b border-border/60 bg-secondary/30">
        <button
          onClick={() => setShowOrderSummary((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ShoppingBag className="h-4 w-4" />
            {showOrderSummary ? "Hide" : "Show"} order summary ({totalItems} item{totalItems !== 1 ? "s" : ""})
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">${total.toFixed(2)}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showOrderSummary ? "rotate-180" : ""}`} />
          </div>
        </button>
        {showOrderSummary && (
          <div className="px-4 pb-4">
            <OrderSummaryItems
              items={itemsUsd}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              subtotal={subtotal}
              processingFee={processingFee}
              discount={discount}
              total={total}
            />
          </div>
        )}
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero / progress */}
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold text-primary tracking-widest uppercase">
              Secure checkout
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
              Complete your purchase
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Digital codes are emailed within minutes after payment confirms.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Cart
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <span className="h-4 w-4 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center">2</span>
              Checkout
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Confirmation</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
          {/* ── LEFT: Form ── */}
          <div className="space-y-8">
            {/* Contact */}
            <section>
              <SectionTitle step={1} title="Contact" sub="We send your receipt and account updates here." />
              <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    defaultValue={buyerEmail}
                    className="h-11"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>
                    Signed in as <strong className="text-foreground">{buyerEmail}</strong>
                  </span>
                  <button className="text-primary font-semibold hover:underline">Change</button>
                </div>
              </div>
            </section>

            {/* Delivery (digital) */}
            <section>
              <SectionTitle
                step={2}
                title="Delivery"
                sub="Codes are delivered instantly by email — no shipping required."
              />

              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { id: "self" as const, label: "Send to me", icon: Mail },
                  { id: "gift" as const, label: "Send as gift", icon: Gift },
                ].map(({ id, label, icon: Icon }) => {
                  const active = deliveryTarget === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setDeliveryTarget(id)}
                      className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors text-left ${
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border/60 bg-card hover:border-border"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        active ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${active ? "text-foreground" : "text-foreground"}`}>
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {id === "self" ? buyerEmail : "Email a friend"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {deliveryTarget === "gift" && (
                <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Recipient email</FieldLabel>
                      <Input
                        type="email"
                        placeholder="friend@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <FieldLabel>Recipient name (optional)</FieldLabel>
                      <Input
                        placeholder="Their name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Personal message (optional)</FieldLabel>
                    <Textarea
                      placeholder="Add a short note that arrives with the gift…"
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      maxLength={250}
                      className="min-h-[80px] resize-none"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1 text-right">
                      {giftMessage.length}/250
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Schedule delivery (optional)</FieldLabel>
                    <Input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="h-11"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                      <HeartHandshake className="h-3 w-3" />
                      Leave blank to deliver immediately after payment.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Payment */}
            <section>
              <SectionTitle step={3} title="Payment" sub="All transactions are encrypted end-to-end." />
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                {/* Method selector tiles */}
                <div className="grid grid-cols-3 gap-px bg-border/60">
                  {(
                    [
                      {
                        id: "card" as PaymentMethod,
                        logo: (
                          <div className="flex items-center gap-1">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="MC" />
                          </div>
                        ),
                        label: "Card",
                        sub: "Visa, Mastercard",
                      },
                      {
                        id: "paypal" as PaymentMethod,
                        logo: <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="PayPal" />,
                        label: "PayPal",
                        sub: "Wallet & balance",
                      },
                      {
                        id: "crypto" as PaymentMethod,
                        logo: <span className="text-xl">₿</span>,
                        label: "Crypto",
                        sub: "BTC, ETH, USDT…",
                      },
                    ] as const
                  ).map((tab) => {
                    const active = activePayment === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActivePayment(tab.id)}
                        className={`flex flex-col items-center gap-1.5 py-4 text-xs font-semibold transition-colors relative ${
                          active ? "bg-card text-foreground" : "bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
                        }`}
                      >
                        {tab.logo}
                        <span>{tab.label}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{tab.sub}</span>
                        {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />}
                      </button>
                    );
                  })}
                </div>

                <div className="p-5">
                  {activePayment === "card" && (
                    <div className="space-y-3">
                      <div>
                        <FieldLabel>Card number</FieldLabel>
                        <Input placeholder="1234 5678 9012 3456" className="h-11" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Expiry date</FieldLabel>
                          <Input placeholder="MM / YY" className="h-11" />
                        </div>
                        <div>
                          <FieldLabel>CVV</FieldLabel>
                          <Input placeholder="•••" className="h-11" />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Name on card</FieldLabel>
                        <Input placeholder="Full name" className="h-11" />
                      </div>
                    </div>
                  )}

                  {activePayment === "paypal" && (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        You'll be redirected to PayPal to complete your purchase securely.
                      </p>
                      <Button
                        className="w-full h-12 bg-[#0070BA] text-white hover:bg-[#005ea6] font-bold rounded-xl gap-2"
                        disabled={paypalLoading || fulfilling}
                        onClick={handlePaypalCheckout}
                      >
                        {paypalLoading || fulfilling ? (
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-5" alt="" />
                            Continue with PayPal
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {activePayment === "crypto" && (
                    <NowPaymentsCheckout
                      amount={total}
                      currency="usd"
                      description={`Gift card purchase — ${items.length} item(s)`}
                      metadata={{ recipientEmail: deliveryEmail || undefined }}
                      onPaymentSuccess={() => {
                        clearCart();
                        toast({ title: "Order placed!", description: "Your gift cards will be emailed to you shortly." });
                        setLocation("/account-settings?section=shop-history");
                      }}
                    />
                  )}
                </div>
              </div>

              {activePayment === "card" && (
                <Button className="mt-4 w-full h-14 text-base font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-lg gap-2">
                  <Lock className="h-5 w-5" />
                  Pay now · ${total.toFixed(2)}
                </Button>
              )}
            </section>

            <p className="text-center text-xs text-muted-foreground pb-8">
              By placing your order you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground">Terms of service</a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-foreground">Privacy policy</a>
            </p>
          </div>

          {/* ── RIGHT: Order summary ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Order summary</h3>
                  <span className="text-xs text-muted-foreground">
                    {totalItems} item{totalItems !== 1 ? "s" : ""}
                  </span>
                </div>
                <OrderSummaryItems
                  items={itemsUsd}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                  subtotal={subtotal}
                  processingFee={processingFee}
                  discount={discount}
                  total={total}
                />

                {/* Promo */}
                <div>
                  <FieldLabel>Promo code</FieldLabel>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <TicketPercent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoApplied(false);
                        }}
                        className="h-10 pl-9"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="h-10"
                      disabled={!promoCode.trim() || promoApplied}
                      onClick={() => setPromoApplied(true)}
                    >
                      {promoApplied ? "Applied" : "Apply"}
                    </Button>
                  </div>
                  {promoApplied && (
                    <p className="text-xs text-emerald-500 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> 5% off applied (max $10)
                    </p>
                  )}
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Zap, label: "Instant delivery", sub: "5–15 min" },
                  { icon: ShieldCheck, label: "Secure payment", sub: "256-bit SSL" },
                  { icon: HeartHandshake, label: "24/7 support", sub: "Live agents" },
                  { icon: Mail, label: "Emailed code", sub: "PDF + text" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border/60 bg-card/50 p-3 flex items-center gap-2.5"
                  >
                    <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight">{label}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </BrandShell>
  );
}

/* ── Slim brand-only shell (no marketing nav, no footer) ──────────── */
function BrandShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <PexlyIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">Pexly</span>
          </a>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Secure checkout
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

/* ── Order summary items + totals ─────────────────────────────────── */
function OrderSummaryItems({
  items,
  updateQuantity,
  removeItem,
  subtotal,
  processingFee,
  discount,
  total,
}: {
  items: any[];
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  subtotal: number;
  processingFee: number;
  discount: number;
  total: number;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative flex-shrink-0">
              <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center p-1.5">
                <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain" />
              </div>
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="h-5 w-5 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Minus className="h-2.5 w-2.5" />
                </button>
                <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-5 w-5 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="text-sm font-bold flex-shrink-0">
              ${Number(item._lineUsd ?? Number(item.price) * Number(item.quantity || 0)).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Processing fee</span>
          <span>${processingFee.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-500">
            <span>Promo discount</span>
            <span>−${discount.toFixed(2)}</span>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex items-baseline justify-between">
        <span className="text-base font-semibold">Total</span>
        <div className="text-right">
          <span className="text-2xl font-extrabold">${total.toFixed(2)}</span>
          <p className="text-[11px] text-muted-foreground">USD · taxes included where applicable</p>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
