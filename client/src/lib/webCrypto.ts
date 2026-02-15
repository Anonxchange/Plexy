const IV_LENGTH = 12;
const SALT_LENGTH = 16;

async function getKeyMaterial(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
}

// Security Note: PBKDF2 iterations are set to 100,000. 
// Increasing this further would improve security against brute-force
// but might impact performance on slower mobile devices.
async function deriveEncryptionKey(keyMaterial: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
  // Fix for potential SharedArrayBuffer issue in some environments
  const saltBuffer = salt instanceof Uint8Array ? salt.buffer : salt;
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptAES(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const keyMaterial = await getKeyMaterial(password);
  const key = await deriveEncryptionKey(keyMaterial, salt);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );
  
  const combinedArray = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combinedArray.set(salt, 0);
  combinedArray.set(iv, salt.length);
  combinedArray.set(new Uint8Array(ciphertext), salt.length + iv.length);
  
  // Use a safer way to convert Uint8Array to base64 without using spread on large arrays
  let binary = "";
  for (let i = 0; i < combinedArray.length; i++) {
    binary += String.fromCharCode(combinedArray[i]);
  }
  return btoa(binary);
}

export async function decryptAES(encryptedBase64: string, password: string): Promise<string> {
  try {
    const combined = new Uint8Array(
      atob(encryptedBase64).split("").map((c) => c.charCodeAt(0))
    );
    
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);
    
    const keyMaterial = await getKeyMaterial(password);
    const key = await deriveEncryptionKey(keyMaterial, salt);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("Decryption failed:", err);
    throw new Error("Invalid wallet password or corrupted data");
  }
}
