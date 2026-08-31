import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown in place of the product grid while the product list itself is
 * being fetched (before any cards exist). Plain placeholder cards —
 * the cart loading animation lives inside ShopItemCard for the
 * per-image loading state instead, so it doesn't repeat dozens of times
 * on screen at once.
 */
export function ShopSkeleton() {
  return (
    <div className="flex gap-0.5 -mx-4 lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-4 lg:mx-0">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-1.5 pt-1.5 pb-2">
          <Skeleton className="w-full aspect-[3/4] rounded-md" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
