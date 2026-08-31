import Lottie from "lottie-react";
import cartLoadingAnimation from "@/assets/animations/cart-loading-small.json";

/**
 * Shown in place of the product grid while products (or their images)
 * haven't loaded yet. Plays a small looping cart animation instead of
 * static gray placeholder boxes.
 */
export function ShopSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading products"
      className="w-full flex flex-col items-center justify-center py-24 gap-3"
    >
      <Lottie
        animationData={cartLoadingAnimation}
        loop
        autoplay
        style={{ width: 120, height: 120 }}
      />
      <p className="text-sm text-muted-foreground">Loading products…</p>
    </div>
  );
}
