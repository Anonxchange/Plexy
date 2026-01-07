import { createClient } from './supabase';

const supabase = createClient();

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  address: string;
  balance: number;
  locked_balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'escrow_lock' | 'escrow_release' | 'transfer';
  amount: number;
  currency: string;
  tx_hash?: string;
  from_address?: string;
  to_address?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  created_at: string;
}

export interface Escrow {
  id: string;
  trade_id: string;
  seller_id: string;
  buyer_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'locked' | 'released' | 'refunded' | 'disputed';
  created_at: string;
}

class WalletClient {
  /**
   * Generate a new wallet for a currency
   */
  async generateWallet(currency: string): Promise<{ wallet: Wallet }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currency }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate wallet');
    }

    return response.json();
  }

  /**
   * Get all user wallets with balances (using monitor-deposits)
   */
  async getWallets(): Promise<{ wallets: Wallet[] }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monitor-deposits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch wallets');
    }

    const data = await response.json();
    
    // Map the monitor-deposits response to the Wallet interface
    // Use user_wallets or walletBalances based on response structure
    const balances = data.walletBalances || data.user_wallets || [];
    
    const wallets: Wallet[] = balances.map((wb: any) => ({
      id: wb.wallet_id || wb.id,
      user_id: wb.user_id,
      currency: wb.chain_id || wb.currency,
      address: wb.address,
      balance: wb.balance || 0,
      locked_balance: wb.locked_balance || 0,
      created_at: wb.timestamp || wb.created_at,
    }));

    return { wallets };
  }

  /**
   * Get transaction history
   */
  async getTransactions(walletId?: string): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (walletId) {
      query = query.eq('wallet_id', walletId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Create an escrow for a trade
   */
  async createEscrow(params: {
    trade_id: string;
    buyer_id: string;
    amount: number;
    currency: string;
    expires_in_hours?: number;
  }): Promise<{ escrow: Escrow }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/escrow-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create escrow');
    }

    return response.json();
  }

  /**
   * Release an escrow
   */
  async releaseEscrow(escrowId: string): Promise<{ success: boolean }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/escrow-release`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ escrow_id: escrowId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to release escrow');
    }

    return response.json();
  }

  /**
   * Get user's escrows
   */
  async getEscrows(): Promise<Escrow[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('escrows')
      .select('*')
      .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Request a withdrawal
   */
  async requestWithdrawal(params: {
    wallet_id: string;
    amount: number;
    currency: string;
    to_address: string;
  }) {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert(params)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const walletClient = new WalletClient();
