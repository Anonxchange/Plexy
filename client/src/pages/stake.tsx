/**
 * Stake page – public landing for Pexly liquid-staking & lending products.
 *
 * Browsable without sign-in. The "Stake now" action requires the user to be
 * signed in (because it uses the user's internal non-custodial Pexly wallet
 * derived from their account mnemonic). When a signed-in user opens the
 * dialog, the wallet auto-resolves and the only thing they need to provide
 * is the wallet password (or nothing if it's already unlocked in session).
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useHead } from "@unhead/react";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, ExternalLink, Loader2, ShieldCheck, X, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Lock, KeyRound, BellRing, Timer, Building2, Scale, Landmark } from "lucide-react";

import securityPadlockImg from "@assets/IMG_5449.webp";
import iconTrophyImg from "@assets/IMG_5464.webp";
import iconResilientImg from "@assets/IMG_5434.webp";
import iconWalletClickImg from "@assets/IMG_5435.webp";
import iconReinvestImg from "@assets/IMG_5436.webp";
import iconStrategiesImg from "@assets/IMG_5437.webp";
import iconYieldsImg from "@assets/IMG_5438.webp";
import legacyTeamImg from "@/assets/legacy_team_sand.png";
import stakeTopBannerImg from "@/assets/stake_top_banner.png";
import { cryptoIconUrls } from "@/lib/crypto-icons";
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
  const { user, isWalletUnlocked, getSessionPassword, setSessionPassword } = useAuth();
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
  const needsPassword = !!user && !isWalletUnlocked && step === "form";

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
    const pwd = getSessionPassword() || password;
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
      if (!isWalletUnlocked) setSessionPassword(pwd);

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

  // Highest live (or estimated) APY across products — used in hero copy.
  const topApy = useMemo(() => {
    let best = 0;
    for (const p of STAKING_PRODUCTS) {
      const live = liveApy[p.id];
      if (typeof live === "number" && live > best) best = live;
      else {
        const est = APY_ESTIMATE[p.id];
        if (est) {
          const m = est.match(/([\d.]+)\s*%\s*$/);
          if (m && Number(m[1]) > best) best = Number(m[1]);
        }
      }
    }
    return best ? best.toFixed(0) : "7";
  }, [liveApy]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Local CSS keyframes used by the SVG art. */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>

      <div className="flex-grow w-full">
        {/* ── Hero carousel (banner image is now built into the hero card) ── */}
        <section className="mx-auto max-w-6xl px-4 pt-4 md:pt-6">
          <HeroCarousel
            topApy={topApy}
            onBrowse={() => document.getElementById("rates")?.scrollIntoView({ behavior: "smooth" })}
            onLearn={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
          />
        </section>

        {/* ── Your positions (only when signed in & has balances) ── */}
        {user && (positionsLoading || positions.length > 0) && (
          <section className="mx-auto max-w-6xl px-4 pt-6">
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

        {/* ── Our interest rates ── */}
        <section id="rates" className="mx-auto max-w-6xl px-4 pt-10">
          <InterestRatesCard
            onStake={handleStake}
            liveApy={liveApy}
            liveLoading={liveLoading}
          />
        </section>

        {/* ── Yield generation mechanics ── */}
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <YieldMechanicsCard />
        </section>

        {/* ── Trust First. Earn More. (big lime CTA) ── */}
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <TrustCta
            onStart={() => document.getElementById("rates")?.scrollIntoView({ behavior: "smooth" })}
          />
        </section>

        {/* ── Trusted protocols ── */}
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <TrustedProtocols />
        </section>

        {/* ── Security ── */}
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <SecurityCard />
        </section>

        {/* ── How it works / About cards ── */}
        <section id="how" className="mx-auto max-w-6xl px-4 pt-12">
          <h2 className="mb-6 text-3xl md:text-4xl font-bold text-foreground">Why Pexly Earn</h2>
          <HowItWorksRow />
        </section>

        {/* ── Compliance / Legacy ── */}
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <LegacyCard />
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mx-auto max-w-3xl px-4 pt-12 pb-20">
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

/* -------------------------------------------------------------------------- */
/*                              HERO CAROUSEL                                 */
/* -------------------------------------------------------------------------- */

function HeroCarousel({
  topApy,
  onBrowse,
  onLearn,
}: {
  topApy: string;
  onBrowse: () => void;
  onLearn: () => void;
}) {
  const [slide, setSlide] = useState(0);
  const slides = 2;

  // Auto-advance every 7s, pausable on hover.
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % slides), 7000);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="relative overflow-hidden rounded-[28px] bg-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Banner image bleeds into the top of the hero card. A subtle dark
          gradient at the bottom makes the image transition into the card
          background, and a Wise-style white pill overlay floats on the image
          as a credible chip showing live network coverage. */}
      <div className="relative h-32 md:h-44 w-full">
        <img
          src={stakeTopBannerImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card" />

        <div className="absolute left-4 right-4 -bottom-5 md:left-8 md:right-8 md:-bottom-6 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-white text-black shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] pl-2 pr-2 py-1.5 max-w-md w-full">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime/20 text-[11px] font-extrabold text-black">
              4
            </span>
            <span className="text-sm font-semibold flex-1 truncate">
              Live on Ethereum, BNB, Polygon & Arbitrum
            </span>
            <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold text-black whitespace-nowrap">
              Up to {topApy}%
            </span>
          </div>
        </div>
      </div>

      <div className="relative p-6 md:p-10 pt-10 md:pt-12 min-h-[440px] md:min-h-[480px] flex flex-col">
        {slide === 0 ? (
          <div className="flex flex-col h-full">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-foreground">
              Pexly Earn<br />
              is Now <span className="text-lime">Live!</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm md:text-base text-muted-foreground leading-relaxed">
              Transform your crypto journey with Pexly Earn — stake ETH, BNB and POL or supply USDT to
              Aave V3 directly from your non-custodial wallet.
            </p>

            <div className="mt-auto pt-8 space-y-3">
              <Button
                onClick={onBrowse}
                className="rounded-2xl bg-lime text-black hover:bg-lime/90 h-14 px-6 text-base font-bold w-full"
              >
                Start Earning Now
              </Button>
              <Button
                variant="outline"
                onClick={onLearn}
                className="rounded-2xl h-14 px-6 text-base font-semibold w-full"
              >
                How it works
              </Button>

              <div className="pt-3 text-sm text-muted-foreground/80 leading-relaxed">
                <span className="text-foreground font-semibold">{STAKING_PRODUCTS.length} products</span>,
                fully on-chain. Trusted by <PartnerLogo name="Lido" />, <PartnerLogo name="Aave" />, <PartnerLogo name="Stader" />, part of the <PartnerLogo name="Arbitrum" /> ecosystem.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-foreground">
              Earn rewards every day on{" "}
              <TokenChip>ETH</TokenChip>, <TokenChip>BNB</TokenChip> and{" "}
              <TokenChip>USDT</TokenChip> up to{" "}
              <span className="inline-block rounded-md bg-lime px-2 py-0.5 text-black">to {topApy}%</span>{" "}
              per year.
            </h1>
            <p className="mt-5 max-w-xl text-sm md:text-base text-muted-foreground leading-relaxed">
              Yield is paid by the protocol contracts directly to your wallet — accrues block-by-block,
              withdrawable at any time.
            </p>

            <div className="mt-auto pt-8 space-y-3">
              <Button
                onClick={onBrowse}
                className="rounded-2xl bg-lime text-black hover:bg-lime/90 h-14 px-6 text-base font-bold w-full"
              >
                Start Earning Now
              </Button>

              <div className="pt-3 text-sm text-muted-foreground/80 leading-relaxed">
                Routed to <PartnerLogo name="Lido" />, <PartnerLogo name="Aave" />, <PartnerLogo name="Stader" /> and <PartnerLogo name="Lista" /> on{" "}
                <PartnerLogo name="Arbitrum" />, Ethereum, Polygon & BNB.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {Array.from({ length: slides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              slide === i ? "w-6 bg-lime" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
            }`}
          />
        ))}
      </div>
      <button
        onClick={() => setSlide((s) => (s - 1 + slides) % slides)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground hover:bg-background md:block"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => setSlide((s) => (s + 1) % slides)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground hover:bg-background md:block"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function TokenChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md bg-foreground px-2 py-0.5 text-background">
      {children}
    </span>
  );
}

/**
 * Hero "Trusted by" strip — small CoinGecko-hosted partner logos with the
 * brand wordmark next to each one. Renders inline so it sits cleanly at the
 * bottom of the hero card.
 */
const PARTNER_LOGOS: Record<string, { src: string; label: string; tone: string }> = {
  Lido:     { src: "https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png",          label: "Lido",     tone: "text-[#00A3FF]" },
  Aave:     { src: "https://assets.coingecko.com/coins/images/12645/small/AAVE.png",              label: "Aave",     tone: "text-[#B6509E]" },
  Stader:   { src: "https://assets.coingecko.com/coins/images/20658/small/SD_Token_Logo.png",     label: "Stader",   tone: "text-[#07C8A3]" },
  Lista:    { src: "https://assets.coingecko.com/coins/images/35365/small/Lista_logo.png",        label: "Lista",    tone: "text-[#F3BA2F]" },
  Arbitrum: { src: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg", label: "Arbitrum", tone: "text-[#28A0F0]" },
};

function PartnerLogo({ name }: { name: keyof typeof PARTNER_LOGOS }) {
  const p = PARTNER_LOGOS[name];
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <img
        src={p.src}
        alt={p.label}
        loading="lazy"
        className="h-5 w-5 rounded-full object-cover ring-1 ring-border"
      />
      <span className={`font-bold ${p.tone}`}>{p.label}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                          INTEREST RATES CARD                               */
/* -------------------------------------------------------------------------- */

type RateTab = "All" | "Top" | "Stablecoins" | "New";

function InterestRatesCard({
  onStake,
  liveApy,
  liveLoading,
}: {
  onStake: (p: StakingProduct) => void;
  liveApy: Record<string, number>;
  liveLoading: boolean;
}) {
  const [tab, setTab] = useState<RateTab>("Top");

  const filtered = useMemo(() => {
    if (tab === "Stablecoins") return STAKING_PRODUCTS.filter((p) => p.kind === "lending");
    if (tab === "New") return STAKING_PRODUCTS.filter((p) => p.provider === "Lista DAO" || p.provider === "Stader");
    if (tab === "Top") return STAKING_PRODUCTS.filter((p) => p.provider === "Lido" || p.provider === "Aave V3");
    return STAKING_PRODUCTS;
  }, [tab]);

  return (
    <div className="rounded-[28px] bg-card p-6 md:p-10">
      <h2 className="text-3xl md:text-4xl font-bold text-foreground">Our interest rates</h2>

      <p className="mt-5 max-w-3xl text-base md:text-lg leading-relaxed text-muted-foreground">
        Stake your crypto and start earning immediately with{" "}
        <NumBadge n={1} /> diverse strategies, <NumBadge n={2} /> protocol-native APY and{" "}
        <NumBadge n={3} /> fully on-chain transparency.
      </p>

      <div className="mt-8">
        <div className="flex flex-wrap gap-2">
          {(["All", "Top", "Stablecoins", "New"] as RateTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2 text-base font-semibold transition-colors ${
                tab === t
                  ? "bg-lime/15 text-lime"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 divide-y divide-border">
          {filtered.map((p) => {
            const live = liveApy[p.id];
            const fallback = APY_ESTIMATE[p.id] ?? "Variable";
            const apy = typeof live === "number" ? `${live.toFixed(2)}%` : fallback.replace(/^.*?–\s*/, "");
            const isLive = typeof live === "number";
            return (
              <button
                key={p.id}
                onClick={() => onStake(p)}
                className="group flex w-full items-center gap-4 py-5 text-left"
              >
                <div className="shrink-0">
                  <RateLogo product={p} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{p.inputSymbol}</p>
                  <p className="text-sm md:text-base text-muted-foreground truncate">
                    {p.provider} · {p.chainName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {isLive ? "Live" : "Up to"}
                  </p>
                  {liveLoading && !isLive ? (
                    <Skeleton className="ml-auto mt-1 h-7 w-20" />
                  ) : (
                    <p className="text-xl md:text-2xl font-extrabold text-foreground leading-none mt-0.5">
                      {apy}{" "}
                      <span className="text-sm font-semibold text-muted-foreground">APY</span>
                    </p>
                  )}
                </div>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-lime" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NumBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-foreground text-[11px] font-bold text-background align-middle">
      {n}
    </span>
  );
}

/**
 * Real crypto logo tile — uses the project's shared `cryptoIconUrls` map
 * (CoinGecko-hosted PNGs). POL falls back to the legacy MATIC icon since
 * Polygon's rebrand kept the same artwork.
 */
function RateLogo({ product }: { product: StakingProduct }) {
  const sym = product.inputSymbol;
  const lookup = sym === "POL" ? "MATIC" : sym;
  const url = cryptoIconUrls[lookup as keyof typeof cryptoIconUrls];
  return (
    <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl bg-background/80 ring-1 ring-border overflow-hidden">
      {url ? (
        <img src={url} alt={sym} className="h-9 w-9 md:h-10 md:w-10 object-contain" loading="lazy" />
      ) : (
        <span className="text-base font-extrabold text-foreground">{sym}</span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                       YIELD GENERATION MECHANICS                           */
/* -------------------------------------------------------------------------- */

const MECHANICS: { title: string; body: string; apy: string; risk: string; cadence: string }[] = [
  {
    title: "Liquid Staking",
    body: "Your ETH, BNB or POL is delegated to validators through Lido, Stader and Lista DAO. You receive a liquid receipt token (stETH, MaticX, slisBNB) that accrues yield in real time and remains transferable.",
    apy: "Up to 5%",
    risk: "Low risk",
    cadence: "Daily rewards",
  },
  {
    title: "Aave Lending",
    body: "USDT is supplied to Aave V3's lending pool on Ethereum, Polygon or Arbitrum. Yield comes from interest paid by overcollateralised borrowers — you can withdraw at any time.",
    apy: "Up to 7%",
    risk: "Low risk",
    cadence: "Block-by-block",
  },
  {
    title: "Self-custody first",
    body: "Every transaction is signed locally by your in-app wallet. Pexly never holds your seed phrase, your private keys or your receipt tokens — they live in your own wallet from the moment you stake.",
    apy: "Always",
    risk: "Non-custodial",
    cadence: "On-chain",
  },
  {
    title: "Multi-chain routing",
    body: "Pexly already knows about Ethereum, Polygon, BNB Chain and Arbitrum. Pick the network that fits your gas budget and stake without manually adding RPCs or bridging assets.",
    apy: "4 networks",
    risk: "Native gas",
    cadence: "Instant",
  },
];

function YieldMechanicsCard() {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Yield generation mechanics</h2>
          <p className="mt-1.5 max-w-xl text-sm md:text-base text-muted-foreground">
            Your earnings come from real on-chain activity — validator rewards and lending interest paid
            directly by the protocols Pexly connects to.
          </p>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -340, behavior: "smooth" })}
            className="rounded-full bg-card p-2 text-foreground hover:bg-card/70"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 340, behavior: "smooth" })}
            className="rounded-full bg-card p-2 text-foreground hover:bg-card/70"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="mt-6 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {MECHANICS.map((m) => (
          <div
            key={m.title}
            className="snap-start shrink-0 w-[78%] sm:w-[48%] md:w-[32%] rounded-3xl bg-card p-6 flex flex-col"
          >
            <h3 className="text-xl md:text-2xl font-bold text-foreground">{m.title}</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-grow">{m.body}</p>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">APY</p>
              <p className="mt-0.5 text-2xl font-extrabold text-foreground">{m.apy}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                  {m.risk}
                </span>
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                  {m.cadence}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           TRUST CTA & PROTOCOLS                            */
/* -------------------------------------------------------------------------- */

function TrustCta({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-[28px] bg-lime p-7 md:p-10 text-black relative overflow-hidden">
      <ArrowUpRight className="absolute -right-4 -top-4 h-40 w-40 text-black/85" strokeWidth={2.5} />
      <div className="relative max-w-md">
        <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
          Self-custody first. Earn always.
        </h2>
        <p className="mt-3 text-sm md:text-base text-black/70 leading-relaxed">
          Build digital wealth with audited blue-chip protocols. Every stake settles on-chain and you
          stay in control of your keys, end to end.
        </p>
        <Button
          onClick={onStart}
          className="mt-6 rounded-2xl bg-black text-white hover:bg-black/90 h-12 px-6 text-sm font-bold"
        >
          Start earning
        </Button>
      </div>
    </div>
  );
}

const PROTOCOLS: { name: string; cls: string }[] = [
  { name: "Lido",      cls: "text-[#00A3FF]" },
  { name: "Aave V3",   cls: "text-[#B6509E]" },
  { name: "Stader",    cls: "text-[#07C8A3]" },
  { name: "Lista DAO", cls: "text-[#F3BA2F]" },
  { name: "Ethereum",  cls: "text-[#627EEA]" },
  { name: "Polygon",   cls: "text-[#8247E5]" },
  { name: "BNB Chain", cls: "text-[#F3BA2F]" },
  { name: "Arbitrum",  cls: "text-[#28A0F0]" },
];

/**
 * Auto-scrolling brand marquee — replaces the previous static grid. Two
 * copies of the brand row sit side-by-side and translate left forever via the
 * shared `animate-marquee-left` keyframes (defined in index.css). Faded edges
 * give the strip a clean dissolve into the dark card background.
 */
function TrustedProtocols() {
  // Each row is rendered twice so the loop reads as a continuous strip.
  const row = (
    <div className="flex shrink-0 items-center gap-10 md:gap-14 px-6">
      {PROTOCOLS.map((p) => (
        <span
          key={p.name}
          className={`whitespace-nowrap text-xl md:text-2xl font-bold tracking-tight ${p.cls}`}
        >
          {p.name}
        </span>
      ))}
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground">Trusted protocols</h2>
      <p className="mt-1.5 max-w-xl text-sm md:text-base text-muted-foreground">
        Pexly Earn routes to multi-audit, blue-chip DeFi protocols holding billions in TVL — no Pexly
        contract sits between you and the protocol.
      </p>

      <div
        className="relative mt-5 overflow-hidden rounded-3xl bg-card py-7"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%)",
        }}
      >
        <div className="flex w-max animate-marquee-left">
          {row}
          {row}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime/15 text-lime">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Built on contracts you can verify yourself
            </p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Every Pexly Earn transaction calls a public protocol contract on a public chain. You can
              audit each call on Etherscan, Polygonscan, BscScan or Arbiscan from the receipt link
              shown right after you stake.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                SECURITY                                    */
/* -------------------------------------------------------------------------- */

const SECURITY_TABS: { label: string; bullets: { icon: React.ReactNode; title: string; body: string }[] }[] = [
  {
    label: "Account security",
    bullets: [
      { icon: <Lock className="h-4 w-4" />, title: "2FA",           body: "Two-factor authentication confirms each login attempt, withdrawal and other sensitive account action." },
      { icon: <KeyRound className="h-4 w-4" />, title: "Wallet password", body: "Your in-app wallet is encrypted with a password only you know — Pexly cannot decrypt it on your behalf." },
      { icon: <BellRing className="h-4 w-4" />, title: "Security alerts", body: "We email you on every login, reporting browser type and approximate location so suspicious access is obvious." },
      { icon: <Timer className="h-4 w-4" />, title: "Auto logout", body: "Sessions auto-expire after a period of inactivity so an unattended device never stays signed in for long." },
    ],
  },
  {
    label: "Wallet management",
    bullets: [
      { icon: <ShieldCheck className="h-4 w-4" />, title: "Non-custodial keys", body: "Your seed phrase is generated on your device and never leaves it. Pexly servers store an encrypted blob only." },
      { icon: <KeyRound className="h-4 w-4" />, title: "Local signing", body: "Every stake, swap and transfer is signed in the browser. The signed transaction is what reaches the chain — not your key." },
      { icon: <Lock className="h-4 w-4" />, title: "Address book", body: "Whitelist trusted withdrawal addresses so funds can only leave to destinations you have pre-approved." },
      { icon: <BellRing className="h-4 w-4" />, title: "On-chain receipts", body: "Every stake returns a transaction hash with an explorer link, so you can independently verify settlement." },
    ],
  },
];

function SecurityCard() {
  const [tab, setTab] = useState(0);
  const active = SECURITY_TABS[tab];
  return (
    <div className="rounded-[28px] bg-card p-6 md:p-10 relative overflow-hidden">
      <div className="relative">
        <div className="flex justify-center md:justify-start">
          <img
            src={securityPadlockImg}
            alt="Padlock with fingerprint sensor"
            className="h-44 w-44 md:h-56 md:w-56 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
            loading="lazy"
          />
        </div>
        <h2 className="mt-6 text-3xl md:text-4xl font-extrabold leading-tight">
          <span className="text-foreground">Stay safe with Pexly.</span>{" "}
          <span className="text-lime">Protecting your account is our top priority.</span>
        </h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {SECURITY_TABS.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setTab(i)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                i === tab
                  ? "border border-lime text-lime"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ul className="mt-6 space-y-4">
          {active.bullets.map((b) => (
            <li key={b.title} className="flex items-start gap-3 border-b border-border/60 pb-4 last:border-0 last:pb-0">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-lime text-black">
                {b.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{b.title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{b.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             LEGACY / COMPLIANCE                            */
/* -------------------------------------------------------------------------- */

/**
 * "Our Legacy" panel — sand-toned card with three stacked sections plus a
 * sand-tinted illustration framed by lime corner brackets at the bottom.
 * Mirrors the structure of an EarnPark-style trust/credentials section, but
 * with Pexly-true claims (we are non-custodial, not a regulated broker).
 */
function LegacyCard() {
  return (
    <div
      className="rounded-[28px] p-6 md:p-10 text-[#1a1d1c]"
      style={{ background: "#bcc2b8" }}
    >
      <section>
        <h3 className="text-3xl md:text-4xl font-bold leading-tight">Built on years of crypto rails</h3>
        <p className="mt-3 max-w-xl text-sm md:text-base text-[#1a1d1c]/75 leading-relaxed">
          Pexly has been shipping non-custodial wallet, swap and on-chain payment rails since 2021 — the
          same engineering team now wires Pexly Earn directly to the protocols you already trust.
        </p>
      </section>

      <section className="mt-10">
        <h3 className="text-3xl md:text-4xl font-bold leading-tight">Non-custodial by design</h3>
        <p className="mt-3 max-w-xl text-sm md:text-base text-[#1a1d1c]/75 leading-relaxed">
          Pexly is a self-custody wallet — not a broker, not an exchange, not a money transmitter. Your
          funds never sit on a Pexly balance sheet, and every stake settles directly between your wallet
          and the protocol contract.
        </p>
      </section>

      <section className="mt-10">
        <h3 className="text-3xl md:text-4xl font-bold leading-tight">Audited counterparties</h3>
        <p className="mt-3 max-w-xl text-sm md:text-base text-[#1a1d1c]/75 leading-relaxed">
          Each integrated protocol — Lido, Stader, Lista DAO and Aave V3 — is multi-audit, open-source
          and battle-tested with billions of dollars of TVL on public chains. You can verify every
          transaction on the relevant block explorer.
        </p>
      </section>

      {/* Sand-toned illustration with lime corner brackets */}
      <div className="relative mt-10 rounded-2xl p-3">
        <CornerBracket pos="tl" />
        <CornerBracket pos="tr" />
        <CornerBracket pos="bl" />
        <CornerBracket pos="br" />
        <div className="overflow-hidden rounded-xl">
          <img
            src={legacyTeamImg}
            alt="The team behind Pexly Earn"
            loading="lazy"
            className="block w-full h-auto"
            style={{ filter: "saturate(0.55) sepia(0.18) contrast(0.95)" }}
          />
        </div>
      </div>

      <div className="mt-6 space-y-2 text-sm">
        <a
          href="https://etherscan.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="block underline underline-offset-4 hover:text-black"
        >
          Verify Lido stETH on Etherscan
        </a>
        <a
          href="https://app.aave.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="block underline underline-offset-4 hover:text-black"
        >
          Withdraw Aave deposits at app.aave.com
        </a>
        <a
          href="#faq"
          className="inline-flex items-center gap-1 mt-2 font-semibold underline underline-offset-4 hover:text-black"
        >
          Read more <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

/** Lime L-shaped bracket placed at one of the four corners of the photo frame. */
function CornerBracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute h-7 w-7 border-lime";
  const cls =
    pos === "tl" ? `${base} -top-1 -left-1 border-t-[6px] border-l-[6px] rounded-tl-xl` :
    pos === "tr" ? `${base} -top-1 -right-1 border-t-[6px] border-r-[6px] rounded-tr-xl` :
    pos === "bl" ? `${base} -bottom-1 -left-1 border-b-[6px] border-l-[6px] rounded-bl-xl` :
                   `${base} -bottom-1 -right-1 border-b-[6px] border-r-[6px] rounded-br-xl`;
  return <span aria-hidden="true" className={cls} />;
}

/**
 * Stylised "team around a laptop" illustration in sand tones.
 * No real photo — just abstract silhouettes so we never imply we have a team
 * stock photo we don't actually own.
 */
function SandTeamArt() {
  return (
    <svg viewBox="0 0 600 320" className="w-full h-auto block" aria-hidden="true">
      <defs>
        <linearGradient id="sand-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8d4c7" />
          <stop offset="100%" stopColor="#a8a695" />
        </linearGradient>
        <linearGradient id="sand-fig" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c7a6e" />
          <stop offset="100%" stopColor="#4a4942" />
        </linearGradient>
      </defs>
      <rect width="600" height="320" fill="url(#sand-bg)" />
      {/* Sticky-note grid wall */}
      <g opacity="0.35">
        {[60, 110, 160, 210, 260, 310, 360, 410, 460, 510].map((x) => (
          <rect key={x} x={x} y="20" width="34" height="34" rx="3" fill="#9b9787" />
        ))}
        {[60, 110, 160, 210, 260, 310, 360, 410, 460, 510].map((x, i) => (
          <rect key={`b-${x}`} x={x} y="62" width="34" height="34" rx="3" fill={i % 2 ? "#9b9787" : "#86836f"} />
        ))}
      </g>
      {/* Desk */}
      <rect x="0" y="240" width="600" height="80" fill="#6e6c5e" />
      <rect x="0" y="232" width="600" height="12" fill="#888574" />
      {/* Laptop */}
      <g transform="translate(230 200)">
        <rect width="140" height="60" rx="4" fill="#3a3934" />
        <rect x="6" y="6" width="128" height="44" rx="2" fill="#5a5950" />
        <rect x="-6" y="58" width="152" height="6" rx="2" fill="#2c2b27" />
      </g>
      {/* Four silhouettes around the laptop */}
      <g fill="url(#sand-fig)">
        {/* Left figure */}
        <circle cx="80" cy="150" r="28" />
        <path d="M40 260 Q80 195 120 260 Z" />
        {/* Center-left */}
        <circle cx="200" cy="130" r="30" />
        <path d="M150 260 Q200 175 250 260 Z" />
        {/* Center-right */}
        <circle cx="350" cy="120" r="30" />
        <path d="M300 260 Q350 165 400 260 Z" />
        {/* Right figure */}
        <circle cx="500" cy="150" r="28" />
        <path d="M460 260 Q500 195 540 260 Z" />
      </g>
      {/* Subtle lime highlight on screen */}
      <rect x="252" y="218" width="96" height="22" rx="2" fill="#B4F22E" opacity="0.18" />
    </svg>
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

/**
 * Horizontal-scroll row of dark "About" cards inspired by EarnPark's About
 * section. Six tall cards, each with a 3D icon image at top and a big bold
 * title + small subtitle. Pexly-true copy (we don't claim AUM or fund history).
 */
function HowItWorksRow() {
  const cards: { img: string; alt: string; title: string; body: string }[] = [
    { img: iconTrophyImg,     alt: "Trophy",       title: "Proven track record", body: "Every stake settles on-chain — verifiable on Etherscan, BscScan and Arbiscan." },
    { img: iconResilientImg,  alt: "Award ribbon", title: "Resilient by design", body: "Funds sit in audited Lido, Stader, Lista and Aave V3 contracts, not on Pexly's books." },
    { img: iconWalletClickImg,alt: "Wallet",       title: "A few clicks to earn", body: "Pick a product, sign once from your in-app wallet, done. Withdraw whenever you need." },
    { img: iconReinvestImg,   alt: "Reinvest",     title: "Auto-compounding",     body: "Receipt tokens like stETH and aUSDT accrue rewards in real time — no manual claiming." },
    { img: iconYieldsImg,     alt: "Wallet cash",  title: "Yields in crypto",     body: "Earn rewards in the same asset you supplied — ETH, BNB, POL or USDT." },
    { img: iconStrategiesImg, alt: "Magnifier",    title: "Clear strategies",     body: "Each product page explains the mechanics, the receipt token and the risks up front." },
  ];

  return (
    <div className="-mx-4 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-4 snap-x snap-mandatory pb-2">
        {cards.map((c) => (
          <li
            key={c.title}
            className="snap-start shrink-0 w-[260px] md:w-[300px] rounded-3xl bg-card p-6 flex flex-col"
          >
            <div className="flex h-32 md:h-40 items-center justify-center">
              <img
                src={c.img}
                alt={c.alt}
                loading="lazy"
                className="max-h-full w-auto object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.45)]"
              />
            </div>
            <h3 className="mt-6 text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {c.title}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {c.body}
            </p>
          </li>
        ))}
      </ul>
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
