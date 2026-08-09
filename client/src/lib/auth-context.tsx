// ============================================================================
// PATCH for src/lib/auth-context.tsx
//
// Replaces the onAuthStateChange callback and the initial-session block
// (roughly lines 852-1030 in the version you sent) with a single gate.
//
// Everything above line 852 (helpers, refs, isOAuthUser, langBase,
// fetchRegistrationCompleted) stays as-is except for the two additions in
// PART A, which go next to the existing helpers near line 442.
// ============================================================================


// ─────────────────────────── PART A ────────────────────────────────────────
// Add beside isOAuthUser / fetchRegistrationCompleted (module scope, ~line 442).

/**
 * The only trustworthy answer to "may this session enter the app?".
 *
 * WHY THIS EXISTS: totpPendingRef / oauthPendingRef / show2FAInput are React
 * refs and state. They are gone after a reload, but the Supabase session is
 * already persisted in localStorage by the time any of them are set. Any gate
 * built on them is advisory. getAuthenticatorAssuranceLevel() is derived from
 * the token itself, so it survives reloads, tab restores, and token refreshes.
 *
 * Fails CLOSED: an error means "we do not know", and an unknown session is not
 * allowed to be committed as authenticated.
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
 * fetchRegistrationCompleted with bounded retry.
 *
 * The old code treated `null` (unknown) as "let them in" — a single dropped
 * request, RLS hiccup, or offline moment committed an unverified OAuth session.
 * An attacker can produce that condition on demand. Retry a few times, then
 * give up and let the caller fail closed.
 */
async function fetchRegistrationCompletedWithRetry(
  supabase: any,
  userId: string,
  attempts = 3,
): Promise<boolean | null> {
  for (let i = 0; i < attempts; i++) {
    const result = await fetchRegistrationCompleted(supabase, userId);
    if (result !== null) return result;
    await new Promise((r) => setTimeout(r, 300 * 2 ** i)); // 300ms, 600ms, 1200ms
  }
  return null;
}


// ─────────────────────────── PART B ────────────────────────────────────────
// Replace the whole `getSupabase().then((supabase) => { ... })` body inside the
// auth-listener useEffect with this.

getSupabase().then((supabase) => {
  if (aborted) return;

  /**
   * THE single place a session is allowed to become "the signed-in user".
   *
   * Previously three code paths committed sessions independently
   * (INITIAL_SESSION/TOKEN_REFRESHED, SIGNED_IN, and the 60s health check) and
   * only the SIGNED_IN path ran the OAuth registration gate — so a reload or a
   * token refresh committed a Google session that had never been checked. And
   * a *fourth* handler in signin.tsx raced all of them. One funnel, one policy.
   */
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

    // 3. Step-up. Runs on EVERY event, not just SIGNED_IN, so a reload can no
    //    longer surface an AAL1 session as authenticated.
    if (!(await sessionMeetsAal(supabase))) {
      if (aborted) return;
      setSession(null);
      setUser(null);
      // Do not sign out: the user may be mid-TOTP. The route guard keeps them
      // out, and the sign-in page raises the challenge.
      return;
    }

    // 4. OAuth registration gate — now on every path, fail-closed.
    if (isOAuthUser(u)) {
      oauthPendingRef.current = true;
      setSession(null);
      setUser(null);

      const complete = await fetchRegistrationCompletedWithRetry(supabase, u.id);
      if (aborted) return;

      if (complete === null) {
        // Still unknown after retries. FAIL CLOSED — the old code committed the
        // session here, which is how an unregistered Google account got in.
        oauthPendingRef.current = false;
        oauthCheckedRef.current = null;
        await supabase.auth.signOut();
        navigate(`${langBase()}/signin?reason=verification_unavailable`, { replace: true });
        return;
      }

      if (!complete) {
        // This is a SIGNUP, not a sign-in. Keep the hold so nothing commits the
        // user while the signup form is open; the session is needed to write
        // the user_profiles row. completeOAuthRegistration() releases it.
        oauthCheckedRef.current = u.id;
        navigate(`${langBase()}/signup?oauth=google&intent=signup`, { replace: true });
        return;
      }

      oauthPendingRef.current = false;
      oauthCheckedRef.current = u.id;
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

    if (window.location.pathname === '/verify-email') {
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
  // The old version bypassed every check and could surface an AAL1 session.
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
