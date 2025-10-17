import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, Circle, Bitcoin, ArrowRight, DollarSign, Globe } from "lucide-react";
import { TradeDialog } from "./trade-dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useVerificationGuard } from "@/hooks/use-verification-guard";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { medals, isMedalEarned } from "@/lib/medals";
import { getUserMedalStats } from "@/lib/medals-api";

export interface OfferCardProps {
  id?: string;
  vendor: {
    name: string;
    avatar?: string;
    isVerified: boolean;
    trades: number;
    responseTime: string;
    id?: string;
    country?: string;
  };
  paymentMethod: string;
  pricePerBTC: number;
  currency: string;
  availableRange: { min: number; max: number };
  limits: { min: number; max: number };
  type: "buy" | "sell";
  cryptoSymbol?: string;
  time_limit_minutes?: number;
  country_restrictions?: string[] | null;
}

const getCryptoIcon = (symbol: string) => {
  return (
    <img 
      src={cryptoIconUrls[symbol] || `https://ui-avatars.com/api/?name=${symbol}&background=random`} 
      alt={symbol}
      className="h-5 w-5 rounded-full"
    />
  );
};

const getCountryCode = (country: string) => {
  // Map of country names to codes
  const codesByName: Record<string, string> = {
    "Nigeria": "NG",
    "United States": "US",
    "United Kingdom": "GB",
    "Ghana": "GH",
    "Kenya": "KE",
    "South Africa": "ZA",
    "Canada": "CA",
    "Australia": "AU",
    "India": "IN",
    "Philippines": "PH",
    "Indonesia": "ID",
    "Malaysia": "MY",
    "Singapore": "SG",
    "Thailand": "TH",
    "Vietnam": "VN",
    "UAE": "AE",
    "Saudi Arabia": "SA",
    "Egypt": "EG",
    "Algeria": "DZ",
    "Ethiopia": "ET",
    "France": "FR",
    "Germany": "DE",
    "Italy": "IT",
    "Spain": "ES",
    "Brazil": "BR",
    "Mexico": "MX",
    "Argentina": "AR",
    "Dominican Republic": "DO",
  };
  
  // If already a code, return it; otherwise look it up
  if (country.length === 2) return country;
  return codesByName[country] || null;
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
  country_restrictions,
  ...offer
}: OfferCardProps) {
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { checkCanTrade, isLevel0 } = useVerificationGuard();
  const [userMedals, setUserMedals] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserMedals = async () => {
      if (vendor.id) {
        try {
          const stats = await getUserMedalStats(vendor.id);
          const earnedMedals = medals.filter(medal => isMedalEarned(medal, stats));
          setUserMedals(earnedMedals);
        } catch (error) {
          console.error('Error fetching medals:', error);
        }
      }
    };

    fetchUserMedals();
  }, [vendor.id]);

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

    if (isLevel0) {
      toast({
        title: "Verification Required",
        description: "Level 0 users cannot trade. Please complete verification to start trading.",
        variant: "destructive",
      });
      setLocation("/verification");
      return;
    }

    const tradeAmount = limits.min;
    const tradeCheck = checkCanTrade(tradeAmount);
    
    if (!tradeCheck.allowed) {
      toast({
        title: "Trade Limit Exceeded",
        description: tradeCheck.reason,
        variant: "destructive",
      });
      setLocation("/verification");
      return;
    }

    setShowTradeDialog(true);
  };

  const cryptoAmount = limits.min / pricePerBTC;
  
  // Get the country code - use vendor's country, or first country from restrictions
  const countryCode = vendor.country 
    ? getCountryCode(vendor.country)
    : (country_restrictions && country_restrictions.length > 0 
      ? getCountryCode(country_restrictions[0])
      : null);

  return (
    <>
      <TradeDialog 
        open={showTradeDialog} 
        onOpenChange={setShowTradeDialog}
        offer={{ vendor, paymentMethod, pricePerBTC, currency, availableRange, limits, type, cryptoSymbol, time_limit_minutes, country_restrictions, ...offer } as OfferCardProps}
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
                {countryCode ? (
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {countryCode}
                  </span>
                ) : (
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {vendor.isVerified && (
                  <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-green-600" />
                    POWER
                  </span>
                )}
                {userMedals.length > 0 && (
                  <>
                    {userMedals.slice(0, 3).map((medal) => (
                      <img 
                        key={medal.id}
                        src={medal.icon} 
                        alt={medal.name}
                        className="h-5 w-5 object-contain"
                        title={medal.name}
                      />
                    ))}
                    {userMedals.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{userMedals.length - 3}</span>
                    )}
                  </>
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
              <div className="text-sm text-muted-foreground mb-1">
                {type === "buy" ? "Pay" : "Receive"} {paymentMethod}
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
                {getCryptoIcon(cryptoSymbol)}
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