import { useState, useMemo, useRef, useEffect } from "react";
import { useHead } from "@unhead/react";
import {
  ChevronDown,
  Settings,
  ArrowLeftRight,
  Plus,
  Minus,
  Loader2,
  ChevronRight,
  Star,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from '@/lib/icons';
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CoinIcon } from "@/components/trading/CoinIcon";
import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { SiApple, SiVisa, SiMastercard, SiPaypal, SiGooglepay, SiApplepay, SiAmericanexpress, SiSepa, SiBitcoin } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useCdpOnramp } from "@/hooks/use-cdp-onramp";
import { useCdpOfframp } from "@/hooks/use-cdp-offramp";
import { safeExternalRedirect, COINBASE_PAY_ORIGINS } from "@/lib/sanitize";
import { PaymentMethodSelector } from "@/components/buy-crypto/PaymentMethodSelector";
import { useCdpTransactions, type CdpTransaction } from "@/hooks/use-cdp-transactions";
import { useWalletBalances, type Wallet } from "@/hooks/use-wallet-balances";
import { resolveWalletChain } from "@/lib/wallet-chain-monitor";

const QUICK_AMOUNTS = ["100", "250", "500", "1000"];

/**
 * This list intentionally mirrors the asset/network matrix in the CDP edge
 * functions. Keep the ticker sent to CDP canonical: Polygon is shown as MATIC
 * in the selector, while older wallet rows using POL are normalized below.
 */
type SupportedAsset = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  up: boolean;
  network: string;
  networkLabel: string;
};

const FEATURED_ASSETS: SupportedAsset[] = [
  { symbol: "BTC",  name: "Bitcoin",  price: "$76,400", change: "+2.4%", up: true, network: "bitcoin", networkLabel: "Bitcoin" },
  { symbol: "ETH",  name: "Ethereum", price: "$2,650",  change: "+1.8%", up: true, network: "ethereum", networkLabel: "Ethereum" },
  { symbol: "USDC", name: "USD Coin", price: "$1.00",   change: "0.0%",  up: true, network: "ethereum", networkLabel: "Ethereum" },
  { symbol: "SOL",  name: "Solana",   price: "$138",    change: "+5.1%", up: true, network: "solana", networkLabel: "Solana" },
  { symbol: "MATIC", name: "Polygon", price: "$0.72",   change: "+3.3%", up: true, network: "polygon", networkLabel: "Polygon" },
  { symbol: "XRP",  name: "XRP",      price: "$0.52",   change: "+0.9%", up: true, network: "ripple", networkLabel: "XRP Ledger" },
];

const ALL_ASSETS: SupportedAsset[] = [
  ...FEATURED_ASSETS,
  { symbol: "ARB",  name: "Arbitrum",  price: "$0.72", change: "+2.1%", up: true, network: "arbitrum", networkLabel: "Arbitrum One" },
  { symbol: "OP",   name: "Optimism",  price: "$1.64", change: "+3.5%", up: true, network: "optimism", networkLabel: "Optimism" },
  { symbol: "AVAX", name: "Avalanche", price: "$28",   change: "+4.2%", up: true, network: "avalanche-c-chain", networkLabel: "Avalanche C-Chain" },
  { symbol: "USDC", name: "USD Coin", price: "$1.00", change: "0.0%", up: true, network: "base", networkLabel: "Base" },
  { symbol: "USDC", name: "USD Coin", price: "$1.00", change: "0.0%", up: true, network: "solana", networkLabel: "Solana" },
  { symbol: "USDC", name: "USD Coin", price: "$1.00", change: "0.0%", up: true, network: "polygon", networkLabel: "Polygon" },
  { symbol: "USDC", name: "USD Coin", price: "$1.00", change: "0.0%", up: true, network: "arbitrum", networkLabel: "Arbitrum One" },
  { symbol: "USDC", name: "USD Coin", price: "$1.00", change: "0.0%", up: true, network: "optimism", networkLabel: "Optimism" },
  { symbol: "USDT", name: "Tether",   price: "$1.00", change: "0.0%", up: true, network: "ethereum", networkLabel: "Ethereum" },
  { symbol: "USDT", name: "Tether",   price: "$1.00", change: "0.0%", up: true, network: "base", networkLabel: "Base" },
  { symbol: "USDT", name: "Tether",   price: "$1.00", change: "0.0%", up: true, network: "solana", networkLabel: "Solana" },
  { symbol: "USDT", name: "Tether",   price: "$1.00", change: "0.0%", up: true, network: "polygon", networkLabel: "Polygon" },
  { symbol: "USDT", name: "Tether",   price: "$1.00", change: "0.0%", up: true, network: "arbitrum", networkLabel: "Arbitrum One" },
  { symbol: "USDT", name: "Tether",   price: "$1.00", change: "0.0%", up: true, network: "optimism", networkLabel: "Optimism" },
];

const ASSET_ALIASES: Record<string, string> = {
  MATIC: "MATIC",
  POL: "MATIC",
  POLYGON: "MATIC",
};

const SUPPORTED_SYMBOLS = new Set(ALL_ASSETS.map((asset) => asset.symbol));

type UserBuyAsset = SupportedAsset & {
  walletId: string;
  walletAddress: string;
  walletChainId: string;
};

const ONRAMP_NETWORK_BY_CHAIN: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BASE: "base",
  POLYGON: "polygon",
  XRP: "ripple",
  ARBITRUM: "arbitrum",
  OPTIMISM: "optimism",
  AVAX: "avalanche-c-chain",
};

function isAddressForNetwork(address: string | undefined, network: string): boolean {
  if (!address) return false;
  if (network === "bitcoin") {
    return /^(bc1[02-9ac-hj-np-z]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(address);
  }
  if (network === "solana") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  if (network === "ripple") return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function getUserBuyAssets(wallets: Wallet[]): UserBuyAsset[] {
  const seen = new Set<string>();

  return wallets.flatMap((wallet) => {
    // Cached rows are explicitly marked stale by useWalletBalances. They may
    // be shown elsewhere for continuity, but must never become a checkout
    // destination until the live chain read verifies them again.
    if (wallet.is_stale || !wallet.deposit_address) return [];

    const rawSymbol = String(wallet.crypto_symbol ?? "").toUpperCase().trim();
    const resolvedChain = resolveWalletChain(wallet.chain_id);
    const rawAssetSymbol = rawSymbol.split("-")[0];
    const symbol = ASSET_ALIASES[rawAssetSymbol] ?? rawAssetSymbol;
    // For token rows, require the asset symbol to agree with the token
    // encoded in chain_id. This prevents a mismatched row from pairing an
    // address with a different asset/network at checkout.
    if (resolvedChain.isToken && resolvedChain.tokenSymbol !== symbol) return [];
    const network = ONRAMP_NETWORK_BY_CHAIN[resolvedChain.chain];
    if (!network) return [];

    // Keep the provider's supported asset/network matrix authoritative. A
    // wallet row alone must not make an unsupported combination look buyable.
    const supportedAsset = ALL_ASSETS.find(
      (asset) => asset.symbol === symbol && asset.network === network,
    );
    if (!supportedAsset) return [];
    if (!isAddressForNetwork(wallet.deposit_address, network)) return [];

    const identity = `${symbol}:${network}:${wallet.deposit_address.toLowerCase()}`;
    if (seen.has(identity)) return [];
    seen.add(identity);

    return [{
      ...supportedAsset,
      walletId: wallet.id,
      walletAddress: wallet.deposit_address,
      walletChainId: wallet.chain_id,
    }];
  });
}

function AssetSelectorSheet({
  open,
  assets,
  selectedSymbol,
  selectedNetwork,
  onSelect,
  onClose,
}: {
  open: boolean;
  assets: SupportedAsset[];
  selectedSymbol: string;
  selectedNetwork?: string;
  onSelect: (asset: SupportedAsset) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-selector-title"
        className="fixed inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[2rem] border border-border bg-card shadow-2xl sm:static sm:max-h-[min(80vh,680px)] sm:w-full sm:max-w-2xl sm:rounded-[2rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p id="asset-selector-title" className="text-base font-bold text-foreground">Select crypto</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Choose an asset and its supported network.</p>
          </div>
          <button
            type="button"
            aria-label="Close crypto selector"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 sm:p-6">
          {assets.map((asset) => {
            const isSelected = selectedSymbol === asset.symbol
              && (!selectedNetwork || selectedNetwork === asset.network);

            return (
              <button
                key={`${asset.symbol}-${asset.network}`}
                type="button"
                onClick={() => onSelect(asset)}
                className={`rounded-2xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.14)]"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CoinIcon symbol={asset.symbol} className="h-8 w-8 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{asset.name} <span className="text-muted-foreground">({asset.symbol})</span></p>
                    <p className="truncate text-[11px] text-muted-foreground">{asset.networkLabel}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
     desc: "Choose from supported assets. Enter your spend amount in any local currency.",
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
  const containerWidthRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      containerWidthRef.current = entries[0].contentRect.width;
    });
    ro.observe(el);
    containerWidthRef.current = el.offsetWidth;
    return () => ro.disconnect();
  }, []);

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
    const width = containerWidthRef.current || el.offsetWidth;
    const idx = Math.round(el.scrollLeft / width);
    setActiveIdx(idx);
  };

  return (
    <section className="py-10 lg:py-14 max-w-6xl mx-auto px-5">
      {/* Section header */}
      <div className="mb-12 text-center space-y-4">
        <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">How it works</span>
        <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
          Buy {cryptoName} in 3 steps
        </h2>
        <p className="text-muted-foreground text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto">
          The simplest way to own crypto — no hidden fees, no middlemen, no waiting.
        </p>
      </div>

      {/* ── DESKTOP: 3-column grid (matches home HowItWorks) ── */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-12">
        {HOW_TO_STEPS.map((step, i) => (
          <div key={i} className="relative bg-card border-2 border-border rounded-2xl pt-16 pb-10 px-6 text-center hover:border-primary/30 hover:shadow-xl transition-all">
            {/* Watermark step number */}
            <div className="absolute top-4 right-4 text-6xl font-bold text-foreground/5 select-none leading-none">{step.num}</div>
            {/* Floating icon */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="scale-150">{step.svg}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">{step.num}. {step.title}</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">{step.desc}</p>
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
  const [selectedNetwork, setSelectedNetwork] = useState<string>();
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  // Valid onramp payment methods accepted by the edge fn.
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CARD");
  const [showFees, setShowFees] = useState(false);
  const [isOffline, setIsOffline] = useState(() => (
    typeof navigator !== "undefined" ? !navigator.onLine : false
  ));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    const requestedCrypto = params.get("crypto")?.toUpperCase();
    const cryptoParam = requestedCrypto ? (ASSET_ALIASES[requestedCrypto] ?? requestedCrypto) : undefined;
    if (modeParam === "sell" || modeParam === "buy") setMode(modeParam);
    if (cryptoParam && SUPPORTED_SYMBOLS.has(cryptoParam)) setCrypto(cryptoParam);
    // Unsupported query values are deliberately ignored: the visible picker
    // always remains inside the edge-function support matrix.
  }, []);

  const cdpOnramp = useCdpOnramp();
  const cdpOfframp = useCdpOfframp();
  const { data: txHistory = [], isLoading: txLoading } = useCdpTransactions(user?.id);
  const { data: walletRows = [], isFetching: walletBalancesFetching } = useWalletBalances();
  const userBuyAssets = useMemo(() => getUserBuyAssets(walletRows), [walletRows]);

  const selectedUserAsset = user
    ? userBuyAssets.find((asset) => (
      asset.symbol === crypto && (!selectedNetwork || asset.network === selectedNetwork)
    )) ?? (selectedNetwork ? undefined : userBuyAssets.find((asset) => asset.symbol === crypto))
    : undefined;
  const selectedAsset = selectedUserAsset
    ?? ALL_ASSETS.find((asset) => asset.symbol === crypto && (!selectedNetwork || asset.network === selectedNetwork))
    ?? ALL_ASSETS.find((asset) => asset.symbol === crypto)
    ?? FEATURED_ASSETS[0];
  const cryptoName = selectedAsset?.name ?? "crypto";

  useEffect(() => {
    if (!user || userBuyAssets.length === 0) return;
    if (!userBuyAssets.some((asset) => asset.symbol === crypto)) {
      setCrypto(userBuyAssets[0].symbol);
      setSelectedNetwork(userBuyAssets[0].network);
    }
  }, [crypto, user, userBuyAssets]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const estimatedCrypto = useMemo(() => {
    const prices: Record<string, number> = { BTC: 76400, ETH: 2650, SOL: 138, XRP: 0.52, MATIC: 0.72, ARB: 0.72, OP: 1.64, USDC: 1, USDT: 1, AVAX: 28 };
    const result = (parseFloat(amount) || 0) / (prices[crypto] || 1);
    return result < 0.0001 ? result.toFixed(8) : result < 1 ? result.toFixed(5) : result.toFixed(4);
  }, [amount, crypto]);

  const handleAction = async () => {
    if (!user) { setLocation("/signin"); return; }
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    if (isOffline) {
      toast({
        title: "Connection paused",
        description: "Your order details are still here. Reconnect to continue securely.",
      });
      return;
    }
    try {
      const canonicalCrypto = ASSET_ALIASES[crypto] ?? crypto;
      if (!selectedUserAsset) {
        if (walletBalancesFetching) {
          toast({
            title: "Checking your wallet",
            description: "Your verified wallet assets are still loading. Please try again in a moment.",
          });
        } else if (userBuyAssets.length === 0) {
          toast({
            title: "No supported wallet assets",
            description: "Add a supported wallet asset before starting checkout.",
            variant: "destructive",
          });
        } else {
          setCrypto(userBuyAssets[0].symbol);
          setSelectedNetwork(userBuyAssets[0].network);
          toast({
            title: "Asset updated",
            description: `Checkout switched to ${userBuyAssets[0].symbol}, the first supported asset in your wallet.`,
          });
        }
        return;
      }

      const addr = selectedUserAsset.walletAddress;
      if (!isAddressForNetwork(addr, selectedUserAsset.network)) {
        toast({
          title: "Wallet verification required",
          description: "The selected wallet address could not be verified for this asset's network.",
          variant: "destructive",
        });
        return;
      }

      let rawUrl: string | null = null;

      if (mode === "buy") {
        const data = await cdpOnramp.mutateAsync({
          address: addr,
          purchaseCurrency: canonicalCrypto,
          paymentAmount: amount,
          paymentCurrency: fiat,
          paymentMethod: selectedPaymentMethod,
          network: selectedUserAsset.network,
        });
        rawUrl = data.onrampUrl;
        // Session-token fallback for the Coinbase onramp widget URL.
        if (!rawUrl && data.sessionToken) {
          rawUrl = `https://pay.coinbase.com/buy?sessionToken=${data.sessionToken}`;
        }
      } else {
        const data = await cdpOfframp.mutateAsync({
          address: addr,
          sellCurrency: canonicalCrypto,
          fiatCurrency: fiat,
          network: selectedUserAsset.network,
          // Edge fn accepts: BANK_ACCOUNT | ACH_BANK_ACCOUNT | PAYPAL | FIAT_WALLET
          cashoutMethod: "BANK_ACCOUNT",
        });
        rawUrl = data.offrampUrl;
      }

      const safeUrl = safeExternalRedirect(rawUrl, COINBASE_PAY_ORIGINS);
      if (safeUrl) window.location.href = safeUrl;
      else throw new Error("Failed to get redirect URL");
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const assetsToShow = showAllAssets ? ALL_ASSETS : FEATURED_ASSETS;

  const Widget = (
    /* ── Ramp-style trade card (logged-in + logged-out) ─────────────── */
    <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden w-full">
      {/* Segmented mode switch */}
      <div className="p-3 pb-2">
        <div className="flex rounded-full bg-muted p-1">
          {(["buy", "sell"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-2.5 text-[15px] font-semibold capitalize transition-all ${
                mode === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Logged-in reward strip */}
      {user && (
        <div className="mx-3 mb-3 rounded-3xl border border-border bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-foreground">Save 50% on fees in the app</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                Unlock up to 8 USDC in rewards and 50% off fees on your next 2 trades.
              </p>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-primary fill-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Pay / receive card */}
      <div className="mx-3 rounded-3xl border border-border overflow-hidden">
        {/* Pay row */}
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => toast({ title: "USD checkout", description: "USD is the only fiat currency currently available." })}
            className="flex items-center gap-1.5 bg-background hover:bg-muted border border-border rounded-full px-3 py-2 text-[15px] font-semibold transition-colors text-foreground flex-shrink-0"
          >
            {fiat} <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-sm text-muted-foreground">
              {mode === "buy" ? "Pay with United States Dollar" : "You receive in US Dollar"}
            </p>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-right text-3xl font-black outline-none leading-tight text-foreground caret-primary"
              placeholder="0"
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Receive row */}
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => setShowAssetSelector(true)}
            className="flex items-center gap-1.5 bg-background hover:bg-muted border border-border rounded-full px-3 py-2 text-[15px] font-semibold transition-colors text-foreground flex-shrink-0"
          >
            <CoinIcon symbol={crypto.toUpperCase()} className="w-5 h-5" />
            {crypto}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-sm text-muted-foreground">
              {mode === "buy" ? `Buy ${cryptoName}` : `Sell ${cryptoName}`}
            </p>
            <p className="truncate text-3xl font-black leading-tight text-foreground">{estimatedCrypto}</p>
          </div>
        </div>
      </div>

      {/* Fees + rate */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFees(!showFees)}
            className="flex items-center gap-1.5 text-[15px] font-medium text-foreground"
          >
            Fees included
            <ChevronDown className={`w-4 h-4 transition-transform ${showFees ? "rotate-180" : ""}`} />
          </button>
          <p className="text-[15px] font-medium text-foreground">
            1.00 {crypto} ≈ {selectedAsset?.price ?? "—"}
          </p>
        </div>
        {showFees && (
          <div className="mt-3 space-y-2 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><ArrowLeftRight className="w-3.5 h-3.5" /> Network fee</span>
              <span className="font-semibold text-foreground">Included</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Processing fee</span>
              <span className="font-semibold text-foreground">Included</span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Final fees are confirmed by Coinbase on the checkout screen.
            </p>
          </div>
        )}
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2 px-4 pt-4">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            onClick={() => setAmount(q)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold border transition-all ${
              amount === q
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            ${q === "1000" ? "1k" : q}
          </button>
        ))}
      </div>

      {/* Payment method picker (buy mode only) */}
      {mode === "buy" && (
        <div className="px-4 pt-4">
          <PaymentMethodSelector
            selectedId={selectedPaymentMethod}
            onSelect={setSelectedPaymentMethod}
          />
        </div>
      )}

      {/* CTA */}
      <div className="px-4 pt-4 pb-5 space-y-3">
        <Button
          onClick={handleAction}
          disabled={cdpOnramp.isPending || cdpOfframp.isPending || !amount}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-black rounded-full text-lg font-bold border-none shadow-md shadow-primary/20 transition-all"
        >
          {cdpOnramp.isPending || cdpOfframp.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : user ? (
            "Continue"
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
      <AssetSelectorSheet
        open={showAssetSelector}
        assets={ALL_ASSETS}
        selectedSymbol={crypto}
        selectedNetwork={selectedNetwork}
        onClose={() => setShowAssetSelector(false)}
        onSelect={(asset) => {
          setCrypto(asset.symbol);
          setSelectedNetwork(asset.network);
          setShowAssetSelector(false);
        }}
      />
    </div>
  );

  const loggedInPaymentMethods = [
    { id: "APPLE_PAY", label: "Apple Pay", fee: "Gateway Fee 1.99%", Icon: SiApplepay },
    { id: "CARD", label: "Visa / Mastercard", fee: "Gateway Fee 1.99%", Icon: SiVisa },
    { id: "GOOGLE_PAY", label: "Google Pay", fee: "Gateway Fee 0%", Icon: SiGooglepay },
  ];

  const LoggedInWidget = (
    <div className="w-full text-card-foreground">
      <div className="flex items-center justify-end pb-2">
        <button
          type="button"
          aria-label="Open buy crypto settings"
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => toast({ title: "Checkout settings", description: "Your selected asset and payment preferences are saved on this device." })}
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <div className="pb-4">
        <div className="flex rounded-2xl border border-border bg-muted p-1">
          {(["buy", "sell"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`flex-1 rounded-xl py-3 text-sm font-bold capitalize transition-all ${
                mode === item ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item === "buy" ? "Buy coins" : "Sell coins"}
            </button>
          ))}
        </div>
      </div>

      <div className={`mx-4 mb-4 flex items-center gap-2 rounded-2xl border px-3.5 py-3 text-xs ${
        isOffline
          ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200"
          : "border-primary/25 bg-primary/10 text-foreground"
      }`}>
        <span className={`h-2 w-2 rounded-full ${isOffline ? "bg-amber-500" : "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.65)]"}`} />
        <span>{isOffline ? "Offline — your details are kept locally" : "Secure quote connection active"}</span>
      </div>

      <div className="space-y-3 px-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <label htmlFor="buy-crypto-amount" className="text-xs font-medium text-muted-foreground">Spend</label>
            <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-foreground">USD</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg text-muted-foreground">$</span>
            <input
              id="buy-crypto-amount"
              type="number"
              min="1"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full bg-transparent text-2xl font-black tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
              aria-label="Spend amount in USD"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Receive</span>
            <button
              type="button"
              onClick={() => setShowAssetSelector(true)}
              className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-foreground transition-colors hover:bg-accent"
            >
              <CoinIcon symbol={crypto} className="h-4 w-4" />
              {crypto}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <p className="mt-1 text-2xl font-black tracking-tight text-foreground">{estimatedCrypto}</p>
          <p className="mt-1 text-xs text-muted-foreground">Rate protected until checkout</p>
        </div>

        <div className="space-y-2 pt-1">
           <p className="text-sm font-semibold text-foreground">Selected blockchain</p>
           <div className="rounded-2xl border border-border bg-card px-4 py-3.5 text-base font-semibold text-foreground">
             {selectedAsset?.networkLabel ?? "Waiting for a verified wallet asset"}
           </div>
            {selectedUserAsset ? (
             <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
               <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
               Crypto will be delivered to your verified {selectedAsset?.networkLabel ?? "wallet"} address.
             </p>
          ) : (
             <p className="text-xs text-muted-foreground">
               Add this asset to your verified wallet before checkout.
             </p>
          )}
        </div>

        {mode === "buy" && (
          <div className="space-y-2 pt-1">
            <p className="text-sm font-semibold text-foreground">Payment method</p>
            <div className="grid grid-cols-2 gap-2">
              {loggedInPaymentMethods.map(({ id, label, fee, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedPaymentMethod(id)}
                  className={`relative min-h-[92px] rounded-2xl border p-3 text-left transition-all ${
                    selectedPaymentMethod === id
                      ? "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.14)]"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {selectedPaymentMethod === id && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />}
                  <span className="flex h-8 w-12 items-center justify-center rounded-lg bg-background text-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-2 block text-xs font-bold text-foreground">{label}</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">{fee}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowFees((value) => !value)}
            className="flex w-full items-center justify-between px-1 text-sm text-muted-foreground"
          >
            <span>Summary</span>
            <span className="flex items-center gap-1 text-muted-foreground">Show full summary <ChevronDown className={`h-4 w-4 transition-transform ${showFees ? "rotate-180" : ""}`} /></span>
          </button>
          {showFees && (
            <div className="mt-2 rounded-2xl border border-border bg-card p-4 text-sm">
              <div className="flex items-center justify-between text-muted-foreground"><span>Network fee</span><span className="text-foreground">Included</span></div>
              <div className="mt-2 flex items-center justify-between text-muted-foreground"><span>Gateway fee</span><span className="text-foreground">{selectedPaymentMethod === "GOOGLE_PAY" ? "0%" : "1.99%"}</span></div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-bold text-foreground"><span>Total payable</span><span>${Number(amount || 0).toFixed(2)} USD</span></div>
            </div>
          )}
        </div>

        <Button
          onClick={handleAction}
          disabled={cdpOnramp.isPending || cdpOfframp.isPending || !amount || !selectedUserAsset || isOffline}
          className="h-14 w-full rounded-2xl border-none bg-primary text-base font-black text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
        >
          {cdpOnramp.isPending || cdpOfframp.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create order"}
        </Button>
        <p className="pb-1 text-center text-[11px] text-muted-foreground">Your checkout details stay protected while the quote reconnects.</p>
      </div>
      <AssetSelectorSheet
        open={showAssetSelector}
        assets={ALL_ASSETS}
        selectedSymbol={crypto}
        selectedNetwork={selectedNetwork}
        onClose={() => setShowAssetSelector(false)}
        onSelect={(asset) => {
          setCrypto(asset.symbol);
          setSelectedNetwork(asset.network);
          setShowAssetSelector(false);
        }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      {!user ? (
      <section className="relative overflow-hidden bg-background pt-8 pb-10 px-4 lg:px-8">

        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">

          {/* Main grid: text left, widget right */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

            {/* Left */}
            <div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold leading-[1.1] tracking-tight mb-4 text-foreground">
                Buy {cryptoName},<br />
                <span className="text-primary">join the crypto</span>{" "}revolution!
              </h1>

              <p className="text-muted-foreground text-base lg:text-xl leading-relaxed mb-8 lg:max-w-xl max-w-sm">
                Pexly offers the fastest way to buy crypto with a credit card, bank transfer, Apple Pay, Google Pay, and more — in 140+ countries.
              </p>

              {/* ── NOT LOGGED IN: CTAs ── */}
              {!user && (
                <div className="flex flex-wrap gap-3 mb-8">
                  <Link
                    href="/signup"
                    className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20"
                  >
                    Get started free →
                  </Link>
                  <Link
                    href="/signin"
                    className="bg-muted hover:bg-muted/80 border border-border text-foreground font-bold px-6 py-3 rounded-2xl text-sm transition-all"
                  >
                    Sign in
                  </Link>
                </div>
              )}

              {/* ── LOGGED IN: quick action links ── */}
              {user && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {userBuyAssets.slice(0, 4).map((asset) => {
                    return (
                      <button
                        key={`${asset.symbol}-${asset.network}-${asset.walletId}`}
                        onClick={() => setCrypto(asset.symbol)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          crypto === asset.symbol
                            ? "bg-primary/15 border-primary/30 text-primary"
                            : "bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        }`}
                      >
                        <CoinIcon symbol={asset.symbol.toUpperCase()} className="w-3.5 h-3.5" />
                        {asset.name}
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
            <div className="mt-10 lg:mt-0 lg:sticky lg:top-24 lg:max-w-[480px] lg:ml-auto w-full">
              {Widget}

            </div>
          </div>
        </div>
      </section>
      ) : (
        /* ── LOGGED IN: widget-only view (no hero) ── */
        <section className="relative overflow-hidden bg-background pt-6 pb-10 px-4 lg:px-8">
          <div className="relative mx-auto w-full max-w-2xl">
            <div className="rounded-[2rem] border border-border bg-card p-3 shadow-xl shadow-black/5 sm:p-5">
              {LoggedInWidget}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Protected checkout for signed-in users
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          CONTENT — light/dark background
      ═══════════════════════════════════════ */}

      {/* Marketing sections — hidden for signed-in users (widget-only view) */}
      {!user && (
        <>
      {/* ── PAYMENT METHODS ── */}
      <PaymentMethodsCarousel />

      {/* ── HOW IT WORKS ── */}
      <HowItWorksCarousel cryptoName={cryptoName} />

      {/* ── TRUST / FEATURES ── */}
      <section className="px-5 pb-10 lg:pb-14 max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">Why Pexly</span>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">Built for the next billion</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          {TRUST_FEATURES.map((f, i) => (
            <div key={i} className="flex gap-5 bg-card border border-border rounded-3xl p-6 lg:p-8 hover:border-primary/30 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <span className="scale-[1.4]">{f.svg}</span>
              </div>
              <div>
                <h3 className="font-bold text-xl lg:text-2xl mb-2 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE MARKET / ASSETS ── */}
      <section className="px-5 pb-10 lg:pb-14 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div className="space-y-2">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">Markets</span>
           <h2 className="text-4xl lg:text-5xl font-bold text-foreground">Choose an asset that fits your route</h2>
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
              className={`flex md:grid md:grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 px-5 py-5 hover:bg-muted/50 transition-colors cursor-pointer group ${
                i < assetsToShow.length - 1 ? "border-b border-border" : ""
              }`}
              onClick={() => { setCrypto(asset.symbol); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CoinIcon symbol={asset.symbol.toUpperCase()} className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm lg:text-base text-foreground">{asset.name}</p>
                  <p className="text-muted-foreground text-xs lg:text-sm font-medium">{asset.symbol} · {asset.networkLabel}</p>
                </div>
              </div>
              <p className="font-bold text-sm lg:text-base text-foreground hidden md:block">{asset.price}</p>
              <p className={`font-bold text-sm lg:text-base hidden md:block ${asset.up ? "text-emerald-500" : "text-red-400"}`}>{asset.change}</p>
              <div className="hidden md:block">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setCrypto(asset.symbol);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-sm font-bold bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl transition-colors"
                >
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
          className="relative overflow-hidden rounded-3xl lg:rounded-3xl px-6 lg:px-24 py-12 lg:py-56"
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
              <Link
                href="/signup"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-sm transition-all backdrop-blur-sm"
              >
                Sign up free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-5 pb-10 lg:pb-14 max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-16">
          <div className="mb-8 lg:mb-0">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full mb-4">FAQ</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              Frequently asked<br />questions
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg mt-4 leading-relaxed">
              Everything you need to know about buying crypto on Pexly.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border rounded-2xl px-5 overflow-hidden data-[state=open]:border-primary/30 transition-all"
              >
                <AccordionTrigger className="text-sm lg:text-base font-semibold hover:no-underline text-left py-4 group text-foreground">
                  <span className="flex items-center gap-3">
                    <Plus className="w-4 h-4 flex-shrink-0 text-muted-foreground group-data-[state=open]:hidden" />
                    <Minus className="w-4 h-4 flex-shrink-0 text-primary hidden group-data-[state=open]:block" />
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm lg:text-base leading-relaxed pl-7 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
        </>
      )}

      {/* ══════════════════════════════════════════
          TRANSACTION HISTORY  (logged-in users only)
      ══════════════════════════════════════════ */}
      {user && (
        <section className="px-5 pb-12 max-w-6xl mx-auto">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
              <p className="text-muted-foreground text-sm mt-0.5">Your recent crypto buys and sells via Coinbase</p>
            </div>
            {txHistory.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted border border-border rounded-full px-3 py-1 font-medium">
                {txHistory.length} record{txHistory.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {txLoading ? (
            <div className="flex items-center justify-center py-14 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading transactions…</span>
            </div>
          ) : txHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 py-14 flex flex-col items-center gap-3 text-center">
              <ArrowLeftRight className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm font-medium">No transactions yet</p>
              <p className="text-muted-foreground/60 text-xs max-w-xs">
                Your buy and sell history will appear here once you complete your first transaction.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {txHistory.map((tx, i) => {
                const isBuy = tx.transaction_type === 'onramp';

                const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
                  completed:  { label: 'Completed', color: 'text-green-500',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                  success:    { label: 'Completed', color: 'text-green-500',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                  failed:     { label: 'Failed',    color: 'text-red-500',    icon: <XCircle className="w-3.5 h-3.5" /> },
                  expired:    { label: 'Expired',   color: 'text-red-400',    icon: <XCircle className="w-3.5 h-3.5" /> },
                  pending:    { label: 'Pending',   color: 'text-yellow-500', icon: <Clock className="w-3.5 h-3.5" /> },
                  processing: { label: 'Processing',color: 'text-yellow-500', icon: <Clock className="w-3.5 h-3.5" /> },
                };
                const statusKey = (tx.status ?? '').toLowerCase();
                const statusInfo = statusConfig[statusKey] ?? { label: tx.status ?? 'Unknown', color: 'text-muted-foreground', icon: <Clock className="w-3.5 h-3.5" /> };

                const displayDate = tx.updated_at
                  ? new Date(tx.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—';

                return (
                  <div
                    key={tx.external_id}
                    className={`flex items-center gap-4 px-5 py-4 ${i < txHistory.length - 1 ? 'border-b border-border' : ''} hover:bg-muted/30 transition-colors`}
                  >
                    {/* Direction icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isBuy ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                      {isBuy
                        ? <TrendingUp className="w-4 h-4 text-green-500" />
                        : <TrendingDown className="w-4 h-4 text-blue-400" />}
                    </div>

                    {/* Left: type + date */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {isBuy ? 'Buy' : 'Sell'}{tx.asset ? ` ${tx.asset}` : ''}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{displayDate}</p>
                      {tx.tx_hash && (
                        <p className="text-xs text-muted-foreground/50 font-mono mt-0.5 truncate">
                          {tx.tx_hash.slice(0, 12)}…{tx.tx_hash.slice(-6)}
                        </p>
                      )}
                    </div>

                    {/* Right: amounts */}
                    <div className="text-right flex-shrink-0">
                      {tx.amount && tx.asset && (
                        <p className="text-sm font-bold text-foreground">
                          {tx.amount} {tx.asset}
                        </p>
                      )}
                      {tx.fiat_amount && tx.fiat_currency && (
                        <p className="text-xs text-muted-foreground">
                          {tx.fiat_amount} {tx.fiat_currency}
                        </p>
                      )}
                    </div>

                    {/* External link to explorer (if tx hash available) */}
                    {tx.tx_hash && (
                      <a
                        href={`https://etherscan.io/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground/50 hover:text-primary transition-colors ml-1 flex-shrink-0"
                        title="View on explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── NEED HELP ── */}
      {!user && (
      <section className="px-5 pb-10 lg:pb-14 max-w-6xl mx-auto">
        <div className="relative overflow-hidden bg-card border border-border rounded-3xl px-6 lg:px-12 py-10 lg:py-14">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="mb-6 lg:mb-0">
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3">Need help buying {cryptoName}?</h2>
              <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-md">
                Our support team and academy are here to guide you every step of the way.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap flex-shrink-0">
              <Link
                href="/support"
                className="bg-foreground text-background font-bold px-5 py-3 rounded-2xl text-sm hover:opacity-90 transition-opacity"
              >
                Help Centre
              </Link>
              <Link
                href="/academy"
                className="bg-muted hover:bg-muted/80 border border-border text-foreground font-bold px-5 py-3 rounded-2xl text-sm transition-all"
              >
                Pexly Academy
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}

      <PexlyFooter />
    </div>
  );
};

export default BuyCryptoPage;
