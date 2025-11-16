import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PexlyFooter } from "@/components/pexly-footer";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Award,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Clock,
  DollarSign,
  Lock
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { 
  MERCHANT_LEVELS, 
  canApplyForMerchant, 
  getMerchantRequirements 
} from "@shared/merchant-levels";
import { useLocation } from "wouter";

export default function MerchantApplicationPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState<"general" | "verified" | "block">("verified");
  const [verifiedDepositAmount, setVerifiedDepositAmount] = useState("200");
  const [blockDepositAmount, setBlockDepositAmount] = useState("500");

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: balance } = useQuery({
    queryKey: ["pexlyBalance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("pexly_balances")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const applyForMerchant = useMutation({
    mutationFn: async ({ merchantType, depositAmount }: { merchantType: "verified_merchant" | "block_merchant"; depositAmount: number }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const availableBalance = Number(balance?.balance || 0) - Number(balance?.locked_balance || 0);
      if (availableBalance < depositAmount) {
        throw new Error(`Insufficient balance. You need $${depositAmount} available balance.`);
      }

      const { error: lockError } = await supabase
        .from("pexly_balances")
        .update({
          locked_balance: Number(balance?.locked_balance || 0) + depositAmount,
        })
        .eq("user_id", user.id);

      if (lockError) throw lockError;

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          merchant_status: "pending",
          merchant_deposit_amount: depositAmount,
          merchant_applied_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        await supabase
          .from("pexly_balances")
          .update({
            locked_balance: Number(balance?.locked_balance || 0),
          })
          .eq("user_id", user.id);
        throw updateError;
      }

      return merchantType;
    },
    onSuccess: (merchantType) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["pexlyBalance", user?.id] });
      
      const tierName = merchantType === "block_merchant" ? "Block Merchant" : "Verified Merchant";
      toast({
        title: "Application Submitted!",
        description: `Your ${tierName} application is now pending admin review. Your deposit has been locked.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const verificationLevel = Number(userProfile?.verification_level) || 0;
  const totalTrades = Number(userProfile?.total_trades) || 0;
  const merchantStatus = userProfile?.merchant_status || "none";
  const depositAmount = Number(userProfile?.merchant_deposit_amount) || 0;
  const availableBalance = Number(balance?.balance || 0) - Number(balance?.locked_balance || 0);

  const eligibility = canApplyForMerchant(verificationLevel, totalTrades);

  const completionRate = Number(userProfile?.completion_rate) || 0;
  const positiveRating = Number(userProfile?.positive_rating) || 0; 
  const completedOrders = Number(userProfile?.completed_orders) || 0;
  const coinReleaseTime = Number(userProfile?.avg_coin_release_time) || 999; 
  const paymentTime = Number(userProfile?.avg_payment_time) || 999;
  const last30DaysOrders = Number(userProfile?.last_30_days_orders) || 0;

  const verifiedRequirements = [
    { 
      label: "Complete Level 2 verification (ID + liveness check)", 
      met: verificationLevel >= 2,
      subtitle: verificationLevel >= 2 ? "Verified ✓" : `Current: Level ${verificationLevel}`,
      action: verificationLevel < 2 ? "Complete Verification" : undefined,
      link: "/account-settings"
    },
    { 
      label: "Complete at least 5 trades", 
      met: completedOrders >= 5,
      subtitle: `Current: ${completedOrders}/5 trades`,
      action: completedOrders < 5 ? "Start Trading" : undefined,
      link: "/p2p"
    },
    { 
      label: "Maintain completion rate of at least 95%", 
      met: completionRate >= 95,
      subtitle: `Current: ${completionRate.toFixed(1)}%`,
    },
    { 
      label: "Coin release time", 
      met: coinReleaseTime < 30,
      subtitle: coinReleaseTime < 999 ? `Current: ${coinReleaseTime} min` : "No data yet",
    },
    { 
      label: "Payment time", 
      met: paymentTime < 30,
      subtitle: paymentTime < 999 ? `Current: ${paymentTime} min` : "No data yet",
    },
  ];

  if (merchantStatus === "verified_merchant" || merchantStatus === "block_merchant") {
    const currentLevel = merchantStatus === "block_merchant" 
      ? MERCHANT_LEVELS.BLOCK_MERCHANT 
      : MERCHANT_LEVELS.VERIFIED_MERCHANT;

    return (
      <>
        <div className="container max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Merchant Status</h1>
            <p className="text-muted-foreground">You are currently a {currentLevel.name}</p>
          </div>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                {merchantStatus === "block_merchant" ? (
                  <Award className="h-8 w-8 text-yellow-500" />
                ) : (
                  <Shield className="h-8 w-8 text-green-500" />
                )}
                <div>
                  <CardTitle>{currentLevel.name}</CardTitle>
                  <CardDescription>Active since {new Date(userProfile?.merchant_approved_at).toLocaleDateString()}</CardDescription>
                </div>
                <Badge variant="default" className="ml-auto bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Your Benefits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentLevel.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Security Deposit</p>
                    <p className="text-2xl font-bold">${depositAmount}</p>
                  </div>
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <Alert className="mt-4 bg-blue-500/10 border-blue-500/20">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-500">
                    Your deposit is locked and will be refunded if you choose to downgrade your merchant status.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="pt-4 border-t border-border/50 space-y-4">
                {merchantStatus === "verified_merchant" && (
                  <div>
                    <h4 className="font-semibold mb-2">Upgrade to Block Merchant</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get exclusive features, zero fees, and top placement for an additional $300 deposit.
                    </p>
                    <Button onClick={() => setLocation("/merchant-upgrade")} variant="outline" className="w-full">
                      Learn More About Block Merchant
                    </Button>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold mb-2">Withdraw Your Deposit</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    No longer need merchant status? Downgrade and unlock your ${depositAmount} deposit.
                  </p>
                  <Button onClick={() => setLocation("/merchant-downgrade")} variant="outline" className="w-full">
                    Downgrade & Withdraw Deposit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <PexlyFooter />
      </>
    );
  }

  if (merchantStatus === "pending") {
    return (
      <>
        <div className="container max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Merchant Application</h1>
            <p className="text-muted-foreground">Your application is under review</p>
          </div>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="animate-pulse">
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <CardTitle>Application Pending Review</CardTitle>
                  <CardDescription>Our team is reviewing your merchant application</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto">Pending</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-500">
                  Your ${depositAmount} security deposit has been locked. It will be refunded if your application is rejected.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Submitted:</span>
                  <span>{new Date(userProfile?.merchant_applied_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Deposit Amount:</span>
                  <span className="font-semibold">${depositAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge variant="secondary">Under Review</Badge>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground text-center">
                  Applications are typically reviewed within 24-48 hours. You'll be notified via email once a decision is made.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <PexlyFooter />
      </>
    );
  }

  return (
    <>
      <div className="container max-w-4xl mx-auto p-6 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Advertiser</h1>
        </div>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-card/80 to-card/50 border-border/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Verified Advertisers</CardTitle>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Exclusive certified advertiser badge.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Each currency allows up to 4 buy/sell orders.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Single order limit: 50000 USDT (equivalent).</span>
                </div>
              </div>
              <button 
                className="text-sm text-yellow-600 hover:text-yellow-500 flex items-center gap-1 transition-colors"
                onClick={() => setSelectedTab("verified")}
              >
                Check Application Requirements. <ChevronRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card/80 to-card/50 border-border/50 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Block Advertiser</CardTitle>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Advanced advertiser badges.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Exclusive background in the personal center.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Block trades do not count towards the order limit (additional 4 buy/sell orders available).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Single order limit: 200000 USDT (equivalent).</span>
                </div>
              </div>
              <button 
                className="text-sm text-yellow-600 hover:text-yellow-500 flex items-center gap-1 transition-colors"
                onClick={() => setSelectedTab("block")}
              >
                Check Application Requirements. <ChevronRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Comparison of Privileges</CardTitle>
              <CardDescription className="text-xs">
                By applying for different levels of advertisers, you can gain a competitive edge in the market and attract more clients. Below is a comparison of relevant benefits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Privileges</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Restricted<br/>Advertiser<br/><span className="text-[10px] font-normal">(Level 0-1)</span></th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">General<br/>Advertiser<br/><span className="text-[10px] font-normal">(Level 2+)</span></th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground bg-yellow-500/5">Verified<br/>Advertisers<br/><span className="text-[10px] font-normal">(Level 2+)</span></th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Block<br/>Advertiser<br/><span className="text-[10px] font-normal">(Level 2+)</span></th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    <tr className="border-b border-border/30">
                      <td className="py-3 px-2 text-muted-foreground">Number of buy ads</td>
                      <td className="text-center py-3 px-2 text-red-500 font-semibold">0</td>
                      <td className="text-center py-3 px-2">1-3</td>
                      <td className="text-center py-3 px-2 bg-yellow-500/5 font-semibold">4</td>
                      <td className="text-center py-3 px-2 font-semibold">8</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-3 px-2 text-muted-foreground">Number of sell ads</td>
                      <td className="text-center py-3 px-2 text-red-500 font-semibold">0</td>
                      <td className="text-center py-3 px-2">1-3</td>
                      <td className="text-center py-3 px-2 bg-yellow-500/5 font-semibold">4</td>
                      <td className="text-center py-3 px-2 font-semibold">8</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-3 px-2 text-muted-foreground">Limit per ad</td>
                      <td className="text-center py-3 px-2 text-red-500 font-semibold">0</td>
                      <td className="text-center py-3 px-2">20,000</td>
                      <td className="text-center py-3 px-2 bg-yellow-500/5 font-semibold">50,000</td>
                      <td className="text-center py-3 px-2 font-semibold">200,000</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-3 px-2 text-muted-foreground">Identity badge</td>
                      <td className="text-center py-3 px-2">--</td>
                      <td className="text-center py-3 px-2">--</td>
                      <td className="text-center py-3 px-2 bg-yellow-500/5"><CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-3 px-2 text-muted-foreground">Ad ranking</td>
                      <td className="text-center py-3 px-2">--</td>
                      <td className="text-center py-3 px-2">--</td>
                      <td className="text-center py-3 px-2 bg-yellow-500/5 font-semibold">TOP 2</td>
                      <td className="text-center py-3 px-2 font-semibold">TOP 1</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-3 px-2 text-muted-foreground">Ad traffic exposure</td>
                      <td className="text-center py-3 px-2">--</td>
                      <td className="text-center py-3 px-2">--</td>
                      <td className="text-center py-3 px-2 bg-yellow-500/5">--</td>
                      <td className="text-center py-3 px-2"><CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-3 px-2 text-muted-foreground">Ad review visibility</td>
                      <td className="text-center py-3 px-2">--</td>
                      <td className="text-center py-3 px-2">--</td>
                      <td className="text-center py-3 px-2 bg-yellow-500/5">--</td>
                      <td className="text-center py-3 px-2"><CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-3 px-2 text-muted-foreground">Support for verified orders</td>
                      <td className="text-center py-3 px-2">--</td>
                      <td className="text-center py-3 px-2">--</td>
                      <td className="text-center py-3 px-2 bg-yellow-500/5">--</td>
                      <td className="text-center py-3 px-2"><CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-3 px-2 text-muted-foreground">P2P openAPI</td>
                      <td className="text-center py-3 px-2">--</td>
                      <td className="text-center py-3 px-2"><CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2 bg-yellow-500/5"><CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /></td>
                      <td className="text-center py-3 px-2"><CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 text-muted-foreground text-xs">Verification Required</td>
                      <td className="text-center py-3 px-2 text-red-500 font-semibold">Level 0-1</td>
                      <td className="text-center py-3 px-2 text-green-500 font-semibold">Level 2+</td>
                      <td className="text-center py-3 px-2 bg-yellow-500/5 text-green-500 font-semibold">Level 2+</td>
                      <td className="text-center py-3 px-2 text-green-500 font-semibold">Level 2+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-card/50 h-auto">
              <TabsTrigger value="general" className="whitespace-normal py-3">General Advertiser</TabsTrigger>
              <TabsTrigger value="verified" className="whitespace-normal py-3">Verified Advertisers</TabsTrigger>
              <TabsTrigger value="block" className="whitespace-normal py-3">Block Advertiser</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4">
              <div className="overflow-x-auto pb-4">
                <Card className="bg-card/50 border-border/50 min-w-[600px]">
                  <CardHeader>
                    <CardTitle className="text-lg">General Advertiser</CardTitle>
                    <CardDescription className="text-xs">
                      Complete verification to start trading and creating offers!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  <p className="text-sm font-medium">Requirements to become a General Advertiser:</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      {verificationLevel >= 2 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <span className="text-sm">Complete Level 2 verification (ID + liveness check)</span>
                        {verificationLevel < 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-0 mt-2 h-8 border-yellow-600 text-yellow-600 hover:bg-yellow-600/10"
                            onClick={() => setLocation("/account-settings")}
                          >
                            Complete Verification
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">No deposit required - start trading immediately</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Create 1-3 buy/sell orders per currency</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Order limit: 20,000 USDT</span>
                    </div>
                  </div>

                  {verificationLevel >= 2 ? (
                    <Alert className="bg-green-500/10 border-green-500/20">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-500">
                        You're eligible! You can now create offers and start trading.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-blue-500/10 border-blue-500/20">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <AlertDescription className="text-blue-500">
                        Complete Level 2 verification to unlock general advertiser features.
                      </AlertDescription>
                    </Alert>
                  )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="verified" className="mt-4 space-y-4">
              <div className="overflow-x-auto pb-4">
                <Card className="bg-card/50 border-border/50 min-w-[600px]">
                  <CardHeader>
                    <CardTitle className="text-lg">Become A Verified Advertiser</CardTitle>
                  <CardDescription className="text-xs">
                    Apply to become a verified advertiser to enjoy privileges and special benefits!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-medium">You must meet the following requirements:</p>
                  
                  <div className="space-y-3">
                    {verifiedRequirements.map((req, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-start gap-2">
                          {req.met ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span className="text-sm flex-1">{req.label}</span>
                        </div>
                        {req.subtitle && (
                          <p className="text-xs text-muted-foreground ml-6">
                            {req.subtitle}
                          </p>
                        )}
                        {req.action && !req.met && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-6 mt-1 h-8 border-yellow-600 text-yellow-600 hover:bg-yellow-600/10"
                            onClick={() => req.link && setLocation(req.link)}
                          >
                            {req.action}
                          </Button>
                        )}
                      </div>
                    ))}

                    <div className="space-y-1 pt-2">
                      <div className="flex items-start gap-2">
                        {availableBalance >= parseFloat(verifiedDepositAmount) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-sm flex-1">Deposit Assets</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        Please note that the Available Balance in your Funding Account must be ≥ the deposit amount. If approved, this amount will be frozen to secure transactions.
                      </p>
                      <div className="ml-6 mt-2 space-y-2">
                        <Label htmlFor="verified-deposit" className="text-xs">Deposit Amount (USDT)</Label>
                        <Input
                          id="verified-deposit"
                          type="number"
                          min="200"
                          value={verifiedDepositAmount}
                          onChange={(e) => setVerifiedDepositAmount(e.target.value)}
                          className="max-w-xs"
                          placeholder="Minimum 200 USDT"
                        />
                        <p className="text-xs text-muted-foreground">
                          Available Balance: ${availableBalance.toFixed(2)} USDT
                        </p>
                      </div>
                      {availableBalance < parseFloat(verifiedDepositAmount) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-6 mt-2 h-8 border-yellow-600 text-yellow-600 hover:bg-yellow-600/10"
                          onClick={() => setLocation("/pexly-pay")}
                        >
                          Add Funds
                        </Button>
                      )}
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-6 bg-yellow-600 hover:bg-yellow-700 text-white"
                    disabled={
                      !verifiedRequirements.every(r => r.met) || 
                      availableBalance < parseFloat(verifiedDepositAmount) || 
                      parseFloat(verifiedDepositAmount) < 200 ||
                      merchantStatus === "pending"
                    }
                    onClick={() => applyForMerchant.mutate({ 
                      merchantType: "verified_merchant", 
                      depositAmount: parseFloat(verifiedDepositAmount) 
                    })}
                  >
                    {merchantStatus === "pending" ? "Application Pending" : "Apply Now"}
                  </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="block" className="mt-4 space-y-4">
              <div className="overflow-x-auto pb-4">
                <Card className="bg-card/50 border-border/50 min-w-[600px]">
                  <CardHeader>
                    <CardTitle className="text-lg">Become A Block Advertiser</CardTitle>
                  <CardDescription className="text-xs">
                    Apply to become a block advertiser to enjoy premium privileges and exclusive benefits!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-medium">You must meet the following requirements:</p>
                  
                  <div className="space-y-3">
                    {verifiedRequirements.map((req, idx) => {
                      const isMet = req.met;
                      
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-start gap-2">
                            {isMet ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            )}
                            <span className="text-sm flex-1">{req.label}</span>
                          </div>
                          {req.subtitle && (
                            <p className="text-xs text-muted-foreground ml-6">
                              {req.subtitle}
                            </p>
                          )}
                          {req.action && !isMet && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-6 mt-1 h-8 border-yellow-600 text-yellow-600 hover:bg-yellow-600/10"
                              onClick={() => req.link && setLocation(req.link)}
                            >
                              {req.action}
                            </Button>
                          )}
                        </div>
                      );
                    })}

                    <div className="space-y-1 pt-2">
                      <div className="flex items-start gap-2">
                        {availableBalance >= parseFloat(blockDepositAmount) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-sm flex-1">Deposit Assets</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        Please note that the Available Balance in your Funding Account must be ≥ the deposit amount. If approved, this amount will be frozen to secure transactions.
                      </p>
                      <div className="ml-6 mt-2 space-y-2">
                        <Label htmlFor="block-deposit" className="text-xs">Deposit Amount (USDT)</Label>
                        <Input
                          id="block-deposit"
                          type="number"
                          min="500"
                          value={blockDepositAmount}
                          onChange={(e) => setBlockDepositAmount(e.target.value)}
                          className="max-w-xs"
                          placeholder="Minimum 500 USDT"
                        />
                        <p className="text-xs text-muted-foreground">
                          Available Balance: ${availableBalance.toFixed(2)} USDT
                        </p>
                      </div>
                      {availableBalance < parseFloat(blockDepositAmount) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-6 mt-2 h-8 border-yellow-600 text-yellow-600 hover:bg-yellow-600/10"
                          onClick={() => setLocation("/pexly-pay")}
                        >
                          Add Funds
                        </Button>
                      )}
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-6 bg-yellow-600 hover:bg-yellow-700 text-white"
                    disabled={
                      !verifiedRequirements.every(r => r.met) || 
                      availableBalance < parseFloat(blockDepositAmount) || 
                      parseFloat(blockDepositAmount) < 500 ||
                      merchantStatus === "pending"
                    }
                    onClick={() => applyForMerchant.mutate({ 
                      merchantType: "block_merchant", 
                      depositAmount: parseFloat(blockDepositAmount) 
                    })}
                  >
                    {merchantStatus === "pending" ? "Application Pending" : "Apply Now"}
                  </Button>
                </CardContent>
              </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <PexlyFooter />
    </>
  );
}
