import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
        <div className="hidden lg:block bg-card rounded-lg shadow-lg p-6 max-h-[calc(100vh-100px)] overflow-y-auto lg:order-1">
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
        <div className="lg:bg-card lg:rounded-lg lg:shadow-lg lg:overflow-hidden lg:order-2">
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

            <div className="bg-muted p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground flex items-center gap-2 border-b">
              {isPaid ? (
                <span>Payment marked as sent. Waiting for seller to release crypto.</span>
              ) : (
                <span>Follow the instructions to complete your trade safely.</span>
              )}
            </div>

            {activeTab === "chat" && (
              <div className="p-3 sm:p-4 pb-24 lg:pb-4 space-y-4 max-h-[calc(100vh-400px)] lg:max-h-[600px] overflow-y-auto">
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
              <div className="p-3 sm:p-4 pb-24 lg:pb-4 space-y-4 max-h-[calc(100vh-400px)] lg:max-h-[600px] overflow-y-auto">
                <TradeInstructions
                  isUserBuyer={isUserBuyer}
                  counterpartyUsername={counterparty?.username}
                  trade={trade}
                />

                <TradeInfo
                  trade={trade}
                  counterpartyUsername={counterparty?.username}
                />

                <div className="space-y-4">
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
            )}

            {/* Mobile Message Input - Only show in chat tab */}
            {activeTab === "chat" && (
              <div className="lg:hidden fixed bottom-14 left-0 right-0 bg-background border-t p-2 sm:p-3">
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
