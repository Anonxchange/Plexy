import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as secp256k1 from 'https://esm.sh/@noble/secp256k1@2.0.0';
import { sha256 } from 'https://esm.sh/@noble/hashes@1.3.3/sha256';
import { ripemd160 } from 'https://esm.sh/@noble/hashes@1.3.3/ripemd160';
import { keccak_256 } from 'https://esm.sh/@noble/hashes@1.3.3/sha3';
import * as ed25519 from 'https://esm.sh/@noble/ed25519@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base58 alphabet
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer: Uint8Array): string {
  if (buffer.length === 0) return '';
  
  let digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  
  let result = '';
  for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) {
    result += ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += ALPHABET[digits[i]];
  }
  
  return result;
}

function base58CheckEncode(payload: Uint8Array): string {
  const checksum = sha256(sha256(payload)).slice(0, 4);
  const result = new Uint8Array(payload.length + checksum.length);
  result.set(payload);
  result.set(checksum, payload.length);
  return base58Encode(result);
}

// Generate deterministic private key from seed and user ID
function generatePrivateKey(seed: Uint8Array, userId: string, cryptoSymbol: string): Uint8Array {
  const encoder = new TextEncoder();
  const derivationData = encoder.encode(`${userId}-${cryptoSymbol}`);
  
  // Combine seed with derivation data
  const combined = new Uint8Array(seed.length + derivationData.length);
  combined.set(seed);
  combined.set(derivationData, seed.length);
  
  // Generate deterministic private key (32 bytes)
  return sha256(combined);
}

// Generate Bitcoin P2PKH address
function generateBitcoinAddress(privateKey: Uint8Array): string {
  // Get public key from private key
  const publicKey = secp256k1.getPublicKey(privateKey, true); // compressed
  
  // Hash public key: SHA-256 then RIPEMD-160
  const sha256Hash = sha256(publicKey);
  const hash160 = ripemd160(sha256Hash);
  
  // Add version byte (0x00 for mainnet P2PKH)
  const versioned = new Uint8Array(21);
  versioned[0] = 0x00;
  versioned.set(hash160, 1);
  
  // Base58Check encode
  return base58CheckEncode(versioned);
}

// Generate Ethereum address (also works for BNB/BSC)
function generateEthereumAddress(privateKey: Uint8Array): string {
  // Get uncompressed public key (remove 0x04 prefix)
  const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
  
  // Keccak-256 hash of public key
  const hash = keccak_256(publicKey);
  
  // Take last 20 bytes and convert to hex
  const addressBytes = hash.slice(-20);
  const address = Array.from(addressBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return '0x' + address;
}

// Generate Solana address
function generateSolanaAddress(privateKey: Uint8Array): string {
  // For Solana, we use Ed25519
  // The public key is the address
  const publicKey = ed25519.getPublicKey(privateKey.slice(0, 32));
  return base58Encode(publicKey);
}

// Generate Tron address
function generateTronAddress(privateKey: Uint8Array): string {
  // Tron uses same algorithm as Ethereum but with different encoding
  const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
  const hash = keccak_256(publicKey);
  const addressBytes = hash.slice(-20);
  
  // Add Tron version byte (0x41 for mainnet)
  const versioned = new Uint8Array(21);
  versioned[0] = 0x41;
  versioned.set(addressBytes, 1);
  
  // Base58Check encode
  return base58CheckEncode(versioned);
}

// Generate deterministic address
function generateAddress(seed: Uint8Array, userId: string, cryptoSymbol: string): string {
  const privateKey = generatePrivateKey(seed, userId, cryptoSymbol);
  
  if (cryptoSymbol === 'BTC') {
    return generateBitcoinAddress(privateKey);
  } else if (cryptoSymbol === 'SOL') {
    return generateSolanaAddress(privateKey);
  } else if (cryptoSymbol === 'TRX') {
    return generateTronAddress(privateKey);
  } else {
    // ETH, USDT, USDC, BNB all use Ethereum addresses
    // BNB uses BSC which is EVM-compatible
    return generateEthereumAddress(privateKey);
  }
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

    if (!['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'TRX', 'BNB'].includes(crypto_symbol)) {
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
    const seedBytes = sha256(encoder.encode(masterSeed));

    // Generate deterministic address for this user and crypto
    const address = generateAddress(seedBytes, user.id, crypto_symbol);

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
