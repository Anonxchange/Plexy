import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, X, Info } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { QRCodeCanvas } from "qrcode.react";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";

interface ReceiveCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Array<{ symbol: string; balance: number; name: string; icon: string }>;
  initialSymbol?: string;
}

export function ReceiveCryptoDialog({ open, onOpenChange, wallets, initialSymbol }: ReceiveCryptoDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
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

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Copied",
        description: "Wallet address copied to clipboard",
      });
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
      const userWallets = await (nonCustodialWalletManager as any).getWalletsFromStorage(user.id);
      
      // Look for a wallet matching the specific symbol or base symbol
      const targetWallet = userWallets.find((w: any) => {
        const normalizedChainId = w.chainId.toUpperCase();
        const normalizedSymbolToUse = symbolToUse.toUpperCase();
        const normalizedSelectedCrypto = selectedCrypto.toUpperCase();
        
      // Strict matching for networks to avoid Tron/ETH address mixup
      if (selectedNetwork.includes('TRC-20')) {
        return normalizedChainId.includes('TRC20') || (normalizedChainId === 'TRX' && normalizedSelectedCrypto === 'TRX') || (normalizedChainId === 'TRON (TRC-20)');
      }
      if (selectedNetwork.includes('ERC-20') || ['POLYGON', 'OPTIMISM', 'ARBITRUM'].includes(selectedNetwork.toUpperCase())) {
        return normalizedChainId.includes('ERC-20') || 
               ['ETH', 'MATIC', 'OP', 'ARB'].includes(normalizedChainId) ||
               normalizedChainId === 'ETHEREUM' || normalizedChainId === normalizedSelectedCrypto;
      }
        if (selectedNetwork.includes('BEP-20')) {
          return normalizedChainId.includes('BEP20') || (normalizedChainId === 'BNB' && normalizedSelectedCrypto === 'BNB') || (normalizedChainId === 'BINANCE SMART CHAIN (BEP-20)');
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
      
      if (targetWallet) {
        setWalletAddress(targetWallet.address);
      } else {
        setWalletAddress("");
      }
    };

    fetchAddress();
  }, [selectedCrypto, selectedNetwork, user]);

  const handleAssetChange = (value: string) => {
    setSelectedCrypto(value);
    const networks = networkMap[value] || ["Mainnet"];
    setSelectedNetwork(networks[0]);
  };

  useEffect(() => {
    if (open) {
      const symbol = initialSymbol || "BTC";
      handleAssetChange(symbol);
    }
  }, [open, initialSymbol]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] p-0 bg-background border border-border shadow-lg gap-0 overflow-hidden">
        <DialogHeader className="p-4 flex flex-row items-center justify-between border-b border-border/50">
          <DialogTitle className="text-base font-bold text-foreground">
            Receive {ASSET_NAMES[selectedCrypto] || selectedCrypto}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-7 w-7 rounded-full text-foreground/50 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-4 space-y-4 bg-background">
          {/* Asset Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Asset</label>
            <Select value={selectedCrypto} onValueChange={handleAssetChange}>
              <SelectTrigger className="h-11 bg-muted/30 border-border/50 focus:ring-0 rounded-lg text-foreground">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <img 
                      src={cryptoIconUrls[selectedCrypto] || `https://ui-avatars.com/api/?name=${selectedCrypto}&background=random`} 
                      alt={selectedCrypto}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="font-bold text-sm text-foreground">
                      {ASSET_NAMES[selectedCrypto] || selectedCrypto}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent 
                className="rounded-lg max-h-[250px] overflow-y-auto bg-popover border-border"
                position="popper"
                sideOffset={4}
              >
                <ScrollArea className="h-full w-full">
                  {Object.entries(ASSET_NAMES).map(([symbol, name]) => (
                    <SelectItem key={symbol} value={symbol} className="rounded-md cursor-pointer text-foreground hover:bg-accent hover:text-accent-foreground">
                      <div className="flex items-center gap-2 py-1">
                        <img 
                          src={cryptoIconUrls[symbol] || 
                               (symbol === "ARB" ? "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/arbitrum.png" :
                                symbol === "OP" ? "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/optimism.png" :
                                `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol.toLowerCase()}.png`)} 
                          alt={symbol}
                          className="w-5 h-5 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${symbol}&background=random`;
                          }}
                        />
                        <span className="font-bold text-sm text-foreground">{name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Network Display */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Network</label>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="h-11 bg-muted/30 border-border/50 focus:ring-0 rounded-lg text-foreground">
                <SelectValue placeholder="Select a network" />
              </SelectTrigger>
              <SelectContent 
                className="rounded-lg bg-popover border-border"
                position="popper"
                sideOffset={4}
              >
                <ScrollArea className="h-full w-full">
                  {(networkMap[selectedCrypto] || ["Mainnet"]).map((network) => (
                    <SelectItem key={network} value={network} className="rounded-md text-foreground hover:bg-accent hover:text-accent-foreground">
                      <span className="font-medium text-sm text-foreground">{network}</span>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Deposit Address Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground">Deposit address</label>
            
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-border/10">
                <QRCodeCanvas
                  value={walletAddress || "No address"}
                  size={140}
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
                  <span className="text-xs font-bold text-foreground">
                    {ASSET_NAMES[selectedCrypto] || selectedCrypto} #1 ({selectedNetwork?.split(' ')[0] || selectedCrypto})
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyAddress}
                    className="h-7 w-7 text-foreground/50 hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg break-all text-sm font-mono text-foreground leading-relaxed tracking-tight border border-border/50 shadow-inner">
                  {walletAddress || "Generating address..."}
                </div>
              </div>
            </div>

            <div className="pt-1">
              <Button 
                variant="outline" 
                className="w-full h-10 rounded-lg border-border/50 text-foreground/40 font-bold bg-muted/10 text-xs hover:bg-muted/20"
                disabled
              >
                Deposit to your wallet
              </Button>
              <p className="text-[10px] text-destructive/80 text-center mt-2 leading-tight px-4 font-medium">
                Only send this exact asset to this address.
                Sending any other asset will result in permanent loss.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
