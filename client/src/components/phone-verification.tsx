import { useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneVerificationProps {
  onVerified: (phoneNumber: string) => void;
  onSkip?: () => void;
  initialPhone?: string;
  initialCountryCode?: string;
}

export function PhoneVerification({ onVerified, onSkip, initialPhone = "", initialCountryCode = "+234" }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
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
    if (!phoneNumber || phoneNumber.length < 7) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setupRecaptcha();
      
      const fullPhoneNumber = countryCode + phoneNumber;
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(firebaseAuth, fullPhoneNumber, appVerifier);
      
      setConfirmationResult(result);
      toast({
        title: "Code sent!",
        description: `Verification code sent to ${fullPhoneNumber}`,
      });
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
      
      // Reset recaptcha on error
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult) return;

    try {
      setLoading(true);
      await confirmationResult.confirm(verificationCode);
      
      const fullPhoneNumber = countryCode + phoneNumber;
      toast({
        title: "Success!",
        description: "Phone number verified successfully",
      });
      
      onVerified(fullPhoneNumber);
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
          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              We'll send a verification code to your phone number via SMS.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Country Code</Label>
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-full h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+234">
                  <div className="flex items-center gap-2">
                    <span>🇳🇬</span>
                    <span>Nigeria (+234)</span>
                  </div>
                </SelectItem>
                <SelectItem value="+1">
                  <div className="flex items-center gap-2">
                    <span>🇺🇸</span>
                    <span>United States (+1)</span>
                  </div>
                </SelectItem>
                <SelectItem value="+44">
                  <div className="flex items-center gap-2">
                    <span>🇬🇧</span>
                    <span>United Kingdom (+44)</span>
                  </div>
                </SelectItem>
                <SelectItem value="+91">
                  <div className="flex items-center gap-2">
                    <span>🇮🇳</span>
                    <span>India (+91)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 py-2 border rounded-md bg-muted h-12">
                <span className="text-sm font-medium">{countryCode}</span>
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                className="flex-1 h-12"
              />
            </div>
          </div>
          
          <Button
            onClick={sendVerificationCode}
            disabled={!phoneNumber || loading}
            className="w-full h-12"
          >
            {loading ? "Sending code..." : "Send Verification Code"}
          </Button>
        </>
      ) : (
        <>
          <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg mb-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              Verification code sent to <strong>{countryCode}{phoneNumber}</strong>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Enter Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={loading}
              maxLength={6}
              className="h-12 text-center text-2xl tracking-widest"
            />
            <p className="text-xs text-muted-foreground">
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={() => {
                  setConfirmationResult(null);
                  setVerificationCode("");
                }}
                className="text-primary hover:underline"
                disabled={loading}
              >
                Resend
              </button>
            </p>
          </div>
          
          <Button
            onClick={verifyCode}
            disabled={!verificationCode || verificationCode.length !== 6 || loading}
            className="w-full h-12"
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
