import { getSupabase } from "@/lib/supabase";

/**
 * Supabase does not accept a CAPTCHA token on signInWithOAuth itself. The
 * important security boundary is therefore before the OAuth redirect: callers
 * must provide the fresh Turnstile token that was issued on this page.
 *
 * Keeping this guard in the shared helper prevents another sign-in surface from
 * accidentally reintroducing the direct OAuth bypass.
 */
export async function signInWithGoogle(
  captchaToken?: string | null,
): Promise<void> {
  const captchaRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  if (captchaRequired && !captchaToken) {
    throw new Error("Please complete the CAPTCHA before continuing with Google.");
  }

  const supabase = await getSupabase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/signin",
    },
  });

  if (error) {
    throw error;
  }
}