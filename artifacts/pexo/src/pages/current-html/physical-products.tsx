import "./page-styles/physical-products.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CurrentMarketingPage } from "@/components/marketing/current-marketing-page";
import {
  shopifyService,
  formatPrice,
  MARKET_CHANGED_EVENT,
  type ShopifyProduct,
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
.tm-rail{scroll-snap-type:x mandatory}
.tm-rail .sp-card{flex:0 0 min(calc(100vw - 56px),420px);width:min(calc(100vw - 56px),420px);scroll-snap-align:start}
@media(min-width:700px){.tm-rail .sp-card{flex-basis:240px;width:240px}}
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
.tm-rail .sp-price{margin:4px 0 0;font-size:15px;color:#464646;font-variant-numeric:tabular-nums}
.ed-foot{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:28px;padding:14px 0;border-top:1px solid #e3ebe9;font-size:13px;color:#464646}
.sp-img.sp-real{position:relative;overflow:hidden;background:#f3f7f6}
.sp-img.sp-real img.sp-real-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.sp-card a.sp-card-link{display:block;color:inherit;text-decoration:none}
.sp-img.sp-gc{aspect-ratio:1.586;border:1px solid #e3ebe9;border-radius:14px;display:grid;place-items:center}
.sp-skel.sp-skel-card{aspect-ratio:1.586;flex:0 0 220px}
.sp-row .sp-img.sp-real{aspect-ratio:1/1;border-radius:8px}
.sp-skel.sp-skel-sq{flex:0 0 min(calc(100vw - 56px),420px)}
@media(min-width:700px){.sp-skel.sp-skel-sq{flex-basis:240px}}
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

function useShopCategories() {
  const [cats, setCats] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let request = 0;
    const load = async () => {
      const current = ++request;
      setLoading(true);
      const [types, prods] = await Promise.all([
        shopifyService.getProductTypes(250).catch(() => [] as string[]),
        shopifyService.getProducts(250, undefined, undefined).catch(() => ({ products: [] as any[] })),
      ]);
      if (!alive || current !== request) return;
      const map = new Map<string, ShopCategory>();
      for (const t of types as string[]) {
        const name = String(t).trim();
        if (name && !map.has(name)) map.set(name, { name, count: 0 });
      }
      for (const { node } of prods.products as ShopifyProduct[]) {
        const name = (node.productType || "").trim();
        if (!name) continue;
        const img = node.images?.edges?.[0]?.node?.url;
        const cur: ShopCategory = map.get(name) ?? { name, count: 0 };
        cur.count += 1;
        if (!cur.img && img) cur.img = img;
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
  if (w > 0 && h > 0) return Math.min(1.5, Math.max(0.8, h / w));
  const steps = [1, 1.25, 1.12, 1.4, 1.18];
  let hash = 0;
  const key = String(node?.id || "");
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return steps[hash % steps.length];
}

type SortKey = "all" | "new" | "low" | "high";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "Newest" },
  { key: "low", label: "Price: low to high" },
  { key: "high", label: "Price: high to low" },
];

function ShopAllProducts({ category, excludeIds }: { category: string; excludeIds: Set<string> }) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("all");
  const requestId = useRef(0);
  const colCount = useColumnCount();

  const shown = useMemo(() => {
    const list = products.filter((p) => !excludeIds.has(p.node.id));
    const amt = (p: ShopifyProduct) => Number(p.node.priceRange?.minVariantPrice?.amount) || 0;
    const made = (p: ShopifyProduct) => (p.node as any).createdAt ? Date.parse((p.node as any).createdAt) || 0 : 0;
    if (sort === "new") list.sort((a, b) => made(b) - made(a));
    else if (sort === "low") list.sort((a, b) => amt(a) - amt(b));
    else if (sort === "high") list.sort((a, b) => amt(b) - amt(a));
    return list;
  }, [products, sort, excludeIds]);

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

  const loadFirst = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await shopifyService.getProducts(PAGE_SIZE, undefined, categoryQuery(category));
      if (id !== requestId.current) return;
      setProducts(res.products as ShopifyProduct[]);
      setHasMore(Boolean(res.pageInfo?.hasNextPage));
      setCursor(res.pageInfo?.endCursor ?? null);
    } catch (e: any) {
      if (id !== requestId.current) return;
      setProducts([]);
      setHasMore(false);
      setError(e?.message || "Could not load products");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [category]);

  useEffect(() => { loadFirst(); }, [loadFirst]);

  // Reload when the visitor switches market/country so prices stay correct.
  useEffect(() => {
    const onMarket = () => { loadFirst(); };
    window.addEventListener(MARKET_CHANGED_EVENT, onMarket);
    return () => window.removeEventListener(MARKET_CHANGED_EVENT, onMarket);
  }, [loadFirst]);

  const loadMore = async () => {
    if (!hasMore || !cursor || loadingMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const res = await shopifyService.getProducts(PAGE_SIZE, cursor, categoryQuery(category));
      if (id !== requestId.current) return;
      const next = res.products as ShopifyProduct[];
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.node.id));
        return [...prev, ...next.filter((p) => !seen.has(p.node.id))];
      });
      setHasMore(Boolean(res.pageInfo?.hasNextPage));
      setCursor(res.pageInfo?.endCursor ?? null);
    } catch (e: any) {
      setError(e?.message || "Could not load more products");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section id={"all-products"} className={"sp-sec"} style={{ paddingTop: 20 }}>
      <div className={"padding-global"}>
        <div className={"container-large"}>
          <div className={"tm-head"}>
            <h2>{category ? category : "More to love"}</h2>
          </div>
          <div className={"tm-tabs"} role={"tablist"}>
            {SORTS.map((s) => (
              <button key={s.key} type={"button"} role={"tab"} aria-selected={sort === s.key} className={sort === s.key ? "tm-tab on" : "tm-tab"} onClick={() => setSort(s.key)}>
                {s.label}
              </button>
            ))}
          </div>

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
              <button type={"button"} onClick={() => (products.length ? loadMore() : loadFirst())}>{"Try again"}</button>
            </p>
          ) : !loading && shown.length === 0 && !hasMore ? (
            <p className={"sp-note"}>{category ? "No products found in this category yet." : "No products available right now."}</p>
          ) : null}

          {!loading && hasMore ? (
            <div className={"sp-more-wrap"}>
              <button type={"button"} className={"sp-more"} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load more"}
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

function useRailProducts() {
  const [items, setItems] = useState<RailProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let request = 0;
    const load = async () => {
      const current = ++request;
      setLoading(true);
      try {
        const res = await shopifyService.getProducts(24, undefined, undefined);
        if (!alive || current !== request) return;
        setItems((res.products as ShopifyProduct[]).map(toRail));
      } catch {
        if (alive && current === request) setItems([]);
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

  return { items, loading };
}

// ---------------------------------------------------------------------------
// Just in: horizontal rail of the newest real products, right under the category tabs
// ---------------------------------------------------------------------------
const JUST_IN_COUNT = 12;

function pickJustIn(items: RailProduct[]): RailProduct[] {
  return [...items].filter((p) => p.img).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).slice(0, JUST_IN_COUNT);
}

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
  const rail = useRailProducts();
  const justIn = useMemo(() => pickJustIn(rail.items), [rail.items]);
  // Products shown in "Just in" never repeat in "More to love".
  const justInIds = useMemo(() => new Set(justIn.map((p) => p.id)), [justIn]);
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
        <JustInRail list={justIn} loading={rail.loading} />
        <ShopAllProducts category={category} excludeIds={justInIds} />
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
