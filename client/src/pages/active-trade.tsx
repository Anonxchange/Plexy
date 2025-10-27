import { useState, useEffect, useRef } from "react";
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
  Plus,
  UserCircle,
  CheckSquare,
  Square,
  Image as ImageIcon,
  Video,
  File,
  Download,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { uploadToR2 } from "@/lib/r2-storage";
import { createMessageNotification } from "@/lib/notifications-api";
import { notificationSounds } from "@/lib/notification-sounds";

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
  buyer_paid_at: string | null;
  seller_released_at: string | null;
  created_at: string;
  expires_at: string | null;
  completed_at: string | null;
  time_limit_minutes?: number;
  offer_terms?: string;
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

interface TradeMessage {
  id: string;
  trade_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_filename?: string | null;
  created_at: string;
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
  const [cancelReason, setCancelReason] = useState("");
  const [confirmNotPaid, setConfirmNotPaid] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [quickMessages, setQuickMessages] = useState<string[]>([
    "Hello, I'm ready to trade",
    "Payment sent, please check",
    "Please provide your payment details",
    "Can you confirm receipt?",
    "Thank you for the trade",
  ]);

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
      fetchMessages();
    }
  }, [tradeId, currentUserProfileId]);

  useEffect(() => {
    if (!tradeId) return;

    const channel = supabase
      .channel(`trade-messages-${tradeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_messages',
          filter: `trade_id=eq.${tradeId}`,
        },
        (payload) => {
          const newMessage = payload.new as TradeMessage;
          // Play sound only if message is from counterparty
          if (newMessage.sender_id !== currentUserProfileId) {
            notificationSounds.play('message_received');
          }
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tradeId]);

  useEffect(() => {
    if (!trade?.created_at) return;

    if (trade.status === "completed" || trade.status === "cancelled") {
      return;
    }

    const updateTimer = () => {
      const startTime = new Date(trade.created_at).getTime();
      const timeLimit = (trade.time_limit_minutes || 30) * 60 * 1000;
      const deadline = startTime + timeLimit;
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((deadline - now) / 1000));
      setTimer(remainingSeconds);

      // Auto-cancel trade when timer expires ONLY if not paid
      if (remainingSeconds === 0 && trade.status === "pending" && !isPaid && !trade.buyer_paid_at) {
        handleAutoCancelTrade();
      }

      // Play warning sound when 2 minutes remaining
      if (remainingSeconds === 120 && trade.status === "pending" && !isPaid) {
        notificationSounds.play('time_warning');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [trade?.created_at, trade?.time_limit_minutes, trade?.status, isPaid, trade?.buyer_paid_at]);

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

  const fetchMessages = async () => {
    if (!tradeId) return;

    try {
      const { data, error } = await supabase
        .from("trade_messages")
        .select("*")
        .eq("trade_id", tradeId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchTradeData = async () => {
    try {
      const { data: tradeData, error: tradeError } = await supabase
        .from("p2p_trades")
        .select("id, offer_id, buyer_id, seller_id, crypto_symbol, crypto_amount, fiat_currency, fiat_amount, price, payment_method, status, escrow_id, payment_deadline, buyer_paid_at, seller_released_at, created_at, expires_at, completed_at")
        .eq("id", tradeId)
        .single();

      if (tradeError) throw tradeError;

      const { data: offerData } = await supabase
        .from("p2p_offers")
        .select("time_limit_minutes, terms")
        .eq("id", tradeData.offer_id)
        .single();

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
        time_limit_minutes: offerData?.time_limit_minutes || 30,
        offer_terms: offerData?.terms || "",
        buyer_profile: buyerProfile,
        seller_profile: sellerProfile,
      } as Trade;

      setTrade(fullTradeData);
      setIsPaid(!!tradeData.buyer_paid_at);

      // Play sound when trade first loads (only once)
      if (!loading && tradeData.status === 'pending' && !tradeData.buyer_paid_at) {
        notificationSounds.play('trade_started');
      }
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
    if (!trade?.created_at) return "00:00";

    if (trade.status === "completed" || trade.status === "cancelled") {
      return "00:00";
    }

    const referenceTime = trade.buyer_paid_at || trade.created_at;
    const startTime = new Date(referenceTime).getTime();
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
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
      notificationSounds.play('message_received');
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
    if (!tradeId || !confirmNotPaid || !cancelReason) {
      toast({
        title: "Error",
        description: "Please select a reason and confirm you have not paid",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("p2p_trades")
        .update({ status: "cancelled" })
        .eq("id", tradeId);

      if (error) throw error;

      notificationSounds.play('trade_cancelled');
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

  const releaseCrypto = async () => {
    if (!tradeId) return;

    try {
      const { error } = await supabase
        .from("p2p_trades")
        .update({
          seller_released_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", tradeId);

      if (error) throw error;

      notificationSounds.play('trade_completed');
      toast({
        title: "Success",
        description: "Crypto released to buyer",
      });

      fetchTradeData();
    } catch (error) {
      console.error("Error releasing crypto:", error);
      toast({
        title: "Error",
        description: "Failed to release crypto",
        variant: "destructive",
      });
    }
  };

  const handleAutoCancelTrade = async () => {
    if (!tradeId) return;

    try {
      const { error } = await supabase
        .from("p2p_trades")
        .update({ 
          status: "cancelled"
        })
        .eq("id", tradeId);

      if (error) throw error;

      notificationSounds.play('trade_cancelled');
      fetchTradeData();
    } catch (error) {
      console.error("Error auto-cancelling trade:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tradeId || !currentUserProfileId || !user?.id) {
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadResult = await uploadToR2(file, 'trade-attachments', user.id);

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'file';

      const { data, error } = await supabase
        .from("trade_messages")
        .insert({
          trade_id: tradeId,
          sender_id: currentUserProfileId,
          content: `Sent ${fileType}: ${file.name}`,
          attachment_url: uploadResult.url,
          attachment_type: fileType,
          attachment_filename: file.name,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "File uploaded",
        description: `${file.name} sent successfully`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !tradeId || !currentUserProfileId) return;

    const messageText = newMessage.trim();
    const optimisticMessage: TradeMessage = {
      id: `temp-${Date.now()}`,
      trade_id: tradeId,
      sender_id: currentUserProfileId,
      content: messageText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setIsSendingMessage(true);

    try {
      const { data, error } = await supabase
        .from("trade_messages")
        .insert({
          trade_id: tradeId,
          sender_id: currentUserProfileId,
          content: messageText,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for the counterparty
      const recipientId = isUserBuyer ? trade.seller_id : trade.buyer_id;

      // Get sender's profile data
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url, avatar_type')
        .eq('id', currentUserProfileId)
        .single();

      const senderName = senderProfile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'User';
      let senderAvatar = senderProfile?.avatar_url || null;

      // If no custom avatar, use avatar type
      if (!senderAvatar && senderProfile?.avatar_type) {
        const avatarTypes = [
          { id: 'default', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' },
          { id: 'trader', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader' },
          { id: 'crypto', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto' },
          { id: 'robot', image: 'https://api.dicebear.com/7.x/bottts/svg?seed=robot' },
          { id: 'ninja', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ninja' },
          { id: 'astronaut', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=astronaut' },
          { id: 'developer', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer' },
          { id: 'artist', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist' },
        ];
        const selectedAvatar = avatarTypes.find(a => a.id === senderProfile.avatar_type);
        if (selectedAvatar) {
          senderAvatar = selectedAvatar.image;
        }
      }

      await createMessageNotification(
        recipientId,
        currentUserProfileId,
        senderName,
        senderAvatar,
        messageText,
        tradeId,
        trade.status,
        counterparty?.username ? 'Nigeria' : undefined // Assuming 'Nigeria' is a placeholder for country
      );

      setMessages((prev) =>
        prev.map((msg) => (msg.id === optimisticMessage.id ? data : msg))
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      setNewMessage(messageText);
      toast({
        title: "Failed to send",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading || !trade) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
            <Avatar 
              className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                const counterpartyId = isUserBuyer ? trade?.seller_id : trade?.buyer_id;
                if (counterpartyId) {
                  setLocation(`/profile/${counterpartyId}`);
                }
              }}
            >
              <AvatarImage src={counterparty?.avatar_url || undefined} alt={counterparty?.username} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {counterparty?.username?.substring(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-wrap">
              <span 
                className="font-semibold text-sm sm:text-base truncate cursor-pointer hover:underline"
                onClick={() => {
                  const counterpartyId = isUserBuyer ? trade?.seller_id : trade?.buyer_id;
                  if (counterpartyId) {
                    setLocation(`/profile/${counterpartyId}`);
                  }
                }}
              >
                {counterparty?.username}
              </span>
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
            <span>{isPaid ? formatTradeTime() : formatTime(timer)}</span>
          </div>
        </div>
      </div>

      {/* Trade Summary Bar - Scrolls away */}
      <div className="bg-primary/20 border-b p-2 sm:p-3 text-xs sm:text-sm">
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
        {isPaid ? (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 animate-pulse"></div>
            <span className="truncate">Moderator available</span>
            <Button 
              variant="outline" 
              size="sm"
              className="ml-auto text-xs sm:text-sm h-7 flex items-center gap-1"
              onClick={() => {
                toast({
                  title: "Contact Moderator",
                  description: "Moderator chat feature coming soon",
                });
              }}
            >
              <UserCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              Contact
            </Button>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full flex-shrink-0"></div>
            <span className="truncate">Moderator unavailable (mark as paid first)</span>
          </>
        )}
        <button className="ml-auto text-primary flex items-center gap-1 hover:underline whitespace-nowrap text-xs sm:text-sm">
          Translate <span className="text-base sm:text-lg">🌐</span>
        </button>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-y-auto ${activeTab === 'chat' ? 'pb-32' : 'pb-20'}`}>
        {activeTab === 'chat' ? (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {trade.status === "cancelled" ? (
              <>
                {/* Trade Instructions - Show for Both Buyer and Seller even when cancelled */}
                {!isUserBuyer ? (
                  <div className="bg-orange-500/10 border border-orange-500/20 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                    <div className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      {counterparty?.username} was selling you <span className="font-bold">{trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}</span>
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
                ) : (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                    <div className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      You were selling <span className="font-bold">{trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}</span> to {counterparty?.username}
                    </div>
                    <ol className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <li>1. Share your payment details in the chat below for {trade.payment_method}</li>
                      <li>2. Wait for {counterparty?.username} to send you <span className="font-bold">{trade.fiat_amount.toLocaleString()} {trade.fiat_currency}</span></li>
                      <li>3. They will mark the trade as "paid" once they have sent the money</li>
                      <li>4. Verify that you have received the payment in your account</li>
                      <li>5. Once confirmed, click "Release Crypto" to complete the trade</li>
                      <li>6. The {trade.crypto_symbol} will then be transferred to {counterparty?.username}'s wallet</li>
                    </ol>
                  </div>
                )}

                {/* Trade Partner Offer Terms - Show after instructions */}
                {trade.offer_terms && (
                  <div className="bg-card border p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                    <div className="flex items-start gap-2 mb-2 sm:mb-3">
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-1" />
                      <div className="font-semibold text-sm sm:text-base">Offer Terms from {counterparty?.username}:</div>
                    </div>
                    <div className="text-xs sm:text-sm whitespace-pre-wrap">
                      {trade.offer_terms}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground text-center mb-4">
                  TRADE CANCELLED - {new Date(trade.created_at).toLocaleString().toUpperCase()}
                </div>

                {/* Chat Messages */}
                <div className="space-y-2 mb-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === currentUserProfileId;
                    const hasAttachment = message.attachment_url && message.attachment_url.trim() !== '';

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {hasAttachment && (
                            <div className="mb-2">
                              {message.attachment_type === 'image' ? (
                                <div className="relative">
                                  <img 
                                    src={message.attachment_url} 
                                    alt={message.attachment_filename || 'Uploaded image'} 
                                    className="rounded max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(message.attachment_url!, '_blank')}
                                    onError={(e) => {
                                      console.error('Image failed to load:', message.attachment_url);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    loading="lazy"
                                  />
                                </div>
                              ) : message.attachment_type === 'video' ? (
                                <video 
                                  src={message.attachment_url} 
                                  controls 
                                  className="rounded max-w-full h-auto"
                                  onError={(e) => {
                                    console.error('Video failed to load:', message.attachment_url);
                                  }}
                                />
                              ) : (
                                <a 
                                  href={message.attachment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded border ${
                                    isOwnMessage ? 'border-primary-foreground/30' : 'border-border'
                                  } hover:opacity-80 transition-opacity`}
                                >
                                  <File className="w-4 h-4" />
                                  <span className="text-sm truncate">{message.attachment_filename || 'Download file'}</span>
                                  <Download className="w-4 h-4 ml-auto" />
                                </a>
                              )}
                            </div>
                          )}
                          {message.content && message.content.trim() !== '' && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}</div>

                {/* Cancelled Message */}
                <div className="bg-destructive/10 border border-destructive/20 p-3 sm:p-4 rounded-lg">
                  <div className="text-sm sm:text-base text-destructive">
                    This trade was canceled and {trade.crypto_symbol} is no longer reserved. To continue, ask your trade partner to reopen this trade, and make sure {trade.crypto_symbol} is reserved, before you make the payment.
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Trade Instructions - Show for Both Buyer and Seller */}
                {!isUserBuyer ? (
                  <div className="bg-orange-500/10 border border-orange-500/20 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
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
                ) : (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                    <div className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      You are selling <span className="font-bold">{trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}</span> to {counterparty?.username}
                    </div>
                    <ol className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <li>1. Share your payment details in the chat below for {trade.payment_method}</li>
                      <li>2. Wait for {counterparty?.username} to send you <span className="font-bold">{trade.fiat_amount.toLocaleString()} {trade.fiat_currency}</span></li>
                      <li>3. They will mark the trade as "paid" once they have sent the money</li>
                      <li>4. Verify that you have received the payment in your account</li>
                      <li>5. Once confirmed, click "Release Crypto" to complete the trade</li>
                      <li>6. The {trade.crypto_symbol} will then be transferred to {counterparty?.username}'s wallet</li>
                    </ol>
                  </div>
                )}

                {/* Trade Partner Offer Terms - Show after instructions */}
                {trade.offer_terms && (
                  <div className="bg-card border p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                    <div className="flex items-start gap-2 mb-2 sm:mb-3">
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-1" />
                      <div className="font-semibold text-sm sm:text-base">Offer Terms from {counterparty?.username}:</div>
                    </div>
                    <div className="text-xs sm:text-sm whitespace-pre-wrap">
                      {trade.offer_terms}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground text-center mb-4">
                  {new Date(trade.created_at).toLocaleString().toUpperCase()}
                </div>

                {/* Chat Messages */}
                <div className="space-y-2 mb-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === currentUserProfileId;
                    const hasAttachment = message.attachment_url && message.attachment_url.trim() !== '';

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {hasAttachment && (
                            <div className="mb-2">
                              {message.attachment_type === 'image' ? (
                                <div className="relative">
                                  <img 
                                    src={message.attachment_url} 
                                    alt={message.attachment_filename || 'Uploaded image'} 
                                    className="rounded max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(message.attachment_url!, '_blank')}
                                    onError={(e) => {
                                      console.error('Image failed to load:', message.attachment_url);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    loading="lazy"
                                  />
                                </div>
                              ) : message.attachment_type === 'video' ? (
                                <video 
                                  src={message.attachment_url} 
                                  controls 
                                  className="rounded max-w-full h-auto"
                                  onError={(e) => {
                                    console.error('Video failed to load:', message.attachment_url);
                                  }}
                                />
                              ) : (
                                <a 
                                  href={message.attachment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded border ${
                                    isOwnMessage ? 'border-primary-foreground/30' : 'border-border'
                                  } hover:opacity-80 transition-opacity`}
                                >
                                  <File className="w-4 h-4" />
                                  <span className="text-sm truncate">{message.attachment_filename || 'Download file'}</span>
                                  <Download className="w-4 h-4 ml-auto" />
                                </a>
                              )}
                            </div>
                          )}
                          {message.content && message.content.trim() !== '' && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}</div>
              </>
            )}
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Cancelled Trade View */}
            {trade.status === "cancelled" ? (
              <>
                <div className="bg-destructive/10 border border-destructive rounded-lg p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-destructive rounded-full"></div>
                    <h2 className="text-lg sm:text-xl font-semibold">Trade Cancelled by {!isUserBuyer ? 'You' : 'Buyer'}</h2>
                  </div>

                  <div className="bg-card p-4 rounded-lg mb-4">
                    <p className="text-sm sm:text-base mb-2">Want to start another trade? You can always start a new trade with <span className="text-primary font-semibold">{counterparty?.username}</span> or simply find a new one from our list of <span className="text-primary font-semibold">{trade.payment_method} offers</span>.</p>
                  </div>

                  <Button variant="outline" className="w-full mb-3 text-xs sm:text-sm h-9 sm:h-10">
                    <span className="mr-2">⭐</span> Add to favorites
                  </Button>

                  <Button variant="outline" className="w-full text-xs sm:text-sm h-9 sm:h-10">
                    Report Bad Behaviour
                  </Button>

                  {/* Warning Message */}
                  <div className="border-2 border-primary rounded-lg p-3 sm:p-4 text-xs sm:text-sm bg-primary/5 mt-4">
                    Keep trades within {import.meta.env.VITE_APP_NAME || "NoOnes"}. Some users may ask you to trade outside the {import.meta.env.VITE_APP_NAME || "NoOnes"} platform. This is against our Terms of Service and likely a scam attempt. You must insist on keeping all trade conversations within {import.meta.env.VITE_APP_NAME || "NoOnes"}. If you choose to proceed outside {import.meta.env.VITE_APP_NAME || "NoOnes"}, note that we cannot help or support you if you are scammed during such trades.
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

                {trade.offer_terms && (
                  <div className="bg-card border p-3 sm:p-4 rounded-lg text-xs sm:text-sm whitespace-pre-wrap mb-4">
                    {trade.offer_terms}
                  </div>
                )}

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

                  <Button variant="outline" className="w-full mb-3 text-xs sm:text-sm h-9 sm:h-10">
                    View Offer
                  </Button>

                  <Button variant="outline" className="w-full text-xs sm:text-sm h-9 sm:h-10">
                    Tour
                  </Button>
                </div>
              </>
            ) : (
              <>
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

                {/* Seller View - Show Paid button and Cancel */}
                {!isUserBuyer ? (
                  <>
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
                      Raise Dispute
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
                  </>
                ) : (
                  <>
                    {/* Buyer View - Show Release button only */}
                    <div className="bg-muted p-3 sm:p-4 rounded-lg border">
                      <div className="mb-3 sm:mb-4 text-xs sm:text-sm">
                        <span className="font-semibold">Wait for the seller to mark the payment as sent.</span> Once they do, verify that you have received the payment before releasing the crypto.
                      </div>

                      <Button 
                        className="w-full p-3 sm:p-4 h-auto bg-green-500 hover:bg-green-600"
                        onClick={releaseCrypto}
                        disabled={!isPaid}
                      >
                        <div className="text-left w-full">
                          <div className="font-bold text-base sm:text-lg">Release Crypto</div>
                          <div className="text-xs sm:text-sm">
                            {isPaid ? 'Seller has marked as paid' : 'Waiting for seller payment'}
                          </div>
                        </div>
                      </Button>
                    </div>

                    <Button variant="outline" className="w-full text-xs sm:text-sm h-9 sm:h-10">
                      Raise Dispute
                    </Button>

                    {/* Warning Message */}
                    <div className="border-2 border-primary rounded-lg p-3 sm:p-4 text-xs sm:text-sm bg-primary/5">
                      Keep trades within {import.meta.env.VITE_APP_NAME || "NoOnes"}. Some users may ask you to trade outside the {import.meta.env.VITE_APP_NAME || "NoOnes"} platform. This is against our Terms of Service and likely a scam attempt. You must insist on keeping all trade conversations within {import.meta.env.VITE_APP_NAME || "NoOnes"}. If you choose to proceed outside {import.meta.env.VITE_APP_NAME || "NoOnes"}, note that we cannot help or support you if you are scammed during such trades.
                    </div>
                  </>
                )}

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

            {trade.offer_terms && (
              <div className="bg-card border p-3 sm:p-4 rounded-lg text-xs sm:text-sm whitespace-pre-wrap">
                {trade.offer_terms}
              </div>
            )}

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
              </>
            )}
          </div>
        )}
      </div>

      {/* Cancel Warning Modal */}
      {showCancelWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-card border rounded-lg p-4 sm:p-6 max-w-sm w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="space-y-3 sm:space-y-4">
              {/* Cancellation Reasons */}
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-3">
                <button
                  onClick={() => setCancelReason("unresponsive")}
                  className="w-full text-left flex items-start gap-3 hover:bg-background/50 p-2 rounded transition-colors"
                >
                  {cancelReason === "unresponsive" ? (
                    <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-sm sm:text-base">Unresponsive user</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">The user did not respond to my message</div>
                  </div>
                </button>

                <button
                  onClick={() => setCancelReason("asked_to_cancel")}
                  className="w-full text-left flex items-start gap-3 hover:bg-background/50 p-2 rounded transition-colors"
                >
                  {cancelReason === "asked_to_cancel" ? (
                    <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-sm sm:text-base">User asked me to cancel</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">The user requested cancellation without providing a specific reason</div>
                  </div>
                </button>

                <button
                  onClick={() => setCancelReason("payment_not_accepted")}
                  className="w-full text-left flex items-start gap-3 hover:bg-background/50 p-2 rounded transition-colors"
                >
                  {cancelReason === "payment_not_accepted" ? (
                    <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-sm sm:text-base">User didn't accept my payment</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">The user declined my payment method or receipt</div>
                  </div>
                </button>

                <button
                  onClick={() => setCancelReason("terms_changed")}
                  className="w-full text-left flex items-start gap-3 hover:bg-background/50 p-2 rounded transition-colors"
                >
                  {cancelReason === "terms_changed" ? (
                    <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-sm sm:text-base">User changed offer terms</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">The user attempted to modify the offer amount or terms after the trade had started</div>
                  </div>
                </button>

                <button
                  onClick={() => setCancelReason("mistake")}
                  className="w-full text-left flex items-start gap-3 hover:bg-background/50 p-2 rounded transition-colors"
                >
                  {cancelReason === "mistake" ? (
                    <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-sm sm:text-base">Opened trade by mistake</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">I changed my mind or selected the wrong payment method or currency</div>
                  </div>
                </button>
              </div>

              {/* Confirmation Checkbox */}
              <button
                onClick={() => setConfirmNotPaid(!confirmNotPaid)}
                className="w-full flex items-start gap-3 p-3 bg-background border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {confirmNotPaid ? (
                  <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" />
                ) : (
                  <Square className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-sm sm:text-base text-left">I confirm that I have not paid on this trade and I want to cancel.</span>
              </button>

              {/* Action Buttons */}
              <Button 
                variant="destructive"
                className="w-full text-sm sm:text-base h-10 sm:h-11"
                onClick={cancelTrade}
                disabled={!confirmNotPaid || !cancelReason}
              >
                Cancel Trade
              </Button>

              <Button 
                variant="outline"
                className="w-full text-sm sm:text-base h-10 sm:h-11"
                onClick={() => {
                  setShowCancelWarning(false);
                  setCancelReason("");
                  setConfirmNotPaid(false);
                }}
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Input/Actions */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
          <div className="max-w-md mx-auto">
            {/* Quick Messages Dropdown */}
            {showQuickMessages && (
              <div className="border-b max-h-64 overflow-y-auto bg-background">
                <div className="p-2 sm:p-3 space-y-1">
                  {quickMessages.map((msg, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setNewMessage(msg);
                        setShowQuickMessages(false);
                      }}
                      className="w-full text-left p-2 sm:p-3 rounded hover:bg-secondary transition-colors text-xs sm:text-sm"
                    >
                      {msg}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const customMsg = prompt("Enter your custom quick message:");
                      if (customMsg && customMsg.trim()) {
                        setQuickMessages([...quickMessages, customMsg.trim()]);
                        toast({
                          title: "Quick message added",
                          description: "Your custom message has been saved",
                        });
                      }
                      setShowQuickMessages(false);
                    }}
                    className="w-full text-left p-2 sm:p-3 rounded bg-primary/10 hover:bg-primary/20 transition-colors text-xs sm:text-sm font-semibold text-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom Message
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setShowQuickMessages(!showQuickMessages)}
              className="w-full p-2 sm:p-3 text-left text-muted-foreground border-b flex items-center justify-between hover:bg-secondary/50 transition-colors"
            >
              <span className="text-xs sm:text-sm">SELECT A MESSAGE:</span>
              {showQuickMessages ? (
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            <div className="p-2 sm:p-3 flex gap-1.5 sm:gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <input
                type="text"
                placeholder="Write a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSendingMessage}
                className="flex-1 bg-secondary rounded-lg px-3 sm:px-4 py-2 sm:py-3 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base min-w-0"
              />
              <Button 
                size="icon" 
                className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                onClick={sendMessage}
                disabled={isSendingMessage || !newMessage.trim()}
              >
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