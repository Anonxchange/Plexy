/** Retain Turnstile in production; allow an explicit local-preview-only pause. */
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || "";
export const TURNSTILE_PAUSED =
  import.meta.env.DEV && import.meta.env.VITE_DISABLE_TURNSTILE === "true";
export const TURNSTILE_ENABLED = Boolean(TURNSTILE_SITE_KEY) && !TURNSTILE_PAUSED;
