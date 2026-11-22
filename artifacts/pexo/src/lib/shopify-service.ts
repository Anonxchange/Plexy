import { toast } from "sonner";
import { getSupabase } from "./supabase";
import { devLog } from "./dev-logger";
import { getCountryPreferences, setCountryPreference, initializeCountryPreferences } from "./country-preferences";
import { safeStorage } from "./safe-storage";

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    descriptionHtml: string;
    handle: string;
    productType: string;
    tags: string[];
    priceRange: {
      minVariantPrice: {
        amount: string;
        currencyCode: string;
      };
    };
    images: {
      edges: Array<{
        node: {
          url: string;
          altText: string | null;
        };
      }>;
    };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: {
            amount: string;
            currencyCode: string;
          };
          availableForSale: boolean;
          selectedOptions: Array<{
            name: string;
            value: string;
          }>;
        };
      }>;
    };
    options: Array<{
      name: string;
      values: string[];
    }>;
    metafields?: Array<{
      namespace: string;
      key: string;
      value: string;
      type: string;
    } | null>;
  };
}

export interface ProductIndexItem {
  id: string;
  createdAt: number;
  price: number;
}

// Shape produced by parsing the "air_reviews_product.data" metafield (Air Reviews app / CJdropshipping import)
// so it can sit alongside the Supabase `product_reviews` rows in the same UI.
export interface ImportedReview {
  id: string;
  rating: number;
  comment: string;
  displayName: string;
  createdAt: string;
  countryCode?: string;
  images: string[];
  videos: string[];
  // `verifyBuyer` (source field) vs `verified` (source field) are two distinct
  // flags in the raw Air Reviews data — see parseImportedReviews for details.
  verifiedBuyer: boolean;
  verified: boolean;
  source: "imported";
}

const REVIEWS_METAFIELD_NAMESPACE = "air_reviews_product";
const REVIEWS_METAFIELD_KEY = "data";

function parseImportedReviews(
  metafields?: Array<{ namespace: string; key: string; value: string; type: string } | null> | null
): ImportedReview[] {
  if (!metafields) return [];

  const metafield = metafields.find(
    (m) => m && m.namespace === REVIEWS_METAFIELD_NAMESPACE && m.key === REVIEWS_METAFIELD_KEY
  );
  if (!metafield?.value) return [];

  try {
    const parsed = JSON.parse(metafield.value);
    const rawReviews: any[] = Array.isArray(parsed?.reviews) ? parsed.reviews : [];

    return rawReviews
      .filter((r) => r?.status === "approved")
      .map((r) => ({
        id: String(r.id),
        rating: Number(r.rate) || 0,
        comment: typeof r.content === "string" ? r.content : "",
        displayName: r.firstName || "Verified shopper",
        createdAt: r.createdAt,
        countryCode: typeof r.countryCode === "string" ? r.countryCode.toUpperCase() : undefined,
        images: Array.isArray(r.images) ? r.images.filter((u: unknown) => typeof u === "string") : [],
        videos: Array.isArray(r.videos) ? r.videos.filter((u: unknown) => typeof u === "string") : [],
        // `verifyBuyer`: whether Air Reviews matched this reviewer to an actual
        // store purchase. `verified`: the review's own approval/verification
        // flag from the source (CJDropshipping) side. They're independent —
        // keep both rather than collapsing into one boolean.
        verifiedBuyer: Boolean(r.verifyBuyer),
        verified: Boolean(r.verified),
        source: "imported" as const,
      }));
  } catch (e) {
    devLog.error("Failed to parse air_reviews_product.data metafield:", e);
    return [];
  }
}

// Query name constants matching server-side allowlist
export const PRODUCTS_QUERY = 'getProducts';
export const PRODUCT_INDEX_QUERY = 'getProductIndex';
export const PRODUCT_CARDS_QUERY = 'getProductCards';
export const PRODUCT_BY_HANDLE_QUERY = 'getProductByHandle';
export const PRODUCT_TYPES_QUERY = 'getProductTypes';
export const COLLECTIONS_QUERY = 'getCollections';
export const COLLECTION_BY_HANDLE_QUERY = 'getCollectionByHandle';
export const COLLECTION_PRODUCT_TYPES_QUERY = 'getCollectionProductTypes';
export const CART_QUERY = 'cartQuery';
export const CART_CREATE_MUTATION = 'cartCreate';
export const CART_LINES_ADD_MUTATION = 'cartLinesAdd';
export const CART_LINES_UPDATE_MUTATION = 'cartLinesUpdate';
export const CART_LINES_REMOVE_MUTATION = 'cartLinesRemove';
export const CART_BUYER_IDENTITY_UPDATE_MUTATION = 'cartBuyerIdentityUpdate';

// Selected market/country (ISO 3166-1 alpha-2). Product/collection queries
// pick this up via @inContext(country:) (see storefrontApiRequest below).
// Shopify does NOT auto-detect market from IP — without this being set
// explicitly (e.g. from a country switcher), every request resolves to the
// store's primary market regardless of who's visiting.
// Fired whenever the market changes (manual selection or IP detection).
// Any page/component can listen instead of forcing a full window.location.reload().
export const MARKET_CHANGED_EVENT = 'pexly:market-changed';
const MARKET_CACHE_KEY = 'pexly_shopify_markets_v1';
const MARKET_CACHE_TTL_MS = 300_000;
type MarketEntry = { code: string; region: string; currency: string };
let localizationRequest: Promise<MarketEntry[]> | undefined;
let localizationExpiresAt = 0;

function readCachedMarkets(): MarketEntry[] | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.sessionStorage.getItem(MARKET_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { expiresAt?: number; markets?: unknown };
    if (typeof parsed?.expiresAt !== 'number' || Date.now() >= parsed.expiresAt) return undefined;
    if (!Array.isArray(parsed.markets) || parsed.markets.length === 0) return undefined;
    const valid = parsed.markets.filter(
      (m: any): m is MarketEntry =>
        m && typeof m.code === 'string' && /^[A-Z]{2}$/.test(m.code) &&
        typeof m.region === 'string' && typeof m.currency === 'string'
    );
    return valid.length === parsed.markets.length ? valid : undefined;
  } catch {
    return undefined;
  }
}

function writeCachedMarkets(markets: MarketEntry[], expiresAt: number) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(MARKET_CACHE_KEY, JSON.stringify({ expiresAt, markets }));
  } catch {
    // Ignore storage quota or private mode failures
  }
}

export function getMarketCountry(): string | undefined {
  return getCountryPreferences().delivery?.country;
}

export function setMarketCountry(countryCode: string) {
  setCountryPreference("delivery", countryCode);
}

export async function storefrontApiRequest(queryName: string, variables: Record<string, unknown> = {}) {
  try {
    // Verify catalog context as well as cart context: an unsupported country can
    // silently fall back to the store's primary market even with @inContext.
    // Showing an error is safer than displaying prices for the wrong market.
    const needsMarket = [
      PRODUCTS_QUERY, PRODUCT_INDEX_QUERY, PRODUCT_CARDS_QUERY, PRODUCT_BY_HANDLE_QUERY, PRODUCT_TYPES_QUERY, COLLECTIONS_QUERY,
      COLLECTION_BY_HANDLE_QUERY, COLLECTION_PRODUCT_TYPES_QUERY, CART_CREATE_MUTATION,
      CART_LINES_ADD_MUTATION, CART_BUYER_IDENTITY_UPDATE_MUTATION,
    ].includes(queryName);

    const explicitCountry =
      (variables.buyerIdentity as { countryCode?: string } | undefined)?.countryCode ||
      (typeof variables.country === "string" ? variables.country : undefined);
    let country = explicitCountry || getMarketCountry();

    if (needsMarket) {
      // Run country geo-detection (only if no delivery country is saved yet)
      // in parallel with fetching Shopify's allowed markets.
      const marketsPromise = shopifyService.getAvailableCountries();
      if (!country) {
        await initializeCountryPreferences();
        country = getMarketCountry();
      }
      const selectedCountry = explicitCountry || country;
      if (!selectedCountry) throw new Error("Choose your shop delivery country in the header.");
      const markets = await marketsPromise;
      if (!markets.some(market => market.code === selectedCountry)) {
        throw new Error(`Shop delivery to ${selectedCountry} is not available. Choose another country in the header.`);
      }
    } else if (queryName !== "getLocalization" && !country) {
      // Non-market queries (except getLocalization which takes no $country) still
      // use cached delivery country when present, without blocking on IP detection.
      country = getMarketCountry();
    }

    const supabase = await getSupabase();
    const requestVariables = queryName === "getLocalization"
      ? variables
      : { ...(country ? { country } : {}), ...variables };
    const { data, error } = await supabase.functions.invoke('shopify-storefront', {
      body: { queryName, variables: requestVariables }
    });

    if (error) {
      if ((error as any).status === 402) {
        toast.error("Shopify: Payment required", {
          description: "Your store needs an active billing plan. Visit https://admin.shopify.com to upgrade.",
        });
        throw new Error("Shop catalog is temporarily unavailable.");
      }
      const errorMessage = error.message || "Failed to process request";
      devLog.error('Supabase function error:', error);
      if (queryName === "getLocalization") {
        throw new Error("Shop delivery markets could not be verified. Please try again later.");
      }
      if (queryName === CART_BUYER_IDENTITY_UPDATE_MUTATION) {
        throw new Error("Your cart could not be updated. Your delivery country has not changed. Please try again.");
      }
      throw new Error(errorMessage);
    }

    if (data?.errors) {
      throw new Error(`Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }

    return data;
  } catch (err: any) {
    devLog.error('Storefront API error:', err);
    throw err;
  }
}

export function formatPrice(amount: string | number, currencyCode: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(Number(amount));
}

const ALLOWED_CHECKOUT_HOST_SUFFIXES = [
  ".myshopify.com",
  ".shop.app",
  ".pexly.com",
  ".pexly.app",
];
const ALLOWED_CHECKOUT_EXACT_HOSTS = new Set([
  "checkout.shopify.com",
  "shop.app",
  "pexly.com",
  "pexly.app",
]);

export function formatCheckoutUrl(checkoutUrl: string): string {
  if (typeof checkoutUrl !== "string" || !checkoutUrl.trim()) return "";
  try {
    const parsed = new URL(checkoutUrl.trim());
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return "";
    const host = parsed.hostname.toLowerCase();
    const allowed =
      ALLOWED_CHECKOUT_EXACT_HOSTS.has(host) ||
      ALLOWED_CHECKOUT_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
    return allowed ? parsed.href : "";
  } catch {
    return "";
  }
}

function isCartNotFoundError(userErrors: Array<{ field: string[] | null; message: string }>): boolean {
  return userErrors.some(e => e.message.toLowerCase().includes('cart not found') || e.message.toLowerCase().includes('does not exist'));
}

export const shopifyService = {
  async getAvailableCountries(): Promise<MarketEntry[]> {
    if (localizationRequest && Date.now() < localizationExpiresAt) return localizationRequest;
    const cached = readCachedMarkets();
    if (cached) {
      localizationExpiresAt = Date.now() + MARKET_CACHE_TTL_MS;
      localizationRequest = Promise.resolve(cached);
      return localizationRequest;
    }
    localizationExpiresAt = Date.now() + MARKET_CACHE_TTL_MS;
    localizationRequest = (async () => {
      const data = await storefrontApiRequest("getLocalization");
      const countries = data?.data?.localization?.availableCountries;
      if (!Array.isArray(countries)) throw new Error("The store did not return its configured delivery markets.");
      const parsed = countries.map((country: any) => ({
        code: country.isoCode,
        region: country.name,
        currency: country.currency?.isoCode,
      })).filter((country: any): country is MarketEntry =>
        /^[A-Z]{2}$/.test(country.code) && typeof country.region === "string" && typeof country.currency === "string"
      );
      const expiresAt = Date.now() + MARKET_CACHE_TTL_MS;
      localizationExpiresAt = expiresAt;
      writeCachedMarkets(parsed, expiresAt);
      return parsed;
    })();
    // Failed requests are retryable from the header.
    void localizationRequest.catch(() => { localizationRequest = undefined; localizationExpiresAt = 0; });
    return localizationRequest;
  },

  async changeDeliveryCountry(country: string) {
    const countries = await shopifyService.getAvailableCountries();
    if (!countries.some(c => c.code === country)) {
      throw new Error(`Shop delivery to ${country} is not available. Your saved choice has not changed.`);
    }
    const cartId = safeStorage.getItem("shopify_cart_id");
    window.dispatchEvent(new CustomEvent("pexly:cart-localizing", { detail: { busy: true } }));
    try {
      if (cartId) {
        const result = await shopifyService.updateCartCountry(cartId, country);
        if (!result.success) throw new Error("Your cart could not be updated. Your delivery country has not changed.");
      }
      setMarketCountry(country);
      if (cartId) toast.info("Delivery country changed. Cart prices and item availability are being refreshed. Review your cart before checkout.");
    } catch (error) {
      window.dispatchEvent(new CustomEvent("pexly:cart-localizing", { detail: { busy: false } }));
      throw error;
    }
    if (!cartId) window.dispatchEvent(new CustomEvent("pexly:cart-localizing", { detail: { busy: false } }));
  },

  async getProducts(first: number = 250, after?: string, query?: string) {
    const data = await storefrontApiRequest(PRODUCTS_QUERY, { first, after, query });
    return {
      products: data?.data?.products?.edges || [],
      pageInfo: data?.data?.products?.pageInfo
    };
  },

  // Tiny record per product (id, created time, price) so a page can shuffle/sort the whole catalog cheaply.
  async getProductIndex(first: number = 250, after?: string, query?: string) {
    const data = await storefrontApiRequest(PRODUCT_INDEX_QUERY, { first, after, query });
    const items: ProductIndexItem[] = (data?.data?.products?.edges || []).map((edge: any) => ({
      id: edge.node.id as string,
      createdAt: edge.node.createdAt ? Date.parse(edge.node.createdAt) || 0 : 0,
      price: Number(edge.node.priceRange?.minVariantPrice?.amount) || 0,
    }));
    return { items, pageInfo: data?.data?.products?.pageInfo as { hasNextPage: boolean; endCursor: string | null } | undefined };
  },

  // Card-sized details for specific product ids (call with up to ~100 at a time).
  async getProductCards(ids: string[]): Promise<ShopifyProduct[]> {
    if (ids.length === 0) return [];
    const data = await storefrontApiRequest(PRODUCT_CARDS_QUERY, { ids });
    const nodes: any[] = data?.data?.nodes || [];
    return nodes.filter((n) => n && n.id).map((node) => ({ node })) as ShopifyProduct[];
  },

  async getProductTypes(first: number = 250) {
    const data = await storefrontApiRequest(PRODUCT_TYPES_QUERY, { first });
    const edges = data?.data?.productTypes?.edges || data?.data?.products?.edges || [];
    return edges
      .map((edge: any) => typeof edge.node === 'string' ? edge.node : edge.node?.productType)
      .filter((type: unknown): type is string => typeof type === 'string' && type.trim().length > 0);
  },

  async getCollections(first: number = 50, after?: string) {
    const data = await storefrontApiRequest(COLLECTIONS_QUERY, { first, after });
    return {
      collections: data?.data?.collections?.edges || [],
      pageInfo: data?.data?.collections?.pageInfo,
    };
  },

  async getCollectionProductTypes(handle: string, first: number = 250) {
    const data = await storefrontApiRequest(COLLECTION_PRODUCT_TYPES_QUERY, { handle, first });
    const edges = data?.data?.collectionByHandle?.products?.edges || [];
    const productTypes = new Map<string, Set<string>>();
    for (const edge of edges) {
      const pt: string = edge.node?.productType?.trim() || '';
      const tags: string[] = Array.isArray(edge.node?.tags) ? edge.node.tags : [];
      if (!pt) continue;
      if (!productTypes.has(pt)) productTypes.set(pt, new Set());
      tags.forEach((t: string) => { if (t.trim()) productTypes.get(pt)!.add(t.trim()); });
    }
    return productTypes;
  },

  async getCollectionProducts(handle: string, first: number = 250, after?: string, productType?: string, tag?: string) {
    const data = await storefrontApiRequest(COLLECTION_BY_HANDLE_QUERY, {
      handle, first, after,
      ...(productType ? { productType } : {}),
      ...(tag ? { tag } : {}),
    });
    const col = data?.data?.collectionByHandle;
    return {
      collection: col ? { id: col.id, title: col.title, handle: col.handle, description: col.description, image: col.image } : null,
      products: col?.products?.edges || [],
      pageInfo: col?.products?.pageInfo,
    };
  },

  async getProductByHandle(handle: string) {
    const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
    const product = data?.data?.productByHandle;
    if (!product) return product;

    // Attach reviews imported via the Air Reviews app metafield so pages can
    // pass them straight into <ReviewSection importedReviews={...} />.
    return {
      ...product,
      importedReviews: parseImportedReviews(product.metafields),
    };
  },

  async getCart(cartId: string) {
    const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
    const cart = data?.data?.cart;
    if (!cart) return null;

    const lines = cart.lines?.edges || [];
    const items = lines.map((edge: any) => {
      const node = edge.node;
      const variant = node.merchandise;
      const product = variant?.product;

      // cost.totalAmount is the Storefront API 2022-01+ field; fall back to variant price
      const costAmount = node.cost?.totalAmount?.amount;
      const costCurrency = node.cost?.totalAmount?.currencyCode;

      return {
        id: node.id,
        variantId: variant?.id || '',
        title: node.title || (product?.title || 'Product') + (variant?.title && variant.title !== 'Default Title' ? ` - ${variant.title}` : ''),
        price: costAmount ? parseFloat(costAmount) / Math.max(1, node.quantity) : (variant?.price?.amount ? parseFloat(variant.price.amount) : 0),
        currency: costCurrency || variant?.price?.currencyCode || 'USD',
        quantity: node.quantity,
        availableForSale: variant?.availableForSale,
        image: node.image?.url || product?.images?.edges?.[0]?.node?.url || product?.images?.nodes?.[0]?.url || ''
      };
    });

    return {
      id: cart.id,
      totalQuantity: cart.totalQuantity,
      countryCode: cart.buyerIdentity?.countryCode as string | undefined,
      checkoutUrl: formatCheckoutUrl(cart.checkoutUrl),
      items
    };
  },

  async createCart(item: { variantId: string; quantity: number }) {
    await initializeCountryPreferences();
    const country = getMarketCountry();
    const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
      input: {
        lines: [{ quantity: item.quantity, merchandiseId: item.variantId }],
        // Cart localization ignores @inContext entirely — it has to be set
        // via buyerIdentity, here or through cartBuyerIdentityUpdate later.
        ...(country ? { buyerIdentity: { countryCode: country } } : {}),
      },
    });

    if (data?.data?.cartCreate?.userErrors?.length > 0) {
      devLog.error('Cart creation failed:', data.data.cartCreate.userErrors);
      return null;
    }

    const cart = data?.data?.cartCreate?.cart;
    if (!cart?.checkoutUrl) return null;
    if (cart.buyerIdentity?.countryCode !== country) {
      throw new Error("The cart delivery country could not be confirmed. Please try again.");
    }

    const lineId = cart.lines?.edges?.[0]?.node?.id;
    if (!lineId) {
      devLog.warn('Cart created but no line ID found in response');
    }

    return { 
      cartId: cart.id, 
      checkoutUrl: formatCheckoutUrl(cart.checkoutUrl), 
      lineId: lineId || cart.id // Fallback to cart ID if line ID is missing
    };
  },

  async addLineToCart(cartId: string, item: { variantId: string; quantity: number }) {
    const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, {
      cartId,
      lines: [{ quantity: item.quantity, merchandiseId: item.variantId }],
    });

    const userErrors = data?.data?.cartLinesAdd?.userErrors || [];
    if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
    if (userErrors.length > 0) return { success: false };

    const lines = data?.data?.cartLinesAdd?.cart?.lines?.edges || [];
    const newLine = lines.find((l: any) => l.node.merchandise.id === item.variantId);
    return { success: true, lineId: newLine?.node?.id };
  },

  async updateCartLine(cartId: string, lineId: string, quantity: number) {
    const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
      cartId,
      lines: [{ id: lineId, quantity }],
    });

    const userErrors = data?.data?.cartLinesUpdate?.userErrors || [];
    if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
    if (userErrors.length > 0) return { success: false };
    return { success: true };
  },

  async removeLineFromCart(cartId: string, lineId: string) {
    const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, {
      cartId,
      lineIds: [lineId],
    });

    const userErrors = data?.data?.cartLinesRemove?.userErrors || [];
    if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
    if (userErrors.length > 0) return { success: false };
    return { success: true };
  },

  // Re-localizes an existing cart to a country — needed if a market switcher
  // changes the country AFTER a cart already exists, since the cart's pricing
  // otherwise stays locked to whatever country it was created under.
  async updateCartCountry(cartId: string, countryCode: string) {
    const data = await storefrontApiRequest(CART_BUYER_IDENTITY_UPDATE_MUTATION, {
      cartId,
      buyerIdentity: { countryCode },
    });

    const userErrors = data?.data?.cartBuyerIdentityUpdate?.userErrors || [];
    if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
    if (userErrors.length > 0) return { success: false };
    const cart = data?.data?.cartBuyerIdentityUpdate?.cart;
    if (cart?.buyerIdentity?.countryCode !== countryCode) {
      throw new Error("Shopify did not confirm the requested cart delivery country. Your saved choice has not changed.");
    }
    return { success: true };
  }
};

// Keep legacy named exports for backward compatibility with existing imports
export const createShopifyCart = shopifyService.createCart;
export const addLineToShopifyCart = shopifyService.addLineToCart;
export const updateShopifyCartLine = shopifyService.updateCartLine;
export const removeLineFromShopifyCart = shopifyService.removeLineFromCart;
