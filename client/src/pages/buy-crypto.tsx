import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useHead } from "@unhead/react";
import {
  ChevronDown,
  Settings,
  ArrowLeftRight,
  Plus,
  Minus,
  Loader2,
  ChevronRight,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCryptoIconUrl } from "@/lib/crypto-icons";
import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { SiApple, SiVisa, SiMastercard, SiPaypal, SiGooglepay, SiApplepay, SiAmericanexpress, SiSepa, SiBitcoin } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useCdpOnramp } from "@/hooks/use-cdp-onramp";
import { useCdpOfframp } from "@/hooks/use-cdp-offramp";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";

const QUICK_AMOUNTS = ["100", "250", "500", "1000"];

const FEATURED_ASSETS = [
  { symbol: "BTC", name: "Bitcoin",  price: "$76,400", change: "+2.4%", up: true },
  { symbol: "ETH", name: "Ethereum", price: "$2,650",  change: "+1.8%", up: true },
  { symbol: "SOL", name: "Solana",   price: "$138",    change: "+5.1%", up: true },
  { symbol: "DOGE", name: "Dogecoin",price: "$0.165",  change: "-1.2%", up: false },
  { symbol: "XRP",  name: "XRP",     price: "$0.52",   change: "+0.9%", up: true },
  { symbol: "MATIC", name: "Polygon",price: "$0.72",   change: "+3.3%", up: true },
  { symbol: "LTC",  name: "Litecoin",price: "$87",     change: "-0.7%", up: false },
  { symbol: "AVAX", name: "Avalanche",price: "$28",    change: "+4.2%", up: true },
];

const ALL_ASSETS = [
  ...FEATURED_ASSETS,
  { symbol: "USDC",  name: "USDC",      price: "$1.00",  change: "0.0%",  up: true },
  { symbol: "USDT",  name: "Tether",    price: "$1.00",  change: "0.0%",  up: true },
  { symbol: "DOT",   name: "Polkadot",  price: "$5.40",  change: "+2.1%", up: true },
  { symbol: "LINK",  name: "Chainlink", price: "$11.20", change: "+3.5%", up: true },
];

const HOW_TO_STEPS = [
  {
    num: "1",
    title: "Create your account",
    desc: "Sign up in seconds and verify your identity with our quick KYC process.",
    svg: (
      <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5">
        {/* Head */}
        <circle cx="14" cy="9" r="4" fill="black" />
        {/* Shoulders / body arc */}
        <path d="M6 23c0-4.42 3.58-8 8-8s8 3.58 8 8" fill="black" fillOpacity="0.85" />
        {/* Badge circle */}
        <circle cx="21" cy="7" r="4" fill="black" />
        {/* Plus in badge */}
        <path d="M19.5 7h3M21 5.5v3" stroke="#B4F22E" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "2",
    title: "Select your crypto",
    desc: "Choose from 100+ assets. Enter your spend amount in any local currency.",
    svg: (
      <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5">
        <defs>
          <clipPath id="coin-clip">
            <circle cx="12" cy="14" r="9" />
          </clipPath>
        </defs>
        {/* Coin body */}
        <circle cx="12" cy="14" r="9" fill="black" />
        {/* Coin inner ring */}
        <circle cx="12" cy="14" r="6.5" stroke="#B4F22E" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
        {/* Currency symbol */}
        <path d="M12 10v8M10 11.5h3.5a1.5 1.5 0 010 3H10.5a1.5 1.5 0 010 3H14" stroke="#B4F22E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Magnifying glass */}
        <circle cx="21.5" cy="8.5" r="4" fill="black" stroke="black" strokeWidth="0.5" />
        <circle cx="21.5" cy="8.5" r="2.5" stroke="#B4F22E" strokeWidth="1.2" fill="none" />
        <line x1="23.3" y1="10.3" x2="25.2" y2="12.2" stroke="#B4F22E" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "3",
    title: "Pay & receive instantly",
    desc: "Use card, bank, Apple Pay, or Google Pay. Crypto lands in your wallet right away.",
    svg: (
      <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5">
        {/* Card base */}
        <rect x="2" y="7" width="22" height="15" rx="2.5" fill="black" />
        {/* Card magnetic stripe */}
        <rect x="2" y="11" width="22" height="4" fill="black" fillOpacity="0.55" />
        {/* Card chip */}
        <rect x="5" y="8.5" width="4" height="3" rx="0.8" fill="#B4F22E" fillOpacity="0.3" stroke="#B4F22E" strokeWidth="0.6" />
        {/* Lightning bolt over card */}
        <path d="M17 8L12 15h4l-1.5 5 7-8h-4.5L17 8z" fill="#B4F22E" />
        {/* Inner shadow on bolt */}
        <path d="M16 10.5L13.5 15h3l-1 3.5 4.5-5h-3.5L16 10.5z" fill="black" fillOpacity="0.25" />
      </svg>
    ),
  },
];

const TRUST_FEATURES = [
  {
    title: "Bank-grade security",
    desc: "AES-256 encryption, PCI-DSS compliant, and ISO 27001 certified.",
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
        <defs>
          <linearGradient id="shield-grad" x1="8" y1="2" x2="24" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B4F22E" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#B4F22E" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Shield body fill */}
        <path d="M16 2L4 7.5v7C4 21.8 9.2 27.6 16 29.5 22.8 27.6 28 21.8 28 14.5v-7L16 2z" fill="url(#shield-grad)" stroke="#B4F22E" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Inner shield highlight */}
        <path d="M16 6L8 10v4.5c0 4.8 3.5 9.1 8 10.7 4.5-1.6 8-5.9 8-10.7V10L16 6z" fill="#B4F22E" fillOpacity="0.12" />
        {/* Lock body */}
        <rect x="11" y="15" width="10" height="8" rx="1.5" fill="#B4F22E" />
        {/* Lock shackle */}
        <path d="M13 15v-2.5a3 3 0 016 0V15" stroke="#B4F22E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        {/* Keyhole */}
        <circle cx="16" cy="18.5" r="1.2" fill="black" />
        <rect x="15.3" y="18.5" width="1.4" height="2.5" rx="0.5" fill="black" />
      </svg>
    ),
  },
  {
    title: "Self-custody",
    desc: "Your keys, your crypto. We deliver directly to your wallet — we never hold funds.",
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
        <defs>
          <linearGradient id="key-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B4F22E" />
            <stop offset="100%" stopColor="#7ab820" />
          </linearGradient>
        </defs>
        {/* Key ring - outer */}
        <circle cx="11" cy="20" r="7.5" stroke="#B4F22E" strokeWidth="1.5" fill="#B4F22E" fillOpacity="0.15" />
        {/* Key ring - inner hole */}
        <circle cx="11" cy="20" r="3.5" fill="black" fillOpacity="0.6" stroke="#B4F22E" strokeWidth="1" />
        {/* Key shaft */}
        <rect x="16.5" y="18.5" width="11" height="3" rx="1.5" fill="url(#key-grad)" />
        {/* Key teeth */}
        <rect x="23" y="21.5" width="2" height="2.5" rx="0.5" fill="#B4F22E" />
        <rect x="19" y="21.5" width="2" height="2" rx="0.5" fill="#B4F22E" />
        {/* Shine on ring */}
        <path d="M7 16.5 Q9 14 12 15" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
  },
  {
    title: "Instant settlement",
    desc: "Trades settle in real time via our partner network across 140+ countries.",
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
        <defs>
          <linearGradient id="zap-grad" x1="10" y1="2" x2="22" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B4F22E" />
            <stop offset="100%" stopColor="#7ab820" />
          </linearGradient>
        </defs>
        {/* Shadow bolt (black, offset) */}
        <path d="M19 3L8 18h8l-3 11 13-16h-8l3-10z" fill="black" fillOpacity="0.5" transform="translate(2,2)" />
        {/* Main bolt */}
        <path d="M19 3L8 18h8l-3 11 13-16h-8l3-10z" fill="url(#zap-grad)" />
        {/* Inner highlight line */}
        <path d="M17 8l-5 8h5l-2 6" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      </svg>
    ),
  },
  {
    title: "Best rates",
    desc: "We compare providers automatically so you always get the best exchange rate.",
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B4F22E" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#B4F22E" stopOpacity="0.04" />
          </linearGradient>
          <clipPath id="chart-clip">
            <rect x="3" y="4" width="26" height="22" />
          </clipPath>
        </defs>
        {/* Grid lines */}
        <line x1="3" y1="24" x2="29" y2="24" stroke="#B4F22E" strokeWidth="0.6" strokeOpacity="0.3" />
        <line x1="3" y1="17" x2="29" y2="17" stroke="#B4F22E" strokeWidth="0.6" strokeOpacity="0.2" />
        <line x1="3" y1="10" x2="29" y2="10" stroke="#B4F22E" strokeWidth="0.6" strokeOpacity="0.1" />
        {/* Area fill under trend */}
        <path d="M4 22 L9 18 L14 20 L19 13 L24 9 L28 6 L28 24 L4 24Z" fill="url(#chart-fill)" />
        {/* Trend line */}
        <polyline points="4,22 9,18 14,20 19,13 24,9 28,6" stroke="#B4F22E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Arrow tip */}
        <circle cx="28" cy="6" r="2.5" fill="#B4F22E" />
        <circle cx="28" cy="6" r="1.2" fill="black" />
        {/* Dot on line */}
        <circle cx="19" cy="13" r="2" fill="black" stroke="#B4F22E" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const FAQS = [
  { question: "Why should I buy Bitcoin (BTC)?", answer: "Bitcoin is the original decentralised, peer-to-peer digital currency. People buy Bitcoin as a long-term store of value, a hedge against inflation, or to send money globally without banks or middlemen." },
  { question: "How can I buy Bitcoin with a credit card?", answer: "Enter your amount, select Bitcoin, and choose credit card as your payment method. Complete checkout and Bitcoin is sent directly to your wallet — no waiting." },
  { question: "Can I buy Bitcoin today and sell tomorrow?", answer: "Yes. Once Bitcoin is in your wallet you can sell it at any time using the Sell tab on this page to convert crypto back to your local currency." },
  { question: "Do I need a Bitcoin wallet to buy BTC?", answer: "Yes, you need a wallet address to receive Bitcoin. Pexly provides a built-in non-custodial wallet, or you can use any external wallet like Ledger, Trezor, or Trust Wallet." },
  { question: "How much Bitcoin can I buy?", answer: "Limits depend on your verification level. After completing KYC you can buy from a few dollars up to thousands per transaction." },
  { question: "What is the difference between Bitcoin and Bitcoin Cash?", answer: "Bitcoin (BTC) is the original network. Bitcoin Cash (BCH) is a 2017 fork with larger blocks for faster, cheaper everyday transactions." },
];


const PAYMENT_METHODS = [
  { label: "Visa",         Icon: SiVisa,            color: "#1a1f71" },
  { label: "Apple Pay",    Icon: SiApplepay,        color: "#000000" },
  { label: "Google Pay",   Icon: SiGooglepay,       color: "#4285f4" },
  { label: "Mastercard",   Icon: SiMastercard,      color: "#eb001b" },
  { label: "PayPal",       Icon: SiPaypal,          color: "#003087" },
  { label: "Amex",         Icon: SiAmericanexpress, color: "#007bc1" },
  { label: "SEPA",         Icon: SiSepa,            color: "#0052b4" },
  { label: "Crypto",       Icon: SiBitcoin,         color: "#f7931a" },
];

function PaymentMethodsCarousel() {
  const track = [...PAYMENT_METHODS, ...PAYMENT_METHODS];
  return (
    <section className="py-8">
      <p className="text-center text-foreground font-bold text-xl mb-6">Payment Methods</p>
      <div
        className="overflow-hidden border-y border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 py-5"
        style={{ contain: "content" }}
      >
        <div
          className="animate-scroll [will-change:transform]"
          style={{
            display: "flex",
            gap: "4rem",
            alignItems: "center",
            width: "max-content",
            maskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
          }}
        >
          {track.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-2 whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity"
              aria-hidden={i >= PAYMENT_METHODS.length ? true : undefined}
            >
              <m.Icon style={{ color: m.color }} className="w-7 h-7 flex-shrink-0" />
              <span className="font-bold text-zinc-800 dark:text-zinc-200 text-base tracking-tight">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {["PCI-DSS", "ISO 27001", "SOC 2", "AES-256"].map((b) => (
        <span key={b} className="text-[11px] font-semibold text-muted-foreground border border-border px-2.5 py-1 rounded-full">
          {b}
        </span>
      ))}
    </div>
  );
}

function HowItWorksCarousel({ cryptoName }: { cryptoName: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement;
    if (child) child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setActiveIdx(idx);
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setActiveIdx(idx);
  };

  return (
    <section className="py-6 max-w-6xl mx-auto px-5">
      {/* Section header */}
      <div className="mb-8 text-center">
        <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full mb-3">How it works</span>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Buy {cryptoName} in 3 steps
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
          The simplest way to own crypto — no hidden fees, no middlemen, no waiting.
        </p>
      </div>

      {/* ── DESKTOP: 3-column grid (matches home HowItWorks) ── */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8">
        {HOW_TO_STEPS.map((step, i) => (
          <div key={i} className="relative bg-card border border-border rounded-2xl pt-14 pb-8 px-6 text-center hover:border-primary/30 hover:shadow-lg transition-all">
            {/* Watermark step number */}
            <div className="absolute top-3 right-4 text-7xl font-bold text-foreground/5 select-none leading-none">{step.num}</div>
            {/* Floating icon */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                {step.svg}
              </div>
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">{step.num}. {step.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* ── MOBILE: swipeable carousel ── */}
      <div className="lg:hidden bg-card border border-border rounded-3xl overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {HOW_TO_STEPS.map((step, i) => (
            <div key={i} className="snap-start flex-shrink-0 w-full px-5 pt-4">
              <div className="bg-background border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 flex-shrink-0">
                    {step.svg}
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug">
                    {step.num}. {step.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 pb-4">
          {HOW_TO_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                activeIdx === i
                  ? "w-6 h-2 bg-foreground"
                  : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const BuyCryptoPage = () => {
  useHead({ title: "Buy Crypto Instantly | Pexly" });
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("100");
  const [fiat] = useState("USD");
  const [crypto, setCrypto] = useState("BTC");
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [activeCrypto, setActiveCrypto] = useState("BTC");
  const cdpOnramp = useCdpOnramp();
  const cdpOfframp = useCdpOfframp();

  const { data: recentTxs = [], isLoading: txLoading } = useQuery<any[]>({
    queryKey: ["onramp-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("id, type, crypto_symbol, amount, status, created_at")
        .eq("user_id", user!.id)
        .in("type", ["deposit", "withdrawal", "swap"])
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const cryptoName = crypto === "BTC" ? "Bitcoin" : crypto === "ETH" ? "Ethereum" : crypto === "SOL" ? "Solana" : crypto;

  const estimatedCrypto = useMemo(() => {
    const prices: Record<string, number> = { BTC: 76400, ETH: 2650, SOL: 138, DOGE: 0.165, XRP: 0.52, MATIC: 0.72, LTC: 87, USDC: 1, USDT: 1, AVAX: 28 };
    const result = (parseFloat(amount) || 0) / (prices[crypto] || 1);
    return result < 0.0001 ? result.toFixed(8) : result < 1 ? result.toFixed(5) : result.toFixed(4);
  }, [amount, crypto]);

  const handleAction = async () => {
    if (!user) { setLocation("/signin"); return; }
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    try {
      const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
      const sel = wallets.find((w) => {
        const s = crypto.toUpperCase(), ws = (w.chainId || "").toUpperCase(), wt = (w.walletType || "").toUpperCase();
        if (s === "BTC") return ws === "BTC" || wt === "BITCOIN";
        if (s === "ETH") return ws === "ETH" || wt === "ETHEREUM";
        if (s === "SOL") return ws === "SOL" || wt === "SOLANA";
        return ws.includes(s) || wt.includes(s);
      });
      const wallet = sel || wallets.find((w) => String(w.isActive) === "true") || wallets[0];
      const addr = wallet?.address || (user as any)?.walletAddress || (user as any)?.wallet_address || (user as any)?.user_metadata?.wallet_address;
      if (!addr) { toast({ title: "Wallet required", description: "Set up your wallet address in settings first.", variant: "destructive" }); return; }
      let data;
      if (mode === "buy") {
        data = await cdpOnramp.mutateAsync({ address: addr, purchaseCurrency: crypto, paymentAmount: amount, paymentCurrency: fiat });
      } else {
        data = await cdpOfframp.mutateAsync({ address: addr, sellCurrency: crypto, sellAmount: amount, fiatCurrency: fiat, paymentMethod: "CARD" });
      }
      const url = data.onrampUrl || data.offrampUrl || (data as any).session?.onrampUrl || (data as any).session?.offrampUrl;
      if (url) window.location.href = url;
      else if (data.sessionToken) window.location.href = `${mode === "buy" ? "https://pay.coinbase.com/buy" : "https://pay.coinbase.com/sell"}?sessionToken=${data.sessionToken}`;
      else throw new Error("Failed to get redirect URL");
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const assetsToShow = showAllAssets ? ALL_ASSETS : FEATURED_ASSETS;

  const Widget = (
    <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden w-full">
      {/* Tab row */}
      <div className="flex items-center p-1 gap-1 border-b border-border bg-muted">
        {(["buy", "sell"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${
              mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Selectors */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1 gap-2">
        <button className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 border border-border rounded-full px-3 py-1.5 text-sm font-semibold transition-colors text-foreground">
          {fiat} <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </button>
        <button
          onClick={() => setActiveCrypto(crypto)}
          className="flex items-center gap-2 bg-muted hover:bg-muted/80 border border-border rounded-full px-3 py-1.5 text-sm font-semibold transition-colors text-foreground"
        >
          <img src={getCryptoIconUrl(crypto)} alt={crypto} className="w-5 h-5 rounded-full object-cover" />
          {mode === "buy" ? "Buy" : "Sell"} {crypto}
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </button>
        <button className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 border border-border flex items-center justify-center transition-colors flex-shrink-0">
          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Amount */}
      <div className="px-4 pt-2 pb-1 text-center">
        <div className="flex items-start justify-center gap-0.5">
          <span className="text-lg font-bold text-muted-foreground/50 mt-1 select-none">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-5xl font-bold w-full text-center outline-none bg-transparent leading-tight text-foreground caret-primary"
            style={{ minWidth: 0 }}
            placeholder="0"
          />
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-1 text-muted-foreground text-xs font-medium">
          <ArrowLeftRight className="w-3 h-3" />
          <span>≈ {estimatedCrypto} {crypto}</span>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1.5 px-3 pb-3 mt-1">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            onClick={() => setAmount(q)}
            className={`flex-1 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
              amount === q
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            ${q === "1000" ? "1k" : q}
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="px-3 pb-4 space-y-2">
        <Button
          onClick={handleAction}
          disabled={cdpOnramp.isPending || cdpOfframp.isPending || !amount}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-black rounded-2xl text-sm font-bold border-none shadow-md shadow-primary/20 transition-all"
        >
          {cdpOnramp.isPending || cdpOfframp.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : user ? (
            `Continue with ${cryptoName}`
          ) : (
            "Sign in to continue"
          )}
        </Button>
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-[11px] text-muted-foreground/60">Powered by</span>
          <img src="/logos/coinbase-logo.svg" alt="Coinbase" className="h-3.5 w-3.5 rounded" />
          <span className="text-[11px] font-semibold text-muted-foreground">Coinbase</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-background pt-8 pb-10 px-5 lg:px-10">

        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">

          {/* Main grid: text left, widget right */}
          <div className="lg:flex lg:items-start lg:gap-8 lg:justify-center">

            {/* Left */}
            <div className="lg:w-[520px] lg:flex-shrink-0">
              <h1 className="text-4xl lg:text-[34px] font-bold leading-[1.1] tracking-tight mb-4 text-foreground">
                Buy {cryptoName},<br />
                <span className="text-primary">join the crypto</span>{" "}revolution!
              </h1>

              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-sm">
                Pexly offers the fastest way to buy crypto with a credit card, bank transfer, Apple Pay, Google Pay, and more — in 140+ countries.
              </p>

              {/* ── NOT LOGGED IN: CTAs ── */}
              {!user && (
                <div className="flex flex-wrap gap-3 mb-8">
                  <Link href="/signup">
                    <button className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20">
                      Get started free →
                    </button>
                  </Link>
                  <Link href="/signin">
                    <button className="bg-muted hover:bg-muted/80 border border-border text-foreground font-bold px-6 py-3 rounded-2xl text-sm transition-all">
                      Sign in
                    </button>
                  </Link>
                </div>
              )}

              {/* ── LOGGED IN: quick action links ── */}
              {user && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {["Bitcoin", "Ethereum", "Solana"].map((n) => {
                    const s = n === "Bitcoin" ? "BTC" : n === "Ethereum" ? "ETH" : "SOL";
                    return (
                      <button
                        key={s}
                        onClick={() => setCrypto(s)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          crypto === s
                            ? "bg-primary/15 border-primary/30 text-primary"
                            : "bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        }`}
                      >
                        <img src={getCryptoIconUrl(s)} alt={s} className="w-3.5 h-3.5 rounded-full" />
                        {n}
                      </button>
                    );
                  })}
                </div>
              )}

              <TrustBadges />

              {/* App store badge */}
              <div className="flex items-center gap-2 mt-6">
                <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
                  <SiApple className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                  <span className="text-muted-foreground text-xs ml-1">4.8 on App Store</span>
                </div>
              </div>
            </div>

            {/* Right: Widget */}
            <div className="mt-10 lg:mt-0 lg:sticky lg:top-24 lg:w-[400px] lg:flex-shrink-0">
              {Widget}

              {/* ── LOGGED IN: recent activity below widget ── */}
              {user && (
                <div className="mt-4 bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Recent activity
                    </span>
                    {recentTxs.length > 0 && (
                      <Link href="/wallet">
                        <span className="text-primary text-[11px] font-semibold hover:underline">View all</span>
                      </Link>
                    )}
                  </div>

                  {txLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentTxs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <Clock className="w-7 h-7 text-muted-foreground/30 mb-2" />
                      <p className="text-muted-foreground text-xs">No transactions yet</p>
                      <p className="text-muted-foreground/60 text-[11px] mt-0.5">Your buy and sell activity will appear here</p>
                    </div>
                  ) : (
                    recentTxs.map((tx) => {
                      const isBuy = tx.type === "deposit";
                      const isSell = tx.type === "withdrawal";
                      const label = isBuy ? "Buy" : isSell ? "Sell" : tx.type.replace(/_/g, " ");
                      const amountStr = `${Number(tx.amount).toFixed(
                        Number(tx.amount) < 0.001 ? 8 : Number(tx.amount) < 1 ? 5 : 4
                      )} ${tx.crypto_symbol}`;
                      const dateStr = formatDistanceToNow(new Date(tx.created_at), { addSuffix: true });

                      return (
                        <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSell ? "bg-red-500/15" : "bg-primary/15"
                          }`}>
                            <img src={getCryptoIconUrl(tx.crypto_symbol)} alt={tx.crypto_symbol} className="w-4 h-4 rounded-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground text-xs font-semibold">
                              {label} <span className="text-primary">{tx.crypto_symbol}</span>
                            </p>
                            <p className="text-muted-foreground text-[11px] capitalize">{tx.status} · {dateStr}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs font-bold ${isSell ? "text-red-400" : "text-primary"}`}>
                              {isSell ? "-" : "+"}{amountStr}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CONTENT — light/dark background
      ═══════════════════════════════════════ */}

      {/* ── PAYMENT METHODS ── */}
      <PaymentMethodsCarousel />

      {/* ── HOW IT WORKS ── */}
      <HowItWorksCarousel cryptoName={cryptoName} />

      {/* ── TRUST / FEATURES ── */}
      <section className="px-5 pb-10 max-w-6xl mx-auto">
        <div className="text-center mb-7">
          <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full mb-4">Why Pexly</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Built for the next billion</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TRUST_FEATURES.map((f, i) => (
            <div key={i} className="flex gap-4 bg-card border border-border rounded-3xl p-6 hover:border-primary/30 transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                {f.svg}
              </div>
              <div>
                <h3 className="font-bold text-base mb-1 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE MARKET / ASSETS ── */}
      <section className="px-5 pb-10 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full mb-2">Markets</span>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Buy {cryptoName} and 100+ assets</h2>
          </div>
          <button
            onClick={() => setShowAllAssets(!showAllAssets)}
            className="hidden md:flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAllAssets ? "Show less" : "All assets"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] px-5 py-3 border-b border-border">
            {["Asset", "Price", "24h change", "Action"].map((h) => (
              <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {assetsToShow.map((asset, i) => (
            <div
              key={asset.symbol}
              className={`flex md:grid md:grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer group ${
                i < assetsToShow.length - 1 ? "border-b border-border" : ""
              }`}
              onClick={() => { setCrypto(asset.symbol); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img src={getCryptoIconUrl(asset.symbol)} alt={asset.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-foreground">{asset.name}</p>
                  <p className="text-muted-foreground text-xs font-medium">{asset.symbol}</p>
                </div>
              </div>
              <p className="font-bold text-sm text-foreground hidden md:block">{asset.price}</p>
              <p className={`font-bold text-sm hidden md:block ${asset.up ? "text-emerald-500" : "text-red-400"}`}>{asset.change}</p>
              <div className="hidden md:block">
                <button className="text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-xl transition-colors">
                  Buy {asset.symbol}
                </button>
              </div>
              <div className="md:hidden ml-auto text-right">
                <p className="font-bold text-sm text-foreground">{asset.price}</p>
                <p className={`text-xs font-semibold ${asset.up ? "text-emerald-500" : "text-red-400"}`}>{asset.change}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowAllAssets(!showAllAssets)}
          className="md:hidden flex items-center gap-1.5 mt-4 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          {showAllAssets ? "Show less" : "Show all assets"} <ChevronDown className={`w-4 h-4 transition-transform ${showAllAssets ? "rotate-180" : ""}`} />
        </button>
      </section>

      {/* ── GET THE APP ── */}
      <section className="pb-10 px-5 lg:px-0">
        <div
          className="relative overflow-hidden rounded-3xl lg:rounded-3xl px-6 lg:px-24 py-12 lg:py-36"
          style={{
            backgroundImage: "url('/IMG_4637.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-primary/6 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-6xl mx-auto lg:flex lg:items-center lg:justify-between lg:gap-16">
            <div className="lg:max-w-xl mb-8 lg:mb-0">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Get the Pexly app.<br />
                <span className="text-primary">Buy anywhere, anytime.</span>
              </h2>
              <p className="text-white/60 text-base lg:text-lg leading-relaxed">
                Whether you're a first-time buyer or seasoned trader — the Pexly app gives you everything in one place.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button className="bg-primary hover:bg-primary/90 text-black font-bold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg shadow-primary/25">
                Download app
              </button>
              <Link href="/signup">
                <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-sm transition-all backdrop-blur-sm">
                  Sign up free
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-5 pb-10 max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-16">
          <div className="mb-8 lg:mb-0">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full mb-4">FAQ</span>
            <h2 className="text-3xl font-bold text-foreground">
              Frequently asked<br />questions
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Everything you need to know about buying crypto on Pexly.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border rounded-2xl px-5 overflow-hidden data-[state=open]:border-primary/30 transition-all"
              >
                <AccordionTrigger className="text-sm font-semibold hover:no-underline text-left py-4 group text-foreground">
                  <span className="flex items-center gap-3">
                    <Plus className="w-4 h-4 flex-shrink-0 text-muted-foreground group-data-[state=open]:hidden" />
                    <Minus className="w-4 h-4 flex-shrink-0 text-primary hidden group-data-[state=open]:block" />
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pl-7 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── NEED HELP ── */}
      <section className="px-5 pb-10 max-w-6xl mx-auto">
        <div className="relative overflow-hidden bg-card border border-border rounded-3xl px-6 lg:px-12 py-10 lg:py-12">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="mb-6 lg:mb-0">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Need help buying {cryptoName}?</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                Our support team and academy are here to guide you every step of the way.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap flex-shrink-0">
              <Link href="/support">
                <button className="bg-foreground text-background font-bold px-5 py-3 rounded-2xl text-sm hover:opacity-90 transition-opacity">
                  Help Centre
                </button>
              </Link>
              <Link href="/academy">
                <button className="bg-muted hover:bg-muted/80 border border-border text-foreground font-bold px-5 py-3 rounded-2xl text-sm transition-all">
                  Pexly Academy
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
};

export default BuyCryptoPage;
