/**
 * Safe helper to resolve a CJ Dropshipping variant ID (cjVid) from available sources.
 *
 * Priority:
 *   1. variant-level `cj_vid` metafield (future-proof once Shopify query includes variant metafields)
 *   2. product-level cjVid (from Shopify product metafields, the current source of truth)
 *   3. variant SKU as an optional last resort
 *
 * Returns `undefined` (never an empty string) so callers can safely use a truthiness check.
 * CJ APIs must NEVER be called with an empty/null/undefined vid.
 */
export interface CjVidVariantShape {
  metafields?: Array<{ namespace?: string; key: string; value: string } | null> | null;
  sku?: string | null;
}

export function resolveCjVid(
  variant: CjVidVariantShape | null | undefined,
  productCjVid: string | undefined
): string | undefined {
  // 1. Variant-level metafield cj_vid
  if (variant?.metafields) {
    for (const m of variant.metafields) {
      if (m && m.key === "cj_vid" && typeof m.value === "string" && m.value.trim()) {
        return m.value.trim();
      }
    }
  }

  // 2. Product-level cjVid from Shopify metafields
  if (productCjVid && productCjVid.trim()) {
    return productCjVid.trim();
  }

  // 3. Variant SKU fallback (optional — only if it looks like a CJ VID, not a random SKU)
  if (variant?.sku && variant.sku.trim()) {
    return variant.sku.trim();
  }

  return undefined;
}

/**
 * Returns true if the value is a valid, non-empty cjVid that can be sent to the CJ freight API.
 * Ensures we never send "", null, or undefined.
 */
export function isValidCjVid(vid: string | undefined | null): vid is string {
  return typeof vid === "string" && vid.trim().length > 0;
}
