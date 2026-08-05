import type { CoinInfo } from "@/lib/asterdex-service";

// ── Chain config ──────────────────────────────────────────
export const CHAINS = [
  { key: "BSC", name: "BNB Chain",   chainId: 56,    color: "#F3BA2F" },
  { key: "ETH", name: "Ethereum",    chainId: 1,     color: "#627EEA" },
  { key: "ARB", name: "Arbitrum One", chainId: 42161, color: "#12AAFF" },
  { key: "SOL", name: "Solana",      chainId: 101,   color: "#9945FF" },
] as const;

// All chains that AsterDEX supports for deposit (EVM + Solana)
export const DEPOSIT_CHAINS = ["BSC", "ETH", "ARB", "SOL"] as const;
export type DepositChain = typeof DEPOSIT_CHAINS[number];

export const CHAIN_MAP = Object.fromEntries(CHAINS.map((c) => [c.key, c]));

// Real chain logo icons from TrustWallet assets CDN
export const CHAIN_ICONS: Record<string, string> = {
  BSC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png",
  ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  ARB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  SOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
};

// Extra coin icons not in the shared cryptoIconUrls map
export const EXTRA_COIN_ICONS: Record<string, string> = {
  USDCE: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  USD1: "https://assets.coingecko.com/coins/images/31212/small/PYUSD_Logo_%282%29.png",
  ASTER: "https://assets.coingecko.com/coins/images/30980/small/token-logo.png",
  ARB: "https://assets.coingecko.com/coins/images/16547/small/arb.jpg",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
};

export const ACCOUNT_TYPES = ["Spot account", "Perpetual account"] as const;
export type AccountType = typeof ACCOUNT_TYPES[number];

// ── Chain → supported assets ──────────────────────────────
// Per chain: the two stables + that chain's own token.
export const CHAIN_COINS: Record<DepositChain, string[]> = {
  BSC: ["USDT", "USDC", "BNB"],
  ETH: ["USDT", "USDC", "ETH"],
  ARB: ["USDT", "USDC", "ARB"],
  SOL: ["USDT", "USDC", "SOL"],
};

const COIN_NAMES: Record<string, string> = {
  USDT: "Tether",
  USDC: "USD Coin",
  BNB: "BNB",
  ETH: "Ethereum",
  ARB: "Arbitrum",
  SOL: "Solana",
};

/**
 * Fees are NOT hardcoded. AsterDEX publishes the live `withdrawFee` /
 * `withdrawMin` / `depositMin` per (coin, network) on the authenticated
 * coinInfo endpoint, and they change. Anything below is a shape-only
 * placeholder used while that call is in flight or has failed — never a
 * value to charge or display as final.
 */
export const FEE_UNKNOWN = "";

export function isFeeKnown(v: string | undefined | null): v is string {
  return typeof v === "string" && v !== "" && Number.isFinite(Number(v));
}

/** Format a fee for the UI, degrading gracefully when it isn't loaded yet. */
export function formatFee(v: string | undefined | null, coin: string): string {
  return isFeeKnown(v) ? `${v} ${coin}` : "—";
}

// Derived from CHAIN_COINS so the matrix lives in exactly one place.
export const FALLBACK_COINS: CoinInfo[] = Array.from(
  new Set(Object.values(CHAIN_COINS).flat()),
).map((coin) => ({
  coin,
  name: COIN_NAMES[coin] ?? coin,
  free: "0",
  locked: "0",
  networkList: (Object.keys(CHAIN_COINS) as DepositChain[])
    .filter((chain) => CHAIN_COINS[chain].includes(coin))
    .map((network) => ({
      network,
      withdrawEnable: true,
      depositEnable: true,
      withdrawFee: FEE_UNKNOWN,
      withdrawMin: FEE_UNKNOWN,
      depositMin: FEE_UNKNOWN,
    })),
}));

/** Merge live coinInfo over the fallback, keeping only supported pairs. */
export function mergeCoinInfo(live: CoinInfo[] | null | undefined): CoinInfo[] {
  if (!live?.length) return FALLBACK_COINS;
  const supported = new Set(Object.values(CHAIN_COINS).flat());
  return live
    .filter((c) => supported.has(c.coin.toUpperCase()))
    .map((c) => ({
      ...c,
      networkList: (c.networkList ?? []).filter((n) =>
        CHAIN_COINS[n.network as DepositChain]?.includes(c.coin.toUpperCase()),
      ),
    }))
    .filter((c) => c.networkList.length > 0);
}

export function asterRegKey(userId: string) {
  return `aster_reg_${userId}`;
}

// ── Props ─────────────────────────────────────────────────
export interface AccountModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTab: "deposit" | "withdraw" | "transfer";
  defaultAccountType: AccountType;
  variant?: "sheet" | "dialog";
}
