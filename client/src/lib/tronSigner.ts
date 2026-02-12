// ===== TRON LIGHTWEIGHT WALLET =====
import { mnemonicToSeed } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { base58 } from '@scure/base';
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';

export interface TronTransactionRequest {
  to: string;
  amount: string; // in TRX
  currency: 'TRX' | 'USDT_TRX';
  tokenAddress?: string; // for TRC20
}

export interface SignedTronTransaction {
  signedTx: string;
  txID: string;
  from: string;
  to: string;
  amount: string;
}

// ===== PRIVATE KEY DERIVATION =====
export async function deriveTronPrivateKey(mnemonic: string): Promise<Uint8Array> {
  const seed = await mnemonicToSeed(mnemonic, wordlist as any);
  const privKey = seed.slice(0, 32);

  if (!secp256k1.utils.isValidPrivateKey(privKey)) {
    throw new Error('Invalid private key derived');
  }

  return privKey;
}

// ===== ADDRESS DERIVATION =====
export async function getTronAddress(mnemonic: string): Promise<string> {
  const privKey = await deriveTronPrivateKey(mnemonic);

  // Compute public key (uncompressed, remove 0x04 prefix)
  const pubKey = secp256k1.getPublicKey(privKey, false).slice(1);

  // Tron address = 0x41 + RIPEMD160(SHA256(pubKey))
  const sha = sha256(pubKey);
  const ripe = ripemd160(sha);
  const address = new Uint8Array(21);
  address[0] = 0x41; // Mainnet prefix
  address.set(ripe, 1);

  // Base58Check encoding
  return base58.encode(address);
}

// ===== AMOUNT CONVERSION =====
function trxToSun(amount: string): bigint {
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0').slice(0, 6));
}

// ===== SIGN TRX TRANSACTION =====
export async function signTronTransaction(
  mnemonic: string,
  request: TronTransactionRequest
): Promise<SignedTronTransaction> {
  const privKey = await deriveTronPrivateKey(mnemonic);
  const from = await getTronAddress(mnemonic);

  // Minimal transaction structure
  const tx: any = {
    owner_address: from,
    to_address: request.to,
    amount: trxToSun(request.amount),
    timestamp: Date.now(),
    type: 'TransferContract'
  };

  // Serialize transaction as JSON string
  const txBytes = new TextEncoder().encode(JSON.stringify(tx));

  // Sign with secp256k1
  const hash = sha256(txBytes);
  const signature = await secp256k1.sign(hash, privKey, { recovered: false });

  const signedTx = {
    ...tx,
    signature: base58.encode(signature)
  };

  // Transaction ID = SHA256 of serialized signed transaction
  const txID = base58.encode(sha256(new TextEncoder().encode(JSON.stringify(signedTx))));

  return {
    signedTx: JSON.stringify(signedTx),
    txID,
    from,
    to: request.to,
    amount: request.amount
  };
}

// ===== BALANCE PLACEHOLDERS =====
export async function getTronBalance(_mnemonic: string): Promise<string> {
  return '0'; // placeholder
}

export async function getTRC20Balance(
  _mnemonic: string,
  _tokenAddress: string
): Promise<string> {
  return '0'; // placeholder
}

// ===== TRC20 SIGNING PLACEHOLDER =====
export async function signTRC20Transaction(
  _mnemonic: string,
  _request: TronTransactionRequest
): Promise<SignedTronTransaction> {
  throw new Error('TRC20 signing not implemented yet');
}