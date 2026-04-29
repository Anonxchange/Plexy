import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notificationSounds } from "@/lib/notification-sounds";

// Import Supabase client
import { createClient } from "@/lib/supabase";

interface SellerReleaseActionsProps {
  isPaid: boolean;
  trade: {
    id: string;
    status: string;
    crypto_symbol: string;
    crypto_amount: number;
    buyer_paid_at?: string | null;
  };
  counterpartyUsername?: string;
  onTradeUpdate?: () => void;
  onMockComplete?: () => void;
}

export function SellerReleaseActions({
  isPaid,
  trade,
  counterpartyUsername,
  onTradeUpdate,
}: SellerReleaseActionsProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDisputeExpanded, setIsDisputeExpanded] = useState(true);
  const [disputeCountdown, setDisputeCountdown] = useState<number>(3600);
  const [canDispute, setCanDispute] = useState(false);

  useEffect(() => {
    if (!trade.buyer_paid_at) {
      setCanDispute(false);
      setDisputeCountdown(3600);
      return;
    }

    const updateDisputeTimer = () => {
      const paidTime = new Date(trade.buyer_paid_at!).getTime();
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

  const handleReleaseCrypto = async () => {
    if (!trade.id || isProcessing) return;

    // Additional safeguard: only allow release if payment is marked
    if (trade.status?.toLowerCase() !== "payment_marked" && trade.status?.toLowerCase() !== "paid") {
      toast({
        title: "Wait for payment",
        description: "Please wait for the buyer to mark the trade as paid before releasing crypto.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate a small delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update trade status to completed (no escrow or wallet changes)
      const supabase = createClient();
      
      console.log("Updating trade:", trade.id);
      
      const { data, error } = await supabase
        .from("p2p_trades")
        .update({
          seller_released_at: new Date().toISOString(),
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", trade.id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message || "Database update failed");
      }

      console.log("Trade updated successfully:", data);

      // Show success notification and play sound
      notificationSounds.play('trade_completed');
      toast({
        title: "Success",
        description: `You released ${trade.crypto_amount.toFixed(8)} ${trade.crypto_symbol}`,
      });

      // Trigger trade update to show the completed section
      onTradeUpdate?.();
    } catch (error) {
      console.error("Error releasing crypto:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to release crypto. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleReleaseCrypto}
        disabled={isProcessing || (trade.status?.toLowerCase() !== 'payment_marked' && trade.status?.toLowerCase() !== 'paid')}
        className="w-full bg-green-600 hover:bg-green-700 text-white p-4 h-auto rounded-lg shadow-md"
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-base font-semibold">
            {isProcessing ? "Processing..." : "Release Crypto"}
          </span>
          <CheckCircle className="w-5 h-5" />
        </div>
        <div className="text-left w-full mt-1">
          <span className="text-xs opacity-90">
            {isPaid ? 'Buyer has marked payment as sent' : 'Waiting for buyer payment'}
          </span>
        </div>
      </Button>

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
                Having issues with this trade? <span className="font-semibold text-foreground">Start a dispute</span> if you need help resolving a problem.
              </div>

              <Button
                variant="outline"
                className="w-full"
                disabled={!canDispute || trade.status === 'completed' || trade.status === 'cancelled'}
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

      {!isPaid && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Info className="w-5 h-5" />
          <span>Payment not yet marked</span>
        </div>
      )}
    </div>
  );
}
