/**
 * Local Storage-based Swap History Manager
 * Tracks non-custodial swaps in browser localStorage
 */

export interface StoredSwapHistory {
  id: string;
  fromCrypto: string;
  toCrypto: string;
  fromAmount: number;
  toAmount: number;
  swapRate: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  createdAt: string;
}

const SWAP_HISTORY_KEY = 'pexly_swap_history';

export const swapHistoryStorage = {
  // Add a new swap to history
  addSwap(swap: StoredSwapHistory): void {
    try {
      const history = this.getHistory();
      history.unshift(swap); // Add to beginning
      localStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error adding swap to history:', error);
    }
  },

  // Get all swaps from history
  getHistory(limit: number = 20): StoredSwapHistory[] {
    try {
      const stored = localStorage.getItem(SWAP_HISTORY_KEY);
      if (!stored) return [];
      const history = JSON.parse(stored);
      return Array.isArray(history) ? history.slice(0, limit) : [];
    } catch (error) {
      console.error('Error retrieving swap history:', error);
      return [];
    }
  },

  // Clear all history
  clearHistory(): void {
    try {
      localStorage.removeItem(SWAP_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing swap history:', error);
    }
  },

  // Update swap status (e.g., from pending to completed)
  updateSwapStatus(
    txHash: string,
    status: 'pending' | 'completed' | 'failed'
  ): void {
    try {
      const history = this.getHistory(1000);
      const swapIndex = history.findIndex(s => s.txHash === txHash);
      if (swapIndex !== -1) {
        history[swapIndex].status = status;
        localStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(history));
      }
    } catch (error) {
      console.error('Error updating swap status:', error);
    }
  },
};
