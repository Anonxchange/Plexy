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
  phoneNumber,
  countryCode,
  userId,
  onSuccess,
}: PhoneLinkingDialogProps) {
  const [otpCode, setOtpCode] = useState("");
  const [awaitingOTP, setAwaitingOTP] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleSendOTP = async () => {
    try {
      setSending(true);
      const fullPhoneNumber = countryCode + phoneNumber;

      console.log("Attempting to update user phone to:", fullPhoneNumber);

      const { error } = await supabase.auth.updateUser({
        phone: fullPhoneNumber,
      });

      console.log("Update user result:", { error });

      if (error) {
        console.error("Supabase Auth error details:", {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name
        });

        // Only show "already in use" if it's truly a duplicate/conflict error
        if (error.status === 409) {
          toast({
            title: "Phone Number Already in Use",
            description: "This phone number is already linked to another account.",
            variant: "destructive",
          });
          return;
        }

        // Show the actual error message for other errors
        toast({
          title: "Error Sending Verification Code",
          description: error.message || "Failed to send verification code. Please check the phone number and try again.",
          variant: "destructive",
        });
        return;
      }

      setAwaitingOTP(true);
      toast({
        title: "Verification Code Sent",
        description: `A 6-digit code has been sent to ${fullPhoneNumber}`,
      });
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

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) return;

    try {
      const fullPhoneNumber = countryCode + phoneNumber;

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhoneNumber,
        token: otpCode,
        type: 'phone_change',
      });

      if (verifyError) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect or has expired.",
          variant: "destructive",
        });
        return;
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          phone_number: fullPhoneNumber,
          phone_verified: true,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      setOtpCode("");
      setAwaitingOTP(false);
      onOpenChange(false);

      toast({
        title: "Success!",
        description: "Phone number verified and linked! You can now login with this phone number."
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify phone number",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setAwaitingOTP(false);
    setOtpCode("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link Phone Number</DialogTitle>
          <DialogDescription>
            {!awaitingOTP 
              ? "Click below to send a verification code to your phone number"
              : `Enter the 6-digit code sent to ${countryCode}${phoneNumber}`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {!awaitingOTP ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Phone Number:</p>
                <p className="text-lg font-semibold">{countryCode}{phoneNumber}</p>
              </div>
              <Button 
                onClick={handleSendOTP} 
                disabled={sending}
                className="w-full"
              >
                {sending ? "Sending Code..." : "Send Verification Code"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="otp-code">Verification Code</Label>
                <Input
                  id="otp-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  autoFocus
                />
              </div>
              <Button 
                onClick={handleVerifyOTP} 
                disabled={otpCode.length !== 6}
                className="w-full"
              >
                Verify and Link Phone Number
              </Button>
              <Button 
                variant="outline"
                onClick={handleSendOTP}
                disabled={sending}
                className="w-full"
              >
                {sending ? "Sending..." : "Resend Code"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
