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
    const nowNodesApiKey = Deno.env.get('NOWNODES_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting deposit monitoring...');

    // Fetch all wallets with deposit addresses
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .not('deposit_address', 'is', null);

    if (walletsError) {
      throw walletsError;
    }

    console.log(`Monitoring ${wallets?.length || 0} wallets`);

    const results = [];

    for (const wallet of wallets || []) {
      try {
        const { crypto_symbol, deposit_address, user_id } = wallet;
        
        console.log(`Checking ${crypto_symbol} address: ${deposit_address}`);

        let transactions = [];

        if (crypto_symbol === 'BTC') {
          // Check Bitcoin transactions
          const response = await fetch(
            `https://btcbook.nownodes.io/api/v2/address/${deposit_address}?details=txs`,
            {
              headers: {
                'api-key': nowNodesApiKey,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log(`BTC address data for ${deposit_address}:`, JSON.stringify(data, null, 2));
            
            // Get all transactions
            if (data.txids && Array.isArray(data.txids)) {
              // Fetch details for recent transactions
              for (const txid of data.txids.slice(0, 10)) {
                const txResponse = await fetch(
                  `https://btcbook.nownodes.io/api/v2/tx/${txid}`,
                  {
                    headers: {
                      'api-key': nowNodesApiKey,
                    },
                  }
                );
                
                if (txResponse.ok) {
                  const txData = await txResponse.json();
                  transactions.push(txData);
                }
              }
            }
          }
        } else if (crypto_symbol === 'ETH' || crypto_symbol === 'USDT' || crypto_symbol === 'USDC') {
          // For Ethereum, check last 1000 blocks for transactions
          const latestBlockResponse = await fetch(
            `https://eth.nownodes.io/`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'api-key': nowNodesApiKey,
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1,
              }),
            }
          );

          if (latestBlockResponse.ok) {
            const latestData = await latestBlockResponse.json();
            const latestBlock = parseInt(latestData.result, 16);
            console.log(`Latest ETH block: ${latestBlock}`);

            // Check last 1000 blocks
            const startBlock = Math.max(0, latestBlock - 1000);
            
            // Get transaction count for the address
            const txCountResponse = await fetch(
              `https://eth.nownodes.io/`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'api-key': nowNodesApiKey,
                },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_getTransactionCount',
                  params: [deposit_address, 'latest'],
                  id: 1,
                }),
              }
            );

            if (txCountResponse.ok) {
              const countData = await txCountResponse.json();
              console.log(`Transaction count for ${deposit_address}:`, countData.result);
            }

            // Scan blocks for transactions to this address
            for (let blockNum = startBlock; blockNum <= latestBlock; blockNum += 10) {
              const blockResponse = await fetch(
                `https://eth.nownodes.io/`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'api-key': nowNodesApiKey,
                  },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getBlockByNumber',
                    params: [`0x${blockNum.toString(16)}`, true],
                    id: 1,
                  }),
                }
              );

              if (blockResponse.ok) {
                const blockData = await blockResponse.json();
                const block = blockData.result;
                
                if (block && block.transactions) {
                  const matchingTxs = block.transactions.filter((tx: any) => 
                    tx.to && tx.to.toLowerCase() === deposit_address.toLowerCase()
                  );
                  transactions.push(...matchingTxs);
                }
              }
            }

            console.log(`Found ${transactions.length} ETH transactions for ${deposit_address}`);
          }
        }

        // Process new transactions
        for (const tx of transactions) {
          let txHash = '';
          let amount = 0;

          if (crypto_symbol === 'BTC') {
            txHash = tx.txid;
            // Calculate amount received by this address
            const outputs = tx.vout || [];
            for (const output of outputs) {
              if (output.scriptPubKey?.addresses?.includes(deposit_address)) {
                amount += parseFloat(output.value || 0);
              }
            }
          } else {
            txHash = tx.hash;
            amount = parseInt(tx.value, 16) / 1e18; // Convert wei to ETH
          }

          if (amount <= 0) continue;

          // Check if already processed
          const { data: existingTx } = await supabase
            .from('processed_txs')
            .select('id')
            .eq('tx_hash', txHash)
            .eq('crypto_symbol', crypto_symbol)
            .single();

          if (existingTx) {
            console.log(`Transaction ${txHash} already processed`);
            continue;
          }

          console.log(`New deposit: ${amount} ${crypto_symbol} (${txHash})`);

          // Create transaction record
          const { error: txError } = await supabase
            .from('wallet_transactions')
            .insert({
              user_id,
              wallet_id: wallet.id,
              type: 'deposit',
              crypto_symbol,
              amount,
              status: 'completed',
              tx_hash: txHash,
              to_address: deposit_address,
              completed_at: new Date().toISOString(),
            });

          if (txError) {
            console.error('Error creating transaction:', txError);
            continue;
          }

          // Update wallet balance
          const { error: balanceError } = await supabase
            .from('wallets')
            .update({
              balance: wallet.balance + amount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', wallet.id);

          if (balanceError) {
            console.error('Error updating balance:', balanceError);
            continue;
          }

          // Mark as processed
          await supabase
            .from('processed_txs')
            .insert({
              tx_hash: txHash,
              crypto_symbol,
            });

          results.push({
            address: deposit_address,
            crypto: crypto_symbol,
            amount,
            txHash,
          });
        }
      } catch (error) {
        console.error(`Error checking wallet ${wallet.deposit_address}:`, error);
      }
    }

    console.log(`Monitoring complete. Processed ${results.length} new deposits.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Monitored ${wallets?.length || 0} wallets`,
        newDeposits: results.length,
        deposits: results,
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
        details: 'Failed to monitor deposits',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
