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
    (w.isNonCustodial && w.deposit_address?.startsWith('0x'))
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
      const token = await createCDPSession(userAddress, assets);
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
