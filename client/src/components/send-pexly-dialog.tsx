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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, ArrowRight, Loader2, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { createClient } from "@/lib/supabase";
import type { Wallet } from "@/lib/wallet-api";
import { sendPexlyPayment } from "@/lib/wallet-api";
import { PaymentSuccessDialog } from "./payment-success-dialog";
import { getCryptoPrices } from "@/lib/crypto-prices";
import { useQueryClient } from "@tanstack/react-query";

interface SendPexlyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableWallets?: Wallet[];
}

export function SendPexlyDialog({ open, onOpenChange, availableWallets = [] }: SendPexlyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pexly-id");
  const [recipientValue, setRecipientValue] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPexlyId, setRecipientPexlyId] = useState("");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [lookingUpRecipient, setLookingUpRecipient] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState("");
  const [fiatAmount, setFiatAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(availableWallets[0]?.crypto_symbol || "USDT");
  const [amountInputMode, setAmountInputMode] = useState<"crypto" | "fiat">("fiat");
  const [cryptoPrice, setCryptoPrice] = useState<number>(0);
  const [step, setStep] = useState<"recipient" | "amount" | "confirm">("recipient");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Build currencies from available wallets
  const currencies = availableWallets.map(wallet => ({
    symbol: wallet.crypto_symbol,
    name: wallet.crypto_symbol,
    iconUrl: cryptoIconUrls[wallet.crypto_symbol as keyof typeof cryptoIconUrls] || cryptoIconUrls.BTC,
    balance: wallet.balance,
  }));

  // Fetch crypto price when currency changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (!selectedCurrency) return;
      
      try {
        const prices = await getCryptoPrices([selectedCurrency]);
        if (prices[selectedCurrency]) {
          setCryptoPrice(prices[selectedCurrency].current_price);
        }
      } catch (error) {
        console.error("Error fetching crypto price:", error);
      }
    };

    fetchPrice();
  }, [selectedCurrency]);

  // Convert between fiat and crypto amounts
  useEffect(() => {
    if (!cryptoPrice || cryptoPrice === 0) {
      return;
    }

    if (amountInputMode === "fiat") {
      const fiatValue = parseFloat(fiatAmount);
      if (isNaN(fiatValue) || !fiatAmount) {
        setAmount("");
        return;
      }
      const calculatedCryptoAmount = fiatValue / cryptoPrice;
      setAmount(calculatedCryptoAmount.toFixed(8));
    } else {
      const cryptoValue = parseFloat(amount);
      if (isNaN(cryptoValue) || !amount) {
        setFiatAmount("");
        return;
      }
      const calculatedFiatAmount = cryptoValue * cryptoPrice;
      setFiatAmount(calculatedFiatAmount.toFixed(2));
    }
  }, [amount, fiatAmount, cryptoPrice, amountInputMode]);

  const lookupRecipient = async (value: string, type: 'pexly-id' | 'email' | 'phone') => {
    if (!value) return;
    
    setLookingUpRecipient(true);
    try {
      let query = supabase.from('user_profiles').select('username, pexly_pay_id, id, email, phone_number');
      
      if (type === 'pexly-id') {
        query = query.eq('pexly_pay_id', value);
      } else if (type === 'email') {
        // Look up by email directly from user_profiles
        query = query.eq('email', value.toLowerCase());
      } else if (type === 'phone') {
        // Look up by phone_number directly from user_profiles
        query = query.eq('phone_number', value);
      }
      
      const { data, error } = await query.single();
      
      if (!error && data) {
        setRecipientName(data.username);
        setRecipientPexlyId(data.pexly_pay_id || '');
        setRecipientUserId(data.id);
      } else {
        setRecipientName("");
        setRecipientPexlyId("");
        setRecipientUserId("");
        toast({
          title: "User not found",
          description: `No user found with this ${type}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error looking up recipient:', error);
      setRecipientName("");
    } finally {
      setLookingUpRecipient(false);
    }
  };

  const handleNext = async () => {
    if (step === "recipient") {
      if (!recipientValue) {
        toast({
          title: "Error",
          description: "Please enter a recipient",
          variant: "destructive",
        });
        return;
      }
      
      // Look up recipient before proceeding
      await lookupRecipient(recipientValue, activeTab as any);
      setStep("amount");
    } else if (step === "amount") {
      const selectedWallet = availableWallets.find(w => w.crypto_symbol === selectedCurrency);
      const requestedAmount = parseFloat(amount);
      
      console.log('Balance check:', {
        wallet: selectedWallet?.crypto_symbol,
        available: selectedWallet?.balance,
        requested: requestedAmount,
        locked: selectedWallet?.locked_balance
      });
      
      if (!selectedWallet) {
        toast({
          title: "Wallet not found",
          description: `${selectedCurrency} wallet not found`,
          variant: "destructive",
        });
        return;
      }
      
      if (selectedWallet.balance < requestedAmount) {
        toast({
          title: "Insufficient balance",
          description: `Available: ${selectedWallet.balance.toFixed(8)} ${selectedCurrency}\nRequired: ${requestedAmount.toFixed(8)} ${selectedCurrency}`,
          variant: "destructive",
        });
        return;
      }
      
      if (!amount || requestedAmount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }
      setStep("confirm");
    } else {
      if (!user?.id || !recipientUserId) {
        toast({
          title: "Error",
          description: "Missing user information",
          variant: "destructive",
        });
        return;
      }

      setProcessing(true);
      
      const result = await sendPexlyPayment(
        user.id,
        recipientUserId,
        parseFloat(amount),
        selectedCurrency,
        `Pexly Pay transfer to ${recipientName || recipientValue}`
      );

      setProcessing(false);

      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ['wallets'] });
        
        onOpenChange(false);
        setShowSuccessDialog(true);
      } else {
        toast({
          title: "Transfer Failed",
          description: result.error || "Failed to process transfer",
          variant: "destructive",
        });
      }
    }
  };

  const handleClose = () => {
    setRecipientValue("");
    setRecipientName("");
    setRecipientPexlyId("");
    setRecipientUserId("");
    setAmount("");
    setFiatAmount("");
    setSelectedCurrency(availableWallets[0]?.crypto_symbol || "USDT");
    setAmountInputMode("fiat");
    setStep("recipient");
    setProcessing(false);
    onOpenChange(false);
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    handleClose();
  };

  const selectedCurrencyData = currencies.find(c => c.symbol === selectedCurrency);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "recipient" && "Send to Pexly user"}
              {step === "amount" && "Enter amount"}
              {step === "confirm" && "Confirm transfer"}
            </DialogTitle>
          </DialogHeader>

        {step === "recipient" && (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pexly-id">Pexly ID</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>
              <TabsContent value="pexly-id" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pexly-id">Pexly ID</Label>
                  <Input
                    id="pexly-id"
                    placeholder="Enter Pexly ID"
                    value={recipientValue}
                    onChange={(e) => setRecipientValue(e.target.value)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={recipientValue}
                    onChange={(e) => setRecipientValue(e.target.value)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="phone" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={recipientValue}
                    onChange={(e) => setRecipientValue(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {recipientName && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                  User found: <strong>{recipientName}</strong>
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your friends haven't activated Pexly Pay yet? Invite them now and earn up to 250 USDT!{" "}
                <span className="text-primary font-medium cursor-pointer">Refer Now</span>
              </AlertDescription>
            </Alert>

            <Button onClick={handleNext} className="w-full" disabled={lookingUpRecipient}>
              {lookingUpRecipient ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Looking up user...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === "amount" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Select Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {selectedCurrencyData && (
                        <>
                          <img 
                            src={selectedCurrencyData.iconUrl} 
                            alt={selectedCurrencyData.symbol}
                            className="w-5 h-5 rounded-full"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${selectedCurrencyData.symbol}&background=random`;
                            }}
                          />
                          <span>{selectedCurrencyData.symbol}</span>
                        </>
                      )}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.symbol} value={currency.symbol}>
                      <div className="flex items-center gap-2">
                        <img 
                          src={currency.iconUrl} 
                          alt={currency.symbol}
                          className="w-5 h-5 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${currency.symbol}&background=random`;
                          }}
                        />
                        <span>{currency.name}</span>
                        <span className="text-muted-foreground">({currency.symbol})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAmountInputMode(amountInputMode === "fiat" ? "crypto" : "fiat")}
                  className="h-7 gap-1 text-xs"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {amountInputMode === "fiat" ? "USD" : selectedCurrency}
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amountInputMode === "fiat" ? fiatAmount : amount}
                  onChange={(e) => {
                    if (amountInputMode === "fiat") {
                      setFiatAmount(e.target.value);
                    } else {
                      setAmount(e.target.value);
                    }
                  }}
                  min="0"
                  step={amountInputMode === "fiat" ? "0.01" : "0.00000001"}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {amountInputMode === "fiat" ? "USD" : selectedCurrency}
                </span>
              </div>
              {amountInputMode === "fiat" && amount && (
                <p className="text-xs text-muted-foreground">
                  ≈ {amount} {selectedCurrency}
                </p>
              )}
              {amountInputMode === "crypto" && fiatAmount && (
                <p className="text-xs text-muted-foreground">
                  ≈ ${fiatAmount} USD
                </p>
              )}
            </div>

            <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient</span>
                <div className="flex flex-col items-end">
                  <span className="font-medium">{recipientValue}</span>
                  {recipientName && (
                    <span className="text-xs text-muted-foreground">{recipientName}</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Balance</span>
                <span className="font-medium text-green-600">
                  {selectedCurrencyData?.balance.toFixed(8) || '0.00000000'} {selectedCurrency}
                </span>
              </div>
              {parseFloat(amount) > 0 && selectedCurrencyData && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">After Transfer</span>
                  <span className={`font-medium ${(selectedCurrencyData.balance - parseFloat(amount)) >= 0 ? 'text-muted-foreground' : 'text-red-600'}`}>
                    {(selectedCurrencyData.balance - parseFloat(amount)).toFixed(8)} {selectedCurrency}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("recipient")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <div className="flex flex-col items-end">
                  <span className="font-medium">{recipientValue}</span>
                  {recipientName && (
                    <span className="text-xs text-muted-foreground">{recipientName}</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Amount</span>
                <div className="flex items-center gap-2">
                  {selectedCurrencyData && (
                    <img 
                      src={selectedCurrencyData.iconUrl} 
                      alt={selectedCurrencyData.symbol}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${selectedCurrencyData.symbol}&background=random`;
                      }}
                    />
                  )}
                  <span className="text-2xl font-bold">{amount} {selectedCurrency}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-medium">Total</span>
                <div className="flex items-center gap-2">
                  {selectedCurrencyData && (
                    <img 
                      src={selectedCurrencyData.iconUrl} 
                      alt={selectedCurrencyData.symbol}
                      className="w-5 h-5 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${selectedCurrencyData.symbol}&background=random`;
                      }}
                    />
                  )}
                  <span className="text-xl font-bold">{amount} {selectedCurrency}</span>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This transfer will be instant and free of charge.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep("amount")} 
                className="flex-1"
                disabled={processing}
              >
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="flex-1"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Transfer"
                )}
              </Button>
            </div>
          </div>
        )}
        </DialogContent>
      </Dialog>

      <PaymentSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        amount={amount}
        currency={selectedCurrency}
        recipientValue={recipientValue}
        recipientName={recipientName}
        recipientType={activeTab as any}
        recipientPexlyId={recipientPexlyId}
        onDone={handleSuccessClose}
      />
    </>
  );
}
