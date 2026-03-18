export default {
  async fetch(request, env) {
    const response = await fetch(request);
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) {
      return response;
    }

    // 128-bit cryptographically secure nonce per request
    const nonceBytes = new Uint8Array(16);
    crypto.getRandomValues(nonceBytes);
    const nonce = btoa(String.fromCharCode(...nonceBytes));

    // Strip chat widgets on sensitive pages
    const url = new URL(request.url);
    const highRisk = /^\/(wallet|trade|withdraw|verification|account-settings)/.test(url.pathname);
    const thirdPartyScripts = highRisk
      ? ''
      : ' widget.intercom.io client.crisp.chat embed.tawk.to';

    const csp = [
      "default-src 'none'",
      `script-src 'nonce-${nonce}' 'strict-dynamic' 'sha256-SE/wwdnp45jsidi3f+z7BxWr1d9zBGC/+aUJKfvFPXo=' 'unsafe-inline' challenges.cloudflare.com s3.tradingview.com${thirdPartyScripts}`,
      `style-src 'nonce-${nonce}' 'unsafe-inline' fonts.googleapis.com`,
      "font-src 'self' fonts.gstatic.com data:",
      "img-src 'self' data: blob: hvpeycnedmzrjshmvgri.supabase.co your-bucket.r2.dev assets.coingecko.com api.coingecko.com flagcdn.com cdn.shopify.com *.reloadly.com cdn.jsdelivr.net images.unsplash.com raw.githubusercontent.com upload.wikimedia.org www.pexly.app pexly.app ui-avatars.com api.dicebear.com",
      "connect-src 'self' hvpeycnedmzrjshmvgri.supabase.co wss://hvpeycnedmzrjshmvgri.supabase.co your-bucket.r2.dev api.coingecko.com assets.coingecko.com api.binance.com binance.llamarpc.com eth.llamarpc.com api.blockchain.info blockchain.info blockstream.info mempool.space api.etherscan.io api.mainnet-beta.solana.com www.asterdex.com pay.coinbase.com api-iam.intercom.io www.staderlabs.com www.tradingview.com cdn.jsdelivr.net www.pexly.app pexly.app pexly.com api.ipify.org ipapi.co api.exchangerate-api.com",
      "frame-src 'self' s.tradingview.com www.sandbox.paypal.com pay.coinbase.com challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "block-all-mixed-content",
      "report-to csp-violations"
    ].join('; ');

    const reportTo = JSON.stringify({
      group: "csp-violations",
      max_age: 86400,
      endpoints: [{ url: "https://report.pexly.app/csp" }]
    });

    const rewriter = new HTMLRewriter()
      .on('script', { element: el => el.setAttribute('nonce', nonce) })
      .on('style',  { element: el => el.setAttribute('nonce', nonce) })
      .on('link[rel="stylesheet"]', { element: el => el.setAttribute('nonce', nonce) });

    const transformed = rewriter.transform(response);
    const headers = new Headers(transformed.headers);

    headers.set('Content-Security-Policy', csp);
    headers.set('Report-To', reportTo);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    headers.set('Cache-Control', 'no-store, private');
    headers.delete('ETag');
    headers.delete('Last-Modified');

    return new Response(transformed.body, {
      status: transformed.status,
      statusText: transformed.statusText,
      headers,
    });
  }
}
