import DOMPurify from "dompurify";

export function sanitizeText(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

export function sanitizeRichText(
  html: string,
  allowedTags = ["p", "br", "strong", "em", "a", "ul", "ol", "li", "code"]
): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
  });
}

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

export function safeIsoCode(code: string): string {
  const purified = DOMPurify.sanitize(code, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return purified.toLowerCase().replace(/[^a-z]/g, "").slice(0, 2);
}

export function safeCryptoSymbol(symbol: string): string {
  const purified = DOMPurify.sanitize(symbol || "", { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return purified.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
}
