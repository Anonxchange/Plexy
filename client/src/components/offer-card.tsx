import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Circle, Bitcoin } from "lucide-react";
import { TradeDialog } from "./trade-dialog";

export interface OfferCardProps {
  id: string;
  vendor: {
    name: string;
    avatar?: string;
    isVerified: boolean;
    trades: number;
    responseTime: string;
  };
  paymentMethod: string;
  pricePerBTC: number;
  currency: string;
  availableRange: { min: number; max: number };
  limits: { min: number; max: number };
  type: "buy" | "sell";
  cryptoSymbol?: string;
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
  ...offer
}: OfferCardProps) {
  const [showTradeDialog, setShowTradeDialog] = useState(false);

  const handleTrade = () => {
    setShowTradeDialog(true);
  };

  const cryptoAmount = limits.min / pricePerBTC;

  return (
    <>
      <TradeDialog 
        open={showTradeDialog} 
        onOpenChange={setShowTradeDialog}
        offer={{ vendor, paymentMethod, pricePerBTC, currency, availableRange, limits, type, cryptoSymbol, ...offer } as OfferCardProps}
      />
      <Card className="bg-card border-border hover:border-primary/50 transition-colors" data-testid={`card-offer-${vendor.name.toLowerCase().replace(/\s+/g, '-')}`}>
        <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={vendor.avatar} />
              <AvatarFallback className="text-sm font-semibold bg-primary/10">
                {vendor.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{vendor.name}</span>
                {vendor.isVerified && (
                  <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-green-600" />
                    POWER
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ThumbsUp className="h-3 w-3" />
                <span>100%</span>
                <span>{vendor.trades} Trades</span>
                <Circle className="h-1 w-1 fill-green-500" />
                <span className="text-green-500">Active now</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {type === "buy" ? "Pay" : "Receive"} <span className="text-primary">{paymentMethod}</span>
            </div>
            <div className="text-lg font-bold">
              {limits.min.toLocaleString()} {currency}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {type === "buy" ? "Receive" : "Pay"} ({cryptoSymbol})
            </div>
            <div className="text-lg font-bold">
              {cryptoAmount.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 8 
              })} {cryptoSymbol}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            {getCryptoIcon(cryptoSymbol)}
            <div>
              <div className="text-sm font-bold">
                {pricePerBTC.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })} {currency}
              </div>
              <div className="text-xs text-muted-foreground">
                {limits.min.toLocaleString()} - {limits.max.toLocaleString()} {currency}
              </div>
            </div>
          </div>
          <Button 
            className={`${
              type === "sell" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-blue-600 hover:bg-blue-700"
            } text-white font-bold px-6`}
            onClick={handleTrade}
            data-testid={`button-trade-${type}`}
          >
            {type === "sell" ? "Sell" : "Buy"} {cryptoSymbol}
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
