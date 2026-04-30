/**
 * DOM-level auto-translator.
 *
 * Walks every visible English text node (and a small set of user-facing
 * attributes) on each page, batches the strings, sends them to the Supabase
 * `translate` edge function, and swaps the rendered text in place. Caches
 * results per language in localStorage so subsequent visits are instant.
 *
 * Designed to coexist with React reconciliation: a MutationObserver catches
 * any text rewritten by React and re-translates it.
 */

import i18n from "@/lib/i18n";
import { shouldTranslate } from "@/lib/pii-filter";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;
const TRANSLATE_FN_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/translate`
  : "";

/**
 * Cache version. Bump whenever the sanitisation rules tighten so any
 * previously-cached strings (which may have slipped through older, looser
 * filters) get discarded the next time the page loads.
 */
const CACHE_PREFIX = "pexly-tx:v3:";
const LEGACY_CACHE_PREFIXES = ["pexly-tx:v1:", "pexly-tx:v2:"];
const BATCH_SIZE = 100;
/**
 * Coalesce mutation bursts that need a NETWORK round-trip into one run.
 * Cache hits never wait for this debounce — they're applied synchronously
 * inside the mutation callback so cached pages render translated within
 * the same paint frame as the English DOM commit.
 */
const DEBOUNCE_MS = 150;
/** PostgREST URL-length safe chunk size for `source_hash=in.(...)` lookups. */
const DB_LOOKUP_CHUNK = 100;
/** PostgREST endpoint for the cached translations table. */
const TRANSLATIONS_TABLE_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/translations`
  : "";

/** Tags whose text content must never be translated. */
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE",
  "TEXTAREA", "INPUT", "SELECT", "OPTION",
  "SVG", "CANVAS", "MATH", "TEMPLATE",
]);

/**
 * Element-level opt-outs. Any of these on an element OR an ancestor
 * causes the entire subtree to be skipped — never queued, never sent.
 * Use them to mark UI areas that render PII (wallet addresses, balances,
 * usernames, transaction hashes, KYC details, etc.).
 */
const SKIP_ATTRS = [
  "data-no-translate",
  "data-sensitive",
  "data-private",
  "data-pii",
] as const;

/** User-facing attributes worth translating. */
const ATTR_TARGETS = ["placeholder", "title", "aria-label", "alt"] as const;

/**
 * NOTE: All sensitive-data filtering lives in `pii-filter.ts` and is
 * exhaustively unit-tested. Do not duplicate regex rules here — extend
 * them in that module, add a fixture to `pii-filter.test.ts`, and the
 * change automatically applies to every code path that calls
 * `shouldTranslate()`.
 */

function isSkippableElement(el: Element | null): boolean {
  let cur: Element | null = el;
  while (cur) {
    if (SKIP_TAGS.has(cur.tagName)) return true;
    if (cur.getAttribute("translate") === "no") return true;
    for (const attr of SKIP_ATTRS) {
      if (cur.hasAttribute(attr)) return true;
    }
    if ((cur as HTMLElement).isContentEditable) return true;
    cur = cur.parentElement;
  }
  return false;
}

interface TranslationsCache {
  [sourceText: string]: string;
}

/**
 * One-time housekeeping: drop any cache entries written by older versions
 * of this module that may have been built with looser sanitisation rules.
 */
let legacyCleared = false;
function clearLegacyCachesOnce() {
  if (legacyCleared) return;
  legacyCleared = true;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (LEGACY_CACHE_PREFIXES.some((p) => key.startsWith(p))) {
        toRemove.push(key);
      }
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    // ignore — purely defensive
  }
}

/**
 * Process-wide in-memory mirror of localStorage, keyed by language.
 * Lazy-loaded on first access per language. All reads go through this map
 * so we never pay the JSON.parse cost on the hot synchronous fast path.
 */
const cacheByLang = new Map<string, TranslationsCache>();

function getCache(lang: string): TranslationsCache {
  let c = cacheByLang.get(lang);
  if (!c) {
    clearLegacyCachesOnce();
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
      c = raw ? (JSON.parse(raw) as TranslationsCache) : {};
    } catch {
      c = {};
    }
    cacheByLang.set(lang, c);
  }
  return c;
}

function persistCache(lang: string) {
  const c = cacheByLang.get(lang);
  if (!c) return;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(c));
  } catch {
    // ignore quota errors
  }
}

/* ─── Per-target memory ────────────────────────────────────────────────────
 * Each text node and translatable attribute remembers:
 *   - the original English source we last saw there
 *   - the translation we last wrote into it
 * So we can (a) re-translate on language change without losing the source,
 * and (b) ignore mutations that we made ourselves.
 * ────────────────────────────────────────────────────────────────────────── */

interface NodeMemory {
  source: string;
  translated: string;
}

const textMemory = new WeakMap<Text, NodeMemory>();
const attrMemory = new WeakMap<Element, Map<string, NodeMemory>>();

/**
 * Durable, string-keyed memory that survives node unmount.
 *
 * The WeakMap above is the hot path — fast O(1) lookup keyed by Node identity.
 * But WeakMap entries die when React unmounts a section (route change, dialog
 * close/open). On remount the new Text node is a fresh identity, so we lose:
 *   1. The "this nodeValue is actually a translation of <source>" mapping,
 *      which `restoreEnglish` needs to switch back to English.
 *   2. The "we already tried to translate <source> and got nothing" knowledge,
 *      causing `dbLookup` + `fetchBatch` to re-fire on every remount for any
 *      string that genuinely has no translation in the DB or edge function.
 *
 * Both maps are scoped per-language (`lang` → inner map). Stable string keys
 * mean a remounted node finds its translation immediately and an untranslatable
 * source is never re-queried.
 */
const reverseMemory = new Map<string, Map<string, string>>(); // lang -> trimmed_translated -> trimmed_source
const untranslatable = new Map<string, Set<string>>();        // lang -> set of trimmed sources known to have no translation

function rememberReverse(lang: string, source: string, translated: string) {
  const s = source.trim();
  const t = translated.trim();
  if (!s || !t || s === t) return;
  let m = reverseMemory.get(lang);
  if (!m) {
    m = new Map();
    reverseMemory.set(lang, m);
  }
  m.set(t, s);
}

function lookupReverse(lang: string, translated: string): string | undefined {
  return reverseMemory.get(lang)?.get(translated.trim());
}

function isKnownUntranslatable(lang: string, trimmed: string): boolean {
  return untranslatable.get(lang)?.has(trimmed) ?? false;
}

function rememberUntranslatable(lang: string, trimmed: string) {
  let s = untranslatable.get(lang);
  if (!s) {
    s = new Set();
    untranslatable.set(lang, s);
  }
  s.add(trimmed);
}

let currentLang = "en";
const pendingNodes: Text[] = [];
const pendingAttrs: { el: Element; name: string }[] = [];
let scanScheduled = false;
let observer: MutationObserver | null = null;

function getNodeSource(node: Text): string {
  const mem = textMemory.get(node);
  if (mem && mem.translated === node.nodeValue) return mem.source;
  // WeakMap miss (likely the node was unmounted and remounted, or the entry
  // was GC'd). Fall back to the durable string-keyed reverse cache: if the
  // current text matches a known translation for the active language, the
  // original English source can still be recovered.
  const raw = node.nodeValue ?? "";
  if (currentLang !== "en") {
    const recovered = lookupReverse(currentLang, raw);
    if (recovered) {
      const leading = raw.match(/^\s*/)?.[0] ?? "";
      const trailing = raw.match(/\s*$/)?.[0] ?? "";
      return leading + recovered + trailing;
    }
  }
  return raw;
}

function getAttrSource(el: Element, name: string): string {
  const map = attrMemory.get(el);
  const mem = map?.get(name);
  const cur = el.getAttribute(name) ?? "";
  if (mem && mem.translated === cur) return mem.source;
  if (currentLang !== "en") {
    const recovered = lookupReverse(currentLang, cur);
    if (recovered) return recovered;
  }
  return cur;
}

function rememberTextTranslation(node: Text, source: string, translated: string) {
  textMemory.set(node, { source, translated });
  rememberReverse(currentLang, source, translated);
}

function rememberAttrTranslation(
  el: Element,
  name: string,
  source: string,
  translated: string,
) {
  let map = attrMemory.get(el);
  if (!map) {
    map = new Map();
    attrMemory.set(el, map);
  }
  map.set(name, { source, translated });
  rememberReverse(currentLang, source, translated);
}

/* ─── Hashing + DB lookup ─────────────────────────────────────────────────── */

/**
 * SHA-256 hex digest of an arbitrary string.
 */
async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Per-(text, lang) hash key.
 *
 * The hash input is `${trimmed_source}\u241F${lang}` — the unit-separator
 * codepoint U+241F can never appear inside legitimate UI copy or a BCP-47
 * language tag, so there is no risk of "abc" + "def" colliding with
 * "ab" + "cdef". This MUST match exactly what the `translate` edge
 * function uses when it writes `source_hash` into `public.translations`.
 */
async function hashFor(text: string, lang: string): Promise<string> {
  return sha256Hex(`${text}\u241F${lang}`);
}

/**
 * In-memory short-term cache of `${text}::${lang}` → SHA-256 hex,
 * so repeated translation passes for the same string don't re-hash it.
 */
const hashMemo = new Map<string, string>();

async function hashAll(
  texts: string[],
  lang: string,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const todo: string[] = [];
  for (const t of texts) {
    const memoKey = `${t}::${lang}`;
    const cached = hashMemo.get(memoKey);
    if (cached) out.set(t, cached);
    else todo.push(t);
  }
  if (todo.length > 0) {
    const hashes = await Promise.all(todo.map((t) => hashFor(t, lang)));
    todo.forEach((t, i) => {
      hashMemo.set(`${t}::${lang}`, hashes[i]);
      out.set(t, hashes[i]);
    });
  }
  return out;
}

/**
 * Cheap path: look up already-translated rows in the public.translations
 * table via PostgREST. RLS allows anonymous SELECT. Saves an edge-function
 * call (and the rate-limited LLM round-trip) for any string we've seen
 * before from any user.
 */
async function dbLookup(
  texts: string[],
  lang: string,
): Promise<Record<string, string>> {
  if (!TRANSLATIONS_TABLE_URL || !SUPABASE_ANON_KEY) return {};
  if (texts.length === 0) return {};

  const hashes = await hashAll(texts, lang);
  const hashToText = new Map<string, string>();
  for (const [text, hash] of hashes) hashToText.set(hash, text);

  const allHashes = Array.from(hashToText.keys());
  const result: Record<string, string> = {};

  for (let i = 0; i < allHashes.length; i += DB_LOOKUP_CHUNK) {
    const chunk = allHashes.slice(i, i + DB_LOOKUP_CHUNK);
    const inList = chunk.map((h) => `"${h}"`).join(",");
    const url =
      `${TRANSLATIONS_TABLE_URL}` +
      `?select=source_hash,translated_text` +
      `&target_lang=eq.${encodeURIComponent(lang)}` +
      `&source_hash=in.(${inList})`;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
          Accept: "application/json",
        },
      });
      if (!res.ok) continue;
      const rows = (await res.json()) as Array<{
        source_hash: string;
        translated_text: string;
      }>;
      for (const row of rows) {
        const text = hashToText.get(row.source_hash);
        if (text != null) result[text] = row.translated_text;
      }
    } catch {
      // network / CORS — skip; we'll still try the edge function below
    }
  }
  return result;
}

/* ─── Batch fetch (edge function — last resort) ───────────────────────────── */

async function fetchBatch(
  texts: string[],
  lang: string,
): Promise<Record<string, string>> {
  if (!TRANSLATE_FN_URL || !SUPABASE_ANON_KEY) return {};
  try {
    const res = await fetch(TRANSLATE_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ texts, targetLang: lang }),
    });
    if (!res.ok) return {};
    const json = (await res.json()) as { translations?: Record<string, string> };
    return json.translations ?? {};
  } catch {
    return {};
  }
}

/* ─── Apply translations to memorised targets ─────────────────────────────── */

function applyTextTranslation(node: Text, source: string, translated: string) {
  if (!node.isConnected) return;
  if (node.nodeValue === translated) {
    rememberTextTranslation(node, source, translated);
    return;
  }
  const obs = observer;
  obs?.disconnect();
  try {
    node.nodeValue = translated;
  } finally {
    rememberTextTranslation(node, source, translated);
    if (obs) startObserving(obs);
  }
}

function applyAttrTranslation(
  el: Element,
  name: string,
  source: string,
  translated: string,
) {
  if (!el.isConnected) return;
  if (el.getAttribute(name) === translated) {
    rememberAttrTranslation(el, name, source, translated);
    return;
  }
  const obs = observer;
  obs?.disconnect();
  try {
    el.setAttribute(name, translated);
  } finally {
    rememberAttrTranslation(el, name, source, translated);
    if (obs) startObserving(obs);
  }
}

/* ─── Walk + collect candidates ───────────────────────────────────────────── */

function collectFromRoot(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    queueText(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;

  const el = root as Element;
  if (isSkippableElement(el)) return;

  // Walk text nodes
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const text = n as Text;
      if (!text.nodeValue || !text.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      if (isSkippableElement(text.parentElement)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let cur = walker.nextNode();
  while (cur) {
    queueText(cur as Text);
    cur = walker.nextNode();
  }

  // Walk attributes on this element + descendants
  const elements = [el, ...Array.from(el.querySelectorAll("*"))];
  for (const e of elements) {
    if (isSkippableElement(e)) continue;
    for (const attr of ATTR_TARGETS) {
      if (e.hasAttribute(attr)) queueAttr(e, attr);
    }
  }
}

/**
 * Synchronous fast-path: if this text node's source is already cached
 * (in-memory mirror of localStorage OR populated by an earlier DB lookup),
 * apply the translation immediately and return true. Returns false if the
 * string needs a network round-trip — caller should enqueue it then.
 *
 * This is what eliminates the "flash of English" on cached pages: the
 * mutation observer applies the swap inside the same microtask as
 * React's commit, before the browser ever paints.
 */
function tryApplyTextSync(node: Text, lang: string): boolean {
  if (!node.isConnected) return true; // nothing to do
  const raw = node.nodeValue ?? "";
  const source = getNodeSource(node) || raw;
  const trimmed = source.trim();
  if (!shouldTranslate(trimmed)) return true; // not eligible
  // Negative cache hit — we already learned there is no translation for this
  // source, so don't enqueue it again. Prevents repeat network calls for
  // untranslatable strings on every remount.
  if (isKnownUntranslatable(lang, trimmed)) return true;
  const cache = getCache(lang);
  const hit = cache[trimmed];
  if (hit == null) return false;
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  applyTextTranslation(node, source, leading + hit + trailing);
  return true;
}

function tryApplyAttrSync(el: Element, name: string, lang: string): boolean {
  if (!el.isConnected) return true;
  const cur = el.getAttribute(name);
  if (cur == null) return true;
  const source = getAttrSource(el, name) || cur;
  const trimmed = source.trim();
  if (!shouldTranslate(trimmed)) return true;
  if (isKnownUntranslatable(lang, trimmed)) return true;
  const cache = getCache(lang);
  const hit = cache[trimmed];
  if (hit == null) return false;
  applyAttrTranslation(el, name, source, hit);
  return true;
}

function queueText(node: Text) {
  if (!node.nodeValue || !node.nodeValue.trim()) return;
  if (currentLang === "en") return;
  // Cache hit → apply right now, never enqueue, never schedule a scan.
  if (tryApplyTextSync(node, currentLang)) return;
  pendingNodes.push(node);
  scheduleScan();
}

function queueAttr(el: Element, name: string) {
  if (currentLang === "en") return;
  if (tryApplyAttrSync(el, name, currentLang)) return;
  pendingAttrs.push({ el, name });
  scheduleScan();
}

function scheduleScan() {
  if (scanScheduled) return;
  scanScheduled = true;
  setTimeout(processQueue, DEBOUNCE_MS);
}

/* ─── Process queue: translate & apply ────────────────────────────────────── */

/**
 * Strings that have already been requested in *some* in-flight batch for the
 * current language. Prevents two near-simultaneous queue runs from racing to
 * translate the same string twice (which is what triggers 429s when the
 * page mounts many lazy sections in quick succession).
 */
const inFlightStrings = new Map<string, Set<string>>(); // lang -> set of trimmed sources
function inFlightFor(lang: string): Set<string> {
  let s = inFlightStrings.get(lang);
  if (!s) {
    s = new Set();
    inFlightStrings.set(lang, s);
  }
  return s;
}

/**
 * Single-flight gate: one processQueue runs at a time. While it runs, any
 * new mutations re-arm the timer; when the run finishes, the next timer
 * picks them up. This keeps requests serialised per page.
 */
let processing: Promise<void> | null = null;

function processQueue() {
  scanScheduled = false;
  if (processing) {
    // Re-schedule once the current run finishes so any newly-queued items
    // are picked up — but don't start a parallel run.
    processing.then(() => {
      if (pendingNodes.length || pendingAttrs.length) scheduleScan();
    });
    return;
  }
  processing = runOnce().finally(() => {
    processing = null;
    if (pendingNodes.length || pendingAttrs.length) scheduleScan();
  });
}

async function runOnce(): Promise<void> {
  if (currentLang === "en") {
    pendingNodes.length = 0;
    pendingAttrs.length = 0;
    return;
  }

  const lang = currentLang;
  const nodes = pendingNodes.splice(0, pendingNodes.length);
  const attrs = pendingAttrs.splice(0, pendingAttrs.length);

  const cache = getCache(lang);
  const need = new Set<string>();

  // Layer 1 — in-memory localStorage cache. Substitute immediately.
  const textJobs: { node: Text; source: string }[] = [];
  for (const node of nodes) {
    if (!node.isConnected) continue;
    const raw = node.nodeValue ?? "";
    const source = getNodeSource(node) || raw;
    const trimmed = source.trim();
    if (!shouldTranslate(trimmed)) continue;

    if (cache[trimmed] != null) {
      const leading = source.match(/^\s*/)?.[0] ?? "";
      const trailing = source.match(/\s*$/)?.[0] ?? "";
      applyTextTranslation(node, source, leading + cache[trimmed] + trailing);
    } else {
      textJobs.push({ node, source });
      need.add(trimmed);
    }
  }

  const attrJobs: { el: Element; name: string; source: string }[] = [];
  for (const { el, name } of attrs) {
    if (!el.isConnected) continue;
    const cur = el.getAttribute(name);
    if (cur == null) continue;
    const source = getAttrSource(el, name) || cur;
    const trimmed = source.trim();
    if (!shouldTranslate(trimmed)) continue;

    if (cache[trimmed] != null) {
      applyAttrTranslation(el, name, source, cache[trimmed]);
    } else {
      attrJobs.push({ el, name, source });
      need.add(trimmed);
    }
  }

  if (need.size === 0) return;

  // Drop strings we already know have no translation — avoids repeat
  // dbLookup + fetchBatch on every remount for genuinely untranslatable copy.
  for (const t of Array.from(need)) {
    if (isKnownUntranslatable(lang, t)) need.delete(t);
  }

  // De-dupe against anything already being fetched.
  const inFlight = inFlightFor(lang);
  for (const t of inFlight) need.delete(t);
  if (need.size === 0) {
    // Anything we still want is already on the wire — re-queue everything
    // we couldn't satisfy, and let the next timer pick it up after the
    // current request resolves and writes to the cache.
    for (const { node } of textJobs) pendingNodes.push(node);
    for (const job of attrJobs) pendingAttrs.push({ el: job.el, name: job.name });
    return;
  }
  const all = Array.from(need);
  for (const t of all) inFlight.add(t);

  try {
    // Layer 2 — Supabase translations table (server-shared cache).
    const dbHits = await dbLookup(all, lang);
    if (Object.keys(dbHits).length > 0) {
      Object.assign(cache, dbHits);
    }

    // Layer 3 — only call the edge function for what's still missing.
    const stillMissing = all.filter((t) => cache[t] == null);
    if (stillMissing.length > 0) {
      for (let i = 0; i < stillMissing.length; i += BATCH_SIZE) {
        const batch = stillMissing.slice(i, i + BATCH_SIZE);
        const result = await fetchBatch(batch, lang);
        Object.assign(cache, result);
      }
    }

    persistCache(lang);

    // Anything still missing after both layers genuinely has no translation —
    // record it in the negative cache so future remounts of the same source
    // skip the network hop entirely.
    for (const t of all) {
      if (cache[t] == null) rememberUntranslatable(lang, t);
    }

    // Apply everything we can resolve.
    for (const { node, source } of textJobs) {
      if (!node.isConnected) continue;
      const trimmed = source.trim();
      const translated = cache[trimmed];
      if (translated == null) continue;
      const leading = source.match(/^\s*/)?.[0] ?? "";
      const trailing = source.match(/\s*$/)?.[0] ?? "";
      applyTextTranslation(node, source, leading + translated + trailing);
    }
    for (const { el, name, source } of attrJobs) {
      if (!el.isConnected) continue;
      const trimmed = source.trim();
      const translated = cache[trimmed];
      if (translated == null) continue;
      applyAttrTranslation(el, name, source, translated);
    }
  } finally {
    for (const t of all) inFlight.delete(t);
  }
}

/* ─── MutationObserver wiring ─────────────────────────────────────────────── */

function startObserving(obs: MutationObserver) {
  obs.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTR_TARGETS],
  });
}

function handleMutations(records: MutationRecord[]) {
  for (const rec of records) {
    if (rec.type === "characterData") {
      const t = rec.target;
      if (t.nodeType === Node.TEXT_NODE) queueText(t as Text);
    } else if (rec.type === "childList") {
      rec.addedNodes.forEach((n) => collectFromRoot(n));
    } else if (rec.type === "attributes" && rec.attributeName) {
      const el = rec.target as Element;
      if (
        ATTR_TARGETS.includes(rec.attributeName as (typeof ATTR_TARGETS)[number])
      ) {
        queueAttr(el, rec.attributeName);
      }
    }
  }
}

/* ─── Public API ──────────────────────────────────────────────────────────── */

let started = false;

export function startAutoTranslate() {
  if (started) return;
  started = true;
  currentLang = i18n.language || "en";

  observer = new MutationObserver(handleMutations);
  startObserving(observer);

  // Initial sweep
  collectFromRoot(document.body);

  i18n.on("languageChanged", (lng: string) => {
    currentLang = lng || "en";
    if (currentLang === "en") {
      // Restore English by walking all memorised nodes via a fresh scan.
      // Each text node still has its English source in textMemory; rewrite
      // back to source.
      restoreEnglish();
      return;
    }
    // Re-scan everything; sources are remembered per-node.
    collectFromRoot(document.body);
  });
}

function restoreEnglish() {
  const obs = observer;
  obs?.disconnect();
  // The language we're switching away from. `currentLang` was reassigned to
  // "en" before this runs, so capture the prior value for reverse lookups.
  // The reverse map is keyed by the previous language, not "en".
  const prevLangs = Array.from(reverseMemory.keys()).filter((l) => l !== "en");
  try {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let cur = walker.nextNode();
    while (cur) {
      const t = cur as Text;
      const mem = textMemory.get(t);
      if (mem && mem.translated === t.nodeValue && mem.source !== mem.translated) {
        t.nodeValue = mem.source;
      } else {
        // WeakMap lost this node (unmount/remount). Recover from the durable
        // string-keyed reverse cache so the swap-back still happens.
        const cur2 = t.nodeValue ?? "";
        if (cur2.trim()) {
          for (const lang of prevLangs) {
            const recovered = lookupReverse(lang, cur2);
            if (recovered && recovered !== cur2.trim()) {
              const leading = cur2.match(/^\s*/)?.[0] ?? "";
              const trailing = cur2.match(/\s*$/)?.[0] ?? "";
              t.nodeValue = leading + recovered + trailing;
              break;
            }
          }
        }
      }
      cur = walker.nextNode();
    }
    const elements = document.body.querySelectorAll("*");
    elements.forEach((el) => {
      const map = attrMemory.get(el);
      for (const name of ATTR_TARGETS) {
        const cur3 = el.getAttribute(name);
        if (cur3 == null) continue;
        const mem = map?.get(name);
        if (mem && el.getAttribute(name) === mem.translated && mem.source !== mem.translated) {
          el.setAttribute(name, mem.source);
          continue;
        }
        for (const lang of prevLangs) {
          const recovered = lookupReverse(lang, cur3);
          if (recovered && recovered !== cur3.trim()) {
            el.setAttribute(name, recovered);
            break;
          }
        }
      }
    });
  } finally {
    if (obs) startObserving(obs);
  }
}
