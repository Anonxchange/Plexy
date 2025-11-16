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
import { PhoneVerification } from "./phone-verification";

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
  const { toast } = useToast();
  const supabase = createClient();

  const handleVerified = async (fullPhoneNumber: string) => {
    try {
      console.log("Phone verified, updating profile...");

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

      console.log("Profile updated successfully");

      onOpenChange(false);

      toast({
        title: "Success!",
        description: "Phone number verified and linked! You can now login with this phone number."
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
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

        <div className="py-4">
          <PhoneVerification
            onVerified={handleVerified}
            initialPhone={phoneNumber}
            initialCountryCode={countryCode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}