// Bitcoin P2P Escrow using 2-of-3 Multi-Sig (P2WSH)
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { mnemonicToSeed } from '../keyDerivation';
import { HDKey } from '@scure/bip32';

const ECPair = ECPairFactory(ecc);
bitcoin.initEccLib(ecc);

const NETWORK = bitcoin.networks.bitcoin;
const DERIVATION_PATH = "m/84'/0'/0'/0/0";

export interface EscrowParticipant {
  publicKey: Buffer;
  address: string;
}

export interface BitcoinEscrowTrade {
  escrowAddress: string;
  redeemScript: Buffer;
  witnessScript: Buffer;
  seller: EscrowParticipant;
  buyer: EscrowParticipant;
  moderator: EscrowParticipant;
  amount: number; // satoshis
  createdAt: number;
  tradeId: string;
}

export interface EscrowReleaseRequest {
  trade: BitcoinEscrowTrade;
  recipientAddress: string;
  utxos: { txid: string; vout: number; value: number }[];
  feeRate: number; // sat/vB
}

export interface SignedEscrowRelease {
  psbt: string; // base64 PSBT for co-signing
  partialSig: boolean;
  signedBy: 'seller' | 'buyer' | 'moderator';
}

// Derive public key from mnemonic
export function getEscrowPublicKey(mnemonic: string): { publicKey: Buffer; address: string } {
  const seed = mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(DERIVATION_PATH);
  
  const publicKey = Buffer.from(child.publicKey!);
  const { address } = bitcoin.payments.p2wpkh({ pubkey: publicKey, network: NETWORK });
  
  return { publicKey, address: address! };
}

// Create 2-of-3 multi-sig escrow address
export function createEscrowAddress(
  sellerPubKey: Buffer,
  buyerPubKey: Buffer,
  moderatorPubKey: Buffer,
  tradeId: string
): BitcoinEscrowTrade {
  // Sort public keys lexicographically (BIP67)
  const pubkeys = [sellerPubKey, buyerPubKey, moderatorPubKey].sort(Buffer.compare);
  
  // Create 2-of-3 multi-sig witness script
  const p2ms = bitcoin.payments.p2ms({
    m: 2,
    pubkeys,
    network: NETWORK,
  });
  
  // Wrap in P2WSH (native SegWit multi-sig)
  const p2wsh = bitcoin.payments.p2wsh({
    redeem: p2ms,
    network: NETWORK,
  });
  
  if (!p2wsh.address || !p2wsh.redeem?.output) {
    throw new Error('Failed to create escrow address');
  }
  
  return {
    escrowAddress: p2wsh.address,
    redeemScript: p2ms.output!,
    witnessScript: p2wsh.redeem.output,
    seller: { publicKey: sellerPubKey, address: '' },
    buyer: { publicKey: buyerPubKey, address: '' },
    moderator: { publicKey: moderatorPubKey, address: '' },
    amount: 0,
    createdAt: Date.now(),
    tradeId,
  };
}

// Calculate transaction fee for escrow release (1 input, 1 output)
function calculateEscrowFee(feeRate: number): number {
  // P2WSH input ~104 vBytes + P2WPKH output ~31 vBytes + overhead ~10 vBytes
  const vBytes = 145;
  return Math.ceil(vBytes * feeRate);
}

// Seller initiates release to buyer (first signature)
export async function sellerSignRelease(
  mnemonic: string,
  request: EscrowReleaseRequest
): Promise<SignedEscrowRelease> {
  const { trade, recipientAddress, utxos, feeRate } = request;
  
  const seed = mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(DERIVATION_PATH);
  const keyPair = ECPair.fromPrivateKey(Buffer.from(child.privateKey!));
  
  const totalInput = utxos.reduce((sum, u) => sum + u.value, 0);
  const fee = calculateEscrowFee(feeRate);
  const outputAmount = totalInput - fee;
  
  if (outputAmount <= 546) {
    throw new Error(`Output too small after fee. Input: ${totalInput}, Fee: ${fee}`);
  }
  
  // Recreate the multi-sig payment
  const pubkeys = [trade.seller.publicKey, trade.buyer.publicKey, trade.moderator.publicKey].sort(Buffer.compare);
  const p2ms = bitcoin.payments.p2ms({ m: 2, pubkeys, network: NETWORK });
  const p2wsh = bitcoin.payments.p2wsh({ redeem: p2ms, network: NETWORK });
  
  const psbt = new bitcoin.Psbt({ network: NETWORK });
  
  // Add inputs
  for (const utxo of utxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: p2wsh.output!,
        value: utxo.value,
      },
      witnessScript: p2ms.output,
    });
  }
  
  // Add output - fee deducted from locked amount
  psbt.addOutput({
    address: recipientAddress,
    value: outputAmount,
  });
  
  // Seller signs
  for (let i = 0; i < utxos.length; i++) {
    psbt.signInput(i, keyPair);
  }
  
  return {
    psbt: psbt.toBase64(),
    partialSig: true,
    signedBy: 'seller',
  };
}

// Buyer co-signs to complete release
export async function buyerCoSignRelease(
  mnemonic: string,
  partialPsbt: string
): Promise<{ signedTx: string; txid: string; fee: number }> {
  const seed = mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(DERIVATION_PATH);
  const keyPair = ECPair.fromPrivateKey(Buffer.from(child.privateKey!));
  
  const psbt = bitcoin.Psbt.fromBase64(partialPsbt, { network: NETWORK });
  
  // Buyer signs all inputs
  for (let i = 0; i < psbt.inputCount; i++) {
    psbt.signInput(i, keyPair);
  }
  
  // Finalize
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  
  const inputSum = psbt.data.inputs.reduce((sum, input) => sum + (input.witnessUtxo?.value || 0), 0);
  const outputSum = tx.outs.reduce((sum, out) => sum + out.value, 0);
  
  return {
    signedTx: tx.toHex(),
    txid: tx.getId(),
    fee: inputSum - outputSum,
  };
}

// Moderator dispute resolution - can sign with either buyer or seller
export async function moderatorSignRelease(
  mnemonic: string,
  partialPsbt: string
): Promise<{ signedTx: string; txid: string; fee: number }> {
  const seed = mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(DERIVATION_PATH);
  const keyPair = ECPair.fromPrivateKey(Buffer.from(child.privateKey!));
  
  const psbt = bitcoin.Psbt.fromBase64(partialPsbt, { network: NETWORK });
  
  // Moderator signs
  for (let i = 0; i < psbt.inputCount; i++) {
    psbt.signInput(i, keyPair);
  }
  
  // Finalize
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  
  const inputSum = psbt.data.inputs.reduce((sum, input) => sum + (input.witnessUtxo?.value || 0), 0);
  const outputSum = tx.outs.reduce((sum, out) => sum + out.value, 0);
  
  return {
    signedTx: tx.toHex(),
    txid: tx.getId(),
    fee: inputSum - outputSum,
  };
}

// Fetch escrow UTXOs
export async function fetchEscrowUTXOs(escrowAddress: string): Promise<{ txid: string; vout: number; value: number }[]> {
  const response = await fetch(`https://blockstream.info/api/address/${escrowAddress}/utxo`);
  if (!response.ok) throw new Error('Failed to fetch escrow UTXOs');
  
  const utxos = await response.json();
  return utxos.map((u: any) => ({
    txid: u.txid,
    vout: u.vout,
    value: u.value,
  }));
}

// Broadcast signed escrow release
export async function broadcastEscrowRelease(signedTxHex: string): Promise<string> {
  const response = await fetch('https://blockstream.info/api/tx', {
    method: 'POST',
    body: signedTxHex,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Broadcast failed: ${error}`);
  }
  
  return response.text();
}

// Get current fee rate from mempool
export async function getRecommendedFeeRate(): Promise<{ fast: number; medium: number; slow: number }> {
  const response = await fetch('https://blockstream.info/api/fee-estimates');
  if (!response.ok) {
    return { fast: 20, medium: 10, slow: 5 }; // fallback
  }
  
  const estimates = await response.json();
  return {
    fast: Math.ceil(estimates['1'] || 20),
    medium: Math.ceil(estimates['6'] || 10),
    slow: Math.ceil(estimates['144'] || 5),
  };
}
