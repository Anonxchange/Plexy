# Security Review: Affected / Potentially Vulnerable Areas

This quick review flags the most likely security-sensitive surfaces currently present in the repository.

## High-priority findings

1. **Legacy/plain password field in shared schema**
   - `shared/schema.ts` defines `users.password` as a plain text column and includes it in insert schema.
   - If this schema is used in any runtime path, this can lead to weak password-handling guarantees.
   - Recommendation: remove direct password persistence from app-level schema and store only vetted password hashes managed by your auth provider.

2. **Client-side hardcoded Supabase project URL in OTP flow**
   - OTP component calls edge functions via a hardcoded project endpoint.
   - This is not a secret by itself, but it creates deployment coupling and can cause accidental cross-environment calls.
   - Recommendation: load function base URL from environment configuration.

3. **CORS is fully open (`*`) for edge functions**
   - Current edge functions set `Access-Control-Allow-Origin: *`.
   - Auth checks exist, but broad CORS increases exposure to misuse from arbitrary origins.
   - Recommendation: restrict allowed origins to known app domains.

## Medium-priority findings

4. **OTP appears to be stored directly (not hashed) before verification**
   - `device-otp-generation` inserts `otp_code` into `device_otp_verifications`.
   - If DB access is compromised, active OTPs are immediately usable.
   - Recommendation: store only a salted hash of OTP and compare hash on verify.

5. **Administrative transfer function is highly sensitive**
   - `admin-transfer` correctly checks auth and `is_admin`, but it uses service-role DB access.
   - Any logic flaw here has high blast radius.
   - Recommendation: keep this function minimal, add stricter validation/auditing, and protect with origin restrictions + monitoring.

## Notes from dependency scanning

- `npm audit` could not run in this environment because the advisory endpoint returned HTTP 403.
- Recommendation: run `npm audit --omit=dev` (and `npm audit` for dev deps) in CI or a network context with npm advisory access.

## Suggested immediate actions

1. Remove/replace plain password field usage from `shared/schema.ts`.
2. Restrict CORS origins in all edge functions.
3. Hash OTP values at rest.
4. Externalize Supabase function base URL to env config.
5. Add a scheduled dependency vulnerability scan in CI.
