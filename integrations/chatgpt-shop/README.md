# Pexly ChatGPT Shop MCP

A separate, read-only Cloudflare Worker for ChatGPT product discovery. It does not change the Pexly website proxy, Shopify checkout, wallet, or payment code.

## Tools

- `search_products({ query, limit? })`: bounded public product search, max 10 results.
- `get_product_details({ handle })`: public details for one product.

The service calls the existing Supabase `shopify-storefront` Edge Function using only the existing Storefront allowlist operation names. It never accepts raw GraphQL, arbitrary function names, SQL, or payment commands. Product results are cached at Cloudflare's edge for 60 seconds by default (configurable, maximum effective TTL 300 seconds).

## Configure

Prerequisites: Node.js and a Cloudflare account with Workers enabled.

From this directory:

```sh
npm create cloudflare@latest -- --existing-script
```

Alternatively install Wrangler in a local working copy and deploy this directory using your normal Cloudflare workflow. Keep this Worker separate from the production `pexly.app/*` proxy.

Set the Supabase public/anon key as a Worker secret (do not commit it):

```sh
npx wrangler secret put SUPABASE_ANON_KEY
```

Optional: protect the endpoint with a bearer token. If configured, ChatGPT must send that token as an Authorization header.

```sh
npx wrangler secret put MCP_ACCESS_TOKEN
```

Deploy:

```sh
npx wrangler deploy
```

The public test URL is the Workers.dev URL shown by Wrangler. Check `/health` first. The MCP endpoint is `/mcp`.

## Important rollout checks

1. Verify the deployed Edge Function accepts the public/anon key and that its query allowlist includes `getProducts` and `getProductByHandle`.
2. Test with a real published product and confirm the returned product URL opens `https://pexly.app/shop/product/{handle}`.
3. Configure Cloudflare rate limiting for `/mcp` before broad public promotion. The application bounds request size, search length, result count, and upstream timeout; platform rate limiting is still recommended.
4. Connect the HTTPS MCP endpoint to ChatGPT and test tool discovery before announcing it.
5. This initial endpoint is read-only. Do not add checkout or payment tools until the existing payment webhook lifecycle has been reviewed.

## Quota notes

Cache hits do not invoke Supabase. Cache misses call the existing `shopify-storefront` Edge Function once. Cloudflare Cache API entries are data-center-local, so this reduces repeat calls but does not guarantee a global cache hit. No new Supabase tables or schema migrations are needed for this MVP.
