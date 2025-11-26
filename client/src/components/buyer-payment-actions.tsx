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
    seller_released_at?: string | null;
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

  // Placeholder for timer formatting, assuming it's passed or derived elsewhere
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };


  return (
    <div className="space-y-4">
      {/* Payment Time Warning - bigger text like "please make payment" */}
      {!isPaid && (
        <div className="bg-muted/50 p-4 rounded-lg border border-primary/30">
          <div className="text-base sm:text-lg font-medium">
            <span className="font-semibold">Once you've made the payment,</span> be sure to click{' '}
            <span className="font-bold text-primary">Paid</span> within the given time limit. Otherwise the trade will be automatically canceled.
          </div>
        </div>
      )}

      {/* Paid Button - tiny with nice style */}
      {!isPaid && (
        <Button
          onClick={handleMarkAsPaid}
          disabled={isProcessing || trade.status !== 'pending'}
          size="sm"
          className="px-6 py-2 h-9 bg-green-600 hover:bg-green-700 text-sm font-semibold rounded-full shadow-sm"
        >
          <span className="mr-2">Paid</span>
          <span className="text-xs opacity-80">({formatTime(disputeCountdown)})</span>
        </Button>
      )}

      {/* Keep all trades on platform warning */}
      <div className="border-2 border-primary rounded p-4 text-xs sm:text-sm">
        Keep all trades on {import.meta.env.VITE_APP_NAME || "Pexly"}. Off-platform trades are not supported and may put you at risk. Learn how to protect yourself: <span className="font-semibold underline">Tips for Buying Crypto</span>.
      </div>

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

      {/* Cancel Trade - always available unless released */}
      {!trade.seller_released_at && trade.status !== 'completed' && trade.status !== 'cancelled' && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-sm text-muted-foreground hover:text-foreground"
          onClick={onShowCancelModal}
          disabled={isProcessing}
        >
          Cancel Trade
        </Button>
      )}

      {/* "You've paid already" - shown before marking as paid */}
      {!isPaid && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4" />
          <span>You've paid already?</span>
        </div>
      )}

      {/* Report Bad Behaviour - shown after paid */}
      {isPaid && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-sm"
        >
          Report Bad Behaviour
        </Button>
      )}
    </div>
  );
}