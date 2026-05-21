/**
 * Cloudflare Worker — Per-request CSP nonce injection + origin proxy + shop SEO prerender
 *
 * Deploy this worker on the route: pexly.app/*
 *
 * Required Worker environment variables (set in Cloudflare dashboard):
 *   ORIGIN_URL        — upstream origin, e.g. https://your-project.vercel.app
 *   ALLOWED_ORIGINS   — comma-separated list of allowed CORS origins, e.g.
 *                       https://pexly.app,https://www.pexly.app
 *                       If unset, no Access-Control-Allow-Origin header is sent.
 *   SUPABASE_URL      — your Supabase project URL, e.g. https://xxx.supabase.co
 *   SUPABASE_ANON_KEY — Supabase anon/public key (already public in your JS bundle)
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
 *
 * Security notes:
 *  - script-src uses 'nonce-{nonce}' + 'strict-dynamic'. In browsers that
 *    support 'strict-dynamic', the 'self' token is ignored — it is kept only
 *    for legacy browser fallback.
 *  - style-src-elem uses 'nonce-{nonce}': HTMLRewriter stamps nonces onto all
 *    <style> elements and <link rel="stylesheet"> tags so no stylesheet can be
 *    injected without a valid nonce.
 *  - style-src-attr is 'none': blocks all inline style="" HTML attributes and
 *    setAttribute('style',…) calls. Per the CSP spec, el.style.x = '…' (DOM
 *    property access) is NOT covered by this directive and continues to work,
 *    so Framer Motion, Radix UI, and similar libraries are unaffected.
 *  - img-src uses *.amazonaws.com to cover S3 regional buckets
 *    (e.g. polymarket-static.s3.us-east-2.amazonaws.com). The pattern
 *    *.s3.amazonaws.com does NOT match regional buckets due to extra
 *    subdomain levels, which would silently break prediction market images.
 *  - CORS: the Access-Control-Allow-Origin header reflects the request's Origin
 *    only if it appears in the ALLOWED_ORIGINS env variable. No wildcard is used.
 */

function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildCsp(nonce) {
  const directives = [
    "default-src 'none'",

    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' challenges.cloudflare.com s3.tradingview.com static.cloudflareinsights.com`,

    // style-src is split into two sub-directives (CSP Level 3):
    //
    //   style-src-elem — governs <style> elements and <link rel="stylesheet">.
    //                    Nonce is injected by HTMLRewriter onto both; no unsafe-inline needed.
    //
    //   style-src-attr — governs inline style="" HTML attributes and setAttribute('style',…).
    //                    Set to 'none' to block all inline style attribute injection.
    //                    Per MDN spec, this does NOT block el.style.color = 'red' (DOM property
    //                    access) — only the HTML attribute/setAttribute path is blocked.
    //                    Framer Motion, Radix UI and similar libraries use DOM property access
    //                    (el.style.transform, el.style.opacity, etc.), so they are unaffected.
    // style-src — CSP Level 2 fallback for browsers that do not support the
    // Level 3 sub-directives style-src-elem / style-src-attr (iOS Safari < 15.4,
    // older Android WebView). When those browsers see only the sub-directives they
    // ignore them and fall back to style-src; without it they'd fall back all the
    // way to default-src 'none', which blocks every stylesheet and breaks the UI.
    //
    // 'unsafe-inline' here is intentionally safe: browsers that understand nonces
    // (all modern browsers) treat 'unsafe-inline' as completely inert when a nonce
    // is also present — so it has zero effect on them. It only provides the escape
    // hatch for the older engines that don't parse style-src-elem at all.
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' fonts.googleapis.com`,

    // Hashes for <style> elements dynamically injected by JavaScript at runtime.
    // HTMLRewriter can only nonce elements in the initial HTML; JS-created <style>
    // tags must be covered by their content hash OR by a propagated nonce.
    //
    // Primary fix: the app reads the nonce from <meta property="csp-nonce"> at
    // startup and calls setNonce() from get-nonce. react-style-singleton (used by
    // react-remove-scroll, and therefore all Radix Dialog/Dropdown/Popover/Tooltip
    // components) reads getNonce() and stamps the nonce onto every <style> it
    // creates — so those elements are covered by the nonce, not by hashes.
    //
    // Hashes below are kept as a fallback for any edge cases:
    // sha256-47DE... — SHA-256 of empty string. Vite CSS code-splitting injects
    //                   empty <style> placeholders; no exploitable content.
    // sha256-nzTg... — react-remove-scroll scroll-lock style (react-remove-scroll v2.x).
    // sha256-CIxD... — react-remove-scroll scroll-lock style (react-remove-scroll-bar v2.3+).
    // sha256-JyHF... — TradingView advanced chart widget inline style injection.
    // sha256-YIjA... — vaul drawer component inline style injection.
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
      // *.amazonaws.com covers all S3 regional buckets
      // (e.g. polymarket-static.s3.us-east-2.amazonaws.com).
      // The narrower *.s3.amazonaws.com does not match regional variants.
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
      "developers.cjdropshipping.com",
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

/**
 * Returns the Access-Control-Allow-Origin value to use, or null if the
 * request's Origin is not in the ALLOWED_ORIGINS env list.
 * Never uses a wildcard — only reflects exact matches.
 */
function getAllowedOrigin(request, env) {
  const requestOrigin = request.headers.get("Origin");
  if (!requestOrigin || !env.ALLOWED_ORIGINS) return null;

  const allowed = env.ALLOWED_ORIGINS
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return allowed.includes(requestOrigin) ? requestOrigin : null;
}

// ---------------------------------------------------------------------------
// HTMLRewriter handlers
// ---------------------------------------------------------------------------

class NonceInjector {
  constructor(nonce) {
    this.nonce = nonce;
  }
  element(element) {
    element.setAttribute("nonce", this.nonce);
  }
}

// Writes the Cloudflare-resolved country code (ISO 3166-1 alpha-2, e.g. "US") into
// the `content` attribute of <meta name="cf-country">. The client reads this at
// startup so it never needs to make an external IP-geolocation API call in production.
class CountryMetaInjector {
  constructor(country) {
    this.country = country;
  }
  element(element) {
    if (this.country) {
      element.setAttribute("content", this.country);
    }
  }
}

// Writes the nonce into the `content` attribute of <meta property="csp-nonce">.
// Using `content` (not `nonce`) avoids Chrome's nonce-hiding behaviour, which
// can suppress getAttribute("nonce") on non-script/style elements in some
// browser versions. JavaScript reads meta[content] safely via getAttribute.
class NonceCspMetaInjector {
  constructor(nonce) {
    this.nonce = nonce;
  }
  element(element) {
    element.setAttribute("content", this.nonce);
  }
}

// Removes an element entirely from the HTML stream.
// Used to strip generic <title>, <meta name="description">, og: and twitter:
// tags from the React app's index.html before injecting product-specific ones.
class RemoveElement {
  element(element) {
    element.remove();
  }
}

// Prepends raw HTML into the first matching element (used on <head>).
// The `done` flag ensures we only inject once even if HTMLRewriter
// fires the handler for multiple <head> tags (e.g. in malformed HTML).
class InjectSeoIntoHead {
  constructor(html) {
    this.html = html;
    this.done = false;
  }
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
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

function buildProductSeoTags(product, handle) {
  const origin = "https://www.pexly.app";
  const url = `${origin}/shop/product/${encodeURIComponent(handle)}`;
  const title = esc(product.title);
  const rawDesc = product.description || product.descriptionHtml || "";
  const description = esc(
    stripHtml(rawDesc) || `Buy ${product.title} with cryptocurrency on Pexly.`
  );
  const image =
    product.images?.edges?.[0]?.node?.url ||
    product.featuredImage?.url ||
    `${origin}/hero-bg.webp`;
  const price =
    product.priceRange?.minVariantPrice?.amount ||
    product.variants?.edges?.[0]?.node?.price?.amount ||
    "0";
  const currency =
    product.priceRange?.minVariantPrice?.currencyCode ||
    product.variants?.edges?.[0]?.node?.price?.currencyCode ||
    "USD";
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
          availability: available
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
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
  const description =
    "Discover products and services from sellers worldwide. Pay directly with Bitcoin, Ethereum, USDT, and more cryptocurrencies on Pexly.";

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
    try {
      return await cached.json();
    } catch {
      // fall through to live fetch
    }
  }

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/functions/v1/shopify-storefront`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ queryName: "getProductByHandle", variables: { handle } }),
      }
    );
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
    // ORIGIN_URL must be set in the Cloudflare Worker environment variables.
    const originUrl = env.ORIGIN_URL;
    if (!originUrl) {
      return new Response(
        "Worker misconfigured: ORIGIN_URL environment variable is not set.",
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Proxy /sitemap-products.xml → Supabase sitemap-products Edge Function.
    // This keeps the URL on www.pexly.app so Google Search Console accepts it.
    if (path === "/sitemap-products.xml") {
      if (!env.SUPABASE_URL) {
        return new Response("SUPABASE_URL not configured", { status: 500 });
      }
      try {
        const sitemapRes = await fetch(
          `${env.SUPABASE_URL}/functions/v1/sitemap-products`,
          { headers: { Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` } }
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
      const handle = path
        .replace("/shop/product/", "")
        .replace(/\/$/, "")
        .split("?")[0];
      const product = await fetchProductByHandle(handle, env, ctx);
      if (product) seoTags = buildProductSeoTags(product, handle);
    } else if (isShopPage) {
      seoTags = buildShopSeoTags();
    }

    const originRequest = new Request(
      originUrl.replace(/\/$/, "") + url.pathname + url.search,
      {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: "follow",
      }
    );

    // Fetch from upstream with graceful error handling.
    // Network errors (origin down, DNS failure, timeout) throw — catch them
    // and return a clean 502 so users see a meaningful error, not a crash page.
    let response;
    try {
      response = await fetch(originRequest);
    } catch {
      return new Response(
        "Service temporarily unavailable. Please try again later.",
        {
          status: 502,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return response;
    }

    const nonce = generateNonce();
    const csp = buildCsp(nonce);

    const newHeaders = new Headers(response.headers);

    // Remove headers the origin may set so we own them cleanly here.
    // Duplicates cause browsers and security scanners to see conflicting values.
    newHeaders.delete("Access-Control-Allow-Origin");
    newHeaders.delete("X-Frame-Options");
    newHeaders.delete("Strict-Transport-Security");
    newHeaders.delete("Cache-Control");

    newHeaders.set("Content-Security-Policy", csp);
    newHeaders.set("Cache-Control", "no-store");
    newHeaders.set("X-Frame-Options", "DENY");
    newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

    // Reflect the request's Origin only if it is in the ALLOWED_ORIGINS allowlist.
    // If no match (or no Origin header), the ACAO header is omitted entirely —
    // which is correct for same-origin navigations and does not break the app.
    const allowedOrigin = getAllowedOrigin(request, env);
    if (allowedOrigin) {
      newHeaders.set("Access-Control-Allow-Origin", allowedOrigin);
      // Vary tells caches that the response differs by Origin.
      newHeaders.append("Vary", "Origin");
    }

    const country = request.cf?.country ?? "";

    let rewriter = new HTMLRewriter()
      .on("script", new NonceInjector(nonce))
      .on("style", new NonceInjector(nonce))
      // Nonce both stylesheet links and modulepreload links — both fall under
      // style-src-elem / script-src respectively and require a valid nonce.
      .on('link[rel="stylesheet"]', new NonceInjector(nonce))
      .on('link[rel="modulepreload"]', new NonceInjector(nonce))
      .on('meta[property="csp-nonce"]', new NonceCspMetaInjector(nonce))
      .on('meta[name="cf-country"]', new CountryMetaInjector(country));

    // For shop pages: strip generic tags from index.html and inject
    // product-specific title, description, og:, twitter:, and JSON-LD schema.
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
