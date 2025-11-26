import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { BuyerPaymentActions } from "./buyer-payment-actions";

interface TradeStartedSectionProps {
  isUserBuyer: boolean;
  trade: {
    id: string;
    status: string;
    crypto_symbol: string;
    crypto_amount: number;
    fiat_amount: number;
    fiat_currency: string;
    payment_method: string;
    buyer_paid_at?: string | null;
  };
  counterpartyUsername?: string;
  isPaid: boolean;
  timer: number;
  onTradeUpdate?: () => void;
  onShowCancelModal?: () => void;
  formatTime: (seconds: number) => string;
}

export function TradeStartedSection({
  isUserBuyer,
  trade,
  counterpartyUsername,
  isPaid,
  timer,
  onTradeUpdate,
  onShowCancelModal,
  formatTime,
}: TradeStartedSectionProps) {
  return (
    <div className="bg-card rounded-lg overflow-hidden border shadow-xs">
      <div className="bg-primary p-3 flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="font-semibold text-sm text-primary-foreground">Trade Started</span>
      </div>

      <div className="p-4 space-y-4">
        {!isUserBuyer ? (
          <>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-base sm:text-lg mb-2">
                Please make a payment of {trade.fiat_amount.toLocaleString()} {trade.fiat_currency} using {trade.payment_method}.
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol} will be added to your wallet
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded border border-primary/30">
              <div className="text-sm sm:text-base">
                <span className="font-semibold">Once you've made the payment,</span> be sure to click{' '}
                <span className="font-bold text-primary">Paid</span> within the given time limit. Otherwise the trade will be automatically canceled and the {trade.crypto_symbol} will be returned to the seller's wallet.
              </div>
            </div>

            <BuyerPaymentActions
              isPaid={isPaid}
              trade={trade}
              onTradeUpdate={onTradeUpdate}
            />

            {/* Report Bad Behaviour - after paid button */}
            {!isPaid && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-sm"
              >
                Report Bad Behaviour
              </Button>
            )}

            <div className="border-2 border-primary rounded p-4 text-xs sm:text-sm">
              Keep trades within Pexly. Some users may ask you to trade outside the Pexly platform. This is against our Terms of Service and likely a scam attempt. You must insist on keeping all trade conversations within Pexly. If you choose to proceed outside Pexly, note that we cannot help or support you if you are scammed during such trades.
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={onShowCancelModal}
              disabled={isPaid}
            >
              Cancel Trade
            </Button>

            {/* "You've paid already?" - under cancel button */}
            {!isPaid && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Info className="w-4 h-4" />
                <span>You've paid already?</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-base sm:text-lg mb-2">
                Waiting for {counterpartyUsername} to send {trade.fiat_amount.toLocaleString()} {trade.fiat_currency}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                You are selling {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}
              </div>
            </div>

            <Button
              className="w-full p-4 h-auto bg-green-600 hover:bg-green-700"
              onClick={onTradeUpdate}
              disabled={!isPaid || trade.status !== 'pending'}
            >
              <div className="text-left w-full">
                <div className="font-bold text-lg">Release Crypto</div>
                <div className="text-sm">
                  {isPaid ? 'Buyer has marked as paid' : 'Waiting for buyer payment'}
                </div>
              </div>
            </Button>

            <Button variant="outline" className="w-full">
              Raise Dispute
            </Button>

            <div className="border-2 border-primary rounded p-4 text-xs sm:text-sm">
              Keep trades within {import.meta.env.VITE_APP_NAME || "NoOnes"}. Some users may ask you to trade outside the {import.meta.env.VITE_APP_NAME || "NoOnes"} platform. This is against our Terms of Service and likely a scam attempt.
            </div>

            {!isPaid && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Info className="w-5 h-5" />
                <span>Payment not yet marked</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}