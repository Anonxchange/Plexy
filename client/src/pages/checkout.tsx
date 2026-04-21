import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { usePayPal } from "@/hooks/usePaypal";
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
  CheckCircle2,
  Bitcoin,
  ChevronRight,
  HeartHandshake,
} from "lucide-react";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { devLog } from "@/lib/dev-logger";
import { getExchangeRates } from "@/lib/crypto-prices";
import {
  CRYPTO_CHECKOUT_STORAGE_KEY,
  type CryptoCheckoutContext,
} from "@/pages/checkout-pay-crypto";

type PaymentMethod = "card" | "paypal" | "crypto" | "oxxo";
type DeliveryTarget = "self" | "gift";

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

export function Checkout() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { items, updateQuantity, removeItem } = useGiftCardCart();
  const { createAndCaptureOrder, loading: paypalLoading } = usePayPal();

  const [activePayment, setActivePayment] = useState<PaymentMethod>("card");
  const [deliveryTarget, setDeliveryTarget] = useState<DeliveryTarget>("self");
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

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

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin?redirect=/checkout");
    }
  }, [user, loading, setLocation]);

  const buyerEmail = user?.email || "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading checkout…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Redirecting to sign in…</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
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
  const processingFee = 0.5;
  const discount = promoApplied ? Math.min(subtotal * 0.05, 10) : 0;
  const total = Math.max(0, subtotal + processingFee - discount);
  const totalItems = items.reduce((acc, i) => acc + (i.quantity || 0), 0);

  const deliveryEmail = deliveryTarget === "gift" ? recipientEmail : buyerEmail;
  const recipientValid = deliveryTarget === "self" || /^\S+@\S+\.\S+$/.test(recipientEmail);

  const orderId = `gc_${Date.now()}`;

  const goCryptoPayment = () => {
    if (!recipientValid) return;
    const ctx: CryptoCheckoutContext = {
      amount: Number(total.toFixed(2)),
      currency: "usd",
      description: `Gift card purchase — ${items.length} item(s)`,
      itemCount: items.length,
      recipientEmail: deliveryEmail || undefined,
      orderId,
    };
    try {
      sessionStorage.setItem(CRYPTO_CHECKOUT_STORAGE_KEY, JSON.stringify(ctx));
    } catch {
      /* ignore storage failures */
    }
    setLocation("/checkout/pay/crypto");
  };

  const paymentTabs: {
    id: PaymentMethod;
    label: string;
    sub: string;
    logo: React.ReactNode;
  }[] = [
    {
      id: "card",
      label: "Card",
      sub: "Visa, Mastercard",
      logo: (
        <div className="flex items-center gap-1">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="MC" />
        </div>
      ),
    },
    {
      id: "paypal",
      label: "PayPal",
      sub: "Wallet & balance",
      logo: <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="PayPal" />,
    },
    {
      id: "crypto",
      label: "Crypto",
      sub: "BTC, ETH, USDT…",
      logo: (
        <div className="flex gap-0.5">
          <img src={cryptoIconUrls.BTC} className="h-4 w-4 rounded-full" alt="BTC" />
          <img src={cryptoIconUrls.ETH} className="h-4 w-4 rounded-full" alt="ETH" />
        </div>
      ),
    },
    {
      id: "oxxo",
      label: "OXXO",
      sub: "Cash voucher",
      logo: <img src="https://upload.wikimedia.org/wikipedia/commons/6/66/Oxxo_Logo.svg" className="h-4" alt="OXXO" />,
    },
  ];

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
            {/* Express checkout */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Express checkout
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  className="h-12 bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold rounded-xl"
                  disabled={paypalLoading}
                  onClick={() => createAndCaptureOrder(total)}
                >
                  {paypalLoading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-5 mr-2" alt="" />
                      PayPal Express
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 font-bold rounded-xl border-orange-400/40 hover:bg-orange-500/5"
                  onClick={goCryptoPayment}
                  disabled={!recipientValid}
                >
                  <Bitcoin className="h-5 w-5 mr-2 text-orange-500" />
                  Pay with Crypto
                </Button>
              </div>
              <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  or pay step-by-step
                </span>
                <div className="h-px flex-1 bg-border/60" />
              </div>
            </section>

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
              <SectionTitle step={3} title="Payment" sub="All transactions are encrypted." />

              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                {/* Method tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/60">
                  {paymentTabs.map((tab) => {
                    const active = activePayment === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActivePayment(tab.id)}
                        className={`flex flex-col items-center gap-1.5 py-4 text-xs font-semibold transition-colors relative ${
                          active
                            ? "bg-card text-foreground"
                            : "bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
                        }`}
                      >
                        {tab.logo}
                        <span>{tab.label}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{tab.sub}</span>
                        {active && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
                        )}
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
                      <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Save card for future payments</span>
                      </label>
                    </div>
                  )}

                  {activePayment === "paypal" && (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        You'll be redirected to PayPal to complete your purchase securely.
                      </p>
                      <Button
                        className="w-full h-12 bg-[#0070BA] text-white hover:bg-[#005ea6] font-bold rounded-xl"
                        disabled={paypalLoading}
                        onClick={() => createAndCaptureOrder(total)}
                      >
                        {paypalLoading ? (
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-5 mr-2" alt="" />
                            Continue with PayPal
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {activePayment === "crypto" && (
                    <div className="text-center py-4 space-y-3">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        {(["BTC", "ETH", "USDT", "LTC", "TRX", "SOL"] as const).map((c) => (
                          <img
                            key={c}
                            src={(cryptoIconUrls as Record<string, string>)[c]}
                            alt={c}
                            className="h-6 w-6 rounded-full"
                          />
                        ))}
                        <span className="text-xs text-muted-foreground">+ more</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pay with Bitcoin, Ethereum, USDT, and 6+ more assets on a dedicated secure page.
                      </p>
                      <Button
                        className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
                        onClick={goCryptoPayment}
                        disabled={!recipientValid}
                        data-testid="button-continue-crypto"
                      >
                        <Bitcoin className="h-5 w-5 mr-2" />
                        Continue with Crypto
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      {!recipientValid && (
                        <p className="text-xs text-destructive">
                          Enter a valid recipient email above first.
                        </p>
                      )}
                    </div>
                  )}

                  {activePayment === "oxxo" && (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Generate an OXXO voucher to pay in cash at any OXXO store.
                      </p>
                      <Button className="w-full h-12 bg-[#E20613] text-white hover:bg-[#c90511] font-bold rounded-xl">
                        Generate OXXO Voucher
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Pay now CTA (card only — others have own button) */}
            {activePayment === "card" && (
              <Button className="w-full h-14 text-base font-bold rounded-xl bg-[#B4F22E] text-black hover:opacity-90 shadow-lg shadow-[#B4F22E]/20 gap-2">
                <Lock className="h-5 w-5" />
                Pay now · ${total.toFixed(2)}
              </Button>
            )}

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
