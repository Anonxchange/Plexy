import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

// Verify webhook signature from Didit
async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return computedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DIDIT_WEBHOOK_SECRET = Deno.env.get('DIDIT_WEBHOOK_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const payload = await req.text();
    
    // Verify webhook signature if secret is configured
    if (DIDIT_WEBHOOK_SECRET) {
      const signature = req.headers.get('x-webhook-signature') || req.headers.get('X-Webhook-Signature');
      if (signature) {
        const isValid = await verifyWebhookSignature(payload, signature, DIDIT_WEBHOOK_SECRET);
        if (!isValid) {
          console.error('Invalid webhook signature');
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const webhookData = JSON.parse(payload);
    console.log('Received Didit webhook:', JSON.stringify(webhookData, null, 2));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract user ID from vendor_data or metadata
    const userId = webhookData.vendor_data || webhookData.metadata?.user_id;
    const sessionId = webhookData.session_id;
    const status = webhookData.status?.toLowerCase();
    const eventType = webhookData.event_type;

    if (!userId) {
      console.error('No user ID in webhook data');
      return new Response(
        JSON.stringify({ error: 'Missing user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing Didit webhook for user ${userId}, status: ${status}, event: ${eventType}`);

    // Map Didit status to our KYC status
    let kycStatus = 'pending';
    let verificationLevel = 1;

    switch (status) {
      case 'approved':
      case 'verified':
      case 'completed':
        kycStatus = 'approved';
        verificationLevel = 2; // Level 2 verified
        break;
      case 'rejected':
      case 'declined':
      case 'failed':
        kycStatus = 'rejected';
        break;
      case 'in_progress':
      case 'processing':
      case 'in_review':
        kycStatus = 'pending';
        break;
      case 'expired':
        kycStatus = 'expired';
        break;
      default:
        kycStatus = 'pending';
    }

    // Update KYC document status
    const { error: docError } = await supabase
      .from('kyc_documents')
      .update({
        status: kycStatus,
        reviewed_at: new Date().toISOString(),
        rejection_reason: webhookData.rejection_reason || webhookData.decline_reasons?.join(', ') || null,
      })
      .eq('user_id', userId)
      .eq('document_type', 'didit_kyc_level2')
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (docError) {
      console.error('Error updating KYC document:', docError);
    }

    // Update user profile with verification status
    const updateData: Record<string, any> = {
      kyc_status: kycStatus,
      updated_at: new Date().toISOString(),
    };

    if (kycStatus === 'approved') {
      updateData.verification_level = verificationLevel;
      updateData.is_verified = true;
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
    }

    // Create notification for user
    const notificationMessages: Record<string, { title: string; message: string }> = {
      approved: {
        title: 'KYC Verification Approved',
        message: 'Congratulations! Your Level 2 identity verification has been approved. You now have full access to all platform features.',
      },
      rejected: {
        title: 'KYC Verification Declined',
        message: `Your identity verification was not approved. ${webhookData.rejection_reason || 'Please try again with valid documents.'}`,
      },
      pending: {
        title: 'KYC Verification In Progress',
        message: 'Your identity verification is being reviewed. We will notify you once the review is complete.',
      },
    };

    const notification = notificationMessages[kycStatus] || notificationMessages.pending;

    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'kyc',
        title: notification.title,
        message: notification.message,
        metadata: {
          session_id: sessionId,
          status: kycStatus,
          verification_level: verificationLevel,
        },
      });

    // Log security audit event
    await supabase
      .from('security_audit_logs')
      .insert({
        event_type: 'kyc_verification_update',
        email: null,
        ip_address: req.headers.get('x-forwarded-for') || 'webhook',
        success: kycStatus === 'approved',
        failure_reason: kycStatus === 'rejected' ? webhookData.rejection_reason : null,
        metadata: {
          user_id: userId,
          session_id: sessionId,
          status: kycStatus,
          event_type: eventType,
        },
      });

    console.log(`Updated user ${userId} KYC status to: ${kycStatus}`);

    return new Response(
      JSON.stringify({ success: true, status: kycStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
