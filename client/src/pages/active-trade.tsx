import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  X
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
  expires_at: string | null; // This field is no longer used in the UI logic but kept for schema compatibility if needed elsewhere.
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
      const expiryTime = createdTime + (60 * 60 * 1000); // 1 hour from creation
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

      // Fetch buyer and seller profiles separately
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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation("/p2p")}
                className="p-2 hover:bg-muted rounded-lg transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg">Trade #{trade.id.slice(0, 8)}</h1>
                <p className="text-sm text-muted-foreground">
                  {trade.fiat_amount} {trade.fiat_currency} ⇄ {trade.crypto_amount}{" "}
                  {trade.crypto_symbol}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {timeRemaining > 0 ? (
                <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-2 rounded-lg">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                </div>
              ) : (
                <Badge variant="destructive">Expired</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Trade Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Counterparty Card */}
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-14 w-14 border-2 border-green-500">
                  <AvatarImage src={counterparty?.avatar_url || ""} />
                  <AvatarFallback className="bg-green-500/20 text-green-600 font-bold text-lg">
                    {counterparty?.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{counterparty?.username}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-sm">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{counterparty?.positive_ratings || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-red-500/10 text-red-600 px-2 py-0.5 rounded text-sm">
                      <ThumbsDown className="h-3 w-3" />
                      <span>{counterparty?.negative_ratings || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Trade Details Card */}
            <Card className="p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Trade Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    {trade.crypto_amount} {trade.crypto_symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold">
                    {trade.fiat_amount} {trade.fiat_currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-semibold">
                    {trade.price.toLocaleString()} {trade.fiat_currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-semibold">{trade.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      trade.status === "completed"
                        ? "default"
                        : trade.status === "payment_sent"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {trade.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Escrow Status */}
            {trade.escrow_id && (
              <Card className="p-4 bg-green-500/10 border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-full">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600">Escrow Protected</h4>
                    <p className="text-sm text-muted-foreground">
                      Funds are safely held in escrow
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Instructions */}
            <Card className="p-4 bg-blue-500/10 border-blue-500/20">
              <h3 className="font-bold mb-3 text-blue-600">
                {isUserBuyer ? "How to Buy" : "How to Sell"}
              </h3>
              <ol className="space-y-2 text-sm">
                {isUserBuyer ? (
                  <>
                    <li>1. Send {trade.fiat_amount} {trade.fiat_currency} via {trade.payment_method}</li>
                    <li>2. Upload payment proof below</li>
                    <li>3. Click "I Have Paid" button</li>
                    <li>4. Wait for seller to release crypto</li>
                  </>
                ) : (
                  <>
                    <li>1. Share your payment details in chat</li>
                    <li>2. Wait for buyer to send payment</li>
                    <li>3. Verify payment received</li>
                    <li>4. Click "Release Crypto" to complete</li>
                  </>
                )}
              </ol>
            </Card>

            {/* Payment Proof Upload */}
            {isUserBuyer && trade.status === "pending" && (
              <Card className="p-4">
                <h3 className="font-bold mb-3">Upload Payment Proof</h3>
                <label className="block">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploadingProof ? "Uploading..." : "Click to upload receipt"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPaymentProof(file);
                    }}
                    disabled={uploadingProof}
                  />
                </label>
                {trade.payment_proof_url && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Proof uploaded</span>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-180px)] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <h3 className="font-bold">Trade Chat</h3>
                <p className="text-sm text-muted-foreground">
                  All messages are monitored for your safety
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isMine = message.sender_id === user?.id;
                  const isSystem = message.message_type === "system";

                  if (isSystem) {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="bg-muted px-4 py-2 rounded-lg text-sm text-muted-foreground max-w-md text-center">
                          {message.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-md ${isMine ? "order-2" : "order-1"}`}>
                        <div
                          className={`rounded-lg p-3 ${
                            isMine
                              ? "bg-primary text-primary-foreground"
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
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-40">
        <div className="container max-w-7xl mx-auto flex flex-wrap gap-3 justify-center">
          {isUserBuyer && trade.status === "pending" && (
            <Button
              onClick={markAsPaid}
              className="bg-green-600 hover:bg-green-700"
              disabled={!trade.payment_proof_url}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              I Have Paid
            </Button>
          )}

          {isUserSeller && trade.status === "payment_sent" && (
            <Button onClick={releaseFunds} className="bg-green-600 hover:bg-green-700">
              <Shield className="h-4 w-4 mr-2" />
              Release Crypto
            </Button>
          )}

          {trade.status !== "completed" && trade.status !== "cancelled" && (
            <>
              <Button onClick={openDispute} variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Open Dispute
              </Button>
              <Button onClick={cancelTrade} variant="destructive">
                <X className="h-4 w-4 mr-2" />
                Cancel Trade
              </Button>
            </>
          )}

          {trade.status === "completed" && (
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              <span>Trade Completed Successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}