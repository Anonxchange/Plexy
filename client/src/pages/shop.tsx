import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ShoppingCart, Star, Filter, Package, Plus, Loader2, Store } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { shopifyService, type ShopifyProduct } from "@/lib/shopify-service";
import { ShopSkeleton } from "@/components/shop/ShopSkeleton";
import { CartSheet } from "@/components/shop/CartSheet";
import { toast } from "sonner";

const ShopItemCard = lazy(() => import("@/components/shop/ShopItemCard").then(m => ({ default: m.ShopItemCard })));

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  location: string;
  user_id: string;
  status: string;
  metadata: any[];
  variantId?: string;
}


export function Shop() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<Listing | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [shopifyProducts, setShopifyProducts] = useState<Listing[]>([]);
  const [marketplaceCategories, setMarketplaceCategories] = useState<string[]>(["All"]);
  const [shopifyCategories, setShopifyCategories] = useState<string[]>(["All"]);
  const [activeTab, setActiveTab] = useState("shopify");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchListings();
    fetchShopifyProducts();
    fetchShopifyCategories();
    
    // Set up an interval to refresh products every 2 minutes
    const interval = setInterval(() => {
      fetchShopifyProducts();
      fetchShopifyCategories();
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch Shopify products when category changes
  useEffect(() => {
    if (activeTab === "shopify") {
      fetchShopifyProducts();
    }
  }, [selectedCategory, activeTab]);

  // Update Marketplace categories
  useEffect(() => {
    const cats = new Set<string>(["All"]);
    listings.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    setMarketplaceCategories(Array.from(cats).sort());
  }, [listings]);

  // Fetch all Shopify categories (Product Types)
  const fetchShopifyCategories = async () => {
    try {
      const types = await shopifyService.getProductTypes();
      console.log('Fetched Shopify product types:', types);
      const cats = new Set<string>(["All"]);
      types.forEach((type: string) => {
        if (type) cats.add(type);
      });
      const sortedCats = Array.from(cats).sort();
      console.log('Unique categories:', sortedCats);
      setShopifyCategories(sortedCats);
      
      // If we are on shopify tab and current category is not in the new list, reset to All
      if (activeTab === "shopify" && selectedCategory !== "All" && !sortedCats.includes(selectedCategory)) {
        setSelectedCategory("All");
      }
    } catch (error) {
      console.error('Error fetching Shopify categories:', error);
    }
  };

  // Reset category filter when switching tabs
  useEffect(() => {
    setSelectedCategory("All");
    if (activeTab === "shopify") {
      fetchShopifyCategories();
    }
  }, [activeTab]);

  const fetchShopifyProducts = async (after?: string) => {
    if (after) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    try {
      // Build query string for Shopify
      // product_type:CategoryName
      const shopifyQuery = selectedCategory !== "All" ? `product_type:${selectedCategory}` : undefined;
      
      const result = await shopifyService.getProducts(35, after, shopifyQuery);
      const transformed: Listing[] = result.products.map((edge: any) => {
        const p = edge.node;
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          price: parseFloat(p.priceRange.minVariantPrice.amount),
          currency: p.priceRange.minVariantPrice.currencyCode,
          category: p.productType || "Shopify",
          images: p.images.edges.map((e: any) => e.node.url),
          location: "Online",
          user_id: "shopify",
          status: "active",
          metadata: [],
          variantId: p.variants.edges[0]?.node?.id
        };
      });
      
      if (after) {
        setShopifyProducts(prev => [...prev, ...transformed]);
      } else {
        setShopifyProducts(transformed);
      }
      
      setCursor(result.pageInfo?.endCursor || null);
      setHasNextPage(result.pageInfo?.hasNextPage || false);
    } catch (error) {
      console.error('Error fetching Shopify products:', error);
    } finally {
      // Simulate a small delay to make skeleton visible as requested
      setTimeout(() => {
        setIsLoading(false);
        setIsLoadingMore(false);
      }, 800);
    }
  };

  const handleLoadMore = () => {
    if (cursor && hasNextPage) {
      fetchShopifyProducts(cursor);
    }
  };

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shop_listings')
        .select('*');

      if (error) throw error;
      
      const transformedData = (data || []).map(item => {
        let imageUrls: string[] = [];
        
        if (Array.isArray(item.images)) {
          imageUrls = item.images.filter(img => typeof img === 'string' && img.startsWith('http'));
        } else if (typeof item.images === 'string' && item.images.trim() !== '') {
          try {
            const parsed = JSON.parse(item.images);
            imageUrls = Array.isArray(parsed) ? parsed.filter(img => typeof img === 'string' && img.startsWith('http')) : [item.images];
          } catch (e) {
            if (item.images.startsWith('http')) {
              imageUrls = [item.images];
            }
          }
        }
        
        if (imageUrls.length === 0 && item.metadata) {
          try {
            const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
            if (Array.isArray(metadata)) {
              const firstWithUrl = metadata.find(m => m && m.url && typeof m.url === 'string' && m.url.startsWith('http'));
              if (firstWithUrl) {
                imageUrls = [firstWithUrl.url];
              }
            }
          } catch (e) {
            console.error('Error parsing metadata for image fallback:', e);
          }
        }
        
        return {
          ...item,
          images: imageUrls
        };
      });

      setListings(transformedData);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (product: Listing) => {
    navigate(`/shop/product/${encodeURIComponent(product.id)}`);
  };

  const currentListings = activeTab === "marketplace" ? listings : shopifyProducts;

  const filteredProducts = currentListings
    .filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "newest":
          // @ts-ignore
          return new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

  const handleAddToCart = async (product: Listing) => {
    if (product.user_id !== 'shopify' || !product.variantId) {
      toast.info("Marketplace checkout coming soon. Only Shopify items can be added to cart currently.");
      return;
    }

    setIsAddingToCart(true);
    try {
      let cartId = localStorage.getItem('shopify_cart_id');
      console.log("Adding to cart. Current cartId:", cartId);
      let result;

      const cartItem = {
        id: product.variantId,
        variantId: product.variantId,
        title: product.title,
        price: product.price,
        currency: product.currency,
        quantity: 1,
        image: product.images[0]
      };

      if (!cartId) {
        console.log("No cartId found, creating new cart...");
        result = await shopifyService.createCart({ variantId: product.variantId, quantity: 1 });
        if (result) {
          console.log("Cart created:", result.cartId);
          localStorage.setItem('shopify_cart_id', result.cartId);
          localStorage.setItem('shopify_checkout_url', result.checkoutUrl);
          
          const items = [{ ...cartItem, id: result.lineId }];
          localStorage.setItem(`cart_items_${result.cartId}`, JSON.stringify(items));
          
          // Force fetch to sync with Shopify
          await shopifyService.getCart(result.cartId);

          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('cart-updated'));
          window.dispatchEvent(new CustomEvent('shopify-cart-updated', { detail: { cartId: result.cartId } }));
          toast.success("Added to cart!");
        }
      } else {
        // Check for mismatched store domain
        const currentCheckoutUrl = localStorage.getItem('shopify_checkout_url');
        if (currentCheckoutUrl && !currentCheckoutUrl.includes('qm0yih-vd.myshopify.com')) {
           console.log("Store domain mismatch, clearing cart...");
           localStorage.removeItem('shopify_cart_id');
           localStorage.removeItem('shopify_checkout_url');
           localStorage.removeItem(`cart_items_${cartId}`);
           // Re-create cart
           const newResult = await shopifyService.createCart({ variantId: product.variantId, quantity: 1 });
           if (newResult) {
             localStorage.setItem('shopify_cart_id', newResult.cartId);
             localStorage.setItem('shopify_checkout_url', newResult.checkoutUrl);
             const items = [{ ...cartItem, id: newResult.lineId }];
             localStorage.setItem(`cart_items_${newResult.cartId}`, JSON.stringify(items));

             window.dispatchEvent(new Event('storage'));
             window.dispatchEvent(new Event('cart-updated'));
             window.dispatchEvent(new CustomEvent('shopify-cart-updated', { detail: { cartId: newResult.cartId } }));
             toast.success("Added to cart!");
           }
           return;
        }

        console.log("Adding line to existing cart...");
        result = await shopifyService.addLineToCart(cartId, { variantId: product.variantId, quantity: 1 });
        if (result.success) {
          console.log("Line added successfully:", result.lineId);
          const storedItems = JSON.parse(localStorage.getItem(`cart_items_${cartId}`) || '[]');
          const existing = storedItems.find((item: any) => item.variantId === product.variantId);
          if (existing) {
            existing.quantity += 1;
          } else {
            storedItems.push({ ...cartItem, id: result.lineId || product.variantId });
          }
          localStorage.setItem(`cart_items_${cartId}`, JSON.stringify(storedItems));
          
          // Force fetch to sync with Shopify
          await shopifyService.getCart(cartId);

          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('cart-updated'));
          window.dispatchEvent(new CustomEvent('shopify-cart-updated', { detail: { cartId: cartId } }));
          toast.success("Added to cart!");
        } else if (result.cartNotFound) {
          console.warn("Cart not found on Shopify, creating new one...");
          // Retry once by creating new cart
          localStorage.removeItem('shopify_cart_id');
          localStorage.removeItem('shopify_checkout_url');
          localStorage.removeItem(`cart_items_${cartId}`);
          const newResult = await shopifyService.createCart({ variantId: product.variantId, quantity: 1 });
          if (newResult) {
            localStorage.setItem('shopify_cart_id', newResult.cartId);
            localStorage.setItem('shopify_checkout_url', newResult.checkoutUrl);
            
            const items = [{ ...cartItem, id: newResult.lineId }];
            localStorage.setItem(`cart_items_${newResult.cartId}`, JSON.stringify(items));
            
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('cart-updated'));
            window.dispatchEvent(new CustomEvent('shopify-cart-updated', { detail: { cartId: newResult.cartId } }));
            toast.success("Added to cart!");
          }
        } else {
          console.error("Failed to add line to cart:", result);
        }
      }
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error in handleAddToCart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Shop</h1>
              <p className="text-muted-foreground">Discover amazing products for every need</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => navigate("/shop/post")}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                Post an Ad
              </Button>
              <CartSheet />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {activeTab === "marketplace" 
                  ? marketplaceCategories.map((category) => (
                      <SelectItem key={`market-${category}`} value={category}>
                        {category}
                      </SelectItem>
                    ))
                  : shopifyCategories.map((category) => (
                      <SelectItem key={`shop-${category}`} value={category}>
                        {category}
                      </SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-h-[600px]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="shopify" className="gap-2">
                <Store className="h-4 w-4" />
                Shopify Store
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="gap-2">
                <Package className="h-4 w-4" />
                Marketplace
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <ShopSkeleton />
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-card/30 rounded-3xl border border-dashed border-border/60">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                <Suspense fallback={<ShopSkeleton />}>
                  {filteredProducts.map((product) => (
                    <ShopItemCard 
                      key={product.id} 
                      product={product} 
                      onViewDetails={handleViewDetails}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </Suspense>
              </div>

              {activeTab === "shopify" && hasNextPage && (
                <div className="mt-12 flex justify-center pb-12">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="min-w-[200px]"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      "Load More Products"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}
