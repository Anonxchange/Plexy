import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, Clock, TrendingUp } from "lucide-react";

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
}

export function OfferCard({ vendor, paymentMethod, pricePerBTC, currency, availableRange, limits, type }: OfferCardProps) {
  const handleTrade = () => {
    console.log(`Initiating ${type} trade with ${vendor.name}`);
  };

  return (
    <Card className="hover-elevate border-2 shadow-lg" data-testid={`card-offer-${vendor.name.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={vendor.avatar} />
              <AvatarFallback className="text-lg font-semibold">{vendor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg text-foreground">{vendor.name}</span>
                {vendor.isVerified && (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {vendor.trades.toLocaleString()} trades completed
              </div>
            </div>
          </div>
          <Badge variant={type === "buy" ? "default" : "secondary"} className="text-sm px-3 py-1">
            {type === "buy" ? "Buy" : "Sell"}
          </Badge>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
          <div className="text-sm font-medium text-muted-foreground mb-2">Payment Method</div>
          <div className="font-bold text-lg text-foreground">{paymentMethod}</div>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold tabular-nums text-foreground">
            ${pricePerBTC.toLocaleString()}
          </span>
          <span className="text-lg text-muted-foreground font-medium">/ BTC</span>
        </div>

        <div className="grid grid-cols-2 gap-6 py-4 border-y-2 border-border">
          <div>
            <div className="text-sm font-semibold text-muted-foreground mb-2">Available</div>
            <div className="text-base font-bold text-foreground">
              {availableRange.min.toLocaleString()} - {availableRange.max.toLocaleString()} {currency}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-muted-foreground mb-2">Limits</div>
            <div className="text-base font-bold text-foreground">
              {limits.min.toLocaleString()} - {limits.max.toLocaleString()} {currency}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">{vendor.responseTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-600">High volume</span>
          </div>
        </div>

        <Button 
          className="w-full h-12 text-base font-bold shadow-lg" 
          variant={type === "buy" ? "default" : "secondary"}
          onClick={handleTrade}
          data-testid={`button-trade-${type}`}
        >
          {type === "buy" ? "Buy BTC" : "Sell BTC"}
        </Button>
      </CardContent>
    </Card>
  );
}
