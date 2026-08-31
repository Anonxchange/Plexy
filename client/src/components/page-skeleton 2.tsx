import { Skeleton } from "@/components/ui/skeleton";
import { CartLoadingAnimation } from "@/components/shop/CartLoadingAnimation";

/**
 * Full shop page loading state (initial fetch, before categories/tabs/
 * products are available). Keeps lightweight gray bars for the page
 * chrome (header/filters) so layout doesn't jump, and uses the cart
 * animation for the product area itself. No animation library required.
 */
export function ShopPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 pt-6 pb-6 max-w-7xl">
        {/* header / search / tabs placeholders */}
        <div className="flex flex-col gap-4 mb-8">
          <Skeleton className="h-9 w-full max-w-md rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>

        {/* product area — animated */}
        <div
          role="status"
          aria-label="Loading products"
          className="w-full flex flex-col items-center justify-center py-32 gap-3"
        >
          <CartLoadingAnimation size={120} />
          <p className="text-sm text-muted-foreground">Loading products…</p>
        </div>
      </main>
    </div>
  );
}
