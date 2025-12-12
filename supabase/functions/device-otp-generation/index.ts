import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateOTPRequest {
  device_fingerprint: string;
  device_info: {
    device_name: string;
    browser: string;
    os: string;
    ip_address: string;
  };
}

function generateSecureOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = (array[0] % 900000) + 100000;
  return otp.toString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('OTP generation failed: No authorization token provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('OTP generation failed: Invalid auth token', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: GenerateOTPRequest;
    try {
      body = await req.json();
    } catch {
      console.log('OTP generation failed: Invalid request body');
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { device_fingerprint, device_info } = body;

    if (!device_fingerprint || !device_info) {
      console.log('OTP generation failed: Missing device information');
      return new Response(
        JSON.stringify({ error: 'Missing device information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if device is already trusted
    const { data: trustedDevice } = await supabase
      .from('trusted_devices')
      .select('id')
      .eq('user_id', user.id)
      .eq('device_fingerprint', device_fingerprint)
      .eq('is_trusted', true)
      .maybeSingle();

    if (trustedDevice) {
      console.log(`Device already trusted for user ${user.id}`);
      return new Response(
        JSON.stringify({ requires_otp: false, device_trusted: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: check recent attempts
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('device_otp_verifications')
      .select('id')
      .eq('user_id', user.id)
      .gt('created_at', fiveMinutesAgo);

    if (recentAttempts && recentAttempts.length >= 5) {
      console.log(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Too many verification attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete any existing unverified OTPs for this user
    await supabase
      .from('device_otp_verifications')
      .delete()
      .eq('user_id', user.id)
      .eq('verified', false);

    const otp = generateSecureOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store the OTP
    const { error: insertError } = await supabase
      .from('device_otp_verifications')
      .insert({
        user_id: user.id,
        email: user.email,
        otp_code: otp,
        device_fingerprint: device_fingerprint,
        device_info: device_info,
        expires_at: expiresAt,
        verified: false,
      });

    if (insertError) {
      console.error('Error creating OTP:', insertError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to generate verification code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send OTP via email
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (RESEND_API_KEY && user.email) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Device Verification Code</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
              <div style="max-width: 480px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 40px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="width: 60px; height: 60px; background-color: #B4F22E; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <span style="font-size: 28px; font-weight: bold; color: black;">P</span>
                  </div>
                  <h1 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0;">New Device Login</h1>
                </div>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  We detected a login attempt from a new device. Enter this code to verify:
                </p>
                
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="color: #666; font-size: 14px; margin: 0 0 8px 0;">Device: ${device_info.device_name} - ${device_info.browser} on ${device_info.os}</p>
                  <p style="color: #888; font-size: 13px; margin: 0;">IP: ${device_info.ip_address}</p>
                </div>
                
                <div style="background-color: #1a1a1a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <p style="color: #B4F22E; font-size: 14px; font-weight: 500; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                    Verification Code
                  </p>
                  <p style="color: white; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: monospace;">
                    ${otp}
                  </p>
                </div>
                
                <p style="color: #888; font-size: 14px; line-height: 1.5;">
                  This code expires in 10 minutes. If you didn't attempt to log in, please secure your account.
                </p>
              </div>
            </body>
          </html>
        `;

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Pexly Security <security@pexly.app>',
            to: [user.email],
            subject: `${otp} is your Pexly verification code`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          console.error('Resend API error:', errorData);
        } else {
          console.log(`OTP email sent to ${user.email}`);
        }
      } catch (emailError) {
        console.warn('Could not send email, OTP stored in database:', emailError);
      }
    } else {
      console.warn('RESEND_API_KEY not configured or user has no email');
    }

    console.log(`OTP generated successfully for user ${user.id}`);
    return new Response(
      JSON.stringify({ 
        requires_otp: true, 
        otp_sent: true,
        email: user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('OTP generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate OTP' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
