import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Shield, Info } from "lucide-react";

export function VerificationSection() {
  const { user } = useAuth();
  const supabase = createClient();
  const [, setLocation] = useLocation();
  const [verificationLevel, setVerificationLevel] = useState(0);
  const [loadingVerification, setLoadingVerification] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchVerificationLevel = async () => {
      setLoadingVerification(true);
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("verification_level")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        setVerificationLevel(data?.verification_level ? Number(data.verification_level) : 0);
      } catch (error) {
        console.error("Error fetching verification level:", error);
        setVerificationLevel(0);
      } finally {
        setLoadingVerification(false);
      }
    };
    fetchVerificationLevel();
  }, [user]);

  return (
    <div className="space-y-6">
      <Card className="mb-6 border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Account Verification</CardTitle>
            </div>
            <Badge
              variant={verificationLevel >= 2 ? "default" : "secondary"}
              className="text-xs"
            >
              Level {verificationLevel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingVerification ? (
            <p className="text-sm text-muted-foreground">Loading verification status...</p>
          ) : (
            <div className="space-y-3">
              {verificationLevel === 0 && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                    Limited Access - Level 0
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                    You can invite friends and earn rewards, but cannot trade yet. Complete age verification to start trading.
                  </p>
                </div>
              )}
              {verificationLevel === 1 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    Basic Trading - Level 1
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    Daily limit: $1,000 | Lifetime: $10,000 | Cannot create offers
                  </p>
                </div>
              )}
              {verificationLevel === 2 && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-1">
                    Unlimited Trading - Level 2
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                    No daily/lifetime limits | Per-trade: $100,000
                  </p>
                </div>
              )}
              {verificationLevel === 3 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    VIP Status - Level 3
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                    Maximum per-trade: $1,000,000 | Priority support
                  </p>
                </div>
              )}
              <Button
                onClick={() => setLocation("/verification")}
                className="w-full"
                variant={verificationLevel >= 3 ? "outline" : "default"}
              >
                {verificationLevel >= 3 ? "View Verification Details" : "Upgrade Verification Level"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm">
                Increase your verification level to unlock higher trading limits and additional features.
              </p>
              <Button
                variant="ghost"
                className="h-auto p-0 text-primary hover:text-primary/90"
                onClick={() => setLocation("/verification")}
              >
                View Verification Levels →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
