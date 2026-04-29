import { Skeleton } from "@/components/ui/skeleton";

export function TradeSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-start">
                <Skeleton className="h-16 w-2/3 rounded-lg" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-12 w-1/2 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="p-4 border-t">
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
        <div className="hidden lg:block w-80 border-l p-4 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
