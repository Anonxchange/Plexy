const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Blockchain API endpoints
const RPC_ENDPOINTS = {
  BTC: 'https://blockstream.info/api',
  ETH: 'https://eth.llamarpc.com',
  BSC: 'https://bsc-dataseed.binance.org',
  SOL: 'https://api.mainnet-beta.solana.com',
  TRX: 'https://api.trongrid.io',
}

interface Transaction {
  txHash: string
  amount: number
  confirmations: number
  timestamp: number
  from?: string
}

// Fetch Bitcoin transactions
async function fetchBitcoinTransactions(address: string): Promise<Transaction[]> {
  try {
    const res = await fetch(`${RPC_ENDPOINTS.BTC}/address/${address}/txs`)
    if (!res.ok) return []
    
    const txs = await res.json()
    if (!Array.isArray(txs)) return []

    const tipRes = await fetch(`${RPC_ENDPOINTS.BTC}/blocks/tip/height`)
    const currentHeight = tipRes.ok ? parseInt(await tipRes.text()) : 0

    const normalizedAddr = address.toLowerCase()
    
    return txs.slice(0, 50).map((tx: any) => {
      let amount = 0
      for (const vout of tx.vout || []) {
        const outAddr = vout.scriptpubkey_address?.toLowerCase()
        if (outAddr === normalizedAddr) {
          amount += vout.value / 100000000
        }
      }
      
      const blockHeight = tx.status?.block_height || 0
      const confirmations = blockHeight > 0 ? currentHeight - blockHeight + 1 : 0
      
      return {
        txHash: tx.txid,
        amount,
        confirmations,
        timestamp: tx.status?.block_time || Math.floor(Date.now() / 1000),
        from: tx.vin?.[0]?.prevout?.scriptpubkey_address,
      }
    }).filter((tx: Transaction) => tx.amount > 0)
  } catch (e) {
    console.error('BTC fetch error:', e)
    return []
  }
}

// Fetch Ethereum transactions
async function fetchEthereumTransactions(address: string): Promise<Transaction[]> {
  try {
    // Get latest block
    const blockRes = await fetch(RPC_ENDPOINTS.ETH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    })
    
    if (!blockRes.ok) return []
    const { result: latestHex } = await blockRes.json()
    const latest = parseInt(latestHex, 16)
    
    // Get balance instead of scanning blocks (much faster)
    const balRes = await fetch(RPC_ENDPOINTS.ETH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 2,
      }),
    })
    
    if (!balRes.ok) return []
    const { result: balHex } = await balRes.json()
    const balance = parseInt(balHex, 16) / 1e18
    
    // Return balance as a single "transaction" for simplicity
    if (balance > 0) {
      return [{
        txHash: 'balance',
        amount: balance,
        confirmations: 999,
        timestamp: Math.floor(Date.now() / 1000),
      }]
    }
    
    return []
  } catch (e) {
    console.error('ETH fetch error:', e)
    return []
  }
}

// Fetch Solana transactions
async function fetchSolanaTransactions(address: string): Promise<Transaction[]> {
  try {
    const res = await fetch(RPC_ENDPOINTS.SOL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
    })
    
    if (!res.ok) return []
    const { result } = await res.json()
    const balance = (result?.value || 0) / 1e9
    
    if (balance > 0) {
      return [{
        txHash: 'balance',
        amount: balance,
        confirmations: 999,
        timestamp: Math.floor(Date.now() / 1000),
      }]
    }
    
    return []
  } catch (e) {
    console.error('SOL fetch error:', e)
    return []
  }
}

// Fetch Tron transactions  
async function fetchTronTransactions(address: string): Promise<Transaction[]> {
  try {
    const res = await fetch(`${RPC_ENDPOINTS.TRX}/v1/accounts/${address}`)
    if (!res.ok) return []
    
    const data = await res.json()
    const balance = (data.data?.[0]?.balance || 0) / 1e6
    
    if (balance > 0) {
      return [{
        txHash: 'balance',
        amount: balance,
        confirmations: 999,
        timestamp: Math.floor(Date.now() / 1000),
      }]
    }
    
    return []
  } catch (e) {
    console.error('TRX fetch error:', e)
    return []
  }
}

// Fetch BNB transactions
async function fetchBNBTransactions(address: string): Promise<Transaction[]> {
  try {
    const balRes = await fetch(RPC_ENDPOINTS.BSC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    })
    
    if (!balRes.ok) return []
    const { result: balHex } = await balRes.json()
    const balance = parseInt(balHex, 16) / 1e18
    
    if (balance > 0) {
      return [{
        txHash: 'balance',
        amount: balance,
        confirmations: 999,
        timestamp: Math.floor(Date.now() / 1000),
      }]
    }
    
    return []
  } catch (e) {
    console.error('BNB fetch error:', e)
    return []
  }
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { address, chain } = await req.json()

    if (!address || !chain) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing address or chain' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Fetching ${chain} balance for: ${address}`)

    let transactions: Transaction[] = []
    const chainUpper = chain.toUpperCase()

    switch (chainUpper) {
      case 'BTC':
      case 'BITCOIN':
        transactions = await fetchBitcoinTransactions(address)
        break
      case 'ETH':
      case 'ETHEREUM':
        transactions = await fetchEthereumTransactions(address)
        break
      case 'SOL':
      case 'SOLANA':
        transactions = await fetchSolanaTransactions(address)
        break
      case 'TRX':
      case 'TRON':
        transactions = await fetchTronTransactions(address)
        break
      case 'BNB':
      case 'BSC':
        transactions = await fetchBNBTransactions(address)
        break
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unsupported chain: ${chain}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0)

    console.log(`${chain} balance for ${address}: ${balance}`)

    return new Response(
      JSON.stringify({
        success: true,
        address,
        chain: chainUpper,
        balance,
        transactions,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('Error:', e)
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
