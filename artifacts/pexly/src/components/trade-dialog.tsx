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
import { Circle, ThumbsUp, Bitcoin, X, ChevronDown, ShieldCheck, Lock, Loader2 } from "lucide-react";
import { OfferCardProps } from "./offer-card";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { walletClient } from "@/lib/wallet-client";
import { DialogFooter } from "@/components/ui/dialog";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";

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
  const [showBankSelection, setShowBankSelection] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<any | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const { sessionPassword, setSessionPassword } = useAuth();

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
          // The table name in Supabase for payment methods is 'payment_methods'
          // We fetch all active payment methods for the current user
          const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', user.id);

          if (!error && data) {
            console.log("Fetched payment methods for trade:", data);
            setBankAccounts(data);
          } else {
            console.error("Error fetching payment methods:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [open, offer.type, offer.cryptoSymbol, user]);


  // Calculate crypto amount based on fiat amount and offer price
  const cryptoAmount = amount ? parseFloat(amount) / offer.pricePerBTC : 0;


  const handleProceed = async () => {
    if (!amount) return;

    if (isCreatingTrade) {
      return; // Prevent duplicate submissions
    }

    const fiatAmount = parseFloat(amount);
    if (fiatAmount < offer.limits.min || fiatAmount > offer.limits.max) {
      toast({
        title: "Amount outside limits",
        description: `Please enter an amount between ${offer.limits.min.toLocaleString()} and ${offer.limits.max.toLocaleString()} ${offer.currency}`,
        variant: "destructive",
      });
      return;
    }

    // If this is a sell offer, proceed with bank selection if needed
    if (offer.type === 'sell' && user) {
      if (!selectedBankAccount) {
        if (bankAccounts.length === 0) {
          alert("Please add a payment method first in your settings");
          return;
        }
        setShowBankSelection(true);
        return;
      }
    }

    // Check if password is needed for non-custodial signing (SELL ONLY)
    if (offer.type === 'sell' && !sessionPassword) {
      // setShowPasswordDialog(true);
      // return;
    }

    setIsCreatingTrade(true);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please sign in to create a trade");
        setIsCreatingTrade(false);
        return;
      }

      const authUser = session.user;
      const currentUserId = authUser.id;

      // Get public keys for escrow if BTC
      let buyerPubKey = null;
      let sellerPubKey = null;

      if (offer.cryptoSymbol === 'BTC') {
        try {
          const wallets = nonCustodialWalletManager.getWalletsFromStorage(currentUserId);
          const btcWallet = wallets.find(w => w.chainId.toLowerCase() === 'bitcoin');

          if (btcWallet) {
            const pubKeyHex = (btcWallet as any).publicKey || (btcWallet as any).pubkey;
            if (pubKeyHex) {
              if (offer.type === 'buy') {
                sellerPubKey = pubKeyHex;
              } else {
                buyerPubKey = pubKeyHex;
              }
            }
          }
        } catch (e) {
          console.error("Error deriving BTC pubkey:", e);
        }
      }

      const vendorId = offer.vendor?.id;
      if (!vendorId) {
        alert("Could not find the offer vendor");
        setIsCreatingTrade(false);
        return;
      }

      if (vendorId === currentUserId) {
        alert("Cannot trade with yourself");
        setIsCreatingTrade(false);
        return;
      }

      const isVendorBuying = offer.type === "buy";
      const buyerId = isVendorBuying ? vendorId : currentUserId;
      const sellerId = isVendorBuying ? currentUserId : vendorId;
      
      const timeLimitMinutes = offer.time_limit_minutes || 30;
      const paymentDeadline = new Date(Date.now() + timeLimitMinutes * 60000);

      // DIRECT DATABASE INSERT
      const { data: trade, error: tradeError } = await supabase
        .from("p2p_trades")
        .insert({
          offer_id: offer.id,
          buyer_id: buyerId,
          seller_id: sellerId,
          crypto_symbol: offer.cryptoSymbol,
          fiat_currency: offer.currency,
          crypto_amount: cryptoAmount,
          fiat_amount: fiatAmount,
          price: offer.pricePerBTC,
          payment_method: offer.paymentMethod,
          status: "pending",
          payment_deadline: paymentDeadline.toISOString(),
          seller_pubkey: sellerPubKey,
          buyer_pubkey: buyerPubKey,
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      console.log("Trade created successfully:", trade);

      // Call btc-escrow-create immediately upon trade creation if it's a BTC trade
      if (offer.cryptoSymbol === 'BTC') {
        try {
          const escrowResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/btc-escrow-create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ 
              trade_id: trade.id,
              seller_pubkey: sellerPubKey,
              buyer_pubkey: buyerPubKey
            })
          });

          if (!escrowResponse.ok) {
            console.error("Failed to initialize escrow during trade creation");
          } else {
            console.log("Escrow initialized successfully during trade creation");
          }
        } catch (escrowErr) {
          console.error("Error calling btc-escrow-create:", escrowErr);
        }
      }

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
              sender_id: currentUserId,
              content: bankDetailsMessage,
            });

          console.log("Bank details posted to chat");
        } catch (error) {
          console.error("Error posting bank details:", error);
        }
      }

      // Create notifications for both parties
      try {
        const { data: currentUserProfile } = await supabase
          .from('user_profiles')
          .select('username, avatar_url')
          .eq('id', currentUserId)
          .single();

        const { data: counterpartProfile } = await supabase
          .from('user_profiles')
          .select('username, avatar_url')
          .eq('id', vendorId)
          .single();

        const currentUserName = currentUserProfile?.username || authUser.email?.split('@')[0] || 'User';
        const currentUserAvatar = currentUserProfile?.avatar_url || null;
        const counterpartName = counterpartProfile?.username || offer.vendor?.name || 'User';
        const counterpartAvatar = counterpartProfile?.avatar_url || offer.vendor?.avatar || null;

        await createNotification(
          currentUserId,
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
      } catch (notifError) {
        console.error("Error creating notifications:", notifError);
      }

      onOpenChange(false);
      setLocation(`/trade/${trade.id}`);
    } catch (error) {
      console.error("Error in handleProceed:", error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsCreatingTrade(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (walletPassword.length > 0) {
      setSessionPassword(walletPassword);
      setShowPasswordDialog(false);
      handleProceed();
    }
  };

  return (
    <>
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

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Wallet Password Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Enter your non-custodial wallet password to authorize this trade. Your password is only stored for this session.
            </p>
            <Input
              type="password"
              placeholder="Enter wallet password"
              value={walletPassword}
              onChange={(e) => setWalletPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handlePasswordSubmit} disabled={isCreatingTrade || walletPassword.length === 0}>
              {isCreatingTrade ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Confirm Trade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
