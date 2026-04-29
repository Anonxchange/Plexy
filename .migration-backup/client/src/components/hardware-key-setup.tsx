
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
import { webAuthnService, type WebAuthnCredential } from "@/lib/webauthn";
import { Shield, Key, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface HardwareKeySetupProps {
  userId: string;
}

export function HardwareKeySetup({ userId }: HardwareKeySetupProps) {
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSupport();
    loadCredentials();
  }, [userId]);

  const checkSupport = async () => {
    const isSupported = await webAuthnService.isSupported();
    setSupported(isSupported);
  };

  const loadCredentials = async () => {
    const creds = await webAuthnService.listHardwareKeys(userId);
    setCredentials(creds);
  };

  const handleRegister = async () => {
    if (!deviceName.trim()) {
      toast({
        title: "Device name required",
        description: "Please enter a name for your security key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await webAuthnService.register(userId, deviceName);
      
      toast({
        title: "Security Key Added",
        description: "Your hardware security key has been registered successfully",
      });

      setShowAddDialog(false);
      setDeviceName("");
      loadCredentials();
    } catch (error) {
      console.error('Error registering security key:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register security key",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (credentialId: string) => {
    try {
      await webAuthnService.removeCredential(credentialId);
      
      toast({
        title: "Security Key Removed",
        description: "The security key has been removed from your account",
      });

      loadCredentials();
    } catch (error) {
      console.error('Error removing security key:', error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove security key",
        variant: "destructive",
      });
    }
  };

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Hardware Security Keys
          </CardTitle>
          <CardDescription>
            Your browser does not support hardware security keys (WebAuthn/FIDO2)
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
                <Key className="h-5 w-5" />
                Hardware Security Keys
              </CardTitle>
              <CardDescription>
                Use YubiKey, Google Titan, or other FIDO2 devices for enhanced security
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hardware security keys registered</p>
              <p className="text-sm mt-2">Add a security key for maximum account protection</p>
            </div>
          ) : (
            <div className="space-y-3">
              {credentials.map((cred) => (
                <div key={cred.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{cred.device_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(cred.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(cred.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
            <DialogTitle>Add Hardware Security Key</DialogTitle>
            <DialogDescription>
              Insert your security key and follow the prompts to register it
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name</Label>
              <Input
                id="device-name"
                placeholder="e.g., YubiKey 5C"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <Shield className="h-4 w-4 inline mr-2" />
                When prompted, touch your security key to complete registration
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={loading}>
              {loading ? "Registering..." : "Register Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
