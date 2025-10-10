import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { escrow_id } = await req.json();

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrows')
      .select('*')
      .eq('id', escrow_id)
      .single();

    if (escrowError || !escrow) {
      return new Response(JSON.stringify({ error: 'Escrow not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify user is seller or admin
    if (escrow.seller_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized to release escrow' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (escrow.status !== 'locked') {
      return new Response(JSON.stringify({ error: 'Escrow already processed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get seller and buyer wallets
    const { data: sellerWallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('id', escrow.wallet_id)
      .single();

    const { data: buyerWallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', escrow.buyer_id)
      .eq('currency', escrow.currency)
      .single();

    if (!sellerWallet || !buyerWallet) {
      return new Response(JSON.stringify({ error: 'Wallet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Release escrow: unlock seller funds and transfer to buyer
    await supabase
      .from('user_wallets')
      .update({
        locked_balance: sellerWallet.locked_balance - escrow.amount,
      })
      .eq('id', sellerWallet.id);

    await supabase
      .from('user_wallets')
      .update({
        balance: buyerWallet.balance + escrow.amount,
      })
      .eq('id', buyerWallet.id);

    // Update escrow status
    await supabase
      .from('escrows')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
      })
      .eq('id', escrow_id);

    // Create transaction records
    await supabase
      .from('transactions')
      .insert([
        {
          wallet_id: sellerWallet.id,
          user_id: escrow.seller_id,
          type: 'escrow_release',
          amount: -escrow.amount,
          currency: escrow.currency,
          status: 'confirmed',
          to_address: buyerWallet.address,
          notes: `Released escrow ${escrow_id}`,
        },
        {
          wallet_id: buyerWallet.id,
          user_id: escrow.buyer_id,
          type: 'escrow_release',
          amount: escrow.amount,
          currency: escrow.currency,
          status: 'confirmed',
          from_address: sellerWallet.address,
          notes: `Received from escrow ${escrow_id}`,
        },
      ]);

    return new Response(JSON.stringify({ success: true, escrow_id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
