import { useState, useEffect } from "react";
import { FundCard } from '@coinbase/onchainkit/fund';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useWalletData } from "@/hooks/use-wallet-data";
import { createCDPSession } from "@/lib/wallet-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function FundStaging() {
  const { user } = useAuth();
  const { walletBalances, isLoading: isWalletLoading } = useWalletData();
  const [sessionToken, setSessionToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find Base wallet address
  const baseWallet = walletBalances?.find(w => w.crypto_symbol === 'BASE' || w.crypto_symbol === 'ETH' && w.deposit_address?.startsWith('0x'));
  const userAddress = baseWallet?.deposit_address;

  useEffect(() => {
    async function fetchToken() {
      if (!userAddress) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // Assets supported by OnchainKit Fund for simple onramp
        const assets = ["ETH", "USDC"];
        const token = await createCDPSession(userAddress, assets);
        setSessionToken(token);
      } catch (err) {
        console.error("Failed to fetch CDP token:", err);
        setError(err instanceof Error ? err.message : "Failed to generate funding session");
      } finally {
        setIsLoading(false);
      }
    }

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
                  ? "No Base wallet address found. Please ensure your non-custodial wallet is initialized." 
                  : "Initializing session..."}
              </p>
            </div>
          )}

          <div className="mt-8 p-4 bg-muted rounded-md overflow-hidden">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
              <p>User Address: {userAddress || "Not found"}</p>
              <p className="truncate">Session Token: {sessionToken || "Waiting..."}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
