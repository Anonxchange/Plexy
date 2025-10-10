import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as encodeHex } from 'https://deno.land/std@0.195.0/encoding/hex.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bitcoin address generation (P2WPKH - native segwit)
async function generateBitcoinAddress(seed: Uint8Array, index: number): Promise<string> {
  const derivationPath = `m/84'/0'/0'/0/${index}`;
  
  // Simple deterministic address generation for demo
  const combined = new Uint8Array(seed.length + 4);
  combined.set(seed);
  combined.set(new Uint8Array([index >> 24, index >> 16, index >> 8, index]), seed.length);
  
  const hash = await crypto.subtle.digest('SHA-256', combined);
  const hexHash = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `bc1q${hexHash.slice(0, 38)}`;
}

// Ethereum address generation
async function generateEthereumAddress(seed: Uint8Array, index: number): Promise<string> {
  const derivationPath = `m/44'/60'/0'/0/${index}`;
  
  // Simple deterministic address generation for demo
  const combined = new Uint8Array(seed.length + 4);
  combined.set(seed);
  combined.set(new Uint8Array([index >> 24, index >> 16, index >> 8, index]), seed.length);
  
  const hash = await crypto.subtle.digest('SHA-256', combined);
  const address = Array.from(new Uint8Array(hash))
    .slice(0, 20)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `0x${address}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { crypto_symbol } = await req.json();

    if (!['BTC', 'ETH', 'USDT', 'USDC'].includes(crypto_symbol)) {
      return new Response(
        JSON.stringify({ error: 'Invalid crypto symbol' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if wallet already exists
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('crypto_symbol', crypto_symbol)
      .maybeSingle();

    if (existingWallet?.deposit_address) {
      console.log('Wallet already exists:', existingWallet);
      return new Response(
        JSON.stringify({ 
          wallet: existingWallet,
          message: 'Wallet already exists'
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get master seed
    const masterSeed = Deno.env.get('MASTER_WALLET_SEED');
    if (!masterSeed) {
      throw new Error('Master wallet seed not configured');
    }

    // Convert seed to bytes
    const encoder = new TextEncoder();
    const seedBytes = await crypto.subtle.digest('SHA-256', encoder.encode(masterSeed));
    const seedArray = new Uint8Array(seedBytes);

    // Use user ID hash as derivation index
    const userIdHash = await crypto.subtle.digest('SHA-256', encoder.encode(user.id));
    const derivationIndex = new DataView(userIdHash).getUint32(0);

    // Generate address based on currency type
    let address: string;
    
    if (crypto_symbol === 'BTC') {
      address = await generateBitcoinAddress(seedArray, derivationIndex);
    } else {
      // ETH, USDT, USDC all use Ethereum addresses
      address = await generateEthereumAddress(seedArray, derivationIndex);
    }

    console.log(`Generated ${crypto_symbol} address for user ${user.id}:`, address);

    // Update or create wallet record
    let wallet;
    if (existingWallet) {
      const { data, error: updateError } = await supabase
        .from('wallets')
        .update({ deposit_address: address })
        .eq('id', existingWallet.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      wallet = data;
    } else {
      const { data, error: insertError } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          crypto_symbol,
          deposit_address: address,
          balance: 0,
          locked_balance: 0,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      wallet = data;
    }

    return new Response(
      JSON.stringify({ 
        wallet,
        message: 'Wallet generated successfully'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error generating wallet:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
