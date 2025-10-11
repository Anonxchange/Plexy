
import { useState } from "react";
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

interface TradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: OfferCardProps;
}

export function TradeDialog({ open, onOpenChange, offer }: TradeDialogProps) {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  const [showMoreTerms, setShowMoreTerms] = useState(false);

  const cryptoAmount = amount ? parseFloat(amount) / offer.pricePerBTC : 0;
  const receiveAmount = amount ? parseFloat(amount) / offer.pricePerBTC : 0;

  const handleProceed = () => {
    // Generate a trade ID (in production, this would come from your backend)
    const tradeId = `trade_${Date.now()}`;
    onOpenChange(false);
    setLocation(`/trade/${tradeId}`);
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
            <div>
              <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 truncate">
                Pay {offer.paymentMethod}
              </p>
              <p className="text-base sm:text-xl font-bold truncate">
                {amount ? parseFloat(amount).toLocaleString() : '0'} {offer.currency}
              </p>
            </div>
            <div>
              <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 truncate">
                Receive ({cryptoAmount.toFixed(8)} {offer.cryptoSymbol})
              </p>
              <p className="text-base sm:text-xl font-bold truncate">
                {receiveAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {offer.currency}
              </p>
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

          {/* Proceed Button */}
          <Button
            className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!amount || parseFloat(amount) < offer.limits.min || parseFloat(amount) > offer.limits.max}
            onClick={(e) => {
              e.preventDefault();
              handleProceed();
            }}
            type="button"
          >
            Proceed
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
