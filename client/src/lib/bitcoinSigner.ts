// Bitcoin Transaction Signing (Native SegWit - bc1...)
import * as bitcoin from 'bitcoinjs-lib';
// import { ECPairFactory } from 'ecpair';
const ECPairFactory = (...args: any[]) => ({}) as any;
// import * as ecc from 'tiny-secp256k1';
const ecc = {} as any;
import { mnemonicToSeed } from './keyDerivation';
import { HDKey } from '@scure/bip32';

const ECPair = ECPairFactory(ecc);
bitcoin.initEccLib(ecc);

const DERIVATION_PATH = "m/84'/0'/0'/0/0"; // BIP84 for native SegWit
const NETWORK = bitcoin.networks.bitcoin;

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

async function getKeyPairFromMnemonic(mnemonic: string): Promise<{ keyPair: ReturnType<typeof ECPair.fromPrivateKey>; publicKey: Buffer }> {
  const seed = await mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(DERIVATION_PATH);
  
  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }
  
  const keyPair = ECPair.fromPrivateKey(Buffer.from(child.privateKey));
  return { keyPair, publicKey: Buffer.from(child.publicKey!) };
}

// Get P2WPKH address from mnemonic
export async function getBitcoinAddress(mnemonic: string): Promise<string> {
  const { publicKey } = await getKeyPairFromMnemonic(mnemonic);
  const { address } = bitcoin.payments.p2wpkh({ 
    pubkey: publicKey,
    network: NETWORK 
  });
  
  if (!address) {
    throw new Error('Failed to generate Bitcoin address');
  }
  
  return address;
}

// Fetch UTXOs from Blockstream API
export async function fetchUTXOs(address: string): Promise<BitcoinUTXO[]> {
  const response = await fetch(`https://blockstream.info/api/address/${address}/utxo`);
  if (!response.ok) {
    throw new Error('Failed to fetch UTXOs');
  }
  
  const utxos = await response.json();
  return utxos.map((utxo: any) => ({
    txid: utxo.txid,
    vout: utxo.vout,
    value: utxo.value,
  }));
}

// Calculate transaction fee
function calculateFee(inputCount: number, outputCount: number, feeRate: number): number {
  // Approximate vBytes for P2WPKH transaction
  const vBytes = 10.5 + (68 * inputCount) + (31 * outputCount);
  return Math.ceil(vBytes * feeRate);
}

// Sign Bitcoin transaction
export async function signBitcoinTransaction(
  mnemonic: string,
  request: BitcoinTransactionRequest
): Promise<SignedBitcoinTransaction> {
  const { keyPair, publicKey } = await getKeyPairFromMnemonic(mnemonic);
  const fromAddress = await getBitcoinAddress(mnemonic);
  
  // Create P2WPKH payment
  const p2wpkh = bitcoin.payments.p2wpkh({ 
    pubkey: publicKey,
    network: NETWORK 
  });

  // Calculate total input value
  const totalInput = request.utxos.reduce((sum, utxo) => sum + utxo.value, 0);
  
  // Calculate fee
  const outputCount = request.changeAddress ? 2 : 1;
  const fee = calculateFee(request.utxos.length, outputCount, request.feeRate);
  
  // Calculate change
  const change = totalInput - request.amount - fee;
  
  if (change < 0) {
    throw new Error(`Insufficient funds. Need ${request.amount + fee} satoshis, have ${totalInput}`);
  }

  // Build transaction
  const psbt = new bitcoin.Psbt({ network: NETWORK });

  // Add inputs
  for (const utxo of request.utxos) {
    // Fetch raw transaction for witness UTXO
    const txResponse = await fetch(`https://blockstream.info/api/tx/${utxo.txid}/hex`);
    const txHex = await txResponse.text();
    const tx = bitcoin.Transaction.fromHex(txHex);
    
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: p2wpkh.output!,
        value: utxo.value,
      },
    });
  }

  // Add recipient output
  psbt.addOutput({
    address: request.to,
    value: request.amount,
  });

  // Add change output if needed (dust threshold ~546 satoshis)
  if (change > 546) {
    const changeAddr = request.changeAddress || fromAddress;
    psbt.addOutput({
      address: changeAddr,
      value: change,
    });
  }

  // Sign all inputs
  for (let i = 0; i < request.utxos.length; i++) {
    psbt.signInput(i, keyPair);
  }

  // Finalize and extract transaction
  psbt.finalizeAllInputs();
  const signedTx = psbt.extractTransaction();

  return {
    signedTx: signedTx.toHex(),
    txid: signedTx.getId(),
    from: fromAddress,
    to: request.to,
    amount: request.amount,
    fee,
  };
}

// Broadcast signed transaction
export async function broadcastBitcoinTransaction(signedTxHex: string): Promise<string> {
  const response = await fetch('https://blockstream.info/api/tx', {
    method: 'POST',
    body: signedTxHex,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to broadcast: ${error}`);
  }
  
  return response.text(); // Returns txid
}

// Get balance from address
export async function getBitcoinBalance(address: string): Promise<number> {
  const response = await fetch(`https://blockstream.info/api/address/${address}`);
  if (!response.ok) {
    throw new Error('Failed to fetch balance');
  }
  
  const data = await response.json();
  return data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
}

// Sign a message (BIP322 style, simplified)
export async function signBitcoinMessage(mnemonic: string, message: string): Promise<string> {
  const { keyPair } = await getKeyPairFromMnemonic(mnemonic);
  const messageHash = bitcoin.crypto.sha256(Buffer.from(message));
  const signature = keyPair.sign(messageHash);
  return signature.toString('hex');
}
