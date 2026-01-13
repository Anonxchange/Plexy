import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWalletData } from "@/hooks/use-wallet-data";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AssetList() {
  const { data: wallet } = useWalletData();
  const [hideZero, setHideZero] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-1">
        <Tabs defaultValue="assets" className="w-auto">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            <TabsTrigger 
              value="assets" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-base font-semibold"
            >
              Wallet assets
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-base font-semibold text-muted-foreground"
            >
              Recent activity
            </TabsTrigger>
            <TabsTrigger 
              value="operations" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-base font-semibold text-muted-foreground"
            >
              All operations
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button variant="ghost" className="text-sm font-medium px-0 h-auto pb-3 hover:bg-transparent hidden sm:flex">
          See full operations
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="hide-zero" checked={hideZero} onCheckedChange={(checked) => setHideZero(!!checked)} />
        <Label htmlFor="hide-zero" className="text-sm font-medium text-muted-foreground cursor-pointer">
          Hide 0 balance
        </Label>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[100px] text-xs uppercase font-bold tracking-wider">Asset</TableHead>
              <TableHead className="text-xs uppercase font-bold tracking-wider">Current price</TableHead>
              <TableHead className="text-xs uppercase font-bold tracking-wider">Balance</TableHead>
              <TableHead className="w-[50px] text-xs uppercase font-bold tracking-wider text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallet?.assets.filter(a => !hideZero || a.balance > 0).map((asset) => (
              <TableRow key={asset.symbol} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`/assets/coins/${asset.symbol.toLowerCase()}.png`} 
                      alt={asset.symbol}
                      className="w-8 h-8 rounded-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${asset.symbol.toLowerCase()}.png`;
                      }}
                    />
                    <div className="font-bold">{asset.symbol}</div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="font-semibold">0 NGN</div>
                  <div className="text-[10px] text-green-500 font-bold">+0.00%</div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="font-bold">0</div>
                  <div className="text-[10px] text-muted-foreground font-medium">0 NGN</div>
                </TableCell>
                <TableCell className="text-right py-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!wallet?.assets || wallet.assets.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No assets found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
