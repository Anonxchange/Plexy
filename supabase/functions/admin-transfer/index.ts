import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransferRequest {
  user_id: string;
  crypto_symbol: string;
  amount: number;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header and verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, crypto_symbol, amount, notes }: TransferRequest = await req.json();

    // Validate input
    if (!user_id || !crypto_symbol || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: user_id, crypto_symbol, and positive amount required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create user wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user_id)
      .eq('crypto_symbol', crypto_symbol.toUpperCase())
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // Wallet doesn't exist, create it
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id,
          crypto_symbol: crypto_symbol.toUpperCase(),
          balance: 0,
          locked_balance: 0
        })
        .select('id, balance')
        .single();

      if (createError) {
        throw new Error(`Failed to create wallet: ${createError.message}`);
      }
      wallet = newWallet;
    } else if (walletError) {
      throw new Error(`Failed to get wallet: ${walletError.message}`);
    }

    // Update wallet balance
    const newBalance = (wallet?.balance || 0) + amount;
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet!.id);

    if (updateError) {
      throw new Error(`Failed to update balance: ${updateError.message}`);
    }

    // Record transaction
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id,
        wallet_id: wallet!.id,
        type: 'admin_transfer',
        crypto_symbol: crypto_symbol.toUpperCase(),
        amount,
        fee: 0,
        status: 'completed',
        notes: notes || `Admin transfer from master wallet by ${user.email}`
      })
      .select()
      .single();

    if (txError) {
      console.error('Failed to record transaction:', txError);
      // Don't fail the whole operation, balance is already updated
    }

    console.log(`Admin transfer: ${amount} ${crypto_symbol} to user ${user_id} by admin ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully transferred ${amount} ${crypto_symbol}`,
        new_balance: newBalance,
        transaction_id: transaction?.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Admin transfer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
