import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload = await req.json()
    console.log('Webhook received:', JSON.stringify(payload, null, 2))

    // Health check
    if (payload.test || payload.name === 'Functions') {
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract deposit data - support multiple webhook formats
    let toAddress: string | undefined
    let amount: number | undefined
    let asset: string | undefined
    let txHash: string | undefined
    let chainId: string | undefined

    // Alchemy format
    if (payload.event?.activity) {
      const activity = payload.event.activity[0]
      toAddress = activity.toAddress?.toLowerCase()
      amount = parseFloat(activity.value)
      asset = activity.asset
      txHash = activity.hash
      chainId = payload.event.network
    }
    // BlockCypher format
    else if (payload.addresses && payload.hash) {
      toAddress = payload.addresses[0]?.toLowerCase()
      amount = payload.total / 100000000 // satoshis to BTC
      asset = 'BTC'
      txHash = payload.hash
      chainId = 'bitcoin'
    }
    // Generic format
    else if (payload.address && payload.txHash) {
      toAddress = payload.address.toLowerCase()
      amount = parseFloat(payload.amount)
      asset = payload.asset || payload.chain
      txHash = payload.txHash
      chainId = payload.chainId || payload.chain
    }

    if (!toAddress || !amount || !asset || !txHash) {
      console.error('Missing required fields:', { toAddress, amount, asset, txHash })
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required transaction data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Processing: ${amount} ${asset} to ${toAddress}, tx: ${txHash}`)

    // Check if already processed
    const { data: existingTx } = await supabase
      .from('processed_txs')
      .select('id')
      .eq('tx_hash', txHash)
      .maybeSingle()

    if (existingTx) {
      console.log('Already processed:', txHash)
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find wallet in user_wallets table (non-custodial)
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*, user_profiles!user_wallets_user_id_fkey(id, email)')
      .ilike('address', toAddress)
      .maybeSingle()

    if (walletError) {
      console.error('Wallet lookup error:', walletError)
      throw walletError
    }

    if (!wallet) {
      console.log('Wallet not found for:', toAddress)
      return new Response(
        JSON.stringify({ success: false, error: 'Wallet not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Create notification for user
    const { error: notifyError } = await supabase
      .from('notifications')
      .insert({
        user_id: wallet.user_id,
        type: 'deposit',
        title: 'Deposit Received',
        message: `You received ${amount} ${asset}`,
        metadata: { txHash, amount, asset, address: toAddress }
      })

    if (notifyError) {
      console.error('Notification error:', notifyError)
    }

    // Mark as processed
    await supabase
      .from('processed_txs')
      .insert({
        tx_hash: txHash,
        crypto_symbol: asset,
        processed_at: new Date().toISOString()
      })

    console.log(`✅ Deposit notification sent to user ${wallet.user_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Deposit processed',
        amount,
        asset,
        txHash,
        userId: wallet.user_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('Webhook error:', e)
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
