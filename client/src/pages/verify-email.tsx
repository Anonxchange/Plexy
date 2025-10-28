import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth-context";

export function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");
  const isDark = theme === "dark";

  // Remove the auto-redirect effect since we want users to login manually

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        console.log("=== EMAIL VERIFICATION DEBUG ===");
        console.log("Full URL:", window.location.href);
        console.log("Hash:", window.location.hash);
        console.log("Search:", window.location.search);
        
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");
        const refreshToken = hashParams.get("refresh_token");
        const errorCode = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        console.log("Hash params:", { 
          accessToken: accessToken ? accessToken.substring(0, 20) + "..." : null, 
          type, 
          refreshToken: !!refreshToken,
          error: errorCode,
          errorDescription 
        });

        // Check for errors in the URL
        if (errorCode) {
          setStatus("error");
          setMessage(`Verification failed: ${errorDescription || errorCode}`);
          toast({
            title: "Verification Error",
            description: errorDescription || "The verification link is invalid or has expired.",
            variant: "destructive",
          });
          return;
        }

        // Check if this is from an email confirmation link with access token
        if (accessToken && type === "signup") {
          // First, verify the email by setting the session temporarily
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          console.log("Session result:", { sessionData: !!sessionData?.user, error: sessionError });

          // Update the user profile to mark email as verified
          if (sessionData?.user) {
            const { error: updateError } = await supabase
              .from("user_profiles")
              .update({ email_verified: true })
              .eq("id", sessionData.user.id);

            if (updateError) {
              console.warn("Profile update error:", updateError);
            }
          }

          // IMMEDIATELY sign out to prevent auto-login
          await supabase.auth.signOut();
          
          // Clear ALL storage to ensure no session remnants
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear cookies
          document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
          
          setStatus("success");
          setMessage("Email verified successfully! Please sign in with your credentials.");
          
          toast({
            title: "Email Verified!",
            description: "Your email has been verified. You can now sign in.",
          });
          
          // Redirect after a short delay
          setTimeout(() => {
            window.location.href = "/signin";
          }, 2000);
          return;
        }

        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get("token");

        if (token) {
          const { data, error } = await supabase
            .from("email_verifications")
            .select("*")
            .eq("token", token)
            .single();

          if (error || !data) {
            setStatus("error");
            setMessage("Invalid or expired verification link");
            return;
          }

          const expiresAt = new Date(data.expires_at);
          if (expiresAt < new Date()) {
            setStatus("error");
            setMessage("Verification link has expired");
            return;
          }

          if (data.verified_at) {
            setStatus("success");
            setMessage("Email already verified! Redirecting...");
            setTimeout(() => setLocation("/signin"), 2000);
            return;
          }

          const { error: updateError } = await supabase
            .from("email_verifications")
            .update({ verified_at: new Date().toISOString() })
            .eq("token", token);

          if (updateError) {
            setStatus("error");
            setMessage("Failed to verify email");
            return;
          }

          await supabase
            .from("user_profiles")
            .update({ email_verified: true })
            .eq("id", data.user_id);

          setStatus("success");
          setMessage("Email verified successfully! Redirecting to login...");
          
          toast({
            title: "Success!",
            description: "Your email has been verified",
          });

          setTimeout(() => setLocation("/signin"), 3000);
          return;
        }

        setStatus("error");
        setMessage("Invalid verification link");
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className="max-w-md w-full px-6">
        <div className={`rounded-2xl p-8 text-center ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          {/* Status Icon */}
          <div className="flex justify-center mb-4">
            {status === "verifying" && (
              <Loader2 className={`h-16 w-16 animate-spin ${isDark ? 'text-lime-400' : 'text-lime-600'}`} />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>

          {/* Message */}
          <h1 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
            {status === "verifying" && "Verifying Email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </h1>
          
          <p className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {message}
          </p>

          {/* Action Button */}
          {status === "error" && (
            <div className="mt-6">
              <button
                onClick={() => setLocation("/signin")}
                className="w-full bg-lime-400 hover:bg-lime-500 text-black font-medium py-3 rounded-full transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
