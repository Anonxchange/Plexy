// fleexa-webhook — Supabase Edge Function (Korapay -> auto-fulfil)
//
// Fixes vs the old version:
//   * Signature is HMAC-SHA256 over JSON.stringify(payload.data) (Korapay spec),
//     not over the raw body — the old check rejected every real webhook.
//   * No wallet / no balance crediting. Payment success triggers the actual
//     Fleexa purchase for that one order (direct buy).
//   * Idempotent: the pending -> paid transition is a conditional UPDATE, so a
//     retried webhook can never buy a second number.
//   * Never calls api.fleexa.io (does not exist). Uses fleexa.com.ng/developer.
//
// Env: KORAPAY_WEBHOOK_SECRET (required), FLEEXA_API_KEY,
//      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FLEEXA_BASE = "https://fleexa.com.ng/developer";
const seg = (server: string) => (server === "1" ? "sms" : `sms${server}`);

function hex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Korapay signs JSON.stringify(payload.data) with the secret key. */
async function verify(dataObj: unknown, signature: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = hex(await crypto.subtle.sign("HMAC", key, enc.encode(JSON.stringify(dataObj))));
  const given = signature.trim().toLowerCase();
  if (sig.length !== given.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

type Order = {
  id: string; user_id: string; intent: string; server: string;
  country_id: string | null; app_id: string; reuse_of: string | null;
};

async function fleexaFulfil(apiKey: string, order: Order, reuseRequestId?: string | null) {
  const s = seg(order.server);
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  let url: string;
  let body: Record<string, unknown>;

  if (order.intent === "reuse") {
    // Reuse is server 1 only and is keyed off the previous request.
    url = `${FLEEXA_BASE}/sms/reuse`;
    body = { requestId: reuseRequestId, appId: order.app_id };
  } else {
    url = `${FLEEXA_BASE}/${s}/buy`;
    // Server 4 does not accept countryId.
    body = s === "sms4" ? { appId: order.app_id } : { appId: order.app_id, countryId: order.country_id };
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch { /* keep raw */ }
  if (!res.ok) throw new Error(`fleexa ${res.status}: ${text.slice(0, 500)}`);

  const d = parsed?.data ?? parsed ?? {};
  const requestId = d.requestId ?? d.request_id ?? d.id ?? null;
  const phone = d.number ?? d.phone ?? d.phoneNumber ?? d.phone_number ?? null;
  if (!requestId && !phone) throw new Error(`fleexa returned no number: ${text.slice(0, 500)}`);
  return {
    requestId: requestId ? String(requestId) : null,
    phone: phone ? String(phone) : null,
    expiresAt: d.expiresAt ?? d.expires_at ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const secret = Deno.env.get("KORAPAY_WEBHOOK_SECRET");
    const fleexaKey = Deno.env.get("FLEEXA_API_KEY");
    if (!secret) {
      // Fail closed: an unverified webhook must never trigger a purchase.
      console.error("KORAPAY_WEBHOOK_SECRET not set — rejecting webhook");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), { status: 503 });
    }

    const raw = await req.text();
    let event: any;
    try { event = JSON.parse(raw); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

    const signature = req.headers.get("x-korapay-signature") ?? req.headers.get("korapay-signature") ?? "";
    if (!signature || !(await verify(event?.data, signature, secret))) {
      console.error("Invalid Korapay signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }

    const type: string = event?.event ?? "";
    const payment = event?.data ?? {};
    const reference: string = payment?.reference ?? "";
    console.log(`korapay webhook: ${type} ref=${reference}`);
    if (!reference) return new Response(JSON.stringify({ received: true }), { status: 200 });

    if (type === "charge.failed" || type === "charge.expired") {
      await supabase.from("sms_orders")
        .update({ status: "failed", fulfil_error: "payment_failed" })
        .eq("reference", reference).eq("status", "pending");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    if (type !== "charge.success") {
      return new Response(JSON.stringify({ received: true, ignored: type }), { status: 200 });
    }

    // --- idempotent claim: only the first webhook flips pending -> paid ----
    const { data: claimed, error: claimErr } = await supabase
      .from("sms_orders")
      .update({ status: "paid", paid_at: payment?.paid_at ?? new Date().toISOString() })
      .eq("reference", reference)
      .eq("status", "pending")
      .select("id, user_id, intent, server, country_id, app_id, reuse_of, amount")
      .maybeSingle();

    if (claimErr) throw new Error(claimErr.message);
    if (!claimed) {
      console.log(`ref=${reference} already processed or unknown — no-op`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
    }

    // Sanity check: the amount paid must cover the order.
    if (Number(payment?.amount ?? 0) + 0.01 < Number(claimed.amount)) {
      await supabase.from("sms_orders")
        .update({ status: "failed", fulfil_error: "underpaid" }).eq("id", claimed.id);
      console.error(`ref=${reference} underpaid`);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    if (!fleexaKey) {
      await supabase.from("sms_orders")
        .update({ status: "refund_required", fulfil_error: "FLEEXA_API_KEY missing" }).eq("id", claimed.id);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // --- buy the number now that money is in --------------------------------
    let reuseRequestId: string | null = null;
    if (claimed.intent === "reuse" && claimed.reuse_of) {
      const { data: prev } = await supabase.from("sms_orders")
        .select("fleexa_request_id").eq("id", claimed.reuse_of).maybeSingle();
      reuseRequestId = prev?.fleexa_request_id ?? null;
    }

    try {
      const r = await fleexaFulfil(fleexaKey, claimed as Order, reuseRequestId);
      await supabase.from("sms_orders").update({
        status: "fulfilled",
        fleexa_request_id: r.requestId,
        phone_number: r.phone,
        expires_at: r.expiresAt,
        fulfilled_at: new Date().toISOString(),
        fulfil_error: null,
      }).eq("id", claimed.id);
      console.log(`order ${claimed.id} fulfilled: ${r.phone ?? r.requestId}`);
    } catch (err) {
      // Money taken but no number: flag for refund, never silently succeed.
      const msg = err instanceof Error ? err.message : String(err);
      await supabase.from("sms_orders")
        .update({ status: "refund_required", fulfil_error: msg.slice(0, 500) })
        .eq("id", claimed.id);
      console.error(`order ${claimed.id} fulfilment failed: ${msg}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("fleexa-webhook error:", error);
    // 500 lets Korapay retry; the pending-status guard keeps retries safe.
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
