import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import securityIllustration from "@/assets/svg-image-1 20.svg";

interface WalletSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

export function WalletSetupDialog({ open, onOpenChange, userId, onSuccess }: WalletSetupDialogProps) {
  const [step, setStep] = useState<"intro" | "password" | "generating" | "success">("intro");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleCreatePassword = async () => {
    if (password.length < 8) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Passwords mismatch",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setStep("generating");
    setIsGenerating(true);

    try {
      const { mnemonicPhrase } = await nonCustodialWalletManager.generateNonCustodialWallet(
        "ethereum",
        password,
        null,
        userId
      );

      await nonCustodialWalletManager.generateNonCustodialWallet(
        "Bitcoin (SegWit)",
        password,
        null,
        userId,
        mnemonicPhrase
      );

      await nonCustodialWalletManager.generateNonCustodialWallet(
        "Solana",
        password,
        null,
        userId,
        mnemonicPhrase
      );

      await nonCustodialWalletManager.generateNonCustodialWallet(
        "Tron (TRC-20)",
        password,
        null,
        userId,
        mnemonicPhrase
      );

      await nonCustodialWalletManager.generateNonCustodialWallet(
        "XRP",
        password,
        null,
        userId,
        mnemonicPhrase
      );

      setStep("success");
    } catch (error: any) {
      setStep("password");
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate your wallet.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
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
                  <h2 className="text-3xl font-bold tracking-tight text-black">Password Protected</h2>
                  <p className="text-gray-500 text-base leading-relaxed">
                    Secure your digital assets with Pexly's non-custodial wallet. You are in full control of your private keys and funds.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 leading-relaxed font-medium">
                    <span className="font-bold text-red-700 block mb-1 uppercase tracking-wider">Crucial Security Notice:</span>
                    We cannot recover your password. If lost, your wallet and all funds will be permanently inaccessible. You are the sole person in charge of your security.
                  </p>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="relative group">
                    <Input
                      type="password"
                      placeholder="Enter your password."
                      disabled
                      className="bg-gray-50 border-gray-200 border h-14 px-6 rounded-full text-black placeholder:text-gray-400 text-base text-center cursor-not-allowed opacity-60"
                    />
                  </div>
                  
                  <Button 
                    className="w-full h-14 bg-[#B4F22E] hover:bg-[#a3db29] text-black font-bold text-lg rounded-full transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(180,242,46,0.3)]" 
                    onClick={() => setStep("password")}
                  >
                    Enter now
                  </Button>
                </div>
              </div>
            )}

            {step === "password" && (
              <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-black">Security Credentials</h2>
                  <p className="text-gray-500 text-sm">Establish your master access password.</p>
                </div>
                <div className="space-y-3">
                  <div className="relative group">
                    <Input
                      type="password"
                      placeholder="New password"
                      className="bg-gray-50 border-gray-100 focus:border-[#B4F22E] h-14 px-6 rounded-full text-black placeholder:text-gray-400 text-base text-center transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="relative group">
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      className="bg-gray-50 border-gray-100 focus:border-[#B4F22E] h-14 px-6 rounded-full text-black placeholder:text-gray-400 text-base text-center transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full h-14 bg-[#B4F22E] hover:bg-[#a3db29] text-black font-bold text-lg rounded-full mt-2 transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(180,242,46,0.2)]" 
                    onClick={handleCreatePassword}
                  >
                    Confirm & Secure
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
                  <h2 className="text-xl font-bold text-black uppercase tracking-widest">Encrypting</h2>
                  <p className="text-gray-500 text-sm max-w-xs">
                    Initializing multi-chain security protocols...
                  </p>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-black leading-tight">Vault Secured</h2>
                  <p className="text-gray-500 text-base leading-relaxed">
                    Your non-custodial wallet is now synchronized.
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
