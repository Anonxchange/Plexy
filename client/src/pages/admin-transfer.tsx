import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Send, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";

export default function AdminTransferPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Form state
  const [userId, setUserId] = useState("");
  const [cryptoSymbol, setCryptoSymbol] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");

  useEffect(() => {
    const checkAdminAccess = async () => {
      const adminSession = localStorage.getItem('admin_session');
      if (adminSession) {
        try {
          const session = JSON.parse(adminSession);
          if (session.expiresAt > Date.now()) {
            setIsAdmin(true);
            setCheckingSession(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem('admin_session');
        }
      }

      if (user?.id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin) {
          setIsAdmin(true);
          setCheckingSession(false);
          return;
        }
      }

      setCheckingSession(false);
    };

    checkAdminAccess();
  }, [user]);

  const transferMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId || null,
          crypto_symbol: cryptoSymbol.toUpperCase(),
          amount: parseFloat(amount),
          to_address: toAddress,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Transfer failed");
      return result;
    },
    onSuccess: (data) => {
      alert(`Transfer successful! TX Hash: ${data.tx_hash}`);
      setAmount("");
      setToAddress("");
    },
    onError: (error: any) => {
      alert(`Transfer failed: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cryptoSymbol || !amount || !toAddress) {
      alert("Please fill in all required fields");
      return;
    }
    transferMutation.mutate();
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Admin privileges are required to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/admin")} className="w-full">
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Fund Transfer</h1>
        <p className="text-muted-foreground">
          Move funds from custodian wallet to on-chain address
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Transfer Details
          </CardTitle>
          <CardDescription>
            This will initiate an on-chain transfer and optionally update user internal balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">Recipient User ID (Optional)</Label>
              <Input
                id="userId"
                placeholder="User UUID (to update internal balance)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cryptoSymbol">Asset Symbol</Label>
                <Input
                  id="cryptoSymbol"
                  placeholder="BTC, ETH, USDT..."
                  value={cryptoSymbol}
                  onChange={(e) => setCryptoSymbol(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toAddress">Destination On-Chain Address</Label>
              <Input
                id="toAddress"
                placeholder="0x... or bc1..."
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                required
              />
            </div>

            <Alert className="bg-primary/5 border-primary/20">
              <AlertDescription className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                This action will call the <code className="bg-primary/10 px-1 rounded">process-withdrawal</code> function.
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={transferMutation.isPending}
            >
              {transferMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Execute Transfer"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
