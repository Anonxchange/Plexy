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
import { Copy, Download, X } from "lucide-react";
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
      const symbol = initialSymbol || wallets[0]?.symbol || "";
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

  const selectedWallet = wallets.find(w => w.symbol === selectedCrypto);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleSaveQR = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const url = (canvas as HTMLCanvasElement).toDataURL();
      const link = document.createElement("a");
      link.download = `${selectedCrypto}-receive-qr.png`;
      link.href = url;
      link.click();
      toast({
        title: "Success",
        description: "QR code saved to downloads",
      });
    }
  };

  const handleClose = () => {
    setSelectedCrypto("");
    setWalletAddress("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>
            Receive {selectedCrypto}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Asset</label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger className="h-12 bg-muted">
                  <div className="flex items-center gap-2">
                    {selectedWallet && (
                      <>
                        <img 
                          src={cryptoIconUrls[selectedCrypto] || `https://ui-avatars.com/api/?name=${selectedCrypto}&background=random`} 
                          alt={selectedCrypto}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${selectedCrypto}&background=random`;
                          }}
                        />
                        <span>{selectedCrypto} - {selectedWallet.name}</span>
                      </>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {wallets
                    .filter(wallet => wallet.symbol && !["success", "message", "timestamp", "status"].includes(wallet.symbol.toLowerCase()))
                    .map((wallet) => (
                    <SelectItem key={wallet.symbol} value={wallet.symbol}>
                      <div className="flex items-center gap-2">
                        <img 
                          src={cryptoIconUrls[wallet.symbol] || `https://ui-avatars.com/api/?name=${wallet.symbol}&background=random`} 
                          alt={wallet.symbol}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${wallet.symbol}&background=random`;
                          }}
                        />
                        <span>{wallet.symbol} - {wallet.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {walletAddress ? (
              <>
                <div className="flex justify-center">
                  <div className="bg-white p-6 rounded-lg">
                    <QRCodeCanvas
                      value={walletAddress}
                      size={200}
                      level="H"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium block">Wallet Address</label>
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                    <span className="text-sm break-all flex-1 font-mono">
                      {walletAddress}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyAddress}
                      className="h-8 w-8 shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Send only {selectedCrypto} to this address. Sending other assets may result in permanent loss.
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopyAddress}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Address
                  </Button>
                  <Button onClick={handleSaveQR} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Save QR Code
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {selectedCrypto 
                    ? `No wallet address found for ${selectedCrypto}. Please set up your wallet first.`
                    : "Select an asset to view your receiving address."}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
