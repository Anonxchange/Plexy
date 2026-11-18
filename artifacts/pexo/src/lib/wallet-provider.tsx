import { Component, createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useLocation } from "wouter";
import type { Address } from "viem";
import { isWalletConfigured } from "./wallet-state";
import { emptyExtraWallet, ExtraWalletStateProvider, type ExtraWalletContextValue } from "./extra-wallet-context";

export interface EvmWalletActivity {
  hash: `0x${string}`; to: string; amount: string; symbol: string;
  chainId: number; chainName: string; explorerUrl?: string; createdAt: string;
}
export interface SendNativeInput { to: string; amount: string; symbol: string; chainId: number }
export interface SendTokenInput extends SendNativeInput { tokenAddress: string; decimals: number }
export interface EvmWalletContextValue {
  configured: boolean; ready: boolean; isConnected: boolean; isConnecting: boolean;
  address?: Address; chainId?: number; chainName?: string; error?: string;
  openConnect: () => void; openNetworkSwitcher: () => void; openAccount: () => void;
  disconnect: () => Promise<void>; switchNetwork: (chainId: number) => Promise<void>;
  sendNative: (input: SendNativeInput) => Promise<`0x${string}`>;
  sendToken: (input: SendTokenInput) => Promise<`0x${string}`>;
  signMessage: (message: string) => Promise<`0x${string}`>;
  recentActivity: EvmWalletActivity[];
}
const unavailable = async (): Promise<never> => { throw new Error("Connect a wallet before continuing."); };
const emptyWallet: EvmWalletContextValue = {
  configured: isWalletConfigured, ready: !isWalletConfigured, isConnected: false, isConnecting: false,
  openConnect: () => {}, openAccount: () => {}, openNetworkSwitcher: () => {},
  disconnect: async () => {}, switchNetwork: unavailable, sendNative: unavailable, sendToken: unavailable,
  signMessage: unavailable,
  recentActivity: [],
};
const Context = createContext(emptyWallet);
export interface RuntimeProps {
  onChange: (value: EvmWalletContextValue) => void;
  onExtraChange: (value: ExtraWalletContextValue) => void;
}
class RuntimeBoundary extends Component<{ onError: (error: Error) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onError(error); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function EvmWalletProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [runtime, setRuntime] = useState<{ Component: ComponentType<RuntimeProps> }>();
  const [wallet, setWallet] = useState<EvmWalletContextValue>();
  const [extra, setExtra] = useState(emptyExtraWallet);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadPromise = useRef<Promise<EvmWalletContextValue> | null>(null);
  const ready = useRef<{ resolve: (value: EvmWalletContextValue) => void; reject: (reason: unknown) => void } | null>(null);
  const onChange = useCallback((value: EvmWalletContextValue) => {
    setWallet(value);
    ready.current?.resolve(value);
    ready.current = null;
  }, []);
  const onRuntimeError = useCallback((reason: Error) => {
    ready.current?.reject(reason);
    ready.current = null;
    setError(reason.message || "Wallet tools could not load. Try connecting again.");
    setRuntime(undefined);
    setWallet(undefined);
    setExtra(emptyExtraWallet);
    loadPromise.current = null;
    setLoading(false);
  }, []);

  const load = useCallback((): Promise<EvmWalletContextValue> => {
    if (!isWalletConfigured) return Promise.reject(new Error("Wallet connection is not configured."));
    if (loadPromise.current) return loadPromise.current;
    setLoading(true);
    setError("");
    const promise = (async () => {
      try {
        const module = await import("./evm-wallet-provider");
        const published = new Promise<EvmWalletContextValue>((resolve, reject) => { ready.current = { resolve, reject }; });
        setRuntime({ Component: module.WalletRuntime });
        return await published;
      } catch (reason) {
        loadPromise.current = null;
        setError(reason instanceof Error ? reason.message : "Wallet tools could not load. Try connecting again.");
        throw reason;
      } finally { setLoading(false); }
    })();
    loadPromise.current = promise;
    return promise;
  }, []);

  // Visiting a wallet page prepares the SDK, but public browsing does not.
  useEffect(() => {
    if (location.split("?")[0] === "/wallet" && isWalletConfigured) void load().catch(() => {});
  }, [location, load]);
  // Restore an existing EVM connection after the first screen has painted.
  useEffect(() => {
    try {
      const persisted = window.localStorage.getItem("wagmi.store");
      if (!persisted || !JSON.parse(persisted)?.state?.current) return;
      const timer = window.setTimeout(() => { void load().catch(() => {}); }, 500);
      return () => window.clearTimeout(timer);
    } catch { /* Storage is optional; connecting manually still works. */ }
  }, [load]);
  const launch = (action: "openConnect" | "openNetworkSwitcher" | "openAccount") => {
    void load().then(value => value[action]()).catch(() => {});
  };
  const value = wallet ?? {
    ...emptyWallet, ready: !isWalletConfigured || !!error, isConnecting: loading, error: error || undefined,
    openConnect: () => launch("openConnect"), openNetworkSwitcher: () => launch("openNetworkSwitcher"),
    openAccount: () => launch("openAccount"),
  };
  const Runtime = runtime?.Component;
  return <Context.Provider value={value}>
    <ExtraWalletStateProvider value={extra}>
      {children}
      {Runtime && <RuntimeBoundary onError={onRuntimeError}><Runtime onChange={onChange} onExtraChange={setExtra} /></RuntimeBoundary>}
      {error && <div role="alert" className="fixed bottom-4 left-4 right-4 z-[100] rounded-lg border border-destructive bg-background p-4 text-sm text-destructive sm:left-auto sm:max-w-md">Wallet tools could not load: {error}. Try Connect Wallet again.</div>}
    </ExtraWalletStateProvider>
  </Context.Provider>;
}
export const useEvmWallet = () => useContext(Context);
