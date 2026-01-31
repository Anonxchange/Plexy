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
  const supabase = createClient();
  const navigate = (path: string) => setLocation(path);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Status mapping for legacy support and new flow
  // Use case-insensitive matching for robustness
  const status = trade.status?.toLowerCase() || "";
  const isPending = status === "pending" || status === "pending_seller_approval" || status === "pending_approval" || status === "pending_escrow";
  const isApproved = status === "approved" || status === "approved_awaiting_payment" || status === "awaiting_payment";
  const isPaymentMarked = status === "payment_marked" || status === "payment_sent" || status === "paid";
  const isCompleted = status === "completed" || status === "released" || status === "done";
  const isCancelled = status === "cancelled" || status === "rejected" || status === "void" || status === "REJECTED";

  // Double check role logic: If I am the buyer, I should see "Paid" button. If I am the seller, I should see "Approve" and "Release".
  // The user says when they click a "Sell" ad (which means they are BUYING crypto), they see the wrong buttons.
  // In a "Sell" ad (P2P tab: Buy), the AD OWNER is the Seller. The PERSON CLICKING is the Buyer.
  // In a "Buy" ad (P2P tab: Sell), the AD OWNER is the Buyer. The PERSON CLICKING is the Seller.
  
  const handleApproveTrade = async () => {
    if (!trade.id || isProcessing) return;
    setIsProcessing(true);
    try {
      // 1. Verify caller is seller and trade.status is pending (Backend handles this, but we call the function)
      // 2. Call btc-escrow-create
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/btc-escrow-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ tradeId: trade.id })
      });

      if (!response.ok) throw new Error('Failed to create escrow');

      toast({ title: "Success", description: "Contract approved and escrow created." });
      onTradeUpdate?.();
    } catch (error) {
      console.error("Error approving trade:", error);
      toast({ title: "Error", description: "Failed to approve contract", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectTrade = async () => {
    if (!trade.id || isProcessing) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("p2p_trades")
        .update({ status: "cancelled" })
        .eq("id", trade.id);
      if (error) throw error;
      toast({ title: "Contract Cancelled", description: "You have cancelled this contract." });
      onTradeUpdate?.();
    } catch (error) {
      console.error("Error cancelling contract:", error);
      toast({ title: "Error", description: "Failed to cancel contract", variant: "destructive" });
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
    const isRejected = status === "rejected" || status === "REJECTED";
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 p-4 sm:p-5 rounded-lg text-center">
          <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-destructive mx-auto mb-3" />
          <div className="text-destructive font-bold text-lg sm:text-xl mb-2">
            {isRejected ? "Trade Rejected" : "Trade Cancelled"}
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            {isRejected ? "The seller has rejected this trade." : getCancelReasonText(trade.cancel_reason)}
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full h-12"
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
          {/* BUYER VIEW: Sees "Mark as Paid" and "Cancel Trade" */}
          <div className="bg-muted p-3 sm:p-4 rounded-lg border space-y-3">
            {isPending ? (
              <Button disabled className="w-full bg-amber-500/50 cursor-not-allowed h-12 text-white">
                ⏳ Waiting for seller to approve contract
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
              <Button disabled className="w-full bg-blue-500/50 cursor-not-allowed h-12 text-white">
                ⏳ Waiting for Seller to Confirm
              </Button>
            ) : null}
          </div>

          {!isPaymentMarked && (
            <Button 
              variant="outline" 
              className="w-full text-xs sm:text-sm h-12"
              onClick={onShowCancelModal}
              disabled={isProcessing}
            >
              Cancel Trade
            </Button>
          )}
        </>
      ) : (
        <>
          {/* SELLER VIEW: Sees "Approve Contract" and "Release Crypto" */}
          <div className="space-y-4">
            <div className="bg-[#1A1C1E] p-4 rounded-lg border border-white/5 space-y-1">
              <div className="text-lg font-medium text-white">
                {isPaymentMarked ? "Verify Payment" : `Waiting for ${counterpartyUsername || "buyer"} to send ${trade.fiat_amount?.toLocaleString()} ${trade.fiat_currency}`}
              </div>
              <div className="text-sm text-muted-foreground">
                You are selling {trade.crypto_amount?.toFixed(8)} {trade.crypto_symbol}
              </div>
            </div>

            <div className="bg-[#1A1C1E] p-4 rounded-lg border border-white/5">
              <div className="text-sm text-white leading-relaxed">
                {isPending ? (
                  <strong>Approve the contract to lock the crypto in escrow.</strong>
                ) : isPaymentMarked ? (
                  <strong>Verify you have received the {trade.fiat_currency} before releasing the {trade.crypto_symbol}.</strong>
                ) : (
                  <strong>Wait for the buyer to mark payment as sent.</strong>
                )}
              </div>
            </div>

          {isPending ? (
            <div className="grid grid-cols-2 gap-2">
              <Button 
                className="bg-green-600 hover:bg-green-700 h-12 text-white font-bold"
                onClick={handleApproveTrade}
                disabled={isProcessing}
                data-approve-trade
              >
                ✅ Approve Contract
              </Button>
              <Button 
                variant="destructive"
                className="h-12 font-bold"
                onClick={onShowCancelModal}
                disabled={isProcessing}
              >
                ❌ Cancel Contract
              </Button>
            </div>
          ) : (
              <div className="space-y-3">
                <Button 
                  disabled={!isPaymentMarked || isProcessing}
                  className={`w-full h-14 flex items-center justify-center gap-2 text-lg font-bold transition-all ${
                    isPaymentMarked 
                      ? "bg-[#1E5F36] hover:bg-[#257242] text-white" 
                      : "bg-[#1E5F36]/50 text-white/40 cursor-not-allowed"
                  }`}
                  onClick={handleReleaseCrypto}
                >
                  Release Crypto
                  <CheckCircle className={`w-5 h-5 ${isPaymentMarked ? "text-white" : "text-white/40"}`} />
                  {!isPaymentMarked && <span className="text-xs font-normal ml-2 text-white/30">Waiting for buyer payment</span>}
                </Button>
                
                {!isPaymentMarked && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span className="text-sm">Payment not yet marked</span>
                  </div>
                )}

                <Button 
                  variant="ghost" 
                  className="w-full text-white hover:bg-white/5 border border-white/10 h-12"
                >
                  Report Bad Behaviour
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="border-2 border-[#B4F22E] rounded-lg p-4 text-xs sm:text-sm bg-[#B4F22E]/5 leading-relaxed">
        Keep trades within Pexly. Some users may ask you to trade outside the Pexly platform. This is against our Terms of Service and likely a scam attempt. You must insist on keeping all trade conversations within Pexly. If you choose to proceed outside Pexly, note that we cannot help or support you if you are scammed during such trades.
      </div>
    </div>
  );
}
