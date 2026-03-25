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
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { webAuthnService } from "@/lib/webauthn";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";
import { encryptVaultWithRawKey } from "@/lib/webCrypto";
import { useWalletPasskey } from "@/hooks/use-wallet-passkey";
import {
  Fingerprint,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WalletPasskeySetup() {
  const { user } = useAuth();
  const { isSupported, hasWalletPasskey } = useWalletPasskey();
  const { toast } = useToast();

  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    webAuthnService.isWalletPRFSupported().then(() => setChecking(false));
  }, []);

  const handleSetup = async () => {
    if (!user || !password) return;
    setLoading(true);
    try {
      const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
      if (wallets.length === 0) throw new Error("No wallet found. Create one in your Wallet first.");

      const wallet = wallets[0];
      const vaultKey = wallet.encryptedMnemonic ?? wallet.encryptedPrivateKey;
      if (!vaultKey) throw new Error("Wallet data not found.");

      const mnemonic = await nonCustodialWalletManager.decryptPrivateKey(vaultKey, password);

      const result = await webAuthnService.registerWalletPasskey(user.id, user.email ?? user.id);

      if (!result) {
        throw new Error(
          "Your device or browser does not support the PRF extension required for wallet passkeys. " +
          "Try Chrome 116+ or Safari 17.4+."
        );
      }

      const { credentialId, prfSalt } = result;

      const rawKey = await webAuthnService.getWalletDecryptionKey(credentialId, prfSalt);
      if (!rawKey) throw new Error("Could not retrieve passkey key. Please try again.");

      const passkeyVault = await encryptVaultWithRawKey(mnemonic, rawKey);

      const { error } = await supabase.auth.updateUser({
        data: {
          wallet_passkey_credential_id: credentialId,
          wallet_passkey_prf_salt: prfSalt,
          wallet_passkey_vault: passkeyVault,
        },
      });
      if (error) throw new Error("Passkey created but failed to save: " + error.message);

      setShowSetupDialog(false);
      setPassword("");
      toast({
        title: "Wallet passkey set up",
        description: "You can now unlock your wallet with biometrics.",
      });
    } catch (err: any) {
      toast({
        title: "Setup failed",
        description: err.message ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          wallet_passkey_credential_id: null,
          wallet_passkey_prf_salt: null,
          wallet_passkey_vault: null,
        },
      });
      if (error) throw error;
      setShowRemoveDialog(false);
      toast({
        title: "Wallet passkey removed",
        description: "You will need to type your password to unlock your wallet.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to remove",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Wallet Passkey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Wallet Passkey
          </CardTitle>
          <CardDescription>
            Your device or browser does not support passkeys. Try a modern browser with biometric authentication.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Wallet Passkey
              </CardTitle>
              <CardDescription>
                Use Face ID, fingerprint, or your device lock to sign transactions — no password typing required
              </CardDescription>
            </div>
            {hasWalletPasskey ? (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setShowRemoveDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Remove
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowSetupDialog(true)}>
                <Fingerprint className="h-4 w-4 mr-1.5" />
                Set Up
              </Button>
            )}
          </div>
        </CardHeader>
        {hasWalletPasskey && (
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Passkey active</p>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deposits and wallet signing use biometrics — password is still available as a fallback
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Setup dialog */}
      <Dialog open={showSetupDialog} onOpenChange={(v) => { setShowSetupDialog(v); if (!v) setPassword(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Up Wallet Passkey</DialogTitle>
            <DialogDescription>
              Enter your wallet password once to verify ownership, then your device will create a passkey.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-medium">How it works</p>
                <p>Your password unlocks the vault once. A passkey is then created and the vault is re-sealed with it. After setup, your password is no longer needed — biometrics take over.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Wallet password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your wallet password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !loading && password && handleSetup()}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSetupDialog(false); setPassword(""); }}>
              Cancel
            </Button>
            <Button onClick={handleSetup} disabled={!password || loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting up…</>
              ) : (
                <><Fingerprint className="h-4 w-4 mr-2" />Create Passkey</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Wallet Passkey</DialogTitle>
            <DialogDescription>
              You will need to type your wallet password every time you sign transactions. You can always set up a new passkey later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Removing…</> : "Remove Passkey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
