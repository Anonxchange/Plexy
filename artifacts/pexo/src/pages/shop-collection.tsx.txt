import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams, useSearch } from "wouter";
import { useHead } from "@unhead/react";
import { buildCanonicalUrl } from "@/lib/site-document";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
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
import { ResponsivePickerModal } from "@/components/responsive-picker-modal";

const PAGE_SIZE = 48;

const SHOP_COLLECTION_CSS = `
.scol-page{min-height:calc(100dvh - 58px);background:#fff;color:#091e1c;overflow-x:clip}
@media(max-width:991px){.scol-page{min-height:calc(100dvh - 44px)}}
.scol-search-bar{position:sticky;top:58px;z-index:20;background:#fff;border-bottom:1px solid #e3ebe9;padding:10px 0}
@media(max-width:991px){.scol-search-bar{top:44px;padding:8px 0}}
.scol-page .tm-search{display:flex;align-items:center;gap:10px;padding:4px 4px 4px 12px;border:1px solid #e3ebe9;border-radius:8px;background:#fff}
.scol-page .tm-search:focus-within{border-color:#091e1c}
.scol-page .tm-search input{flex:1 1 auto;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:16px;color:#091e1c}
.scol-page .tm-search input::placeholder{color:#8a9694}
.scol-page .tm-search-x{flex:none;width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:50%;background:#f3f7f6;color:#091e1c;cursor:pointer}
.scol-page .tm-search-go{flex:none;height:34px;padding:0 14px;border:0;border-radius:5px;background:#091e1c;color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
.scol-page .tm-search-go:hover{background:#0f302c}

.scol-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:10px;margin:18px 0 14px}
.scol-head h1{margin:0;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-weight:800;font-size:clamp(20px,2.6vw,28px);letter-spacing:-.03em;color:#091e1c}
.scol-all-link{font-size:13.5px;font-weight:600;color:#464646;text-decoration:underline}
.scol-all-link:hover{color:#091e1c}

.scol-tags{display:flex;gap:14px;overflow-x:auto;scrollbar-width:none;padding:2px 0 14px}
@media(min-width:700px){.scol-tags{gap:20px}}
.scol-tags::-webkit-scrollbar{display:none}
.scol-tag-btn{flex:none;width:72px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;background:none;border:0;padding:0;font:inherit;cursor:pointer}
@media(min-width:700px){.scol-tag-btn{width:84px}}
.scol-tag-img{width:64px;height:64px;border-radius:50%;overflow:hidden;background:#f3f7f6;border:1px solid #e3ebe9;display:grid;place-items:center;transition:border-color .15s,box-shadow .15s}
@media(min-width:700px){.scol-tag-img{width:74px;height:74px}}
.scol-tag-btn:hover .scol-tag-img{border-color:#091e1c}
.scol-tag-btn.on .scol-tag-img{border:2px solid #091e1c;box-shadow:0 0 0 2px #bef264}
.scol-tag-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .2s}
.scol-tag-btn:hover .scol-tag-img img{transform:scale(1.05)}
.scol-tag-txt{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:11.5px;line-height:1.25;font-weight:500;color:#464646}
@media(min-width:700px){.scol-tag-txt{font-size:12.5px}}
.scol-tag-btn.on .scol-tag-txt{font-weight:700;color:#091e1c}

.scol-page .tm-sortbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:4px 0 14px}
.scol-page .tm-sortbar>.tm-fbtn,.scol-page .tm-sortbar>.tm-sort{flex:1 1 130px;min-width:0;max-width:100%;justify-content:center}
@media(min-width:700px){.scol-page .tm-sortbar>.tm-fbtn,.scol-page .tm-sortbar>.tm-sort{flex:0 0 auto}}
.scol-page .tm-fbtn{position:relative;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border:0;border-radius:8px;background:#f3f7f6;color:#091e1c;font:inherit;font-size:15px;font-weight:600;cursor:pointer}
.scol-page .tm-fbtn.on{background:#091e1c;color:#fff}
.scol-page .tm-fbadge{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#bef264;color:#091e1c;font-size:11px;font-weight:800}
.scol-page .tm-sort{position:relative;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px;border:0;border-radius:8px;background:#f3f7f6;color:#091e1c;font:inherit;font-size:15px;font-weight:600;white-space:nowrap;cursor:pointer}
.scol-page .tm-sort.on{background:#091e1c;color:#fff}
.scol-page .tm-sort svg,.scol-page .tm-fbtn svg{display:block;flex:none}
.scol-page .tm-sort-txt{overflow:hidden;text-overflow:ellipsis}

/* Exact /shop (physical-products.tsx) card & masonry styles on mobile and desktop */
.scol-page .sp-masonry{display:flex;gap:12px;margin-top:14px;align-items:flex-start}
@media(min-width:700px){.scol-page .sp-masonry{gap:18px}}
.scol-page .sp-mcol{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:18px}
.scol-page .sp-masonry .sp-card{width:auto;min-width:0;flex:none;max-width:none}
.scol-page .sp-masonry .sp-card a.sp-card-link{display:block;color:inherit;text-decoration:none}
.scol-page .sp-masonry .sp-card a.sp-card-link:focus-visible{outline:2px solid #709d36;outline-offset:3px;border-radius:6px}
.scol-page .sp-masonry .sp-img.sp-real{position:relative;overflow:hidden;border-radius:6px;background:#f3f7f6;width:100%}
.scol-page .sp-masonry .sp-img.sp-real img.sp-real-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.scol-page .sp-masonry .sp-card h3{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:15px;font-weight:600;line-height:1.35;margin:10px 0 2px;color:#0c1111}
.scol-page .sp-masonry .sp-price{margin:0;font-size:15px;color:#464646;font-variant-numeric:tabular-nums}
.scol-page .sp-masonry .sp-price b{font-weight:400}
.scol-page .sp-masonry .sp-skel{width:100%;aspect-ratio:auto;border-radius:18px;background:linear-gradient(90deg,#eef2f1,#f7f9f8,#eef2f1);background-size:200% 100%;animation:scol-pulse 1.2s linear infinite}
@keyframes scol-pulse{to{background-position:-200% 0}}
@media(max-width:699px){
  .scol-page .sp-masonry{width:100vw;margin-left:calc(50% - 50vw);gap:8px}
  .scol-page .sp-mcol{gap:14px}
  .scol-page .sp-masonry .sp-img.sp-real{border-radius:0}
  .scol-page .sp-masonry .sp-card h3,.scol-page .sp-masonry .sp-price{padding:0 8px}
  .scol-page .sp-masonry .sp-card h3{margin-top:8px}
}

.scol-page .sp-more-wrap{display:flex;justify-content:center;margin-top:34px}
.scol-page .sp-more{display:inline-flex;align-items:center;justify-content:center;min-width:200px;height:54px;padding:0 30px;border:1.5px solid #091e1c;border-radius:999px;background:#fff;color:#091e1c;font-family:inherit;font-weight:700;font-size:17px;cursor:pointer}
.scol-page .sp-more:hover{background:#bef264}
.scol-page .sp-note{margin:30px 0;text-align:center;color:#464646;font-size:15px}
.scol-page .sp-note button{text-decoration:underline;background:none;border:0;color:#091e1c;font-weight:600;cursor:pointer;font:inherit}
.scol-page .ed-foot{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:28px;padding:14px 0;border-top:1px solid #e3ebe9;font-size:13px;color:#464646}
`;

type SortKey = "all" | "new" | "low" | "high";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "all", label: "Best match" },
  { value: "new", label: "Newest" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
];

const SORT_LABELS: Record<SortKey, string> = {
  all: "Best match",
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
  const steps = [1, 1.2, 1.1, 1.25, 1.15];
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const [draftType, setDraftType] = useState(initial.productType);
  const [draftTag, setDraftTag] = useState(initial.tag);
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
    setDraftType(initial.productType);
    setDraftTag(initial.tag);
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

  // Tag options inside Filters modal (scoped to draftType when selected)
  const draftTagCircles: CollectionTagTile[] = useMemo(() => {
    if (!catalog) return [];
    if (draftType) {
      const matchedGroup = catalog.groups.find(
        (g) => g.productType.toLocaleLowerCase() === draftType.toLocaleLowerCase(),
      );
      if (matchedGroup) {
        return matchedGroup.tags.filter((t) => Boolean(t.tag));
      }
    }
    return catalog.allTags;
  }, [catalog, draftType]);

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

  const openFilterModal = () => {
    setDraftType(selectedType);
    setDraftTag(selectedTag);
    setMinDraft(minPrice !== null ? String(minPrice) : "");
    setMaxDraft(maxPrice !== null ? String(maxPrice) : "");
    setFilterOpen(true);
  };

  const draftPreviewCount = useMemo(() => {
    let dMin = parsePrice(minDraft);
    let dMax = parsePrice(maxDraft);
    if (dMin !== null && dMax !== null && dMin > dMax) [dMin, dMax] = [dMax, dMin];
    return (catalog?.products ?? []).filter((p) => {
      const node = p.node;
      if (draftType) {
        const pt = (node.productType || catalog?.collection?.title || "Products").trim();
        if (pt.toLocaleLowerCase() !== draftType.toLocaleLowerCase()) return false;
      }
      if (draftTag) {
        const tags = Array.isArray(node.tags)
          ? node.tags.map((t) => String(t).trim().toLocaleLowerCase())
          : [];
        if (!tags.includes(draftTag.toLocaleLowerCase())) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLocaleLowerCase();
        const hay = `${node.title} ${node.productType} ${(node.tags || []).join(" ")}`.toLocaleLowerCase();
        if (!hay.includes(q)) return false;
      }
      const priceVal = Number(node.priceRange?.minVariantPrice?.amount);
      if (dMin !== null && Number.isFinite(priceVal) && priceVal < dMin) return false;
      if (dMax !== null && Number.isFinite(priceVal) && priceVal > dMax) return false;
      return true;
    }).length;
  }, [catalog, draftType, draftTag, searchQuery, minDraft, maxDraft]);

  const applyFilters = () => {
    let nextMin = parsePrice(minDraft);
    let nextMax = parsePrice(maxDraft);
    if (nextMin !== null && nextMax !== null && nextMin > nextMax) {
      [nextMin, nextMax] = [nextMax, nextMin];
    }
    setSelectedType(draftType);
    setSelectedTag(draftTag);
    setMinPrice(nextMin);
    setMaxPrice(nextMax);
    setVisibleCount(PAGE_SIZE);
    setFilterOpen(false);
    syncUrlParams(draftType, draftTag, searchQuery);
  };

  const clearAllFilters = () => {
    setSelectedType("");
    setSelectedTag("");
    setDraftType("");
    setDraftTag("");
    setSearchQuery("");
    setSearchDraft("");
    setMinDraft("");
    setMaxDraft("");
    setMinPrice(null);
    setMaxPrice(null);
    setSort("all");
    setVisibleCount(PAGE_SIZE);
    setFilterOpen(false);
    syncUrlParams("", "", "");
  };

  const activePriceFilters = (minPrice !== null ? 1 : 0) + (maxPrice !== null ? 1 : 0);
  const totalFilterBadge =
    (activePriceFilters > 0 ? 1 : 0) + (selectedType ? 1 : 0) + (selectedTag ? 1 : 0);
  const productTypes = catalog?.productTypes ?? [];

  return (
    <div className="export-page scol-page">
      <style>{SHOP_COLLECTION_CSS}</style>

      {/* Sticky Top Search (no back button and no category icon) */}
      <div className="scol-search-bar">
        <div className="padding-global">
          <div className="container-large">
            <form onSubmit={handleSearchSubmit} role="search" className="tm-search">
              <Search size={20} color="#464646" />
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder={`Search in ${collectionTitle}`}
                aria-label={`Search in ${collectionTitle}`}
                enterKeyHint="search"
              />
              {searchDraft ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchDraft("");
                    setSearchQuery("");
                    syncUrlParams(selectedType, selectedTag, "");
                  }}
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

      <section className="sp-sec" style={{ paddingTop: 12, paddingBottom: 40 }}>
        <div className="padding-global">
          <div className="container-large">
            {/* Collection Header */}
            <div className="scol-head">
              <div>
                <h1>{collectionTitle}</h1>
                {selectedType ? (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#52625f]">
                    <span>Product type:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectType("")}
                      className="inline-flex items-center gap-1 rounded-full bg-[#f3f7f6] border border-[#e3ebe9] hover:border-[#091e1c] px-2.5 py-0.5 font-semibold text-[#091e1c]"
                    >
                      <span>{selectedType}</span>
                      <X size={12} />
                    </button>
                  </div>
                ) : null}
              </div>

              <Link href="/shop" className="scol-all-link">
                All shop products
              </Link>
            </div>

            {/* Top Horizontal Circular Tag Strip (Product images per tag inside this collection) */}
            {loading ? (
              <div className="flex gap-4 overflow-x-auto pb-3 mb-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-shrink-0 w-[72px] sm:w-[84px]">
                    <div className="w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-full bg-[#eef3f1] animate-pulse" />
                    <div className="h-3 w-12 rounded bg-[#eef3f1] animate-pulse" />
                  </div>
                ))}
              </div>
            ) : tagCircles.length > 0 ? (
              <div aria-label="Tags in this collection" className="scol-tags">
                <button
                  type="button"
                  onClick={() => handleSelectTag("")}
                  className={`scol-tag-btn ${selectedTag === "" ? "on" : ""}`}
                >
                  <div className="scol-tag-img">
                    {allPreviewImage ? (
                      <img src={allPreviewImage} alt={`All ${collectionTitle}`} />
                    ) : (
                      <ShoppingBag size={22} color="#52625f" />
                    )}
                  </div>
                  <span className="scol-tag-txt">All</span>
                </button>

                {tagCircles.map((item) => {
                  const active =
                    selectedTag.toLocaleLowerCase() === item.tag.toLocaleLowerCase();
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSelectTag(item.tag)}
                      className={`scol-tag-btn ${active ? "on" : ""}`}
                    >
                      <div className="scol-tag-img">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.alt || item.label}
                            loading="lazy"
                          />
                        ) : (
                          <ShoppingBag size={22} color="#52625f" />
                        )}
                      </div>
                      <span className="scol-tag-txt">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Filter, Sort & Product Type Bar — opens bottom sheet on mobile, dialog on tablet/desktop */}
            <div className="tm-sortbar">
              <button
                type="button"
                onClick={openFilterModal}
                aria-expanded={filterOpen}
                aria-haspopup="dialog"
                className={filterOpen || totalFilterBadge > 0 ? "tm-fbtn on" : "tm-fbtn"}
              >
                <SlidersHorizontal size={18} />
                <span>Filters</span>
                {totalFilterBadge > 0 ? (
                  <span className="tm-fbadge">{totalFilterBadge}</span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setSortOpen(true)}
                aria-expanded={sortOpen}
                aria-haspopup="dialog"
                className={sort !== "all" ? "tm-sort on" : "tm-sort"}
              >
                <ArrowUpDown size={18} />
                <span className="tm-sort-txt">
                  {sort === "all" ? "Sort by" : SORT_LABELS[sort]}
                </span>
                <ChevronDown size={16} />
              </button>

              {productTypes.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setTypeOpen(true)}
                  aria-expanded={typeOpen}
                  aria-haspopup="dialog"
                  className={selectedType ? "tm-sort on" : "tm-sort"}
                >
                  <span className="tm-sort-txt">
                    {selectedType || "Product type"}
                  </span>
                  <ChevronDown size={16} />
                </button>
              ) : null}

              {selectedType || selectedTag || searchQuery || activePriceFilters > 0 || sort !== "all" ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs sm:text-sm font-semibold text-[#52625f] hover:text-[#091e1c] underline ml-auto"
                >
                  Reset all
                </button>
              ) : null}
            </div>

            {/* Filters: Mobile bottom sheet / Tablet & Desktop dialog */}
            <ResponsivePickerModal
              open={filterOpen}
              onOpenChange={setFilterOpen}
              title="Filters"
              description={`Refine products in ${collectionTitle}`}
              maxWidthClassName="sm:max-w-[480px]"
              footer={
                <div className="flex items-center gap-2.5">
                  {(totalFilterBadge > 0 || draftType || draftTag || minDraft || maxDraft) ? (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="h-11 rounded-xl border border-[#dce3db] bg-white px-4 text-sm font-semibold text-[#091e1c] transition-colors hover:bg-[#f3f7f6]"
                    >
                      Reset
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="h-11 flex-1 rounded-xl bg-[#091e1c] px-5 text-sm font-bold text-white transition-colors hover:bg-[#bef264] hover:text-[#091e1c]"
                  >
                    {!loading
                      ? `Show ${draftPreviewCount} ${draftPreviewCount === 1 ? "product" : "products"}`
                      : "Apply filters"}
                  </button>
                </div>
              }
            >
              <div className="space-y-5">
                {productTypes.length > 1 ? (
                  <div>
                    <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-[#52625f]">
                      Product type
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        aria-pressed={draftType === ""}
                        onClick={() => {
                          setDraftType("");
                          setDraftTag("");
                        }}
                        className={
                          draftType === ""
                            ? "h-10 rounded-full border border-[#091e1c] bg-[#091e1c] px-4 text-[13px] font-semibold text-white transition-colors"
                            : "h-10 rounded-full border border-[#dce3db] bg-white px-4 text-[13px] font-semibold text-[#091e1c] transition-colors hover:bg-[#f3f7f6]"
                        }
                      >
                        All types
                      </button>
                      {productTypes.map((pt) => {
                        const active =
                          draftType.toLocaleLowerCase() === pt.toLocaleLowerCase();
                        return (
                          <button
                            key={pt}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              const nextType = active ? "" : pt;
                              setDraftType(nextType);
                              if (nextType && draftTag && catalog) {
                                const grp = catalog.groups.find(
                                  (g) => g.productType.toLocaleLowerCase() === nextType.toLocaleLowerCase(),
                                );
                                if (!grp?.tags.some((t) => t.tag.toLocaleLowerCase() === draftTag.toLocaleLowerCase())) {
                                  setDraftTag("");
                                }
                              }
                            }}
                            className={
                              active
                                ? "h-10 rounded-full border border-[#091e1c] bg-[#091e1c] px-4 text-[13px] font-semibold text-white transition-colors"
                                : "h-10 rounded-full border border-[#dce3db] bg-white px-4 text-[13px] font-semibold text-[#091e1c] transition-colors hover:bg-[#f3f7f6]"
                            }
                          >
                            {pt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {draftTagCircles.length > 0 ? (
                  <div className={productTypes.length > 1 ? "border-t border-[#eef2f1] pt-4" : ""}>
                    <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-[#52625f]">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        aria-pressed={draftTag === ""}
                        onClick={() => setDraftTag("")}
                        className={
                          draftTag === ""
                            ? "h-9 rounded-full border border-[#091e1c] bg-[#091e1c] px-3.5 text-[13px] font-semibold text-white transition-colors"
                            : "h-9 rounded-full border border-[#dce3db] bg-white px-3.5 text-[13px] font-semibold text-[#091e1c] transition-colors hover:bg-[#f3f7f6]"
                        }
                      >
                        All tags
                      </button>
                      {draftTagCircles.map((item) => {
                        const active =
                          draftTag.toLocaleLowerCase() === item.tag.toLocaleLowerCase();
                        return (
                          <button
                            key={item.label}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setDraftTag(active ? "" : item.tag)}
                            className={
                              active
                                ? "h-9 rounded-full border border-[#091e1c] bg-[#091e1c] px-3.5 text-[13px] font-semibold text-white transition-colors"
                                : "h-9 rounded-full border border-[#dce3db] bg-white px-3.5 text-[13px] font-semibold text-[#091e1c] transition-colors hover:bg-[#f3f7f6]"
                            }
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className={productTypes.length > 1 || draftTagCircles.length > 0 ? "border-t border-[#eef2f1] pt-4" : ""}>
                  <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-[#52625f]">
                    Price range
                  </h4>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      placeholder="Min"
                      aria-label="Minimum price"
                      value={minDraft}
                      onChange={(e) => setMinDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyFilters();
                        }
                      }}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-[#dce3db] bg-white px-3 text-[16px] text-[#091e1c] outline-none focus:border-[#091e1c]"
                    />
                    <span className="text-sm font-medium text-[#52625f]">–</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      placeholder="Max"
                      aria-label="Maximum price"
                      value={maxDraft}
                      onChange={(e) => setMaxDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyFilters();
                        }
                      }}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-[#dce3db] bg-white px-3 text-[16px] text-[#091e1c] outline-none focus:border-[#091e1c]"
                    />
                  </div>
                </div>
              </div>
            </ResponsivePickerModal>

            {/* Sort By: Mobile bottom sheet / Tablet & Desktop dialog */}
            <ResponsivePickerModal
              open={sortOpen}
              onOpenChange={setSortOpen}
              title="Sort products"
              description="Choose how products in this collection are ordered"
              maxWidthClassName="sm:max-w-[380px]"
            >
              <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Sort products">
                {SORT_OPTIONS.map((opt) => {
                  const active = sort === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setSort(opt.value);
                        setSortOpen(false);
                      }}
                      className={
                        active
                          ? "flex min-h-[46px] w-full items-center justify-between rounded-xl border border-[#c9e59a] bg-[#f0f7e4] px-3.5 text-left text-[15px] font-bold text-[#091e1c]"
                          : "flex min-h-[46px] w-full items-center justify-between rounded-xl border border-transparent px-3.5 text-left text-[15px] font-medium text-[#091e1c] transition-colors hover:bg-[#f3f7f6]"
                      }
                    >
                      <span>{opt.label}</span>
                      {active ? <Check size={18} className="shrink-0 text-[#426b1d]" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </ResponsivePickerModal>

            {/* Product Type: Mobile bottom sheet / Tablet & Desktop dialog */}
            <ResponsivePickerModal
              open={typeOpen}
              onOpenChange={setTypeOpen}
              title="Product type"
              description={`Choose a product type inside ${collectionTitle}`}
              maxWidthClassName="sm:max-w-[400px]"
            >
              <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Product type">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedType === ""}
                  onClick={() => {
                    handleSelectType("");
                    setTypeOpen(false);
                  }}
                  className={
                    selectedType === ""
                      ? "flex min-h-[46px] w-full items-center justify-between rounded-xl border border-[#c9e59a] bg-[#f0f7e4] px-3.5 text-left text-[15px] font-bold text-[#091e1c]"
                      : "flex min-h-[46px] w-full items-center justify-between rounded-xl border border-transparent px-3.5 text-left text-[15px] font-medium text-[#091e1c] transition-colors hover:bg-[#f3f7f6]"
                  }
                >
                  <span>All product types</span>
                  {selectedType === "" ? (
                    <Check size={18} className="shrink-0 text-[#426b1d]" aria-hidden="true" />
                  ) : null}
                </button>
                {productTypes.map((pt) => {
                  const active = selectedType.toLocaleLowerCase() === pt.toLocaleLowerCase();
                  return (
                    <button
                      key={pt}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        handleSelectType(pt);
                        setTypeOpen(false);
                      }}
                      className={
                        active
                          ? "flex min-h-[46px] w-full items-center justify-between rounded-xl border border-[#c9e59a] bg-[#f0f7e4] px-3.5 text-left text-[15px] font-bold text-[#091e1c]"
                          : "flex min-h-[46px] w-full items-center justify-between rounded-xl border border-transparent px-3.5 text-left text-[15px] font-medium text-[#091e1c] transition-colors hover:bg-[#f3f7f6]"
                      }
                    >
                      <span>{pt}</span>
                      {active ? (
                        <Check size={18} className="shrink-0 text-[#426b1d]" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </ResponsivePickerModal>

            {/* Product Masonry Grid — exact /shop cards on mobile & desktop */}
            <div className="sp-masonry">
              {loading
                ? Array.from({ length: colCount }).map((_, ci) => (
                    <div key={ci} className="sp-mcol">
                      {[1.2, 1, 1.35, 1.1].map((r, i) => (
                        <div
                          key={i}
                          className="sp-skel"
                          style={{ height: 0, paddingBottom: `${Math.round(r * 100)}%` }}
                        />
                      ))}
                    </div>
                  ))
                : cols.map((col, ci) => (
                    <div key={ci} className="sp-mcol">
                      {col.items.map(({ p, r }) => {
                        const node = p.node;
                        const img = node.images?.edges?.[0]?.node;
                        const price = node.priceRange?.minVariantPrice;
                        return (
                          <article key={node.id} className="sp-card">
                            <Link
                              href={`/shop/product/${node.handle}`}
                              className="sp-card-link"
                            >
                              <div
                                className="sp-img sp-real"
                                style={{ aspectRatio: `1 / ${r}` }}
                              >
                                {img?.url ? (
                                  <img
                                    className="sp-real-img"
                                    src={img.url}
                                    alt={img.altText || node.title}
                                    loading="lazy"
                                  />
                                ) : null}
                              </div>
                              <h3>{node.title}</h3>
                              <p className="sp-price">
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
              <p className="sp-note">
                {`${error} `}
                <button
                  type="button"
                  onClick={() => {
                    clearShopCollectionCache();
                    setReloadNonce((n) => n + 1);
                  }}
                >
                  Try again
                </button>
              </p>
            ) : !loading && filteredProducts.length === 0 ? (
              <p className="sp-note">
                {"No products match your selection in this collection. "}
                <button type="button" onClick={clearAllFilters}>
                  Reset filters
                </button>
              </p>
            ) : null}

            {!loading && hasMore ? (
              <div className="sp-more-wrap">
                <button
                  type="button"
                  className="sp-more"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  Load more
                </button>
              </div>
            ) : null}

            <div className="ed-foot">
              <span>Verified sellers</span>
              <span>Pay with USDT, BTC or ETH</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
