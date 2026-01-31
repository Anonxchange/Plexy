
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { notificationSounds } from "@/lib/notification-sounds";

interface BuyerPaymentActionsProps {
  isPaid: boolean;
  trade: {
    id: string;
    status: string;
    crypto_symbol: string;
    buyer_paid_at?: string | null;
  };
  onTradeUpdate?: () => void;
  onShowCancelModal?: () => void;
}

export function BuyerPaymentActions({
  isPaid,
  trade,
  onTradeUpdate,
  onShowCancelModal,
}: BuyerPaymentActionsProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const [disputeCountdown, setDisputeCountdown] = useState<number>(3600); // 1 hour in seconds
  const [canDispute, setCanDispute] = useState(false);
  const [isDisputeExpanded, setIsDisputeExpanded] = useState(true);

  const handleMarkAsPaid = async () => {
    if (!trade.id || isProcessing) return;

    if (trade.status !== 'approved' && trade.status !== 'APPROVED_AWAITING_PAYMENT' && trade.status !== 'pending') {
      toast({
        title: "Waiting for approval",
        description: "You can only mark as paid after the seller approves the contract or the trade is active.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("p2p_trades")
        .update({
          buyer_paid_at: new Date().toISOString(),
        })
        .eq("id", trade.id);

      if (error) throw error;

      notificationSounds.play('message_received');
      toast({
        title: "Success",
        description: "Payment marked as sent.",
      });

      onTradeUpdate?.();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast({
        title: "Error",
        description: "Failed to update trade status",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!trade.buyer_paid_at) {
      setCanDispute(false);
      setDisputeCountdown(3600);
      return;
    }

    const updateDisputeTimer = () => {
      const paidTime = new Date(trade.buyer_paid_at).getTime();
      const elapsedMs = Date.now() - paidTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const remainingSeconds = Math.max(0, 3600 - elapsedSeconds);

      setDisputeCountdown(remainingSeconds);
      setCanDispute(remainingSeconds === 0);
    };

    updateDisputeTimer();
    const interval = setInterval(updateDisputeTimer, 1000);
    return () => clearInterval(interval);
  }, [trade.buyer_paid_at]);

  const formatDisputeTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Paid Button */}
      {!isPaid && (
        <Button
          onClick={handleMarkAsPaid}
          disabled={isProcessing || (trade.status !== 'approved' && trade.status !== 'APPROVED_AWAITING_PAYMENT')}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-4 h-auto rounded-lg shadow-md"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-base font-semibold">Paid</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-left w-full mt-1">
            <span className="text-xs opacity-90">Time left {formatTime(disputeCountdown)}</span>
          </div>
        </Button>
      )}

      {/* Keep all trades on platform warning */}
     

      {/* Dispute Section (shown after marking as paid) */}
      {isPaid && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <button
            onClick={() => setIsDisputeExpanded(!isDisputeExpanded)}
            className="w-full bg-muted p-3 flex items-center justify-between hover:bg-muted/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">⚖️</span>
              </div>
              <span className="font-semibold text-sm">Dispute</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                isDisputeExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isDisputeExpanded && (
            <div className="p-4 space-y-3">
              <div className="text-sm text-muted-foreground">
                Need help? <span className="font-semibold text-foreground">Start a dispute</span> if you run into an issue and are unable to resolve it.
              </div>

              <Button
                variant="outline"
                className="w-full"
                disabled={!canDispute || trade.status !== 'pending'}
              >
                <div className="w-full">
                  <div className="font-semibold">Start a Dispute</div>
                  {!canDispute && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Available in {formatDisputeTime(disputeCountdown)}
                    </div>
                  )}
                </div>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
