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
// The redeem-code endpoint is versioned separately; v2 is the current shape.
const GIFTCARD_ACCEPT_V2 = "application/com.reloadly.giftcards-v2+json";

const BRAND_NAME = env("BRAND_NAME") ?? "pexly";
// Brand mark always renders lowercase.
const BRAND_DISPLAY = BRAND_NAME.toLowerCase();
const SUPPORT_EMAIL = env("SUPPORT_EMAIL") ?? "support@pexly.app";
const EMAIL_FROM = env("EMAIL_FROM") ?? `${BRAND_DISPLAY} <orders@pexly.app>`;

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

  // Reloadly sends this header in MILLISECONDS; normalise so seconds work too.
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
    if (expectedBuf.length !== receivedBuf.length) {
      return { ok: false, reason: "signature_mismatch" };
    }
    return timingSafeEqual(expectedBuf, receivedBuf)
      ? { ok: true }
      : { ok: false, reason: "signature_mismatch" };
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

/* ═══ Card normalisation ═══════════════════════════════════════════════════ */

const LIME = "#B2F02B";
const INK = "#0B0B0B";
const PURPLE = "#6D4AFF";
const PURPLE_SOFT = "#F1EEFF";
const MUTED = "#6B7280";
const BODY_TEXT = "#4B5563";
const LINE = "#E8EAE3";
const SURFACE = "#F7F8F4";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";

type RawCard = {
  cardNumber?: string | number | null;
  card_number?: string | number | null;
  pinCode?: string | number | null;
  pin_code?: string | number | null;
  redemptionUrl?: string | null;
  redemption_url?: string | null;
  expirationDate?: string | null;
  expiration_date?: string | null;
};

type NormalisedCard = {
  code: string | null;
  pin: string | null;
  url: string | null;
  expiresAt: string | null;
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
  const expiresAt = clean(raw.expirationDate ?? raw.expiration_date);
  if (code && isUrl(code)) {
    url = url ?? code;
    code = null;
  }
  if (url && !isUrl(url)) url = null;
  return { code, pin, url, expiresAt };
}

function normaliseCards(raw: RawCard[]): NormalisedCard[] {
  return raw.map(normaliseCard).filter((c) => c.code || c.pin || c.url);
}

function looksLikeCard(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const c = value as RawCard;
  return (
    c.cardNumber != null ||
    c.card_number != null ||
    c.pinCode != null ||
    c.pin_code != null ||
    c.redemptionUrl != null ||
    c.redemption_url != null
  );
}

/**
 * Reloadly returns cards in several shapes: a bare array, `{ content: [...] }`,
 * a single card object, or an object keyed by product id (`{ "18": [ ... ] }`).
 */
function extractCards(data: unknown): RawCard[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(looksLikeCard) as RawCard[];

  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.content)) return (obj.content as unknown[]).filter(looksLikeCard) as RawCard[];
  if (looksLikeCard(obj)) return [obj as RawCard];

  // Map keyed by product id.
  const flattened: RawCard[] = [];
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      flattened.push(...(value.filter(looksLikeCard) as RawCard[]));
    } else if (looksLikeCard(value)) {
      flattened.push(value as RawCard);
    }
  }
  return flattened;
}

/* ═══ Email templates ══════════════════════════════════════════════════════ */

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
  return `<div style="font:600 13px/1.3 ${FONT};letter-spacing:.09em;text-transform:uppercase;color:${MUTED};margin:0 0 8px">${esc(text)}</div>`;
}

function codeBox(value: string): string {
  return `<div style="font:700 24px/1.4 ${MONO};letter-spacing:.04em;color:${INK};background:${SURFACE};border:1px solid ${LINE};border-radius:12px;padding:18px 20px;word-break:break-all">${esc(value)}</div>`;
}

function logoMark(): string {
  return `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${LIME};vertical-align:middle;margin-right:10px"></span><span style="font:700 26px/1 ${FONT};letter-spacing:-.02em;color:${INK};vertical-align:middle;text-transform:lowercase">${esc(BRAND_DISPLAY)}</span>`;
}

// Full-bleed layout: the content fills the email width, no inset floating card.
function emailWrapper(content: string, preheader: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#FFFFFF">
<div style="display:none;font-size:1px;color:#FFFFFF;max-height:0;max-width:0;overflow:hidden">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF">
<tr><td align="center" style="padding:0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background:#FFFFFF">
    <tr><td style="padding:24px;border-bottom:1px solid ${LINE}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="left" style="vertical-align:middle">${logoMark()}</td>
        <td align="right" style="vertical-align:middle;font:500 15px/1.3 ${FONT};color:${MUTED}">Digital delivery</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:32px 24px 8px">${content}</td></tr>
    <tr><td style="padding:24px;border-top:1px solid ${LINE}">
      <p style="margin:0;font:400 15px/1.6 ${FONT};color:${MUTED}">Questions about your order? We're here at
        <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:${PURPLE};text-decoration:none">${esc(SUPPORT_EMAIL)}</a></p>
      <p style="margin:10px 0 0;font:400 14px/1.5 ${FONT};color:${MUTED}">${esc(BRAND_DISPLAY)} · Safe, simple, yours</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function eyebrow(text: string): string {
  return `<div style="font:700 14px/1.3 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${PURPLE};margin:0 0 12px">${esc(text)}</div>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 14px;font:700 34px/1.2 ${FONT};letter-spacing:-.02em;color:${INK}">${esc(text)}</h1>`;
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 24px;font:400 18px/1.65 ${FONT};color:${BODY_TEXT}">${html}</p>`;
}

function reference(text: string): string {
  return `<p style="margin:0 0 8px;font:400 14px/1.5 ${MONO};color:${MUTED}">Reference: ${esc(text)}</p>`;
}

function panel(inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px"><tr><td style="border:1px solid ${LINE};border-radius:16px;padding:24px">${inner}</td></tr></table>`;
}

function heroCard(productName: string, productImage?: string | null): string {
  if (productImage && isUrl(productImage)) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px"><tr><td align="center" style="background:${SURFACE};border:1px solid ${LINE};border-radius:16px;padding:28px">
      <img src="${esc(productImage)}" alt="${esc(productName)}" width="320" style="display:block;width:100%;max-width:320px;height:auto;border-radius:12px" />
    </td></tr></table>`;
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px"><tr><td style="background:${SURFACE};border:1px solid ${LINE};border-radius:16px;padding:24px">
    ${label("Gift card")}<div style="font:700 24px/1.3 ${FONT};color:${INK}">${esc(productName)}</div>
  </td></tr></table>`;
}

function summaryRow(amount: number, currency: string, cardCount: number): string {
  const extra = cardCount > 1 ? ` · ${cardCount} cards` : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px"><tr>
    <td style="vertical-align:middle">
      ${label("Value")}<div style="font:700 26px/1.3 ${FONT};color:${INK}">${formatMoney(amount, currency)}${esc(extra)}</div>
    </td>
    <td align="right" style="vertical-align:middle">
      <span style="display:inline-block;white-space:nowrap;font:600 14px/1 ${FONT};color:${INK};background:${LIME};border-radius:999px;padding:11px 17px">Delivered</span>
    </td>
  </tr></table>`;
}

function cardBlock(card: NormalisedCard, index: number, total: number): string {
  const rows: string[] = [];

  if (total > 1) {
    rows.push(`<div style="font:600 15px/1.3 ${FONT};color:${MUTED};margin:0 0 14px">Card ${index + 1} of ${total}</div>`);
  }
  if (card.code) {
    rows.push(`<div style="margin:0 0 20px">${label(card.pin ? "Card number" : "Redeem code")}${codeBox(card.code)}</div>`);
  }
  if (card.pin) {
    rows.push(`<div style="margin:0 0 20px">${label("PIN")}${codeBox(card.pin)}</div>`);
  }
  if (card.url) {
    rows.push(`<div style="margin:0 0 4px">${label(card.code ? "Redeem online" : "Redemption page")}
      <a href="${esc(card.url)}" style="display:inline-block;font:600 17px/1 ${FONT};color:${INK};background:${LIME};border-radius:12px;padding:16px 24px;text-decoration:none">Open redemption page</a>
      <p style="margin:12px 0 0;font:400 14px/1.5 ${MONO};color:${MUTED};word-break:break-all">${esc(card.url)}</p></div>`);
  }
  if (card.expiresAt) {
    rows.push(`<p style="margin:14px 0 0;font:400 15px/1.5 ${FONT};color:${MUTED}">Expires ${esc(card.expiresAt)}</p>`);
  }

  return panel(rows.join(""));
}

function redeemNote(productName: string, cards: NormalisedCard[], instructions?: string | null): string {
  const provided = clean(instructions);
  const multi = cards.length > 1;
  const anyPin = cards.some((c) => c.pin);
  const anyCode = cards.some((c) => c.code);
  const linkOnly = !anyCode && cards.some((c) => c.url);

  let body: string;
  if (provided) {
    body = esc(provided).replace(/\n+/g, "<br />");
  } else if (linkOnly) {
    body = `Open the redemption page above and follow the steps shown to claim your ${esc(productName)} card.`;
  } else {
    const what = anyPin ? "the card number and PIN" : "the redeem code";
    body = `Open the official ${esc(productName)} app or website, go to the “Redeem” / “Add gift card” section and enter ${what} exactly as shown above.`;
  }

  const suffix = multi ? ` Each of the ${cards.length} cards above is redeemed separately.` : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tr><td style="background:${PURPLE_SOFT};border-radius:16px;padding:22px">
    <p style="margin:0;font:400 17px/1.65 ${FONT};color:${BODY_TEXT}"><strong style="color:${INK}">How to redeem:</strong> ${body}${suffix} Treat it like cash — keep it safe.</p>
  </td></tr></table>`;
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
    ${clean(opts.orderReference) ? reference(opts.orderReference as string) : ""}
  `;

  return emailWrapper(content, `Your ${productName} gift card is ready to redeem.`);
}

function topupEmail(opts: {
  phone: string;
  operatorName: string;
  deliveredAmount: number;
  currency: string;
}): string {
  const content = `
    ${eyebrow("Your order")}
    ${heading("Top-up delivered")}
    ${paragraph("Your airtime top-up has been delivered successfully.")}
    ${panel(`
      <div style="margin:0 0 20px">${label("Phone number")}${codeBox(opts.phone)}</div>
      <div style="margin:0 0 20px">${label("Amount delivered")}
        <div style="font:700 26px/1.3 ${FONT};color:${INK}">${formatMoney(opts.deliveredAmount, opts.currency)}</div></div>
      <div>${label("Operator")}
        <div style="font:600 19px/1.4 ${FONT};color:${INK}">${esc(opts.operatorName)}</div></div>
    `)}
    ${paragraph("The credit should appear on the recipient's balance within a few minutes.")}
  `;
  return emailWrapper(
    content,
    `${formatMoney(opts.deliveredAmount, opts.currency)} sent to ${opts.phone}.`,
  );
}

function utilityEmail(opts: {
  billerName: string;
  accountNumber: string;
  amount: number;
  currency?: string;
  transactionId: string;
}): string {
  const content = `
    ${eyebrow("Your payment")}
    ${heading("Payment confirmed")}
    ${paragraph(`Your utility payment to ${esc(opts.billerName)} has been processed.`)}
    ${panel(`
      <div style="margin:0 0 20px">${label("Account / meter number")}${codeBox(opts.accountNumber)}</div>
      <div>${label("Amount paid")}
        <div style="font:700 26px/1.3 ${FONT};color:${INK}">${formatMoney(opts.amount, opts.currency ?? "USD")}</div></div>
    `)}
    ${reference(opts.transactionId)}
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
    console.error(
      `Reloadly credentials missing for ${isSandbox ? "sandbox" : "live"} — cannot fetch gift card codes`,
    );
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

/**
 * Reloadly returns `cardNumber` as a JSON *number*. Codes longer than 15 digits
 * lose precision through JSON.parse, so quote those fields before parsing.
 */
function parseReloadlyJson(text: string): unknown {
  const safe = text.replace(
    /("(?:cardNumber|card_number|pinCode|pin_code)"\s*:\s*)(\d{10,})/g,
    '$1"$2"',
  );
  try {
    return JSON.parse(safe);
  } catch {
    return JSON.parse(text);
  }
}

async function reloadlyGet(
  base: string,
  path: string,
  accept: string = GIFTCARD_ACCEPT,
): Promise<unknown | null> {
  const token = await getReloadlyToken(base);
  if (!token) return null;

  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: accept },
  });

  if (!res.ok) {
    console.warn(`Reloadly GET ${path} failed (${res.status}):`, await res.text());
    return null;
  }
  return parseReloadlyJson(await res.text());
}

/** GET /orders/transactions/{id}/cards — codes can lag the webhook. */
async function fetchGiftCards(txId: string, base: string): Promise<RawCard[]> {
  const delays = [1500, 3000, 5000, 8000];

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const data = await reloadlyGet(
      base,
      `/orders/transactions/${txId}/cards`,
      GIFTCARD_ACCEPT_V2,
    );
    const arr = extractCards(data);

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

type ProductDetails = { image: string | null; redeemInstructions: string | null };

/**
 * GET /products/{id} already carries both the logo and `redeemInstruction`,
 * so one call covers the email's image and instruction text.
 */
async function fetchProductDetails(
  productId: number | string,
  base: string,
): Promise<ProductDetails> {
  const data = (await reloadlyGet(base, `/products/${productId}`)) as
    | {
        logoUrls?: string[];
        logo_urls?: string[];
        redeemInstruction?: { concise?: string; verbose?: string };
        redeem_instruction?: { concise?: string; verbose?: string };
      }
    | null;

  const logos = data?.logoUrls ?? data?.logo_urls;
  const instruction = data?.redeemInstruction ?? data?.redeem_instruction;

  return {
    image: Array.isArray(logos) && logos.length > 0 ? logos[0] : null,
    redeemInstructions: clean(instruction?.concise) ?? clean(instruction?.verbose),
  };
}

/** Fallback when /products/{id} omits redeemInstruction. */
async function fetchRedeemInstructions(productId: number | string, base: string): Promise<string | null> {
  const data = (await reloadlyGet(base, `/products/${productId}/redeem-instructions`)) as
    | { concise?: string; verbose?: string }
    | null;
  return clean(data?.concise) ?? clean(data?.verbose);
}

/* ═══ Handler ══════════════════════════════════════════════════════════════ */

// Postgres unique-violation SQLSTATE.
const UNIQUE_VIOLATION = "23505";

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
      // Reloadly retries any non-2xx, so a permanently-invalid delivery returned
      // as 4xx becomes an endless retry loop. Only a transient problem on our
      // side (missing secret) should ask for a retry.
      if (sigCheck.reason === "secret_not_configured") {
        console.error("Reloadly webhook cannot be verified: secret missing — asking for retry");
        return json({ error: "Verification unavailable", reason: sigCheck.reason }, 503);
      }
      console.error(`Reloadly webhook dropped: ${sigCheck.reason}`);
      return json({ received: true, dropped: sigCheck.reason }, 200);
    }

    const body = JSON.parse(rawBody);
    console.log("Reloadly webhook verified for delivery");

    const SUPABASE_URL = env("SUPABASE_URL");
    const SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is required");
    if (!SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
    supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const inner = (body.transaction ?? body.data ?? {}) as Record<string, unknown>;
    const p: Record<string, unknown> = { ...inner, ...body };

    const transactionId =
      p.transactionId ?? p.transaction_id ?? p.id ?? inner.id ?? inner.transactionId;

    if (!transactionId) {
      console.warn("No transactionId in payload — acknowledging");
      return json({ received: true, note: "no_transaction_id" });
    }

    const txId = String(transactionId);
    const giftcardBase = baseForPayload(body.liveMode ?? inner.liveMode);

    const rawStatus = String(p.status ?? p.transactionStatus ?? inner.status ?? "").toLowerCase();
    const normalisedStatus =
      rawStatus === "successful" || rawStatus === "success" ? "completed" : rawStatus || "unknown";
    const isCompleted = normalisedStatus === "completed";

    // Idempotency claim
    const { error: claimError } = await supabase
      .from("reloadly_webhook_events")
      .insert({ transaction_id: txId, status: normalisedStatus, payload: body });

    if (claimError) {
      if (
        claimError.code === UNIQUE_VIOLATION ||
        /duplicate key|already exists/i.test(claimError.message)
      ) {
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
    // Always persist the full set so cards 2+ survive an email failure.
    if (normalised.length > 0) giftCardUpdate.cards_json = JSON.stringify(normalised);

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
          if (normalised.length > 0) patch.cards_json = JSON.stringify(normalised);
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
          console.log(
            `Delivery email already sent for gift_card_orders id=${giftUpdate.id} — skipping`,
          );
        } else {
          const payloadProduct =
            ((p.product ?? inner.product) as
              | { productId?: number | string; logoUrls?: string[] }
              | undefined) ?? undefined;

          const productId =
            payloadProduct?.productId ??
            (p.productId as number | string | undefined) ??
            (await fetchProductIdFromTransaction(txId, giftcardBase));

          const details: ProductDetails =
            productId != null
              ? await fetchProductDetails(productId, giftcardBase)
              : { image: null, redeemInstructions: null };

          const productImage =
            (Array.isArray(payloadProduct?.logoUrls) && payloadProduct?.logoUrls?.[0]) ||
            details.image;

          const redeemInstructions =
            details.redeemInstructions ??
            (productId != null ? await fetchRedeemInstructions(productId, giftcardBase) : null);

          emailed = await sendEmail({
            to: String(giftUpdate.recipient_email),
            subject: `Your ${giftUpdate.product_name ?? "gift card"} is ready`,
            html: giftCardEmail({
              productName: String(giftUpdate.product_name || "Gift Card"),
              cards: cardsArray,
              amount: Number(giftUpdate.unit_price ?? 0),
              currency: String(giftUpdate.currency_code || "USD"),
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
            console.error(
              `Email send failed for gift_card_orders id=${giftUpdate.id} — slot released`,
            );
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
    if (p.deliveredAmountCurrencyCode) {
      topupUpdate.delivered_currency_code = p.deliveredAmountCurrencyCode;
    }

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
        const { data: user } = await supabase.auth.admin.getUserById(String(topupRow.user_id));
        const userEmail = user?.user?.email;
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: "Your airtime top-up has been delivered",
            html: topupEmail({
              phone: String(topupRow.recipient_phone || "—"),
              operatorName: String(topupRow.operator_name || "Your operator"),
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
        const { data: user } = await supabase.auth.admin.getUserById(String(utilRow.user_id));
        const userEmail = user?.user?.email;
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: `Utility payment confirmed — ${utilRow.biller_name || "Bill"}`,
            html: utilityEmail({
              billerName: String(utilRow.biller_name || "Biller"),
              accountNumber: String(utilRow.subscriber_account_number || "—"),
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
      try {
        await supabase.from("reloadly_webhook_events").delete().eq("transaction_id", claimedTxId);
        console.log(`Released idempotency claim for tx=${claimedTxId}`);
      } catch (e) {
        console.error("Failed to release idempotency claim:", e);
      }
    }

    return json({ received: true, error: message });
  }
});
