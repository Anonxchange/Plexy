import { Skeleton } from "@/components/ui/skeleton";

export const MarketsSectionSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
    <div className="flex gap-6">
      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-4 w-12" />)}
    </div>
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
