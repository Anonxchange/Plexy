import { useState } from "react";
import { Info, XCircle, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Status mapping for legacy support and new flow
  // Use case-insensitive matching for robustness
  const status = trade.status?.toUpperCase() || "";
  const isPending = status === "PENDING" || status === "PENDING_SELLER_APPROVAL";
  const isApproved = status === "APPROVED_AWAITING_PAYMENT";
  const isPaymentMarked = status === "PAYMENT_MARKED" || status === "PAYMENT_SENT";
  const isCompleted = status === "COMPLETED" || status === "RELEASED";
  const isCancelled = status === "CANCELLED" || status === "REJECTED";

  const handleApproveTrade = async () => {
    if (!trade.id || isProcessing) return;
    setIsProcessing(true);
    try {
      // Database-first validation
      const { data: freshTrade, error: fetchError } = await supabase
        .from("p2p_trades")
        .select("id, status")
        .eq("id", trade.id)
        .single();

      if (fetchError) throw fetchError;

      const freshStatus = freshTrade.status?.toUpperCase() || "";
      if (freshStatus !== "PENDING" && freshStatus !== "PENDING_SELLER_APPROVAL") {
        toast({ title: "Error", description: "Trade is no longer pending approval.", variant: "destructive" });
        onTradeUpdate?.();
        return;
      }

      const { error } = await supabase
        .from("p2p_trades")
        .update({ status: "APPROVED_AWAITING_PAYMENT" })
        .eq("id", trade.id);
      if (error) throw error;
      toast({ title: "Success", description: "Trade approved. Waiting for buyer payment." });
      onTradeUpdate?.();
    } catch (error) {
      console.error("Error approving trade:", error);
      toast({ title: "Error", description: "Failed to approve trade", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectTrade = async () => {
    if (!trade.id || isProcessing) return;
    setIsProcessing(true);
    try {
      // Database-first validation
      const { data: freshTrade, error: fetchError } = await supabase
        .from("p2p_trades")
        .select("id, status")
        .eq("id", trade.id)
        .single();

      if (fetchError) throw fetchError;

      const freshStatus = freshTrade.status?.toUpperCase() || "";
      if (freshStatus !== "PENDING" && freshStatus !== "PENDING_SELLER_APPROVAL") {
        toast({ title: "Error", description: "Trade is no longer pending.", variant: "destructive" });
        onTradeUpdate?.();
        return;
      }

      const { error } = await supabase
        .from("p2p_trades")
        .update({ status: "REJECTED" })
        .eq("id", trade.id);
      if (error) throw error;
      toast({ title: "Trade Rejected", description: "You have rejected this trade." });
      onTradeUpdate?.();
    } catch (error) {
      console.error("Error rejecting trade:", error);
      toast({ title: "Error", description: "Failed to reject trade", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!trade.id || isProcessing) return;

    setIsProcessing(true);
    try {
      // Database-first validation
      const { data: freshTrade, error: fetchError } = await supabase
        .from("p2p_trades")
        .select("id, status")
        .eq("id", trade.id)
        .single();

      if (fetchError) throw fetchError;

      const freshStatus = freshTrade.status?.toUpperCase() || "";
      if (freshStatus !== "APPROVED_AWAITING_PAYMENT") {
        toast({ title: "Error", description: "Trade is no longer awaiting payment.", variant: "destructive" });
        onTradeUpdate?.();
        return;
      }

      const { error } = await supabase
        .from("p2p_trades")
        .update({
          buyer_paid_at: new Date().toISOString(),
          status: "PAYMENT_MARKED",
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
      // Database-first validation
      const { data: freshTrade, error: fetchError } = await supabase
        .from("p2p_trades")
        .select("id, status, escrow_id, buyer_id, crypto_amount, crypto_symbol, seller_id")
        .eq("id", trade.id)
        .single();

      if (fetchError) throw fetchError;

      const freshStatus = freshTrade.status?.toUpperCase() || "";
      if (freshStatus !== "PAYMENT_MARKED" && freshStatus !== "PAYMENT_SENT") {
        toast({ title: "Error", description: "Trade is not ready for release.", variant: "destructive" });
        onTradeUpdate?.();
        return;
      }

      if (freshTrade?.escrow_id) {
        // Simple wallet update logic
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", freshTrade.buyer_id)
          .eq("crypto_symbol", freshTrade.crypto_symbol)
          .single();

        const currentBalance = Number(wallet?.balance) || 0;
        const releaseAmount = Number(freshTrade.crypto_amount) || 0;

        await supabase
          .from("wallets")
          .upsert({
            user_id: freshTrade.buyer_id,
            crypto_symbol: freshTrade.crypto_symbol,
            balance: currentBalance + releaseAmount,
          }, { onConflict: 'user_id,crypto_symbol' });

        const { data: sellerWallet } = await supabase
          .from("wallets")
          .select("locked_balance")
          .eq("user_id", freshTrade.seller_id)
          .eq("crypto_symbol", freshTrade.crypto_symbol)
          .single();

        const currentLocked = Number(sellerWallet?.locked_balance) || 0;
        await supabase
          .from("wallets")
          .update({
            locked_balance: Math.max(0, currentLocked - releaseAmount),
          })
          .eq("user_id", freshTrade.seller_id)
          .eq("crypto_symbol", freshTrade.crypto_symbol);

        // Fixed: table name is 'escrow' not 'escrows'
        await supabase
          .from("escrow")
          .update({ status: "released" })
          .eq("id", freshTrade.escrow_id);
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

  if (isCompleted) {
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
          onClick={() => navigate("/p2p")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 p-4 sm:p-5 rounded-lg text-center">
          <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-destructive mx-auto mb-3" />
          <div className="text-destructive font-bold text-lg sm:text-xl mb-2">
            {status === "REJECTED" ? "Trade Rejected" : "Trade Cancelled"}
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            {status === "REJECTED" ? "The seller has rejected this trade." : getCancelReasonText(trade.cancel_reason)}
          </div>
          <div className="text-xs text-muted-foreground">
            {trade.crypto_symbol} funds have been released back to the seller's wallet.
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate("/p2p")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isUserBuyer ? (
        <>
          {/* BUYER VIEW */}
          <div className="bg-muted p-3 sm:p-4 rounded-lg border space-y-3">
            {isPending ? (
              <Button disabled className="w-full bg-amber-500/50 cursor-not-allowed h-12">
                ⏳ Waiting for Seller Approval
              </Button>
            ) : isApproved ? (
              <>
                <div className="text-xs sm:text-sm text-muted-foreground italic mb-2">
                  Make payment only after seller approval.
                </div>
                <Button 
                  className="w-full h-12 bg-primary hover:bg-primary/90"
                  onClick={handleMarkAsPaid}
                  disabled={isProcessing}
                >
                  💰 Mark as Paid
                </Button>
              </>
            ) : isPaymentMarked ? (
              <Button disabled className="w-full bg-blue-500/50 cursor-not-allowed h-12">
                ⏳ Waiting for Seller to Confirm
              </Button>
            ) : null}
          </div>

          <Button 
            variant="outline" 
            className="w-full text-xs sm:text-sm h-9 sm:h-10"
            onClick={onShowCancelModal}
            disabled={isPaymentMarked || isProcessing}
          >
            Cancel Trade
          </Button>
        </>
      ) : (
        <>
          {/* SELLER VIEW */}
          <div className="bg-muted p-3 sm:p-4 rounded-lg border space-y-3">
            {isPending ? (
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={handleApproveTrade}
                  disabled={isProcessing}
                >
                  ✅ Approve Trade
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleRejectTrade}
                  disabled={isProcessing}
                >
                  ❌ Reject Trade
                </Button>
              </div>
            ) : isApproved ? (
              <Button disabled className="w-full bg-amber-500/50 cursor-not-allowed h-12">
                ⏳ Waiting for Buyer Payment
              </Button>
            ) : isPaymentMarked ? (
              <>
                <div className="text-xs sm:text-sm text-muted-foreground italic mb-2">
                  Release funds only after confirming payment.
                </div>
                <Button 
                  className="w-full h-12 bg-green-500 hover:bg-green-600"
                  onClick={handleReleaseCrypto}
                  disabled={isProcessing}
                >
                  🔓 Release Funds
                </Button>
              </>
            ) : null}
          </div>

          <Button variant="outline" className="w-full text-xs sm:text-sm h-9 sm:h-10">
            Raise Dispute
          </Button>
        </>
      )}

      <div className="border-2 border-primary rounded-lg p-3 sm:p-4 text-xs sm:text-sm bg-primary/5">
        Keep trades within {import.meta.env.VITE_APP_NAME || "Pexly"}. Some users may ask you to trade outside the platform. This is against our Terms of Service and likely a scam attempt.
      </div>
    </div>
  );
}
