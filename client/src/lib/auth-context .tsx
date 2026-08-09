// ============================================================================
// src/lib/auth-context.tsx  (edited)
//
// Fixed in this pass:
//   1. /en/en/signup...  — double locale prefix on every navigate()
//   2. already-registered Google users bounced to /signup on sign-in
// ============================================================================


// ─── module-scope helpers (beside isOAuthUser / langBase) ───────────────────

/**
 * BUG 1 — https://www.pexly.app/en/en/signup?oauth=google&intent=signup
 *
 * `navigate` in this app is already locale-aware (router basename / localized
 * navigate wrapper), so prefixing with langBase() applied the locale twice.
 * Rather than guessing which layer owns the prefix, normalise: build the
 * absolute path once, then collapse a repeated leading locale segment.
 *
 * This is correct whether navigate prefixes or not, so it will not silently
 * break if the router config changes later.
 */
const LOCALE_RE = /^[a-z]{2}(-[A-Za-z]{2})?$/;

function dedupeLocale(path: string): string {
  const [pathname, query = ''] = path.split('?');
  const segs = pathname.split('/').filter(Boolean);
  while (segs.length >= 2 && LOCALE_RE.test(segs[0]) && segs[0] === segs[1]) {
    segs.shift();
  }
  return '/' + segs.join('/') + (query ? `?${query}` : '');
}

/**
 * Use this INSTEAD of `navigate(`${langBase()}/foo`)` everywhere in this file.
 * It also tolerates a navigate() that does its own prefixing.
 */
function navToPath(path: string): string {
  const withLocale = path.startsWith('/') && LOCALE_RE.test(path.split('/')[1] ?? '')
    ? path
    : `${langBase()}${path}`;
  return dedupeLocale(withLocale);
}

/**
 * The only trustworthy answer to "may this session enter the app?".
 * Fails CLOSED: an error means "we do not know".
 */
async function sessionMeetsAal(supabase: any): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return false;
    return !(data.currentLevel === 'aal1' && data.nextLevel === 'aal2');
  } catch {
    return false;
  }
}

/**
 * BUG 2 — returning Google users landing on /signup.
 *
 * A boolean `registration_completed` cannot distinguish these three cases:
 *
 *   a) no user_profiles row at all        -> genuine new signup
 *   b) row exists, flag false             -> profile started but not finished
 *   c) row exists, flag true              -> returning user, let them in
 *   d) the read itself failed             -> unknown, fail closed
 *
 * The old code collapsed (a) and (b) — and, in projects where the profile
 * trigger only sets the flag on the email/password path, EVERY existing OAuth
 * user reads as (b) and is permanently redirected to signup even though they
 * are fully registered. Reading the row lets us self-heal that case: a row
 * that already carries real profile data is treated as complete and the flag
 * is repaired, instead of bouncing the user to a signup form forever.
 */
type RegistrationState = 'new' | 'incomplete' | 'complete' | 'unknown';

async function fetchRegistrationState(
  supabase: any,
  userId: string,
  attempts = 3,
): Promise<RegistrationState> {
  for (let i = 0; i < attempts; i++) {
    try {
      const { data, error, status } = await supabase
        .from('user_profiles')
        .select('id, registration_completed, username, created_at')
        .eq('id', userId)
        .maybeSingle();

      // 406/PGRST116-style "no rows" is not an error for maybeSingle, but a
      // real transport/RLS failure is — retry those, never treat as "new".
      if (error && status !== 406) throw error;

      if (!data) return 'new';
      if (data.registration_completed === true) return 'complete';

      // Row exists with the flag unset. If the profile already carries the
      // data signup would have collected, this is a legacy/unbackfilled row,
      // not an abandoned signup. Repair it and let the user in.
      if (data.username) {
        void supabase
          .from('user_profiles')
          .update({ registration_completed: true })
          .eq('id', userId);
        return 'complete';
      }
      return 'incomplete';
    } catch {
      await new Promise((r) => setTimeout(r, 300 * 2 ** i)); // 300ms, 600ms, 1200ms
    }
  }
  return 'unknown';
}


// ─── auth-listener effect body ──────────────────────────────────────────────

getSupabase().then((supabase) => {
  if (aborted) return;

  /** THE single place a session is allowed to become "the signed-in user". */
  const commitSession = async (
    currentSession: Session,
    opts: { isFreshSignIn: boolean },
  ): Promise<void> => {
    if (aborted) return;
    const u = currentSession.user;

    // 1. Explicit holds set by the sign-in flows still win.
    if (totpPendingRef.current || oauthPendingRef.current) return;
    if (isOTPBlockingUser(u.id)) return;

    // 2. Custom inactivity expiry.
    if (!isSigningOutRef.current && isSessionExpired(u.id)) {
      isSigningOutRef.current = true;
      supabase.auth.signOut().finally(() => { isSigningOutRef.current = false; });
      return;
    }

    // 3. Step-up, on EVERY event so a reload cannot surface an AAL1 session.
    if (!(await sessionMeetsAal(supabase))) {
      if (aborted) return;
      setSession(null);
      setUser(null);
      return;
    }

    // 4. OAuth registration gate — every path, fail-closed, three outcomes.
    if (isOAuthUser(u)) {
      // Already cleared this exact user in this tab: don't re-gate on every
      // TOKEN_REFRESHED / health-check tick.
      if (oauthCheckedRef.current !== u.id) {
        oauthPendingRef.current = true;
        setSession(null);
        setUser(null);

        const state = await fetchRegistrationState(supabase, u.id);
        if (aborted) return;

        if (state === 'unknown') {
          // Do not guess. Do not send them to signup — that is what produced
          // the "logged-in user lands on the signup page" report.
          oauthPendingRef.current = false;
          oauthCheckedRef.current = null;
          await supabase.auth.signOut();
          navigate(navToPath('/signin?reason=verification_unavailable'), { replace: true });
          return;
        }

        if (state === 'new' || state === 'incomplete') {
          // Genuine signup still in progress. Hold the session (the signup form
          // needs it to write user_profiles); completeOAuthRegistration()
          // releases the hold.
          oauthCheckedRef.current = u.id;
          navigate(navToPath('/signup?oauth=google&intent=signup'), { replace: true });
          return;
        }

        oauthPendingRef.current = false;
        oauthCheckedRef.current = u.id;
      }

      // Returning, fully registered OAuth user who happens to still be sitting
      // on the callback URL: get them off it instead of parking them there.
      const here = window.location.pathname + window.location.search;
      if (/[?&]oauth=google\b/.test(here) || /\/sign(in|up)\b/.test(here)) {
        navigate(navToPath(postAuthRedirect ?? '/'), { replace: true });
      }
    }

    if (aborted) return;
    setSession(currentSession);
    setUser(u);
    touchLastActivity(u.id, opts.isFreshSignIn);

    // Post-commit side effects, once per unique access token.
    if (opts.isFreshSignIn && lastTrackedTokenRef.current !== currentSession.access_token) {
      lastTrackedTokenRef.current = currentSession.access_token;
      setTimeout(async () => {
        if (aborted) return;
        const deviceInfo = getDeviceInfo();
        const { isNewDevice, ipAddress, country, isp } = await trackDevice(u.id);
        checkWalletOnAuthRef.current(u.id);
        if (isNewDevice) sendLoginNotificationIfEnabled(u.id, deviceInfo, ipAddress, country, isp);
      }, 1500);
    }

    if (!mmFiredRef.current) {
      mmFiredRef.current = true;
      setTimeout(() => {
        if (!aborted) fetchAndCreateMarketMoversNotifications(u.id);
      }, 2000);
    }
  };

  const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, currentSession) => {
    if (aborted) return;

    if (window.location.pathname.endsWith('/verify-email')) {
      setSession(null);
      setUser(null);
      return;
    }

    if (event === 'SIGNED_OUT' || !currentSession) {
      setSession(null);
      setUser(null);
      setWalletImportState({ required: false, expectedAddress: null });
      checkedUsersRef.current.clear();
      lastTrackedTokenRef.current = null;
      oauthPendingRef.current = false;
      oauthCheckedRef.current = null;
      return;
    }

    // signIn() is mid-flight and will apply state itself after its TOTP check.
    if (event === 'SIGNED_IN' && signInInProgressRef.current) {
      deferredSignedInRef.current = { user: currentSession.user, session: currentSession };
      return;
    }

    void commitSession(currentSession, { isFreshSignIn: event === 'SIGNED_IN' });
  });
  subscription = sub;

  // Health check: re-run the same funnel rather than assigning state directly.
  healthCheckInterval = setInterval(async () => {
    if (aborted) return;
    if (totpPendingRef.current || oauthPendingRef.current || signInInProgressRef.current) return;
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s && sessionTokenRef.current !== s.access_token) {
      await commitSession(s, { isFreshSignIn: false });
    }
  }, 60000);

  supabase.auth.getSession()
    .then(async ({ data: { session: initialSession } }) => {
      if (aborted) return;
      if (initialSession) await commitSession(initialSession, { isFreshSignIn: false });
      if (!aborted) setLoading(false);
    })
    .catch(() => { if (!aborted) setLoading(false); });
}).catch(() => {
  if (!aborted) setLoading(false);
});
