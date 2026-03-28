import DOMPurify from "dompurify";

/**
 * Strips all HTML/script content then enforces the ISO 3166-1 alpha-2 charset.
 * Prevents path injection when API-sourced country codes go into flagcdn URLs.
 */
export function safeIsoCode(code: string): string {
  const purified = DOMPurify.sanitize(code, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return purified.toLowerCase().replace(/[^a-z]/g, "").slice(0, 2);
}

/**
 * Strips all HTML/script content then enforces alphanumeric-only charset.
 * Prevents path injection when API-sourced ticker symbols go into CDN URLs.
 */
export function safeCryptoSymbol(symbol: string): string {
  const purified = DOMPurify.sanitize(symbol || "", { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return purified.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
}

/**
 * Sanitizes a URL string with DOMPurify and then validates the protocol.
 * Only http:, https: and same-origin relative paths (/) are allowed through.
 * Returns an empty string for anything that doesn't pass.
 */
export function sanitizeUrl(url: string): string {
  const purified = DOMPurify.sanitize(url, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  if (purified.startsWith("/")) return purified;
  try {
    const parsed = new URL(purified);
    return ["http:", "https:"].includes(parsed.protocol) ? purified : "";
  } catch {
    return "";
  }
}

/**
 * Strips all HTML tags and attributes from an arbitrary string.
 * Use on any API-sourced value that gets rendered as visible text.
 */
export function sanitizeText(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
