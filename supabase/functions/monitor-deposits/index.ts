import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting non-custodial wallet balance monitoring...');

    // Fetch all connected user wallets (non-custodial)
    const { data: userWallets, error: walletsError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('is_active', 'true');

    if (walletsError) {
      throw walletsError;
    }

    console.log(`Monitoring ${userWallets?.length || 0} connected wallets`);

    const results = [];

    for (const wallet of userWallets || []) {
      try {
        const { chain_id, address, user_id, id: wallet_id } = wallet;
        
        console.log(`Checking ${chain_id} address: ${address}`);

        let balance = 0;
        let blockchain = chain_id.toUpperCase();

        // Normalize chain identifiers
        if (blockchain.includes('ERC20') || blockchain === 'ETH' || blockchain === 'ETHEREUM') {
          blockchain = 'ETH';
        } else if (blockchain.includes('BEP20') || blockchain === 'BNB' || blockchain === 'BSC') {
          blockchain = 'BNB';
        } else if (blockchain.includes('TRC20') || blockchain === 'TRX' || blockchain === 'TRON') {
          blockchain = 'TRX';
        } else if (blockchain.includes('SOL') || blockchain === 'SOLANA') {
          blockchain = 'SOL';
        } else if (blockchain === 'BTC' || blockchain === 'BITCOIN') {
          blockchain = 'BTC';
        }

        // Fetch on-chain balance based on blockchain
        if (blockchain === 'BTC') {
          const response = await fetch(
            `https://blockstream.info/api/address/${address}`
          );

          if (response.ok) {
            const data = await response.json();
            // Balance in satoshis, convert to BTC
            const confirmedBalance = data.chain_stats?.funded_txo_sum - data.chain_stats?.spent_txo_sum || 0;
            balance = confirmedBalance / 100000000;
            console.log(`BTC balance for ${address}: ${balance} BTC`);
          } else {
            console.error(`Failed to fetch BTC balance: ${response.status}`);
          }
        } else if (blockchain === 'ETH') {
          const response = await fetch(
            'https://eth.llamarpc.com',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [address, 'latest'],
                id: 1,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.result) {
              balance = parseInt(data.result, 16) / 1e18;
              console.log(`ETH balance for ${address}: ${balance} ETH`);
            }
          } else {
            console.error(`Failed to fetch ETH balance: ${response.status}`);
          }
        } else if (blockchain === 'BNB') {
          const response = await fetch(
            'https://bsc-dataseed.binance.org/',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [address, 'latest'],
                id: 1,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.result) {
              balance = parseInt(data.result, 16) / 1e18;
              console.log(`BNB balance for ${address}: ${balance} BNB`);
            }
          } else {
            console.error(`Failed to fetch BNB balance: ${response.status}`);
          }
        } else if (blockchain === 'SOL') {
          const response = await fetch(
            'https://api.mainnet-beta.solana.com',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getBalance',
                params: [address]
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.result?.value !== undefined) {
              balance = data.result.value / 1e9; // lamports to SOL
              console.log(`SOL balance for ${address}: ${balance} SOL`);
            }
          } else {
            console.error(`Failed to fetch SOL balance: ${response.status}`);
          }
        } else if (blockchain === 'TRX') {
          const response = await fetch(
            `https://api.trongrid.io/v1/accounts/${address}`,
            {
              headers: { 'Accept': 'application/json' },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.data?.[0]?.balance !== undefined) {
              balance = data.data[0].balance / 1e6; // sun to TRX
              console.log(`TRX balance for ${address}: ${balance} TRX`);
            }
          } else {
            console.error(`Failed to fetch TRX balance: ${response.status}`);
          }
        }

        // Store the balance snapshot for trade matching purposes
        // This is non-custodial - we're just tracking on-chain balances
        results.push({
          wallet_id,
          user_id,
          address,
          chain_id: blockchain,
          balance,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        console.error(`Error checking wallet ${wallet.address}:`, error);
      }
    }

    console.log(`Monitoring complete. Checked ${results.length} wallets.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Monitored ${userWallets?.length || 0} connected wallets (non-custodial)`,
        walletBalances: results,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in monitor-deposits:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to monitor wallet balances',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
