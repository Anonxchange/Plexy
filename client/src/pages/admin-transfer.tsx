
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowRightLeft, Search, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const SUPPORTED_ASSETS = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "TRX", name: "Tron" },
];

export default function AdminTransferPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const [targetUserId, setTargetUserId] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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
          } else {
            localStorage.removeItem('admin_session');
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

      setIsAdmin(false);
      setCheckingSession(false);
    };

    checkAdminAccess();
  }, [user]);

  const searchUser = async () => {
    if (!targetUsername) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username')
        .ilike('username', targetUsername)
        .single();
      
      if (error) throw error;
      if (data) {
        setTargetUserId(data.id);
        alert(`User found: ${data.username} (${data.id})`);
      }
    } catch (err: any) {
      alert("User not found or error: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const transferMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-transfer', {
        body: {
          user_id: targetUserId,
          crypto_symbol: selectedAsset,
          amount: parseFloat(amount),
          notes: notes
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      alert(`Transfer successful! ${data.message}`);
      setAmount("");
      setNotes("");
    },
    onError: (error: any) => {
      alert(`Transfer failed: ${error.message}`);
    }
  });

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) {
      alert("Please select a target user first");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (confirm(`Confirm transfer of ${amount} ${selectedAsset} to user ${targetUserId}?`)) {
      transferMutation.mutate();
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Checking access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Fund Transfer</h1>
        <p className="text-muted-foreground">
          Move funds from master wallet to user custodial wallets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Details
          </CardTitle>
          <CardDescription>
            Enter the recipient details and amount to transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransfer} className="space-y-6">
            <div className="space-y-4 border p-4 rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="username">Recipient Username</Label>
                <div className="flex gap-2">
                  <Input
                    id="username"
                    placeholder="Enter username"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={searchUser} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">Recipient User ID</Label>
                <Input
                  id="userId"
                  placeholder="User ID (auto-filled on search)"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset">Asset</Label>
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger id="asset">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_ASSETS.map((asset) => (
                      <SelectItem key={asset.symbol} value={asset.symbol}>
                        {asset.name} ({asset.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Internal memo for this transfer"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={transferMutation.isPending}>
              {transferMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Transfer...
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
