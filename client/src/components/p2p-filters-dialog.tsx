
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface P2PFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  sortingMethod: string;
  setSortingMethod: (method: string) => void;
  showTopRatedOnly: boolean;
  setShowTopRatedOnly: (value: boolean) => void;
  verifiedUsersOnly: boolean;
  setVerifiedUsersOnly: (value: boolean) => void;
  recentlyActive: boolean;
  setRecentlyActive: (value: boolean) => void;
  acceptableOnly: boolean;
  setAcceptableOnly: (value: boolean) => void;
  rememberFilters: boolean;
  setRememberFilters: (value: boolean) => void;
}

export function P2PFiltersDialog({
  open,
  onOpenChange,
  onApply,
  selectedCountry,
  setSelectedCountry,
  sortingMethod,
  setSortingMethod,
  showTopRatedOnly,
  setShowTopRatedOnly,
  verifiedUsersOnly,
  setVerifiedUsersOnly,
  recentlyActive,
  setRecentlyActive,
  acceptableOnly,
  setAcceptableOnly,
  rememberFilters,
  setRememberFilters,
}: P2PFiltersDialogProps) {
  const handleReset = () => {
    setSelectedCountry("All countries");
    setSortingMethod("Recommended");
    setShowTopRatedOnly(false);
    setVerifiedUsersOnly(false);
    setRecentlyActive(false);
    setAcceptableOnly(false);
  };

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-full sm:h-auto max-h-screen p-0 flex flex-col">
        <div className="sticky top-0 bg-background z-10 border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-xl font-bold">Filters</DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                className="text-sm"
                onClick={handleReset}
              >
                Reset all filters
              </Button>
              <button 
                onClick={() => onOpenChange(false)}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Country Filter */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All countries">All countries</SelectItem>
                  <SelectItem value="United States">🇺🇸 United States</SelectItem>
                  <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                  <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                  <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                  <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sorting */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Sorting</Label>
              <Select value={sortingMethod} onValueChange={setSortingMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recommended">Recommended</SelectItem>
                  <SelectItem value="Price: Low to High">Price: Low to High</SelectItem>
                  <SelectItem value="Price: High to Low">Price: High to Low</SelectItem>
                  <SelectItem value="Most Trades">Most Trades</SelectItem>
                  <SelectItem value="Newest First">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Toggle Filters */}
            <div className="space-y-4">
              {/* Top-rated traders */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold">Show only top-rated traders</div>
                  <div className="text-sm text-muted-foreground">Experienced traders with badges</div>
                </div>
                <Button
                  variant="ghost"
                  className={cn(
                    "ml-4 h-8 w-14 rounded-full p-0 transition-colors",
                    showTopRatedOnly ? "bg-green-500" : "bg-muted"
                  )}
                  onClick={() => setShowTopRatedOnly(!showTopRatedOnly)}
                >
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full bg-white transition-transform",
                      showTopRatedOnly ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </Button>
              </div>

              {/* Verified users only */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold">Verified users only</div>
                  <div className="text-sm text-muted-foreground">Show offers from ID-verified users</div>
                </div>
                <Button
                  variant="ghost"
                  className={cn(
                    "ml-4 h-8 w-14 rounded-full p-0 transition-colors",
                    verifiedUsersOnly ? "bg-green-500" : "bg-muted"
                  )}
                  onClick={() => setVerifiedUsersOnly(!verifiedUsersOnly)}
                >
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full bg-white transition-transform",
                      verifiedUsersOnly ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </Button>
              </div>

              {/* Recently active */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold">Recently active</div>
                  <div className="text-sm text-muted-foreground">Last seen 30 mins ago</div>
                </div>
                <Button
                  variant="ghost"
                  className={cn(
                    "ml-4 h-8 w-14 rounded-full p-0 transition-colors",
                    recentlyActive ? "bg-green-500" : "bg-muted"
                  )}
                  onClick={() => setRecentlyActive(!recentlyActive)}
                >
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full bg-white transition-transform",
                      recentlyActive ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </Button>
              </div>

              {/* Acceptable only */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold">Acceptable only</div>
                  <div className="text-sm text-muted-foreground">Show only offers that I can accept now</div>
                </div>
                <Button
                  variant="ghost"
                  className={cn(
                    "ml-4 h-8 w-14 rounded-full p-0 transition-colors",
                    acceptableOnly ? "bg-green-500" : "bg-muted"
                  )}
                  onClick={() => setAcceptableOnly(!acceptableOnly)}
                >
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full bg-white transition-transform",
                      acceptableOnly ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 bg-background border-t p-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="remember-filters"
              checked={rememberFilters}
              onChange={(e) => setRememberFilters(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="remember-filters" className="text-sm">
              Remember my filters
            </label>
          </div>
          <Button 
            className="w-full h-12 bg-[#C4F82A] hover:bg-[#b5e625] text-black font-bold"
            onClick={handleApply}
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
