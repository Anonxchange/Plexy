import * as btc from '@scure/btc-signer';
import { mnemonicToSeed } from './keyDerivation';
import { HDKey } from '@scure/bip32';

const DERIVATION_PATH = "m/84'/0'/0'/0/0"; // BIP84 for native SegWit
const NETWORK = btc.NETWORK;

export interface BitcoinUTXO {
  txid: string;
  vout: number;
  value: number; // in satoshis
  scriptPubKey?: string;
}

export interface BitcoinTransactionRequest {
  to: string;
  amount: number; // in satoshis
  utxos: BitcoinUTXO[];
  feeRate: number; // sat/vB
  changeAddress?: string;
}

export interface SignedBitcoinTransaction {
  signedTx: string; // hex
  txid: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
}

async function getHDKeyFromMnemonic(mnemonic: string) {
  const seed = await mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  return hdKey.derive(DERIVATION_PATH);
}

export async function getBitcoinAddress(mnemonic: string): Promise<string> {
  const child = await getHDKeyFromMnemonic(mnemonic);
  const p2wpkh = btc.p2wpkh(child.publicKey!, NETWORK);
  if (!p2wpkh.address) throw new Error('Failed to generate Bitcoin address');
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
  const vBytes = 10.5 + (68 * inputCount) + (31 * outputCount);
  return Math.ceil(vBytes * feeRate);
}

export async function signBitcoinTransaction(
  mnemonic: string,
  request: BitcoinTransactionRequest
): Promise<SignedBitcoinTransaction> {
  const child = await getHDKeyFromMnemonic(mnemonic);
  const fromAddress = await getBitcoinAddress(mnemonic);
  const totalInput = request.utxos.reduce((sum, utxo) => sum + utxo.value, 0);
  const outputCount = request.changeAddress ? 2 : 1;
  const fee = calculateFee(request.utxos.length, outputCount, request.feeRate);
  const change = totalInput - request.amount - fee;
  
  if (change < 0) throw new Error(`Insufficient funds`);

  const tx = new btc.Transaction();
  for (const utxo of request.utxos) {
    tx.addInput({
      txid: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: btc.p2wpkh(child.publicKey!, NETWORK).script,
        amount: BigInt(utxo.value),
      },
    });
  }

  tx.addOutputAddress(request.to, BigInt(request.amount), NETWORK);
  if (change > 546) {
    const changeAddr = request.changeAddress || fromAddress;
    tx.addOutputAddress(changeAddr, BigInt(change), NETWORK);
  }

  tx.sign(child.privateKey!);
  tx.finalize();

  const signedTx = tx.hex;
  const txid = tx.id;

  return { signedTx, txid, from: fromAddress, to: request.to, amount: request.amount, fee };
}

export async function broadcastBitcoinTransaction(signedTxHex: string): Promise<string> {
  const response = await fetch('https://blockstream.info/api/tx', {
    method: 'POST',
    body: signedTxHex,
  });
  if (!response.ok) throw new Error(`Failed to broadcast`);
  return response.text(); 
}

export async function getBitcoinBalance(address: string): Promise<number> {
  const response = await fetch(`https://blockstream.info/api/address/${address}`);
  if (!response.ok) throw new Error('Failed to fetch balance');
  const data = await response.json();
  return data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
}

export async function signBitcoinMessage(mnemonic: string, message: string): Promise<string> {
  return "Message signing placeholder"; 
}
