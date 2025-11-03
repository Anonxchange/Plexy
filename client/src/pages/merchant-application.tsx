import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Star, 
  Lock,
  TrendingUp,
  Zap,
  Award,
  DollarSign,
  AlertCircle
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
  const [selectedTier, setSelectedTier] = useState<"verified_merchant" | "block_merchant" | null>(null);

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
    mutationFn: async (merchantType: "verified_merchant" | "block_merchant") => {
      if (!user?.id) throw new Error("Not authenticated");

      const requirements = getMerchantRequirements(merchantType);
      const depositAmount = requirements.depositAmount;

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

  const renderMerchantCard = (
    tier: "verified_merchant" | "block_merchant",
    icon: React.ReactNode,
    color: string
  ) => {
    const config = MERCHANT_LEVELS[tier === "verified_merchant" ? "VERIFIED_MERCHANT" : "BLOCK_MERCHANT"];
    const requirements = getMerchantRequirements(tier);
    const canAfford = availableBalance >= config.depositRequired;

    return (
      <Card className={`relative overflow-hidden ${selectedTier === tier ? `ring-2 ring-${color}-500` : ""}`}>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${color}-500/10 to-transparent rounded-bl-full`} />
        
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon}
              <div>
                <CardTitle className="text-xl">{config.name}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">${config.depositRequired}</span>
            <span className="text-sm text-muted-foreground">security deposit</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Benefits
            </h4>
            <ul className="space-y-1 text-sm">
              {config.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span>Available Balance:</span>
              <span className={canAfford ? "text-green-500" : "text-red-500"}>
                ${availableBalance.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Required Deposit:</span>
              <span className="font-semibold">${config.depositRequired}</span>
            </div>
          </div>

          <Button
            onClick={() => {
              if (eligibility.allowed && canAfford) {
                setSelectedTier(tier);
              }
            }}
            disabled={!eligibility.allowed || !canAfford || merchantStatus === "pending"}
            className="w-full"
            variant={selectedTier === tier ? "default" : "outline"}
          >
            {merchantStatus === "pending" 
              ? "Application Pending" 
              : selectedTier === tier 
                ? "Selected" 
                : !canAfford 
                  ? "Insufficient Balance" 
                  : "Select This Plan"}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (merchantStatus === "verified_merchant" || merchantStatus === "block_merchant") {
    const currentLevel = merchantStatus === "block_merchant" 
      ? MERCHANT_LEVELS.BLOCK_MERCHANT 
      : MERCHANT_LEVELS.VERIFIED_MERCHANT;

    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Merchant Status</h1>
          <p className="text-muted-foreground">You are currently a {currentLevel.name}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {merchantStatus === "block_merchant" ? (
                <Award className="h-8 w-8 text-purple-500" />
              ) : (
                <Shield className="h-8 w-8 text-blue-500" />
              )}
              <div>
                <CardTitle>{currentLevel.name}</CardTitle>
                <CardDescription>Active since {new Date(userProfile?.merchant_approved_at).toLocaleDateString()}</CardDescription>
              </div>
              <Badge variant="default" className="ml-auto">Active</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Your Benefits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentLevel.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Security Deposit</p>
                  <p className="text-2xl font-bold">${depositAmount}</p>
                </div>
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your deposit is locked and will be refunded if you choose to downgrade your merchant status.
                </AlertDescription>
              </Alert>
            </div>

            {merchantStatus === "verified_merchant" && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Upgrade to Block Merchant</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Get exclusive features, zero fees, and top placement for an additional $300 deposit.
                </p>
                <Button onClick={() => setLocation("/merchant-upgrade")} variant="outline">
                  Learn More About Block Merchant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (merchantStatus === "pending") {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Merchant Application</h1>
          <p className="text-muted-foreground">Your application is under review</p>
        </div>

        <Card>
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
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
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
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Become a Merchant</h1>
        <p className="text-muted-foreground">Unlock enhanced benefits: more offers, lower fees, and top placement</p>
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Regular users can already create up to 5 offers.</strong> Merchant status gives you enhanced benefits like 50+ offers, reduced/zero fees, and priority placement.
          </AlertDescription>
        </Alert>
      </div>

      {!eligibility.allowed && (
        <Alert className="mb-6" variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{eligibility.reason}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {renderMerchantCard(
          "verified_merchant",
          <Shield className="h-8 w-8 text-blue-500" />,
          "blue"
        )}
        
        {renderMerchantCard(
          "block_merchant",
          <Award className="h-8 w-8 text-purple-500" />,
          "purple"
        )}
      </div>

      {selectedTier && eligibility.allowed && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Application</CardTitle>
            <CardDescription>
              Review the details before submitting your merchant application
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Merchant Tier:</span>
                <span className="font-semibold">
                  {selectedTier === "block_merchant" ? "Block Merchant" : "Verified Merchant"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Security Deposit:</span>
                <span className="font-semibold">
                  ${getMerchantRequirements(selectedTier).depositAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Available Balance:</span>
                <span className={availableBalance >= getMerchantRequirements(selectedTier).depositAmount ? "text-green-500" : "text-red-500"}>
                  ${availableBalance.toFixed(2)}
                </span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The security deposit will be locked in your account and can be refunded if you downgrade your merchant status.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => applyForMerchant.mutate(selectedTier)}
                disabled={applyForMerchant.isPending}
                className="flex-1"
              >
                {applyForMerchant.isPending ? "Submitting..." : "Submit Application"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedTier(null)}
                disabled={applyForMerchant.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
