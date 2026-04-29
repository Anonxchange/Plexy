import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";

type Tree = Record<string, any>;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

const TRANSLATE_FN_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/translate`
  : "";

const CACHE_PREFIX = "pexly-i18n:";
const CACHE_VERSION = "v1";

function flattenStrings(
  tree: Tree,
  prefix = "",
  out: { path: string; text: string }[] = [],
): { path: string; text: string }[] {
  for (const [k, v] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flattenStrings(v as Tree, path, out);
    } else if (typeof v === "string") {
      out.push({ path, text: v });
    }
  }
  return out;
}

function setByPath(tree: Tree, path: string, value: string) {
  const parts = path.split(".");
  let cur: Tree = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p] as Tree;
  }
  cur[parts[parts.length - 1]] = value;
}

function buildTreeFromMap(
  flat: { path: string; text: string }[],
  translations: Record<string, string>,
): Tree {
  const out: Tree = {};
  for (const { path, text } of flat) {
    const translated = translations[text];
    setByPath(out, path, typeof translated === "string" && translated ? translated : text);
  }
  return out;
}

function loadFromCache(lang: string): Tree | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${CACHE_VERSION}:${lang}`);
    if (!raw) return null;
    return JSON.parse(raw) as Tree;
  } catch {
    return null;
  }
}

function saveToCache(lang: string, tree: Tree) {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${CACHE_VERSION}:${lang}`,
      JSON.stringify(tree),
    );
  } catch {
    // ignore quota errors
  }
}

const inflight = new Map<string, Promise<void>>();
const loaded = new Set<string>(["en"]);

/**
 * Fetch translations for `lang` from the Supabase edge function in batches
 * (the function caps each request at 100 strings). Builds a translated
 * resource tree mirroring `en.json` and registers it with i18next.
 */
async function fetchAndApplyTranslations(lang: string): Promise<void> {
  if (loaded.has(lang)) return;
  if (inflight.has(lang)) return inflight.get(lang)!;

  const cached = loadFromCache(lang);
  if (cached) {
    i18n.addResourceBundle(lang, "translation", cached, true, true);
    loaded.add(lang);
    return;
  }

  if (!TRANSLATE_FN_URL || !SUPABASE_ANON_KEY) {
    // No backend configured — silently fall back to English source values.
    return;
  }

  const flat = flattenStrings(en as Tree);
  // Deduplicate text values so we don't pay for repeated strings.
  const uniqueTexts = Array.from(new Set(flat.map((f) => f.text)));
  const BATCH = 100;

  const promise = (async () => {
    const merged: Record<string, string> = {};
    for (let i = 0; i < uniqueTexts.length; i += BATCH) {
      const batch = uniqueTexts.slice(i, i + BATCH);
      try {
        const res = await fetch(TRANSLATE_FN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ texts: batch, targetLang: lang }),
        });
        if (!res.ok) {
          // Skip this batch — leftover strings will fall back to English.
          continue;
        }
        const json = (await res.json()) as { translations?: Record<string, string> };
        Object.assign(merged, json.translations ?? {});
      } catch {
        // Network error — fall back silently.
      }
    }
    const tree = buildTreeFromMap(flat, merged);
    saveToCache(lang, tree);
    i18n.addResourceBundle(lang, "translation", tree, true, true);
    loaded.add(lang);
  })();

  inflight.set(lang, promise);
  try {
    await promise;
  } finally {
    inflight.delete(lang);
  }
}

const initialLang = (() => {
  try {
    return localStorage.getItem("pexly-lang") || "en";
  } catch {
    return "en";
  }
})();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en as Tree },
  },
  lng: initialLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// Preload the active language on boot if it's not English.
if (initialLang !== "en") {
  void fetchAndApplyTranslations(initialLang);
}

// Whenever the language changes, ensure that bundle is loaded.
i18n.on("languageChanged", (lng) => {
  if (lng && lng !== "en" && !loaded.has(lng)) {
    void fetchAndApplyTranslations(lng);
  }
});

export default i18n;
export { fetchAndApplyTranslations };
