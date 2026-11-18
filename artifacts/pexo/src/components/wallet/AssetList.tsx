import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useWalletPortfolio } from "@/hooks/use-wallet-portfolio";
import { walletExplorer } from "@/lib/wallet-assets";
import { CoinIcon } from "@/components/trading/CoinIcon";
import { ArrowDownToLine, ExternalLink, RefreshCw, Send } from "@/lib/icons";

export function AssetList({ onSend, onReceive }: { onSend?: (symbol: string) => void; onReceive?: (symbol: string) => void }) {
  const { coins: assets, error, refetch, isConnected } = useWalletPortfolio();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">Wallet assets</h2>
          <p className="mt-1 text-xs text-muted-foreground">{isConnected ? "One row per coin · Choose a network when sending or receiving" : "All supported coins · Connect your wallet to see balances"}</p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <Button variant="ghost" size="sm" disabled={!isConnected} onClick={() => void refetch()} className="h-8 gap-1.5 text-xs"><RefreshCw className="h-3.5 w-3.5" />Refresh</Button>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error instanceof Error ? error.message : "Balances could not be loaded. The supported coin list is still shown."}</p>}
      <div className="rounded-xl border border-[#e7ede2] overflow-hidden">
        <Table className="table-fixed sm:table-auto">
          <TableHeader>
            <TableRow className="bg-[#f8faf4] hover:bg-[#f8faf4]">
              <TableHead className="w-[43%] px-2 sm:w-auto sm:px-4">Asset</TableHead>
              <TableHead className="hidden sm:table-cell">Price</TableHead>
              <TableHead className="w-[29%] px-2 sm:w-auto sm:px-4">Balance</TableHead>
              <TableHead className="w-[28%] px-2 text-right sm:w-auto sm:px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => {
              const onlyNetwork = asset.networks.length === 1 ? asset.networks[0] : undefined;
              const explorer = onlyNetwork?.address
                ? walletExplorer(onlyNetwork, onlyNetwork.address)
                : undefined;
              const networkName = asset.networks.length > 1 ? `${asset.networks.length} networks` : asset.chainName;
              return (
                <TableRow key={asset.id} data-testid={`row-asset-${asset.id}`}>
                  <TableCell className="px-2 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <CoinIcon symbol={asset.symbol.toUpperCase()} className="h-7 w-7 shrink-0 sm:h-9 sm:w-9" />
                       <div className="min-w-0"><div className="truncate font-semibold">{asset.name}</div><div className="text-xs text-muted-foreground">{asset.symbol.toUpperCase()} · {networkName}</div></div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell font-medium">{asset.usdPrice == null ? "—" : `$${asset.usdPrice.toLocaleString("en-US", { maximumFractionDigits: 6 })}`}</TableCell>
                  <TableCell className="px-2 sm:px-4">
                    <div className="truncate font-bold tabular-nums" title={asset.balanceStatus === "ready" ? `${asset.balance} ${asset.symbol}` : undefined}>{asset.balanceStatus === "ready" ? <>{asset.balance.toLocaleString("en-US", { maximumFractionDigits: Math.min(asset.decimals, 8) })} <span className="hidden text-xs font-medium text-muted-foreground sm:inline">{asset.symbol.toUpperCase()}</span></> : "—"}</div>
                    <div className="text-xs text-muted-foreground">{asset.balanceStatus === "disconnected" ? "Not connected" : asset.balanceStatus === "loading" ? "Loading balance…" : asset.balanceStatus === "error" ? "Balance unavailable" : asset.usdValue == null ? "Value unavailable" : `${asset.partial ? "Partial · " : ""}$${asset.usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</div>
                  </TableCell>
                  <TableCell className="px-2 text-right sm:px-4">
                    <div className="inline-flex items-center gap-1">
                      {explorer && <Button asChild variant="ghost" size="icon" className="hidden h-8 w-8 sm:inline-flex" title="View address on block explorer"><a href={explorer} target="_blank" rel="noreferrer" aria-label="View on block explorer"><ExternalLink className="h-4 w-4" /></a></Button>}
                      {onReceive && <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Receive ${asset.symbol}`} onClick={() => onReceive(asset.symbol)}><ArrowDownToLine className="h-4 w-4" /></Button>}
                      {onSend && <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Send ${asset.symbol}`} onClick={() => onSend(asset.symbol)}><Send className="h-4 w-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">Coin balances combine supported networks. Send and Receive use the selected network and its connected wallet; Bitcoin, Solana and TRON require their own compatible addresses.</p>
    </div>
  );
}
