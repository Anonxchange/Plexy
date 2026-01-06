// Tron P2P Escrow - Using TronWeb for multi-sig like functionality
import { TronWeb } from 'tronweb';
import { mnemonicToSeed } from '../keyDerivation';
import { HDKey } from '@scure/bip32';
import { TOKEN_CONTRACTS } from '../types';

const DERIVATION_PATH = "m/44'/195'/0'/0/0";
const TRONGRID_API = 'https://api.trongrid.io';

export interface TronEscrowParticipant {
  role: 'seller' | 'buyer' | 'moderator';
  address: string;
}

export interface TronEscrowTrade {
  escrowAddress: string;
  tradeId: string;
  seller: TronEscrowParticipant;
  buyer: TronEscrowParticipant;
  moderator: TronEscrowParticipant;
  requiredSignatures: number;
}

export interface TronEscrowReleaseRequest {
  escrowAddress: string;
  recipientAddress: string;
  amount: string;
  currency: 'TRX' | 'USDT_TRX';
  tradeId: string;
}

export interface SignedTronEscrowRelease {
  partialSignature: string;
  transaction: any;
  signerAddress: string;
  tradeId: string;
}

function getPrivateKeyFromMnemonic(mnemonic: string): string {
  const seed = mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(DERIVATION_PATH);
  
  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }
  
  return Buffer.from(child.privateKey).toString('hex');
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

// Get escrow address info from mnemonic
export function getEscrowAddress(mnemonic: string): { address: string; privateKey: string } {
  const privateKey = getPrivateKeyFromMnemonic(mnemonic);
  const tronWeb = getTronWeb(privateKey);
  const address = tronWeb.address.fromPrivateKey(privateKey);
  
  if (!address) {
    throw new Error('Failed to derive Tron address');
  }
  
  return { address, privateKey };
}

// Create escrow trade configuration
// For Tron, the seller's address acts as the escrow holder
// Multi-sig is simulated through off-chain signature collection
export function createEscrowTrade(
  sellerAddress: string,
  buyerAddress: string,
  moderatorAddress: string,
  tradeId: string
): TronEscrowTrade {
  return {
    escrowAddress: sellerAddress, // Seller holds funds in escrow
    tradeId,
    seller: { role: 'seller', address: sellerAddress },
    buyer: { role: 'buyer', address: buyerAddress },
    moderator: { role: 'moderator', address: moderatorAddress },
    requiredSignatures: 2,
  };
}

// Seller initiates release by signing transaction
export async function sellerSignRelease(
  mnemonic: string,
  request: TronEscrowReleaseRequest
): Promise<SignedTronEscrowRelease> {
  const privateKey = getPrivateKeyFromMnemonic(mnemonic);
  const tronWeb = getTronWeb(privateKey);
  const fromAddress = tronWeb.address.fromPrivateKey(privateKey);

  let unsignedTx: any;
  
  if (request.currency === 'TRX') {
    const amount = tronWeb.toSun(parseFloat(request.amount));
    unsignedTx = await tronWeb.transactionBuilder.sendTrx(
      request.recipientAddress, 
      amount, 
      fromAddress
    );
  } else {
    // TRC20 token transfer
    const tokenConfig = TOKEN_CONTRACTS[request.currency];
    const contract = await tronWeb.contract().at(tokenConfig.address);
    const amount = BigInt(parseFloat(request.amount) * (10 ** tokenConfig.decimals));
    
    // Build TRC20 transfer transaction
    const parameter = [
      { type: 'address', value: request.recipientAddress },
      { type: 'uint256', value: amount.toString() }
    ];
    
    unsignedTx = await tronWeb.transactionBuilder.triggerSmartContract(
      tokenConfig.address,
      'transfer(address,uint256)',
      {},
      parameter,
      fromAddress
    );
    
    unsignedTx = unsignedTx.transaction;
  }
  
  // Sign the transaction
  const signedTx = await tronWeb.trx.sign(unsignedTx, privateKey);
  
  return {
    partialSignature: signedTx.signature?.[0] || '',
    transaction: signedTx,
    signerAddress: fromAddress,
    tradeId: request.tradeId,
  };
}

// Buyer confirms release (off-chain confirmation, seller broadcasts)
export async function buyerConfirmRelease(
  mnemonic: string,
  tradeId: string,
  transactionId: string
): Promise<{ confirmed: boolean; signature: string }> {
  const privateKey = getPrivateKeyFromMnemonic(mnemonic);
  const tronWeb = getTronWeb(privateKey);
  
  // Sign confirmation message
  const confirmationMessage = `CONFIRM_RELEASE:${tradeId}:${transactionId}`;
  const messageHex = tronWeb.toHex(confirmationMessage);
  const signature = await tronWeb.trx.signMessageV2(messageHex, privateKey);
  
  return {
    confirmed: true,
    signature,
  };
}

// Moderator resolves dispute by creating release transaction
export async function moderatorResolveDispute(
  mnemonic: string,
  request: TronEscrowReleaseRequest,
  sellerMnemonic: string // Moderator needs seller's signature for 2-of-3
): Promise<{ txID: string; amount: string }> {
  // Seller signs first
  const sellerSigned = await sellerSignRelease(sellerMnemonic, request);
  
  // Broadcast the seller-signed transaction
  const result = await broadcastEscrowRelease(sellerSigned.transaction);
  
  return {
    txID: result,
    amount: request.amount,
  };
}

// Broadcast signed transaction
export async function broadcastEscrowRelease(signedTx: any): Promise<string> {
  const tronWeb = getTronWeb();
  const result = await tronWeb.trx.sendRawTransaction(signedTx);
  
  if (!result.result) {
    throw new Error(`Broadcast failed: ${result.code || 'Unknown error'}`);
  }
  
  return result.txid;
}

// Get TRX balance of escrow address
export async function getEscrowTrxBalance(address: string): Promise<string> {
  const tronWeb = getTronWeb();
  const balance = await tronWeb.trx.getBalance(address);
  return tronWeb.fromSun(balance).toString();
}

// Get TRC20 balance of escrow address
export async function getEscrowTokenBalance(
  address: string, 
  tokenSymbol: 'USDT_TRX'
): Promise<string> {
  const tronWeb = getTronWeb();
  const tokenConfig = TOKEN_CONTRACTS[tokenSymbol];
  
  const contract = await tronWeb.contract().at(tokenConfig.address);
  const balance = await contract.balanceOf(address).call();
  
  return (BigInt(balance.toString()) / BigInt(10 ** tokenConfig.decimals)).toString();
}

// Fund escrow with TRX
export async function fundEscrowTrx(
  mnemonic: string,
  escrowAddress: string,
  amount: string
): Promise<string> {
  const privateKey = getPrivateKeyFromMnemonic(mnemonic);
  const tronWeb = getTronWeb(privateKey);
  const fromAddress = tronWeb.address.fromPrivateKey(privateKey);
  
  const sunAmount = tronWeb.toSun(parseFloat(amount));
  const unsignedTx = await tronWeb.transactionBuilder.sendTrx(
    escrowAddress,
    sunAmount,
    fromAddress
  );
  
  const signedTx = await tronWeb.trx.sign(unsignedTx, privateKey);
  const result = await tronWeb.trx.sendRawTransaction(signedTx);
  
  if (!result.result) {
    throw new Error(`Fund escrow failed: ${result.code || 'Unknown error'}`);
  }
  
  return result.txid;
}

// Fund escrow with TRC20 token
export async function fundEscrowToken(
  mnemonic: string,
  escrowAddress: string,
  amount: string,
  tokenSymbol: 'USDT_TRX'
): Promise<string> {
  const privateKey = getPrivateKeyFromMnemonic(mnemonic);
  const tronWeb = getTronWeb(privateKey);
  const fromAddress = tronWeb.address.fromPrivateKey(privateKey);
  
  const tokenConfig = TOKEN_CONTRACTS[tokenSymbol];
  const tokenAmount = BigInt(parseFloat(amount) * (10 ** tokenConfig.decimals));
  
  const parameter = [
    { type: 'address', value: escrowAddress },
    { type: 'uint256', value: tokenAmount.toString() }
  ];
  
  const result = await tronWeb.transactionBuilder.triggerSmartContract(
    tokenConfig.address,
    'transfer(address,uint256)',
    {},
    parameter,
    fromAddress
  );
  
  const signedTx = await tronWeb.trx.sign(result.transaction, privateKey);
  const broadcastResult = await tronWeb.trx.sendRawTransaction(signedTx);
  
  if (!broadcastResult.result) {
    throw new Error(`Fund escrow failed: ${broadcastResult.code || 'Unknown error'}`);
  }
  
  return broadcastResult.txid;
}
