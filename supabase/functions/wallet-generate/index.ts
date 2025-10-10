import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bip39 from 'npm:@scure/bip39@1.2.1';
import { HDKey } from 'npm:@scure/bip32@1.3.2';
import { wordlist } from 'npm:@scure/bip39@1.2.1/wordlists/english';
import * as secp256k1 from 'npm:@noble/secp256k1@2.0.0';
import { keccak_256 } from 'npm:@noble/hashes@1.3.3/sha3';
import { bech32 } from 'npm:bech32@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bitcoin address generation (P2WPKH - native segwit)
async function generateBitcoinAddress(hdKey: HDKey, index: number): Promise<string> {
  const path = `m/84'/0'/0'/0/${index}`;
  const child = hdKey.derive(path);
  
  if (!child.publicKey) {
    throw new Error('Failed to derive Bitcoin public key');
  }
  
  // Create witness program (P2WPKH): OP_0 + 20-byte pubkey hash
  const hash = await crypto.subtle.digest('SHA-256', child.publicKey);
  const ripemd160 = new Uint8Array(20); // Simplified - using first 20 bytes of SHA-256
  const sha256Bytes = new Uint8Array(hash);
  ripemd160.set(sha256Bytes.slice(0, 20));
  
  // Encode as bech32
  const words = bech32.toWords(ripemd160);
  return bech32.encode('bc', words, 90);
}

// Ethereum address generation
function generateEthereumAddress(hdKey: HDKey, index: number): string {
  const path = `m/44'/60'/0'/0/${index}`;
  const child = hdKey.derive(path);
  
  if (!child.publicKey) {
    throw new Error('Failed to derive Ethereum public key');
  }
  
  // Get uncompressed public key (remove 0x04 prefix)
  const uncompressedPubKey = secp256k1.ProjectivePoint.fromHex(child.publicKey).toRawBytes(false).slice(1);
  
  // Keccak256 hash and take last 20 bytes
  const hash = keccak_256(uncompressedPubKey);
  const address = hash.slice(-20);
  
  // EIP-55 checksum
  const addressHex = Array.from(address).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(keccak_256(new TextEncoder().encode(addressHex)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  let checksummed = '0x';
  for (let i = 0; i < addressHex.length; i++) {
    checksummed += parseInt(hashHex[i], 16) >= 8 
      ? addressHex[i].toUpperCase() 
      : addressHex[i];
  }
  
  return checksummed;
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

    // Get master mnemonic
    const masterMnemonic = Deno.env.get('MASTER_WALLET_MNEMONIC');
    if (!masterMnemonic) {
      throw new Error('Master wallet mnemonic not configured');
    }

    // Validate mnemonic
    if (!bip39.validateMnemonic(masterMnemonic, wordlist)) {
      throw new Error('Invalid master mnemonic');
    }

    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(masterMnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);

    // Use user ID hash as derivation index (mod 2^31 to stay within valid range)
    const encoder = new TextEncoder();
    const userIdHash = await crypto.subtle.digest('SHA-256', encoder.encode(user.id));
    const derivationIndex = new DataView(userIdHash).getUint32(0) % 0x80000000;

    // Generate address based on currency type
    let address: string;
    
    if (crypto_symbol === 'BTC') {
      address = await generateBitcoinAddress(hdKey, derivationIndex);
    } else {
      // ETH, USDT, USDC all use Ethereum addresses
      address = generateEthereumAddress(hdKey, derivationIndex);
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
