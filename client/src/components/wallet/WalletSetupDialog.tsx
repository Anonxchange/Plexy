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
      <DialogContent className="max-w-[400px] w-[90vw] p-0 overflow-visible bg-[#0A0A0A] border-none shadow-2xl rounded-[32px]">
        <div className="relative flex flex-col items-center pt-12 pb-8 px-8">
          {/* Floating SVG Illustration */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none z-50">
            <img 
              src="/src/assets/svg-image-1 16.svg" 
              alt="Security Illustration" 
              className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(180,242,46,0.3)]"
            />
          </div>

          <div className="w-full space-y-6 mt-16 max-h-[70vh] overflow-y-auto no-scrollbar">
            {step === "intro" && (
              <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Password Protected</h2>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Secure your digital assets with Pexly's non-custodial wallet. You are in full control of your private keys and funds.
                  </p>
                </div>
                
                <div className="space-y-4 pt-4">
                  <div className="relative group">
                    <Input
                      type="password"
                      placeholder="Enter your password."
                      disabled
                      className="bg-transparent border-[#B4F22E] border-2 h-16 px-8 rounded-full text-white placeholder:text-gray-500 text-lg text-center cursor-not-allowed opacity-50"
                    />
                  </div>
                  
                  <Button 
                    className="w-full h-16 bg-[#B4F22E] hover:bg-[#a3db29] text-black font-bold text-xl rounded-full transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(180,242,46,0.2)]" 
                    onClick={() => setStep("password")}
                  >
                    Enter now
                  </Button>
                </div>
              </div>
            )}

            {step === "password" && (
              <div className="space-y-8 text-center animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">Security Credentials</h2>
                  <p className="text-gray-400">Establish your master access password.</p>
                </div>
                <div className="space-y-4">
                  <div className="relative group">
                    <Input
                      type="password"
                      placeholder="New password"
                      className="bg-transparent border-gray-800 focus:border-[#B4F22E] h-16 px-8 rounded-full text-white placeholder:text-gray-600 text-lg text-center transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="relative group">
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      className="bg-transparent border-gray-800 focus:border-[#B4F22E] h-16 px-8 rounded-full text-white placeholder:text-gray-600 text-lg text-center transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full h-16 bg-[#B4F22E] hover:bg-[#a3db29] text-black font-bold text-xl rounded-full mt-4 transition-all hover:scale-[1.02]" 
                    onClick={handleCreatePassword}
                  >
                    Confirm & Secure
                  </Button>
                </div>
              </div>
            )}

            {step === "generating" && (
              <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in zoom-in-95 duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#B4F22E]/20 blur-2xl rounded-full"></div>
                  <Loader2 className="w-20 h-20 text-[#B4F22E] animate-spin relative" />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Encrypting</h2>
                  <p className="text-gray-400 max-w-xs">
                    Initializing multi-chain security protocols...
                  </p>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-white leading-tight">Vault Secured</h2>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Your non-custodial wallet is now synchronized.
                  </p>
                </div>
                <div className="bg-white/5 p-6 rounded-[24px] border border-white/10">
                  <p className="text-[10px] text-[#B4F22E] font-bold uppercase tracking-[0.2em] mb-4">Supported Networks</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["BTC", "ETH", "BNB", "TRX", "SOL", "USDT", "USDC"].map((s) => (
                      <span key={s} className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-[10px] font-bold text-white">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <Button 
                  className="w-full h-16 bg-[#B4F22E] hover:bg-[#a3db29] text-black font-bold text-xl rounded-full transition-all hover:scale-[1.02]" 
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
