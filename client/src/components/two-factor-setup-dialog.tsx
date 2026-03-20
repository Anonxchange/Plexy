import { useState, useEffect, useRef } from "react";
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
import { generateSecret, buildOtpAuthUri, verifyTOTP } from "@/lib/totp";
import QRCode from "qrcode";
import { Copy, Check, RefreshCw, Shield } from "lucide-react";
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
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // Prevents a stale async call from overwriting state after unmount / re-trigger
  const generationId = useRef(0);

  const runGenerate = async (id: number) => {
    setGenerating(true);
    try {
      const newSecret = generateSecret();
      const otpauthUri = buildOtpAuthUri(newSecret, userEmail, "Pexly");
      // Use base64 data URL directly — no blob conversion needed
      const dataUrl = await QRCode.toDataURL(otpauthUri, {
        width: 192,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });

      // Bail if a newer generation was started while we were awaiting
      if (id !== generationId.current) return;

      const codes = Array.from({ length: 10 }, () => {
        const bytes = crypto.getRandomValues(new Uint8Array(4));
        return Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();
      });

      setSecret(newSecret);
      setQrDataUrl(dataUrl);
      setBackupCodes(codes);

      sessionStorage.setItem(
        `2fa_setup_${userId}`,
        JSON.stringify({ secret: newSecret, qrDataUrl: dataUrl, backupCodes: codes })
      );
    } catch (err) {
      if (id !== generationId.current) return;
      console.error("Error generating 2FA:", err);
      toast({
        title: "Setup error",
        description: "Could not generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (id === generationId.current) setGenerating(false);
    }
  };

  const triggerGenerate = () => {
    const id = ++generationId.current;
    runGenerate(id);
  };

  // On open: restore from sessionStorage or generate fresh
  useEffect(() => {
    if (!open) return;

    const stored = sessionStorage.getItem(`2fa_setup_${userId}`);
    if (stored) {
      try {
        const { secret: s, qrDataUrl: q, backupCodes: bc } = JSON.parse(stored);
        if (s && q?.startsWith("data:image/")) {
          setSecret(s);
          setQrDataUrl(q);
          setBackupCodes(bc ?? []);
          return;
        }
      } catch {
        // fall through
      }
    }

    triggerGenerate();
  // Only run when the dialog opens/closes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleVerify = async () => {
    if (!verifyTOTP(verificationCode, secret)) {
      toast({
        title: "Invalid code",
        description: "The code doesn't match. Make sure your device time is synced and try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (checkError || !existingProfile) {
        throw new Error("User profile not found. Please complete your profile first.");
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({
          two_factor_secret: secret,
          two_factor_enabled: true,
          two_factor_backup_codes: JSON.stringify(backupCodes),
        })
        .eq("id", userId);

      if (error) throw new Error(error.message || "Database update failed");

      setStep(3);
      toast({
        title: "2FA enabled!",
        description: "Your account is now protected with two-factor authentication.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to enable 2FA. Please try again.";
      toast({ title: "Setup failed", description: msg, variant: "destructive" });
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

  const reset = () => {
    generationId.current++;            // invalidate any in-flight generation
    setStep(1);
    setVerificationCode("");
    setSecret("");
    setQrDataUrl("");
    setBackupCodes([]);
    setCopiedSecret(false);
    setCopiedBackup(false);
    setGenerating(false);
    sessionStorage.removeItem(`2fa_setup_${userId}`);
  };

  const handleClose = () => {
    if (step === 2) return;            // block accidental close mid-verify
    if (step === 3) onSuccess();
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {step === 1 && "Set Up Two-Factor Authentication"}
            {step === 2 && "Verify Your Authenticator"}
            {step === 3 && "Save Your Backup Codes"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Scan the QR code with Google Authenticator, Authy, or any TOTP app."}
            {step === 2 && "Enter the 6-digit code currently shown in your authenticator app."}
            {step === 3 && "Store these backup codes somewhere safe — each one can only be used once."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: QR code + secret ──────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-xl border border-border bg-white shadow-sm min-h-[192px] min-w-[192px] flex items-center justify-center">
                {generating ? (
                  <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Scan this QR code with your authenticator app"
                    width={192}
                    height={192}
                    className="block"
                    draggable={false}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Loading…</span>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground text-xs"
                onClick={triggerGenerate}
                disabled={generating}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Or enter this key manually</Label>
              <div className="flex gap-2">
                <Input
                  value={secret}
                  readOnly
                  className="font-mono text-sm tracking-wider"
                  placeholder={generating ? "Generating…" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copySecret}
                  disabled={!secret}
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
              After scanning, your app will start showing a 6-digit code that refreshes every 30 seconds.
            </p>
          </div>
        )}

        {/* ── Step 2: Enter code ────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">6-digit code from your app</Label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-3xl tracking-[0.5em] font-mono h-14"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
              Open your authenticator app, find the Pexly entry, and enter the 6-digit code shown.
              Codes refresh every 30 seconds.
            </p>
          </div>
        )}

        {/* ── Step 3: Backup codes ──────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Backup Codes
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-7 text-xs"
                  onClick={copyBackupCodes}
                >
                  {copiedBackup ? (
                    <><Check className="h-3.5 w-3.5 text-green-500" /> Copied</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copy all</>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border">
                {backupCodes.map((code, i) => (
                  <div
                    key={i}
                    className="bg-background px-4 py-2 font-mono text-sm text-center tracking-widest"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 leading-relaxed border border-amber-200 dark:border-amber-800">
              Store these in a password manager or print them out. Each code works only once.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={!secret || generating}
              className="w-full sm:w-auto"
            >
              I've scanned the code — Next
            </Button>
          )}
          {step === 2 && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || loading}
              >
                {loading ? "Verifying…" : "Verify & Enable"}
              </Button>
            </div>
          )}
          {step === 3 && (
            <Button onClick={handleClose} className="w-full sm:w-auto">
              Done — I've saved my codes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
