import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
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
  ChevronRight,
  ShieldCheck,
  Zap,
  Mail,
  Gift,
  TicketPercent,
  Smartphone,
  CheckCircle2,
  HeartHandshake,
} from '@/lib/icons';
import { getExchangeRates } from "@/lib/crypto-prices";
import NowPaymentsCheckout from "@/components/nowpayments-checkout";
import { SYMBOL_ICON_MAP } from "@/lib/crypto-icons";
type DeliveryTarget = "self" | "gift";
type PaymentMethod = "card" | "crypto";
type CheckoutStep = "contact" | "payment" | "paying";

// ── Payment method type ────────────────────────────────────────────────────
type PaymentMethodDef = {
  id: string;
  label: string;
  symbol: string;
  networkBadge?: string;
  kind: "crypto" | "paypal" | "card" | "gift";
};

// ── Stablecoin network option ──────────────────────────────────────────────
type StablecoinNetwork = {
  id: string;        // NOWPayments currency code (e.g. "usdttrc20")
  label: string;     // Display name (e.g. "TRC20")
  badge: string;     // Short badge (e.g. "TRC20")
};

// ── Primary coins — always shown, always the main list ────────────────────
const PRIMARY_PAYMENT_METHODS: PaymentMethodDef[] = [
  { id: "btc",    label: "Bitcoin",          symbol: "BTC", kind: "crypto" },
  { id: "eth",    label: "Ethereum",         symbol: "ETH", networkBadge: "ERC20", kind: "crypto" },
  { id: "trx",    label: "Tron",             symbol: "TRX", kind: "crypto" },
  { id: "bnbbsc", label: "Binance Coin",     symbol: "BNB", networkBadge: "BSC",  kind: "crypto" },
  { id: "sol",    label: "Solana",           symbol: "SOL", kind: "crypto" },
];

// ── Stablecoin groups — each has a network sub-dropdown ───────────────────
const USDT_NETWORKS: StablecoinNetwork[] = [
  { id: "usdterc20",  label: "ERC20",        badge: "ERC20" },
  { id: "usdttrc20",  label: "TRC20",        badge: "TRC20" },
  { id: "usdtbsc",    label: "BSC (BEP20)",  badge: "BSC" },
  { id: "usdtarb",    label: "Arbitrum One", badge: "ARB" },
  { id: "usdtop",     label: "Optimism",     badge: "OP" },
  { id: "usdtmatic",  label: "Polygon",      badge: "POL" },
];

const USDC_NETWORKS: StablecoinNetwork[] = [
  { id: "usdcerc20",  label: "ERC20",        badge: "ERC20" },
  { id: "usdctrc20",  label: "TRC20",        badge: "TRC20" },
  { id: "usdcbsc",    label: "BSC (BEP20)",  badge: "BSC" },
  { id: "usdcarb",    label: "Arbitrum One", badge: "ARB" },
  { id: "usdcop",     label: "Optimism",     badge: "OP" },
  { id: "usdcmatic",  label: "Polygon",      badge: "POL" },
];

// Keep for legacy lookup in the "paying" step
const PAYMENT_METHODS_FALLBACK: PaymentMethodDef[] = PRIMARY_PAYMENT_METHODS;

// Parse a NOWPayments currency code into display info.
// Each code from the API already encodes a specific coin+network (e.g. usdttrc20 = USDT on Tron).
// We produce a fully-qualified label like "USDT TRC20" so no separate network selection is needed.
function parseCurrencyCode(code: string): PaymentMethodDef {
  const c = code.toLowerCase();

  // Helper: returns network name from common NOWPayments suffixes
  const netFromSuffix = (s: string): string | undefined => {
    if (s.includes("trc20") || s.includes("trx")) return "TRC20";
    if (s.includes("erc20") || s.includes("mainnet") || s.endsWith("eth")) return "ERC20";
    if (s.includes("bsc") || s.includes("bnb")) return "BEP20";
    if (s.includes("matic") || s.includes("pol")) return "Polygon";
    if (s.includes("sol")) return "Solana";
    if (s.includes("ton")) return "TON";
    if (s.includes("avax")) return "Avalanche";
    if (s.includes("arb")) return "Arbitrum";
    if (s.includes("op")) return "Optimism";
    if (s.includes("base")) return "Base";
    return undefined;
  };

  const mk = (sym: string, baseName: string, net?: string): PaymentMethodDef => ({
    id: code,
    symbol: sym,
    label: net ? `${baseName} ${net}` : baseName,
    networkBadge: net,
    kind: "crypto",
  });

  // USDT variants — NOWPayments mainly supports TRC20 and ERC20
  if (c.startsWith("usdt")) {
    const net = netFromSuffix(c.slice(4));
    return mk("USDT", "USDT", net);
  }
  // USDC variants
  if (c.startsWith("usdc")) {
    const net = netFromSuffix(c.slice(4));
    return mk("USDC", "USDC", net);
  }
  // DAI variants
  if (c.startsWith("dai")) {
    const net = netFromSuffix(c.slice(3));
    return mk("DAI", "DAI", net);
  }

  // Single-network / native coins
  const knownMap: Record<string, [string, string, string?]> = {
    btc:    ["BTC",  "Bitcoin"],
    btcln:  ["BTC",  "Bitcoin",     "Lightning"],
    eth:    ["ETH",  "Ethereum",    "ERC20"],
    ltc:    ["LTC",  "Litecoin"],
    sol:    ["SOL",  "Solana"],
    bnbbsc: ["BNB",  "BNB",         "BEP20"],
    bnb:    ["BNB",  "BNB"],
    trx:    ["TRX",  "Tron"],
    ton:    ["TON",  "TON"],
    xrp:    ["XRP",  "XRP"],
    doge:   ["DOGE", "Dogecoin"],
    ada:    ["ADA",  "Cardano"],
    matic:  ["MATIC","Polygon"],
    dot:    ["DOT",  "Polkadot"],
    avax:   ["AVAX", "Avalanche"],
    near:   ["NEAR", "NEAR"],
    xlm:    ["XLM",  "Stellar"],
    algo:   ["ALGO", "Algorand"],
    ftm:    ["FTM",  "Fantom"],
    bch:    ["BCH",  "Bitcoin Cash"],
    etc:    ["ETC",  "Ethereum Classic"],
    link:   ["LINK", "Chainlink"],
    zec:    ["ZEC",  "Zcash"],
    dash:   ["DASH", "Dash"],
    atom:   ["ATOM", "Cosmos"],
    hbar:   ["HBAR", "Hedera"],
    xlmx:   ["XLM",  "Stellar"],
  };
  const known = knownMap[c];
  if (known) return mk(known[0], known[1], known[2]);

  // Generic fallback: uppercase code used as-is
  const sym = c.replace(/[^a-z]/g, "").slice(0, 6).toUpperCase();
  return { id: code, symbol: sym, label: sym, kind: "crypto" };
}

// Tiny icon component — resolves real logo from SYMBOL_ICON_MAP
function CryptoMethodIcon({ symbol, size = "h-9 w-9" }: { symbol: string; size?: string }) {
  const [failed, setFailed] = useState(false);
  const src = SYMBOL_ICON_MAP[symbol];
  if (!src || failed) {
    return (
      <div className={`${size} rounded-full bg-muted border border-border flex items-center justify-center shrink-0`}>
        <span className="text-[10px] font-bold text-muted-foreground">{symbol.slice(0, 3)}</span>
      </div>
    );
  }
  return (
    <div className={`${size} rounded-full bg-card border border-border flex items-center justify-center overflow-hidden shrink-0 p-1.5`}>
      <img src={src} alt={symbol} className="w-full h-full object-contain" onError={() => setFailed(true)} />
    </div>
  );
}

// Keep a stable fallback PAYMENT_METHODS const for the "paying" step lookup
const PAYMENT_METHODS = PAYMENT_METHODS_FALLBACK;

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
  const [selectedMethodId, setSelectedMethodId] = useState<string>(PRIMARY_PAYMENT_METHODS[0].id);
  const [usdtExpanded, setUsdtExpanded] = useState(false);
  const [usdcExpanded, setUsdcExpanded] = useState(false);
  const [selectedUsdtNetwork, setSelectedUsdtNetwork] = useState<StablecoinNetwork>(USDT_NETWORKS[0]);
  const [selectedUsdcNetwork, setSelectedUsdcNetwork] = useState<StablecoinNetwork>(USDC_NETWORKS[0]);
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
    const pendingAmountUsd = pendingOrder.currency.toUpperCase() === "USD"
      ? pendingOrder.amount
      : rates[pendingOrder.currency.toUpperCase()]
        ? pendingOrder.amount / rates[pendingOrder.currency.toUpperCase()]
        : null;
    // Service fee by product type (applied on the USD-equivalent amount)
    const feeBase = pendingAmountUsd ?? pendingOrder.amount;
    const processingFee = pendingOrder.type === "giftcard"
      ? feeBase * 0.01 + 0.55
      : pendingOrder.type === "topup"
      ? feeBase * 0.015
      : pendingOrder.type === "utility"
      ? feeBase * 0.01
      : 0;
    const pendingTotal = pendingOrder.amount + processingFee;
    const pendingTotalUsd = (pendingAmountUsd ?? pendingOrder.amount) + processingFee;

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

    // Display label for amount
    const displayCurrency = pendingOrder.currency.toUpperCase();
    const displayAmount = pendingOrder.amount;
    const displayTotal = pendingTotalUsd;

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

                    {/* Fee + Total */}
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Service fee</span>
                        <span>+${processingFee.toFixed(2)}</span>
                      </div>
                    </div>

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
                    {/* ── Primary coins ── */}
                    {PRIMARY_PAYMENT_METHODS.map((method) => {
                      const selected = selectedMethodId === method.id;
                      return (
                        <button
                          key={method.id}
                          onClick={() => {
                            setSelectedMethodId(method.id);
                            setUsdtExpanded(false);
                            setUsdcExpanded(false);
                          }}
                          className={`w-full flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all text-left ${
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                          }`}
                        >
                          <div className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                            selected ? "border-primary" : "border-muted-foreground/40"
                          }`}>
                            {selected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                          </div>
                          <CryptoMethodIcon symbol={method.symbol} />
                          <div className="flex-1 min-w-0">
                            <span className="text-base font-semibold text-foreground">{method.label}</span>
                            {method.networkBadge && (
                              <span className="ml-2 text-xs bg-muted text-muted-foreground font-medium px-1.5 py-0.5 rounded-md">{method.networkBadge}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {/* ── USDT with network dropdown ── */}
                    {(() => {
                      const usdtSelected = USDT_NETWORKS.some(n => n.id === selectedMethodId);
                      return (
                        <div className={`rounded-2xl border transition-all ${
                          usdtSelected ? "border-primary bg-primary/5" : "border-border bg-card"
                        }`}>
                          <button
                            onClick={() => {
                              setUsdtExpanded(v => !v);
                              setUsdcExpanded(false);
                              if (!usdtSelected) setSelectedMethodId(selectedUsdtNetwork.id);
                            }}
                            className="w-full flex items-center gap-4 px-5 py-4 text-left"
                          >
                            <div className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                              usdtSelected ? "border-primary" : "border-muted-foreground/40"
                            }`}>
                              {usdtSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                            </div>
                            <CryptoMethodIcon symbol="USDT" />
                            <div className="flex-1 min-w-0">
                              <span className="text-base font-semibold text-foreground">USDT</span>
                              {usdtSelected && (
                                <span className="ml-2 text-xs bg-muted text-muted-foreground font-medium px-1.5 py-0.5 rounded-md">{selectedUsdtNetwork.badge}</span>
                              )}
                            </div>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${usdtExpanded ? "rotate-180" : ""}`} />
                          </button>
                          {usdtExpanded && (
                            <div className="px-5 pb-4 grid grid-cols-2 gap-2">
                              {USDT_NETWORKS.map((net) => {
                                const active = selectedMethodId === net.id;
                                return (
                                  <button
                                    key={net.id}
                                    onClick={() => { setSelectedMethodId(net.id); setSelectedUsdtNetwork(net); }}
                                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                                      active ? "border-primary bg-primary/10 text-foreground font-semibold" : "border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground"
                                    }`}
                                  >
                                    <div className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${active ? "border-primary" : "border-muted-foreground/40"}`}>
                                      {active && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                    </div>
                                    {net.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* ── USDC with network dropdown ── */}
                    {(() => {
                      const usdcSelected = USDC_NETWORKS.some(n => n.id === selectedMethodId);
                      return (
                        <div className={`rounded-2xl border transition-all ${
                          usdcSelected ? "border-primary bg-primary/5" : "border-border bg-card"
                        }`}>
                          <button
                            onClick={() => {
                              setUsdcExpanded(v => !v);
                              setUsdtExpanded(false);
                              if (!usdcSelected) setSelectedMethodId(selectedUsdcNetwork.id);
                            }}
                            className="w-full flex items-center gap-4 px-5 py-4 text-left"
                          >
                            <div className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                              usdcSelected ? "border-primary" : "border-muted-foreground/40"
                            }`}>
                              {usdcSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                            </div>
                            <CryptoMethodIcon symbol="USDC" />
                            <div className="flex-1 min-w-0">
                              <span className="text-base font-semibold text-foreground">USDC</span>
                              {usdcSelected && (
                                <span className="ml-2 text-xs bg-muted text-muted-foreground font-medium px-1.5 py-0.5 rounded-md">{selectedUsdcNetwork.badge}</span>
                              )}
                            </div>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${usdcExpanded ? "rotate-180" : ""}`} />
                          </button>
                          {usdcExpanded && (
                            <div className="px-5 pb-4 grid grid-cols-2 gap-2">
                              {USDC_NETWORKS.map((net) => {
                                const active = selectedMethodId === net.id;
                                return (
                                  <button
                                    key={net.id}
                                    onClick={() => { setSelectedMethodId(net.id); setSelectedUsdcNetwork(net); }}
                                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                                      active ? "border-primary bg-primary/10 text-foreground font-semibold" : "border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground"
                                    }`}
                                  >
                                    <div className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${active ? "border-primary" : "border-muted-foreground/40"}`}>
                                      {active && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                    </div>
                                    {net.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
            const allStableNetworks = [...USDT_NETWORKS, ...USDC_NETWORKS];
            const stableNet = allStableNetworks.find(n => n.id === selectedMethodId);
            const method: PaymentMethodDef = stableNet
              ? {
                  id: stableNet.id,
                  label: `${stableNet.id.startsWith("usdt") ? "USDT" : "USDC"} ${stableNet.label}`,
                  symbol: stableNet.id.startsWith("usdt") ? "USDT" : "USDC",
                  networkBadge: stableNet.badge,
                  kind: "crypto",
                }
              : (PRIMARY_PAYMENT_METHODS.find(m => m.id === selectedMethodId) ?? PRIMARY_PAYMENT_METHODS[0]);
            return (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => setCheckoutStep("payment")} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className="h-5 w-5 rotate-90" />
                  </button>
                  <div className="flex items-center gap-2">
                    <CryptoMethodIcon symbol={method.symbol} size="h-7 w-7" />
                    <h1 className="text-xl font-extrabold text-foreground">Pay with {method.label}</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-4 py-2.5">
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Sending to <strong className="text-foreground">{contactEmail || "your email"}</strong></span>
                </div>

                {method.kind === "crypto" && pendingOrder.currency.toUpperCase() !== "USD" && pendingAmountUsd === null && (
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading exchange rate for {pendingOrder.currency.toUpperCase()}…</p>
                  </div>
                )}

                {method.kind === "crypto" && (pendingOrder.currency.toUpperCase() === "USD" || pendingAmountUsd !== null) && (
                  <NowPaymentsCheckout
                    amount={pendingTotalUsd}
                    currency="usd"
                    payCurrency={method.id}
                    description={pendingOrder.description}
                    metadata={pendingOrder.metadata}
                    onPaymentSuccess={handleOrderSuccess}
                    onChangeMethod={() => setCheckoutStep("payment")}
                    onChangeEmail={() => setCheckoutStep("contact")}
                    methodLabel={method.label}
                    networkName={method.networkBadge}
                    email={contactEmail}
                    orderTitle={pendingOrder.title}
                    orderSubline={orderSubline}
                    orderCurrency={displayCurrency}
                    orderAmount={displayAmount}
                    orderImage={pendingOrder.image}
                  />
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
  const processingFee = subtotal * 0.01 + 0.55;
  const discount = promoApplied ? Math.min(subtotal * 0.05, 10) : 0;
  const total = Math.max(0, subtotal + processingFee - discount);
  const totalItems = items.reduce((acc, i) => acc + (i.quantity || 0), 0);

  const deliveryEmail = deliveryTarget === "gift" ? recipientEmail : buyerEmail;
  const recipientValid = deliveryTarget === "self" || /^\S+@\S+\.\S+$/.test(recipientEmail);

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

/* ── Quantity dropdown for cart items ─────────────────────────────── */
function CartItemRow({
  item,
  updateQuantity,
  removeItem,
}: {
  item: any;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const lineUsd = Number(item._lineUsd ?? Number(item.price) * Number(item.quantity || 0));

  return (
    <div className="flex gap-3 items-start">
      {/* Thumbnail with qty badge */}
      <div className="relative flex-shrink-0">
        <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center p-1.5">
          <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain" />
        </div>
        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
          {item.quantity}
        </span>
      </div>

      {/* Info + qty control */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Qty: {item.quantity}
        </p>

        {/* Qty dropdown + delete */}
        <div className="flex items-center gap-2 mt-2" ref={ref}>
          <div className="relative">
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
            >
              {item.quantity}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {open && (
              <div className="absolute left-0 top-10 z-50 w-28 max-h-64 overflow-y-auto rounded-2xl border border-border bg-popover shadow-xl">
                {Array.from({ length: 20 }, (_, i) => i + 1).map((qty) => (
                  <button
                    key={qty}
                    onClick={() => { updateQuantity(item.id, qty); setOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2",
                      qty === item.quantity ? "font-bold text-foreground" : "text-foreground/80"
                    )}
                  >
                    {qty === item.quantity && <span className="text-primary text-xs">✓</span>}
                    {qty !== item.quantity && <span className="w-3" />}
                    {qty}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => removeItem(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Line total */}
      <p className="text-sm font-bold flex-shrink-0 pt-1">
        ${lineUsd.toFixed(2)}
      </p>
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
          <CartItemRow
            key={item.id}
            item={item}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
          />
        ))}
      </div>

      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Service fee</span>
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
