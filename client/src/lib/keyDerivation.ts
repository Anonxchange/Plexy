import * as scrypt from "scrypt-js";
import { Buffer } from "buffer";
import { mnemonicToSeed as bip39MnemonicToSeed } from '@scure/bip39';

export async function mnemonicToSeed(mnemonic: string): Promise<Uint8Array> {
  return bip39MnemonicToSeed(mnemonic);
}

export async function deriveKey(password: string, salt: string, iterations: number = 16384): Promise<string> {
  const passwordBuffer = Buffer.from(password.normalize('NFKC'));
  const saltBuffer = Buffer.from(salt);
  
  // scrypt parameters: N (cost), r (block size), p (parallelization)
  // Standard values: N=16384, r=8, p=1
  const N = iterations;
  const r = 8;
  const p = 1;
  const dkLen = 32;

  const derivedKey = await scrypt.scrypt(passwordBuffer, saltBuffer, N, r, p, dkLen);
  return Buffer.from(derivedKey).toString('hex');
}
