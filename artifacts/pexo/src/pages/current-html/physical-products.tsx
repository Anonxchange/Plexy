import "./page-styles/physical-products.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CurrentMarketingPage } from "@/components/marketing/current-marketing-page";
import { Search, X, ChevronDown, SlidersHorizontal, ArrowUpDown } from "@/lib/icons";
import {
  shopifyService,
  formatPrice,
  MARKET_CHANGED_EVENT,
  type ShopifyProduct,
  type ProductIndexItem,
} from "@/lib/shopify-service";
// Products are fetched 60 at a time; the button loads the next 60. No total count is shown anywhere.
const PAGE_SIZE = 60;

const SHOP_GRID_CSS = `
.sp-all-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 14px;margin-top:22px}
@media(min-width:700px){.sp-all-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:26px 18px}}
@media(min-width:1000px){.sp-all-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(min-width:1280px){.sp-all-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
.sp-all-grid .sp-card{width:auto;min-width:0;flex:none;max-width:none}
.sp-all-grid .sp-card a.sp-card-link{display:block;color:inherit;text-decoration:none}
.sp-all-grid .sp-img.sp-real{position:relative;overflow:hidden;aspect-ratio:1/1;background:#f3f7f6}
.sp-all-grid .sp-img.sp-real img.sp-real-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.sp-card a.sp-card-link{display:block;color:inherit;text-decoration:none}
.sp-img.sp-real{position:relative;overflow:hidden;background:#f3f7f6}
.sp-img.sp-real img.sp-real-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.sp-img.sp-gc{aspect-ratio:1.586;border:1px solid #e3ebe9;border-radius:14px;display:grid;place-items:center}
.sp-skel.sp-skel-card{aspect-ratio:1.586;flex:0 0 220px}
.ed-cats-wrap{border-bottom:1px solid #e3ebe9;background:#fff;position:sticky;top:0;z-index:5}
.ed-cats{display:flex;gap:22px;overflow-x:auto;scrollbar-width:none}
.ed-cats::-webkit-scrollbar{display:none}
.ed-cat{flex:none;background:none;border:0;padding:14px 0 12px;font:inherit;font-size:16px;font-weight:500;color:#464646;white-space:nowrap;cursor:pointer;border-bottom:3px solid transparent}
.ed-cat.on{color:#091e1c;font-weight:700;border-bottom-color:#091e1c}
.ed-label{margin:0;font-size:13px;color:#464646}
.tm-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 10px}
.tm-head h1,.tm-head h2{margin:0;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-weight:800;font-size:clamp(20px,2.6vw,28px);letter-spacing:-.03em;color:#091e1c}
.tm-rail .sp-card{flex:0 0 170px;width:170px}
@media(min-width:700px){.tm-rail .sp-card{flex-basis:240px;width:240px}}
.tm-search{display:flex;align-items:center;gap:10px;margin:14px 0 4px;padding:4px 4px 4px 12px;border:1px solid #e3ebe9;border-radius:8px;background:#fff}
.tm-search input{flex:1 1 auto;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:16px;color:#091e1c}
.tm-search input::placeholder{color:#8a9694}
.tm-search-x{flex:none;width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:50%;background:#f3f7f6;color:#091e1c;cursor:pointer}
.tm-search-go{flex:none;height:34px;padding:0 14px;border:0;border-radius:5px;background:#091e1c;color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
.tm-search-go:hover{background:#0f302c}
.tm-sortbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 14px}
.tm-sortbar>.tm-fbtn,.tm-sortbar>.tm-sort{flex:1 1 0;min-width:0;justify-content:center}
@media(min-width:700px){.tm-sortbar>.tm-fbtn,.tm-sortbar>.tm-sort{flex:0 0 auto}}
.tm-fbtn{position:relative;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border:0;border-radius:8px;background:#f3f7f6;color:#091e1c;font:inherit;font-size:15px;font-weight:600;cursor:pointer}
.tm-fbtn.on{background:#091e1c;color:#fff}
.tm-fbadge{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#bef264;color:#091e1c;font-size:11px;font-weight:800}
.tm-fpanel{width:100%;margin:2px 0 4px;padding:14px;border:1px solid #e3ebe9;border-radius:10px;background:#fff}
.tm-fpanel h4{margin:0 0 10px;font-size:14px;font-weight:700;color:#091e1c}
.tm-frow{display:flex;align-items:center;gap:10px}
.tm-frow input{flex:1 1 0;min-width:0;height:42px;padding:0 12px;border:1px solid #e3ebe9;border-radius:8px;font:inherit;font-size:16px;color:#091e1c;background:#fff}
.tm-fact{display:flex;gap:10px;margin-top:12px}
.tm-fact button{height:40px;padding:0 18px;border-radius:8px;font:inherit;font-size:15px;font-weight:600;cursor:pointer}
.tm-fapply{border:0;background:#091e1c;color:#fff}
.tm-fclear{border:1px solid #e3ebe9;background:#fff;color:#091e1c}

.tm-sort{position:relative;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px;border-radius:8px;background:#f3f7f6;color:#091e1c;font-size:15px;font-weight:600;white-space:nowrap}
.tm-sort select{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:16px}
.tm-sort svg,.tm-fbtn svg{display:block;flex:none}
.tm-sort-txt{overflow:hidden;text-overflow:ellipsis}
.tm-tabs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 0 6px}
.tm-tabs::-webkit-scrollbar{display:none}
.tm-tab{flex:none;display:inline-flex;align-items:center;height:36px;padding:0 16px;border:1.5px solid #e3ebe9;border-radius:999px;background:#fff;color:#464646;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
.tm-tab.on{background:#091e1c;border-color:#091e1c;color:#fff}
.sp-masonry{display:flex;gap:12px;margin-top:14px;align-items:flex-start}
@media(min-width:700px){.sp-masonry{gap:18px}}
.sp-mcol{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:18px}
.sp-masonry .sp-card{width:auto;min-width:0;flex:none;max-width:none}
.sp-masonry .sp-card a.sp-card-link{display:block;color:inherit;text-decoration:none}
.sp-masonry .sp-img.sp-real{position:relative;overflow:hidden;border-radius:6px;background:#f3f7f6;width:100%}
.sp-masonry .sp-img.sp-real img.sp-real-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.sp-masonry .sp-card h3{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:15px;font-weight:600;line-height:1.35;margin:10px 0 2px;color:#0c1111}
.sp-masonry .sp-price{margin:0;font-size:15px;color:#464646;font-variant-numeric:tabular-nums}
.sp-masonry .sp-price b{font-weight:400}
.sp-masonry .sp-skel{width:100%;aspect-ratio:auto}
@media(max-width:699px){
.sp-masonry{width:100vw;margin-left:calc(50% - 50vw);gap:8px}
.sp-mcol{gap:14px}
.sp-masonry .sp-img.sp-real{border-radius:0}
.sp-masonry .sp-card h3,.sp-masonry .sp-price{padding:0 8px}
.sp-masonry .sp-card h3{margin-top:8px}
}
.tm-rail .sp-card h3{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:15px;font-weight:600;line-height:1.35;margin:10px 0 2px;color:#0c1111}
.tm-rail .sp-price{margin:4px 0 0;font-size:15px;color:#464646;font-variant-numeric:tabular-nums}
.ed-foot{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:28px;padding:14px 0;border-top:1px solid #e3ebe9;font-size:13px;color:#464646}
.sp-img.sp-real{position:relative;overflow:hidden;background:#f3f7f6}
.sp-img.sp-real img.sp-real-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.sp-card a.sp-card-link{display:block;color:inherit;text-decoration:none}
.sp-img.sp-gc{aspect-ratio:1.586;border:1px solid #e3ebe9;border-radius:14px;display:grid;place-items:center}
.sp-skel.sp-skel-card{aspect-ratio:1.586;flex:0 0 220px}
.sp-row .sp-img.sp-real{aspect-ratio:1/1;border-radius:8px}
.sp-skel.sp-skel-sq{flex:0 0 170px}
.sp-cat .t.sp-cat-img{background-size:cover;background-position:center;background-repeat:no-repeat}
.sp-skel{aspect-ratio:1/1;border-radius:18px;background:linear-gradient(90deg,#eef2f1,#f7f9f8,#eef2f1);background-size:200% 100%;animation:sp-pulse 1.2s linear infinite}
@keyframes sp-pulse{to{background-position:-200% 0}}
.sp-more-wrap{display:flex;justify-content:center;margin-top:34px}
.sp-more{display:inline-flex;align-items:center;justify-content:center;min-width:200px;height:54px;padding:0 30px;border:1.5px solid #091e1c;border-radius:999px;background:#fff;color:#091e1c;font-family:inherit;font-weight:700;font-size:17px;cursor:pointer}
.sp-more:hover{background:#bef264}
.sp-more[disabled]{opacity:.6;cursor:default}
.sp-note{margin:30px 0;text-align:center;color:#464646;font-size:15px}
.sp-note button{text-decoration:underline;background:none;border:0;color:inherit;cursor:pointer;font:inherit}
.sp-filter-pill{display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:8px 8px 8px 16px;border:1.5px solid #e3ebe9;border-radius:999px;font-weight:700;font-size:15px;color:#091e1c;background:#fff}
.sp-filter-pill button{width:28px;height:28px;border:0;border-radius:50%;background:#f3f7f6;color:#091e1c;cursor:pointer;font-size:16px;line-height:1}
`;

// ---------------------------------------------------------------------------
// Shop by category: real categories taken from the store's own products
// ---------------------------------------------------------------------------
type ShopCategory = { name: string; img?: string; count: number };

// getProducts' third argument is a Shopify search string, so a category has to be sent as a product_type filter.
function categoryQuery(name: string): string | undefined {
  const n = name.trim();
  if (!n) return undefined;
  return 'product_type:"' + n.replace(/"/g, '\\"') + '"';
}

// Fisher-Yates shuffle: every page load / refresh shows products in a different order.
function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The catalog is indexed progressively with tiny records (id, created time, price).
// Page 1 (up to 250 items) unblocks first render immediately while remaining pages stream in the background.
const INDEX_CAP = 50000; // safety stop only

interface IndexStream {
  firstPage: Promise<ProductIndexItem[]>;
  snapshot: () => { items: ProductIndexItem[]; done: boolean; error: Error | null };
  subscribe: (listener: () => void) => () => void;
}

const indexCache = new Map<string, IndexStream>();
const cardCache = new Map<string, ShopifyProduct>();
const cardInflight = new Map<string, Promise<void>>();
if (typeof window !== "undefined") {
  window.addEventListener(MARKET_CHANGED_EVENT, () => {
    indexCache.clear();
    cardCache.clear();
    cardInflight.clear();
  });
}

function getIndexStream(query?: string): IndexStream {
  const key = query ?? "";
  const hit = indexCache.get(key);
  if (hit) return hit;

  const items: ProductIndexItem[] = [];
  const seen = new Set<string>();
  let done = false;
  let streamError: Error | null = null;
  const listeners = new Set<() => void>();
  const notify = () => {
    listeners.forEach((fn) => fn());
  };

  let resolveFirst!: (first: ProductIndexItem[]) => void;
  let rejectFirst!: (err: unknown) => void;
  const firstPage = new Promise<ProductIndexItem[]>((res, rej) => {
    resolveFirst = res;
    rejectFirst = rej;
  });

  const stream: IndexStream = {
    firstPage,
    snapshot: () => ({ items: [...items], done, error: streamError }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  indexCache.set(key, stream);

  (async () => {
    let cursor: string | undefined;
    let isFirst = true;
    try {
      while (items.length < INDEX_CAP) {
        const res = await shopifyService.getProductIndex(250, cursor, query);
        // Abort cleanly if cache was cleared (e.g. market changed mid-stream).
        if (indexCache.get(key) !== stream) return;
        for (const it of res.items) {
          if (!seen.has(it.id)) {
            seen.add(it.id);
            items.push(it);
          }
        }
        const next = res.pageInfo?.endCursor;
        const hasMore = Boolean(res.pageInfo?.hasNextPage && next);
        if (!hasMore || items.length >= INDEX_CAP) {
          done = true;
        }
        if (isFirst) {
          isFirst = false;
          resolveFirst([...items]);
        }
        notify();
        if (done) break;
        cursor = next!;
      }
      if (!done) {
        done = true;
        notify();
      }
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(err?.message || "Could not load products");
      if (indexCache.get(key) === stream) {
        indexCache.delete(key);
      }
      streamError = errorObj;
      done = true;
      if (isFirst) {
        isFirst = false;
        rejectFirst(errorObj);
      }
      notify();
    }
  })();

  return stream;
}

// Full card details for the given ids, fetched 100 at a time in parallel and deduplicated in-flight.
async function fetchCards(ids: string[]): Promise<void> {
  const missing = ids.filter((id) => !cardCache.has(id));
  if (missing.length === 0) return;

  const waitPromises: Promise<void>[] = [];
  const toFetch: string[] = [];
  for (const id of missing) {
    const inflight = cardInflight.get(id);
    if (inflight) waitPromises.push(inflight);
    else toFetch.push(id);
  }

  for (let i = 0; i < toFetch.length; i += 100) {
    const batch = toFetch.slice(i, i + 100);
    const job = shopifyService
      .getProductCards(batch)
      .then((got) => {
        for (const p of got) cardCache.set(p.node.id, p);
      })
      .finally(() => {
        for (const id of batch) cardInflight.delete(id);
      });
    for (const id of batch) cardInflight.set(id, job);
    waitPromises.push(job);
  }

  await Promise.all(waitPromises);
}

// Category and search text combine into one Shopify search string (space = AND).
function buildQuery(category: string, search: string): string | undefined {
  const t = search.trim().replace(/["\\]/g, " ").replace(/\s+/g, " ");
  const parts = [t, categoryQuery(category)].filter(Boolean) as string[];
  return parts.length ? parts.join(" ") : undefined;
}

function useShopCategories() {
  const [cats, setCats] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let request = 0;
    const load = async () => {
      const current = ++request;
      setLoading(true);
      // Light query: one product type per product, so counting repeats gives the category sizes.
      const types = await shopifyService.getProductTypes(250).catch(() => [] as string[]);
      if (!alive || current !== request) return;
      const map = new Map<string, ShopCategory>();
      for (const t of types as string[]) {
        const name = String(t).trim();
        if (!name) continue;
        const cur = map.get(name) ?? { name, count: 0 };
        cur.count += 1;
        map.set(name, cur);
      }
      setCats(Array.from(map.values()).sort((x, y) => y.count - x.count || x.name.localeCompare(y.name)));
      setLoading(false);
    };
    void load();
    window.addEventListener(MARKET_CHANGED_EVENT, load);
    return () => { alive = false; window.removeEventListener(MARKET_CHANGED_EVENT, load); };
  }, []);

  return { cats, loading };
}

function SearchBar({ value, onSearch }: { value: string; onSearch: (q: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);
  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    onSearch(text.trim());
    window.setTimeout(() => {
      document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };
  return (
    <div className={"padding-global"}>
      <div className={"container-large"}>
        <form className={"tm-search"} onSubmit={submit} role={"search"}>
          <Search size={20} color={"#464646"} />
          <input
            type={"search"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Search products"}
            aria-label={"Search products"}
            enterKeyHint={"search"}
          />
          {value ? (
            <button type={"button"} className={"tm-search-x"} aria-label={"Clear search"} onClick={() => { setText(""); onSearch(""); }}><X size={16} /></button>
          ) : null}
          <button type={"submit"} className={"tm-search-go"}>{"Search"}</button>
        </form>
      </div>
    </div>
  );
}

function CategoryStrip({ active, onPick }: { active: string; onPick: (name: string) => void }) {
  const { cats, loading } = useShopCategories();
  if (!loading && cats.length === 0) return null;

  const pick = (name: string) => {
    onPick(name);
    window.setTimeout(() => {
      document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div className={"ed-cats-wrap"} id={"categories"}>
      <div className={"padding-global"}>
        <div className={"container-large"}>
          <div className={"ed-cats"}>
            <button type={"button"} className={active === "" ? "ed-cat on" : "ed-cat"} onClick={() => pick("")}>{"All"}</button>
            {cats.map((c) => (
              <button key={c.name} type={"button"} className={active === c.name ? "ed-cat on" : "ed-cat"} onClick={() => pick(c.name)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function columnsForWidth(): number {
  if (typeof window === "undefined") return 2;
  const w = window.innerWidth;
  return w >= 1100 ? 4 : w >= 700 ? 3 : 2;
}

function useColumnCount() {
  const [n, setN] = useState(columnsForWidth);
  useEffect(() => {
    const on = () => setN(columnsForWidth());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return n;
}

// Height / width of a product photo. Uses the real image size when the store returns it,
// otherwise a steady per-product variation so the grid still staggers.
function photoRatio(node: any): number {
  const img = node?.images?.edges?.[0]?.node;
  const w = Number(img?.width);
  const h = Number(img?.height);
  if (w > 0 && h > 0) return Math.min(1.25, Math.max(1, h / w));
  const steps = [1, 1.2, 1.1, 1.25, 1.15];
  let hash = 0;
  const key = String(node?.id || "");
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return steps[hash % steps.length];
}

type SortKey = "all" | "new" | "low" | "high";

const SORT_LABELS: Record<SortKey, string> = { all: "Best match", new: "Newest", low: "Price: low to high", high: "Price: high to low" };

const SORTS: { key: SortKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "Newest" },
  { key: "low", label: "Price: low to high" },
  { key: "high", label: "Price: high to low" },
];

function ShopAllProducts({
  category,
  search,
  excludeIds,
  waitForIds,
}: {
  category: string;
  search: string;
  excludeIds: Set<string>;
  waitForIds: boolean;
}) {
  const [index, setIndex] = useState<ProductIndexItem[]>([]);
  const [count, setCount] = useState(PAGE_SIZE);
  const [indexLoading, setIndexLoading] = useState(true);
  const [indexDone, setIndexDone] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsTick, setCardsTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("all");
  const [panelOpen, setPanelOpen] = useState(false);
  const [minDraft, setMinDraft] = useState("");
  const [maxDraft, setMaxDraft] = useState("");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const colCount = useColumnCount();

  // A new search always starts on best match.
  useEffect(() => {
    setSort("all");
    setMinDraft(""); setMaxDraft("");
    setMinPrice(null); setMaxPrice(null);
    setPanelOpen(false);
  }, [search]);

  // Order across the catalog loaded so far (shuffled incrementally so already-visible cards never jump).
  const ordered = useMemo(() => {
    const list = index.filter(
      (it) => !excludeIds.has(it.id)
        && (minPrice === null || it.price >= minPrice)
        && (maxPrice === null || it.price <= maxPrice),
    );
    if (sort === "new") list.sort((a, b) => b.createdAt - a.createdAt);
    else if (sort === "low") list.sort((a, b) => a.price - b.price);
    else if (sort === "high") list.sort((a, b) => b.price - a.price);
    return list;
  }, [index, sort, excludeIds, minPrice, maxPrice]);

  const visibleIds = useMemo(() => ordered.slice(0, count).map((it) => it.id), [ordered, count]);
  const hasMore = ordered.length > count || !indexDone;

  // Fetch card details immediately once page 1 arrives (in parallel with JustInRail).
  useEffect(() => {
    if (indexLoading || waitForIds || visibleIds.length === 0) return;
    const missingIds = visibleIds.filter((id) => !cardCache.has(id));
    if (missingIds.length === 0) return;
    let alive = true;
    setCardsLoading(true);
    fetchCards(missingIds)
      .then(() => { if (alive) setCardsTick((t) => t + 1); })
      .catch((e: any) => { if (alive) setError(e?.message || "Could not load products"); })
      .finally(() => { if (alive) setCardsLoading(false); });
    return () => { alive = false; };
  }, [visibleIds, indexLoading, waitForIds]);

  const shown = useMemo(
    () => visibleIds.map((id) => cardCache.get(id)).filter((p): p is ShopifyProduct => Boolean(p)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleIds, cardsTick],
  );
  const loading = indexLoading || waitForIds || (cardsLoading && shown.length === 0);

  const cols = useMemo(() => {
    const out = Array.from({ length: colCount }, () => ({ h: 0, items: [] as { p: ShopifyProduct; r: number }[] }));
    for (const p of shown) {
      const r = photoRatio(p.node);
      let target = out[0];
      for (const c of out) if (c.h < target.h) target = c;
      target.items.push({ p, r });
      target.h += r + 0.45;
    }
    return out;
  }, [shown, colCount]);

  const query = useMemo(() => buildQuery(category, search), [category, search]);

  useEffect(() => {
    let alive = true;
    const seenIds = new Set<string>();
    setIndex([]);
    setIndexLoading(true);
    setIndexDone(false);
    setError(null);
    setCount(PAGE_SIZE);

    const stream = getIndexStream(query);

    const applySnapshot = () => {
      if (!alive) return;
      const snap = stream.snapshot();
      if (snap.error) {
        setIndex([]);
        setError(snap.error.message || "Could not load products");
        setIndexLoading(false);
        setIndexDone(true);
        return;
      }
      const added = snap.items.filter((it) => !seenIds.has(it.id));
      for (const it of added) seenIds.add(it.id);
      if (added.length > 0) {
        const chunk = search ? added : shuffle(added);
        setIndex((prev) => (prev.length === 0 ? chunk : [...prev, ...chunk]));
      } else if (snap.done && seenIds.size === 0) {
        setIndex([]);
      }
      if (snap.items.length > 0 || snap.done) {
        setIndexLoading(false);
      }
      if (snap.done) {
        setIndexDone(true);
      }
    };

    const unsub = stream.subscribe(applySnapshot);
    applySnapshot();

    return () => {
      alive = false;
      unsub();
    };
  }, [query, search, reloadNonce]);

  const loadFirst = useCallback(() => {
    indexCache.delete(query ?? "");
    setReloadNonce((n) => n + 1);
  }, [query]);

  // Reload when the visitor switches market/country so prices stay correct.
  useEffect(() => {
    const onMarket = () => { setReloadNonce((n) => n + 1); };
    window.addEventListener(MARKET_CHANGED_EVENT, onMarket);
    return () => window.removeEventListener(MARKET_CHANGED_EVENT, onMarket);
  }, []);

  const loadMore = () => setCount((c) => c + PAGE_SIZE);

  const parsePrice = (v: string) => {
    const n = Number(v.replace(/,/g, "").trim());
    return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
  };
  const applyFilters = () => {
    setMinPrice(parsePrice(minDraft));
    setMaxPrice(parsePrice(maxDraft));
    setCount(PAGE_SIZE);
    setPanelOpen(false);
  };
  const clearFilters = () => {
    setMinDraft(""); setMaxDraft("");
    setMinPrice(null); setMaxPrice(null);
    setCount(PAGE_SIZE);
    setPanelOpen(false);
  };
  const activeFilters = (minPrice !== null ? 1 : 0) + (maxPrice !== null ? 1 : 0) > 0 ? 1 : 0;

  return (
    <section id={"all-products"} className={"sp-sec"} style={{ paddingTop: 20 }}>
      <div className={"padding-global"}>
        <div className={"container-large"}>
          <div className={"tm-head"}>
            <h2>{search ? "Results for \u201c" + search + "\u201d" : category ? category : "More to love"}</h2>
          </div>
          {search ? (
            <div className={"tm-sortbar"}>
              <button type={"button"} className={panelOpen || activeFilters ? "tm-fbtn on" : "tm-fbtn"} onClick={() => setPanelOpen((o) => !o)} aria-expanded={panelOpen}>
                <SlidersHorizontal size={18} />
                {"Filters"}
                {activeFilters ? <span className={"tm-fbadge"}>{activeFilters}</span> : null}
              </button>
              <label className={"tm-sort"}>
                <ArrowUpDown size={18} />
                <span className={"tm-sort-txt"}>{SORT_LABELS[sort]}</span>
                <ChevronDown size={16} />
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label={"Sort by"}>
                  <option value={"all"}>{SORT_LABELS.all}</option>
                  <option value={"new"}>{SORT_LABELS.new}</option>
                  <option value={"low"}>{SORT_LABELS.low}</option>
                  <option value={"high"}>{SORT_LABELS.high}</option>
                </select>
              </label>
              {panelOpen ? (
                <div className={"tm-fpanel"}>
                  <h4>{"Price"}</h4>
                  <div className={"tm-frow"}>
                    <input type={"number"} inputMode={"decimal"} min={0} placeholder={"Min"} aria-label={"Minimum price"} value={minDraft} onChange={(e) => setMinDraft(e.target.value)} />
                    <span>{"–"}</span>
                    <input type={"number"} inputMode={"decimal"} min={0} placeholder={"Max"} aria-label={"Maximum price"} value={maxDraft} onChange={(e) => setMaxDraft(e.target.value)} />
                  </div>
                  <div className={"tm-fact"}>
                    <button type={"button"} className={"tm-fapply"} onClick={applyFilters}>{"Apply"}</button>
                    <button type={"button"} className={"tm-fclear"} onClick={clearFilters}>{"Clear"}</button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className={"tm-tabs"} role={"tablist"}>
              {SORTS.map((o) => (
                <button key={o.key} type={"button"} role={"tab"} aria-selected={sort === o.key} className={sort === o.key ? "tm-tab on" : "tm-tab"} onClick={() => setSort(o.key)}>
                  {o.label}
                </button>
              ))}
            </div>
          )}

          <div className={"sp-masonry"}>
            {loading
              ? Array.from({ length: colCount }).map((_, ci) => (
                <div key={ci} className={"sp-mcol"}>
                  {[1.2, 1, 1.35, 1.1].map((r, i) => (
                    <div key={i} className={"sp-skel"} style={{ height: 0, paddingBottom: Math.round(r * 100) + "%" }}></div>
                  ))}
                </div>
              ))
              : cols.map((col, ci) => (
                <div key={ci} className={"sp-mcol"}>
                  {col.items.map(({ p, r }) => {
                    const node = p.node;
                    const img = node.images?.edges?.[0]?.node;
                    const price = node.priceRange?.minVariantPrice;
                    const href = `/shop/product/${node.handle}`;
                    return (
                      <article key={node.id} className={"sp-card"}>
                        <a href={href} className={"sp-card-link"}>
                          <div className={"sp-img sp-real"} style={{ aspectRatio: "1 / " + r }}>
                            {img?.url ? (
                              <img className={"sp-real-img"} src={img.url} alt={img.altText || node.title} loading={"lazy"} />
                            ) : null}
                          </div>
                          <h3>{node.title}</h3>
                          <p className={"sp-price"}>
                            <b>{price ? formatPrice(price.amount, price.currencyCode) : ""}</b>
                          </p>
                        </a>
                      </article>
                    );
                  })}
                </div>
              ))}
          </div>

          {error ? (
            <p className={"sp-note"}>
              {error + " "}
              <button type={"button"} onClick={() => loadFirst()}>{"Try again"}</button>
            </p>
          ) : !loading && ordered.length === 0 ? (
            <p className={"sp-note"}>{activeFilters ? "No products match your filters." : search ? "No products match your search." : category ? "No products found in this category yet." : "No products available right now."}</p>
          ) : null}

          {!loading && hasMore ? (
            <div className={"sp-more-wrap"}>
              <button type={"button"} className={"sp-more"} onClick={loadMore} disabled={cardsLoading}>
                {cardsLoading ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}

          <div className={"ed-foot"}>
            <span>{"Verified sellers"}</span>
            <span>{"Pay with USDT, BTC or ETH"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}


// ---------------------------------------------------------------------------
// Shared tile pieces (no "+" buttons anywhere)
// ---------------------------------------------------------------------------
type RailProduct = {
  id: string;
  handle: string;
  title: string;
  img?: string;
  alt: string;
  amountRaw: any;
  currency: string;
  createdAt?: number;
};

function toRail(p: ShopifyProduct): RailProduct {
  const n: any = p.node;
  const price = n.priceRange?.minVariantPrice;
  const created = n.createdAt ? Date.parse(n.createdAt) : NaN;
  const img = n.images?.edges?.[0]?.node;
  return {
    id: n.id,
    handle: n.handle,
    title: n.title,
    img: img?.url,
    alt: img?.altText || n.title,
    amountRaw: price?.amount,
    currency: price?.currencyCode || "USD",
    createdAt: Number.isNaN(created) ? undefined : created,
  };
}

function useJustIn() {
  const [items, setItems] = useState<RailProduct[]>([]);
  const [reservedIds, setReservedIds] = useState<Set<string>>(NO_IDS);
  const [idsReady, setIdsReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let request = 0;
    const load = async () => {
      const current = ++request;
      setLoading(true);
      setIdsReady(false);
      try {
        const firstPage = await getIndexStream(undefined).firstPage;
        if (!alive || current !== request) return;
        // Pick from page 1 immediately so ShopAllProducts can fetch its 60 cards in parallel.
        const ids = shuffle(firstPage.map((it) => it.id)).slice(0, JUST_IN_COUNT + 6);
        setReservedIds(new Set(ids));
        setIdsReady(true);
        await fetchCards(ids);
        if (!alive || current !== request) return;
        const picked = ids
          .map((id) => cardCache.get(id))
          .filter((p): p is ShopifyProduct => Boolean(p))
          .map(toRail)
          .filter((p) => p.img)
          .slice(0, JUST_IN_COUNT);
        setItems(picked);
      } catch {
        if (alive && current === request) {
          setItems([]);
          setReservedIds(NO_IDS);
          setIdsReady(true);
        }
      } finally {
        if (alive && current === request) setLoading(false);
      }
    };
    load();
    window.addEventListener(MARKET_CHANGED_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(MARKET_CHANGED_EVENT, load);
    };
  }, []);

  return { items, reservedIds, idsReady, loading };
}

const JUST_IN_COUNT = 12;
const NO_IDS: Set<string> = new Set();

function JustInRail({ list, loading }: { list: RailProduct[]; loading: boolean }) {
  if (!loading && list.length === 0) return null;

  return (
    <section className={"sp-sec"} style={{ paddingTop: 14, paddingBottom: 0 }}>
      <div className={"padding-global"}>
        <div className={"container-large"}>
          <div className={"tm-head"}>
            <h1>{"Just in"}</h1>
            <p className={"ed-label"}>{"Newly listed by verified sellers"}</p>
          </div>
          <div className={"sp-row tm-rail"}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className={"sp-skel sp-skel-sq"}></div>)
              : list.map((p) => (
                <article key={p.id} className={"sp-card"}>
                  <a className={"sp-card-link"} href={"/shop/product/" + p.handle}>
                    <div className={"sp-img sp-real"}>
                      <img className={"sp-real-img"} src={p.img} alt={p.alt} loading={"lazy"} />
                    </div>
                    <h3>{p.title}</h3>
                    <p className={"tm-price"}>{formatPrice(p.amountRaw, p.currency as any)}</p>
                  </a>
                </article>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PhysicalProductsExport() {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const rail = useJustIn();
  const justIn = rail.items;
  return (
    <CurrentMarketingPage page="physical-products">
    <div className={"page-wrapper"}>
      <style>{SHOP_GRID_CSS}</style>
      <header className={"px-nav"} id={"pxnav"}>
        <div className={"px-nav-in"}>
          <a className={"px-logo"} href={"#"} data-px-link={"home"}>
            <span className={"px-logo-mark"}>
              {"p"}
            </span>
            <span>
              {"pexly"}
            </span>
          </a>
          <nav className={"px-menu"} id={"pxmenu"} aria-label={"Main"}>
            <div className={"px-dd"}>
              <button className={"px-dd-t"} type={"button"} aria-expanded={"false"}>
                {"Marketplace "}
                <i></i>
              </button>
              <div className={"px-dd-l"}>
                <a href={"#"} data-px-link={"giftcards"}>
                  <b>
                    {"Gift Cards"}
                  </b>
                  <small>
                    {"Shopping, gaming, streaming"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"home#top-up"}>
                  <b>
                    {"Mobile Top Up"}
                  </b>
                  <small>
                    {"Airtime and data, anywhere"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"shop"}>
                  <b>
                    {"Physical Products"}
                  </b>
                  <small>
                    {"Electronics, fashion, home"}
                  </small>
                </a>
              </div>
            </div>
            <a className={"px-l"} href={"#"} data-px-link={"giftcards"}>
              {"Gift Cards"}
            </a>
            <a className={"px-l"} href={"#"} data-px-link={"shop"}>
              {"Physical Products"}
            </a>
            <a className={"px-l"} href={"#"} data-px-link={"blog"}>
              {"Blog"}
            </a>
            <div className={"px-dd"}>
              <button className={"px-dd-t"} type={"button"} aria-expanded={"false"}>
                {"Company "}
                <i></i>
              </button>
              <div className={"px-dd-l"}>
                <a href={"#"} data-px-link={"about"}>
                  <b>
                    {"About Pexly"}
                  </b>
                  <small>
                    {"Our mission and story"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"team"}>
                  <b>
                    {"Our Team"}
                  </b>
                  <small>
                    {"The people behind Pexly"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"careers"}>
                  <b>
                    {"Careers"}
                  </b>
                  <small>
                    {"Open roles"}
                  </small>
                </a>
              </div>
            </div>
            <div className={"px-mob-btns"}>
              <a className={"px-btn ghost"} href={"#"}>
                {"Connect Wallet"}
              </a>
              <a className={"px-btn solid"} href={"#"} data-px-link={"giftcards"}>
                {"Start Shopping"}
              </a>
            </div>
          </nav>
          <div className={"px-right"}>
            <a className={"px-btn ghost"} href={"#"}>
              {"Connect Wallet"}
            </a>
            <a className={"px-btn solid"} href={"#"} data-px-link={"giftcards"}>
              {"Start Shopping"}
            </a>
          </div>
          <button className={"px-burger"} id={"pxburger"} aria-label={"Menu"} aria-expanded={"false"}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
      <main id={"top"}>
        <CategoryStrip active={category} onPick={setCategory} />
        <SearchBar value={search} onSearch={setSearch} />
        {search ? null : <JustInRail list={justIn} loading={rail.loading} />}
        <ShopAllProducts
          category={category}
          search={search}
          excludeIds={search ? NO_IDS : rail.reservedIds}
          waitForIds={!search && !rail.idsReady}
        />
      </main>
      <footer className={"footer"}>
        <div className={"padding-global"}>
          <div className={"container-large"}>
            <div className={"footer-content-box"}>
              <div className={"footer-content-upper"}>
                <div className={"footer-upper-left-content"}>
                  <div className={"footer-upper-logo-block"}>
                    <span className={"px-flogo"}>
                      <span className={"px-logo-mark"}>
                        {"p"}
                      </span>
                      {"pexly"}
                    </span>
                  </div>
                  <div className={"footer-upper-text-block"}>
                    <p className={"p-regular text-lightgrey"}>
                      {"Pexly is one decentralized marketplace for shopping with crypto."}
                      <br />
                      {"‍"}
                      <br />
                      {" Buy gift cards, top up mobile phones and order physical products, all from your own wallet."}
                    </p>
                  </div>
                  <div className={"footer-upper-coin-icon-block"}>
                    <img src={"/marketing-media/media-e04327e51cd5c862.avif"} loading={"lazy"} alt={""} className={"footer-upper-coin"} />
                  </div>
                  <div className={"footer-upper-text-block"}>
                    <p className={"p-regular light-gray"}>
                      {"Decentralized. Non-custodial. Borderless."}
                    </p>
                  </div>
                  <div className={"footer-social-link-wrap"}>
                    <a href={"#"} className={"footer-social-link-block w-inline-block"}>
                      <svg xmlns={"http://www.w3.org/2000/svg"} width={"100%"} viewBox={"0 0 14 12"} fill={"none"} className={"footer-social-link-icon"}>
                        <path d={"M10.4416 0H12.3925L8.1304 4.87129L13.1444 11.5H9.21849L6.1436 7.4797L2.62515 11.5H0.673105L5.23183 6.2896L0.421875 0H4.44747L7.22689 3.6747L10.4416 0ZM9.7569 10.3323H10.8379L3.86009 1.10636H2.70006L9.7569 10.3323Z"} fill={"currentColor"}></path>
                      </svg>
                    </a>
                    <a href={"#"} className={"footer-social-link-block w-inline-block"}>
                      <svg xmlns={"http://www.w3.org/2000/svg"} width={"100%"} viewBox={"0 0 20 20"} fill={"none"} className={"footer-social-link-icon"}>
                        <mask id={"mask0_3988_4230"} style={{"maskType": "luminance"} as any} maskUnits={"userSpaceOnUse"} x={"3"} y={"2"} width={"14"} height={"16"}>
                          <path d={"M17 2.75H3V17.522H17V2.75Z"} fill={"white"}></path>
                        </mask>
                        <g mask={"url(#mask0_3988_4230)"}>
                          <path d={"M10.7972 7.88289C11.0942 7.10744 11.7173 6.8054 12.4559 6.69064C13.1348 6.58479 13.8207 6.57277 14.4984 6.71196C15.479 6.91319 16.1533 7.49168 16.5297 8.41485C16.8008 9.0798 16.9423 9.77771 16.9508 10.4919C16.978 12.7589 16.9834 15.0259 17.0043 17.293C17.0059 17.481 16.9322 17.5186 16.7651 17.5175C15.8799 17.5116 14.9947 17.5093 14.1096 17.519C13.9095 17.5213 13.8599 17.4546 13.8606 17.2635C13.8665 15.3253 13.8657 13.387 13.8626 11.4488C13.8618 11.0987 13.8273 10.7489 13.6544 10.4345C13.369 9.91496 12.8708 9.775 12.3373 9.77383C11.7894 9.77267 11.2509 9.89984 11.0031 10.4566C10.8686 10.7586 10.8088 11.1173 10.8057 11.4511C10.7879 13.37 10.7972 15.2888 10.7968 17.2077C10.7968 17.4121 10.695 17.5145 10.4913 17.5147C9.6321 17.5147 8.77251 17.5101 7.91331 17.5182C7.72488 17.5202 7.65586 17.474 7.65625 17.2713C7.66207 13.8019 7.66168 10.3321 7.65703 6.86279C7.65703 6.67707 7.7117 6.61852 7.89858 6.62046C8.78376 6.6286 9.66894 6.63015 10.5541 6.61968C10.7581 6.61736 10.8073 6.69025 10.8003 6.87791C10.7879 7.21252 10.7972 7.5479 10.7972 7.88289Z"} fill={"currentColor"}></path>
                          <path d={"M6.14019 12.0889C6.14019 13.8073 6.14019 15.5261 6.14019 17.2445C6.14019 17.5186 6.13902 17.5198 5.86102 17.5198C4.98864 17.5201 4.11665 17.5155 3.24465 17.5232C3.06126 17.5248 3.00038 17.4721 3.00038 17.2832C3.00542 13.8139 3.00542 10.3445 3 6.87513C3 6.677 3.06126 6.62311 3.25396 6.62505C4.12595 6.63396 4.99833 6.62854 5.87033 6.62892C6.13864 6.62892 6.1398 6.63009 6.1398 6.89413C6.14019 8.62571 6.14019 10.3573 6.14019 12.0889Z"} fill={"currentColor"}></path>
                          <path d={"M6.13554 4.32223C6.13477 5.21361 5.45818 5.88631 4.56331 5.88554C3.67232 5.88476 2.99961 5.2078 3 4.31292C3.00078 3.42193 3.67736 2.74923 4.57223 2.75C5.46439 2.75078 6.13593 3.4262 6.13554 4.32223Z"} fill={"currentColor"}></path>
                        </g>
                      </svg>
                    </a>
                  </div>
                </div>
                <div className={"footer-upper-right-content"}>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Marketplace"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Gift Cards"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Mobile Top Up"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Physical Products"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Open a Store"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Order History"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Price Alerts"}
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Wallet"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Connect Wallet"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with BTC"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with ETH"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with USDT"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with USDC"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Fees"}
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Support"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Help Center"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Dispute Resolution"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Contact Us"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"FAQ"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Report a Seller"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Status"}
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Company"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"About Pexly"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Blog"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Careers"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Press"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Terms"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Privacy"}
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className={"footer-bottom-content-wrap"}>
                <div className={"footer-big-logo-wrap"}>
                  <div className={"px-big"}>
                    {"PEXLY"}
                  </div>
                  <div className={"footer-logo-line"}></div>
                </div>
                <div className={"footer-bottom-text-wrapper"}>
                  <div className={"footer-bottom-text-left"}>
                    <p className={"p-xs light-gray"}>
                      {"2026 — All rights reserved. Pexly is a decentralized, non-custodial marketplace. Crypto assets are volatile, so only spend what you can afford to. Availability of gift cards, top ups and products varies by region."}
                    </p>
                  </div>
                  <div className={"footer-bottom-link-wrap"}>
                    <a href={"#"} className={"footer-link-item w-inline-block"}>
                      <div className={"p-xs light-gray"}>
                        {"Terms & policies"}
                      </div>
                    </a>
                    <a href={"#"} className={"footer-link-item w-inline-block"}>
                      <div className={"p-xs light-gray"}>
                        {"Privacy Policy"}
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </CurrentMarketingPage>
  );
}
