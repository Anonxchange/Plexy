
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbsUp, ThumbsDown, Shield, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function UserProfileDialog({
  isOpen,
  onClose,
  userId,
}: UserProfileDialogProps) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    }
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Fetch feedback
      const { data: positiveFeedback, count: positiveCount } = await supabase
        .from("trade_feedback")
        .select("*", { count: "exact" })
        .eq("recipient_id", userId)
        .eq("rating", "positive");

      const { data: negativeFeedback, count: negativeCount } = await supabase
        .from("trade_feedback")
        .select("*", { count: "exact" })
        .eq("recipient_id", userId)
        .eq("rating", "negative");

      // Calculate stats
      const totalTrades = (positiveCount || 0) + (negativeCount || 0);
      const successRate = totalTrades > 0 ? ((positiveCount || 0) / totalTrades * 100).toFixed(2) : "0.00";

      // Count trade partners
      const { data: buyerTrades } = await supabase
        .from("p2p_trades")
        .select("seller_id")
        .eq("buyer_id", userId)
        .eq("status", "completed");

      const { data: sellerTrades } = await supabase
        .from("p2p_trades")
        .select("buyer_id")
        .eq("seller_id", userId)
        .eq("status", "completed");

      const uniquePartners = new Set([
        ...(buyerTrades?.map(t => t.seller_id) || []),
        ...(sellerTrades?.map(t => t.buyer_id) || [])
      ]);

      // Calculate trade release stats
      const { data: completedTrades } = await supabase
        .from("p2p_trades")
        .select("created_at, completed_at")
        .eq("seller_id", userId)
        .eq("status", "completed")
        .not("completed_at", "is", null);

      let avgReleaseTime = "0m 0s";
      let avgPaymentTime = "0m 0s";
      if (completedTrades && completedTrades.length > 0) {
        const totalTime = completedTrades.reduce((sum, trade) => {
          const start = new Date(trade.created_at).getTime();
          const end = new Date(trade.completed_at).getTime();
          return sum + (end - start);
        }, 0);
        const avgMs = totalTime / completedTrades.length;
        const minutes = Math.floor(avgMs / 60000);
        const seconds = Math.floor((avgMs % 60000) / 1000);
        avgReleaseTime = `${minutes}m ${seconds}s`;
        avgPaymentTime = `${minutes}m ${seconds}s`;
      }

      setUserData({
        profile,
        positiveCount: positiveCount || 0,
        negativeCount: negativeCount || 0,
        successRate,
        totalTrades,
        tradePartners: uniquePartners.size,
        positiveFeedback: positiveFeedback || [],
        negativeFeedback: negativeFeedback || [],
        avgReleaseTime,
        avgPaymentTime,
        tradesReleased: completedTrades?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { profile, positiveCount, negativeCount, successRate, totalTrades, tradePartners, positiveFeedback, negativeFeedback, avgReleaseTime, avgPaymentTime, tradesReleased } = userData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start gap-3">
            <Avatar className="w-14 h-14 border-2 border-primary">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {profile?.username?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {profile?.country && (
                  <span className="text-lg">🇳🇬</span>
                )}
                <h3 className="font-semibold text-base truncate">{profile?.username || "Unknown"}</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {successRate}%
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {totalTrades} Trades
                </Badge>
                {profile?.merchant_status === "verified_merchant" && (
                  <Badge className="bg-blue-500 text-white text-xs flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
                {profile?.merchant_status === "block_merchant" && (
                  <Badge className="bg-purple-600 text-white text-xs flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Block
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Active now</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Positive and Negative Feedbacks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Positive feedbacks</h4>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">{positiveCount}</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Negative feedbacks</h4>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-5 h-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">{negativeCount}</span>
                </div>
              </div>
            </div>

            {/* Country, IP Location, Trusted by, Blocked by */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Country</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇳🇬</span>
                  <span className="font-medium">Nigeria</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">IP location</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇳🇬</span>
                  <span className="font-medium">Nigeria</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Trusted by</div>
                <div className="font-semibold">{positiveCount} users</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Blocked by</div>
                <div className="font-semibold">3 users</div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="trading" className="w-full">
            <TabsList className="w-full grid grid-cols-2 sticky top-0 bg-background z-10">
              <TabsTrigger value="trading">Trading info</TabsTrigger>
              <TabsTrigger value="feedback">Recent feedbacks</TabsTrigger>
            </TabsList>

            <TabsContent value="trading" className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Trade partners</div>
                  <div className="text-2xl font-bold">{tradePartners}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Trades released</div>
                  <div className="text-2xl font-bold">{tradesReleased}</div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Trade success</span>
                  <span className="font-semibold">{successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg. time to payment</span>
                  <span className="font-semibold">{avgPaymentTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg. time to release</span>
                  <span className="font-semibold">{avgReleaseTime}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="p-6 space-y-4">
              {positiveFeedback.length === 0 && negativeFeedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No feedback yet
                </div>
              ) : (
                <>
                  {positiveFeedback.slice(0, 5).map((feedback: any, index: number) => (
                    <div key={`positive-${index}`} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <ThumbsUp className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm mb-1">{feedback.comment || "No comment provided"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {negativeFeedback.slice(0, 5).map((feedback: any, index: number) => (
                    <div key={`negative-${index}`} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <ThumbsDown className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm mb-1">{feedback.comment || "No comment provided"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
