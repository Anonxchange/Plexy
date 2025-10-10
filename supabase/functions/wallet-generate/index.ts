import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { currency } = await req.json();

    if (!['BTC', 'ETH', 'USDT', 'USDC'].includes(currency)) {
      return new Response(JSON.stringify({ error: 'Invalid currency' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if wallet already exists
    const { data: existingWallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('currency', currency)
      .single();

    if (existingWallet) {
      return new Response(JSON.stringify({ wallet: existingWallet }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get next derivation index
    const { data: counter, error: counterError } = await supabase
      .from('wallet_derivation_counter')
      .select('last_index')
      .eq('currency', currency)
      .single();

    if (counterError) throw counterError;

    const nextIndex = (counter?.last_index || 0) + 1;

    // Update counter
    await supabase
      .from('wallet_derivation_counter')
      .update({ last_index: nextIndex })
      .eq('currency', currency);

    // Generate address based on currency type
    let address: string;
    
    // Note: In production, this should call the WalletService
    // For now, we'll create a placeholder that needs the master seed
    const masterSeed = Deno.env.get('MASTER_WALLET_SEED');
    
    if (!masterSeed) {
      throw new Error('Master wallet seed not configured');
    }

    // Import wallet generation logic here
    // For now, using placeholder addresses
    if (currency === 'BTC') {
      address = `bc1q${nextIndex}placeholder${user.id.slice(0, 8)}`;
    } else {
      address = `0x${nextIndex}${user.id.replace(/-/g, '').slice(0, 38)}`;
    }

    // Create wallet record
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .insert({
        user_id: user.id,
        currency,
        address,
        derivation_index: nextIndex,
      })
      .select()
      .single();

    if (walletError) throw walletError;

    return new Response(JSON.stringify({ wallet }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
