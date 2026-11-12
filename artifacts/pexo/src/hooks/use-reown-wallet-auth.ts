import { useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { createSiweMessage } from "viem/siwe";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { useEvmWallet } from "@/lib/evm-wallet-provider";

type WalletAuthResult =
  | { status: "connection-opened" }
  | { status: "signed-in"; user: User };

/**
 * Uses Reown for wallet connection/signing and Supabase's native SIWE verifier
 * for authentication. Pexly never receives or stores a wallet private key.
 */
export function useReownWalletAuth() {
  const wallet = useEvmWallet();
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();

  const signIn = useCallback(
    async (captchaToken: string | null): Promise<WalletAuthResult> => {
      if (!wallet.configured) {
        throw new Error("Wallet connection is not configured. Add VITE_REOWN_PROJECT_ID to the app environment.");
      }

      if (!account.isConnected || !account.address) {
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
            walletAddress: account.address,
          },
        });
      if (nonceError) throw nonceError;
      const nonce = (nonceData as { nonce?: string } | null)?.nonce;
      if (!nonce) throw new Error("Could not start secure wallet sign-in. Request a new challenge.");

      const issuedAt = new Date();
      const message = createSiweMessage({
        address: account.address,
        chainId: account.chainId ?? 1,
        domain: window.location.host,
        nonce,
        uri,
        version: "1",
        statement: "Sign in to Pexly. This message does not authorize a transaction.",
        issuedAt,
        expirationTime: new Date(issuedAt.getTime() + 4 * 60_000),
      });
      const signature = await signMessageAsync({
        account: account.address,
        message,
      });

      const { data, error } = await supabase.functions.invoke("link-wallet", {
        body: {
          action: "sign-in",
          walletAddress: account.address,
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
    [account.address, account.chainId, account.isConnected, signMessageAsync, wallet],
  );

  return { signIn, isConnected: account.isConnected, address: account.address };
}
