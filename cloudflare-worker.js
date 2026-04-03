/**
 * Cloudflare Worker — Per-request CSP nonce injection
 *
 * Deploy this worker on the route: your-domain.com/*
 *
 * How it works:
 *  1. Intercepts every request at Cloudflare's edge
 *  2. Fetches the response from your origin (Vercel, Pages, S3, etc.)
 *  3. For HTML responses: generates a fresh cryptographic nonce, stamps it
 *     onto every <script> and <link rel="modulepreload"> tag via HTMLRewriter,
 *     and sets the Content-Security-Policy header with that nonce.
 *  4. Non-HTML responses (JS, CSS, images) pass through untouched.
 *
 * Security notes:
 *  - script-src uses 'nonce-{nonce}' + 'strict-dynamic'. In browsers that
 *    support 'strict-dynamic', the 'self' token is ignored — it is kept only
 *    for legacy browser fallback. This app hosts no JSONP endpoints and no
 *    user-uploaded scripts, so 'self' does not introduce a bypass vector.
 *  - img-src uses *.amazonaws.com to cover S3 regional buckets
 *    (e.g. polymarket-static.s3.us-east-2.amazonaws.com). The pattern
 *    *.s3.amazonaws.com does NOT match regional buckets due to extra
 *    subdomain levels, which would silently break prediction market images.
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

    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",

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
      "https://fapi.asterdex.com",
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

    "frame-src 'self' s.tradingview.com www.paypal.com pay.coinbase.com challenges.cloudflare.com",
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

class ScriptNonceInjector {
  constructor(nonce) {
    this.nonce = nonce;
  }
  element(element) {
    element.setAttribute("nonce", this.nonce);
  }
}

export default {
  async fetch(request, env) {
    const response = await fetch(request);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return response;
    }

    const nonce = generateNonce();
    const csp = buildCsp(nonce);

    const newHeaders = new Headers(response.headers);

    // Remove headers that the origin (Vercel) sets so we can set them once,
    // cleanly. Leaving duplicates causes browsers to see conflicting values
    // and security scanners to flag them.
    newHeaders.delete("Access-Control-Allow-Origin");
    newHeaders.delete("X-Frame-Options");
    newHeaders.delete("Strict-Transport-Security");
    newHeaders.delete("Cache-Control");

    newHeaders.set("Content-Security-Policy", csp);
    newHeaders.set("Cache-Control", "no-store");
    newHeaders.set("Access-Control-Allow-Origin", "https://pexly.app");
    newHeaders.set("X-Frame-Options", "DENY");
    newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

    return new HTMLRewriter()
      .on("script", new ScriptNonceInjector(nonce))
      .on('link[rel="modulepreload"]', new ScriptNonceInjector(nonce))
      .on('meta[property="csp-nonce"]', new ScriptNonceInjector(nonce))
      .transform(new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      }));
  },
};
