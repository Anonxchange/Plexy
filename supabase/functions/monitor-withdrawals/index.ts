import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RPC endpoints with fallbacks
const RPC_ENDPOINTS = {
  BTC: 'https://blockstream.info/api',
  ETH: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://ethereum.publicnode.com',
  ],
  BSC: [
    'https://bsc-dataseed.binance.org',
    'https://bsc-dataseed1.defibit.io',
    'https://rpc.ankr.com/bsc',
  ],
  SOL: [
    'https://api.mainnet-beta.solana.com',
    'https://solana.drpc.org',
    'https://rpc.ankr.com/solana',
  ],
  TRX: [
    'https://api.trongrid.io',
    'https://apilist.tronscanapi.com',
  ],
};

// Required confirmations per chain (matching deposit system)
const REQUIRED_CONFIRMATIONS: Record<string, number> = {
  BTC: 2,
  ETH: 12,
  BSC: 15,
  SOL: 32,
  TRX: 19,
  'USDT-ERC20': 12,
  'USDC-ERC20': 12,
  'USDT-BEP20': 15,
  'USDC-BEP20': 15,
  'USDT-TRC20': 19,
  'USDT-SOL': 32,
  'USDC-SOL': 32,
  'USDT': 12,
  'USDC': 12,
  'BNB': 15,
};

// Normalize crypto symbol to base chain
function normalizeToBaseChain(cryptoSymbol: string): string {
  const symbolUpper = cryptoSymbol.toUpperCase();
  
  if (symbolUpper.includes('-ERC20')) return 'ETH';
  if (symbolUpper.includes('-BEP20')) return 'BSC';
  if (symbolUpper.includes('-TRC20')) return 'TRX';
  if (symbolUpper.includes('-SOL')) return 'SOL';
  
  if (symbolUpper === 'ETH') return 'ETH';
  if (symbolUpper === 'BNB') return 'BSC';
  if (symbolUpper === 'TRX') return 'TRX';
  if (symbolUpper === 'SOL') return 'SOL';
  if (symbolUpper === 'BTC') return 'BTC';
  
  if (symbolUpper === 'USDT') return 'ETH';
  if (symbolUpper === 'USDC') return 'ETH';
  
  return 'ETH';
}

class WithdrawalMonitor {
  async checkBitcoinTransaction(txHash: string): Promise<{ confirmations: number; status: string }> {
    for (const baseUrl of RPC_ENDPOINTS.BTC) {
      try {
        const response = await fetch(`${baseUrl}/tx/${txHash}`);
        if (!response.ok) continue;
        
        const data = await response.json();
        const confirmations = data.status?.block_height ? 1 : 0; // Simplified
        
        return {
          confirmations,
          status: confirmations >= REQUIRED_CONFIRMATIONS.BTC ? 'confirmed' : 'pending'
        };
      } catch (error) {
        console.log(`⚠️ BTC API ${baseUrl} failed, trying next...`);
        continue;
      }
    }
    throw new Error('All Bitcoin APIs failed');
  }

  async checkEthereumTransaction(txHash: string, network: 'ETH' | 'BSC'): Promise<{ confirmations: number; status: string }> {
    const rpcs = RPC_ENDPOINTS[network];
    
    for (const rpc of rpcs) {
      try {
        const response = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [txHash],
            id: 1
          })
        });

        if (!response.ok) continue;
        
        const data = await response.json();
        if (!data.result) continue;

        const receipt = data.result;
        const blockNumber = parseInt(receipt.blockNumber, 16);
        
        // Get current block
        const currentBlockResponse = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          })
        });

        const currentBlockData = await currentBlockResponse.json();
        const currentBlock = parseInt(currentBlockData.result, 16);
        const confirmations = currentBlock - blockNumber;

        return {
          confirmations,
          status: confirmations >= REQUIRED_CONFIRMATIONS[network] ? 'confirmed' : 'pending'
        };
      } catch (error) {
        console.log(`⚠️ ${network} RPC ${rpc} failed, trying next...`);
        continue;
      }
    }
    throw new Error(`All ${network} RPCs failed`);
  }

  async checkSolanaTransaction(txHash: string): Promise<{ confirmations: number; status: string }> {
    const rpcs = RPC_ENDPOINTS.SOL;
    
    for (const rpc of rpcs) {
      try {
        const response = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'getTransaction',
            params: [txHash, { encoding: 'json' }],
            id: 1
          })
        });

        if (!response.ok) continue;
        
        const data = await response.json();
        if (!data.result) continue;

        const confirmations = data.result.meta?.err ? 0 : 1;

        return {
          confirmations,
          status: confirmations >= REQUIRED_CONFIRMATIONS.SOL ? 'confirmed' : 'pending'
        };
      } catch (error) {
        console.log(`⚠️ Solana RPC ${rpc} failed, trying next...`);
        continue;
      }
    }
    throw new Error('All Solana RPCs failed');
  }

  async checkTronTransaction(txHash: string): Promise<{ confirmations: number; status: string }> {
    const rpcs = RPC_ENDPOINTS.TRX;
    
    for (const rpc of rpcs) {
      try {
        const response = await fetch(`${rpc}/wallet/gettransactioninfobyid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: txHash })
        });

        if (!response.ok) continue;
        
        const data = await response.json();
        if (!data.id) continue;

        const confirmations = data.blockNumber ? 1 : 0; // Simplified

        return {
          confirmations,
          status: confirmations >= REQUIRED_CONFIRMATIONS.TRX ? 'confirmed' : 'pending'
        };
      } catch (error) {
        console.log(`⚠️ Tron RPC ${rpc} failed, trying next...`);
        continue;
      }
    }
    throw new Error('All Tron RPCs failed');
  }

  // Main function to check withdrawal status
  async checkWithdrawal(txHash: string, cryptoSymbol: string): Promise<{ confirmations: number; exists: boolean }> {
    const baseChain = normalizeToBaseChain(cryptoSymbol);
    
    console.log(`🔍 Checking ${cryptoSymbol} (${baseChain}) transaction: ${txHash}`);
    
    try {
      let result;
      switch (baseChain) {
        case 'BTC':
          result = await this.checkBitcoinTransaction(txHash);
          break;
        
        case 'ETH':
          result = await this.checkEthereumTransaction(txHash, 'ETH');
          break;
        
        case 'BSC':
          result = await this.checkEthereumTransaction(txHash, 'BSC');
          break;
        
        case 'SOL':
          result = await this.checkSolanaTransaction(txHash);
          break;
        
        case 'TRX':
          result = await this.checkTronTransaction(txHash);
          break;
        
        default:
          console.error(`Unknown chain: ${baseChain}`);
          return { confirmations: 0, exists: false };
      }
      
      return { confirmations: result.confirmations, exists: true };
    } catch (error) {
      console.error(`Error checking ${cryptoSymbol} transaction:`, error);
      return { confirmations: 0, exists: false };
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Starting withdrawal monitoring...');

    // Fetch all pending withdrawals
    const { data: pendingWithdrawals, error: fetchError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('type', 'withdrawal')
      .eq('status', 'pending')
      .not('tx_hash', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching withdrawals:', fetchError);
      throw fetchError;
    }

    if (!pendingWithdrawals || pendingWithdrawals.length === 0) {
      console.log('✅ No pending withdrawals to monitor');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending withdrawals' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Monitoring ${pendingWithdrawals.length} pending withdrawals`);

    const monitor = new WithdrawalMonitor();
    let confirmedCount = 0;
    let failedCount = 0;

    for (const withdrawal of pendingWithdrawals) {
      const { tx_hash, crypto_symbol, wallet_id, amount, fee, id, created_at } = withdrawal;
      
      if (!tx_hash) continue;

      // Check transaction status
      const result = await monitor.checkWithdrawal(tx_hash, crypto_symbol);
      
      console.log(`  ${crypto_symbol}: ${tx_hash.substring(0, 10)}... - ${result.confirmations} confirmations`);

      // Get required confirmations
      const requiredConfs = REQUIRED_CONFIRMATIONS[crypto_symbol] || 2;

      if (!result.exists) {
        // Transaction not found - check if it's been too long (1 hour)
        const createdTime = new Date(created_at).getTime();
        const now = Date.now();
        const hourInMs = 60 * 60 * 1000;
        
        if (now - createdTime > hourInMs) {
          console.log(`  ❌ Transaction not found after 1 hour, marking as failed`);
          
          // Mark as failed and unlock funds
          await supabase
            .from('wallet_transactions')
            .update({ status: 'failed', notes: 'Transaction not found on blockchain' })
            .eq('id', id);

          // Unlock funds
          const { data: wallet } = await supabase
            .from('wallets')
            .select('balance, locked_balance')
            .eq('id', wallet_id)
            .single();

          if (wallet) {
            const totalAmount = Math.abs(amount) + (fee || 0);
            await supabase
              .from('wallets')
              .update({
                balance: (wallet.balance || 0) + totalAmount,
                locked_balance: Math.max(0, (wallet.locked_balance || 0) - totalAmount),
                updated_at: new Date().toISOString()
              })
              .eq('id', wallet_id);
          }

          failedCount++;
        }
        continue;
      }

      // Update confirmations
      await supabase
        .from('wallet_transactions')
        .update({ confirmations: result.confirmations })
        .eq('id', id);

      // Check if confirmed
      if (result.confirmations >= requiredConfs) {
        console.log(`  ✅ Withdrawal confirmed! (${result.confirmations}/${requiredConfs})`);
        
        // Mark as completed
        await supabase
          .from('wallet_transactions')
          .update({
            status: 'completed',
            is_confirmed: true,
            completed_at: new Date().toISOString(),
            confirmations: result.confirmations
          })
          .eq('id', id);

        // Release locked funds
        const { data: wallet } = await supabase
          .from('wallets')
          .select('locked_balance')
          .eq('id', wallet_id)
          .single();

        if (wallet) {
          const totalAmount = Math.abs(amount) + (fee || 0);
          const newLockedBalance = Math.max(0, (wallet.locked_balance || 0) - totalAmount);
          
          await supabase
            .from('wallets')
            .update({
              locked_balance: newLockedBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', wallet_id);
        }

        confirmedCount++;
      }
    }

    console.log(`✅ Monitoring complete. Confirmed: ${confirmedCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        monitored: pendingWithdrawals.length,
        confirmed: confirmedCount,
        failed: failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
