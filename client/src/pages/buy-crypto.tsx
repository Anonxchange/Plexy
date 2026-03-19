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
  TrendingUp,
  Zap,
  Clock,
  ShieldCheck,
  KeyRound,
  Gauge,
  BadgePercent,
  ArrowUpRight,
  ArrowDownLeft,
  User,
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
import { SiApple } from "react-icons/si";
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
  { num: "1", title: "Create your account", desc: "Sign up in seconds and verify your identity with our quick KYC process.", icon: User },
  { num: "2", title: "Select your crypto", desc: "Choose from 100+ assets. Enter your spend amount in any local currency.", icon: TrendingUp },
  { num: "3", title: "Pay & receive instantly", desc: "Use card, bank, Apple Pay, or Google Pay. Crypto lands in your wallet right away.", icon: Zap },
];

const TRUST_FEATURES = [
  { title: "Bank-grade security", desc: "AES-256 encryption, PCI-DSS compliant, and ISO 27001 certified.", icon: ShieldCheck },
  { title: "Self-custody",        desc: "Your keys, your crypto. We deliver directly to your wallet — we never hold funds.", icon: KeyRound },
  { title: "Instant settlement",  desc: "Trades settle in real time via our partner network across 140+ countries.", icon: Gauge },
  { title: "Best rates",          desc: "We compare providers automatically so you always get the best exchange rate.", icon: BadgePercent },
];

const FAQS = [
  { question: "Why should I buy Bitcoin (BTC)?", answer: "Bitcoin is the original decentralised, peer-to-peer digital currency. People buy Bitcoin as a long-term store of value, a hedge against inflation, or to send money globally without banks or middlemen." },
  { question: "How can I buy Bitcoin with a credit card?", answer: "Enter your amount, select Bitcoin, and choose credit card as your payment method. Complete checkout and Bitcoin is sent directly to your wallet — no waiting." },
  { question: "Can I buy Bitcoin today and sell tomorrow?", answer: "Yes. Once Bitcoin is in your wallet you can sell it at any time using the Sell tab on this page to convert crypto back to your local currency." },
  { question: "Do I need a Bitcoin wallet to buy BTC?", answer: "Yes, you need a wallet address to receive Bitcoin. Pexly provides a built-in non-custodial wallet, or you can use any external wallet like Ledger, Trezor, or Trust Wallet." },
  { question: "How much Bitcoin can I buy?", answer: "Limits depend on your verification level. After completing KYC you can buy from a few dollars up to thousands per transaction." },
  { question: "What is the difference between Bitcoin and Bitcoin Cash?", answer: "Bitcoin (BTC) is the original network. Bitcoin Cash (BCH) is a 2017 fork with larger blocks for faster, cheaper everyday transactions." },
];


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
    const scrollLeft = el.scrollLeft;
    const width = el.offsetWidth;
    const idx = Math.round(scrollLeft / width);
    setActiveIdx(idx);
  };

  return (
    <section className="py-6 max-w-6xl mx-auto px-5">
      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full mb-3">How it works</span>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-1">
            Buy {cryptoName} in 3 steps
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
            The simplest way to own crypto — no hidden fees, no middlemen, no waiting.
          </p>
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {HOW_TO_STEPS.map((step, i) => (
            <div key={i} className="snap-start flex-shrink-0 w-full px-5">
              <div className="bg-background border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 flex-shrink-0">
                    <step.icon className="w-4.5 h-4.5 text-black" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug">
                    {step.num}. {step.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.desc}
                </p>
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
      <section className="relative overflow-hidden bg-background pt-8 pb-10 px-5">

        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">

          {/* Main grid: text left, widget right */}
          <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-12 lg:items-start">

            {/* Left */}
            <div>
              <h1 className="text-4xl lg:text-[52px] font-bold leading-[1.1] tracking-tight mb-4 text-foreground">
                Buy {cryptoName},<br />
                <span className="text-primary">join the crypto</span><br />
                revolution!
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
            <div className="mt-10 lg:mt-0 lg:sticky lg:top-24">
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
                <f.icon className="w-5 h-5 text-primary" />
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
      <section className="px-5 pb-10 max-w-6xl mx-auto">
        <div
          className="relative overflow-hidden rounded-3xl px-6 lg:px-12 py-12 lg:py-14"
          style={{
            backgroundImage: "url('/IMG_2657.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/65 rounded-3xl" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/12 rounded-full blur-3xl pointer-events-none" />

          <div className="relative lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="lg:max-w-lg mb-7 lg:mb-0">
              <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
                Get the Pexly app.<br />
                <span className="text-primary">Buy anywhere, anytime.</span>
              </h2>
              <p className="text-white/60 text-base leading-relaxed">
                Whether you're a first-time buyer or seasoned trader — the Pexly app gives you everything in one place.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button className="bg-primary hover:bg-primary/90 text-black font-bold px-7 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/25">
                Download app
              </button>
              <Link href="/signup">
                <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-7 py-3.5 rounded-2xl text-sm transition-all backdrop-blur-sm">
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
