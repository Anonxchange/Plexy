import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";
import { isValidNumber } from "@/lib/validators";

export interface SafeCartItem {
  id: string;
  variantId: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  availableForSale?: boolean;
}

export function mapCartItem(raw: unknown): SafeCartItem {
  const r = raw as Record<string, unknown>;
  return {
    id: typeof r.id === "string" ? r.id : "",
    variantId: typeof r.variantId === "string" ? r.variantId : "",
    title: sanitizeText(typeof r.title === "string" ? r.title : ""),
    price: isValidNumber(r.price) ? (r.price as number) : 0,
    currency: sanitizeText(typeof r.currency === "string" ? r.currency : ""),
    quantity: isValidNumber(r.quantity) ? Math.max(0, Math.floor(r.quantity as number)) : 0,
    image: typeof r.image === "string" ? sanitizeUrl(r.image) : undefined,
    availableForSale: typeof r.availableForSale === "boolean" ? r.availableForSale : undefined,
  };
}

export interface SafeShopProduct {
  id: string;
  title: string;
  description?: string;
  images: string[];
  price: number;
  currency?: string;
}

export function mapShopProduct(raw: unknown): SafeShopProduct {
  const r = raw as Record<string, unknown>;
  return {
    id: typeof r.id === "string" ? r.id : "",
    title: sanitizeText(typeof r.title === "string" ? r.title : ""),
    description: typeof r.description === "string" ? sanitizeText(r.description) : undefined,
    images: Array.isArray(r.images)
      ? r.images.map(img => sanitizeUrl(String(img))).filter(Boolean)
      : [],
    price: isValidNumber(r.price) ? (r.price as number) : 0,
    currency: typeof r.currency === "string" ? sanitizeText(r.currency) : undefined,
  };
}
