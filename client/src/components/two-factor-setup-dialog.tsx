import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import DOMPurify from "dompurify";
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
import { RefreshCw, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase";

// sessionStorage key — scoped per user so multi-account scenarios don't cross
const enrollmentKey = (userId: string) => `pexly_mfa_enrollment_${userId}`;

interface SavedEnrollment {
  factorId: string;
  qrSvg: string;
  secret: string;
}

function saveEnrollment(userId: string, data: SavedEnrollment) {
  try {
    sessionStorage.setItem(enrollmentKey(userId), JSON.stringify(data));
  } catch {}
}

function loadEnrollment(userId: string): SavedEnrollment | null {
  try {
    const raw = sessionStorage.getItem(enrollmentKey(userId));
    return raw ? (JSON.parse(raw) as SavedEnrollment) : null;
  } catch {
    return null;
  }
}

function clearEnrollment(userId: string) {
  try {
    sessionStorage.removeItem(enrollmentKey(userId));
  } catch {}
}

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
  const [factorId, setFactorId] = useState("");
  const [qrSvg, setQrSvg] = useState<string>("");
  const [manualSecret, setManualSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const { toast } = useToast();

  // Stable Supabase client — never recreated across renders
  const supabase = useRef(createClient()).current;

  // Monotonic counter: newer calls supersede older in-flight ones
  const enrollmentId = useRef(0);

  // Refs that mirror volatile state — used inside event listeners
  // so we never need to re-register them on every state change
  const stepRef = useRef(step);
  const enrollingRef = useRef(enrolling);
  const factorIdRef = useRef(factorId);
  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { enrollingRef.current = enrolling; }, [enrolling]);
  useEffect(() => { factorIdRef.current = factorId; }, [factorId]);

  const sanitizedQrSvg = useMemo(() => {
    if (!qrSvg) return "";
    let svg = qrSvg;
    if (svg.startsWith("data:image/svg+xml;utf-8,")) {
      svg = decodeURIComponent(svg.slice("data:image/svg+xml;utf-8,".length));
    } else if (svg.startsWith("data:image/svg+xml;base64,")) {
      svg = atob(svg.slice("data:image/svg+xml;base64,".length));
    }
    return DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
  }, [qrSvg]);

  /** Apply enrollment data to state and persist it so mobile tab resumes work */
  const applyEnrollment = useCallback((data: SavedEnrollment) => {
    setFactorId(data.factorId);
    setQrSvg(data.qrSvg);
    setManualSecret(data.secret);
    saveEnrollment(userId, data);
  }, [userId]);

  const runEnroll = useCallback(async (id: number) => {
    setEnrolling(true);
    try {
      // 1. List existing factors
      const { data: existingFactors, error: listError } = await supabase.auth.mfa.listFactors();
      if (id !== enrollmentId.current) return;
      if (listError) throw listError;

      // 2. Check if a saved enrollment from a previous run is still valid on Supabase.
      //    This is the key recovery path for when mobile resumes after discarding JS memory.
      const saved = loadEnrollment(userId);
      if (saved) {
        const stillExists = existingFactors?.totp?.some(
          (f) => f.id === saved.factorId && f.status === "unverified"
        );
        if (stillExists) {
          // Supabase still has the factor — reuse it, skip re-enrollment entirely
          if (id !== enrollmentId.current) return;
          applyEnrollment(saved);
          return;
        }
        // Factor no longer exists — clear stale cache and fall through to fresh enrollment
        clearEnrollment(userId);
      }

      // 3. Clean up any other stale unverified factors
      const staleFactors = existingFactors?.totp?.filter((f) => f.status === "unverified") ?? [];
      for (const factor of staleFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id }).catch(() => {});
        if (id !== enrollmentId.current) return;
      }

      // 4. Enroll fresh TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Pexly (${userEmail})`,
      });
      if (id !== enrollmentId.current) return;
      if (error) throw error;

      applyEnrollment({ factorId: data.id, qrSvg: data.totp.qr_code, secret: data.totp.secret });
    } catch (err: any) {
      if (id !== enrollmentId.current) return;
      toast({
        title: "Setup error",
        description: err?.message || "Could not start 2FA setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (id === enrollmentId.current) setEnrolling(false);
    }
  }, [userId, userEmail, applyEnrollment, supabase, toast]);

  const triggerEnroll = useCallback(() => {
    const id = ++enrollmentId.current;
    runEnroll(id);
  }, [runEnroll]);

  // Start enrollment when dialog opens
  useEffect(() => {
    if (!open) return;
    triggerEnroll();
  }, [open, triggerEnroll]);

  // When the user switches to their authenticator app and comes back:
  // 1. Refresh the Supabase session so the access token isn't stale
  // 2. If state was lost (mobile tab reload), re-trigger enrollment —
  //    which will recover from sessionStorage if the factor still exists
  useEffect(() => {
    if (!open) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;

      // Always refresh the session — the token may have gone stale
      await supabase.auth.refreshSession().catch(() => {});

      // Only re-trigger if on step 1 and the enrollment state was lost
      if (stepRef.current === 1 && !enrollingRef.current && !factorIdRef.current) {
        triggerEnroll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [open, triggerEnroll, supabase]);

  const handleVerify = async () => {
    if (!factorId) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode,
      });

      if (error) {
        toast({
          title: "Invalid code",
          description: "The code doesn't match. Make sure your device time is synced and try again.",
          variant: "destructive",
        });
        return;
      }

      clearEnrollment(userId);
      toast({
        title: "2FA enabled!",
        description: "Your account is now protected with two-factor authentication.",
      });

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err?.message || "Failed to verify the code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    enrollmentId.current++;
    clearEnrollment(userId);
    setStep(1);
    setVerificationCode("");
    setFactorId("");
    setQrSvg("");
    setManualSecret("");
    setEnrolling(false);
  };

  const handleClose = () => {
    if (step === 2 && loading) return;
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[480px]"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {step === 1 ? "Set Up Two-Factor Authentication" : "Verify Your Authenticator"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Scan the QR code with Google Authenticator, Authy, or any TOTP app."
              : "Enter the 6-digit code currently shown in your authenticator app."}
          </DialogDescription>
        </DialogHeader>

        <div className={step === 1 ? "space-y-4" : "hidden"} aria-hidden={step !== 1}>
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-xl border border-border bg-white shadow-sm min-h-[192px] min-w-[192px] flex items-center justify-center">
              {enrolling ? (
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
              ) : sanitizedQrSvg ? (
                <div
                  className="w-[192px] h-[192px] [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: sanitizedQrSvg }}
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
              onClick={triggerEnroll}
              disabled={enrolling}
              tabIndex={step !== 1 ? -1 : undefined}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${enrolling ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>

          {manualSecret && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Or enter this key manually</Label>
              <Input
                value={manualSecret}
                readOnly
                className="font-mono text-sm tracking-wider"
                tabIndex={step !== 1 ? -1 : undefined}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
            After scanning, your app will start showing a 6-digit code that refreshes every 30 seconds.
          </p>
        </div>

        <div className={step === 2 ? "space-y-4" : "hidden"} aria-hidden={step !== 2}>
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
              tabIndex={step !== 2 ? -1 : undefined}
            />
          </div>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
            Open your authenticator app, find the Pexly entry, and enter the 6-digit code shown.
            Codes refresh every 30 seconds.
          </p>
        </div>

        <DialogFooter>
          <div className={step === 1 ? "w-full sm:w-auto" : "hidden"}>
            <Button
              onClick={() => setStep(2)}
              disabled={!factorId || enrolling}
              className="w-full sm:w-auto"
              tabIndex={step !== 1 ? -1 : undefined}
            >
              I've scanned the code — Next
            </Button>
          </div>
          <div className={step === 2 ? "flex gap-2 w-full sm:w-auto" : "hidden"}>
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={loading}
              tabIndex={step !== 2 ? -1 : undefined}
            >
              Back
            </Button>
            <Button
              onClick={handleVerify}
              disabled={verificationCode.length !== 6 || loading}
              tabIndex={step !== 2 ? -1 : undefined}
            >
              {loading ? "Verifying…" : "Verify & Enable"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
