import type { CoinInfo } from "@/lib/asterdex-service";

// ── Chain config ──────────────────────────────────────────
export const CHAINS = [
  { key: "BSC", name: "BNB Chain",    chainId: 56,    color: "#F3BA2F" },
  { key: "ETH", name: "Ethereum",      chainId: 1,     color: "#627EEA" },
  { key: "ARB", name: "Arbitrum One", chainId: 42161, color: "#12AAFF" },
  { key: "SOL", name: "Solana",        chainId: 101,   color: "#9945FF" },
] as const;

// All chains that AsterDEX supports for deposit (EVM + Solana)
export const DEPOSIT_CHAINS = ["BSC", "ETH", "ARB", "SOL"] as const;
export type DepositChain = typeof DEPOSIT_CHAINS[number];

export const CHAIN_MAP = Object.fromEntries(CHAINS.map(c => [c.key, c]));

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
  USD1:  "https://assets.coingecko.com/coins/images/31212/small/PYUSD_Logo_%282%29.png",
  ASTER: "https://assets.coingecko.com/coins/images/30980/small/token-logo.png",
};

export const ACCOUNT_TYPES = ["Spot account", "Perpetual account"] as const;
export type AccountType = typeof ACCOUNT_TYPES[number];

// Fallback coin list used when the authenticated coinInfo API is unavailable
export const FALLBACK_COINS: CoinInfo[] = [
  { coin: "USDT", name: "Tether", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "2",      withdrawMin: "10",    depositMin: "10"   },
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "SOL", withdrawEnable: true, depositEnable: true, withdrawFee: "0.2",    withdrawMin: "2",     depositMin: "2"    },
  ]},
  { coin: "USDC", name: "USD Coin", free: "0", locked: "0", networkList: [
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "2",      withdrawMin: "10",    depositMin: "10"   },
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "SOL", withdrawEnable: true, depositEnable: true, withdrawFee: "0.2",    withdrawMin: "2",     depositMin: "2"    },
  ]},
  { coin: "BNB",  name: "BNB", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
  ]},
  { coin: "ETH",  name: "Ethereum", free: "0", locked: "0", networkList: [
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.001",  withdrawMin: "0.01",  depositMin: "0.01" },
  ]},
  { coin: "BTC",  name: "Bitcoin", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.0001", withdrawMin: "0.001", depositMin: "0.001" },
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "0.0001", withdrawMin: "0.001", depositMin: "0.001" },
  ]},
  { coin: "SOL",  name: "Solana", free: "0", locked: "0", networkList: [
    { network: "SOL", withdrawEnable: true, depositEnable: true, withdrawFee: "0.01",   withdrawMin: "0.1",   depositMin: "0.1"  },
  ]},
  { coin: "USD1", name: "USD1", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
    { network: "ETH", withdrawEnable: true, depositEnable: true, withdrawFee: "2",      withdrawMin: "10",    depositMin: "10"   },
  ]},
  { coin: "USDCE", name: "Bridged USDC", free: "0", locked: "0", networkList: [
    { network: "ARB", withdrawEnable: true, depositEnable: true, withdrawFee: "0.5",    withdrawMin: "5",     depositMin: "5"    },
  ]},
  { coin: "ASTER", name: "Aster", free: "0", locked: "0", networkList: [
    { network: "BSC", withdrawEnable: true, depositEnable: true, withdrawFee: "1",      withdrawMin: "10",    depositMin: "10"   },
  ]},
];

export function asterRegKey(userId: string) { return `aster_reg_${userId}`; }

// ── Props ─────────────────────────────────────────────────
export interface AccountModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTab: "deposit" | "withdraw" | "transfer";
  defaultAccountType: AccountType;
  variant?: "sheet" | "dialog";
}
