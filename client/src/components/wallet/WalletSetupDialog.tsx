import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { deriveVaultKey } from "@/lib/webCrypto";
import { createClient } from "@/lib/supabase";
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, Loader2, X, RefreshCw } from '@/lib/icons';

const COMMON_PASSWORDS = [
  "password","password1","password123","12345678","123456789","1234567890",
  "qwerty123","iloveyou","admin123","letmein","welcome1","monkey123",
  "dragon123","master123","abc12345","passw0rd","p@ssword","p@ssw0rd",
];

function validateWalletPassword(password: string): { isValid: boolean; score: number; errors: string[] } {
  const checks = [
    { test: /.{8,}/.test(password),               msg: "At least 8 characters" },
    { test: /[A-Z]/.test(password),               msg: "One uppercase letter" },
    { test: /[a-z]/.test(password),               msg: "One lowercase letter" },
    { test: /[0-9]/.test(password),               msg: "One number" },
    { test: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password), msg: "One special character" },
    { test: !COMMON_PASSWORDS.includes(password.toLowerCase()), msg: "Must not be a common password" },
  ];
  const errors = checks.filter((c) => !c.test).map((c) => c.msg);
  const score = Math.round((checks.filter((c) => c.test).length / checks.length) * 100);
  return { isValid: errors.length === 0, score, errors };
}
import securityIllustration from "@/assets/svg-image-1 20.svg";

interface WalletSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
  expectedAddress?: string | null;
}

export function WalletSetupDialog({ open, onOpenChange, userId, onSuccess, expectedAddress }: WalletSetupDialogProps) {
  const [step, setStep] = useState<"intro" | "password" | "generating" | "success">("intro");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const isImporting = !!expectedAddress;

  const passwordValidation = useMemo(() => validateWalletPassword(password), [password]);

  const handleCreatePassword = async () => {
    if (!isImporting && !passwordValidation.isValid) {
      toast({
        title: "Password too weak",
        description: passwordValidation.errors[0] ?? "Please meet all password requirements.",
        variant: "destructive",
      });
      return;
    }

    if (!isImporting && password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setStep("generating");
    setIsGenerating(true);

    try {
      const supabase = createClient();
      const { nonCustodialWalletManager } = await import("@/lib/non-custodial-wallet");
      
      if (isImporting) {
        // Recovery flow: Attempt to load from Supabase and verify with password
        const wallets = await nonCustodialWalletManager.loadWalletsFromSupabase(supabase, userId);
        const ethWallet = wallets.find(w => w.chainId === "ethereum");
        
        if (!ethWallet) throw new Error("Could not find wallet data to sync.");

        // Attempt to decrypt to verify password
        await nonCustodialWalletManager.getWalletMnemonic(ethWallet.id, password, userId);
      } else {
        // Creation flow: derive the scrypt key ONCE, reuse for all 6 chain wallets.
        // Without this, scrypt would run 12 times (private key + mnemonic per chain)
        // which takes 15–30 s on a mobile CPU. Now it runs once (~1–3 s).
        const vaultKey = await deriveVaultKey(password);

        const { mnemonicPhrase } = await nonCustodialWalletManager.generateNonCustodialWallet(
          "ethereum",
          password,
          supabase,
          userId,
          undefined,
          vaultKey
        );

        const chains = ["Bitcoin (SegWit)", "Solana", "Tron (TRC-20)", "XRP", "BNB"];
        const failed: string[] = [];
        for (const chain of chains) {
          try {
            await nonCustodialWalletManager.generateNonCustodialWallet(
              chain,
              password,
              supabase,
              userId,
              mnemonicPhrase,
              vaultKey
            );
          } catch (chainErr: any) {
            console.error(`Failed to generate ${chain} wallet:`, chainErr);
            failed.push(chain);
          }
        }
        if (failed.length > 0) {
          toast({
            title: "Some wallets failed to generate",
            description: `Could not create: ${failed.join(", ")}. You can retry from settings.`,
            variant: "destructive",
          });
        }
      }

      // Vault password no longer needed in React state — wipe immediately so
      // it isn't visible in React DevTools after the creation step is done.
      // The password is either in the module-scope session (_vaultPassword via
      // unlockWallet) or is no longer needed at all for the creation flow.
      setPassword("");
      setConfirmPassword("");
      setStep("success");
    } catch (error: any) {
      setStep("password");
      toast({
        title: isImporting ? "Verification failed" : "Generation failed",
        description: error.message || "Failed to secure your wallet.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(`wallet_setup_done_${userId}`, 'true');
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={isGenerating ? undefined : (open) => {
      if (step === "success") {
        onOpenChange(open);
      }
    }}>
      <DialogContent className="max-w-[380px] w-[90vw] p-0 overflow-visible bg-white border-none shadow-2xl rounded-[32px]">
        <div className="relative flex flex-col items-center pt-10 pb-7 px-7">
          {/* Floating SVG Illustration */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-44 h-44 pointer-events-none z-50">
            <img 
              src={securityIllustration} 
              alt="Security Illustration" 
              className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(180,242,46,0.4)]"
            />
          </div>

          <div className="w-full space-y-5 mt-14 max-h-[70vh] overflow-y-auto no-scrollbar">
            {step === "intro" && (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold tracking-tight text-black">
                    {isImporting ? "Sync Wallet" : "Password Protected"}
                  </h2>
                  <p className="text-gray-500 text-base leading-relaxed">
                    {isImporting 
                      ? "A wallet is already associated with your account. Enter your wallet password to synchronize it with this device."
                      : "Secure your digital assets with Pexly's non-custodial wallet. You are in full control of your private keys and funds."}
                  </p>
                </div>

                {isImporting && expectedAddress && (
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Detected Wallet Address</p>
                    <p className="text-xs font-mono text-blue-900 truncate px-2">{expectedAddress}</p>
                  </div>
                )}

                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 leading-relaxed font-medium">
                    <span className="font-bold text-red-700 block mb-1 uppercase tracking-wider">Crucial Security Notice:</span>
                    We cannot recover your password. If lost, your wallet and all funds will be permanently inaccessible.
                  </p>
                </div>
                
                <div className="space-y-3 pt-2">
                  <Button 
                    className="w-full h-14 bg-[#B4F22E] hover:bg-[#a3db29] text-black font-bold text-lg rounded-full transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(180,242,46,0.3)]" 
                    onClick={() => setStep("password")}
                  >
                    {isImporting ? "Start Sync" : "Enter now"}
                  </Button>
                </div>
              </div>
            )}

            {step === "password" && (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-black">
                    {isImporting ? "Enter Password" : "Security Credentials"}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {isImporting 
                      ? "Enter the password you used when creating the wallet."
                      : "Establish your master access password."}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="relative group">
                    <Input
                      type="password"
                      placeholder={isImporting ? "Wallet Password" : "New password"}
                      className="bg-gray-50 border-gray-100 focus:border-[#B4F22E] h-14 px-6 rounded-full text-black placeholder:text-gray-400 text-base text-center transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {!isImporting && password.length > 0 && (
                    <div className="text-left px-2 space-y-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Strength</span>
                        <span className={
                          passwordValidation.score >= 100 ? "text-green-600 font-semibold" :
                          passwordValidation.score >= 60  ? "text-yellow-600 font-semibold" :
                          "text-red-500 font-semibold"
                        }>
                          {passwordValidation.score >= 100 ? "Strong" :
                           passwordValidation.score >= 60  ? "Fair" : "Weak"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            passwordValidation.score >= 100 ? "bg-green-500" :
                            passwordValidation.score >= 60  ? "bg-yellow-400" :
                            "bg-red-400"
                          }`}
                          style={{ width: `${passwordValidation.score}%` }}
                        />
                      </div>
                      <ul className="space-y-1 pt-1">
                        {passwordValidation.errors.map((err, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-red-500">
                            <X className="w-3 h-3 shrink-0" />
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!isImporting && (
                    <div className="relative group">
                      <Input
                        type="password"
                        placeholder="Confirm password"
                        className="bg-gray-50 border-gray-100 focus:border-[#B4F22E] h-14 px-6 rounded-full text-black placeholder:text-gray-400 text-base text-center transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  )}
                  <Button 
                    className="w-full h-14 bg-[#B4F22E] hover:bg-[#a3db29] text-black font-bold text-lg rounded-full mt-2 transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(180,242,46,0.2)]" 
                    onClick={handleCreatePassword}
                    disabled={isGenerating}
                  >
                    {isImporting ? "Verify & Unlock" : "Confirm & Secure"}
                  </Button>
                </div>
              </div>
            )}

            {step === "generating" && (
              <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#B4F22E]/20 blur-2xl rounded-full"></div>
                  <Loader2 className="w-16 h-16 text-[#B4F22E] animate-spin relative" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-black uppercase tracking-widest">
                    {isImporting ? "Synchronizing" : "Encrypting"}
                  </h2>
                  <p className="text-gray-500 text-sm max-w-xs">
                    {isImporting 
                      ? "Verifying credentials and syncing assets..."
                      : "Initializing multi-chain security protocols..."}
                  </p>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-black leading-tight">
                    {isImporting ? "Sync Complete" : "Vault Secured"}
                  </h2>
                  <p className="text-gray-500 text-base leading-relaxed">
                    {isImporting
                      ? "Your wallet has been successfully restored on this device."
                      : "Your non-custodial wallet is now synchronized."}
                  </p>
                </div>
                <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                  <p className="text-[10px] text-[#8BB424] font-bold uppercase tracking-[0.2em] mb-3">Supported Networks</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["BTC", "ETH", "BNB", "TRX", "SOL", "USDT", "USDC"].map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-black shadow-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <Button 
                  className="w-full h-14 bg-[#B4F22E] hover:bg-[#a3db29] text-black font-bold text-lg rounded-full transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(180,242,46,0.3)]" 
                  onClick={handleFinish}
                >
                  Enter Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
