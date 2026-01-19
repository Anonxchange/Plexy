import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWalletData } from "@/hooks/use-wallet-data";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
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
  const { data: prices } = useCryptoPrices();
  const [hideZero, setHideZero] = useState(false);
  const isMobile = useIsMobile();

  const ActionMenu = ({ symbol }: { symbol: string }) => {
    const handleSend = (e: React.MouseEvent) => {
      if (!e) return;
      e.stopPropagation();
      onSend?.(symbol);
    };

    const handleReceive = (e: React.MouseEvent) => {
      if (!e) return;
      e.stopPropagation();
      onReceive?.(symbol);
    };

    const handleSwap = (e: React.MouseEvent) => {
      if (!e) return;
      e.stopPropagation();
      onSwap?.(symbol);
    };

    if (isMobile) {
      return (
        <Drawer>
          <DrawerTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                onClick={handleReceive}
