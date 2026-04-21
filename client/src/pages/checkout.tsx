import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { usePayPal } from "@/hooks/usePaypal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NowPaymentsCheckout from "@/components/nowpayments-checkout";
import {
  ChevronRight,
  Lock,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ChevronDown,
  Shield,
  Zap,
} from "lucide-react";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { devLog } from "@/lib/dev-logger";
import { Separator } from "@/components/ui/separator";
import { getExchangeRates } from "@/lib/crypto-prices";

type PaymentTab = "card" | "paypal" | "crypto" | "oxxo";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function SectionTitle({
  step,
  title,
}: {
  step: number;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
        {step}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
    </div>
  );
}

export function Checkout() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { items, updateQuantity, removeItem } = useGiftCardCart();
  const { createAndCaptureOrder, loading: paypalLoading } = usePayPal();
  const [activePayment, setActivePayment] = useState<PaymentTab>("card");
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <ShoppingBag className="h-12 w-12 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <Button onClick={() => setLocation("/gift-cards")}>Browse Gift Cards</Button>
      </div>
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
  const total = subtotal + processingFee;
  const totalItems = items.reduce((acc, i) => acc + (i.quantity || 0), 0);

  const paymentTabs: { id: PaymentTab; label: string; logo: React.ReactNode }[] = [
    {
      id: "card",
      label: "Card",
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
      logo: <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="PayPal" />,
    },
    {
      id: "crypto",
      label: "Crypto",
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
      logo: <img src="https://upload.wikimedia.org/wikipedia/commons/6/66/Oxxo_Logo.svg" className="h-4" alt="OXXO" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">Pexly</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Secure checkout
          </div>
        </div>
      </header>

      {/* ── Mobile order summary toggle ── */}
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
            <OrderSummaryItems items={itemsUsd} updateQuantity={updateQuantity} removeItem={removeItem} subtotal={subtotal} processingFee={processingFee} total={total} />
          </div>
        )}
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">

          {/* ── LEFT: Form ── */}
          <div className="space-y-8">

            {/* Contact */}
            <section>
              <SectionTitle step={1} title="Contact" />
              <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    defaultValue={user.email || ""}
                    className="h-11"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Signed in as <strong className="text-foreground">{user.email}</strong></span>
                  <button className="text-primary font-semibold hover:underline">Change</button>
                </div>
              </div>
            </section>

            {/* Delivery */}
            <section>
              <SectionTitle step={2} title="Delivery" />
              <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
                <div>
                  <FieldLabel>Country / Region</FieldLabel>
                  <div className="relative">
                    <select className="w-full h-11 pl-3 pr-10 rounded-lg border border-input bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option>Nigeria</option>
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Canada</option>
                      <option>Ghana</option>
                      <option>Kenya</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>First name (optional)</FieldLabel>
                    <Input placeholder="First name" className="h-11" />
                  </div>
                  <div>
                    <FieldLabel>Last name</FieldLabel>
                    <Input placeholder="Last name" className="h-11" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Address</FieldLabel>
                  <Input placeholder="Street address" className="h-11" />
                </div>
                <div>
                  <FieldLabel>Apartment, suite, etc. (optional)</FieldLabel>
                  <Input placeholder="Apartment, suite, etc." className="h-11" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <FieldLabel>City</FieldLabel>
                    <Input placeholder="City" className="h-11" />
                  </div>
                  <div>
                    <FieldLabel>State</FieldLabel>
                    <div className="relative">
                      <select className="w-full h-11 pl-3 pr-8 rounded-lg border border-input bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option>Federal Capital Territory</option>
                        <option>Lagos</option>
                        <option>Abuja</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Postal code (optional)</FieldLabel>
                    <Input placeholder="Postal code" className="h-11" />
                  </div>
                </div>
                <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Save this information for next time</span>
                </label>
              </div>
            </section>

            {/* Shipping method */}
            <section>
              <SectionTitle step={3} title="Shipping method" />
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                {[
                  { id: "standard", label: "Standard", sub: "Insured shipping", price: "FREE" },
                  { id: "express", label: "Express", sub: "2–3 business days", price: "$4.99" },
                ].map((method, i) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 px-5 py-4 cursor-pointer ${i > 0 ? "border-t border-border/60" : ""}`}
                  >
                    <input type="radio" name="shipping" defaultChecked={i === 0} className="accent-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.sub}</p>
                    </div>
                    <span className={`text-sm font-bold ${method.price === "FREE" ? "text-green-600" : ""}`}>
                      {method.price}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Payment */}
            <section>
              <SectionTitle step={4} title="Payment" />
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                All transactions are secure and encrypted.
              </p>

              {/* Payment tabs */}
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="grid grid-cols-4 border-b border-border/60">
                  {paymentTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActivePayment(tab.id)}
                      className={`flex flex-col items-center gap-1.5 py-3.5 text-xs font-semibold transition-colors relative ${
                        activePayment === tab.id
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.logo}
                      <span>{tab.label}</span>
                      {activePayment === tab.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
                      )}
                    </button>
                  ))}
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
                      <p className="text-sm text-muted-foreground">You'll be redirected to PayPal to complete your purchase securely.</p>
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
                    <div className="py-2">
                      <NowPaymentsCheckout
                        amount={total}
                        currency="usd"
                        description={`Gift card purchase - ${items.length} item(s)`}
                        metadata={{ service: "gift-cards", orderId: `order_${Date.now()}`, items: items.length }}
                        onPaymentSuccess={(paymentData) => { devLog.info("Payment successful"); }}
                        onPaymentClose={() => { devLog.info("Payment cancelled"); }}
                      />
                    </div>
                  )}

                  {activePayment === "oxxo" && (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-sm text-muted-foreground">Generate an OXXO voucher to pay in cash at any OXXO store.</p>
                      <Button className="w-full h-12 bg-[#E20613] text-white hover:bg-[#c90511] font-bold rounded-xl">
                        Generate OXXO Voucher
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Billing address */}
            <section>
              <SectionTitle step={5} title="Billing address" />
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                {[
                  { id: "same", label: "Same as shipping address" },
                  { id: "different", label: "Use a different billing address" },
                ].map((opt, i) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 px-5 py-4 cursor-pointer ${i > 0 ? "border-t border-border/60" : ""}`}
                  >
                    <input type="radio" name="billing" defaultChecked={i === 0} className="accent-primary" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Pay now CTA */}
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
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
                <h3 className="font-semibold">Order summary</h3>
                <OrderSummaryItems
                  items={itemsUsd}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                  subtotal={subtotal}
                  processingFee={processingFee}
                  total={total}
                />
              </div>

              {/* Trust badges */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { icon: Zap, label: "Instant delivery", sub: "5–15 min" },
                  { icon: Shield, label: "Secure payment", sub: "256-bit SSL" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="rounded-xl border border-border/60 bg-card/50 p-3 flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function OrderSummaryItems({
  items,
  updateQuantity,
  removeItem,
  subtotal,
  processingFee,
  total,
}: {
  items: any[];
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  subtotal: number;
  processingFee: number;
  total: number;
}) {
  return (
    <div className="space-y-4">
      {/* Items */}
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

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">FREE</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Processing fee</span>
          <span>${processingFee.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-baseline pt-1">
          <span className="font-bold text-base">Total</span>
          <div className="text-right">
            <span className="text-xs text-muted-foreground mr-1">USD</span>
            <span className="text-xl font-bold">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
