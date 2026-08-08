import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const KORAPAY_BASE_URL = "https://api.korapay.com/merchant/api/v1";
const FLEEXA_BASE = "https://fleexa.com.ng/developer";

const ALLOWED_ORIGINS = [
  "https://pexly.app",
  "https://www.pexly.app",
  ...(Deno.env.get("EXTRA_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];

/** Reuse a pending order created within this window instead of a new charge. */
const PENDING_REUSE_MS = 15 * 60 * 1000;
/** Minimum gap between two NEW charges for one user. */
const MIN_CHARGE_GAP_MS = 3000;

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(req: Request, data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json", ...extra },
  });
}

const seg = (server: string) => (server === "1" ? "sms" : `sms${server}`);

function pickNumber(...vals: unknown[]): number | null {
  for (const v of vals) {
    const n =
      typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number.NaN;
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

// Price memo (per isolate). Prices move slowly; this kills most Fleexa traffic.
const priceCache = new Map<string, { value: { cost: number; name?: string }; at: number }>();
const PRICE_TTL_MS = 60_000;

/** Server-side price lookup. Never trust a price sent by the browser. */
async function fleexaPrice(
  apiKey: string,
  server: string,
  appId: string,
  countryId?: string,
): Promise<{ cost: number; name?: string }> {
  const cacheKey = `${server}|${appId}|${countryId ?? ""}`;
  const hitCache = priceCache.get(cacheKey);
  if (hitCache && Date.now() - hitCache.at < PRICE_TTL_MS) return hitCache.value;

  const s = seg(server);
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  const remember = (value: { cost: number; name?: string }) => {
    priceCache.set(cacheKey, { value, at: Date.now() });
    return value;
  };

  // Server 1 exposes a dedicated price/stock map.
  if (s === "sms") {
    const q = countryId ? `?countryId=${encodeURIComponent(countryId)}` : "";
    const r = await fetch(`${FLEEXA_BASE}/sms/prices${q}`, { headers });
    if (r.ok) {
      const body = await r.json().catch(() => null);
      const list: any[] = body?.data ?? body?.prices ?? body ?? [];
      const hit = (Array.isArray(list) ? list : Object.values(list)).find(
        (x: any) => String(x?.appId ?? x?.app_id ?? x?.id) === String(appId),
      );
      const cost = hit && pickNumber(hit.price_ngn, hit.priceNgn, hit.price, hit.cost, hit.amount);
      if (cost) return remember({ cost, name: hit.name ?? hit.appName });
    }
  }

  // All servers: the apps catalogue carries the price. Server 4 takes no countryId.
  const q = new URLSearchParams({ page: "1", limit: "500" });
  if (countryId && s !== "sms4") q.set("countryId", countryId);
  const r = await fetch(`${FLEEXA_BASE}/${s}/apps?${q}`, { headers });
  if (!r.ok) throw new Error(`Fleexa apps lookup failed (${r.status})`);
  const body = await r.json().catch(() => null);
  const list: any[] = body?.data?.apps ?? body?.data ?? body?.apps ?? [];
  const hit = (Array.isArray(list) ? list : []).find(
    (x: any) => String(x?.appId ?? x?.app_id ?? x?.id) === String(appId),
  );
  if (!hit) throw new Error("Service not available on this server");
  const cost = pickNumber(hit.price_ngn, hit.priceNgn, hit.price, hit.cost, hit.amount);
  if (!cost) throw new Error("Service price unavailable");
  return remember({ cost, name: hit.name ?? hit.appName });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const korapaySecret = Deno.env.get("KORAPAY_SECRET_KEY");
    const fleexaKey = Deno.env.get("FLEEXA_API_KEY");
    const appBase = Deno.env.get("APP_BASE_URL") ?? "https://pexly.app";
    const markupPct = Number(Deno.env.get("FLEEXA_MARKUP_PERCENT") ?? "25");
    const markupMin = Number(Deno.env.get("FLEEXA_MARKUP_MIN_NGN") ?? "50");

    if (!korapaySecret) return json(req, { error: "Payment provider not configured" }, 503);
    if (!fleexaKey) return json(req, { error: "FLEEXA_API_KEY not configured" }, 503);

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // --- auth -------------------------------------------------------------
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return json(req, { error: "Missing authorization header" }, 401);

    const { data, error: authError } = await supabase.auth.getUser(token);
    const user = data?.user;
    if (authError || !user) return json(req, { error: "Unauthorized" }, 401);

    // --- input ------------------------------------------------------------
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json(req, { error: "Invalid request body" }, 400);
    }

    const intent: "buy" | "reuse" = body.intent === "reuse" ? "reuse" : "buy";
    const idempotencyKey = body.idempotencyKey ? String(body.idempotencyKey).slice(0, 100) : null;

    let server = String(body.server ?? "");
    let appId = String(body.appId ?? "");
    let countryId = body.countryId != null ? String(body.countryId) : undefined;
    let reuseOf: string | null = null;

    if (intent === "reuse") {
      if (!body.reuseOf) return json(req, { error: "reuseOf is required for reuse" }, 400);
      const { data: prev } = await supabase
        .from("sms_orders")
        .select("id, user_id, server, app_id, app_name, country_id, fleexa_request_id, phone_number")
        .eq("id", body.reuseOf)
        .maybeSingle();

      if (!prev || prev.user_id !== user.id) return json(req, { error: "Order not found" }, 404);
      if (prev.server !== "1") return json(req, { error: "Reuse is only available on server 1" }, 400);
      if (!prev.phone_number) return json(req, { error: "That order has no number to reuse" }, 400);

      reuseOf = prev.id;
      server = prev.server;
      appId = prev.app_id;
      countryId = prev.country_id ?? undefined;
    }

    if (!["1", "2", "3", "4"].includes(server)) return json(req, { error: "Invalid server" }, 400);
    if (!appId) return json(req, { error: "appId is required" }, 400);
    if (server !== "4" && !countryId && intent === "buy") {
      return json(req, { error: "countryId is required for this server" }, 400);
    }

    // --- IDEMPOTENCY: never mint a second charge for the same intent -------
    // (a) explicit client key
    if (idempotencyKey) {
      const { data: byKey } = await supabase
        .from("sms_orders")
        .select("id, reference, amount, checkout_url, status")
        .eq("user_id", user.id)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (byKey?.checkout_url) {
        return json(req, {
          success: true,
          order_id: byKey.id,
          reference: byKey.reference,
          amount: Number(byKey.amount),
          currency: "NGN",
          checkout_url: byKey.checkout_url,
          reused: true,
        });
      }
    }

    // (b) same product, still pending, still fresh -> hand back the same checkout
    const since = new Date(Date.now() - PENDING_REUSE_MS).toISOString();
    let pendingQuery = supabase
      .from("sms_orders")
      .select("id, reference, amount, checkout_url, created_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .eq("intent", intent)
      .eq("server", server)
      .eq("app_id", appId)
      .gte("created_at", since)
      .not("checkout_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    pendingQuery = countryId
      ? pendingQuery.eq("country_id", countryId)
      : pendingQuery.is("country_id", null);

    const { data: pendingRows } = await pendingQuery;
    const pending = pendingRows?.[0];
    if (pending?.checkout_url) {
      console.log(`reusing pending order ${pending.id} for user ${user.id}`);
      return json(req, {
        success: true,
        order_id: pending.id,
        reference: pending.reference,
        amount: Number(pending.amount),
        currency: "NGN",
        checkout_url: pending.checkout_url,
        reused: true,
      });
    }

    // (c) hard floor on new charges per user — stops a retry storm reaching Korapay
    const { data: recent } = await supabase
      .from("sms_orders")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - MIN_CHARGE_GAP_MS).toISOString())
      .limit(1);

    if (recent && recent.length > 0) {
      return json(
        req,
        { error: "You just started a payment. Please wait a moment before trying again." },
        429,
        { "Retry-After": "3" },
      );
    }

    // --- price (server-authoritative) -------------------------------------
    const { cost, name } = await fleexaPrice(fleexaKey, server, appId, countryId);
    const amount = Math.max(Math.ceil(cost * (1 + markupPct / 100)), Math.ceil(cost + markupMin));

    const reference = `pxl_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;

    const { data: order, error: orderErr } = await supabase
      .from("sms_orders")
      .insert({
        user_id: user.id,
        reference,
        amount,
        cost,
        currency: "NGN",
        intent,
        server,
        country_id: countryId ?? null,
        app_id: appId,
        app_name: name ?? null,
        reuse_of: reuseOf,
        status: "pending",
        idempotency_key: idempotencyKey,
      })
      .select("id")
      .single();

    if (orderErr) {
      // Unique violation on idempotency_key means a concurrent request won the race.
      if (orderErr.code === "23505" && idempotencyKey) {
        const { data: winner } = await supabase
          .from("sms_orders")
          .select("id, reference, amount, checkout_url")
          .eq("user_id", user.id)
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();

        if (winner) {
          return json(req, {
            success: true,
            order_id: winner.id,
            reference: winner.reference,
            amount: Number(winner.amount),
            currency: "NGN",
            checkout_url: winner.checkout_url ?? undefined,
            reused: true,
          });
        }
      }
      throw new Error(`Could not create order: ${orderErr.message}`);
    }

    // --- Korapay charge ---------------------------------------------------
    const kRes = await fetch(`${KORAPAY_BASE_URL}/charges/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${korapaySecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference,
        amount,
        currency: "NGN",
        customer: {
          email: body?.customer?.email ?? user.email ?? "customer@pexly.app",
          name: body?.customer?.name ?? user.user_metadata?.full_name ?? "Pexly user",
        },
        redirect_url: `${appBase}/my-numbers?ref=${reference}`,
        narration: `${name ?? "Virtual number"} (S${server})`,
        channels: ["bank_transfer", "card"],
        metadata: { order_id: order.id, user_id: user.id, intent, server, app_id: appId },
      }),
    });

    const kData = await kRes.json().catch(() => ({}));

    if (!kRes.ok) {
      await supabase
        .from("sms_orders")
        .update({
          status: "failed",
          fulfil_error: `checkout_init_failed (${kRes.status})`,
        })
        .eq("id", order.id);

      console.error(`Korapay ${kRes.status}:`, JSON.stringify(kData));

      if (kRes.status === 429) {
        return json(
          req,
          { error: "Payments are busy right now. Please try again in a few seconds." },
          429,
          { "Retry-After": kRes.headers.get("Retry-After") ?? "10" },
        );
      }
      return json(req, { error: "Failed to initiate payment" }, 502);
    }

    const checkoutUrl: string | undefined = kData?.data?.checkout_url;
    await supabase.from("sms_orders").update({ checkout_url: checkoutUrl ?? null }).eq("id", order.id);

    return json(req, {
      success: true,
      order_id: order.id,
      reference,
      amount,
      currency: "NGN",
      checkout_url: checkoutUrl,
    });
  } catch (err) {
    console.error("korapay-initiate error:", err);
    return json(req, { error: err instanceof Error ? err.message : "Internal server error" }, 500);
  }
});
