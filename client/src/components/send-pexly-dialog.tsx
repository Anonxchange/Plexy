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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { cryptoIconUrls } from "@/lib/crypto-icons";

interface SendPexlyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const currencies = [
  { symbol: "BTC", name: "Bitcoin", iconUrl: cryptoIconUrls.BTC },
  { symbol: "ETH", name: "Ethereum", iconUrl: cryptoIconUrls.ETH },
  { symbol: "USDT", name: "Tether", iconUrl: cryptoIconUrls.USDT },
  { symbol: "USDC", name: "USD Coin", iconUrl: cryptoIconUrls.USDC },
  { symbol: "SOL", name: "Solana", iconUrl: cryptoIconUrls.SOL },
  { symbol: "TON", name: "Toncoin", iconUrl: cryptoIconUrls.TON },
  { symbol: "XMR", name: "Monero", iconUrl: cryptoIconUrls.XMR },
];

export function SendPexlyDialog({ open, onOpenChange }: SendPexlyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pexly-id");
  const [recipientValue, setRecipientValue] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [step, setStep] = useState<"recipient" | "amount" | "confirm">("recipient");

  const handleNext = () => {
    if (step === "recipient") {
      if (!recipientValue) {
        toast({
          title: "Error",
          description: "Please enter a recipient",
          variant: "destructive",
        });
        return;
      }
      setStep("amount");
    } else if (step === "amount") {
      if (!amount || parseFloat(amount) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }
      setStep("confirm");
    } else {
      toast({
        title: "Success",
        description: "Transfer initiated successfully",
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setRecipientValue("");
    setAmount("");
    setSelectedCurrency("USDT");
    setStep("recipient");
    onOpenChange(false);
  };

  const selectedCurrencyData = currencies.find(c => c.symbol === selectedCurrency);

  return (
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

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your friends haven't activated Pexly Pay yet? Invite them now and earn up to 250 USDT!{" "}
                <span className="text-primary font-medium cursor-pointer">Refer Now</span>
              </AlertDescription>
            </Alert>

            <Button onClick={handleNext} className="w-full">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
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
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {selectedCurrency}
                </span>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium">{recipientValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium">Free</span>
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
                <span className="font-medium">{recipientValue}</span>
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
              <Button variant="outline" onClick={() => setStep("amount")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Confirm Transfer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
