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
import { useToast } from "@/hooks/use-toast";
import { webAuthnService, type WebAuthnCredential } from "@/lib/webauthn";
import { Fingerprint, Trash2, Plus, Smartphone, Loader2, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface PasskeySetupProps {
  userId: string;
  userEmail: string;
}

export function PasskeySetup({ userId, userEmail }: PasskeySetupProps) {
  const [passkeys, setPasskeys] = useState<WebAuthnCredential[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const [checking, setChecking] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkSupport();
    loadPasskeys();
  }, [userId]);

  const checkSupport = async () => {
    setChecking(true);
    try {
      const isSupported = await webAuthnService.isPlatformAuthenticatorAvailable();
      setSupported(isSupported);
    } catch (error) {
      setSupported(false);
    } finally {
      setChecking(false);
    }
  };

  const loadPasskeys = async () => {
    try {
      const creds = await webAuthnService.listPasskeys(userId);
      setPasskeys(creds);
    } catch (error) {
      console.error('Error loading passkeys:', error);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await webAuthnService.registerPasskey(userId, userEmail);
      
      toast({
        title: "Passkey Added",
        description: "Your passkey has been registered successfully. You can now use it to sign in.",
      });

      setShowAddDialog(false);
      loadPasskeys();
    } catch (error) {
      console.error('Error registering passkey:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register passkey",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (credentialId: string) => {
    setDeletingId(credentialId);
    try {
      await webAuthnService.removeCredential(credentialId);
      
      toast({
        title: "Passkey Removed",
        description: "The passkey has been removed from your account",
      });

      loadPasskeys();
    } catch (error) {
      console.error('Error removing passkey:', error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove passkey",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Passkeys
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

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Passkeys
          </CardTitle>
          <CardDescription>
            Your device or browser does not support passkeys. Try using a modern browser on a device with biometric authentication.
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
                Passkeys
              </CardTitle>
              <CardDescription>
                Use your fingerprint, face, or screen lock for passwordless sign-in
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Passkey
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {passkeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No passkeys registered</p>
              <p className="text-sm mt-2">Add a passkey for fast, secure sign-in without a password</p>
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <div key={passkey.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Fingerprint className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{passkey.device_name}</p>
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Added {formatDistanceToNow(new Date(passkey.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(passkey.id)}
                    disabled={deletingId === passkey.id}
                  >
                    {deletingId === passkey.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Passkey</DialogTitle>
            <DialogDescription>
              Create a passkey to sign in using your device's built-in security
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="p-3 bg-primary/10 rounded-full">
                <Fingerprint className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">Passwordless Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Use fingerprint, face recognition, or your device's screen lock
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <p className="font-medium mb-1">What are passkeys?</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Passkeys replace passwords with biometric authentication</li>
                    <li>They're stored securely on your device</li>
                    <li>Resistant to phishing and password theft</li>
                    <li>Sync across your devices with iCloud Keychain or Google Password Manager</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Create Passkey
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
