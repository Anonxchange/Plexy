import * as ed25519 from "ed25519-hd-key";
import { mnemonicToSeed } from './keyDerivation';
import { base58 } from '@scure/base';
import * as nobleEd25519 from "@noble/ed25519";
import { bytesToHex } from "@noble/hashes/utils";

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

export async function getSolanaAddress(mnemonic: string): Promise<string> {
  const seed = await mnemonicToSeed(mnemonic);
  const seedHex = bytesToHex(seed);
  
  const derived = ed25519.derivePath("m/44'/501'/0'/0'", seedHex);
  
  if (!derived.key) {
    throw new Error('Failed to derive Solana private key');
  }

  // Solana uses Ed25519
  // Use @noble/ed25519 to derive public key from the derived private key
  const publicKey = await nobleEd25519.getPublicKey(derived.key);
  return base58.encode(publicKey);
}

