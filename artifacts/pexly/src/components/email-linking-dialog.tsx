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
import { Eye, EyeOff } from "lucide-react";

interface EmailLinkingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string | null;
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // Verify current password first for existing email users
    if (currentEmail) {
      if (!currentPassword) {
        toast({
          title: "Password Required",
          description: "Please enter your current password to change your email",
          variant: "destructive",
        });
        return;
      }

      // Verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "Incorrect Password",
          description: "The password you entered is incorrect",
          variant: "destructive",
        });
        return;
      }
    }

    // For first-time email linking, require password
    if (!currentEmail) {
      if (!password) {
        toast({
          title: "Error",
          description: "Please enter a password",
          variant: "destructive",
        });
        return;
      }

      if (password.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }
    }

    setSending(true);

    try {
      const updateData: any = { email: newEmail };
      
      // Only set password for first-time email linking
      if (!currentEmail && password) {
        updateData.password = password;
      }

      const { error } = await supabase.auth.updateUser(updateData);

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
      setPassword("");
      setConfirmPassword("");
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
              : "Link an email address to your account for additional login options and security. You will need to set a password."
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

          {currentEmail && (
            <div className="relative">
              <Label htmlFor="current-password">Current Password<span className="text-red-500">*</span></Label>
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={sending}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground top-6"
                disabled={sending}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
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
              autoFocus={!currentEmail}
            />
          </div>

          {!currentEmail && (
            <>
              <div className="relative">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground top-6"
                  disabled={sending}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground top-6"
                  disabled={sending}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </>
          )}

          <Button 
            onClick={handleLinkEmail} 
            disabled={!newEmail || (currentEmail && !currentPassword) || (!currentEmail && !password) || sending}
            className="w-full"
          >
            {sending ? "Sending Verification..." : currentEmail ? "Update Email" : "Link Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}