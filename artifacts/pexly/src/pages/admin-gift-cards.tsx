import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, ArrowLeft, Upload, Image as ImageIcon, X, Copy, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { uploadToR2 } from "@/lib/r2-storage";
import { useAuth } from "@/lib/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = ["All categories", "Food", "Games", "Health", "Restaurants", "Shopping", "Travel"];

export default function AdminGiftCards() {
  const supabase = createClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "All categories",
    minValue: "",
    maxValue: "",
    discount: "",
    image_url: "",
    description: "",
    redeemInfo: "",
    available: ""
  });

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc)",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      console.log('Starting upload for gift card image:', file.name);
      
      // Pass 'gift-cards' as folder and use current user id
      const uploadResult = await uploadToR2(file, 'gift-cards', user.id);

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      console.log('Upload successful, URL:', uploadResult.url);
      
      // Ensure state is updated correctly
      setFormData(prev => ({ 
        ...prev, 
        image_url: uploadResult.url as string 
      }));

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image to storage",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast({
      title: "Copied",
      description: "Image URL copied to clipboard",
    });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const removeImage = () => {
    setFormData({ ...formData, image_url: "" });
  };

  const fetchGiftCards = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGiftCards(data || []);
    } catch (error) {
      console.error('Error fetching gift cards:', error);
      toast({
        title: "Error",
        description: "Failed to fetch gift cards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCard) {
        const { data, error } = await supabase
          .from('gift_cards')
          .update({
            name: formData.name,
            brand: formData.brand,
            category: formData.category,
            min_value: parseFloat(formData.minValue),
            max_value: parseFloat(formData.maxValue),
            discount: formData.discount,
            image_url: formData.image_url || null,
            description: formData.description,
            redeem_info: formData.redeemInfo,
            available: parseInt(formData.available),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCard.id)
          .select();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Gift card updated successfully",
        });
      } else {
        const { data, error } = await supabase
          .from('gift_cards')
          .insert([{
            name: formData.name,
            brand: formData.brand,
            category: formData.category,
            min_value: parseFloat(formData.minValue),
            max_value: parseFloat(formData.maxValue),
            discount: formData.discount,
            image_url: formData.image_url || null,
            description: formData.description,
            redeem_info: formData.redeemInfo,
            available: parseInt(formData.available),
            created_at: new Date().toISOString()
          }])
          .select();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Gift card created successfully",
        });
      }

      setFormData({
        name: "",
        brand: "",
        category: "All categories",
        minValue: "",
        maxValue: "",
        discount: "",
        image_url: "",
        description: "",
        redeemInfo: "",
        available: ""
      });
      setEditingCard(null);
      setShowForm(false);
      fetchGiftCards();
    } catch (error) {
      console.error('Error saving gift card:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save gift card",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (card: any) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      brand: card.brand,
      category: card.category || "All categories",
      minValue: card.min_value?.toString() || "",
      maxValue: card.max_value?.toString() || "",
      discount: card.discount || "",
      image_url: card.image_url || "",
      description: card.description || "",
      redeemInfo: card.redeem_info || "",
      available: card.available?.toString() || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gift card?")) return;

    try {
      const { error } = await supabase
        .from('gift_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Gift card deleted successfully",
      });

      fetchGiftCards();
    } catch (error) {
      console.error('Error deleting gift card:', error);
      toast({
        title: "Error",
        description: "Failed to delete gift card",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      category: "All categories",
      minValue: "",
      maxValue: "",
      discount: "",
      image_url: "",
      description: "",
      redeemInfo: "",
      available: ""
    });
    setEditingCard(null);
    setShowForm(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gift Card Management</h1>
          <p className="text-muted-foreground">
            Upload and manage gift cards with images and details
          </p>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Gift Card"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingCard ? "Edit Gift Card" : "Add New Gift Card"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Gift Card Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., iTunes Gift Card"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Apple"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder="e.g., -0.58%"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minValue">Minimum Value</Label>
                  <Input
                    id="minValue"
                    type="number"
                    value={formData.minValue}
                    onChange={(e) => setFormData({ ...formData, minValue: e.target.value })}
                    placeholder="5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxValue">Maximum Value</Label>
                  <Input
                    id="maxValue"
                    type="number"
                    value={formData.maxValue}
                    onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })}
                    placeholder="200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available">Available Count</Label>
                  <Input
                    id="available"
                    type="number"
                    value={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.value })}
                    placeholder="999"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Gift card description..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redeemInfo">How to Redeem</Label>
                <Input
                  id="redeemInfo"
                  value={formData.redeemInfo}
                  onChange={(e) => setFormData({ ...formData, redeemInfo: e.target.value })}
                  placeholder="Redemption instructions..."
                />
              </div>

              <div className="space-y-4">
                <Label>Gift Card Image</Label>
                {formData.image_url ? (
                  <div className="space-y-2">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                      <img
                        src={formData.image_url}
                        alt="Gift card"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyImageUrl(formData.image_url)}
                        className="gap-2"
                      >
                        {copiedUrl === formData.image_url ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy URL
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  {editingCard ? "Update Gift Card" : "Create Gift Card"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading gift cards...</p>
        </div>
      ) : giftCards.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No gift cards yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {giftCards.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                  {card.image_url && (
                    <div className="md:col-span-1">
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className={`space-y-2 ${card.image_url ? 'md:col-span-3' : 'md:col-span-4'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{card.name}</h3>
                        <p className="text-sm text-muted-foreground">{card.brand}</p>
                      </div>
                      {card.discount && (
                        <Badge variant="secondary">{card.discount}</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Price Range</p>
                        <p className="font-medium">${card.min_value} - ${card.max_value}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-medium">{card.category}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Available</p>
                        <p className="font-medium">{card.available}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 md:col-span-1 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(card)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(card.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
