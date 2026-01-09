import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Token contract addresses for balance queries
const TOKEN_CONTRACTS = {
  // Ethereum
  USDT_ETH: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  USDC_ETH: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  // BSC
  USDT_BSC: '0x55d398326f99059ff775485246999027b3197955',
  USDC_BSC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  // Tron
  USDT_TRX: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  USDC_TRX: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
}

// SPL Token mint addresses for Solana
const SOLANA_TOKEN_MINTS = {
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
}

async function getERC20Balance(rpcUrl: string, walletAddress: string, tokenContract: string): Promise<number> {
  try {
    // balanceOf(address) function selector: 0x70a08231
    const data = '0x70a08231' + walletAddress.slice(2).toLowerCase().padStart(64, '0');
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: tokenContract, data }, 'latest'],
        id: 1,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.result && result.result !== '0x') {
        // USDT and USDC have 6 decimals
        return parseInt(result.result, 16) / 1e6;
      }
    }
    return 0;
  } catch (error) {
    console.error(`ERC20 balance error:`, error);
    return 0;
  }
}

async function getTRC20Balance(walletAddress: string, tokenContract: string): Promise<number> {
  try {
    const response = await fetch(`https://api.trongrid.io/v1/accounts/${walletAddress}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      const trc20Balances = data.data?.[0]?.trc20 || [];
      
      for (const tokenBalance of trc20Balances) {
        if (tokenBalance[tokenContract]) {
          return parseInt(tokenBalance[tokenContract]) / 1e6;
        }
      }
    }
    return 0;
  } catch (error) {
    console.error(`TRC20 balance error:`, error);
    return 0;
  }
}

async function getSPLTokenBalance(walletAddress: string, mintAddress: string): Promise<number> {
  try {
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          { mint: mintAddress },
          { encoding: 'jsonParsed' }
        ]
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const accounts = data.result?.value || [];
      
      let totalBalance = 0;
      for (const account of accounts) {
        const tokenAmount = account.account?.data?.parsed?.info?.tokenAmount;
        if (tokenAmount) {
          totalBalance += parseFloat(tokenAmount.uiAmount || 0);
        }
      }
      return totalBalance;
    }
    return 0;
  } catch (error) {
    console.error(`SPL token balance error:`, error);
    return 0;
  }
}

interface WalletBalance {
  wallet_id: string;
  user_id: string;
  address: string;
  chain_id: string;
  symbol: string;
  balance: string;
  balanceFormatted: string;
  decimals: number;
  timestamp: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for user auth to filter by user
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    console.log('Starting wallet balance monitoring...');

    // Build query - filter by user if authenticated
    let query = supabase.from('user_wallets').select('*').eq('is_active', 'true');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: userWallets, error: walletsError } = await query;

    if (walletsError) {
      throw walletsError;
    }

    console.log(`Monitoring ${userWallets?.length || 0} wallets`);

    const results: WalletBalance[] = [];

    for (const wallet of userWallets || []) {
      try {
        const { chain_id, address, user_id, id: wallet_id } = wallet;
        const chainUpper = chain_id.toUpperCase();
        
        console.log(`Checking ${chain_id} address: ${address}`);

        // Determine chain type and token
        let balance = 0;
        let symbol = '';
        let decimals = 18;

        // Bitcoin
        if (chainUpper.includes('BITCOIN') || chainUpper === 'BTC') {
          symbol = 'BTC';
          decimals = 8;
          const response = await fetch(`https://blockstream.info/api/address/${address}`);
          if (response.ok) {
            const data = await response.json();
            const confirmedBalance = (data.chain_stats?.funded_txo_sum || 0) - (data.chain_stats?.spent_txo_sum || 0);
            balance = confirmedBalance / 100000000;
          }
        }
        // Ethereum native
        else if (chainUpper.includes('ERC-20') && !chainUpper.includes('USDT') && !chainUpper.includes('USDC')) {
          symbol = 'ETH';
          const response = await fetch('https://eth.llamarpc.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getBalance',
              params: [address, 'latest'],
              id: 1,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.result) {
              balance = parseInt(data.result, 16) / 1e18;
            }
          }
        }
        // USDT on Ethereum
        else if (chainUpper.includes('USDT') && chainUpper.includes('ERC')) {
          symbol = 'USDT';
          decimals = 6;
          balance = await getERC20Balance('https://eth.llamarpc.com', address, TOKEN_CONTRACTS.USDT_ETH);
        }
        // USDC on Ethereum
        else if (chainUpper.includes('USDC') && chainUpper.includes('ERC')) {
          symbol = 'USDC';
          decimals = 6;
          balance = await getERC20Balance('https://eth.llamarpc.com', address, TOKEN_CONTRACTS.USDC_ETH);
        }
        // BSC native
        else if (chainUpper.includes('BEP-20') && !chainUpper.includes('USDT') && !chainUpper.includes('USDC')) {
          symbol = 'BNB';
          const response = await fetch('https://bsc-dataseed.binance.org/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getBalance',
              params: [address, 'latest'],
              id: 1,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.result) {
              balance = parseInt(data.result, 16) / 1e18;
            }
          }
        }
        // USDT on BSC
        else if (chainUpper.includes('USDT') && chainUpper.includes('BEP')) {
          symbol = 'USDT';
          decimals = 6;
          balance = await getERC20Balance('https://bsc-dataseed.binance.org/', address, TOKEN_CONTRACTS.USDT_BSC);
        }
        // USDC on BSC
        else if (chainUpper.includes('USDC') && chainUpper.includes('BEP')) {
          symbol = 'USDC';
          decimals = 6;
          balance = await getERC20Balance('https://bsc-dataseed.binance.org/', address, TOKEN_CONTRACTS.USDC_BSC);
        }
        // Solana native
        else if (chainUpper === 'SOLANA' || (chainUpper.includes('SOLANA') && !chainUpper.includes('USDT') && !chainUpper.includes('USDC'))) {
          symbol = 'SOL';
          decimals = 9;
          const response = await fetch('https://api.mainnet-beta.solana.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getBalance',
              params: [address]
            }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.result?.value !== undefined) {
              balance = data.result.value / 1e9;
            }
          }
        }
        // USDT on Solana
        else if (chainUpper.includes('USDT') && chainUpper.includes('SOLANA')) {
          symbol = 'USDT';
          decimals = 6;
          balance = await getSPLTokenBalance(address, SOLANA_TOKEN_MINTS.USDT);
        }
        // USDC on Solana
        else if (chainUpper.includes('USDC') && chainUpper.includes('SOLANA')) {
          symbol = 'USDC';
          decimals = 6;
          balance = await getSPLTokenBalance(address, SOLANA_TOKEN_MINTS.USDC);
        }
        // Tron native
        else if (chainUpper.includes('TRC-20') && !chainUpper.includes('USDT') && !chainUpper.includes('USDC')) {
          symbol = 'TRX';
          decimals = 6;
          const response = await fetch(`https://api.trongrid.io/v1/accounts/${address}`, {
            headers: { 'Accept': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.data?.[0]?.balance !== undefined) {
              balance = data.data[0].balance / 1e6;
            }
          }
        }
        // USDT on Tron
        else if (chainUpper.includes('USDT') && chainUpper.includes('TRC')) {
          symbol = 'USDT';
          decimals = 6;
          balance = await getTRC20Balance(address, TOKEN_CONTRACTS.USDT_TRX);
        }
        // USDC on Tron
        else if (chainUpper.includes('USDC') && chainUpper.includes('TRC')) {
          symbol = 'USDC';
          decimals = 6;
          balance = await getTRC20Balance(address, TOKEN_CONTRACTS.USDC_TRX);
        }
        else {
          console.log(`Unknown chain type: ${chain_id}`);
          symbol = chain_id;
        }

        if (symbol) {
          console.log(`${symbol} balance for ${address}: ${balance}`);
          
          results.push({
            wallet_id,
            user_id,
            address,
            chain_id,
            symbol,
            balance: balance.toString(),
            balanceFormatted: balance.toFixed(decimals > 6 ? 8 : 6),
            decimals,
            timestamp: new Date().toISOString(),
          });
        }

      } catch (error) {
        console.error(`Error checking wallet ${wallet.address}:`, error);
      }
    }

    console.log(`Monitoring complete. Checked ${results.length} wallets.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fetched balances for ${results.length} wallets`,
        balances: results,
        timestamp: new Date().toISOString(),
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
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        balances: [],
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
