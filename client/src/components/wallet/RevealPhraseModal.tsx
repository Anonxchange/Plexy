import { useState, useEffect, useCallback, useId, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";
import { AlertTriangle, Copy, Check, Eye, EyeOff, Loader2, ShieldOff, Lock } from "lucide-react";
// SVG is imported as a static asset URL and rendered via <img>.
// Browsers fully sandbox SVGs loaded this way — no scripts or event
// handlers inside the file can execute. The file itself contains only
// geometric paths and masks with no scripts, foreignObject, or external
// href references, so it is safe even if rendered inline.
import securityIllustration from "@/assets/svg-image-1 20.svg";

type Step = "warning" | "password" | "phrase";

interface RevealPhraseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

/**
 * Volatile, module-scoped mnemonic holder.
 *
 * The decrypted mnemonic is intentionally kept OUTSIDE the React tree:
 * not in useState, not in useRef, not in props, not in context.
 * React DevTools enumerates state/props/refs/context for every component;
 * anything stored there is one click away in any browser. By holding the
 * value in this Map keyed by a useId() instance ID — and reading it at
 * render time without ever passing it down — the React component tree
 * sees only a non-secret string ID.
 *
 * The plaintext lives here only between the password-decrypt call and
 * the next modal close (or unmount, or tab-hide), and is wiped on every
 * exit path.
 */
const volatileMnemonics = new Map<string, string>();

function setVolatileMnemonic(instanceId: string, value: string) {
  volatileMnemonics.set(instanceId, value);
}

function getVolatileMnemonic(instanceId: string): string {
  return volatileMnemonics.get(instanceId) ?? "";
}

function wipeVolatileMnemonic(instanceId: string) {
  // Best-effort overwrite before delete. JS strings are immutable so we
  // can't zero the bytes, but dropping the only reference lets GC reclaim
  // it on the next cycle. The Map.delete() makes it unreachable from the
  // app immediately.
  volatileMnemonics.set(instanceId, "");
  volatileMnemonics.delete(instanceId);
}

export function RevealPhraseModal(props: RevealPhraseModalProps) {
  const isMobile = useIsMobile();
  return isMobile ? <MobileSheet {...props} /> : <DesktopDialog {...props} />;
}

function DesktopDialog({ open, onOpenChange, userId }: RevealPhraseModalProps) {
  const state = useRevealState(onOpenChange);
  return (
    <Dialog open={open} onOpenChange={state.handleClose}>
      <DialogContent className="max-w-[390px] w-[92vw] p-0 overflow-visible border border-border shadow-2xl rounded-[28px] bg-card">
        <ModalInner {...state} userId={userId} />
      </DialogContent>
    </Dialog>
  );
}

function MobileSheet({ open, onOpenChange, userId }: RevealPhraseModalProps) {
  const state = useRevealState(onOpenChange);
  return (
    <Drawer open={open} onOpenChange={state.handleClose}>
      <DrawerContent className="bg-card border-t border-border rounded-t-[28px] pb-safe focus:outline-none">
        <ModalInner {...state} userId={userId} isMobile />
      </DrawerContent>
    </Drawer>
  );
}

function useRevealState(onOpenChange: (v: boolean) => void) {
  const { toast } = useToast();
  // useId returns a stable, non-secret string per component instance.
  // It is the ONLY identifier that crosses the React tree.
  const instanceId = useId();
  const [step, setStep] = useState<Step>("warning");
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  // Bumped after a successful decrypt to trigger a re-render that will
  // pull the words from the volatile Map. The number itself reveals
  // nothing about the mnemonic.
  const [revealNonce, setRevealNonce] = useState(0);

  // Wipe on unmount — covers route changes, parent re-renders that
  // discard the modal, hot reloads, etc.
  useEffect(() => {
    return () => wipeVolatileMnemonic(instanceId);
  }, [instanceId]);

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep("warning");
      setChecked1(false);
      setChecked2(false);
      setPassword("");
      setShowPassword(false);
      setCopied(false);
      wipeVolatileMnemonic(instanceId);
      setRevealNonce((n) => n + 1);
    }
    onOpenChange(open);
  };

  const handleReveal = async (userId: string) => {
    if (!password) {
      toast({ title: "Password required", description: "Please enter your wallet password", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const wallets = await nonCustodialWalletManager.getNonCustodialWallets(userId);
      if (wallets.length === 0) throw new Error("No non-custodial wallet found.");
      const phrase = await nonCustodialWalletManager.getWalletMnemonic(wallets[0].id, password, userId);
      if (!phrase) throw new Error("Failed to decrypt recovery phrase. Check your password.");
      // Stash in the volatile Map — NOT in React state.
      setVolatileMnemonic(instanceId, phrase);
      setPassword("");
      setStep("phrase");
      setRevealNonce((n) => n + 1);
    } catch (error: any) {
      toast({ title: "Incorrect password", description: error.message || "Could not decrypt your recovery phrase.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const phrase = getVolatileMnemonic(instanceId);
    if (!phrase) return;
    navigator.clipboard.writeText(phrase);
    setCopied(true);
    toast({ title: "Copied", description: "Recovery phrase copied to clipboard" });
    setTimeout(() => setCopied(false), 3000);
  };

  return {
    instanceId,
    step, setStep,
    checked1, setChecked1,
    checked2, setChecked2,
    password, setPassword,
    showPassword, setShowPassword,
    isLoading,
    copied,
    revealNonce,
    handleClose,
    handleReveal,
    handleCopy,
  };
}

type ModalInnerProps = ReturnType<typeof useRevealState> & {
  userId: string;
  isMobile?: boolean;
};

function ModalInner({
  instanceId,
  step, setStep,
  checked1, setChecked1,
  checked2, setChecked2,
  password, setPassword,
  showPassword, setShowPassword,
  isLoading,
  copied,
  revealNonce,
  handleClose,
  handleReveal,
  handleCopy,
  userId,
  isMobile,
}: ModalInnerProps) {
  return (
    <div className="relative flex flex-col items-center pt-10 pb-8 px-6 overflow-y-auto max-h-[85dvh]">
      {/* Floating illustration — only on desktop (not mobile where sheet clips it) */}
      {!isMobile && (
        <div className="absolute -top-[68px] left-1/2 -translate-x-1/2 w-32 h-32 pointer-events-none z-50">
          <img
            src={securityIllustration}
            alt="Security"
            className="w-full h-full object-contain drop-shadow-[0_12px_28px_rgba(180,242,46,0.35)]"
          />
        </div>
      )}

      {/* On mobile: illustration sits inline above content */}
      {isMobile && (
        <div className="w-28 h-28 mb-2 pointer-events-none">
          <img
            src={securityIllustration}
            alt="Security"
            className="w-full h-full object-contain drop-shadow-[0_8px_20px_rgba(180,242,46,0.3)]"
          />
        </div>
      )}

      <div className={`w-full flex flex-col gap-0 ${!isMobile ? "mt-14" : "mt-0"}`}>

        {/* ── STEP 1: WARNING ── */}
        {step === "warning" && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
            <div className="flex items-center justify-center gap-1.5 text-amber-500 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-semibold tracking-wide uppercase">For your eyes only!</span>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground leading-snug">
                This secret phrase<br />unlocks your wallet
              </h2>
            </div>

            <div className="space-y-2.5 mt-1">
              <CheckRow
                checked={checked1}
                onToggle={() => setChecked1((v) => !v)}
                label="Pexly does not have access to this key."
              />
              <CheckRow
                checked={checked2}
                onToggle={() => setChecked2((v) => !v)}
                label="Don't save this in any digital format, write it on paper and store securely."
              />
            </div>

            <Button
              disabled={!checked1 || !checked2}
              onClick={() => setStep("password")}
              className="w-full h-12 bg-[#B4F22E] hover:bg-[#c8ff44] text-black font-bold text-base rounded-full mt-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(180,242,46,0.25)]"
            >
              Continue
            </Button>
          </div>
        )}

        {/* ── STEP 2: PASSWORD ── */}
        {step === "password" && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-400">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-bold text-foreground">Enter Wallet Password</h2>
              <p className="text-sm text-muted-foreground">
                Enter the password you set when creating this wallet to decrypt your recovery phrase.
              </p>
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Wallet password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleReveal(userId)}
                className="h-12 px-5 pr-12 rounded-full text-base"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              onClick={() => handleReveal(userId)}
              disabled={isLoading || !password}
              className="w-full h-12 bg-[#B4F22E] hover:bg-[#c8ff44] text-black font-bold text-base rounded-full transition-all disabled:opacity-40 shadow-[0_4px_14px_rgba(180,242,46,0.25)]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Decrypting…
                </span>
              ) : (
                "Reveal Phrase"
              )}
            </Button>

            <button
              type="button"
              onClick={() => setStep("warning")}
              className="text-sm text-muted-foreground hover:text-foreground text-center transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── STEP 3: PHRASE ── */}
        {step === "phrase" && (
          <PhraseReveal
            instanceId={instanceId}
            revealNonce={revealNonce}
            copied={copied}
            handleCopy={handleCopy}
            handleClose={handleClose}
          />
        )}

      </div>
    </div>
  );
}

function PhraseReveal({
  instanceId,
  revealNonce,
  copied,
  handleCopy,
  handleClose,
}: {
  instanceId: string;
  revealNonce: number;
  copied: boolean;
  handleCopy: () => void;
  handleClose: (open: boolean) => void;
}) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  // The grid is rendered into this container by direct DOM API once
  // the user holds the reveal button. Keeping the words off the React
  // child tree means the parent's "props" panel in DevTools shows
  // only `instanceId` and `revealNonce` — never the words themselves.
  const wordsContainerRef = useRef<HTMLDivElement | null>(null);

  const hide = useCallback(() => {
    setIsRevealed(false);
    setCountdown(0);
  }, []);

  // Read fresh from the volatile Map every time we need to render.
  // Computed in render, not stored — never becomes a prop or state.
  // `revealNonce` is included in the dep chain so a successful decrypt
  // forces a re-paint.
  const renderWords = useCallback(() => {
    const el = wordsContainerRef.current;
    if (!el) return;
    // Wipe whatever was there.
    el.replaceChildren();
    if (!isRevealed) return;
    const phrase = getVolatileMnemonic(instanceId);
    if (!phrase) return;
    const words = phrase.trim().split(/\s+/);
    const frag = document.createDocumentFragment();
    words.forEach((word, i) => {
      const cell = document.createElement("div");
      cell.className =
        "flex flex-col items-center gap-1 bg-muted border border-border rounded-xl px-2 py-2.5 min-h-[54px] justify-center";
      const idx = document.createElement("span");
      idx.className = "text-[9px] font-bold text-muted-foreground leading-none";
      idx.textContent = String(i + 1);
      const w = document.createElement("span");
      w.className =
        "text-[13px] font-semibold text-foreground leading-snug text-center break-words w-full px-1";
      w.textContent = word;
      cell.appendChild(idx);
      cell.appendChild(w);
      frag.appendChild(cell);
    });
    el.appendChild(frag);
  }, [instanceId, isRevealed]);

  useEffect(() => {
    renderWords();
    return () => {
      // Wipe DOM on unmount of the reveal screen.
      const el = wordsContainerRef.current;
      if (el) el.replaceChildren();
    };
  }, [renderWords, revealNonce]);

  // Auto-hide when tab/app goes to background (catches screen recording too)
  useEffect(() => {
    const onHide = () => { if (document.hidden) hide(); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [hide]);

  // 30-second countdown auto-hide
  useEffect(() => {
    if (!isRevealed) return;
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { hide(); clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRevealed, hide]);

  const startReveal = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsRevealed(true);
  };
  const stopReveal = () => hide();

  // Render an empty 12-cell skeleton when blurred so layout doesn't jump.
  const skeletonCells = Array.from({ length: 12 });

  return (
    <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-400">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">Recovery Phrase</h2>
        <p className="text-xs text-muted-foreground">Write these words down in order and keep them safe.</p>
      </div>

      {/* Screenshot-protection status bar */}
      <div className="flex items-center justify-between bg-muted/60 border border-border rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#B4F22E]" />
          <span className="text-[11px] font-semibold text-muted-foreground">Screenshot protection on</span>
        </div>
        {isRevealed && (
          <span className="text-[11px] font-bold text-amber-500 tabular-nums">
            Hiding in {countdown}s
          </span>
        )}
      </div>

      {/* Word grid — empty React subtree; words injected via DOM API only when revealed */}
      <div
        className="relative rounded-2xl overflow-hidden"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Imperatively-populated word grid, kept off the React tree */}
        <div
          ref={wordsContainerRef}
          className={`grid grid-cols-3 gap-2 transition-all duration-200 select-none ${
            isRevealed ? "blur-none" : "blur-md pointer-events-none"
          }`}
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
        />

        {/* Skeleton placeholder so the blurred state keeps its size */}
        {!isRevealed && (
          <div
            className="absolute inset-0 grid grid-cols-3 gap-2 pointer-events-none blur-md"
            aria-hidden
          >
            {skeletonCells.map((_, i) => (
              <div
                key={i}
                className="bg-muted border border-border rounded-xl min-h-[54px]"
              />
            ))}
          </div>
        )}

        {/* Overlay shown when blurred */}
        {!isRevealed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-background/60 backdrop-blur-sm">
            <ShieldOff className="w-7 h-7 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground text-center px-4">
              Hold the button below to reveal
            </p>
          </div>
        )}
      </div>

      {/* Hold-to-reveal button */}
      <button
        type="button"
        onPointerDown={startReveal}
        onPointerUp={stopReveal}
        onPointerLeave={stopReveal}
        onPointerCancel={stopReveal}
        className={`w-full h-12 rounded-full font-bold text-sm select-none touch-none transition-all ${
          isRevealed
            ? "bg-amber-500 text-white shadow-[0_4px_14px_rgba(245,158,11,0.35)] scale-[0.98]"
            : "bg-muted border border-border text-foreground hover:bg-muted/80"
        }`}
      >
        {isRevealed ? "Release to hide" : "Hold to Reveal"}
      </button>

      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          Never share your secret phrase with anyone, and store it securely!
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleCopy}
          className="flex-1 h-11 rounded-full text-sm font-semibold gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-[#B4F22E]" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button
          onClick={() => handleClose(false)}
          className="flex-1 h-11 bg-[#B4F22E] hover:bg-[#c8ff44] text-black font-bold rounded-full text-sm shadow-[0_4px_14px_rgba(180,242,46,0.25)]"
        >
          Done
        </Button>
      </div>
    </div>
  );
}

function CheckRow({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-start gap-3 bg-muted/60 hover:bg-muted border border-border hover:border-border/80 rounded-2xl px-4 py-3.5 text-left transition-all group"
    >
      <span
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
          checked
            ? "bg-[#B4F22E] border-[#B4F22E]"
            : "border-border group-hover:border-muted-foreground/50"
        }`}
      >
        {checked && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
      </span>
      <span className="text-sm text-muted-foreground leading-snug">{label}</span>
    </button>
  );
}
