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
/** Hard cap on source text length we'll ever consider translating. */
const MAX_SOURCE_LENGTH = 500;
/** Coalesce mutation bursts into a single processing run. */
const DEBOUNCE_MS = 500;
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
 * Strings that must stay verbatim — brand names, ticker symbols,
 * country/currency codes, technical acronyms.
 */
const VERBATIM = new Set<string>([
  "Pexly", "P2P", "KYC", "AML", "API", "URL", "OK", "ID", "IP", "FAQ", "FAQs",
  "BTC", "ETH", "USDT", "USDC", "BNB", "SOL", "XRP", "ADA", "DOGE", "AVAX",
  "DOT", "MATIC", "POL", "SHIB", "LTC", "TRX", "LINK", "USD", "EUR", "GBP",
  "JPY", "CNY", "INR", "NGN", "GMT", "UTC", "RTL", "LTR",
]);

/** Pure-symbol / numeric strings — nothing alphabetic to translate. */
const NON_TRANSLATABLE = /^[\s\d.,;:!?$€£¥₹₽₩+\-*×÷=%/\\()<>[\]{}'"`~|·•…—–]+$/;

/**
 * Patterns that almost always indicate user data, not UI copy.
 * Anything matching ANY of these is rejected before it can be hashed,
 * cached, sent to PostgREST, or sent to the translate edge function.
 *
 * NON-CUSTODIAL safety: these rules exist so that wallet addresses,
 * private keys, transaction hashes, signatures, and similar secrets
 * never leave the browser, even if they happen to render in the DOM.
 */
const SENSITIVE_PATTERNS: RegExp[] = [
  // Email
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  // URL (http, https, www-prefixed)
  /(?:https?:\/\/|www\.)\S+/i,
  // EVM addresses, transaction hashes, signatures (0x + hex)
  /\b0x[a-fA-F0-9]{8,}\b/,
  // Long bare hex run — block hashes, txn hashes, signatures, raw private keys
  /\b[a-fA-F0-9]{16,}\b/,
  // JWT
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  // UUID
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  // Long digit run — phone numbers, codes, account numbers, card numbers
  /\d{6,}/,
  // International phone format: + followed by 7+ digits with optional separators
  /\+\d[\d\s().-]{6,}\d/,
  // Extended public/private keys (BIP32): xpub/xprv/ypub/yprv/zpub/zprv...
  /\b[xyz](?:pub|prv)[A-Za-z0-9]{20,}\b/i,
  // WIF private keys: 51-52 char base58 starting with 5, K, or L
  /\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/,
];

/**
 * Single-token strings (no whitespace) that LOOK like identifiers/keys —
 * BTC base58 addresses, Solana addresses, API keys, refresh tokens, etc.
 * UI button labels almost never lack whitespace beyond ~24 chars.
 */
function looksLikeIdentifier(s: string): boolean {
  if (/\s/.test(s)) return false;
  if (s.length < 24) return false;
  // BTC legacy + bech32 + Solana base58 + generic alphanumeric tokens.
  return /^[A-Za-z0-9]+$/.test(s) || /^[A-Za-z0-9_-]+$/.test(s);
}

/**
 * BIP39 mnemonic / recovery phrase detector.
 *
 * BIP39 phrases are 12, 15, 18, 21, or 24 lowercase English words from a
 * fixed 2048-word list, each 3–8 characters, separated by single spaces.
 * If a string looks like that shape, treat it as a seed phrase and refuse
 * to translate it — under no circumstance should a recovery phrase end up
 * in localStorage, in PostgREST query params, or in an LLM prompt.
 */
function looksLikeMnemonic(s: string): boolean {
  const tokens = s.trim().split(/\s+/);
  if (![12, 15, 18, 21, 24].includes(tokens.length)) return false;
  for (const tok of tokens) {
    if (tok.length < 3 || tok.length > 8) return false;
    if (!/^[a-z]+$/.test(tok)) return false;
  }
  return true;
}

/** Text contains at least one Unicode letter. */
function hasLetters(s: string): boolean {
  return /\p{L}/u.test(s);
}

/**
 * Final gate before a string is allowed to be hashed / stored / sent
 * anywhere. Conservative by design — false negatives (skipping real UI
 * copy) are recoverable; false positives (leaking PII) are not.
 */
function shouldTranslate(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (trimmed.length > MAX_SOURCE_LENGTH) return false;
  if (NON_TRANSLATABLE.test(trimmed)) return false;
  if (!hasLetters(trimmed)) return false;
  if (VERBATIM.has(trimmed)) return false;
  if (looksLikeIdentifier(trimmed)) return false;
  if (looksLikeMnemonic(trimmed)) return false;
  for (const re of SENSITIVE_PATTERNS) {
    if (re.test(trimmed)) return false;
  }
  // Heuristic: if more than half the characters are digits/symbols
  // (very few letters), it's probably an amount/identifier mash, not copy.
  const letterCount = (trimmed.match(/\p{L}/gu) ?? []).length;
  if (letterCount * 2 < trimmed.length) return false;
  return true;
}

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

function loadCache(lang: string): TranslationsCache {
  clearLegacyCachesOnce();
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
    return raw ? (JSON.parse(raw) as TranslationsCache) : {};
  } catch {
    return {};
  }
}

function saveCache(lang: string, cache: TranslationsCache) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(cache));
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

let currentLang = "en";
const pendingNodes: Text[] = [];
const pendingAttrs: { el: Element; name: string }[] = [];
let scanScheduled = false;
let observer: MutationObserver | null = null;

function getNodeSource(node: Text): string {
  const mem = textMemory.get(node);
  if (mem && mem.translated === node.nodeValue) return mem.source;
  return node.nodeValue ?? "";
}

function getAttrSource(el: Element, name: string): string {
  const map = attrMemory.get(el);
  const mem = map?.get(name);
  const cur = el.getAttribute(name) ?? "";
  if (mem && mem.translated === cur) return mem.source;
  return cur;
}

function rememberTextTranslation(node: Text, source: string, translated: string) {
  textMemory.set(node, { source, translated });
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

function queueText(node: Text) {
  if (!node.nodeValue || !node.nodeValue.trim()) return;
  pendingNodes.push(node);
  scheduleScan();
}

function queueAttr(el: Element, name: string) {
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

  const cache = loadCache(lang);
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

    saveCache(lang, cache);

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
  try {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let cur = walker.nextNode();
    while (cur) {
      const t = cur as Text;
      const mem = textMemory.get(t);
      if (mem && mem.translated === t.nodeValue && mem.source !== mem.translated) {
        t.nodeValue = mem.source;
      }
      cur = walker.nextNode();
    }
    const elements = document.body.querySelectorAll("*");
    elements.forEach((el) => {
      const map = attrMemory.get(el);
      if (!map) return;
      for (const name of ATTR_TARGETS) {
        const mem = map.get(name);
        if (!mem) continue;
        if (el.getAttribute(name) === mem.translated && mem.source !== mem.translated) {
          el.setAttribute(name, mem.source);
        }
      }
    });
  } finally {
    if (obs) startObserving(obs);
  }
}
