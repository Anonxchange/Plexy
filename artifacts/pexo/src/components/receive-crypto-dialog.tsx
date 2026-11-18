import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, QrCode } from "@/lib/icons";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { walletExplorer } from "@/lib/wallet-assets";
import { WalletAssetSelector, useWalletSelection } from "@/components/wallet/WalletAssetSelector";
import { WalletConnectionGate } from "@/components/wallet/WalletConnectionGate";

interface ReceiveCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSymbol?: string;
}

export function ReceiveCryptoDialog({ open, onOpenChange, initialSymbol }: ReceiveCryptoDialogProps) {
  const selection = useWalletSelection(open, initialSymbol);
  const asset = selection.selectedAsset;
  const address = asset?.address;
  const explorer = asset && address ? walletExplorer(asset, address) : undefined;
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState("");
  async function copy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast({ title: "Address copied", description: `Receive ${asset?.symbol} using ${asset?.chainName} only.` });
      window.setTimeout(() => setCopiedAddress(""), 1800);
    } catch { toast({ title: "Copy unavailable", description: "Select the address and copy it manually." }); }
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[430px] max-h-[90dvh] overflow-y-auto rounded-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl">Receive crypto</DialogTitle>
        <DialogDescription>Select your coin and receiving network before sharing an address.</DialogDescription>
      </DialogHeader>
      <WalletAssetSelector selection={selection} prefix="receive" />
      <WalletConnectionGate asset={asset}>
        {asset && address && <div className="space-y-5">
          <div className="flex justify-center"><div className="rounded-2xl border border-[#e7ede2] bg-white p-4 shadow-sm">
            <QRCodeCanvas value={address} size={184} level="M" includeMargin />
          </div></div>
          <div className="rounded-xl bg-[#f0f6e9] px-4 py-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#5d7649]"><QrCode className="h-3.5 w-3.5" />{asset.symbol} · {asset.chainName}</div>
            <p data-testid="receive-address" className="break-all font-mono text-sm leading-relaxed text-[#17392f]">{address}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => void copy()} className="gap-2">{copiedAddress === address ? "Copied" : "Copy address"}<Copy className="h-4 w-4" /></Button>
            {explorer && <Button asChild variant="outline" className="gap-2"><a href={explorer} target="_blank" rel="noreferrer">View on explorer<ExternalLink className="h-4 w-4" /></a></Button>}
          </div>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">Send only {asset.symbol} on {asset.chainName} to this address. Selecting another network does not bridge funds. Transfers on the wrong network may be lost.</p>
        </div>}
      </WalletConnectionGate>
    </DialogContent>
  </Dialog>;
}
