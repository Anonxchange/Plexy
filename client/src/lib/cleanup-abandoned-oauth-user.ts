// supabase/functions/cleanup-abandoned-oauth-user/index.ts
// signInWithOAuth always provisions an auth user, even when the visitor only
// meant to sign in. When the sign-in callback rejects an account that never
// completed registration, this deletes the freshly created user so the sign-in
// page can no longer leave orphan/squatted accounts behind.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_AGE_SECONDS = 15 * 60; // only ever delete a brand-new account

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return new Response("Unauthorized", { status: 401 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // The caller may only ever delete themselves, and only while unfinished.
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });
  const user = userData.user;

  const ageSeconds = (Date.now() - new Date(user.created_at).getTime()) / 1000;
  if (ageSeconds > MAX_AGE_SECONDS) return new Response("Not eligible", { status: 409 });

  const { data: profile } = await admin
    .from("user_profiles")
    .select("registration_completed")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.registration_completed === true) {
    return new Response("Not eligible", { status: 409 });
  }

  await admin.from("user_profiles").delete().eq("id", user.id);
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) return new Response("Cleanup failed", { status: 500 });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
