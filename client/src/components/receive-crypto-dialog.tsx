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
  const [walletAddress, setWalletAddress] = useState<string>("");

  useEffect(() => {
    if (open) {
      const symbol = initialSymbol || wallets[0]?.symbol || "BTC";
      setSelectedCrypto(symbol);
    }
  }, [open, initialSymbol, wallets]);

  useEffect(() => {
    if (!selectedCrypto || !user) {
      setWalletAddress("");
      return;
    }

    const userWallets = nonCustodialWalletManager.getNonCustodialWallets(user.id);
    const targetWallet = userWallets.find(w => w.chainId === selectedCrypto);
    
    if (targetWallet) {
      setWalletAddress(targetWallet.address);
    } else {
      setWalletAddress("");
    }
  }, [selectedCrypto, user]);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const networkMap: Record<string, string> = {
    BTC: "Bitcoin (SegWit)",
    ETH: "Ethereum (ERC-20)",
    SOL: "Solana",
    BNB: "Binance Smart Chain (BEP-20)",
    TRX: "Tron (TRC-20)",
    USDT: "Ethereum (ERC-20)",
    USDC: "Ethereum (ERC-20)",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] p-0 bg-background border-none gap-0 overflow-hidden">
        <DialogHeader className="p-4 flex flex-row items-center justify-between border-b border-border/50">
          <DialogTitle className="text-base font-bold">
            Receive {selectedCrypto}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-7 w-7 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Asset Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/70">Asset</label>
            <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
              <SelectTrigger className="h-11 bg-muted/30 border-border/50 focus:ring-0 rounded-lg">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <img 
                      src={cryptoIconUrls[selectedCrypto] || `https://ui-avatars.com/api/?name=${selectedCrypto}&background=random`} 
                      alt={selectedCrypto}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="font-bold text-sm">{selectedCrypto}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-lg max-h-[250px] overflow-y-auto">
                {wallets
                  .filter(wallet => wallet.symbol && !["success", "message", "timestamp", "status"].includes(wallet.symbol.toLowerCase()))
                  .map((wallet) => (
                  <SelectItem key={wallet.symbol} value={wallet.symbol} className="rounded-md">
                    <div className="flex items-center gap-2 py-0.5">
                      <img 
                        src={cryptoIconUrls[wallet.symbol] || `https://ui-avatars.com/api/?name=${wallet.symbol}&background=random`} 
                        alt={wallet.symbol}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="font-bold text-sm">{wallet.symbol}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Network Display */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/70">Network</label>
            <div className="h-11 px-3 flex items-center bg-muted/20 border border-border/30 rounded-lg text-foreground/40 font-medium text-sm">
              {networkMap[selectedCrypto] || "Mainnet"}
            </div>
          </div>

          {/* Deposit Address Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-foreground/70">Deposit address</label>
            
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-border/10">
                <QRCodeCanvas
                  value={walletAddress || "No address"}
                  size={140}
                  level="M"
                  includeMargin={false}
                  imageSettings={{
                    src: cryptoIconUrls[selectedCrypto],
                    x: undefined,
                    y: undefined,
                    height: 30,
                    width: 30,
                    excavate: true,
                  }}
                />
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{selectedCrypto} #1 ({networkMap[selectedCrypto]?.split(' ')[0] || selectedCrypto})</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyAddress}
                    className="h-7 w-7 text-foreground/50 hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="p-2.5 bg-muted/10 rounded-lg break-all text-[11px] font-mono text-foreground/80 leading-normal tracking-tight border border-border/50">
                  {walletAddress || "Generating address..."}
                </div>
              </div>
            </div>

            <div className="pt-1">
              <Button 
                variant="outline" 
                className="w-full h-10 rounded-lg border-border/50 text-foreground/40 font-bold bg-muted/10 text-xs"
                disabled
              >
                Create a new address
              </Button>
              <p className="text-[10px] text-destructive/80 text-center mt-2 leading-tight px-4">
                You can generate a new address once the current one receives a blockchain transaction
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
