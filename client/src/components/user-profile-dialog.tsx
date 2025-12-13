import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbsUp, ThumbsDown, Shield, Award, Circle } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { formatLastSeen } from "@/lib/presence";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getCountryFlag } from "@/lib/localization";

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  prefetch?: boolean;
}

// Cache for user profile data
const profileCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

export function UserProfileDialog({ isOpen, onClose, userId, prefetch = false }: UserProfileDialogProps) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPresence, setUserPresence] = useState<{ isOnline: boolean; lastSeen: string | null }>({ isOnline: false, lastSeen: null });
  const supabase = createClient();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const fetchPresence = async () => {
    if (userId) {
      const { presenceTracker } = await import('@/lib/presence');
      const presence = await presenceTracker.getUserPresence(userId);
      setUserPresence(presence);

      const channel = presenceTracker.subscribeToUserPresence(userId, (updatedPresence) => {
        setUserPresence(updatedPresence);
      });

      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Run all queries in parallel for faster loading
      const [
        profileResult,
        positiveFeedbackResult,
        negativeFeedbackResult,
        buyerTradesResult,
        sellerTradesResult,
        completedTradesResult
      ] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("id", userId).single(),
        supabase.from("trade_feedback").select("*", { count: "exact" }).eq("to_user_id", userId).eq("rating", "positive"),
        supabase.from("trade_feedback").select("*", { count: "exact" }).eq("to_user_id", userId).eq("rating", "negative"),
        supabase.from("p2p_trades").select("seller_id").eq("buyer_id", userId).eq("status", "completed"),
        supabase.from("p2p_trades").select("buyer_id").eq("seller_id", userId).eq("status", "completed"),
        supabase.from("p2p_trades").select("created_at, completed_at").eq("seller_id", userId).eq("status", "completed").not("completed_at", "is", null)
      ]);

      const profile = profileResult.data;
      const positiveFeedback = positiveFeedbackResult.data;
      const positiveCount = positiveFeedbackResult.count;
      const negativeFeedback = negativeFeedbackResult.data;
      const negativeCount = negativeFeedbackResult.count;
      const buyerTrades = buyerTradesResult.data;
      const sellerTrades = sellerTradesResult.data;
      const completedTrades = completedTradesResult.data;

      // Calculate stats
      const totalTrades = (positiveCount || 0) + (negativeCount || 0);
      const successRate = totalTrades > 0 ? ((positiveCount || 0) / totalTrades * 100).toFixed(2) : "0.00";

      const uniquePartners = new Set([
        ...(buyerTrades?.map(t => t.seller_id) || []),
        ...(sellerTrades?.map(t => t.buyer_id) || [])
      ]);

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

      const userData = {
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
      };

      setUserData(userData);

      // Store in cache
      profileCache.set(userId, {
        data: userData,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((isOpen || prefetch) && userId) {
      // Check cache first
      const cached = profileCache.get(userId);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        // Use cached data
        setUserData(cached.data);
        setLoading(false);
      } else {
        // Fetch fresh data
        fetchUserData();
      }
      fetchPresence();
    }
  }, [isOpen, prefetch, userId]);

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
      <DialogContent className={cn(
        "max-w-sm p-0 overflow-hidden flex flex-col",
        isMobile 
          ? "fixed bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-h-[90vh] rounded-t-2xl rounded-b-none data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom" 
          : "max-h-[85vh]"
      )}>
        <DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
          <div className="flex items-start gap-2">
            <Avatar className="w-12 h-12 border-2 border-primary flex-shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-base">
                {profile?.username?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {profile?.country && (
                  <span className="text-base">{getCountryFlag(profile.country)}</span>
                )}
                <h3 className="font-semibold text-sm truncate">{profile?.username || "Unknown"}</h3>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1 text-xs px-1.5 py-0">
                  <ThumbsUp className="w-2.5 h-2.5" />
                  {successRate}%
                </Badge>
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {totalTrades} Trades
                </Badge>
                {profile?.merchant_status === "verified_merchant" && (
                  <Badge className="bg-blue-500 text-white text-xs flex items-center gap-1 px-1.5 py-0">
                    <Shield className="w-2.5 h-2.5" />
                    Verified
                  </Badge>
                )}
                {profile?.merchant_status === "block_merchant" && (
                  <Badge className="bg-purple-600 text-white text-xs flex items-center gap-1 px-1.5 py-0">
                    <Award className="w-2.5 h-2.5" />
                    Block
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {userPresence.isOnline ? (
                  <>
                    <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500" />
                    <span className="text-xs text-green-500">Active now</span>
                  </>
                ) : (
                  <>
                    <Circle className="h-1.5 w-1.5 fill-gray-500 text-gray-500" />
                    <span className="text-xs text-gray-500">{formatLastSeen(userPresence.lastSeen)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Positive and Negative Feedbacks */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-medium mb-1.5 text-muted-foreground">Positive feedbacks</h4>
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span className="text-xl font-bold text-green-600">{positiveCount}</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium mb-1.5 text-muted-foreground">Negative feedbacks</h4>
                <div className="flex items-center gap-1.5">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                  <span className="text-xl font-bold text-red-600">{negativeCount}</span>
                </div>
              </div>
            </div>

            {/* Country, IP Location, Trusted by, Blocked by */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Country</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{getCountryFlag(profile?.country)}</span>
                  <span className="font-medium text-sm">{profile?.country || 'Unknown'}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">IP location</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{getCountryFlag(profile?.country)}</span>
                  <span className="font-medium text-sm">{profile?.country || 'Unknown'}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Trusted by</div>
                <div className="font-semibold text-sm">{positiveCount} users</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Blocked by</div>
                <div className="font-semibold text-sm">3 users</div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="trading" className="w-full">
            <TabsList className="w-full grid grid-cols-2 sticky top-0 bg-background z-10 h-auto p-2 gap-2">
              <TabsTrigger 
                value="trading" 
                className="text-xs font-semibold py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted"
              >
                Trading info
              </TabsTrigger>
              <TabsTrigger 
                value="feedback" 
                className="text-xs font-semibold py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted"
              >
                Recent feedbacks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trading" className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Trade partners</div>
                  <div className="text-xl font-bold">{tradePartners}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Trades released</div>
                  <div className="text-xl font-bold">{tradesReleased}</div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Trade success</span>
                  <span className="font-semibold text-sm">{successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Avg. time to payment</span>
                  <span className="font-semibold text-sm">{avgPaymentTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Avg. time to release</span>
                  <span className="font-semibold text-sm">{avgReleaseTime}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="p-4 space-y-3">
              {positiveFeedback.length === 0 && negativeFeedback.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No feedback yet
                </div>
              ) : (
                <>
                  {positiveFeedback.slice(0, 5).map((feedback: any, index: number) => (
                    <div key={`positive-${index}`} className="border rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <ThumbsUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs mb-0.5">{feedback.comment || "No comment provided"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {negativeFeedback.slice(0, 5).map((feedback: any, index: number) => (
                    <div key={`negative-${index}`} className="border rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <ThumbsDown className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs mb-0.5">{feedback.comment || "No comment provided"}</p>
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