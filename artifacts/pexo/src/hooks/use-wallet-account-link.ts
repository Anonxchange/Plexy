import { useCallback, useEffect, useRef, useState } from "react";
import { useSignMessage } from "wagmi";
import { createSiweMessage } from "viem/siwe";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { useEvmWallet } from "@/lib/evm-wallet-provider";

type WalletLinkStatus = "loading" | "error" | "unlinked" | "disconnected" | "linked" | "different";

export function useWalletAccountLink() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const currentUserIdRef = useRef<string | null>(userId);
  currentUserIdRef.current = userId;
  const wallet = useEvmWallet();
  const { signMessageAsync } = useSignMessage();
  const [linkedAddress, setLinkedAddress] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLinkedWallet = useCallback(async () => {
    if (!user?.id) {
      setLinkedAddress(null);
      setLoadedUserId(null);
      setError(null);
      setLoading(false);
      return;
    }

    const requestedUserId = user.id;
    setLoading(true);
    setError(null);
    setLinkedAddress(null);
    setLoadedUserId(null);
    try {
      const supabase = await getSupabase();
      const { data, error: queryError } = await supabase
        .from("user_wallets")
        .select("wallet_address,is_primary")
        .eq("user_id", requestedUserId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);
      if (queryError) throw queryError;
      if (currentUserIdRef.current !== requestedUserId) return;
      setLinkedAddress(data?.[0]?.wallet_address?.toLowerCase() ?? null);
      setLoadedUserId(requestedUserId);
    } catch (reason) {
      if (currentUserIdRef.current !== requestedUserId) return;
      setError(reason instanceof Error ? reason.message : "Could not load the linked wallet.");
    } finally {
      if (currentUserIdRef.current === requestedUserId) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadLinkedWallet();
  }, [loadLinkedWallet]);

  const status: WalletLinkStatus = !user?.id
    ? "unlinked"
    : loading || loadedUserId !== user.id
      ? "loading"
      : error
        ? "error"
        : !linkedAddress
          ? "unlinked"
          : !wallet.isConnected || !wallet.address
            ? "disconnected"
            : linkedAddress === wallet.address.toLowerCase()
              ? "linked"
              : "different";

  const linkCurrentWallet = useCallback(async () => {
    if (!user?.id || !wallet.address || !wallet.isConnected) {
      throw new Error("Connect the wallet you want to link first.");
    }
    setLinking(true);
    setError(null);
    try {
      const supabase = await getSupabase();
      const { data: nonceData, error: nonceError } =
        await supabase.functions.invoke("link-wallet", {
          body: {
            action: "nonce",
            purpose: "link",
            walletAddress: wallet.address,
          },
        });
      if (nonceError) throw nonceError;
      const nonce = (nonceData as { nonce?: string } | null)?.nonce;
      if (!nonce) throw new Error("Could not start secure wallet linking. Request a new challenge.");

      const origin = window.location.origin;
      const issuedAt = new Date();
      const message = createSiweMessage({
        address: wallet.address,
        chainId: wallet.chainId ?? 1,
        domain: window.location.host,
        nonce,
        uri: `${origin}/`,
        version: "1",
        statement: "Link this wallet to your Pexly account. This message does not authorize a transaction.",
        issuedAt,
        expirationTime: new Date(issuedAt.getTime() + 4 * 60_000),
      });
      const signature = await signMessageAsync({
        account: wallet.address,
        message,
      });

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || authData.user?.id !== user.id) {
        throw new Error("Your Pexly session changed. Sign in again and retry.");
      }

      const { error: functionError } = await supabase.functions.invoke("link-wallet", {
        body: {
          action: "link",
          walletAddress: wallet.address,
          message,
          signature,
        },
      });
      if (functionError) throw functionError;
      await loadLinkedWallet();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not verify this wallet.";
      setError(message);
      throw reason;
    } finally {
      setLinking(false);
    }
  }, [loadLinkedWallet, signMessageAsync, user, wallet.address, wallet.chainId, wallet.isConnected]);

  return {
    linkedAddress,
    status,
    loading,
    linking,
    error,
    linkCurrentWallet,
    refresh: loadLinkedWallet,
  };
}
