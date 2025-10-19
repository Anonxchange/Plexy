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
import { Copy, Download, Edit } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { QRCodeCanvas } from "qrcode.react";
import { cryptoIconUrls } from "@/lib/crypto-icons";

interface ReceivePexlyDialogProps {
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

export function ReceivePexlyDialog({ open, onOpenChange }: ReceivePexlyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [showAmountInput, setShowAmountInput] = useState(false);

  const pexlyId = user?.id?.slice(0, 8) || "12345678";
  const maskedContact = user?.email 
    ? `${user.email.slice(0, 4)}***@****`
    : "user***@****";

  const qrData = JSON.stringify({
    type: "pexly_pay",
    userId: user?.id,
    pexlyId: pexlyId,
    amount: amount || undefined,
    currency: selectedCurrency,
  });

  const selectedCurrencyData = currencies.find(c => c.symbol === selectedCurrency);

  const handleCopyId = () => {
    navigator.clipboard.writeText(pexlyId);
    toast({
      title: "Copied",
      description: "Pexly ID copied to clipboard",
    });
  };

  const handleSaveQR = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL();
      const link = document.createElement("a");
      link.download = `pexly-pay-qr-${pexlyId}.png`;
      link.href = url;
      link.click();
      toast({
        title: "Success",
        description: "QR code saved to downloads",
      });
    }
  };

  const handleSetAmount = () => {
    if (amount && parseFloat(amount) > 0) {
      setShowAmountInput(false);
      toast({
        title: "Amount set",
        description: `Request amount: ${amount} ${selectedCurrency}`,
      });
    }
  };

  const handleClose = () => {
    setAmount("");
    setSelectedCurrency("USDT");
    setShowAmountInput(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Receive</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="font-medium">{maskedContact}</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground">
                {pexlyId}(Pexly ID)
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopyId}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-lg">
              <QRCodeCanvas
                value={qrData}
                size={200}
                level="H"
              />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Pay me via this QR code
          </p>

          {showAmountInput ? (
            <div className="space-y-3">
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
                <Label htmlFor="request-amount">Request Amount</Label>
                <div className="relative">
                  <Input
                    id="request-amount"
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAmountInput(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleSetAmount} className="flex-1">
                  Set Amount
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAmountInput(true)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Set amount
              </Button>
              <Button onClick={handleSaveQR} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Save QR Code
              </Button>
            </div>
          )}

          {amount && !showAmountInput && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">Request amount</p>
              <div className="flex items-center justify-center gap-2">
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
                <p className="text-2xl font-bold">{amount} {selectedCurrency}</p>
              </div>
            </div>
          )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
