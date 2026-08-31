import { Skeleton } from "@/components/ui/skeleton";
import { ShopSkeleton } from "@/components/shop/ShopSkeleton";

/**
 * Full shop page loading state (initial fetch, before categories/tabs/
 * products are available). Plain gray placeholders for the page chrome
 * and product grid — the cart loading animation is reserved for the
 * per-image loading state inside each ShopItemCard.
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

        <ShopSkeleton />
      </main>
    </div>
  );
}
