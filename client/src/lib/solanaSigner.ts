import { mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { base58 } from '@scure/base';
import * as nobleEd25519 from '@noble/ed25519';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { sha256 } from '@noble/hashes/sha256';

// noble-ed25519 needs to be configured with a sha512 hash function
(nobleEd25519.etc as any).sha512Sync = (...m: any[]) => sha512(nobleEd25519.etc.concatBytes(...m));
(nobleEd25519.etc as any).sha512Async = (...m: any[]) => Promise.resolve(sha512(nobleEd25519.etc.concatBytes(...m)));

export interface SolanaTransactionRequest {
  to: string;
  amount: string;
  recentBlockhash: string;
  currency: 'SOL' | 'USDT_SOL' | 'USDC_SOL';
  tokenAddress?: string;
  fromTokenAccount?: string;
  toTokenAccount?: string;
}

export interface SignedSolanaTransaction {
  signedTx: string;
  txHash: string;
}

// Encode lengths in compact-u16 format
function encodeLength(len: number): number[] {
  const out: number[] = [];
  while (len >= 0x80) {
    out.push((len & 0x7f) | 0x80);
    len >>= 7;
  }
  out.push(len);
  return out;
}

// Derive Solana private key from mnemonic using ed25519 path
export async function deriveSolanaPrivateKey(mnemonic: string): Promise<Uint8Array> {
  const seed = await mnemonicToSeed(mnemonic, wordlist as any);
  let I = hmac(sha512, new TextEncoder().encode('ed25519 seed'), seed);
  let IL = I.slice(0, 32);
  let IR = I.slice(32);
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
    I = hmac(sha512, IR, data);
    IL = I.slice(0, 32);
    IR = I.slice(32);
  }
  return IL;
}

// Get Solana address from mnemonic
export async function getSolanaAddress(mnemonic: string): Promise<string> {
  const priv = await deriveSolanaPrivateKey(mnemonic);
  const pub = await nobleEd25519.getPublicKey(priv);
  return base58.encode(pub);
}

// Sign SOL or SPL token transaction
export async function signSolanaTransaction(
  mnemonic: string,
  request: SolanaTransactionRequest
): Promise<SignedSolanaTransaction> {
  const privateKey = await deriveSolanaPrivateKey(mnemonic);
  const publicKey = await nobleEd25519.getPublicKey(privateKey);
  const recentBlockhash = base58.decode(request.recentBlockhash);

  let message: Uint8Array;

  if (request.currency === 'SOL') {
    // Native SOL transfer
    const toPubkey = base58.decode(request.to);
    const systemProgramId = base58.decode('11111111111111111111111111111111');
    const [whole, fraction = ''] = request.amount.split('.');
    const lamports = BigInt(whole) * 1_000_000_000n + BigInt(fraction.padEnd(9, '0').slice(0, 9));

    const instructionData = new Uint8Array(12);
    const view = new DataView(instructionData.buffer);
    view.setUint32(0, 2, true); // Transfer instruction
    view.setBigUint64(4, lamports, true);

    const accountKeys = [publicKey, toPubkey, systemProgramId];

    message = new Uint8Array([
      1, 0, 1,
      ...encodeLength(accountKeys.length),
      ...accountKeys.flatMap((k) => Array.from(k)),
      ...recentBlockhash,
      ...encodeLength(1),
      2,
      ...encodeLength(2), 0, 1,
      ...encodeLength(instructionData.length),
      ...instructionData
    ]);
  } else {
    // SPL token transfer
    if (!request.fromTokenAccount || !request.toTokenAccount || !request.tokenAddress) {
      throw new Error('Token accounts and Mint address required for SPL transfers');
    }

    const tokenProgramId = base58.decode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const fromATA = base58.decode(request.fromTokenAccount);
    const toATA = base58.decode(request.toTokenAccount);
    const mint = base58.decode(request.tokenAddress);

    const [whole, fraction = ''] = request.amount.split('.');
    const amount = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0').slice(0, 6));

    const instructionData = new Uint8Array(10);
    const view = new DataView(instructionData.buffer);
    view.setUint8(0, 12); // TransferChecked
    view.setBigUint64(1, amount, true);
    view.setUint8(9, 6); // decimals

    const accountKeys = [publicKey, fromATA, mint, toATA, tokenProgramId];

    message = new Uint8Array([
      1, 0, 3,
      ...encodeLength(accountKeys.length),
      ...accountKeys.flatMap((k) => Array.from(k)),
      ...recentBlockhash,
      ...encodeLength(1),
      4, // Token Program
      ...encodeLength(5),
      0, 1, 2, 3, 4,
      ...encodeLength(instructionData.length),
      ...instructionData
    ]);
  }

  // Sign transaction
  const signature = await nobleEd25519.sign(message, privateKey);
  const transactionPacket = new Uint8Array([1, ...signature, ...message]);

  // Compute txHash (SHA256 of message)
  const txHash = base58.encode(sha256(transactionPacket));

  return {
    signedTx: base58.encode(transactionPacket),
    txHash
  };
}