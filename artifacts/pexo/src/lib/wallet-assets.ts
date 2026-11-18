import { parseUnits } from "viem";
import type { EvmWalletAsset } from "@/hooks/use-evm-wallet-data";

export type WalletNamespace = "eip155" | "bitcoin" | "solana" | "tron";
export interface WalletAsset extends Omit<EvmWalletAsset, "chainId"> {
  namespace: WalletNamespace;
  networkId: string;
  chainId?: number;
  address?: string;
}
export interface WalletCoin extends Omit<WalletAsset, "networkId" | "namespace"> {
  networks: WalletAsset[];
  partial: boolean;
}

export const extraCoins = [
  { id: "bitcoin:btc", name: "Bitcoin", symbol: "BTC", namespace: "bitcoin", networkId: "bitcoin:mainnet", chainName: "Bitcoin", decimals: 8 },
  { id: "solana:sol", name: "Solana", symbol: "SOL", namespace: "solana", networkId: "solana:mainnet", chainName: "Solana", decimals: 9 },
  { id: "tron:trx", name: "TRON", symbol: "TRX", namespace: "tron", networkId: "tron:mainnet", chainName: "TRON", decimals: 6 },
] as const;

export function groupWalletCoins(assets: WalletAsset[]): WalletCoin[] {
  const groups = new Map<string, WalletAsset[]>();
  for (const asset of assets) {
    const symbol = asset.symbol.toUpperCase();
    groups.set(symbol, [...(groups.get(symbol) ?? []), asset]);
  }
  const priority = ["USDT", "USDC", "ETH", "BTC", "SOL", "TRX"];
  return [...groups.entries()].map(([symbol, networks]) => {
    const known = networks.filter(asset => asset.balanceStatus === "ready");
    const allKnown = known.length === networks.length;
    const knownValues = known.filter(asset => asset.usdValue != null);
    return {
      ...networks[0], id: symbol, symbol, networks,
      decimals: Math.max(...networks.map(asset => asset.decimals)),
      balance: known.reduce((sum, asset) => sum + asset.balance, 0),
      balanceStatus: known.length ? "ready" as const
        : networks.some(asset => asset.balanceStatus === "loading") ? "loading" as const
        : networks.some(asset => asset.balanceStatus === "error") ? "error" as const : "disconnected" as const,
      usdValue: knownValues.length ? knownValues.reduce((sum, asset) => sum + asset.usdValue!, 0) : null,
      partial: !allKnown || knownValues.length !== known.length,
    };
  }).sort((a, b) => {
    const rank = (symbol: string) => priority.includes(symbol) ? priority.indexOf(symbol) : priority.length;
    return rank(a.symbol) - rank(b.symbol) || a.symbol.localeCompare(b.symbol);
  });
}

export function transferUnits(amount: string, decimals: number): bigint {
  if (!/^\d+(?:\.\d+)?$/.test(amount) || (amount.split(".")[1]?.length ?? 0) > decimals) {
    throw new Error(`Enter a valid amount with at most ${decimals} decimal places.`);
  }
  const units = parseUnits(amount, decimals);
  if (units <= 0n) throw new Error("Enter an amount greater than zero.");
  return units;
}

export function walletExplorer(asset: WalletAsset, value: string, transaction = false): string | undefined {
  const encoded = encodeURIComponent(value);
  if (asset.namespace === "bitcoin") return `https://mempool.space/${transaction ? "tx" : "address"}/${encoded}`;
  if (asset.namespace === "solana") return `https://solscan.io/${transaction ? "tx" : "account"}/${encoded}`;
  if (asset.namespace === "tron") return `https://tronscan.org/#/${transaction ? "transaction" : "address"}/${encoded}`;
  const hosts: Record<number, string> = {
    1: "https://etherscan.io", 10: "https://optimistic.etherscan.io", 56: "https://bscscan.com",
    137: "https://polygonscan.com", 42161: "https://arbiscan.io", 8453: "https://basescan.org", 43114: "https://snowtrace.io",
  };
  const host = asset.chainId ? hosts[asset.chainId] : undefined;
  return host ? `${host}/${transaction ? "tx" : "address"}/${encoded}` : undefined;
}
