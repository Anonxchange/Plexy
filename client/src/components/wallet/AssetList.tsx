import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWalletData } from "@/hooks/use-wallet-data";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, ArrowDownToLine, Send, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

import { cryptoIconUrls } from "@/lib/crypto-icons";

interface AssetListProps {
  onSend?: (symbol: string) => void;
  onReceive?: (symbol: string) => void;
  onSwap?: (symbol: string) => void;
}

export function AssetList({ onSend, onReceive, onSwap }: AssetListProps) {
  const { data: wallet } = useWalletData();
  const [hideZero, setHideZero] = useState(false);
  const isMobile = useIsMobile();

  const ActionMenu = ({ symbol }: { symbol: string }) => {
    if (isMobile) {
      return (
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground bg-muted/20">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="pb-8">
            <DrawerHeader className="border-b">
              <DrawerTitle className="text-left font-bold">Select an action</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-4 h-14 text-base font-bold rounded-xl border-muted/50"
                onClick={() => onReceive?.(symbol)}
              >
                <div className="bg-muted/10 p-2 rounded-lg">
                  <ArrowDownToLine className="h-5 w-5" />
                </div>
                Deposit
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-4 h-14 text-base font-bold rounded-xl border-muted/50"
                onClick={() => onSend?.(symbol)}
              >
                <div className="bg-muted/10 p-2 rounded-lg">
                  <Send className="h-5 w-5" />
                </div>
                Send
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-4 h-14 text-base font-bold rounded-xl border-muted/50"
                onClick={() => onSwap?.(symbol)}
              >
                <div className="bg-muted/10 p-2 rounded-lg">
                  <RefreshCw className="h-5 w-5" />
                </div>
                Swap
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onReceive?.(symbol)}>Deposit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSend?.(symbol)}>Send</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSwap?.(symbol)}>Swap</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-1 overflow-x-auto no-scrollbar">
        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="bg-transparent h-auto p-0 gap-8 min-w-max flex justify-start">
            <TabsTrigger 
              value="assets" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-base font-semibold whitespace-nowrap"
            >
              Wallet assets
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-base font-semibold text-muted-foreground whitespace-nowrap"
            >
              Recent activity
            </TabsTrigger>
            <TabsTrigger 
              value="operations" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-base font-semibold text-muted-foreground whitespace-nowrap"
            >
              All operations
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="hide-zero" checked={hideZero} onCheckedChange={(checked) => setHideZero(!!checked)} className="dark:border-muted-foreground" />
        <Label htmlFor="hide-zero" className="text-sm font-medium text-muted-foreground cursor-pointer">
          Hide 0 balance
        </Label>
      </div>

      <div className="rounded-lg border bg-card dark:bg-card/50 overflow-x-auto no-scrollbar transition-colors">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/30 dark:bg-muted/10">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[100px] text-[10px] sm:text-xs uppercase font-bold tracking-wider text-muted-foreground">Asset</TableHead>
              <TableHead className="text-[10px] sm:text-xs uppercase font-bold tracking-wider hidden sm:table-cell text-muted-foreground">Current price</TableHead>
              <TableHead className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-muted-foreground">Balance</TableHead>
              <TableHead className="w-[50px] text-[10px] sm:text-xs uppercase font-bold tracking-wider text-right text-muted-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallet?.assets.filter(a => !hideZero || a.balance > 0).map((asset) => (
              <TableRow key={asset.symbol} className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors border-border">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={cryptoIconUrls[asset.symbol] || `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${asset.symbol.toLowerCase()}.png`} 
                      alt={asset.symbol}
                      className="w-8 h-8 rounded-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${asset.symbol}&background=random`;
                      }}
                    />
                    <div className="font-bold text-foreground">{asset.symbol}</div>
                  </div>
                </TableCell>
                <TableCell className="py-4 hidden sm:table-cell">
                  <div className="font-semibold text-foreground">0 {localStorage.getItem(`pexly_currency_${wallet?.userId || ""}`) || "USD"}</div>
                  <div className="text-[10px] text-green-500 font-bold">+0.00%</div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="font-bold text-foreground">0</div>
                  <div className="text-[10px] text-muted-foreground font-medium">0 {localStorage.getItem(`pexly_currency_${wallet?.userId || ""}`) || "USD"}</div>
                </TableCell>
                <TableCell className="text-right py-4">
                  <ActionMenu symbol={asset.symbol} />
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
