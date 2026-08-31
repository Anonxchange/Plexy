import { CartLoadingAnimation } from "@/components/shop/CartLoadingAnimation";

/**
 * Shown in place of the product grid while products (or their images)
 * haven't loaded yet. Plays a small looping cart animation instead of
 * static gray placeholder boxes. No animation library required.
 */
export function ShopSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading products"
      className="w-full flex flex-col items-center justify-center py-24 gap-3"
    >
      <CartLoadingAnimation size={120} />
      <p className="text-sm text-muted-foreground">Loading products…</p>
    </div>
  );
}
