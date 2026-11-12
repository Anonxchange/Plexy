import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, QrCode } from "@/lib/icons";
import { QRCodeCanvas } from "qrcode.react";
import { useEvmWallet } from "@/lib/evm-wallet-provider";
import { useToast } from "@/hooks/use-toast";
import { useWalletAccountLink } from "@/hooks/use-wallet-account-link";

interface ReceiveCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const explorers: Record<number, string> = {
  1: "https://etherscan.io", 10: "https://optimistic.etherscan.io", 56: "https://bscscan.com",
  137: "https://polygonscan.com", 42161: "https://arbiscan.io", 8453: "https://basescan.org",
  43114: "https://snowtrace.io",
};

export function ReceiveCryptoDialog({ open, onOpenChange }: ReceiveCryptoDialogProps) {
  const wallet = useEvmWallet();
  const walletLink = useWalletAccountLink();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const isWalletLinked =
    walletLink.status === "linked" &&
    !!wallet.address &&
    walletLink.linkedAddress === wallet.address.toLowerCase();
  const explorer = wallet.chainId != null && wallet.address ? explorers[wallet.chainId] : undefined;

  const copy = async () => {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast({ title: "Address copied", description: "Confirm the receiving network with the sender." });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Copy unavailable", description: "Select the address and copy it manually." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[430px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Receive crypto</DialogTitle>
          <DialogDescription>Receive assets to your connected wallet address.</DialogDescription>
        </DialogHeader>
        {walletLink.status === "loading" ? (
          <div className="rounded-xl border border-dashed p-7 text-center">
            <p className="font-semibold">Checking your linked wallet…</p>
          </div>
        ) : walletLink.status === "error" ? (
          <div className="rounded-xl border border-dashed p-7 text-center">
            <p className="font-semibold">We couldn’t verify your linked wallet</p>
            <p className="mt-1 text-sm text-muted-foreground">{walletLink.error || "Retry before receiving."}</p>
            <Button className="mt-4" variant="outline" disabled={walletLink.loading} onClick={() => void walletLink.refresh()}>
              {walletLink.loading ? "Checking…" : "Retry"}
            </Button>
          </div>
        ) : isWalletLinked && wallet.address ? (
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="rounded-2xl border border-[#e7ede2] bg-white p-4 shadow-sm">
                <QRCodeCanvas value={wallet.address} size={184} level="M" includeMargin />
              </div>
            </div>
            <div className="rounded-xl bg-[#f0f6e9] px-4 py-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#5d7649]"><QrCode className="h-3.5 w-3.5" />{wallet.chainName || `Chain ${wallet.chainId}`}</div>
              <p className="break-all font-mono text-sm leading-relaxed text-[#17392f]">{wallet.address}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => void copy()} className="gap-2">{copied ? "Copied" : "Copy address"}<Copy className="h-4 w-4" /></Button>
              {explorer ? <Button asChild variant="outline" className="gap-2"><a href={`${explorer}/address/${wallet.address}`} target="_blank" rel="noreferrer">View on explorer<ExternalLink className="h-4 w-4" /></a></Button> : <Button variant="outline" disabled>Explorer unavailable</Button>}
            </div>
            <p className="text-center text-xs leading-relaxed text-muted-foreground">This address can receive supported EVM tokens on Ethereum, Polygon, BNB Chain, Arbitrum, Base, Optimism, and Avalanche. The sender must choose the same network you intend to use; transfers on unsupported networks may be lost.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-7 text-center">
            <p className="font-semibold">
              {walletLink.status === "unlinked"
                ? wallet.isConnected ? "Verify this wallet to receive" : "Connect or create a wallet"
                : walletLink.status === "different"
                  ? "Connected wallet does not match"
                  : "Wallet locked — reconnect to receive"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {walletLink.status === "different"
                ? `Saved address: ${walletLink.linkedAddress}. Reconnect it, or verify this wallet to make it primary.`
                : walletLink.linkedAddress
                  ? `Saved address: ${walletLink.linkedAddress}`
                  : "Verify a wallet and link it to your signed-in account before receiving."}
            </p>
            {walletLink.error && <p role="alert" className="mt-2 text-xs text-destructive">{walletLink.error}</p>}
            {walletLink.status === "unlinked" && wallet.isConnected || walletLink.status === "different" && wallet.isConnected ? (
              <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                {walletLink.status === "different" && (
                  <Button variant="outline" disabled={!wallet.configured || wallet.isConnecting} onClick={() => wallet.openConnect()}>
                    {wallet.isConnecting ? "Connecting…" : "Reconnect linked wallet"}
                  </Button>
                )}
                <Button
                  disabled={walletLink.linking}
                  onClick={() => {
                    void walletLink.linkCurrentWallet().catch((reason) => {
                      toast({
                        title: "Wallet verification failed",
                        description: reason instanceof Error ? reason.message : "Could not link this wallet.",
                      });
                    });
                  }}
                >
                  {walletLink.linking
                    ? "Verifying…"
                    : walletLink.status === "different"
                      ? "Use connected wallet instead"
                      : "Verify and link wallet"}
                </Button>
              </div>
            ) : (
              <Button className="mt-4" disabled={wallet.isConnecting || !wallet.configured} onClick={() => wallet.openConnect()}>
                {wallet.isConnecting
                  ? "Connecting…"
                  : !wallet.configured
                    ? "Wallet setup required"
                    : walletLink.status === "disconnected"
                      ? "Unlock / Connect"
                      : "Connect or create wallet"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
