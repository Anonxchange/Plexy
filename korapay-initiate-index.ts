import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const FLEEXA_BASE = "https://fleexa.com/api/v1";

function pickNumber(...values: (string | number | undefined | null)[]) {
  for (const v of values) {
    if (v == null) continue;
    const n = typeof v === "number" ? v : parseFloat(v);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return null;
}

async function fleexaPrice(
  appId: string,
  apiKey: string,
): Promise<number | null> {
  const res = await fetch(`${FLEEXA_BASE}/apps`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Fleexa apps error: ${res.status}`);
  const json = await res.json();
  const apps = Array.isArray(json) ? json : json.data;
  const hit = apps.find((a: Record<string, unknown>) =>
    String(a.app_id ?? a.id ?? a.slug ?? "").toLowerCase().trim() ===
      appId.toLowerCase().trim()
  );
  if (!hit) throw new Error("Service not available");
  const cost = pickNumber(
    hit.price_ngn,
    hit.priceNgn,
    hit.price,
    hit.cost,
    hit.amount,
  );
  if (!cost) throw new Error("Service price unavailable");
  return cost;
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    try {
      const body = await req.json();
      const {
        service_id,
        app_id,
        email,
        phone,
        amount: userAmount,
        metadata,
      } = body;

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const korapaySecret = Deno.env.get("KORAPAY_SECRET_KEY")!;
      const fleexaKey = Deno.env.get("FLEEXA_API_KEY")!;

      const supabase = createClient(supabaseUrl, supabaseKey);

      if (!app_id || !email || !phone) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const cost = await fleexaPrice(app_id, fleexaKey);
      const finalAmount = userAmount ?? Math.max(cost! * 1.25, cost! + 50);

      const korapayRes = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${korapaySecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: finalAmount,
          currency: "NGN",
          customer: { email, name: metadata?.name ?? email },
          reference: `fleexa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          metadata: {
            service_id,
            app_id,
            phone,
            ...metadata,
          },
        }),
      });

      const korapayData = await korapayRes.json();
      if (!korapayRes.ok || !korapayData.data?.payment_url) {
        return new Response(
          JSON.stringify({ error: korapayData.message || "Korapay initialization failed" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      await supabase.from("transactions").insert({
        service_id,
        app_id,
        email,
        phone,
        amount: finalAmount,
        status: "pending",
        reference: korapayData.data.reference,
        metadata,
      });

      return new Response(
        JSON.stringify({
          payment_url: korapayData.data.payment_url,
          reference: korapayData.data.reference,
          amount: finalAmount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (err) {
      console.error("korapay-initiate error:", err);
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  },
};
