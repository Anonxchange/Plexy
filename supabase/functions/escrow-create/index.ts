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

    const { trade_id, buyer_id, amount, currency, expires_in_hours = 24 } = await req.json();

    // Verify user is the seller and has sufficient balance
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('currency', currency)
      .single();

    if (!wallet || wallet.balance < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create escrow and lock funds atomically
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    const { data: escrow, error: escrowError } = await supabase
      .from('escrows')
      .insert({
        trade_id,
        seller_id: user.id,
        buyer_id,
        amount,
        currency,
        wallet_id: wallet.id,
        status: 'locked',
        locked_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (escrowError) throw escrowError;

    // Update wallet locked balance
    await supabase
      .from('user_wallets')
      .update({
        balance: wallet.balance - amount,
        locked_balance: wallet.locked_balance + amount,
      })
      .eq('id', wallet.id);

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: user.id,
        type: 'escrow_lock',
        amount,
        currency,
        status: 'confirmed',
        notes: `Locked for trade ${trade_id}`,
      });

    return new Response(JSON.stringify({ escrow }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
