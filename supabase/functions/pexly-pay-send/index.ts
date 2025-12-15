import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendRequest {
  recipient_username: string;
  crypto_symbol: string;
  amount: number;
  note?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: SendRequest = await req.json();
    console.log('Pexly Pay send request:', { sender_id: user.id, ...body });

    // Validate inputs
    if (!body.recipient_username || !body.crypto_symbol || !body.amount) {
      throw new Error('Missing required fields');
    }

    if (body.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Get sender profile
    const { data: senderProfile, error: senderError } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (senderError || !senderProfile) {
      throw new Error('Sender profile not found');
    }

    // Prevent self-transfer
    if (body.recipient_username.toLowerCase() === senderProfile.username.toLowerCase()) {
      throw new Error('Cannot send to yourself');
    }

    // Get recipient
    const { data: recipient, error: recipientError } = await supabase
      .from('user_profiles')
      .select('id, username')
      .ilike('username', body.recipient_username)
      .single();

    if (recipientError || !recipient) {
      throw new Error('Recipient not found');
    }

    // Get sender wallet
    const { data: senderWallet, error: senderWalletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .eq('crypto_symbol', body.crypto_symbol)
      .single();

    if (senderWalletError || !senderWallet) {
      throw new Error('Sender wallet not found');
    }

    if (senderWallet.balance < body.amount) {
      throw new Error('Insufficient balance');
    }

    // Deduct from sender
    const { error: deductError } = await supabase
      .from('wallets')
      .update({ 
        balance: senderWallet.balance - body.amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', senderWallet.id);

    if (deductError) {
      console.error('Deduction error:', deductError);
      throw new Error('Failed to deduct from sender');
    }

    // Get or create recipient wallet
    let { data: recipientWallet, error: recipientWalletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', recipient.id)
      .eq('crypto_symbol', body.crypto_symbol)
      .single();

    if (recipientWalletError || !recipientWallet) {
      // Create wallet for recipient
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: recipient.id,
          crypto_symbol: body.crypto_symbol,
          balance: 0
        })
        .select('id, balance')
        .single();

      if (createError || !newWallet) {
        // Rollback sender deduction
        await supabase
          .from('wallets')
          .update({ balance: senderWallet.balance })
          .eq('id', senderWallet.id);
        throw new Error('Failed to create recipient wallet');
      }

      recipientWallet = newWallet;
    }

    // Add to recipient
    const { error: addError } = await supabase
      .from('wallets')
      .update({ 
        balance: recipientWallet.balance + body.amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipientWallet.id);

    if (addError) {
      console.error('Addition error:', addError);
      // Rollback sender deduction
      await supabase
        .from('wallets')
        .update({ balance: senderWallet.balance })
        .eq('id', senderWallet.id);
      throw new Error('Failed to add to recipient');
    }

    // Record in pexly_pay_transfers table
    const { error: transferError } = await supabase
      .from('pexly_pay_transfers')
      .insert({
        sender_id: user.id,
        recipient_id: recipient.id,
        crypto_symbol: body.crypto_symbol,
        amount: body.amount,
        note: body.note,
        status: 'completed'
      });

    if (transferError) {
      console.error('Transfer record error:', transferError);
    }

    // Record sender transaction
    const { error: senderTxError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        wallet_id: senderWallet.id,
        type: 'pexly_pay_send',
        crypto_symbol: body.crypto_symbol,
        amount: -body.amount,
        fee: 0,
        status: 'completed',
        notes: `Sent to @${recipient.username}${body.note ? ': ' + body.note : ''}`
      });

    if (senderTxError) {
      console.error('Sender transaction error:', senderTxError);
    }

    // Record recipient transaction
    const { error: recipientTxError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: recipient.id,
        wallet_id: recipientWallet.id,
        type: 'pexly_pay_receive',
        crypto_symbol: body.crypto_symbol,
        amount: body.amount,
        fee: 0,
        status: 'completed',
        notes: `Received from @${senderProfile.username}${body.note ? ': ' + body.note : ''}`
      });

    if (recipientTxError) {
      console.error('Recipient transaction error:', recipientTxError);
    }

    console.log('Pexly Pay transfer completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        transfer: {
          recipient: recipient.username,
          crypto_symbol: body.crypto_symbol,
          amount: body.amount,
          fee: 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Pexly Pay error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
