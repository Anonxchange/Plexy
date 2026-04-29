import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export const ShopSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="overflow-hidden border-border/40 shadow-none">
          {/* Image Skeleton with pulse and overlay effect */}
          <div className="aspect-[4/3] w-full relative bg-muted/40 overflow-hidden">
             <Skeleton className="absolute inset-0 w-full h-full" />
             <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          </div>
          
          <CardHeader className="pb-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-full rounded-sm opacity-70" />
              <Skeleton className="h-3 w-4/5 rounded-sm opacity-70" />
            </div>
          </CardHeader>
          
          <CardContent className="pb-3 space-y-3">
            <div className="flex items-center gap-2">
               <Skeleton className="h-3 w-3 rounded-full" />
               <Skeleton className="h-3 w-24 rounded-sm" />
            </div>
            <Skeleton className="h-7 w-28 rounded-md" />
          </CardContent>
          
          <CardFooter className="pt-0">
            <Skeleton className="h-10 w-full rounded-xl" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
