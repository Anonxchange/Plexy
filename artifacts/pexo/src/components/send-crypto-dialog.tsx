import { useEffect, useState, type FormEvent } from "react";
import { isAddress } from "viem";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Send, ShieldCheck } from "@/lib/icons";
import { useEvmWallet } from "@/lib/wallet-provider";
import { useExtraWallet } from "@/lib/extra-wallet-context";
import { useWalletAccountLink } from "@/hooks/use-wallet-account-link";
import { transferUnits, walletExplorer } from "@/lib/wallet-assets";
import { WalletSubmissionUnknownError } from "@/lib/send-tron";
import { WalletAssetSelector, useWalletSelection } from "@/components/wallet/WalletAssetSelector";
import { WalletConnectionGate } from "@/components/wallet/WalletConnectionGate";

interface SendCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSymbol?: string;
  onSuccess?: () => void;
}

export function SendCryptoDialog({ open, onOpenChange, initialSymbol, onSuccess }: SendCryptoDialogProps) {
  const wallet = useEvmWallet();
  const extra = useExtraWallet();
  const link = useWalletAccountLink();
  const selection = useWalletSelection(open, initialSymbol);
  const asset = selection.selectedAsset;
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ hash: string; symbol: string; chainName: string; explorer?: string; unknown?: boolean }>();
  useEffect(() => {
    if (open) { setTo(""); setAmount(""); setError(""); setSent(undefined); }
  }, [open, initialSymbol]);
  useEffect(() => {
    setTo(""); setAmount(""); setError("");
  }, [selection.symbol, selection.networkId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!asset || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      if (!asset.address) throw new Error("Connect the wallet for this network.");
      transferUnits(amount, asset.decimals);
      if (asset.balanceStatus !== "ready") throw new Error("Refresh your balance before sending.");
      if (Number(amount) > asset.balance) throw new Error("The amount is greater than your available balance.");
      let hash: string;
      if (asset.namespace === "eip155") {
        if (link.status !== "linked" || link.linkedAddress !== wallet.address?.toLowerCase()) throw new Error("Verify the connected wallet before sending.");
        if (!isAddress(to.trim())) throw new Error("Enter a valid EVM recipient address.");
        if (!asset.chainId) throw new Error("Choose a supported network.");
        const input = { to: to.trim(), amount, symbol: asset.symbol, chainId: asset.chainId };
        if (asset.isNative) hash = await wallet.sendNative(input);
        else if (asset.contractAddress) hash = await wallet.sendToken({
          ...input, tokenAddress: asset.contractAddress, decimals: asset.decimals,
        });
        else throw new Error("This token has no supported contract on the selected network.");
      } else {
        hash = await extra.send(asset, to.trim(), amount);
      }
      setSent({ hash, symbol: asset.symbol, chainName: asset.chainName, explorer: walletExplorer(asset, hash, true) });
      onSuccess?.();
    } catch (reason) {
      if (reason instanceof WalletSubmissionUnknownError) {
        setSent({ hash: reason.transactionHash, symbol: asset.symbol, chainName: asset.chainName,
          explorer: walletExplorer(asset, reason.transactionHash, true), unknown: true });
      } else setError(reason instanceof Error ? reason.message : "The transaction could not be completed.");
    } finally { setSubmitting(false); }
  }
  return <Dialog open={open} onOpenChange={next => { if (!submitting) onOpenChange(next); }}>
    <DialogContent className="sm:max-w-[460px] max-h-[90dvh] overflow-y-auto rounded-2xl" onEscapeKeyDown={event => { if (submitting) event.preventDefault(); }} onPointerDownOutside={event => { if (submitting) event.preventDefault(); }}>
      <DialogHeader>
        <DialogTitle className="text-xl">Send crypto</DialogTitle>
        <DialogDescription>Choose a coin and network. Review the recipient, amount and fees in your wallet before approving.</DialogDescription>
      </DialogHeader>
      {sent ? <div className="py-5 text-center">
        {sent.unknown ? <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-600" /> : <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-[#4e7838]" />}
        <h3 className="font-bold text-lg">{sent.unknown ? "Check transaction status" : "Transaction submitted"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{sent.symbol} on {sent.chainName} · {sent.unknown ? "submission status unknown" : "awaiting network confirmation"}</p>
        {sent.unknown && <p role="alert" className="mt-3 text-sm text-amber-700">Check this transaction on the explorer before trying another transfer. It may already have been accepted.</p>}
        <p className="mt-4 break-all rounded-lg bg-muted/50 p-3 font-mono text-xs">{sent.hash}</p>
        {sent.explorer && <a href={sent.explorer} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">View on block explorer <ExternalLink className="h-3.5 w-3.5" /></a>}
        <Button className="mt-6 w-full" onClick={() => onOpenChange(false)}>Done</Button>
      </div> : <div className="space-y-5">
        <WalletAssetSelector selection={selection} prefix="send" disabled={submitting} />
        <WalletConnectionGate asset={asset}>
          <form onSubmit={event => void submit(event)} className="space-y-5">
            <div className="flex items-center gap-2 rounded-lg bg-[#f2f6ed] px-3 py-2.5 text-xs text-[#425d36]">
              <ShieldCheck className="h-4 w-4 shrink-0" />{asset?.chainName} · approval stays in your wallet
            </div>
            <div className="space-y-2">
              <Label htmlFor="send-recipient">Recipient address</Label>
              <Input id="send-recipient" value={to} disabled={submitting} onChange={event => setTo(event.target.value)} placeholder={asset?.namespace === "eip155" ? "0x…" : `${asset?.chainName ?? ""} mainnet address`} autoComplete="off" spellCheck={false} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="send-amount">Amount {asset ? `(${asset.symbol})` : ""}</Label>
              <Input id="send-amount" inputMode="decimal" value={amount} disabled={submitting} onChange={event => setAmount(event.target.value)} placeholder="0.00" autoComplete="off" />
              <p className="text-xs text-muted-foreground">{asset?.balanceStatus === "ready"
                ? `Available: ${asset.balance.toLocaleString("en-US", { maximumFractionDigits: asset.decimals })} ${asset.symbol}`
                : "Balance unavailable — refresh before sending."}</p>
              {asset?.balanceStatus === "error" && <Button type="button" variant="outline" size="sm" onClick={() => void selection.refetch()}>Refresh balance</Button>}
              <p className="text-xs text-muted-foreground">Leave enough native coin on this network to pay transaction fees.</p>
            </div>
            {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
            <Button type="submit" disabled={submitting || !asset || asset.balanceStatus !== "ready" || !to || !amount} className="h-11 w-full bg-[#d8ff85] text-[#091e1c] hover:bg-[#c9f16f] font-bold">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirm in wallet…</> : <><Send className="mr-2 h-4 w-4" />Continue to wallet</>}
            </Button>
          </form>
        </WalletConnectionGate>
      </div>}
    </DialogContent>
  </Dialog>;
}
