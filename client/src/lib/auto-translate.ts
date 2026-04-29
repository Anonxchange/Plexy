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

const CACHE_PREFIX = "pexly-tx:v1:";
const BATCH_SIZE = 100;
const DEBOUNCE_MS = 250;

/** Tags whose text content must never be translated. */
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE",
  "TEXTAREA", "INPUT", "SELECT", "OPTION",
  "SVG", "CANVAS", "MATH", "TEMPLATE",
]);

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

/** Text contains at least one Unicode letter. */
function hasLetters(s: string): boolean {
  return /\p{L}/u.test(s);
}

function shouldTranslate(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (NON_TRANSLATABLE.test(trimmed)) return false;
  if (!hasLetters(trimmed)) return false;
  if (VERBATIM.has(trimmed)) return false;
  return true;
}

function isSkippableElement(el: Element | null): boolean {
  let cur: Element | null = el;
  while (cur) {
    if (SKIP_TAGS.has(cur.tagName)) return true;
    if (cur.getAttribute("translate") === "no") return true;
    if (cur.hasAttribute("data-no-translate")) return true;
    if ((cur as HTMLElement).isContentEditable) return true;
    cur = cur.parentElement;
  }
  return false;
}

interface TranslationsCache {
  [sourceText: string]: string;
}

function loadCache(lang: string): TranslationsCache {
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

/* ─── Batch fetch ─────────────────────────────────────────────────────────── */

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

async function processQueue() {
  scanScheduled = false;
  if (currentLang === "en") {
    pendingNodes.length = 0;
    pendingAttrs.length = 0;
    return;
  }

  const nodes = pendingNodes.splice(0, pendingNodes.length);
  const attrs = pendingAttrs.splice(0, pendingAttrs.length);

  const cache = loadCache(currentLang);
  const need = new Set<string>();

  // Pair each candidate with its source text + run cached substitutions immediately.
  const textJobs: { node: Text; source: string }[] = [];
  for (const node of nodes) {
    if (!node.isConnected) continue;
    const raw = node.nodeValue ?? "";
    const source = getNodeSource(node) || raw;
    const trimmed = source.trim();
    if (!shouldTranslate(trimmed)) continue;

    if (cache[trimmed] != null) {
      // Preserve leading/trailing whitespace from the original node
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

  // Fetch in batches.
  const lang = currentLang;
  const all = Array.from(need);
  const merged: Record<string, string> = {};
  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    const batch = all.slice(i, i + BATCH_SIZE);
    const result = await fetchBatch(batch, lang);
    Object.assign(merged, result);
    Object.assign(cache, result);
  }
  saveCache(lang, cache);

  // Apply to anything still needing translation.
  for (const { node, source } of textJobs) {
    if (!node.isConnected) continue;
    const trimmed = source.trim();
    const translated = merged[trimmed] ?? cache[trimmed];
    if (translated == null) continue;
    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    applyTextTranslation(node, source, leading + translated + trailing);
  }
  for (const { el, name, source } of attrJobs) {
    if (!el.isConnected) continue;
    const trimmed = source.trim();
    const translated = merged[trimmed] ?? cache[trimmed];
    if (translated == null) continue;
    applyAttrTranslation(el, name, source, translated);
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
