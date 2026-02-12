import { mnemonicToSeed } from './keyDerivation';
import { base58 } from '@scure/base';
import * as nobleEd25519 from "@noble/ed25519";
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";

// noble-ed25519 v3+ requires SHA-512 to be provided manually
nobleEd25519.hashes.sha512 = sha512;

export interface SolanaTransactionRequest {
  to: string;
  amount: string;
  currency: 'SOL' | 'USDT_SOL' | 'USDC_SOL';
  // Note: Real transactions need a 'recentBlockhash' from the RPC
  recentBlockhash?: string; 
}

export interface SignedSolanaTransaction {
  signedTx: string;
  txHash: string;
  from: string;
  to: string;
  value: string;
  currency: string;
}

/**
 * Shared helper to derive the raw 32-byte Solana private key.
 * This ensures the Manager and Signer always use the same key.
 */
export async function deriveSolanaPrivateKey(mnemonic: string): Promise<Uint8Array> {
  const seed = await mnemonicToSeed(mnemonic);
  
  // Master key derivation (SLIP-0010)
  const I = hmac(sha512, new TextEncoder().encode("ed25519 seed"), seed);
  let IL = I.slice(0, 32);
  let IR = I.slice(32);

  // Path: m/44'/501'/0'/0'
  const path = [44, 501, 0, 0];
  
  for (const index of path) {
    const data = new Uint8Array(37);
    data[0] = 0; // Hardened prefix
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
  return IL;
}

/**
 * Derives Solana address using the standard SLIP-0010 path.
 */
export async function getSolanaAddress(mnemonic: string): Promise<string> {
  const privateKey = await deriveSolanaPrivateKey(mnemonic);
  const publicKey = await nobleEd25519.getPublicKey(privateKey);
  return base58.encode(publicKey);
}

/**
 * Signs a Solana transaction.
 * Implementation Note: Solana transactions are complex binary blobs.
 * You typically use @solana/web3.js to build the message first.
 */
export async function signSolanaTransaction(
  mnemonic: string,
  _request: SolanaTransactionRequest
): Promise<SignedSolanaTransaction> {
  const privateKey = await deriveSolanaPrivateKey(mnemonic);
  const publicKey = await nobleEd25519.getPublicKey(privateKey);
  const fromAddress = base58.encode(publicKey);

  // PLACEHOLDER: In a real app, you'd serialize a 'Transfer' instruction here.
  // This is a dummy byte array representing a transaction message.
  const dummyMessage = new TextEncoder().encode("solana_tx_message_placeholder");

  // Sign the message
  const signature = await nobleEd25519.sign(dummyMessage, privateKey);

  return {
    signedTx: base58.encode(signature), // Usually Signature + Message
    txHash: base58.encode(signature),
    from: fromAddress,
    to: _request.to,
    value: _request.amount,
    currency: _request.currency
  };
}