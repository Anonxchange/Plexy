-- Pexly auth hardening, part 2. Apply AFTER 20260809_auth_hardening.sql.
-- Fixes:
--   1. start_google_signup() trusted client-writable user_metadata (privilege escalation)
--   2. AAL2 was never enforced server-side
--   3. registration_completed backfill locked out / deleted legitimate accounts
--   4. complete_registration() was fully self-service
--   5. signin_lookup_attempts grew without bound

-- ---------------------------------------------------------------------------
-- 0. Base grants. The v1 migration only REVOKEd; make the intended set explicit.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
-- Re-apply the column revokes so the GRANT above cannot widen them.
REVOKE UPDATE (email, email_verified, phone_number, phone_verified, registration_completed)
  ON public.user_profiles FROM authenticated;
REVOKE INSERT (email_verified, phone_verified, registration_completed)
  ON public.user_profiles FROM authenticated;
REVOKE ALL ON public.user_profiles FROM anon;
GRANT ALL ON public.user_profiles TO service_role;

-- ---------------------------------------------------------------------------
-- 1. Widen the backfill: every account that existed before this hardening and
--    is confirmed in auth.users is a finished registration. Without this they
--    are permanently rejected at Google sign-in, bounced to /signup, and (if
--    younger than 15 minutes) deleted by the cleanup function.
-- ---------------------------------------------------------------------------
UPDATE public.user_profiles p
   SET registration_completed = true
  FROM auth.users u
 WHERE u.id = p.id
   AND p.registration_completed = false
   AND p.created_at < now()
   AND (u.email_confirmed_at IS NOT NULL
        OR u.phone_confirmed_at IS NOT NULL
        OR u.last_sign_in_at IS NOT NULL);

-- ---------------------------------------------------------------------------
-- 2. start_google_signup(): never trust user_metadata.
--    user_metadata is writable by any signed-in client via auth.updateUser({data}),
--    so the v1 version let anyone set email_verified=true and claim an arbitrary
--    email address on their profile. Read the identity from auth.users instead.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_google_signup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_is_google boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT u.email, u.email_confirmed_at
    INTO v_email, v_confirmed
    FROM auth.users u
   WHERE u.id = v_uid;

  SELECT EXISTS (
    SELECT 1 FROM auth.identities i
     WHERE i.user_id = v_uid AND i.provider = 'google'
  ) INTO v_is_google;

  IF NOT v_is_google THEN RAISE EXCEPTION 'not_a_google_identity'; END IF;
  IF v_confirmed IS NULL THEN RAISE EXCEPTION 'email_not_verified_by_provider'; END IF;
  IF v_email IS NULL THEN RAISE EXCEPTION 'no_provider_email'; END IF;

  -- Never overwrite a finished account's email.
  UPDATE public.user_profiles
     SET email = v_email,
         email_verified = true
   WHERE id = v_uid
     AND registration_completed = false;
END;
$$;
REVOKE ALL ON FUNCTION public.start_google_signup() FROM public;
GRANT EXECUTE ON FUNCTION public.start_google_signup() TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. complete_registration(): require a real verified identity, and make it
--    one-shot so it can never re-open or re-point a finished account.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_registration(p_phone_number text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_jwt_phone text := auth.jwt() ->> 'phone';
  v_email_confirmed timestamptz;
  v_already boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT registration_completed INTO v_already
    FROM public.user_profiles WHERE id = v_uid;
  IF v_already IS TRUE THEN RETURN; END IF;   -- idempotent, never re-writes

  SELECT email_confirmed_at INTO v_email_confirmed
    FROM auth.users WHERE id = v_uid;

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
    -- "Skip phone" is only allowed when the email identity is actually verified.
    IF v_email_confirmed IS NULL THEN
      RAISE EXCEPTION 'no_verified_identity';
    END IF;

    UPDATE public.user_profiles
       SET registration_completed = true
     WHERE id = v_uid;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_registration(text) FROM public;
GRANT EXECUTE ON FUNCTION public.complete_registration(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Server-side AAL2 enforcement. This is the actual 2FA boundary; the React
--    gate in signin.tsx is UX only and is bypassable with a raw PostgREST call
--    using an AAL1 token.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.session_is_aal2()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$ SELECT coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2' $$;

-- True when the user has no verified TOTP factor (nothing to step up to), or
-- the current session already stepped up. Use this in sensitive-table policies.
CREATE OR REPLACE FUNCTION public.mfa_satisfied()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.session_is_aal2()
      OR NOT EXISTS (
        SELECT 1 FROM auth.mfa_factors f
         WHERE f.user_id = auth.uid() AND f.status = 'verified'
      )
$$;
REVOKE ALL ON FUNCTION public.mfa_satisfied() FROM public;
GRANT EXECUTE ON FUNCTION public.mfa_satisfied() TO authenticated;

-- Apply to every sensitive table. Adjust names/owner columns to your schema;
-- each block is idempotent.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'wallets', 'transactions', 'payouts', 'api_keys', 'kyc_documents',
    'user_devices', 'staking_positions', 'gift_cards'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "own rows mfa" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "own rows mfa" ON public.%I FOR ALL TO authenticated
           USING (auth.uid() = user_id AND public.mfa_satisfied())
           WITH CHECK (auth.uid() = user_id AND public.mfa_satisfied())', t);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Device trust is server-written only, after a verified OTP.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.user_devices') IS NOT NULL THEN
    EXECUTE 'REVOKE UPDATE (trusted) ON public.user_devices FROM authenticated';
    EXECUTE 'REVOKE INSERT (trusted) ON public.user_devices FROM authenticated';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Keep the rate-limit table bounded (the v1 version grew forever).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prune_signin_lookup_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.signin_lookup_attempts WHERE created_at < now() - interval '1 day'
$$;

-- Opportunistic prune inside the lookup itself, so no cron job is required.
CREATE OR REPLACE FUNCTION public.phone_registered_for_signin(p_phone_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor text := coalesce(
    auth.uid()::text,
    current_setting('request.headers', true)::json ->> 'cf-connecting-ip',
    'anon');
  v_recent int;
BEGIN
  IF random() < 0.01 THEN
    DELETE FROM public.signin_lookup_attempts WHERE created_at < now() - interval '1 day';
  END IF;

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
