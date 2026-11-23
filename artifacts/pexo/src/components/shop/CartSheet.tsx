import { ShoppingCart, Minus, Plus, Trash2, Loader2, ExternalLink } from "@/lib/icons";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-shopify-cart";
import { useGiftCardCart } from "@/hooks/use-gift-card-cart";
import { useTopupCart } from "@/hooks/use-topup-cart";
import { useState, useEffect, type ReactElement } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";
import { shopifyService, formatPrice } from "@/lib/shopify-service";
import { useCountryPreferences } from "@/lib/country-preferences";
import { DigitalCartSections } from "./DigitalCartSections";

interface CartRecommendedProduct {
  id: string;
  handle: string;
  title: string;
  image: string;
  price: string;
  currency: string;
}

export function CartSheet({
  renderTrigger,
  initiallyOpen = false,
  open,
  onOpenChange,
}: {
  renderTrigger?: (itemCount: number) => ReactElement;
  initiallyOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(initiallyOpen);
  const isOpen = open ?? internalOpen;
  const setIsOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };
  const { user } = useAuth();
  const { items, cartId, checkoutUrl, isLoading, marketError, updateQuantity, removeItem, refreshCart } = useCart();
  const gifts = useGiftCardCart();
  const topups = useTopupCart();
  const preferences = useCountryPreferences();
  const deliveryCountry = preferences.delivery?.country;
  const supabaseConfigured = isSupabaseConfigured();
  const itemCount = items.reduce((n, item) => n + item.quantity, 0)
    + gifts.items.reduce((n, item) => n + item.quantity, 0) + topups.items.length;
  const shopSubtotal = items.reduce((n, item) => n + Number(item.price) * item.quantity, 0);
  const shopCurrency = items[0]?.currency || "USD";
  const shopUnavailable = items.some(item => item.availableForSale === false);

  const recommendedQuery = useQuery<CartRecommendedProduct[]>({
    queryKey: ["cart-recommended-shop-products", deliveryCountry ?? "auto"],
    enabled: isOpen && supabaseConfigured,
    staleTime: 300_000,
    retry: false,
    queryFn: async () => {
      const result = await shopifyService.getProducts(12);
      const list: CartRecommendedProduct[] = [];
      for (const edge of result.products || []) {
        const node = edge?.node;
        const variant = node?.variants?.edges?.find((entry: any) =>
          entry?.node?.availableForSale && typeof entry.node.id === "string",
        )?.node;
        const amount = variant?.price?.amount ?? node?.priceRange?.minVariantPrice?.amount;
        const currency = variant?.price?.currencyCode ?? node?.priceRange?.minVariantPrice?.currencyCode;
        const image = node?.images?.edges?.[0]?.node?.url;
        if (!node?.id || !node?.handle || !node?.title || !amount || !currency || !image) continue;
        list.push({
          id: node.id,
          handle: node.handle,
          title: node.title,
          image,
          price: String(amount),
          currency: String(currency),
        });
      }
      return list.slice(0, 8);
    },
  });
  const recommendedProducts = recommendedQuery.data ?? [];

  // Refresh once on opening, not on every loading transition.
  useEffect(() => {
    if (isOpen && cartId) void refreshCart();
  }, [isOpen, cartId, refreshCart]);

  useEffect(() => {
    if (initiallyOpen) setInternalOpen(true);
  }, [initiallyOpen]);

  return <Sheet open={isOpen} onOpenChange={setIsOpen}>
    {open === undefined && <SheetTrigger asChild>
      {renderTrigger ? renderTrigger(itemCount) : <Button variant="ghost" size="icon" className="relative" aria-label={`Open cart, ${itemCount} items`}>
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && <Badge className="absolute -top-2 -right-2 rounded-full px-1.5">{itemCount}</Badge>}
      </Button>}
    </SheetTrigger>}
    <SheetContent className="w-full sm:max-w-lg flex flex-col h-[100dvh] p-0 gap-0">
      <SheetHeader className="p-6 pr-12 border-b text-left">
        <SheetTitle>Your cart ({itemCount})</SheetTitle>
        <SheetDescription className="sr-only">
          All your items in one place. Shop, gift cards, and top-ups check out separately.
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-8">
        {itemCount === 0 && !isLoading && !marketError && (
          <div className="flex flex-col items-center px-2 pt-6 pb-2 text-center space-y-4">
            <h3 className="text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
              Your cart is empty.
            </h3>
            {!user && (
              <p className="text-sm text-muted-foreground">
                <Link
                  href="/signin"
                  onClick={() => setIsOpen(false)}
                  className="text-[#5d7932] dark:text-primary font-medium hover:underline underline-offset-4"
                >
                  Sign in
                </Link>
                {" or "}
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="text-[#5d7932] dark:text-primary font-medium hover:underline underline-offset-4"
                >
                  register
                </Link>
                {" to see your saved items."}
              </p>
            )}
            <Button asChild className="mt-2 h-11 rounded-full px-8 font-bold uppercase tracking-wide">
              <Link href="/shop" onClick={() => setIsOpen(false)}>
                Shop now
              </Link>
            </Button>
          </div>
        )}

        {(items.length > 0 || isLoading || !!marketError) && (
          <section aria-labelledby="shop-cart-title" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 id="shop-cart-title" className="text-base font-medium text-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" /> Shop items
              </h3>
              {items.length > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {items.reduce((n, item) => n + item.quantity, 0)} {items.reduce((n, item) => n + item.quantity, 0) === 1 ? "item" : "items"}
                </span>
              )}
            </div>
            {marketError && <p className="text-sm text-destructive" role="alert">{marketError}</p>}
            {isLoading && items.length > 0 && <p className="text-sm text-muted-foreground" role="status">Updating shop cart…</p>}
            {isLoading && !items.length ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading shop cart" />
              </div>
            ) : items.length > 0 && (
              <>
                <div className="divide-y divide-border/60">
                  {items.map(item => (
                    <div key={item.id} className="py-4 first:pt-1 flex gap-3.5 items-start">
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="w-20 h-20 rounded-xl object-cover bg-muted shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground leading-snug line-clamp-2">{item.title}</p>
                            {item.availableForSale === false && (
                              <p className="text-xs text-destructive mt-0.5">Currently unavailable</p>
                            )}
                          </div>
                          <button
                            type="button"
                            className="p-1 -mr-1 text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors shrink-0"
                            disabled={isLoading}
                            onClick={() => void removeItem(item.id)}
                            aria-label={`Remove ${item.title} shop item`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between pt-0.5">
                          <p className="text-sm font-bold text-foreground tabular-nums">
                            {formatPrice(Number(item.price) * item.quantity, item.currency)}
                          </p>
                          <div className="inline-flex items-center rounded-full border border-border bg-background h-8">
                            <button
                              type="button"
                              disabled={isLoading}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-l-full text-foreground hover:bg-muted/60 disabled:opacity-40 transition-colors"
                              aria-label={`Decrease ${item.title} shop quantity`}
                              onClick={() => void (item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1))}
                            >
                              {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                            </button>
                            <span className="px-2.5 text-sm font-medium tabular-nums select-none">{item.quantity}</span>
                            <button
                              type="button"
                              disabled={isLoading}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-r-full text-foreground hover:bg-muted/60 disabled:opacity-40 transition-colors"
                              aria-label={`Increase ${item.title} shop quantity`}
                              onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between text-base font-semibold text-foreground">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatPrice(shopSubtotal, shopCurrency)}</span>
                  </div>
                  <Button
                    className="w-full h-11 rounded-full font-bold uppercase tracking-wide"
                    disabled={isLoading || !!marketError || !checkoutUrl || shopUnavailable}
                    onClick={() => {
                      if (checkoutUrl && !isLoading && !marketError && !shopUnavailable) window.location.assign(checkoutUrl);
                    }}
                  >
                    Checkout shop items <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Shipping and applicable taxes are calculated at Shopify checkout.
                  </p>
                </div>
              </>
            )}
          </section>
        )}

        <DigitalCartSections />

        <div className="w-full pt-2 text-left space-y-4">
          <h4 className="text-xl sm:text-2xl font-normal tracking-tight text-foreground leading-snug">
            See what others are buying on Pexly
          </h4>
          {!supabaseConfigured ? (
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground flex items-center justify-between gap-3">
              <span>Live shop products appear here once the store catalog is connected.</span>
              <Link
                href="/shop"
                onClick={() => setIsOpen(false)}
                className="shrink-0 text-[#5d7932] dark:text-primary font-medium hover:underline underline-offset-4"
              >
                Browse shop
              </Link>
            </div>
          ) : recommendedQuery.isLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[0, 1, 2].map((slot) => (
                <div key={slot} className="w-[138px] shrink-0 space-y-2">
                  <div className="aspect-square w-full rounded-xl bg-muted animate-pulse" />
                  <div className="h-3.5 w-4/5 rounded bg-muted animate-pulse" />
                  <div className="h-3.5 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : recommendedQuery.isError ? (
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground flex items-center justify-between gap-3">
              <span>Could not load shop recommendations for your market.</span>
              <button
                type="button"
                onClick={() => void recommendedQuery.refetch()}
                className="shrink-0 text-[#5d7932] dark:text-primary font-medium hover:underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          ) : recommendedProducts.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x" role="list" aria-label="Popular shop products">
              {recommendedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/product/${encodeURIComponent(product.handle)}`}
                  onClick={() => setIsOpen(false)}
                  role="listitem"
                  className="group w-[138px] shrink-0 snap-start block text-left"
                >
                  <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted mb-2">
                    <img
                      src={product.image}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-sm font-normal text-foreground truncate">{product.title}</p>
                  <p className="text-sm font-bold text-foreground mt-0.5 tabular-nums">
                    {formatPrice(product.price, product.currency)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground flex items-center justify-between gap-3">
              <span>Explore physical products in the store.</span>
              <Link
                href="/shop"
                onClick={() => setIsOpen(false)}
                className="shrink-0 text-[#5d7932] dark:text-primary font-medium hover:underline underline-offset-4"
              >
                Browse shop
              </Link>
            </div>
          )}
        </div>

        <div className="w-full pt-2 space-y-8 text-center">
          <div className="flex items-center gap-3 w-full">
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
            <h4 className="text-xl sm:text-2xl font-normal tracking-tight text-foreground whitespace-nowrap">
              The Pexly Promise
            </h4>
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>

          <div className="space-y-8 pb-6">
            <div className="flex flex-col items-center space-y-2 max-w-xs mx-auto">
              <img
                src="/assets/aistudio/getimage_2dfcc1ce.webp"
                alt=""
                aria-hidden="true"
                className="h-16 w-auto object-contain mb-1 mix-blend-multiply dark:grayscale dark:invert dark:mix-blend-screen"
              />
              <h5 className="text-base font-bold text-foreground">Order with Confidence</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If something goes wrong on our end, we&apos;ll make it right, on every order.{" "}
                <Link
                  href="/refund-policy"
                  onClick={() => setIsOpen(false)}
                  className="text-[#5d7932] dark:text-primary font-medium hover:underline underline-offset-4"
                >
                  Learn more!
                </Link>
              </p>
            </div>

            <div className="flex flex-col items-center space-y-2 max-w-xs mx-auto">
              <img
                src="/assets/aistudio/getimage__1__eabb04e3.webp"
                alt=""
                aria-hidden="true"
                className="h-16 w-auto object-contain mb-1 mix-blend-multiply dark:grayscale dark:invert dark:mix-blend-screen"
              />
              <h5 className="text-base font-bold text-foreground">Fast Global Delivery</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Instant digital delivery for gift cards &amp; top-ups, plus tracked worldwide shipping on shop orders.{" "}
                <Link
                  href="/shop"
                  onClick={() => setIsOpen(false)}
                  className="text-[#5d7932] dark:text-primary font-medium hover:underline underline-offset-4"
                >
                  Learn More!
                </Link>
              </p>
            </div>

            <div className="flex flex-col items-center space-y-2 max-w-xs mx-auto">
              <img
                src="/assets/aistudio/getimage__2__73b6199a.webp"
                alt=""
                aria-hidden="true"
                className="h-16 w-auto object-contain mb-1 mix-blend-multiply dark:grayscale dark:invert dark:mix-blend-screen"
              />
              <h5 className="text-base font-bold text-foreground">Secure Shopping Guaranteed</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                100% Secure payment with SSL Encryption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>;
}
