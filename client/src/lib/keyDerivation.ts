import * as scrypt from "scrypt-js";
import { mnemonicToSeed as bip39MnemonicToSeed } from '@scure/bip39';

export async function mnemonicToSeed(mnemonic: string): Promise<Uint8Array> {
  return bip39MnemonicToSeed(mnemonic);
}

export async function deriveKey(password: string, userId: string, iterations: number = 16384): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password.normalize('NFKC'));
  // Security Improvement: Use a more robust salt strategy if possible.
  // Currently using userId which might be predictable.
  const salt = `pexly_v1_secure_salt_${userId}`;
  const saltBuffer = encoder.encode(salt);
  
  const N = iterations;
  const r = 8;
  const p = 1;
  const dkLen = 32;

  const derivedKey = await scrypt.scrypt(passwordBuffer, saltBuffer, N, r, p, dkLen);
  return Array.from(derivedKey).map(b => b.toString(16).padStart(2, '0')).join('');
}
