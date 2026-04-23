/**
 * Stake page – public landing for Pexly liquid-staking & lending products.
 *
 * Browsable without sign-in. The "Stake now" action requires the user to be
 * signed in (because it uses the user's internal non-custodial Pexly wallet
 * derived from their account mnemonic). When a signed-in user opens the
 * dialog, the wallet auto-resolves and the only thing they need to provide
 * is the wallet password (or nothing if it's already unlocked in session).
 */

import { useState, useEffect, useMemo } from "react";
import { useHead } from "@unhead/react";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, ExternalLink, Loader2, ShieldCheck, X, CheckCircle2, AlertCircle } from "lucide-react";

import { PexlyFooter } from "@/components/pexly-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/lib/auth-context";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";
import {
  STAKING_PRODUCTS,
  executeStake,
  formatUnits,
  readErc20Balance,
  type StakingProduct,
  type StakeStepResult,
} from "@/lib/staking";
import { CHAIN_CONFIGS } from "@/lib/evmSigner";

/* -------------------------------------------------------------------------- */
/*                            CHAIN-SPECIFIC SVG ART                          */
/* -------------------------------------------------------------------------- */

/** Shared lime gradient definitions reused across the page. */
function LimeDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-lime`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D9FF66" />
        <stop offset="100%" stopColor="#7DC400" />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#B4F22E" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#B4F22E" stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
  );
}

/** ETH → stETH: rotating Ethereum diamond inside concentric lime rings + orbiting dots. */
function EthArt({ size = 180 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <LimeDefs id="eth" />
      <circle cx="100" cy="100" r="90" fill="url(#eth-glow)" />
      <g style={{ transformOrigin: "100px 100px", animation: "spin 18s linear infinite" }}>
        <circle cx="100" cy="100" r="74" fill="none" stroke="url(#eth-lime)" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="url(#eth-lime)" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx="100" cy="26" r="3" fill="#B4F22E" />
        <circle cx="174" cy="100" r="2" fill="#B4F22E" opacity="0.7" />
      </g>
      <g style={{ transformOrigin: "100px 100px", animation: "spin 28s linear infinite reverse" }}>
        <circle cx="100" cy="100" r="86" fill="none" stroke="#B4F22E" strokeOpacity="0.18" strokeWidth="1" />
        <circle cx="14" cy="100" r="2" fill="#B4F22E" opacity="0.5" />
      </g>
      {/* Ethereum diamond */}
      <g transform="translate(100 100)">
        <polygon points="0,-50 -28,8 0,-8" fill="url(#eth-lime)" opacity="0.95" />
        <polygon points="0,-50 28,8 0,-8" fill="url(#eth-lime)" opacity="0.7" />
        <polygon points="0,55 -28,16 0,0" fill="url(#eth-lime)" opacity="0.8" />
        <polygon points="0,55 28,16 0,0" fill="url(#eth-lime)" opacity="0.5" />
        <polygon points="-28,8 0,28 28,8 0,-8" fill="#0a0a0a" opacity="0.45" />
      </g>
    </svg>
  );
}

/** POL → MaticX: hex-lattice with purple/lime gradient (Polygon palette). */
function PolArt({ size = 180 }: { size?: number }) {
  const hex = (cx: number, cy: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return pts.join(" ");
  };
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="pol-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8247E5" />
          <stop offset="100%" stopColor="#B4F22E" />
        </linearGradient>
        <radialGradient id="pol-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8247E5" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#B4F22E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#pol-glow)" />
      {/* Outer hex lattice */}
      <g style={{ transformOrigin: "100px 100px", animation: "spin 32s linear infinite" }}>
        {[
          [60, 70, 22], [140, 70, 22], [60, 130, 22], [140, 130, 22],
          [100, 50, 22], [100, 150, 22],
        ].map(([cx, cy, r], i) => (
          <polygon key={i} points={hex(cx, cy, r)} fill="none" stroke="url(#pol-grad)" strokeOpacity="0.35" strokeWidth="1.5" />
        ))}
      </g>
      {/* Center hex */}
      <polygon points={hex(100, 100, 38)} fill="url(#pol-grad)" opacity="0.95" />
      <polygon points={hex(100, 100, 30)} fill="#0a0a0a" opacity="0.4" />
      <text x="100" y="106" textAnchor="middle" fill="#B4F22E" fontFamily="ui-sans-serif, system-ui" fontSize="14" fontWeight="800">POL</text>
    </svg>
  );
}

/** BNB → slisBNB: stacked diamond chevrons in BSC gold + lime gradient. */
function BnbArt({ size = 180 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="bnb-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F3BA2F" />
          <stop offset="100%" stopColor="#B4F22E" />
        </linearGradient>
        <radialGradient id="bnb-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F3BA2F" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#B4F22E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#bnb-glow)" />
      {/* BNB chevron pattern */}
      <g style={{ transformOrigin: "100px 100px", animation: "spin 22s linear infinite reverse" }}>
        <rect x="60" y="60" width="80" height="80" rx="12" fill="none" stroke="url(#bnb-grad)" strokeOpacity="0.4" strokeWidth="1.5" transform="rotate(45 100 100)" />
        <rect x="44" y="44" width="112" height="112" rx="14" fill="none" stroke="url(#bnb-grad)" strokeOpacity="0.22" strokeWidth="1" transform="rotate(45 100 100)" />
      </g>
      {/* Center BNB tile */}
      <g transform="translate(100 100) rotate(45)">
        <rect x="-32" y="-32" width="64" height="64" rx="8" fill="url(#bnb-grad)" />
        <rect x="-22" y="-22" width="44" height="44" rx="6" fill="#0a0a0a" opacity="0.45" />
      </g>
      <g transform="translate(100 100)">
        <rect x="-6" y="-22" width="12" height="12" rx="2" fill="#B4F22E" />
        <rect x="-22" y="-6" width="12" height="12" rx="2" fill="#B4F22E" />
        <rect x="10" y="-6" width="12" height="12" rx="2" fill="#B4F22E" />
        <rect x="-6" y="10" width="12" height="12" rx="2" fill="#B4F22E" />
        <rect x="-4" y="-4" width="8" height="8" rx="1" fill="#F3BA2F" />
      </g>
    </svg>
  );
}

/** USDT → aUSDT (Aave): triangular ghost silhouette with USDT coin. */
function AaveArt({ size = 180, chain = "ETH" }: { size?: number; chain?: string }) {
  const accent = chain === "POL" ? "#8247E5" : chain === "ARB" ? "#28A0F0" : "#627EEA";
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={`aave-${chain}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B4F22E" />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
        <radialGradient id={`aave-glow-${chain}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor="#B4F22E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill={`url(#aave-glow-${chain})`} />
      {/* Aave ghost-like triangle */}
      <g style={{ transformOrigin: "100px 100px", animation: "float 6s ease-in-out infinite" }}>
        <path d="M100 30 L160 150 Q100 170 40 150 Z" fill={`url(#aave-${chain})`} opacity="0.9" />
        <path d="M100 30 L160 150 Q100 170 40 150 Z" fill="none" stroke="#B4F22E" strokeOpacity="0.6" strokeWidth="1.2" />
        <circle cx="80" cy="100" r="6" fill="#0a0a0a" />
        <circle cx="120" cy="100" r="6" fill="#0a0a0a" />
        {/* USDT coin */}
        <g transform="translate(100 130)">
          <circle r="18" fill="#0a0a0a" />
          <circle r="16" fill={accent} opacity="0.25" />
          <text y="5" textAnchor="middle" fill="#B4F22E" fontFamily="ui-sans-serif, system-ui" fontSize="14" fontWeight="900">₮</text>
        </g>
      </g>
    </svg>
  );
}

function ProductArt({ product, size }: { product: StakingProduct; size?: number }) {
  if (product.provider === "Lido") return <EthArt size={size} />;
  if (product.provider === "Stader") return <PolArt size={size} />;
  if (product.provider === "Lista DAO") return <BnbArt size={size} />;
  return <AaveArt size={size} chain={product.chainKey} />;
}

/* -------------------------------------------------------------------------- */
/*                            HERO ILLUSTRATION                               */
/* -------------------------------------------------------------------------- */

function HeroVault() {
  // Central vault with four orbiting tokens — one per supported asset.
  return (
    <svg viewBox="0 0 420 320" className="w-full max-w-[460px] h-auto" aria-hidden="true">
      <LimeDefs id="hero" />
      <ellipse cx="210" cy="160" rx="190" ry="120" fill="url(#hero-glow)" />

      {/* Outer rotating orbit */}
      <g style={{ transformOrigin: "210px 160px", animation: "spin 38s linear infinite" }}>
        <ellipse cx="210" cy="160" rx="170" ry="80" fill="none" stroke="#B4F22E" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="3 7" />
        {/* Token chips along the orbit */}
        <g transform="translate(40 160)"><circle r="18" fill="#0a0a0a" stroke="#B4F22E" strokeOpacity="0.7" /><text y="5" textAnchor="middle" fill="#B4F22E" fontSize="11" fontWeight="800">ETH</text></g>
        <g transform="translate(380 160)"><circle r="18" fill="#0a0a0a" stroke="#B4F22E" strokeOpacity="0.7" /><text y="5" textAnchor="middle" fill="#B4F22E" fontSize="11" fontWeight="800">BNB</text></g>
        <g transform="translate(210 80)"><circle r="18" fill="#0a0a0a" stroke="#B4F22E" strokeOpacity="0.7" /><text y="5" textAnchor="middle" fill="#B4F22E" fontSize="11" fontWeight="800">POL</text></g>
        <g transform="translate(210 240)"><circle r="18" fill="#0a0a0a" stroke="#B4F22E" strokeOpacity="0.7" /><text y="5" textAnchor="middle" fill="#B4F22E" fontSize="11" fontWeight="800">USDT</text></g>
      </g>

      {/* Inner counter-rotating orbit */}
      <g style={{ transformOrigin: "210px 160px", animation: "spin 24s linear infinite reverse" }}>
        <ellipse cx="210" cy="160" rx="120" ry="56" fill="none" stroke="#B4F22E" strokeOpacity="0.3" strokeWidth="1" />
      </g>

      {/* Vault */}
      <g transform="translate(210 160)">
        <circle r="60" fill="#0a0a0a" />
        <circle r="60" fill="none" stroke="url(#hero-lime)" strokeWidth="2" />
        <circle r="48" fill="none" stroke="#B4F22E" strokeOpacity="0.35" strokeWidth="1" />
        <g style={{ transformOrigin: "0 0", animation: "spin 12s linear infinite" }}>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <rect key={deg} x="-2" y="-58" width="4" height="14" rx="2" fill="url(#hero-lime)" transform={`rotate(${deg})`} />
          ))}
        </g>
        <text y="6" textAnchor="middle" fill="#B4F22E" fontSize="16" fontWeight="900" fontFamily="ui-sans-serif, system-ui">PEXLY</text>
        <text y="22" textAnchor="middle" fill="#B4F22E" fontSize="9" opacity="0.7">EARN</text>
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                          STATIC APY ESTIMATES                              */
/* -------------------------------------------------------------------------- */
// These are realistic ranges shown as guidance only. Live APY is provider-
// dependent and varies per epoch — we explicitly label them as "Variable".
const FAQS: { q: string; a: string }[] = [
  {
    q: "Is Pexly Earn custodial?",
    a: "No. Every stake is signed locally by your in-app wallet. Pexly never holds your private keys, your seed phrase or the receipt tokens you receive (stETH, MaticX, slisBNB, aUSDT). Funds go directly from your wallet to the protocol contract.",
  },
  {
    q: "Which protocols does Pexly route to?",
    a: "Lido for ETH, Stader for POL (Polygon), Lista DAO for BNB and Aave V3 for USDT on Ethereum, Polygon and Arbitrum. We call the protocols' official contracts directly — no Pexly middleware sits between you and the protocol.",
  },
  {
    q: "Are the APYs guaranteed?",
    a: "No. The APY ranges shown are recent estimates published by each protocol. Real yield is variable and depends on validator performance, network demand and lending utilization. We label them as variable for that reason.",
  },
  {
    q: "What fees does Pexly charge?",
    a: "Pexly charges no fee for staking. You only pay the network gas fee for the on-chain transaction(s) — and Aave's two-step approve + supply requires two transactions on first use.",
  },
  {
    q: "How do I unstake or withdraw?",
    a: "You hold the receipt token (stETH, MaticX, slisBNB, aUSDT) in your Pexly wallet. Lido and Lista let you swap or unstake through their official portals. Aave deposits can be withdrawn at any time directly from app.aave.com using the same wallet address.",
  },
  {
    q: "Why does Aave need two transactions?",
    a: "ERC-20 tokens like USDT require an explicit approval before another contract can move them. The first transaction grants Aave permission for the exact amount; the second supplies the funds. Pexly handles both automatically and shows each step.",
  },
  {
    q: "Do I need to add networks manually?",
    a: "No. Pexly already knows about Ethereum, Polygon, BSC and Arbitrum. Make sure your in-app wallet has a small amount of the chain's native coin (ETH, POL, BNB) to cover gas.",
  },
  {
    q: "Are these contracts audited?",
    a: "Yes. Lido, Stader, Lista DAO and Aave V3 are all multi-audit, blue-chip DeFi protocols with billions in TVL. Smart-contract risk is never zero, so only stake what you are comfortable holding on-chain.",
  },
];

const APY_ESTIMATE: Record<string, string> = {
  "lido-eth": "2.8 – 3.2%",
  "stader-pol": "4.5 – 5.5%",
  "lista-bnb": "1.6 – 2.0%",
  "aave-usdt-eth": "3.0 – 6.0%",
  "aave-usdt-pol": "4.0 – 7.0%",
  "aave-usdt-arb": "3.5 – 6.5%",
};

/* -------------------------------------------------------------------------- */
/*                       LIVE APY (DefiLlama yield API)                       */
/* -------------------------------------------------------------------------- */
/**
 * Maps each product id to the (project, symbol, chain) tuple that DefiLlama
 * uses to identify the pool. We fetch /pools once on mount and match locally
 * — keeps it simple, free, and falls back gracefully to the static estimates.
 */
const LIVE_APY_MATCH: Record<string, { project: string; symbol: string; chain: string }> = {
  "lido-eth":      { project: "lido",      symbol: "STETH",   chain: "Ethereum" },
  "stader-pol":    { project: "stader",    symbol: "MATICX",  chain: "Polygon"  },
  "lista-bnb":     { project: "lista-dao", symbol: "SLISBNB", chain: "Binance"  },
  "aave-usdt-eth": { project: "aave-v3",   symbol: "USDT",    chain: "Ethereum" },
  "aave-usdt-pol": { project: "aave-v3",   symbol: "USDT",    chain: "Polygon"  },
  "aave-usdt-arb": { project: "aave-v3",   symbol: "USDT",    chain: "Arbitrum" },
};

interface LlamaPool {
  project: string;
  symbol: string;
  chain: string;
  apy: number | null;
  apyBase?: number | null;
  tvlUsd?: number;
}

function useLiveApy(): { apy: Record<string, number>; loading: boolean } {
  const [apy, setApy] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://yields.llama.fi/pools");
        const json = await res.json();
        const pools: LlamaPool[] = json?.data || [];
        const out: Record<string, number> = {};

        for (const [productId, match] of Object.entries(LIVE_APY_MATCH)) {
          // Filter then pick the highest-TVL match (most authoritative pool).
          const candidates = pools.filter(
            (p) =>
              p.project === match.project &&
              p.chain === match.chain &&
              p.symbol?.toUpperCase() === match.symbol
          );
          if (!candidates.length) continue;
          candidates.sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0));
          const value = candidates[0].apy ?? candidates[0].apyBase;
          if (typeof value === "number" && isFinite(value)) out[productId] = value;
        }
        if (!cancelled) setApy(out);
      } catch {
        // Silent fail — UI falls back to static estimates.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { apy, loading };
}

/* -------------------------------------------------------------------------- */
/*                       USER POSITIONS (receipt-token balances)              */
/* -------------------------------------------------------------------------- */

interface Position {
  product: StakingProduct;
  /** Receipt-token balance as a human-readable string ("1.2345"). */
  amount: string;
  /** Same value as a number for sort/filter convenience. */
  amountNum: number;
}

function useUserPositions(walletAddress: string | null): {
  positions: Position[];
  loading: boolean;
} {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setPositions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const out: Position[] = [];
      await Promise.all(
        STAKING_PRODUCTS.map(async (product) => {
          try {
            const bal = await readErc20Balance(
              product.chainKey,
              product.receiptTokenAddress,
              walletAddress
            );
            if (bal > 0n) {
              const human = formatUnits(bal, product.receiptDecimals, 6);
              const num = Number(human);
              if (num > 0) out.push({ product, amount: human, amountNum: num });
            }
          } catch {
            // Ignore per-product RPC failures — we just won't show that one.
          }
        })
      );
      if (!cancelled) {
        out.sort((a, b) => b.amountNum - a.amountNum);
        setPositions(out);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  return { positions, loading };
}

/* -------------------------------------------------------------------------- */
/*                              PRODUCT CARD                                  */
/* -------------------------------------------------------------------------- */

function ProductCard({
  product,
  onStake,
  liveApy,
  liveLoading,
}: {
  product: StakingProduct;
  onStake: (p: StakingProduct) => void;
  liveApy?: number;
  liveLoading?: boolean;
}) {
  const fallback = APY_ESTIMATE[product.id] ?? "Variable";
  const apyDisplay =
    typeof liveApy === "number" ? `${liveApy.toFixed(2)}%` : fallback;
  const isLive = typeof liveApy === "number";
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-card p-7 transition-all hover:shadow-[0_24px_60px_-20px_hsl(75_85%_60%/0.35)]">
      {/* Decorative corner glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lime/10 blur-3xl transition-opacity group-hover:bg-lime/20" />

      <div className="relative flex flex-col items-center text-center">
        <ProductArt product={product} size={150} />

        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-lime/30 bg-lime/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-lime">
          <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
          {product.provider}
        </div>

        <h3 className="mt-3 text-xl font-extrabold text-foreground">
          {product.inputSymbol} <ArrowRight className="inline h-4 w-4 text-lime" /> {product.outputSymbol}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{product.chainName} · {product.kind === "lending" ? "Lending" : "Liquid staking"}</p>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.blurb}</p>

        <div className="mt-5 grid w-full grid-cols-2 gap-3">
          <div className="rounded-2xl bg-background/70 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {isLive ? "Live APY" : "Est. APY"}
              </p>
              {isLive && <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />}
            </div>
            {liveLoading && !isLive ? (
              <Skeleton className="mt-1 h-5 w-16" />
            ) : (
              <p className="mt-0.5 text-base font-bold text-lime">{apyDisplay}</p>
            )}
          </div>
          <div className="rounded-2xl bg-background/70 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Min stake</p>
            <p className="mt-0.5 text-base font-bold text-foreground">{product.minAmount} {product.inputSymbol}</p>
          </div>
        </div>

        <div className="mt-5 flex w-full gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl text-sm h-10"
            onClick={() => window.open(product.learnMoreUrl, "_blank", "noopener,noreferrer")}
          >
            Learn more <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
          <Button
            className="flex-1 rounded-xl bg-lime text-black hover:bg-lime/90 text-sm font-semibold h-10"
            onClick={() => onStake(product)}
          >
            Stake now
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              STAKE DIALOG                                  */
/* -------------------------------------------------------------------------- */

type DialogStep = "form" | "running" | "done" | "error";

function StakeDialog({
  product,
  open,
  onOpenChange,
}: {
  product: StakingProduct | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user, sessionPassword, setSessionPassword } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<DialogStep>("form");
  const [results, setResults] = useState<StakeStepResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // Reset state whenever the dialog opens for a new product.
  useEffect(() => {
    if (open) {
      setAmount("");
      setPassword("");
      setStep("form");
      setResults([]);
      setError(null);
      setBalance(null);
    }
  }, [open, product?.id]);

  // Resolve the user's EVM wallet address (no decryption needed) so we can
  // show their balance for the input asset.
  useEffect(() => {
    if (!open || !user || !product) return;
    let cancelled = false;
    (async () => {
      try {
        const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
        const evm = wallets.find(
          (w) => w.chainId === "Ethereum" || w.assetType === "ETH" || /eth/i.test(w.chainId || "")
        );
        if (cancelled || !evm) return;
        setWalletAddress(evm.address);
        // Fetch live balance for this product's input asset.
        if (product.inputIsNative) {
          const cfg = CHAIN_CONFIGS[product.chainKey];
          const res = await fetch(cfg.rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [evm.address, "latest"] }),
          });
          const j = await res.json();
          if (!cancelled) setBalance(formatUnits(BigInt(j.result || "0x0"), 18, 6));
        } else if (product.inputTokenAddress) {
          const bal = await readErc20Balance(product.chainKey, product.inputTokenAddress, evm.address);
          if (!cancelled) setBalance(formatUnits(bal, product.inputDecimals, 6));
        }
      } catch (e) {
        // Non-fatal — we just won't show the balance.
        if (!cancelled) setBalance(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user, product]);

  if (!product) return null;

  const needsAuth = !user;
  const needsPassword = !!user && !sessionPassword && step === "form";

  async function handleConfirm() {
    if (!user || !product) return;
    setError(null);

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError("Enter an amount greater than zero");
      return;
    }
    if (amt < product.minAmount) {
      setError(`Minimum stake is ${product.minAmount} ${product.inputSymbol}`);
      return;
    }
    const pwd = sessionPassword || password;
    if (!pwd) {
      setError("Enter your wallet password");
      return;
    }

    setStep("running");
    try {
      const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
      const evm = wallets.find(
        (w) => w.chainId === "Ethereum" || w.assetType === "ETH" || /eth/i.test(w.chainId || "")
      );
      if (!evm) throw new Error("No EVM wallet found on this account");

      const mnemonic = await nonCustodialWalletManager.getWalletMnemonic(evm.id, pwd, user.id);
      if (!mnemonic) throw new Error("Could not unlock wallet — check your password");
      if (!sessionPassword) setSessionPassword(pwd);

      const stepResults: StakeStepResult[] = [];
      await executeStake(mnemonic, product, amount, evm.address, {
        onStep: (s) => {
          stepResults.push(s);
          setResults([...stepResults]);
        },
      });
      setStep("done");
      toast({ title: "Stake submitted", description: `Your ${product.inputSymbol} stake is on its way.` });
    } catch (e: any) {
      setError(e?.message || "Transaction failed");
      setStep("error");
    }
  }

  const headerLabel = step === "done" ? "Stake submitted" : step === "running" ? "Submitting…" : `Stake ${product.inputSymbol}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card">
        {/* Header strip with art */}
        <div className="relative bg-card px-6 pt-6 pb-4">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader className="space-y-0">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <ProductArt product={product} size={72} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">{headerLabel}</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {product.provider} · {product.chainName} · {product.inputSymbol} → {product.outputSymbol}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-4">
          {needsAuth && (
            <div className="space-y-3 rounded-2xl border border-lime/20 bg-lime/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-lime" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Sign in to stake</p>
                  <p className="text-xs text-muted-foreground">
                    Pexly stakes from your built-in non-custodial wallet. Sign in or create an
                    account to continue — your keys never leave your device.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/signin" className="flex-1">
                  <Button className="w-full rounded-xl bg-lime text-black hover:bg-lime/90 font-semibold">Sign in</Button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl">Create account</Button>
                </Link>
              </div>
            </div>
          )}

          {!needsAuth && step === "form" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Amount ({product.inputSymbol})</label>
                  <button
                    type="button"
                    onClick={() => balance && setAmount(balance)}
                    className="text-xs font-semibold text-lime hover:underline disabled:opacity-40"
                    disabled={!balance}
                  >
                    Balance: {balance ?? "—"} {product.inputSymbol} · Max
                  </button>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  placeholder={`0.00`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 rounded-xl text-lg font-semibold"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Minimum {product.minAmount} {product.inputSymbol} · Variable APY ≈ {APY_ESTIMATE[product.id]}
                </p>
              </div>

              {needsPassword && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Wallet password</label>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Unlock wallet"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 h-11 rounded-xl"
                  />
                </div>
              )}

              <div className="rounded-2xl border border-border bg-background/60 p-3 text-[11px] text-muted-foreground space-y-1">
                <p>Signs locally with your Pexly key. Network fees apply.</p>
                {product.kind === "lending" && (
                  <p>Aave requires two transactions on first use: <strong>Approve</strong> then <strong>Supply</strong>.</p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{error}</span>
                </div>
              )}

              <Button
                className="w-full rounded-xl bg-lime text-black hover:bg-lime/90 h-12 text-sm font-semibold"
                onClick={handleConfirm}
                disabled={!amount}
              >
                Confirm stake
              </Button>
            </>
          )}

          {step === "running" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-lime/20 bg-lime/5 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-lime" />
                <p className="text-sm text-foreground">
                  Signing & broadcasting on {product.chainName}…
                </p>
              </div>
              {results.map((r) => (
                <div key={r.txHash} className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2.5 text-xs">
                  <span className="text-foreground">{r.label}</span>
                  <a href={r.explorerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lime hover:underline">
                    View <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {step === "done" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-lime/30 bg-lime/10 p-4">
                <CheckCircle2 className="h-5 w-5 text-lime" />
                <p className="text-sm font-semibold text-foreground">All transactions broadcasted.</p>
              </div>
              {results.map((r) => (
                <div key={r.txHash} className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2.5 text-xs">
                  <span className="text-foreground">{r.label}</span>
                  <a href={r.explorerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lime hover:underline">
                    View tx <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              ))}
              <Button className="w-full rounded-xl" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          )}

          {step === "error" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{error}</span>
              </div>
              {results.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Completed steps</p>
                  {results.map((r) => (
                    <div key={r.txHash} className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2.5 text-xs">
                      <span className="text-foreground">{r.label}</span>
                      <a href={r.explorerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lime hover:underline">
                        View <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
              <Button className="w-full rounded-xl" onClick={() => setStep("form")}>Try again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  PAGE                                      */
/* -------------------------------------------------------------------------- */

export default function Stake() {
  useHead({
    title: "Crypto Staking & Earn | Pexly",
    meta: [
      {
        name: "description",
        content: "Stake ETH, BNB, POL or supply USDT to Aave directly from your Pexly wallet. Lido, Stader, Lista DAO and Aave V3 in one place.",
      },
    ],
  });

  const { user } = useAuth();
  const [active, setActive] = useState<StakingProduct | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const { apy: liveApy, loading: liveLoading } = useLiveApy();
  const { positions, loading: positionsLoading } = useUserPositions(evmAddress);

  // Resolve the signed-in user's EVM wallet address (no decryption needed).
  useEffect(() => {
    if (!user) {
      setEvmAddress(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
        const evm = wallets.find(
          (w) => w.chainId === "Ethereum" || w.assetType === "ETH" || /eth/i.test(w.chainId || "")
        );
        if (!cancelled && evm) setEvmAddress(evm.address);
      } catch {
        if (!cancelled) setEvmAddress(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleStake = (p: StakingProduct) => {
    setActive(p);
    setOpenDialog(true);
  };

  const networks = useMemo(() => {
    return Array.from(new Set(STAKING_PRODUCTS.map((p) => p.chainName)));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Local CSS keyframes used by the SVG art. */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>

      <div className="flex-grow w-full">
        {/* ── Hero ── */}
        <section className="relative">
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 pt-4 pb-8 md:grid-cols-2 md:pt-6 md:pb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-foreground">
                Earn on your crypto<br />
                <span className="bg-gradient-to-br from-lime to-lime/60 bg-clip-text text-transparent">
                  the simple way.
                </span>
              </h1>
              <p className="mt-4 max-w-md text-sm md:text-base text-muted-foreground leading-relaxed">
                Pexly routes your stake straight to the source — Lido, Stader, Lista DAO and Aave V3 —
                signed locally by your non-custodial wallet. No bridges, no custodians, no surprises.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  className="rounded-xl bg-lime text-black hover:bg-lime/90 h-11 px-5 text-sm font-semibold"
                  onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Browse products
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-11 px-5 text-sm"
                  onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
                >
                  How it works
                </Button>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <HeroVault />
            </div>
          </div>
        </section>

        {/* ── Your positions (only visible when signed in & has balances) ── */}
        {user && (positionsLoading || positions.length > 0) && (
          <section className="mx-auto max-w-6xl px-4 pt-2 pb-6">
            <div className="rounded-3xl bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm md:text-base font-semibold text-foreground">Your positions</p>
                  <p className="text-xs text-muted-foreground">
                    Receipt tokens currently held in your Pexly wallet.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-lime">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
                  Live
                </span>
              </div>

              {positionsLoading && positions.length === 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {positions.map((p) => (
                    <button
                      key={p.product.id}
                      onClick={() => handleStake(p.product)}
                      className="group flex items-center gap-3 rounded-2xl bg-background/60 p-3 text-left transition-all hover:bg-background hover:translate-y-[-1px]"
                    >
                      <div className="shrink-0">
                        <ProductArt product={p.product} size={44} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {p.amount} <span className="text-muted-foreground">{p.product.outputSymbol}</span>
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {p.product.provider} · {p.product.chainName}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-lime" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Supported networks ── */}
        <section className="mx-auto max-w-6xl px-4 pt-2 pb-4">
          <p className="text-sm md:text-base font-semibold text-foreground mb-3">Supported networks:</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NetworkChip name="Ethereum" icon={<EthereumIcon />} />
            <NetworkChip name="Polygon" icon={<PolygonIcon />} />
            <NetworkChip name="BNB Chain" icon={<BnbIcon />} />
            <NetworkChip name="Arbitrum" icon={<ArbitrumIcon />} />
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section className="mx-auto max-w-6xl px-4 pt-6">
          <div className="grid grid-cols-3 gap-3 rounded-3xl bg-card p-3 sm:gap-4 sm:p-4">
            <Stat label="Products" value={`${STAKING_PRODUCTS.length}`} />
            <div className="border-l border-border" />
            <Stat label="Networks" value={`${networks.length}`} />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            APY ranges shown are recent estimates published by each protocol — actual yield is variable.
          </p>
        </section>

        {/* ── Products ── */}
        <section id="products" className="mx-auto max-w-6xl px-4 pt-12 pb-6">
          <div className="mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Choose a product</h2>
            <p className="mt-1.5 text-sm md:text-base text-muted-foreground">
              Native staking and lending — wired directly to the protocol contracts.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STAKING_PRODUCTS.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onStake={handleStake}
                liveApy={liveApy[p.id]}
                liveLoading={liveLoading}
              />
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="mx-auto max-w-6xl px-4 pt-12 pb-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">How Pexly Earn works</h2>
            <p className="mt-1.5 text-sm md:text-base text-muted-foreground">
              Three steps. Your keys, signed locally, every time.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Step n={1} title="Pick a product" body="Browse Lido, Stader, Lista or Aave. Each card shows the input, output, network and current yield range." svg={<StepPick />} />
            <Step n={2} title="Sign locally" body="Pexly signs the contract call from your in-app wallet. Your seed phrase never leaves the browser." svg={<StepSign />} />
            <Step n={3} title="Earn on-chain" body="Funds flow into the protocol immediately. You hold the receipt token (stETH, slisBNB, aUSDT…) and can redeem any time." svg={<StepEarn />} />
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mx-auto max-w-3xl px-4 pt-8 pb-20">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Frequently asked questions</h2>
            <p className="mt-1.5 text-sm md:text-base text-muted-foreground">
              Everything you need to know before you stake.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2.5">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl bg-card px-4 border-0"
              >
                <AccordionTrigger className="text-left text-sm md:text-base font-semibold text-foreground hover:no-underline py-4">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>

      <PexlyFooter />

      <StakeDialog product={active} open={openDialog} onOpenChange={setOpenDialog} />
    </div>
  );
}

function Stat({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      {loading ? <Skeleton className="mx-auto mt-1 h-7 w-16" /> : <p className="mt-1 text-xl md:text-2xl font-bold text-foreground">{value}</p>}
    </div>
  );
}

function Step({ n, title, body, svg }: { n: number; title: string; body: string; svg: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="shrink-0">{svg}</div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">Step {n}</p>
          <h3 className="mt-1 text-lg font-bold text-foreground">{title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

function StepPick() {
  return (
    <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
      <LimeDefs id="sp" />
      <rect x="6" y="14" width="52" height="32" rx="6" fill="none" stroke="url(#sp-lime)" strokeWidth="1.5" />
      <rect x="14" y="22" width="52" height="32" rx="6" fill="none" stroke="url(#sp-lime)" strokeOpacity="0.6" strokeWidth="1.5" />
      <rect x="22" y="30" width="52" height="32" rx="6" fill="url(#sp-lime)" opacity="0.18" stroke="url(#sp-lime)" strokeWidth="1.5" />
      <circle cx="48" cy="46" r="4" fill="#B4F22E" />
    </svg>
  );
}

function StepSign() {
  return (
    <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
      <LimeDefs id="ss" />
      <path d="M14 56 Q 20 30 34 38 T 60 22" fill="none" stroke="url(#ss-lime)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="60" cy="22" r="3.5" fill="#B4F22E" />
      <rect x="10" y="58" width="60" height="6" rx="3" fill="url(#ss-lime)" opacity="0.4" />
      <rect x="10" y="58" width="34" height="6" rx="3" fill="url(#ss-lime)" />
    </svg>
  );
}

function NetworkChip({ name, icon }: { name: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 transition-all hover:bg-card/70 hover:translate-y-[-2px]">
      <div className="flex h-9 w-9 items-center justify-center">{icon}</div>
      <p className="text-xs font-medium text-foreground">{name}</p>
    </div>
  );
}

function EthereumIcon() {
  return (
    <svg viewBox="0 0 32 32" width={40} height={40} aria-hidden="true">
      <g fill="currentColor" className="text-foreground">
        <polygon points="16,2 16,12 24,16" opacity="0.6" />
        <polygon points="16,2 8,16 16,12" />
        <polygon points="16,21 16,30 24,18" opacity="0.6" />
        <polygon points="16,30 16,21 8,18" />
        <polygon points="16,19 24,16 16,12 8,16" opacity="0.45" />
      </g>
    </svg>
  );
}

function PolygonIcon() {
  return (
    <svg viewBox="0 0 38 32" width={40} height={40} aria-hidden="true">
      <path
        d="M28.5 9.5l-5-2.9c-.6-.3-1.4-.3-2 0l-5 2.9c-.6.3-1 1-1 1.7v5.8l-3.5 2-3.5-2v-4l3.5-2 2.3 1.3v-2.7l-1.3-.7c-.6-.3-1.4-.3-2 0l-5 2.9c-.6.3-1 1-1 1.7v5.8c0 .7.4 1.4 1 1.7l5 2.9c.6.3 1.4.3 2 0l5-2.9c.6-.3 1-1 1-1.7v-5.8l.5-.3 3-1.7 3.5 2v4l-3.5 2-2.3-1.3v2.7l1.3.7c.6.3 1.4.3 2 0l5-2.9c.6-.3 1-1 1-1.7v-5.8c0-.7-.4-1.4-1-1.7z"
        fill="#8247E5"
      />
    </svg>
  );
}

function BnbIcon() {
  return (
    <svg viewBox="0 0 32 32" width={40} height={40} aria-hidden="true">
      <g fill="#F3BA2F">
        <path d="M16 5l3.5 3.5L16 12 12.5 8.5 16 5z" />
        <path d="M22 11l3.5 3.5L22 18l-3.5-3.5L22 11z" />
        <path d="M10 11l3.5 3.5L10 18l-3.5-3.5L10 11z" />
        <path d="M16 17l3.5 3.5L16 24l-3.5-3.5L16 17z" />
        <path d="M16 13.5l2.5 2.5-2.5 2.5-2.5-2.5 2.5-2.5z" />
      </g>
    </svg>
  );
}

function ArbitrumIcon() {
  return (
    <svg viewBox="0 0 32 32" width={40} height={40} aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#28A0F0" />
      <path d="M14.5 9l-5 11h2.5l1.2-2.7h5.6L20 20h2.5l-5-11h-3zm.5 6.7l1-2.3 1 2.3h-2z" fill="#fff" />
      <path d="M22 20l-3-7-1.2 2.7L20 20h2z" fill="#fff" opacity="0.7" />
    </svg>
  );
}

function StepEarn() {
  return (
    <svg viewBox="0 0 80 80" width={80} height={80} aria-hidden="true">
      <LimeDefs id="se" />
      <circle cx="40" cy="40" r="26" fill="url(#se-glow)" />
      <circle cx="40" cy="40" r="20" fill="none" stroke="url(#se-lime)" strokeWidth="2" />
      <text x="40" y="46" textAnchor="middle" fill="#B4F22E" fontSize="20" fontWeight="900" fontFamily="ui-sans-serif, system-ui">%</text>
      <g style={{ transformOrigin: "40px 40px", animation: "spin 14s linear infinite" }}>
        <circle cx="40" cy="14" r="2.5" fill="#B4F22E" />
      </g>
    </svg>
  );
}
