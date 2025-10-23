import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  MessageCircle, 
  FileText, 
  Info, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  X, 
  AlertCircle,
  Send,
  Plus
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface Trade {
  id: string;
  offer_id: string;
  buyer_id: string;
  seller_id: string;
  crypto_symbol: string;
  crypto_amount: number;
  fiat_currency: string;
  fiat_amount: number;
  price: number;
  payment_method: string;
  status: "pending" | "payment_sent" | "completed" | "disputed" | "cancelled" | "expired";
  escrow_id: string | null;
  payment_deadline: string | null;
  payment_proof_url: string | null;
  buyer_paid_at: string | null;
  seller_released_at: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
  buyer_profile?: {
    username: string;
    avatar_url: string | null;
    positive_ratings: number;
    negative_ratings: number;
  };
  seller_profile?: {
    username: string;
    avatar_url: string | null;
    positive_ratings: number;
    negative_ratings: number;
  };
}

export default function ActiveTrade() {
  const [, params] = useRoute("/trade/:tradeId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const tradeId = params?.tradeId;

  const [trade, setTrade] = useState<Trade | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [timer, setTimer] = useState(0);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const supabase = createClient();

  const isUserBuyer = currentUserProfileId && trade?.buyer_id === currentUserProfileId;
  const counterparty = isUserBuyer ? trade?.seller_profile : trade?.buyer_profile;

  useEffect(() => {
    if (user?.id) {
      fetchCurrentUserProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    if (tradeId && currentUserProfileId) {
      fetchTradeData();
    }
  }, [tradeId, currentUserProfileId]);

  useEffect(() => {
    if (!trade?.payment_deadline) return;

    const updateTimer = () => {
      const deadline = new Date(trade.payment_deadline!).getTime();
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((deadline - now) / 1000));
      setTimer(remainingSeconds);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [trade?.payment_deadline]);

  const fetchCurrentUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setCurrentUserProfileId(data.id);
      }
    } catch (error) {
      console.error("Error fetching current user profile:", error);
    }
  };

  const fetchTradeData = async () => {
    try {
      const { data: tradeData, error: tradeError } = await supabase
        .from("p2p_trades")
        .select("*")
        .eq("id", tradeId)
        .single();

      if (tradeError) throw tradeError;

      const { data: buyerProfile } = await supabase
        .from("user_profiles")
        .select("username, avatar_url, positive_ratings, negative_ratings")
        .eq("id", tradeData.buyer_id)
        .single();

      const { data: sellerProfile } = await supabase
        .from("user_profiles")
        .select("username, avatar_url, positive_ratings, negative_ratings")
        .eq("id", tradeData.seller_id)
        .single();

      const fullTradeData = {
        ...tradeData,
        buyer_profile: buyerProfile,
        seller_profile: sellerProfile,
      } as Trade;

      setTrade(fullTradeData);
      setIsPaid(!!tradeData.buyer_paid_at);
    } catch (error) {
      console.error("Error fetching trade:", error);
      toast({
        title: "Error",
        description: "Failed to load trade details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatTradeTime = () => {
    const tradeTime = Math.floor((Date.now() / 1000) % 3600);
    const mins = Math.floor(tradeTime / 60);
    const secs = tradeTime % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const markAsPaid = async () => {
    if (!tradeId) return;

    try {
      const { error } = await supabase
        .from("p2p_trades")
        .update({
          buyer_paid_at: new Date().toISOString(),
        })
        .eq("id", tradeId);

      if (error) throw error;

      setIsPaid(true);
      toast({
        title: "Success",
        description: "Payment marked as sent.",
      });

      fetchTradeData();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast({
        title: "Error",
        description: "Failed to update trade status",
        variant: "destructive",
      });
    }
  };

  const cancelTrade = async () => {
    if (!tradeId) return;

    try {
      const { error } = await supabase
        .from("p2p_trades")
        .update({ status: "cancelled" })
        .eq("id", tradeId);

      if (error) throw error;

      toast({
        title: "Trade Cancelled",
        description: "The trade has been cancelled",
      });

      setLocation("/p2p");
    } catch (error) {
      console.error("Error cancelling trade:", error);
      toast({
        title: "Error",
        description: "Failed to cancel trade",
        variant: "destructive",
      });
    }
  };

  if (loading || !trade) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading trade...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background text-foreground min-h-screen font-sans">
      {/* Header - Trader Info (Scrolls away) */}
      <div className="bg-primary/10 border-b p-3 sm:p-4">
        {/* Trader Info */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs sm:text-sm text-primary-foreground font-semibold">{counterparty?.username?.substring(0, 1).toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-wrap">
              <span className="font-semibold text-sm sm:text-base truncate">{counterparty?.username}</span>
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-primary/20 flex items-center justify-center text-xs flex-shrink-0">🇳🇬</span>
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <button className="bg-green-500/20 text-green-600 border border-green-500/30 px-2 sm:px-4 py-1 rounded flex items-center gap-1 sm:gap-2 hover:bg-green-500/30 transition-colors text-xs sm:text-sm">
              <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">{counterparty?.positive_ratings || 0}</span>
            </button>
            <button className="bg-red-500/20 text-red-600 border border-red-500/30 px-2 sm:px-4 py-1 rounded flex items-center gap-1 sm:gap-2 hover:bg-red-500/30 transition-colors text-xs sm:text-sm">
              <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">{counterparty?.negative_ratings || 0}</span>
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Active now</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{formatTradeTime()}</span>
          </div>
        </div>
      </div>

      {/* Trade Summary Bar - Sticky on scroll */}
      <div className="bg-primary/20 border-b p-2 sm:p-3 text-xs sm:text-sm sticky top-0 z-50 backdrop-blur-sm">
        <div className="flex justify-between items-center gap-1 sm:gap-2 flex-wrap">
          <span className="font-semibold">{isUserBuyer ? 'Buying' : 'Selling'}</span>
          <span className="font-bold whitespace-nowrap">{trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}</span>
          <span className="font-semibold hidden xs:inline">FOR</span>
          <span className="font-bold whitespace-nowrap">{trade.fiat_amount.toLocaleString()} {trade.fiat_currency}</span>
          <span className="text-xs truncate">{trade.payment_method}</span>
        </div>
      </div>

      {/* Moderator Notice */}
      <div className="bg-muted p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground flex items-center gap-2 border-b">
        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full flex-shrink-0"></div>
        <span className="truncate">Moderator unavailable</span>
        <button className="ml-auto text-primary flex items-center gap-1 hover:underline whitespace-nowrap text-xs sm:text-sm">
          Translate <span className="text-base sm:text-lg">🌐</span>
        </button>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-y-auto ${activeTab === 'chat' ? 'pb-32' : 'pb-20'}`}>
        {activeTab === 'chat' ? (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Trade Instructions */}
            <div className="bg-orange-500/10 border border-orange-500/20 p-3 sm:p-4 rounded-lg">
              <div className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                {counterparty?.username} is selling you <span className="font-bold">{trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}</span>
              </div>
              <ol className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li>1. You must pay <span className="font-bold">{trade.fiat_amount.toLocaleString()} {trade.fiat_currency}</span> via {trade.payment_method}</li>
                <li>2. They will share their bank details below</li>
                <li>3. When you have sent the money, please mark the trade as "paid"</li>
                <li>4. (It really helps if you upload a screenshot or PDF as a receipt of payment too)</li>
                <li>5. Then wait for {counterparty?.username} to confirm they have received payment</li>
                <li>6. When they do, they will release your {trade.crypto_symbol} and the trade will be complete</li>
              </ol>
            </div>

            {/* Trade Partner Instructions */}
            <div className="bg-card border p-3 sm:p-4 rounded-lg">
              <div className="flex items-start gap-2 mb-2 sm:mb-3">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-1" />
                <div className="font-semibold text-sm sm:text-base">Follow these instructions from your trade partner:</div>
              </div>
              <div className="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                <div className="font-bold">NO THIRD PARTY PAYMENT</div>
                <div>1. Say 'Hi' as you start trade</div>
                <div>2. State the bank you are making payment from and the sender's name respectively</div>
                <div>3. Ask for my account details</div>
                <div>4. Do not use any crypto related term as narration while paying</div>
                <div>5. Upload proof of payment</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              {new Date(trade.created_at).toLocaleString().toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Trade Started Card */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="bg-primary/10 p-2 sm:p-3 flex items-center gap-2 border-b">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-sm sm:text-base">Trade Started</span>
              </div>

              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="bg-muted p-3 sm:p-4 rounded-lg border">
                  <div className="text-sm sm:text-lg mb-2">Please make a payment of {trade.fiat_amount.toLocaleString()} {trade.fiat_currency} using {trade.payment_method}.</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{trade.crypto_amount.toFixed(8)} {trade.crypto_symbol} will be added to your Bitcoin wallet</div>
                </div>

                <div className="bg-muted p-3 sm:p-4 rounded-lg border">
                  <div className="mb-3 sm:mb-4 text-xs sm:text-sm">
                    <span className="font-semibold">Once you've made the payment,</span> be sure to click{' '}
                    <span className="font-bold text-green-500">Paid</span> within the given time limit. Otherwise the trade will be automatically canceled and the Bitcoin will be returned to the seller's wallet.
                  </div>

                  <Button 
                    className={`w-full p-3 sm:p-4 h-auto flex items-center justify-between ${
                      isPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                    }`}
                    onClick={markAsPaid}
                  >
                    <div className="text-left">
                      <div className="font-bold text-base sm:text-lg">Paid</div>
                      <div className="text-xs sm:text-sm">Time left {formatTime(timer)}</div>
                    </div>
                    {isPaid && <span className="text-xl sm:text-2xl">✓</span>}
                  </Button>
                </div>

                <Button variant="outline" className="w-full text-xs sm:text-sm h-9 sm:h-10">
                  Report Bad Behaviour
                </Button>

                {/* Warning Message */}
                <div className="border-2 border-primary rounded-lg p-3 sm:p-4 text-xs sm:text-sm bg-primary/5">
                  Keep trades within {import.meta.env.VITE_APP_NAME || "NoOnes"}. Some users may ask you to trade outside the {import.meta.env.VITE_APP_NAME || "NoOnes"} platform. This is against our Terms of Service and likely a scam attempt. You must insist on keeping all trade conversations within {import.meta.env.VITE_APP_NAME || "NoOnes"}. If you choose to proceed outside {import.meta.env.VITE_APP_NAME || "NoOnes"}, note that we cannot help or support you if you are scammed during such trades.
                </div>

                <Button 
                  variant="destructive"
                  className="w-full text-xs sm:text-sm h-9 sm:h-10"
                  onClick={() => setShowCancelWarning(true)}
                >
                  Cancel Trade
                </Button>

                {!isPaid && (
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>You haven't paid yet</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center text-muted-foreground text-base sm:text-lg mb-2">
              Please follow {counterparty?.username}'s terms
            </div>

            <div className="flex items-center gap-2 text-primary mb-3 text-xs sm:text-sm">
              <span>Translate into</span>
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            {/* Terms Tags */}
            <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
              <span className="bg-secondary px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm">receipt required</span>
              <span className="bg-secondary px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm">photo id required</span>
              <span className="bg-secondary px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm">no third parties</span>
            </div>

            <div className="bg-card border p-3 sm:p-4 rounded-lg text-xs sm:text-sm space-y-1.5 sm:space-y-2">
              <div className="font-bold">NO THIRD PARTY PAYMENT</div>
              <div>1. Say 'Hi' as you start trade</div>
              <div>2. State the bank you are making payment from and the sender's name respectively</div>
              <div>3. Ask for my account details</div>
              <div>4. Do not use any crypto related term as narration while paying</div>
              <div>5. Upload proof of payment</div>
              <div>6. Always leave a good feedback after trade</div>
            </div>

            {/* Trade Information */}
            <div className="mt-4 sm:mt-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Trade Information</h3>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">RATE</div>
                  <div className="text-xs sm:text-sm font-medium break-all">{trade.price.toLocaleString()} {trade.fiat_currency}/{trade.crypto_symbol}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    TRADE ID <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <div className="text-xs sm:text-sm flex items-center gap-2">
                    <span className="truncate">{trade.id.substring(0, 11)}</span>
                    <button className="text-muted-foreground hover:text-foreground flex-shrink-0">📋</button>
                  </div>
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">STARTED</div>
                <div className="text-xs sm:text-sm font-medium">{new Date(trade.created_at).toLocaleString()}</div>
              </div>

              <Button variant="outline" className="w-full mb-2 sm:mb-3 text-xs sm:text-sm h-9 sm:h-10">
                View Offer
              </Button>

              <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm h-9 sm:h-10">
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                Take a Tour
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Warning Modal */}
      {showCancelWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-card border rounded-lg p-4 sm:p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-end mb-3 sm:mb-4">
              <button onClick={() => setShowCancelWarning(false)} className="hover:bg-secondary rounded p-1">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="border-2 border-primary rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 text-xs sm:text-sm bg-primary/5">
              Keep trades within {import.meta.env.VITE_APP_NAME || "NoOnes"}. Some users may ask you to trade outside the {import.meta.env.VITE_APP_NAME || "NoOnes"} platform. This is against our Terms of Service and likely a scam attempt. You must insist on keeping all trade conversations within {import.meta.env.VITE_APP_NAME || "NoOnes"}. If you choose to proceed outside {import.meta.env.VITE_APP_NAME || "NoOnes"}, note that we cannot help or support you if you are scammed during such trades.
            </div>

            <Button 
              variant="destructive"
              className="w-full mb-3 text-xs sm:text-sm h-9 sm:h-10"
              onClick={cancelTrade}
            >
              Cancel Trade
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>You haven't paid yet</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Input/Actions */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
          <div className="max-w-md mx-auto">
            <button className="w-full p-2 sm:p-3 text-left text-muted-foreground border-b flex items-center justify-between hover:bg-secondary/50 transition-colors">
              <span className="text-xs sm:text-sm">SELECT A MESSAGE:</span>
              <span className="text-xl sm:text-2xl">^</span>
            </button>

            <div className="p-2 sm:p-3 flex gap-1.5 sm:gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <input
                type="text"
                placeholder="Write a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-secondary rounded-lg px-3 sm:px-4 py-2 sm:py-3 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base min-w-0"
              />
              <Button size="icon" className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            {/* Tab Buttons */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1.5 sm:p-2">
              <Button
                onClick={() => setActiveTab('actions')}
                variant="outline"
                className="flex items-center justify-center gap-1.5 sm:gap-2 h-10 sm:h-12 text-xs sm:text-sm"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                Actions
              </Button>
              <Button
                onClick={() => setActiveTab('chat')}
                className="flex items-center justify-center gap-1.5 sm:gap-2 h-10 sm:h-12 bg-primary hover:bg-primary/90 text-xs sm:text-sm"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Chat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Buttons for Actions Tab */}
      {activeTab === 'actions' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
          <div className="max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1.5 sm:p-2">
              <Button
                onClick={() => setActiveTab('actions')}
                className="flex items-center justify-center gap-1.5 sm:gap-2 h-10 sm:h-12 bg-primary hover:bg-primary/90 text-xs sm:text-sm"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                Actions
              </Button>
              <Button
                onClick={() => setActiveTab('chat')}
                variant="outline"
                className="flex items-center justify-center gap-1.5 sm:gap-2 h-10 sm:h-12 relative text-xs sm:text-sm"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Chat
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  2
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}