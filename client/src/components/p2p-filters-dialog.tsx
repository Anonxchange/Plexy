
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
import { X, Search, Info, Check } from "lucide-react";

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

const availableTags = [
  { id: "photo-id", label: "photo id required", description: "Valid government-issued photo ID required." },
  { id: "invoices", label: "invoices are accepted", description: "Get your invoice paid" },
  { id: "no-receipt", label: "no receipt needed", description: "Receipt not required for this trade." },
  { id: "same-bank", label: "same bank only", description: "Limit trades with users with an account in the same bank as yours." },
  { id: "receipt", label: "receipt required", description: "You must provide transaction receipt to complete the trade." },
  { id: "no-third-party", label: "no third parties", description: "Payments must be made from your own account." },
  { id: "guided", label: "guided trade", description: "You and the trade partner are guided through each step of the trade." },
  { id: "no-verification", label: "no verification needed", description: "You don't need to be a verified user to complete this trade." },
];

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
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");

  const handleReset = () => {
    setSelectedCountry("All countries");
    setSortingMethod("Recommended");
    setShowTopRatedOnly(false);
    setVerifiedUsersOnly(false);
    setRecentlyActive(false);
    setAcceptableOnly(false);
    setSelectedTags([]);
  };

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const filteredTags = availableTags.filter(tag =>
    tag.label.toLowerCase().includes(tagSearch.toLowerCase()) ||
    tag.description.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] p-0 flex flex-col">
        <div className="sticky top-0 bg-background z-10 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">Filters</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={handleReset}
              >
                Reset
              </Button>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Country */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="h-10">
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
              <Label className="text-sm font-semibold">Sorting</Label>
              <Select value={sortingMethod} onValueChange={setSortingMethod}>
                <SelectTrigger className="h-10">
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
              <Label className="text-sm font-semibold">Offer tags</Label>
              <Dialog open={showTagsDialog} onOpenChange={setShowTagsDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10 justify-between text-left font-normal"
                  >
                    <span className="text-sm text-muted-foreground truncate">
                      {selectedTags.length > 0 
                        ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                        : 'Select tags'}
                    </span>
                    <span className="text-xs text-muted-foreground">{selectedTags.length}/3</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[440px] max-h-[90vh] p-0 flex flex-col">
                  <div className="sticky top-0 bg-background z-10 border-b">
                    <div className="flex items-center justify-between px-4 py-3">
                      <DialogTitle className="text-lg font-bold">Tags</DialogTitle>
                      <button
                        onClick={() => setShowTagsDialog(false)}
                        className="p-1 hover:bg-muted rounded-md transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Search */}
                    <div className="px-4 pb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search tags"
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          className="pl-9 h-9 bg-muted border-0"
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="px-4 pb-3">
                      <div className="bg-muted p-2.5 rounded-lg flex items-start gap-2">
                        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-xs">
                          You can select up to 3 tags ({selectedTags.length}/3)
                        </p>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-2">
                      {filteredTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.id);
                        const canSelect = selectedTags.length < 3 || isSelected;
                        
                        return (
                          <button
                            key={tag.id}
                            onClick={() => canSelect && toggleTag(tag.id)}
                            disabled={!canSelect}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                              isSelected
                                ? "bg-green-500 text-white"
                                : canSelect
                                ? "hover:bg-muted"
                                : "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm mb-0.5 truncate">{tag.label}</div>
                              <div className={cn(
                                "text-xs line-clamp-2",
                                isSelected ? "text-white/90" : "text-muted-foreground"
                              )}>
                                {tag.description}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="bg-white rounded-full p-1 flex-shrink-0">
                                <Check className="h-3 w-3 text-green-500" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <div className="border-t bg-background p-3">
                    <Button
                      className="w-full h-10 bg-[#C4F82A] hover:bg-[#b5e625] text-black font-bold"
                      onClick={() => setShowTagsDialog(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Selected tags display */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedTags.map((tagId) => {
                    const tag = availableTags.find(t => t.id === tagId);
                    return (
                      <div
                        key={tagId}
                        className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs"
                      >
                        <span>{tag?.label}</span>
                        <button
                          onClick={() => toggleTag(tagId)}
                          className="hover:bg-background rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Toggle Filters */}
            <div className="space-y-3">
              {/* Top-rated traders */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm">Top-rated traders</div>
                  <div className="text-xs text-muted-foreground">Experienced with badges</div>
                </div>
                <Button
                  variant="ghost"
                  className={cn(
                    "ml-3 h-6 w-11 rounded-full p-0 transition-colors",
                    showTopRatedOnly ? "bg-green-500" : "bg-muted"
                  )}
                  onClick={() => setShowTopRatedOnly(!showTopRatedOnly)}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full bg-white transition-transform",
                      showTopRatedOnly ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </Button>
              </div>

              {/* Verified users only */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm">Verified users only</div>
                  <div className="text-xs text-muted-foreground">ID-verified users</div>
                </div>
                <Button
                  variant="ghost"
                  className={cn(
                    "ml-3 h-6 w-11 rounded-full p-0 transition-colors",
                    verifiedUsersOnly ? "bg-green-500" : "bg-muted"
                  )}
                  onClick={() => setVerifiedUsersOnly(!verifiedUsersOnly)}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full bg-white transition-transform",
                      verifiedUsersOnly ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </Button>
              </div>

              {/* Recently active */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm">Recently active</div>
                  <div className="text-xs text-muted-foreground">Last seen 30 mins ago</div>
                </div>
                <Button
                  variant="ghost"
                  className={cn(
                    "ml-3 h-6 w-11 rounded-full p-0 transition-colors",
                    recentlyActive ? "bg-green-500" : "bg-muted"
                  )}
                  onClick={() => setRecentlyActive(!recentlyActive)}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full bg-white transition-transform",
                      recentlyActive ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </Button>
              </div>

              {/* Acceptable only */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm">Acceptable only</div>
                  <div className="text-xs text-muted-foreground">Offers I can accept now</div>
                </div>
                <Button
                  variant="ghost"
                  className={cn(
                    "ml-3 h-6 w-11 rounded-full p-0 transition-colors",
                    acceptableOnly ? "bg-green-500" : "bg-muted"
                  )}
                  onClick={() => setAcceptableOnly(!acceptableOnly)}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full bg-white transition-transform",
                      acceptableOnly ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t bg-background p-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="remember-filters"
              checked={rememberFilters}
              onChange={(e) => setRememberFilters(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300"
            />
            <label htmlFor="remember-filters" className="text-xs">
              Remember my filters
            </label>
          </div>
          <Button
            className="w-full h-10 bg-[#C4F82A] hover:bg-[#b5e625] text-black font-bold"
            onClick={handleApply}
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
