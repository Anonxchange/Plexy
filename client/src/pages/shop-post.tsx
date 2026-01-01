
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
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-border">
              <CardContent className="p-6 space-y-6">
                {/* Listing Type */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">What type of ad are you posting?</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={listingType === "fixed" ? "default" : "outline"}
                      onClick={() => setListingType("fixed")}
                      className="flex-1 h-12"
                    >
                      Fixed price
                    </Button>
                    <Button
                      type="button"
                      variant={listingType === "auction" ? "default" : "outline"}
                      onClick={() => setListingType("auction")}
                      className="flex-1 h-12 gap-2"
                    >
                      Auction
                      <Badge variant="secondary" className="text-[10px]">NEW</Badge>
                    </Button>
                  </div>
                </div>

                {/* Restrictions Notice */}
                <Alert className="bg-muted/30 border-muted">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                      <div className="flex flex-col items-center text-center gap-1">
                        <span className="text-xl">🍃</span>
                        <span className="text-[10px] leading-tight">No narcotics or alcohol</span>
                      </div>
                      <div className="flex flex-col items-center text-center gap-1">
                        <span className="text-xl">🔫</span>
                        <span className="text-[10px] leading-tight">No guns</span>
                      </div>
                      <div className="flex flex-col items-center text-center gap-1">
                        <span className="text-xl">💳</span>
                        <span className="text-[10px] leading-tight">No fake or illegal goods</span>
                      </div>
                      <div className="flex flex-col items-center text-center gap-1">
                        <span className="text-xl">🔞</span>
                        <span className="text-[10px] leading-tight">No adult services</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="font-semibold">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category" className="h-11">
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

                  {/* Ad location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="font-semibold">Ad location</Label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger id="location" className="h-11">
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
                </div>

                {/* Ad Title */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="title" className="font-semibold">Ad title</Label>
                    <span className="text-[10px] text-muted-foreground uppercase">up to 50 characters</span>
                  </div>
                  <Input
                    id="title"
                    placeholder="Add a catchy offer title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                    maxLength={50}
                    className="h-11 bg-muted/20"
                  />
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <Label className="font-semibold">Attachments</Label>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Up to 5 attachments and up to 30mb per item
                  </p>
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-muted/10">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg,image/heic,image/heif,video/mp4,video/quicktime"
                      multiple
                      onChange={handleFileChange}
                      disabled={attachments.length >= 5}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm font-medium">Drag and drop files here</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                    </label>
                  </div>
                  {attachments.length > 0 && (
                    <div className="grid grid-cols-5 gap-3 mt-4">
                      {attachments.map((file, index) => (
                        <div key={index} className="relative group aspect-square">
                          <div className="w-full h-full bg-muted rounded-lg overflow-hidden border">
                            {file.type.startsWith("image/") ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground p-1 text-center truncate">
                                {file.name}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full shadow-lg"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* About this ad */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-semibold">About this ad</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you're offering, why it's valuable, and what makes it stand out"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={8}
                    className="bg-muted/20 resize-none min-h-[160px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Preview Area */}
          <div className="space-y-6">
            <Card className="border-border sticky top-6">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="font-semibold">Pricing</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0"
                        className="flex-1 h-11 bg-muted/20"
                      />
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-24 h-11">
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
                    <div className="p-3 bg-muted/30 rounded-lg space-y-2 border">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Pexly fee:</span>
                        <span className="text-primary">Paid by buyer</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Settlement:</span>
                        <span>Instant</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="font-semibold">Live Preview</Label>
                  <Card className="overflow-hidden border-border bg-muted/10 shadow-none">
                    <div className="aspect-video bg-muted flex items-center justify-center border-b">
                      {attachments.length > 0 && attachments[0].type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(attachments[0])}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <Upload className="h-10 w-10" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5 bg-background">{category || "Uncategorized"}</Badge>
                        <span className="text-[10px] text-muted-foreground">{user?.username || "vendor"}</span>
                      </div>
                      <h4 className="text-lg font-bold truncate">{title || "Listing Title"}</h4>
                      <p className="text-xl font-black text-primary">
                        {price || "0"} <span className="text-xs font-medium">{currency}</span>
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                        {location}
                      </div>
                    </div>
                  </Card>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  disabled={!category || !title || !description || !price || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Listing"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>

      <PexlyFooter />
    </div>
  );
}
