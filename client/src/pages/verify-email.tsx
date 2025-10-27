import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const supabase = createClient();
  const { theme } = useTheme();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");
  const isDark = theme === "dark";

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("error");
          setMessage("Invalid verification link");
          return;
        }

        // Verify token with Supabase
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

        // Check if token is expired
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
          setStatus("error");
          setMessage("Verification link has expired");
          return;
        }

        // Check if already verified
        if (data.verified_at) {
          setStatus("success");
          setMessage("Email already verified! Redirecting...");
          setTimeout(() => setLocation("/signin"), 2000);
          return;
        }

        // Mark as verified
        const { error: updateError } = await supabase
          .from("email_verifications")
          .update({ verified_at: new Date().toISOString() })
          .eq("token", token);

        if (updateError) {
          setStatus("error");
          setMessage("Failed to verify email");
          return;
        }

        // Update user's email_verified status in user_profiles if needed
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
