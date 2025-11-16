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

interface EmailLinkingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string;
  userId: string;
  onSuccess: () => void;
}

export function EmailLinkingDialog({
  open,
  onOpenChange,
  currentEmail,
  userId,
  onSuccess,
}: EmailLinkingDialogProps) {
  const [newEmail, setNewEmail] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleLinkEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);

      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        console.error("Email update error:", error);
        if (error.status === 422 || error.status === 409) {
          toast({
            title: "Email Already in Use",
            description: "This email is already linked to another account.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Error",
          description: error.message || "Failed to send verification email",
          variant: "destructive",
        });
        return;
      }

      // Note: The email in user_profiles will be updated ONLY when the user 
      // clicks the verification link in their new email.
      // The verify-email page will handle updating user_profiles after confirmation.

      setNewEmail("");
      onOpenChange(false);

      toast({
        title: "Verification Email Sent",
        description: `A verification link has been sent to ${newEmail}. Click the link to complete the email change.`,
      });

      // Don't call onSuccess() yet - the email hasn't actually changed until verified
      // onSuccess();
    } catch (error: any) {
      console.error('Error linking email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to link email",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{currentEmail ? "Update Email Address" : "Link Email Address"}</DialogTitle>
          <DialogDescription>
            {currentEmail 
              ? "Enter your new email address. A verification link will be sent to the new address."
              : "Link an email address to your account for additional login options and security."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {currentEmail && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Current Email:</p>
              <p className="text-lg">{currentEmail}</p>
            </div>
          )}
          
          <div>
            <Label htmlFor="new-email">{currentEmail ? "New Email" : "Email Address"}</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="your@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={sending}
              autoFocus
            />
          </div>
          
          <Button 
            onClick={handleLinkEmail} 
            disabled={!newEmail || sending}
            className="w-full"
          >
            {sending ? "Sending Verification..." : currentEmail ? "Update Email" : "Link Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
