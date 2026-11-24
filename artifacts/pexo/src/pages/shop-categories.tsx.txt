import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useHead } from "@unhead/react";
import { buildCanonicalUrl } from "@/lib/site-document";
import { ArrowRight, Search, ShoppingBag, X } from "@/lib/icons";
import { MARKET_CHANGED_EVENT } from "@/lib/shopify-service";
import {
  clearShopCollectionCache,
  fetchAllCollections,
  fetchCollectionCatalog,
  type CollectionCatalog,
  type ShopifyCollectionSummary,
} from "@/lib/shop-collections";

const SHOP_CATEGORIES_CSS = `
.scat-page{min-height:calc(100dvh - 58px);background:#fff;color:#091e1c;display:flex;flex-direction:column;overflow-x:clip}
@media(max-width:991px){.scat-page{min-height:calc(100dvh - 44px)}}
.scat-search-bar{position:sticky;top:58px;z-index:20;background:#fff;border-bottom:1px solid #e3ebe9;padding:10px 0}
@media(max-width:991px){.scat-search-bar{top:44px;padding:8px 0}}
.scat-page .tm-search{display:flex;align-items:center;gap:10px;padding:4px 4px 4px 12px;border:1px solid #e3ebe9;border-radius:8px;background:#fff}
.scat-page .tm-search:focus-within{border-color:#091e1c}
.scat-page .tm-search input{flex:1 1 auto;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:16px;color:#091e1c}
.scat-page .tm-search input::placeholder{color:#8a9694}
.scat-page .tm-search-x{flex:none;width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:50%;background:#f3f7f6;color:#091e1c;cursor:pointer}
.scat-page .tm-search-go{flex:none;height:34px;padding:0 14px;border:0;border-radius:5px;background:#091e1c;color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
.scat-page .tm-search-go:hover{background:#0f302c}

.scat-body{flex:1;width:100%}
@media(min-width:700px){.scat-body{padding-left:5%;padding-right:5%}}
.scat-body-in{width:100%;max-width:82.5rem;margin:0 auto;display:flex;align-items:stretch}
.scat-rail{width:104px;flex:none;background:#f3f7f6;border-right:1px solid #e3ebe9;position:sticky;top:119px;max-height:calc(100dvh - 119px);overflow-y:auto;scrollbar-width:thin}
@media(max-width:991px){.scat-rail{top:101px;max-height:calc(100dvh - 101px)}}
@media(min-width:640px){.scat-rail{width:200px}}
@media(min-width:900px){.scat-rail{width:248px}}

.scat-rail-btn{width:100%;text-align:left;padding:12px 10px;font:inherit;font-size:12.5px;line-height:1.35;font-weight:500;color:#464646;background:transparent;border:0;border-left:3px solid transparent;cursor:pointer;transition:background .15s,color .15s;overflow-wrap:anywhere}
@media(min-width:640px){.scat-rail-btn{padding:14px 16px;font-size:14px}}
.scat-rail-btn:hover{background:rgba(255,255,255,.65);color:#091e1c}
.scat-rail-btn.on{background:#fff;color:#091e1c;font-weight:700;border-left-color:#091e1c}

.scat-content{flex:1;min-width:0;background:#fff;padding:14px 12px 36px}
@media(min-width:640px){.scat-content{padding:22px 24px 48px}}
@media(min-width:1024px){.scat-content{padding:26px 32px 56px}}

.scat-col-head{padding-bottom:14px;border-bottom:1px solid #e3ebe9}
.scat-col-head h1{margin:0;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-weight:800;font-size:clamp(18px,2.4vw,26px);letter-spacing:-.025em;color:#091e1c}
.scat-col-desc{margin:4px 0 0;font-size:13px;color:#52625f;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}

.scat-groups{padding-top:18px;display:flex;flex-direction:column;gap:28px}
.scat-group-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
.scat-group-head h2{margin:0;font-size:14.5px;font-weight:700;color:#091e1c}
@media(min-width:640px){.scat-group-head h2{font-size:16px}}
.scat-group-more{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:600;color:#52625f;text-decoration:none;white-space:nowrap}
.scat-group-more:hover{color:#091e1c}

.scat-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px 10px}
@media(min-width:640px){.scat-tiles{grid-template-columns:repeat(4,minmax(0,1fr));gap:20px 16px}}
@media(min-width:960px){.scat-tiles{grid-template-columns:repeat(5,minmax(0,1fr));gap:22px 18px}}
@media(min-width:1200px){.scat-tiles{grid-template-columns:repeat(6,minmax(0,1fr))}}

.scat-tile{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;text-decoration:none;color:inherit}
.scat-tile-img{position:relative;width:100%;max-width:92px;aspect-ratio:1/1;border-radius:50%;overflow:hidden;background:#f3f7f6;border:1px solid #e3ebe9;display:grid;place-items:center;transition:border-color .15s}
.scat-tile:hover .scat-tile-img{border-color:#091e1c}
.scat-tile-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .2s}
.scat-tile:hover .scat-tile-img img{transform:scale(1.05)}
.scat-tile-label{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:12px;font-weight:500;line-height:1.3;color:#0c1111}
@media(min-width:640px){.scat-tile-label{font-size:13.5px}}
.scat-tile:hover .scat-tile-label{text-decoration:underline}
`;

function readInitialCollectionHandle(searchStr: string): string {
  const params = new URLSearchParams(searchStr);
  return (params.get("collection") || "").trim();
}

export function ShopCategoriesPage() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const [collections, setCollections] = useState<ShopifyCollectionSummary[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);

  const [selectedHandle, setSelectedHandle] = useState<string>(() =>
    readInitialCollectionHandle(searchStr),
  );
  const [catalog, setCatalog] = useState<CollectionCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [searchDraft, setSearchDraft] = useState("");
  const [reloadNonce, setReloadNonce] = useState(0);

  const canonical = buildCanonicalUrl("/shop/categories");
  const activeCollection = useMemo(
    () => collections.find((c) => c.handle === selectedHandle) ?? collections[0] ?? null,
    [collections, selectedHandle],
  );

  useHead({
    title: activeCollection
      ? `${activeCollection.title} — Shop Categories | Pexly`
      : "Shop Categories | Pexly",
    meta: [
      {
        name: "description",
        content:
          "Browse Shopify collections, product types, and product tags in the Pexly shop. Pay directly from your crypto wallet.",
      },
    ],
    link: [{ rel: "canonical", key: "canonical", href: canonical }],
  });

  // Load all Shopify collections dynamically
  useEffect(() => {
    let alive = true;
    setCollectionsLoading(true);
    setCollectionsError(null);

    fetchAllCollections()
      .then((list) => {
        if (!alive) return;
        setCollections(list);
        setSelectedHandle((prev) => {
          if (prev && list.some((c) => c.handle === prev)) return prev;
          return list[0]?.handle ?? "";
        });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setCollectionsError(
          err instanceof Error ? err.message : "Could not load shop collections.",
        );
      })
      .finally(() => {
        if (alive) setCollectionsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reloadNonce]);

  // Keep URL query ?collection= in sync when active collection changes
  useEffect(() => {
    if (!activeCollection) return;
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("collection") !== activeCollection.handle) {
      sp.set("collection", activeCollection.handle);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${sp.toString()}`,
      );
    }
  }, [activeCollection]);

  // Load the selected collection's products -> productTypes -> tags with product images
  useEffect(() => {
    const handle = activeCollection?.handle;
    if (!handle) {
      setCatalog(null);
      return;
    }
    let alive = true;
    setCatalogLoading(true);
    setCatalogError(null);

    fetchCollectionCatalog(handle)
      .then((data) => {
        if (!alive) return;
        setCatalog(data);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setCatalogError(
          err instanceof Error ? err.message : "Could not load collection categories.",
        );
      })
      .finally(() => {
        if (alive) setCatalogLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [activeCollection?.handle, reloadNonce]);

  // Reload cleanly when delivery country changes in the header
  useEffect(() => {
    const onMarketChanged = () => {
      clearShopCollectionCache();
      setReloadNonce((n) => n + 1);
    };
    window.addEventListener(MARKET_CHANGED_EVENT, onMarketChanged);
    return () => window.removeEventListener(MARKET_CHANGED_EVENT, onMarketChanged);
  }, []);

  const handleSearchSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const q = searchDraft.trim();
      setLocation(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    },
    [searchDraft, setLocation],
  );

  const retryCollections = useCallback(() => {
    clearShopCollectionCache();
    setReloadNonce((n) => n + 1);
  }, []);

  const groups = catalog?.groups ?? [];

  return (
    <div className="export-page scat-page">
      <style>{SHOP_CATEGORIES_CSS}</style>

      {/* Top sticky search bar (no back button or category icon) */}
      <div className="scat-search-bar">
        <div className="padding-global">
          <div className="container-large">
            <form onSubmit={handleSearchSubmit} role="search" className="tm-search">
              <Search size={20} color="#464646" />
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                enterKeyHint="search"
              />
              {searchDraft ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchDraft("")}
                  className="tm-search-x"
                >
                  <X size={16} />
                </button>
              ) : null}
              <button type="submit" className="tm-search-go">
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main split layout: Collections rail (left) + Product Types & Tag Tiles (right) */}
      <div className="scat-body">
        <div className="scat-body-in">
              {/* Left Collections Rail */}
              <aside aria-label="Shop collections" className="scat-rail">
                {collectionsLoading ? (
                  <div className="p-2.5 space-y-2">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-10 rounded-lg bg-[#e8efed] animate-pulse"
                      />
                    ))}
                  </div>
                ) : collectionsError ? (
                  <div className="p-3 text-xs text-[#52625f]">
                    <p>{collectionsError}</p>
                    <button
                      type="button"
                      onClick={retryCollections}
                      className="mt-2 font-semibold underline text-[#091e1c]"
                    >
                      Try again
                    </button>
                  </div>
                ) : collections.length === 0 ? (
                  <p className="p-3 text-xs text-[#52625f]">No collections found.</p>
                ) : (
                  <ul className="py-1 list-none m-0 p-0">
                    {collections.map((col) => {
                      const isActive = activeCollection?.handle === col.handle;
                      return (
                        <li key={col.handle}>
                          <button
                            type="button"
                            onClick={() => setSelectedHandle(col.handle)}
                            aria-current={isActive ? "true" : undefined}
                            className={`scat-rail-btn ${isActive ? "on" : ""}`}
                          >
                            {col.title}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </aside>

              {/* Right Content Pane: Product Type headings + Tag image grid */}
              <section className="scat-content">
                {collectionsLoading ? (
                  <div className="space-y-6">
                    <div className="h-6 w-48 rounded bg-[#eef3f1] animate-pulse" />
                    <div className="scat-tiles">
                      {Array.from({ length: 9 }).map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                          <div className="w-full aspect-square max-w-[92px] rounded-full bg-[#eef3f1] animate-pulse" />
                          <div className="h-3 w-16 rounded bg-[#eef3f1] animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !activeCollection ? (
                  <div className="py-12 text-center text-sm text-[#52625f]">
                    Select a collection to browse product types and tags.
                  </div>
                ) : (
                  <div>
                    {/* Active Collection Title */}
                    <div className="scat-col-head">
                      <h1 className="truncate">{activeCollection.title}</h1>
                      {activeCollection.description ? (
                        <p className="scat-col-desc">{activeCollection.description}</p>
                      ) : null}
                    </div>

                    {/* ProductType sections & Tag tiles */}
                    {catalogLoading ? (
                      <div className="scat-groups">
                        {Array.from({ length: 3 }).map((_, sIdx) => (
                          <div key={sIdx} className="space-y-3">
                            <div className="h-4 w-36 rounded bg-[#eef3f1] animate-pulse" />
                            <div className="scat-tiles">
                              {Array.from({ length: 6 }).map((_, tIdx) => (
                                <div key={tIdx} className="flex flex-col items-center gap-2">
                                  <div className="w-full aspect-square max-w-[92px] rounded-full bg-[#eef3f1] animate-pulse" />
                                  <div className="h-3 w-14 rounded bg-[#eef3f1] animate-pulse" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : catalogError ? (
                      <div className="py-10 text-center text-sm text-[#52625f]">
                        <p>{catalogError}</p>
                        <button
                          type="button"
                          onClick={retryCollections}
                          className="mt-2 font-semibold underline text-[#091e1c]"
                        >
                          Try again
                        </button>
                      </div>
                    ) : groups.length === 0 ? (
                      <div className="py-12 text-center text-sm text-[#52625f]">
                        No products found in this collection for your selected delivery country.
                      </div>
                    ) : (
                      <div className="scat-groups">
                        {groups.map((group) => {
                          const typeHref = `/shop/collection/${encodeURIComponent(
                            activeCollection.handle,
                          )}?productType=${encodeURIComponent(group.productType)}`;

                          return (
                            <div key={group.productType}>
                              {/* ProductType Section Heading */}
                              <div className="scat-group-head">
                                <h2>{group.productType}</h2>
                                <Link href={typeHref} className="scat-group-more">
                                  <span>View all</span>
                                  <ArrowRight size={12} />
                                </Link>
                              </div>

                              {/* Tags Grid under this ProductType */}
                              <div className="scat-tiles">
                                {group.tags.map((tagItem) => {
                                  const params = new URLSearchParams();
                                  params.set("productType", group.productType);
                                  if (tagItem.tag) params.set("tag", tagItem.tag);
                                  const tagHref = `/shop/collection/${encodeURIComponent(
                                    activeCollection.handle,
                                  )}?${params.toString()}`;

                                  return (
                                    <Link
                                      key={`${group.productType}-${tagItem.label}`}
                                      href={tagHref}
                                      className="scat-tile"
                                    >
                                      <div className="scat-tile-img">
                                        {tagItem.image ? (
                                          <img
                                            src={tagItem.image}
                                            alt={tagItem.alt || tagItem.label}
                                            loading="lazy"
                                          />
                                        ) : (
                                          <ShoppingBag size={22} color="#52625f" />
                                        )}
                                      </div>
                                      <span className="scat-tile-label">
                                        {tagItem.label}
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </section>
        </div>
      </div>
    </div>
  );
}
