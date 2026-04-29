import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";

// ─── Custom SVG Icon Components ──────────────────────────────────────────────
function IcoShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.5L4 6.25V11.5C4 16.15 7.55 20.5 12 21.75C16.45 20.5 20 16.15 20 11.5V6.25L12 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.25 12L11.25 14L15 9.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IcoInfo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="8" r="1.1" fill="currentColor"/>
    </svg>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

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
              <IcoShield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Seller Verification</CardTitle>
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
                    Buyer — Level 0
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                    You can browse and purchase any listing without KYC. Complete Level 2 to unlock seller access and post listings.
                  </p>
                </div>
              )}
              {verificationLevel === 1 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    Verified Buyer — Level 1
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    You can browse, purchase, and leave verified reviews. Complete Level 2 to start posting listings as a seller.
                  </p>
                </div>
              )}
              {verificationLevel === 2 && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-1">
                    Verified Seller — Level 2
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                    Post up to 10 active listings | Accept crypto payments | Verified Seller badge
                  </p>
                </div>
              )}
              {verificationLevel === 3 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    Pro Seller — Level 3
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                    Unlimited listings | Priority placement in search | Pro Seller badge | Priority support
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
            <IcoInfo className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm">
                Increase your verification level to unlock seller access and post listings in the shop.
              </p>
              <Button
                variant="ghost"
                className="h-auto p-0 text-primary hover:text-primary/90"
                onClick={() => setLocation("/verification")}
              >
                View Seller Verification Levels →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
