import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT ?? "5000", 10);
const DIST = path.resolve(__dirname, "../dist");
const PLACEHOLDER = "CSP_NONCE_PLACEHOLDER";

function buildCsp(nonce: string): string {
  return [
    "default-src 'none'",

    // nonce authorises Vite-injected tags + JSON-LD; strict-dynamic lets
    // those scripts load further scripts without individually listing them
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' challenges.cloudflare.com s3.tradingview.com static.cloudflareinsights.com`,

    // nonce replaces unsafe-inline for all inline styles Vite may inject
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
      "s3.amazonaws.com",
      "*.s3.amazonaws.com",
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
  ].join("; ");
}

app.use(
  "/assets",
  express.static(path.join(DIST, "assets"), {
    maxAge: "1y",
    immutable: true,
  })
);

app.use(express.static(DIST, { index: false }));

app.get("*", (_req, res) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  const csp = buildCsp(nonce);

  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store");

  let html = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");
  html = html.replaceAll(PLACEHOLDER, nonce);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
