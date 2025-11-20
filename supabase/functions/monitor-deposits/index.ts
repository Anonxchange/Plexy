import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Multiple RPC endpoints for fallback when rate limited
const RPC_ENDPOINTS = {
  BTC: 'https://blockstream.info/api',
  ETH: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://ethereum.publicnode.com',
    'https://eth.drpc.org'
  ],
  BSC: [
    'https://bsc-dataseed.binance.org',
    'https://bsc-dataseed1.binance.org',
    'https://rpc.ankr.com/bsc',
    'https://bsc.publicnode.com'
  ],
  SOL: [
    'https://api.mainnet-beta.solana.com',
    'https://solana.public-rpc.com',
    'https://rpc.ankr.com/solana',
    'https://solana-mainnet.rpc.extrnode.com'
  ],
  TRX: [
    'https://apilist.tronscanapi.com',
    'https://api.trongrid.io'
  ]
};

// Token contract addresses
const TOKEN_CONTRACTS = {
  USDT_ETH: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  USDC_ETH: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  USDT_TRX: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  USDT_BSC: '0x55d398326f99059ff775485246999027b3197955',
  USDC_BSC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  USDT_SOL: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  USDC_SOL: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
}

// ERC20 Transfer event signature
const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7fe88fb996cacc44068d45e5c8'

interface Transaction {
  txHash: string
  amount: number
  confirmations: number
  timestamp: number
}

// Minimum confirmations required per chain (matching Bybit standards)
const MIN_CONFIRMATIONS = {
  BTC: 2,
  ETH: 12,
  BSC: 15,
  BNB: 15,
  SOL: 32,
  TRX: 19,
  USDT_ETH: 12,
  USDC_ETH: 12,
  USDT_BSC: 15,
  USDC_BSC: 15,
  USDT_TRX: 19,
  USDT_SOL: 32,
  USDC_SOL: 32,
}

class BlockchainMonitor {
  // Bitcoin monitoring via Blockstream API
  async checkBitcoinAddress(address: string): Promise<Transaction[]> {
    try {
      const response = await fetch(`${RPC_ENDPOINTS.BTC}/address/${address}/txs`)
      if (!response.ok) throw new Error(`Bitcoin API error: ${response.status}`)
      
      const txs = await response.json()
      const deposits: Transaction[] = []

      // Get current block height for confirmations calculation
      const blockHeightRes = await fetch(`${RPC_ENDPOINTS.BTC}/blocks/tip/height`)
      const currentHeight = blockHeightRes.ok ? parseInt(await blockHeightRes.text()) : 0

      for (const tx of txs.slice(0, 20)) {
        let amount = 0
        for (const vout of tx.vout || []) {
          if (vout.scriptpubkey_address === address) {
            amount += vout.value / 100000000 // Convert satoshis to BTC
          }
        }

        if (amount > 0) {
          const txBlockHeight = tx.status?.block_height || 0
          const confirmations = txBlockHeight > 0 ? currentHeight - txBlockHeight + 1 : 0
          
          deposits.push({
            txHash: tx.txid,
            amount,
            confirmations,
            timestamp: tx.status?.block_time || Date.now() / 1000,
          })
        }
      }

      return deposits
    } catch (error) {
      console.error('Bitcoin check error:', error)
      return []
    }
  }

  // Ethereum/BSC monitoring with fallback RPCs
  async checkEthereumLikeAddress(
    address: string,
    rpcUrls: string | string[],
    tokenContract?: string
  ): Promise<Transaction[]> {
    const urls = Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls];
    let lastError: Error | null = null;
    
    // Try each RPC endpoint until one works
    for (const rpcUrl of urls) {
      try {
        const deposits: Transaction[] = []

        // Get latest block
        const latestBlockRes = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          }),
        })

        if (!latestBlockRes.ok) throw new Error(`RPC error: ${latestBlockRes.status}`)
        const latestData = await latestBlockRes.json()
        const latestBlock = parseInt(latestData.result, 16)

        // Check last 2000 blocks for deposits
        const fromBlock = Math.max(0, latestBlock - 2000)

        if (tokenContract) {
          // Check ERC20 token transfers
          const logsRes = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getLogs',
              params: [{
                fromBlock: `0x${fromBlock.toString(16)}`,
                toBlock: 'latest',
                address: tokenContract,
                topics: [
                  ERC20_TRANSFER_TOPIC,
                  null,
                  `0x000000000000000000000000${address.slice(2).toLowerCase()}`,
                ],
              }],
              id: 2,
            }),
          })

          if (logsRes.ok) {
            const logsData = await logsRes.json()
            
            for (const log of logsData.result || []) {
              const amount = parseInt(log.data, 16) / 1e6 // USDT/USDC have 6 decimals
              
              if (amount > 0) {
                deposits.push({
                  txHash: log.transactionHash,
                  amount,
                  confirmations: latestBlock - parseInt(log.blockNumber, 16),
                  timestamp: Date.now() / 1000,
                })
              }
            }
          }
        } else {
          // Check native ETH/BNB transfers
          for (let i = fromBlock; i <= latestBlock; i += 100) {
            const blockRes = await fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBlockByNumber',
                params: [`0x${i.toString(16)}`, true],
                id: 3,
              }),
            })

            if (blockRes.ok) {
              const blockData = await blockRes.json()
              const block = blockData.result

              if (block?.transactions) {
                for (const tx of block.transactions) {
                  if (tx.to?.toLowerCase() === address.toLowerCase() && tx.value !== '0x0') {
                    const amount = parseInt(tx.value, 16) / 1e18
                    
                    deposits.push({
                      txHash: tx.hash,
                      amount,
                      confirmations: latestBlock - i,
                      timestamp: parseInt(block.timestamp, 16),
                    })
                  }
                }
              }
            }
          }
        }

        return deposits; // Success - return results
      } catch (error) {
        lastError = error as Error;
        console.log(`⚠️ RPC ${rpcUrl} failed, trying next...`);
        continue; // Try next RPC
      }
    }
    
    // All RPCs failed
    console.error('All Ethereum-like RPCs failed:', lastError);
    return []; // Return empty array instead of throwing
  }

  // Solana monitoring with fallback RPCs
  async checkSolanaAddress(address: string): Promise<Transaction[]> {
    const rpcUrls = Array.isArray(RPC_ENDPOINTS.SOL) ? RPC_ENDPOINTS.SOL : [RPC_ENDPOINTS.SOL];
    let lastError: Error | null = null;
    
    for (const rpcUrl of rpcUrls) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getSignaturesForAddress',
            params: [address, { limit: 20 }],
          }),
        })

        if (!response.ok) throw new Error(`Solana API error: ${response.status}`)
        
        const data = await response.json()
        const deposits: Transaction[] = []

        for (const sig of data.result || []) {
          // Get transaction details
          const txRes = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getTransaction',
              params: [sig.signature, { encoding: 'json', maxSupportedTransactionVersion: 0 }],
            }),
          })

          if (txRes.ok) {
            const txData = await txRes.json()
            const tx = txData.result

            if (tx?.meta?.postBalances && tx?.meta?.preBalances) {
              const accountIndex = tx.transaction.message.accountKeys.findIndex(
                (key: string) => key === address
              )
              
              if (accountIndex >= 0) {
                const preBalance = tx.meta.preBalances[accountIndex] || 0
                const postBalance = tx.meta.postBalances[accountIndex] || 0
                const amount = (postBalance - preBalance) / 1e9 // Convert lamports to SOL

                if (amount > 0) {
                  deposits.push({
                    txHash: sig.signature,
                    amount,
                    confirmations: sig.confirmationStatus === 'finalized' ? 32 : 0,
                    timestamp: sig.blockTime || Date.now() / 1000,
                  })
                }
              }
            }
          }
        }

        return deposits; // Success
      } catch (error) {
        lastError = error as Error;
        console.log(`⚠️ Solana RPC ${rpcUrl} failed, trying next...`);
        continue;
      }
    }
    
    console.error('All Solana RPCs failed:', lastError);
    return [];
  }

  // Solana SPL Token monitoring - uses transaction history instead of token account queries
  async checkSolanaSPLToken(address: string, tokenMint: string): Promise<Transaction[]> {
    const rpcUrls = Array.isArray(RPC_ENDPOINTS.SOL) ? RPC_ENDPOINTS.SOL : [RPC_ENDPOINTS.SOL];
    let lastError: Error | null = null;
    
    for (let i = 0; i < rpcUrls.length; i++) {
      const rpcUrl = rpcUrls[i];
      try {
        // Add delay between RPC attempts to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Get recent signatures for the wallet address
        const sigResponse = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getSignaturesForAddress',
            params: [address, { limit: 20 }],
          }),
        })

        if (!sigResponse.ok) throw new Error(`Solana API error: ${sigResponse.status}`)
        
        const sigData = await sigResponse.json()
        if (sigData.error) throw new Error(`Solana RPC error: ${sigData.error.message}`)
        
        const deposits: Transaction[] = []

        // Check each transaction for SPL token transfers
        for (const sig of sigData.result || []) {
          try {
            const txRes = await fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTransaction',
                params: [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
              }),
            })

            if (txRes.ok) {
              const txData = await txRes.json()
              const tx = txData.result

              // Look for SPL token transfers in parsed instructions
              if (tx?.transaction?.message?.instructions) {
                for (const ix of tx.transaction.message.instructions) {
                  // Check if it's a token transfer instruction
                  if (ix.program === 'spl-token' && ix.parsed?.type === 'transfer') {
                    const info = ix.parsed.info;
                    
                    // Check if this is a transfer to our address for the correct token
                    if (info.destination && info.mint === tokenMint) {
                      // Find the destination account owner
                      const accounts = tx.transaction.message.accountKeys;
                      const destAccount = accounts.find((acc: any) => acc.pubkey === info.destination);
                      
                      if (destAccount?.owner === address || info.destination === address) {
                        const amount = parseFloat(info.amount) / Math.pow(10, info.decimals || 6);
                        
                        if (amount > 0) {
                          deposits.push({
                            txHash: sig.signature,
                            amount,
                            confirmations: sig.confirmationStatus === 'finalized' ? 32 : 0,
                            timestamp: sig.blockTime || Date.now() / 1000,
                          })
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (txError) {
            console.log(`⚠️ Failed to parse transaction ${sig.signature}:`, txError);
            continue; // Skip failed transactions but continue with others
          }
        }

        return deposits; // Success
      } catch (error) {
        lastError = error as Error;
        console.log(`⚠️ Solana SPL RPC ${rpcUrl} failed, trying next...`);
        continue;
      }
    }
    
    console.error('All Solana SPL RPCs failed:', lastError);
    return [];
  }

  // Tron monitoring with fallback RPCs
  async checkTronAddress(address: string, tokenContract?: string): Promise<Transaction[]> {
    const rpcUrls = Array.isArray(RPC_ENDPOINTS.TRX) ? RPC_ENDPOINTS.TRX : [RPC_ENDPOINTS.TRX];
    let lastError: Error | null = null;
    
    for (const rpcUrl of rpcUrls) {
      try {
        let endpoint: string;
        
        // Use different API format based on the endpoint
        if (rpcUrl.includes('tronscanapi')) {
          endpoint = tokenContract
            ? `${rpcUrl}/api/token_trc20/transfers?limit=20&contract_address=${tokenContract}&toAddress=${address}`
            : `${rpcUrl}/api/transaction?address=${address}&limit=20`;
        } else {
          endpoint = tokenContract
            ? `${rpcUrl}/v1/accounts/${address}/transactions/trc20?limit=20&contract_address=${tokenContract}`
            : `${rpcUrl}/v1/accounts/${address}/transactions?limit=20`;
        }

        const response = await fetch(endpoint)

        if (!response.ok) throw new Error(`Tron API error: ${response.status}`)
        
        const data = await response.json()
        const deposits: Transaction[] = []

        // Handle different API response formats
        const txList = data.data || data.token_transfers || data.trc20_transfers || [];
        
        if (Array.isArray(txList)) {
          for (const tx of txList) {
            if (tokenContract) {
              // TRC20 token transfer - handle both API formats
              const toAddr = tx.to || tx.to_address || tx.toAddress;
              const txType = tx.type || tx.event_type;
              const isTransfer = txType === 'Transfer' || txType === 'transfer' || !txType;
              
              if (toAddr === address && isTransfer) {
                const rawValue = tx.value || tx.quant || tx.amount || '0';
                const amount = parseFloat(rawValue) / 1e6; // USDT has 6 decimals
                const txHash = tx.transaction_id || tx.transactionHash || tx.hash;
                const blockTime = tx.block_timestamp || tx.block_ts || tx.timestamp;
                
                if (amount > 0 && txHash) {
                  deposits.push({
                    txHash,
                    amount,
                    confirmations: blockTime ? 19 : 0,
                    timestamp: blockTime / 1000,
                  })
                }
              }
            } else {
              // Native TRX transfer
              const contractData = tx.raw_data?.contract?.[0] || tx.contract?.[0];
              const toAddr = contractData?.parameter?.value?.to_address;
              
              if (toAddr === address) {
                const amount = (contractData.parameter.value.amount || 0) / 1e6;
                const txHash = tx.txID || tx.hash;
                const blockTime = tx.block_timestamp || tx.timestamp;
                
                if (amount > 0 && txHash) {
                  deposits.push({
                    txHash,
                    amount,
                    confirmations: blockTime ? 19 : 0,
                    timestamp: blockTime / 1000,
                  })
                }
              }
            }
          }
        }

        return deposits; // Success
      } catch (error) {
        lastError = error as Error;
        console.log(`⚠️ Tron RPC ${rpcUrl} failed, trying next...`);
        continue;
      }
    }
    
    console.error('All Tron RPCs failed:', lastError);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔍 Starting deposit monitoring...')

    const monitor = new BlockchainMonitor()

    // Fetch all active wallets with deposit addresses
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .not('deposit_address', 'is', null)

    if (walletsError) throw walletsError

    console.log(`📊 Monitoring ${wallets?.length || 0} wallets`)

    const results = []

    for (const wallet of wallets || []) {
      try {
        const { crypto_symbol, deposit_address, user_id, balance } = wallet
        console.log(`🔎 Checking ${crypto_symbol} address: ${deposit_address}`)

        let transactions: Transaction[] = []

        // Route to appropriate blockchain monitor
        switch (crypto_symbol) {
          case 'BTC':
            transactions = await monitor.checkBitcoinAddress(deposit_address)
            break
          
          case 'ETH':
            transactions = await monitor.checkEthereumLikeAddress(deposit_address, RPC_ENDPOINTS.ETH)
            break
          
          case 'USDT_ETH':
          case 'USDT-ETH':
          case 'USDT-ERC20':
          case 'USDT':
            // Check USDT on Ethereum (ERC20)
            transactions = await monitor.checkEthereumLikeAddress(
              deposit_address,
              RPC_ENDPOINTS.ETH,
              TOKEN_CONTRACTS.USDT_ETH
            )
            break
          
          case 'USDC_ETH':
          case 'USDC-ETH':
          case 'USDC-ERC20':
          case 'USDC':
            // Check USDC on Ethereum (ERC20)
            transactions = await monitor.checkEthereumLikeAddress(
              deposit_address,
              RPC_ENDPOINTS.ETH,
              TOKEN_CONTRACTS.USDC_ETH
            )
            break
          
          case 'BNB':
          case 'BSC':
            transactions = await monitor.checkEthereumLikeAddress(deposit_address, RPC_ENDPOINTS.BSC)
            break
          
          case 'USDT_BSC':
          case 'USDT-BSC':
          case 'USDT-BEP20':
          case 'BUSDT':
            // Check USDT on BSC (BEP20)
            transactions = await monitor.checkEthereumLikeAddress(
              deposit_address,
              RPC_ENDPOINTS.BSC,
              TOKEN_CONTRACTS.USDT_BSC
            )
            break
          
          case 'USDC_BSC':
          case 'USDC-BSC':
          case 'USDC-BEP20':
          case 'BUSDC':
            // Check USDC on BSC (BEP20)
            transactions = await monitor.checkEthereumLikeAddress(
              deposit_address,
              RPC_ENDPOINTS.BSC,
              TOKEN_CONTRACTS.USDC_BSC
            )
            break
          
          case 'SOL':
            transactions = await monitor.checkSolanaAddress(deposit_address)
            break
          
          case 'TRX':
            transactions = await monitor.checkTronAddress(deposit_address)
            break
          
          case 'USDT_TRX':
          case 'USDT-TRX':
          case 'USDT-TRC20':
          case 'USDT_TRON':
            // Check USDT on Tron (TRC20)
            transactions = await monitor.checkTronAddress(deposit_address, TOKEN_CONTRACTS.USDT_TRX)
            break
          
          case 'USDT-SOL':
          case 'USDT_SOL':
            // Check USDT on Solana (SPL Token)
            transactions = await monitor.checkSolanaSPLToken(deposit_address, TOKEN_CONTRACTS.USDT_SOL)
            break
          
          case 'USDC-SOL':
          case 'USDC_SOL':
            // Check USDC on Solana (SPL Token)
            transactions = await monitor.checkSolanaSPLToken(deposit_address, TOKEN_CONTRACTS.USDC_SOL)
            break
          
          default:
            console.log(`⚠️ Unsupported crypto: ${crypto_symbol}`)
        }

        // Process new transactions
        for (const tx of transactions) {
          // Get minimum confirmations required for this crypto
          const minConfirmations = MIN_CONFIRMATIONS[crypto_symbol as keyof typeof MIN_CONFIRMATIONS] || 3
          
          // Skip if insufficient confirmations
          if (tx.confirmations < minConfirmations) {
            console.log(`⏳ Waiting for confirmations: ${tx.txHash} (${tx.confirmations}/${minConfirmations})`)
            continue
          }

          // Check if already processed
          const { data: existingTx } = await supabase
            .from('processed_txs')
            .select('id')
            .eq('tx_hash', tx.txHash)
            .eq('crypto_symbol', crypto_symbol)
            .maybeSingle()

          if (existingTx) {
            console.log(`✓ Already processed: ${tx.txHash}`)
            continue
          }

          console.log(`💰 New deposit: ${tx.amount} ${crypto_symbol} (${tx.txHash})`)

          // Create transaction record
          const { error: txError } = await supabase
            .from('wallet_transactions')
            .insert({
              user_id,
              wallet_id: wallet.id,
              type: 'deposit',
              crypto_symbol,
              amount: tx.amount,
              status: 'completed',
              tx_hash: tx.txHash,
              to_address: deposit_address,
              completed_at: new Date(tx.timestamp * 1000).toISOString(),
            })

          if (txError) {
            console.error('❌ Error creating transaction:', txError)
            continue
          }

          // Update wallet balance
          const newBalance = balance + tx.amount
          const { error: balanceError } = await supabase
            .from('wallets')
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq('id', wallet.id)

          if (balanceError) {
            console.error('❌ Error updating balance:', balanceError)
            continue
          }

          // Mark as processed
          await supabase
            .from('processed_txs')
            .insert({
              tx_hash: tx.txHash,
              crypto_symbol,
              processed_at: new Date().toISOString(),
            })

          results.push({
            address: deposit_address,
            crypto: crypto_symbol,
            amount: tx.amount,
            txHash: tx.txHash,
            confirmations: tx.confirmations,
          })
        }
      } catch (error) {
        console.error(`❌ Error checking wallet ${wallet.deposit_address}:`, error)
      }
    }

    console.log(`✅ Monitoring complete. Processed ${results.length} new deposits.`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Monitored ${wallets?.length || 0} wallets`,
        newDeposits: results.length,
        deposits: results,
        timestamp: new Date().toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in monitor-deposits:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to monitor deposits',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})