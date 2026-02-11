import { mnemonicToSeed } from './keyDerivation';
import { base58 } from '@scure/base';
import * as nobleEd25519 from "@noble/ed25519";
import { bytesToHex } from "@noble/hashes/utils";
import { HDKey } from "@scure/bip32";

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

// Get Solana address from mnemonic
export async function getSolanaAddress(mnemonic: string): Promise<string> {
  const seed = await mnemonicToSeed(mnemonic);
  
  // BIP44 derivation for Solana: m/44'/501'/0'/0'
  const hdKey = HDKey.fromMasterSeed(new Uint8Array(seed));
  const derived = hdKey.derive("m/44'/501'/0'/0'");
  
  if (!derived.privateKey) {
    throw new Error('Failed to derive Solana private key');
  }

  // Solana uses Ed25519
  // Use @noble/ed25519 to derive public key from the derived private key
  const publicKey = await nobleEd25519.getPublicKey(derived.privateKey);
  return base58.encode(publicKey);
}

