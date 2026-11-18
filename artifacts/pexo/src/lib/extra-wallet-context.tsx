import { createContext, useContext, type ReactNode } from "react";
import type { WalletAsset, WalletNamespace } from "./wallet-assets";

export type ExtraNamespace = Exclude<WalletNamespace, "eip155">;
export interface ExtraWalletContextValue {
  loading?: boolean;
  addresses: Partial<Record<ExtraNamespace, string>>;
  connect: (namespace: ExtraNamespace) => Promise<void>;
  disconnect: () => Promise<void>;
  readBalance: (asset: WalletAsset, signal?: AbortSignal) => Promise<number>;
  send: (asset: WalletAsset, to: string, amount: string) => Promise<string>;
}
const unavailable = async (): Promise<never> => { throw new Error("Wallet tools are not ready. Please try connecting again."); };
export const emptyExtraWallet: ExtraWalletContextValue = {
  loading: true, addresses: {}, connect: unavailable, disconnect: unavailable,
  readBalance: unavailable, send: unavailable,
};
const Context = createContext(emptyExtraWallet);
export function ExtraWalletStateProvider({ value, children }: { value: ExtraWalletContextValue; children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useExtraWallet = () => useContext(Context);
