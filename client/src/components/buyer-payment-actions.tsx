import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface BuyerPaymentActionsProps {
  isPaid: boolean;
  buyerPaidAt: string | null;
  timer: number;
  tradeStatus: string;
  onMarkAsPaid: () => void;
  formatTime: (seconds: number) => string;
}

export function BuyerPaymentActions({
  isPaid,
  buyerPaidAt,
  timer,
  tradeStatus,
  onMarkAsPaid,
  formatTime,
}: BuyerPaymentActionsProps) {
  const [disputeCountdown, setDisputeCountdown] = useState<number>(3600); // 1 hour in seconds
  const [canDispute, setCanDispute] = useState(false);

  useEffect(() => {
    if (!buyerPaidAt) {
      setCanDispute(false);
      setDisputeCountdown(3600);
      return;
    }

    const updateDisputeTimer = () => {
      const paidTime = new Date(buyerPaidAt).getTime();
      const elapsedMs = Date.now() - paidTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const remainingSeconds = Math.max(0, 3600 - elapsedSeconds);

      setDisputeCountdown(remainingSeconds);
      setCanDispute(remainingSeconds === 0);
    };

    updateDisputeTimer();
    const interval = setInterval(updateDisputeTimer, 1000);
    return () => clearInterval(interval);
  }, [buyerPaidAt]);

  const formatDisputeTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Paid/Dispute Button */}
      <div className="bg-black/50 p-4 rounded">
        {!isPaid && (
          <div className="mb-4 text-xs sm:text-sm">
            <span className="font-semibold">Once you've made the payment,</span> be sure to click{' '}
            <span className="font-bold text-primary">Paid</span> within the given time limit. Otherwise the trade will be automatically canceled and the crypto will be returned to the seller's wallet.
          </div>
        )}

        <Button
          className={`w-full p-4 h-auto ${
            isPaid
              ? canDispute
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-green-600 hover:bg-green-700 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
          onClick={isPaid ? undefined : onMarkAsPaid}
          disabled={isPaid ? !canDispute : tradeStatus !== 'pending'}
        >
          <div className="flex items-center justify-between w-full">
            <div className="text-left">
              <div className="font-bold text-lg">
                {isPaid ? 'Start a Dispute' : 'Paid'}
              </div>
              <div className="text-sm">
                {isPaid
                  ? canDispute
                    ? 'Dispute now available'
                    : `Available in ${formatDisputeTime(disputeCountdown)}`
                  : `Time left ${formatTime(timer)}`
                }
              </div>
            </div>
            {isPaid && !canDispute && <span className="text-2xl">✓</span>}
            {isPaid && canDispute && <span className="text-2xl">⚖️</span>}
          </div>
        </Button>

        {isPaid && !canDispute && (
          <div className="mt-3 text-xs text-muted-foreground text-center">
            Payment marked. Wait 1 hour before disputing if needed.
          </div>
        )}
      </div>

      {/* Report Bad Behaviour */}
      <Button
        variant="outline"
        className="w-full"
      >
        Report Bad Behaviour
      </Button>

      {/* Keep all trades on platform warning */}
      <div className="border-2 border-primary rounded p-4 text-xs sm:text-sm">
        Keep all trades on {import.meta.env.VITE_APP_NAME || "NoOnes"}. Off-platform trades are not supported and may put you at risk. Learn how to protect yourself: <span className="font-semibold underline">Tips for Buying Crypto</span>.
      </div>

      {!isPaid && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Info className="w-5 h-5" />
          <span>You have paid already</span>
        </div>
      )}
    </div>
  );
}