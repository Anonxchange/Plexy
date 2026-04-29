import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DIDIT_API_KEY = Deno.env.get('DIDIT_API_KEY');
    const DIDIT_WORKFLOW_ID = Deno.env.get('DIDIT_WORKFLOW_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!DIDIT_API_KEY || !DIDIT_WORKFLOW_ID) {
      throw new Error('Didit credentials not configured');
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Parse request body for callback URL
    const { callback_url } = await req.json();

    // Create Didit verification session
    const diditResponse = await fetch('https://verification.didit.me/v2/session/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': DIDIT_API_KEY,
      },
      body: JSON.stringify({
        workflow_id: DIDIT_WORKFLOW_ID,
        callback: callback_url || `${SUPABASE_URL}/functions/v1/didit-webhook`,
        vendor_data: user.id, // Store user ID to link session to user
        metadata: {
          user_id: user.id,
          verification_level: 2,
        },
        contact_details: {
          email: profile?.email || user.email,
        },
      }),
    });

    if (!diditResponse.ok) {
      const errorText = await diditResponse.text();
      console.error('Didit API error:', diditResponse.status, errorText);
      throw new Error(`Didit API error: ${diditResponse.status}`);
    }

    const sessionData = await diditResponse.json();

    // Store the session in database for tracking
    const { error: insertError } = await supabase
      .from('kyc_documents')
      .insert({
        user_id: user.id,
        document_type: 'didit_kyc_level2',
        document_url: sessionData.url || sessionData.session_id,
        status: 'pending',
      });

    if (insertError) {
      console.error('Error storing KYC session:', insertError);
    }

    // Update user profile to track KYC in progress
    await supabase
      .from('user_profiles')
      .update({ 
        kyc_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    console.log(`Created Didit session for user ${user.id}: ${sessionData.session_id}`);

    return new Response(
      JSON.stringify({
        session_id: sessionData.session_id,
        session_url: sessionData.url,
        session_token: sessionData.session_token,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating Didit session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
