
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, CheckCircle2, Loader2, ArrowLeft, X } from "lucide-react";
import { getDepositAddress } from "@/lib/wallet-api";
import { useAuth } from "@/lib/auth-context";
import { QRCodeSVG } from "qrcode.react";
import { cryptoIconUrls } from "@/lib/crypto-icons";

interface ReceiveCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Array<{ symbol: string; name: string; icon: string }>;
}

type Step = "method" | "asset" | "details";

const networkMap: Record<string, string[]> = {
  BTC: ["Bitcoin (SegWit)"],
  ETH: ["Ethereum (ERC-20)"],
  SOL: ["Solana"],
  BNB: ["Binance Smart Chain (BEP-20)"],
  TRX: ["Tron (TRC-20)"],
  USDC: ["Ethereum (ERC-20)", "Solana (SPL)", "Polygon"],
  USDT: ["Ethereum (ERC-20)", "Tron (TRC-20)", "Binance Smart Chain (BEP-20)"],
};

export function ReceiveCryptoDialog({ open, onOpenChange, wallets }: ReceiveCryptoDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("method");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [depositAddress, setDepositAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedCrypto && user && step === "details") {
      loadDepositAddress();
    }
  }, [selectedCrypto, user, step]);

  useEffect(() => {
    if (selectedCrypto) {
      const networks = networkMap[selectedCrypto] || [];
      setSelectedNetwork(networks[0] || "");
    }
  }, [selectedCrypto]);

  const loadDepositAddress = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const address = await getDepositAddress(user.id, selectedCrypto);
      setDepositAddress(address);
    } catch (error) {
      console.error("Error loading deposit address:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("method");
      setSelectedMethod("");
      setSelectedCrypto("");
      setSelectedNetwork("");
      setDepositAddress("");
    }, 200);
  };

  const handleBack = () => {
    if (step === "details") {
      setStep("asset");
    } else if (step === "asset") {
      setStep("method");
    }
  };

  const selectedWallet = wallets.find(w => w.symbol === selectedCrypto);
  const networks = selectedCrypto ? (networkMap[selectedCrypto] || []) : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {step !== "method" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="flex-1 text-center">
              {step === "method" && "Select a receive method"}
              {step === "asset" && "Select an asset"}
              {step === "details" && `Receive ${selectedCrypto}`}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">

        {/* Method Selection Step */}
          {step === "method" && (
            <div className="space-y-4 px-1">
            <div>
              <h3 className="text-sm font-medium mb-3">Deposit using crypto</h3>
              <Button
                variant="outline"
                className="w-full h-auto py-4 px-4 justify-start bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
                onClick={() => {
                  setSelectedMethod("crypto");
                  setStep("asset");
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Receive crypto</div>
                    <div className="text-xs text-muted-foreground">From another crypto wallet</div>
                  </div>
                </div>
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Deposit crypto using fiat</h3>
              <Button
                variant="outline"
                className="w-full h-auto py-4 px-4 justify-start mb-2"
                onClick={() => {
                  setSelectedMethod("buy");
                  handleClose();
                  window.location.href = "/wallet/buy-crypto";
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Buy crypto</div>
                    <div className="text-xs text-muted-foreground">Buy crypto with Bank or Online wallet</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-4 px-4 justify-start"
                onClick={() => {
                  setSelectedMethod("p2p");
                  handleClose();
                  window.location.href = "/p2p";
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">P2P Trading</div>
                    <div className="text-xs text-muted-foreground">Buy crypto with Bank or Online wallet</div>
                  </div>
                </div>
              </Button>
            </div>
            </div>
          )}

          {/* Asset Selection Step */}
          {step === "asset" && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 px-1 pr-4">
                {wallets.map((wallet) => (
                  <Button
                    key={wallet.symbol}
                    variant="outline"
                    className={`w-full h-auto py-4 px-4 justify-start ${
                      selectedCrypto === wallet.symbol ? "bg-green-500/10 border-green-500/50" : ""
                    }`}
                    onClick={() => {
                      setSelectedCrypto(wallet.symbol);
                      setStep("details");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={cryptoIconUrls[wallet.symbol]} 
                        alt={wallet.symbol}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${wallet.symbol}&background=random`;
                        }}
                      />
                      <div className="text-left">
                        <div className="font-semibold">{wallet.symbol}</div>
                        <div className="text-xs text-muted-foreground">{wallet.name}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Details Step */}
          {step === "details" && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4 px-1 pr-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Asset</Label>
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.symbol} value={wallet.symbol}>
                          <span className="flex items-center gap-2">
                            <img 
                              src={cryptoIconUrls[wallet.symbol]} 
                              alt={wallet.symbol}
                              className="w-5 h-5 rounded-full"
                            />
                            <span>{wallet.symbol}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Network</Label>
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map((network) => (
                        <SelectItem key={network} value={network}>
                          {network}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Deposit address</Label>
                  
                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white rounded-lg relative">
                      <QRCodeSVG value={depositAddress} size={200} />
                      {/* Logo Overlay */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Display */}
                  <div className="p-3 bg-muted rounded-lg mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          {selectedCrypto} #{selectedNetwork.includes("SegWit") ? "1" : "1"} ({selectedNetwork.split(" ")[0]})
                        </div>
                        <code className="text-sm font-mono break-all">{depositAddress}</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopy}
                        className="ml-2"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Create New Address Button */}
                  <Button variant="outline" className="w-full mb-2">
                    Create a new address
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    You can generate a new address once the current one receives a blockchain transaction
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    <strong>Important:</strong> Only send {selectedCrypto} to this address on the {selectedNetwork} network. 
                    Sending other cryptocurrencies or using wrong network may result in permanent loss.
                  </p>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><strong>Minimum deposit:</strong> {selectedCrypto === 'BTC' ? '0.0001 BTC' : selectedCrypto === 'ETH' ? '0.001 ETH' : '1 ' + selectedCrypto}</p>
                  <p><strong>Confirmations required:</strong> {selectedCrypto === 'BTC' ? '3' : '12'} network confirmations</p>
                </div>
                  </div>
                </ScrollArea>
            )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
