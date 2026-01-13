import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWalletData } from "@/hooks/use-wallet-data";

export function AssetList() {
  const { data: wallet } = useWalletData();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="text-right">24h Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wallet?.assets.map((asset) => (
            <TableRow key={asset.symbol}>
              <TableCell className="font-medium">
                {asset.name} ({asset.symbol})
              </TableCell>
              <TableCell>{asset.balance}</TableCell>
              <TableCell>${asset.value.toLocaleString()}</TableCell>
              <TableCell className={`text-right ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {asset.change24h}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
