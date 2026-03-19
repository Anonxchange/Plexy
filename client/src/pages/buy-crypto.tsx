import { useState, useMemo } from "react";
import { useHead } from "@unhead/react";
import {
  ChevronDown,
  Settings,
  ArrowLeftRight,
  Plus,
  Minus,
  Loader2,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Shield,
  Zap,
  Wallet,
  Clock,
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
import { AppFooter } from "@/components/app-footer";
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
  { num: "01", title: "Create your account", desc: "Sign up in seconds and verify your identity with our quick KYC process.", icon: User },
  { num: "02", title: "Select your crypto", desc: "Choose from 100+ assets. Enter your spend amount in any local currency.", icon: TrendingUp },
  { num: "03", title: "Pay & receive instantly", desc: "Use card, bank, Apple Pay, or Google Pay. Crypto lands in your wallet right away.", icon: Zap },
];

const TRUST_FEATURES = [
  { title: "Bank-grade security", desc: "AES-256 encryption, PCI-DSS compliant, and ISO 27001 certified.", icon: Shield },
  { title: "Self-custody",        desc: "Your keys, your crypto. We deliver directly to your wallet — we never hold funds.", icon: Wallet },
  { title: "Instant settlement",  desc: "Trades settle in real time via our partner network across 140+ countries.", icon: Zap },
  { title: "Best rates",          desc: "We compare providers automatically so you always get the best exchange rate.", icon: TrendingUp },
];

const FAQS = [
  { question: "Why should I buy Bitcoin (BTC)?", answer: "Bitcoin is the original decentralised, peer-to-peer digital currency. People buy Bitcoin as a long-term store of value, a hedge against inflation, or to send money globally without banks or middlemen." },
  { question: "How can I buy Bitcoin with a credit card?", answer: "Enter your amount, select Bitcoin, and choose credit card as your payment method. Complete checkout and Bitcoin is sent directly to your wallet — no waiting." },
  { question: "Can I buy Bitcoin today and sell tomorrow?", answer: "Yes. Once Bitcoin is in your wallet you can sell it at any time using the Sell tab on this page to convert crypto back to your local currency." },
  { question: "Do I need a Bitcoin wallet to buy BTC?", answer: "Yes, you need a wallet address to receive Bitcoin. Pexly provides a built-in non-custodial wallet, or you can use any external wallet like Ledger, Trezor, or Trust Wallet." },
  { question: "How much Bitcoin can I buy?", answer: "Limits depend on your verification level. After completing KYC you can buy from a few dollars up to thousands per transaction." },
  { question: "What is the difference between Bitcoin and Bitcoin Cash?", answer: "Bitcoin (BTC) is the original network. Bitcoin Cash (BCH) is a 2017 fork with larger blocks for faster, cheaper everyday transactions." },
];

const MOCK_RECENT = [
  { type: "buy",  asset: "BTC", amount: "0.00131 BTC", fiat: "$100",  date: "2 days ago" },
  { type: "buy",  asset: "ETH", amount: "0.0377 ETH",  fiat: "$100",  date: "5 days ago" },
  { type: "sell", asset: "SOL", amount: "0.724 SOL",    fiat: "$100",  date: "1 week ago" },
];

function FloatingChip({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 bg-white/8 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 shadow-lg`}>
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <div>
        <div className="text-white text-xs font-bold leading-none">{label}</div>
        <div className="text-white/50 text-[10px] leading-none mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {["PCI-DSS", "ISO 27001", "SOC 2", "AES-256"].map((b) => (
        <span key={b} className="text-[11px] font-semibold text-white/40 border border-white/10 px-2.5 py-1 rounded-full">
          {b}
        </span>
      ))}
    </div>
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
    <div className="bg-white dark:bg-[#111116] border border-gray-100 dark:border-white/6 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden w-full">
      {/* Tab row */}
      <div className="flex items-center p-1.5 gap-1 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/3">
        {(["buy", "sell"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
              mode === m
                ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm"
                : "text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Selectors */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-3">
        <button className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/7 hover:bg-gray-200 dark:hover:bg-white/12 border border-gray-200 dark:border-white/8 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors text-gray-800 dark:text-white">
          {fiat} <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </button>
        <button
          onClick={() => setActiveCrypto(crypto)}
          className="flex items-center gap-2 bg-gray-100 dark:bg-white/7 hover:bg-gray-200 dark:hover:bg-white/12 border border-gray-200 dark:border-white/8 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors text-gray-800 dark:text-white"
        >
          <img src={getCryptoIconUrl(crypto)} alt={crypto} className="w-5 h-5 rounded-full object-cover" />
          {mode === "buy" ? "Buy" : "Sell"} {crypto}
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </button>
        <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/7 hover:bg-gray-200 dark:hover:bg-white/12 border border-gray-200 dark:border-white/8 flex items-center justify-center transition-colors flex-shrink-0">
          <Settings className="w-3.5 h-3.5 text-gray-500 dark:text-white/50" />
        </button>
      </div>

      {/* Amount */}
      <div className="px-5 pt-3 pb-2 text-center">
        <div className="flex items-start justify-center gap-0.5">
          <span className="text-xl font-bold text-gray-300 dark:text-white/30 mt-1.5 select-none">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-5xl font-black w-full text-center outline-none bg-transparent leading-tight text-gray-900 dark:text-white caret-[#B4F22E]"
            style={{ minWidth: 0 }}
            placeholder="0"
          />
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-1.5 text-gray-400 dark:text-white/40 text-xs font-medium">
          <ArrowLeftRight className="w-3 h-3" />
          <span>≈ {estimatedCrypto} {crypto}</span>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2 px-4 pb-4 mt-1">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            onClick={() => setAmount(q)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
              amount === q
                ? "border-[#B4F22E] bg-[#B4F22E]/10 text-[#7ab81f] dark:text-[#B4F22E]"
                : "border-gray-150 dark:border-white/7 bg-white dark:bg-transparent text-gray-500 dark:text-white/40 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-700 dark:hover:text-white/70"
            }`}
          >
            ${q === "1000" ? "1,000" : q}
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="px-4 pb-5 space-y-3">
        <Button
          onClick={handleAction}
          disabled={cdpOnramp.isPending || cdpOfframp.isPending || !amount}
          className="w-full h-12 bg-[#B4F22E] hover:bg-[#c8ff40] active:bg-[#9ed428] text-black rounded-2xl text-sm font-bold border-none shadow-md shadow-[#B4F22E]/20 transition-all"
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
          <span className="text-[11px] text-gray-400 dark:text-white/25">Powered by</span>
          <img src="/logos/coinbase-logo.svg" alt="Coinbase" className="h-3.5 w-3.5 rounded" />
          <span className="text-[11px] font-semibold text-gray-500 dark:text-white/40">Coinbase</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#08080C] text-black dark:text-white">

      {/* ═══════════════════════════════════════
          HERO — dark gradient, always visible
      ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#05050A] via-[#0A0A12] to-[#0D0D18] pt-10 pb-20 px-5">

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#B4F22E]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">

          {/* ── LOGGED IN: personalized header bar ── */}
          {user && (
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#B4F22E]/15 border border-[#B4F22E]/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4.5 h-4.5 text-[#B4F22E]" />
                </div>
                <div>
                  <p className="text-white/50 text-xs font-medium">Welcome back</p>
                  <p className="text-white font-bold text-sm truncate max-w-[200px]">
                    {(user as any).email || "Your Account"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Quick-stat chips */}
                <FloatingChip label="Verified" sub="KYC passed" color="bg-[#B4F22E]" />
                <FloatingChip label="Wallet" sub="Connected" color="bg-blue-400" />
              </div>
            </div>
          )}

          {/* Main grid: text left, widget right */}
          <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-12 lg:items-start">

            {/* Left */}
            <div>
              {/* ── NOT LOGGED IN: floating market chips ── */}
              {!user && (
                <div className="flex flex-wrap gap-2 mb-7">
                  <FloatingChip label="BTC $76,400" sub="+2.4% today" color="bg-orange-400" />
                  <FloatingChip label="ETH $2,650" sub="+1.8% today" color="bg-blue-400" />
                  <FloatingChip label="SOL $138" sub="+5.1% today" color="bg-[#B4F22E]" />
                </div>
              )}

              {/* Coin icon */}
              <div className="mb-5 flex items-center gap-3">
                <img src={getCryptoIconUrl(crypto)} alt={crypto} className="w-14 h-14 rounded-full shadow-lg ring-2 ring-white/10" />
                <div className="flex items-center gap-1.5 bg-white/8 backdrop-blur border border-white/10 rounded-full px-3 py-1.5">
                  <TrendingUp className="w-3 h-3 text-[#B4F22E]" />
                  <span className="text-[#B4F22E] text-xs font-bold">+2.4% today</span>
                </div>
              </div>

              <h1 className="text-4xl lg:text-[52px] font-black leading-[1.1] tracking-tight mb-4 text-white">
                Buy {cryptoName},<br />
                <span className="text-[#B4F22E]">join the crypto</span><br />
                revolution!
              </h1>

              <p className="text-white/50 text-base leading-relaxed mb-8 max-w-sm">
                Pexly offers the fastest way to buy crypto with a credit card, bank transfer, Apple Pay, Google Pay, and more — in 140+ countries.
              </p>

              {/* ── NOT LOGGED IN: CTAs ── */}
              {!user && (
                <div className="flex flex-wrap gap-3 mb-8">
                  <Link href="/signup">
                    <button className="bg-[#B4F22E] hover:bg-[#c8ff40] text-black font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-[#B4F22E]/20">
                      Get started free →
                    </button>
                  </Link>
                  <Link href="/signin">
                    <button className="bg-white/8 hover:bg-white/12 border border-white/10 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all backdrop-blur">
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
                            ? "bg-[#B4F22E]/15 border-[#B4F22E]/30 text-[#B4F22E]"
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"
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
                <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Smartphone className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                  <span className="text-white/40 text-xs ml-1">4.8 on App Store</span>
                </div>
              </div>
            </div>

            {/* Right: Widget */}
            <div className="mt-10 lg:mt-0 lg:sticky lg:top-24">
              {Widget}

              {/* ── LOGGED IN: recent activity below widget ── */}
              {user && (
                <div className="mt-4 bg-white/5 backdrop-blur border border-white/8 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5">
                    <span className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Recent activity
                    </span>
                  </div>
                  {MOCK_RECENT.map((tx, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/4 last:border-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        tx.type === "buy" ? "bg-[#B4F22E]/15" : "bg-red-500/15"
                      }`}>
                        {tx.type === "buy"
                          ? <ArrowDownLeft className="w-3.5 h-3.5 text-[#B4F22E]" />
                          : <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold capitalize">{tx.type} {tx.asset}</p>
                        <p className="text-white/40 text-[11px]">{tx.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xs font-bold">{tx.fiat}</p>
                        <p className="text-white/40 text-[11px]">{tx.amount}</p>
                      </div>
                    </div>
                  ))}
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
      <section className="px-5 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-[#B4F22E] text-xs font-bold uppercase tracking-widest bg-[#B4F22E]/10 px-3 py-1.5 rounded-full mb-4">How it works</span>
          <h2 className="text-3xl lg:text-4xl font-black mb-3">Buy {cryptoName} in 3 steps</h2>
          <p className="text-gray-500 dark:text-white/40 max-w-md mx-auto text-base">
            The simplest way to own crypto — no hidden fees, no middlemen, no waiting.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {HOW_TO_STEPS.map((step, i) => (
            <div key={i} className="relative bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/6 rounded-3xl p-6 group hover:border-[#B4F22E]/30 dark:hover:border-[#B4F22E]/20 transition-all">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#B4F22E] flex items-center justify-center shadow-md shadow-[#B4F22E]/20">
                  <step.icon className="w-5 h-5 text-black" />
                </div>
                <span className="text-4xl font-black text-gray-100 dark:text-white/5 select-none">{step.num}</span>
              </div>
              <h3 className="text-lg font-black mb-2 text-gray-900 dark:text-white">{step.title}</h3>
              <p className="text-gray-500 dark:text-white/40 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST / FEATURES ── */}
      <section className="px-5 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-[#B4F22E] text-xs font-bold uppercase tracking-widest bg-[#B4F22E]/10 px-3 py-1.5 rounded-full mb-4">Why Pexly</span>
          <h2 className="text-3xl lg:text-4xl font-black">Built for the next billion</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TRUST_FEATURES.map((f, i) => (
            <div key={i} className="flex gap-4 bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/6 rounded-3xl p-6 hover:border-[#B4F22E]/30 dark:hover:border-[#B4F22E]/20 transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-[#B4F22E]/10 dark:bg-[#B4F22E]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#B4F22E]/20 transition-colors">
                <f.icon className="w-5 h-5 text-[#B4F22E]" />
              </div>
              <div>
                <h3 className="font-black text-base mb-1 text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-gray-500 dark:text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE MARKET / ASSETS ── */}
      <section className="px-5 pb-20 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="inline-block text-[#B4F22E] text-xs font-bold uppercase tracking-widest bg-[#B4F22E]/10 px-3 py-1.5 rounded-full mb-3">Markets</span>
            <h2 className="text-2xl lg:text-3xl font-black">Buy {cryptoName} and 100+ assets</h2>
          </div>
          <button
            onClick={() => setShowAllAssets(!showAllAssets)}
            className="hidden md:flex items-center gap-1 text-sm font-semibold text-gray-500 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
          >
            {showAllAssets ? "Show less" : "All assets"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-white/2 border border-gray-100 dark:border-white/6 rounded-3xl overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] px-5 py-3 border-b border-gray-100 dark:border-white/5">
            {["Asset", "Price", "24h change", "Action"].map((h) => (
              <span key={h} className="text-xs font-semibold text-gray-400 dark:text-white/25 uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {assetsToShow.map((asset, i) => (
            <div
              key={asset.symbol}
              className={`flex md:grid md:grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 px-5 py-4 hover:bg-gray-100 dark:hover:bg-white/4 transition-colors cursor-pointer group ${
                i < assetsToShow.length - 1 ? "border-b border-gray-100 dark:border-white/4" : ""
              }`}
              onClick={() => { setCrypto(asset.symbol); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img src={getCryptoIconUrl(asset.symbol)} alt={asset.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{asset.name}</p>
                  <p className="text-gray-400 dark:text-white/30 text-xs font-medium">{asset.symbol}</p>
                </div>
              </div>
              <p className="font-bold text-sm text-gray-900 dark:text-white hidden md:block">{asset.price}</p>
              <p className={`font-bold text-sm hidden md:block ${asset.up ? "text-emerald-500" : "text-red-400"}`}>{asset.change}</p>
              <div className="hidden md:block">
                <button className="text-xs font-bold bg-[#B4F22E]/10 hover:bg-[#B4F22E]/20 text-[#7ab81f] dark:text-[#B4F22E] px-3 py-1.5 rounded-xl transition-colors">
                  Buy {asset.symbol}
                </button>
              </div>
              {/* Mobile: price + change on right */}
              <div className="md:hidden ml-auto text-right">
                <p className="font-bold text-sm text-gray-900 dark:text-white">{asset.price}</p>
                <p className={`text-xs font-semibold ${asset.up ? "text-emerald-500" : "text-red-400"}`}>{asset.change}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowAllAssets(!showAllAssets)}
          className="md:hidden flex items-center gap-1.5 mt-4 text-sm font-semibold text-gray-500 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors mx-auto"
        >
          {showAllAssets ? "Show less" : "Show all assets"} <ChevronDown className={`w-4 h-4 transition-transform ${showAllAssets ? "rotate-180" : ""}`} />
        </button>
      </section>

      {/* ── GET THE APP ── */}
      <section className="px-5 pb-20 max-w-6xl mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0A0A12] to-[#131320] rounded-3xl px-6 lg:px-12 py-12 lg:py-14">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#B4F22E]/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="lg:max-w-lg mb-7 lg:mb-0">
              <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
                Get the Pexly app.<br />
                <span className="text-[#B4F22E]">Buy anywhere, anytime.</span>
              </h2>
              <p className="text-white/40 text-base leading-relaxed">
                Whether you're a first-time buyer or seasoned trader — the Pexly app gives you everything in one place.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button className="bg-[#B4F22E] hover:bg-[#c8ff40] text-black font-bold px-7 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-[#B4F22E]/20">
                Download app
              </button>
              <Link href="/signup">
                <button className="bg-white/8 hover:bg-white/14 border border-white/10 text-white font-bold px-7 py-3.5 rounded-2xl text-sm transition-all backdrop-blur">
                  Sign up free
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-5 pb-20 max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-16">
          <div className="mb-8 lg:mb-0">
            <span className="inline-block text-[#B4F22E] text-xs font-bold uppercase tracking-widest bg-[#B4F22E]/10 px-3 py-1.5 rounded-full mb-4">FAQ</span>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">
              Frequently asked<br />questions
            </h2>
            <p className="text-gray-500 dark:text-white/40 text-sm mt-3 leading-relaxed">
              Everything you need to know about buying crypto on Pexly.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/6 rounded-2xl px-5 overflow-hidden data-[state=open]:border-[#B4F22E]/30 dark:data-[state=open]:border-[#B4F22E]/20 transition-all"
              >
                <AccordionTrigger className="text-sm font-semibold hover:no-underline text-left py-4 group text-gray-900 dark:text-white">
                  <span className="flex items-center gap-3">
                    <Plus className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-white/30 group-data-[state=open]:hidden" />
                    <Minus className="w-4 h-4 flex-shrink-0 text-[#B4F22E] hidden group-data-[state=open]:block" />
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-500 dark:text-white/40 text-sm leading-relaxed pl-7 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── NEED HELP ── */}
      <section className="px-5 pb-16 max-w-6xl mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#05050A] to-[#0D0D18] rounded-3xl px-6 lg:px-12 py-10 lg:py-12">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/6 rounded-full blur-3xl pointer-events-none" />
          <div className="relative lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="mb-6 lg:mb-0">
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-2">Need help buying {cryptoName}?</h2>
              <p className="text-white/40 text-sm leading-relaxed max-w-md">
                Our support team and academy are here to guide you every step of the way.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap flex-shrink-0">
              <Link href="/support">
                <button className="bg-white text-black font-bold px-5 py-3 rounded-2xl text-sm hover:bg-gray-100 transition-colors">
                  Help Centre
                </button>
              </Link>
              <Link href="/academy">
                <button className="bg-white/8 hover:bg-white/14 border border-white/10 text-white font-bold px-5 py-3 rounded-2xl text-sm transition-all backdrop-blur">
                  Pexly Academy
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
};

export default BuyCryptoPage;
