import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useEvmWallet } from "@/lib/wallet-provider";
import { useExtraWallet } from "@/lib/extra-wallet-context";
import { useWalletAccountLink } from "@/hooks/use-wallet-account-link";
import type { WalletAsset } from "@/lib/wallet-assets";

export function WalletConnectionGate({ asset, children }: { asset?: WalletAsset; children: ReactNode }) {
  const wallet = useEvmWallet();
  const extra = useExtraWallet();
  const link = useWalletAccountLink();
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  if (!asset) return <p className="text-sm text-muted-foreground">Choose a coin and network.</p>;
  const isEvm = asset.namespace === "eip155";
  const linked = link.status === "linked" && link.linkedAddress === wallet.address?.toLowerCase();
  const ready = isEvm ? linked && !!asset.address : !!extra.addresses[asset.namespace];
  if (ready) return <>{children}</>;
  const checking = isEvm && link.status === "loading";
  const failed = isEvm && link.status === "error";
  const needsLink = isEvm && wallet.isConnected && !checking && !failed;

  async function connect() {
    setError("");
    setConnecting(true);
    try {
      if (!asset) return;
      if (asset.namespace !== "eip155") await extra.connect(asset.namespace);
      else if (failed) await link.refresh();
      else if (needsLink) await link.linkCurrentWallet();
      else wallet.openConnect();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Wallet connection failed.");
    } finally { setConnecting(false); }
  }
  return <div className="rounded-xl border border-dashed p-6 text-center space-y-3">
    <p className="font-semibold">{checking ? "Checking your linked wallet…" : failed
      ? "Could not check your linked wallet" : needsLink ? "Verify this wallet"
      : `Connect a ${isEvm ? "compatible EVM" : asset.chainName} wallet`}</p>
    <p className="text-sm text-muted-foreground">{isEvm
      ? "Connect and verify your wallet to use the selected network."
      : `Use a ${asset.chainName} mainnet wallet. An Ethereum address cannot receive ${asset.symbol} on this network. Connection does not link this non-EVM address to your Pexly account.`}</p>
    {(error || (isEvm && link.error)) && <p role="alert" className="text-xs text-destructive">{error || link.error}</p>}
    {!checking && <Button type="button" disabled={connecting || link.linking || !wallet.configured || (!isEvm && extra.loading)} onClick={() => void connect()}>
      {!isEvm && extra.loading ? "Loading wallet tools…" : connecting || link.linking ? "Please confirm in wallet…" : failed ? "Retry" : needsLink ? "Verify and link wallet" : `Connect ${isEvm ? "wallet" : asset.chainName}`}
    </Button>}
  </div>;
}
