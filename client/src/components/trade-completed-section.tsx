import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  Copy, 
  Info, 
  RefreshCw,
  FileText,
  X,
  AlertTriangle,
  Pencil
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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

export function TradeCompletedSection({
  trade,
  isUserBuyer,
  sellerProfile,
  buyerProfile,
}: TradeCompletedSectionProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [feedbackType, setFeedbackType] = useState<"positive" | "negative" | null>("positive");
  const [feedbackText, setFeedbackText] = useState("");
  const [responseText, setResponseText] = useState("");
  const [isTrusted, setIsTrusted] = useState(true);
  const [isFavorite, setIsFavorite] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(true);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const counterparty = isUserBuyer ? sellerProfile : buyerProfile;
  const currentUser = isUserBuyer ? buyerProfile : sellerProfile;
  const maxChars = 500;
  const charsLeft = maxChars - feedbackText.length;

  const mockPreviousFeedback = {
    type: "positive" as const,
    date: "Nov 5, 2023",
    username: currentUser?.username || "User",
    text: "ak-k good+++++ the best",
  };

  const mockCounterpartyFeedback = {
    type: "positive" as const,
    date: "Aug 4, 2023",
    username: counterparty?.username || "Trader",
    text: "great",
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

  const handleSaveFeedback = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Error",
        description: "Please enter feedback text",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingFeedback(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Feedback Saved",
      description: "Your feedback has been submitted successfully",
    });
    setShowFeedbackForm(false);
    setIsSubmittingFeedback(false);
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) return;

    await new Promise(resolve => setTimeout(resolve, 500));
    toast({
      title: "Response Submitted",
      description: "Your response has been saved",
    });
    setResponseText("");
  };

  const platformFee = trade.crypto_amount * 0.0075;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg overflow-hidden border shadow-sm">
        <div className="bg-green-600 p-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
          <span className="font-semibold text-white">Trade Completed</span>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-zinc-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              You {isUserBuyer ? "purchased" : "sold"} {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}
            </h3>

            <div className="text-sm text-muted-foreground mb-3">Trade Summary</div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={sellerProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-zinc-700">
                    {sellerProfile?.username?.substring(0, 1).toUpperCase() || "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sellerProfile?.username || "Seller"}</span>
                    <span className="bg-zinc-700 text-xs px-2 py-0.5 rounded">Sold</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {trade.fiat_amount.toLocaleString()} {trade.fiat_currency}  {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={buyerProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-zinc-700">
                    {buyerProfile?.username?.substring(0, 1).toUpperCase() || "B"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{buyerProfile?.username || "Buyer"}</span>
                    <span className="bg-green-600/20 text-green-500 text-xs px-2 py-0.5 rounded border border-green-600/30">Purchased</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {trade.fiat_amount.toLocaleString()} {trade.fiat_currency}  {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsTrusted(!isTrusted)}
              className="flex items-center gap-2 mt-4 text-sm text-red-400 hover:text-red-300 transition-colors"
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

            <div className="flex gap-2 mb-4">
              <Button
                variant={feedbackType === "positive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFeedbackType("positive")}
                className={feedbackType === "positive" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button
                variant={feedbackType === "negative" ? "default" : "outline"}
                size="sm"
                onClick={() => setFeedbackType("negative")}
                className={feedbackType === "negative" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>

            {showFeedbackForm && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Leave feedback for {counterparty?.username || "trader"}
                </div>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value.slice(0, maxChars))}
                  placeholder="ak-k good+++++ the best"
                  className="min-h-[80px] bg-zinc-900 border-zinc-700"
                  maxLength={maxChars}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-4 h-4" />
                  Characters left: {charsLeft}
                </div>

                <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3 text-sm text-amber-200">
                  You need to wait at least 30 seconds before updating your feedback again.
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveFeedback}
                    disabled={isSubmittingFeedback}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmittingFeedback ? "Saving..." : "Save Feedback"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowFeedbackForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-medium">Positive</span>
                <span className="text-sm text-muted-foreground ml-auto">{mockPreviousFeedback.date}</span>
              </div>
              <div className="text-primary font-medium mb-1">{mockPreviousFeedback.username}</div>
              <p className="text-sm text-muted-foreground mb-2">{mockPreviousFeedback.text}</p>
              <button className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Pencil className="w-4 h-4" />
                Edit Feedback
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-2">Feedback from {counterparty?.username}</div>
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-medium">Positive</span>
                <span className="text-sm text-muted-foreground ml-auto">{mockCounterpartyFeedback.date}</span>
              </div>
              <div className="text-primary font-medium mb-1">{mockCounterpartyFeedback.username}</div>
              <p className="text-sm text-muted-foreground mb-3">{mockCounterpartyFeedback.text}</p>

              <div className="space-y-2">
                <div className="text-sm">Response</div>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="++++ the best"
                  className="min-h-[60px] bg-zinc-900 border-zinc-700"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-4 h-4" />
                  Characters left: {maxChars - responseText.length}
                </div>

                <div className="bg-zinc-800 rounded-lg p-3 text-sm text-muted-foreground">
                  You're not allowed to leave a feedback.
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitResponse}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit Response
                  </Button>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
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

          <div className="bg-zinc-900 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">₿</span>
              <span className="font-medium">
                You are {isUserBuyer ? "buying" : "selling"} {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol} for {trade.fiat_amount.toLocaleString()} {trade.fiat_currency} using {trade.payment_method}
              </span>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Trade responsibly. Pexly strives to help, but not all disputes or losses can be resolved.</span>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
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
                <span className="bg-zinc-800 text-xs px-3 py-1.5 rounded">no receipt needed</span>
                <span className="bg-zinc-800 text-xs px-3 py-1.5 rounded">no verification needed</span>
                <span className="bg-zinc-800 text-xs px-3 py-1.5 rounded">guided trade</span>
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
