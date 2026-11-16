import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { CurrentMarketingPage } from "@/components/marketing/current-marketing-page";
import {
  shopifyService,
  formatPrice,
  MARKET_CHANGED_EVENT,
  type ShopifyProduct,
} from "@/lib/shopify-service";
import { useAirtimeOperators } from "@/hooks/use-airtime-operators";
import { useGiftCardCatalog } from "@/hooks/use-gift-card-catalog";
// Same helpers the gift cards page uses.
import {
  airTile,
  giftTile,
  guessCountry,
  preferredRank,
  savedCountry,
  uniqueByName,
  type CardTile,
} from "@/lib/gift-card-utils";

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
.sp-masonry{display:flex;gap:12px;margin-top:22px;align-items:flex-start}
@media(min-width:700px){.sp-masonry{gap:18px}}
.sp-mcol{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:18px}
.sp-masonry .sp-card{width:auto;min-width:0;flex:none;max-width:none}
.sp-masonry .sp-card a.sp-card-link{display:block;color:inherit;text-decoration:none}
.sp-masonry .sp-img.sp-real{position:relative;overflow:hidden;border-radius:16px;background:#f3f7f6;width:100%}
.sp-masonry .sp-img.sp-real img.sp-real-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.sp-masonry .sp-card h3{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sp-masonry .sp-skel{width:100%;aspect-ratio:auto}
.sp-row .sp-img.sp-real{aspect-ratio:1/1}
.sp-skel.sp-skel-sq{flex:0 0 190px}
.sp-cat .t.sp-cat-img{background-size:cover;background-position:center;background-repeat:no-repeat}
.sp-all-grid .sp-card h3{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sp-skel{aspect-ratio:1/1;border-radius:18px;background:linear-gradient(90deg,#eef2f1,#f7f9f8,#eef2f1);background-size:200% 100%;animation:sp-pulse 1.2s linear infinite}
@keyframes sp-pulse{to{background-position:-200% 0}}
.sp-more-wrap{display:flex;justify-content:center;margin-top:34px}
.sp-more{display:inline-flex;align-items:center;justify-content:center;min-width:200px;height:54px;padding:0 30px;border:1.5px solid #091e1c;border-radius:999px;background:#fff;color:#091e1c;font-family:inherit;font-weight:700;font-size:17px;cursor:pointer}
.sp-more:hover{background:#bef264}
.sp-more[disabled]{opacity:.6;cursor:default}
.sp-note{margin:30px 0;text-align:center;color:#52625f;font-size:15px}
.sp-note button{text-decoration:underline;background:none;border:0;color:inherit;cursor:pointer;font:inherit}
.sp-filter-pill{display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:8px 8px 8px 16px;border:1.5px solid #e3ebe9;border-radius:999px;font-weight:700;font-size:15px;color:#091e1c;background:#fff}
.sp-filter-pill button{width:28px;height:28px;border:0;border-radius:50%;background:#f3f7f6;color:#091e1c;cursor:pointer;font-size:16px;line-height:1}
`;

// ---------------------------------------------------------------------------
// Shop by category: real categories taken from the store's own products
// ---------------------------------------------------------------------------
type ShopCategory = { name: string; img?: string; count: number };

const CATEGORY_GRADIENTS = [
  "linear-gradient(135deg,#3b1055,#c026d3)",
  "linear-gradient(135deg,#9f1239,#fb7185)",
  "linear-gradient(135deg,#0a0a0a,#3f3f46)",
  "linear-gradient(135deg,#2e1065,#a78bfa)",
  "linear-gradient(135deg,#1e3a8a,#38bdf8)",
  "linear-gradient(135deg,#9a3412,#fdba74)",
];

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
    (async () => {
      const [types, prods] = await Promise.all([
        shopifyService.getProductTypes(250).catch(() => [] as string[]),
        shopifyService.getProducts(250, undefined, undefined).catch(() => ({ products: [] as any[] })),
      ]);
      if (!alive) return;
      const map = new Map<string, ShopCategory>();
      for (const t of types as string[]) {
        const name = String(t).trim();
        if (name && !map.has(name)) map.set(name, { name, count: 0 });
      }
      for (const { node } of prods.products as ShopifyProduct[]) {
        const name = (node.productType || "").trim();
        if (!name) continue;
        const img = node.images?.edges?.[0]?.node?.url;
        const cur = map.get(name) ?? { name, count: 0 };
        cur.count += 1;
        if (!cur.img && img) cur.img = img;
        map.set(name, cur);
      }
      setCats(Array.from(map.values()).sort((x, y) => y.count - x.count || x.name.localeCompare(y.name)));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { cats, loading };
}

function ShopCategories({ onPick }: { onPick: (name: string) => void }) {
  const { cats, loading } = useShopCategories();
  if (!loading && cats.length === 0) return null;

  return (
    <section id={"categories"} className={"sp-sec"}>
      <div className={"padding-global"}>
        <div className={"container-large"}>
          <div className={"sp-head"}>
            <h2 className={"sp-h"}>{"Shop by category"}</h2>
            <a className={"sp-all"} href={"#all-products"} onClick={() => onPick("")}>{"View all"}</a>
          </div>
          <div className={"sp-row sp-cats"}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className={"sp-skel sp-skel-card"}></div>)
              : cats.map((c, i) => (
                <a key={c.name} className={"sp-cat"} href={"#all-products"} onClick={() => onPick(c.name)}>
                  <div
                    className={c.img ? "t sp-cat-img" : "t"}
                    style={{
                      background: c.img ? undefined : CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length],
                      backgroundImage: c.img ? `url("${c.img}")` : undefined,
                    } as any}
                  >
                    {c.img ? null : <Glyph k={"box"} size={64} stroke={"#fff"} sw={1.2} />}
                  </div>
                  <div className={"l"}>{c.name}</div>
                </a>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function columnsForWidth(): number {
  if (typeof window === "undefined") return 2;
  const w = window.innerWidth;
  return w >= 1280 ? 5 : w >= 1000 ? 4 : w >= 700 ? 3 : 2;
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

function ShopAllProducts({ category, onClearCategory }: { category: string; onClearCategory: () => void }) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const colCount = useColumnCount();
  const cols = useMemo(() => {
    const out = Array.from({ length: colCount }, () => ({ h: 0, items: [] as { p: ShopifyProduct; r: number }[] }));
    for (const p of products) {
      const r = photoRatio(p.node);
      let target = out[0];
      for (const c of out) if (c.h < target.h) target = c;
      target.items.push({ p, r });
      target.h += r + 0.45;
    }
    return out;
  }, [products, colCount]);

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
    <section id={"all-products"} className={"sp-sec"}>
      <div className={"padding-global"}>
        <div className={"container-large"}>
          <div className={"sp-head"}>
            <div>
              <h2 className={"sp-h"}>{category ? category : "All products"}</h2>
              <p className={"sp-sub"}>{"Real products from verified sellers, paid in crypto."}</p>
              {category ? (
                <div className={"sp-filter-pill"}>
                  <span>{category}</span>
                  <button type={"button"} aria-label={"Clear filter"} onClick={onClearCategory}>{"×"}</button>
                </div>
              ) : null}
            </div>
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
                        <Link href={href} className={"sp-card-link"}>
                          <div className={"sp-img sp-real"} style={{ aspectRatio: "1 / " + r }}>
                            {img?.url ? (
                              <img className={"sp-real-img"} src={img.url} alt={img.altText || node.title} loading={"lazy"} />
                            ) : null}
                          </div>
                          <h3>{node.title}</h3>
                          <p className={"sp-price"}>
                            <b>{price ? formatPrice(price.amount, price.currencyCode) : ""}</b>
                          </p>
                        </Link>
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
          ) : !loading && products.length === 0 ? (
            <p className={"sp-note"}>{category ? "No products found in this category yet." : "No products available right now."}</p>
          ) : null}

          {!loading && hasMore ? (
            <div className={"sp-more-wrap"}>
              <button type={"button"} className={"sp-more"} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}


// ---------------------------------------------------------------------------
// Shared tile pieces (no "+" buttons anywhere)
// ---------------------------------------------------------------------------
type IconKey = "earbuds" | "watch" | "sneaker" | "lamp" | "bag" | "gamepad" | "phone" | "box" | "gift";

const ICONS: Record<IconKey, ReactNode> = {
  earbuds: (
    <>
      <path d="M4 15v-3a8 8 0 0116 0v3" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </>
  ),
  watch: (
    <>
      <rect x="7" y="6" width="10" height="12" rx="3" />
      <path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3" />
    </>
  ),
  sneaker: <path d="M3 16c0-2 2-3 4-3l3-4 3 3 5 1c2 0 3 1 3 3v2H3z" />,
  lamp: <path d="M8 3h8l3 9H5l3-9zM12 12v7M8 21h8" />,
  bag: <path d="M6 8h12l1 12H5L6 8zM9 8a3 3 0 016 0" />,
  gamepad: (
    <>
      <rect x="2" y="8" width="20" height="10" rx="5" />
      <path d="M7 11v4M5 13h4" />
      <circle cx="16" cy="12" r="1" />
      <circle cx="18.5" cy="14.5" r="1" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  box: <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" />,
  gift: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 13h18M12 8c-2-4-6-3-5 0 .6 1.5 3 1.2 5 0zm0 0c2-4 6-3 5 0-.6 1.5-3 1.2-5 0z" />
    </>
  ),
};

const FLAME_PATH = "M12 2c1 3-1 4.5-2.5 6.5C8 10.5 7 12 7 14.5A5 5 0 0017 14.5c0-2-1-3.5-2-4.5.2 1.5-.3 2.5-1.2 3 .5-3-.3-6.5-1.8-11z";
const SPARK_PATH = "M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 14l.9 2.6L22.5 18l-2.6.9L19 21.5l-.9-2.6L15.5 18l2.6-.9z";

function Glyph({ k, size = 92, stroke = "#091e1c", sw = 1.1 }: { k: IconKey; size?: number; stroke?: string; sw?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[k]}
    </svg>
  );
}

function Badge({ label, hot }: { label: string; hot?: boolean }) {
  return (
    <span className="sp-badge">
      <svg viewBox="0 0 24 24" width="16" height="16" fill={hot ? "#e8590c" : "#14924f"}>
        <path d={hot ? FLAME_PATH : SPARK_PATH} />
      </svg>
      {label}
    </span>
  );
}

function shuffled<T>(list: T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Product rails: Hot right now + Our top picks, built from real store products
// ---------------------------------------------------------------------------
type RailProduct = {
  id: string;
  handle: string;
  title: string;
  img?: string;
  alt: string;
  amountRaw: any;
  amount: number;
  currency: string;
  wasRaw?: any;
  wasAmount?: number;
  createdAt?: number;
};

function toRail(p: ShopifyProduct): RailProduct {
  const n: any = p.node;
  const price = n.priceRange?.minVariantPrice;
  const cmp = n.compareAtPriceRange?.minVariantPrice;
  const amount = Number(price?.amount ?? 0);
  const cmpAmount = Number(cmp?.amount ?? 0);
  const hasWas = cmpAmount > amount && amount > 0;
  const created = n.createdAt ? Date.parse(n.createdAt) : NaN;
  const img = n.images?.edges?.[0]?.node;
  return {
    id: n.id,
    handle: n.handle,
    title: n.title,
    img: img?.url,
    alt: img?.altText || n.title,
    amountRaw: price?.amount,
    amount,
    currency: price?.currencyCode || "USD",
    wasRaw: hasWas ? cmp.amount : undefined,
    wasAmount: hasWas ? cmpAmount : undefined,
    createdAt: Number.isNaN(created) ? undefined : created,
  };
}

function useRailProducts() {
  const [items, setItems] = useState<RailProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await shopifyService.getProducts(100, undefined, undefined);
        if (!alive) return;
        setItems((res.products as ShopifyProduct[]).map(toRail));
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
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

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function badgeFor(p: RailProduct, now: number): string | undefined {
  if (p.wasAmount && p.amount > 0) {
    const pct = Math.round((1 - p.amount / p.wasAmount) * 100);
    if (pct >= 1) return "SAVE " + pct + "%";
  }
  if (p.createdAt && now - p.createdAt < NEW_WINDOW_MS) return "NEW";
  return undefined;
}

function ProductCard({ p, now }: { p: RailProduct; now: number }) {
  const badge = badgeFor(p, now);
  return (
    <article className={"sp-card"}>
      <Link href={"/shop/product/" + p.handle} className={"sp-card-link"}>
        <div className={"sp-img sp-real"}>
          {badge ? <Badge label={badge} /> : null}
          {p.img ? <img className={"sp-real-img"} src={p.img} alt={p.alt} loading={"lazy"} /> : null}
        </div>
        <h3>{p.title}</h3>
        <p className={"sp-price"}>
          {p.wasRaw ? <s>{formatPrice(p.wasRaw, p.currency as any)}</s> : null}
          <b>{formatPrice(p.amountRaw, p.currency as any)}</b>
        </p>
      </Link>
    </article>
  );
}

function ProductRails() {
  const { items, loading } = useRailProducts();
  const [seed, setSeed] = useState(0);
  const [filter, setFilter] = useState("all");
  const now = useMemo(() => Date.now(), []);

  const hot = useMemo(() => shuffled(items.slice(0, 40)).slice(0, 8), [items, seed]);

  const currency = items[0]?.currency || "USD";
  const filters = useMemo(() => {
    const all = { key: "all", label: "All", list: items.slice(0, 12) };
    const fresh = items.filter((p) => p.createdAt && now - p.createdAt < NEW_WINDOW_MS).slice(0, 12);
    const sale = items.filter((p) => p.wasAmount).slice(0, 12);
    const under = items.filter((p) => p.amount > 0 && p.amount < 50).slice(0, 12);
    return [
      all,
      { key: "new", label: "New", list: fresh },
      { key: "sale", label: "On sale", list: sale },
      { key: "under50", label: "Under " + formatPrice("50", currency as any), list: under },
    ].filter((f) => f.key === "all" || f.list.length > 0);
  }, [items, now, currency]);

  const active = filters.find((f) => f.key === filter) || filters[0];

  if (!loading && items.length === 0) return null;

  const skeletons = Array.from({ length: 6 }).map((_, i) => <div key={i} className={"sp-skel sp-skel-sq"}></div>);

  return (
    <>
      <section id={"hot"} className={"sp-sec"}>
        <div className={"padding-global"}>
          <div className={"container-large"}>
            <div className={"sp-head"}>
              <div>
                <h2 className={"sp-h"}>{"Hot right now"}</h2>
                <p className={"sp-sub"}>{"A fresh mix of products, picked at random each visit."}</p>
              </div>
              <a className={"sp-all"} href={"#hot"} onClick={(e) => { e.preventDefault(); setSeed((n) => n + 1); }}>
                {"Shuffle"}
              </a>
            </div>
            <div className={"sp-row"}>
              {loading ? skeletons : hot.map((p) => <ProductCard key={p.id} p={p} now={now} />)}
            </div>
          </div>
        </div>
      </section>

      <section id={"top-picks"} className={"sp-sec"}>
        <div className={"padding-global"}>
          <div className={"container-large"}>
            <div className={"sp-head"}>
              <div>
                <h2 className={"sp-h"}>{"Our top picks"}</h2>
                <p className={"sp-sub"}>{"Real products from verified sellers, paid in crypto."}</p>
              </div>
              <a className={"sp-all"} href={"#all-products"}>{"View all"}</a>
            </div>
            {!loading && filters.length > 1 ? (
              <div className={"sp-chips"}>
                {filters.map((f) => (
                  <button key={f.key} type={"button"} className={active.key === f.key ? "on" : ""} onClick={() => setFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className={"sp-row"}>
              {loading ? skeletons : active.list.map((p) => <ProductCard key={p.id} p={p} now={now} />)}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Gift cards + mobile top ups, from the same data the gift cards page uses
// ---------------------------------------------------------------------------
const HOME_GIFT_COUNT = 6;
const HOME_TOPUP_COUNT = 4;

function GiftCardsAndTopUps() {
  const country = useMemo(() => savedCountry() ?? guessCountry(), []);
  const cat = useGiftCardCatalog({ countryCode: country, size: 40, enabled: true });
  const air = useAirtimeOperators(country, true);

  const tiles = useMemo(() => {
    const raw = (cat.data?.pages?.[0]?.content ?? []).filter((p: any) => p.status !== "INACTIVE");
    const sorted = [...uniqueByName(raw)].sort(
      (a: any, b: any) => preferredRank(a.brand?.brandName || a.productName) - preferredRank(b.brand?.brandName || b.productName),
    );
    const gifts: CardTile[] = sorted.slice(0, HOME_GIFT_COUNT).map(giftTile);
    const topups: CardTile[] = (air.data ?? []).slice(0, HOME_TOPUP_COUNT).map(airTile);
    // Alternate gift card, top up, gift card, top up ...
    const out: { t: CardTile; kind: string }[] = [];
    for (let i = 0; i < Math.max(gifts.length, topups.length); i++) {
      if (gifts[i]) out.push({ t: gifts[i], kind: "g" });
      if (topups[i]) out.push({ t: topups[i], kind: "a" });
    }
    return out;
  }, [cat.data, air.data]);

  const loading = cat.isLoading && air.isLoading;
  const failed = cat.isError && air.isError;

  return (
    <section id={"giftcards"} className={"sp-sec"}>
      <div className={"padding-global"}>
        <div className={"container-large"}>
          <div className={"sp-head"}>
            <div>
              <h2 className={"sp-h"}>{"Gift Cards & Mobile Top Up"}</h2>
              <p className={"sp-sub"}>{"Gift cards, airtime and data, paid in crypto."}</p>
            </div>
            <a className={"sp-all"} id={"gtall"} href={"#"} data-px-link={"giftcards"}>{"View all"}</a>
          </div>
          <div className={"sp-row"} id={"gtrow"}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className={"sp-skel sp-skel-card"}></div>)
              : tiles.map(({ t, kind }) => (
                <article key={kind + "-" + t.id} className={"sp-card"}>
                  <a className={"sp-card-link"} href={t.href}>
                    <div className={"sp-img sp-real sp-gc"}>
                      {t.img ? (
                        <img
                          className={"sp-real-img"}
                          src={t.img}
                          alt={t.name}
                          loading={"lazy"}
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className={"sp-pr"} style={{ background: kind === "a" ? "#e3f9dc" : "#fff0c7" }}>
                          <Glyph k={kind === "a" ? "phone" : "gift"} />
                        </div>
                      )}
                    </div>
                    <h3>{t.name}</h3>
                    {t.range ? <p className={"sp-price"}><b>{t.range}</b></p> : null}
                  </a>
                </article>
              ))}
          </div>
          {failed ? <p className={"sp-note"}>{"Gift cards couldn’t be loaded right now."}</p> : null}
        </div>
      </div>
    </section>
  );
}

export function PhysicalProductsExport() {
  const [category, setCategory] = useState("");
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
        <section className={"section-h-v3-hero"}>
          <div className={"padding-global"}>
            <div className={"container-large"}>
              <div className={"v3-herocontent-wrapper"}>
                <div className={"v3-hero-content"}>
                  <h1 data-w-id={"efc00cef-13a7-739b-1069-88d52025811f"} className={"h1-large"}>
                    {"Real goods. Paid in crypto."}
                  </h1>
                  <div className={"v3-hero-text-block"}>
                    <p data-w-id={"9be5ebdd-eacb-1105-68a6-cae003ce4cfc"} className={"p-large cyan"}>
                      {"Order electronics, fashion, home and gaming gear from verified sellers. Pay with crypto straight from your own wallet."}
                    </p>
                  </div>
                  <div data-w-id={"0f339b4c-3cc1-73c1-73d5-37ae38bef528"} className={"v3-hero-btn-wrap"}>
                    <a href={"#all-products"} className={"btn-primary w-button"}>
                      {"Browse Products"}
                    </a>
                  </div>
                </div>
                <div data-w-id={"4c14da3e-38d8-bfee-2ab8-a136ac40cf4e"} className={"v3-hero-right-block"}>
                  <div className={"v3-hero-banner-block"}>
                    <img src={"/marketing-media/media-1ee388ec36d8c9a7.avif"} loading={"lazy"} alt={""} className={"v3-hero-banner"} />
                  </div>
                  <div className={"v3-tag-block"}>
                    <div className={"px-tag px-tag1"}>
                      <div className={"r"}>
                        <span className={"b"}>
                          {"pexly"}
                        </span>
                      </div>
                      <div className={"big"}>
                        {"Order #4821"}
                      </div>
                    </div>
                  </div>
                  <div className={"v3-tag-block _2"}>
                    <div className={"px-tag px-tag2"}>
                      <span className={"ic"}>
                        {"₮"}
                      </span>
                      <div className={"m"}>
                        <b>
                          {"Wireless Earbuds"}
                        </b>
                        <small>
                          {"Paid with USDT"}
                        </small>
                      </div>
                      <div className={"e"}>
                        <b>
                          {"$39.00"}
                        </b>
                        <small>
                          {"Shipped"}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <ShopCategories onPick={setCategory} />
        <GiftCardsAndTopUps />
        <section className={"sp-sec tight"} id={"why"}>
          <div className={"padding-global"}>
            <div className={"container-large"}>
              <div className={"sp-guide"}>
                <img src={"/marketing-media/media-ee8829bd9b5cc5ab.avif"} alt={""} />
                <div className={"ov"}>
                  <span>
                    {"Why shop"}
                  </span>
                  <b>
                    {"physical products on Pexly"}
                  </b>
                  <p style={{"margin": "0 0 18px", "maxWidth": "30em", "fontSize": "clamp(16px,1.5vw,19px)", "lineHeight": "1.5", "color": "rgba(255,255,255,.92)"} as any}>
                    {"Real goods from verified sellers, paid straight from your own wallet."}
                  </p>
                  <a className={"sp-btn light"} href={"#sellers"}>
                    {"See how it works"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <ProductRails />
        <ShopAllProducts category={category} onClearCategory={() => setCategory("")} />
        <section className={"sp-sec"}>
          <div className={"padding-global"}>
            <div className={"container-large"}>
              <h2 className={"sp-h center"}>
                {"Explore the rest of the marketplace"}
              </h2>
              <div className={"sp-looks"}>
                <figure className={"sp-look"}>
                  <img src={"/marketing-media/media-59c99a35d948f6c1.avif"} alt={""} />
                  <a className={"sp-pill"} href={"#"} data-px-link={"giftcards"}>
                    <svg viewBox={"0 0 24 24"} width={"20"} height={"20"} fill={"none"} stroke={"#091e1c"} strokeWidth={"1.8"}>
                      <path d={"M3 12l9-9h8v8l-9 9z"}></path>
                      <circle cx={"16"} cy={"8"} r={"1.2"}></circle>
                    </svg>
                    {"Shop Gift Cards"}
                  </a>
                </figure>
                <figure className={"sp-look"}>
                  <img src={"/marketing-media/media-f9de0167e3e0ed2c.avif"} alt={""} />
                  <a className={"sp-pill"} href={"#"} data-px-link={"home#top-up"}>
                    <svg viewBox={"0 0 24 24"} width={"20"} height={"20"} fill={"none"} stroke={"#091e1c"} strokeWidth={"1.8"}>
                      <path d={"M3 12l9-9h8v8l-9 9z"}></path>
                      <circle cx={"16"} cy={"8"} r={"1.2"}></circle>
                    </svg>
                    {"Shop Top Ups"}
                  </a>
                </figure>
                <figure className={"sp-look"}>
                  <img src={"/marketing-media/media-d9e7636fc944d27d.avif"} alt={""} />
                  <a className={"sp-pill"} href={"#sellers"}>
                    <svg viewBox={"0 0 24 24"} width={"20"} height={"20"} fill={"none"} stroke={"#091e1c"} strokeWidth={"1.8"}>
                      <path d={"M3 12l9-9h8v8l-9 9z"}></path>
                      <circle cx={"16"} cy={"8"} r={"1.2"}></circle>
                    </svg>
                    {"Start Selling"}
                  </a>
                </figure>
              </div>
            </div>
          </div>
        </section>
        <section className={"sp-reviews"}>
          <div className={"padding-global"}>
            <div className={"container-large"}>
              <div className={"sp-stars"}>
                {"★★★★★"}
              </div>
              <h2 className={"sp-h center"}>
                {"What people are saying"}
              </h2>
              <div className={"sp-row"}>
                <article className={"sp-rev"}>
                  <div className={"st"}>
                    {"★★★★★"}
                  </div>
                  <p>
                    {"Ordered earbuds from a verified seller. They arrived in four days and tracking was clear the whole way."}
                  </p>
                  <div className={"by"}>
                    <b>
                      {"James T."}
                    </b>
                    <span>
                      <i>
                        {"✓"}
                      </i>
                      {"Verified buyer"}
                    </span>
                  </div>
                </article>
                <article className={"sp-rev"}>
                  <div className={"st"}>
                    {"★★★★★"}
                  </div>
                  <p>
                    {"Paid with USDT, got tracking the same day. Easiest online order I have made with crypto."}
                  </p>
                  <div className={"by"}>
                    <b>
                      {"Marie K."}
                    </b>
                    <span>
                      <i>
                        {"✓"}
                      </i>
                      {"Verified buyer"}
                    </span>
                  </div>
                </article>
                <article className={"sp-rev"}>
                  <div className={"st"}>
                    {"★★★★★"}
                  </div>
                  <p>
                    {"The seller ratings helped me pick. Sneakers fit perfectly and the seller was easy to reach."}
                  </p>
                  <div className={"by"}>
                    <b>
                      {"Adaeze O."}
                    </b>
                    <span>
                      <i>
                        {"✓"}
                      </i>
                      {"Verified buyer"}
                    </span>
                  </div>
                </article>
                <article className={"sp-rev"}>
                  <div className={"st"}>
                    {"★★★★★"}
                  </div>
                  <p>
                    {"Finally I can spend my crypto on real things without cashing out first."}
                  </p>
                  <div className={"by"}>
                    <b>
                      {"Sonia D."}
                    </b>
                    <span>
                      <i>
                        {"✓"}
                      </i>
                      {"Verified buyer"}
                    </span>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>
        <section className={"sp-sec tight"}>
          <div className={"padding-global"}>
            <div className={"container-large"}>
              <p className={"sp-eyebrow"}>
                {"Pay with"}
              </p>
              <div className={"sp-marq"}>
                <div className={"in"}>
                  <span>
                    {"Bitcoin"}
                  </span>
                  <span>
                    {"Ethereum"}
                  </span>
                  <span>
                    {"USDT"}
                  </span>
                  <span>
                    {"USDC"}
                  </span>
                  <span>
                    {"BNB"}
                  </span>
                  <span>
                    {"Solana"}
                  </span>
                  <span>
                    {"Litecoin"}
                  </span>
                  <span>
                    {"Tron"}
                  </span>
                  <span>
                    {"Bitcoin"}
                  </span>
                  <span>
                    {"Ethereum"}
                  </span>
                  <span>
                    {"USDT"}
                  </span>
                  <span>
                    {"USDC"}
                  </span>
                  <span>
                    {"BNB"}
                  </span>
                  <span>
                    {"Solana"}
                  </span>
                  <span>
                    {"Litecoin"}
                  </span>
                  <span>
                    {"Tron"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id={"sellers"} className={"sp-feature"}>
          <div className={"padding-global"}>
            <div className={"container-large"}>
              <div className={"sp-feature-in"}>
                <img src={"/marketing-media/media-ebc41a5685db3420.avif"} alt={""} />
                <div className={"txt"}>
                  <h2 className={"sp-h"}>
                    {"Verified sellers"}
                  </h2>
                  <p>
                    {"Every seller is rated by real buyers. Shop with confidence, or open your own store and sell to a global crypto audience."}
                  </p>
                  <a className={"sp-btn"} href={"#"}>
                    {"Open your store"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id={"start"} className={"sp-signup"}>
          <svg className={"wave"} viewBox={"0 0 1440 120"} preserveAspectRatio={"none"}>
            <path d={"M0 120V60C120 20 240 0 380 30s260 70 420 40 260-60 400-30 180 50 240 30v80z"} fill={"#091e1c"}></path>
          </svg>
          <div className={"padding-global"}>
            <div className={"container-large"}>
              <div className={"in"}>
                <h2>
                  {"Get 5% back on your first order when you sign up for email!"}
                </h2>
                <div className={"f"}>
                  <input type={"email"} placeholder={"Email address"} aria-label={"Email"} />
                  <button aria-label={"Subscribe"}>
                    {"→"}
                  </button>
                </div>
                <small>
                  {"By submitting this form you agree to receive marketing emails from Pexly. Unsubscribe at any time."}
                </small>
              </div>
            </div>
          </div>
        </section>
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
