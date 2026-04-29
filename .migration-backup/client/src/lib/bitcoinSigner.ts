import * as btc from '@scure/btc-signer';
import { mnemonicToSeed } from './keyDerivation';
import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha256';
import { wipeBytes, wipeHDKey, withWipe } from './secureMemory';

const SEGWIT_PATH = "m/84'/0'/0'/0/0";
const NETWORK = btc.NETWORK;

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

async function getHDKey(mnemonic: string) {
  const seed = await mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(SEGWIT_PATH);
  // Master seed bytes are no longer needed once child key is derived.
  wipeBytes(seed);
  wipeHDKey(hdKey);
  return child;
}

export async function getBitcoinAddress(mnemonic: string): Promise<string> {
  const child = await getHDKey(mnemonic);
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

function calculateFee(inputCount: number, outputCount: number, feeRate: number): number {
  const vBytes = 10.5 + 68 * inputCount + 31 * outputCount;
  return Math.ceil(vBytes * feeRate);
}

export async function signBitcoinTransaction(
  mnemonic: string,
  request: BitcoinTransactionRequest
): Promise<SignedBitcoinTransaction> {
  const child = await getHDKey(mnemonic);
  return withWipe(async () => {
    const fromAddress = request.fromAddress || (await getBitcoinAddress(mnemonic));

    const totalInput = request.utxos.reduce((sum, u) => sum + u.value, 0);
    const outputCount = request.changeAddress ? 2 : 1;
    const fee = calculateFee(request.utxos.length, outputCount, request.feeRate);
    const change = totalInput - request.amount - fee;
    if (change < 0) throw new Error('Insufficient funds');

    const tx = new btc.Transaction({ allowUnknownOutputs: false });
    const p2wpkh = btc.p2wpkh(child.publicKey!, NETWORK);

    for (const utxo of request.utxos) {
      tx.addInput({
        txid: utxo.txid,
        index: utxo.vout,
        witnessUtxo: { script: p2wpkh.script, amount: BigInt(utxo.value) },
        sequence: 0xfffffffd, // RBF-enabled
      });
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
 * BIP322 "simple" message signing for Native SegWit (bc1q…) addresses.
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
  _address?: string
): Promise<string> {
  const child = await getHDKey(mnemonic);
  return withWipe(async () => {
    const addressScript = btc.p2wpkh(child.publicKey!, NETWORK).script;

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
    toSign.addInput({
      txid: toSpendId,
      index: 0,
      sequence: 0,
      witnessUtxo: { script: addressScript, amount: 0n },
    });
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
