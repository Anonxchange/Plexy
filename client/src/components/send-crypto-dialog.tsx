
import { useState, useEffect } from "react";
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
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";
import { useAuth } from "@/lib/auth-context";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useSendFee } from "@/hooks/use-fees";
import { getCryptoPrices, convertCurrency } from "@/lib/crypto-prices";
import { useToast } from "@/hooks/use-toast";

interface SendCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Array<{ symbol: string; balance: number; name: string; icon: string }>;
  onSuccess?: () => void;
}

type Step = "select" | "details";

export function SendCryptoDialog({ open, onOpenChange, wallets, onSuccess }: SendCryptoDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("select");
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [toAddress, setToAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("NGN");
  const [amountInputMode, setAmountInputMode] = useState<"fiat" | "crypto">("fiat");
  const [cryptoAmount, setCryptoAmount] = useState<string>("");
  const [fiatAmount, setFiatAmount] = useState<string>("");
  const [cryptoPrice, setCryptoPrice] = useState<number>(0);
  const [useNonCustodial, setUseNonCustodial] = useState(false);
  const [userPassword, setUserPassword] = useState<string>("");

  const networkMap: Record<string, string[]> = {
    BTC: ["Bitcoin (SegWit)"],
    ETH: ["Ethereum (ERC-20)"],
    SOL: ["Solana"],
    BNB: ["Binance Smart Chain (BEP-20)"],
    TRX: ["Tron (TRC-20)"],
    USDC: ["Ethereum (ERC-20)", "Binance Smart Chain (BEP-20)", "Tron (TRC-20)", "Solana (SPL)"],
    USDT: ["Ethereum (ERC-20)", "Binance Smart Chain (BEP-20)", "Tron (TRC-20)", "Solana (SPL)"],
  };

  // Fetch crypto price when crypto is selected
  useEffect(() => {
    const fetchPrice = async () => {
      if (!selectedCrypto) return;
      
      try {
        const prices = await getCryptoPrices([selectedCrypto]);
        if (prices[selectedCrypto]) {
          const priceInSelectedCurrency = selectedCurrency === "NGN"
            ? await convertCurrency(prices[selectedCrypto].current_price, "NGN")
            : prices[selectedCrypto].current_price;
          setCryptoPrice(priceInSelectedCurrency);
        }
      } catch (error) {
        console.error("Error fetching crypto price:", error);
      }
    };

    fetchPrice();
  }, [selectedCrypto, selectedCurrency]);

  // Convert between fiat and crypto amounts
  useEffect(() => {
    if (!cryptoPrice || cryptoPrice === 0) {
      return;
    }

    if (amountInputMode === "fiat") {
      const fiatValue = parseFloat(amount);
      if (isNaN(fiatValue) || !amount) {
        setCryptoAmount("");
        return;
      }
      const calculatedCryptoAmount = fiatValue / cryptoPrice;
      setCryptoAmount(calculatedCryptoAmount.toFixed(8));
    } else {
      const cryptoValue = parseFloat(amount);
      if (isNaN(cryptoValue) || !amount) {
        setFiatAmount("");
        return;
      }
      const calculatedFiatAmount = cryptoValue * cryptoPrice;
      setFiatAmount(calculatedFiatAmount.toFixed(2));
    }
  }, [amount, cryptoPrice, amountInputMode]);

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

  const selectedWallet = wallets.find(w => w.symbol === selectedCrypto);
  
  // Get network-specific symbol for fee calculation
  const networkSpecificSymbol = selectedCrypto && selectedNetwork 
    ? getNetworkSpecificSymbol(selectedCrypto, selectedNetwork)
    : selectedCrypto;
  
  // Use crypto amount for fee calculation
  const cryptoAmountForFee = amountInputMode === "crypto" 
    ? parseFloat(amount) || 0 
    : parseFloat(cryptoAmount) || 0;
  
  const { data: feeData, isLoading: feeLoading, error: feeError } = useSendFee(
    networkSpecificSymbol || '',
    cryptoAmountForFee,
    false // assuming external send, set to true for internal transfers
  );
  
  const networkFee = feeData?.networkFee || 0;
  const total = (cryptoAmountForFee || 0) + (networkFee || 0);

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

    const cryptoAmountNum = amountInputMode === "crypto" 
      ? parseFloat(amount) 
      : parseFloat(cryptoAmount);
      
    if (isNaN(cryptoAmountNum) || cryptoAmountNum <= 0) {
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
      
      // Force non-custodial logic as we no longer support custodial sends
      const wallets = nonCustodialWalletManager.getNonCustodialWallets(user.id);
      const nonCustWallet = wallets.find(w => w.chainId === "ethereum"); // Default to eth for now as per schema
      if (!nonCustWallet) {
        setError("Non-custodial wallet not found. Please create one in your wallet settings first.");
        setLoading(false);
        return;
      }
      
      // Sign transaction client-side (private key never leaves browser)
      const txData = {
        to: toAddress,
        amount: cryptoAmountNum,
        symbol: symbolToUse,
      };
      
      // Auto-decrypt with empty password (no password required by default)
      const signedTx = await nonCustodialWalletManager.signTransaction(nonCustWallet.id, txData, "", user.id);
      console.log("Signed Transaction:", signedTx);
      
      // In a non-custodial architecture, we provide the signed transaction for the user to broadcast
      // or we broadcast it to a public provider. We do not use the custodial backend.
      toast({ 
        title: "Transaction Signed!", 
        description: "Your transaction has been signed locally. In this demo, it is logged to the console." 
      });
      
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
    setCryptoAmount("");
    setFiatAmount("");
    setNotes("");
    setSelectedNetwork("");
    setSelectedCurrency("NGN");
    setAmountInputMode("fiat");
    setCryptoPrice(0);
    setError("");
    setSuccess(false);
    setUseNonCustodial(false);
    setUserPassword("");
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
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Your transaction will be signed locally in your browser. No password required by default.
              </p>
            </div>
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
                <div className="flex gap-2">
                  {amountInputMode === "fiat" ? (
                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">NGN</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="w-24 h-8 flex items-center justify-center text-xs font-medium border rounded-md px-3">
                      {selectedCrypto}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAmountInputMode(amountInputMode === "fiat" ? "crypto" : "fiat");
                      setAmount("");
                    }}
                    className="h-8 text-xs"
                  >
                    Switch
                  </Button>
                </div>
              </div>
              <div className="text-center py-4">
                <Input
                  type="number"
                  step={amountInputMode === "crypto" ? "0.00000001" : "0.01"}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-4xl font-bold text-center border-0 bg-transparent h-auto p-0"
                />
                {amountInputMode === "fiat" && cryptoAmount && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ≈ {cryptoAmount} {selectedCrypto}
                  </p>
                )}
                {amountInputMode === "crypto" && fiatAmount && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ≈ {selectedCurrency} {fiatAmount}
                  </p>
                )}
                {selectedWallet && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Available: {selectedWallet.balance.toFixed(8)} {selectedCrypto}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedWallet) {
                      if (amountInputMode === "fiat" && cryptoPrice) {
                        const maxFiatAmount = selectedWallet.balance * cryptoPrice;
                        setAmount(maxFiatAmount.toFixed(2));
                      } else {
                        setAmount(selectedWallet.balance.toFixed(8));
                      }
                    }
                  }}
                  className="mt-2"
                  disabled={amountInputMode === "fiat" && !cryptoPrice}
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
            {cryptoAmountForFee > 0 && selectedCrypto && selectedNetwork && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{cryptoAmountForFee.toFixed(8)} {selectedCrypto}</span>
                </div>
                {feeLoading ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calculating fees...</span>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : feeData ? (
                  <>
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
                  </>
                ) : feeError ? (
                  <div className="flex justify-between">
                    <span className="text-destructive text-xs">Error calculating fee: {feeError.message}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Enter an amount to see fees</span>
                  </div>
                )}
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
