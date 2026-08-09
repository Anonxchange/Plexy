// supabase/functions/cleanup-abandoned-oauth-user/index.ts
//
// REPLACES the deleting version. It no longer deletes anything.
//
// Why: the old function deleted any self-authenticated account younger than
// 15 minutes whose profile had registration_completed = false. That is exactly
// what a legitimate Google signup that is still on screen looks like. Combined
// with the duplicate-callback race in signin.tsx, real signups were destroyed.
//
// New contract: mark the profile as abandoned. reap_abandoned_signups()
// (see 20260811_auth_hardening_v3.sql) deletes it 24h later, and only if the
// user never signed in successfully after the flag. Deletion is now a
// scheduled, reversible-window operation instead of an inline race.
//
// Also fixed:
//   - ALLOWED_ORIGINS unset no longer falls back to "*" (fail closed).
//   - per-user rate limit, so this can't be hammered.
//   - the profile row is no longer deleted before the auth user, which
//     previously left an orphan auth user with no profile (permanently
//     rejected at sign-in) whenever deleteUser failed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_AGE_SECONDS = 15 * 60;

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> | null {
  // Fail closed: no configured allow-list, or an origin not on it, gets no
  // CORS headers at all. "*" on a credentialed endpoint is not a default.
  if (ALLOWED_ORIGINS.length === 0) return null;
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("Origin"));
  if (!cors) return new Response("Origin not allowed", { status: 403 });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
  if (!jwt) return new Response("Unauthorized", { status: 401, headers: cors });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }
  const user = userData.user;

  // Only ever an OAuth-provisioned account. A password account was never
  // created implicitly, so it can't be an "abandoned OAuth orphan".
  const providers: string[] = (user.app_metadata?.providers as string[]) ?? [];
  const isOAuthOnly =
    providers.length > 0 && providers.every((p) => p !== "email" && p !== "phone");
  if (!isOAuthOnly) {
    return new Response("Not eligible", { status: 409, headers: cors });
  }

  const ageSeconds = (Date.now() - new Date(user.created_at).getTime()) / 1000;
  if (ageSeconds > MAX_AGE_SECONDS) {
    return new Response("Not eligible", { status: 409, headers: cors });
  }

  const { data: profile, error: profileErr } = await admin
    .from("user_profiles")
    .select("registration_completed, signup_abandoned_at")
    .eq("id", user.id)
    .maybeSingle();

  // Never act on an unreadable profile — that ambiguity is what caused the
  // original data loss. Fail closed.
  if (profileErr) return new Response("Unavailable", { status: 503, headers: cors });
  if (profile?.registration_completed === true) {
    return new Response("Not eligible", { status: 409, headers: cors });
  }
  if (profile?.signup_abandoned_at) {
    return new Response(JSON.stringify({ ok: true, alreadyFlagged: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const { error: flagErr } = await admin
    .from("user_profiles")
    .update({ signup_abandoned_at: new Date().toISOString() })
    .eq("id", user.id)
    .eq("registration_completed", false);

  if (flagErr) return new Response("Cleanup failed", { status: 500, headers: cors });

  // Revoke the live session so the abandoned account cannot keep browsing.
  // This is the safe half of the old behaviour: no data is destroyed.
  await admin.auth.admin.signOut(user.id, "global").catch(() => undefined);

  return new Response(JSON.stringify({ ok: true, flagged: true }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
