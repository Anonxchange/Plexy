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
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

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
      // Generate the master wallet (Ethereum) which auto-generates sidechains (Optimism, Polygon, etc.)
      // and stablecoin entries (USDT, USDC).
      const { mnemonicPhrase } = await nonCustodialWalletManager.generateNonCustodialWallet(
        "ethereum",
        password,
        null, // Supabase client could be passed here if needed for cloud sync
        userId
      );

      // Also generate Bitcoin as it's a different derivation path
      await nonCustodialWalletManager.generateNonCustodialWallet(
        "Bitcoin (SegWit)",
        password,
        null,
        userId,
        mnemonicPhrase
      );

      // Generate Solana
      await nonCustodialWalletManager.generateNonCustodialWallet(
        "Solana",
        password,
        null,
        userId,
        mnemonicPhrase
      );

      // Generate Tron
      await nonCustodialWalletManager.generateNonCustodialWallet(
        "Tron (TRC-20)",
        password,
        null,
        userId,
        mnemonicPhrase
      );

      // Generate XRP
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
    <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-6">
        {step === "intro" && (
          <div className="space-y-6 text-center py-4">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <ShieldCheck className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Secure Your Wallet</h2>
              <p className="text-muted-foreground text-sm">
                Pexly is a non-custodial wallet. This means you are in full control of your funds.
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-900 text-left space-y-3">
              <div className="flex gap-3 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-medium leading-relaxed">
                  We do not have access to your password. If you lose it, we cannot reset it for you.
                </p>
              </div>
            </div>
            <Button className="w-full h-12 font-bold text-base" onClick={() => setStep("password")}>
              Get Started
            </Button>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Create Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">New Password (min. 8 chars)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter password"
                    className="pl-10 h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    className="pl-10 h-12"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button className="w-full h-12 font-bold text-base" onClick={handleCreatePassword}>
                  Create Wallet
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Generating Your Wallet</h2>
              <p className="text-sm text-muted-foreground">
                We are creating your unique addresses for Bitcoin, Ethereum, Polygon, and more...
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-6 text-center py-4">
            <div className="flex justify-center">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Success!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed px-4">
                Your secure wallet has been generated. All addresses for supported chains are now ready for use.
              </p>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl text-left border border-border/50">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">READY NETWORKS</p>
              <div className="flex flex-wrap gap-2">
                {["BTC", "ETH", "BNB", "TRX", "SOL", "XRP", "USDT", "USDC"].map((s) => (
                  <span key={s} className="px-2 py-1 bg-background border rounded text-[10px] font-bold">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <Button className="w-full h-12 font-bold text-base" onClick={handleFinish}>
              Go to Wallet
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
