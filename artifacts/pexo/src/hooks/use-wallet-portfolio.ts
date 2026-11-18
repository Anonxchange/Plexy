import { useQueries } from "@tanstack/react-query";
import { useCryptoPrices } from "@/lib/crypto-prices";
import { useEvmWallet } from "@/lib/wallet-provider";
import { useExtraWallet } from "@/lib/extra-wallet-context";
import { extraCoins, groupWalletCoins, type WalletAsset } from "@/lib/wallet-assets";
import { useEvmWalletData } from "./use-evm-wallet-data";

export function useWalletPortfolio() {
  const evm = useEvmWalletData();
  const wallet = useEvmWallet();
  const extra = useExtraWallet();
  const prices = useCryptoPrices(["BTC", "SOL", "TRX"]);
  const definitions = extraCoins.map(coin => ({ ...coin, address: extra.addresses[coin.namespace] }));
  const balances = useQueries({ queries: definitions.map(coin => ({
    queryKey: ["wallet", "extra-balance", coin.networkId, coin.address],
    queryFn: ({ signal }: { signal: AbortSignal }) => extra.readBalance(coin as WalletAsset, signal),
    enabled: !!coin.address, refetchInterval: 30_000, retry: 1,
  })) });
  const assets: WalletAsset[] = [
    ...evm.assets.map(asset => ({
      ...asset, namespace: "eip155" as const, networkId: `eip155:${asset.chainId}`,
      address: wallet.isConnected ? wallet.address : undefined,
    })),
    ...definitions.map((coin, index): WalletAsset => {
      const query = balances[index];
      const balanceStatus = !coin.address ? "disconnected" : query.isError ? "error"
        : query.data != null ? "ready" : "loading";
      const balance = balanceStatus === "ready" ? query.data! : 0;
      const usdPrice = prices.data?.[coin.symbol]?.current_price ?? null;
      return {
        ...coin, balance, balanceStatus, usdPrice,
        usdValue: balanceStatus === "ready" && usdPrice != null ? balance * usdPrice : null, isNative: true,
      };
    }),
  ];
  return {
    assets, coins: groupWalletCoins(assets),
    isConnected: wallet.isConnected || Object.values(extra.addresses).some(Boolean),
    totalUsd: assets.reduce((sum, asset) => sum + (asset.usdValue ?? 0), 0),
    isLoading: evm.isLoading || definitions.some((coin, index) => coin.address && balances[index].isLoading),
    error: evm.error || balances.find(query => query.isError)?.error || null,
    refetch: async () => {
      await Promise.all([
        evm.refetch(), prices.refetch(),
        ...balances.filter((_, index) => definitions[index].address).map(query => query.refetch()),
      ]);
    },
  };
}
