import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6 pb-4">
            {/* Country */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All countries">🌍 All countries</SelectItem>
                  <SelectItem value="United States">🇺🇸 United States</SelectItem>
                  <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                  <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                  <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                  <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                  <SelectItem value="South Africa">🇿🇦 South Africa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

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

            {/* Offer tags */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Offer tags</Label>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-muted-foreground"
                  >
                    Select tags
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md h-full sm:h-auto max-h-screen p-0 flex flex-col">
                  <div className="sticky top-0 bg-background z-10 border-b p-4">
                    <div className="flex items-center justify-between">
                      <DialogTitle className="text-xl font-bold">Tags</DialogTitle>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-4">
                      {/* Search Input */}
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <Input
                          placeholder="Select an offer tag"
                          className="pl-10 bg-muted border-0"
                        />
                      </div>

                      {/* Info Box */}
                      <div className="bg-muted p-3 rounded-lg flex items-start gap-2">
                        <svg className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">
                          You can select up to 3 tags (0/3)
                        </p>
                      </div>

                      {/* Tag Options */}
                      <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors text-left">
                          <div className="flex-1">
                            <div className="font-semibold mb-1">photo id required</div>
                            <div className="text-sm text-muted-foreground">Valid government-issued photo ID required.</div>
                          </div>
                          <svg className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors text-left">
                          <div className="flex-1">
                            <div className="font-semibold mb-1">invoices are accepted</div>
                            <div className="text-sm text-muted-foreground">Get your invoice paid</div>
                          </div>
                          <svg className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors text-left">
                          <div className="flex-1">
                            <div className="font-semibold mb-1">no receipt needed</div>
                            <div className="text-sm text-muted-foreground">Receipt not required for this trade.</div>
                          </div>
                          <svg className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 bg-green-500 rounded-lg transition-colors text-left text-white">
                          <div className="flex-1">
                            <div className="font-semibold mb-1">same bank only</div>
                            <div className="text-sm text-white/90">Limit trades with users with an account in the same bank as yours.</div>
                          </div>
                          <div className="bg-white rounded-full p-1.5 flex-shrink-0 ml-3">
                            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors text-left">
                          <div className="flex-1">
                            <div className="font-semibold mb-1">receipt required</div>
                            <div className="text-sm text-muted-foreground">You must provide transaction receipt to complete the trade.</div>
                          </div>
                          <svg className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors text-left">
                          <div className="flex-1">
                            <div className="font-semibold mb-1">no third parties</div>
                            <div className="text-sm text-muted-foreground">Payments must be made from your own account.</div>
                          </div>
                          <svg className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors text-left">
                          <div className="flex-1">
                            <div className="font-semibold mb-1">guided trade</div>
                            <div className="text-sm text-muted-foreground">You and the trade partner are guided through each step of the trade.</div>
                          </div>
                          <svg className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors text-left">
                          <div className="flex-1">
                            <div className="font-semibold mb-1">no verification needed</div>
                            <div className="text-sm text-muted-foreground">You don't need to be a verified user to complete this trade.</div>
                          </div>
                          <svg className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </ScrollArea>

                  <div className="border-t bg-background p-4">
                    <Button
                      className="w-full h-12 bg-[#C4F82A] hover:bg-[#b5e625] text-black font-bold"
                    >
                      Apply
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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

        <div className="border-t bg-background p-4">
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