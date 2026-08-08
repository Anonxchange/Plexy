// fleexa — Supabase Edge Function (authenticated catalogue + my-numbers)
//
// Fixes vs the old version:
//   * Requires a Supabase JWT on every action. The old function was open, so
//     anyone could curl ?action=buy and drain the reseller wallet.
//   * buy / reuse are NO LONGER callable from the browser — they only happen
//     inside fleexa-webhook after payment. This function returns 403 with a
//     pointer, so an old frontend build fails loudly instead of losing money.
//   * Adds action=my-numbers (the user's own orders) and action=code
//     (poll for the SMS, scoped to an order the caller owns, persisted to DB).
//   * Server 4 gets no countryId on /apps.
//
// Env: FLEEXA_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FLEEXA_BASE = "https://fleexa.com.ng/developer";
const ALLOWED_ORIGINS = new Set(["https://pexly.app", "https://www.pexly.app"]);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://pexly.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}
function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
const seg = (server: string) => (server === "1" ? "sms" : `sms${server}`);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  const apiKey = Deno.env.get("FLEEXA_API_KEY");
  if (!apiKey) return json(req, { error: "FLEEXA_API_KEY not configured" }, 500);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // --- auth (every action) -------------------------------------------------
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!token) return json(req, { error: "Missing authorization header" }, 401);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json(req, { error: "Unauthorized" }, 401);

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const server = url.searchParams.get("server") ?? "2";
  if (!["1", "2", "3", "4"].includes(server)) return json(req, { error: "Invalid server" }, 400);
  const s = seg(server);
  const fleexaHeaders = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  try {
    // Purchases are payment-gated. Never proxy them from the client.
    if (action === "buy" || action === "reuse") {
      return json(req, {
        error: "Purchases must be paid for first. Call korapay-initiate " +
          `with { server, appId, countryId${action === "reuse" ? ", intent: 'reuse', reuseOf" : ""} } ` +
          "and open the returned checkout_url.",
      }, 403);
    }

    // ---------------- my numbers (own orders) -----------------------------
    if (action === "my-numbers") {
      const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
      const { data, error } = await supabase
        .from("sms_orders")
        .select("id, created_at, status, server, country_id, app_id, app_name, amount, phone_number, sms_code, sms_full_text, fleexa_request_id, expires_at, intent, reuse_of, reference, checkout_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return json(req, { error: error.message }, 500);
      return json(req, {
        data: (data ?? []).map((o) => ({
          ...o,
          // Reuse only exists on server 1 and needs a fulfilled number.
          can_reuse: o.server === "1" && !!o.phone_number,
          awaiting_code: (o.status === "fulfilled") && !o.sms_code,
        })),
      });
    }

    // ---------------- poll for the SMS code (own order) -------------------
    if (action === "code" || action === "check") {
      const orderId = url.searchParams.get("orderId");
      if (!orderId) return json(req, { error: "orderId required" }, 400);

      const { data: order } = await supabase
        .from("sms_orders")
        .select("id, user_id, server, status, fleexa_request_id, sms_code, phone_number")
        .eq("id", orderId).maybeSingle();
      if (!order || order.user_id !== user.id) return json(req, { error: "Order not found" }, 404);
      if (order.sms_code) {
        return json(req, { data: { status: "code_received", number: order.phone_number, code: order.sms_code } });
      }
      if (!order.fleexa_request_id) {
        return json(req, { data: { status: order.status, number: order.phone_number, code: null } });
      }

      const res = await fetch(
        `${FLEEXA_BASE}/${seg(order.server)}/check/${encodeURIComponent(order.fleexa_request_id)}`,
        { headers: fleexaHeaders },
      );
      const text = await res.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { /* raw */ }
      if (!res.ok) return json(req, { error: "Fleexa check failed", details: parsed ?? text }, res.status);

      const d = parsed?.data ?? parsed ?? {};
      const code = d.code ?? d.sms_code ?? d.otp ?? null;
      const full = d.message ?? d.sms ?? d.full_sms ?? d.text ?? null;
      const phone = d.number ?? d.phone ?? order.phone_number ?? null;

      if (code || full || phone) {
        await supabase.from("sms_orders").update({
          ...(code ? { sms_code: String(code), status: "code_received" } : {}),
          ...(full ? { sms_full_text: String(full) } : {}),
          ...(phone ? { phone_number: String(phone) } : {}),
        }).eq("id", order.id);
      }

      return json(req, { data: { status: code ? "code_received" : order.status, number: phone, code: code ?? null, message: full ?? null } });
    }

    // ---------------- cancel (own order) ----------------------------------
    if (action === "cancel") {
      const orderId = new URL(req.url).searchParams.get("orderId");
      if (!orderId) return json(req, { error: "orderId required" }, 400);
      const { data: order } = await supabase
        .from("sms_orders").select("id, user_id, server, fleexa_request_id")
        .eq("id", orderId).maybeSingle();
      if (!order || order.user_id !== user.id) return json(req, { error: "Order not found" }, 404);
      if (!order.fleexa_request_id) return json(req, { error: "Nothing to cancel" }, 400);

      const res = await fetch(`${FLEEXA_BASE}/${seg(order.server)}/cancel`, {
        method: "POST",
        headers: fleexaHeaders,
        body: JSON.stringify({ requestId: order.fleexa_request_id }),
      });
      const text = await res.text();
      if (res.ok) await supabase.from("sms_orders").update({ status: "cancelled" }).eq("id", order.id);
      return new Response(text, {
        status: res.status,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ---------------- read-only catalogue ---------------------------------
    let targetUrl = "";
    switch (action) {
      case "countries":
        if (s === "sms4") return json(req, { error: "Server 4 has no country list" }, 400);
        targetUrl = `${FLEEXA_BASE}/${s}/countries`;
        break;

      case "apps": {
        const countryId = url.searchParams.get("countryId") ?? "";
        const q = new URLSearchParams({
          page: url.searchParams.get("page") ?? "1",
          limit: url.searchParams.get("limit") ?? "30",
        });
        // Server 4's app list is global — sending countryId 400s.
        if (countryId && s !== "sms4") q.set("countryId", countryId);
        const search = url.searchParams.get("search");
        if (search) q.set("search", search);
        targetUrl = `${FLEEXA_BASE}/${s}/apps?${q}`;
        break;
      }

      case "prices": {
        if (s !== "sms") return json(req, { error: "prices is only available on server 1" }, 400);
        const countryId = url.searchParams.get("countryId") ?? "";
        targetUrl = `${FLEEXA_BASE}/sms/prices${countryId ? `?countryId=${encodeURIComponent(countryId)}` : ""}`;
        break;
      }

      default:
        return json(req, { error: "Unknown action" }, 400);
    }

    const res = await fetch(targetUrl, { headers: fleexaHeaders });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fleexa proxy error:", err);
    return json(req, { error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
