const ALLOWED_ORIGINS = new Set<string>([
  'https://pexly.app',
  'https://www.pexly.app',
]);

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://pexly.app';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

// Server-side query allowlist — only these queries can be executed
const ALLOWED_QUERIES: Record<string, string> = {
  getProducts: `
    query GetProducts($first: Int!, $after: String, $query: String) {
      products(first: $first, after: $after, query: $query) {
        edges {
          node {
            id
            title
            description
            descriptionHtml
            handle
            productType
            tags
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 20) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
            options {
              name
              values
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `,
  getProductByHandle: `
    query GetProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        description
        descriptionHtml
        handle
        productType
        tags
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 50) {
          edges {
            node {
              url
              altText
            }
          }
        }
        media(first: 50) {
          edges {
            node {
              mediaContentType
              ... on MediaImage {
                image {
                  url
                  altText
                }
              }
              ... on Video {
                sources {
                  url
                  mimeType
                }
                previewImage {
                  url
                }
              }
              ... on ExternalVideo {
                embeddedUrl
                previewImage {
                  url
                }
              }
            }
          }
        }
        variants(first: 50) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              availableForSale
              selectedOptions {
                name
                value
              }
              metafields(identifiers: [
                { namespace: "custom", key: "cj_vid" },
                { namespace: "custom", key: "cj_variant_id" },
                { namespace: "custom", key: "cj_sku" }
              ]) {
                namespace
                key
                value
                type
              }
            }
          }
        }
        options {
          name
          values
        }
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
          { namespace: "custom", key: "cj_sku" }
        ]) {
          namespace
          key
          value
          type
        }
      }
    }
  `,
  getProductTypes: `
    query GetProductTypes($first: Int!) {
      products(first: $first) {
        edges {
          node {
            productType
          }
        }
      }
    }
  `,
  getCollections: `
    query GetCollections($first: Int!, $after: String) {
      collections(first: $first, after: $after) {
        edges {
          node {
            id
            title
            handle
            description
            image {
              url
              altText
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `,
  getCollectionByHandle: `
    query GetCollectionByHandle($handle: String!, $first: Int!, $after: String, $productType: String, $tag: String) {
      collectionByHandle(handle: $handle) {
        id
        title
        handle
        description
        image {
          url
          altText
        }
        products(
          first: $first
          after: $after
          filters: [
            { productType: $productType }
            { tag: $tag }
          ]
        ) {
          edges {
            node {
              id
              title
              handle
              productType
              tags
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `,
  getCollectionProductTypes: `
    query GetCollectionProductTypes($handle: String!, $first: Int!) {
      collectionByHandle(handle: $handle) {
        products(first: $first) {
          edges {
            node {
              productType
              tags
            }
          }
        }
      }
    }
  `,
  cartQuery: `
    query cart($id: ID!) {
      cart(id: $id) {
        id
        totalQuantity
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    images(first: 1) {
                      edges {
                        node {
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `,
  cartCreate: `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          lines(first: 100) {
            edges {
              node {
                id
                merchandise {
                  ... on ProductVariant { id }
                }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `,
  cartLinesAdd: `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          lines(first: 100) {
            edges {
              node {
                id
                merchandise {
                  ... on ProductVariant { id }
                }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `,
  cartLinesUpdate: `
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }
  `,
  cartLinesRemove: `
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }
  `,
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { queryName, variables } = body;

    let resolvedQuery: string | undefined;

    if (queryName && typeof queryName === 'string') {
      resolvedQuery = ALLOWED_QUERIES[queryName];
      if (!resolvedQuery) {
        return new Response(
          JSON.stringify({ error: 'Invalid query name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (body.query && typeof body.query === 'string') {
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      const normalizedInput = normalize(body.query);
      const match = Object.values(ALLOWED_QUERIES).find(
        (q) => normalize(q) === normalizedInput
      );
      if (!match) {
        return new Response(
          JSON.stringify({ error: 'Query not allowed. Use queryName parameter instead.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      resolvedQuery = match;
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing queryName parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SHOPIFY_STOREFRONT_TOKEN = Deno.env.get('SHOPIFY_STOREFRONT_ACCESS_TOKEN');
    const SHOPIFY_STORE_DOMAIN = '0wk4nq-25.myshopify.com';
    const SHOPIFY_API_VERSION = '2025-07';

    if (!SHOPIFY_STOREFRONT_TOKEN) {
      console.error('Shopify storefront token not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shopifyUrl = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: resolvedQuery, variables: variables || {} }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Shopify storefront error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
