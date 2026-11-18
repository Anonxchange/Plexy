import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { TronAdapter } from "@reown/appkit-adapter-tron";
import { TronLinkAdapter } from "@tronweb3/tronwallet-adapter-tronlink";
import {
  mainnet,
  solana,
  tronMainnet,
  type AppKitNetwork,
} from "@reown/appkit/networks";
import { evmNetworks, readOnlyWagmiConfig } from "./wallet-networks";
export { evmNetworks, evmNetworkById, transactionExplorerUrl } from "./wallet-networks";

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID?.trim();

// Non-EVM network metadata must not carry optional Viem EVM action types:
// those may differ between the SDK's network and controller dependencies.
export const solanaWalletNetwork: AppKitNetwork = {
  id: solana.id, name: solana.name, nativeCurrency: solana.nativeCurrency,
  rpcUrls: solana.rpcUrls, blockExplorers: solana.blockExplorers,
  chainNamespace: "solana", caipNetworkId: solana.caipNetworkId,
};
export const tronWalletNetwork: AppKitNetwork = {
  id: tronMainnet.id, name: tronMainnet.name, nativeCurrency: tronMainnet.nativeCurrency,
  rpcUrls: tronMainnet.rpcUrls, blockExplorers: tronMainnet.blockExplorers,
  chainNamespace: "tron", caipNetworkId: tronMainnet.caipNetworkId,
};

export const wagmiAdapter = projectId
  ? new WagmiAdapter({
      networks: [...evmNetworks],
      projectId,
    })
  : null;

if (projectId && wagmiAdapter) {
  createAppKit({
    adapters: [
      wagmiAdapter, new SolanaAdapter(),
      new TronAdapter({ walletAdapters: [new TronLinkAdapter({
        openUrlWhenWalletNotFound: false, checkTimeout: 3000,
      })] }),
    ],
    networks: [...evmNetworks, solanaWalletNetwork, tronWalletNetwork],
    projectId,
    defaultNetwork: mainnet,
    metadata: {
      name: "Pexly",
      description: "Pexly non-custodial wallet",
      url:
        typeof window === "undefined"
          ? "https://pexly.com"
          : window.location.origin,
      icons: [],
    },
    features: {
      analytics: false,
      email: true,
      socials: ["google"],
    },
  });
}

export const isReownConfigured = Boolean(wagmiAdapter);

export const wagmiConfig = wagmiAdapter?.wagmiConfig ?? readOnlyWagmiConfig;
