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

const HOW_TO_STEPS = [
  {
    icon: "1",
    title: "1. Open your free account",
    desc: "Sign up for a free account in seconds from our app, then add a few personal details to verify your identity.",
  },
  {
    icon: "2",
    title: "2. Choose your crypto",
    desc: "Select from Bitcoin, Ethereum, Solana, and 100+ more cryptocurrencies. Enter the amount in your local currency.",
  },
  {
    icon: "3",
    title: "3. Pay and receive",
    desc: "Pay with credit card, debit card, bank transfer, Apple Pay, Google Pay, and more. Crypto lands in your wallet instantly.",
  },
];

const SECURITY_SLIDES = [
  {
    title: "Our security credentials are in check",
    desc: "We use AES-256 encryption and are PCI-DSS compliant. We also hold the ISO 27001 certification — independently audited and a global standard for information security.",
  },
  {
    title: "Self-custody by default",
    desc: "Your keys, your crypto. Pexly never holds your funds. All assets are delivered directly to your personal wallet — we can never access or freeze them.",
  },
  {
    title: "24/7 fraud monitoring",
    desc: "Real-time transaction screening and anomaly detection protect every purchase. Our security team reviews suspicious activity around the clock.",
  },
];

const USAGE_SLIDES = [
  {
    icon: "🪙",
    title: "Hold",
    desc: "Store your purchased crypto in your preferred wallet. Choose from custodial and non-custodial options such as Ledger, Trezor, Exodus, and Trust Wallet.",
  },
  {
    icon: "🔄",
    title: "Swap",
    desc: "Exchange one cryptocurrency for another without leaving the app. Swap Bitcoin for Ethereum, Solana, and your favourite coins instantly.",
  },
  {
    icon: "💳",
    title: "Spend",
    desc: "Pay bills, shop with top brands, buy gift cards, or spend your crypto at checkout — all from the Pexly app.",
  },
];

const SUPPORTED_ASSETS = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "MATIC", name: "Polygon" },
];

const ALL_ASSETS = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "USDC", name: "USDC" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "LINK", name: "Chainlink" },
];

const FAQS = [
  {
    question: "Why should I buy Bitcoin (BTC)?",
    answer:
      "Bitcoin is the original decentralised, peer-to-peer digital currency. People buy Bitcoin as a long-term store of value, a hedge against inflation, or to send money globally without banks or middlemen.",
  },
  {
    question: "How can I buy Bitcoin with a credit card?",
    answer:
      "On the buy page, enter your amount, select Bitcoin as your cryptocurrency, and choose credit card as your payment method. Complete the checkout and Bitcoin will be sent directly to your wallet.",
  },
  {
    question: "Can I buy Bitcoin today and sell tomorrow?",
    answer:
      "Yes. Once Bitcoin is in your wallet you can sell it at any time. Use the Sell tab on this page to convert crypto back to your local currency.",
  },
  {
    question: "Do I need to create a Bitcoin wallet to buy BTC?",
    answer:
      "Yes, you need a wallet address to receive Bitcoin. Pexly provides a built-in non-custodial wallet, or you can use any external wallet like Ledger, Trezor, or Trust Wallet.",
  },
  {
    question: "How much Bitcoin can I buy?",
    answer:
      "Limits depend on your verified identity level. After completing KYC verification you can buy from a few dollars up to thousands per transaction.",
  },
  {
    question: "What is the difference between Bitcoin and Bitcoin Cash?",
    answer:
      "Bitcoin (BTC) is the original blockchain network. Bitcoin Cash (BCH) is a fork created in 2017 with larger block sizes intended for faster, cheaper everyday transactions.",
  },
];

function CoinbaseLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <rect width="32" height="32" rx="8" fill="#0052FF"/>
      <path d="M16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26C21.523 26 26 21.523 26 16C26 10.477 21.523 6 16 6ZM16 20.5C13.515 20.5 11.5 18.485 11.5 16C11.5 13.515 13.515 11.5 16 11.5C18.485 11.5 20.5 13.515 20.5 16C20.5 18.485 18.485 20.5 16 20.5Z" fill="white"/>
    </svg>
  );
}

function MobileCarousel({ slides, renderSlide }: { slides: any[]; renderSlide: (s: any, i: number) => React.ReactNode }) {
  const [active, setActive] = useState(0);
  return (
    <div className="lg:hidden">
      <div className="overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-800">
        {renderSlide(slides[active], active)}
      </div>
      <div className="flex gap-2 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all ${
              i === active ? "w-6 bg-black dark:bg-white" : "w-2 bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function DesktopGrid({ slides, renderSlide }: { slides: any[]; renderSlide: (s: any, i: number) => React.ReactNode }) {
  return (
    <div className="hidden lg:grid lg:grid-cols-3 gap-5">
      {slides.map((slide, i) => (
        <div key={i} className="rounded-2xl bg-gray-50 dark:bg-gray-800 overflow-hidden">
          {renderSlide(slide, i)}
        </div>
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
  const cdpOnramp = useCdpOnramp();
  const cdpOfframp = useCdpOfframp();

  const cryptoName = crypto === "BTC" ? "Bitcoin" : crypto;

  const estimatedCrypto = useMemo(() => {
    const prices: Record<string, number> = {
      BTC: 76400, ETH: 2650, SOL: 138, DOGE: 0.165, XRP: 0.52,
      MATIC: 0.72, LTC: 87, USDC: 1, USDT: 1, AVAX: 28,
    };
    const price = prices[crypto] || 1;
    const result = (parseFloat(amount) || 0) / price;
    return result < 0.0001 ? result.toFixed(8) : result < 1 ? result.toFixed(5) : result.toFixed(4);
  }, [amount, crypto]);

  const handleAction = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: `Please sign in to ${mode} crypto.`, variant: "destructive" });
      setLocation("/signin");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    try {
      const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
      const selectedWallet = wallets.find((w) => {
        const sym = crypto.toUpperCase();
        const ws = (w.chainId || "").toUpperCase();
        const wt = (w.walletType || "").toUpperCase();
        if (sym === "BTC") return ws === "BTC" || wt === "BITCOIN";
        if (sym === "ETH") return ws === "ETH" || wt === "ETHEREUM";
        if (sym === "SOL") return ws === "SOL" || wt === "SOLANA";
        if (sym === "TRX") return ws === "TRX" || wt === "TRON";
        return ws.includes(sym) || wt.includes(sym);
      });
      const activeWallet = selectedWallet || wallets.find((w) => String(w.isActive) === "true") || wallets[0];
      const walletAddress =
        activeWallet?.address || (user as any)?.walletAddress || (user as any)?.wallet_address ||
        (user as any)?.user_metadata?.wallet_address || (user as any)?.public_metadata?.wallet_address;

      if (!walletAddress) {
        toast({ title: "Wallet required", description: "Please set up your wallet address in profile settings first.", variant: "destructive" });
        return;
      }

      let data;
      if (mode === "buy") {
        data = await cdpOnramp.mutateAsync({ address: walletAddress, purchaseCurrency: crypto, paymentAmount: amount, paymentCurrency: fiat });
      } else {
        data = await cdpOfframp.mutateAsync({ address: walletAddress, sellCurrency: crypto, sellAmount: amount, fiatCurrency: fiat, paymentMethod: "CARD" });
      }

      const redirectUrl = data.onrampUrl || data.offrampUrl || (data as any).session?.onrampUrl || (data as any).session?.offrampUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else if (data.sessionToken) {
        window.location.href = `${mode === "buy" ? "https://pay.coinbase.com/buy" : "https://pay.coinbase.com/sell"}?sessionToken=${data.sessionToken}`;
      } else {
        throw new Error(`Failed to retrieve ${mode} URL from response`);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const assetsToShow = showAllAssets ? ALL_ASSETS : SUPPORTED_ASSETS;

  const BuyWidget = (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm overflow-hidden">
      {/* Controls row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 gap-3">
        <button className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-black dark:text-white">
          {fiat}
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        </button>

        <button
          onClick={() => setMode(mode === "buy" ? "sell" : "buy")}
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-black dark:text-white"
        >
          <img src={getCryptoIconUrl(crypto)} alt={crypto} className="w-5 h-5 rounded-full object-cover" />
          {mode === "buy" ? "Buy" : "Sell"} {crypto}
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        </button>

        <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Amount display */}
      <div className="px-5 pt-6 pb-3 text-center">
        <div className="flex items-start justify-center gap-0.5">
          <span className="text-xl font-bold text-gray-400 dark:text-gray-500 mt-1.5">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-5xl font-black w-full text-center outline-none bg-transparent leading-tight text-black dark:text-white"
            style={{ minWidth: 0 }}
            placeholder="0"
          />
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2 text-gray-500 dark:text-gray-400 text-sm">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>{estimatedCrypto} {crypto}</span>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2 px-4 pb-4">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            onClick={() => setAmount(q)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold border transition-colors ${
              amount === q
                ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
          >
            ${q === "1000" ? "1,000" : q}
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="px-4 pb-5">
        <Button
          onClick={handleAction}
          disabled={cdpOnramp.isPending || cdpOfframp.isPending || !amount}
          className="w-full h-14 bg-[#B4F22E] hover:bg-[#a2dc28] text-black rounded-2xl text-base font-bold border-none shadow-none"
        >
          {cdpOnramp.isPending || cdpOfframp.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            `Continue with ${cryptoName}`
          )}
        </Button>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">Powered by</span>
          <CoinbaseLogo />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Coinbase</span>
        </div>
      </div>
    </div>
  );

  const slideRenderer = (slides: any[], icon?: boolean) =>
    (slide: any) => (
      <div className="p-6 h-full">
        <div className="w-12 h-12 rounded-xl bg-[#B4F22E] flex items-center justify-center mb-4 text-xl font-black text-black">
          {slide.icon}
        </div>
        <h3 className="text-lg font-black mb-2 text-black dark:text-white">{slide.title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{slide.desc}</p>
      </div>
    );

  const securitySlideRenderer = (slide: any) => (
    <div className="p-6 h-full">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {["PCI-DSS", "ISO 27001", "SOC 2", "AES-256"].map((b) => (
            <span key={b} className="bg-[#B4F22E] text-black text-xs font-bold px-2.5 py-1 rounded-full">{b}</span>
          ))}
        </div>
      </div>
      <h3 className="text-lg font-black mb-2 text-black dark:text-white">{slide.title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{slide.desc}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-black dark:text-white transition-colors">

      {/* ── HERO ── */}
      <section className="px-5 pt-10 pb-0 max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">

          {/* Left: Text */}
          <div className="lg:pt-4">
            <div className="mb-5">
              <img src={getCryptoIconUrl(crypto)} alt={crypto} className="w-14 h-14 rounded-full object-cover shadow" />
            </div>

            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-3">
              Buy {cryptoName},<br className="hidden lg:block" /> join the<br className="lg:hidden" />
              {" "}crypto revolution!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-6 max-w-sm">
              Pexly offers a fast and easy way to buy crypto with a credit or debit card, bank transfer, Apple Pay, Google Pay, and more.
            </p>

            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                4.8 ★ on App Store
              </span>
            </div>

            <button className="w-full lg:w-auto lg:px-10 bg-black dark:bg-white text-white dark:text-black font-bold text-base py-4 rounded-2xl mb-6 hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors">
              Download app
            </button>

            {/* On desktop, show trust badges below the button */}
            <div className="hidden lg:flex items-center gap-6 mt-6">
              {["PCI-DSS", "ISO 27001", "SOC 2"].map((b) => (
                <span key={b} className="text-xs font-bold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full">{b}</span>
              ))}
            </div>
          </div>

          {/* Right: Widget */}
          <div className="mb-8 lg:mb-0">
            {BuyWidget}
          </div>
        </div>
      </section>

      {/* ── HOW TO BUY ── */}
      <section className="px-5 py-16 max-w-6xl mx-auto">
        <div className="lg:flex lg:gap-16 lg:items-start">
          <div className="lg:w-72 flex-shrink-0 mb-6 lg:mb-0">
            <h2 className="text-3xl lg:text-4xl font-black mb-3">How to buy {cryptoName}?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
              Buy crypto in 150+ countries using the local currency of your bank account.
            </p>
          </div>
          <div className="flex-1">
            <MobileCarousel slides={HOW_TO_STEPS} renderSlide={slideRenderer(HOW_TO_STEPS)} />
            <DesktopGrid slides={HOW_TO_STEPS} renderSlide={slideRenderer(HOW_TO_STEPS)} />
          </div>
        </div>
      </section>

      {/* ── WHY PEXLY ── */}
      <section className="px-5 py-16 max-w-6xl mx-auto border-t border-gray-100 dark:border-gray-800">
        <div className="lg:flex lg:gap-16 lg:items-start">
          <div className="lg:w-72 flex-shrink-0 mb-6 lg:mb-0">
            <h2 className="text-3xl lg:text-4xl font-black mb-3">Why is Pexly the best way to buy {cryptoName}?</h2>
          </div>
          <div className="flex-1">
            <MobileCarousel slides={SECURITY_SLIDES} renderSlide={securitySlideRenderer} />
            <DesktopGrid slides={SECURITY_SLIDES} renderSlide={securitySlideRenderer} />
          </div>
        </div>
      </section>

      {/* ── WHAT CAN YOU DO ── */}
      <section className="px-5 py-16 max-w-6xl mx-auto border-t border-gray-100 dark:border-gray-800">
        <div className="lg:flex lg:gap-16 lg:items-start">
          <div className="lg:w-72 flex-shrink-0 mb-6 lg:mb-0">
            <h2 className="text-3xl lg:text-4xl font-black mb-3">What can you do with {cryptoName}?</h2>
          </div>
          <div className="flex-1">
            <MobileCarousel slides={USAGE_SLIDES} renderSlide={slideRenderer(USAGE_SLIDES)} />
            <DesktopGrid slides={USAGE_SLIDES} renderSlide={slideRenderer(USAGE_SLIDES)} />
          </div>
        </div>
      </section>

      {/* ── SUPPORTED ASSETS ── */}
      <section className="px-5 py-16 max-w-6xl mx-auto border-t border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl lg:text-3xl font-black mb-2">
          Buy {cryptoName} and 100+ other cryptocurrencies, including Ethereum, Solana, and more
        </h2>
        <div className="mt-6 lg:grid lg:grid-cols-2 divide-y divide-gray-100 dark:divide-gray-800 lg:divide-y-0 lg:gap-x-10">
          {assetsToShow.map((asset, i) => (
            <Link
              key={asset.symbol}
              href={`/buy-crypto?coin=${asset.symbol}`}
              className={`flex items-center gap-4 py-4 hover:opacity-70 transition-opacity ${
                i > 0 ? "lg:border-t border-gray-100 dark:border-gray-800" : ""
              }`}
            >
              <img src={getCryptoIconUrl(asset.symbol)} alt={asset.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1">
                <span className="font-bold text-base text-black dark:text-white">{asset.name}</span>{" "}
                <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">{asset.symbol}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />
            </Link>
          ))}
        </div>
        <button
          onClick={() => setShowAllAssets(!showAllAssets)}
          className="flex items-center gap-2 mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
        >
          {showAllAssets ? "Show Less" : "Show All Assets"}
          <ChevronDown className={`w-4 h-4 transition-transform ${showAllAssets ? "rotate-180" : ""}`} />
        </button>
      </section>

      {/* ── GET THE APP (dark) ── */}
      <section className="mx-4 lg:mx-auto lg:max-w-6xl my-4 rounded-3xl overflow-hidden bg-black text-white">
        <div className="px-6 lg:px-12 pt-10 pb-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="lg:max-w-lg">
            <h2 className="text-3xl lg:text-4xl font-black leading-tight mb-4">
              Get the Pexly app and buy {cryptoName} on the go
            </h2>
            <p className="text-gray-300 text-base mb-7 lg:mb-0 leading-relaxed">
              Whether you're a seasoned trader or buying crypto for the first time, the Pexly app gives you the tools to get it done.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button className="bg-white text-black font-bold px-8 py-4 rounded-xl text-sm hover:bg-gray-100 transition-colors">
              Get Pexly app
            </button>
          </div>
        </div>
      </section>

      {/* ── WHAT IS BITCOIN ── */}
      <section className="px-5 py-16 max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black mb-4">
              What is {crypto === "BTC" ? "Bitcoin (BTC)" : crypto}?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-4">
              Bitcoin is the original decentralised, peer-to-peer digital currency. It allows anyone to store, send, and receive the network's verifiably scarce currency, BTC, independent of central banks, financial institutions, or middlemen.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
              Institutional adoption of Bitcoin picked up significantly in 2020 with several major financial institutions choosing to buy Bitcoin as a hedge against inflation.
            </p>
          </div>
          <div className="mt-8 lg:mt-0">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">4.8 ★ on App Store</span>
            </div>
            <button
              onClick={handleAction}
              className="w-full bg-black dark:bg-white text-white dark:text-black font-bold text-base py-4 rounded-2xl hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
            >
              Buy {cryptoName}
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-5 py-16 max-w-6xl mx-auto border-t border-gray-100 dark:border-gray-800">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-16">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black mb-6 lg:mb-0">
              Frequently asked questions about buying {cryptoName}
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-0">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b border-gray-100 dark:border-gray-800">
                <AccordionTrigger className="text-base font-semibold hover:no-underline text-left py-5 group">
                  <span className="flex items-center gap-3 text-black dark:text-white">
                    <Plus className="w-5 h-5 flex-shrink-0 group-data-[state=open]:hidden" />
                    <Minus className="w-5 h-5 flex-shrink-0 hidden group-data-[state=open]:block" />
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed pl-8 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── NEED HELP ── */}
      <section className="mx-4 lg:mx-auto lg:max-w-6xl mb-8 rounded-3xl overflow-hidden bg-black text-white">
        <div className="px-6 lg:px-12 py-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="lg:max-w-lg">
            <h2 className="text-2xl lg:text-3xl font-black mb-2">
              Need some help before buying {cryptoName}?
            </h2>
            <p className="text-gray-400 text-sm mb-6 lg:mb-0 leading-relaxed">
              Our support team and academy articles are here to guide you every step of the way.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap flex-shrink-0">
            <Link href="/support">
              <button className="bg-white text-black font-bold px-5 py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                Visit Help Centre
              </button>
            </Link>
            <Link href="/academy">
              <button className="border border-white text-white font-bold px-5 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors">
                Pexly Academy
              </button>
            </Link>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
};

export default BuyCryptoPage;
