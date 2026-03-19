import { useState, useMemo } from "react";
import { useHead } from "@unhead/react";
import {
  ChevronDown,
  Settings,
  ArrowLeftRight,
  Plus,
  Minus,
  Loader2,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Wallet,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cryptoIconUrls, getCryptoIconUrl } from "@/lib/crypto-icons";
import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import { AppFooter } from "@/components/app-footer";
import { PaymentMethodSelector } from "@/components/buy-crypto/PaymentMethodSelector";
import { CryptoCurrencySelector } from "@/components/crypto-currency-selector";
import { useToast } from "@/hooks/use-toast";
import { useCdpOnramp } from "@/hooks/use-cdp-onramp";
import { useCdpOfframp } from "@/hooks/use-cdp-offramp";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";

const QUICK_AMOUNTS = ["100", "250", "500", "1000"];

const HOW_TO_STEPS = [
  {
    icon: "1",
    title: "1. Open your free account",
    desc: "Buying crypto on Pexly is easy. Just sign up for a free account in seconds from our app, then add a few personal details to verify your identity.",
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
    desc: "We use AES-256 encryption and are PCI-DSS compliant. We also hold the widely-respected ISO 27001 certification. This certification is independently audited and a global standard for managing information security.",
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
    desc: "Store your newly purchased Bitcoin in your preferred wallet. There are many custodial and non-custodial options to choose from, such as Ledger, Trezor, Exodus, and Trust Wallet.",
  },
  {
    icon: "🔄",
    title: "Swap",
    desc: "Exchange one cryptocurrency for another without leaving the app. Swap Bitcoin for Ethereum, Solana, and all of your favourite coins instantly.",
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
      "Bitcoin is the original decentralised, peer-to-peer digital currency. People buy Bitcoin as a long-term store of value, a hedge against inflation, or simply to send money globally without banks or middlemen.",
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

function Carousel({
  slides,
  renderSlide,
}: {
  slides: any[];
  renderSlide: (slide: any, i: number) => React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-[#f5f5f5]">
        {renderSlide(slides[active], active)}
      </div>
      <div className="flex gap-2 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all ${
              i === active ? "w-6 bg-black" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>
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
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [showAllAssets, setShowAllAssets] = useState(false);
  const cdpOnramp = useCdpOnramp();
  const cdpOfframp = useCdpOfframp();

  const estimatedCrypto = useMemo(() => {
    const prices: Record<string, number> = {
      BTC: 76400,
      ETH: 2650,
      SOL: 138,
      DOGE: 0.165,
      XRP: 0.52,
      MATIC: 0.72,
      LTC: 87,
      USDC: 1,
      USDT: 1,
      AVAX: 28,
    };
    const price = prices[crypto] || 1;
    const num = parseFloat(amount) || 0;
    const result = num / price;
    return result < 0.0001
      ? result.toFixed(8)
      : result < 1
      ? result.toFixed(5)
      : result.toFixed(4);
  }, [amount, crypto]);

  const handleAction = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: `Please sign in to ${mode} crypto.`,
        variant: "destructive",
      });
      setLocation("/signin");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }
    try {
      const userId = user.id;
      const wallets =
        await nonCustodialWalletManager.getNonCustodialWallets(userId);
      const selectedWallet = wallets.find((w) => {
        const symbol = crypto.toUpperCase();
        const walletSymbol = (w.chainId || "").toUpperCase();
        const walletType = (w.walletType || "").toUpperCase();
        if (symbol === "BTC")
          return walletSymbol === "BTC" || walletType === "BITCOIN";
        if (symbol === "ETH")
          return walletSymbol === "ETH" || walletType === "ETHEREUM";
        if (symbol === "SOL")
          return walletSymbol === "SOL" || walletType === "SOLANA";
        if (symbol === "TRX")
          return walletSymbol === "TRX" || walletType === "TRON";
        return walletSymbol.includes(symbol) || walletType.includes(symbol);
      });
      const activeWallet =
        selectedWallet ||
        wallets.find((w) => String(w.isActive) === "true") ||
        wallets[0];
      const walletAddress =
        activeWallet?.address ||
        (user as any)?.walletAddress ||
        (user as any)?.wallet_address ||
        (user as any)?.user_metadata?.wallet_address ||
        (user as any)?.public_metadata?.wallet_address;

      if (!walletAddress) {
        toast({
          title: "Wallet required",
          description:
            "Please set up your wallet address in profile settings first.",
          variant: "destructive",
        });
        return;
      }

      let data;
      if (mode === "buy") {
        data = await cdpOnramp.mutateAsync({
          address: walletAddress,
          purchaseCurrency: crypto,
          paymentAmount: amount,
          paymentCurrency: fiat,
        });
      } else {
        data = await cdpOfframp.mutateAsync({
          address: walletAddress,
          sellCurrency: crypto,
          sellAmount: amount,
          fiatCurrency: fiat,
          paymentMethod,
        });
      }

      const redirectUrl =
        data.onrampUrl ||
        data.offrampUrl ||
        (data as any).session?.onrampUrl ||
        (data as any).session?.offrampUrl;

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else if (data.sessionToken) {
        const baseUrl =
          mode === "buy"
            ? "https://pay.coinbase.com/buy"
            : "https://pay.coinbase.com/sell";
        window.location.href = `${baseUrl}?sessionToken=${data.sessionToken}`;
      } else {
        throw new Error(`Failed to retrieve ${mode} URL from response`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const assetsToShow = showAllAssets ? ALL_ASSETS : SUPPORTED_ASSETS;

  return (
    <div className="min-h-screen bg-white text-black">

      {/* ── HERO ── */}
      <section className="px-5 pt-10 pb-0 max-w-lg mx-auto">
        {/* Coin icon */}
        <div className="mb-5">
          <img
            src={getCryptoIconUrl(crypto)}
            alt={crypto}
            className="w-14 h-14 rounded-full object-cover shadow"
          />
        </div>

        <h1 className="text-4xl font-black leading-tight mb-3">
          Buy {crypto === "BTC" ? "Bitcoin" : crypto}, join the<br />
          crypto revolution!
        </h1>
        <p className="text-gray-500 text-base leading-relaxed mb-6">
          Pexly offers a fast and easy way to buy crypto with a credit or debit card, bank transfer, Apple Pay, Google Pay, and more.
        </p>

        {/* App store badge */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">
            4.8 ★ on App Store
          </span>
        </div>

        {/* Download app CTA */}
        <button className="w-full bg-black text-white font-bold text-base py-4 rounded-2xl mb-6 hover:bg-gray-900 transition-colors">
          Download app
        </button>

        {/* ── BUY WIDGET ── */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden mb-8">
          {/* Controls row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 gap-3">
            {/* Fiat selector */}
            <button className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors">
              {fiat}
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {/* Mode toggle + crypto selector */}
            <button
              onClick={() => setMode(mode === "buy" ? "sell" : "buy")}
              className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              <img
                src={getCryptoIconUrl(crypto)}
                alt={crypto}
                className="w-5 h-5 rounded-full object-cover"
              />
              {mode === "buy" ? "Buy" : "Sell"} {crypto}
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {/* Settings */}
            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Amount display */}
          <div className="px-5 pt-6 pb-3 text-center">
            <div className="flex items-start justify-center gap-1">
              <span className="text-3xl font-bold text-gray-400 mt-2">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-7xl font-black w-full text-center outline-none bg-transparent leading-none"
                style={{ minWidth: 0 }}
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-gray-500 text-sm">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>
                {estimatedCrypto} {crypto}
              </span>
              <Loader2 className="w-3 h-3 animate-spin opacity-0" />
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
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
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
                `Continue with ${crypto === "BTC" ? "Bitcoin" : crypto}`
              )}
            </Button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Powered by <span className="font-semibold text-gray-600">Pexly Rails</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW TO BUY ── */}
      <section className="px-5 py-12 max-w-lg mx-auto">
        <h2 className="text-3xl font-black mb-3">How to buy {crypto === "BTC" ? "Bitcoin" : crypto}?</h2>
        <p className="text-gray-500 text-base leading-relaxed mb-6">
          Buy crypto in 150+ countries using the local currency of your bank account. We offer localised payment options that cater to regions all over the world.
        </p>
        <Carousel
          slides={HOW_TO_STEPS}
          renderSlide={(slide) => (
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-[#B4F22E] flex items-center justify-center mb-4">
                <span className="text-black font-black text-xl">{slide.icon}</span>
              </div>
              <h3 className="text-xl font-black mb-3">{slide.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{slide.desc}</p>
            </div>
          )}
        />
      </section>

      {/* ── WHY PEXLY ── */}
      <section className="px-5 py-12 max-w-lg mx-auto border-t border-gray-100">
        <h2 className="text-3xl font-black mb-6">
          Why is Pexly the best way to buy {crypto === "BTC" ? "Bitcoin" : crypto}?
        </h2>
        <Carousel
          slides={SECURITY_SLIDES}
          renderSlide={(slide) => (
            <div className="p-6">
              <div className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100">
                <div className="flex flex-wrap gap-3 mb-1">
                  {["PCI-DSS", "ISO 27001", "SOC 2", "AES-256"].map((badge) => (
                    <span
                      key={badge}
                      className="bg-[#B4F22E] text-black text-xs font-bold px-2.5 py-1 rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="text-lg font-black mb-2">{slide.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{slide.desc}</p>
            </div>
          )}
        />
      </section>

      {/* ── WHAT CAN YOU DO ── */}
      <section className="px-5 py-12 max-w-lg mx-auto border-t border-gray-100">
        <h2 className="text-3xl font-black mb-6">
          What can you do with {crypto === "BTC" ? "Bitcoin" : crypto}?
        </h2>
        <Carousel
          slides={USAGE_SLIDES}
          renderSlide={(slide) => (
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-[#B4F22E] flex items-center justify-center mb-4 text-2xl">
                {slide.icon}
              </div>
              <h3 className="text-xl font-black mb-3">{slide.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{slide.desc}</p>
            </div>
          )}
        />
      </section>

      {/* ── SUPPORTED ASSETS LIST ── */}
      <section className="px-5 py-12 max-w-lg mx-auto border-t border-gray-100">
        <h2 className="text-2xl font-black mb-2">
          Buy {crypto === "BTC" ? "Bitcoin" : crypto} and 100+ other cryptocurrencies, including Ethereum, Solana, and more
        </h2>
        <div className="mt-6 divide-y divide-gray-100">
          {assetsToShow.map((asset) => (
            <Link
              key={asset.symbol}
              href={`/buy-crypto?coin=${asset.symbol}`}
              className="flex items-center gap-4 py-4 hover:opacity-80 transition-opacity"
            >
              <img
                src={getCryptoIconUrl(asset.symbol)}
                alt={asset.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <span className="font-bold text-base">{asset.name}</span>{" "}
                <span className="text-gray-400 text-sm font-medium">
                  {asset.symbol}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          ))}
        </div>
        <button
          onClick={() => setShowAllAssets(!showAllAssets)}
          className="flex items-center gap-2 mt-4 text-sm font-semibold text-gray-700 hover:text-black transition-colors"
        >
          {showAllAssets ? "Show Less" : "Show All Assets"}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showAllAssets ? "rotate-180" : ""}`}
          />
        </button>
      </section>

      {/* ── GET THE APP (dark) ── */}
      <section className="mx-4 my-4 rounded-3xl overflow-hidden bg-black text-white">
        <div className="px-6 pt-10 pb-10">
          <h2 className="text-3xl font-black leading-tight mb-4">
            Get the Pexly app<br />and buy {crypto === "BTC" ? "Bitcoin" : crypto} on the go
          </h2>
          <p className="text-gray-300 text-base mb-7 leading-relaxed">
            Whether you're a seasoned trader or buying crypto for the first time, the Pexly app gives you the tools to get it done.
          </p>
          <button className="bg-white text-black font-bold px-6 py-3.5 rounded-xl text-sm hover:bg-gray-100 transition-colors">
            Get Pexly app
          </button>
        </div>
      </section>

      {/* ── WHAT IS BITCOIN ── */}
      <section className="px-5 py-12 max-w-lg mx-auto">
        <h2 className="text-3xl font-black mb-4">
          What is {crypto === "BTC" ? "Bitcoin (BTC)" : crypto}?
        </h2>
        <p className="text-gray-500 text-base leading-relaxed mb-4">
          Bitcoin is the original decentralised, peer-to-peer digital currency. It allows anyone to store, send, and receive the network's verifiably scarce currency, BTC, independent of central banks, financial institutions, or middlemen.
        </p>
        <p className="text-gray-500 text-base leading-relaxed">
          Institutional adoption of Bitcoin picked up significantly in 2020 with several major financial institutions choosing to buy Bitcoin as a hedge against inflation.
        </p>

        {/* App store badge + buy CTA */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              4.8 ★ on App Store
            </span>
          </div>
          <button
            onClick={handleAction}
            className="w-full bg-black text-white font-bold text-base py-4 rounded-2xl hover:bg-gray-900 transition-colors"
          >
            Buy {crypto === "BTC" ? "Bitcoin" : crypto}
          </button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-5 py-12 max-w-lg mx-auto border-t border-gray-100">
        <h2 className="text-3xl font-black mb-6">
          Frequently asked questions about buying {crypto === "BTC" ? "Bitcoin" : crypto}
        </h2>
        <Accordion type="single" collapsible className="space-y-0">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-b border-gray-100"
            >
              <AccordionTrigger className="text-base font-semibold hover:no-underline text-left py-5 group">
                <span className="flex items-center gap-3 text-black">
                  <Plus className="w-5 h-5 flex-shrink-0 group-data-[state=open]:hidden" />
                  <Minus className="w-5 h-5 flex-shrink-0 hidden group-data-[state=open]:block" />
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-500 text-sm leading-relaxed pl-8 pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── NEED HELP ── */}
      <section className="mx-4 mb-8 rounded-3xl overflow-hidden bg-black text-white">
        <div className="px-6 py-10">
          <h2 className="text-2xl font-black mb-2">
            Need some help before buying {crypto === "BTC" ? "Bitcoin" : crypto}?
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Our support team and academy articles are here to guide you every step of the way.
          </p>
          <div className="flex gap-3 flex-wrap">
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
