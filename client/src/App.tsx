// ============================================================================
// PATCH for src/App.tsx — useAuthGuard (lines ~139-162)
//
// The guard was the one thing already doing the right check. But its .catch()
// fell back to 'authed', so any failure of getAuthenticatorAssuranceLevel()
// (offline, SupabaseNotReady thrown by the sync proxy, rate limit) granted
// access to an AAL1 session. A guard that fails open is not a guard.
//
// Also: the sync `supabase` proxy throws before the SDK chunk loads, and that
// throw happens OUTSIDE the promise chain — `supabase.auth.mfa` is a property
// access, so `.catch()` never sees it and the effect dies with the state stuck
// on 'pending' forever (permanent skeleton). Await getSupabase() instead.
// ============================================================================

import { getSupabase } from "@/lib/supabase";

function useAuthGuard() {
  const { user, loading } = useAuth();
  const [state, setState] = useState<'pending' | 'authed' | 'needs-mfa' | 'unauthed'>('pending');

  useEffect(() => {
    if (loading) { setState('pending'); return; }
    if (!user)   { setState('unauthed'); return; }

    let cancelled = false;

    void (async () => {
      try {
        const sb = await getSupabase();
        const { data, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
        if (cancelled) return;
        if (error || !data) { setState('needs-mfa'); return; }   // fail closed
        setState(
          data.currentLevel === 'aal1' && data.nextLevel === 'aal2'
            ? 'needs-mfa'
            : 'authed',
        );
      } catch {
        // Includes SupabaseNotReady. Unknown AAL is never "authenticated".
        if (!cancelled) setState('needs-mfa');
      }
    })();

    return () => { cancelled = true; };
  }, [user, loading]);

  return state;
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthRoute (~line 207): the isGoogleOAuthCallback exemption can now go.
//
// It existed so the signin page's callback effect had time to run. That effect
// is deleted (signin.PATCH.tsx, edit 1) and auth-context now holds the session
// via oauthPendingRef until the registration gate resolves — so `user` is null
// during the callback and AuthRoute renders the page anyway. Keeping the
// exemption means a fully authenticated user who happens to have ?oauth=google
// in the URL is parked on the sign-in page instead of being redirected.

function AuthRoute({
  component: LazyComponent,
  skeleton = <PageSkeleton />,
}: {
  component: LazyComponent;
  skeleton?: React.ReactNode;
}) {
  const guard = useAuthGuard();
  const [location] = useLocation();

  if (guard === 'pending') return <>{skeleton}</>;

  if (guard === 'authed') {
    const params = new URLSearchParams(location.split("?")[1] ?? "");
    const raw = params.get("redirect") ?? "/dashboard";
    const redirect = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
    return <Redirect to={redirect} />;
  }

  return (
    <Suspense fallback={skeleton}>
      <LazyComponent />
    </Suspense>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOT auto-fixed, needs your call: /admin, /admin/verifications, /admin/blog and
// /admin/gift-cards use plain ProtectedRoute — any authenticated user renders
// the admin page. That is only cosmetic if every admin table and RPC enforces
// the role server-side. If it does, leave it. If not, add:
//
// function RoleRoute({ role, component: C, skeleton }) {
//   const guard = useAuthGuard();
//   const { user } = useAuth();
//   const [ok, setOk] = useState<boolean | null>(null);
//   useEffect(() => {
//     if (guard !== 'authed' || !user) return;
//     void (async () => {
//       const sb = await getSupabase();
//       const { data } = await sb.rpc('has_role', { _user_id: user.id, _role: role });
//       setOk(data === true);
//     })();
//   }, [guard, user, role]);
//   if (guard === 'pending' || (guard === 'authed' && ok === null)) return <>{skeleton}</>;
//   if (guard !== 'authed' || !ok) return <Redirect to="/dashboard" />;
//   return <Suspense fallback={skeleton}><C /></Suspense>;
// }
//
// Roles must live in a separate user_roles table read through a SECURITY
// DEFINER has_role() — never a column on user_profiles, which the user can
// reach.
