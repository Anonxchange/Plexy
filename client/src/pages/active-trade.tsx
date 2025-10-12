
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const isUserBuyer = user?.id === trade?.buyer_id;
  const isUserSeller = user?.id === trade?.seller_id;
  const counterparty = isUserBuyer ? trade?.seller_profile : trade?.buyer_profile;

  useEffect(() => {
    if (tradeId) {
      fetchTradeData();
      subscribeToMessages();
    }
  }, [tradeId]);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!trade?.created_at) return;

      const now = Date.now();
      const createdTime = new Date(trade.created_at).getTime();
      const expiryTime = createdTime + (60 * 60 * 1000);
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));

      setTimeRemaining(remaining);
    };

    if (trade?.created_at) {
      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [trade?.created_at]);

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

      setTrade({
        ...tradeData,
        buyer_profile: buyerProfile,
        seller_profile: sellerProfile,
      } as Trade);

      const { data: messagesData, error: messagesError } = await supabase
        .from("trade_messages")
        .select("*")
        .eq("trade_id", tradeId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      // Check if we need to add the initial instructions message
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
      const { error } = await supabase
        .from("p2p_trades")
        .update({
          status: "payment_sent",
          buyer_paid_at: new Date().toISOString(),
        })
        .eq("id", tradeId);

      if (error) throw error;

      await supabase.from("trade_messages").insert({
        trade_id: tradeId,
        sender_id: user!.id,
        message_type: "system",
        content: "Buyer marked payment as sent",
      });

      toast({
        title: "Success",
        description: "Trade marked as paid. Waiting for seller to release.",
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
    if (!tradeId) return;

    try {
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
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        {/* Timer Bar - Show in chat tab */}
        {activeTab === "chat" && (
          <div className="flex items-center justify-between mb-3 bg-muted rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Active now</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-green-500">
              <AvatarImage src={counterparty?.avatar_url || ""} />
              <AvatarFallback className="bg-green-500/20 text-green-600 font-bold">
                {counterparty?.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{counterparty?.username}</span>
                <span className="text-lg">🇳🇬</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-500 flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {counterparty?.positive_ratings || 0}
                </span>
                <span className="text-red-500 flex items-center gap-1">
                  <ThumbsDown className="h-3 w-3" />
                  {counterparty?.negative_ratings || 0}
                </span>
              </div>
            </div>
          </div>
          {activeTab === "actions" && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="flex items-center gap-2 text-yellow-500">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">Active now</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="text-sm font-semibold mb-1">
            {isUserBuyer ? "Buying" : "Selling"} {trade.crypto_amount} {trade.crypto_symbol} FOR {trade.fiat_amount} {trade.fiat_currency}
          </div>
          <div className="text-xs text-muted-foreground">{trade.payment_method}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {activeTab === "actions" && (
          <div className="space-y-4 pb-4">
            {/* Status Card */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="font-semibold text-lg">Trade Started</h3>
              </div>

              <div className="bg-muted rounded-lg p-4 mb-4">
                <p className="text-sm mb-2">
                  Please make a payment of <span className="text-green-500 font-semibold">{trade.fiat_amount} {trade.fiat_currency}</span> using{" "}
                  <span className="text-primary">{trade.payment_method}</span>.
                </p>
                <p className="text-xs text-muted-foreground">
                  {trade.crypto_amount} {trade.crypto_symbol} will be added to your wallet
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm mb-3">
                  <span className="font-semibold">Once you've made the payment,</span> be sure to click{" "}
                  <span className="text-green-500 font-semibold">Paid</span> within the given time limit. Otherwise the trade will be automatically canceled and the {trade.crypto_symbol} will be returned to the seller's wallet.
                </p>

                {isUserBuyer && trade.status === "pending" && (
                  <>
                    <Button
                      onClick={markAsPaid}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-between px-4"
                    >
                      <span>Paid</span>
                      {trade.status === "payment_sent" && <CheckCircle2 className="h-5 w-5" />}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      Time left {formatTime(timeRemaining)}
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Report Button */}
            <Button variant="outline" className="w-full" onClick={openDispute}>
              <Flag className="h-4 w-4 mr-2" />
              Report Bad Behaviour
            </Button>

            {/* Warning Message */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 relative">
              <button 
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                onClick={() => {}}
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-sm text-foreground pr-6">
                Keep trades within NoOnes. Some users may ask you to trade outside the NoOnes platform. This is against our Terms of Service and likely a scam attempt. You must insist on keeping all trade conversations within NoOnes. If you choose to proceed outside NoOnes, note that we cannot help or support you if you are scammed during such trades.
              </p>
            </div>

            {/* Cancel Trade Button */}
            <Button 
              variant="outline" 
              className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500"
              onClick={cancelTrade}
            >
              Cancel Trade
            </Button>

            {/* Info Message */}
            <div className="bg-muted rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">You haven't paid yet</p>
            </div>

            {/* Trade Information */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Trade Information</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">RATE</span>
                  <span className="text-sm font-semibold">
                    {trade.price.toLocaleString()} {trade.fiat_currency}/{trade.crypto_symbol}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">TRADE ID</span>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{trade.id.slice(0, 11)}</span>
                    <button
                      onClick={() => copyToClipboard(trade.id)}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">STARTED</span>
                  <span className="text-sm">{formatDate(trade.created_at)}</span>
                </div>
              </div>
            </Card>

            {isUserSeller && trade.status === "payment_sent" && (
              <Button onClick={releaseFunds} className="w-full bg-green-600 hover:bg-green-700">
                <Shield className="h-4 w-4 mr-2" />
                Release Crypto
              </Button>
            )}

            {/* View Offer Button */}
            <Button variant="outline" className="w-full">
              View Offer
            </Button>

            {/* Take a Tour Button */}
            <Button variant="outline" className="w-full">
              <AlertCircle className="h-4 w-4 mr-2" />
              Take a Tour
            </Button>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 280px)" }}>
            {/* Moderator Bar */}
            <div className="bg-card border-b border-border px-4 py-2 mb-3 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                <span className="text-sm text-muted-foreground">Moderator unavailable</span>
              </div>
              <button className="text-primary text-sm font-semibold">Translate 🌐</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 px-2">
              {messages.map((message) => {
                const isMine = message.sender_id === user?.id;
                const isSystem = message.message_type === "system";

                if (isSystem) {
                  return (
                    <div key={message.id} className="mb-3">
                      <div className="bg-amber-800/80 px-4 py-3 rounded-lg text-sm text-white max-w-full whitespace-pre-line">
                        {message.content}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 uppercase">
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
                  <div key={message.id}>
                    <div
                      className={`rounded-lg p-3 max-w-[80%] ${
                        isMine
                          ? "ml-auto bg-green-500/20 border border-green-500/30"
                          : "bg-amber-800/80"
                      }`}
                    >
                      {message.message_type === "image" && message.file_url && (
                        <img
                          src={message.file_url}
                          alt="Payment proof"
                          className="rounded mb-2 max-w-full"
                        />
                      )}
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-2 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">SELECT A MESSAGE:</span>
                <button className="bg-primary hover:opacity-90 px-4 py-2 rounded text-sm font-semibold flex items-center gap-1 text-primary-foreground">
                  ⋮ OPTIONS
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => setNewMessage(reply)}
                    className="bg-muted hover:bg-accent px-4 py-2 rounded-lg text-sm whitespace-nowrap transition"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="bg-card border-t border-border px-4 py-3 rounded-b-lg">
              <div className="flex gap-2 items-center">
                <button className="text-muted-foreground hover:text-foreground p-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Write a message..."
                  className="flex-1"
                />
                <button
                  onClick={sendMessage}
                  className="text-primary hover:opacity-80 p-2"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
        <button
          onClick={() => setActiveTab("actions")}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-semibold transition-colors ${
            activeTab === "actions"
              ? "bg-green-600 text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="h-5 w-5" />
          Actions
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-semibold transition-colors ${
            activeTab === "chat"
              ? "bg-green-600 text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          Chat
        </button>
      </div>
    </div>
  );
}
