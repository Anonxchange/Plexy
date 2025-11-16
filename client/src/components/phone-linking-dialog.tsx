import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CountryCodeSelector } from "./country-code-selector";

interface PhoneLinkingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  countryCode: string;
  userId: string;
  onSuccess: () => void;
}

export function PhoneLinkingDialog({
  open,
  onOpenChange,
  phoneNumber: initialPhoneNumber,
  countryCode: initialCountryCode,
  userId,
  onSuccess,
}: PhoneLinkingDialogProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const fullPhoneNumber = countryCode + phoneNumber.trim();

      // Check if phone number is already linked to another account
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('phone_number', fullPhoneNumber)
        .neq('id', userId)
        .single();

      if (existingUser && !checkError) {
        toast({
          title: "Phone Number Taken",
          description: "This phone number is already linked to another account.",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      // Send OTP to phone number
      const { error } = await supabase.auth.updateUser({
        phone: fullPhoneNumber,
      });

      if (error) {
        console.error("Error sending OTP:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to send verification code. Please check the phone number and try again.",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      toast({
        title: "Verification Code Sent",
        description: `A 6-digit code has been sent to ${fullPhoneNumber}`,
      });

      setCodeSent(true);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    try {
      const fullPhoneNumber = countryCode + phoneNumber.trim();

      // Verify the OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhoneNumber,
        token: verificationCode,
        type: 'phone_change',
      });

      if (verifyError) {
        console.error("Error verifying OTP:", verifyError);
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive",
        });
        setVerifying(false);
        return;
      }

      // Update profile to mark phone as verified
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          phone_number: fullPhoneNumber,
          phone_verified: true,
        })
        .eq('id', userId);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }

      toast({
        title: "Success!",
        description: "Phone number verified and linked! You can now login with this phone number.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    setCodeSent(false);
    setVerificationCode("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link Phone Number</DialogTitle>
          <DialogDescription>
            Verify your phone number to enable phone-based login
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!codeSent ? (
            <>
              <div className="space-y-2">
                <Label>Country Code</Label>
                <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <Button
                onClick={handleSendCode}
                disabled={sending || !phoneNumber.trim()}
                className="w-full"
              >
                {sending ? "Sending..." : "Send Verification Code"}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Code sent to <strong>{countryCode}{phoneNumber}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Enter Verification Code</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCodeSent(false);
                    setVerificationCode("");
                  }}
                  className="flex-1"
                >
                  Change Number
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  disabled={verifying || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {verifying ? "Verifying..." : "Verify"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="text-primary hover:underline"
                  disabled={sending}
                >
                  Resend
                </button>
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}