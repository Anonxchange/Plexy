
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Loader2, CheckCircle2, X, Copy } from "lucide-react";
import { sendCrypto } from "@/lib/wallet-api";
import { useAuth } from "@/lib/auth-context";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useSendFee } from "@/hooks/use-fees";

interface SendCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Array<{ symbol: string; balance: number; name: string; icon: string }>;
  onSuccess?: () => void;
}

type Step = "select" | "details";

export function SendCryptoDialog({ open, onOpenChange, wallets, onSuccess }: SendCryptoDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("select");
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const selectedWallet = wallets.find(w => w.symbol === selectedCrypto);
  
  // Get network-specific symbol for fee calculation
  const networkSpecificSymbol = getNetworkSpecificSymbol(selectedCrypto, selectedNetwork);
  
  // Use the fee system to calculate fees
  const { data: feeData, isLoading: feeLoading } = useSendFee(
    networkSpecificSymbol,
    parseFloat(amount) || 0,
    false // assuming external send, set to true for internal transfers
  );
  
  const fee = feeData?.totalFee || 0;
  const total = parseFloat(amount) + fee || 0;

  const networkMap: Record<string, string[]> = {
    BTC: ["Bitcoin (SegWit)"],
    ETH: ["Ethereum (ERC-20)"],
    SOL: ["Solana"],
    BNB: ["Binance Smart Chain (BEP-20)"],
    TRX: ["Tron (TRC-20)"],
    USDC: ["Ethereum (ERC-20)", "Binance Smart Chain (BEP-20)", "Tron (TRC-20)", "Solana (SPL)"],
    USDT: ["Ethereum (ERC-20)", "Binance Smart Chain (BEP-20)", "Tron (TRC-20)", "Solana (SPL)"],
  };

  const getNetworkSpecificSymbol = (crypto: string, network: string): string => {
    // For USDT and USDC, append network suffix based on selection
    if (crypto === 'USDT' || crypto === 'USDC') {
      if (network.includes('ERC-20')) return `${crypto}-ERC20`;
      if (network.includes('BEP-20')) return `${crypto}-BEP20`;
      if (network.includes('TRC-20')) return `${crypto}-TRC20`;
      if (network.includes('SPL')) return `${crypto}-SOL`;
    }
    // For native coins, return as-is
    return crypto;
  };

  const handleSelectCrypto = (symbol: string) => {
    setSelectedCrypto(symbol);
    const networks = networkMap[symbol] || [];
    setSelectedNetwork(networks[0] || "");
    setStep("details");
  };

  const handleSend = async () => {
    if (!user) return;
    if (!selectedCrypto || !toAddress || !amount) {
      setError("Please fill in all required fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (selectedWallet && total > selectedWallet.balance) {
      setError("Insufficient balance");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const symbolToUse = getNetworkSpecificSymbol(selectedCrypto, selectedNetwork);
      await sendCrypto(user.id, symbolToUse, toAddress, amountNum, notes);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to send crypto");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToAddress(text);
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  };

  const resetForm = () => {
    setStep("select");
    setSelectedCrypto("");
    setToAddress("");
    setAmount("");
    setNotes("");
    setSelectedNetwork("");
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>
            {step === "select" ? "Select an asset" : `Send ${selectedCrypto}`}
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

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Transaction Initiated!</h3>
            <p className="text-sm text-muted-foreground text-center">
              Your crypto is being sent. Check your transactions for status.
            </p>
          </div>
        ) : step === "select" ? (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {wallets.map((wallet) => (
                <Button
                  key={wallet.symbol}
                  variant="ghost"
                  className="w-full h-auto py-4 px-4 justify-start hover:bg-primary/10"
                  onClick={() => handleSelectCrypto(wallet.symbol)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <img 
                      src={cryptoIconUrls[wallet.symbol]} 
                      alt={wallet.symbol}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${wallet.symbol}&background=random`;
                      }}
                    />
                    <div className="text-left flex-1">
                      <div className="font-semibold">{wallet.symbol}</div>
                      <div className="text-xs text-muted-foreground">{wallet.name}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Asset</Label>
              <Select value={selectedCrypto} onValueChange={(value) => {
                setSelectedCrypto(value);
                const networks = networkMap[value] || [];
                setSelectedNetwork(networks[0] || "");
              }}>
                <SelectTrigger className="h-12 bg-muted">
                  <div className="flex items-center gap-2">
                    {selectedWallet && (
                      <>
                        <img 
                          src={cryptoIconUrls[selectedCrypto]} 
                          alt={selectedCrypto}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${selectedCrypto}&background=random`;
                          }}
                        />
                        <span>{selectedCrypto}</span>
                      </>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.symbol} value={wallet.symbol}>
                      <div className="flex items-center gap-2">
                        <img 
                          src={cryptoIconUrls[wallet.symbol]} 
                          alt={wallet.symbol}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${wallet.symbol}&background=random`;
                          }}
                        />
                        <span>{wallet.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Receiver address or Pexly username
              </Label>
              <div className="relative">
                <Input
                  placeholder="Enter address or username"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  className="h-12 pr-20 bg-muted"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePaste}
                  className="absolute right-2 top-2 h-8"
                >
                  Paste
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Network</Label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger className="h-12 bg-muted">
                  <SelectValue placeholder="Select a network" />
                </SelectTrigger>
                <SelectContent>
                  {(networkMap[selectedCrypto] || []).map((network) => (
                    <SelectItem key={network} value={network}>
                      {network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Enter amount in</Label>
                <Select defaultValue="NGN">
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-center py-4">
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-4xl font-bold text-center border-0 bg-transparent h-auto p-0"
                />
                {selectedWallet && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Available: {selectedWallet.balance.toFixed(8)} {selectedCrypto}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedWallet && setAmount(selectedWallet.balance.toString())}
                  className="mt-2"
                >
                  Max
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Remarks (optional)</Label>
              <Input
                placeholder="Add a note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-12 bg-muted"
              />
            </div>

            {/* Fee Breakdown */}
            {feeData && parseFloat(amount) > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{parseFloat(amount).toFixed(8)} {selectedCrypto}</span>
                </div>
                {feeData.platformFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span>{feeData.platformFee.toFixed(8)} {selectedCrypto}</span>
                  </div>
                )}
                {feeData.networkFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span>{feeData.networkFee.toFixed(8)} {selectedCrypto}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">{total.toFixed(8)} {selectedCrypto}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-12"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                className="flex-1 h-12"
                disabled={loading || !selectedCrypto || !toAddress || !amount}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
