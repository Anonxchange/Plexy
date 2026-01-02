// Ethereum & BSC Transaction Signing (EVM Compatible)
import { ethers } from 'ethers';
import { mnemonicToSeed } from './keyDerivation';
import { HDKey } from '@scure/bip32';

// Basic Chain Configs (Inlined to avoid missing types file issues)
export const CHAIN_CONFIGS = {
  ETH: {
    rpcUrl: 'https://eth.llamarpc.com',
    chainId: 1,
    symbol: 'ETH'
  },
  BSC: {
    rpcUrl: 'https://binance.llamarpc.com',
    chainId: 56,
    symbol: 'BNB'
  }
};

export const TOKEN_CONTRACTS = {
  USDT_ETH: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  USDC_ETH: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  USDT_BSC: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
  USDC_BSC: { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 }
};

const DERIVATION_PATH = "m/44'/60'/0'/0/0";

// ERC20 ABI for token transfers
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export interface EVMTransactionRequest {
  to: string;
  amount: string;
  currency: 'ETH' | 'BSC' | 'USDT_ETH' | 'USDC_ETH' | 'USDT_BSC' | 'USDC_BSC';
  gasPrice?: string;
  gasLimit?: string;
  nonce?: number;
}

export interface SignedEVMTransaction {
  signedTx: string;
  txHash: string;
  from: string;
  to: string;
  value: string;
  currency: string;
}

function getWalletFromMnemonic(mnemonic: string): ethers.Wallet {
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, DERIVATION_PATH);
  return new ethers.Wallet(hdNode.privateKey);
}

function getProvider(chain: 'ETH' | 'BSC'): ethers.JsonRpcProvider {
  const config = CHAIN_CONFIGS[chain];
  return new ethers.JsonRpcProvider(config.rpcUrl, config.chainId);
}

// Get wallet balance
export async function getEVMBalance(
  mnemonic: string,
  currency: 'ETH' | 'BSC' | 'USDT_ETH' | 'USDC_ETH' | 'USDT_BSC' | 'USDC_BSC'
): Promise<string> {
  const wallet = getWalletFromMnemonic(mnemonic);
  const isToken = currency.includes('_');
  const chain = (isToken ? currency.split('_')[1] : currency) as 'ETH' | 'BSC';
  const provider = getProvider(chain);
  
  if (isToken) {
    const tokenConfig = TOKEN_CONTRACTS[currency as keyof typeof TOKEN_CONTRACTS];
    const contract = new ethers.Contract(tokenConfig.address, ERC20_ABI, provider);
    const balance = await contract.balanceOf(wallet.address);
    return ethers.formatUnits(balance, tokenConfig.decimals);
  } else {
    const balance = await provider.getBalance(wallet.address);
    return ethers.formatEther(balance);
  }
}

// Sign native ETH/BNB transaction
export async function signEVMTransaction(
  mnemonic: string,
  request: EVMTransactionRequest
): Promise<SignedEVMTransaction> {
  const wallet = getWalletFromMnemonic(mnemonic);
  const isToken = request.currency.includes('_');
  const chain = (isToken ? request.currency.split('_')[1] : request.currency) as 'ETH' | 'BSC';
  const provider = getProvider(chain);
  const connectedWallet = wallet.connect(provider);

  let tx: ethers.TransactionRequest;

  if (isToken) {
    const tokenConfig = TOKEN_CONTRACTS[request.currency as keyof typeof TOKEN_CONTRACTS];
    const contract = new ethers.Contract(tokenConfig.address, ERC20_ABI, connectedWallet);
    const amount = ethers.parseUnits(request.amount, tokenConfig.decimals);
    const data = contract.interface.encodeFunctionData('transfer', [request.to, amount]);
    
    tx = {
      to: tokenConfig.address,
      data,
      gasLimit: request.gasLimit ? BigInt(request.gasLimit) : BigInt(100000),
    };
  } else {
    tx = {
      to: request.to,
      value: ethers.parseEther(request.amount),
      gasLimit: request.gasLimit ? BigInt(request.gasLimit) : BigInt(21000),
    };
  }

  if (!request.gasPrice) {
    const feeData = await provider.getFeeData();
    tx.gasPrice = feeData.gasPrice;
  } else {
    tx.gasPrice = ethers.parseUnits(request.gasPrice, 'gwei');
  }

  if (request.nonce === undefined) {
    tx.nonce = await provider.getTransactionCount(wallet.address);
  } else {
    tx.nonce = request.nonce;
  }

  const signedTx = await connectedWallet.signTransaction(tx);
  const parsedTx = ethers.Transaction.from(signedTx);

  return {
    signedTx,
    txHash: parsedTx.hash || '',
    from: wallet.address,
    to: request.to,
    value: request.amount,
    currency: request.currency,
  };
}

// Broadcast signed transaction
export async function broadcastEVMTransaction(
  signedTx: string,
  chain: 'ETH' | 'BSC'
): Promise<string> {
  const provider = getProvider(chain);
  const txResponse = await provider.broadcastTransaction(signedTx);
  return txResponse.hash;
}

// Sign a message
export async function signEVMMessage(
  mnemonic: string,
  message: string
): Promise<string> {
  const wallet = getWalletFromMnemonic(mnemonic);
  return wallet.signMessage(message);
}

// Get address from mnemonic
export function getEVMAddress(mnemonic: string): string {
  const wallet = getWalletFromMnemonic(mnemonic);
  return wallet.address;
}

// Solana transaction signing stub (not yet implemented)
export interface SolanaTransactionRequest {
  to: string;
  amount: string;
  currency: 'SOL' | 'USDT_SOL' | 'USDC_SOL';
}

export interface SignedSolanaTransaction {
  signedTx: string;
  txHash: string;
  from: string;
  to: string;
  value: string;
  currency: string;
}

export async function signSolanaTransaction(
  _mnemonic: string,
  _request: SolanaTransactionRequest
): Promise<SignedSolanaTransaction> {
  throw new Error('Solana transaction signing not yet implemented');
}

