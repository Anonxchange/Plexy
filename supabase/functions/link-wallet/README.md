# Development wallet verification

Deploy `index.ts` to the existing `link-wallet` function in your original
Supabase project. No `SIWE_ALLOWED_ORIGINS` setting is needed.

The development policy permits any browser origin (`Access-Control-Allow-Origin:
*`) and requests without an Origin header. Authorization uses explicit bearer
tokens, not cross-site cookies. This intentionally removes the application
origin allowlist; review this policy before a production release.

Wallet verification still checks the signature, message domain and URI,
supported chain, issue/expiry times, and single-use nonce. When the browser
supplies an Origin header, the signed message must match it. Linking also
requires an authenticated Pexly session.

Keep the existing Supabase credentials, database tables, RPCs and gateway
settings. Do not expose the service-role key to the frontend.

Run `node --test scripts/test-link-wallet-function.cjs` locally.
Tests use synthetic wallet signatures and a mocked Supabase transport; they
never link real wallets or change live data. This workspace does not deploy
the function automatically.
