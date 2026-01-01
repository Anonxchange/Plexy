
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useVerificationGuard } from "@/hooks/use-verification-guard";

const CATEGORIES = [
  "Services",
  "Digital",
  "Goods",
  "Domains",
  "Jobs",
  "Software",
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports",
  "Other",
];

const CURRENCIES = ["USD", "USDT", "BTC", "ETH"];

export function ShopPost() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { verificationLevel } = useVerificationGuard();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication and Verification Guard
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post an ad",
        variant: "destructive",
      });
      navigate("/signin");
      return;
    }

    if (parseFloat(verificationLevel || "0") < 2) {
      toast({
        title: "Verification required",
        description: "You must be Level 2 verified to post in the shop.",
        variant: "destructive",
      });
      navigate("/verification");
    }
  }, [user, verificationLevel, navigate, toast]);
  const [listingType, setListingType] = useState<"fixed" | "auction">("fixed");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [location, setLocation] = useState("Worldwide");
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 5 - attachments.length);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post an ad",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const metadata: any[] = [];
      
      // Upload images to R2 via your existing client-side integration if possible
      // or just collect metadata for the database if that's what's intended
      for (const file of attachments) {
        // Assuming R2 handling is done elsewhere or we just store metadata
        metadata.push({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
      }

      const { error } = await supabase
        .from('shop_listings')
        .insert({
          user_id: user.id,
          listing_type: listingType,
          category,
          title,
          description,
          price: parseFloat(price),
          currency,
          location,
          images: [], // No images in Supabase
          metadata: metadata, // Store metadata instead
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your ad has been posted successfully!",
      });
      navigate("/shop");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post ad",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/shop")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
          <h1 className="text-3xl font-bold mb-2">Post an Ad</h1>
          <p className="text-muted-foreground">Create a listing to sell your items or services</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Listing Type */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={listingType === "fixed" ? "default" : "outline"}
              onClick={() => setListingType("fixed")}
              className="flex-1"
            >
              Fixed price
            </Button>
            <Button
              type="button"
              variant={listingType === "auction" ? "default" : "outline"}
              onClick={() => setListingType("auction")}
              className="flex-1 gap-2"
            >
              Auction
              <Badge variant="secondary" className="text-[10px]">NEW</Badge>
            </Button>
          </div>

          {/* Restrictions Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🍃</span>
                  </div>
                  <span className="text-xs">No narcotics or alcohol</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🔫</span>
                  </div>
                  <span className="text-xs">No guns</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💳</span>
                  </div>
                  <span className="text-xs">No fake, stolen, or illegal goods</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🔞</span>
                  </div>
                  <span className="text-xs">No adult services or pornography</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                type="button"
                variant={category === cat ? "default" : "outline"}
                onClick={() => setCategory(cat)}
                size="sm"
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Category Select (fallback) */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ad Title */}
          <div>
            <Label htmlFor="title">Ad title</Label>
            <p className="text-xs text-muted-foreground mb-2">up to 50 characters</p>
            <Input
              id="title"
              placeholder="Add a catchy offer title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 50))}
              maxLength={50}
              className="bg-muted/50"
            />
          </div>

          {/* Attachments */}
          <div>
            <Label>Attachments</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Up to 5 attachments (JPEG, PNG, JPG, HEIC, HEIF, MP4, MOV) and up to 30mb per item
            </p>
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,image/heic,image/heif,video/mp4,video/quicktime"
                multiple
                onChange={handleFileChange}
                disabled={attachments.length >= 5}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag and drop files here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {attachments.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          {file.name}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* About this ad */}
          <div>
            <Label htmlFor="description">About this ad</Label>
            <Textarea
              id="description"
              placeholder="Describe what you're offering, why it's valuable, and what makes it stand out"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="bg-muted/50 resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="price">Price</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                className="flex-1 bg-muted/50"
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Set your price from $1, unlimited max
            </p>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Pexly fee:</span>
              <span>Paid by buyer</span>
            </div>
          </div>

          {/* Ad location */}
          <div>
            <Label htmlFor="location">Ad location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Worldwide">Worldwide</SelectItem>
                <SelectItem value="North America">North America</SelectItem>
                <SelectItem value="Europe">Europe</SelectItem>
                <SelectItem value="Asia">Asia</SelectItem>
                <SelectItem value="Africa">Africa</SelectItem>
                <SelectItem value="South America">South America</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div>
            <Label>Preview</Label>
            <Card className="mt-2 bg-card border-border">
              <CardContent className="p-0">
                <div className="aspect-video bg-muted flex items-center justify-center rounded-t-lg">
                  {attachments.length > 0 && attachments[0].type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(attachments[0])}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <Upload className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-4 bg-primary/20 rounded" />
                    <span className="text-sm text-muted-foreground">{user?.username || "guest"}</span>
                  </div>
                  <p className="text-2xl font-bold mb-1">
                    {price || "0"} {currency}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    0 USDT
                  </p>
                  <p className="text-sm">{location}</p>
                  {title && (
                    <p className="text-sm font-medium mt-2">{title}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
            disabled={!category || !title || !description || !price || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting Ad...
              </>
            ) : (
              "Post Ad"
            )}
          </Button>
        </form>
      </main>

      <PexlyFooter />
    </div>
  );
}
