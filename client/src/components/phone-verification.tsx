import { useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PhoneVerificationProps {
  onVerified: (phoneNumber: string) => void;
  onSkip?: () => void;
}

export function PhoneVerification({ onVerified, onSkip }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        firebaseAuth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            console.log("Recaptcha verified");
          },
        }
      );
    }
  };

  const sendVerificationCode = async () => {
    try {
      setLoading(true);
      setupRecaptcha();
      
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(firebaseAuth, phoneNumber, appVerifier);
      
      setConfirmationResult(result);
      toast({
        title: "Code sent!",
        description: `Verification code sent to ${phoneNumber}`,
      });
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult) return;

    try {
      setLoading(true);
      await confirmationResult.confirm(verificationCode);
      
      toast({
        title: "Success!",
        description: "Phone number verified successfully",
      });
      
      onVerified(phoneNumber);
    } catch (error: any) {
      console.error("Error verifying code:", error);
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div id="recaptcha-container"></div>
      
      {!confirmationResult ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +1 for US, +234 for Nigeria)
            </p>
          </div>
          
          <Button
            onClick={sendVerificationCode}
            disabled={!phoneNumber || loading}
            className="w-full"
          >
            {loading ? "Sending..." : "Send Verification Code"}
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={loading}
              maxLength={6}
            />
          </div>
          
          <Button
            onClick={verifyCode}
            disabled={!verificationCode || loading}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </Button>
        </>
      )}
      
      {onSkip && (
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full"
          disabled={loading}
        >
          Skip for now
        </Button>
      )}
    </div>
  );
}
