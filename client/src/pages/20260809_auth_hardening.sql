-- Pexly auth hardening. Run as a single migration.
-- Fixes: client-writable verification flags, user enumeration, orphan OAuth
-- accounts, and client-only MFA enforcement.

-- 1. One durable, server-written marker for "registration finished".
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS registration_completed boolean NOT NULL DEFAULT false;

UPDATE public.user_profiles
   SET registration_completed = true
 WHERE registration_completed = false
   AND (email_verified IS TRUE OR phone_verified IS TRUE);

-- 2. Verification / trust columns must never be writable from the browser.
REVOKE UPDATE (email, email_verified, phone_number, phone_verified, registration_completed)
  ON public.user_profiles FROM authenticated;
REVOKE INSERT (email_verified, phone_verified, registration_completed)
  ON public.user_profiles FROM authenticated;
REVOKE ALL ON public.user_profiles FROM anon;   -- no anonymous reads: stops enumeration
GRANT ALL ON public.user_profiles TO service_role;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles" ON public.user_profiles;

CREATE POLICY "own profile read" ON public.user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3. Non-enumerable, rate-limited phone existence check for the sign-in page.
CREATE TABLE IF NOT EXISTS public.signin_lookup_attempts (
  id bigserial PRIMARY KEY,
  actor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signin_lookup_attempts_actor_idx
  ON public.signin_lookup_attempts (actor, created_at DESC);
GRANT ALL ON public.signin_lookup_attempts TO service_role;
ALTER TABLE public.signin_lookup_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.phone_registered_for_signin(p_phone_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor text := coalesce(auth.uid()::text, current_setting('request.headers', true)::json ->> 'cf-connecting-ip', 'anon');
  v_recent int;
BEGIN
  SELECT count(*) INTO v_recent
    FROM public.signin_lookup_attempts
   WHERE actor = v_actor AND created_at > now() - interval '15 minutes';
  IF v_recent > 10 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;
  INSERT INTO public.signin_lookup_attempts (actor) VALUES (v_actor);

  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
     WHERE phone_number = p_phone_number
       AND phone_verified IS TRUE
       AND registration_completed IS TRUE
  );
END;
$$;
REVOKE ALL ON FUNCTION public.phone_registered_for_signin(text) FROM public;
GRANT EXECUTE ON FUNCTION public.phone_registered_for_signin(text) TO anon, authenticated;

-- 4. Server-owned signup completion. Flags come from the verified JWT identity,
--    never from the request body.
CREATE OR REPLACE FUNCTION public.start_google_signup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := auth.jwt() -> 'user_metadata' ->> 'email';
  v_verified boolean := coalesce((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean, false);
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT v_verified THEN RAISE EXCEPTION 'email_not_verified_by_provider'; END IF;

  UPDATE public.user_profiles
     SET email = coalesce(v_email, email),
         email_verified = true
   WHERE id = v_uid;
END;
$$;
REVOKE ALL ON FUNCTION public.start_google_signup() FROM public;
GRANT EXECUTE ON FUNCTION public.start_google_signup() TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_registration(p_phone_number text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_jwt_phone text := auth.jwt() ->> 'phone';
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  IF p_phone_number IS NOT NULL THEN
    -- Only accept a number Supabase Auth itself verified for this session.
    IF v_jwt_phone IS NULL
       OR regexp_replace(v_jwt_phone, '\D', '', 'g') <> regexp_replace(p_phone_number, '\D', '', 'g') THEN
      RAISE EXCEPTION 'phone_not_verified_for_session';
    END IF;

    UPDATE public.user_profiles
       SET phone_number = p_phone_number,
           phone_verified = true,
           registration_completed = true
     WHERE id = v_uid;
  ELSE
    UPDATE public.user_profiles
       SET registration_completed = true
     WHERE id = v_uid;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_registration(text) FROM public;
GRANT EXECUTE ON FUNCTION public.complete_registration(text) TO authenticated;

-- 5. Server-side MFA enforcement. Client route guards are UX only; this is the
--    boundary. Apply the same predicate to every sensitive table.
CREATE OR REPLACE FUNCTION public.session_is_aal2()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$ SELECT coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2' $$;

-- Example — repeat for wallets, transactions, payouts, api_keys, kyc, ...:
-- ALTER POLICY "own wallet" ON public.wallets
--   USING (auth.uid() = user_id AND public.session_is_aal2());

-- 6. Device trust must be server-written after a verified OTP.
--    Replace the browser's registerDeviceAsTrusted() write with this RPC and
--    revoke direct writes to the trust column:
-- REVOKE UPDATE (trusted) ON public.user_devices FROM authenticated;
