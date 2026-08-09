// supabase/functions/cleanup-abandoned-oauth-user/index.ts
// signInWithOAuth always provisions an auth user, even when the visitor only
// meant to sign in. When the sign-in callback rejects an account that never
// completed registration, this deletes the freshly created user so the sign-in
// page can no longer leave orphan/squatted accounts behind.
//
// FIX: the previous version had no CORS headers and no OPTIONS handler, so
// supabase.functions.invoke() failed at preflight from the browser and the
// call site swallowed the error — orphans were never actually deleted.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_AGE_SECONDS = 15 * 60; // only ever delete a brand-new account

// Set ALLOWED_ORIGINS (comma separated) in the function's env, e.g.
// "https://pexly.com,https://www.pexly.com,http://localhost:5173".
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allow =
    origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))
      ? origin
      : (ALLOWED_ORIGINS[0] ?? "*");
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
  if (!jwt) return new Response("Unauthorized", { status: 401, headers: cors });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // The caller may only ever delete themselves, and only while unfinished.
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }
  const user = userData.user;

  const ageSeconds = (Date.now() - new Date(user.created_at).getTime()) / 1000;
  if (ageSeconds > MAX_AGE_SECONDS) {
    return new Response("Not eligible", { status: 409, headers: cors });
  }

  // Never delete an account that has ever signed in successfully before this
  // session, and never one whose registration is finished.
  const { data: profile } = await admin
    .from("user_profiles")
    .select("registration_completed")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.registration_completed === true) {
    return new Response("Not eligible", { status: 409, headers: cors });
  }

  await admin.from("user_profiles").delete().eq("id", user.id);
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    return new Response("Cleanup failed", { status: 500, headers: cors });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
