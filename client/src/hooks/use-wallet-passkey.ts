import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { webAuthnService } from "@/lib/webauthn";
import { decryptVaultWithRawKey, PasskeyVault } from "@/lib/webCrypto";

export function useWalletPasskey() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [hasWalletPasskey, setHasWalletPasskey] = useState(false);

  useEffect(() => {
    webAuthnService.isWalletPRFSupported().then(setIsSupported);
  }, []);

  useEffect(() => {
    if (user) {
      const meta = user.user_metadata;
      setHasWalletPasskey(
        !!(meta?.wallet_passkey_credential_id && meta?.wallet_passkey_prf_salt && meta?.wallet_passkey_vault)
      );
    } else {
      setHasWalletPasskey(false);
    }
  }, [user]);

  /**
   * Prompts biometrics and returns the decrypted mnemonic.
   * Throws if the user cancels, passkey is not set up, or decryption fails.
   */
  const getMnemonicWithPasskey = useCallback(async (): Promise<string> => {
    if (!user) throw new Error("Not authenticated");

    const meta = user.user_metadata;
    if (!meta?.wallet_passkey_credential_id || !meta?.wallet_passkey_prf_salt || !meta?.wallet_passkey_vault) {
      throw new Error("No wallet passkey configured");
    }

    const rawKey = await webAuthnService.getWalletDecryptionKey(
      meta.wallet_passkey_credential_id as string,
      meta.wallet_passkey_prf_salt as string
    );
    if (!rawKey) throw new Error("Passkey authentication was cancelled or failed");

    return decryptVaultWithRawKey(meta.wallet_passkey_vault as PasskeyVault, rawKey);
  }, [user]);

  return { isSupported, hasWalletPasskey, getMnemonicWithPasskey };
}
