import * as btc from '@scure/btc-signer';
import { mnemonicToSeed } from './keyDerivation';
import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha256';
import { wipeBytes, wipeHDKey, withWipe } from './secureMemory';

const TAPROOT_PATH = "m/86'/0'/0'/0/0";
const SEGWIT_PATH = "m/84'/0'/0'/0/0";
const NETWORK = btc.NETWORK;

export type BitcoinAddressType = 'taproot' | 'segwit';

export interface BitcoinUTXO {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey?: string;
}

export interface BitcoinTransactionRequest {
  to: string;
  amount: number;
  utxos: BitcoinUTXO[];
  feeRate: number;
  changeAddress?: string;
  fromAddress?: string;
}

export interface SignedBitcoinTransaction {
  signedTx: string;
  txid: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
}

function detectAddressType(address: string): BitcoinAddressType {
  if (address.startsWith('bc1p') || address.startsWith('tb1p')) return 'taproot';
  return 'segwit';
}

async function getHDKeyForType(mnemonic: string, type: BitcoinAddressType) {
  const seed = await mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(type === 'taproot' ? TAPROOT_PATH : SEGWIT_PATH);
  // Master seed bytes are no longer needed once child key is derived.
  wipeBytes(seed);
  wipeHDKey(hdKey);
  return child;
}

function xOnly(pubkey: Uint8Array): Uint8Array {
  return pubkey.length === 33 ? pubkey.slice(1) : pubkey;
}

export async function getBitcoinAddress(
  mnemonic: string,
  type: BitcoinAddressType = 'taproot'
): Promise<string> {
  const child = await getHDKeyForType(mnemonic, type);
  if (type === 'taproot') {
    const p2tr = btc.p2tr(xOnly(child.publicKey!), undefined, NETWORK);
    if (!p2tr.address) throw new Error('Failed to generate Taproot address');
    return p2tr.address;
  }
  const p2wpkh = btc.p2wpkh(child.publicKey!, NETWORK);
  if (!p2wpkh.address) throw new Error('Failed to generate SegWit address');
  return p2wpkh.address;
}

export async function fetchUTXOs(address: string): Promise<BitcoinUTXO[]> {
  const response = await fetch(`https://blockstream.info/api/address/${address}/utxo`);
  if (!response.ok) throw new Error('Failed to fetch UTXOs');
  const utxos = await response.json();
  return utxos.map((utxo: any) => ({
    txid: utxo.txid,
    vout: utxo.vout,
    value: utxo.value,
  }));
}

function calculateFee(
  inputCount: number,
  outputCount: number,
  feeRate: number,
  type: BitcoinAddressType
): number {
  const inputVB = type === 'taproot' ? 57.5 : 68;
  const outputVB = type === 'taproot' ? 43 : 31;
  const vBytes = 10.5 + inputVB * inputCount + outputVB * outputCount;
  return Math.ceil(vBytes * feeRate);
}

export async function signBitcoinTransaction(
  mnemonic: string,
  request: BitcoinTransactionRequest
): Promise<SignedBitcoinTransaction> {
  const type: BitcoinAddressType = request.fromAddress
    ? detectAddressType(request.fromAddress)
    : 'taproot';
  const child = await getHDKeyForType(mnemonic, type);
  return withWipe(async () => {
  const fromAddress = request.fromAddress || (await getBitcoinAddress(mnemonic, type));

  const totalInput = request.utxos.reduce((sum, u) => sum + u.value, 0);
  const outputCount = request.changeAddress ? 2 : 1;
  const fee = calculateFee(request.utxos.length, outputCount, request.feeRate, type);
  const change = totalInput - request.amount - fee;
  if (change < 0) throw new Error('Insufficient funds');

  const tx = new btc.Transaction({ allowUnknownOutputs: false });

  if (type === 'taproot') {
    const internalKey = xOnly(child.publicKey!);
    const p2tr = btc.p2tr(internalKey, undefined, NETWORK);
    for (const utxo of request.utxos) {
      tx.addInput({
        txid: utxo.txid,
        index: utxo.vout,
        witnessUtxo: { script: p2tr.script, amount: BigInt(utxo.value) },
        tapInternalKey: internalKey,
        sequence: 0xfffffffd, // RBF-enabled
      });
    }
  } else {
    const p2wpkh = btc.p2wpkh(child.publicKey!, NETWORK);
    for (const utxo of request.utxos) {
      tx.addInput({
        txid: utxo.txid,
        index: utxo.vout,
        witnessUtxo: { script: p2wpkh.script, amount: BigInt(utxo.value) },
        sequence: 0xfffffffd,
      });
    }
  }

  tx.addOutputAddress(request.to, BigInt(request.amount), NETWORK);
  if (change > 546) {
    const changeAddr = request.changeAddress || fromAddress;
    tx.addOutputAddress(changeAddr, BigInt(change), NETWORK);
  }

  tx.sign(child.privateKey!);
  tx.finalize();

  return {
    signedTx: tx.hex,
    txid: tx.id,
    from: fromAddress,
    to: request.to,
    amount: request.amount,
    fee,
  };
  }, () => wipeHDKey(child));
}

export async function broadcastBitcoinTransaction(signedTxHex: string): Promise<string> {
  const response = await fetch('https://blockstream.info/api/tx', {
    method: 'POST',
    body: signedTxHex,
  });
  if (!response.ok) throw new Error('Failed to broadcast');
  return response.text();
}

export async function getBitcoinBalance(address: string): Promise<number> {
  const response = await fetch(`https://blockstream.info/api/address/${address}`);
  if (!response.ok) throw new Error('Failed to fetch balance');
  const data = await response.json();
  return data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
}

/* ---------------------------------------------------------------------------
 * BIP322 "simple" message signing
 *
 * Works for both Taproot (bc1p…) and native SegWit (bc1q…) addresses.
 * Output is the base64-encoded witness stack of the synthetic to_sign tx,
 * which is the universally-supported BIP322-simple format (Sparrow, OKX,
 * Unisat, Trust Wallet, Leather, exchange withdrawal proofs).
 * ------------------------------------------------------------------------- */

function taggedHash(tag: string, msg: Uint8Array): Uint8Array {
  const tagHash = sha256(new TextEncoder().encode(tag));
  const data = new Uint8Array(tagHash.length * 2 + msg.length);
  data.set(tagHash, 0);
  data.set(tagHash, 32);
  data.set(msg, 64);
  return sha256(data);
}

function bip322MessageHash(message: string): Uint8Array {
  return taggedHash('BIP0322-signed-message', new TextEncoder().encode(message));
}

function varint(n: number): Uint8Array {
  if (n < 0xfd) return new Uint8Array([n]);
  if (n <= 0xffff) {
    const b = new Uint8Array(3);
    b[0] = 0xfd; b[1] = n & 0xff; b[2] = (n >> 8) & 0xff;
    return b;
  }
  const b = new Uint8Array(5);
  b[0] = 0xfe;
  b[1] = n & 0xff; b[2] = (n >> 8) & 0xff; b[3] = (n >> 16) & 0xff; b[4] = (n >>> 24) & 0xff;
  return b;
}

function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function encodeWitness(witness: Uint8Array[]): string {
  const parts: Uint8Array[] = [varint(witness.length)];
  for (const item of witness) {
    parts.push(varint(item.length));
    parts.push(item);
  }
  return toBase64(concatBytes(...parts));
}

const ZERO_TXID = new Uint8Array(32);

export async function signBitcoinMessage(
  mnemonic: string,
  message: string,
  address?: string
): Promise<string> {
  const type: BitcoinAddressType = address ? detectAddressType(address) : 'taproot';
  const child = await getHDKeyForType(mnemonic, type);
  return withWipe(async () => {
  const internalKey = xOnly(child.publicKey!);

  let addressScript: Uint8Array;
  if (type === 'taproot') {
    addressScript = btc.p2tr(internalKey, undefined, NETWORK).script;
  } else {
    addressScript = btc.p2wpkh(child.publicKey!, NETWORK).script;
  }

  const msgHash = bip322MessageHash(message);
  // OP_0 (0x00) + PUSH32 (0x20) + 32-byte msgHash
  const finalScriptSig = concatBytes(new Uint8Array([0x00, 0x20]), msgHash);

  const toSpend = new btc.Transaction({ version: 0, allowUnknownOutputs: true });
  toSpend.addInput({
    txid: ZERO_TXID,
    index: 0xffffffff,
    sequence: 0,
    finalScriptSig,
  });
  toSpend.addOutput({ script: addressScript, amount: 0n });

  const toSpendId = toSpend.id;

  const toSign = new btc.Transaction({ version: 0, allowUnknownOutputs: true });
  const toSignInput: any = {
    txid: toSpendId,
    index: 0,
    sequence: 0,
    witnessUtxo: { script: addressScript, amount: 0n },
  };
  if (type === 'taproot') toSignInput.tapInternalKey = internalKey;
  toSign.addInput(toSignInput);
  // OP_RETURN (0x6a)
  toSign.addOutput({ script: new Uint8Array([0x6a]), amount: 0n });

  toSign.sign(child.privateKey!);
  toSign.finalize();

  const input = toSign.getInput(0) as any;
  const witness: Uint8Array[] | undefined = input.finalScriptWitness;
  if (!witness || witness.length === 0) {
    throw new Error('BIP322: signing produced no witness');
  }

  return encodeWitness(witness);
  }, () => wipeHDKey(child));
}
