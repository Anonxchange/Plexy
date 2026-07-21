import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  useVNApps,
  useVNServices,
  useVNCountries,
  useVNServiceInCountry,
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
  Zap,
  Star,
  AlertTriangle,
} from "@/lib/icons";

// ── Constants ─────────────────────────────────────────────────────────────────
const NGN_USD_RATE = 1600;

// ── Server options ────────────────────────────────────────────────────────────
const SERVERS = [
  {
    id: "1",
    label: "OTP 1",
    badge: null,
    cancelWindow: "30 seconds",
    description: "Fast delivery. Short cancel window.",
    color: "border-border",
  },
  {
    id: "2",
    label: "OTP 2",
    badge: "Recommended",
    cancelWindow: "18 minutes",
    description: "Balanced speed with a generous 18-minute cancel window.",
    color: "border-primary",
  },
  {
    id: "3",
    label: "OTP 3",
    badge: null,
    cancelWindow: "2 minutes",
    description: "Premium network. Higher success rate.",
    color: "border-border",
  },
] as const;

// ── Nigeria region detection ──────────────────────────────────────────────────
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
          className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
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
    q: "Which OTP server should I pick?",
    a: "OTP 2 is recommended for most users — it has an 18-minute cancel window so you can get a refund if the SMS never arrives. OTP 1 is faster but only gives you 30 seconds to cancel.",
  },
  {
    q: "How long does the number stay active?",
    a: "Your number is active for up to 20 minutes after purchase. If no SMS arrives within the cancel window, you can cancel and get a different number at no extra charge.",
  },
  {
    q: "What if the SMS never arrives?",
    a: "Tap 'Get new number' within the cancel window. This cancels the current number (full refund to our balance) and automatically assigns you a fresh one.",
  },
  {
    q: "How do I pay?",
    a: "Pay with cryptocurrency (Bitcoin, USDT, ETH, and more) or with KoraPay using your debit/credit card or Nigerian bank transfer (Nigeria only).",
  },
  {
    q: "Is the number private?",
    a: "Yes. The number is assigned only to you for the duration of the session. Once the session expires, the number is released and never tied back to you.",
  },
];

// ── Not-configured banner ──────────────────────────────────────────────────────
function NotConfiguredBanner() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) return null;
  return (
    <div className="mb-5 flex items-start gap-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
      <p className="text-sm text-orange-600 dark:text-orange-400">
        <strong>Setup needed:</strong> Add <code>VITE_SUPABASE_URL</code> and{" "}
        <code>VITE_SUPABASE_ANON_KEY</code> to your Replit secrets to enable live data.
      </p>
    </div>
  );
}

// ── Step 1: Server Selection ──────────────────────────────────────────────────
function ServerView({ onSelect }: { onSelect: (server: string) => void }) {
  return (
    <div className="space-y-3">
      {SERVERS.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={cn(
            "w-full flex items-start gap-4 px-5 py-5 bg-card border-2 rounded-2xl text-left transition-all hover:shadow-sm active:scale-[0.99]",
            s.id === "2" ? "border-primary bg-primary/5" : "border-border hover:border-border/70"
          )}
        >
          <div className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 font-black text-lg",
            s.id === "2" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          )}>
            {s.id}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-foreground">{s.label}</span>
              {s.badge && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <Star className="h-2.5 w-2.5" />
                  {s.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{s.description}</p>
            <p className="text-xs font-semibold text-foreground/60 mt-1.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Cancel window: {s.cancelWindow}
            </p>
          </div>
          <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180 shrink-0 mt-1" />
        </button>
      ))}
    </div>
  );
}

// ── Service icon map ──────────────────────────────────────────────────────────
const SERVICE_ICONS: Record<string, { bg: string; emoji: string }> = {
  telegram:    { bg: "bg-[#2AABEE]",    emoji: "✈️" },
  whatsapp:    { bg: "bg-[#25D366]",    emoji: "💬" },
  instagram:   { bg: "bg-[#E1306C]",    emoji: "📷" },
  facebook:    { bg: "bg-[#1877F2]",    emoji: "👤" },
  tiktok:      { bg: "bg-[#010101]",    emoji: "🎵" },
  douyin:      { bg: "bg-[#010101]",    emoji: "🎵" },
  viber:       { bg: "bg-[#7360F2]",    emoji: "📞" },
  paypal:      { bg: "bg-[#003087]",    emoji: "💳" },
  twitter:     { bg: "bg-[#1DA1F2]",    emoji: "🐦" },
  x:           { bg: "bg-[#000000]",    emoji: "✕" },
  uber:        { bg: "bg-[#000000]",    emoji: "🚗" },
  amazon:      { bg: "bg-[#FF9900]",    emoji: "📦" },
  google:      { bg: "bg-[#4285F4]",    emoji: "G" },
  apple:       { bg: "bg-[#000000]",    emoji: "🍎" },
  snapchat:    { bg: "bg-[#FFFC00]",    emoji: "👻" },
  discord:     { bg: "bg-[#5865F2]",    emoji: "🎮" },
  linkedin:    { bg: "bg-[#0A66C2]",    emoji: "💼" },
  netflix:     { bg: "bg-[#E50914]",    emoji: "🎬" },
  spotify:     { bg: "bg-[#1DB954]",    emoji: "🎵" },
  microsoft:   { bg: "bg-[#00A4EF]",    emoji: "🪟" },
  airbnb:      { bg: "bg-[#FF5A5F]",    emoji: "🏠" },
  affirm:      { bg: "bg-[#3B4CB8]",    emoji: "💬" },
  coinbase:    { bg: "bg-[#0052FF]",    emoji: "₿" },
  binance:     { bg: "bg-[#F0B90B]",    emoji: "₿" },
};

function serviceIcon(name: string) {
  const key = Object.keys(SERVICE_ICONS).find((k) =>
    name.toLowerCase().includes(k)
  );
  return key ? SERVICE_ICONS[key] : null;
}

// ── Step 2: App / Service Selection (global, no country needed) ──────────────
function AllAppsView({
  server,
  onSelect,
  onBack,
}: {
  server: string;
  onSelect: (service: VNApp) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useVNServices({
    server,
    page: String(page),
    limit: "50",
    search: debouncedSearch,
  });

  const services = data?.services ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <PageHeader title="Select Service" onBack={onBack} />
      <p className="text-sm text-muted-foreground -mt-4 mb-5">Choose a service to receive verification</p>
      <NotConfiguredBanner />

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search services…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="space-y-0 divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 px-1">
              <div className="h-11 w-11 bg-muted animate-pulse rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {services.map((svc) => {
              const inStock = svc.quantity > 0;
              const icon = serviceIcon(svc.name);
              return (
                <button
                  key={svc.id}
                  onClick={() => inStock && onSelect(svc)}
                  disabled={!inStock}
                  className={cn(
                    "w-full flex items-center gap-4 py-4 px-1 text-left transition-colors",
                    inStock
                      ? "hover:bg-muted/30 cursor-pointer"
                      : "opacity-40 cursor-not-allowed"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-lg",
                      icon ? icon.bg : "bg-primary/10"
                    )}
                  >
                    {icon ? (
                      <span className="leading-none">{icon.emoji}</span>
                    ) : (
                      <span className="text-sm font-black text-white">
                        {svc.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-[15px]">{svc.name}</span>
                      {!inStock && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-md">
                          Sold out
                        </span>
                      )}
                      {inStock && svc.quantity < 20 && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-md">
                          Low stock
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180 shrink-0" />
                </button>
              );
            })}

            {!isLoading && services.length === 0 && (
              <div className="text-center py-16">
                <Phone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground">No services found</p>
                {!import.meta.env.VITE_SUPABASE_URL ? (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Add your Supabase secrets to load live services.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1.5">Try a different search term.</p>
                )}
              </div>
            )}
          </div>

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

// ── Step 3a: Single country row with lazy per-country price ──────────────────
function CountryRow({
  country,
  app,
  server,
  onSelect,
}: {
  country: VNCountry;
  app: VNApp;
  server: string;
  onSelect: (country: VNCountry, resolvedApp: VNApp) => void;
}) {
  const { data: countryApp, isLoading } = useVNServiceInCountry({
    countryId: country.id,
    server,
    serviceName: app.name,
  });

  // Fall back to global price/qty while country-specific data loads
  const resolvedApp = countryApp ?? app;
  const priceNgn = parseFloat(resolvedApp.price_ngn);
  const qty = countryApp?.quantity ?? app.quantity;
  const inStock = qty > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-4 border-b border-border last:border-0",
        !inStock && "opacity-40"
      )}
    >
      <span className="text-2xl leading-none shrink-0">{countryFlag(country.code)}</span>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-[15px] leading-tight">{country.title}</p>
        {isLoading ? (
          <div className="h-3 w-14 bg-muted animate-pulse rounded mt-1" />
        ) : (
          <p className="text-xs font-bold text-primary mt-0.5">
            {inStock ? `${qty.toLocaleString()} PCS` : "Out of stock"}
          </p>
        )}
      </div>

      <div className="text-right shrink-0 mr-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          FROM
        </p>
        {isLoading ? (
          <div className="h-4 w-20 bg-muted animate-pulse rounded mt-0.5" />
        ) : (
          <p className="text-sm font-bold text-foreground">{formatNgn(priceNgn)}</p>
        )}
      </div>

      <button
        onClick={() => inStock && onSelect(country, resolvedApp)}
        disabled={!inStock}
        className="px-4 py-2 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed text-foreground text-sm font-bold transition-all active:scale-95 shrink-0"
      >
        BUY
      </button>
    </div>
  );
}

// ── Step 3: Country Selection ─────────────────────────────────────────────────
function CountriesView({
  server,
  app,
  onSelect,
  onBack,
}: {
  server: string;
  app: VNApp;
  onSelect: (country: VNCountry, resolvedApp: VNApp) => void;
  onBack: () => void;
}) {
  const { data: raw, isLoading } = useVNCountries(server);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const allCountries: VNCountry[] = useMemo(() => {
    const list = Object.values(raw ?? {});
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (c) => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [raw, search]);

  // Paginate to avoid firing too many API calls at once
  const totalPages = Math.ceil(allCountries.length / PAGE_SIZE);
  const countries = allCountries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader title={app.name} onBack={onBack} />
      <p className="text-sm text-muted-foreground -mt-4 mb-5">
        Select a country for {app.name}
      </p>
      <NotConfiguredBanner />

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Search for countries offering ${app.name}…`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-11 pr-4 py-3.5 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-4">
              <div className="h-8 w-8 bg-muted animate-pulse rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-14 bg-muted animate-pulse rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div>
            {countries.map((c) => (
              <CountryRow
                key={c.id}
                country={c}
                app={app}
                server={server}
                onSelect={onSelect}
              />
            ))}
            {countries.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">
                No countries found.
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
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

// ── Step 4: Confirm ───────────────────────────────────────────────────────────
// Uses the app price already fetched in the global apps list (step 2).
// No extra country-specific re-fetch — action=apps without countryId already
// returns the correct price per the Fleexa edge function.
function ConfirmView({
  server,
  country,
  app,
  onBack,
  onBuyKoraPay,
  onBuyCrypto,
  purchasing,
  showKoraPay,
}: {
  server: string;
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
  const inStock = app.quantity > 0;
  const serverInfo = SERVERS.find((s) => s.id === server);

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="Confirm your order" onBack={onBack} />

      <div className="bg-card border border-border rounded-3xl p-6 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">{app.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-lg">{app.name}</p>
            <p className="text-sm text-muted-foreground">
              {countryFlag(country.code)} {country.title}
            </p>
          </div>
          {inStock ? (
            <span className="text-[11px] font-bold uppercase tracking-wide text-green-600 bg-green-500/10 px-2 py-1 rounded-lg shrink-0">
              {app.quantity} available
            </span>
          ) : (
            <span className="text-[11px] font-bold uppercase tracking-wide text-destructive bg-destructive/10 px-2 py-1 rounded-lg shrink-0">
              Sold out
            </span>
          )}
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
            <span className="text-muted-foreground">Server</span>
            <span className="font-medium text-foreground">
              {serverInfo?.label ?? `OTP ${server}`}
              {" · "}
              <span className="text-muted-foreground font-normal">{serverInfo?.cancelWindow} cancel</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price</span>
            <span className="font-bold text-foreground">
              {formatNgn(priceNgn)}{" "}
              <span className="text-muted-foreground font-normal">≈ ${priceUsd}</span>
            </span>
          </div>
        </div>

        <div className="border-t border-border mt-4 pt-4">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-foreground">Total</span>
            <span className="text-2xl font-extrabold text-foreground">{formatNgn(priceNgn)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">≈ ${priceUsd} USD equivalent</p>
        </div>
      </div>

      {!inStock && (
        <div className="mb-4 flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            No numbers available for <strong>{app.name}</strong> right now. Go back and try a different app or country.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap mb-6">
        {[
          { Icon: ShieldCheck, label: "Auth required" },
          { Icon: RefreshCw, label: `${serverInfo?.cancelWindow ?? "18-min"} cancel` },
          { Icon: MessageSquare, label: "Instant delivery" },
        ].map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5 text-primary" />
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {showKoraPay && (
          <button
            onClick={onBuyKoraPay}
            disabled={purchasing || !inStock}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold text-base transition-all active:scale-[0.98] shadow-md"
          >
            {purchasing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Pay with KoraPay
                <span className="text-xs opacity-70 font-normal">(Card / Bank Transfer)</span>
              </>
            )}
          </button>
        )}
        <button
          onClick={onBuyCrypto}
          disabled={purchasing || !inStock}
          className={cn(
            "w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-full disabled:opacity-50 font-semibold text-base transition-all active:scale-[0.98]",
            showKoraPay
              ? "bg-muted hover:bg-muted/70 text-foreground border border-border"
              : "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
          )}
        >
          Pay with Crypto
          <span className="text-xs opacity-60 font-normal">(BTC, USDT, ETH…)</span>
        </button>
      </div>
    </div>
  );
}

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
  const serverInfo = SERVERS.find((s) => s.id === server);
  const cancelWindowMs =
    server === "1" ? 30_000 : server === "3" ? 2 * 60_000 : 18 * 60_000;

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - purchasedAt), 1000);
    return () => clearInterval(t);
  }, [purchasedAt]);

  const canCancel = elapsed < cancelWindowMs;
  const remainingSec = Math.max(0, Math.floor((cancelWindowMs - elapsed) / 1000));
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const ss = String(remainingSec % 60).padStart(2, "0");

  const { data: smsData } = useCheckSMS({ requestId, server, enabled: true });
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
  const failed = smsData?.code === "CANCELED" || smsData?.code === "EXPIRED";

  return (
    <div className="max-w-md mx-auto">
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
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
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

      {received && smsData?.sms && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            SMS code received
          </p>
          <p className="text-base font-mono text-foreground leading-relaxed">{smsData.sms}</p>
        </div>
      )}

      {!received && !failed && (
        <div className="bg-muted/50 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
          <RefreshCw
            className="h-4 w-4 text-primary mt-0.5 shrink-0 animate-spin"
            style={{ animationDuration: "3s" }}
          />
          <p className="text-sm text-muted-foreground">
            Use this number in {service} to receive your verification SMS. We're
            checking for it every 20 seconds.
          </p>
        </div>
      )}

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
type View = "server" | "apps" | "countries" | "confirm" | "purchasing" | "active";

export default function VirtualNumbers() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const searchStr = useSearch();

  const urlParams = useMemo(() => new URLSearchParams(searchStr), [searchStr]);

  const [view, setView] = useState<View>("server");
  const [selectedServer, setSelectedServer] = useState("2");
  const [selectedService, setSelectedService] = useState<VNApp | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<VNCountry | null>(null);
  const [activePurchase, setActivePurchase] = useState<VNPurchase | null>(null);

  const buyMutation = useBuyVirtualNumber(selectedServer);

  // Handle return from crypto checkout with number data in URL
  useEffect(() => {
    const number = urlParams.get("number");
    const requestId = urlParams.get("requestId");
    const service = urlParams.get("service");
    const country = urlParams.get("country");
    const srv = urlParams.get("server") ?? "2";
    if (number && requestId) {
      setSelectedServer(srv);
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

  const handleServerSelect = (server: string) => {
    setSelectedServer(server);
    setView("apps");
  };

  const handleServiceSelect = (svc: VNApp) => {
    setSelectedService(svc);
    setView("countries");
  };

  const handleCountrySelect = (c: VNCountry, resolvedApp: VNApp) => {
    setSelectedCountry(c);
    // Use country-specific resolved price (may differ from global)
    setSelectedService(resolvedApp);
    setView("confirm");
  };

  const handleBuyCrypto = useCallback(() => {
    if (!selectedService || !selectedCountry) return;
    const priceNgn = parseFloat(selectedService.price_ngn);
    const priceUsd = parseFloat(ngnToUsd(priceNgn));

    localStorage.setItem(
      "pexly_pending_order",
      JSON.stringify({
        type: "virtual-number",
        title: `${selectedService.name} Virtual Number`,
        description: `Virtual phone number — ${selectedService.name} (${selectedCountry.title})`,
        amount: priceUsd,
        currency: "usd",
        metadata: {
          service: selectedService.name,
          countryId: String(selectedCountry.id),
          countryName: selectedCountry.title,
          projectId: selectedService.id,
          server: selectedServer,
          price_ngn: priceNgn,
          korapay_amount_kobo: Math.round(priceNgn * 100),
        },
      })
    );
    setLocation("/checkout");
  }, [selectedService, selectedCountry, selectedServer, setLocation]);

  const handleBuyKoraPay = useCallback(async () => {
    if (!selectedService || !selectedCountry || !user) return;
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
      const priceNgn = parseFloat(selectedService.price_ngn);
      const reference = `pexly_vn_${Date.now()}`;
      await new Promise<void>((resolve, reject) => {
        Korapay.initialize({
          key: publicKey,
          reference,
          amount: Math.round(priceNgn * 100),
          currency: "NGN",
          customer: { email: user.email ?? "", name: user.email ?? "Pexly User" },
          onSuccess: async () => {
            toast.success("Payment confirmed! Assigning your number…");
            try {
              const result = await buyMutation.mutateAsync({
                countryName: selectedCountry.title,
                appName: selectedService.name,
                countryId: String(selectedCountry.id),
                projectId: selectedService.id,
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
          onFailed: () => { toast.error("KoraPay payment failed or was cancelled."); setView("confirm"); reject(new Error("Payment failed")); },
          onClose: () => { setView("confirm"); reject(new Error("Closed")); },
        });
      });
    } catch {
      setView("confirm");
    }
  }, [selectedService, selectedCountry, selectedServer, user, buyMutation]);

  const handleRetry = useCallback(async () => {
    if (!selectedService || !selectedCountry) return;
    setView("purchasing");
    try {
      const result = await buyMutation.mutateAsync({
        countryName: selectedCountry.title,
        appName: selectedService.name,
        countryId: String(selectedCountry.id),
        projectId: selectedService.id,
      });
      setActivePurchase(result);
      setView("active");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to assign number");
      setView("confirm");
    }
  }, [selectedService, selectedCountry, buyMutation]);

  const handleDone = () => {
    setSelectedService(null);
    setSelectedCountry(null);
    setActivePurchase(null);
    setView("server");
  };

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

  const isLanding = view === "server";

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero (only on server/landing view) ── */}
      {isLanding && (
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
              without using your real number.
            </p>
          </div>
        </section>
      )}

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Step 1 — Server */}
        {view === "server" && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-2">Select a server</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Each server has different speeds and cancel windows.
            </p>
            <ServerView onSelect={handleServerSelect} />
          </>
        )}

        {/* Step 2 — Apps / Services (global) */}
        {view === "apps" && (
          <AllAppsView
            server={selectedServer}
            onSelect={handleServiceSelect}
            onBack={() => setView("server")}
          />
        )}

        {/* Step 3 — Countries */}
        {view === "countries" && selectedService && (
          <CountriesView
            server={selectedServer}
            app={selectedService}
            onSelect={handleCountrySelect}
            onBack={() => setView("apps")}
          />
        )}

        {/* Step 4 — Confirm */}
        {view === "confirm" && selectedService && selectedCountry && (
          <ConfirmView
            server={selectedServer}
            country={selectedCountry}
            app={selectedService}
            onBack={() => setView("countries")}
            onBuyKoraPay={handleBuyKoraPay}
            onBuyCrypto={handleBuyCrypto}
            purchasing={false}
            showKoraPay={isNigeriaRegion()}
          />
        )}

        {/* Purchasing spinner */}
        {view === "purchasing" && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-14 w-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-base font-semibold text-foreground">Assigning your number…</p>
            <p className="text-sm text-muted-foreground">This usually takes a few seconds.</p>
          </div>
        )}

        {/* Active number */}
        {view === "active" && activePurchase && (
          <>
            <PageHeader title="Your virtual number" />
            <ActiveNumberView
              purchase={activePurchase}
              server={selectedServer}
              onRetry={handleRetry}
              onDone={handleDone}
            />
          </>
        )}
      </div>

      {/* ── FAQ (only on landing view) ── */}
      {isLanding && (
        <section className="max-w-2xl mx-auto px-4 py-12 border-t border-border mt-6">
          <h2 className="text-2xl font-black text-foreground mb-6">Frequently asked questions</h2>
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
