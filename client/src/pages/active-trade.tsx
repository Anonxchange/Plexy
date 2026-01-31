import { TradeSkeleton } from "@/components/trade-page/trade-skeleton";
import { useState, useEffect, useRef, useCallback } from "react";
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
import { TradeStartedSection } from "@/components/trade-started-section";
import { TradeTerms } from "@/components/trade-terms";
import { TradeCompletedSection } from "@/components/trade-completed-section";

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
  status: "pending" | "approved" | "completed" | "cancelled" | "expired" | "released" | "disputed" | "payment_sent" | "PAYMENT_MARKED" | "APPROVED_AWAITING_PAYMENT" | "PENDING_SELLER_APPROVAL";
  escrow_id: string | null;
  payment_deadline: string | null;
  buyer_paid_at: string | null;
  seller_released_at: string | null;
  created_at: string;
  expires_at: string | null;
  completed_at: string | null;
  time_limit_minutes?: number;
  offer_terms?: string;
  counterparty_requirements?: {
    completedOrders?: number;
    completionRate?: number;
    requireMobile?: boolean;
    requireEmail?: boolean;
    requireVerification?: boolean;
    registeredDays?: number;
  } | null;
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
  read_at?: string | null;
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
  const [counterpartyPresence, setCounterpartyPresence] = useState<{ isOnline: boolean; lastSeen: string | null }>({ isOnline: false, lastSeen: null });
  const lastMessageTimestampRef = useRef<string | null>(null);

  const supabase = createClient();

  const effectiveUserId = currentUserProfileId || user?.id;
  const isUserBuyer = !!(effectiveUserId && trade?.buyer_id === effectiveUserId);
  const counterparty = isUserBuyer ? trade?.seller_profile : trade?.buyer_profile;
  const counterpartyId = isUserBuyer ? trade?.seller_id : trade?.buyer_id;

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

  // Mark unread messages as read when viewing the chat
  useEffect(() => {
    if (activeTab === 'chat' && messages.length > 0 && currentUserProfileId) {
      const unreadMessages = messages.filter(
        msg => msg.sender_id !== currentUserProfileId && !msg.read_at
      );

      if (unreadMessages.length > 0) {
        const markMessagesAsRead = async () => {
          try {
            const messageIds = unreadMessages.map(msg => msg.id);
            const readAtTime = new Date().toISOString();

            console.log('Marking messages as read:', messageIds);

            const { error } = await supabase
              .from('trade_messages')
              .update({ read_at: readAtTime })
              .in('id', messageIds);

            if (error) {
              console.error('Error marking messages as read:', error);
            } else {
              console.log('Messages marked as read successfully');
              // Update local state immediately
              setMessages((prev) =>
                prev.map((msg) =>
                  messageIds.includes(msg.id) ? { ...msg, read_at: readAtTime } : msg
                )
              );
            }
          } catch (error) {
            console.error('Exception marking messages as read:', error);
          }
        };

        // Add a small delay to avoid marking messages as read on first load
        const timer = setTimeout(markMessagesAsRead, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, messages, currentUserProfileId]);

  useEffect(() => {
    let channel: any;
    
    const fetchPresence = async () => {
      if (counterpartyId) {
        const { presenceTracker } = await import('@/lib/presence');
        const presence = await presenceTracker.getUserPresence(counterpartyId);
        setCounterpartyPresence(presence);

        channel = presenceTracker.subscribeToUserPresence(counterpartyId, (updatedPresence) => {
          setCounterpartyPresence(updatedPresence);
        });
      }
    };

    fetchPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [counterpartyId]);

  useEffect(() => {
    // Real-time subscription
    const subscription = supabase
      .channel(`trade-${tradeId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'trade_messages', filter: `trade_id=eq.${tradeId}` },
        async (payload) => {
          const newMessage = payload.new as TradeMessage;

          setMessages((prev) => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });

          // Check if this message was already played in GlobalNotificationListener
          const soundKey = `msg-sound-${newMessage.id}`;
          if (newMessage.sender_id !== currentUserProfileId && !window.sessionStorage.getItem(soundKey)) {
            notificationSounds.play('message_received');
            window.sessionStorage.setItem(soundKey, 'played');
          }

          // Auto-scroll to bottom
          setTimeout(() => {
            const chatContainer = document.querySelector('[data-chat-messages]');
            if (chatContainer) {
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }
          }, 100);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trade_messages', filter: `trade_id=eq.${tradeId}` },
        (payload) => {
          const updatedMessage = payload.new as TradeMessage;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? { ...msg, read_at: updatedMessage.read_at } : msg))
          );
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'p2p_trades', filter: `id=eq.${tradeId}` },
        (payload) => {
          const updatedTrade = payload.new as Partial<Trade>;
          const oldTrade = payload.old as Partial<Trade>;

          console.log('Trade update received:', updatedTrade);

          setTrade((prev) => prev ? { ...prev, ...updatedTrade } : null);
          setIsPaid(!!updatedTrade.buyer_paid_at || updatedTrade.status?.toUpperCase() === 'PAYMENT_MARKED' || updatedTrade.status?.toLowerCase() === 'payment_sent');

          if (updatedTrade.status === 'completed' || updatedTrade.status === 'released') {
            notificationSounds.play('trade_completed');
          } else if (updatedTrade.status === 'cancelled') {
            notificationSounds.play('trade_cancelled');
          } else if (updatedTrade.buyer_paid_at && !oldTrade?.buyer_paid_at) {
            notificationSounds.play('payment_marked');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-time subscription active for trade messages');
        }
      });

    // Polling fallback: Check for new messages every 3 seconds
    // This ensures messages sync even if real-time subscription fails
    const pollInterval = setInterval(async () => {
      if (!tradeId) return;
      
      try {
        // Fetch only messages newer than the last one we saw
        let query = supabase
          .from("trade_messages")
          .select("*")
          .eq("trade_id", tradeId)
          .order("created_at", { ascending: true });

        // Only fetch newer messages to avoid duplicates
        if (lastMessageTimestampRef.current) {
          query = query.gt("created_at", lastMessageTimestampRef.current);
        }

        const { data, error } = await query;

        if (error) {
          console.warn('Polling error:', error);
          return;
        }

        // Also fetch a few recent messages to check for read receipt updates
        const { data: recentMessages } = await supabase
          .from("trade_messages")
          .select("id, read_at")
          .eq("trade_id", tradeId)
          .order("created_at", { ascending: false })
          .limit(20);

        setMessages((prev) => {
          let updated = prev;
          const prevIds = new Set(prev.map(m => m.id));

          // Add new messages if any
          if (data && data.length > 0) {
            // Only add messages that don't already exist (by ID) and aren't temp messages
            const newMessages = data.filter(m => 
              !prevIds.has(m.id) && 
              !m.id.startsWith('temp-')
            );
            
            if (newMessages.length > 0) {
              // Play notification sound for new messages from counterparty
              newMessages.forEach(msg => {
                if (msg.sender_id !== currentUserProfileId) {
                  const soundKey = `msg-sound-${msg.id}`;
                  if (!window.sessionStorage.getItem(soundKey)) {
                    notificationSounds.play('message_received');
                    window.sessionStorage.setItem(soundKey, 'played');
                  }
                }
              });

              // Auto-scroll to bottom
              setTimeout(() => {
                const chatContainer = document.querySelector('[data-chat-messages]');
                if (chatContainer) {
                  chatContainer.scrollTop = chatContainer.scrollHeight;
                }
              }, 100);

              updated = [...prev, ...newMessages];
              // Update timestamp after adding new messages
              lastMessageTimestampRef.current = newMessages[newMessages.length - 1].created_at;
            }
          }

          // Update read receipts on recent messages (important for showing delivered status)
          if (recentMessages && recentMessages.length > 0) {
            const hasReadUpdates = updated.some(msg => {
              const fresh = recentMessages.find(r => r.id === msg.id);
              return fresh && msg.read_at !== fresh.read_at;
            });

            if (hasReadUpdates) {
              updated = updated.map(msg => {
                const fresh = recentMessages.find(r => r.id === msg.id);
                return fresh && fresh.read_at !== msg.read_at 
                  ? { ...msg, read_at: fresh.read_at } 
                  : msg;
              });
            }
          }

          return updated;
        });
      } catch (error) {
        console.warn('Message polling error:', error);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearInterval(pollInterval);
    };
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

      if (remainingSeconds === 0 && (trade.status === "pending" || trade.status === "approved") && !isPaid) {
        handleAutoCancelTrade();
      }

      if (remainingSeconds === 120 && (trade.status === "pending" || trade.status === "approved") && !isPaid) {
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
      } else {
        // Fallback to user.id if profile lookup fails
        setCurrentUserProfileId(user.id);
      }
    } catch (error) {
      console.error("Error fetching current user profile:", error);
      // Fallback to user.id on error
      setCurrentUserProfileId(user.id);
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
    if (!tradeId) return;
    try {
      setLoading(true);
      const { data: tradeData, error: tradeError } = await supabase
        .from("p2p_trades")
        .select("id, offer_id, buyer_id, seller_id, crypto_symbol, crypto_amount, fiat_currency, fiat_amount, price, payment_method, status, escrow_id, payment_deadline, buyer_paid_at, seller_released_at, created_at, expires_at, completed_at")
        .eq("id", tradeId)
        .single();

      if (tradeError) throw tradeError;

      const { data: offerData } = await supabase
        .from("p2p_offers")
        .select("time_limit_minutes, offer_terms, counterparty_requirements")
        .eq("id", tradeData.offer_id)
        .single();

      // Check escrow status if it exists
      if (tradeData.escrow_id) {
        try {
          const escrowResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/btc-escrow-status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ tradeId: tradeId })
          });
          const escrowStatus = await escrowResponse.json();
          console.log("Escrow status:", escrowStatus);
        } catch (e) {
          console.error("Failed to fetch escrow status", e);
        }
      }

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
        offer_terms: offerData?.offer_terms || "",
        counterparty_requirements: offerData?.counterparty_requirements || null,
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



  const cancelTrade = async () => {
    if (!tradeId || !cancelReason) {
      toast({
        title: "Error",
        description: "Please select a reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    // Only seller can cancel the trade
    if (isUserBuyer) {
      toast({
        title: "Permission Denied",
        description: "Only the seller can cancel this trade",
        variant: "destructive",
      });
      return;
    }

    // Get trade details to verify status
    const { data: tradeData, error: tradeError } = await supabase
      .from("p2p_trades")
      .select("buyer_id, seller_id, status, buyer_paid_at")
      .eq("id", tradeId)
      .single();

    if (tradeError || !tradeData) {
      toast({
        title: "Error",
        description: "Could not verify trade details",
        variant: "destructive",
      });
      return;
    }

    // Updated cancellation logic:
    // 1. If seller, they can ONLY cancel in 'pending' state.
    // 2. If buyer, they can cancel in 'pending' or 'approved' (before payment).
    
    if (!isUserBuyer) {
      if (tradeData.status !== 'pending' && tradeData.status?.toLowerCase() !== 'pending_seller_approval') {
        toast({
          title: "Cannot Cancel",
          description: "Sellers cannot cancel the trade once the contract is approved.",
          variant: "destructive",
        });
        setShowCancelWarning(false);
        setCancelReason("");
        setConfirmNotPaid(false);
        return;
      }
    } else {
      // Buyer logic
      if (tradeData.buyer_paid_at) {
        toast({
          title: "Cannot Cancel",
          description: "You cannot cancel after marking payment as sent.",
          variant: "destructive",
        });
        setShowCancelWarning(false);
        setCancelReason("");
        setConfirmNotPaid(false);
        return;
      }
    }

    const isCancellable = tradeData.status === 'pending' || tradeData.status === 'approved' || 
                         tradeData.status === 'APPROVED_AWAITING_PAYMENT' || tradeData.status?.toLowerCase() === 'pending_seller_approval';
    
    if (!isCancellable) {
      toast({
        title: "Cannot Cancel",
        description: "This trade cannot be cancelled in its current state.",
        variant: "destructive",
      });
      setShowCancelWarning(false);
      setCancelReason("");
      setConfirmNotPaid(false);
      return;
    }

    try {

      // Get trade details again for escrow and wallet operations
      const { data: fullTradeDetails, error: fetchDetailsError } = await supabase
        .from("p2p_trades")
        .select("escrow_id, seller_id, crypto_amount, crypto_symbol, status, buyer_paid_at, buyer_id")
        .eq("id", tradeId)
        .single();

      if (fetchDetailsError || !fullTradeDetails) {
        console.error("Trade details fetch error for cancellation:", fetchDetailsError);
        toast({
          title: "Database Error",
          description: `Failed to fetch trade details for cancellation: ${fetchDetailsError?.message || 'Unknown error'}`,
          variant: "destructive",
        });
        return;
      }

      // If there's an escrow to release, handle wallet update first
      let walletUpdated = false;
      if (fullTradeDetails.escrow_id) {
        const { data: escrowData } = await supabase
          .from("escrows")
          .select("status")
          .eq("id", fullTradeDetails.escrow_id)
          .single();

        if (escrowData?.status === 'locked') {
          // Get current wallet balances
          const { data: wallet, error: walletError } = await supabase
            .from("wallets")
            .select("balance, locked_balance")
            .eq("user_id", fullTradeDetails.seller_id)
            .eq("crypto_symbol", fullTradeDetails.crypto_symbol)
            .single();

          if (walletError || !wallet) {
            throw new Error("Failed to load seller wallet");
          }

          const currentBalance = Number(wallet.balance) || 0;
          const currentLocked = Number(wallet.locked_balance) || 0;
          const releaseAmount = Number(fullTradeDetails.crypto_amount) || 0;

          const newBalance = currentBalance + releaseAmount;
          const newLockedBalance = Math.max(0, currentLocked - releaseAmount);

          // Update wallet - release funds back to available balance
          const { error: walletUpdateError } = await supabase
            .from("wallets")
            .update({
              balance: newBalance,
              locked_balance: newLockedBalance,
            })
            .eq("user_id", fullTradeDetails.seller_id)
            .eq("crypto_symbol", fullTradeDetails.crypto_symbol);

          if (walletUpdateError) {
            console.error("Wallet update error:", walletUpdateError);
            throw new Error(`Failed to update wallet balances: ${walletUpdateError.message}`);
          }
          walletUpdated = true;

          // Only update escrow status after wallet is successfully updated
          await supabase
            .from("escrows")
            .update({ status: "cancelled" })
            .eq("id", fullTradeDetails.escrow_id);
        }
      }

      // Update the trade status to cancelled
      const { error: cancelError } = await supabase
        .from("p2p_trades")
        .update({ 
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: cancelReason,
        })
        .eq("id", tradeId);

      if (cancelError) {
        console.error("Cancel error:", cancelError);
        throw new Error(`Failed to cancel trade: ${cancelError.message}`);
      }

      // Close the cancel modal and reset state
      setShowCancelWarning(false);
      setCancelReason("");
      setConfirmNotPaid(false);

      notificationSounds.play('trade_cancelled');
      toast({
        title: "Trade Cancelled",
        description: walletUpdated 
          ? "The trade has been cancelled and funds have been released back to the seller."
          : "The trade has been cancelled.",
      });

      // Refresh trade data to show updated status
      await fetchTradeData();
    } catch (error) {
      console.error("Error cancelling trade:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel trade. Please try again.",
        variant: "destructive",
      });
    }
  };



  const handleAutoCancelTrade = async () => {
    if (!tradeId) return;

    try {
      // First, update the trade status to cancelled
      const { error: cancelError } = await supabase
        .from("p2p_trades")
        .update({ 
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: "expired",
        })
        .eq("id", tradeId)
        .eq("status", "pending"); // Only cancel if still pending

      if (cancelError) return; // Trade might have already been processed

      // Get trade details to release escrow
      const { data: tradeData } = await supabase
        .from("p2p_trades")
        .select("escrow_id, seller_id, crypto_amount, crypto_symbol")
        .eq("id", tradeId)
        .single();

      // Release escrow if exists
      if (tradeData?.escrow_id) {
        const { data: escrowData } = await supabase
          .from("escrows")
          .select("status")
          .eq("id", tradeData.escrow_id)
          .single();

        if (escrowData?.status === 'locked') {
          const { data: wallet } = await supabase
            .from("wallets")
            .select("balance, locked_balance")
            .eq("user_id", tradeData.seller_id)
            .eq("crypto_symbol", tradeData.crypto_symbol)
            .single();

          if (wallet) {
            const currentBalance = Number(wallet.balance) || 0;
            const currentLocked = Number(wallet.locked_balance) || 0;
            const releaseAmount = Number(tradeData.crypto_amount) || 0;

            const newBalance = currentBalance + releaseAmount;
            const newLockedBalance = Math.max(0, currentLocked - releaseAmount);

            await supabase
              .from("wallets")
              .update({ balance: newBalance, locked_balance: newLockedBalance })
              .eq("user_id", tradeData.seller_id)
              .eq("crypto_symbol", tradeData.crypto_symbol);
          }

          await supabase
            .from("escrows")
            .update({ status: "cancelled" })
            .eq("id", tradeData.escrow_id);
        }
      }

      notificationSounds.play('trade_cancelled');
      toast({
        title: "Trade Expired",
        description: "The trade has been automatically cancelled due to timeout.",
      });
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

      // Update the timestamp ref immediately so polling doesn't re-fetch this message
      if (data && data.created_at) {
        lastMessageTimestampRef.current = data.created_at;
      }

      const recipientId = isUserBuyer ? trade?.seller_id : trade?.buyer_id;

      const { data: senderProfile } = await supabase
        .from('user_profiles')
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

      // Replace the optimistic message with the real one from the server
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
          {/* Trade Started Card */}
          <div className="mb-6">
            <TradeStartedSection
              isUserBuyer={isUserBuyer}
              trade={trade}
              counterpartyUsername={counterparty?.username}
              isPaid={isPaid}
              timer={timer}
              onTradeUpdate={fetchTradeData}
              onShowCancelModal={() => setShowCancelWarning(true)}
              formatTime={formatTime}
            />
          </div>

          {/* Trade Terms */}
          <TradeTerms
            offerTerms={trade.offer_terms}
            counterpartyUsername={counterparty?.username}
            counterpartyRequirements={trade.counterparty_requirements}
          />

          {/* Trade Information */}
          <TradeInfo
            trade={trade}
            counterpartyUsername={counterparty?.username}
          />
        </div>

        {/* Left Column: Chat Section (Mobile: Full width, Desktop: Right side) */}
        <div className="lg:bg-card lg:rounded-lg lg:order-2">
          <div className="max-w-md mx-auto lg:max-w-full">
            {/* Hide trade header on mobile when in actions tab */}
            <div className={activeTab === "actions" ? "hidden lg:block" : ""}>
              <TradeHeader
                counterparty={counterparty}
                isUserBuyer={isUserBuyer}
                trade={trade}
                timer={timer}
                isPaid={isPaid}
                formatTime={formatTime}
                formatTradeTime={formatTradeTime}
                onCounterpartyClick={handleCounterpartyClick}
                counterpartyPresence={counterpartyPresence}
              />
            </div>

            {/* Hide trade timer on mobile when in actions tab */}
            <div className={activeTab === "actions" ? "hidden lg:block" : ""}>
              <TradeTimer isUserBuyer={isUserBuyer} trade={trade} />

              <div className="bg-muted p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              {isPaid ? (
                <span>Payment marked as sent. Waiting for seller to release crypto.</span>
              ) : (
                <span>Follow the instructions to complete your trade safely.</span>
              )}
              </div>
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
                  trade={trade}
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
              <div className="p-3 sm:p-4 pb-24 lg:pb-4 space-y-4 overflow-y-auto">
                {/* Trade Status Display for Cancelled/Completed */}
                {trade.status === "cancelled" && (
                  <div className="bg-card rounded-lg overflow-hidden border shadow-xs">
                    <div className="bg-destructive p-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-destructive-foreground" />
                      <span className="font-semibold text-sm text-destructive-foreground">Trade Cancelled</span>
                    </div>
                    <div className="p-5 space-y-4 text-center">
                      <XCircle className="w-12 h-12 text-destructive mx-auto" />
                      <div className="text-destructive font-bold text-lg">This Trade Was Cancelled</div>
                      <p className="text-sm text-muted-foreground">
                        {trade.crypto_symbol} funds have been released back to the seller's wallet.
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation("/p2p")}
                      >
                        Back to Marketplace
                      </Button>
                    </div>
                  </div>
                )}

                {(trade.status === "completed" || trade.status === "released") && (
                  <TradeCompletedSection
                    trade={trade}
                    isUserBuyer={isUserBuyer}
                    sellerProfile={trade.seller_profile}
                    buyerProfile={trade.buyer_profile}
                  />
                )}

                {/* Trade Started Card - Only show for active trades */}
                {trade.status !== "cancelled" && trade.status !== "completed" && trade.status !== "released" && (
                  <TradeStartedSection
                    isUserBuyer={isUserBuyer}
                    trade={trade}
                    counterpartyUsername={counterparty?.username}
                    isPaid={isPaid}
                    timer={timer}
                    onTradeUpdate={fetchTradeData}
                    onShowCancelModal={() => setShowCancelWarning(true)}
                    formatTime={formatTime}
                  />
                )}

                {/* Trade Terms */}
                <TradeTerms
                  offerTerms={trade.offer_terms}
                  counterpartyUsername={counterparty?.username}
                  counterpartyRequirements={trade.counterparty_requirements}
                />

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
        onClose={() => {
          setShowCancelWarning(false);
          setCancelReason("");
          setConfirmNotPaid(false);
        }}
        onReasonSelect={setCancelReason}
        onConfirmNotPaidToggle={() => setConfirmNotPaid(!confirmNotPaid)}
        onConfirmCancel={cancelTrade}
      />
    </div>
  );
}
