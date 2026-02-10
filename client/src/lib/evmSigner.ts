import { ethers } from 'ethers';

export const CHAIN_CONFIGS: Record<string, { rpcUrl: string; chainId: number; symbol: string }> = {
  ETH: {
    rpcUrl: 'https://eth.llamarpc.com',
    chainId: 1,
    symbol: 'ETH'
  },
  BSC: {
    rpcUrl: 'https://binance.llamarpc.com',
    chainId: 56,
    symbol: 'BNB'
  },
  BNB: {
    rpcUrl: 'https://binance.llamarpc.com',
    chainId: 56,
    symbol: 'BNB'
  }
};

export const TOKEN_CONTRACTS: Record<string, { address: string; decimals: number }> = {
  USDT_ETH: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  USDC_ETH: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  USDT_BSC: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
  USDC_BSC: { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
  USDT_BNB: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
  USDC_BNB: { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 }
};

export interface EVMTransactionRequest {
  to: string;
  amount: string;
  currency: 'ETH' | 'BSC' | 'BNB' | 'USDT_ETH' | 'USDC_ETH' | 'USDT_BSC' | 'USDC_BSC' | 'USDT_BNB' | 'USDC_BNB';
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

export async function getEVMBalance(
  mnemonic: string,
  currency: string
): Promise<string> {
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  const config = CHAIN_CONFIGS[currency] || CHAIN_CONFIGS['ETH'];
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  if (currency.includes('USDT') || currency.includes('USDC')) {
    const tokenContract = TOKEN_CONTRACTS[currency];
    if (!tokenContract) return "0";
    const abi = ["function balanceOf(address) view returns (uint256)"];
    const contract = new ethers.Contract(tokenContract.address, abi, provider);
    const balance = await contract.balanceOf(wallet.address);
    return ethers.formatUnits(balance, tokenContract.decimals);
  }
  
  const balance = await provider.getBalance(wallet.address);
  return ethers.formatEther(balance);
}

export async function signEVMTransaction(
  mnemonic: string,
  request: EVMTransactionRequest
): Promise<SignedEVMTransaction> {
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  const config = CHAIN_CONFIGS[request.currency.split('_')[0]] || CHAIN_CONFIGS['ETH'];
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const connectedWallet = wallet.connect(provider);

  let tx: ethers.TransactionRequest = {
    to: request.to,
    value: ethers.parseEther(request.amount),
  };

  if (request.currency.includes('USDT') || request.currency.includes('USDC')) {
    const tokenContract = TOKEN_CONTRACTS[request.currency];
    const abi = ["function transfer(address, uint256) returns (bool)"];
    const contract = new ethers.Contract(tokenContract.address, abi, connectedWallet);
    const amount = ethers.parseUnits(request.amount, tokenContract.decimals);
    const populatedTx = await contract.transfer.populateTransaction(request.to, amount);
    tx = { ...populatedTx, value: 0n };
  }

  const signedTx = await connectedWallet.signTransaction(tx);
  const txResponse = ethers.Transaction.from(signedTx);

  return {
    signedTx,
    txHash: txResponse.hash!,
    from: wallet.address,
    to: request.to,
    value: request.amount,
    currency: request.currency
  };
}

export async function broadcastEVMTransaction(
  signedTx: string,
  chain: string
): Promise<string> {
  const config = CHAIN_CONFIGS[chain] || CHAIN_CONFIGS['ETH'];
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const tx = await provider.broadcastTransaction(signedTx);
  return tx.hash;
}

export async function signEVMMessage(
  mnemonic: string | undefined,
  message: string
): Promise<string> {
  if (!mnemonic) throw new Error("Mnemonic required");
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  return await wallet.signMessage(message);
}

export async function getEVMAddress(mnemonic: string | undefined): Promise<string> {
  if (!mnemonic) throw new Error("Mnemonic required");
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  return wallet.address;
}
