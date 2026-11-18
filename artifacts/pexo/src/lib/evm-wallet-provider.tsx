import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { WagmiProvider, useAccount, useDisconnect, useSendTransaction, useSignMessage, useSwitchChain, useWriteContract } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { isAddress, parseEther, parseUnits, type Address } from "viem";
import {
  evmNetworkById,
  transactionExplorerUrl,
  wagmiConfig,
} from "./reown-config";
import { clearWalletQueryCaches } from "./wallet-query-cache";
import { ExtraWalletRuntime } from "./extra-wallet-provider";
import type { ExtraWalletContextValue } from "./extra-wallet-context";
import type { EvmWalletActivity, EvmWalletContextValue, RuntimeProps, SendNativeInput, SendTokenInput } from "./wallet-provider";
export { wagmiConfig };

function validateTransfer(to: string, amount: string, chainId: number) {
  if (!isAddress(to)) {
    throw new Error("Enter a valid EVM recipient address.");
  }
  if (!Number.isInteger(chainId) || !evmNetworkById.has(chainId)) {
    throw new Error("Choose a supported network.");
  }
  if (!amount.trim() || !/^\d+(\.\d+)?$/.test(amount.trim())) {
    throw new Error("Enter a valid amount.");
  }
}

function WalletBridge({ onChange, onExtraChange }: {
  onChange: (value: EvmWalletContextValue) => void;
  onExtraChange: (value: ExtraWalletContextValue) => void;
}) {
  const [recentActivity, setRecentActivity] = useState<EvmWalletActivity[]>([]);
  const account = useAccount();
  const previousWalletRef = useRef<{
    address?: Address;
    chainId?: number;
    isConnected: boolean;
  }>({ isConnected: false });
  const appKit = useAppKit();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    const previous = previousWalletRef.current;
    const changed =
      previous.address !== account.address ||
      previous.chainId !== account.chainId ||
      previous.isConnected !== account.isConnected;

    if (changed && (previous.isConnected || account.isConnected)) {
      // Wallet identity/network changes invalidate wallet-only state. The
      // Supabase account session is deliberately independent and stays active.
      setRecentActivity([]);
      void clearWalletQueryCaches();
    }

    previousWalletRef.current = {
      address: account.address,
      chainId: account.chainId,
      isConnected: account.isConnected,
    };
  }, [account.address, account.chainId, account.isConnected]);

  const openConnect = useCallback(() => {
    void appKit.open({ view: "Connect", namespace: "eip155" });
  }, [appKit]);

  const openNetworkSwitcher = useCallback(() => {
    void appKit.open({ view: "Networks" });
  }, [appKit]);

  const openAccount = useCallback(() => {
    void appKit.open({ view: "Account" });
  }, [appKit]);

  const disconnect = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const switchNetwork = useCallback(
    async (chainId: number) => {
      if (!evmNetworkById.has(chainId)) {
        throw new Error("Choose a supported network.");
      }
      await switchChainAsync({ chainId });
    },
    [switchChainAsync],
  );

  const ensureNetwork = useCallback(
    async (chainId: number) => {
      if (!account.address) {
        throw new Error("Connect a wallet before sending crypto.");
      }
      if (!evmNetworkById.has(chainId)) {
        throw new Error("Choose a supported network.");
      }
      if (account.chainId !== chainId) {
        await switchChainAsync({ chainId });
      }
    },
    [account.address, account.chainId, switchChainAsync],
  );

  const addRecentActivity = useCallback(
    (input: SendNativeInput, hash: `0x${string}`) => {
      const network = evmNetworkById.get(input.chainId);
      setRecentActivity((current) =>
        [
          {
            hash,
            to: input.to,
            amount: input.amount,
            symbol: input.symbol,
            chainId: input.chainId,
            chainName: network?.name ?? `Chain ${input.chainId}`,
            explorerUrl: transactionExplorerUrl(input.chainId, hash),
            createdAt: new Date().toISOString(),
          },
          ...current,
        ].slice(0, 20),
      );
    },
    [],
  );

  const sendNative = useCallback(
    async ({ to, amount, symbol, chainId }: SendNativeInput) => {
      validateTransfer(to, amount, chainId);
      await ensureNetwork(chainId);
      const value = parseEther(amount.trim());
      if (value <= 0n) {
        throw new Error("Amount must be greater than zero.");
      }
      const hash = await sendTransactionAsync({
        account: account.address,
        to: to as Address,
        value,
        chainId,
      });
      addRecentActivity({ to, amount, symbol, chainId }, hash);
      return hash;
    },
    [account.address, addRecentActivity, ensureNetwork, sendTransactionAsync],
  );

  const sendToken = useCallback(
    async ({ to, amount, symbol, chainId, tokenAddress, decimals }: SendTokenInput) => {
      validateTransfer(to, amount, chainId);
      if (!isAddress(tokenAddress)) {
        throw new Error("The selected token contract is invalid.");
      }
      if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
        throw new Error("The selected token has invalid decimal precision.");
      }
      await ensureNetwork(chainId);
      const value = parseUnits(amount.trim(), decimals);
      if (value <= 0n) {
        throw new Error("Amount must be greater than zero.");
      }
      const hash = await writeContractAsync({
        account: account.address,
        address: tokenAddress as Address,
        abi: [
          {
            type: "function",
            name: "transfer",
            stateMutability: "nonpayable",
            inputs: [
              { name: "to", type: "address" },
              { name: "value", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          },
        ],
        functionName: "transfer",
        args: [to as Address, value],
        chainId,
      });
      addRecentActivity({ to, amount, symbol, chainId }, hash);
      return hash;
    },
    [account.address, addRecentActivity, ensureNetwork, writeContractAsync],
  );

  const contextValue = useMemo<EvmWalletContextValue>(
    () => ({
      configured: true,
      ready: true,
      isConnected: account.isConnected,
      isConnecting:
        account.status === "connecting" || account.status === "reconnecting",
      address: account.address,
      chainId: account.chainId,
      chainName: account.chainId
        ? evmNetworkById.get(account.chainId)?.name
        : undefined,
      openConnect,
      openNetworkSwitcher,
      openAccount,
      disconnect,
      switchNetwork,
      sendNative,
      sendToken,
      signMessage: message => signMessageAsync({ account: account.address, message }),
      recentActivity,
    }),
    [
      account.address,
      account.chainId,
      account.isConnected,
      account.status,
      disconnect,
      openAccount,
      openConnect,
      openNetworkSwitcher,
      recentActivity,
      signMessageAsync,
      sendNative,
      sendToken,
      switchNetwork,
    ],
  );

  useEffect(() => { onChange(contextValue); }, [onChange, contextValue]);
  return <ExtraWalletRuntime onChange={onExtraChange} />;
}
// Isolate Wagmi and Reown providers in this dynamically loaded module.
export const WalletRuntime = memo(function WalletRuntime(props: RuntimeProps) {
  return <WagmiProvider config={wagmiConfig}>
    <WalletBridge {...props} />
  </WagmiProvider>;
});

// Protected wallet routes use the same config for their Wagmi hooks. The root
// runtime owns reconnection; this nested provider only exposes the shared state.
export function WalletToolsRouteProvider({ children }: { children: ReactNode }) {
  return <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>{children}</WagmiProvider>;
}
