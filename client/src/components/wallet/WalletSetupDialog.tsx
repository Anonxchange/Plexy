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
      // Make it compulsory by not allowing close unless success
      if (step === "success") {
        onOpenChange(open);
      }
    }}>
      <DialogContent className="max-w-[95vw] sm:max-w-[800px] p-0 overflow-hidden bg-[#0A0A0A] border-none shadow-2xl rounded-2xl">
        <div className="flex flex-col md:flex-row min-h-[500px]">
          {/* SVG Illustration Section - Top on mobile, Right on desktop */}
          <div className="w-full md:w-1/2 order-1 md:order-2 bg-gradient-to-br from-[#B4F22E]/20 to-transparent flex items-center justify-center p-8 md:p-12">
            <img 
              src="/src/assets/svg-image-16.svg" 
              alt="Security Illustration" 
              className="w-full max-w-[280px] md:max-w-full drop-shadow-[0_0_30px_rgba(180,242,46,0.3)]"
            />
          </div>

          {/* Form Content Section - Bottom on mobile, Left on desktop */}
          <div className="w-full md:w-1/2 order-2 md:order-1 p-8 md:p-12 flex flex-col justify-center bg-[#0A0A0A]">
            {step === "intro" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold tracking-tight text-white">Password Protected</h2>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Secure your digital assets with Pexly's non-custodial wallet. You are in full control of your private keys and funds.
                  </p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    Important: Pexly does not store your password. If lost, your funds cannot be recovered.
                  </p>
                </div>
                <Button 
                  className="w-full h-14 bg-[#B4F22E] hover:bg-[#a3db29] text-black font-bold text-lg rounded-full transition-all hover:scale-[1.02]" 
                  onClick={() => setStep("password")}
                >
                  Enter Now
                </Button>
              </div>
            )}

            {step === "password" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">Security Credentials</h2>
                  <p className="text-gray-400">Establish your master access password.</p>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#B4F22E] transition-colors" />
                      <Input
                        type="password"
                        placeholder="Enter your password."
                        className="bg-transparent border-gray-800 focus:border-[#B4F22E] h-14 pl-12 rounded-full text-white placeholder:text-gray-600 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#B4F22E] transition-colors" />
                      <Input
                        type="password"
                        placeholder="Confirm password."
                        className="bg-transparent border-gray-800 focus:border-[#B4F22E] h-14 pl-12 rounded-full text-white placeholder:text-gray-600 transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full h-14 bg-[#B4F22E] hover:bg-[#a3db29] text-black font-bold text-lg rounded-full mt-4 transition-all hover:scale-[1.02]" 
                    onClick={handleCreatePassword}
                  >
                    Confirm & Secure
                  </Button>
                </div>
              </div>
            )}

            {step === "generating" && (
              <div className="flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#B4F22E]/20 blur-2xl rounded-full"></div>
                  <Loader2 className="w-20 h-20 text-[#B4F22E] animate-spin relative" />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Encrypting</h2>
                  <p className="text-gray-400 max-w-xs">
                    Initializing multi-chain security protocols and generating your unique vault keys...
                  </p>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center md:text-left">
                <div className="flex justify-center md:justify-start">
                  <div className="bg-[#B4F22E]/10 p-5 rounded-full border border-[#B4F22E]/20">
                    <CheckCircle2 className="w-12 h-12 text-[#B4F22E]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-white leading-tight">Vault Secured</h2>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Your non-custodial wallet is now synchronized across all supported networks.
                  </p>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-[#B4F22E] font-bold uppercase tracking-[0.2em] mb-4">Supported Networks</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {["BTC", "ETH", "BNB", "TRX", "SOL", "USDT", "USDC"].map((s) => (
                      <span key={s} className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-[10px] font-bold text-white hover:border-[#B4F22E]/50 transition-colors">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <Button 
                  className="w-full h-14 bg-[#B4F22E] hover:bg-[#a3db29] text-black font-bold text-lg rounded-full transition-all hover:scale-[1.02]" 
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
