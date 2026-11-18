# Pexly Marketplace

Imported from https://github.com/Anonxchange/Pezx. Preserve the original marketplace and its existing Supabase-backed services.

## Imported application

- Frontend: `artifacts/pexo`, served at `/` with language routes such as `/en`.
- Start: managed workflow `artifacts/pexo: web`.
- Check: `pnpm --filter @workspace/pexo run typecheck`.
- Live catalogs and original authentication require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the existing Supabase project. Do not replace its database or fabricate catalog items.
- Reown wallet connectivity optionally requires `VITE_REOWN_PROJECT_ID`. Preserve Turnstile and existing authentication.
- Unified search covers gift cards, airtime operators and physical products at `/en/search?q=...`, using the existing external functions.
- Digital-service country and Shopify delivery country are independent preferences. Search must not overwrite either.
- Catalog browsing, Shopify cart actions and delivery changes require verified enabled markets. Never bypass `getLocalization` to display prices: Shopify may silently fall back to the primary market for unsupported countries.
- The original repo includes the updated Shopify function source under `supabase/functions/shopify-storefront`. Releasing that function to the original Supabase project is separate from publishing this frontend. Do not claim live delivery operations are fixed until verified against that external service.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
