
import { useState } from "react";
import { Info, XCircle, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { notificationSounds } from "@/lib/notification-sounds";

interface TradeActionsProps {
  isUserBuyer: boolean;
  isPaid: boolean;
  counterpartyUsername?: string;
  trade: {
    id: string;
    status: string;
    crypto_symbol: string;
    fiat_amount?: number;
    fiat_currency?: string;
    crypto_amount?: number;
    cancelled_at?: string;
    cancel_reason?: string;
    buyer_paid_at?: string;
    escrow_id?: string | null;
    seller_id?: string;
  };
  onTradeUpdate?: () => void;
  onShowCancelModal?: () => void;
}

const getCancelReasonText = (reason: string | undefined) => {
  switch (reason) {
    case 'unresponsive':
      return 'The other party was unresponsive';
    case 'asked_to_cancel':
      return 'Trade was cancelled by request';
    case 'payment_not_accepted':
      return 'Payment method was not accepted';
    case 'expired':
      return 'Trade expired due to timeout';
    case 'other':
      return 'Trade was cancelled';
    default:
      return 'Trade was cancelled';
  }
};

export function TradeActions({
  isUserBuyer,
  isPaid,
  counterpartyUsername,
  trade,
  onTradeUpdate,
  onShowCancelModal,
}: TradeActionsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMarkAsPaid = async () => {
    if (!trade.id || isProcessing) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("p2p_trades")
        .update({
          buyer_paid_at: new Date().toISOString(),
          status: "payment_sent",
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

  const handleReleaseCrypto = async () => {
    if (!trade.id || isProcessing) return;

    setIsProcessing(true);
    try {
      const { data: tradeData, error: fetchError } = await supabase
        .from("p2p_trades")
        .select("escrow_id, buyer_id, crypto_amount, crypto_symbol, seller_id")
        .eq("id", trade.id)
        .single();

      if (fetchError) throw fetchError;

      if (tradeData?.escrow_id) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", tradeData.buyer_id)
          .eq("crypto_symbol", tradeData.crypto_symbol)
          .single();

        const currentBalance = Number(wallet?.balance) || 0;
        const releaseAmount = Number(tradeData.crypto_amount) || 0;

        await supabase
          .from("wallets")
          .upsert({
            user_id: tradeData.buyer_id,
            crypto_symbol: tradeData.crypto_symbol,
            balance: currentBalance + releaseAmount,
          }, { onConflict: 'user_id,crypto_symbol' });

        const { data: sellerWallet } = await supabase
          .from("wallets")
          .select("locked_balance")
          .eq("user_id", tradeData.seller_id)
          .eq("crypto_symbol", tradeData.crypto_symbol)
          .single();

        const currentLocked = Number(sellerWallet?.locked_balance) || 0;
        await supabase
          .from("wallets")
          .update({
            locked_balance: Math.max(0, currentLocked - releaseAmount),
          })
          .eq("user_id", tradeData.seller_id)
          .eq("crypto_symbol", tradeData.crypto_symbol);

        await supabase
          .from("escrows")
          .update({ status: "released" })
          .eq("id", tradeData.escrow_id);
      }

      const { error } = await supabase
        .from("p2p_trades")
        .update({
          seller_released_at: new Date().toISOString(),
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", trade.id);

      if (error) throw error;

      notificationSounds.play('trade_completed');
      toast({
        title: "Success",
        description: "Crypto released to buyer",
      });

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

  if (trade.status === "completed") {
    return (
      <div className="space-y-4">
        <div className="bg-green-500/10 border border-green-500/20 p-4 sm:p-5 rounded-lg text-center">
          <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-3" />
          <div className="text-green-600 font-bold text-lg sm:text-xl mb-2">Trade Completed Successfully!</div>
          <div className="text-sm text-muted-foreground">
            {trade.crypto_amount?.toFixed(8)} {trade.crypto_symbol} has been transferred.
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setLocation("/p2p")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
      </div>
    );
  }

  if (trade.status === "cancelled") {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 p-4 sm:p-5 rounded-lg text-center">
          <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-destructive mx-auto mb-3" />
          <div className="text-destructive font-bold text-lg sm:text-xl mb-2">Trade Cancelled</div>
          <div className="text-sm text-muted-foreground mb-2">
            {getCancelReasonText(trade.cancel_reason)}
          </div>
          <div className="text-xs text-muted-foreground">
            {trade.crypto_symbol} funds have been released back to the seller's wallet.
          </div>
          {trade.cancelled_at && (
            <div className="text-xs text-muted-foreground mt-2">
              Cancelled on {new Date(trade.cancelled_at).toLocaleString()}
            </div>
          )}
        </div>
        <div className="bg-muted/50 p-3 rounded-lg border">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              If you believe this cancellation was made in error or need assistance, please contact support.
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setLocation("/p2p")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
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
              onClick={handleMarkAsPaid}
              disabled={isPaid || isProcessing}
            >
              <div className="text-left w-full">
                <div className="font-bold text-base sm:text-lg">
                  {isProcessing ? "Processing..." : "Mark as Paid"}
                </div>
                <div className="text-xs sm:text-sm">
                  {isPaid ? 'Already marked as paid' : 'Click after sending payment'}
                </div>
              </div>
            </Button>
          </div>

          <Button 
            variant="outline" 
            className="w-full text-xs sm:text-sm h-9 sm:h-10"
            onClick={onShowCancelModal}
            disabled={isPaid || isProcessing}
          >
            Cancel Trade
          </Button>

          <div className="border-2 border-primary rounded-lg p-3 sm:p-4 text-xs sm:text-sm bg-primary/5">
            Keep trades within {import.meta.env.VITE_APP_NAME || "Pexly"}. Some users may ask you to trade outside the platform. This is against our Terms of Service and likely a scam attempt.
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
              onClick={handleReleaseCrypto}
              disabled={!isPaid || isProcessing}
            >
              <div className="text-left w-full">
                <div className="font-bold text-base sm:text-lg">
                  {isProcessing ? "Processing..." : "Release Crypto"}
                </div>
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
            Keep trades within {import.meta.env.VITE_APP_NAME || "Pexly"}. Some users may ask you to trade outside the platform. This is against our Terms of Service and likely a scam attempt.
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
