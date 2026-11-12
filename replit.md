# Pexly Marketplace

A digital marketplace for gift cards, mobile top-ups, physical products, and a connected EVM wallet.

## Run & Operate

- `pnpm --filter @workspace/pexo run dev` — run the marketplace through its managed workflow
- `pnpm --filter @workspace/pexo run typecheck` — typecheck the marketplace
- `pnpm --filter @workspace/pexo run build` — build the marketplace (requires workflow `PORT` and `BASE_PATH`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Marketplace settings: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_REOWN_PROJECT_ID`
- The shared API server/database also require `DATABASE_URL`; the marketplace connects to Supabase directly.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Marketplace: React, Vite, Supabase Auth/Edge Functions
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/pexo/` — marketplace frontend, static assets, Supabase migrations, and the `link-wallet` Edge Function
- `lib/api-spec/openapi.yaml` — shared API contract
- `artifacts/api-server/` — shared Express API
- `lib/db/src/schema/` — shared Drizzle schema

## Architecture decisions

- The marketplace uses Supabase directly; it does not use the shared Drizzle database for marketplace data.
- Only `link-wallet` is included as an Edge Function source in this repository; other functions called by the frontend must exist in the linked Supabase project.

## Product

Customers can browse marketplace items, purchase gift cards and mobile top-ups, and connect a non-custodial wallet.

## User preferences

- Use the original Pexly mark and wordmark recolored dark green; keep the supplied favicon as a lossless WebP.

## Gotchas

- Supabase Edge Function routes are remote dependencies; the preview needs those functions deployed and configured to allow its origin.
- Never put a Supabase service-role key in frontend configuration. Only the publishable anon key belongs in `VITE_` variables.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
