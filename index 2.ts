import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

/* ═══ Config ═══════════════════════════════════════════════════════════════ */

const env = (key: string): string | undefined => Deno.env.get(key) || undefined;

const RELOADLY_ENV = (env("RELOADLY_ENV") ?? "live").toLowerCase();
const GIFTCARD_LIVE_BASE = "https://giftcards.reloadly.com";
const GIFTCARD_SANDBOX_BASE = "https://giftcards-sandbox.reloadly.com";
const GIFTCARD_BASE =
  RELOADLY_ENV === "sandbox" ? GIFTCARD_SANDBOX_BASE : GIFTCARD_LIVE_BASE;
const GIFTCARD_ACCEPT = "application/com.reloadly.giftcards-v1+json";

const BRAND_NAME = env("BRAND_NAME") ?? "pexly";
const SUPPORT_EMAIL = env("SUPPORT_EMAIL") ?? "support@pexly.app";
const EMAIL_FROM = env("EMAIL_FROM") ?? `${BRAND_NAME} <orders@pexly.app>`;

const ALLOWED_ORIGINS = (env("ALLOWED_ORIGINS") ?? "https://www.pexly.app,https://pexly.app")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(reqOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (reqOrigin && ALLOWED_ORIGINS.includes(reqOrigin)) {
    headers["Access-Control-Allow-Origin"] = reqOrigin;
  } else if (ALLOWED_ORIGINS.length > 0) {
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0];
  }
  return headers;
}

/* ═══ Signature verification ═══════════════════════════════════════════════ */

const MAX_WEBHOOK_AGE_SECONDS = 300;

function verifyReloadlySignature(
  rawBody: string,
  signature: string | null,
  timestampHeader: string | null,
): { ok: boolean; reason?: string } {
  const secret = env("RELOADLY_WEBHOOK_SECRET");
  if (!secret) {
    console.error("FATAL: RELOADLY_WEBHOOK_SECRET is not set.");
    return { ok: false, reason: "secret_not_configured" };
  }
  if (!signature) return { ok: false, reason: "missing_signature_header" };
  if (!timestampHeader) return { ok: false, reason: "missing_timestamp_header" };

  // Reloadly sends this header in MILLISECONDS. Older code compared it against
  // seconds, producing ages like -1784042835151s and rejecting every delivery.
  // Normalise so both units work.
  const rawTimestamp = Number(timestampHeader.trim());
  if (!Number.isFinite(rawTimestamp) || rawTimestamp <= 0) {
    return { ok: false, reason: "invalid_timestamp" };
  }
  const timestampMs = rawTimestamp > 1e11 ? rawTimestamp : rawTimestamp * 1000;

  const ageSeconds = Math.round((Date.now() - timestampMs) / 1000);
  if (Math.abs(ageSeconds) > MAX_WEBHOOK_AGE_SECONDS) {
    console.warn(
      `Reloadly webhook rejected: request is ${ageSeconds}s old (header="${timestampHeader}")`,
    );
    return { ok: false, reason: "stale_timestamp" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${rawBody}:${timestampHeader}`, "utf8")
    .digest("hex");

  try {
    const expectedBuf = Buffer.from(expected, "hex");
    const receivedBuf = Buffer.from(signature, "hex");
    if (expectedBuf.length !== receivedBuf.length) return { ok: false, reason: "signature_mismatch" };
    return timingSafeEqual(expectedBuf, receivedBuf) ? { ok: true } : { ok: false, reason: "signature_mismatch" };
  } catch {
    return { ok: false, reason: "signature_comparison_error" };
  }
}

/* ═══ Email delivery (Resend) ══════════════════════════════════════════════ */

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  const key = env("RESEND_API_KEY");
  if (!key) {
    console.error("RESEND_API_KEY not set — skipping email to", opts.to);
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    console.error(`Resend email failed (${res.status}):`, await res.text());
    return false;
  }
  console.log(`Email sent to ${opts.to}: "${opts.subject}"`);
  return true;
}

/* ═══ Email templates ══════════════════════════════════════════════════════ */

const LIME = "#B2F02B";
const LIME_SOFT = "#F2FDDD";
const INK = "#0B0B0B";
const PURPLE = "#6D4AFF";
const PURPLE_SOFT = "#F1EEFF";
const MUTED = "#6B7280";
const BODY_TEXT = "#4B5563";
const LINE = "#E8EAE3";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";

type RawCard = {
  cardNumber?: string | number | null;
  card_number?: string | number | null;
  pinCode?: string | number | null;
  pin_code?: string | number | null;
  redemptionUrl?: string | null;
  redemption_url?: string | null;
};

type NormalisedCard = {
  code: string | null;
  pin: string | null;
  url: string | null;
};

const PLACEHOLDER_VALUES = new Set([
  "", "0", "00", "-", "--", "n/a", "n.a.", "na", "nil", "none", "null",
  "undefined", "not applicable", "no pin", "nopin",
]);

function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (text === "") return null;
  if (PLACEHOLDER_VALUES.has(text.toLowerCase())) return null;
  return text;
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function normaliseCard(raw: RawCard): NormalisedCard {
  let code = clean(raw.cardNumber ?? raw.card_number);
  const pin = clean(raw.pinCode ?? raw.pin_code);
  let url = clean(raw.redemptionUrl ?? raw.redemption_url);
  if (code && isUrl(code)) {
    url = url ?? code;
    code = null;
  }
  if (url && !isUrl(url)) url = null;
  return { code, pin, url };
}

function normaliseCards(raw: RawCard[]): NormalisedCard[] {
  return raw.map(normaliseCard).filter((c) => c.code || c.pin || c.url);
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(amount: number, currency: string): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const decimals = Number.isInteger(value) ? 0 : 2;
  return `${esc(currency || "USD")} ${value.toFixed(decimals)}`;
}

function label(text: string): string {
  return `<div style="font:600 11px/1.4 ${FONT};letter-spacing:.08em;text-transform:uppercase;color:${MUTED};margin:0 0 6px;">${esc(text)}</div>`;
}

function codeBox(value: string): string {
  return `<div style="font:600 18px/1.5 ${MONO};letter-spacing:.06em;color:${INK};background:${LIME_SOFT};border:1px solid ${LINE};border-radius:10px;padding:14px 16px;word-break:break-all;">${esc(value)}</div>`;
}

function logoMark(): string {
  return `<span style="display:inline-block;font:700 18px/1 ${FONT};color:${INK};">
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${LIME};margin-right:8px;"></span>${esc(BRAND_NAME)}</span>`;
}

function emailWrapper(content: string, preheader: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F6F7F3;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F7F3;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid ${LINE};border-radius:18px;overflow:hidden;">
<tr><td style="padding:22px 28px;border-bottom:1px solid ${LINE};">
  ${logoMark()}
  <span style="float:right;font:500 12px/1.6 ${FONT};color:${MUTED};">Digital delivery</span>
</td></tr>
<tr><td style="padding:28px;">${content}</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid ${LINE};">
  <p style="margin:0 0 6px;font:400 13px/1.6 ${FONT};color:${BODY_TEXT};">Questions about your order? We're here at
    <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:${PURPLE};text-decoration:none;">${esc(SUPPORT_EMAIL)}</a></p>
  <p style="margin:0;font:400 12px/1.6 ${FONT};color:${MUTED};">${esc(BRAND_NAME)} · Safe, simple, yours</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function eyebrow(text: string): string {
  return `<div style="font:600 11px/1.4 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:${PURPLE};margin:0 0 8px;">${esc(text)}</div>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 10px;font:700 24px/1.3 ${FONT};color:${INK};">${esc(text)}</h1>`;
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 20px;font:400 15px/1.7 ${FONT};color:${BODY_TEXT};">${html}</p>`;
}

function heroCard(productName: string, productImage?: string | null): string {
  if (productImage && isUrl(productImage)) {
    return `<div style="border:1px solid ${LINE};border-radius:14px;padding:18px;text-align:center;margin:0 0 18px;background:#FFF;">
      <img src="${esc(productImage)}" alt="${esc(productName)}" width="260" style="max-width:100%;height:auto;border-radius:10px;display:inline-block;">
    </div>`;
  }
  return `<div style="border:1px solid ${LINE};border-radius:14px;padding:22px;margin:0 0 18px;background:${LIME_SOFT};">
    ${label("Gift card")}
    <div style="font:700 20px/1.4 ${FONT};color:${INK};">${esc(productName)}</div>
  </div>`;
}

function summaryRow(amount: number, currency: string, cardCount: number): string {
  const extra = cardCount > 1 ? ` · ${cardCount} cards` : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
  <tr>
    <td style="vertical-align:middle;">
      ${label("Value")}
      <div style="font:700 20px/1.4 ${FONT};color:${INK};">${formatMoney(amount, currency)}${esc(extra)}</div>
    </td>
    <td align="right" style="vertical-align:middle;">
      <span style="display:inline-block;font:600 12px/1 ${FONT};color:${INK};background:${LIME};border-radius:999px;padding:8px 14px;">Delivered</span>
    </td>
  </tr>
</table>`;
}

function cardBlock(card: NormalisedCard, index: number, total: number): string {
  const rows: string[] = [];

  if (total > 1) {
    rows.push(`<div style="font:600 12px/1.4 ${FONT};color:${PURPLE};margin:0 0 12px;">Card ${index + 1} of ${total}</div>`);
  }
  if (card.code) {
    rows.push(`<div style="margin:0 0 14px;">${label(card.pin ? "Card number" : "Redeem code")}${codeBox(card.code)}</div>`);
  }
  if (card.pin) rows.push(`<div style="margin:0 0 14px;">${label("PIN")}${codeBox(card.pin)}</div>`);
  if (card.url) {
    rows.push(`<div style="margin:0 0 4px;">${label(card.code ? "Redeem online" : "Redemption page")}
        <a href="${esc(card.url)}" style="display:inline-block;font:600 14px/1 ${FONT};color:#FFF;background:${PURPLE};border-radius:10px;padding:12px 18px;text-decoration:none;">Open redemption page</a>
        <div style="margin:8px 0 0;font:400 12px/1.6 ${MONO};color:${MUTED};word-break:break-all;">${esc(card.url)}</div>
      </div>`);
  }

  return `<div style="border:1px solid ${LINE};border-radius:14px;padding:20px;margin:0 0 14px;background:#FFF;">${rows.join("")}</div>`;
}

function redeemNote(productName: string, cards: NormalisedCard[], instructions?: string | null): string {
  const provided = clean(instructions);
  const multi = cards.length > 1;
  const anyPin = cards.some((c) => c.pin);
  const anyCode = cards.some((c) => c.code);
  const linkOnly = !anyCode && cards.some((c) => c.url);

  let body: string;
  if (provided) {
    body = esc(provided).replace(/\n+/g, "<br>");
  } else if (linkOnly) {
    body = `Open the redemption page above and follow the steps shown to claim your ${esc(productName)} card.`;
  } else {
    const what = anyPin ? "the card number and PIN" : "the redeem code";
    body = `Open the official ${esc(productName)} app or website, go to the “Redeem” / “Add gift card” section and enter ${what} exactly as shown above.`;
  }

  const suffix = multi ? ` Each of the ${cards.length} cards above is redeemed separately.` : "";

  return `<div style="border:1px solid ${LINE};border-radius:14px;padding:16px 18px;background:${PURPLE_SOFT};margin:4px 0 0;">
    <p style="margin:0;font:400 13px/1.7 ${FONT};color:${BODY_TEXT};">
      <strong style="color:${INK};">How to redeem:</strong> ${body}${suffix} Treat it like cash — keep it safe.
    </p>
  </div>`;
}

function giftCardEmail(opts: {
  productName: string;
  cards: RawCard[];
  amount: number;
  currency: string;
  productImage?: string | null;
  redeemInstructions?: string | null;
  orderReference?: string | null;
}): string {
  const cards = normaliseCards(opts.cards);
  const productName = clean(opts.productName) ?? "Gift card";

  const content = `
    ${eyebrow("Your purchase")}
    ${heading("Your gift card is ready")}
    ${paragraph(`Your ${esc(productName)} gift card has been delivered.`)}
    ${heroCard(productName, opts.productImage)}
    ${summaryRow(opts.amount, opts.currency, cards.length)}
    ${cards.map((c, i) => cardBlock(c, i, cards.length)).join("")}
    ${redeemNote(productName, cards, opts.redeemInstructions)}
    ${clean(opts.orderReference)
      ? `<p style="margin:16px 0 0;font:400 12px/1.6 ${MONO};color:${MUTED};">Reference: ${esc(opts.orderReference)}</p>`
      : ""}
  `;

  return emailWrapper(content, `Your ${productName} gift card is ready to redeem.`);
}

function topupEmail(opts: { phone: string; operatorName: string; deliveredAmount: number; currency: string }): string {
  const content = `
    ${eyebrow("Your order")}
    ${heading("Top-up delivered")}
    ${paragraph("Your airtime top-up has been delivered successfully.")}
    <div style="border:1px solid ${LINE};border-radius:14px;padding:20px;margin:0 0 18px;background:#FFF;">
      <div style="margin:0 0 14px;">${label("Phone number")}${codeBox(opts.phone)}</div>
      <div style="margin:0 0 14px;">${label("Amount delivered")}
        <div style="font:700 20px/1.4 ${FONT};color:${INK};">${formatMoney(opts.deliveredAmount, opts.currency)}</div>
      </div>
      <div>${label("Operator")}<div style="font:500 15px/1.5 ${FONT};color:${BODY_TEXT};">${esc(opts.operatorName)}</div></div>
    </div>
    ${paragraph("The credit should appear on the recipient's balance within a few minutes.")}
  `;
  return emailWrapper(content, `${formatMoney(opts.deliveredAmount, opts.currency)} sent to ${opts.phone}.`);
}

function utilityEmail(opts: { billerName: string; accountNumber: string; amount: number; currency?: string; transactionId: string }): string {
  const content = `
    ${eyebrow("Your payment")}
    ${heading("Payment confirmed")}
    ${paragraph(`Your utility payment to ${esc(opts.billerName)} has been processed.`)}
    <div style="border:1px solid ${LINE};border-radius:14px;padding:20px;margin:0 0 18px;background:#FFF;">
      <div style="margin:0 0 14px;">${label("Account / meter number")}${codeBox(opts.accountNumber)}</div>
      <div>${label("Amount paid")}
        <div style="font:700 20px/1.4 ${FONT};color:${INK};">${formatMoney(opts.amount, opts.currency ?? "USD")}</div>
      </div>
    </div>
    <p style="margin:0;font:400 12px/1.6 ${MONO};color:${MUTED};">Reference: ${esc(opts.transactionId)}</p>
  `;
  return emailWrapper(content, `Payment to ${opts.billerName} confirmed.`);
}

/* ═══ Reloadly API ═════════════════════════════════════════════════════════ */

function baseForPayload(liveMode: unknown): string {
  if (liveMode === false) return GIFTCARD_SANDBOX_BASE;
  if (liveMode === true) return GIFTCARD_LIVE_BASE;
  return GIFTCARD_BASE;
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getReloadlyToken(audience: string): Promise<string | null> {
  const cached = tokenCache.get(audience);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const isSandbox = audience === GIFTCARD_SANDBOX_BASE;
  const clientId = isSandbox
    ? (env("RELOADLY_SANDBOX_CLIENT_ID") ?? env("RELOADLY_CLIENT_ID"))
    : env("RELOADLY_CLIENT_ID");
  const clientSecret = isSandbox
    ? (env("RELOADLY_SANDBOX_CLIENT_SECRET") ?? env("RELOADLY_CLIENT_SECRET"))
    : env("RELOADLY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    console.error(`Reloadly credentials missing for ${isSandbox ? "sandbox" : "live"} — cannot fetch gift card codes`);
    return null;
  }

  const res = await fetch("https://auth.reloadly.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      audience,
    }),
  });

  if (!res.ok) {
    console.error(`Reloadly auth failed (${res.status}) for audience ${audience}:`, await res.text());
    return null;
  }

  const json = await res.json();
  const token: string | null = json?.access_token ?? null;
  if (token) {
    const ttl = Number(json?.expires_in ?? 3600) * 1000;
    tokenCache.set(audience, { token, expiresAt: Date.now() + ttl });
  }
  return token;
}

async function reloadlyGet(base: string, path: string): Promise<unknown | null> {
  const token = await getReloadlyToken(base);
  if (!token) return null;

  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: GIFTCARD_ACCEPT },
  });

  if (!res.ok) {
    console.warn(`Reloadly GET ${path} failed (${res.status}):`, await res.text());
    return null;
  }
  return await res.json();
}

/** GET /orders/transactions/{id}/cards — codes can lag the webhook. */
async function fetchGiftCards(txId: string, base: string): Promise<RawCard[]> {
  const delays = [1500, 3000, 5000, 8000];

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const data = await reloadlyGet(base, `/orders/transactions/${txId}/cards`);

    const arr: RawCard[] = Array.isArray(data)
      ? (data as RawCard[])
      : Array.isArray((data as { content?: RawCard[] })?.content)
        ? (data as { content: RawCard[] }).content
        : data && ((data as RawCard).cardNumber ?? (data as RawCard).card_number ?? (data as RawCard).redemptionUrl)
          ? [data as RawCard]
          : [];

    if (arr.length > 0) {
      console.log(`Fetched ${arr.length} card(s) for tx=${txId}`);
      return arr;
    }
    console.warn(`No cards yet for tx=${txId} (attempt ${attempt + 1})`);

    const wait = delays[attempt];
    if (wait) await new Promise((r) => setTimeout(r, wait));
  }
  return [];
}

async function fetchProductIdFromTransaction(txId: string, base: string): Promise<number | string | null> {
  const data = (await reloadlyGet(base, `/reports/transactions/${txId}`)) as
    | { product?: { productId?: number | string } }
    | null;
  return data?.product?.productId ?? null;
}

async function fetchProductImage(productId: number | string, base: string): Promise<string | null> {
  const data = (await reloadlyGet(base, `/products/${productId}`)) as
    | { logoUrls?: string[]; logo_urls?: string[] }
    | null;
  const logos = data?.logoUrls ?? data?.logo_urls;
  return Array.isArray(logos) && logos.length > 0 ? logos[0] : null;
}

async function fetchRedeemInstructions(productId: number | string, base: string): Promise<string | null> {
  const data = (await reloadlyGet(base, `/products/${productId}/redeem-instructions`)) as
    | { concise?: string; verbose?: string }
    | null;
  const out = clean(data?.concise) ?? clean(data?.verbose);
  return out;
}

/* ═══ Handler ══════════════════════════════════════════════════════════════ */

Deno.serve(async (req) => {
  const ch = corsHeaders(req.headers.get("origin"));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...ch, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response(null, { headers: ch });

  let supabase: ReturnType<typeof createClient> | null = null;
  let claimedTxId: string | null = null;

  try {
    const rawBody = await req.text();

    const sigCheck = verifyReloadlySignature(
      rawBody,
      req.headers.get("X-Reloadly-Signature"),
      req.headers.get("X-Reloadly-Request-Timestamp"),
    );
    if (!sigCheck.ok) {
      // Reloadly retries any non-2xx response, so a permanently-invalid delivery
      // returned as 4xx becomes an endless retry loop. Only a *transient*
      // problem on our side (missing secret) should ask for a retry.
      if (sigCheck.reason === "secret_not_configured") {
        console.error("Reloadly webhook cannot be verified: secret missing — asking for retry");
        return json({ error: "Verification unavailable", reason: sigCheck.reason }, 503);
      }
      console.error(`Reloadly webhook dropped: ${sigCheck.reason}`);
      return json({ received: true, dropped: sigCheck.reason }, 200);
    }

    const body = JSON.parse(rawBody);
    console.log("Reloadly webhook verified:", rawBody);

    const SUPABASE_URL = env("SUPABASE_URL");
    const SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is required");
    if (!SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
    supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const inner = body.transaction ?? body.data ?? {};
    const p: Record<string, unknown> = { ...inner, ...body };

    const transactionId =
      p.transactionId ??
      p.transaction_id ??
      p.id ??
      (inner as Record<string, unknown>).id ??
      (inner as Record<string, unknown>).transactionId;

    if (!transactionId) {
      console.warn("No transactionId in payload — acknowledging");
      return json({ received: true, note: "no_transaction_id" });
    }

    const txId = String(transactionId);
    const giftcardBase = baseForPayload(body.liveMode ?? (inner as Record<string, unknown>).liveMode);

    const rawStatus = String(
      p.status ?? p.transactionStatus ?? (inner as Record<string, unknown>).status ?? "",
    ).toLowerCase();
    const normalisedStatus =
      rawStatus === "successful" || rawStatus === "success" ? "completed" : rawStatus || "unknown";
    const isCompleted = normalisedStatus === "completed";

    // Idempotency claim
    const { error: claimError } = await supabase
      .from("reloadly_webhook_events")
      .insert({ transaction_id: txId, status: normalisedStatus, payload: body });

    if (claimError) {
      if (claimError.code === "23505" || /duplicate key|already exists/i.test(claimError.message)) {
        console.log(`Duplicate Reloadly webhook for tx=${txId} — skipping`);
        return json({ received: true, duplicate: true, transactionId: txId });
      }
      throw new Error(`Idempotency claim failed: ${claimError.message}`);
    }
    claimedTxId = txId;

    // Gift card
    const payloadCards: RawCard[] = Array.isArray(p.cards)
      ? (p.cards as RawCard[])
      : p.cardNumber || p.pinCode
        ? [{ cardNumber: p.cardNumber as string, pinCode: p.pinCode as string }]
        : [];

    let cardsArray = payloadCards;
    let normalised = normaliseCards(cardsArray);

    const giftCardUpdate: Record<string, unknown> = { status: normalisedStatus };
    if (normalised[0]?.code) giftCardUpdate.redeem_code = normalised[0].code;
    if (normalised[0]?.pin) giftCardUpdate.pin_code = normalised[0].pin;
    if (cardsArray.length > 1) giftCardUpdate.cards_json = JSON.stringify(cardsArray);

    const { data: giftUpdate } = await supabase
      .from("gift_card_orders")
      .update(giftCardUpdate)
      .eq("reloadly_transaction_id", txId)
      .select("id, recipient_email, product_name, unit_price, currency_code, email_sent")
      .maybeSingle();

    if (giftUpdate) {
      console.log(`gift_card_orders id=${giftUpdate.id} → ${normalisedStatus}`);
      await supabase
        .from("reloadly_webhook_events")
        .update({ order_type: "gift_card", order_id: giftUpdate.id })
        .eq("transaction_id", txId);

      if (isCompleted && normalised.length === 0) {
        const fetched = await fetchGiftCards(txId, giftcardBase);
        if (fetched.length > 0) {
          cardsArray = fetched;
          normalised = normaliseCards(fetched);

          const patch: Record<string, unknown> = {};
          if (normalised[0]?.code) patch.redeem_code = normalised[0].code;
          if (normalised[0]?.pin) patch.pin_code = normalised[0].pin;
          if (fetched.length > 1) patch.cards_json = JSON.stringify(fetched);
          if (Object.keys(patch).length > 0) {
            await supabase.from("gift_card_orders").update(patch).eq("id", giftUpdate.id);
          }
        }
      }

      const deliverable = normalised.length > 0;
      let emailed = false;

      if (isCompleted && deliverable && giftUpdate.recipient_email) {
        const { data: emailClaim } = await supabase
          .from("gift_card_orders")
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq("id", giftUpdate.id)
          .eq("email_sent", false)
          .select("id")
          .maybeSingle();

        if (!emailClaim) {
          console.log(`Delivery email already sent for gift_card_orders id=${giftUpdate.id} — skipping`);
        } else {
          const payloadProduct =
            ((p.product ?? (inner as Record<string, unknown>).product) as
              | { productId?: number | string; logoUrls?: string[] }
              | undefined) ?? undefined;

          const productId =
            payloadProduct?.productId ??
            (p.productId as number | string | undefined) ??
            (await fetchProductIdFromTransaction(txId, giftcardBase));

          const productImage =
            (Array.isArray(payloadProduct?.logoUrls) && payloadProduct?.logoUrls[0]) ||
            (productId != null ? await fetchProductImage(productId, giftcardBase) : null);

          const redeemInstructions = productId != null ? await fetchRedeemInstructions(productId, giftcardBase) : null;

          emailed = await sendEmail({
            to: giftUpdate.recipient_email,
            subject: `Your ${giftUpdate.product_name ?? "gift card"} is ready`,
            html: giftCardEmail({
              productName: giftUpdate.product_name || "Gift Card",
              cards: cardsArray,
              amount: Number(giftUpdate.unit_price ?? 0),
              currency: giftUpdate.currency_code || "USD",
              productImage,
              redeemInstructions,
              orderReference: txId,
            }),
          });

          if (!emailed) {
            await supabase
              .from("gift_card_orders")
              .update({ email_sent: false, email_sent_at: null })
              .eq("id", giftUpdate.id);
            console.error(`Email send failed for gift_card_orders id=${giftUpdate.id} — slot released`);
          }
        }
      } else if (isCompleted && !deliverable) {
        console.warn(`No usable gift card codes for tx=${txId} (env=${giftcardBase}); email skipped.`);
      }

      return json({ received: true, updated: "gift_card", id: giftUpdate.id, emailed });
    }

    // Top-up
    const topupUpdate: Record<string, unknown> = { status: normalisedStatus };
    if (p.deliveredAmount != null) topupUpdate.delivered_amount = p.deliveredAmount;
    if (p.deliveredAmountCurrencyCode) topupUpdate.delivered_currency_code = p.deliveredAmountCurrencyCode;

    const { data: topupRow } = await supabase
      .from("airtime_topup_orders")
      .update(topupUpdate)
      .eq("reloadly_transaction_id", txId)
      .select("id, recipient_phone, operator_name, amount, user_id")
      .maybeSingle();

    if (topupRow) {
      console.log(`airtime_topup_orders id=${topupRow.id} → ${normalisedStatus}`);
      await supabase
        .from("reloadly_webhook_events")
        .update({ order_type: "topup", order_id: topupRow.id })
        .eq("transaction_id", txId);

      if (isCompleted && topupRow.user_id && topupRow.user_id !== "webhook") {
        const { data: user } = await supabase.auth.admin.getUserById(topupRow.user_id);
        const userEmail = user?.user?.email;
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: "Your airtime top-up has been delivered",
            html: topupEmail({
              phone: topupRow.recipient_phone || "—",
              operatorName: topupRow.operator_name || "Your operator",
              deliveredAmount: Number(p.deliveredAmount ?? topupRow.amount ?? 0),
              currency: String(p.deliveredAmountCurrencyCode ?? "USD"),
            }),
          });
        }
      }

      return json({ received: true, updated: "topup", id: topupRow.id });
    }

    // Utility
    const utilUpdate: Record<string, unknown> = { status: normalisedStatus };
    if (p.code) utilUpdate.code = p.code;
    if (p.message) utilUpdate.message = p.message;
    if (p.submittedAt) utilUpdate.submitted_at = p.submittedAt;
    if (p.finalStatusAvailabilityAt) utilUpdate.final_status_at = p.finalStatusAvailabilityAt;

    const { data: utilRow } = await supabase
      .from("utility_payment_orders")
      .update(utilUpdate)
      .eq("reloadly_transaction_id", txId)
      .select("id, subscriber_account_number, biller_name, amount, user_id")
      .maybeSingle();

    if (utilRow) {
      console.log(`utility_payment_orders id=${utilRow.id} → ${normalisedStatus}`);
      await supabase
        .from("reloadly_webhook_events")
        .update({ order_type: "utility", order_id: utilRow.id })
        .eq("transaction_id", txId);

      if (isCompleted && utilRow.user_id && utilRow.user_id !== "webhook") {
        const { data: user } = await supabase.auth.admin.getUserById(utilRow.user_id);
        const userEmail = user?.user?.email;
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: `Utility payment confirmed — ${utilRow.biller_name || "Bill"}`,
            html: utilityEmail({
              billerName: utilRow.biller_name || "Biller",
              accountNumber: utilRow.subscriber_account_number || "—",
              amount: Number(utilRow.amount ?? 0),
              transactionId: txId,
            }),
          });
        }
      }

      return json({ received: true, updated: "utility", id: utilRow.id });
    }

    // No match
    console.warn(`No matching order for Reloadly transactionId=${txId}`);
    await supabase.from("reloadly_webhook_events").delete().eq("transaction_id", txId);
    claimedTxId = null;

    return json({ received: true, note: "no_matching_order", transactionId: txId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Reloadly webhook unhandled error:", message);

    if (supabase && claimedTxId) {
      await supabase
        .from("reloadly_webhook_events")
        .delete()
        .eq("transaction_id", claimedTxId)
        .then(
          () => console.log(`Released idempotency claim for tx=${claimedTxId}`),
          (e) => console.error("Failed to release idempotency claim:", e),
        );
    }

    return json({ received: true, error: message });
  }
});
