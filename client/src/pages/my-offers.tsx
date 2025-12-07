import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PexlyFooter } from "@/components/pexly-footer";
import { Plus, Package, TrendingUp, TrendingDown, Share2, MoreVertical, History, Users, Star, ThumbsUp, Lock, BarChart3, Award, QrCode, Medal, Settings, Code } from "lucide-react";
import { Link, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Offer {
  id: string;
  offer_type: "buy" | "sell";
  crypto_symbol: string;
  available_amount: number;
  payment_methods: string[];
  fiat_currency: string;
  fixed_price: number;
  is_active: boolean;
  min_amount: number;
  max_amount: number;
  created_at: string;
}

export function MyOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [, navigate] = useLocation();


  useEffect(() => {
    if (user) {
      fetchMyOffers();
    }
  }, [user]);

  const fetchMyOffers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("p2p_offers")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching offers:", error);
        return;
      }

      setOffers(data || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOfferStatus = async (offerId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("p2p_offers")
        .update({ is_active: !currentStatus })
        .eq("id", offerId);

      if (error) {
        console.error("Error updating offer:", error);
        return;
      }

      // Refresh offers
      fetchMyOffers();
    } catch (error) {
      console.error("Error updating offer:", error);
    }
  };

  const deleteOffer = async (offerId: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("p2p_offers")
        .delete()
        .eq("id", offerId);

      if (error) {
        console.error("Error deleting offer:", error);
        return;
      }

      // Refresh offers
      fetchMyOffers();
    } catch (error) {
      console.error("Error deleting offer:", error);
    }
  };

  const shareOffer = async (offer: Offer) => {
    setSelectedOffer(offer);
    setShareDialogOpen(true);
  };

  const copyOfferLink = async () => {
    if (!selectedOffer) return;
    const domain = window.location.origin;
    const offerUrl = `${domain}/p2p?offer=${selectedOffer.id}`;
    try {
      await navigator.clipboard.writeText(offerUrl);
      toast({
        title: "Link Copied!",
        description: "Your offer link has been copied to clipboard",
      });
    } catch (error) {
      console.error('Clipboard failed:', error);
      toast({
        title: "Failed to copy link",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveOfferAsImage = async () => {
    if (!selectedOffer) return;

    try {
      // Dynamically import html2canvas and QRCode
      const html2canvas = (await import('html2canvas')).default;
      const QRCode = (await import('qrcode')).default;
      const domain = window.location.origin;
      const offerUrl = `${domain}/p2p?offer=${selectedOffer.id}`;
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(offerUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create a temporary container for the share image
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.width = '600px';
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '40px';
      container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      
      container.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 24px; padding: 32px; color: white;">
          <!-- Header with Owner Info -->
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">
              ${user?.user_metadata?.full_name?.substring(0, 2)?.toUpperCase() || user?.email?.substring(0, 2)?.toUpperCase() || 'JD'}
            </div>
            <div>
              <div style="font-size: 20px; font-weight: bold;">${user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Vendor'}</div>
              <div style="font-size: 14px; opacity: 0.9;">Verified Trader</div>
            </div>
          </div>

          <!-- Offer Type Badge -->
          <div style="display: inline-block; background: ${selectedOffer.offer_type === 'buy' ? '#C4F82A' : '#ffffff'}; color: #000; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 14px; margin-bottom: 16px;">
            ${selectedOffer.offer_type.toUpperCase()} ${selectedOffer.crypto_symbol}
          </div>

          <!-- Main Offer Details -->
          <div style="background: rgba(255,255,255,0.15); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px;">Price</div>
                <div style="font-size: 28px; font-weight: bold;">${selectedOffer.fixed_price?.toLocaleString()} ${selectedOffer.fiat_currency}</div>
              </div>
              <div>
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px;">Amount</div>
                <div style="font-size: 28px; font-weight: bold;">${selectedOffer.available_amount} ${selectedOffer.crypto_symbol}</div>
              </div>
            </div>
            
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.2);">
              <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px;">Limits</div>
              <div style="font-size: 18px; font-weight: 600;">${selectedOffer.min_amount.toLocaleString()} - ${selectedOffer.max_amount.toLocaleString()} ${selectedOffer.fiat_currency}</div>
            </div>

            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.2);">
              <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px;">Payment Method</div>
              <div style="font-size: 16px; font-weight: 600;">${Array.isArray(selectedOffer.payment_methods) ? selectedOffer.payment_methods.join(', ') : selectedOffer.payment_methods}</div>
            </div>
          </div>

          <!-- QR Code -->
          <div style="display: flex; justify-content: center; margin-bottom: 24px;">
            <div style="background: white; padding: 16px; border-radius: 16px;">
              <img src="${qrCodeDataUrl}" style="display: block; width: 180px; height: 180px;" />
            </div>
          </div>

          <!-- Footer with Logo and Branding -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
              <div style="width: 40px; height: 40px; background: #C4F82A; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #000;">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <div style="font-size: 32px; font-weight: bold;">pexly</div>
            </div>
            <div style="font-size: 14px; opacity: 0.9;">Scan QR code to trade instantly</div>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(container);

      const imageDataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `pexly-${selectedOffer.offer_type}-${selectedOffer.crypto_symbol}-offer.png`;
      link.href = imageDataUrl;
      link.click();
      
      setShareDialogOpen(false);
      
      toast({
        title: "Image saved!",
        description: "Your offer image has been downloaded",
      });
    } catch (error) {
      console.error('Failed to save offer as image:', error);
      toast({
        title: "Failed to save image",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const activeOffers = offers.filter(o => o.is_active);
  const pausedOffers = offers.filter(o => !o.is_active);

  return (
    <>
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Offer</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button
              onClick={copyOfferLink}
              className="w-full h-14 text-base gap-2 flex-col"
              variant="outline"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Copy</span>
            </Button>
            <Button
              onClick={saveOfferAsImage}
              className="w-full h-14 text-base gap-2 flex-col"
              variant="outline"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Save</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">My Offers</h1>
              <Link href="/create-offer">
                <Button variant="outline" size="icon">
                  <Plus className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                  <History className="h-4 w-4 mr-2" />
                  Trade History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/p2p')}>
                  <Users className="h-4 w-4 mr-2" />
                  Recent Trade Partners
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-offers')} className="bg-primary/10">
                  <Package className="h-4 w-4 mr-2" />
                  My Offers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/p2p')}>
                  <Star className="h-4 w-4 mr-2" />
                  Favorite Offers
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/p2p')}>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Trusted Users
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/p2p')}>
                  <Lock className="h-4 w-4 mr-2" />
                  Blocked Users
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Trade Statistics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/merchant-application')}>
                  <Award className="h-4 w-4 mr-2" />
                  Become a Merchant 
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Share Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/medals')}>
                  <Medal className="h-4 w-4 mr-2" />
                  Medals
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://docs.replit.com', '_blank')}>
                  <Code className="h-4 w-4 mr-2" />
                  Developer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-muted-foreground mb-8">
            View and manage your created offers
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Offers</span>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{offers.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Active Offers</span>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">{activeOffers.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Paused Offers</span>
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{pausedOffers.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Offers List */}
          {loading ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Loading your offers...</p>
              </CardContent>
            </Card>
          ) : offers.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No offers yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first offer to start trading
                </p>
                <Link href="/create-offer">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Offer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <Card key={offer.id} className="bg-card border-border hover:bg-elevate-1 transition-colors" data-offer-id={offer.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={offer.offer_type === "buy" ? "default" : "secondary"}
                            className={offer.offer_type === "buy" ? "bg-primary" : ""}
                          >
                            {offer.offer_type.toUpperCase()}
                          </Badge>
                          <h3 className="text-lg font-bold">
                            {offer.available_amount} {offer.crypto_symbol}
                          </h3>
                          <Badge
                            variant="outline"
                            className={
                              offer.is_active
                                ? "border-primary text-primary"
                                : "border-muted-foreground text-muted-foreground"
                            }
                          >
                            {offer.is_active ? "ACTIVE" : "PAUSED"}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary hover:text-primary/80 flex-shrink-0"
                          onClick={() => shareOffer(offer)}
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Payment Method</p>
                          <p className="font-medium truncate">
                            {Array.isArray(offer.payment_methods)
                              ? offer.payment_methods.join(", ")
                              : offer.payment_methods}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Currency</p>
                          <p className="font-medium">{offer.fiat_currency}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="font-medium">
                            {offer.fixed_price?.toLocaleString()} {offer.fiat_currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Limits</p>
                          <p className="font-medium">
                            {offer.min_amount} - {offer.max_amount} {offer.fiat_currency}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Link href={`/edit-offer/${offer.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className={offer.is_active ? "text-destructive" : "text-primary"}
                          onClick={() => toggleOfferStatus(offer.id, offer.is_active)}
                        >
                          {offer.is_active ? "Pause" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteOffer(offer.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <PexlyFooter />
      </div>
    </>
  );
}
