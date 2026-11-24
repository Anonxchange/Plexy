import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useHead } from "@unhead/react";
import { buildCanonicalUrl } from "@/lib/site-document";
import { ArrowLeft, ArrowRight, Search, ShoppingBag, X } from "@/lib/icons";
import { MARKET_CHANGED_EVENT } from "@/lib/shopify-service";
import {
  clearShopCollectionCache,
  fetchAllCollections,
  fetchCollectionCatalog,
  type CollectionCatalog,
  type ShopifyCollectionSummary,
} from "@/lib/shop-collections";

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
    <div className="min-h-[calc(100dvh-58px)] bg-white text-[#091e1c] flex flex-col">
      {/* Top sticky search bar */}
      <div className="sticky top-[58px] max-[991px]:top-[44px] z-20 bg-white border-b border-[#e3ebe9]">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 py-2.5 flex items-center gap-2.5">
          <Link
            href="/shop"
            aria-label="Back to shop"
            className="w-9 h-9 rounded-full border border-[#e3ebe9] bg-[#f3f7f6] hover:bg-[#e8efed] flex items-center justify-center flex-shrink-0 text-[#091e1c] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="flex-1 flex items-center gap-2 bg-[#f3f7f6] border border-[#e3ebe9] focus-within:border-[#091e1c] rounded-full px-3.5 py-1.5 transition-colors"
          >
            <Search className="w-4 h-4 text-[#52625f] flex-shrink-0" />
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="flex-1 min-w-0 bg-transparent text-sm sm:text-[15px] text-[#091e1c] placeholder:text-[#7b8a87] outline-none"
            />
            {searchDraft && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchDraft("")}
                className="text-[#52625f] hover:text-[#091e1c] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="rounded-full bg-[#091e1c] hover:bg-[#123834] text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 transition-colors flex-shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Main split layout: Collections rail (left) + Product Types & Tag Tiles (right) */}
      <div className="flex-1 max-w-[1360px] w-full mx-auto flex min-h-0">
        {/* Left Collections Rail */}
        <aside
          aria-label="Shop collections"
          className="w-[112px] sm:w-[210px] md:w-[250px] flex-shrink-0 bg-[#f3f7f6] border-r border-[#e3ebe9] overflow-y-auto max-h-[calc(100dvh-116px)] sticky top-[116px] max-[991px]:top-[102px]"
        >
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
            <ul className="py-1">
              {collections.map((col) => {
                const isActive = activeCollection?.handle === col.handle;
                return (
                  <li key={col.handle}>
                    <button
                      type="button"
                      onClick={() => setSelectedHandle(col.handle)}
                      aria-current={isActive ? "true" : undefined}
                      className={`w-full text-left px-2.5 sm:px-4 py-3 sm:py-3.5 text-[12px] sm:text-[14px] leading-snug transition-colors border-l-[3px] ${
                        isActive
                          ? "bg-white text-[#091e1c] font-bold border-[#091e1c]"
                          : "border-transparent text-[#464646] font-medium hover:bg-white/60 hover:text-[#091e1c]"
                      }`}
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
        <section className="flex-1 min-w-0 bg-white px-3 sm:px-6 py-4 sm:py-6">
          {collectionsLoading ? (
            <div className="space-y-6">
              <div className="h-6 w-48 rounded bg-[#eef3f1] animate-pulse" />
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
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
              {/* Active Collection Title & View All */}
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#e3ebe9]">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#091e1c] truncate">
                    {activeCollection.title}
                  </h1>
                  {activeCollection.description && (
                    <p className="text-xs sm:text-sm text-[#52625f] mt-0.5 line-clamp-1">
                      {activeCollection.description}
                    </p>
                  )}
                </div>

                <Link
                  href={`/shop/collection/${encodeURIComponent(activeCollection.handle)}`}
                  className="inline-flex items-center gap-1 rounded-full bg-[#bef264] hover:bg-[#b2ea4f] text-[#091e1c] text-xs sm:text-sm font-bold px-3.5 py-1.5 flex-shrink-0 transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* ProductType sections & Tag tiles */}
              {catalogLoading ? (
                <div className="pt-5 space-y-7">
                  {Array.from({ length: 3 }).map((_, sIdx) => (
                    <div key={sIdx} className="space-y-3">
                      <div className="h-4 w-36 rounded bg-[#eef3f1] animate-pulse" />
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-4 sm:gap-5">
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
                <div className="pt-5 space-y-8">
                  {groups.map((group) => {
                    const typeHref = `/shop/collection/${encodeURIComponent(
                      activeCollection.handle,
                    )}?productType=${encodeURIComponent(group.productType)}`;

                    return (
                      <div key={group.productType}>
                        {/* ProductType Section Heading */}
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <h2 className="text-[14px] sm:text-base font-bold text-[#091e1c]">
                            {group.productType}
                          </h2>
                          <Link
                            href={typeHref}
                            className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#52625f] hover:text-[#091e1c] flex-shrink-0 transition-colors"
                          >
                            <span>View all</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>

                        {/* Tags Grid under this ProductType */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-5 sm:gap-y-6">
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
                                className="group flex flex-col items-center text-center gap-2"
                              >
                                <div className="w-full max-w-[92px] aspect-square rounded-full overflow-hidden bg-[#f3f7f6] border border-[#e3ebe9] group-hover:border-[#091e1c] transition-colors flex items-center justify-center">
                                  {tagItem.image ? (
                                    <img
                                      src={tagItem.image}
                                      alt={tagItem.alt || tagItem.label}
                                      loading="lazy"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                  ) : (
                                    <ShoppingBag className="w-6 h-6 text-[#52625f]" />
                                  )}
                                </div>
                                <span className="text-[11.5px] sm:text-[13px] font-medium text-[#091e1c] leading-tight line-clamp-2 group-hover:underline">
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
  );
}
