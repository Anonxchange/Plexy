import { useHead } from "@unhead/react";
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
import { Search, Package, Plus, Store, LayoutGrid, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { shopifyService } from "@/lib/shopify-service";
import { ShopSkeleton } from "@/components/shop/ShopSkeleton";
import { CartSheet } from "@/components/shop/CartSheet";
import { CategoryBrowserModal } from "@/components/shop/CategoryBrowserModal";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-shopify-cart";
import { devLog } from "@/lib/dev-logger";

const ShopItemCard = lazy(() => import("@/components/shop/ShopItemCard").then(m => ({ default: m.ShopItemCard })));

const SHOPIFY_FETCH_SIZE = 250;
const SHOPIFY_DISPLAY_PAGE_SIZE = 60;
const CAT_SEPARATOR = " > ";

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

export function Shop() {
  useHead({ title: "Crypto Shop | Pexly", meta: [{ name: "description", content: "Discover products and services available for direct cryptocurrency purchase." }] });
  const [, navigate] = useLocation();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("shuffle");
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
    const fetchId = ++shopifyFetchIdRef.current;
    if (!isBackground) {
      setIsShopifyLoading(true);
      setShopifyProducts([]);
      setShopifyCategories(["All"]);
    }
    let firstPageDone = false;
    try {
      let after: string | undefined;
      let hasMore = true;
      let page = 0;
      while (hasMore && page < 40) {
        if (fetchId !== shopifyFetchIdRef.current) return;
        const result = await shopifyService.getProducts(SHOPIFY_FETCH_SIZE, after, undefined, false);
        if (fetchId !== shopifyFetchIdRef.current) return;

        const fetched: Listing[] = (result.products || []).map((edge: any) => {
          const p = edge.node;
          // Build the full taxonomy path from ancestors + leaf name.
          // Storefront API exposes category.ancestors (root→parent) and category.name (leaf).
          // e.g. ancestors=["Vehicles & Parts","Vehicle Care"] + name="Car Wax"
          //   → "Vehicles & Parts > Vehicle Care > Car Wax"
          const buildTaxonomyPath = (cat: any): string => {
            if (!cat) return "";
            const parts: string[] = [...(cat.ancestors || []).map((a: any) => a.name), cat.name];
            return parts.filter(Boolean).join(CAT_SEPARATOR);
          };
          const taxonomyCategory: string = buildTaxonomyPath(p.category);
          return {
            id: p.id,
            handle: p.handle,
            title: p.title,
            description: p.description,
            price: parseFloat(p.priceRange.minVariantPrice.amount),
            currency: p.priceRange.minVariantPrice.currencyCode,
            category: taxonomyCategory,
            tags: Array.isArray(p.tags) ? p.tags.filter((t: string) => t.trim().length > 0) : [],
            images: p.images.edges.map((e: any) => e.node.url),
            location: "Online",
            user_id: "shopify",
            status: "active",
            metadata: [],
            variantId: p.variants.edges[0]?.node?.id,
          };
        });

        // Collect all taxonomy category paths — buildCategoryTree splits on " > " automatically
        const newCats = fetched.map(p => p.category).filter((c): c is string => c.trim().length > 0);
        if (newCats.length > 0) {
          setShopifyCategories(prev => {
            if (fetchId !== shopifyFetchIdRef.current) return prev;
            const merged = new Set(prev);
            newCats.forEach(c => merged.add(c));
            return Array.from(merged).sort((a, b) => a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b));
          });
        }

        const batch = !isBackground ? shuffleArray(fetched) : fetched;
        if (!firstPageDone) {
          setShopifyProducts(batch);
          if (!isBackground) { setIsShopifyLoading(false); setVisibleCount(SHOPIFY_DISPLAY_PAGE_SIZE); }
          firstPageDone = true;
        } else {
          setShopifyProducts(prev => {
            if (fetchId !== shopifyFetchIdRef.current) return prev;
            return [...prev, ...batch];
          });
        }

        hasMore = result.pageInfo?.hasNextPage || false;
        after = result.pageInfo?.endCursor || undefined;
        page++;
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
    } catch (err) { devLog.error("Error fetching listings:", err); }
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

  const filteredProducts = useMemo(() => {
    return currentListings
      .filter(p => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);

        const matchesCategory =
          selectedCategory === "All" ||
          p.category === selectedCategory ||
          p.category.startsWith(selectedCategory + CAT_SEPARATOR);

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "newest") {
          const gidNum = (p: Listing) => { const m = p.id.match(/\/(\d+)$/); return m ? parseInt(m[1], 10) : 0; };
          const av = a.user_id === "shopify" ? gidNum(a) : new Date((a as any).created_at || 0).getTime();
          const bv = b.user_id === "shopify" ? gidNum(b) : new Date((b as any).created_at || 0).getTime();
          return bv - av;
        }
        return 0;
      });
  }, [currentListings, searchQuery, selectedCategory, sortBy]);

  const visibleProducts = activeTab === "shopify" ? filteredProducts.slice(0, visibleCount) : filteredProducts;
  const hasMoreToShow = activeTab === "shopify" && visibleCount < filteredProducts.length;

  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = { All: currentListings.length };
    currentListings.forEach(p => {
      if (!p.category) return;
      // Increment every ancestor path so parent nodes show cumulative counts
      const parts = p.category.split(CAT_SEPARATOR);
      for (let i = 1; i <= parts.length; i++) {
        const path = parts.slice(0, i).join(CAT_SEPARATOR);
        counts[path] = (counts[path] || 0) + 1;
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
      if (!p.category || !p.images[0]) return;
      const parts = p.category.split(CAT_SEPARATOR);
      for (let i = 1; i <= parts.length; i++) {
        const path = parts.slice(0, i).join(CAT_SEPARATOR);
        if (!map[path]) map[path] = p.images[0];
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
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

        {/* Search + Sort + Tabs row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shuffle">Shuffle</SelectItem>
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
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  <Suspense fallback={<ShopSkeleton />}>
                    {visibleProducts.map(product => (
                      <ShopItemCard
                        key={product.id}
                        product={product}
                        onViewDetails={handleViewDetails}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
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
      />
    </div>
  );
}
