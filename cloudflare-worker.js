/**
 * Cloudflare Worker — Per-request CSP nonce injection + origin proxy
 *
 * Deploy this worker on the route: pexly.app/*
 *
 * Required Worker environment variables (set in Cloudflare dashboard):
 *   ORIGIN_URL — the upstream origin, e.g. https://your-app.replit.app
 *
 * How it works:
 *  1. Intercepts every request at Cloudflare's edge
 *  2. Rewrites the request to ORIGIN_URL (your Replit deployment)
 *  3. For HTML responses: generates a fresh cryptographic nonce, stamps it
 *     onto every <script>, <style>, and <link rel="modulepreload"> tag via
 *     HTMLRewriter, and sets the Content-Security-Policy header with that nonce.
 *  4. Non-HTML responses (JS, CSS, images) pass through to the origin untouched.
 *
 * Security notes:
 *  - script-src uses 'nonce-{nonce}' + 'strict-dynamic'. In browsers that
 *    support 'strict-dynamic', the 'self' token is ignored — it is kept only
 *    for legacy browser fallback.
 *  - style-src uses 'nonce-{nonce}' instead of 'unsafe-inline'. The HTMLRewriter
 *    stamps nonces onto all <style> elements in the HTML. Note: inline style=""
 *    attributes used by JS libraries (animations, positioning) are a separate
 *    vector controlled by style-src-attr; those are covered by 'unsafe-inline'
 *    only on that sub-directive if you split directives, but most browsers that
 *    enforce style-src don't yet split the two, so nonce on <style> elements is
 *    the practical win here.
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

    // 'unsafe-inline' removed — nonce is injected onto every <style> element by HTMLRewriter.
    // JS-injected inline style *attributes* (style="...") are a separate surface; split
    // style-src-elem / style-src-attr if you need finer control in future.
    `style-src 'self' 'nonce-${nonce}' fonts.googleapis.com`,

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

class NonceInjector {
  constructor(nonce) {
    this.nonce = nonce;
  }
  element(element) {
    element.setAttribute("nonce", this.nonce);
  }
}

export default {
  async fetch(request, env) {
    // ORIGIN_URL must be set in the Cloudflare Worker environment variables.
    // Example: https://your-app.replit.app
    // This is the fix for the "wrong layer" problem — the old code used
    // fetch(request) which passes the request URL straight through. When the
    // Worker is deployed on pexly.app, that creates a loop (or hits nothing
    // after migrating away from Vercel). We now explicitly rewrite the origin.
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

    const response = await fetch(originRequest);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return response;
    }

    const nonce = generateNonce();
    const csp = buildCsp(nonce);

    const newHeaders = new Headers(response.headers);

    // Remove headers that the origin may set so we own them cleanly here.
    // Duplicates cause browsers and security scanners to see conflicting values.
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
      .on("script", new NonceInjector(nonce))
      .on("style", new NonceInjector(nonce))
      .on('link[rel="modulepreload"]', new NonceInjector(nonce))
      .on('meta[property="csp-nonce"]', new NonceInjector(nonce))
      .transform(new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      }));
  },
};
