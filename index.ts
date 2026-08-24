import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { isLikelyPII } from "../_shared/pii-filter.ts";

// ── Config ──────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  "https://pexly.app",
  "https://www.pexly.app",
]);

const MAX_BODY_BYTES = 64 * 1024;      // 64 KB request body
const MAX_TEXTS = 100;                 // max strings per request
const MAX_TEXT_LENGTH = 500;           // max chars per string
const AI_TIMEOUT_MS = 20_000;
const FALLBACK_TIMEOUT_MS = 8_000;

// Per-IP token bucket (in-memory, per isolate).
const RATE_LIMIT_MAX = 30;             // requests
const RATE_LIMIT_WINDOW_MS = 60_000;   // per minute
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
    }
    return true;
  }
  if (b.count >= RATE_LIMIT_MAX) return false;
  b.count++;
  return true;
}

function clientKey(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

// Reused across invocations of the same isolate instead of per request.
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return _supabase;
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish (Español)",
  fr: "French (Français)",
  pt: "Portuguese (Português)",
  ar: "Arabic (العربية)",
  zh: "Simplified Chinese (中文)",
  ru: "Russian (Русский)",
  de: "German (Deutsch)",
  tr: "Turkish (Türkçe)",
  id: "Indonesian (Bahasa Indonesia)",
  vi: "Vietnamese (Tiếng Việt)",
  hi: "Hindi (हिन्दी)",
  yo: "Yoruba (Yorùbá)",
  ha: "Hausa",
  ja: "Japanese (日本語)",
};

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Fallback: free Google Translate public endpoint (no key required).
// Used when Lovable AI is rate-limited (429) or out of credits (402).
async function fallbackTranslateOne(text: string, targetLang: string): Promise<string> {
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx` +
      `&sl=en&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(FALLBACK_TIMEOUT_MS),
    });
    if (!resp.ok) return text;
    const data = await resp.json();
    const segments = Array.isArray(data?.[0]) ? data[0] : [];
    return segments.map((s: unknown) => (s as string[])?.[0] ?? "").join("") || text;
  } catch (e) {
    console.error("fallback translate failed:", e);
    return text;
  }
}

async function fallbackTranslateBatch(texts: string[], targetLang: string): Promise<string[]> {
  const out: string[] = new Array(texts.length);
  const concurrency = 5;
  let idx = 0;
  async function worker() {
    while (idx < texts.length) {
      const i = idx++;
      out[i] = await fallbackTranslateOne(texts[i], targetLang);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, texts.length) }, worker));
  return out;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  // Reject browser calls from origins outside the allowlist.
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Vary": "Origin" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json", Allow: "POST, OPTIONS" },
    });
  }

  // Public endpoint: no auth required. Visitors call this straight from the
  // site, so abuse protection is CORS allowlist + per-IP rate limit + payload caps.

  if (!rateLimit(clientKey(req))) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...cors, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  try {
    const declaredLength = Number(req.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_BODY_BYTES) {
      return json(req, { error: "Payload too large" }, 413);
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return json(req, { error: "Payload too large" }, 413);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return json(req, { error: "Invalid JSON body" }, 400);
    }

    const { texts, targetLang } = (parsed ?? {}) as {
      texts?: unknown;
      targetLang?: unknown;
    };

    if (!Array.isArray(texts) || typeof targetLang !== "string") {
      return json(
        req,
        { error: "Invalid payload: { texts: string[], targetLang: string }" },
        400,
      );
    }

    if (texts.length > MAX_TEXTS) {
      return json(req, { error: `Too many strings (max ${MAX_TEXTS})` }, 400);
    }

    if (!/^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(targetLang)) {
      return json(req, { error: "Invalid targetLang" }, 400);
    }

    // ── Server-side PII guard ─────────────────────────────────────────────────
    // Drop anything that looks like PII before it reaches the AI or the cache.
    const safeTexts: string[] = [];
    const droppedReasons: string[] = [];

    for (const t of texts) {
      if (typeof t !== "string" || !t.trim()) continue;
      if (t.length > MAX_TEXT_LENGTH) {
        droppedReasons.push("too-long");
        continue;
      }
      const piiReason = isLikelyPII(t.trim());
      if (piiReason) {
        // Log the reason code only — never the value itself.
        droppedReasons.push(piiReason);
      } else {
        safeTexts.push(t);
      }
    }

    if (droppedReasons.length > 0) {
      console.warn(
        `[pii-filter] Dropped ${droppedReasons.length} string(s) server-side. Reasons:`,
        droppedReasons,
      );
    }

    const cleanTexts = safeTexts.slice(0, MAX_TEXTS);

    if (cleanTexts.length === 0) {
      return json(req, { translations: {} });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = getSupabase();

    // Hash all sources
    const hashes = await Promise.all(cleanTexts.map(sha256));

    // If target is English, return source as-is (English is the canonical source)
    if (targetLang === "en") {
      const out: Record<string, string> = {};
      cleanTexts.forEach((t) => (out[t] = t));
      return json(req, { translations: out });
    }

    // Look up cached translations
    const { data: cached, error: cacheErr } = await supabase
      .from("translations")
      .select("source_hash, source_text, translated_text")
      .in("source_hash", hashes)
      .eq("target_lang", targetLang);

    if (cacheErr) console.error("cache lookup error:", cacheErr);

    const result: Record<string, string> = {};
    const cachedHashes = new Set<string>();
    (cached ?? []).forEach((row: { source_hash: string; source_text: string; translated_text: string }) => {
      result[row.source_text] = row.translated_text;
      cachedHashes.add(row.source_hash);
    });

    // Determine which strings still need translation
    const missing: { hash: string; text: string }[] = [];
    hashes.forEach((h, i) => {
      if (!cachedHashes.has(h)) missing.push({ hash: h, text: cleanTexts[i] });
    });

    if (missing.length > 0) {
      if (!LOVABLE_API_KEY) console.warn("LOVABLE_API_KEY not configured — using fallback");

      const langName = LANG_NAMES[targetLang] ?? targetLang;
      const numbered = missing
        .map((m, i) => `${i + 1}. ${m.text.replace(/\n/g, " ")}`)
        .join("\n");

      let aiResp: Response | null = null;
      try {
        if (LOVABLE_API_KEY) aiResp = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content:
                  `You are a professional translator. Translate UI strings from English to ${langName}. ` +
                  `Preserve meaning, tone, and any placeholders like {name} or %s. Be concise and natural.`,
              },
              {
                role: "user",
                content: `Translate each numbered string to ${langName}.`,
              },
              { role: "user", content: numbered },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "return_translations",
                  description: "Return the list of translations in order.",
                  parameters: {
                    type: "object",
                    properties: {
                      translations: {
                        type: "array",
                        items: { type: "string" },
                        description:
                          "Translated strings in the same order as input, same array length.",
                      },
                    },
                    required: ["translations"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: {
              type: "function",
              function: { name: "return_translations" },
            },
          }),
          signal: AbortSignal.timeout(AI_TIMEOUT_MS),
        },
        );
      } catch (err) {
        console.warn("AI gateway request failed/timed out:", err);
      }

      let translated: string[] = [];

      if (!aiResp || !aiResp.ok) {
        if (aiResp) {
          const errText = await aiResp.text();
          console.warn(`AI gateway ${aiResp.status}: ${errText}. Falling back to Google Translate.`);
        }
        translated = await fallbackTranslateBatch(missing.map((m) => m.text), targetLang);
      } else {
        const aiData = await aiResp.json();
        const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
        const args = toolCall?.function?.arguments
          ? JSON.parse(toolCall.function.arguments)
          : { translations: [] };
        translated = args.translations ?? [];
        if (!translated.length || translated.every((t: string) => !t)) {
          translated = await fallbackTranslateBatch(missing.map((m) => m.text), targetLang);
        }
      }

      // ── Final PII check on translated output ────────────────────────────────
      // Paranoia pass: if the AI hallucinated sensitive-looking data, fall
      // back to the source string instead of caching the suspicious output.
      const inserts = missing.map((m, i) => {
        const raw = translated[i] ?? m.text;
        const translatedPII = isLikelyPII(raw);
        if (translatedPII) {
          console.warn(`[pii-filter] AI output flagged as ${translatedPII} — using source text`);
          return {
            source_hash: m.hash,
            target_lang: targetLang,
            source_text: m.text,
            translated_text: m.text,
          };
        }
        return {
          source_hash: m.hash,
          target_lang: targetLang,
          source_text: m.text,
          translated_text: raw,
        };
      });

      if (inserts.length > 0) {
        const { error: insErr } = await supabase
          .from("translations")
          .upsert(inserts, { onConflict: "source_hash,target_lang" });
        if (insErr) console.error("insert error:", insErr);
      }

      inserts.forEach((row) => {
        result[row.source_text] = row.translated_text;
      });
    }

    return json(req, { translations: result });
  } catch (e) {
    // Never leak internal error details to the client.
    console.error("translate error:", e);
    return json(req, { error: "Translation service error" }, 500);
  }
});
