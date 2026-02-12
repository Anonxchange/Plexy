import { mnemonicToSeed } from './keyDerivation';
import { base58 } from '@scure/base';
import * as nobleEd25519 from "@noble/ed25519";
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";

// noble-ed25519 v3+ (and some v2 versions) needs to be told which hash function to use
// Using type assertion to bypass strict TS checks on the `etc` object if it's not fully typed in the version installed
(nobleEd25519.etc as any).sha512Sync = (...m: any[]) => (sha512 as any)(...m);
(nobleEd25519.etc as any).hmacSha512Sync = (k: any, ...m: any[]) => (hmac as any)(sha512, k, ...m);

export interface SolanaTransactionRequest {
  to: string;
  amount: string;
  currency: 'SOL' | 'USDT_SOL' | 'USDC_SOL';
}

export interface SignedSolanaTransaction {
  signedTx: string;
  txHash: string;
  from: string;
  to: string;
  value: string;
  currency: string;
}

export async function signSolanaTransaction(
  _mnemonic: string,
  _request: SolanaTransactionRequest
): Promise<SignedSolanaTransaction> {
  throw new Error('Solana transaction signing not yet implemented');
}

/**
 * Derives Solana address using SLIP-0010 (ed25519)
 * Solana uses m/44'/501'/0'/0' path with ed25519 curve.
 */
export async function getSolanaAddress(mnemonic: string): Promise<string> {
  const seed = await mnemonicToSeed(mnemonic);
  
  // SLIP-0010 implementation for ed25519
  // Master key derivation
  const I = hmac(sha512, "ed25519 seed", seed);
  let IL = I.slice(0, 32);
  let IR = I.slice(32);

  // Derivation path: m/44'/501'/0'/0'
  const path = [44, 501, 0, 0];
  
  for (const index of path) {
    const data = new Uint8Array(37);
    data[0] = 0;
    data.set(IL, 1);
    const hardenedIndex = index + 0x80000000;
    data[33] = (hardenedIndex >>> 24) & 0xff;
    data[34] = (hardenedIndex >>> 16) & 0xff;
    data[35] = (hardenedIndex >>> 8) & 0xff;
    data[36] = hardenedIndex & 0xff;

    const I_n = hmac(sha512, IR, data);
    IL = I_n.slice(0, 32);
    IR = I_n.slice(32);
  }

  const publicKey = await nobleEd25519.getPublicKey(IL);
  return base58.encode(publicKey);
}

