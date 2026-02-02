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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ShoppingCart, Star, Filter, Package, Plus, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { ShopSkeleton } from "@/components/shop/ShopSkeleton";

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
}

const categories = ["All", "Services", "Digital", "Goods", "Domains", "Jobs", "Software", "Electronics", "Clothing", "Home & Garden", "Sports", "Other"];

export function Shop() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<Listing | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shop_listings')
        .select('*');

      if (error) throw error;
      
      // Transform data to handle different image formats (array vs string)
      const transformedData = (data || []).map(item => {
        let imageUrls: string[] = [];
        
        // Handle images field
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
        
        // Handle metadata fallback if images are empty
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

      console.log('Final Transformed Shop Listings:', transformedData);
      setListings(transformedData);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = listings
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

  const handleAddToCart = (product: Listing) => {
    setCartCount(cartCount + 1);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
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
              <Button variant="outline" className="relative">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
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
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
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

        {/* Products Grid */}
        <div className="min-h-[600px]">
          {isLoading ? (
            <ShopSkeleton />
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-card/30 rounded-3xl border border-dashed border-border/60">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              <Suspense fallback={<ShopSkeleton />}>
                {filteredProducts.map((product) => (
                  <ShopItemCard 
                    key={product.id} 
                    product={product} 
                    onViewDetails={setSelectedProduct} 
                  />
                ))}
              </Suspense>
            </div>
          )}
        </div>
      </main>

      {/* Product Details Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.title}</DialogTitle>
                <DialogDescription>
                  <Badge variant="outline" className="mt-2">{selectedProduct.category}</Badge>
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-20 w-20 text-muted-foreground/20" />
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold mb-2">{selectedProduct.price} {selectedProduct.currency}</p>
                    <p className="text-sm text-muted-foreground">Status: {selectedProduct.status}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{selectedProduct.location}</span>
                    </div>
                    {selectedProduct.metadata && selectedProduct.metadata.length > 0 && (
                      <div className="py-2 border-t">
                        <span className="text-muted-foreground block mb-2">Attachments</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.metadata.map((file, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px]">
                              {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                  Close
                </Button>
                <Button onClick={() => handleAddToCart(selectedProduct)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PexlyFooter />
    </div>
  );
}
