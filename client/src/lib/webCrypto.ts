import { deriveEncryptionKey, DEFAULT_KDF_PARAMS, KdfParams } from "./keyDerivation";

const IV_LENGTH = 12;
const SALT_LENGTH = 16;

export interface EncryptedVault {
  version: number;
  ciphertext: string;
  iv: string;
  salt: string;
  kdf: "scrypt";
  kdfParams: KdfParams;
}

/**
 * Passkey vault — encrypted with a raw 32-byte key derived from a WebAuthn PRF assertion.
 * No salt/KDF needed because the PRF output is already high-entropy.
 */
export interface PasskeyVault {
  version: 2;
  ciphertext: string;
  iv: string;
}

/**
 * Encrypts a mnemonic into a secure vault using scrypt + AES-256-GCM.
 */
export async function encryptVault(mnemonic: string, password: string): Promise<EncryptedVault> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const keyBuffer = await deriveEncryptionKey(password, salt, DEFAULT_KDF_PARAMS);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encoder.encode(mnemonic)
  );

  return {
    version: 1,
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    kdf: "scrypt",
    kdfParams: DEFAULT_KDF_PARAMS
  };
}

/**
 * Decrypts an EncryptedVault using the provided password.
 */
export async function decryptVault(vault: EncryptedVault, password: string): Promise<string> {
  try {
    const salt = new Uint8Array(atob(vault.salt).split("").map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(vault.iv).split("").map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(vault.ciphertext).split("").map(c => c.charCodeAt(0)));

    const keyBuffer = await deriveEncryptionKey(password, salt, vault.kdfParams);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("Decryption failed:", err);
    throw new Error("Invalid wallet password or corrupted data");
  }
}

/**
 * Encrypts a mnemonic using a raw 32-byte key (from WebAuthn PRF).
 * Skips scrypt — the PRF output is already cryptographically strong.
 */
export async function encryptVaultWithRawKey(data: string, rawKey: ArrayBuffer): Promise<PasskeyVault> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const cryptoKey = await crypto.subtle.importKey(
    "raw", rawKey, { name: "AES-GCM" }, false, ["encrypt"]
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    new TextEncoder().encode(data)
  );
  return {
    version: 2,
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Decrypts a PasskeyVault using a raw 32-byte key (from WebAuthn PRF).
 */
export async function decryptVaultWithRawKey(vault: PasskeyVault, rawKey: ArrayBuffer): Promise<string> {
  try {
    const iv = Uint8Array.from(atob(vault.iv), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(vault.ciphertext), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Passkey vault decryption failed. Your passkey may not match.");
  }
}

/**
 * Returns true if the vault value is in the legacy string format.
 * Legacy vaults used a deterministic salt (`pexly_v1_vault_${userId}`) which
 * is a cryptographic weakness — salt must be random. Users still on the legacy
 * format should be migrated to EncryptedVault (random salt + AES-256-GCM) as
 * soon as their password is available. Call migrateLegacyVault() and persist
 * the result to replace the legacy blob.
 */
export function isLegacyVault(vault: any): boolean {
  return typeof vault === "string";
}

/**
 * Migration tool for legacy PBKDF2 or non-vault formats.
 *
 * SECURITY NOTE — deterministic salt:
 * The legacy format derived the scrypt salt from `pexly_v1_vault_${userId}`.
 * Because userId is not secret, a targeted attacker with access to the
 * ciphertext can precompute a dictionary attack without the random-salt
 * protection that modern vaults have. This function decrypts the legacy blob
 * (using the original deterministic salt to match how it was encrypted) and
 * immediately re-encrypts it with a random salt via encryptVault(). Call this
 * as soon as the user's password is known and persist the upgraded vault.
 */
export async function migrateLegacyVault(legacyData: any, password: string, userId: string): Promise<EncryptedVault> {
  let mnemonic: string;

  if (typeof legacyData === "string") {
    try {
      const combined = new Uint8Array(atob(legacyData).split("").map(c => c.charCodeAt(0)));
      const saltStr = `pexly_v1_vault_${userId}`;
      const encoder = new TextEncoder();
      const saltBuffer = encoder.encode(saltStr);

      const keyBuffer = await deriveEncryptionKey(password, saltBuffer, DEFAULT_KDF_PARAMS);

      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["decrypt"]);
      const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ciphertext);
      mnemonic = new TextDecoder().decode(decrypted);
    } catch (e) {
      throw new Error("Could not migrate legacy vault: Decryption failed");
    }
  } else if (legacyData.version === 1) {
    return legacyData;
  } else {
    throw new Error("Unknown vault format");
  }

  return encryptVault(mnemonic, password);
}
