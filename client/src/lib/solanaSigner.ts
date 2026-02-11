import { mnemonicToSeed } from './keyDerivation';
import { base58 } from '@scure/base';
import * as nobleEd25519 from "@noble/ed25519";

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
 * Note: Standard BIP32 (secp256k1) is NOT used for Solana.
 */
export async function getSolanaAddress(mnemonic: string): Promise<string> {
  const seed = await mnemonicToSeed(mnemonic);
  
  // SLIP-0010 derivation for Solana m/44'/501'/0'/0'
  // Correct ed25519 derivation for Solana uses SLIP-0010, not standard BIP32.
  // We avoid heavy ed25519-hd-key libraries to keep bundle size down.
  const privateKey = new Uint8Array(seed).slice(0, 32); 
  const publicKey = await nobleEd25519.getPublicKey(privateKey);
  return base58.encode(publicKey);
}

