import { getSupabase } from "@/lib/supabase";

export interface WalletMonitorTarget {
  address: string;
  chain: string;
}

/**
 * Resolve the chain identifiers stored in user_wallets to the chain names
 * understood by the monitor-deposits edge function.
 */
export function resolveWalletChain(chainId: string): {
  chain: string;
  isToken: boolean;
  tokenSymbol?: string;
  supported: boolean;
} {
  const id = String(chainId ?? "").trim().toLowerCase();

  if (id.startsWith("usdt-") || id.startsWith("usdc-")) {
    const tokenSymbol = id.startsWith("usdt-") ? "USDT" : "USDC";
    const baseChain = resolveWalletChain(id.replace(/^usdt-|^usdc-/, ""));
    return {
      chain: baseChain.chain,
      isToken: true,
      tokenSymbol,
      supported: baseChain.supported,
    };
  }

  if (
    id.includes("bitcoin") ||
    id.includes("segwit") ||
    id.includes("taproot") ||
    id.includes("bech32") ||
    id === "btc" ||
    id === "p2pkh" ||
    id === "p2sh" ||
    id === "p2wpkh" ||
    id === "p2tr"
  ) {
    return { chain: "BTC", isToken: false, supported: true };
  }

  if (id.includes("xrpl") || id.includes("xrp") || id.includes("ripple")) {
    return { chain: "XRP", isToken: false, supported: true };
  }

  if (id.includes("ethereum") || id.includes("erc-20") || id.includes("erc20") || id === "eth") {
    return { chain: "ETH", isToken: false, supported: true };
  }
  if (id.includes("binance") || id.includes("bep-20") || id.includes("bep20") || id === "bsc" || id === "bnb") {
    return { chain: "BSC", isToken: false, supported: true };
  }
  if (id.includes("solana") || id.includes("spl") || id === "sol") {
    return { chain: "SOL", isToken: false, supported: true };
  }
  if (id.includes("tron") || id.includes("trc-20") || id.includes("trc20") || id === "trx") {
    return { chain: "TRX", isToken: false, supported: true };
  }
  if (id.includes("polygon") || id === "matic" || id === "pol") {
    return { chain: "POLYGON", isToken: false, supported: true };
  }
  if (id.includes("arbitrum") || id === "arb") {
    return { chain: "ARBITRUM", isToken: false, supported: true };
  }
  if (id.includes("optimism") || id === "op") {
    return { chain: "OPTIMISM", isToken: false, supported: true };
  }
  if (id.includes("avalanche") || id === "avax") {
    return { chain: "AVAX", isToken: false, supported: true };
  }
  return { chain: String(chainId ?? "").toUpperCase(), isToken: false, supported: false };
}

/**
 * Return the unique public-address/chain pairs used by both balance and
 * activity reads. No private key or transaction table is involved.
 */
export async function getWalletMonitorTargets(userId: string): Promise<WalletMonitorTarget[]> {
  const client = await getSupabase();
  const { data, error } = await client
    .from("user_wallets")
    .select("address, chain_id, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw new Error(error.message);

  const seen = new Set<string>();
  const targets: WalletMonitorTarget[] = [];

  for (const row of data ?? []) {
    const address = String(row.address ?? "").trim();
    const resolved = resolveWalletChain(String(row.chain_id ?? ""));
    if (!address || !resolved.supported) continue;

    const key = `${address.toLowerCase()}::${resolved.chain}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({ address, chain: resolved.chain });
  }

  return targets;
}