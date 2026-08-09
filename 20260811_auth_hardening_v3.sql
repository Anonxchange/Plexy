-- Pexly auth hardening, part 3. Apply AFTER 20260810_auth_hardening_v2.sql.
-- Fixes carried over from the v2 review:
--   1. AAL2 was enforced on 8 hard-coded tables only — never on the RPCs.
--   2. user_profiles.email had no uniqueness guarantee, so start_google_signup()
--      could point two accounts at the same address.
--   3. v2 revoked client writes to user_devices.trusted but left no server path
--      to set it, so device verification never stuck.
--   4. The orphan-OAuth cleanup deleted live signups. Replace destructive
--      deletion with a flag + a reaper that only touches genuinely dead rows.
--   5. signin lookup rate limiting used an unbounded, unlocked counter.

-- ---------------------------------------------------------------------------
-- 1. Uniqueness for profile email. Do this BEFORE anything else writes email.
--    Partial index: only completed registrations must be unique, so abandoned
--    rows can't block a retry with the same address.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_dupes int;
BEGIN
  SELECT count(*) INTO v_dupes FROM (
    SELECT lower(email) FROM public.user_profiles
     WHERE email IS NOT NULL AND registration_completed
     GROUP BY lower(email) HAVING count(*) > 1
  ) d;
  IF v_dupes > 0 THEN
    RAISE WARNING 'user_profiles has % duplicate completed emails; resolve them then re-run this block', v_dupes;
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_email_completed_uidx
      ON public.user_profiles (lower(email))
      WHERE email IS NOT NULL AND registration_completed;
  END IF;
END $$;

-- start_google_signup() must also refuse an address already owned by a
-- different, completed account — otherwise the unique index turns a security
-- problem into a raw constraint error at signup.
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

  SELECT u.email, u.email_confirmed_at INTO v_email, v_confirmed
    FROM auth.users u WHERE u.id = v_uid;

  SELECT EXISTS (
    SELECT 1 FROM auth.identities i
     WHERE i.user_id = v_uid AND i.provider = 'google'
  ) INTO v_is_google;

  IF NOT v_is_google THEN RAISE EXCEPTION 'not_a_google_identity'; END IF;
  IF v_confirmed IS NULL THEN RAISE EXCEPTION 'email_not_verified_by_provider'; END IF;
  IF v_email IS NULL THEN RAISE EXCEPTION 'no_provider_email'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_profiles p
     WHERE lower(p.email) = lower(v_email)
       AND p.registration_completed
       AND p.id <> v_uid
  ) THEN
    RAISE EXCEPTION 'email_already_registered';
  END IF;

  UPDATE public.user_profiles
     SET email = v_email, email_verified = true
   WHERE id = v_uid AND registration_completed = false;
END;
$$;
REVOKE ALL ON FUNCTION public.start_google_signup() FROM public;
GRANT EXECUTE ON FUNCTION public.start_google_signup() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. AAL2 on sensitive RPCs, not just tables. mfa_satisfied() already exists
--    from v2; make it a precondition wherever a function performs a
--    security-relevant action. Add your own sensitive functions to this list.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.require_mfa()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.mfa_satisfied() THEN
    RAISE EXCEPTION 'mfa_required' USING ERRCODE = '42501';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.require_mfa() FROM public;
GRANT EXECUTE ON FUNCTION public.require_mfa() TO authenticated;

-- user_profiles was never covered by the v2 policy loop (it has no user_id
-- column — the owner column is id). Cover it explicitly. Reads stay at AAL1 so
-- the registration gate itself can run before step-up; writes require AAL2.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own profile read" ON public.user_profiles;
CREATE POLICY "own profile read" ON public.user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "own profile write" ON public.user_profiles;
CREATE POLICY "own profile write" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id AND public.mfa_satisfied())
  WITH CHECK (auth.uid() = id AND public.mfa_satisfied());
DROP POLICY IF EXISTS "own profile insert" ON public.user_profiles;
CREATE POLICY "own profile insert" ON public.user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 3. Server-side device trust. v2 revoked the client's write on `trusted`
--    without giving it a replacement, so registerDeviceAsTrusted() silently
--    failed forever and users re-verified on every login.
--    A device may only become trusted from a session that just verified an OTP
--    or is already AAL2.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.user_devices') IS NULL THEN
    RAISE NOTICE 'user_devices missing; skipping device-trust RPC';
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.trust_current_device(
      p_fingerprint text,
      p_device_name text DEFAULT NULL,
      p_browser     text DEFAULT NULL,
      p_os          text DEFAULT NULL
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
    DECLARE
      v_uid uuid := auth.uid();
      v_aal text := coalesce(auth.jwt() ->> 'aal', 'aal1');
      v_amr jsonb := coalesce(auth.jwt() -> 'amr', '[]'::jsonb);
      v_otp_recent boolean;
    BEGIN
      IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
      IF p_fingerprint IS NULL OR length(p_fingerprint) < 16 THEN
        RAISE EXCEPTION 'invalid_fingerprint';
      END IF;

      -- Accept only a session that actually proved a second/possession factor
      -- within the last 10 minutes. Reading amr avoids trusting client claims.
      SELECT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_amr) e
         WHERE e ->> 'method' IN ('otp', 'sms', 'email', 'totp', 'mfa/totp', 'webauthn')
           AND to_timestamp((e ->> 'timestamp')::bigint) > now() - interval '10 minutes'
      ) INTO v_otp_recent;

      IF v_aal <> 'aal2' AND NOT v_otp_recent THEN
        RAISE EXCEPTION 'device_trust_requires_verification' USING ERRCODE = '42501';
      END IF;

      INSERT INTO public.user_devices (user_id, fingerprint, device_name, browser, os, trusted, last_seen_at)
      VALUES (v_uid, p_fingerprint, p_device_name, p_browser, p_os, true, now())
      ON CONFLICT (user_id, fingerprint)
      DO UPDATE SET trusted = true, last_seen_at = now();
    END;
    $body$;
  $fn$;

  EXECUTE 'REVOKE ALL ON FUNCTION public.trust_current_device(text,text,text,text) FROM public';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.trust_current_device(text,text,text,text) TO authenticated';
END $$;

-- The RPC needs a conflict target.
DO $$
BEGIN
  IF to_regclass('public.user_devices') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS user_devices_user_fingerprint_uidx
      ON public.user_devices (user_id, fingerprint);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Stop deleting accounts. The old cleanup deleted any account younger than
--    15 minutes with registration_completed = false — indistinguishable from a
--    signup that is still on screen. Flag instead, reap later.
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS signup_abandoned_at timestamptz;

CREATE OR REPLACE FUNCTION public.mark_signup_abandoned()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  UPDATE public.user_profiles
     SET signup_abandoned_at = now()
   WHERE id = v_uid
     AND registration_completed = false
     AND signup_abandoned_at IS NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_signup_abandoned() FROM public;
GRANT EXECUTE ON FUNCTION public.mark_signup_abandoned() TO authenticated;

-- Reaper: service_role only. Run on a schedule (pg_cron or an external job).
-- Deletes only rows that have been flagged for 24h, never completed, and whose
-- auth user has never successfully signed in since the flag.
CREATE OR REPLACE FUNCTION public.reap_abandoned_signups()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
  r record;
BEGIN
  FOR r IN
    SELECT p.id
      FROM public.user_profiles p
      JOIN auth.users u ON u.id = p.id
     WHERE p.registration_completed = false
       AND p.signup_abandoned_at IS NOT NULL
       AND p.signup_abandoned_at < now() - interval '24 hours'
       AND (u.last_sign_in_at IS NULL OR u.last_sign_in_at < p.signup_abandoned_at)
  LOOP
    DELETE FROM auth.users WHERE id = r.id;   -- cascades to user_profiles
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.reap_abandoned_signups() FROM public;
GRANT EXECUTE ON FUNCTION public.reap_abandoned_signups() TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Rate limiting: make the counter race-safe and stop trusting a client
--    header when a real auth.uid() is available.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS signin_lookup_attempts_actor_created_idx
  ON public.signin_lookup_attempts (actor, created_at DESC);

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
  IF p_phone_number IS NULL OR length(regexp_replace(p_phone_number, '\D', '', 'g')) < 6 THEN
    RETURN false;
  END IF;

  IF random() < 0.01 THEN
    DELETE FROM public.signin_lookup_attempts WHERE created_at < now() - interval '1 day';
  END IF;

  -- Advisory lock per actor makes count-then-insert atomic; without it N
  -- concurrent requests all read the same pre-limit count and sail through.
  PERFORM pg_advisory_xact_lock(hashtext('signin_lookup:' || v_actor));

  SELECT count(*) INTO v_recent
    FROM public.signin_lookup_attempts
   WHERE actor = v_actor AND created_at > now() - interval '15 minutes';

  INSERT INTO public.signin_lookup_attempts (actor) VALUES (v_actor);

  IF v_recent >= 10 THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = '53400';
  END IF;

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
