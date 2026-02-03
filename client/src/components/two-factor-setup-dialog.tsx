import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { Copy, Check } from "lucide-react";p
import { createClient } from "@/lib/supabase";

interface TwoFactorSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userId: string;
  onSuccess: () => void;
}

export function TwoFactorSetupDialog({
  open,
  onOpenChange,
  userEmail,
  userId,
  onSuccess,
}: TwoFactorSetupDialogProps) {
  const [step, setStep] = useState(1);
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;

    const sessionKey = `2fa_setup_${userId}`;
    const storedData = sessionStorage.getItem(sessionKey);
    
    if (storedData) {
      try {
        const { secret: storedSecret, qrCodeUrl: storedQr, backupCodes: storedCodes } = JSON.parse(storedData);
        // Only restore if it's a data URL (safe for images)
        if (storedQr && storedQr.startsWith('data:image/')) {
          setSecret(storedSecret);
          setQrCodeUrl(storedQr);
          setBackupCodes(storedCodes);
        } else {
          generateSecret();
        }
      } catch (e) {
        generateSecret();
      }
    } else {
      generateSecret();
    }
  }, [open, userId]);

  const generateSecret = async () => {
    // Generate a TOTP instance with a random secret
    const totp = new OTPAuth.TOTP({
      issuer: "Pexly",
      label: userEmail,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
    
    const newSecret = totp.secret.base32;
    setSecret(newSecret);

    const otpauthUrl = totp.toString();

    let qrCode = '';
    try {
      qrCode = await QRCode.toDataURL(otpauthUrl);
      setQrCodeUrl(qrCode);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }

    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    setBackupCodes(codes);

    // Store in sessionStorage to persist across remounts
    const sessionKey = `2fa_setup_${userId}`;
    sessionStorage.setItem(sessionKey, JSON.stringify({
      secret: newSecret,
      qrCodeUrl: qrCode,
      backupCodes: codes
    }));
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      // Create TOTP instance with the stored secret
      const totp = new OTPAuth.TOTP({
        issuer: "Pexly",
        label: userEmail,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });
      
      const isValid = totp.validate({ token: verificationCode, window: 1 }) !== null;

      if (!isValid) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // First check if user profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (checkError || !existingProfile) {
        console.error("User profile check failed:", checkError);
        throw new Error("User profile not found. Please complete your profile first.");
      }

      // Update the profile with 2FA settings
      const { error } = await supabase
        .from("user_profiles")
        .update({
          two_factor_secret: secret,
          two_factor_enabled: true,
          two_factor_backup_codes: JSON.stringify(backupCodes),
        })
        .eq("id", userId);

      if (error) {
        console.error("Supabase error enabling 2FA:", error);
        throw new Error(error.message || error.details || "Database update failed");
      }

      setStep(3);
      
      toast({
        title: "Success!",
        description: "Two-factor authentication has been enabled.",
      });
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      let errorMessage = "Failed to enable 2FA. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as any;
        errorMessage = err.message || err.details || err.hint || JSON.stringify(error);
      }
      
      toast({
        title: "2FA Enable Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleClose = () => {
    // Prevent closing if still in setup process
    if (step === 3) {
      // Only allow closing after backup codes are shown
      setStep(1);
      setVerificationCode("");
      setSecret("");
      setQrCodeUrl("");
      setBackupCodes([]);
      setCopiedSecret(false);
      setCopiedBackup(false);
      
      // Clear sessionStorage
      const sessionKey = `2fa_setup_${userId}`;
      sessionStorage.removeItem(sessionKey);
      
      onSuccess();
      onOpenChange(false);
    } else if (step === 1) {
      // Allow closing from first step
      setStep(1);
      setVerificationCode("");
      setSecret("");
      setQrCodeUrl("");
      setBackupCodes([]);
      setCopiedSecret(false);
      setCopiedBackup(false);
      
      // Clear sessionStorage
      const sessionKey = `2fa_setup_${userId}`;
      sessionStorage.removeItem(sessionKey);
      
      onOpenChange(false);
    }
    // Prevent closing during verification (step 2)
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Set Up Two-Factor Authentication"}
            {step === 2 && "Verify Your Code"}
            {step === 3 && "Save Your Backup Codes"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Scan the QR code with your authenticator app"}
            {step === 2 && "Enter the 6-digit code from your authenticator app"}
            {step === 3 && "Keep these backup codes in a safe place"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex justify-center">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Or enter this code manually:</Label>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copySecret}
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Scan this QR code with Google Authenticator, Microsoft Authenticator, or any TOTP-compatible app.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Enter 6-digit code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Open your authenticator app and enter the 6-digit code for Pexly.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center mb-2">
                <Label>Backup Codes</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyBackupCodes}
                >
                  {copiedBackup ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-background p-2 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-500">
              Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <Button onClick={() => setStep(2)}>Next</Button>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || loading}
              >
                {loading ? "Verifying..." : "Verify & Enable"}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
