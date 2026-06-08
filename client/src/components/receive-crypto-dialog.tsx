import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, X, Info } from '@/lib/icons';
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { QRCodeCanvas } from "qrcode.react";
import { CoinIcon } from "@/components/trading/CoinIcon";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useIsMobile } from "@/hooks/use-mobile";

interface ReceiveCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Array<{ symbol: string; balance: number; name: string; icon: string }>;
  initialSymbol?: string;
}

export function ReceiveCryptoDialog({ open, onOpenChange, wallets, initialSymbol }: ReceiveCryptoDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");

  const networkMap: Record<string, string[]> = {
    BTC: ["Bitcoin (SegWit)"],
    ETH: ["Ethereum (ERC-20)"],
    SOL: ["Solana"],
    BNB: ["Binance Smart Chain (BEP-20)"],
    TRX: ["Tron (TRC-20)"],
    MATIC: ["Polygon"],
    OP: ["Optimism"],
    ARB: ["Arbitrum"],
    XRP: ["Ripple"],
    USDC: ["Ethereum (ERC-20)", "Binance Smart Chain (BEP-20)", "Tron (TRC-20)", "Solana (SPL)", "Polygon", "Optimism", "Arbitrum"],
    USDT: ["Ethereum (ERC-20)", "Binance Smart Chain (BEP-20)", "Tron (TRC-20)", "Solana (SPL)", "Polygon", "Optimism", "Arbitrum"],
  };

  const ASSET_NAMES: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    USDT: "Tether",
    USDC: "USD Coin",
    BNB: "BNB",
    SOL: "Solana",
    TRX: "Tron",
    MATIC: "Polygon",
    OP: "Optimism",
    ARB: "Arbitrum",
    XRP: "Ripple",
  };

  const handleClose = () => onOpenChange(false);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({ title: "Copied", description: "Wallet address copied to clipboard" });
    }
  };

  const getNetworkSpecificSymbol = (crypto: string, network: string): string => {
    if (crypto === 'USDT' || crypto === 'USDC') {
      if (network.includes('ERC-20')) return `${crypto}-ERC20`;
      if (network.includes('BEP-20')) return `${crypto}-BEP20`;
      if (network.includes('TRC-20')) return `${crypto}-TRC20`;
      if (network.includes('SPL')) return `${crypto}-SOL`;
    }
    return crypto;
  };

  useEffect(() => {
    if (!selectedCrypto || !user || !selectedNetwork) {
      setWalletAddress("");
      return;
    }

    const symbolToUse = getNetworkSpecificSymbol(selectedCrypto, selectedNetwork);

    const fetchAddress = async () => {
      const { nonCustodialWalletManager } = await import("@/lib/non-custodial-wallet");
      const userWallets = await (nonCustodialWalletManager as any).getWalletsFromStorage(user.id);

      const targetWallet = userWallets.find((w: any) => {
        const normalizedChainId = w.chainId.toUpperCase();
        const normalizedSymbolToUse = symbolToUse.toUpperCase();
        const normalizedSelectedCrypto = selectedCrypto.toUpperCase();

        if (selectedNetwork.includes('TRC-20')) {
          return normalizedChainId.includes('TRC20') || (normalizedChainId === 'TRX' && normalizedSelectedCrypto === 'TRX') || (normalizedChainId === 'TRON (TRC-20)');
        }
        if (selectedNetwork.includes('ERC-20') || ['POLYGON', 'OPTIMISM', 'ARBITRUM'].includes(selectedNetwork.toUpperCase())) {
          return normalizedChainId.includes('ERC-20') ||
            ['ETH', 'MATIC', 'OP', 'ARB'].includes(normalizedChainId) ||
            normalizedChainId === 'ETHEREUM' || normalizedChainId === normalizedSelectedCrypto ||
            (normalizedSelectedCrypto === 'USDT' && (normalizedChainId === 'USDT' || normalizedChainId === 'USDT-ERC20' || normalizedChainId === 'ETH')) ||
            (normalizedSelectedCrypto === 'USDC' && (normalizedChainId === 'USDC' || normalizedChainId === 'USDC-ERC20' || normalizedChainId === 'ETH'));
        }
        if (selectedNetwork.includes('BEP-20')) {
          return normalizedChainId.includes('BEP20') ||
            normalizedChainId === 'BNB' ||
            normalizedChainId === 'BSC' ||
            normalizedChainId.includes('BINANCE') ||
            (normalizedSelectedCrypto === 'USDT' && (normalizedChainId === 'USDT-BEP20' || normalizedChainId === 'BNB' || normalizedChainId === 'BSC' || normalizedChainId === 'BINANCE SMART CHAIN (BEP-20)')) ||
            (normalizedSelectedCrypto === 'USDC' && (normalizedChainId === 'USDC-BEP20' || normalizedChainId === 'BNB' || normalizedChainId === 'BSC' || normalizedChainId === 'BINANCE SMART CHAIN (BEP-20)'));
        }
        if (selectedNetwork.includes('SPL') || selectedNetwork === 'Solana') {
          return normalizedChainId.includes('SOL') || (normalizedChainId === 'SOLANA' && normalizedSelectedCrypto === 'SOL') || (normalizedChainId === 'SOLANA');
        }
        if (selectedNetwork.includes('SegWit') || selectedNetwork === 'Bitcoin') {
          return normalizedChainId.includes('BITCOIN') || (normalizedChainId === 'BTC' && normalizedSelectedCrypto === 'BTC');
        }
        if (selectedNetwork.includes('BEP-20') || ['BNB', 'BSC'].includes(normalizedSelectedCrypto)) {
          return normalizedChainId.includes('BEP20') ||
            normalizedChainId === 'BNB' ||
            normalizedChainId === 'BSC' ||
            normalizedChainId.includes('BINANCE');
        }
        if (selectedNetwork === 'Ripple' || selectedCrypto === 'XRP') {
          return normalizedChainId === 'XRP' || normalizedChainId.includes('RIPPLE');
        }

        return normalizedChainId === normalizedSymbolToUse ||
          normalizedChainId === normalizedSelectedCrypto ||
          normalizedChainId.startsWith(`${normalizedSelectedCrypto}-`) ||
          normalizedChainId.includes(normalizedSelectedCrypto);
      });

      setWalletAddress(targetWallet ? targetWallet.address : "");
    };

    fetchAddress();
  }, [selectedCrypto, selectedNetwork, user]);

  const handleAssetChange = (value: string) => {
    setSelectedCrypto(value);
    const networks = networkMap[value] || ["Mainnet"];
    setSelectedNetwork(networks[0]);
  };

  useEffect(() => {
    if (open) handleAssetChange(initialSymbol || "BTC");
  }, [open, initialSymbol]);

  const title = `Receive ${ASSET_NAMES[selectedCrypto] || selectedCrypto}`;

  const content = (
    <div className="space-y-5 pb-2">
      {/* Asset */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Asset</label>
        <Select value={selectedCrypto} onValueChange={handleAssetChange}>
          <SelectTrigger className="h-11 bg-muted/30 border-border/50 focus:ring-0 rounded-lg">
            <SelectValue>
              <div className="flex items-center gap-2">
                <CoinIcon symbol={selectedCrypto.toUpperCase()} className="w-5 h-5" />
                <span className="font-bold text-sm">{ASSET_NAMES[selectedCrypto] || selectedCrypto}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-lg max-h-[250px] bg-popover border-border" position="popper" sideOffset={4}>
            <ScrollArea className="h-full w-full">
              {Object.entries(ASSET_NAMES).map(([symbol, name]) => (
                <SelectItem key={symbol} value={symbol} className="rounded-md cursor-pointer hover:bg-accent">
                  <div className="flex items-center gap-2 py-1">
                    <CoinIcon symbol={symbol.toUpperCase()} className="w-5 h-5" />
                    <span className="font-bold text-sm">{name}</span>
                  </div>
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {/* Network */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Network</label>
        <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
          <SelectTrigger className="h-11 bg-muted/30 border-border/50 focus:ring-0 rounded-lg">
            <SelectValue placeholder="Select a network" />
          </SelectTrigger>
          <SelectContent className="rounded-lg bg-popover border-border" position="popper" sideOffset={4}>
            {(networkMap[selectedCrypto] || ["Mainnet"]).map((network) => (
              <SelectItem key={network} value={network} className="rounded-md hover:bg-accent">
                <span className="font-medium text-sm">{network}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* QR + Address */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deposit address</label>

        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-border/10">
            <QRCodeCanvas
              value={walletAddress || "No address"}
              size={148}
              level="M"
              includeMargin={false}
              imageSettings={{
                src: cryptoIconUrls[selectedCrypto],
                height: 30,
                width: 30,
                excavate: true,
              }}
            />
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">
                {ASSET_NAMES[selectedCrypto] || selectedCrypto} #1 ({selectedNetwork?.split(' ')[0] || selectedCrypto})
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyAddress}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div
              className="p-3 bg-muted/30 rounded-lg break-all text-sm font-mono leading-relaxed tracking-tight border border-border/50 shadow-inner cursor-pointer select-all"
              onClick={handleCopyAddress}
            >
              {walletAddress || "Generating address…"}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-10 rounded-lg text-muted-foreground/60 font-bold bg-muted/10 text-xs"
          disabled
        >
          Deposit to your wallet
        </Button>

        <p className="text-[10px] text-destructive/80 text-center leading-tight px-4 font-medium">
          Only send this exact asset to this address.
          Sending any other asset will result in permanent loss.
        </p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pt-2 pb-6 max-h-[92dvh] overflow-hidden flex flex-col"
        >
          <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-3 flex-shrink-0" />
          <SheetHeader className="flex flex-row items-center justify-between mb-4 flex-shrink-0">
            <SheetTitle>{title}</SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] p-0 bg-background border border-border shadow-lg gap-0 overflow-hidden">
        <DialogHeader className="p-4 flex flex-row items-center justify-between border-b border-border/50">
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="p-4 overflow-y-auto max-h-[80vh]">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
