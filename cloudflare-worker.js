/**
 * Cloudflare Worker — CSP nonce injection + origin proxy + shop SEO prerender
 *
 * Deploy this worker on the route: pexly.app/*
 *
 * Required Worker environment variables (set in Cloudflare dashboard):
 *   ORIGIN_URL        — upstream origin, e.g. https://your-project.vercel.app
 *   ALLOWED_ORIGINS   — comma-separated list of allowed CORS origins, e.g.
 *                       https://pexly.app,https://www.pexly.app
 *                       If unset, no Access-Control-Allow-Origin header is sent.
 *   SUPABASE_URL      — your Supabase project URL, e.g. https://xxx.supabase.co
 *   SUPABASE_ANON_KEY    — Supabase anon/public key (already public in your JS bundle)
 *
 * How it works:
 *  1. Intercepts every request at Cloudflare's edge.
 *  2. For /shop and /shop/product/:handle: fetches product data from Supabase
 *     (result cached in Cloudflare's Cache API for 1 hour), then uses
 *     HTMLRewriter to inject product-specific SEO tags in one streaming pass.
 *  3. Rewrites the request to ORIGIN_URL (your Vercel deployment).
 *  4. For HTML responses: generates a fresh cryptographic nonce, stamps it
 *     onto every <script>, <style>, <link rel="stylesheet">, and
 *     <link rel="modulepreload"> tag via HTMLRewriter, and sets the
 *     Content-Security-Policy header with that nonce.
 *  5. Non-HTML responses (JS, CSS, images) pass through to the origin untouched.
 *  6. Upstream errors (origin down / timeout) return a clean 502 response.
 */

// ---------------------------------------------------------------------------
// CSP
// ---------------------------------------------------------------------------

function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildCsp(nonce) {
  const directives = [
    "default-src 'none'",

    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' challenges.cloudflare.com s3.tradingview.com static.cloudflareinsights.com`,

    `style-src-elem 'self' 'nonce-${nonce}' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=' 'sha256-nzTgYzXYDNe6BAHiiI7NNlfK8n/auuOAhh2t92YvuXo=' 'sha256-CIxDM5jnsGiKqXs2v7NKCY5MzdR9gu6TtiMJrDw29AY=' 'sha256-JyHF32z4Ou/Ujas95CX3WgBqlTt7Dxzo/fQG5/5oBo8=' 'sha256-YIjArHm2rkb5J7hX9lUM1bnQ3Kp61MTfluMGkuyKwDw=' fonts.googleapis.com`,
    "style-src-attr 'none'",

    "font-src 'self' fonts.gstatic.com data:",

    [
      "img-src 'self' data: blob:",
      "hvpeycnedmzrjshmvgri.supabase.co",
      "pub-1d1c072ba4084950addc61f4dd8d95a3.r2.dev",
      "assets.coingecko.com",
      "api.coingecko.com",
      "flagcdn.com",
      "cdn.shopify.com",
      "*.reloadly.com",
      "*.amazonaws.com",
      "cdn.rocketx.exchange",
      "cdn.jsdelivr.net",
      "images.unsplash.com",
      "raw.githubusercontent.com",
      "www.pexly.app",
      "pexly.app",
      "ui-avatars.com",
      "api.dicebear.com",
      "polymarket.com",
      "*.polymarket.com",
    ].join(" "),

    [
      "connect-src 'self'",
      "hvpeycnedmzrjshmvgri.supabase.co",
      "wss://hvpeycnedmzrjshmvgri.supabase.co",
      "pub-1d1c072ba4084950addc61f4dd8d95a3.r2.dev",
      "api.coingecko.com",
      "assets.coingecko.com",
      "api.binance.com",
      "binance.llamarpc.com",
      "eth.llamarpc.com",
      "api.blockchain.info",
      "blockchain.info",
      "blockstream.info",
      "mempool.space",
      "static.cloudflareinsights.com",
      "api.etherscan.io",
      "api.mainnet-beta.solana.com",
      "www.asterdex.com",
      "sapi.asterdex.com",
      "fapi.asterdex.com",
      "pay.coinbase.com",
      "www.staderlabs.com",
      "www.tradingview.com",
      "cdn.jsdelivr.net",
      "www.pexly.app",
      "pexly.app",
      "api.ipify.org",
      "ipapi.co",
      "api.exchangerate-api.com",
    ].join(" "),

    "frame-src 'self' s.tradingview.com www.tradingview-widget.com www.paypal.com pay.coinbase.com challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "block-all-mixed-content",
  ];

  return directives.join("; ");
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

function getAllowedOrigin(request, env) {
  const requestOrigin = request.headers.get("Origin");
  if (!requestOrigin || !env.ALLOWED_ORIGINS) return null;
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
  return allowed.includes(requestOrigin) ? requestOrigin : null;
}

// ---------------------------------------------------------------------------
// HTMLRewriter handlers
// ---------------------------------------------------------------------------

class NonceInjector {
  constructor(nonce) { this.nonce = nonce; }
  element(element) { element.setAttribute("nonce", this.nonce); }
}

class CountryMetaInjector {
  constructor(country) { this.country = country; }
  element(element) {
    if (this.country) element.setAttribute("content", this.country);
  }
}

class NonceCspMetaInjector {
  constructor(nonce) { this.nonce = nonce; }
  element(element) { element.setAttribute("content", this.nonce); }
}

class RemoveElement {
  element(element) { element.remove(); }
}

class InjectSeoIntoHead {
  constructor(html) { this.html = html; this.done = false; }
  element(element) {
    if (!this.done) {
      element.prepend(this.html, { html: true });
      this.done = true;
    }
  }
}

// ---------------------------------------------------------------------------
// SEO helpers
// ---------------------------------------------------------------------------

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html) {
  return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
}

function buildProductSeoTags(product, handle) {
  const origin = "https://www.pexly.app";
  const url = `${origin}/shop/product/${encodeURIComponent(handle)}`;
  const title = esc(product.title);
  const rawDesc = product.description || product.descriptionHtml || "";
  const description = esc(stripHtml(rawDesc) || `Buy ${product.title} with cryptocurrency on Pexly.`);
  const image =
    product.images?.edges?.[0]?.node?.url ||
    product.featuredImage?.url ||
    `${origin}/hero-bg.webp`;
  const price = product.priceRange?.minVariantPrice?.amount ||
    product.variants?.edges?.[0]?.node?.price?.amount || "0";
  const currency = product.priceRange?.minVariantPrice?.currencyCode ||
    product.variants?.edges?.[0]?.node?.price?.currencyCode || "USD";
  const available = product.availableForSale !== false;

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.title,
        description: stripHtml(rawDesc).slice(0, 5000),
        url,
        image: [image],
        offers: {
          "@type": "Offer",
          price: parseFloat(price).toFixed(2),
          priceCurrency: currency,
          availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url,
          seller: { "@type": "Organization", name: "Pexly", url: origin },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${origin}/shop` },
          { "@type": "ListItem", position: 3, name: product.title, item: url },
        ],
      },
    ],
  });

  return `<title>${title} | Pexly Shop</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product">
<meta property="og:title" content="${title} | Pexly Shop">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="Pexly">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} | Pexly Shop">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${esc(image)}">
<script type="application/ld+json">${schema}</script>`;
}

function buildShopSeoTags() {
  const origin = "https://www.pexly.app";
  const url = `${origin}/shop`;
  const title = "Crypto Shop — Buy Products with Cryptocurrency | Pexly";
  const description = "Discover products and services from sellers worldwide. Pay directly with Bitcoin, Ethereum, USDT, and more cryptocurrencies on Pexly.";

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: title,
        description,
        isPartOf: { "@id": `${origin}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: "Shop", item: url },
        ],
      },
    ],
  });

  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="Pexly">
<script type="application/ld+json">${schema}</script>`;
}

// ---------------------------------------------------------------------------
// Supabase product fetch — result cached in Cloudflare Cache API for 1 hour
// ---------------------------------------------------------------------------

async function fetchProductByHandle(handle, env, ctx) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;

  const cacheKey = new Request(
    `https://pexly-cache.internal/product/${encodeURIComponent(handle)}`
  );
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) {
    try { return await cached.json(); } catch { /* fall through to fetch */ }
  }

  try {
    const res = await fetch(`${env.SUPABASE_URL}/functions/v1/shopify-storefront`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ queryName: "getProductByHandle", variables: { handle } }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const product = json?.data?.productByHandle ?? null;
    if (product) {
      ctx.waitUntil(
        cache.put(
          cacheKey,
          new Response(JSON.stringify(product), {
            headers: { "Cache-Control": "public, max-age=3600" },
          })
        )
      );
    }
    return product;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const originUrl = env.ORIGIN_URL;
    if (!originUrl) {
      return new Response(
        "Worker misconfigured: ORIGIN_URL environment variable is not set.",
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Proxy /sitemap-products.xml → Supabase sitemap-products Edge Function
    // This keeps the URL on www.pexly.app so Google Search Console accepts it.
    if (path === "/sitemap-products.xml") {
      if (!env.SUPABASE_URL) {
        return new Response("SUPABASE_URL not configured", { status: 500 });
      }
      try {
        const sitemapRes = await fetch(
          `${env.SUPABASE_URL}/functions/v1/sitemap-products`,
          { headers: { "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}` } }
        );
        const xml = await sitemapRes.text();
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        });
      } catch {
        return new Response(
          '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
          { status: 502, headers: { "Content-Type": "application/xml; charset=utf-8" } }
        );
      }
    }

    // Determine if this is a shop page that needs SEO injection
    const isProductPage = path.startsWith("/shop/product/");
    const isShopPage = path === "/shop" || path === "/shop/";
    const needsSeo = isProductPage || isShopPage;

    // Fetch product data ahead of proxying (only for product pages)
    let seoTags = "";
    if (isProductPage) {
      const handle = path.replace("/shop/product/", "").replace(/\/$/, "").split("?")[0];
      const product = await fetchProductByHandle(handle, env, ctx);
      if (product) seoTags = buildProductSeoTags(product, handle);
    } else if (isShopPage) {
      seoTags = buildShopSeoTags();
    }

    // Proxy request to origin
    const originRequest = new Request(
      originUrl.replace(/\/$/, "") + url.pathname + url.search,
      {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: "follow",
      }
    );

    let response;
    try {
      response = await fetch(originRequest);
    } catch {
      return new Response(
        "Service temporarily unavailable. Please try again later.",
        { status: 502, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return response;
    }

    const nonce = generateNonce();
    const csp = buildCsp(nonce);
    const country = request.cf?.country ?? "";

    const newHeaders = new Headers(response.headers);
    newHeaders.delete("Access-Control-Allow-Origin");
    newHeaders.delete("X-Frame-Options");
    newHeaders.delete("Strict-Transport-Security");
    newHeaders.delete("Cache-Control");
    newHeaders.set("Content-Security-Policy", csp);
    newHeaders.set("Cache-Control", "no-store");
    newHeaders.set("X-Frame-Options", "DENY");
    newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

    const allowedOrigin = getAllowedOrigin(request, env);
    if (allowedOrigin) {
      newHeaders.set("Access-Control-Allow-Origin", allowedOrigin);
      newHeaders.append("Vary", "Origin");
    }

    let rewriter = new HTMLRewriter()
      .on("script", new NonceInjector(nonce))
      .on("style", new NonceInjector(nonce))
      .on('link[rel="stylesheet"]', new NonceInjector(nonce))
      .on('link[rel="modulepreload"]', new NonceInjector(nonce))
      .on('meta[property="csp-nonce"]', new NonceCspMetaInjector(nonce))
      .on('meta[name="cf-country"]', new CountryMetaInjector(country));

    // For shop pages: strip generic tags and inject product-specific ones
    if (needsSeo && seoTags) {
      rewriter = rewriter
        .on("title", new RemoveElement())
        .on('meta[name="description"]', new RemoveElement())
        .on('meta[property^="og:"]', new RemoveElement())
        .on('meta[name^="twitter:"]', new RemoveElement())
        .on('link[rel="canonical"]', new RemoveElement())
        .on("head", new InjectSeoIntoHead(seoTags));
    }

    return rewriter.transform(
      new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
    );
  },
};
