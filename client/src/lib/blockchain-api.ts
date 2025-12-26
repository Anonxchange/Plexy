// Multi-blockchain API utilities
// Supports: Bitcoin (blockchain.info), Ethereum (Etherscan)

export type Blockchain = 'BTC' | 'ETH';

const BLOCKCHAIN_APIS = {
  BTC: 'https://blockchain.info',
  ETH: 'https://api.etherscan.io/api'
};

// Store current blockchain (default BTC)
let currentBlockchain: Blockchain = 'BTC';

export function setBlockchain(chain: Blockchain) {
  currentBlockchain = chain;
}

export function getBlockchain(): Blockchain {
  return currentBlockchain;
}

export interface Block {
  hash: string;
  height: number;
  time: number;
  tx_indices?: Array<{ tx_index: number; n_tx: number }>;
  n_tx: number;
  size: number;
  miner?: string;
  prev_block?: string;
}

export interface Transaction {
  hash: string;
  time?: number;
  block_height?: number;
  inputs: Array<{
    prev_out?: {
      addr: string;
      value: number;
      n: number;
    };
  }>;
  out: Array<{
    addr: string;
    value: number;
    n: number;
  }>;
  total?: number;
  from?: string;
  to?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  gasUsed?: string;
}

export interface Address {
  hash160?: string;
  address: string;
  n_tx: number;
  total_received: number;
  total_sent: number;
  final_balance: number;
  balance?: string;
  txs?: any[];
}

// ============== BITCOIN FUNCTIONS ==============

async function getBTC_LatestBlocks(limit: number = 5): Promise<Block[]> {
  try {
    const response = await fetch(`${BLOCKCHAIN_APIS.BTC}/latestblock?format=json`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch blocks');
    const data = await response.json();
    return [data];
  } catch (error) {
    console.error('Error fetching BTC blocks:', error);
    return [];
  }
}

async function getBTC_Block(blockHash: string): Promise<Block | null> {
  try {
    const response = await fetch(`${BLOCKCHAIN_APIS.BTC}/rawblock/${blockHash}?format=json`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch block');
    return await response.json();
  } catch (error) {
    console.error('Error fetching BTC block:', error);
    return null;
  }
}

async function getBTC_Transaction(txHash: string): Promise<Transaction | null> {
  try {
    const response = await fetch(`${BLOCKCHAIN_APIS.BTC}/rawtx/${txHash}?format=json`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch transaction');
    return await response.json();
  } catch (error) {
    console.error('Error fetching BTC transaction:', error);
    return null;
  }
}

async function getBTC_Address(address: string): Promise<Address | null> {
  try {
    const response = await fetch(`${BLOCKCHAIN_APIS.BTC}/address/${address}?format=json`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch address');
    return await response.json();
  } catch (error) {
    console.error('Error fetching BTC address:', error);
    return null;
  }
}

// ============== ETHEREUM FUNCTIONS ==============

async function getETH_LatestBlocks(limit: number = 5): Promise<Block[]> {
  try {
    const response = await fetch(
      `${BLOCKCHAIN_APIS.ETH}?module=proxy&action=eth_blockNumber&apikey=YourApiKeyToken`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) throw new Error('Failed to fetch block number');
    const data = await response.json();
    const blockNum = parseInt(data.result, 16);
    
    // Return a mock block for now (Etherscan free API limitations)
    return [{
      hash: '0x' + 'a'.repeat(64),
      height: blockNum,
      time: Math.floor(Date.now() / 1000),
      n_tx: 0,
      size: 0
    }];
  } catch (error) {
    console.error('Error fetching ETH blocks:', error);
    return [];
  }
}

async function getETH_Block(blockHash: string): Promise<Block | null> {
  try {
    const response = await fetch(
      `${BLOCKCHAIN_APIS.ETH}?module=proxy&action=eth_getBlockByHash&blockHash=${blockHash}&boolean=true&apikey=YourApiKeyToken`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) throw new Error('Failed to fetch block');
    const data = await response.json();
    
    if (data.result) {
      return {
        hash: data.result.hash,
        height: parseInt(data.result.number, 16),
        time: parseInt(data.result.timestamp, 16),
        n_tx: data.result.transactions.length,
        size: 0,
        miner: data.result.miner
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching ETH block:', error);
    return null;
  }
}

async function getETH_Transaction(txHash: string): Promise<Transaction | null> {
  try {
    const response = await fetch(
      `${BLOCKCHAIN_APIS.ETH}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=YourApiKeyToken`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) throw new Error('Failed to fetch transaction');
    const data = await response.json();
    
    if (data.result) {
      return {
        hash: data.result.hash,
        time: Math.floor(Date.now() / 1000),
        block_height: parseInt(data.result.blockNumber, 16),
        inputs: [],
        out: [],
        from: data.result.from,
        to: data.result.to,
        value: data.result.value,
        gas: data.result.gas,
        gasPrice: data.result.gasPrice
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching ETH transaction:', error);
    return null;
  }
}

async function getETH_Address(address: string): Promise<Address | null> {
  try {
    // Get balance
    const balanceResponse = await fetch(
      `${BLOCKCHAIN_APIS.ETH}?module=account&action=balance&address=${address}&tag=latest&apikey=YourApiKeyToken`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!balanceResponse.ok) throw new Error('Failed to fetch address');
    const balanceData = await balanceResponse.json();
    
    // Get transactions
    const txResponse = await fetch(
      `${BLOCKCHAIN_APIS.ETH}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=YourApiKeyToken`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    const txData = await txResponse.json();
    const txs = Array.isArray(txData.result) ? txData.result : [];
    
    let totalReceived = 0;
    let totalSent = 0;
    
    txs.forEach((tx: any) => {
      const value = parseInt(tx.value) || 0;
      if (tx.from.toLowerCase() === address.toLowerCase()) {
        totalSent += value;
      } else if (tx.to?.toLowerCase() === address.toLowerCase()) {
        totalReceived += value;
      }
    });
    
    return {
      address: address,
      n_tx: txs.length,
      total_received: totalReceived,
      total_sent: totalSent,
      final_balance: parseInt(balanceData.result) || 0,
      balance: balanceData.result,
      txs: txs
    };
  } catch (error) {
    console.error('Error fetching ETH address:', error);
    return null;
  }
}

// ============== PUBLIC INTERFACE ==============

export async function getLatestBlocks(limit: number = 5): Promise<Block[]> {
  return currentBlockchain === 'BTC' 
    ? getBTC_LatestBlocks(limit)
    : getETH_LatestBlocks(limit);
}

export async function getBlock(blockHash: string): Promise<Block | null> {
  return currentBlockchain === 'BTC'
    ? getBTC_Block(blockHash)
    : getETH_Block(blockHash);
}

export async function getTransaction(txHash: string): Promise<Transaction | null> {
  return currentBlockchain === 'BTC'
    ? getBTC_Transaction(txHash)
    : getETH_Transaction(txHash);
}

export async function getAddress(address: string): Promise<Address | null> {
  return currentBlockchain === 'BTC'
    ? getBTC_Address(address)
    : getETH_Address(address);
}

export async function getStats() {
  try {
    if (currentBlockchain === 'BTC') {
      const response = await fetch(`${BLOCKCHAIN_APIS.BTC}/stats?format=json`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } else {
      return { message: 'Ethereum stats available via Etherscan' };
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

export async function getAddressBalance(address: string): Promise<number | null> {
  try {
    if (currentBlockchain === 'BTC') {
      const response = await fetch(`${BLOCKCHAIN_APIS.BTC}/q/addressbalance/${address}`);
      if (!response.ok) throw new Error('Failed to fetch balance');
      const satoshi = await response.text();
      return parseInt(satoshi, 10) / 100000000;
    } else {
      const response = await fetch(
        `${BLOCKCHAIN_APIS.ETH}?module=account&action=balance&address=${address}&tag=latest&apikey=YourApiKeyToken`
      );
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      return parseInt(data.result) / 1e18;
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    return null;
  }
}

// ============== FORMATTING FUNCTIONS ==============

export function satoshiToBTC(satoshi: number): number {
  return satoshi / 100000000;
}

export function weiToETH(wei: number): number {
  return wei / 1e18;
}

export function formatBTC(btc: number, decimals: number = 8): string {
  return btc.toFixed(decimals);
}

export function formatETH(eth: number, decimals: number = 6): string {
  return eth.toFixed(decimals);
}

export function formatHash(hash: string, chars: number = 8): string {
  if (hash.length <= chars * 2) return hash;
  return `${hash.substring(0, chars)}...${hash.substring(hash.length - chars)}`;
}

export function formatAddress(address: string, chars: number = 6): string {
  if (address.length <= chars * 2) return address;
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

// ============== REAL-TIME FUNCTIONS ==============

export interface UnconfirmedTransaction {
  hash: string;
  time: number;
  size: number;
  tx_index: number;
  inputs: Array<{
    prev_out?: {
      addr: string;
      value: number;
    };
  }>;
  out: Array<{
    addr: string;
    value: number;
  }>;
  total_input?: number;
  total_output?: number;
}

export async function getUnconfirmedTransactions(): Promise<UnconfirmedTransaction[]> {
  try {
    const response = await fetch(`${BLOCKCHAIN_APIS.BTC}/unconfirmed-transactions?format=json`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch unconfirmed transactions');
    const data = await response.json();
    return data.txs || [];
  } catch (error) {
    console.error('Error fetching unconfirmed transactions:', error);
    return [];
  }
}
