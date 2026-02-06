import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6 bg-[#fcfcfc] dark:bg-background min-h-screen">
      <Skeleton className="h-10 w-64 bg-gray-200 dark:bg-muted" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 bg-gray-200 dark:bg-muted" />
        <Skeleton className="h-32 bg-gray-200 dark:bg-muted" />
        <Skeleton className="h-32 bg-gray-200 dark:bg-muted" />
      </div>
      <Skeleton className="h-64 w-full bg-gray-200 dark:bg-muted" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full bg-gray-200 dark:bg-muted" />
        <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-muted" />
        <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-muted" />
      </div>
    </div>
  );
}

export function ChartPageSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6 bg-[#fcfcfc] dark:bg-background min-h-screen">
      <Skeleton className="h-10 w-48 bg-gray-200 dark:bg-muted" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Skeleton className="h-24 bg-gray-200 dark:bg-muted" />
        <Skeleton className="h-24 bg-gray-200 dark:bg-muted" />
        <Skeleton className="h-24 bg-gray-200 dark:bg-muted" />
        <Skeleton className="h-24 bg-gray-200 dark:bg-muted" />
      </div>
      <Skeleton className="h-80 w-full bg-gray-200 dark:bg-muted" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48 bg-gray-200 dark:bg-muted" />
        <Skeleton className="h-48 bg-gray-200 dark:bg-muted" />
      </div>
    </div>
  );
}
