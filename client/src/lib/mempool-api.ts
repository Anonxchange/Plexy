// Mempool.space API integration
// Free, open-source Bitcoin blockchain API with no rate limits
// Documentation: https://mempool.space/api/v1/docs
// Using pure REST API for browser compatibility (no Node.js dependencies)

const MEMPOOL_API = 'https://mempool.space/api/v1';

export interface MempoolBlock {
  id: string;
  timestamp: number;
  bits: number;
  difficulty: number;
  excess_data: string;
  extras: {
    pool: {
      id: number;
      name: string;
      slug: string;
    };
    coinbase_raw: string;
    coinbase_address: string | null;
    median_fee: number;
    fees: {
      min: number;
      max: number;
      avg: number;
    };
    total_fee_usd: number;
    avg_fee_rate: number;
    utxo_set_change: number;
    utxo_set_size: number;
  };
  height: number;
  previousblockhash: string;
  size: number;
  strippedsize: number;
  weight: number;
  merkleroot: string;
  tx_count: number;
  nonce: number;
  version: number;
  time: number;
}

export interface MempoolTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout?: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      value: number;
    };
    scriptsig: string;
    scriptsig_asm: string;
    is_coinbase: boolean;
    sequence: number;
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
  rate: number;
  status: {
    confirmed: boolean;
    block_height: number | null;
    block_hash: string | null;
    block_time: number | null;
  };
}

export interface MempoolAddress {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

export interface MempoolStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

// ============== LATEST BLOCKS ==============

export async function getLatestBlocks(limit: number = 5): Promise<MempoolBlock[]> {
  try {
    const response = await fetch(`${MEMPOOL_API}/blocks`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch latest blocks');
    const blocks: MempoolBlock[] = await response.json();
    return blocks.slice(0, limit);
  } catch (error) {
    console.error('Error fetching latest blocks from mempool.space:', error);
    return [];
  }
}

// ============== BLOCK BY HEIGHT ==============

export async function getBlockByHeight(height: number): Promise<MempoolBlock | null> {
  try {
    const response = await fetch(`${MEMPOOL_API}/block-height/${height}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch block by height');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching block at height ${height}:`, error);
    return null;
  }
}

// ============== BLOCK BY HASH ==============

export async function getBlockByHash(blockHash: string): Promise<MempoolBlock | null> {
  try {
    const response = await fetch(`${MEMPOOL_API}/block/${blockHash}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch block by hash');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching block ${blockHash}:`, error);
    return null;
  }
}

// ============== BLOCK TRANSACTIONS ==============

export async function getBlockTransactions(blockHash: string, startIndex: number = 0): Promise<MempoolTransaction[]> {
  try {
    const response = await fetch(`${MEMPOOL_API}/block/${blockHash}/txs/${startIndex}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch block transactions');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching transactions for block ${blockHash}:`, error);
    return [];
  }
}

// ============== TRANSACTION ==============

export async function getTransaction(txHash: string): Promise<MempoolTransaction | null> {
  try {
    const response = await fetch(`${MEMPOOL_API}/tx/${txHash}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch transaction');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching transaction ${txHash}:`, error);
    return null;
  }
}

// ============== TRANSACTION STATUS ==============

export async function getTransactionStatus(txHash: string): Promise<{ confirmed: boolean; block_height: number | null; block_hash: string | null; block_time: number | null } | null> {
  try {
    const response = await fetch(`${MEMPOOL_API}/tx/${txHash}/status`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch transaction status');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching status for transaction ${txHash}:`, error);
    return null;
  }
}

// ============== ADDRESS ==============

export async function getAddress(address: string): Promise<MempoolAddress | null> {
  try {
    const response = await fetch(`${MEMPOOL_API}/address/${address}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch address');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching address ${address}:`, error);
    return null;
  }
}

// ============== ADDRESS TRANSACTIONS ==============

export async function getAddressTransactions(address: string, lastSeenTxid?: string): Promise<MempoolTransaction[]> {
  try {
    const url = lastSeenTxid 
      ? `${MEMPOOL_API}/address/${address}/txs/chain/${lastSeenTxid}`
      : `${MEMPOOL_API}/address/${address}/txs`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch address transactions');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching transactions for address ${address}:`, error);
    return [];
  }
}

// ============== ADDRESS MEMPOOL (UNCONFIRMED) ==============

export async function getAddressMempoolTransactions(address: string): Promise<MempoolTransaction[]> {
  try {
    const response = await fetch(`${MEMPOOL_API}/address/${address}/txs/mempool`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch mempool transactions');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching mempool transactions for address ${address}:`, error);
    return [];
  }
}

// ============== UNCONFIRMED TRANSACTIONS (MEMPOOL) ==============

export async function getMempool(): Promise<MempoolTransaction[]> {
  try {
    const response = await fetch(`${MEMPOOL_API}/mempool`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch mempool');
    const data = await response.json();
    // Returns count of transactions, not the txs themselves
    return [];
  } catch (error) {
    console.error('Error fetching mempool data:', error);
    return [];
  }
}

// ============== MEMPOOL TRANSACTIONS ==============

export async function getMempoolTransactions(): Promise<any[]> {
  try {
    // Try Blockchain.com first as requested
    try {
      const response = await fetch('https://api.blockchain.info/hathstats/v1/unconfirmed-transactions?cors=true');
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.txs)) {
          return data.txs.slice(0, 10).map((tx: any) => ({
            txid: tx.hash,
            hash: tx.hash,
            from: tx.inputs?.[0]?.prev_out?.addr ? `${tx.inputs[0].prev_out.addr.substring(0, 4)}...` : "Unknown",
            to: tx.out?.[0]?.addr ? `${tx.out[0].addr.substring(0, 4)}...` : "Multiple",
            amount_btc: (tx.out?.reduce((s: number, o: any) => s + (o.value || 0), 0) / 100000000).toFixed(4),
            time: tx.time,
            status: { confirmed: false }
          }));
        }
      }
    } catch (e) {
      console.warn("Blockchain.info API failed:", e);
    }

    // Secondary source: mempool.space (Highly reliable)
    const mpResponse = await fetch('https://mempool.space/api/mempool/recent');
    if (mpResponse.ok) {
      const recentTxns = await mpResponse.json();
      if (Array.isArray(recentTxns)) {
        return recentTxns.slice(0, 10).map((tx: any) => ({
          txid: tx.txid,
          hash: tx.txid,
          from: "Mempool",
          to: "Multiple",
          amount_btc: (tx.value / 100000000).toFixed(4),
          time: tx.time || Math.floor(Date.now() / 1000),
          status: { confirmed: false }
        }));
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error in getMempoolTransactions:', error);
    return [];
  }
}

// ============== MEMPOOL STATS ==============

export async function getMempoolStats(): Promise<any> {
  try {
    const response = await fetch(`${MEMPOOL_API}/mempool`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch mempool stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching mempool stats:', error);
    return null;
  }
}

// ============== BLOCKS STATS ==============

export async function getBlockStats(blockHash: string): Promise<any> {
  try {
    const response = await fetch(`${MEMPOOL_API}/block/${blockHash}/stats`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch block stats');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching stats for block ${blockHash}:`, error);
    return null;
  }
}

// ============== FEE ESTIMATES ==============

export interface FeeEstimate {
  '30min': number;
  '1h': number;
  '2h': number;
  '3h': number;
  '4h': number;
  '6h': number;
  '12h': number;
  '24h': number;
}

export async function getFeeEstimates(): Promise<FeeEstimate | null> {
  try {
    const response = await fetch(`${MEMPOOL_API}/fees/recommended`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch fee estimates');
    return await response.json();
  } catch (error) {
    console.error('Error fetching fee estimates:', error);
    return null;
  }
}

// ============== FORMATTING FUNCTIONS ==============

export function satoshiToBTC(satoshi: number): number {
  return satoshi / 100000000;
}

export function btcToSatoshi(btc: number): number {
  return btc * 100000000;
}

export function formatBTC(btc: number, decimals: number = 8): string {
  return btc.toFixed(decimals);
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

export function satsToBTC(sats: number): number {
  return sats / 100000000;
}

export function formatSats(sats: number): string {
  const btc = satsToBTC(sats);
  return btc.toFixed(8);
}

// ============== MEMPOOL BYTES PER FEE ==============

export async function getMempoolBytesPerFee(): Promise<any> {
  try {
    const response = await fetch(`${MEMPOOL_API}/mempool`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch mempool bytes per fee');
    return await response.json();
  } catch (error) {
    console.error('Error fetching mempool bytes per fee:', error);
    return null;
  }
}
