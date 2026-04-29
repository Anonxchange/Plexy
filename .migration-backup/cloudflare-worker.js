/**
 * Cloudflare Worker — Per-request CSP nonce injection + origin proxy
 *
 * Deploy this worker on the route: pexly.app/*
 *
 * Required Worker environment variables (set in Cloudflare dashboard):
 *   ORIGIN_URL      — upstream origin, e.g. https://your-project.vercel.app
 *   ALLOWED_ORIGINS — comma-separated list of allowed CORS origins, e.g.
 *                     https://pexly.app,https://www.pexly.app
 *                     If unset, no Access-Control-Allow-Origin header is sent.
 *
 * How it works:
 *  1. Intercepts every request at Cloudflare's edge
 *  2. Rewrites the request to ORIGIN_URL (your Vercel deployment)
 *  3. For HTML responses: generates a fresh cryptographic nonce, stamps it
 *     onto every <script>, <style>, <link rel="stylesheet">, and
 *     <link rel="modulepreload"> tag via HTMLRewriter, and sets the
 *     Content-Security-Policy header with that nonce.
 *  4. Non-HTML responses (JS, CSS, images) pass through to the origin untouched.
 *  5. Upstream errors (origin down / timeout) return a clean 502 response.
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

export default {
  async fetch(request, env) {
    // ORIGIN_URL must be set in the Cloudflare Worker environment variables.
    const originUrl = env.ORIGIN_URL;
    if (!originUrl) {
      return new Response(
        "Worker misconfigured: ORIGIN_URL environment variable is not set.",
        { status: 500 }
      );
    }

    const url = new URL(request.url);
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

    return new HTMLRewriter()
      .on("script", new NonceInjector(nonce))
      .on("style", new NonceInjector(nonce))
      // Nonce both stylesheet links and modulepreload links — both fall under
      // style-src-elem / script-src respectively and require a valid nonce.
      .on('link[rel="stylesheet"]', new NonceInjector(nonce))
      .on('link[rel="modulepreload"]', new NonceInjector(nonce))
      .on('meta[property="csp-nonce"]', new NonceCspMetaInjector(nonce))
      .on('meta[name="cf-country"]', new CountryMetaInjector(country))
      .transform(new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      }));
  },
};
