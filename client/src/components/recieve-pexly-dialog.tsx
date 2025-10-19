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
import { Copy, Download, Edit } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { QRCodeCanvas } from "qrcode.react";

interface ReceivePexlyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceivePexlyDialog({ open, onOpenChange }: ReceivePexlyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
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
  });

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
        description: `Request amount: ${amount} USD`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive</DialogTitle>
        </DialogHeader>

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
                <Label htmlFor="request-amount">Request Amount (USD)</Label>
                <Input
                  id="request-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
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
              <p className="text-2xl font-bold">{amount} USD</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
