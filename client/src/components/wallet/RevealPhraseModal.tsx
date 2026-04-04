import { useState } from "react";
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
import { AlertTriangle, Copy, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import securityIllustration from "@/assets/svg-image-1 20.svg";

type Step = "warning" | "password" | "phrase";

interface RevealPhraseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
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
  const [step, setStep] = useState<Step>("warning");
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [copied, setCopied] = useState(false);

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep("warning");
      setChecked1(false);
      setChecked2(false);
      setPassword("");
      setShowPassword(false);
      setMnemonic("");
      setCopied(false);
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
      setMnemonic(phrase);
      setPassword("");
      setStep("phrase");
    } catch (error: any) {
      toast({ title: "Incorrect password", description: error.message || "Could not decrypt your recovery phrase.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    toast({ title: "Copied", description: "Recovery phrase copied to clipboard" });
    setTimeout(() => setCopied(false), 3000);
  };

  return {
    step, setStep,
    checked1, setChecked1,
    checked2, setChecked2,
    password, setPassword,
    showPassword, setShowPassword,
    isLoading,
    mnemonic,
    copied,
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
  step, setStep,
  checked1, setChecked1,
  checked2, setChecked2,
  password, setPassword,
  showPassword, setShowPassword,
  isLoading,
  mnemonic,
  copied,
  handleClose,
  handleReveal,
  handleCopy,
  userId,
  isMobile,
}: ModalInnerProps) {
  const words = mnemonic ? mnemonic.trim().split(/\s+/) : [];

  return (
    <div className="relative flex flex-col items-center pt-10 pb-8 px-6">
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
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-400">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-foreground">Recovery Phrase</h2>
              <p className="text-xs text-muted-foreground">Write these words down in order and keep them safe.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {words.map((word, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-muted border border-border rounded-xl px-2.5 py-2.5"
                >
                  <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0 text-right leading-none">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground leading-none truncate">
                    {word}
                  </span>
                </div>
              ))}
            </div>

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
        )}

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
