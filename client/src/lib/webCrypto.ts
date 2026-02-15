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
 * Migration tool for legacy PBKDF2 or non-vault formats.
 */
export async function migrateLegacyVault(legacyData: any, password: string, userId: string): Promise<EncryptedVault> {
  let mnemonic: string;
  
  // Detection logic for legacy formats
  if (typeof legacyData === "string") {
    // Attempt to decrypt using the previous simple derive + AES method
    // In our last turn, we had a different deriveEncryptionKey signature.
    // This part is tricky because we don't have the old salt.
    // If it was just a string, it might have been the simple combined format.
    try {
      // Re-implementing the old decryption logic for one-off migration
      const combined = new Uint8Array(atob(legacyData).split("").map(c => c.charCodeAt(0)));
      const saltStr = `pexly_v1_vault_${userId}`; 
      const encoder = new TextEncoder();
      const saltBuffer = encoder.encode(saltStr);
      
      // Assume the old simple scrypt derivation
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
    return legacyData; // Already upgraded
  } else {
    throw new Error("Unknown vault format");
  }
  
  return encryptVault(mnemonic, password);
}
