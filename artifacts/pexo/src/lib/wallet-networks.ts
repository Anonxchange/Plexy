import { createConfig, http } from "wagmi";
import { arbitrum, avalanche, base, bsc, mainnet, optimism, polygon } from "viem/chains";

// Public metadata and read-only hooks must not import wallet connector SDKs.
export const evmNetworks = [mainnet, polygon, bsc, arbitrum, base, optimism, avalanche] as const;
export const evmNetworkById = new Map<number, { id: number; name: string }>(
  evmNetworks.map(network => [network.id, network]),
);
const explorers = new Map<number, string>([
  [1, "https://etherscan.io"], [10, "https://optimistic.etherscan.io"], [56, "https://bscscan.com"],
  [137, "https://polygonscan.com"], [42161, "https://arbiscan.io"], [8453, "https://basescan.org"],
  [43114, "https://snowtrace.io"],
]);
export function transactionExplorerUrl(chainId: number, hash: string) {
  const host = explorers.get(chainId);
  return host ? `${host}/tx/${hash}` : undefined;
}
export const readOnlyWagmiConfig = createConfig({
  chains: evmNetworks,
  connectors: [],
  // Do not overwrite a real wallet's persisted connection before its SDK loads.
  storage: null,
  transports: {
    [mainnet.id]: http(), [polygon.id]: http(), [bsc.id]: http(), [arbitrum.id]: http(),
    [base.id]: http(), [optimism.id]: http(), [avalanche.id]: http(),
  },
});
