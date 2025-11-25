import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cryptoIconUrls } from "@/lib/crypto-icons";

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  currency: string;
  recipientValue: string;
  recipientName: string;
  recipientType: 'pexly-id' | 'email' | 'phone';
  recipientPexlyId?: string;
  onDone: () => void;
}

export function PaymentSuccessDialog({
  open,
  onOpenChange,
  amount,
  currency,
  recipientValue,
  recipientName,
  recipientType,
  recipientPexlyId,
  onDone,
}: PaymentSuccessDialogProps) {
  const { toast } = useToast();
  
  // Generate order ID (in production, this would come from backend)
  const orderId = `${Date.now()}${Math.random().toString(36).substring(2, 15)}`.toUpperCase();
  const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  const currencyIconUrl = cryptoIconUrls[currency as keyof typeof cryptoIconUrls] || cryptoIconUrls.BTC;

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    toast({
      title: "Copied!",
      description: "Order ID copied to clipboard",
    });
  };

  const maskString = (str: string, type: 'email' | 'phone' | 'pexly-id') => {
    if (type === 'email') {
      const [local, domain] = str.split('@');
      if (local.length <= 4) return `${local.substring(0, 1)}***@${domain}`;
      return `${local.substring(0, 4)}***@${domain}`;
    } else if (type === 'phone') {
      if (str.length <= 4) return str;
      return `${str.substring(0, 4)}***${str.substring(str.length - 2)}`;
    }
    return str;
  };

  const displayRecipient = recipientType === 'pexly-id' 
    ? recipientValue 
    : maskString(recipientValue, recipientType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Success Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
            <div className="relative bg-green-500/10 border-2 border-green-500/30 rounded-full p-6">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          </div>

          {/* Success Title */}
          <h2 className="text-2xl font-bold">Payment Successful</h2>

          {/* Amount Display */}
          <div className="flex items-center gap-3">
            <img 
              src={currencyIconUrl} 
              alt={currency}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${currency}&background=random`;
              }}
            />
            <span className="text-4xl font-bold">{amount} {currency}</span>
          </div>

          {/* Transaction Details */}
          <div className="w-full bg-muted/50 border border-border rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Receiver</span>
              <div className="flex flex-col items-end gap-1">
                <span className="font-medium">{displayRecipient}({recipientName})</span>
                {recipientPexlyId && (
                  <span className="text-xs text-muted-foreground">{recipientPexlyId} (Pexly ID)</span>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">Send</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment date</span>
              <span className="font-medium">{currentDate}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Order ID</span>
              <div className="flex items-center gap-2">
                <span className="font-medium font-mono text-xs">{orderId}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyOrderId}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold">{amount} {currency}</span>
            </div>

            <button className="text-primary hover:underline text-xs font-medium w-full text-right">
              View Details →
            </button>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3 pt-2">
            <Button
              variant="outline"
              className="w-full bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary"
              onClick={() => {
                // TODO: Navigate to referrals page
                toast({
                  title: "Coming Soon",
                  description: "Referral program launching soon!",
                });
              }}
            >
              🎁 Invite & Earn Rewards
            </Button>

            <Button
              className="w-full"
              onClick={onDone}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
