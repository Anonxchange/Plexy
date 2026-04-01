// Multi-blockchain API utilities
// BTC: powered by mempool.space (https://mempool.space/docs/api/rest)
// ETH: powered by Etherscan (https://docs.etherscan.io/)

export type Blockchain = 'BTC' | 'ETH';

const MEMPOOL_BASE = 'https://mempool.space/api';
const MEMPOOL_V1 = 'https://mempool.space/api/v1';
const ETH_API = 'https://api.etherscan.io/api';

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
  fee?: number;
  size?: number;
  from?: string;
  to?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
}

export interface Address {
  address: string;
  n_tx: number;
  total_received: number;
  total_sent: number;
  final_balance: number;
  balance?: string;
  txs?: any[];
}

// ============== BITCOIN — mempool.space ==============

async function getBTC_LatestBlocks(limit: number = 5): Promise<Block[]> {
  try {
    const response = await fetch(`${MEMPOOL_V1}/blocks`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blocks: any[] = await response.json();
    return blocks.slice(0, limit).map(b => ({
      hash: b.id,
      height: b.height,
      time: b.timestamp,
      n_tx: b.tx_count,
      size: b.size,
      miner: b.extras?.pool?.name,
      prev_block: b.previousblockhash,
    }));
  } catch (error) {
    console.error('Error fetching BTC blocks:', error);
    return [];
  }
}

async function getBTC_Block(blockHashOrHeight: string): Promise<Block | null> {
  try {
    let hash = blockHashOrHeight;

    // If height (numeric), first resolve to hash
    if (/^\d+$/.test(blockHashOrHeight)) {
      const hashRes = await fetch(`${MEMPOOL_BASE}/block-height/${blockHashOrHeight}`);
      if (!hashRes.ok) throw new Error(`Height lookup HTTP ${hashRes.status}`);
      hash = (await hashRes.text()).trim();
    }

    const response = await fetch(`${MEMPOOL_BASE}/block/${hash}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const b = await response.json();
    return {
      hash: b.id,
      height: b.height,
      time: b.timestamp,
      n_tx: b.tx_count,
      size: b.size,
      miner: b.extras?.pool?.name,
      prev_block: b.previousblockhash,
    };
  } catch (error) {
    console.error('Error fetching BTC block:', error);
    return null;
  }
}

async function getBTC_Transaction(txHash: string): Promise<Transaction | null> {
  try {
    const response = await fetch(`${MEMPOOL_BASE}/tx/${txHash}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const tx = await response.json();

    const totalOutput: number = tx.vout.reduce((sum: number, o: any) => sum + o.value, 0);
    const vsize = Math.ceil(tx.weight / 4);

    return {
      hash: tx.txid,
      time: tx.status.block_time ?? undefined,
      block_height: tx.status.block_height ?? undefined,
      inputs: tx.vin.map((v: any) => ({
        prev_out: v.prevout
          ? {
              addr: v.prevout.scriptpubkey_address || '',
              value: v.prevout.value,
              n: 0,
            }
          : undefined,
      })),
      out: tx.vout.map((o: any, i: number) => ({
        addr: o.scriptpubkey_address || '',
        value: o.value,
        n: i,
      })),
      total: totalOutput,
      fee: tx.fee,
      size: vsize,
    };
  } catch (error) {
    console.error('Error fetching BTC transaction:', error);
    return null;
  }
}

async function getBTC_Address(address: string): Promise<Address | null> {
  try {
    const [addrRes, txRes] = await Promise.all([
      fetch(`${MEMPOOL_BASE}/address/${address}`, { headers: { 'Accept': 'application/json' } }),
      fetch(`${MEMPOOL_BASE}/address/${address}/txs`, { headers: { 'Accept': 'application/json' } }),
    ]);

    if (!addrRes.ok) throw new Error(`Address HTTP ${addrRes.status}`);
    const addrData = await addrRes.json();

    let txs: any[] = [];
    if (txRes.ok) {
      const rawTxs: any[] = await txRes.json();
      txs = rawTxs.map(tx => {
        const totalOutput: number = tx.vout.reduce((sum: number, o: any) => sum + o.value, 0);
        const outputToAddr: number = tx.vout
          .filter((o: any) => o.scriptpubkey_address === address)
          .reduce((sum: number, o: any) => sum + o.value, 0);
        const inputFromAddr: number = tx.vin
          .filter((v: any) => v.prevout?.scriptpubkey_address === address)
          .reduce((sum: number, v: any) => sum + (v.prevout?.value ?? 0), 0);
        const result = outputToAddr - inputFromAddr;
        const vsize = Math.ceil(tx.weight / 4);

        return {
          hash: tx.txid,
          time: tx.status.block_time ?? undefined,
          block_height: tx.status.block_height ?? undefined,
          confirmed: tx.status.confirmed,
          inputs: tx.vin.map((v: any) => ({
            prev_out: v.prevout
              ? {
                  addr: v.prevout.scriptpubkey_address || '',
                  value: v.prevout.value,
                  n: 0,
                }
              : undefined,
          })),
          out: tx.vout.map((o: any, i: number) => ({
            addr: o.scriptpubkey_address || '',
            value: o.value,
            n: i,
          })),
          result,
          fee: tx.fee,
          size: vsize,
          total: totalOutput,
        };
      });
    }

    const confirmedBalance: number =
      addrData.chain_stats.funded_txo_sum - addrData.chain_stats.spent_txo_sum;
    const unconfirmedDelta: number =
      addrData.mempool_stats.funded_txo_sum - addrData.mempool_stats.spent_txo_sum;

    return {
      address: addrData.address,
      n_tx: addrData.chain_stats.tx_count + addrData.mempool_stats.tx_count,
      total_received: addrData.chain_stats.funded_txo_sum,
      total_sent: addrData.chain_stats.spent_txo_sum,
      final_balance: confirmedBalance + unconfirmedDelta,
      txs,
    };
  } catch (error) {
    console.error('Error fetching BTC address:', error);
    return null;
  }
}

// ============== ETHEREUM — Etherscan ==============

const ETH_ALLOWED_ORIGIN = new Set(['https://api.etherscan.io']);

function buildEthUrl(params: Record<string, string>): string {
  const url = new URL(ETH_API);
  if (!ETH_ALLOWED_ORIGIN.has(url.origin)) throw new Error('Blocked: unexpected ETH API host');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.href;
}

async function getETH_LatestBlocks(limit: number = 5): Promise<Block[]> {
  try {
    const url = buildEthUrl({
      module: 'proxy',
      action: 'eth_blockNumber',
      apikey: 'YourApiKeyToken',
    });
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const blockNum = parseInt(data.result, 16);
    return [{
      hash: '0x' + '0'.repeat(64),
      height: blockNum,
      time: Math.floor(Date.now() / 1000),
      n_tx: 0,
      size: 0,
    }];
  } catch (error) {
    console.error('Error fetching ETH blocks:', error);
    return [];
  }
}

async function getETH_Block(blockHash: string): Promise<Block | null> {
  try {
    const url = buildEthUrl({
      module: 'proxy',
      action: 'eth_getBlockByHash',
      blockHash,
      boolean: 'true',
      apikey: 'YourApiKeyToken',
    });
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.result) return null;
    return {
      hash: data.result.hash,
      height: parseInt(data.result.number, 16),
      time: parseInt(data.result.timestamp, 16),
      n_tx: data.result.transactions?.length ?? 0,
      size: 0,
      miner: data.result.miner,
    };
  } catch (error) {
    console.error('Error fetching ETH block:', error);
    return null;
  }
}

async function getETH_Transaction(txHash: string): Promise<Transaction | null> {
  try {
    const url = buildEthUrl({
      module: 'proxy',
      action: 'eth_getTransactionByHash',
      txhash: txHash,
      apikey: 'YourApiKeyToken',
    });
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.result) return null;
    return {
      hash: data.result.hash,
      time: Math.floor(Date.now() / 1000),
      block_height: data.result.blockNumber ? parseInt(data.result.blockNumber, 16) : undefined,
      inputs: [],
      out: [],
      from: data.result.from,
      to: data.result.to,
      value: data.result.value,
      gas: data.result.gas,
      gasPrice: data.result.gasPrice,
    };
  } catch (error) {
    console.error('Error fetching ETH transaction:', error);
    return null;
  }
}

async function getETH_Address(address: string): Promise<Address | null> {
  try {
    const balanceUrl = buildEthUrl({
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest',
      apikey: 'YourApiKeyToken',
    });
    const balanceRes = await fetch(balanceUrl, { headers: { 'Accept': 'application/json' } });
    if (!balanceRes.ok) throw new Error(`HTTP ${balanceRes.status}`);
    const balanceData = await balanceRes.json();

    const txUrl = buildEthUrl({
      module: 'account',
      action: 'txlist',
      address,
      startblock: '0',
      endblock: '99999999',
      sort: 'desc',
      apikey: 'YourApiKeyToken',
    });
    const txRes = await fetch(txUrl, { headers: { 'Accept': 'application/json' } });
    const txData = txRes.ok ? await txRes.json() : { result: [] };
    const txs = Array.isArray(txData.result) ? txData.result : [];

    let totalReceived = 0;
    let totalSent = 0;
    txs.forEach((tx: any) => {
      const val = parseInt(tx.value) || 0;
      if (tx.from?.toLowerCase() === address.toLowerCase()) totalSent += val;
      else if (tx.to?.toLowerCase() === address.toLowerCase()) totalReceived += val;
    });

    return {
      address,
      n_tx: txs.length,
      total_received: totalReceived,
      total_sent: totalSent,
      final_balance: parseInt(balanceData.result) || 0,
      balance: balanceData.result,
      txs,
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

export async function getBlock(blockHashOrHeight: string): Promise<Block | null> {
  return currentBlockchain === 'BTC'
    ? getBTC_Block(blockHashOrHeight)
    : getETH_Block(blockHashOrHeight);
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
    if (currentBlockchain !== 'BTC') return { message: 'Stats available via Etherscan' };
    const [mempoolRes, blocksRes] = await Promise.all([
      fetch(`${MEMPOOL_BASE}/mempool`, { headers: { 'Accept': 'application/json' } }),
      fetch(`${MEMPOOL_V1}/blocks`, { headers: { 'Accept': 'application/json' } }),
    ]);
    const mempool = mempoolRes.ok ? await mempoolRes.json() : {};
    const blocks = blocksRes.ok ? await blocksRes.json() : [];
    return { mempool, latestBlock: blocks[0] ?? null };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

export async function getAddressBalance(address: string): Promise<number | null> {
  try {
    if (currentBlockchain === 'BTC') {
      const res = await fetch(`${MEMPOOL_BASE}/address/${address}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      const unconfirmed = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
      return (confirmed + unconfirmed) / 100000000;
    } else {
      const url = buildEthUrl({
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
        apikey: 'YourApiKeyToken',
      });
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return parseInt(data.result) / 1e18;
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    return null;
  }
}

export async function getBTCPrice(): Promise<number> {
  try {
    const res = await fetch(`${MEMPOOL_V1}/prices`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return typeof data.USD === 'number' ? data.USD : 0;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return 0;
  }
}

export async function getUnconfirmedTransactions(): Promise<any[]> {
  try {
    const response = await fetch(`${MEMPOOL_BASE}/mempool/recent`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: any[] = await response.json();
    return data.map(tx => ({
      hash: tx.txid,
      time: Math.floor(Date.now() / 1000),
      size: tx.vsize || 0,
      tx_index: 0,
      inputs: [],
      out: [],
      fee: tx.fee,
      vsize: tx.vsize,
      value: tx.value,
    }));
  } catch (error) {
    console.error('Error fetching unconfirmed transactions:', error);
    return [];
  }
}

// ============== FORMATTING HELPERS ==============

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

// ============== ANALYTICS / CHART FUNCTIONS ==============
// These use mempool.space to derive chart-ready data for the Transactions page.

export interface BlockStatistics {
  date: string;
  avgTransactionsPerBlock: number;
  totalBlocks: number;
  totalTransactions: number;
}

export interface TransactionMetrics {
  date: string;
  value: number;
}

function buildDateLabel(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}

// Derives avg tx/block from the latest 10 mempool.space blocks.
// Returns one entry per day for the past `days` days.
export async function getAverageTransactionsPerBlock(days: number = 7): Promise<BlockStatistics[]> {
  try {
    const blocks = await getBTC_LatestBlocks(10);
    const avgTxCount = blocks.length
      ? Math.round(blocks.reduce((s, b) => s + b.n_tx, 0) / blocks.length)
      : 3500;

    return Array.from({ length: days }, (_, i) => ({
      date: buildDateLabel(days - 1 - i),
      avgTransactionsPerBlock: avgTxCount,
      totalBlocks: 144,
      totalTransactions: avgTxCount * 144,
    }));
  } catch {
    return [];
  }
}

// Derives daily total tx count from the latest 10 blocks (value in millions).
export async function getTotalTransactionsData(days: number = 7): Promise<TransactionMetrics[]> {
  try {
    const blocks = await getBTC_LatestBlocks(10);
    const avgTxCount = blocks.length
      ? Math.round(blocks.reduce((s, b) => s + b.n_tx, 0) / blocks.length)
      : 3500;
    const dailyTotal = avgTxCount * 144;

    return Array.from({ length: days }, (_, i) => ({
      date: buildDateLabel(days - 1 - i),
      value: parseFloat((dailyTotal / 1_000_000).toFixed(4)),
    }));
  } catch {
    return [];
  }
}

// Bitcoin produces ~144 blocks per day. Each block = 1 confirmation wave.
export async function getConfirmationsPerDayData(days: number = 7): Promise<TransactionMetrics[]> {
  return Array.from({ length: days }, (_, i) => ({
    date: buildDateLabel(days - 1 - i),
    value: 144,
  }));
}

// Bitcoin average block time ≈ 10 minutes.
export async function getAverageTransactionTimeData(days: number = 7): Promise<TransactionMetrics[]> {
  return Array.from({ length: days }, (_, i) => ({
    date: buildDateLabel(days - 1 - i),
    value: 10,
  }));
}

// Returns the mempool fee histogram as chart-ready data { fee, vsize }.
export async function getMempoolBytesPerFee(): Promise<any[]> {
  try {
    const res = await fetch(`${MEMPOOL_BASE}/mempool`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.fee_histogram)) return [];
    return data.fee_histogram.slice(0, 20).map(([fee, vsize]: [number, number]) => ({
      fee: Math.round(fee * 10) / 10,
      vsize: Math.round(vsize / 1000),
    }));
  } catch {
    return [];
  }
}
