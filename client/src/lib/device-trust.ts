// src/lib/device-trust.ts — NEW FILE
//
// Replaces the client-side `registerDeviceAsTrusted` write.
//
// 20260810_auth_hardening_v2.sql revoked INSERT/UPDATE on user_devices.trusted
// from `authenticated`, but the client kept calling the direct write and
// swallowing the resulting error with console.error. The visible symptom is
// that device verification is demanded on every single login and nothing is
// ever remembered.
//
// This routes through trust_current_device() (20260811_auth_hardening_v3.sql),
// a SECURITY DEFINER function that will only set trusted = true when the
// calling session is AAL2 or verified a possession factor (OTP/SMS/email/
// WebAuthn) within the last 10 minutes — read from the JWT's amr claim, not
// from anything the client asserts.

import { getSupabase } from "@/lib/supabase";
import { deviceFingerprint } from "@/lib/security/device-fingerprint";

/**
 * Returns true when the device was actually recorded as trusted.
 * Callers must surface `false` to the user rather than ignoring it — the
 * silent-failure pattern is what hid the broken write for so long.
 */
export async function trustCurrentDevice(): Promise<boolean> {
  try {
    const sb = await getSupabase();
    const fp = await deviceFingerprint.getFingerprint();
    if (!fp) return false;

    const info = deviceFingerprint.getDeviceInfo?.() ?? {};

    const { error } = await sb.rpc("trust_current_device", {
      p_fingerprint: fp,
      p_device_name: info.deviceName ?? null,
      p_browser: info.browser ?? null,
      p_os: info.os ?? null,
    });

    if (error) {
      // 42501 = device_trust_requires_verification. Expected when the session
      // has not proven a factor recently; not an error worth alarming about.
      console.warn("trust_current_device rejected:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("trust_current_device failed:", err);
    return false;
  }
}
