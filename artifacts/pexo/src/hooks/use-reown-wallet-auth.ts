import { useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { useEvmWallet } from "@/lib/wallet-provider";

type WalletAuthResult =
  | { status: "connection-opened" }
  | { status: "signed-in"; user: User };

/**
 * Uses Reown for wallet connection/signing and Supabase's native SIWE verifier
 * for authentication. Pexly never receives or stores a wallet private key.
 */
export function useReownWalletAuth() {
  const wallet = useEvmWallet();

  const signIn = useCallback(
    async (captchaToken: string | null): Promise<WalletAuthResult> => {
      if (!wallet.configured) {
        throw new Error("Wallet connection is not configured. Add VITE_REOWN_PROJECT_ID to the app environment.");
      }

      if (!wallet.isConnected || !wallet.address) {
        wallet.openConnect();
        return { status: "connection-opened" };
      }

      const supabase = await getSupabase();
      const origin = window.location.origin;
      const uri = `${origin}/`;
      const { data: nonceData, error: nonceError } =
        await supabase.functions.invoke("link-wallet", {
          body: {
            action: "nonce",
            purpose: "sign-in",
            walletAddress: wallet.address,
          },
        });
      if (nonceError) throw nonceError;
      const nonce = (nonceData as { nonce?: string } | null)?.nonce;
      if (!nonce) throw new Error("Could not start secure wallet sign-in. Request a new challenge.");

      const issuedAt = new Date();
      const { createSiweMessage } = await import("viem/siwe");
      const message = createSiweMessage({
        address: wallet.address,
        chainId: wallet.chainId ?? 1,
        domain: window.location.host,
        nonce,
        uri,
        version: "1",
        statement: "Sign in to Pexly. This message does not authorize a transaction.",
        issuedAt,
        expirationTime: new Date(issuedAt.getTime() + 4 * 60_000),
      });
      const signature = await wallet.signMessage(message);

      const { data, error } = await supabase.functions.invoke("link-wallet", {
        body: {
          action: "sign-in",
          walletAddress: wallet.address,
          message,
          signature,
          captchaToken: captchaToken ?? undefined,
        },
      });
      if (error) throw error;
      const remoteSession = (data as {
        session?: { access_token?: string; refresh_token?: string };
      } | null)?.session;
      if (!remoteSession?.access_token || !remoteSession.refresh_token) {
        throw new Error("Wallet sign-in did not return an active Supabase session.");
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: remoteSession.access_token,
        refresh_token: remoteSession.refresh_token,
      });
      if (sessionError) throw sessionError;
      if (!sessionData.user || !sessionData.session) {
        throw new Error("Wallet sign-in did not create an active Supabase session.");
      }
      return { status: "signed-in", user: sessionData.user };
    },
    [wallet],
  );

  return { signIn, isConnected: wallet.isConnected, address: wallet.address };
}
