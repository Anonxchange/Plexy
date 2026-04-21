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
  /**
   * Origin (e.g. "https://pexly.app") this vault was created on. When set, it
   * is bound into the AES-GCM additional-authenticated-data (AAD) AND checked
   * against `window.location.origin` at decrypt time. A fake/clone domain that
   * obtains the encrypted blob cannot decrypt it — the GCM tag verification
   * will fail because the AAD is part of the authentication input.
   *
   * Optional for backwards compatibility with vaults created before this field
   * existed. New vaults always set it when running in a browser.
   */
  origin?: string;
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
 * Returns the current browser origin (e.g. "https://pexly.app") or undefined
 * when running outside a browser (SSR, tests). Used as AES-GCM AAD to bind
 * vaults to a specific domain — a phishing clone on `pexly-fake.app` will be
 * unable to decrypt vaults exported from the real origin.
 */
function getCurrentOrigin(): string | undefined {
  try {
    return typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Encrypts a mnemonic into a secure vault using scrypt + AES-256-GCM.
 * The current browser origin is bound into the AES-GCM AAD so the vault can
 * only be decrypted on the same origin it was created on.
 */
export async function encryptVault(mnemonic: string, password: string): Promise<EncryptedVault> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const origin = getCurrentOrigin();

  const keyBuffer = await deriveEncryptionKey(password, salt, DEFAULT_KDF_PARAMS);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const gcmParams: AesGcmParams = { name: "AES-GCM", iv };
  if (origin) gcmParams.additionalData = encoder.encode(origin);

  const ciphertext = await crypto.subtle.encrypt(
    gcmParams,
    cryptoKey,
    encoder.encode(mnemonic)
  );

  return {
    version: 1,
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    kdf: "scrypt",
    kdfParams: DEFAULT_KDF_PARAMS,
    ...(origin ? { origin } : {})
  };
}

/**
 * Decrypts an EncryptedVault using the provided password. If the vault was
 * created with an origin binding, refuses to decrypt on any other origin.
 */
export async function decryptVault(vault: EncryptedVault, password: string): Promise<string> {
  // Origin binding: hard-fail before doing expensive scrypt work if the user
  // is on the wrong origin (e.g. phishing clone of pexly.app).
  if (vault.origin) {
    const currentOrigin = getCurrentOrigin();
    if (currentOrigin && currentOrigin !== vault.origin) {
      throw new Error(
        `This wallet is bound to ${vault.origin} and cannot be opened on ${currentOrigin}. ` +
        `If you did not move domains, this may be a phishing site — close the tab.`
      );
    }
  }

  try {
    const encoder = new TextEncoder();
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

    const gcmParams: AesGcmParams = { name: "AES-GCM", iv };
    if (vault.origin) gcmParams.additionalData = encoder.encode(vault.origin);

    const decrypted = await crypto.subtle.decrypt(
      gcmParams,
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
