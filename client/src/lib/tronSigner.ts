
// Tron Transaction Signing
// import { TronWeb } from 'tronweb';
import TronWeb from 'tronweb';
import { mnemonicToSeed } from './keyDerivation';
import { HDKey } from '@scure/bip32';
import { TOKEN_CONTRACTS } from './evmSigner';

import * as ed25519 from "ed25519-hd-key";

const DERIVATION_PATH = "m/44'/195'/0'/0/0";
const TRONGRID_API = 'https://api.trongrid.io';

export interface TronTransactionRequest {
  to: string;
  amount: string;
  currency: 'TRX' | 'USDT_TRX';
}

export interface SignedTronTransaction {
  signedTx: any;
  txID: string;
  from: string;
  to: string;
  amount: string;
}

async function getPrivateKeyFromMnemonic(mnemonic: string): Promise<string> {
  const seed = await mnemonicToSeed(mnemonic);
  const seedHex = Array.from(new Uint8Array(seed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  // Tron uses BIP44 standard derivation on secp256k1 curve
  // Using HDKey (secp256k1) is correct for Tron m/44'/195'/0'/0/0
  const hdKey = HDKey.fromMasterSeed(new Uint8Array(seed));
  const child = hdKey.derive(DERIVATION_PATH);
  
  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }
  
  return Array.from(child.privateKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getTronWeb(privateKey?: string): any {
  const options: any = {
    fullHost: TRONGRID_API,
  };
  
  if (privateKey) {
    options.privateKey = privateKey;
  }
  
  return new (TronWeb as any)(options);
}

// Get Tron address from mnemonic
export async function getTronAddress(mnemonic: string): Promise<string> {
  const privateKey = await getPrivateKeyFromMnemonic(mnemonic);
  const tronWeb = getTronWeb(privateKey);
  const address = tronWeb.address.fromPrivateKey(privateKey);
  if (!address) throw new Error('Failed to derive Tron address');
  return address;
}

// Get TRX balance
export async function getTronBalance(mnemonic: string): Promise<string> {
  const privateKey = await getPrivateKeyFromMnemonic(mnemonic);
  const tronWeb = getTronWeb(privateKey);
  const address = tronWeb.address.fromPrivateKey(privateKey);
  
  const balance = await tronWeb.trx.getBalance(address);
  return tronWeb.fromSun(balance).toString();
}

// Get TRC20 token balance
export async function getTRC20Balance(mnemonic: string, tokenAddress: string): Promise<string> {
  const privateKey = await getPrivateKeyFromMnemonic(mnemonic);
  const tronWeb = getTronWeb(privateKey);
  const address = tronWeb.address.fromPrivateKey(privateKey);
  
  const contract = await tronWeb.contract().at(tokenAddress);
  const balance = await contract.balanceOf(address).call();
  const decimals = await contract.decimals().call();
  
  return (BigInt(balance.toString()) / BigInt(10 ** Number(decimals))).toString();
}

// Sign TRX transfer transaction
export async function signTronTransaction(
  mnemonic: string,
  request: TronTransactionRequest
): Promise<SignedTronTransaction> {
  const privateKey = await getPrivateKeyFromMnemonic(mnemonic);
  const tronWeb = getTronWeb(privateKey);
  const fromAddress = await getTronAddress(mnemonic);

  if (request.currency === 'TRX') {
    const amount = tronWeb.toSun(parseFloat(request.amount));
    const unsignedTx = await tronWeb.transactionBuilder.sendTrx(request.to, amount, fromAddress);
    const signedTx = await tronWeb.trx.sign(unsignedTx, privateKey);
    
    return {
      signedTx,
      txID: signedTx.txID,
      from: fromAddress,
      to: request.to,
      amount: request.amount,
    };
  } else {
    const tokenConfig = (TOKEN_CONTRACTS as any)[request.currency];
    const contract = await tronWeb.contract().at(tokenConfig.address);
    const amount = BigInt(parseFloat(request.amount) * (10 ** tokenConfig.decimals));
    
    const txID = await contract.transfer(request.to, amount.toString()).send({ from: fromAddress });
    
    return {
      signedTx: { txID },
      txID,
      from: fromAddress,
      to: request.to,
      amount: request.amount,
    };
  }
}

// Broadcast signed transaction
export async function broadcastTronTransaction(signedTx: any): Promise<string> {
  const tronWeb = getTronWeb();
  const result = await tronWeb.trx.sendRawTransaction(signedTx);
  
  if (!result.result) {
    throw new Error(`Broadcast failed: ${result.code || 'Unknown error'}`);
  }
  
  return result.txid;
}

// Sign a message
export async function signTronMessage(mnemonic: string, message: string): Promise<string> {
  const privateKey = await getPrivateKeyFromMnemonic(mnemonic);
  const tronWeb = getTronWeb(privateKey);
  
  const messageHex = tronWeb.toHex(message);
  const signature = await tronWeb.trx.signMessageV2(messageHex, privateKey);
  
  return signature;
}
