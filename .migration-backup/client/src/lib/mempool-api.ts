// Mempool.space API integration
// Free, open-source Bitcoin blockchain API
// Documentation: https://mempool.space/docs/api/rest
// Correct base URLs (confirmed against live API):
//   /api/v1/blocks           ✓
//   /api/v1/fees/recommended ✓
//   Everything else uses /api (NOT /api/v1)

const MEMPOOL_BASE = 'https://mempool.space/api';
const MEMPOOL_V1 = 'https://mempool.space/api/v1';

export interface MempoolBlock {
  id: string;
  timestamp: number;
  bits: number;
  difficulty: number;
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
      scriptpubkey_address?: string;
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
    scriptpubkey_address?: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
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

export interface FeeEstimate {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

// ============== LATEST BLOCKS ==============
// Endpoint: GET /api/v1/blocks — returns up to 10 most recent blocks

export async function getLatestBlocks(limit: number = 5): Promise<MempoolBlock[]> {
  try {
    const response = await fetch(`${MEMPOOL_V1}/blocks`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blocks: MempoolBlock[] = await response.json();
    return blocks.slice(0, limit);
  } catch (error) {
    console.error('Error fetching latest blocks:', error);
    return [];
  }
}

// ============== CURRENT BLOCK TIP HEIGHT ==============
// Endpoint: GET /api/blocks/tip/height — returns plain-text integer

export async function getBlockTipHeight(): Promise<number> {
  try {
    const response = await fetch(`${MEMPOOL_BASE}/blocks/tip/height`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    return parseInt(text, 10);
  } catch (error) {
    console.error('Error fetching block tip height:', error);
    return 0;
  }
}

// ============== BLOCK BY HEIGHT ==============
// Step 1: GET /api/block-height/:height → plain-text hash string
// Step 2: GET /api/block/:hash → block object

export async function getBlockByHeight(height: number): Promise<MempoolBlock | null> {
  try {
    const hashRes = await fetch(`${MEMPOOL_BASE}/block-height/${height}`);
    if (!hashRes.ok) throw new Error(`Hash fetch HTTP ${hashRes.status}`);
    const hash = (await hashRes.text()).trim();
    return getBlockByHash(hash);
  } catch (error) {
    console.error(`Error fetching block at height ${height}:`, error);
    return null;
  }
}

// ============== BLOCK BY HASH ==============
// Endpoint: GET /api/block/:hash

export async function getBlockByHash(blockHash: string): Promise<MempoolBlock | null> {
  try {
    const response = await fetch(`${MEMPOOL_BASE}/block/${blockHash}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching block ${blockHash}:`, error);
    return null;
  }
}

// ============== BLOCK TRANSACTIONS ==============
// Endpoint: GET /api/block/:hash/txs[/:startIndex]

export async function getBlockTransactions(blockHash: string, startIndex: number = 0): Promise<MempoolTransaction[]> {
  try {
    const url = startIndex > 0
      ? `${MEMPOOL_BASE}/block/${blockHash}/txs/${startIndex}`
      : `${MEMPOOL_BASE}/block/${blockHash}/txs`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching transactions for block ${blockHash}:`, error);
    return [];
  }
}

// ============== TRANSACTION ==============
// Endpoint: GET /api/tx/:txid

export async function getTransaction(txHash: string): Promise<MempoolTransaction | null> {
  try {
    const response = await fetch(`${MEMPOOL_BASE}/tx/${txHash}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching transaction ${txHash}:`, error);
    return null;
  }
}

// ============== TRANSACTION STATUS ==============
// Endpoint: GET /api/tx/:txid/status

export async function getTransactionStatus(txHash: string): Promise<{
  confirmed: boolean;
  block_height: number | null;
  block_hash: string | null;
  block_time: number | null;
} | null> {
  try {
    const response = await fetch(`${MEMPOOL_BASE}/tx/${txHash}/status`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching status for transaction ${txHash}:`, error);
    return null;
  }
}

// ============== ADDRESS ==============
// Endpoint: GET /api/address/:address

export async function getAddress(address: string): Promise<MempoolAddress | null> {
  try {
    const response = await fetch(`${MEMPOOL_BASE}/address/${address}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching address ${address}:`, error);
    return null;
  }
}

// ============== ADDRESS TRANSACTIONS ==============
// Endpoint: GET /api/address/:address/txs
// Pagination: GET /api/address/:address/txs/chain/:lastSeenTxid

export async function getAddressTransactions(address: string, lastSeenTxid?: string): Promise<MempoolTransaction[]> {
  try {
    const url = lastSeenTxid
      ? `${MEMPOOL_BASE}/address/${address}/txs/chain/${lastSeenTxid}`
      : `${MEMPOOL_BASE}/address/${address}/txs`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching transactions for address ${address}:`, error);
    return [];
  }
}

// ============== ADDRESS MEMPOOL (UNCONFIRMED) ==============
// Endpoint: GET /api/address/:address/txs/mempool

export async function getAddressMempoolTransactions(address: string): Promise<MempoolTransaction[]> {
  try {
    const response = await fetch(`${MEMPOOL_BASE}/address/${address}/txs/mempool`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching mempool transactions for address ${address}:`, error);
    return [];
  }
}

// ============== MEMPOOL STATS ==============
// Endpoint: GET /api/mempool
// Returns: { count, vsize, total_fee, fee_histogram }

export async function getMempoolStats(): Promise<any> {
  try {
    const response = await fetch(`${MEMPOOL_BASE}/mempool`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching mempool stats:', error);
    return null;
  }
}

// ============== RECENT MEMPOOL TRANSACTIONS ==============
// Endpoint: GET /api/mempool/recent
// Returns last 10 txs to enter the mempool: [{ txid, fee, vsize, value }, ...]

export async function getMempoolTransactions(): Promise<any[]> {
  try {
    const response = await fetch(`${MEMPOOL_BASE}/mempool/recent`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const recentTxns: any[] = await response.json();
    return recentTxns.slice(0, 10).map((tx: any) => ({
      txid: tx.txid,
      hash: tx.txid,
      from: 'Mempool',
      to: 'Multiple',
      amount_btc: (tx.value / 100000000).toFixed(8),
      fee: tx.fee,
      vsize: tx.vsize,
      time: Math.floor(Date.now() / 1000),
      status: { confirmed: false }
    }));
  } catch (error) {
    console.error('Error fetching recent mempool transactions:', error);
    return [];
  }
}

// ============== FEE ESTIMATES ==============
// Endpoint: GET /api/v1/fees/recommended

export async function getFeeEstimates(): Promise<FeeEstimate | null> {
  try {
    const response = await fetch(`${MEMPOOL_V1}/fees/recommended`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching fee estimates:', error);
    return null;
  }
}

// ============== BLOCK STATS ==============
// Endpoint: GET /api/block/:hash/stats

export async function getBlockStats(blockHash: string): Promise<any> {
  try {
    const response = await fetch(`${MEMPOOL_BASE}/block/${blockHash}/stats`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching stats for block ${blockHash}:`, error);
    return null;
  }
}

// ============== FORMATTING HELPERS ==============

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
  if (!hash || hash.length <= chars * 2) return hash;
  return `${hash.substring(0, chars)}...${hash.substring(hash.length - chars)}`;
}

export function formatAddress(address: string, chars: number = 6): string {
  if (!address || address.length <= chars * 2) return address;
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function satsToBTC(sats: number): number {
  return sats / 100000000;
}

export function formatSats(sats: number): string {
  return satsToBTC(sats).toFixed(8);
}

// Calculate virtual size (vBytes) from weight
export function weightToVsize(weight: number): number {
  return Math.ceil(weight / 4);
}

// Calculate fee rate in sat/vB
export function calcFeeRate(fee: number, weight: number): number {
  const vsize = weightToVsize(weight);
  return vsize > 0 ? Math.round(fee / vsize) : 0;
}
