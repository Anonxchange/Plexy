import { useState, useEffect } from "react";
import { createNotification } from "@/lib/notifications-api";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Circle, ThumbsUp, Bitcoin, X, ChevronDown } from "lucide-react";
import { OfferCardProps } from "./offer-card";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: OfferCardProps;
}

export function TradeDialog({ open, onOpenChange, offer }: TradeDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  const [showMoreTerms, setShowMoreTerms] = useState(false);
  const [isCreatingTrade, setIsCreatingTrade] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);
  const [feePercentage, setFeePercentage] = useState<number | null>(null);
  const [showBankSelection, setShowBankSelection] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<any | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number>(0);

  // Fetch available balance and bank accounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !open) return;

      try {
        // Fetch available balance for the crypto being traded
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('balance, locked_balance')
          .eq('user_id', user.id)
          .eq('crypto_symbol', offer.cryptoSymbol || 'BTC')
          .single();

        if (!walletError && walletData) {
          // Calculate available balance (balance - locked_balance)
          const balance = parseFloat(walletData.balance?.toString() || '0');
          const locked = parseFloat(walletData.locked_balance?.toString() || '0');
          setAvailableBalance(balance);
        } else {
          setAvailableBalance(0);
        }

        // Fetch bank accounts for sellers
        if (offer.type === 'sell') {
          const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active');

          if (!error && data) {
            setBankAccounts(data);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [open, offer.type, offer.cryptoSymbol, user]);

  // Calculate fee data when amount or offer changes
  useEffect(() => {
    const fetchFeeData = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setPlatformFee(0);
        setFeePercentage(null);
        return;
      }

      try {
        const { createClient } = await import("@/lib/supabase");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) return;

        // Determine transaction type based on offer type
        const transactionType = offer.type === 'buy' ? 'marketplace_sell' : 'marketplace_buy';

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-fee`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction_type: transactionType,
            crypto_symbol: offer.cryptoSymbol || 'BTC',
            amount: parseFloat(amount),
            payment_method: offer.paymentMethod,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setPlatformFee(data.platform_fee || 0);
          setFeePercentage(data.fee_percentage);
        } else {
          console.error("Failed to fetch fee:", await response.text());
          setPlatformFee(0);
          setFeePercentage(null);
        }
      } catch (error) {
        console.error("Error fetching fee data:", error);
        setPlatformFee(0);
        setFeePercentage(null);
      }
    };

    fetchFeeData();
  }, [amount, offer.type, offer.cryptoSymbol, offer.paymentMethod]);

  // Calculate crypto amount based on fiat amount and offer price
  const cryptoAmount = amount ? parseFloat(amount) / offer.pricePerBTC : 0;

  // Total amount the user will receive after fees (for sellers)
  // Or total amount the user pays (for buyers)
  const receiveAmount = amount ? parseFloat(amount) - platformFee : 0;


  const handleProceed = async () => {
    if (!amount || parseFloat(amount) < offer.limits.min || parseFloat(amount) > offer.limits.max) {
      return;
    }

    if (isCreatingTrade) {
      return; // Prevent duplicate submissions
    }

    // If this is a sell offer, validate available balance
    if (offer.type === 'sell' && user) {
      if (cryptoAmount > availableBalance) {
        toast({
          title: "Insufficient Available Balance",
          description: `You only have ${availableBalance.toFixed(8)} ${offer.cryptoSymbol || 'BTC'} available. Your locked balance will be released once pending trades are completed.`,
          variant: "destructive",
        });
        return;
      }

      // Check for bank account selection
      if (!selectedBankAccount) {
        if (bankAccounts.length === 0) {
          alert("Please add a payment method first in your settings");
          return;
        }
        setShowBankSelection(true);
        return;
      }
    }

    setIsCreatingTrade(true);

    try {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated");
        alert("Please sign in to create a trade");
        return;
      }

      const fiatAmount = parseFloat(amount);
      // const cryptoAmount = fiatAmount / offer.pricePerBTC; // This is now calculated above for display

      // Get the vendor ID from the offer
      const vendorId = offer.vendor?.id;

      if (!vendorId) {
        console.error("No vendor ID found in offer:", offer);
        alert("Could not find the offer vendor");
        return;
      }

      if (vendorId === user.id) {
        alert("Cannot trade with yourself");
        return;
      }

      // Determine buyer and seller based on offer type
      // The current user is ALWAYS the one initiating the trade
      // If vendor posted a "buy" offer, they want to buy, so current user is seller
      // If vendor posted a "sell" offer, they want to sell, so current user is buyer
      const isBuyOffer = offer.type === "buy";
      const buyerId = isBuyOffer ? vendorId : user.id;  // vendor buys OR user buys
      const sellerId = isBuyOffer ? user.id : vendorId;  // user sells OR vendor sells

      console.log("Trade creation:", {
        offerType: offer.type,
        currentUserId: user.id,
        vendorId,
        buyerId,
        sellerId,
        offerVendor: offer.vendor
      });

      // First, create or get the offer record
      let offerId = offer.id;

      if (!offerId) {
        const { data: newOffer, error: offerError } = await supabase
          .from("p2p_offers")
          .insert({
            user_id: offer.vendor?.id || user.id, // This line might need adjustment if offer.vendor is unreliable
            type: offer.type,
            crypto_symbol: offer.cryptoSymbol,
            fiat_currency: offer.currency,
            price_per_unit: offer.pricePerBTC,
            min_amount: offer.limits.min,
            max_amount: offer.limits.max,
            payment_method: offer.paymentMethod,
            time_limit_minutes: 30,
            status: "active",
          })
          .select()
          .single();

        if (offerError) {
          console.error("Error creating offer:", offerError);
          alert(`Failed to create offer: ${offerError.message}`);
          return;
        }

        offerId = newOffer.id;
      }

      // Calculate payment deadline based on offer's time limit
      const timeLimitMinutes = offer.time_limit_minutes || 30; // Default to 30 minutes if not specified
      const paymentDeadline = new Date(Date.now() + timeLimitMinutes * 60000);

      // Now create the trade with the valid offer_id
      const { data: trade, error: tradeError } = await supabase
        .from("p2p_trades")
        .insert({
          offer_id: offerId,
          buyer_id: buyerId,
          seller_id: sellerId,
          crypto_symbol: offer.cryptoSymbol,
          fiat_currency: offer.currency,
          crypto_amount: cryptoAmount, // Use the calculated crypto amount
          fiat_amount: fiatAmount, // This is the amount the buyer pays
          price: offer.pricePerBTC,
          payment_method: offer.paymentMethod,
          status: "pending",
          payment_deadline: paymentDeadline.toISOString(),
          platform_fee: platformFee,
          platform_fee_percentage: feePercentage,
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      console.log("Trade created successfully:", trade);

      // If seller, post bank account details to chat
      if (offer.type === 'sell' && selectedBankAccount) {
        try {
          const bankDetailsMessage = `A payment of ${fiatAmount.toLocaleString()} ${offer.currency} is being made to your payment method:

AMOUNT
${fiatAmount.toLocaleString()} ${offer.currency}

PAYMENT TYPE
${selectedBankAccount.payment_type}

ACCOUNT HOLDER
${selectedBankAccount.account_holder || selectedBankAccount.account_name}

BANK/PROVIDER NAME
${selectedBankAccount.bank_name}

ACCOUNT NUMBER
${selectedBankAccount.account_number}`;

          await supabase
            .from("trade_messages")
            .insert({
              trade_id: trade.id,
              sender_id: user.id,
              content: bankDetailsMessage,
            });

          console.log("Bank details posted to chat");
        } catch (error) {
          console.error("Error posting bank details:", error);
        }
      }

      // Create notifications for both parties
      try {
        // Get user profiles for avatar and name
        const { data: currentUserProfile } = await supabase
          .from('user_profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();

        const { data: counterpartProfile } = await supabase
          .from('user_profiles')
          .select('username, avatar_url')
          .eq('id', vendorId)
          .single();

        const currentUserName = currentUserProfile?.username || user.email?.split('@')[0] || 'User';
        const currentUserAvatar = currentUserProfile?.avatar_url || null;
        const counterpartName = counterpartProfile?.username || offer.vendor?.name || 'User';
        const counterpartAvatar = counterpartProfile?.avatar_url || offer.vendor?.avatar || null;

        // Notification for the current user (trade initiator)
        await createNotification(
          user.id,
          'New Trade Started',
          `Trade with ${counterpartName} for ${fiatAmount} ${offer.currency}`,
          'trade',
          {
            tradeId: trade.id,
            counterpart_name: counterpartName,
            counterpart_avatar: counterpartAvatar,
            status: 'Pending',
            url: `/trade/${trade.id}`
          }
        );

        // Notification for the counterpart (vendor)
        await createNotification(
          vendorId,
          'New Trade Request',
          `${currentUserName} wants to trade for ${fiatAmount} ${offer.currency}`,
          'trade',
          {
            tradeId: trade.id,
            counterpart_name: currentUserName,
            counterpart_avatar: currentUserAvatar,
            status: 'Pending',
            url: `/trade/${trade.id}`
          }
        );

        console.log("Notifications created for trade:", trade.id);
      } catch (notifError) {
        console.error("Error creating notifications:", notifError);
        // Don't fail the trade creation, just log the error
      }

      // Create escrow to lock seller's crypto
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && offer.type === "sell") {
          // Only create escrow if the offer is a sell offer (seller needs to lock funds)
          const escrowResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/escrow-create`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trade_id: trade.id,
              buyer_id: buyerId,
              amount: cryptoAmount, // Use the calculated crypto amount
              currency: offer.cryptoSymbol,
              expires_in_hours: Math.ceil(timeLimitMinutes / 60),
            }),
          });

          if (escrowResponse.ok) {
            const { escrow } = await escrowResponse.json();

            // Update trade with escrow_id
            await supabase
              .from("p2p_trades")
              .update({ escrow_id: escrow.id })
              .eq("id", trade.id);

            console.log("Escrow created:", escrow);
          } else {
            console.error("Failed to create escrow:", await escrowResponse.text());
          }
        }
      } catch (escrowError) {
        console.error("Escrow creation error:", escrowError);
        // Don't fail the trade creation, just log the error
      }

      onOpenChange(false);
      setLocation(`/trade/${trade.id}`);
    } catch (error) {
      console.error("Error in handleProceed:", error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsCreatingTrade(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[calc(100%-2rem)] p-0 gap-0 max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader className="p-3 sm:p-4 pb-0 space-y-0 sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              {offer.type === "buy" ? "Buy" : "Sell"} {offer.cryptoSymbol}
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Vendor Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-muted rounded-lg gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                <AvatarImage src={offer.vendor.avatar} />
                <AvatarFallback className="text-xs sm:text-sm font-semibold bg-primary/10">
                  {offer.vendor.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm sm:text-base truncate">{offer.vendor.name}</span>
                  {offer.vendor.isVerified && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs bg-green-500/10 text-green-600 border-green-500/20 px-1.5 py-0">
                      <Circle className="h-1.5 w-1.5 sm:h-2 sm:w-2 fill-green-600 mr-0.5 sm:mr-1" />
                      POWER
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                  <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>99.96%</span>
                  <Circle className="h-0.5 w-0.5 sm:h-1 sm:w-1 fill-current" />
                  <span>{offer.vendor.trades} Trades</span>
                  <Circle className="h-0.5 w-0.5 sm:h-1 sm:w-1 fill-green-500" />
                  <span className="text-green-500">Active now</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-8">
              Manage
            </Button>
          </div>

          {/* Badges */}
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5">receipt required</Badge>
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5">no third parties</Badge>
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5">guided trade</Badge>
          </div>

          {/* KYC Notice */}
          {offer.vendor.isVerified && (
            <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500/20 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-base sm:text-lg">📋</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm">
                  <span className="font-semibold">{offer.vendor.name}</span> needs to see your full name to trade with you
                </p>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs sm:text-sm font-medium">Amount to pay</label>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xs sm:text-sm">Rate:</span>
                <Bitcoin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                <span className="text-xs sm:text-sm font-bold">
                  {offer.pricePerBTC.toLocaleString('en-US', { minimumFractionDigits: 2 })} {offer.currency}
                </span>
                <Badge variant="outline" className="text-[10px] sm:text-xs bg-red-500/10 text-red-600 border-red-500/20 px-1.5 py-0">
                  -1%
                </Badge>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-muted rounded flex items-center justify-center">
                <Bitcoin className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-11 sm:pl-14 pr-20 sm:pr-24 h-12 sm:h-14 text-base sm:text-lg font-semibold"
              />
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 font-semibold text-xs sm:text-sm">
                  MAX
                </Button>
                <span className="font-semibold text-xs sm:text-sm">{offer.currency}</span>
              </div>
            </div>

            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Range: {offer.limits.min.toLocaleString()} - {offer.limits.max.toLocaleString()} {offer.currency}
            </p>
          </div>

          {/* Payment Summary */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 truncate">
                  {offer.type === 'buy' ? 'You receive' : 'You pay'}
                </p>
                <p className="text-base sm:text-xl font-bold truncate">
                  {amount ? parseFloat(amount).toLocaleString() : '0'} {offer.currency}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 truncate">
                  {offer.type === 'buy' ? 'You pay' : 'You receive'} {offer.cryptoSymbol || 'BTC'}
                </p>
                <p className="text-base sm:text-xl font-bold truncate">
                  {cryptoAmount.toFixed(8)}
                </p>
              </div>
            </div>

            {/* Available Balance Display */}
            {offer.type === 'sell' && user && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available Balance:</span>
                  <span className="font-bold text-primary">{availableBalance.toFixed(8)} {offer.cryptoSymbol || 'BTC'}</span>
                </div>
              </div>
            )}
            
            {platformFee > 0 && (
              <div className="p-2 sm:p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Platform fee {feePercentage ? `(${feePercentage}%)` : ''}</span>
                  <span className="font-semibold">-{platformFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {offer.currency}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm mt-1 pt-1 border-t border-border/30">
                  <span className="text-muted-foreground">Net amount</span>
                  <span className="font-bold">{receiveAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {offer.currency}</span>
                </div>
              </div>
            )}
          </div>

          {/* Offer Details */}
          <div className="space-y-2 sm:space-y-3">
            <div className="p-2.5 sm:p-3 bg-muted rounded-lg">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Offer label</p>
              <p className="text-xs sm:text-sm font-medium truncate">{offer.paymentMethod}</p>
            </div>

            <div className="p-2.5 sm:p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Offer terms</p>
                <button
                  onClick={() => setShowMoreTerms(!showMoreTerms)}
                  className="text-[10px] sm:text-xs text-primary flex items-center gap-0.5 sm:gap-1"
                >
                  {showMoreTerms ? 'Show less' : 'Show more'}
                  <ChevronDown className={`h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform ${showMoreTerms ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <p>1. Before a trade starts, the seller selects the bank</p>
                {showMoreTerms && (
                  <>
                    <p>2. The buyer makes payment to the seller's selected bank account</p>
                    <p>3. The buyer uploads payment receipt and marks as paid</p>
                    <p>4. The seller confirms payment and releases {offer.cryptoSymbol}</p>
                    <p>5. Trade is completed and funds are transferred</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bank Account Selection (for sellers) */}
          {showBankSelection && offer.type === 'sell' && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-base">Select Payment Method</h3>
                <button
                  onClick={() => setShowBankSelection(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select the payment method where you want to receive payment
              </p>
              <div className="space-y-2">
                {bankAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedBankAccount(account);
                      setShowBankSelection(false);
                    }}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedBankAccount?.id === account.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold text-sm">{account.bank_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {account.account_number} • {account.account_holder || account.account_name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Bank Account Display */}
          {selectedBankAccount && offer.type === 'sell' && !showBankSelection && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Selected Payment Method</p>
                  <p className="font-semibold text-sm truncate">{selectedBankAccount.payment_type} - {selectedBankAccount.bank_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedBankAccount.account_number}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedBankAccount(null);
                    setShowBankSelection(true);
                  }}
                  className="text-xs h-7"
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Proceed Button */}
          <Button
            className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!amount || parseFloat(amount) < offer.limits.min || parseFloat(amount) > offer.limits.max || isCreatingTrade || (offer.type === 'sell' && !selectedBankAccount)}
            onClick={(e) => {
              e.preventDefault();
              handleProceed();
            }}
            type="button"
          >
            {isCreatingTrade ? "Creating Trade..." : (offer.type === 'sell' && !selectedBankAccount ? "Select Payment Method" : "Proceed")}
            <Bitcoin className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Security Notice */}
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground px-2">
            🔒 Your funds are protected by <span className="font-semibold">escrow</span> for a secure trade
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}