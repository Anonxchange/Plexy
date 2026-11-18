const DEFAULT_ALLOWED_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version';

// Preserve the existing public storefront's CORS policy.
function getCorsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') || DEFAULT_ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

const ALLOWED_QUERIES: Record<string, string> = {
  getLocalization: `
    query GetLocalization {
      localization {
        availableCountries { isoCode name currency { isoCode } }
      }
    }
  `,
  getProducts: `
    query GetProducts($first: Int!, $after: String, $query: String, $country: CountryCode) @inContext(country: $country) {
      products(first: $first, after: $after, query: $query) {
        edges { node {
          id title description descriptionHtml handle productType tags
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 20) { edges { node { url altText } } }
          variants(first: 10) { edges { node {
            id title price { amount currencyCode } availableForSale selectedOptions { name value }
          } } }
          options { name values }
        } }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
  getProductByHandle: `
    query GetProductByHandle($handle: String!, $country: CountryCode) @inContext(country: $country) {
      productByHandle(handle: $handle) {
        id title description descriptionHtml handle productType tags
        priceRange { minVariantPrice { amount currencyCode } }
        images(first: 50) { edges { node { url altText } } }
        media(first: 50) { edges { node {
          mediaContentType
          ... on MediaImage { image { url altText } }
          ... on Video { sources { url mimeType } previewImage { url } }
          ... on ExternalVideo { embeddedUrl previewImage { url } }
        } } }
        variants(first: 50) { edges { node {
          id title price { amount currencyCode } availableForSale selectedOptions { name value }
          metafields(identifiers: [
            { namespace: "custom", key: "cj_vid" },
            { namespace: "custom", key: "cj_variant_id" },
            { namespace: "custom", key: "cj_sku" }
          ]) { namespace key value type }
        } } }
        options { name values }
        metafields(identifiers: [
          { namespace: "custom", key: "ship_to" },
          { namespace: "custom", key: "ships_to" },
          { namespace: "custom", key: "ships_from" },
          { namespace: "custom", key: "shipping_from" },
          { namespace: "custom", key: "origin" },
          { namespace: "custom", key: "shipping_method" },
          { namespace: "custom", key: "method" },
          { namespace: "custom", key: "processing_time" },
          { namespace: "custom", key: "estimate_processing_time" },
          { namespace: "custom", key: "delivery_time" },
          { namespace: "custom", key: "estimated_delivery" },
          { namespace: "custom", key: "estimate_delivery" },
          { namespace: "custom", key: "shipping_fee" },
          { namespace: "custom", key: "fee" },
          { namespace: "custom", key: "cj_vid" },
          { namespace: "custom", key: "cj_variant_id" },
          { namespace: "custom", key: "cj_sku" },
          { namespace: "air_reviews_product", key: "data" }
        ]) { namespace key value type }
      }
    }
  `,
  getProductTypes: `
    query GetProductTypes($first: Int!, $country: CountryCode) @inContext(country: $country) {
      products(first: $first) { edges { node { productType } } }
    }
  `,
  getCollections: `
    query GetCollections($first: Int!, $after: String, $country: CountryCode) @inContext(country: $country) {
      collections(first: $first, after: $after) {
        edges { node { id title handle description image { url altText } } }
        pageInfo { hasNextPage endCursor }
      }
    }
  `,
  getCollectionByHandle: `
    query GetCollectionByHandle($handle: String!, $first: Int!, $after: String, $productType: String, $tag: String, $country: CountryCode) @inContext(country: $country) {
      collectionByHandle(handle: $handle) {
        id title handle description image { url altText }
        products(first: $first, after: $after, filters: [
          { productType: $productType }
          { tag: $tag }
        ]) {
          edges { node {
            id title handle productType tags
            priceRange { minVariantPrice { amount currencyCode } }
            images(first: 5) { edges { node { url altText } } }
            variants(first: 10) { edges { node {
              id title price { amount currencyCode } availableForSale selectedOptions { name value }
            } } }
          } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  `,
  getCollectionProductTypes: `
    query GetCollectionProductTypes($handle: String!, $first: Int!, $country: CountryCode) @inContext(country: $country) {
      collectionByHandle(handle: $handle) {
        products(first: $first) { edges { node { productType tags } } }
      }
    }
  `,
  cartQuery: `
    query cart($id: ID!, $country: CountryCode) @inContext(country: $country) {
      cart(id: $id) {
        id totalQuantity checkoutUrl
        buyerIdentity { countryCode }
        lines(first: 100) { edges { node {
          id quantity cost { totalAmount { amount currencyCode } }
          merchandise { ... on ProductVariant {
            id title availableForSale price { amount currencyCode }
            product { title images(first: 1) { edges { node { url } } } }
          } }
        } } }
      }
    }
  `,
  cartCreate: `
    mutation cartCreate($input: CartInput!, $country: CountryCode) @inContext(country: $country) {
      cartCreate(input: $input) {
        cart { id checkoutUrl buyerIdentity { countryCode } lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } } }
        userErrors { field message }
      }
    }
  `,
  cartBuyerIdentityUpdate: `
    mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        cart { id checkoutUrl buyerIdentity { countryCode } }
        userErrors { field message }
      }
    }
  `,
  cartLinesAdd: `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, $country: CountryCode) @inContext(country: $country) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { id checkoutUrl lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } } }
        userErrors { field message }
      }
    }
  `,
  cartLinesUpdate: `
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!, $country: CountryCode) @inContext(country: $country) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { id checkoutUrl } userErrors { field message } }
    }
  `,
  cartLinesRemove: `
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!, $country: CountryCode) @inContext(country: $country) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { id checkoutUrl } userErrors { field message } }
    }
  `,
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);

  try {
    let body;
    try { body = await req.json(); }
    catch { return reply({ error: 'Invalid JSON body' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'Invalid request body' }, 400);
    const { queryName, variables } = body;
    let resolvedQuery: string | undefined;

    if (queryName && typeof queryName === 'string') {
      resolvedQuery = Object.hasOwn(ALLOWED_QUERIES, queryName) ? ALLOWED_QUERIES[queryName] : undefined;
      if (!resolvedQuery) return reply({ error: 'Invalid query name' }, 400);
    } else if (body.query && typeof body.query === 'string') {
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      const normalizedInput = normalize(body.query);
      resolvedQuery = Object.values(ALLOWED_QUERIES).find((q) => normalize(q) === normalizedInput);
      if (!resolvedQuery) return reply({ error: 'Query not allowed. Use queryName parameter instead.' }, 400);
    } else {
      return reply({ error: 'Missing queryName parameter' }, 400);
    }

    if (variables != null && (typeof variables !== 'object' || Array.isArray(variables))) {
      return reply({ error: 'Variables must be an object' }, 400);
    }
    const forwardedVariables = { ...(variables || {}) };
    // Reject bad context rather than silently falling back to the primary market.
    if (forwardedVariables.country != null) {
      if (typeof forwardedVariables.country !== 'string' || !/^[A-Z]{2}$/i.test(forwardedVariables.country.trim())) {
        return reply({ error: 'Invalid country code' }, 400);
      }
      forwardedVariables.country = forwardedVariables.country.trim().toUpperCase();
    }

    const token = Deno.env.get('SHOPIFY_STOREFRONT_ACCESS_TOKEN');
    const storeDomain = '0wk4nq-25.myshopify.com';
    const apiVersion = '2025-07';
    if (!token) return reply({ error: 'Server configuration error' }, 500);

    const buyerIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      undefined;
    const shopifyHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    };
    if (buyerIp) shopifyHeaders['Shopify-Storefront-Buyer-IP'] = buyerIp;

    const response = await fetch(`https://${storeDomain}/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: shopifyHeaders,
      body: JSON.stringify({ query: resolvedQuery, variables: forwardedVariables }),
    });
    return reply(await response.json(), response.status);
  } catch {
    return reply({ error: 'Failed to process request' }, 500);
  }
});
