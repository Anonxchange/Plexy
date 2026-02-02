// EVM Transaction Signing - Stubbed (ethers removed)
// To re-enable EVM functionality, install ethers: npm install ethers

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
  _mnemonic: string,
  _currency: string
): Promise<string> {
  console.warn('[evmSigner] EVM functionality disabled - ethers package removed');
  return "0";
}

export async function signEVMTransaction(
  _mnemonic: string,
  _request: EVMTransactionRequest
): Promise<SignedEVMTransaction> {
  throw new Error('EVM signing disabled - ethers package removed. Install ethers to re-enable.');
}

export async function broadcastEVMTransaction(
  _signedTx: string,
  _chain: string
): Promise<string> {
  throw new Error('EVM broadcast disabled - ethers package removed. Install ethers to re-enable.');
}

export async function signEVMMessage(
  _mnemonic: string | undefined,
  _message: string
): Promise<string> {
  throw new Error('EVM message signing disabled - ethers package removed. Install ethers to re-enable.');
}

export function getEVMAddress(_mnemonic: string | undefined): string {
  throw new Error('EVM address derivation disabled - ethers package removed. Install ethers to re-enable.');
}
