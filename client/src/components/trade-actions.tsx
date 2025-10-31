import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TradeActionsProps {
  isUserBuyer: boolean;
  isPaid: boolean;
  counterpartyUsername?: string;
  trade: {
    status: string;
    crypto_symbol: string;
  };
  onMarkAsPaid: () => void;
  onReleaseCrypto: () => void;
  onCancelTrade: () => void;
}

export function TradeActions({
  isUserBuyer,
  isPaid,
  counterpartyUsername,
  trade,
  onMarkAsPaid,
  onReleaseCrypto,
  onCancelTrade,
}: TradeActionsProps) {
  if (trade.status === "completed") {
    return (
      <div className="bg-green-500/10 border border-green-500/20 p-3 sm:p-4 rounded-lg text-center">
        <div className="text-green-600 font-semibold text-sm sm:text-base">Trade Completed Successfully!</div>
      </div>
    );
  }

  if (trade.status === "cancelled") {
    return (
      <div className="bg-destructive/10 border border-destructive/20 p-3 sm:p-4 rounded-lg">
        <div className="text-sm sm:text-base text-destructive">
          This trade was canceled and {trade.crypto_symbol} is no longer reserved.
        </div>
      </div>
    );
  }

  return (
    <>
      {isUserBuyer ? (
        <>
          <div className="bg-muted p-3 sm:p-4 rounded-lg border">
            <div className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <span className="font-semibold">Once you have made the payment</span>, click "Mark as Paid" below. This will notify the seller that you've completed the payment.
            </div>

            <Button 
              className="w-full p-3 sm:p-4 h-auto bg-primary hover:bg-primary/90"
              onClick={onMarkAsPaid}
              disabled={isPaid}
            >
              <div className="text-left w-full">
                <div className="font-bold text-base sm:text-lg">Mark as Paid</div>
                <div className="text-xs sm:text-sm">
                  {isPaid ? 'Already marked as paid' : 'Click after sending payment'}
                </div>
              </div>
            </Button>
          </div>

          <Button 
            variant="outline" 
            className="w-full text-xs sm:text-sm h-9 sm:h-10"
            onClick={onCancelTrade}
          >
            Cancel Trade
          </Button>

          <div className="border-2 border-primary rounded-lg p-3 sm:p-4 text-xs sm:text-sm bg-primary/5">
            Keep trades within {import.meta.env.VITE_APP_NAME || "NoOnes"}. Some users may ask you to trade outside the {import.meta.env.VITE_APP_NAME || "NoOnes"} platform. This is against our Terms of Service and likely a scam attempt.
          </div>
        </>
      ) : (
        <>
          <div className="bg-muted p-3 sm:p-4 rounded-lg border">
            <div className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <span className="font-semibold">Wait for the buyer to mark the payment as sent.</span> Once they do, verify that you have received the payment before releasing the crypto.
            </div>

            <Button 
              className="w-full p-3 sm:p-4 h-auto bg-green-500 hover:bg-green-600"
              onClick={onReleaseCrypto}
              disabled={!isPaid}
            >
              <div className="text-left w-full">
                <div className="font-bold text-base sm:text-lg">Release Crypto</div>
                <div className="text-xs sm:text-sm">
                  {isPaid ? 'Buyer has marked as paid' : 'Waiting for buyer payment'}
                </div>
              </div>
            </Button>
          </div>

          <Button variant="outline" className="w-full text-xs sm:text-sm h-9 sm:h-10">
            Raise Dispute
          </Button>

          <div className="border-2 border-primary rounded-lg p-3 sm:p-4 text-xs sm:text-sm bg-primary/5">
            Keep trades within {import.meta.env.VITE_APP_NAME || "NoOnes"}. Some users may ask you to trade outside the {import.meta.env.VITE_APP_NAME || "NoOnes"} platform. This is against our Terms of Service and likely a scam attempt.
          </div>
        </>
      )}

      {!isPaid && (
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Payment not yet marked</span>
        </div>
      )}
    </>
  );
}
