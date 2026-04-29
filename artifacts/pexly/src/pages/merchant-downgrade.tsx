
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield, Award, DollarSign, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { MERCHANT_LEVELS } from "@shared/merchant-levels";

export default function MerchantDowngradePage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [confirming, setConfirming] = useState(false);

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

  const downgradeMerchant = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const depositAmount = Number(userProfile?.merchant_deposit_amount || 0);
      const currentLockedBalance = Number(balance?.locked_balance || 0);

      // Unlock the deposit from locked balance
      const { error: balanceError } = await supabase
        .from("pexly_balances")
        .update({
          locked_balance: Math.max(0, currentLockedBalance - depositAmount),
        })
        .eq("user_id", user.id);

      if (balanceError) throw balanceError;

      // Remove merchant status
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          merchant_status: "none",
          merchant_deposit_amount: 0,
          merchant_deposit_locked_at: null,
          merchant_approved_at: null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["pexlyBalance", user?.id] });
      
      toast({
        title: "Merchant Status Removed",
        description: "Your deposit has been unlocked and is now available for withdrawal.",
      });

      setLocation("/wallet");
    },
    onError: (error: Error) => {
      toast({
        title: "Downgrade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const merchantStatus = userProfile?.merchant_status || "none";
  const depositAmount = Number(userProfile?.merchant_deposit_amount || 0);

  if (merchantStatus === "none" || merchantStatus === "pending") {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Not a Merchant</CardTitle>
            <CardDescription>You don't have an active merchant status to downgrade</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/merchant-application")}>
              Apply for Merchant Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLevel = merchantStatus === "block_merchant" 
    ? MERCHANT_LEVELS.BLOCK_MERCHANT 
    : MERCHANT_LEVELS.VERIFIED_MERCHANT;

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Downgrade Merchant Status</h1>
        <p className="text-muted-foreground">Remove your merchant status and unlock your deposit</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            {merchantStatus === "block_merchant" ? (
              <Award className="h-8 w-8 text-purple-500" />
            ) : (
              <Shield className="h-8 w-8 text-blue-500" />
            )}
            <div>
              <CardTitle>Current Status: {currentLevel.name}</CardTitle>
              <CardDescription>Active since {new Date(userProfile?.merchant_approved_at).toLocaleDateString()}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Your Current Benefits</h4>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Locked Deposit</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <DollarSign className="h-6 w-6" />
                  {depositAmount}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Locked Balance</p>
                <p className="text-lg font-semibold">
                  ${Number(balance?.locked_balance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Downgrade to Regular User</CardTitle>
          <CardDescription>What happens when you downgrade</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>You will lose the following benefits:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Enhanced offer limits (back to 5 offers max)</li>
                <li>Reduced trading fees (back to 1.0%)</li>
                <li>Merchant badge and priority placement</li>
                <li>All other merchant-exclusive features</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Your ${depositAmount} deposit will be:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Immediately unlocked from locked balance</li>
                <li>Available for withdrawal or trading</li>
                <li>Moved to your available Pexly Pay balance</li>
              </ul>
            </AlertDescription>
          </Alert>

          {!confirming ? (
            <Button 
              onClick={() => setConfirming(true)}
              variant="destructive"
              className="w-full"
            >
              I Want to Downgrade
            </Button>
          ) : (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Are you sure? This action will remove all merchant benefits immediately.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => downgradeMerchant.mutate()}
                  disabled={downgradeMerchant.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  {downgradeMerchant.isPending ? "Processing..." : "Yes, Downgrade Now"}
                </Button>
                <Button
                  onClick={() => setConfirming(false)}
                  variant="outline"
                  disabled={downgradeMerchant.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
