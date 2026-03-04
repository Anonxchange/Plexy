import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ShoppingCart, 
  Star, 
  Package, 
  Store, 
  Loader2,
  Share2,
  Heart
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { shopifyService } from "@/lib/shopify-service";
import { toast } from "sonner";
import { PexlyFooter } from "@/components/pexly-footer";

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
  variantId?: string;
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [product, setProduct] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Listing[]>([]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      // First try Shopify if the ID looks like a Shopify ID (contains 'Product')
      if (id?.includes('Product')) {
        const result = await shopifyService.getProducts(250); // Get all to find the one
        const decodedId = decodeURIComponent(id);
        const found = result.products.find((edge: any) => edge.node.id === decodedId);
        
        if (found) {
          const p = found.node;
          
          // Extract options from product
          const options = p.options || [];
          const sizeOption = options.find((opt: any) => 
            opt.name.toLowerCase() === 'size' || opt.name.toLowerCase() === 'taille'
          );
          
          const colorOption = options.find((opt: any) => 
            opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'couleur' || opt.name.toLowerCase() === 'colour'
          );

          const sizes = sizeOption?.values || [];
          const colors = colorOption?.values || [];
          
          setAvailableSizes(sizes);
          setAvailableColors(colors);
          
          if (sizes.length > 0) setSelectedSize(sizes[0]);
          if (colors.length > 0) setSelectedColor(colors[0]);

          setProduct({
            id: p.id,
            title: p.title,
            description: p.description,
            price: parseFloat(p.priceRange.minVariantPrice.amount),
            currency: p.priceRange.minVariantPrice.currencyCode,
            category: "Shopify",
            images: p.images.edges.map((e: any) => e.node.url),
            location: "Online",
            user_id: "shopify",
            status: "active",
            variantId: p.variants.edges[0]?.node?.id
          });

          // Fetch related products (same category or just others from Shopify)
          const related = result.products
            .filter((edge: any) => edge.node.id !== decodedId)
            .slice(0, 4)
            .map((edge: any) => {
              const rp = edge.node;
              return {
                id: rp.id,
                title: rp.title,
                description: rp.description,
                price: parseFloat(rp.priceRange.minVariantPrice.amount),
                currency: rp.priceRange.minVariantPrice.currencyCode,
                category: "Shopify",
                images: rp.images.edges.map((e: any) => e.node.url),
                location: "Online",
                user_id: "shopify",
                status: "active",
                variantId: rp.variants.edges[0]?.node?.id
              };
            });
          setRelatedProducts(related);
          setIsLoading(false);
          return;
        }
      }

      // Then try Marketplace
      const { data, error } = await supabase
        .from('shop_listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        let imageUrls: string[] = [];
        if (Array.isArray(data.images)) {
          imageUrls = data.images.filter(img => typeof img === 'string' && img.startsWith('http'));
        } else if (typeof data.images === 'string') {
           try {
             const parsed = JSON.parse(data.images);
             imageUrls = Array.isArray(parsed) ? parsed : [data.images];
           } catch(e) {
             imageUrls = [data.images];
           }
        }

        setProduct({
          ...data,
          images: imageUrls
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error("Product not found");
      navigate("/shop");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.user_id !== 'shopify') {
      toast.info("Marketplace checkout coming soon.");
      return;
    }

    // Find the correct variant based on selected options
    let targetVariantId = product.variantId;
    
    if (id?.includes('Product')) {
      try {
        const result = await shopifyService.getProducts(250);
        const decodedId = decodeURIComponent(id);
        const found = result.products.find((edge: any) => edge.node.id === decodedId);
        if (found) {
          const variant = found.node.variants.edges.find((edge: any) => {
            const matchesSize = !selectedSize || edge.node.selectedOptions.some((opt: any) => 
              (opt.name.toLowerCase() === 'size' || opt.name.toLowerCase() === 'taille') && opt.value === selectedSize
            );
            const matchesColor = !selectedColor || edge.node.selectedOptions.some((opt: any) => 
              (opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'couleur' || opt.name.toLowerCase() === 'colour') && opt.value === selectedColor
            );
            return matchesSize && matchesColor;
          });
          if (variant) {
            targetVariantId = variant.node.id;
          }
        }
      } catch (e) {
        console.error("Error finding variant for options:", e);
      }
    }

    if (!targetVariantId) {
      toast.error("Please select all required options");
      return;
    }

    setIsAddingToCart(true);
    try {
      const cartId = localStorage.getItem('shopify_cart_id');
      const optionLabel = [selectedSize, selectedColor].filter(Boolean).join(' / ');
      const cartItem = {
        id: targetVariantId, 
        variantId: targetVariantId,
        title: product.title + (optionLabel ? ` - ${optionLabel}` : ''),
        price: product.price,
        currency: product.currency,
        quantity: 1,
        image: product.images[0]
      };

      if (!cartId) {
        const result = await shopifyService.createCart({ variantId: targetVariantId, quantity: 1 });
        if (result) {
          localStorage.setItem('shopify_cart_id', result.cartId);
          localStorage.setItem('shopify_checkout_url', result.checkoutUrl);
          
          const items = [{ ...cartItem, id: result.lineId }];
          localStorage.setItem(`cart_items_${result.cartId}`, JSON.stringify(items));
          
          window.dispatchEvent(new Event('shopify-cart-updated'));
          toast.success("Added to cart!");
        }
      } else {
        const result = await shopifyService.addLineToCart(cartId, { variantId: targetVariantId, quantity: 1 });
        if (result.success) {
          const storedItems = JSON.parse(localStorage.getItem(`cart_items_${cartId}`) || '[]');
          const existing = storedItems.find((item: any) => item.variantId === targetVariantId);
          if (existing) {
            existing.quantity += 1;
          } else {
            storedItems.push({ ...cartItem, id: result.lineId || targetVariantId });
          }
          localStorage.setItem(`cart_items_${cartId}`, JSON.stringify(storedItems));
          
          window.dispatchEvent(new Event('shopify-cart-updated'));
          toast.success("Added to cart!");
        } else if (result.cartNotFound) {
          // If cart not found, clear and retry once
          localStorage.removeItem('shopify_cart_id');
          localStorage.removeItem('shopify_checkout_url');
          localStorage.removeItem(`cart_items_${cartId}`);
          const retryResult = await shopifyService.createCart({ variantId: targetVariantId, quantity: 1 });
          if (retryResult) {
            localStorage.setItem('shopify_cart_id', retryResult.cartId);
            localStorage.setItem('shopify_checkout_url', retryResult.checkoutUrl);
            
            const items = [{ ...cartItem, id: retryResult.lineId }];
            localStorage.setItem(`cart_items_${retryResult.cartId}`, JSON.stringify(items));

            window.dispatchEvent(new Event('shopify-cart-updated'));
            toast.success("Added to cart!");
          }
        }
      }
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <Button 
          variant="ghost" 
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/shop")}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Shop
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-muted rounded-2xl overflow-hidden border border-border/40 relative">
              {product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <Package className="h-20 w-20" />
                </div>
              )}
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-4 right-4 bg-background/50 backdrop-blur-md rounded-full hover:bg-background/80"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
            
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 aspect-square rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex flex-col">
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-primary/30 text-primary">
                  {product.category}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-4">
                <div className="flex text-yellow-500">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-serif font-bold text-[#C58E58]">
                  {product.currency} {product.price.toLocaleString()}
                </span>
                {product.user_id === 'shopify' && (
                  <span className="text-xs text-muted-foreground line-through opacity-50">
                    {product.currency} {(product.price * 1.2).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Options selection */}
              <div className="space-y-6">
                {availableSizes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Size</h3>
                      <button className="text-[10px] font-bold text-primary hover:underline">Size Guide</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`h-10 min-w-[3rem] px-3 rounded-lg text-sm font-bold border-2 transition-all ${
                            selectedSize === size 
                              ? 'bg-foreground text-background border-foreground shadow-md' 
                              : 'bg-background text-foreground border-border/40 hover:border-primary/50'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableColors.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Color</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`h-10 min-w-[3rem] px-3 rounded-lg text-sm font-bold border-2 transition-all ${
                            selectedColor === color 
                              ? 'bg-foreground text-background border-foreground shadow-md' 
                              : 'bg-background text-foreground border-border/40 hover:border-primary/50'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button 
                  size="default"
                  className="w-full h-12 rounded-xl text-base font-bold bg-[#D3884D] hover:bg-[#C0783D] text-white transition-all active:scale-[0.98] gap-2 shadow-md shadow-[#D3884D]/20"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </Button>
                
                <div className="flex items-center gap-2 justify-center py-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-500 font-bold">In Stock & Ready to Deliver</span>
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Description</h3>
                <p className="text-sm leading-relaxed text-muted-foreground/80 font-medium whitespace-pre-line">
                  {product.description || "No description provided for this item."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                  <Store className="h-4 w-4 mb-2 text-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Store</p>
                  <p className="text-sm font-bold">{product.user_id === 'shopify' ? 'Verified Store' : 'Marketplace'}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                  <Package className="h-4 w-4 mb-2 text-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Shipping</p>
                  <p className="text-sm font-bold">Fast Delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 mb-12">
            <h2 className="text-2xl font-serif font-bold mb-8">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((related) => (
                <div 
                  key={related.id} 
                  className="group cursor-pointer"
                  onClick={() => navigate(`/shop/product/${encodeURIComponent(related.id)}`)}
                >
                  <div className="aspect-[4/5] bg-muted rounded-xl overflow-hidden mb-3 relative border border-border/40">
                    <img 
                      src={related.images[0]} 
                      alt={related.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {related.status === 'sold_out' && (
                      <Badge className="absolute top-2 right-2 bg-background/80 text-foreground backdrop-blur-sm border-none">
                        Sold out
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-sm font-bold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {related.title}
                  </h3>
                  <p className="text-[#C58E58] font-bold text-sm">
                    {related.currency} {related.price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <PexlyFooter />
    </div>
  );
}
