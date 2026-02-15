import * as scrypt from "scrypt-js";
import { mnemonicToSeed as bip39MnemonicToSeed } from '@scure/bip39';

export async function mnemonicToSeed(mnemonic: string): Promise<Uint8Array> {
  return bip39MnemonicToSeed(mnemonic);
}

export interface KdfParams {
  N: number;
  r: number;
  p: number;
  dkLen: number;
}

export const DEFAULT_KDF_PARAMS: KdfParams = {
  N: 16384,
  r: 8,
  p: 1,
  dkLen: 32
};

/**
 * Derives a high-entropy 256-bit key from a password using scrypt.
 */
export async function deriveEncryptionKey(
  password: string, 
  salt: Uint8Array, 
  params: KdfParams = DEFAULT_KDF_PARAMS
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password.normalize('NFKC'));
  
  return await scrypt.scrypt(
    passwordBuffer, 
    salt, 
    params.N, 
    params.r, 
    params.p, 
    params.dkLen
  );
}
