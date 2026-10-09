# Connect Pexly Shop to ChatGPT

Pexly Shop is a custom ChatGPT app backed by a read-only MCP server. The first version searches the public Shopify catalogue and displays product cards; checkout remains on Pexly.

## What is implemented

- MCP tools: `search_products` and `get_product_details`
- ChatGPT product-card UI resource: `ui://widget/pexly-shop-v1.html`
- Read-only tool annotations and bounded search results
- Dedicated Cloudflare Worker configuration, separate from the existing Pexly website proxy

## Before connecting it

1. Deploy the Worker from the repository root:

   ```sh
   npx wrangler deploy --config integrations/chatgpt-shop/wrangler.toml
   ```

2. Set the Supabase publishable key as a Worker secret (never commit keys):

   ```sh
   npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
   ```

3. Deploy again after setting the secret:

   ```sh
   npx wrangler deploy --config integrations/chatgpt-shop/wrangler.toml
   ```

4. Open the Worker URL ending in `/health`. It should return the service health JSON.
5. Test the MCP endpoint using an MCP Inspector or a client that supports Streamable HTTP. Verify `initialize`, `tools/list`, `resources/read`, and `tools/call`.
6. Search for a real published product and confirm its image, price, availability and product link are correct.

Do not set `MCP_ACCESS_TOKEN` for the initial ChatGPT connection unless the client has a configured way to supply that bearer token. For a public product catalogue, leave the endpoint read-only and add Cloudflare rate limiting before public promotion. If authentication is required, implement the supported OAuth flow instead of relying on a shared secret.

## Connect in ChatGPT

Use ChatGPT on the web and follow OpenAI's current developer instructions for creating and testing a custom app with a remote MCP server:

- Apps SDK quickstart: https://developers.openai.com/plugins/build/app-quickstart
- Build an MCP server: https://developers.openai.com/plugins/build/mcp-server
- Add UI to an MCP server: https://developers.openai.com/plugins/build/chatgpt-ui

Use the deployed HTTPS Worker endpoint ending in `/mcp`. Test it privately before submitting or publishing the app. The exact app-creation controls and availability depend on the current ChatGPT account/workspace.

## Important limitations

- This MVP only discovers products. It does not create orders, charge wallets, or confirm payment.
- The app is not deployed by committing code to GitHub. Cloudflare deployment and ChatGPT connection are separate steps.
- Confirm that the existing `shopify-storefront` Edge Function accepts the configured publishable key and enforces its own allowed operations. A publishable key is not a substitute for authorization.
- Do not use a Supabase service-role key in this Worker.
