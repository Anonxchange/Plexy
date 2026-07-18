import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  useVNCountries,
  useVNApps,
  useBuyVirtualNumber,
  useCheckSMS,
  useCancelVirtualNumber,
  countryFlag,
  type VNCountry,
  type VNApp,
  type VNPurchase,
} from "@/hooks/use-virtual-numbers";
import {
  Search,
  ChevronLeft,
  Phone,
  RefreshCw,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ShieldCheck,
  MessageSquare,
  Plus,
} from "@/lib/icons";

// ── Constants ─────────────────────────────────────────────────────────────────
const SMS_SERVER = "2"; // SMS2 — 18-minute cancel window
const NGN_USD_RATE = 1600; // fallback rate; SMS3 returns exchange_rate in response

// KoraPay only for Nigeria (Africa/Lagos timezone)
function isNigeriaRegion(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Africa/Lagos") return true;
    if (navigator.language === "en-NG") return true;
    return false;
  } catch {
    return false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ngnToUsd(ngn: number, rate = NGN_USD_RATE) {
  return (ngn / rate).toFixed(2);
}

function formatNgn(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

// ── Small UI pieces ───────────────────────────────────────────────────────────
function PageHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {onBack && (
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <span
          className={cn(
            "h-6 w-6 rounded-full border border-border flex items-center justify-center flex-shrink-0 transition-transform",
            open && "rotate-45"
          )}
        >
          <Plus className="h-3 w-3 text-muted-foreground" />
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "300px" : "0px" }}
      >
        <p className="text-sm text-muted-foreground leading-relaxed pb-4">{a}</p>
      </div>
    </div>
  );
}

const FAQS = [
  {
    q: "What is a virtual number?",
    a: "A virtual number is a temporary phone number you can use to receive an SMS verification code for apps like WhatsApp, Telegram, or Instagram — without using your personal number.",
  },
  {
    q: "How long does the number stay active?",
    a: "Your number is active for up to 20 minutes after purchase. If no SMS arrives within that window, you can cancel and get a different number at no extra charge (within 18 minutes of purchase).",
  },
  {
    q: "What if the SMS never arrives?",
    a: "Tap 'Get new number' within 18 minutes of purchase. This cancels the current number (full refund to our balance) and automatically assigns you a fresh one.",
  },
  {
    q: "How do I pay?",
    a: "Pay with cryptocurrency (Bitcoin, USDT, ETH, and more) or with KoraPay using your debit/credit card or Nigerian bank transfer.",
  },
  {
    q: "Is the number private?",
    a: "Yes. The number is assigned only to you for the duration of the session. Once the session expires, the number is released and never tied back to you.",
  },
];

// ── Active Number View ────────────────────────────────────────────────────────
function ActiveNumberView({
  purchase,
  server,
  onRetry,
  onDone,
}: {
  purchase: VNPurchase;
  server: string;
  onRetry: () => void;
  onDone: () => void;
}) {
  const { requestId, number, service, country } = purchase;
  const [purchasedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const CANCEL_WINDOW_MS = 18 * 60 * 1000; // 18 min for SMS2

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - purchasedAt), 1000);
    return () => clearInterval(t);
  }, [purchasedAt]);

  const canCancel = elapsed < CANCEL_WINDOW_MS;
  const remainingSec = Math.max(0, Math.floor((CANCEL_WINDOW_MS - elapsed) / 1000));
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const ss = String(remainingSec % 60).padStart(2, "0");

  const { data: smsData, isLoading: polling } = useCheckSMS({
    requestId,
    server,
    enabled: true,
  });

  const cancel = useCancelVirtualNumber(server);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(number).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    if (!canCancel) return;
    try {
      await cancel.mutateAsync({ requestId });
      toast.success("Number cancelled. Getting you a new one…");
      onRetry();
    } catch (e: any) {
      toast.error(e.message ?? "Cancel failed");
    }
  };

  const received = smsData?.code === "RECEIVED";
  const failed =
    smsData?.code === "CANCELED" || smsData?.code === "EXPIRED";

  return (
    <div className="max-w-md mx-auto">
      {/* Status badge */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold w-fit mb-6 mx-auto",
          received
            ? "bg-green-500/10 text-green-500"
            : failed
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary"
        )}
      >
        {received ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : failed ? (
          <XCircle className="h-4 w-4" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {received ? "SMS Received!" : failed ? "Number expired" : "Waiting for SMS…"}
      </div>

      {/* Number card */}
      <div className="bg-card border border-border rounded-3xl p-6 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-3">
          <Phone className="h-3.5 w-3.5" />
          Your virtual number
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-mono font-bold text-foreground tracking-wider flex-1">
            {number}
          </span>
          <button
            onClick={handleCopy}
            className="h-10 w-10 rounded-2xl bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors shrink-0"
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> {service}
          </span>
          <span>•</span>
          <span>{country}</span>
          {canCancel && !received && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-primary font-semibold">
                <Clock className="h-3.5 w-3.5" />
                Cancel in {mm}:{ss}
              </span>
            </>
          )}
        </div>
      </div>

      {/* SMS code display */}
      {received && smsData?.sms && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            SMS code received
          </p>
          <p className="text-base font-mono text-foreground leading-relaxed">
            {smsData.sms}
          </p>
        </div>
      )}

      {/* Polling info */}
      {!received && !failed && (
        <div className="bg-muted/50 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
          <RefreshCw className="h-4 w-4 text-primary mt-0.5 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
          <p className="text-sm text-muted-foreground">
            Use this number in {service} to receive your verification SMS. We're
            checking for it every 20 seconds.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 mt-4">
        {received ? (
          <button
            onClick={onDone}
            className="w-full py-4 rounded-full bg-primary text-primary-foreground font-bold text-base transition-all active:scale-[0.98] shadow-md"
          >
            Done — buy another number
          </button>
        ) : (
          <>
            {canCancel && !failed && (
              <button
                onClick={handleCancel}
                disabled={cancel.isPending}
                className="w-full py-4 rounded-full bg-muted hover:bg-muted/70 disabled:opacity-50 text-foreground font-semibold text-base transition-all active:scale-[0.98] border border-border flex items-center justify-center gap-2"
              >
                {cancel.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Get new number (cancel this)
              </button>
            )}
            {failed && (
              <button
                onClick={onRetry}
                className="w-full py-4 rounded-full bg-primary text-primary-foreground font-bold text-base transition-all active:scale-[0.98]"
              >
                Try again
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Country Grid ───────────────────────────────────────────────────────────────
function CountriesView({
  onSelect,
}: {
  onSelect: (country: VNCountry) => void;
}) {
  const { data: raw, isLoading } = useVNCountries(SMS_SERVER);
  const [search, setSearch] = useState("");

  const countries: VNCountry[] = useMemo(() => {
    const list = Object.values(raw ?? {});
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [raw, search]);

  return (
    <>
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search country…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {countries.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 border border-border hover:border-primary/40 rounded-2xl transition-all text-left group"
            >
              <span className="text-2xl leading-none">{countryFlag(c.code)}</span>
              <span className="text-sm font-medium text-foreground truncate">
                {c.title}
              </span>
            </button>
          ))}
          {countries.length === 0 && (
            <p className="col-span-3 text-center text-sm text-muted-foreground py-8">
              No countries found.
            </p>
          )}
        </div>
      )}
    </>
  );
}

// ── Apps/Services List ────────────────────────────────────────────────────────
function AppsView({
  country,
  onSelect,
  onBack,
}: {
  country: VNCountry;
  onSelect: (app: VNApp) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useVNApps({
    countryId: String(country.id),
    server: SMS_SERVER,
    page: String(page),
    limit: "30",
    search,
  });

  const apps = data?.apps ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <PageHeader
        title={`${countryFlag(country.code)} ${country.title}`}
        onBack={onBack}
      />

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search app (Telegram, WhatsApp…)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {apps.map((app) => {
              const priceNgn = parseFloat(app.price_ngn);
              const priceUsd = ngnToUsd(priceNgn);
              const inStock = app.quantity > 0;
              return (
                <button
                  key={app.id}
                  onClick={() => inStock && onSelect(app)}
                  disabled={!inStock}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 bg-card border rounded-2xl text-left transition-all",
                    inStock
                      ? "border-border hover:border-primary/50 hover:shadow-sm active:scale-[0.99] cursor-pointer"
                      : "border-border/40 opacity-50 cursor-not-allowed"
                  )}
                >
                  {/* App initial avatar */}
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-base font-bold text-primary">
                      {app.name.charAt(0)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-foreground text-sm">
                        {app.name}
                      </span>
                      {!inStock && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-md">
                          Sold out
                        </span>
                      )}
                      {inStock && app.quantity < 20 && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-md">
                          Low stock
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {app.quantity} numbers available
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-foreground">
                      {formatNgn(priceNgn)}
                    </p>
                    <p className="text-xs text-muted-foreground">≈ ${priceUsd}</p>
                  </div>
                </button>
              );
            })}

            {apps.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">
                No services found for this country.
              </p>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages || isFetching}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── Confirm / Order view ──────────────────────────────────────────────────────
function ConfirmView({
  country,
  app,
  onBack,
  onBuyKoraPay,
  onBuyCrypto,
  purchasing,
  showKoraPay,
}: {
  country: VNCountry;
  app: VNApp;
  onBack: () => void;
  onBuyKoraPay: () => void;
  onBuyCrypto: () => void;
  purchasing: boolean;
  showKoraPay: boolean;
}) {
  const priceNgn = parseFloat(app.price_ngn);
  const priceUsd = ngnToUsd(priceNgn);

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="Confirm your order" onBack={onBack} />

      {/* Order card */}
      <div className="bg-card border border-border rounded-3xl p-6 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">
              {app.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-bold text-foreground text-lg">{app.name}</p>
            <p className="text-sm text-muted-foreground">
              {countryFlag(country.code)} {country.title}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium text-foreground">{app.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Country</span>
            <span className="font-medium text-foreground">{country.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price</span>
            <span className="font-bold text-foreground">
              {formatNgn(priceNgn)}{" "}
              <span className="text-muted-foreground font-normal">
                ≈ ${priceUsd}
              </span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cancel window</span>
            <span className="font-medium text-foreground">18 minutes</span>
          </div>
        </div>

        <div className="border-t border-border mt-4 pt-4">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-foreground">Total</span>
            <span className="text-2xl font-extrabold text-foreground">
              {formatNgn(priceNgn)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ≈ ${priceUsd} USD equivalent
          </p>
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex items-center gap-4 flex-wrap mb-6">
        {[
          { Icon: ShieldCheck, label: "Auth required" },
          { Icon: RefreshCw, label: "18-min cancel" },
          { Icon: MessageSquare, label: "Instant delivery" },
        ].map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5 text-primary" />
            {label}
          </div>
        ))}
      </div>

      {/* Payment CTAs */}
      <div className="space-y-3">
        {showKoraPay && (
          <button
            onClick={onBuyKoraPay}
            disabled={purchasing}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold text-base transition-all active:scale-[0.98] shadow-md"
          >
            {purchasing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Pay with KoraPay
                <span className="text-xs opacity-70 font-normal">
                  (Card / Bank Transfer)
                </span>
              </>
            )}
          </button>
        )}
        <button
          onClick={onBuyCrypto}
          disabled={purchasing}
          className={`w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-full disabled:opacity-50 font-semibold text-base transition-all active:scale-[0.98] ${
            showKoraPay
              ? "bg-muted hover:bg-muted/70 text-foreground border border-border"
              : "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
          }`}
        >
          Pay with Crypto
          <span className="text-xs opacity-60 font-normal">(BTC, USDT, ETH…)</span>
        </button>
      </div>
    </div>
  );
}

// ── KoraPay inline loader ─────────────────────────────────────────────────────
function loadKoraPayScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).Korapay) return resolve();
    const script = document.createElement("script");
    script.src =
      "https://korahq.github.io/kora-inline-checkout/dist/kora-inline.min.js";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VirtualNumbers() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const searchStr = useSearch();

  const urlParams = useMemo(() => new URLSearchParams(searchStr), [searchStr]);

  type View = "countries" | "apps" | "confirm" | "purchasing" | "active";
  const [view, setView] = useState<View>("countries");
  const [selectedCountry, setSelectedCountry] = useState<VNCountry | null>(null);
  const [selectedApp, setSelectedApp] = useState<VNApp | null>(null);
  const [activePurchase, setActivePurchase] = useState<VNPurchase | null>(null);

  const buyMutation = useBuyVirtualNumber(SMS_SERVER);

  // Handle return from crypto checkout with number data in URL
  useEffect(() => {
    const number = urlParams.get("number");
    const requestId = urlParams.get("requestId");
    const service = urlParams.get("service");
    const country = urlParams.get("country");
    if (number && requestId) {
      setActivePurchase({
        number,
        requestId,
        service: service ?? "",
        country: country ?? "",
        amount_paid: 0,
        status: "pending",
      });
      setView("active");
    }
  }, [urlParams]);

  const handleCountrySelect = (c: VNCountry) => {
    setSelectedCountry(c);
    setView("apps");
  };

  const handleAppSelect = (app: VNApp) => {
    setSelectedApp(app);
    setView("confirm");
  };

  const handleBuyCrypto = useCallback(() => {
    if (!selectedApp || !selectedCountry) return;
    const priceNgn = parseFloat(selectedApp.price_ngn);
    const priceUsd = parseFloat(ngnToUsd(priceNgn));

    localStorage.setItem(
      "pexly_pending_order",
      JSON.stringify({
        type: "virtual-number",
        title: `${selectedApp.name} Virtual Number`,
        description: `Virtual phone number — ${selectedApp.name} (${selectedCountry.title})`,
        amount: priceUsd,
        currency: "usd",
        metadata: {
          service: selectedApp.name,
          countryId: String(selectedCountry.id),
          countryName: selectedCountry.title,
          projectId: selectedApp.id,
          server: SMS_SERVER,
          price_ngn: priceNgn,
          korapay_amount_kobo: Math.round(priceNgn * 100),
        },
      })
    );

    const seg = window.location.pathname.split("/")[1];
    const langBase = seg && seg.length === 2 ? `/${seg}` : "/en";
    setLocation(`${langBase}/checkout`);
  }, [selectedApp, selectedCountry, setLocation]);

  const handleBuyKoraPay = useCallback(async () => {
    if (!selectedApp || !selectedCountry || !user) return;

    const publicKey = import.meta.env.VITE_KORAPAY_PUBLIC_KEY as string;
    if (!publicKey) {
      toast.error("KoraPay is not configured yet.");
      return;
    }

    setView("purchasing");

    try {
      await loadKoraPayScript();
      const Korapay = (window as any).Korapay;
      if (!Korapay) throw new Error("KoraPay script failed to load");

      const priceNgn = parseFloat(selectedApp.price_ngn);
      const amountKobo = Math.round(priceNgn * 100);
      const reference = `pexly_vn_${Date.now()}`;

      await new Promise<void>((resolve, reject) => {
        Korapay.initialize({
          key: publicKey,
          reference,
          amount: amountKobo,
          currency: "NGN",
          customer: {
            email: user.email ?? "",
            name: user.email ?? "Pexly User",
          },
          notification_url: undefined,
          onSuccess: async () => {
            toast.success("Payment confirmed! Assigning your number…");
            try {
              const result = await buyMutation.mutateAsync({
                countryName: selectedCountry.title,
                appName: selectedApp.name,
                countryId: String(selectedCountry.id),
                projectId: selectedApp.id,
              });
              setActivePurchase(result);
              setView("active");
              resolve();
            } catch (e: any) {
              toast.error(e.message ?? "Failed to assign number");
              setView("confirm");
              reject(e);
            }
          },
          onFailed: () => {
            toast.error("KoraPay payment failed or was cancelled.");
            setView("confirm");
            reject(new Error("Payment failed"));
          },
          onClose: () => {
            setView("confirm");
            reject(new Error("Closed"));
          },
        });
      });
    } catch {
      // errors already handled above via toast
      setView("confirm");
    }
  }, [selectedApp, selectedCountry, user, buyMutation]);

  const handleRetry = useCallback(async () => {
    if (!selectedApp || !selectedCountry) return;
    setView("purchasing");
    try {
      const result = await buyMutation.mutateAsync({
        countryName: selectedCountry.title,
        appName: selectedApp.name,
        countryId: String(selectedCountry.id),
        projectId: selectedApp.id,
      });
      setActivePurchase(result);
      setView("active");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to assign number");
      setView("confirm");
    }
  }, [selectedApp, selectedCountry, buyMutation]);

  const handleDone = () => {
    setSelectedCountry(null);
    setSelectedApp(null);
    setActivePurchase(null);
    setView("countries");
  };

  // Redirect unauthenticated users to login
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Phone className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in required</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You need to be signed in to purchase virtual numbers.
          </p>
          <button
            onClick={() => setLocation("/signin")}
            className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      {view === "countries" && (
        <section className="bg-primary pt-12 pb-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-2xl" />
          </div>
          <div className="relative max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-4 py-1.5 text-sm font-semibold text-primary-foreground/90 mb-4">
              <Phone className="h-3.5 w-3.5" />
              Virtual Numbers
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-primary-foreground leading-tight mb-3">
              Get a temporary<br />phone number
            </h1>
            <p className="text-primary-foreground/70 text-base max-w-md mx-auto">
              Receive SMS verification codes for any app — privately, instantly,
              without using your real number. Pay with crypto or KoraPay.
            </p>
          </div>
        </section>
      )}

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {view === "countries" && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-4">
              Select a country
            </h2>
            <CountriesView onSelect={handleCountrySelect} />
          </>
        )}

        {view === "apps" && selectedCountry && (
          <AppsView
            country={selectedCountry}
            onSelect={handleAppSelect}
            onBack={() => setView("countries")}
          />
        )}

        {view === "confirm" && selectedCountry && selectedApp && (
          <ConfirmView
            country={selectedCountry}
            app={selectedApp}
            onBack={() => setView("apps")}
            onBuyKoraPay={handleBuyKoraPay}
            onBuyCrypto={handleBuyCrypto}
            purchasing={false}
            showKoraPay={isNigeriaRegion()}
          />
        )}

        {view === "purchasing" && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-14 w-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-base font-semibold text-foreground">
              Assigning your number…
            </p>
            <p className="text-sm text-muted-foreground">
              This usually takes a few seconds.
            </p>
          </div>
        )}

        {view === "active" && activePurchase && (
          <>
            <PageHeader title="Your virtual number" />
            <ActiveNumberView
              purchase={activePurchase}
              server={SMS_SERVER}
              onRetry={handleRetry}
              onDone={handleDone}
            />
          </>
        )}
      </div>

      {/* ── FAQ (shown on landing view) ── */}
      {view === "countries" && (
        <section className="max-w-2xl mx-auto px-4 py-12 border-t border-border mt-6">
          <h2 className="text-2xl font-black text-foreground mb-6">
            Frequently asked questions
          </h2>
          <div>
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </section>
      )}

      <PexlyFooter />
    </div>
  );
}
