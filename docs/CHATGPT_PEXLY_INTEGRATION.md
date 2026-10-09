# Pexly + ChatGPT Shop Integration

## Goal

Expose Pexly's existing product catalog to ChatGPT without rebuilding Pexly.app or granting ChatGPT direct, unrestricted access to Supabase.

## Architecture

ChatGPT app (Apps SDK UI + MCP tools) -> authenticated Pexly MCP/API service -> narrowly scoped Supabase queries and existing Shopify catalog function.

Pexly.app remains the canonical website, wallet, checkout, order history, and fulfillment experience. The ChatGPT integration must not read wallet secrets, seed phrases, private keys, or browser vault data.

## MVP scope

1. Read-only product discovery:
   - `search_products`: search published, available products using bounded query, category, and pagination inputs.
   - `get_product_details`: fetch one public product by a stable product ID/handle.
2. Return only approved public fields: product ID/handle, title, short description, images, price/currency, availability, and canonical Pexly URL.
3. Link to the canonical Pexly product page for checkout in the first iteration.
4. Add a ChatGPT-specific interactive UI only if it improves the flow; do not duplicate the full Pexly storefront.
5. Add order creation/payment tools only after product reads are verified and the existing payment lifecycle and webhook verification have been audited.

## Security requirements

- The Supabase project URL and publishable/anon key are not secret credentials, but they are not authorization controls. RLS and database grants must independently protect every table.
- Never place Supabase secret/service-role keys, database passwords, NOWPayments API secrets, or webhook secrets in ChatGPT tool definitions, client code, MCP responses, or logs.
- Do not expose unrestricted SQL, generic table access, arbitrary Edge Function invocation, wallet operations, or admin operations as MCP tools.
- Use a server-side adapter with a narrow allowlist of actions and strict input validation, bounded pagination, rate limiting, and safe output schemas.
- Prefer public catalog data only for the first milestone. If the catalog is private, use a server-side secret only in a trusted deployment environment and enforce explicit published-product filters.
- For user-specific actions later, use a supported authentication/OAuth flow and authorize every request. Never accept a user ID supplied by the model as proof of identity.
- Treat all prices, stock, and payment statuses as server-authoritative. ChatGPT text or a client callback is never proof of payment.

## Repository observations

- The existing frontend is React/TypeScript/Vite with Wouter and Supabase.
- The current Shop uses a Shopify Storefront Edge Function and a Shopify-hosted checkout URL for Shopify items.
- The existing Supabase browser client uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Existing crypto checkout uses a `nowpayments` Edge Function. Its server implementation and authoritative webhook/IPN handling must be located and reviewed before any order/payment integration.
- Do not replace or break the existing Shopify cart or checkout while introducing ChatGPT discovery.

## Deployment decision

Before implementation, confirm where the MCP endpoint will run. A dedicated Cloudflare Worker is a reasonable option given the existing Cloudflare setup, but it must be a separate, narrowly scoped route/service rather than adding unreviewed MCP behavior to the current security/SEO proxy. The deployment must support the current OpenAI ChatGPT app/MCP transport and authentication requirements.

## Milestones

1. Confirm MCP hosting and public catalog data source.
2. Implement read-only MCP tools and unit tests.
3. Verify public data filtering, invalid input handling, rate limits, and no-secret responses.
4. Connect the MCP endpoint to a ChatGPT app and test product discovery.
5. Only then design authenticated order creation and crypto payments, based on the audited existing payment backend.
