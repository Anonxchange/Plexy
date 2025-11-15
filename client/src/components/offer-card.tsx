import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Circle, Bitcoin, ArrowRight, DollarSign, Globe, Shield, Award } from "lucide-react";
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
    merchantStatus?: string;
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

const getCountryFlag = (country: string) => {
  // Map of country names to flag emojis
  const flagsByName: Record<string, string> = {
    "Nigeria": "🇳🇬",
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    "Ghana": "🇬🇭",
    "Kenya": "🇰🇪",
    "South Africa": "🇿🇦",
    "Canada": "🇨🇦",
    "Australia": "🇦🇺",
    "India": "🇮🇳",
    "Philippines": "🇵🇭",
    "Indonesia": "🇮🇩",
    "Malaysia": "🇲🇾",
    "Singapore": "🇸🇬",
    "Thailand": "🇹🇭",
    "Vietnam": "🇻🇳",
    "UAE": "🇦🇪",
    "Saudi Arabia": "🇸🇦",
    "Egypt": "🇪🇬",
    "Algeria": "🇩🇿",
    "Ethiopia": "🇪🇹",
    "France": "🇫🇷",
    "Germany": "🇩🇪",
    "Italy": "🇮🇹",
    "Spain": "🇪🇸",
    "Brazil": "🇧🇷",
    "Mexico": "🇲🇽",
    "Argentina": "🇦🇷",
    "Dominican Republic": "🇩🇴",
  };

  return flagsByName[country] || "🌍";
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
  const [vendorPresence, setVendorPresence] = useState<{ isOnline: boolean; lastSeen: string | null }>({ isOnline: false, lastSeen: null });

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

  useEffect(() => {
    const fetchPresence = async () => {
      if (vendor.id) {
        const { presenceTracker } = await import('@/lib/presence');
        const presence = await presenceTracker.getUserPresence(vendor.id);
        setVendorPresence(presence);

        const channel = presenceTracker.subscribeToUserPresence(vendor.id, (updatedPresence) => {
          setVendorPresence(updatedPresence);
        });

        return channel;
      }
    };

    let channel: any;
    fetchPresence().then(ch => { channel = ch; });

    return () => {
      if (channel) {
        const supabase = import('@/lib/supabase').then(({ createClient }) => {
          const client = createClient();
          client.removeChannel(channel);
        });
      }
    };
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

  // Get the country flag - use vendor's country, or first country from restrictions
  const countryFlag = vendor.country
    ? getCountryFlag(vendor.country)
    : (country_restrictions && country_restrictions.length > 0
      ? getCountryFlag(country_restrictions[0])
      : null);

  return (
    <>
      <TradeDialog
        open={showTradeDialog}
        onOpenChange={setShowTradeDialog}
        offer={{ vendor, paymentMethod, pricePerBTC, currency, availableRange, limits, type, cryptoSymbol, time_limit_minutes, country_restrictions, ...offer } as OfferCardProps}
      />
      <Card className="hover:shadow-lg transition-shadow border-purple-100 dark:border-purple-900/30" data-testid={`card-offer-${vendor.name.toLowerCase().replace(/\s+/g, '-')}`}>
        <CardContent className="p-3 sm:p-4 space-y-3">
          {/* Vendor Info Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 sm:h-14 sm:w-14 bg-purple-500 flex-shrink-0">
                <AvatarImage src={vendor.avatar} />
                <AvatarFallback className="text-sm sm:text-base font-semibold bg-purple-500 text-white">
                  {vendor.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm sm:text-base truncate">{vendor.name}</span>
                  {countryFlag ? (
                    <span className="text-sm sm:text-base flex-shrink-0">
                      {countryFlag}
                    </span>
                  ) : (
                    <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  {vendor.isVerified && (
                    <span className="text-[10px] sm:text-xs font-medium text-green-600 flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                      <Circle className="h-1.5 w-1.5 sm:h-2 sm:w-2 fill-green-600" />
                      <span className="hidden xs:inline">POWER</span>
                    </span>
                  )}
                  {vendor.merchantStatus === "block_merchant" && (
                    <Badge variant="default" className="text-[10px] sm:text-xs px-1 sm:px-2 py-0 h-4 sm:h-5 bg-purple-600 hover:bg-purple-700 flex items-center gap-0.5 flex-shrink-0">
                      <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">Block</span>
                    </Badge>
                  )}
                  {vendor.merchantStatus === "verified_merchant" && (
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2 py-0 h-4 sm:h-5 bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-0.5 flex-shrink-0">
                      <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">Verified</span>
                    </Badge>
                  )}
                  {userMedals.length > 0 && (
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                      {userMedals.slice(0, 2).map((medal) => (
                        <img
                          key={medal.id}
                          src={medal.icon}
                          alt={medal.name}
                          className="h-4 w-4 sm:h-5 sm:w-5 object-contain"
                          title={medal.name}
                        />
                      ))}
                      {userMedals.length > 2 && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground">+{userMedals.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                  <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>100%</span>
                  <span className="hidden xs:inline">{vendor.trades} Trades</span>
                  <span className="xs:hidden">{vendor.trades}T</span>
                  {vendorPresence.isOnline ? (
                    <>
                      <Circle className="h-1 w-1 fill-green-500" />
                      <span className="text-green-500">Active</span>
                    </>
                  ) : vendorPresence.lastSeen ? (
                    <>
                      <Circle className="h-1 w-1 fill-gray-500" />
                      <span className="text-gray-500">{(() => {
                        try {
                          const { formatLastSeen } = require('@/lib/presence');
                          return formatLastSeen(vendorPresence.lastSeen);
                        } catch (error) {
                          return 'Offline';
                        }
                      })()}</span>
                    </>
                  ) : (
                    <>
                      <Circle className="h-1 w-1 fill-gray-500" />
                      <span className="text-gray-500">Offline</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 text-muted-foreground text-[10px] sm:text-sm flex-shrink-0">
              <Circle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-500" />
              <span className="whitespace-nowrap">{time_limit_minutes}m</span>
            </div>
          </div>

          <Separator className="my-1" />

          {/* Pay and Receive Row */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="min-w-0">
              <div className="text-[10px] sm:text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-purple-500 rounded flex-shrink-0"></div>
                <span className="truncate">{paymentMethod}</span>
              </div>
              <div className="text-base sm:text-xl font-bold flex items-center gap-1 sm:gap-1.5">
                <span className="flex-shrink-0">
                  {currency === "NGN" && "🇳🇬"}
                  {currency === "USD" && "🇺🇸"}
                  {currency === "EUR" && "🇪🇺"}
                  {currency === "GBP" && "🇬🇧"}
                  {currency === "CAD" && "🇨🇦"}
                  {currency === "AUD" && "🇦🇺"}
                  {currency === "INR" && "🇮🇳"}
                  {currency === "KES" && "🇰🇪"}
                  {currency === "GHS" && "🇬🇭"}
                  {currency === "ZAR" && "🇿🇦"}
                  {currency === "EGP" && "🇪🇬"}
                  {currency === "DZD" && "🇩🇿"}
                  {currency === "ETB" && "🇪🇹"}
                  {currency === "BRL" && "🇧🇷"}
                  {currency === "MXN" && "🇲🇽"}
                  {currency === "ARS" && "🇦🇷"}
                  {currency === "JPY" && "🇯🇵"}
                  {currency === "CNY" && "🇨🇳"}
                  {currency === "KRW" && "🇰🇷"}
                  {currency === "SGD" && "🇸🇬"}
                  {currency === "THB" && "🇹🇭"}
                  {currency === "VND" && "🇻🇳"}
                  {currency === "AED" && "🇦🇪"}
                  {currency === "SAR" && "🇸🇦"}
                </span>
                <span className="truncate">{limits.min.toLocaleString()} {currency}</span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-sm text-muted-foreground mb-1 truncate">
                {type === "buy" ? "Receive" : "Pay"} ({cryptoSymbol})
              </div>
              <div className="text-base sm:text-xl font-bold truncate">
                {cryptoAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8
                })} {cryptoSymbol}
              </div>
            </div>
          </div>

          {/* Price and Button Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0 w-full sm:w-auto order-1 sm:order-first">
              <div className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-normal">{currency}</span>
                <span className="truncate">{pricePerBTC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-2">
                <span className="truncate">{limits.min.toLocaleString()} - {limits.max.toLocaleString()} {currency}</span>
              </div>
            </div>
            <Button
              className="bg-[#C4F82A] hover:bg-[#b5e625] text-black font-bold gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base order-2 sm:order-last"
              onClick={handleTrade}
              data-testid={`button-trade-${type}`}
            >
              {type === "sell" ? "Sell" : "Buy"} {cryptoSymbol}
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}