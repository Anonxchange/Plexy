import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvmWallet } from "@/lib/wallet-provider";
import { useWalletPortfolio } from "@/hooks/use-wallet-portfolio";

export function useWalletSelection(open: boolean, initialSymbol?: string) {
  const portfolio = useWalletPortfolio();
  const wallet = useEvmWallet();
  const [symbol, setSymbol] = useState("USDT");
  const [networkId, setNetworkId] = useState("eip155:1");
  const networks = portfolio.assets.filter(asset => asset.symbol === symbol);
  const selectedAsset = networks.find(asset => asset.networkId === networkId);
  function chooseSymbol(next: string) {
    const choices = portfolio.assets.filter(asset => asset.symbol === next);
    const preferred = choices.find(asset => asset.networkId === networkId)
      ?? choices.find(asset => asset.chainId === wallet.chainId)
      ?? choices[0];
    setSymbol(next);
    setNetworkId(preferred?.networkId ?? "");
  }
  useEffect(() => {
    if (!open) return;
    const next = portfolio.coins.find(coin => coin.symbol === initialSymbol?.toUpperCase())?.symbol ?? "USDT";
    const choices = portfolio.assets.filter(asset => asset.symbol === next);
    setSymbol(next);
    setNetworkId((choices.find(asset => asset.chainId === wallet.chainId) ?? choices[0])?.networkId ?? "");
    // Only reset when the dialog opens, not when balances refresh.
  }, [open, initialSymbol]);
  return { ...portfolio, symbol, networkId, networks, selectedAsset, chooseSymbol, setNetworkId };
}

export function WalletAssetSelector({ selection, prefix, disabled }: {
  selection: ReturnType<typeof useWalletSelection>; prefix: string; disabled?: boolean;
}) {
  return <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor={`${prefix}-asset`}>Coin</Label>
      <Select value={selection.symbol} onValueChange={selection.chooseSymbol} disabled={disabled}>
        <SelectTrigger id={`${prefix}-asset`}><SelectValue placeholder="Select a coin" /></SelectTrigger>
        <SelectContent>{selection.coins.map(coin => <SelectItem key={coin.symbol} value={coin.symbol}>{coin.name} ({coin.symbol})</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${prefix}-network`}>Network</Label>
      <Select value={selection.networkId} onValueChange={selection.setNetworkId} disabled={disabled}>
        <SelectTrigger id={`${prefix}-network`}><SelectValue placeholder="Select a network" /></SelectTrigger>
        <SelectContent>{selection.networks.map(asset => <SelectItem key={asset.networkId} value={asset.networkId}>{asset.chainName}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  </div>;
}
