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
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { Copy, Check } from "lucide-react";
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
    if (open && !secret) {
      generateSecret();
    }
  }, [open]);

  const generateSecret = async () => {
    // Generate a random secret using Web Crypto API
    const buffer = new Uint8Array(20);
    crypto.getRandomValues(buffer);
    
    // Convert to base32 (RFC 4648)
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let newSecret = '';
    
    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;
      
      while (bits >= 5) {
        newSecret += base32chars[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    
    if (bits > 0) {
      newSecret += base32chars[(value << (5 - bits)) & 31];
    }
    
    setSecret(newSecret);

    const otpauthUrl = authenticator.keyuri(
      userEmail,
      "Pexly",
      newSecret
    );

    try {
      const qrCode = await QRCode.toDataURL(otpauthUrl);
      setQrCodeUrl(qrCode);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }

    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    setBackupCodes(codes);
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const isValid = authenticator.verify({
        token: verificationCode,
        secret: secret,
      });

      if (!isValid) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({
          two_factor_secret: secret,
          two_factor_enabled: true,
          two_factor_backup_codes: JSON.stringify(backupCodes),
        })
        .eq("id", userId);

      if (error) throw error;

      setStep(3);
      
      toast({
        title: "Success!",
        description: "Two-factor authentication has been enabled.",
      });
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      toast({
        title: "Error",
        description: "Failed to enable 2FA. Please try again.",
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
