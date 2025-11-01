import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Info, CheckCircle, XCircle } from "lucide-react";
import { uploadToR2 } from "@/lib/r2-storage";
import { createMessageNotification } from "@/lib/notifications-api";
import { notificationSounds } from "@/lib/notification-sounds";
import { TradeHeader } from "@/components/trade-header";
import { TradeTimer } from "@/components/trade-timer";
import { ChatMessages } from "@/components/chat-messages";
import { TradeInstructions } from "@/components/trade-instructions";
import { TradeActions } from "@/components/trade-actions";
import { TradeInfo } from "@/components/trade-info";
import { CancelTradeModal } from "@/components/cancel-trade-modal";
import { MessageInput } from "@/components/message-input";
import { TabNavigation } from "@/components/tab-navigation";

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
  const [activeTab, setActiveTab] = useState<"chat" | "actions">("chat");
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
  const [quickMessages] = useState<string[]>([
    "Hello, I'm ready to trade",
    "Payment sent, please check",
    "Please provide your payment details",
    "Can you confirm receipt?",
    "Thank you for the trade",
  ]);

  const supabase = createClient();

  const isUserBuyer = !!(currentUserProfileId && trade?.buyer_id === currentUserProfileId);
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
    const subscription = supabase
      .channel(`trade-${tradeId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'trade_messages', filter: `trade_id=eq.${tradeId}` },
        (payload) => {
          const newMessage = payload.new as TradeMessage;
          
          setMessages((prev) => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });

          if (newMessage.sender_id !== currentUserProfileId) {
            notificationSounds.play('message_received');
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'p2p_trades', filter: `id=eq.${tradeId}` },
        (payload) => {
          const updatedTrade = payload.new as Partial<Trade>;
          const oldTrade = payload.old as Partial<Trade>;
          
          setTrade((prev) => prev ? { ...prev, ...updatedTrade } : null);
          setIsPaid(!!updatedTrade.buyer_paid_at);
          
          if (updatedTrade.status === 'completed') {
            notificationSounds.play('trade_completed');
          } else if (updatedTrade.status === 'cancelled') {
            notificationSounds.play('trade_cancelled');
          } else if (updatedTrade.buyer_paid_at && !oldTrade?.buyer_paid_at) {
            notificationSounds.play('payment_marked');
          }
        }
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [tradeId, currentUserProfileId]);

  useEffect(() => {
    if (!trade?.created_at || !trade?.time_limit_minutes) return;

    const updateTimer = () => {
      const startTime = new Date(trade.created_at).getTime();
      const timeLimitMs = (trade.time_limit_minutes || 30) * 60 * 1000;
      const elapsedMs = Date.now() - startTime;
      const remainingMs = timeLimitMs - elapsedMs;
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

      setTimer(remainingSeconds);

      if (remainingSeconds === 0 && trade.status === "pending" && !isPaid) {
        handleAutoCancelTrade();
      }

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

  const handleFileUpload = async (file: File) => {
    if (!file || !tradeId || !currentUserProfileId || !user?.id) {
      return;
    }

    const maxSize = 50 * 1024 * 1024;
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
      const uploadResult = await uploadToR2(file, 'trade-attachments', user?.id || '');

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

      const recipientId = isUserBuyer ? trade?.seller_id : trade?.buyer_id;

      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url, avatar_type')
        .eq('id', currentUserProfileId)
        .single();

      const senderName = senderProfile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
      let senderAvatar = senderProfile?.avatar_url || null;

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

      if (recipientId) {
        await createMessageNotification(
          recipientId,
          currentUserProfileId,
          senderName,
          senderAvatar,
          messageText,
          tradeId,
          trade?.status || 'pending',
          counterparty?.username ? 'Nigeria' : undefined
        );
      }

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

  const handleCounterpartyClick = () => {
    const counterpartyId = isUserBuyer ? trade?.seller_id : trade?.buyer_id;
    if (counterpartyId) {
      setLocation(`/profile/${counterpartyId}`);
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
    <div className="min-h-screen bg-background">
      {/* Desktop: Two-column layout, Mobile: Single column */}
      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-2 lg:gap-6 lg:p-6">
        
        {/* Right Column: Trade Info Section (Desktop only, appears first in grid) */}
        <div className="hidden lg:block bg-card rounded-lg p-6 overflow-y-auto lg:order-1">
          <TradeInfo
            trade={trade}
            counterpartyUsername={counterparty?.username}
          />
          
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Trade Actions</h3>
            <TradeActions
              isUserBuyer={isUserBuyer}
              isPaid={isPaid}
              counterpartyUsername={counterparty?.username}
              trade={trade}
              onMarkAsPaid={markAsPaid}
              onReleaseCrypto={releaseCrypto}
              onCancelTrade={() => setShowCancelWarning(true)}
            />
          </div>
        </div>

        {/* Left Column: Chat Section (Mobile: Full width, Desktop: Right side) */}
        <div className="lg:bg-card lg:rounded-lg lg:order-2">
          <div className="max-w-md mx-auto lg:max-w-full">
            <TradeHeader
              counterparty={counterparty}
              isUserBuyer={isUserBuyer}
              trade={trade}
              timer={timer}
              isPaid={isPaid}
              formatTime={formatTime}
              formatTradeTime={formatTradeTime}
              onCounterpartyClick={handleCounterpartyClick}
            />

            <TradeTimer isUserBuyer={isUserBuyer} trade={trade} />

            <div className="bg-muted p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              {isPaid ? (
                <span>Payment marked as sent. Waiting for seller to release crypto.</span>
              ) : (
                <span>Follow the instructions to complete your trade safely.</span>
              )}
            </div>

            {activeTab === "chat" && (
              <div className="p-3 sm:p-4 pb-24 lg:pb-4 space-y-4 overflow-y-auto">
                <TradeInstructions
                  isUserBuyer={isUserBuyer}
                  counterpartyUsername={counterparty?.username}
                  trade={trade}
                />

                <div className="text-xs text-muted-foreground text-center">
                  {new Date(trade.created_at).toLocaleString().toUpperCase()}
                </div>

                <ChatMessages
                  messages={messages}
                  currentUserProfileId={currentUserProfileId}
                />

                {trade.status === "cancelled" && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                    <div className="text-sm text-muted-foreground text-center">
                      TRADE CANCELLED - {new Date(trade.created_at).toLocaleString().toUpperCase()}
                    </div>
                    <p className="text-sm text-destructive leading-relaxed">
                      This trade was cancelled and {trade.crypto_symbol} is no longer reserved. To continue, ask your trade partner to reopen this trade, and make sure {trade.crypto_symbol} is reserved, before you make the payment.
                    </p>
                  </div>
                )}

                {trade.status === "completed" && (
                  <div className="bg-black/80 border border-green-500 rounded-lg p-4 space-y-3">
                    <div className="text-sm text-muted-foreground text-center">
                      TRADE COMPLETED - {new Date(trade.completed_at || trade.created_at).toLocaleString().toUpperCase()}
                    </div>
                    <p className="text-sm text-green-500 leading-relaxed text-center">
                      This trade has been successfully completed. The {trade.crypto_symbol} has been released to the buyer.
                    </p>
                  </div>
                )}

                <div className="lg:block hidden">
                  <MessageInput
                    newMessage={newMessage}
                    isSendingMessage={isSendingMessage}
                    showQuickMessages={showQuickMessages}
                    quickMessages={quickMessages}
                    onMessageChange={setNewMessage}
                    onSend={sendMessage}
                    onKeyPress={handleKeyPress}
                    onFileSelect={handleFileUpload}
                    onToggleQuickMessages={() => setShowQuickMessages(!showQuickMessages)}
                    onQuickMessageSelect={(msg) => setNewMessage(msg)}
                  />
                </div>
              </div>
            )}

            {activeTab === "actions" && (
              <div className="p-3 sm:p-4 pb-24 lg:pb-4 space-y-4 overflow-y-auto">
                {/* Trade Started Card */}
                <div className="bg-card rounded-lg overflow-hidden border shadow-xs">
                  <div className="bg-primary p-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-sm text-primary-foreground">Trade Started</span>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {isUserBuyer ? (
                      <>
                        <div className="bg-black/50 p-4 rounded">
                          <div className="text-base sm:text-lg mb-2">
                            Please make a payment of {trade.fiat_amount.toLocaleString()} {trade.fiat_currency} using {trade.payment_method}.
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol} will be added to your wallet
                          </div>
                        </div>

                        <div className="bg-black/50 p-4 rounded">
                          <div className="mb-4 text-xs sm:text-sm">
                            <span className="font-semibold">Once you've made the payment,</span> be sure to click{' '}
                            <span className="font-bold text-primary">Paid</span> within the given time limit. Otherwise the trade will be automatically canceled and the {trade.crypto_symbol} will be returned to the seller's wallet.
                          </div>

                          <Button 
                            className={`w-full p-4 h-auto ${isPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'}`}
                            onClick={markAsPaid}
                            disabled={isPaid || trade.status !== 'pending'}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="text-left">
                                <div className="font-bold text-lg">Paid</div>
                                <div className="text-sm">
                                  {isPaid ? 'Payment marked' : `Time left ${formatTime(timer)}`}
                                </div>
                              </div>
                              {isPaid && <span className="text-2xl">✓</span>}
                            </div>
                          </Button>
                        </div>

                        <Button 
                          variant="outline" 
                          className="w-full"
                        >
                          Report Bad Behaviour
                        </Button>

                        <Button 
                          variant="outline" 
                          className="w-full"
                        >
                          Raise Dispute
                        </Button>

                        <div className="border-2 border-primary rounded p-4 text-xs sm:text-sm">
                          Keep trades within {import.meta.env.VITE_APP_NAME || "NoOnes"}. Some users may ask you to trade outside the {import.meta.env.VITE_APP_NAME || "NoOnes"} platform. This is against our Terms of Service and likely a scam attempt. You must insist on keeping all trade conversations within {import.meta.env.VITE_APP_NAME || "NoOnes"}. If you choose to proceed outside {import.meta.env.VITE_APP_NAME || "NoOnes"}, note that we cannot help or support you if you are scammed during such trades.
                        </div>

                        <Button 
                          variant="destructive"
                          className="w-full"
                          onClick={() => setShowCancelWarning(true)}
                          disabled={trade.status !== 'pending'}
                        >
                          Cancel Trade
                        </Button>

                        {!isPaid && (
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Info className="w-5 h-5" />
                            <span>You haven't paid yet</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="bg-black/50 p-4 rounded">
                          <div className="text-base sm:text-lg mb-2">
                            Waiting for {counterparty?.username} to send {trade.fiat_amount.toLocaleString()} {trade.fiat_currency}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            You are selling {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}
                          </div>
                        </div>

                        <Button 
                          className="w-full p-4 h-auto bg-green-600 hover:bg-green-700"
                          onClick={releaseCrypto}
                          disabled={!isPaid || trade.status !== 'pending'}
                        >
                          <div className="text-left w-full">
                            <div className="font-bold text-lg">Release Crypto</div>
                            <div className="text-sm">
                              {isPaid ? 'Buyer has marked as paid' : 'Waiting for buyer payment'}
                            </div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full">
                          Raise Dispute
                        </Button>

                        <div className="border-2 border-primary rounded p-4 text-xs sm:text-sm">
                          Keep trades within {import.meta.env.VITE_APP_NAME || "NoOnes"}. Some users may ask you to trade outside the {import.meta.env.VITE_APP_NAME || "NoOnes"} platform. This is against our Terms of Service and likely a scam attempt.
                        </div>

                        {!isPaid && (
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Info className="w-5 h-5" />
                            <span>Payment not yet marked</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Trade Partner Terms */}
                {trade.offer_terms && (
                  <>
                    <div className="text-center text-muted-foreground text-sm sm:text-base">
                      Please follow {counterparty?.username}'s terms
                    </div>

                    <div className="bg-card p-4 rounded text-xs sm:text-sm space-y-2 whitespace-pre-wrap">
                      {trade.offer_terms}
                    </div>
                  </>
                )}

                {/* Trade Information */}
                <div className="mt-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4">Trade Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-1">RATE</div>
                      <div className="text-xs sm:text-sm">{trade.price.toLocaleString()} {trade.fiat_currency}/{trade.crypto_symbol}</div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        TRADE ID <Info className="w-4 h-4" />
                      </div>
                      <div className="text-xs sm:text-sm flex items-center gap-2">
                        {trade.id.substring(0, 11)}
                        <button 
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(trade.id);
                            toast({
                              title: "Copied!",
                              description: "Trade ID copied to clipboard",
                            });
                          }}
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs sm:text-sm text-muted-foreground mb-1">STARTED</div>
                    <div className="text-xs sm:text-sm">
                      {(() => {
                        const now = new Date();
                        const created = new Date(trade.created_at);
                        const diffMs = now.getTime() - created.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        
                        if (diffMins < 1) return 'just now';
                        if (diffMins === 1) return 'a minute ago';
                        if (diffMins < 60) return `${diffMins} minutes ago`;
                        
                        const diffHours = Math.floor(diffMins / 60);
                        if (diffHours === 1) return 'an hour ago';
                        if (diffHours < 24) return `${diffHours} hours ago`;
                        
                        return created.toLocaleDateString();
                      })()}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full mb-2 sm:mb-3"
                    onClick={() => window.location.href = `/offers/${trade.offer_id}`}
                  >
                    View Offer
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full mb-3 flex items-center justify-center gap-2 border shadow-xs hover-elevate active-elevate-2 transition-all"
                  >
                    <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                    Tutor
                  </Button>
                </div>
              </div>
            )}

            {/* Mobile Message Input - Only show in chat tab */}
            {activeTab === "chat" && (
              <div className="lg:hidden fixed bottom-14 left-0 right-0 bg-background p-2 sm:p-3">
                <div className="max-w-md mx-auto">
                  <MessageInput
                    newMessage={newMessage}
                    isSendingMessage={isSendingMessage}
                    showQuickMessages={showQuickMessages}
                    quickMessages={quickMessages}
                    onMessageChange={setNewMessage}
                    onSend={sendMessage}
                    onKeyPress={handleKeyPress}
                    onFileSelect={handleFileUpload}
                    onToggleQuickMessages={() => setShowQuickMessages(!showQuickMessages)}
                    onQuickMessageSelect={(msg) => setNewMessage(msg)}
                  />
                </div>
              </div>
            )}

            {/* Mobile Tab Navigation */}
            <div className="lg:hidden">
              <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </div>
        </div>

        </div>

      <CancelTradeModal
        isOpen={showCancelWarning}
        cancelReason={cancelReason}
        confirmNotPaid={confirmNotPaid}
        onClose={() => setShowCancelWarning(false)}
        onReasonSelect={setCancelReason}
        onConfirmNotPaidToggle={() => setConfirmNotPaid(!confirmNotPaid)}
        onConfirmCancel={() => {
          cancelTrade();
          setShowCancelWarning(false);
        }}
      />
    </div>
  );
}
