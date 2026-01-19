import { useState, useEffect } from "react";
import { FundCard } from '@coinbase/onchainkit/fund';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useWalletData } from "@/hooks/use-wallet-data";
import { createCDPSession } from "@/lib/wallet-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FundStaging() {
  const { user } = useAuth();
  const { walletBalances, isLoading: isWalletLoading } = useWalletData();
  const [sessionToken, setSessionToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState("");

  // Find Base wallet address
  const baseWallet = walletBalances?.find(w => 
    w.crypto_symbol === 'BASE' || 
    (w.crypto_symbol === 'ETH' && w.deposit_address?.startsWith('0x')) ||
    w.isNonCustodial && w.deposit_address?.startsWith('0x')
  );
  
  const userAddress = manualAddress || baseWallet?.deposit_address;

  const fetchToken = async () => {
    if (!userAddress) {
      console.warn("No user address found for CDP session");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching CDP token for address:", userAddress);
      // Assets supported by OnchainKit Fund for simple onramp
      const assets = ["ETH", "USDC"];
      // Using the CDP Create Session endpoint directly
      const response = await fetch('https://api.cdp.coinbase.com/v1/onramp/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_CDP_API_KEY}`
        },
        body: JSON.stringify({
          address: userAddress,
          assets: assets,
          projectId: import.meta.env.VITE_CDP_PROJECT_ID
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || errData.message || 'Failed to create session');
      }

      const data = await response.json();
      const token = data.session_token || data.token;
      console.log("CDP token received:", token ? "Yes" : "No");
      setSessionToken(token);
    } catch (err) {
      console.error("Failed to fetch CDP token:", err);
      setError(err instanceof Error ? err.message : "Failed to generate funding session");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userAddress && !sessionToken && !isLoading && !error) {
      fetchToken();
    }
  }, [userAddress, sessionToken, isLoading, error]);

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Onchain Onramp Staging</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            This page uses the Coinbase CDP API to generate a session token for the OnchainKit FundCard.
          </div>

          <div className="space-y-2 pb-4 border-b">
            <label className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Base Wallet Address (Manual Override)
            </label>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter 0x address..." 
                value={manualAddress}
                onChange={(e) => {
                  setManualAddress(e.target.value);
                  setSessionToken(""); // Reset token when address changes
                  setError(null);
                }}
                className="font-mono text-sm"
              />
              <Button 
                onClick={fetchToken}
                disabled={!manualAddress || isLoading}
                size="sm"
              >
                {isLoading ? "Loading..." : "Apply"}
              </Button>
            </div>
            {manualAddress && !manualAddress.startsWith('0x') && (
              <p className="text-[10px] text-destructive">Address should start with 0x</p>
            )}
          </div>

          {isWalletLoading || isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : sessionToken ? (
            <div className="flex justify-center border rounded-lg p-6 bg-slate-50">
              <FundCard sessionToken={sessionToken} />
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                {!userAddress 
                  ? "No Base wallet address found. Please enter one above or ensure your wallet is initialized." 
                  : "Initializing session..."}
              </p>
            </div>
          )}

          <div className="mt-8 p-4 bg-muted rounded-md overflow-hidden">
            <h3 className="font-semibold mb-2 text-sm">Debug Info:</h3>
            <div className="grid grid-cols-1 gap-2 text-[10px] font-mono">
              <p>Current Address: {userAddress || "Not found"}</p>
              <p>Detection Source: {manualAddress ? "Manual Input" : (baseWallet ? "Auto-detected" : "None")}</p>
              <p className="truncate">Session Token: {sessionToken || "Waiting..."}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
