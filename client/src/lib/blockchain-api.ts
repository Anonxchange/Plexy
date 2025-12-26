// Blockchain.com API utilities
// Free API with no authentication required
// Base URL: https://blockchain.info/

const BLOCKCHAIN_API_BASE = 'https://blockchain.info';

export interface Block {
  hash: string;
  height: number;
  time: number;
  tx_indices: Array<{ tx_index: number; n_tx: number }>;
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
}

export interface Address {
  hash160: string;
  address: string;
  n_tx: number;
  total_received: number;
  total_sent: number;
  final_balance: number;
}

// Get latest blocks
export async function getLatestBlocks(limit: number = 5): Promise<Block[]> {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_BASE}/latestblock?format=json`, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch blocks');
    
    const data = await response.json();
    
    // The API returns the latest block, we'll return it as an array
    return [data];
  } catch (error) {
    console.error('Error fetching latest blocks:', error);
    return [];
  }
}

// Get a specific block by hash
export async function getBlock(blockHash: string): Promise<Block | null> {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_BASE}/rawblock/${blockHash}?format=json`, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch block');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching block:', error);
    return null;
  }
}

// Get a specific transaction by hash
export async function getTransaction(txHash: string): Promise<Transaction | null> {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_BASE}/rawtx/${txHash}?format=json`, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch transaction');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

// Get address information
export async function getAddress(address: string): Promise<Address | null> {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_BASE}/address/${address}?format=json`, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch address');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching address:', error);
    return null;
  }
}

// Get blockchain statistics
export async function getStats() {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_BASE}/stats?format=json`, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch stats');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

// Get address balance (simple query)
export async function getAddressBalance(address: string): Promise<number | null> {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_BASE}/q/addressbalance/${address}`);
    
    if (!response.ok) throw new Error('Failed to fetch balance');
    
    const satoshi = await response.text();
    return parseInt(satoshi, 10) / 100000000; // Convert to BTC
  } catch (error) {
    console.error('Error fetching balance:', error);
    return null;
  }
}

// Format satoshi to BTC
export function satoshiToBTC(satoshi: number): number {
  return satoshi / 100000000;
}

// Format BTC with proper decimals
export function formatBTC(btc: number, decimals: number = 8): string {
  return btc.toFixed(decimals);
}

// Format transaction hash (truncate middle)
export function formatHash(hash: string, chars: number = 8): string {
  if (hash.length <= chars * 2) return hash;
  return `${hash.substring(0, chars)}...${hash.substring(hash.length - chars)}`;
}

// Format address (truncate middle)
export function formatAddress(address: string, chars: number = 6): string {
  if (address.length <= chars * 2) return address;
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

// Convert timestamp to readable date
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}
