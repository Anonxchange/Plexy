import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, Circle, Bitcoin, ArrowRight, DollarSign } from "lucide-react";
import { TradeDialog } from "./trade-dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export interface OfferCardProps {
  id?: string;
  vendor: {
    name: string;
    avatar?: string;
    isVerified: boolean;
    trades: number;
    responseTime: string;
    id?: string;
  };
  paymentMethod: string;
  pricePerBTC: number;
  currency: string;
  availableRange: { min: number; max: number };
  limits: { min: number; max: number };
  type: "buy" | "sell";
  cryptoSymbol?: string;
  time_limit_minutes?: number;
}

const getCryptoIcon = (symbol: string) => {
  switch (symbol) {
    case "BTC":
      return <Bitcoin className="h-5 w-5 text-orange-500" />;
    case "ETH":
      return <span className="text-xl text-blue-400">Ξ</span>;
    case "USDT":
      return <span className="text-xl text-green-600">₮</span>;
    default:
      return <Bitcoin className="h-5 w-5 text-orange-500" />;
  }
};

export function OfferCard({ 
  vendor, 
  paymentMethod, 
  pricePerBTC, 
  currency, 
  availableRange, 
  limits, 
  type,
  cryptoSymbol = "BTC",
  time_limit_minutes = 30,
  ...offer
}: OfferCardProps) {
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleTrade = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start trading",
        variant: "destructive",
      });
      setLocation("/signin");
      return;
    }
    setShowTradeDialog(true);
  };

  const cryptoAmount = limits.min / pricePerBTC;

  return (
    <>
      <TradeDialog 
        open={showTradeDialog} 
        onOpenChange={setShowTradeDialog}
        offer={{ vendor, paymentMethod, pricePerBTC, currency, availableRange, limits, type, cryptoSymbol, time_limit_minutes, ...offer } as OfferCardProps}
      />
      <Card className="hover:shadow-lg transition-shadow border-2 border-primary/50" data-testid={`card-offer-${vendor.name.toLowerCase().replace(/\s+/g, '-')}`}>
        <CardContent className="p-4 space-y-3">
          {/* Vendor Info Row */}
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={vendor.avatar} />
              <AvatarFallback className="text-base font-semibold bg-primary/10">
                {vendor.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-base">{vendor.name}</span>
                <span className="text-base">🇳🇬</span>
                {vendor.isVerified && (
                  <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-green-600" />
                    POWER
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <ThumbsUp className="h-3 w-3" />
                <span>100%</span>
                <span>{vendor.trades} Trades</span>
                <Circle className="h-1 w-1 fill-green-500" />
                <span className="text-green-500">Active now</span>
              </div>
            </div>
          </div>

          <Separator className="my-1" />

          {/* Pay and Receive Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                {type === "buy" ? "Pay" : "Receive"} {paymentMethod}
                {currency === "NGN" && " 🇳🇬"}
                {currency === "USD" && " 🇺🇸"}
                {currency === "EUR" && " 🇪🇺"}
                {currency === "GBP" && " 🇬🇧"}
                {currency === "CAD" && " 🇨🇦"}
                {currency === "RON" && " 🇷🇴"}
                {currency === "KES" && " 🇰🇪"}
                {currency === "INR" && " 🇮🇳"}
              </div>
              <div className="text-xl font-bold">
                {limits.min.toLocaleString()} {currency}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {type === "buy" ? "Receive" : "Pay"} ({cryptoSymbol})
              </div>
              <div className="text-xl font-bold">
                {cryptoAmount.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 8 
                })} {cryptoSymbol}
              </div>
            </div>
          </div>

          {/* Price and Button Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {pricePerBTC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{limits.min.toLocaleString()} - {limits.max.toLocaleString()} {currency}</span>
                <span className="text-primary font-medium">| {time_limit_minutes} min</span>
              </div>
            </div>
            <Button 
              className="bg-[#C4F82A] hover:bg-[#b5e625] text-black font-bold gap-2 shrink-0"
              onClick={handleTrade}
              data-testid={`button-trade-${type}`}
            >
              {type === "sell" ? "Sell" : "Buy"} {cryptoSymbol}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}