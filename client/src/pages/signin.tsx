// ============================================================================
// PATCH for src/pages/signin.tsx
//
// Three edits. Apply AFTER auth-context.PATCH.tsx — edit 1 deletes the handler
// that the auth-context patch replaces, so doing this one first would leave
// Google sign-in with no registration gate at all.
// ============================================================================


// ─────────────────────────── EDIT 1 ────────────────────────────────────────
// DELETE the entire `finishGoogleCallback` useEffect (lines ~283-380 in your
// version, from the "// Google OAuth returns an authenticated Supabase session"
// comment through its closing `}, [user, session, pauseSessionForTOTP, ...]);`).
// Also delete the now-unused `googleCallbackHandledRef` declaration (line 66).
//
// WHY: this was one of two handlers for the same event. auth-context's
// onAuthStateChange gate nulls user/session first, so `if (!user || !session)
// return;` meant this effect normally never ran — its registration rejection
// and its TOTP challenge were dead code on the happy path. It only woke up in
// the interleaving where the context's profile read failed and re-committed
// the session — and then it called cleanup-abandoned-oauth-user and deleted the
// account. That is the race. The context gate is the correct owner because it
// fires for every session-bearing event, not only for the one URL the provider
// happens to land on.
//
// Replace it with nothing. If you want a spinner while the context gate runs:

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("oauth") !== "google") return;
  // auth-context owns the decision (registration gate + AAL step-up). This page
  // only shows that something is happening; it must not fetch, sign out, or
  // delete anything.
  setChecking2FA(true);
  const t = setTimeout(() => setChecking2FA(false), 10000); // safety valve
  return () => clearTimeout(t);
}, []);


// ─────────────────────────── EDIT 2 ────────────────────────────────────────
// Replace every bare `supabase.` usage in this file with an awaited client.
//
// WHY: supabase.ts's proxy THROWS synchronously (`SupabaseNotReady`) on any
// property access before the SDK chunk finishes downloading. In handleSubmit
// the phone branch calls `supabase.rpc(...)` outside any try/catch, so a slow
// chunk load produces an unhandled rejection and a submit button that silently
// does nothing. Mixing the throwing proxy with `await getSupabase()` in the
// same file guarantees this shows up under load, not in testing.

// hasSatisfiedMfa (~line 84):
const hasSatisfiedMfa = async () => {
  try {
    const sb = await getSupabase();
    const { data, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) return false;
    return !(data.currentLevel === "aal1" && data.nextLevel === "aal2");
  } catch {
    return false; // fail closed
  }
};

// enforceMfaGate (~line 94): same change — `const sb = await getSupabase();`
// at the top, then `sb.auth.mfa.*` throughout, and wrap the body so a thrown
// SupabaseNotReady returns "failed" rather than escaping.

// handleSubmit phone branch (~line 690):
if (isPhoneNumber) {
  const fullPhoneNumber = `${countryCode}${inputValue}`;
  try {
    const sb = await getSupabase();
    const { data: phoneRegistered, error: checkError } = await sb.rpc(
      "phone_registered_for_signin",
      { p_phone_number: fullPhoneNumber },
    );
    if (checkError || phoneRegistered !== true) {
      toast({
        title: "Couldn't start sign-in",
        description: "Check the number and try again, or sign up if you don't have an account yet.",
        variant: "destructive",
      });
      return;
    }
  } catch {
    toast({
      title: "Couldn't start sign-in",
      description: "Please try again in a moment.",
      variant: "destructive",
    });
    return;
  }
  setShowPhoneVerification(true);
  return;
}

// Do the same for the three `await supabase.auth.getSession()` calls
// (handleSubmit, handlePhoneVerified, handleDeviceVerified), the
// `supabase.auth.mfa.*` calls in handlePasskeySignIn and handleVerify2FA, and
// `(supabase.auth as any).signInWithPasskey`.


// ─────────────────────────── EDIT 3 ────────────────────────────────────────
// Device trust: stop writing the column the DB no longer lets you write.
//
// WHY: 20260810_auth_hardening_v2.sql did
//   REVOKE UPDATE (trusted), INSERT (trusted) ON user_devices FROM authenticated
// but signin.tsx still calls registerDeviceAsTrusted() and swallows the failure
// with console.error. Net effect today: device trust NEVER persists and every
// user re-verifies their device on every single login. Route it through the
// trust_current_device() RPC added in 20260811_auth_hardening_v3.sql, which
// only accepts a session that verified a factor in the last 10 minutes.

// In handleDeviceVerified and handlePhoneVerified, replace
//   await deviceFingerprint.registerDeviceAsTrusted(userId)
// with:
import { trustCurrentDevice } from "@/lib/device-trust";

const trusted = await trustCurrentDevice();
if (!trusted) {
  // Surface it. Silently swallowing this is what hid the bug for so long.
  toast({
    title: "Couldn't remember this device",
    description: "You're signed in, but you may be asked to verify again next time.",
  });
}
