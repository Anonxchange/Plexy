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

export interface BlockStatistics {
  date: string;
  avgTransactionsPerBlock: number;
  totalBlocks: number;
  totalTransactions: number;
}

export async function getAverageTransactionsPerBlock(days: number = 7): Promise<BlockStatistics[]> {
  try {
    if (currentBlockchain !== 'BTC') {
      console.warn('Average transactions per block is only available for Bitcoin');
      return [];
    }

    // Get latest block height
    const latestBlocksResponse = await fetch(`${BLOCKCHAIN_APIS.BTC}/latestblock?format=json`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!latestBlocksResponse.ok) throw new Error('Failed to fetch latest block');
    const latestBlockData = await latestBlocksResponse.json();
    const currentHeight = latestBlockData.height;
    
    // Approximately 144 blocks per day for Bitcoin (10 min block time)
    const blocksPerDay = 144;
    const totalBlocksToFetch = Math.min(blocksPerDay * days, 1000);
    
    const stats: BlockStatistics[] = [];
    const blocksSampled: { height: number; txCount: number; timestamp: number }[] = [];
    
    // Sample blocks from the last N days (fetch every ~10 blocks to get good distribution)
    const sampleInterval = Math.max(1, Math.floor(totalBlocksToFetch / 20));
    
    for (let i = 0; i < Math.min(20, totalBlocksToFetch); i++) {
      const blockHeight = currentHeight - (i * sampleInterval);
      if (blockHeight <= 0) break;
      
      try {
        const blockResponse = await fetch(
          `${BLOCKCHAIN_APIS.BTC}/block-height/${blockHeight}?format=json`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (blockResponse.ok) {
          const blockData = await blockResponse.json();
          if (blockData.blocks && blockData.blocks.length > 0) {
            const block = blockData.blocks[0];
            blocksSampled.push({
              height: block.height,
              txCount: block.tx.length,
              timestamp: block.time
            });
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch block ${blockHeight}:`, e);
      }
    }
    
    // Group by day and calculate statistics
    if (blocksSampled.length > 0) {
      const now = Math.floor(Date.now() / 1000);
      const dayInSeconds = 24 * 60 * 60;
      
      for (let d = 0; d < days; d++) {
        const dayStart = now - (d * dayInSeconds);
        const dayEnd = dayStart + dayInSeconds;
        
        const blocksInDay = blocksSampled.filter(b => b.timestamp >= dayStart && b.timestamp < dayEnd);
        
        if (blocksInDay.length > 0) {
          const totalTx = blocksInDay.reduce((sum, b) => sum + b.txCount, 0);
          const avgTx = Math.round(totalTx / blocksInDay.length);
          
          const date = new Date(dayStart * 1000);
          stats.push({
            date: `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`,
            avgTransactionsPerBlock: avgTx,
            totalBlocks: blocksInDay.length,
            totalTransactions: totalTx
          });
        }
      }
    }
    
    return stats.reverse();
  } catch (error) {
    console.error('Error fetching average transactions per block:', error);
    return [];
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

export interface ConfirmationData {
  txHash: string;
  currentConfirmations: number;
  blockHeight: number | null;
  confirmationTime: number | null;
  firstSeenTime: number;
  status: 'unconfirmed' | 'confirmed';
  confirmationsPerDay: number;
  estimatedTimeToConfirmation?: number;
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

export async function getTransactionConfirmationData(txHash: string): Promise<ConfirmationData | null> {
  try {
    const [txData, latestBlocks] = await Promise.all([
      getBTC_Transaction(txHash),
      getBTC_LatestBlocks(1)
    ]);
    
    if (!txData || !latestBlocks || latestBlocks.length === 0) {
      return null;
    }
    
    const currentBlockHeight = latestBlocks[0].height;
    const txBlockHeight = txData.block_height || null;
    const txTime = txData.time || Math.floor(Date.now() / 1000);
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Calculate confirmations
    const confirmations = txBlockHeight && currentBlockHeight 
      ? Math.max(0, currentBlockHeight - txBlockHeight + 1)
      : 0;
    
    // Calculate confirmations per day (blocks mined per day ~= 144 for Bitcoin)
    const timeElapsedSeconds = currentTime - txTime;
    const timeElapsedDays = timeElapsedSeconds / (24 * 60 * 60);
    const confirmationsPerDay = timeElapsedDays > 0 ? Math.round(confirmations / timeElapsedDays) : 0;
    
    // Estimate time to confirmation (if unconfirmed)
    let estimatedTimeToConfirmation: number | undefined;
    if (confirmations === 0 && timeElapsedSeconds < 3600) {
      estimatedTimeToConfirmation = Math.max(0, 600 - timeElapsedSeconds); // Typical block time is ~10 minutes
    }
    
    return {
      txHash,
      currentConfirmations: confirmations,
      blockHeight: txBlockHeight,
      confirmationTime: txBlockHeight ? txTime : null,
      firstSeenTime: txTime,
      status: confirmations === 0 ? 'unconfirmed' : 'confirmed',
      confirmationsPerDay: confirmationsPerDay > 0 ? confirmationsPerDay : 1,
      estimatedTimeToConfirmation
    };
  } catch (error) {
    console.error('Error fetching transaction confirmation data:', error);
    return null;
  }
}

export interface TransactionMetrics {
  date: string;
  value: number;
}

export async function getTotalTransactionsData(days: number = 7): Promise<TransactionMetrics[]> {
  try {
    if (currentBlockchain !== 'BTC') {
      console.warn('Total transactions data is only available for Bitcoin');
      return [];
    }

    const latestBlockResponse = await fetch(`${BLOCKCHAIN_APIS.BTC}/latestblock?format=json`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!latestBlockResponse.ok) throw new Error('Failed to fetch latest block');
    const latestBlockData = await latestBlockResponse.json();
    const currentHeight = latestBlockData.height;
    
    const blocksPerDay = 144;
    const stats: TransactionMetrics[] = [];
    const blocksSampled: { timestamp: number; txCount: number }[] = [];
    
    const sampleInterval = Math.max(1, Math.floor((blocksPerDay * days) / 30));
    
    for (let i = 0; i < 30; i++) {
      const blockHeight = currentHeight - (i * sampleInterval);
      if (blockHeight <= 0) break;
      
      try {
        const blockResponse = await fetch(
          `${BLOCKCHAIN_APIS.BTC}/block-height/${blockHeight}?format=json`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (blockResponse.ok) {
          const blockData = await blockResponse.json();
          if (blockData.blocks && blockData.blocks.length > 0) {
            blocksSampled.push({
              timestamp: blockData.blocks[0].time,
              txCount: blockData.blocks[0].tx.length
            });
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch block ${blockHeight}`);
      }
    }
    
    if (blocksSampled.length > 0) {
      const now = Math.floor(Date.now() / 1000);
      const dayInSeconds = 24 * 60 * 60;
      
      for (let d = 0; d < days; d++) {
        const dayStart = now - (d * dayInSeconds);
        const dayEnd = dayStart + dayInSeconds;
        
        const blocksInDay = blocksSampled.filter(b => b.timestamp >= dayStart && b.timestamp < dayEnd);
        
        if (blocksInDay.length > 0) {
          const totalTx = blocksInDay.reduce((sum, b) => sum + b.txCount, 0);
          const date = new Date(dayStart * 1000);
          stats.push({
            date: `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`,
            value: totalTx / 1000000 // Convert to millions for chart display
          });
        }
      }
    }
    
    return stats.reverse();
  } catch (error) {
    console.error('Error fetching total transactions:', error);
    return [];
  }
}

export async function getConfirmationsPerDayData(days: number = 7): Promise<TransactionMetrics[]> {
  try {
    if (currentBlockchain !== 'BTC') {
      console.warn('Confirmations per day data is only available for Bitcoin');
      return [];
    }

    const latestBlockResponse = await fetch(`${BLOCKCHAIN_APIS.BTC}/latestblock?format=json`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!latestBlockResponse.ok) throw new Error('Failed to fetch latest block');
    const latestBlockData = await latestBlockResponse.json();
    const currentHeight = latestBlockData.height;
    
    const blocksPerDay = 144;
    const stats: TransactionMetrics[] = [];
    const blocksSampled: { timestamp: number; height: number }[] = [];
    
    const sampleInterval = Math.max(1, Math.floor((blocksPerDay * days) / 30));
    
    for (let i = 0; i < 30; i++) {
      const blockHeight = currentHeight - (i * sampleInterval);
      if (blockHeight <= 0) break;
      
      try {
        const blockResponse = await fetch(
          `${BLOCKCHAIN_APIS.BTC}/block-height/${blockHeight}?format=json`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (blockResponse.ok) {
          const blockData = await blockResponse.json();
          if (blockData.blocks && blockData.blocks.length > 0) {
            blocksSampled.push({
              timestamp: blockData.blocks[0].time,
              height: blockData.blocks[0].height
            });
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch block ${blockHeight}`);
      }
    }
    
    if (blocksSampled.length > 0) {
      const now = Math.floor(Date.now() / 1000);
      const dayInSeconds = 24 * 60 * 60;
      
      for (let d = 0; d < days; d++) {
        const dayStart = now - (d * dayInSeconds);
        const dayEnd = dayStart + dayInSeconds;
        
        const blocksInDay = blocksSampled.filter(b => b.timestamp >= dayStart && b.timestamp < dayEnd);
        
        if (blocksInDay.length > 0) {
          // Confirmations = sum of confirmations from all blocks in that day
          // For simplicity, use total blocks mined * average confirmations per block
          const totalConfirmations = blocksInDay.length * (currentHeight - blocksInDay[0].height);
          const date = new Date(dayStart * 1000);
          stats.push({
            date: `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`,
            value: Math.max(100000, totalConfirmations) // Ensure visible data
          });
        }
      }
    }
    
    return stats.reverse();
  } catch (error) {
    console.error('Error fetching confirmations per day:', error);
    return [];
  }
}

export async function getAverageTransactionTimeData(days: number = 7): Promise<TransactionMetrics[]> {
  try {
    if (currentBlockchain !== 'BTC') {
      console.warn('Average transaction time is only available for Bitcoin');
      return [];
    }

    const unconfirmedTxs = await getUnconfirmedTransactions();
    
    // Calculate average time from mempool data
    if (unconfirmedTxs && unconfirmedTxs.length > 0) {
      const now = Math.floor(Date.now() / 1000);
      const stats: TransactionMetrics[] = [];
      
      // Group unconfirmed transactions by age buckets
      const timeBuckets: { [key: string]: number[] } = {};
      
      unconfirmedTxs.forEach((tx: any) => {
        const ageSeconds = now - tx.time;
        const ageMinutes = Math.floor(ageSeconds / 60);
        const bucket = `${ageMinutes}m`;
        
        if (!timeBuckets[bucket]) {
          timeBuckets[bucket] = [];
        }
        timeBuckets[bucket].push(ageSeconds);
      });
      
      // Calculate average times
      Object.entries(timeBuckets).forEach(([bucket, times]) => {
        const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        stats.push({
          date: bucket,
          value: avgTime / 60 // Convert to minutes for display
        });
      });
      
      return stats.slice(-7); // Return last 7 data points
    }
    
    // Fallback: estimate from block times
    const blocksResponse = await fetch(`${BLOCKCHAIN_APIS.BTC}/latestblock?format=json`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (blocksResponse.ok) {
      const blockData = await blocksResponse.json();
      // Average block time is ~10 minutes, transactions are typically mined within 1-3 blocks
      return [
        { date: 'Latest', value: 10 }
      ];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching average transaction time:', error);
    return [];
  }
}

export interface MempoolData {
  time: string;
  bytes: number;
}

export interface BlockInfo {
  number: number;
  hash: string;
  txCount: number;
  fill: number;
  time: number;
  size: number;
}

export async function getRecentBlocks(limit: number = 50): Promise<BlockInfo[]> {
  try {
    if (currentBlockchain !== 'BTC') {
      console.warn('Blocks data is only available for Bitcoin');
      return [];
    }

    const latestBlockResponse = await fetch(`${BLOCKCHAIN_APIS.BTC}/latestblock?format=json`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!latestBlockResponse.ok) throw new Error('Failed to fetch latest block');
    const latestBlockData = await latestBlockResponse.json();
    const currentHeight = latestBlockData.height;
    
    const blocks: BlockInfo[] = [];
    
    // Fetch the latest blocks
    for (let i = 0; i < Math.min(limit, 100); i++) {
      const blockHeight = currentHeight - i;
      if (blockHeight <= 0) break;
      
      try {
        const blockResponse = await fetch(
          `${BLOCKCHAIN_APIS.BTC}/block-height/${blockHeight}?format=json`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (blockResponse.ok) {
          const blockData = await blockResponse.json();
          if (blockData.blocks && blockData.blocks.length > 0) {
            const block = blockData.blocks[0];
            const txCount = block.tx ? block.tx.length : 0;
            // Calculate fill percentage (max block size ~4MB, typical ~1.3MB)
            const fill = (block.size / 4000000) * 100;
            
            blocks.push({
              number: block.height,
              hash: formatHash(block.hash, 8),
              txCount: txCount,
              fill: Math.min(fill, 100),
              time: block.time,
              size: block.size
            });
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch block ${blockHeight}`);
      }
    }
    
    return blocks;
  } catch (error) {
    console.error('Error fetching recent blocks:', error);
    return [];
  }
}

export async function getMempoolBytesPerFee(): Promise<MempoolData[]> {
  try {
    if (currentBlockchain !== 'BTC') {
      console.warn('Mempool data is only available for Bitcoin');
      return [];
    }

    const unconfirmedTxs = await getUnconfirmedTransactions();
    console.log('Fetched unconfirmed txs for mempool:', unconfirmedTxs?.length || 0);
    
    if (unconfirmedTxs && unconfirmedTxs.length > 0) {
      const now = Math.floor(Date.now() / 1000);
      const timeSlots: { [key: string]: number } = {};
      
      // Group transactions by time slots (every 15 minutes)
      unconfirmedTxs.forEach((tx: any) => {
        const ageSeconds = now - tx.time;
        const ageMinutes = Math.floor(ageSeconds / 60);
        const slotMinutes = Math.max(0, Math.floor(ageMinutes / 15) * 15);
        const slot = slotMinutes === 0 ? 'Now' : `${slotMinutes}m ago`;
        
        const txBytes = tx.size || 250; // Estimate if not provided
        timeSlots[slot] = (timeSlots[slot] || 0) + txBytes / 1000000; // Convert to MB
      });
      
      // Convert to array and sort
      const result = Object.entries(timeSlots)
        .map(([time, bytes]) => ({ time, bytes }))
        .sort((a, b) => {
          const aMinutes = parseInt(a.time) || 0;
          const bMinutes = parseInt(b.time) || 0;
          return aMinutes - bMinutes;
        })
        .slice(-10); // Return last 10 slots
      
      console.log('Mempool real data:', result);
      return result;
    }
    
    console.log('No unconfirmed transactions found, returning empty mempool data');
    return [];
  } catch (error) {
    console.error('Error fetching mempool bytes per fee:', error);
    return [];
  }
}
