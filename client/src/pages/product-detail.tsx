import { useState, useEffect, useRef, useMemo } from "react";
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
  Heart,
  PlayCircle,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { shopifyService } from "@/lib/shopify-service";
import { devLog } from "@/lib/dev-logger";
import { useCart } from "@/hooks/use-shopify-cart";
import { toast } from "sonner";
import { PexlyFooter } from "@/components/pexly-footer";
import { CartSheet } from "@/components/shop/CartSheet";
import { ShippingEstimator } from "@/components/shop/ShippingEstimator";
import type { ShippingInfo } from "@/components/shop/shipping-types";

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type MediaItem =
  | { type: 'image'; url: string; altText?: string }
  | { type: 'video'; sources: { url: string; mimeType: string }[]; previewUrl?: string }
  | { type: 'external'; embedUrl: string; previewUrl?: string };

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  media?: MediaItem[];
  location: string;
  user_id: string;
  status: string;
  variantId?: string;
  availableForSale?: boolean;
  inventoryQuantity?: number;
  shipping?: ShippingInfo;
}

function parseMedia(p: any): MediaItem[] | undefined {
  const edges = p?.media?.edges;
  if (!Array.isArray(edges) || edges.length === 0) return undefined;
  const items: MediaItem[] = [];
  for (const edge of edges) {
    const node = edge?.node;
    if (!node) continue;
    const contentType: string = node.mediaContentType || '';
    if (contentType === 'IMAGE' && node.image?.url) {
      items.push({ type: 'image', url: node.image.url, altText: node.image.altText ?? undefined });
    } else if (contentType === 'VIDEO' && Array.isArray(node.sources) && node.sources.length > 0) {
      items.push({ type: 'video', sources: node.sources, previewUrl: node.previewImage?.url });
    } else if (contentType === 'EXTERNAL_VIDEO' && node.embeddedUrl) {
      items.push({ type: 'external', embedUrl: node.embeddedUrl, previewUrl: node.previewImage?.url });
    }
  }
  return items.length > 0 ? items : undefined;
}

const DEFAULT_SHIPPING_INFO: ShippingInfo = {
  shipTo: "Select at checkout",
  shipsFrom: "Supplier warehouse",
  method: "Available options shown at checkout",
  processingTime: "Calculated at checkout",
  deliveryTime: "Calculated at checkout",
  fee: "Calculated at checkout",
};

function getMetafieldValue(productData: any, keys: string[]) {
  const metafields = Array.isArray(productData?.metafields) ? productData.metafields : [];
  const keySet = new Set(keys);
  const match = metafields.find((field: any) => field && keySet.has(field.key) && typeof field.value === "string" && field.value.trim());
  return match?.value?.trim();
}

function buildShippingInfo(productData: any, fallback?: Partial<ShippingInfo>): ShippingInfo {
  return {
    shipTo: getMetafieldValue(productData, ["ship_to", "ships_to"]) || fallback?.shipTo || DEFAULT_SHIPPING_INFO.shipTo,
    shipsFrom: getMetafieldValue(productData, ["ships_from", "shipping_from", "origin"]) || fallback?.shipsFrom || DEFAULT_SHIPPING_INFO.shipsFrom,
    method: getMetafieldValue(productData, ["shipping_method", "method"]) || fallback?.method || DEFAULT_SHIPPING_INFO.method,
    processingTime: getMetafieldValue(productData, ["processing_time", "estimate_processing_time"]) || fallback?.processingTime || DEFAULT_SHIPPING_INFO.processingTime,
    deliveryTime: getMetafieldValue(productData, ["delivery_time", "estimated_delivery", "estimate_delivery"]) || fallback?.deliveryTime || DEFAULT_SHIPPING_INFO.deliveryTime,
    fee: getMetafieldValue(productData, ["shipping_fee", "fee"]) || fallback?.fee || DEFAULT_SHIPPING_INFO.fee,
  };
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [product, setProduct] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Listing[]>([]);
  
  // Store the raw Shopify product data so we don't re-fetch on add-to-cart
  const shopifyDataRef = useRef<any>(null);
  
  const { addToCart, isLoading: isAddingToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
    // Cleanup: if id changes mid-fetch, the stale flag prevents state updates
    return () => {
      shopifyDataRef.current = null;
    };
  }, [id]);

  // Derive the selected variant from cached Shopify data + selected options
  const selectedVariant = useMemo(() => {
    const shopifyProduct = shopifyDataRef.current;
    if (!shopifyProduct) return null;

    const variants = shopifyProduct.variants?.edges || [];
    
    // If no options to select, return first variant
    if (availableSizes.length === 0 && availableColors.length === 0) {
      return variants[0]?.node || null;
    }

    const match = variants.find((edge: any) => {
      const opts = edge.node.selectedOptions || [];
      const matchesSize = !selectedSize || opts.some((opt: any) =>
        (opt.name.toLowerCase() === 'size' || opt.name.toLowerCase() === 'taille') && opt.value === selectedSize
      );
      const matchesColor = !selectedColor || opts.some((opt: any) =>
        (opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'couleur' || opt.name.toLowerCase() === 'colour') && opt.value === selectedColor
      );
      return matchesSize && matchesColor;
    });

    return match?.node || null;
  }, [selectedSize, selectedColor, availableSizes, availableColors]);

  // Update price and availability when variant changes
  const currentPrice = selectedVariant
    ? parseFloat(selectedVariant.price.amount)
    : product?.price ?? 0;
  const currentCurrency = selectedVariant
    ? selectedVariant.price.currencyCode
    : product?.currency ?? 'USD';
  const isAvailable = selectedVariant
    ? selectedVariant.availableForSale
    : product?.availableForSale ?? true;

  const fetchProduct = async () => {
    setIsLoading(true);
    shopifyDataRef.current = null;
    
    // Stale closure guard
    const fetchId = id;

    try {
      if (fetchId?.includes('Product') || fetchId?.startsWith('gid://shopify/Product/')) {
        const decodedId = decodeURIComponent(fetchId);
        const result = await shopifyService.getProducts(250);

        // Guard against stale fetch
        if (fetchId !== id) return;

        const found = result.products.find((edge: any) => edge.node.id === decodedId);

        if (found) {
          const p = found.node;
          shopifyDataRef.current = p;

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
            category: p.productType || "Shopify",
            images: p.images.edges.map((e: any) => e.node.url),
            media: parseMedia(p),
            location: "Online",
            user_id: "shopify",
            status: "active",
            variantId: p.variants.edges[0]?.node?.id,
            availableForSale: p.variants.edges[0]?.node?.availableForSale,
            shipping: buildShippingInfo(p),
          });

          const related = shuffleArray(result.products.filter((edge: any) => edge.node.id !== decodedId))
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
                variantId: rp.variants.edges[0]?.node?.id,
              };
            });
          setRelatedProducts(related);
          setIsLoading(false);
          return;
        }
      }

      if (fetchId !== id) return;

      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('shop_listings')
        .select('*')
        .eq('id', fetchId)
        .maybeSingle();

      if (fetchId !== id) return;
      if (error) throw error;

      if (data) {
        let imageUrls: string[] = [];
        if (Array.isArray(data.images)) {
          imageUrls = data.images.filter((img: any) => typeof img === 'string' && img.startsWith('http'));
        } else if (typeof data.images === 'string') {
          try {
            const parsed = JSON.parse(data.images);
            imageUrls = Array.isArray(parsed) ? parsed : [data.images];
          } catch {
            imageUrls = [data.images];
          }
        }
        setProduct({ ...data, images: imageUrls, shipping: buildShippingInfo(data, data.shipping) });
      } else {
        toast.error("Product not found");
        navigate("/shop");
      }
    } catch (error) {
      devLog.error('Error fetching product:', error);
      if (fetchId === id) {
        toast.error("Error loading product");
        navigate("/shop");
      }
    } finally {
      if (fetchId === id) {
        setIsLoading(false);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.user_id !== 'shopify') {
      toast.info("Marketplace checkout coming soon.");
      return;
    }

    // Use cached variant data instead of re-fetching
    const targetVariantId = selectedVariant?.id || product.variantId;

    if (!targetVariantId) {
      toast.error("Please select all required options");
      return;
    }

    if (selectedVariant && !selectedVariant.availableForSale) {
      toast.error("This item is currently out of stock");
      return;
    }

    const optionLabel = [selectedSize, selectedColor].filter(Boolean).join(' / ');

    await addToCart(targetVariantId, {
      variantId: targetVariantId,
      title: product.title + (optionLabel ? ` - ${optionLabel}` : ''),
      price: currentPrice,
      currency: currentCurrency,
      image: product.images[0],
    });
  };

  return (
    <div>
      <div className="container mx-auto py-8 max-w-6xl px-4">
        {/* Top bar — always visible */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/shop")}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Shop
          </Button>
          <CartSheet />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && product && <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Media (images + video) */}
          {(() => {
            const mediaItems: MediaItem[] = product.media && product.media.length > 0
              ? product.media
              : product.images.map(url => ({ type: 'image' as const, url }));
            const selected = mediaItems[selectedImage] ?? mediaItems[0];

            return (
              <div className="space-y-4">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  {mediaItems.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                  ) : selected?.type === 'video' ? (
                    <video
                      key={selectedImage}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay={false}
                      playsInline
                      poster={selected.previewUrl}
                    >
                      {selected.sources.map((s, i) => (
                        <source key={i} src={s.url} type={s.mimeType} />
                      ))}
                    </video>
                  ) : selected?.type === 'external' ? (
                    <iframe
                      key={selectedImage}
                      src={selected.embedUrl}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={(selected as any).url ?? product.images[selectedImage]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <Button variant="ghost" size="icon" className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {mediaItems.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {mediaItems.map((item, idx) => {
                      const thumbSrc = item.type === 'image' ? item.url
                        : item.type === 'video' ? item.previewUrl
                        : item.type === 'external' ? item.previewUrl
                        : undefined;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`relative w-20 aspect-square rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                            selectedImage === idx ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          {thumbSrc ? (
                            <img src={thumbSrc} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          {(item.type === 'video' || item.type === 'external') && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <PlayCircle className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}


          {/* Right: Info */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{product.category}</Badge>
                <Button variant="ghost" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold">{product.title}</h1>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">
                  {currentCurrency} {currentPrice.toLocaleString()}
                </span>
                {product.user_id === 'shopify' && (
                  <span className="text-lg text-muted-foreground line-through">
                    {currentCurrency} {(currentPrice * 1.2).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-5">
              {/* Options selection */}
              <div className="space-y-4">
                {availableSizes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Size</p>
                      <span className="text-xs text-muted-foreground cursor-pointer hover:underline">Size Guide</span>
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
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Color</p>
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

              <div className="space-y-3">
                <Button
                  className="w-full h-12 text-base"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !isAvailable}
                >
                  {isAddingToCart ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : !isAvailable ? (
                    "Out of Stock"
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className={isAvailable ? 'text-green-600' : 'text-destructive'}>
                    {isAvailable ? 'In Stock & Ready to Deliver' : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <Separator />

              {product.user_id === 'shopify' ? (
                <ShippingEstimator
                  shipping={product.shipping}
                  productPrice={currentPrice}
                  currency={currentCurrency}
                  variantId={selectedVariant?.id || product.variantId}
                  productTitle={product.title}
                  productImage={product.images[0]}
                />
              ) : (
                <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                    <div className="p-4 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Processing</p>
                      <p className="text-sm font-semibold">{product.shipping?.processingTime || DEFAULT_SHIPPING_INFO.processingTime}</p>
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Delivery</p>
                      <p className="text-sm font-semibold">{product.shipping?.deliveryTime || DEFAULT_SHIPPING_INFO.deliveryTime}</p>
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Shipping fee</p>
                      <p className="text-sm font-semibold">{product.shipping?.fee || DEFAULT_SHIPPING_INFO.fee}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-semibold">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description || "No description provided for this item."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Store</p>
                    <p className="text-muted-foreground">{product.user_id === 'shopify' ? 'Verified Store' : 'Marketplace'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Shipping</p>
                    <p className="text-muted-foreground">Fast Delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-xl font-bold">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((related) => (
                <div
                  key={related.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/shop/product/${encodeURIComponent(related.id)}`)}
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                    <img
                      src={related.images[0]}
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {related.status === 'sold_out' && (
                      <Badge variant="destructive" className="absolute top-2 left-2">
                        Sold out
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{related.title}</p>
                  <p className="text-sm font-bold">
                    {related.currency} {related.price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <PexlyFooter />
    </div>
  );
}
