import { useEffect, useSyncExternalStore } from "react";
import { getCountryCode } from "./geo";

export type CountryScope = "digital" | "delivery";
type Preference = { country?: string; source: "manual" | "detected" | "legacy" };
type Preferences = {
  digital?: Preference;
  delivery?: Preference;
  detection: "idle" | "loading" | "ready" | "failed";
  storageBlocked: boolean;
  legacyConflict: boolean;
};
const KEY = "pexly_country_preferences_v1";
export const COUNTRY_PREFERENCES_EVENT = "pexly:country-preferences";
export const OPEN_COUNTRY_MENU_EVENT = "pexly:open-country-menu";
const normalize = (value: unknown) =>
  typeof value === "string" && /^[a-z]{2}$/i.test(value.trim()) ? value.trim().toUpperCase() : undefined;
let state: Preferences | undefined;
let initializing: Promise<void> | undefined;
const subscribers = new Set<() => void>();

function read(key: string) {
  try { return window.localStorage.getItem(key); }
  catch { state!.storageBlocked = true; return null; }
}

export function getCountryPreferences(): Preferences {
  if (state) return state;
  state = { detection: "idle", storageBlocked: false, legacyConflict: false };
  if (typeof window === "undefined") return state;
  try {
    const stored = JSON.parse(read(KEY) ?? "{}");
    for (const scope of ["digital", "delivery"] as const) {
      const pref = stored[scope];
      const country = normalize(pref?.country);
      if (pref && ["manual", "detected", "legacy"].includes(pref.source) &&
          (country || (scope === "digital" && pref.source === "manual" && pref.country === null))) {
        state[scope] = { country, source: pref.source };
      }
    }
  } catch { /* Invalid historic data is not a preference. */ }
  const digital = normalize(read("pexly_gift_card_country"));
  const shelf = normalize(read("px-country"));
  // The explicit header preference takes priority over the older shelf value.
  state.legacyConflict = !state.digital && !!digital && !!shelf && digital !== shelf;
  if (!state.digital && (digital || shelf)) state.digital = { country: digital || shelf, source: "legacy" };
  const delivery = normalize(read("pexly_market_country"));
  if (!state.delivery && delivery) state.delivery = { country: delivery, source: "legacy" };
  return state;
}

function publish(next: Preferences) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({
      digital: next.digital ? { ...next.digital, country: next.digital.country ?? null } : undefined,
      delivery: next.delivery,
    }));
  } catch { state = { ...next, storageBlocked: true }; }
  subscribers.forEach(fn => fn());
  window.dispatchEvent(new Event(COUNTRY_PREFERENCES_EVENT));
}

export function setCountryPreference(scope: CountryScope, country?: string, source: Preference["source"] = "manual") {
  const normalized = normalize(country);
  if ((country && !normalized) || (scope === "delivery" && !normalized)) return;
  publish({
    ...getCountryPreferences(),
    ...(scope === "digital" && source === "manual" ? { legacyConflict: false } : {}),
    [scope]: { country: normalized, source },
  });
  window.dispatchEvent(new CustomEvent(scope === "digital" ? "pexly:gift-card-market-changed" : "pexly:market-changed", {
    detail: { countryCode: normalized },
  }));
}

export function initializeCountryPreferences() {
  if (initializing) return initializing;
  const current = getCountryPreferences();
  if (current.digital && current.delivery) return Promise.resolve();
  publish({ ...current, detection: "loading" });
  initializing = (async () => {
    try {
      const detected = await getCountryCode();
      // Re-read after the await: a manual selection during detection must win.
      for (const scope of ["digital", "delivery"] as const) {
        if (!getCountryPreferences()[scope]) setCountryPreference(scope, detected, "detected");
      }
      publish({ ...getCountryPreferences(), detection: "ready" });
    } catch {
      publish({ ...getCountryPreferences(), detection: "failed" });
    }
  })();
  return initializing;
}

function subscribe(fn: () => void) {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}
export function useCountryPreferences() {
  const prefs = useSyncExternalStore(subscribe, getCountryPreferences, getCountryPreferences);
  useEffect(() => { void initializeCountryPreferences(); }, []);
  return prefs;
}
export function useDigitalCountry() {
  return useCountryPreferences().digital?.country;
}
export function openCountryMenu(scope: CountryScope = "digital") {
  window.dispatchEvent(new CustomEvent(OPEN_COUNTRY_MENU_EVENT, { detail: { scope } }));
  document.querySelector<HTMLButtonElement>(".px-country-trigger")?.focus();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", event => {
    if (event.key !== KEY && event.key !== null) return;
    state = undefined;
    const prefs = getCountryPreferences();
    subscribers.forEach(fn => fn());
    for (const scope of ["digital", "delivery"] as const) {
      window.dispatchEvent(new CustomEvent(scope === "digital" ? "pexly:gift-card-market-changed" : "pexly:market-changed", {
        detail: { countryCode: prefs[scope]?.country },
      }));
    }
  });
}
