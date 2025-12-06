import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  Copy, 
  Info, 
  RefreshCw,
  FileText,
  X,
  AlertTriangle,
  Pencil,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  submitFeedback,
  updateFeedback,
  submitResponse,
  getMyFeedbackForTrade,
  getCounterpartyFeedbackForTrade,
  type TradeFeedback,
} from "@/lib/feedback-api";

interface TradeCompletedSectionProps {
  trade: {
    id: string;
    crypto_symbol: string;
    crypto_amount: number;
    fiat_currency: string;
    fiat_amount: number;
    price: number;
    payment_method: string;
    created_at: string;
    completed_at?: string | null;
    offer_id?: string;
    offer_terms?: string;
    buyer_id?: string;
    seller_id?: string;
  };
  isUserBuyer: boolean;
  sellerProfile?: {
    username: string;
    avatar_url: string | null;
    positive_ratings: number;
    negative_ratings: number;
  };
  buyerProfile?: {
    username: string;
    avatar_url: string | null;
    positive_ratings: number;
    negative_ratings: number;
  };
}

interface UserProfile {
  username: string;
  avatar_url: string | null;
}

export function TradeCompletedSection({
  trade,
  isUserBuyer,
  sellerProfile,
  buyerProfile,
}: TradeCompletedSectionProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [feedbackType, setFeedbackType] = useState<"positive" | "negative">("positive");
  const [feedbackText, setFeedbackText] = useState("");
  const [responseText, setResponseText] = useState("");
  const [isTrusted, setIsTrusted] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);

  const [myFeedback, setMyFeedback] = useState<TradeFeedback | null>(null);
  const [counterpartyFeedback, setCounterpartyFeedback] = useState<TradeFeedback | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  const counterparty = isUserBuyer ? sellerProfile : buyerProfile;
  const counterpartyId = isUserBuyer ? trade.seller_id : trade.buyer_id;
  const maxChars = 500;
  const charsLeft = maxChars - feedbackText.length;

  useEffect(() => {
    loadFeedback();
  }, [trade.id, counterpartyId]);

  const loadFeedback = async () => {
    setIsLoading(true);
    try {
      const supabase = await import("@/lib/supabase").then(m => m.createClient());
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get current user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setCurrentUserProfile(profile);
      }

      // Fetch ALL feedback for this trade - simpler and more reliable
      const { data: allFeedback, error } = await supabase
        .from('trade_feedback')
        .select('*')
        .eq('trade_id', trade.id);

      if (error) {
        console.error("Error fetching feedback:", error);
        setIsLoading(false);
        return;
      }

      if (allFeedback && allFeedback.length > 0) {
        // My feedback = where I am the sender (from_user_id === user.id)
        const myFb = allFeedback.find(fb => fb.from_user_id === user.id);
        if (myFb) {
          setMyFeedback(myFb);
          setFeedbackType(myFb.rating);
          setFeedbackText(myFb.comment || "");
        }

        // Counterparty feedback = where I am NOT the sender (from_user_id !== user.id)
        const counterpartyFb = allFeedback.find(fb => fb.from_user_id !== user.id);
        if (counterpartyFb) {
          setCounterpartyFeedback(counterpartyFb);
        }
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTradeId = () => {
    navigator.clipboard.writeText(trade.id);
    toast({
      title: "Copied!",
      description: "Trade ID copied to clipboard",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "a minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "an hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;

    return date.toLocaleDateString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSaveFeedback = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Error",
        description: "Please enter feedback text",
        variant: "destructive",
      });
      return;
    }

    if (!counterpartyId) {
      toast({
        title: "Error",
        description: "Unable to identify trading partner",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      if (myFeedback) {
        const result = await updateFeedback({
          feedbackId: myFeedback.id,
          rating: feedbackType,
          comment: feedbackText,
        });

        if (result.success) {
          setMyFeedback(result.feedback || null);
          setIsEditing(false);
          toast({
            title: "Feedback Updated",
            description: "Your feedback has been updated successfully",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update feedback",
            variant: "destructive",
          });
        }
      } else {
        const result = await submitFeedback({
          tradeId: trade.id,
          toUserId: counterpartyId,
          rating: feedbackType,
          comment: feedbackText,
          paymentMethod: trade.payment_method,
          cryptoSymbol: trade.crypto_symbol,
          fiatCurrency: trade.fiat_currency,
          tradeAmount: trade.crypto_amount,
        });

        if (result.success) {
          setMyFeedback(result.feedback || null);
          toast({
            title: "Feedback Saved",
            description: "Your feedback has been submitted successfully",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to submit feedback",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !counterpartyFeedback) return;

    setIsSubmittingResponse(true);

    try {
      const result = await submitResponse({
        feedbackId: counterpartyFeedback.id,
        response: responseText,
      });

      if (result.success) {
        setCounterpartyFeedback(result.feedback || null);
        setResponseText("");
        toast({
          title: "Response Submitted",
          description: "Your response has been saved",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit response",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleEditFeedback = () => {
    if (myFeedback) {
      setFeedbackType(myFeedback.rating);
      setFeedbackText(myFeedback.comment || "");
      setIsEditing(true);
    }
  };

  const platformFee = trade.crypto_amount * 0.0075;

  const showFeedbackForm = !myFeedback || isEditing;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg overflow-hidden border shadow-sm">
        <div className="bg-green-600 p-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
          <span className="font-semibold text-white">Trade Completed</span>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">
              You {isUserBuyer ? "purchased" : "sold"} {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}
            </h3>

            <div className="text-sm text-muted-foreground mb-3">Trade Summary</div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={sellerProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary">
                    {sellerProfile?.username?.substring(0, 1).toUpperCase() || "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sellerProfile?.username || "Seller"}</span>
                    <span className="bg-secondary text-xs px-2 py-0.5 rounded">Sold</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {trade.fiat_amount.toLocaleString()} {trade.fiat_currency} → {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={buyerProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary">
                    {buyerProfile?.username?.substring(0, 1).toUpperCase() || "B"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{buyerProfile?.username || "Buyer"}</span>
                    <span className="bg-green-600/20 text-green-500 text-xs px-2 py-0.5 rounded border border-green-600/30">Purchased</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {trade.fiat_amount.toLocaleString()} {trade.fiat_currency} → {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsTrusted(!isTrusted)}
              className="flex items-center gap-2 mt-4 text-sm text-destructive hover:text-destructive/80 transition-colors"
            >
              <X className="w-4 h-4" />
              {isTrusted ? "Remove from trusted users" : "Add to trusted users"}
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-medium mb-3">How was your trading experience?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              You can leave only one feedback for each payment method trade.
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={feedbackType === "positive" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFeedbackType("positive")}
                    className={feedbackType === "positive" ? "bg-green-600 hover:bg-green-700" : ""}
                    disabled={!!myFeedback && !isEditing}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={feedbackType === "negative" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFeedbackType("negative")}
                    className={feedbackType === "negative" ? "bg-red-600 hover:bg-red-700" : ""}
                    disabled={!!myFeedback && !isEditing}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                </div>

                {showFeedbackForm && (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {isEditing ? "Edit your feedback for" : "Leave feedback for"} {counterparty?.username || "trader"}
                    </div>
                    <Textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value.slice(0, maxChars))}
                      placeholder="Share your experience with this trade..."
                      className="min-h-[80px] bg-muted border-border"
                      maxLength={maxChars}
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="w-4 h-4" />
                      Characters left: {charsLeft}
                    </div>

                    {isEditing && (
                      <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3 text-sm text-amber-200">
                        You are editing your feedback. Changes will be saved when you click Save.
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveFeedback}
                        disabled={isSubmittingFeedback}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isSubmittingFeedback ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          isEditing ? "Update Feedback" : "Save Feedback"
                        )}
                      </Button>
                      {isEditing && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            if (myFeedback) {
                              setFeedbackType(myFeedback.rating);
                              setFeedbackText(myFeedback.comment || "");
                            }
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {myFeedback && !isEditing && (
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      {myFeedback.rating === "positive" ? (
                        <>
                          <ThumbsUp className="w-4 h-4 text-green-500" />
                          <span className="text-green-500 font-medium">Positive</span>
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="w-4 h-4 text-red-500" />
                          <span className="text-red-500 font-medium">Negative</span>
                        </>
                      )}
                      <span className="text-sm text-muted-foreground ml-auto">
                        {formatDate(myFeedback.created_at)}
                      </span>
                    </div>
                    <button
                      onClick={() => setLocation("/profile")}
                      className="text-primary font-medium mb-1 hover:underline"
                    >
                      {currentUserProfile?.username || "You"}
                    </button>
                    <p className="text-sm text-muted-foreground mb-3">{myFeedback.comment}</p>
                    <button 
                      onClick={handleEditFeedback}
                      className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Feedback
                    </button>
                  </div>
                )}

                {counterpartyFeedback && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-3">
                      Feedback from {counterparty?.username}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        {counterpartyFeedback.rating === "positive" ? (
                          <>
                            <ThumbsUp className="w-4 h-4 text-green-500" />
                            <span className="text-green-500 font-medium">Positive</span>
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="w-4 h-4 text-red-500" />
                            <span className="text-red-500 font-medium">Negative</span>
                          </>
                        )}
                        <span className="text-sm text-muted-foreground ml-auto">
                          {formatDate(counterpartyFeedback.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={() => counterpartyId && setLocation(`/profile/${counterpartyId}`)}
                        className="text-primary font-medium mb-1 hover:underline"
                      >
                        {counterparty?.username}
                      </button>
                      <p className="text-sm text-muted-foreground mb-3">{counterpartyFeedback.comment}</p>

                      {counterpartyFeedback.response ? (
                        <div className="bg-muted rounded-lg p-3 mt-2">
                          <div className="text-xs text-muted-foreground mb-1">Your response:</div>
                          <p className="text-sm">{counterpartyFeedback.response}</p>
                        </div>
                      ) : !showResponseForm ? (
                        <button
                          onClick={() => setShowResponseForm(true)}
                          className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                        >
                          <span className="text-lg">+</span>
                          Respond
                        </button>
                      ) : (
                        <div className="space-y-2 mt-3">
                          <Textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value.slice(0, maxChars))}
                            placeholder="Thank you for the feedback..."
                            className="min-h-[60px] bg-muted border-border"
                            maxLength={maxChars}
                          />
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Info className="w-4 h-4" />
                            Characters left: {maxChars - responseText.length}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={handleSubmitResponse}
                              disabled={isSubmittingResponse || !responseText.trim()}
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                            >
                              {isSubmittingResponse ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                "Submit Response"
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setShowResponseForm(false);
                                setResponseText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!counterpartyFeedback && !isLoading && myFeedback && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-2">
                      Feedback from {counterparty?.username}
                    </div>
                    <div className="bg-secondary rounded-lg p-3 text-sm text-muted-foreground">
                      {counterparty?.username} hasn't left feedback yet.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              className="w-full bg-red-900/50 hover:bg-red-900/70 border border-red-800 text-white justify-between"
              onClick={() => setLocation(`/create-offer?repeat=${trade.id}`)}
            >
              Repeat Trade
              <RefreshCw className="w-5 h-5" />
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-between"
            >
              Public Receipt
              <FileText className="w-5 h-5" />
            </Button>

            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm hover:bg-muted/50 rounded-lg transition-colors"
            >
              <Star className={`w-5 h-5 ${isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
              {isFavorite ? "Remove from favorites" : "Add to favorites"}
            </button>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setLocation(`/offers/${trade.offer_id}`)}
          >
            View Offer
          </Button>

          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">₿</span>
              <span className="font-medium">
                You are {isUserBuyer ? "buying" : "selling"} {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol} for {trade.fiat_amount.toLocaleString()} {trade.fiat_currency} using {trade.payment_method}
              </span>
            </div>

            <div className="bg-secondary/50 rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Trade responsibly. Pexly strives to help, but not all disputes or losses can be resolved.</span>
            </div>

            <div className="bg-secondary/50 rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <span>
                Keep all trades on Pexly. Off-platform trades are not supported and may put you at risk. 
                Learn how to protect yourself: <a href="/terms" className="text-primary underline">Rules for Selling Crypto</a>
              </span>
            </div>

            <Button variant="outline" className="w-full">
              Report Bad Behaviour
            </Button>
          </div>

          {trade.offer_terms && (
            <div className="space-y-3">
              <h4 className="font-semibold">Terms</h4>
              <div className="flex items-center gap-2 text-sm text-primary">
                <span>Translate into</span>
                <Info className="w-4 h-4" />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-secondary text-xs px-3 py-1.5 rounded">no receipt needed</span>
                <span className="bg-secondary text-xs px-3 py-1.5 rounded">no verification needed</span>
                <span className="bg-secondary text-xs px-3 py-1.5 rounded">guided trade</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Please follow the trade instructions in the chat window to complete this transaction.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-semibold">Trade Information</h4>
            <p className="text-sm text-muted-foreground">
              {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol} has been reserved for this trade. 
              This includes Pexly's fee of {platformFee.toFixed(8)} {trade.crypto_symbol}.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">RATE</div>
                <div className="text-sm font-medium">{trade.price.toLocaleString()} {trade.fiat_currency}/{trade.crypto_symbol}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  TRADE ID <Info className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{trade.id.substring(0, 11)}</span>
                  <button 
                    onClick={handleCopyTradeId}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">STARTED</div>
                <div className="text-sm">{formatTimeAgo(trade.created_at)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">COMPLETED</div>
                <div className="text-sm">{trade.completed_at ? formatTimeAgo(trade.completed_at) : "a few seconds ago"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => setLocation("/p2p")}
      >
        Back to Marketplace
      </Button>
    </div>
  );
}
