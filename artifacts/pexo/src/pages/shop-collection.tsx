import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams, useSearch } from "wouter";
import { useHead } from "@unhead/react";
import { buildCanonicalUrl } from "@/lib/site-document";
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronDown,
  LayoutGrid,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from "@/lib/icons";
import {
  formatPrice,
  MARKET_CHANGED_EVENT,
  type ShopifyProduct,
} from "@/lib/shopify-service";
import {
  clearShopCollectionCache,
  fetchCollectionCatalog,
  type CollectionCatalog,
  type CollectionTagTile,
} from "@/lib/shop-collections";

const PAGE_SIZE = 48;

type SortKey = "all" | "new" | "low" | "high";

const SORT_LABELS: Record<SortKey, string> = {
  all: "Sort by",
  new: "Newest",
  low: "Price: low to high",
  high: "Price: high to low",
};

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

function photoRatio(node: any): number {
  const img = node?.images?.edges?.[0]?.node;
  const w = Number(img?.width);
  const h = Number(img?.height);
  if (w > 0 && h > 0) return Math.min(1.25, Math.max(1, h / w));
  const steps = [1, 1.18, 1.08, 1.24, 1.12];
  let hash = 0;
  const key = String(node?.id || "");
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return steps[hash % steps.length];
}

function readParams(searchStr: string) {
  const sp = new URLSearchParams(searchStr);
  return {
    productType: (sp.get("productType") || "").trim(),
    tag: (sp.get("tag") || "").trim(),
    q: (sp.get("q") || "").trim(),
  };
}

export function ShopCollectionPage() {
  const params = useParams<{ handle: string }>();
  const handle = decodeURIComponent(params.handle || "").trim();
  const searchStr = useSearch();
  const initial = useMemo(() => readParams(searchStr), [searchStr]);

  const [selectedType, setSelectedType] = useState(initial.productType);
  const [selectedTag, setSelectedTag] = useState(initial.tag);
  const [searchQuery, setSearchQuery] = useState(initial.q);
  const [searchDraft, setSearchDraft] = useState(initial.q);

  const [catalog, setCatalog] = useState<CollectionCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [sort, setSort] = useState<SortKey>("all");
  const [panelOpen, setPanelOpen] = useState(false);
  const [minDraft, setMinDraft] = useState("");
  const [maxDraft, setMaxDraft] = useState("");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const colCount = useColumnCount();

  // Sync state if URL query params change via navigation
  useEffect(() => {
    setSelectedType(initial.productType);
    setSelectedTag(initial.tag);
    setSearchQuery(initial.q);
    setSearchDraft(initial.q);
    setVisibleCount(PAGE_SIZE);
  }, [handle, initial.productType, initial.tag, initial.q]);

  // Keep browser URL synchronized with active filters
  const syncUrlParams = useCallback(
    (nextType: string, nextTag: string, nextQ: string) => {
      if (typeof window === "undefined") return;
      const sp = new URLSearchParams();
      if (nextType) sp.set("productType", nextType);
      if (nextTag) sp.set("tag", nextTag);
      if (nextQ) sp.set("q", nextQ);
      const qs = sp.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${qs ? `?${qs}` : ""}`,
      );
    },
    [],
  );

  useEffect(() => {
    if (!handle) return;
    let alive = true;
    setLoading(true);
    setError(null);

    fetchCollectionCatalog(handle)
      .then((data) => {
        if (!alive) return;
        setCatalog(data);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Could not load collection products.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [handle, reloadNonce]);

  useEffect(() => {
    const onMarketChanged = () => {
      clearShopCollectionCache();
      setReloadNonce((n) => n + 1);
    };
    window.addEventListener(MARKET_CHANGED_EVENT, onMarketChanged);
    return () => window.removeEventListener(MARKET_CHANGED_EVENT, onMarketChanged);
  }, []);

  const collectionTitle =
    catalog?.collection?.title ||
    handle
      .split("-")
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : ""))
      .join(" ") ||
    "Collection";

  const canonical = buildCanonicalUrl(`/shop/collection/${encodeURIComponent(handle)}`);
  useHead({
    title: `${collectionTitle} — Shop | Pexly`,
    meta: [
      {
        name: "description",
        content:
          catalog?.collection?.description ||
          `Browse ${collectionTitle} products on Pexly and pay directly from your crypto wallet.`,
      },
    ],
    link: [{ rel: "canonical", key: "canonical", href: canonical }],
  });

  // Tag circles above the products: scoped to selectedType if picked, else all tags in the collection
  const tagCircles: CollectionTagTile[] = useMemo(() => {
    if (!catalog) return [];
    if (selectedType) {
      const matchedGroup = catalog.groups.find(
        (g) => g.productType.toLocaleLowerCase() === selectedType.toLocaleLowerCase(),
      );
      if (matchedGroup) {
        return matchedGroup.tags.filter((t) => Boolean(t.tag));
      }
    }
    return catalog.allTags;
  }, [catalog, selectedType]);

  const allPreviewImage =
    catalog?.collection?.image?.url ||
    catalog?.products[0]?.node?.images?.edges?.[0]?.node?.url;

  const filteredProducts = useMemo(() => {
    const list = (catalog?.products ?? []).filter((p) => {
      const node = p.node;
      if (selectedType) {
        const pt = (node.productType || catalog?.collection?.title || "Products").trim();
        if (pt.toLocaleLowerCase() !== selectedType.toLocaleLowerCase()) return false;
      }
      if (selectedTag) {
        const tags = Array.isArray(node.tags)
          ? node.tags.map((t) => String(t).trim().toLocaleLowerCase())
          : [];
        if (!tags.includes(selectedTag.toLocaleLowerCase())) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLocaleLowerCase();
        const hay = `${node.title} ${node.productType} ${(node.tags || []).join(" ")}`.toLocaleLowerCase();
        if (!hay.includes(q)) return false;
      }
      const priceVal = Number(node.priceRange?.minVariantPrice?.amount);
      if (minPrice !== null && Number.isFinite(priceVal) && priceVal < minPrice) return false;
      if (maxPrice !== null && Number.isFinite(priceVal) && priceVal > maxPrice) return false;
      return true;
    });

    const sorted = [...list];
    if (sort === "low") {
      sorted.sort(
        (a, b) =>
          Number(a.node.priceRange?.minVariantPrice?.amount || 0) -
          Number(b.node.priceRange?.minVariantPrice?.amount || 0),
      );
    } else if (sort === "high") {
      sorted.sort(
        (a, b) =>
          Number(b.node.priceRange?.minVariantPrice?.amount || 0) -
          Number(a.node.priceRange?.minVariantPrice?.amount || 0),
      );
    } else if (sort === "new") {
      sorted.reverse();
    }
    return sorted;
  }, [catalog, selectedType, selectedTag, searchQuery, minPrice, maxPrice, sort]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount],
  );
  const hasMore = filteredProducts.length > visibleCount;

  const cols = useMemo(() => {
    const out = Array.from({ length: colCount }, () => ({
      h: 0,
      items: [] as { p: ShopifyProduct; r: number }[],
    }));
    for (const p of visibleProducts) {
      const r = photoRatio(p.node);
      let target = out[0];
      for (const c of out) if (c.h < target.h) target = c;
      target.items.push({ p, r });
      target.h += r + 0.45;
    }
    return out;
  }, [visibleProducts, colCount]);

  const handleSelectTag = (tag: string) => {
    const nextTag = tag === selectedTag ? "" : tag;
    setSelectedTag(nextTag);
    setVisibleCount(PAGE_SIZE);
    syncUrlParams(selectedType, nextTag, searchQuery);
  };

  const handleSelectType = (nextType: string) => {
    setSelectedType(nextType);
    // Clear selected tag if it doesn't belong to the newly chosen productType
    let nextTag = selectedTag;
    if (nextType && selectedTag && catalog) {
      const grp = catalog.groups.find(
        (g) => g.productType.toLocaleLowerCase() === nextType.toLocaleLowerCase(),
      );
      if (!grp?.tags.some((t) => t.tag.toLocaleLowerCase() === selectedTag.toLocaleLowerCase())) {
        nextTag = "";
      }
    }
    setSelectedTag(nextTag);
    setVisibleCount(PAGE_SIZE);
    syncUrlParams(nextType, nextTag, searchQuery);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = searchDraft.trim();
    setSearchQuery(q);
    setVisibleCount(PAGE_SIZE);
    syncUrlParams(selectedType, selectedTag, q);
  };

  const parsePrice = (v: string) => {
    const n = Number(v.replace(/,/g, "").trim());
    return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
  };

  const applyFilters = () => {
    setMinPrice(parsePrice(minDraft));
    setMaxPrice(parsePrice(maxDraft));
    setVisibleCount(PAGE_SIZE);
    setPanelOpen(false);
  };

  const clearAllFilters = () => {
    setSelectedType("");
    setSelectedTag("");
    setSearchQuery("");
    setSearchDraft("");
    setMinDraft("");
    setMaxDraft("");
    setMinPrice(null);
    setMaxPrice(null);
    setSort("all");
    setVisibleCount(PAGE_SIZE);
    setPanelOpen(false);
    syncUrlParams("", "", "");
  };

  const activePriceFilters = (minPrice !== null ? 1 : 0) + (maxPrice !== null ? 1 : 0);
  const productTypes = catalog?.productTypes ?? [];

  return (
    <div className="min-h-[calc(100dvh-58px)] bg-white text-[#091e1c]">
      {/* Sticky Top Navigation + Search */}
      <div className="sticky top-[58px] max-[991px]:top-[44px] z-20 bg-white border-b border-[#e3ebe9]">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 py-2.5 flex items-center gap-2.5">
          <Link
            href={`/shop/categories?collection=${encodeURIComponent(handle)}`}
            aria-label="Back to categories"
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
              placeholder={`Search in ${collectionTitle}`}
              aria-label={`Search in ${collectionTitle}`}
              className="flex-1 min-w-0 bg-transparent text-sm sm:text-[15px] text-[#091e1c] placeholder:text-[#7b8a87] outline-none"
            />
            {searchDraft && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchDraft("");
                  setSearchQuery("");
                  syncUrlParams(selectedType, selectedTag, "");
                }}
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

          <Link
            href={`/shop/categories?collection=${encodeURIComponent(handle)}`}
            aria-label="All categories"
            title="Browse all categories"
            className="w-9 h-9 rounded-full border border-[#e3ebe9] bg-[#f3f7f6] hover:bg-[#bef264] flex items-center justify-center flex-shrink-0 text-[#091e1c] transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 pt-4 pb-12">
        {/* Collection Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div>
            <h1 className="text-xl sm:text-[28px] font-extrabold tracking-tight text-[#091e1c]">
              {collectionTitle}
            </h1>
            {selectedType && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#52625f]">
                <span>Product type:</span>
                <button
                  type="button"
                  onClick={() => handleSelectType("")}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f3f7f6] border border-[#e3ebe9] hover:border-[#091e1c] px-2.5 py-0.5 font-semibold text-[#091e1c]"
                >
                  <span>{selectedType}</span>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <Link
            href="/shop"
            className="text-xs sm:text-sm font-semibold text-[#52625f] hover:text-[#091e1c] underline"
          >
            All shop products
          </Link>
        </div>

        {/* Top Horizontal Circular Tag Strip (Product images per tag inside this collection) */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-3 mb-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-shrink-0 w-[76px]">
                <div className="w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-full bg-[#eef3f1] animate-pulse" />
                <div className="h-3 w-12 rounded bg-[#eef3f1] animate-pulse" />
              </div>
            ))}
          </div>
        ) : tagCircles.length > 0 ? (
          <div
            aria-label="Tags in this collection"
            className="flex gap-3.5 sm:gap-5 overflow-x-auto pb-3 mb-3 no-scrollbar"
          >
            <button
              type="button"
              onClick={() => handleSelectTag("")}
              className="group flex flex-col items-center gap-1.5 flex-shrink-0 w-[74px] sm:w-[84px] text-center"
            >
              <div
                className={`w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-full overflow-hidden bg-[#f3f7f6] flex items-center justify-center transition-all ${
                  selectedTag === ""
                    ? "border-2 border-[#091e1c] ring-2 ring-[#bef264]"
                    : "border border-[#e3ebe9] group-hover:border-[#091e1c]"
                }`}
              >
                {allPreviewImage ? (
                  <img
                    src={allPreviewImage}
                    alt={`All ${collectionTitle}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-6 h-6 text-[#52625f]" />
                )}
              </div>
              <span
                className={`text-[11.5px] sm:text-xs leading-tight line-clamp-2 ${
                  selectedTag === "" ? "font-bold text-[#091e1c]" : "font-medium text-[#464646]"
                }`}
              >
                All
              </span>
            </button>

            {tagCircles.map((item) => {
              const active =
                selectedTag.toLocaleLowerCase() === item.tag.toLocaleLowerCase();
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSelectTag(item.tag)}
                  className="group flex flex-col items-center gap-1.5 flex-shrink-0 w-[74px] sm:w-[84px] text-center"
                >
                  <div
                    className={`w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-full overflow-hidden bg-[#f3f7f6] flex items-center justify-center transition-all ${
                      active
                        ? "border-2 border-[#091e1c] ring-2 ring-[#bef264]"
                        : "border border-[#e3ebe9] group-hover:border-[#091e1c]"
                    }`}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.alt || item.label}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-[#52625f]" />
                    )}
                  </div>
                  <span
                    className={`text-[11.5px] sm:text-xs leading-tight line-clamp-2 ${
                      active ? "font-bold text-[#091e1c]" : "font-medium text-[#464646]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Filter & Sort Bar */}
        <div className="flex flex-wrap items-center gap-2 py-2.5 border-y border-[#e3ebe9] mb-4">
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
              panelOpen || activePriceFilters > 0
                ? "bg-[#091e1c] text-white"
                : "bg-[#f3f7f6] text-[#091e1c] hover:bg-[#e8efed]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activePriceFilters > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#bef264] text-[#091e1c] text-[11px] font-extrabold">
                {activePriceFilters}
              </span>
            )}
          </button>

          <label className="relative inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#f3f7f6] hover:bg-[#e8efed] text-xs sm:text-sm font-semibold text-[#091e1c] cursor-pointer">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{SORT_LABELS[sort]}</span>
            <ChevronDown className="w-3.5 h-3.5" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort products"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="all">Best match</option>
              <option value="new">Newest</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>

          {productTypes.length > 1 && (
            <label className="relative inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#f3f7f6] hover:bg-[#e8efed] text-xs sm:text-sm font-semibold text-[#091e1c] cursor-pointer">
              <span className="truncate max-w-[140px]">
                {selectedType || "Product type"}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
              <select
                value={selectedType}
                onChange={(e) => handleSelectType(e.target.value)}
                aria-label="Filter by product type"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="">All product types</option>
                {productTypes.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(selectedType || selectedTag || searchQuery || activePriceFilters > 0) && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto text-xs font-semibold text-[#52625f] hover:text-[#091e1c] underline"
            >
              Reset all
            </button>
          )}
        </div>

        {/* Expandable Price Filter Panel */}
        {panelOpen && (
          <div className="mb-4 p-4 rounded-xl border border-[#e3ebe9] bg-[#f3f7f6]/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#52625f] mb-2.5">
              Price range
            </h4>
            <div className="flex items-center gap-2.5 max-w-md">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="Min"
                aria-label="Minimum price"
                value={minDraft}
                onChange={(e) => setMinDraft(e.target.value)}
                className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-[#e3ebe9] bg-white text-sm text-[#091e1c] outline-none focus:border-[#091e1c]"
              />
              <span className="text-[#52625f]">–</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="Max"
                aria-label="Maximum price"
                value={maxDraft}
                onChange={(e) => setMaxDraft(e.target.value)}
                className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-[#e3ebe9] bg-white text-sm text-[#091e1c] outline-none focus:border-[#091e1c]"
              />
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              <button
                type="button"
                onClick={applyFilters}
                className="h-9 px-4 rounded-lg bg-[#091e1c] text-white text-xs sm:text-sm font-semibold"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setMinDraft("");
                  setMaxDraft("");
                  setMinPrice(null);
                  setMaxPrice(null);
                  setPanelOpen(false);
                }}
                className="h-9 px-4 rounded-lg border border-[#e3ebe9] bg-white text-[#091e1c] text-xs sm:text-sm font-semibold"
              >
                Clear price
              </button>
            </div>
          </div>
        )}

        {/* Product Masonry Grid */}
        {loading ? (
          <div className="flex gap-3 sm:gap-4 items-start">
            {Array.from({ length: colCount }).map((_, ci) => (
              <div key={ci} className="flex-1 min-w-0 flex flex-col gap-4">
                {[1.15, 1, 1.25].map((r, i) => (
                  <div
                    key={i}
                    className="w-full rounded-xl bg-[#eef3f1] animate-pulse"
                    style={{ aspectRatio: `1 / ${r}` }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-[#52625f]">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                clearShopCollectionCache();
                setReloadNonce((n) => n + 1);
              }}
              className="mt-2 font-semibold underline text-[#091e1c]"
            >
              Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#52625f]">
            <p>No products match your selection in this collection.</p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-2 font-semibold underline text-[#091e1c]"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2.5 sm:gap-4 items-start">
              {cols.map((col, ci) => (
                <div key={ci} className="flex-1 min-w-0 flex flex-col gap-4 sm:gap-5">
                  {col.items.map(({ p, r }) => {
                    const node = p.node;
                    const img = node.images?.edges?.[0]?.node;
                    const price = node.priceRange?.minVariantPrice;
                    return (
                      <article key={node.id} className="group">
                        <Link
                          href={`/shop/product/${node.handle}`}
                          className="block text-inherit no-underline"
                        >
                          <div
                            className="relative overflow-hidden rounded-lg bg-[#f3f7f6] w-full"
                            style={{ aspectRatio: `1 / ${r}` }}
                          >
                            {img?.url ? (
                              <img
                                src={img.url}
                                alt={img.altText || node.title}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                              />
                            ) : null}
                          </div>
                          <h3 className="mt-2 text-[14px] sm:text-[15px] font-semibold leading-snug text-[#0c1111] line-clamp-2 group-hover:underline">
                            {node.title}
                          </h3>
                          {price && (
                            <p className="mt-0.5 text-[14px] sm:text-[15px] text-[#464646] tabular-nums">
                              {formatPrice(price.amount, price.currencyCode)}
                            </p>
                          )}
                        </Link>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="inline-flex items-center justify-center min-w-[200px] h-12 px-7 rounded-full border-[1.5px] border-[#091e1c] bg-white hover:bg-[#bef264] text-[#091e1c] font-bold text-sm sm:text-base transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
