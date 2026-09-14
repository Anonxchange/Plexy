/**
 * Main-thread key derivation for flows that genuinely can't use the vault
 * worker: WebAuthn passkey vault handling and the legacy wallet-creation path
 * in NonCustodialWalletManager (see webCrypto.ts's encryptVault/decryptVault
 * doc comments — both are intentionally main-thread, not oversights).
 *
 * This used to run scrypt via hash-wasm (WebAssembly), which required
 * 'wasm-unsafe-eval' in CSP. Swapped to @noble/hashes' pure-JS scrypt instead
 * — same algorithm and parameters, no WASM, no CSP change needed. This does
 * NOT close the "runs outside the worker's isolated realm" gap for these
 * specific call sites, because they're documented as needing to run here.
 * New code should still prefer callSigningWorker("deriveVaultKey"/
 * "encryptVault"/"decryptVault") wherever the worker is a viable option.
 */
import { scryptAsync } from "@noble/hashes/scrypt";
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
  N: 262144,
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
  try {
    return await scryptAsync(passwordBuffer, salt, {
      N: params.N,
      r: params.r,
      p: params.p,
      dkLen: params.dkLen,
    });
  } finally {
    passwordBuffer.fill(0);
  }
}
