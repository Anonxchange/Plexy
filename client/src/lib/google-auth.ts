import { getSupabase } from "@/lib/supabase";

/**
 * Supabase does not accept a CAPTCHA token on signInWithOAuth itself, so the
 * client-side check below is UX only, NOT a security boundary. Real abuse
 * control for OAuth belongs in Supabase rate limits / the callback handler.
 *
 * IMPORTANT: the app router is mounted with a language base ("/en", "/fr", ...).
 * A redirect to a bare "/signin?..." matches no route under that base, so the
 * sign-in page — and with it the AAL/2FA enforcement in its OAuth callback —
 * never mounts, while Supabase has already established an AAL1 session. That is
 * exactly how Google sign-in ended up bypassing 2FA. Always send the provider
 * back to a language-prefixed path.
 */
function currentLangBase(): string {
  const first = window.location.pathname.split("/")[1] ?? "";
  return /^[a-z]{2}(-[A-Za-z]{2})?$/.test(first) ? `/${first}` : "";
}

export async function signInWithGoogle(
  captchaToken?: string | null,
  redirectPath = "/signin?oauth=google&intent=signin",
): Promise<void> {
  const captchaRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  if (captchaRequired && !captchaToken) {
    throw new Error("Please complete the CAPTCHA before continuing with Google.");
  }

  const supabase = await getSupabase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${currentLangBase()}${redirectPath}`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) {
    throw error;
  }
}
