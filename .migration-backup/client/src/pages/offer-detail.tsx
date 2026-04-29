
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Lock, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  Users, 
  ArrowLeftRight, 
  CheckCheck, 
  User, 
  BarChart3, 
  SlidersHorizontal, 
  ChevronDown,
  ArrowLeft,
  Star
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getCountryFlag } from "@/lib/localization";
import { PexlyFooter } from "@/components/pexly-footer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";

interface OfferDetail {
  id: string;
  user_id: string;
  crypto_symbol: string;
  fiat_currency: string;
  type: 'buy' | 'sell';
  payment_method: string;
  price: number;
  min_amount: number;
  max_amount: number;
  terms?: string;
  time_limit?: number;
  is_active: boolean;
  created_at: string;
  user_profile?: {
    username: string;
    country: string;
    avatar_url?: string;
    positive_feedback: number;
    negative_feedback: number;
    total_trades: number;
    is_verified: boolean;
    phone_verified: boolean;
    avg_response_time?: number;
  };
}

export function OfferDetail() {
  const [, params] = useRoute("/offers/:offerId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradeAmount, setTradeAmount] = useState("");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [similarOffers, setSimilarOffers] = useState<any[]>([]);
  const [showMoreTerms, setShowMoreTerms] = useState(false);

  useEffect(() => {
    if (params?.offerId) {
      fetchOfferDetail(params.offerId);
      fetchFeedbacks(params.offerId);
      fetchSimilarOffers(params.offerId);
    }
  }, [params?.offerId]);

  const fetchOfferDetail = async (offerId: string) => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          user_profile:user_profiles!offers_user_id_fkey(
            username,
            country,
            avatar_url,
            positive_feedback,
            negative_feedback,
            total_trades,
            is_verified,
            phone_verified
          )
        `)
        .eq('id', offerId)
        .single();

      if (error) {
        console.error('Error fetching offer:', error);
        toast({
          title: "Error",
          description: "Failed to load offer details",
          variant: "destructive",
        });
        return;
      }

      setOffer(data);
      setTradeAmount(data.min_amount.toString());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async (offerId: string) => {
    try {
      const supabase = createClient();
      
      const { data: offer } = await supabase
        .from('offers')
        .select('user_id')
        .eq('id', offerId)
        .single();

      if (!offer) return;

      const { data } = await supabase
        .from('trade_feedback')
        .select(`
          *,
          from_user_profile:user_profiles!trade_feedback_from_user_id_fkey(
            username,
            country
          )
        `)
        .eq('to_user_id', offer.user_id)
        .order('created_at', { ascending: false })
        .limit(3);

      setFeedbacks(data || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
  };

  const fetchSimilarOffers = async (offerId: string) => {
    try {
      const supabase = createClient();
      
      const { data: currentOffer } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (!currentOffer) return;

      const { data } = await supabase
        .from('offers')
        .select(`
          *,
          user_profile:user_profiles!offers_user_id_fkey(
            username,
            country,
            avatar_url,
            positive_feedback,
            negative_feedback,
            total_trades
          )
        `)
        .eq('crypto_symbol', currentOffer.crypto_symbol)
        .eq('fiat_currency', currentOffer.fiat_currency)
        .eq('payment_method', currentOffer.payment_method)
        .eq('type', currentOffer.type)
        .eq('is_active', true)
        .neq('id', offerId)
        .limit(3);

      setSimilarOffers(data || []);
    } catch (error) {
      console.error('Error fetching similar offers:', error);
    }
  };

  const handleStartTrade = () => {
    if (!offer) return;
    
    const amount = parseFloat(tradeAmount);
    if (amount < offer.min_amount || amount > offer.max_amount) {
      toast({
        title: "Invalid Amount",
        description: `Amount must be between ${offer.min_amount} and ${offer.max_amount} ${offer.fiat_currency}`,
        variant: "destructive",
      });
      return;
    }

    setLocation(`/p2p?offer=${offer.id}&amount=${amount}`);
  };

  const formatTimeLimit = (minutes?: number) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatResponseTime = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Offer not found</p>
        <Button onClick={() => setLocation("/p2p")}>Back to Marketplace</Button>
      </div>
    );
  }

  const cryptoAmount = parseFloat(tradeAmount || "0") / offer.price;
  const feePercent = 0.75;
  const totalWithFee = parseFloat(tradeAmount || "0") * (1 + feePercent / 100);

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="max-w-md mx-4 border-primary/20 shadow-2xl">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
            <p className="text-muted-foreground mb-6">
              Offer details are temporarily unavailable. Please try again later!
            </p>
            <Button onClick={() => window.history.back()} variant="default" className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
      <main className="flex-1 pb-6 opacity-50 pointer-events-none">
        {/* Breadcrumb */}
        <div className="px-4 py-4">
          <Button 
            variant="ghost" 
            className="mb-4 -ml-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="hover:text-foreground cursor-pointer">{offer.user_profile?.country || "Country"}</span>
            <span>/</span>
            <span className="hover:text-foreground cursor-pointer">
              {offer.type === 'sell' ? 'Buy' : 'Sell'} {offer.crypto_symbol}
            </span>
            <span>/</span>
            <span className="font-medium text-foreground">{offer.payment_method}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {offer.type === 'sell' ? 'Buy' : 'Sell'} {offer.crypto_symbol} for {offer.payment_method} {offer.type === 'sell' ? 'from' : 'to'}{" "}
            <span className="text-primary">{offer.user_profile?.username}</span>
          </h1>
        </div>

        {/* Trade Card - Pay */}
        <div className="bg-card border-y border-border mx-4 mb-4 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-muted-foreground">Pay</span>
            <span className="font-semibold text-foreground">{offer.crypto_symbol}</span>
            <span className="text-amber-500 text-lg">₿</span>
          </div>
          
          <div className="bg-muted rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">
                {cryptoAmount.toFixed(8)} ({totalWithFee.toLocaleString()} {offer.fiat_currency})
              </span>
              <span className="bg-background px-3 py-1 rounded-md text-sm font-medium">
                {offer.crypto_symbol}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-lg">₿</span>
              <span className="font-semibold text-foreground">{offer.price.toLocaleString()} {offer.fiat_currency}</span>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                +0.71%
              </Badge>
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm text-right">
            {feePercent}% fee included
          </p>
        </div>

        {/* Trade Input - Receive */}
        <div className="bg-card border-y border-border mx-4 mb-4 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-muted-foreground">Receive</span>
            <span className="font-semibold text-foreground">{offer.payment_method}</span>
          </div>
          
          <div className="bg-muted rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="bg-transparent text-lg font-semibold text-foreground w-full outline-none"
                placeholder="Enter amount"
              />
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setTradeAmount(offer.max_amount.toString())}
                  className="bg-background px-3 py-1 rounded-md text-sm font-medium hover:bg-background/80 transition-colors"
                >
                  MAX
                </button>
                <span className="bg-background px-3 py-1 rounded-md text-sm font-medium">
                  {offer.fiat_currency}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm mb-4">
            Range: <span className="underline cursor-pointer">{offer.min_amount.toLocaleString()}</span> - <span className="underline cursor-pointer">{offer.max_amount.toLocaleString()}</span> {offer.fiat_currency}
          </p>
          
          <Button 
            className="w-full"
            onClick={handleStartTrade}
            disabled={!tradeAmount || parseFloat(tradeAmount) < offer.min_amount || parseFloat(tradeAmount) > offer.max_amount}
          >
            Start trade
          </Button>
          
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>
              Your funds are protected by <span className="font-semibold text-foreground">escrow</span> for a secure trade
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 mb-4">
          <h2 className="text-lg font-bold text-foreground mb-4">User information</h2>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={offer.user_profile?.avatar_url} />
                <AvatarFallback className="bg-muted">
                  {offer.user_profile?.username?.substring(0, 1).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span 
                    className="font-bold text-foreground cursor-pointer hover:underline"
                    onClick={() => setLocation(`/profile/${offer.user_id}`)}
                  >
                    {offer.user_profile?.username}
                  </span>
                  <span className="text-lg">{getCountryFlag(offer.user_profile?.country || '')}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {offer.user_profile?.is_verified && <span className="text-lg">🏆</span>}
                  {offer.user_profile?.phone_verified && <span className="text-lg">🛡️</span>}
                  {(offer.user_profile?.total_trades ?? 0) > 100 && <span className="text-lg">💰</span>}
                  <span className="flex items-center gap-1 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Active now
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {offer.user_profile?.is_verified && (
                <Badge variant="outline" className="gap-1">
                  <CheckCheck className="w-4 h-4" />
                  ID verified
                  <span className="text-base">{getCountryFlag(offer.user_profile?.country || '')}</span>
                </Badge>
              )}
              {offer.user_profile?.phone_verified && (
                <Badge variant="outline" className="gap-1">
                  <CheckCheck className="w-4 h-4" />
                  Phone verified
                  <span className="text-base">{getCountryFlag(offer.user_profile?.country || '')}</span>
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="gap-1">
                <ArrowLeftRight className="w-4 h-4" />
                {offer.user_profile?.total_trades || 0}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-green-500">
                <ThumbsUp className="w-4 h-4" />
                {offer.user_profile?.positive_feedback || 0}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-red-500">
                <ThumbsDown className="w-4 h-4" />
                {offer.user_profile?.negative_feedback || 0}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-4 h-4" />
                {formatResponseTime(offer.user_profile?.avg_response_time)}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Users className="w-4 h-4" />
                {offer.user_profile?.total_trades || 0}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Last location (IP):</span>
                <span className="font-medium text-foreground">{offer.user_profile?.country || 'Unknown'}</span>
                <span className="text-base">{getCountryFlag(offer.user_profile?.country || '')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Offer Info */}
        <div className="px-4 mb-4">
          <h2 className="text-lg font-bold text-foreground mb-4">Offer information</h2>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">no receipt needed</Badge>
              <Badge variant="secondary">no verification needed</Badge>
              <Badge variant="secondary">guided trade</Badge>
            </div>
            
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Country</p>
                <div className="flex items-center gap-2">
                  <span className="text-base">{getCountryFlag(offer.user_profile?.country || '')}</span>
                  <span className="font-medium text-foreground">{offer.user_profile?.country || 'Unknown'}</span>
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Trade time limit</p>
                <p className="font-medium text-foreground">{formatTimeLimit(offer.time_limit)}</p>
              </div>
              
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Amount range</p>
                <p className="font-medium text-foreground">
                  {offer.min_amount.toLocaleString()} - {offer.max_amount.toLocaleString()} {offer.fiat_currency}
                </p>
              </div>
              
              {offer.terms && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Offer terms</p>
                  <p className="text-foreground text-sm">
                    {showMoreTerms ? offer.terms : offer.terms.substring(0, 150)}
                    {offer.terms.length > 150 && !showMoreTerms && '...'}
                  </p>
                  {offer.terms.length > 150 && (
                    <button 
                      onClick={() => setShowMoreTerms(!showMoreTerms)}
                      className="text-muted-foreground text-sm underline mt-2"
                    >
                      {showMoreTerms ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Offer Feedback */}
        {feedbacks.length > 0 && (
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Offer feedback</h2>
              <Button variant="ghost" size="icon">
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{feedback.from_user_profile?.username}</span>
                      <span className="text-base">{getCountryFlag(feedback.from_user_profile?.country || '')}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${feedback.rating === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                      {feedback.rating === 'positive' ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                      <span className="font-medium capitalize">{feedback.rating}</span>
                    </div>
                  </div>
                  
                  {feedback.comment && (
                    <p className="font-medium text-foreground mb-2">{feedback.comment}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{feedback.payment_method}</span>
                      <Badge variant="secondary" className="text-xs">
                        {feedback.currency || offer.fiat_currency}
                      </Badge>
                    </div>
                    <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="px-4 mb-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Pexly and its services on pexly.com (and elsewhere) are not affiliated with, associated with, endorsed by, or sponsored by the selected payment method
            </p>
            
            <Button variant="outline" className="w-full justify-between">
              <span>Report a problem</span>
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Similar Offers */}
        {similarOffers.length > 0 && (
          <div className="px-4 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Similar offers ({similarOffers.length})</h2>
            </div>
            
            <div className="space-y-4">
              {similarOffers.map((similarOffer) => {
                const similarCryptoAmount = 10000 / similarOffer.price;
                return (
                  <div key={similarOffer.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={similarOffer.user_profile?.avatar_url} />
                        <AvatarFallback className="bg-muted">
                          <User className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{getCountryFlag(similarOffer.user_profile?.country || '')}</span>
                          <span 
                            className="font-semibold text-foreground underline cursor-pointer"
                            onClick={() => setLocation(`/offers/${similarOffer.id}`)}
                          >
                            {similarOffer.user_profile?.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{((similarOffer.user_profile?.positive_feedback / (similarOffer.user_profile?.positive_feedback + similarOffer.user_profile?.negative_feedback)) * 100).toFixed(0)}%</span>
                          <span>{similarOffer.user_profile?.total_trades} Trades</span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Active now
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Receive {similarOffer.payment_method}</p>
                        <p className="text-xl font-bold text-foreground">10,000 {similarOffer.fiat_currency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Pay ({similarOffer.crypto_symbol})</p>
                        <p className="text-xl font-bold text-foreground">{similarCryptoAmount.toFixed(8)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 text-lg">₿</span>
                        <span className="font-semibold text-foreground">{similarOffer.price.toLocaleString()} {similarOffer.fiat_currency}</span>
                      </div>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setLocation(`/offers/${similarOffer.id}`)}
                      >
                        {similarOffer.type === 'sell' ? 'Buy' : 'Sell'} {similarOffer.crypto_symbol}
                        <span className="text-amber-500 ml-2">₿</span>
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-2">
                      {similarOffer.min_amount.toLocaleString()} - {similarOffer.max_amount.toLocaleString()} {similarOffer.fiat_currency}
                    </p>
                  </div>
                );
              })}
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => setLocation('/p2p')}
              >
                Explore marketplace
              </Button>
            </div>
          </div>
        )}
      </main>

      <PexlyFooter />
    </div>
  );
}
