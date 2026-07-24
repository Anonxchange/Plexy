import { useHead } from "@unhead/react";
import { useSchema, shopPageSchema } from "@/hooks/use-schema";
import { useState, useEffect, useRef, lazy, Suspense, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Search, Package, Plus, Store, LayoutGrid, ChevronRight, Shuffle, SlidersHorizontal, Check } from '@/lib/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { shopifyService } from "@/lib/shopify-service";
import { ShopSkeleton } from "@/components/shop/ShopSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopPageSkeleton } from "@/components/page-skeleton";
import { CartSheet } from "@/components/shop/CartSheet";
import { CategoryBrowserModal } from "@/components/shop/CategoryBrowserModal";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-shopify-cart";
import { devLog } from "@/lib/dev-logger";

const ShopItemCard = lazy(() => import("@/components/shop/ShopItemCard").then(m => ({ default: m.ShopItemCard })));

// ── Mobile-only shop banner carousel ─────────────────────────────────────────
const BANNER_SLIDES = [
  {
    id: 'home',
    src: '/assets/banners/mobile/banner-home.webp',
    alt: 'Make Your Home Smarter — Tchot Home Essentials',
  },
  {
    id: 'fashion',
    src: '/assets/banners/mobile/banner-fashion.webp',
    alt: 'Style That Speaks — Tchot Fashion',
  },
  {
    id: 'tech',
    src: '/assets/banners/mobile/banner-tech.webp',
    alt: 'Power Up Your Everyday — Tchot Tech',
  },
] as const;

function ShopBanner() {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const advance = (dir: 1 | -1) =>
    setIdx(i => (i + dir + BANNER_SLIDES.length) % BANNER_SLIDES.length);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => advance(1), 4200);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div
      role="region"
      aria-label="Promotional banners"
      className="relative overflow-hidden mb-2 select-none"
      style={{ aspectRatio: '16 / 7' }}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) < 40) return;
        advance(dx < 0 ? 1 : -1);
        resetTimer();
      }}
    >
      {/* Slides — crossfade */}
      {BANNER_SLIDES.map((slide, i) => (
        <img
          key={slide.id}
          src={slide.src}
          alt={slide.alt}
          width={800}
          height={350}
          fetchPriority={i === 0 ? 'high' : 'low'}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
          style={{ opacity: i === idx ? 1 : 0, pointerEvents: 'none' }}
        />
      ))}

      {/* Slide dots */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {BANNER_SLIDES.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Go to slide ${i + 1}`}
            onClick={e => { e.stopPropagation(); setIdx(i); resetTimer(); }}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === idx ? 18 : 6,
              height: 6,
              background: i === idx ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.38)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

const SHOPIFY_FETCH_SIZE = 250;
const SHOPIFY_DISPLAY_PAGE_SIZE = 60;

const CAT_SEPARATOR = " > ";

const SHOP_CACHE_KEY = "pexly_shop_cache";
const SHOP_CACHE_TTL = 5 * 60 * 1000;

function readShopCache(): { products: Listing[]; categories: string[] } | null {
  try {
    const raw = sessionStorage.getItem(SHOP_CACHE_KEY);
    if (!raw) return null;
    const { products, categories, ts } = JSON.parse(raw);
    if (Date.now() - ts > SHOP_CACHE_TTL) return null;
    return { products, categories };
  } catch { return null; }
}

function writeShopCache(products: Listing[], categories: string[]) {
  try {
    sessionStorage.setItem(SHOP_CACHE_KEY, JSON.stringify({ products, categories, ts: Date.now() }));
  } catch { /* silent */ }
}

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Deterministic integer hash of a string — same input always gives same output. */
function stableHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Pick `count` products for a section using a stable sort derived from product IDs,
 * so the selection never changes between renders for the same product pool.
 * `offset` skips the first N products so different sections don't overlap.
 */
function pickStableProducts(pool: Listing[], count: number, offset = 0): Listing[] {
  if (pool.length === 0) return [];
  const sorted = [...pool].sort((a, b) => stableHash(a.id + "section") - stableHash(b.id + "section"));
  return sorted.slice(offset, offset + count);
}

interface Listing {
  id: string;
  handle?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  tags?: string[];
  images: string[];
  location: string;
  user_id: string;
  status: string;
  metadata: any[];
  variantId?: string;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  badge?: string;
}

interface CategoryNode {
  name: string;
  fullPath: string;
  children: CategoryNode[];
}

function buildCategoryTree(categories: string[]): CategoryNode[] {
  // Expand every full taxonomy path into all its intermediate paths so the tree
  // has proper parent nodes even when only leaf-level strings are in the input.
  // e.g. "A > B > C" → adds "A", "A > B", "A > B > C"
  const allPaths = new Set<string>();
  for (const cat of categories) {
    if (!cat || cat === "All") continue;
    const parts = cat.split(CAT_SEPARATOR);
    for (let i = 1; i <= parts.length; i++) {
      allPaths.add(parts.slice(0, i).join(CAT_SEPARATOR));
    }
  }

  const buildChildren = (parentPath: string, depth: number): CategoryNode[] => {
    if (depth > 6) return [];
    return Array.from(allPaths)
      .filter(p => {
        const lastSep = p.lastIndexOf(CAT_SEPARATOR);
        return lastSep !== -1 && p.slice(0, lastSep) === parentPath;
      })
      .sort((a, b) => a.localeCompare(b))
      .map(childPath => ({
        name: childPath.slice(parentPath.length + CAT_SEPARATOR.length),
        fullPath: childPath,
        children: buildChildren(childPath, depth + 1),
      }));
  };

  return Array.from(allPaths)
    .filter(p => !p.includes(CAT_SEPARATOR))
    .sort((a, b) => a.localeCompare(b))
    .map(root => ({
      name: root,
      fullPath: root,
      children: buildChildren(root, 1),
    }));
}


// ── Trending Now ──────────────────────────────────────────────────────────────
function TrendingNowSection({
  products,
  onViewDetails,
}: {
  products: Listing[];
  onViewDetails: (p: Listing) => void;
}) {
  const trending = products;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <h2 className="text-base font-bold">Trending Now</h2>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            — most popular right now
          </span>
        </div>
      </div>
      {/* Mobile: horizontal scroll  |  Desktop: 5-column grid */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 lg:grid lg:grid-cols-5 lg:gap-x-5 lg:gap-y-6 lg:overflow-x-visible lg:mx-0 lg:px-0 lg:pb-0">
        {trending.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44 lg:w-auto">
                <div className="w-44 h-52 lg:w-full lg:h-60 bg-muted lg:bg-white dark:lg:bg-neutral-900 animate-pulse mb-2.5" />
                <div className="h-3.5 bg-muted animate-pulse rounded mb-1.5 w-4/5" />
                <div className="h-3.5 bg-muted animate-pulse rounded w-2/5" />
              </div>
            ))
          : trending.map((product) => {
              const disc =
                product.originalPrice && product.originalPrice > product.price
                  ? Math.round(
                      ((product.originalPrice - product.price) /
                        product.originalPrice) *
                        100
                    )
                  : null;
              return (
                <div
                  key={product.id}
                  onClick={() => onViewDetails(product)}
                  className="flex-shrink-0 w-44 lg:w-auto cursor-pointer group"
                >
                  <div className="w-44 h-52 lg:w-full lg:h-60 bg-muted lg:bg-white dark:lg:bg-neutral-900 overflow-hidden relative mb-2.5">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover lg:object-contain lg:p-2 group-hover:scale-105 lg:group-hover:scale-100 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    {disc && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        -{disc}%
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      🔥{" "}
                      {product.soldCount && product.soldCount >= 1000
                        ? `${(product.soldCount / 1000).toFixed(0)}K`
                        : product.soldCount}
                      + sold
                    </div>
                  </div>
                  <p className="text-sm font-medium line-clamp-2 leading-tight text-foreground group-hover:text-primary transition-colors">
                    {product.title}
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-sm font-bold">
                      {product.currency} {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}


export function Shop() {
  useHead({
    title: "Shop | Pexly",
    meta: [
      { name: "description", content: "Online shopping for electronics, fashion, home & garden, beauty, sports & more. Millions of products from verified global sellers — unbeatable prices, flash deals, and buyer protection on every order." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Shop | Pexly" },
      { property: "og:description", content: "Online shopping for electronics, fashion, home & garden, beauty, sports & more. Millions of products, unbeatable prices, buyer protection guaranteed." },
      { property: "og:url", content: "https://www.pexly.app/shop" },
    ],
    link: [{ rel: "canonical", href: "https://www.pexly.app/shop" }],
  });
  useSchema(shopPageSchema, 'shop-schema');
  const [, navigate] = useLocation();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("shuffle");
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [shopifyProducts, setShopifyProducts] = useState<Listing[]>([]);
  const [marketplaceCategories, setMarketplaceCategories] = useState<string[]>(["All"]);
  const [shopifyCategories, setShopifyCategories] = useState<string[]>(["All"]);
  const [activeTab, setActiveTab] = useState("shopify");
  const [isShopifyLoading, setIsShopifyLoading] = useState(true);
  const [isMarketplaceLoading, setIsMarketplaceLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(SHOPIFY_DISPLAY_PAGE_SIZE);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [modalInitialL1, setModalInitialL1] = useState<string | null>(null);

  const shopifyFetchIdRef = useRef(0);

  useEffect(() => { fetchListings(); }, []);

  useEffect(() => {
    if (activeTab === "shopify") fetchShopifyProducts();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "shopify") return;
    const id = setInterval(() => fetchShopifyProducts(true), 300_000);
    return () => clearInterval(id);
  }, [activeTab]);

  useEffect(() => {
    const cats = new Set<string>(["All"]);
    listings.forEach(p => { if (p.category) cats.add(p.category); });
    setMarketplaceCategories(Array.from(cats).sort());
  }, [listings]);

  useEffect(() => { setSelectedCategory("All"); setExpandedCategories(new Set()); }, [activeTab]);
  useEffect(() => { setVisibleCount(SHOPIFY_DISPLAY_PAGE_SIZE); }, [selectedCategory, searchQuery, sortBy]);

  const fetchShopifyProducts = async (isBackground = false) => {
    // Background refreshes only update the cache — they must NOT claim a new fetchId
    // or they would cancel any in-progress foreground fetch.
    const fetchId = isBackground ? shopifyFetchIdRef.current : ++shopifyFetchIdRef.current;

    if (!isBackground) {
      const cached = readShopCache();
      if (cached) {
        setShopifyProducts(shuffleArray(cached.products));
        setShopifyCategories(cached.categories);
        setIsShopifyLoading(false);
        return; // cache is fresh — skip the Shopify re-fetch
      } else {
        setIsShopifyLoading(true);
        setShopifyProducts([]);
        setShopifyCategories(["All"]);
      }
    }

    const allFetched: Listing[] = [];
    const catPathSet = new Set<string>();
    let firstPageDone = false;

    try {
      // Step 1: fetch all collections
      const collectionsResult = await shopifyService.getCollections(50);
      if (fetchId !== shopifyFetchIdRef.current) return;
      const collections = collectionsResult.collections as Array<{ node: { handle: string; title: string } }>;

      if (collections.length === 0) {
        // Fallback: no collections — use flat productType list
        let after: string | undefined;
        let hasMore = true;
        let page = 0;
        while (hasMore && page < 40) {
          if (fetchId !== shopifyFetchIdRef.current) return;
          const result = await shopifyService.getProducts(SHOPIFY_FETCH_SIZE, after);
          if (fetchId !== shopifyFetchIdRef.current) return;
          const fetched: Listing[] = (result.products || []).map((edge: any) => {
            const p = edge.node;
            const pt = p.productType?.trim() || "";
            return {
              id: p.id, handle: p.handle, title: p.title, description: p.description,
              price: parseFloat(p.priceRange.minVariantPrice.amount),
              currency: p.priceRange.minVariantPrice.currencyCode,
              category: pt,
              tags: Array.isArray(p.tags) ? p.tags.filter((t: string) => t.trim()) : [],
              images: p.images.edges.map((e: any) => e.node.url),
              location: "Online", user_id: "shopify", status: "active", metadata: [],
              variantId: p.variants.edges[0]?.node?.id,
            };
          });
          allFetched.push(...fetched);
          fetched.forEach(p => { if (p.category) catPathSet.add(p.category); });
          if (!firstPageDone && !isBackground) {
            setShopifyProducts(shuffleArray([...allFetched]));
            setIsShopifyLoading(false);
            setVisibleCount(SHOPIFY_DISPLAY_PAGE_SIZE);
            firstPageDone = true;
          }
          hasMore = result.pageInfo?.hasNextPage || false;
          after = result.pageInfo?.endCursor;
          page++;
        }
      } else {
        // Step 2: fetch all collections in parallel
        await Promise.all(collections.map(async (colEdge) => {
          if (fetchId !== shopifyFetchIdRef.current) return;
          const colHandle = colEdge.node.handle;
          const colTitle = colEdge.node.title;
          catPathSet.add(colTitle);

          let after: string | undefined;
          let hasMore = true;
          let page = 0;
          while (hasMore && page < 20) {
            if (fetchId !== shopifyFetchIdRef.current) return;
            const result = await shopifyService.getCollectionProducts(colHandle, SHOPIFY_FETCH_SIZE, after);
            if (fetchId !== shopifyFetchIdRef.current) return;

            const fetched: Listing[] = (result.products || []).map((edge: any) => {
              const p = edge.node;
              const pt = p.productType?.trim() || "";
              const tags: string[] = Array.isArray(p.tags) ? p.tags.filter((t: string) => t.trim()) : [];

              // Build category path: "Collection > ProductType"
              // Tags register their own deep paths for the tree
              let category = colTitle;
              if (pt) {
                category = `${colTitle}${CAT_SEPARATOR}${pt}`;
                catPathSet.add(category);
                tags.forEach(tag => catPathSet.add(`${colTitle}${CAT_SEPARATOR}${pt}${CAT_SEPARATOR}${tag}`));
              }

              return {
                id: p.id, handle: p.handle, title: p.title, description: p.description,
                price: parseFloat(p.priceRange.minVariantPrice.amount),
                currency: p.priceRange.minVariantPrice.currencyCode,
                category,
                tags,
                images: p.images.edges.map((e: any) => e.node.url),
                location: "Online", user_id: "shopify", status: "active", metadata: [],
                variantId: p.variants.edges[0]?.node?.id,
              };
            });

            allFetched.push(...fetched);

            // Show results as soon as any collection's first page lands
            if (!firstPageDone && !isBackground && allFetched.length > 0) {
              setShopifyProducts(shuffleArray([...allFetched]));
              setShopifyCategories(["All", ...Array.from(catPathSet).sort()]);
              setIsShopifyLoading(false);
              setVisibleCount(SHOPIFY_DISPLAY_PAGE_SIZE);
              firstPageDone = true;
            }

            hasMore = result.pageInfo?.hasNextPage || false;
            after = result.pageInfo?.endCursor;
            page++;
          }
        }));
      }

      if (fetchId === shopifyFetchIdRef.current && allFetched.length > 0) {
        const allCats = ["All", ...Array.from(catPathSet).sort()];
        writeShopCache(allFetched, allCats);
        if (!isBackground) {
          setShopifyProducts(shuffleArray(allFetched));
          setShopifyCategories(allCats);
        }
      }
    } catch (err) {
      if (fetchId === shopifyFetchIdRef.current) devLog.error("Error fetching Shopify products:", err);
    } finally {
      if (fetchId === shopifyFetchIdRef.current && !isBackground) setIsShopifyLoading(false);
    }
  };

  const fetchListings = async () => {
    setIsMarketplaceLoading(true);
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.from("shop_listings").select("*");
      if (error) throw error;
      const transformed = (data || []).map(item => {
        let imageUrls: string[] = [];
        if (Array.isArray(item.images)) {
          imageUrls = item.images.filter((img: any) => typeof img === "string" && img.startsWith("http"));
        } else if (typeof item.images === "string" && item.images.trim()) {
          try {
            const parsed = JSON.parse(item.images);
            imageUrls = Array.isArray(parsed) ? parsed.filter((img: any) => typeof img === "string" && img.startsWith("http")) : [item.images];
          } catch { if (item.images.startsWith("http")) imageUrls = [item.images]; }
        }
        return { ...item, images: imageUrls };
      });
      setListings(transformed);
    } catch (err) {
      devLog.error("Error fetching listings:", err);
      setListings([]);
    }
    finally { setIsMarketplaceLoading(false); }
  };


  const handleViewDetails = (product: Listing) => {
    if (product.user_id === "shopify" && product.handle) navigate(`/shop/product/${product.handle}`);
    else navigate(`/shop/product/${encodeURIComponent(product.id)}`);
  };

  const handleAddToCart = async (product: Listing) => {
    if (product.user_id !== "shopify" || !product.variantId) {
      toast.info("Marketplace checkout coming soon.");
      return;
    }
    await addToCart(product.variantId, { variantId: product.variantId, title: product.title, price: product.price, currency: product.currency, image: product.images[0] });
  };

  const currentListings = activeTab === "marketplace" ? listings : shopifyProducts;

  // ── Trending Now + Flash Deals — stable random picks from the Shopify pool ──
  // Trending products — deterministic per pool change, excluded from main grid.
  const { trendingProducts, sectionIds } = useMemo(() => {
    const pool = shopifyProducts.filter(p => p.images[0]);
    if (pool.length === 0) return { trendingProducts: [], sectionIds: new Set<string>() };

    const trendingCount = Math.min(12, Math.floor(pool.length * 0.15) || 6);
    const rawTrending = pickStableProducts(pool, trendingCount, 0).map(p => ({
      ...p,
      soldCount: 500 + (stableHash(p.id + "sold") % 9500),
    }));

    const ids = new Set<string>(rawTrending.map(p => p.id));
    return { trendingProducts: rawTrending, sectionIds: ids };
  }, [shopifyProducts]);

  const filteredProducts = useMemo(() => {
    const filtered = currentListings
      .filter(p => {
        // Exclude products already shown in Trending / Flash Deals sections
        // (only when on the shopify tab and no search/category filter is active)
        if (
          activeTab === "shopify" &&
          selectedCategory === "All" &&
          !searchQuery &&
          sectionIds.has(p.id)
        ) return false;

        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);

        let matchesCategory = false;
        if (selectedCategory === "All") {
          matchesCategory = true;
        } else {
          const parts = selectedCategory.split(CAT_SEPARATOR);
          if (parts.length <= 2) {
            // Collection or Collection > ProductType — match by category prefix
            matchesCategory = p.category === selectedCategory || p.category.startsWith(selectedCategory + CAT_SEPARATOR);
          } else {
            // Collection > ProductType > Tag — match category prefix AND tag
            const catPath = parts.slice(0, 2).join(CAT_SEPARATOR);
            const tagFilter = parts[2];
            matchesCategory = (p.category === catPath || p.category.startsWith(catPath + CAT_SEPARATOR))
              && Array.isArray(p.tags) && p.tags.includes(tagFilter);
          }
        }

        return matchesSearch && matchesCategory;
      });

    if (sortBy === "price-low") filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const gidNum = (p: Listing) => { const m = p.id.match(/\/(\d+)$/); return m ? parseInt(m[1], 10) : 0; };
        const av = a.user_id === "shopify" ? gidNum(a) : new Date((a as any).created_at || 0).getTime();
        const bv = b.user_id === "shopify" ? gidNum(b) : new Date((b as any).created_at || 0).getTime();
        return bv - av;
      });
    } else if (sortBy === "shuffled") {
      return shuffleArray(filtered);
    }

    return filtered;
  }, [currentListings, searchQuery, selectedCategory, sortBy, shuffleSeed, activeTab, sectionIds]);

  const visibleProducts = activeTab === "shopify" ? filteredProducts.slice(0, visibleCount) : filteredProducts;
  const hasMoreToShow = activeTab === "shopify" && visibleCount < filteredProducts.length;

  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = { All: currentListings.length };
    currentListings.forEach(p => {
      if (!p.category) return;
      // Increment every ancestor path (Collection, Collection > ProductType)
      const parts = p.category.split(CAT_SEPARATOR);
      for (let i = 1; i <= parts.length; i++) {
        const path = parts.slice(0, i).join(CAT_SEPARATOR);
        counts[path] = (counts[path] || 0) + 1;
      }
      // Also count tag-level paths: Collection > ProductType > Tag
      if (parts.length >= 2 && Array.isArray(p.tags)) {
        const basePath = parts.slice(0, 2).join(CAT_SEPARATOR);
        p.tags.forEach((tag: string) => {
          if (tag.trim()) {
            const tagPath = `${basePath}${CAT_SEPARATOR}${tag}`;
            counts[tagPath] = (counts[tagPath] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [currentListings]);

  const categoryTree = useMemo(
    () => buildCategoryTree(activeTab === "shopify" ? shopifyCategories : marketplaceCategories),
    [shopifyCategories, marketplaceCategories, activeTab]
  );

  // Map each category path to the first product image found in that subtree
  const categoryImages = useMemo(() => {
    const map: Record<string, string> = {};
    currentListings.forEach(p => {
      if (!p.images[0]) return;
      // Register Collection and Collection > ProductType paths
      if (p.category) {
        const parts = p.category.split(CAT_SEPARATOR);
        for (let i = 1; i <= parts.length; i++) {
          const path = parts.slice(0, i).join(CAT_SEPARATOR);
          if (!map[path]) map[path] = p.images[0];
        }
        // Register Collection > ProductType > Tag paths
        if (parts.length >= 2 && Array.isArray(p.tags)) {
          const basePath = parts.slice(0, 2).join(CAT_SEPARATOR);
          p.tags.forEach((tag: string) => {
            if (tag.trim()) {
              const tagPath = `${basePath}${CAT_SEPARATOR}${tag}`;
              if (!map[tagPath]) map[tagPath] = p.images[0];
            }
          });
        }
      }
    });
    return map;
  }, [currentListings]);

  const openCategoryModal = (l1Path: string | null) => {
    setModalInitialL1(l1Path);
    setCategoryModalOpen(true);
  };

  const isLoading = activeTab === "shopify" ? isShopifyLoading : isMarketplaceLoading;
  const categories = activeTab === "shopify" ? shopifyCategories : marketplaceCategories;

  if (isLoading) return <ShopPageSkeleton />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 pt-0 pb-6 lg:pt-6 max-w-7xl">

        {/* Banner carousel — mobile only, sits at the very top before the header */}
        <div className="lg:hidden -mx-4">
          <ShopBanner />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Shop</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Discover amazing products for every need</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/shop/post")} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Post an Ad
            </Button>
            <CartSheet />
          </div>
        </div>

        {/* Trending Now */}
        <TrendingNowSection
          products={activeTab === "marketplace" ? listings.slice(0, 12) : trendingProducts}
          onViewDetails={handleViewDetails}
        />


        {/* Search + Sort + Tabs row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Shuffle icon — mobile only */}
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden flex-shrink-0"
              onClick={() => { setSortBy("shuffled"); setShuffleSeed(s => s + 1); }}
              aria-label="Shuffle products"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            {/* Filter icon — mobile only, replaces the long sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="sm:hidden flex-shrink-0" aria-label="Sort options">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setSortBy("newest")} className="gap-2">
                  {sortBy === "newest" && <Check className="h-3.5 w-3.5" />}
                  <span className={sortBy !== "newest" ? "pl-5" : ""}>Newest</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSortBy("price-low")} className="gap-2">
                  {sortBy === "price-low" && <Check className="h-3.5 w-3.5" />}
                  <span className={sortBy !== "price-low" ? "pl-5" : ""}>Price: Low to High</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSortBy("price-high")} className="gap-2">
                  {sortBy === "price-high" && <Check className="h-3.5 w-3.5" />}
                  <span className={sortBy !== "price-high" ? "pl-5" : ""}>Price: High to Low</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Sort select — desktop only */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="hidden sm:flex w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="shopify" className="gap-1.5">
                <Store className="h-3.5 w-3.5" />
                Store
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Marketplace
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile: horizontal category pills — L1 only, clicking opens modal */}
        <div className="lg:hidden mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => { setSelectedCategory("All"); setExpandedCategories(new Set()); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedCategory === "All"
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:border-primary/50"
            }`}
          >
            All
            {productCountByCategory["All"] ? (
              <span className="ml-1 text-xs opacity-60">({productCountByCategory["All"]})</span>
            ) : null}
          </button>
          {categoryTree.map(node => (
            <button
              key={node.fullPath}
              onClick={() => openCategoryModal(node.fullPath)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === node.fullPath || selectedCategory.startsWith(node.fullPath + CAT_SEPARATOR)
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              }`}
            >
              {node.name}
              {productCountByCategory[node.fullPath] ? (
                <span className="ml-1 text-xs opacity-60">({productCountByCategory[node.fullPath]})</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Main content: sidebar + grid */}
        <div className="flex gap-6">

          {/* Desktop sidebar — L1 only, clicking opens category modal */}
          <aside className="hidden lg:flex flex-col w-52 flex-shrink-0">
            <div className="sticky top-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-2">
                Categories
              </p>
              <div className="space-y-0.5">

                {/* All */}
                <button
                  onClick={() => { setSelectedCategory("All"); setExpandedCategories(new Set()); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === "All"
                      ? "bg-foreground text-background font-semibold"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="h-3.5 w-3.5 flex-shrink-0" />
                    All
                  </span>
                  {productCountByCategory["All"] ? (
                    <span className={`text-xs ${selectedCategory === "All" ? "opacity-70" : "text-muted-foreground"}`}>
                      {productCountByCategory["All"]}
                    </span>
                  ) : null}
                </button>

                {/* L1 categories — click opens modal */}
                {categoryTree.map(node => {
                  const isSelected = selectedCategory === node.fullPath || selectedCategory.startsWith(node.fullPath + CAT_SEPARATOR);
                  return (
                    <button
                      key={node.fullPath}
                      onClick={() => openCategoryModal(node.fullPath)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected
                          ? "bg-foreground text-background font-semibold"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-left leading-snug">
                        <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-50" />
                        {node.name}
                      </span>
                      {productCountByCategory[node.fullPath] ? (
                        <span className={`text-xs flex-shrink-0 ml-1 ${isSelected ? "opacity-70" : "text-muted-foreground"}`}>
                          {productCountByCategory[node.fullPath]}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Product area */}
          <div className="flex-1 min-w-0">
            {/* Active filter breadcrumb */}
            {selectedCategory !== "All" && (
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => { setSelectedCategory("All"); setExpandedCategories(new Set()); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  All
                </button>
                {selectedCategory.split(CAT_SEPARATOR).map((part, i, arr) => (
                  <span key={i} className="flex items-center gap-2">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    {i < arr.length - 1 ? (
                      <button
                        onClick={() => setSelectedCategory(arr.slice(0, i + 1).join(CAT_SEPARATOR))}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {part}
                      </button>
                    ) : (
                      <span className="text-sm font-semibold">{part}</span>
                    )}
                  </span>
                ))}
                <Badge variant="secondary" className="text-xs">{filteredProducts.length}</Badge>
              </div>
            )}

            {isLoading ? (
              <ShopSkeleton />
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-card/30 rounded-3xl border border-dashed border-border/60">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your search or category</p>
              </div>
            ) : (
              <>
                {/* Pinterest masonry — two independent columns so heights stagger naturally */}
                <div className="flex gap-0.5 -mx-4 lg:mx-0">
                  <Suspense fallback={<ShopSkeleton />}>
                    {/* Left column — starts tall */}
                    <div className="flex flex-col gap-0.5 flex-1">
                      {visibleProducts
                        .filter((_, i) => i % 2 === 0)
                        .map((product, colIdx) => (
                          <ShopItemCard
                            key={product.id}
                            product={product}
                            onViewDetails={handleViewDetails}
                            onAddToCart={handleAddToCart}
                          />
                        ))}
                    </div>
                    {/* Right column — starts short, opposite phase */}
                    <div className="flex flex-col gap-0.5 flex-1">
                      {visibleProducts
                        .filter((_, i) => i % 2 === 1)
                        .map((product, colIdx) => (
                          <ShopItemCard
                            key={product.id}
                            product={product}
                            onViewDetails={handleViewDetails}
                            onAddToCart={handleAddToCart}
                          />
                        ))}
                    </div>
                  </Suspense>
                </div>

                {hasMoreToShow && (
                  <div className="mt-10 flex flex-col items-center gap-2 pb-10">
                    <Button variant="outline" size="lg" onClick={() => setVisibleCount(v => v + SHOPIFY_DISPLAY_PAGE_SIZE)} className="min-w-[200px]">
                      Load More Products
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Showing {visibleProducts.length} of {filteredProducts.length} products
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <PexlyFooter />

      {/* Category browser modal */}
      <CategoryBrowserModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categoryTree={categoryTree}
        initialL1={modalInitialL1}
        productCountByCategory={productCountByCategory}
        categoryImages={categoryImages}
        onSelectCategory={cat => {
          setSelectedCategory(cat);
          setExpandedCategories(new Set());
        }}
        products={currentListings}
        onViewProduct={handleViewDetails}
      />
    </div>
  );
}
