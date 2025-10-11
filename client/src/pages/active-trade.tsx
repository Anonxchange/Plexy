
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ThumbsUp, ThumbsDown, Send, Plus, ChevronDown, Circle } from "lucide-react";

interface TradeData {
  id: string;
  vendor: {
    name: string;
    avatar?: string;
    rating: { positive: number; negative: number };
  };
  type: "buy" | "sell";
  cryptoAmount: string;
  cryptoSymbol: string;
  fiatAmount: string;
  currency: string;
  paymentMethod: string;
  status: "active" | "paid" | "completed";
  timer: number;
  instructions: string[];
}

export default function ActiveTrade() {
  const [, params] = useRoute("/trade/:tradeId");
  const [, setLocation] = useLocation();
  const tradeId = params?.tradeId;
  const [message, setMessage] = useState("");
  const [showInstructions, setShowInstructions] = useState(true);
  const [timer, setTimer] = useState(3594); // Example: 59:54

  // Mock trade data - replace with actual API call
  const trade: TradeData = {
    id: tradeId || "1",
    vendor: {
      name: "Adex24",
      avatar: "",
      rating: { positive: 2502, negative: 7 }
    },
    type: "buy",
    cryptoAmount: "13.314271",
    cryptoSymbol: "USDT",
    fiatAmount: "20000.00",
    currency: "NGN",
    paymentMethod: "Domestic Wire Transfer",
    status: "active",
    timer: 3594,
    instructions: [
      "You must pay 20,000 NGN via Domestic Wire Transfer",
      "They will share their bank details below",
      "When you have sent the money, please mark the trade as \"paid\"",
      "(It really helps if you upload a screenshot or PDF as a receipt of payment too)",
      "Then wait for Adex24 to confirm they have received payment",
      "When they do, they will release your USDT and the trade will be complete"
    ]
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle message sending
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setLocation("/p2p")} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center flex-1">
            <div className="font-bold text-lg">OlamideBS</div>
            <div className="text-sm text-muted-foreground">
              {trade.fiatAmount} {trade.currency} <span className="mx-1">⇄</span>
            </div>
          </div>
          <button className="p-2">
            <div className="relative">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Vendor Info Card */}
      <div className="p-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-green-500">
                <AvatarImage src={trade.vendor.avatar} />
                <AvatarFallback className="bg-green-500/20 text-green-600 font-bold">
                  {trade.vendor.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{trade.vendor.name}</span>
                  <span className="text-xs text-muted-foreground">NG</span>
                  <span className="text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">ℹ️</span>
                </div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                  <span className="text-green-500">Active now</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 bg-green-500/10 text-green-600 rounded-lg">
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs ml-1">{trade.vendor.rating.positive}</span>
              </button>
              <button className="p-2 bg-red-500/10 text-red-600 rounded-lg">
                <ThumbsDown className="h-4 w-4" />
                <span className="text-xs ml-1">{trade.vendor.rating.negative}</span>
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Trade Details */}
      <div className="px-4 mb-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground capitalize">{trade.type}ing</span>
            <div className="flex items-center gap-2">
              <span className="text-xs">⏱️</span>
              <span className="font-mono font-bold">{formatTime(timer)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-lg font-bold">
            <span>{trade.cryptoAmount} {trade.cryptoSymbol}</span>
            <span className="text-sm font-normal text-muted-foreground">FOR</span>
            <span>{trade.fiatAmount} {trade.currency}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1 text-right">
            {trade.paymentMethod}
          </div>
        </div>
      </div>

      {/* Moderator Status */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Circle className="h-2 w-2 fill-muted-foreground" />
            <span>Moderator unavailable</span>
          </div>
          <button className="text-sm text-primary flex items-center gap-1">
            Translate <span className="text-lg">🌐</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 mb-4">
        <Card className="bg-amber-900/20 border-amber-900/30">
          <div className="p-4">
            <div className="font-semibold mb-3">
              {trade.vendor.name} is selling you {trade.cryptoAmount} {trade.cryptoSymbol}
            </div>
            <ol className="space-y-2 text-sm">
              {trade.instructions.map((instruction, index) => (
                <li key={index}>{index + 1}. {instruction}</li>
              ))}
            </ol>
            <div className="mt-3 text-xs text-muted-foreground">
              OCTOBER 11, 2025 AT 9:48 AM
            </div>
          </div>
        </Card>
      </div>

      {/* Follow Instructions Card */}
      <div className="px-4 mb-4">
        <Card className="bg-blue-500/10 border-blue-500/20">
          <div className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-500">ℹ️</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Follow these instructions from your trading partner</p>
            </div>
            <button className="text-blue-500">
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </Card>
      </div>

      {/* Message Input Area */}
      <div className="px-4 mb-4">
        <div className="bg-muted/30 rounded-lg p-2">
          <button className="w-full text-left text-sm text-muted-foreground py-2 px-3 flex items-center justify-between">
            <span>SELECT A MESSAGE:</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex gap-2">
          <button className="p-3 bg-muted rounded-lg">
            <Plus className="h-5 w-5" />
          </button>
          <Input
            placeholder="Write a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 h-12"
          />
          <button 
            onClick={handleSendMessage}
            className="p-3 bg-primary text-primary-foreground rounded-lg"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="flex gap-3 max-w-screen-lg mx-auto">
          <Button variant="outline" className="flex-1 h-12 text-base">
            <span className="mr-2">📋</span>
            Actions
          </Button>
          <Button className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700">
            <span className="mr-2">💬</span>
            Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
