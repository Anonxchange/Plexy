import { useQuery } from "@tanstack/react-query";
import { walletRowsQueryOptions } from "@/lib/wallet-rows";

export type { WalletRow } from "@/lib/wallet-rows";

/**
 * Shared, deduplicated read of the user's wallet rows (public fields only).
 * Every consumer that calls this with the same userId shares one request and
 * one cache entry. Live balances are a separate query (useWalletBalances).
 */
export function useWalletRows(userId?: string) {
  return useQuery({
    ...walletRowsQueryOptions(userId),
    enabled: !!userId,
  });
}
