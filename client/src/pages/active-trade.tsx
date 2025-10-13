
import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  Send, 
  Upload, 
  Clock, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  File,
  X,
  Copy,
  Flag,
  MessageCircle,
  AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

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

interface TradeMessage {
  id: string;
  trade_id: string;
  sender_id: string;
  message_type: "text" | "image" | "file" | "system";
  content: string;
  file_url: string | null;
  is_read: boolean;
  created_at: string;
}

export default function ActiveTrade() {
  const [, params] = useRoute("/trade/:tradeId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const tradeId = params?.tradeId;

  const [trade, setTrade] = useState<Trade | null>(null);
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [activeTab, setActiveTab] = useState<"actions" | "chat">("actions");
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  
  const isUserBuyer = currentUserProfileId && trade?.buyer_id === currentUserProfileId;
  const isUserSeller = currentUserProfileId && trade?.seller_id === currentUserProfileId;
  
  const counterparty = isUserBuyer 
    ? trade?.seller_profile 
    : isUserSeller 
      ? trade?.buyer_profile 
      : null;

  useEffect(() => {
    if (user?.id) {
      fetchCurrentUserProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    if (tradeId && currentUserProfileId) {
      fetchTradeData();
      subscribeToMessages();
    }
  }, [tradeId, currentUserProfileId]);

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

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!trade?.payment_deadline) return;

      const now = Date.now();
      const deadline = new Date(trade.payment_deadline).getTime();
      const remaining = Math.max(0, Math.floor((deadline - now) / 1000));

      setTimeRemaining(remaining);

      // Auto-expire trade if time runs out
      if (remaining === 0 && trade.status === "pending" && !trade.buyer_paid_at) {
        handleTradeExpiry();
      }
    };

    if (trade?.payment_deadline) {
      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [trade?.payment_deadline, trade?.status, trade?.buyer_paid_at]);

  const handleTradeExpiry = async () => {
    if (!tradeId) return;

    try {
      await supabase
        .from("p2p_trades")
        .update({ status: "expired" })
        .eq("id", tradeId);

      await supabase.from("trade_messages").insert({
        trade_id: tradeId,
        sender_id: "system",
        message_type: "system",
        content: "Trade expired due to payment timeout",
      });

      toast({
        title: "Trade Expired",
        description: "Payment time limit exceeded. Trade has been cancelled.",
        variant: "destructive",
      });

      fetchTradeData();
    } catch (error) {
      console.error("Error expiring trade:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      const { data: messagesData, error: messagesError } = await supabase
        .from("trade_messages")
        .select("*")
        .eq("trade_id", tradeId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      const hasInstructions = messagesData?.some(msg => msg.content.includes("is selling you"));
      
      if (!hasInstructions && messagesData) {
        const sellerUsername = sellerProfile?.username || "Seller";
        const instructionsMessage: TradeMessage = {
          id: `instructions-${tradeId}`,
          trade_id: tradeId,
          sender_id: "system",
          message_type: "system",
          content: `${sellerUsername} is selling you ${tradeData.crypto_amount} ${tradeData.crypto_symbol}\n\n1. You must pay ${tradeData.fiat_amount.toLocaleString()} ${tradeData.fiat_currency} via ${tradeData.payment_method}\n\n2. They will share their bank details below\n\n3. When you have sent the money, please mark the trade as "paid"\n\n4. (It really helps if you upload a screenshot or PDF as a receipt of payment too)\n\n5. Then wait for ${sellerUsername} to confirm they have received payment\n\n6. When they do, they will release your ${tradeData.crypto_symbol} and the trade will be complete`,
          file_url: null,
          is_read: false,
          created_at: tradeData.created_at,
        };
        messagesData.unshift(instructionsMessage);
      }

      setMessages(messagesData || []);
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

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`trade-messages:${tradeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trade_messages",
          filter: `trade_id=eq.${tradeId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as TradeMessage]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !tradeId) return;

    try {
      const { error } = await supabase.from("trade_messages").insert({
        trade_id: tradeId,
        sender_id: user.id,
        message_type: "text",
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const markAsPaid = async () => {
    if (!tradeId) return;

    try {
      // Just update the buyer_paid_at timestamp, keep status as pending
      const { error } = await supabase
        .from("p2p_trades")
        .update({
          buyer_paid_at: new Date().toISOString(),
        })
        .eq("id", tradeId);

      if (error) throw error;

      await supabase.from("trade_messages").insert({
        trade_id: tradeId,
        sender_id: user!.id,
        message_type: "system",
        content: "Buyer marked payment as sent. Waiting for seller confirmation.",
      });

      toast({
        title: "Success",
        description: "Payment marked as sent. Waiting for seller to release.",
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

  const releaseFunds = async () => {
    if (!tradeId || !trade?.escrow_id) return;

    try {
      // Release escrow first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const escrowResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/escrow-release`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            escrow_id: trade.escrow_id,
          }),
        });

        if (!escrowResponse.ok) {
          throw new Error("Failed to release escrow");
        }
      }

      // Update trade status
      const { error } = await supabase
        .from("p2p_trades")
        .update({
          status: "completed",
          seller_released_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", tradeId);

      if (error) throw error;

      await supabase.from("trade_messages").insert({
        trade_id: tradeId,
        sender_id: user!.id,
        message_type: "system",
        content: "Seller released the crypto. Trade completed!",
      });

      toast({
        title: "Success!",
        description: "Funds released successfully. Trade completed!",
      });

      fetchTradeData();
    } catch (error) {
      console.error("Error releasing funds:", error);
      toast({
        title: "Error",
        description: "Failed to release funds",
        variant: "destructive",
      });
    }
  };

  const uploadPaymentProof = async (file: File) => {
    if (!tradeId || !user) return;

    setUploadingProof(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${tradeId}/${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("p2p_trades")
        .update({ payment_proof_url: data.publicUrl })
        .eq("id", tradeId);

      if (updateError) throw updateError;

      await supabase.from("trade_messages").insert({
        trade_id: tradeId,
        sender_id: user.id,
        message_type: "image",
        content: "Payment proof uploaded",
        file_url: data.publicUrl,
      });

      toast({
        title: "Success",
        description: "Payment proof uploaded successfully",
      });

      fetchTradeData();
    } catch (error) {
      console.error("Error uploading proof:", error);
      toast({
        title: "Error",
        description: "Failed to upload payment proof",
        variant: "destructive",
      });
    } finally {
      setUploadingProof(false);
    }
  };

  const openDispute = async () => {
    if (!tradeId || !user) return;

    try {
      const { error } = await supabase.from("disputes").insert({
        trade_id: tradeId,
        initiated_by: user.id,
        reason: "Payment dispute",
        description: "User initiated a dispute for this trade",
      });

      if (error) throw error;

      await supabase
        .from("p2p_trades")
        .update({ status: "disputed" })
        .eq("id", tradeId);

      toast({
        title: "Dispute Opened",
        description: "A moderator will review your case shortly",
      });

      fetchTradeData();
    } catch (error) {
      console.error("Error opening dispute:", error);
      toast({
        title: "Error",
        description: "Failed to open dispute",
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Trade ID copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trade details...</p>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Trade Not Found</p>
          <Button onClick={() => setLocation("/p2p")} variant="outline">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const quickReplies = ["Hi", "Are you online?", "How can I pay?", "I paid"];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Counterparty Info */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="p-3 sm:p-4">
          {/* Top Row: Back + User + Timer */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <button 
              onClick={() => setLocation("/p2p")} 
              className="p-2 hover:bg-muted rounded-lg transition-colors lg:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary flex-shrink-0">
              <AvatarImage src={counterparty?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm sm:text-base">
                {counterparty?.username?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <span className="font-semibold text-base sm:text-lg truncate">{counterparty?.username || "Unknown"}</span>
                <span className="text-base sm:text-lg flex-shrink-0">🇳🇬</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
                <span className="text-primary flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {counterparty?.positive_ratings || 0}
                </span>
                <span className="text-red-500 flex items-center gap-1">
                  <ThumbsDown className="h-3 w-3" />
                  {counterparty?.negative_ratings || 0}
                </span>
                <div className="flex items-center gap-1 text-green-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="hidden sm:inline">Active</span>
                </div>
              </div>
            </div>

            {/* Current User Avatar */}
            <Avatar className="h-14 w-14 border-2 border-border flex-shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
              <AvatarFallback className="bg-muted text-foreground font-bold text-base">
                {user?.user_metadata?.username?.substring(0, 2).toUpperCase() || "ME"}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-end flex-shrink-0">
              <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-mono text-xs sm:text-sm">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Trade Summary */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 sm:p-3">
            <div className="text-xs sm:text-sm font-semibold break-words">
              {isUserBuyer ? "BUYING" : "SELLING"} {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol} FOR {trade.fiat_amount.toLocaleString()} {trade.fiat_currency}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">{trade.payment_method}</div>
          </div>
        </div>

        {/* Moderator Status */}
        <div className="px-3 sm:px-4 pb-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground rounded-full"></div>
            <span className="text-xs sm:text-sm text-muted-foreground">Moderator unavailable</span>
          </div>
          <button className="text-primary text-xs sm:text-sm font-semibold flex items-center gap-1">
            Translate 🌐
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3 sm:p-4">
        {activeTab === "actions" && (
          <div className="space-y-3 sm:space-y-4">
            {/* Trade Started Status */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              <span className="text-base sm:text-lg font-semibold">Trade Started</span>
            </div>

            {/* Payment Instruction Card */}
            {isUserBuyer && trade.status === "pending" && (
              <>
                <Card className="p-4 sm:p-5 bg-[#1a1a1a] border border-border">
                  <p className="text-base sm:text-lg font-medium mb-2">
                    Please make a payment of {trade.fiat_amount.toLocaleString()} {trade.fiat_currency} using {trade.payment_method}.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {trade.crypto_amount} {trade.crypto_symbol} will be added to your {trade.crypto_symbol === 'USDT' ? 'Tether' : trade.crypto_symbol} wallet
                  </p>

                  <div className="border-t border-border pt-4 mb-4">
                    <p className="text-sm sm:text-base mb-4">
                      <span className="font-semibold">Once you've made the payment</span>, be sure to click{' '}
                      <span className="font-semibold">Paid</span> within the given time limit. Otherwise the trade will be automatically cancelled and the {trade.crypto_symbol} will be returned to the seller's wallet.
                    </p>

                    <Button
                      onClick={markAsPaid}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-14 sm:h-16 text-base sm:text-lg flex items-center justify-between"
                    >
                      <span>Paid</span>
                      <div className="flex flex-col items-end">
                        <CheckCircle2 className="h-6 w-6 mb-1" />
                        <span className="text-xs font-normal">Time left {formatTime(timeRemaining)}</span>
                      </div>
                    </Button>
                  </div>
                </Card>

                <Button
                  variant="outline"
                  onClick={openDispute}
                  className="w-full h-12 sm:h-14 text-sm sm:text-base font-medium bg-muted/50 border-muted-foreground/30"
                >
                  Report Bad Behaviour
                </Button>
              </>
            )}

            {/* Seller: Waiting for Payment */}
            {isUserSeller && trade.status === "pending" && !trade.buyer_paid_at && (
              <Card className="p-4 sm:p-5 bg-[#1a1a1a] border border-border">
                <p className="text-base sm:text-lg font-medium mb-2">
                  Waiting for buyer to pay {trade.fiat_amount.toLocaleString()} {trade.fiat_currency} via {trade.payment_method}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Your {trade.crypto_amount} {trade.crypto_symbol} is in escrow and will be released when buyer marks payment as sent.
                </p>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span>Waiting for buyer payment</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Seller: Release Funds Card */}
            {isUserSeller && trade.status === "pending" && trade.buyer_paid_at && (
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  <h3 className="font-semibold text-sm sm:text-base">Confirm Payment</h3>
                </div>
                <p className="text-xs sm:text-sm mb-3 sm:mb-4">
                  Buyer has marked payment as sent. Verify and release {trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}
                </p>
                <Button onClick={releaseFunds} className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-sm sm:text-base font-semibold">
                  Release Crypto
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                </Button>
              </Card>
            )}

            {/* Trade Information */}
            <Card className="p-3 sm:p-4">
              <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Trade Details
              </h3>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-xs sm:text-sm text-muted-foreground">RATE</span>
                  <span className="text-xs sm:text-sm font-bold">
                    {trade.price.toLocaleString()} {trade.fiat_currency}/{trade.crypto_symbol}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-xs sm:text-sm text-muted-foreground">TRADE ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-mono truncate max-w-[120px] sm:max-w-none">{trade.id.slice(0, 11)}</span>
                    <button
                      onClick={() => copyToClipboard(trade.id)}
                      className="text-muted-foreground hover:text-foreground transition flex-shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">STARTED</span>
                  <span className="text-xs sm:text-sm">{formatDate(trade.created_at)}</span>
                </div>
              </div>
            </Card>

            {/* Security Warning */}
            {isUserBuyer && trade.status === "pending" && (
              <Card className="p-4 sm:p-5 bg-green-900/20 border border-green-600/30 relative">
                <button
                  onClick={() => {/* Close warning */}}
                  className="absolute top-3 right-3 text-foreground/60 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
                <p className="text-sm sm:text-base pr-8">
                  Keep trades within NoOnes. Some users may ask you to trade outside the NoOnes platform. This is against our Terms of Service and likely a scam attempt. You must insist on keeping all trade conversations within NoOnes. If you choose to proceed outside NoOnes, note that we cannot help or support you if you are scammed during such trades.
                </p>
              </Card>
            )}

            {/* Cancel Trade Button */}
            {isUserBuyer && trade.status === "pending" && (
              <Button
                variant="outline"
                onClick={cancelTrade}
                className="w-full h-12 sm:h-14 text-sm sm:text-base font-medium border-red-500/50 text-red-500 hover:bg-red-500/10"
              >
                Cancel Trade
              </Button>
            )}

            {/* Payment Status Indicator */}
            {isUserBuyer && trade.status === "pending" && !trade.buyer_paid_at && (
              <div className="flex items-center justify-center gap-2 py-3 text-sm sm:text-base text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                <span>You haven't paid yet</span>
              </div>
            )}

            {/* Waiting for Seller to Release */}
            {isUserBuyer && trade.status === "pending" && trade.buyer_paid_at && (
              <Card className="p-4 sm:p-5 bg-green-900/20 border border-green-600/30">
                <div className="flex items-center justify-center gap-2 py-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm sm:text-base">Payment marked as sent. Waiting for seller to release crypto...</span>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 260px)" }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 mb-3 sm:mb-4">
              {messages.map((message) => {
                const isMine = message.sender_id === user?.id;
                const isSystem = message.message_type === "system";

                if (isSystem) {
                  return (
                    <div key={message.id} className="mb-2 sm:mb-3">
                      <div className="bg-amber-800/80 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm text-white whitespace-pre-line">
                        {message.content}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase">
                        {new Date(message.created_at).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }).toUpperCase()} AT {new Date(message.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`rounded-lg p-2.5 sm:p-3 max-w-[85%] sm:max-w-[75%] ${
                        isMine
                          ? "bg-primary text-black"
                          : "bg-muted"
                      }`}
                    >
                      {message.message_type === "image" && message.file_url && (
                        <img
                          src={message.file_url}
                          alt="Payment proof"
                          className="rounded mb-2 max-w-full"
                        />
                      )}
                      <p className="text-xs sm:text-sm whitespace-pre-line break-words">{message.content}</p>
                      <p className={`text-[10px] sm:text-xs mt-1 ${isMine ? 'text-black/70' : 'text-muted-foreground'}`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="mb-2 sm:mb-3">
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => setNewMessage(reply)}
                    className="bg-muted hover:bg-accent px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors flex-shrink-0"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="flex gap-1.5 sm:gap-2 items-center bg-muted rounded-lg p-1.5 sm:p-2">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-background border-0 text-xs sm:text-sm h-9 sm:h-10"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-primary text-black hover:opacity-90 p-2 sm:p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
        <button
          onClick={() => setActiveTab("actions")}
          className={`flex-1 py-3 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold transition-all ${
            activeTab === "actions"
              ? "bg-primary text-black"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Actions</span>
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 sm:py-4 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold transition-all ${
            activeTab === "chat"
              ? "bg-primary text-black"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Chat</span>
        </button>
      </div>
    </div>
  );
}
