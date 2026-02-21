import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PexlyFooter } from "@/components/pexly-footer";
import { Plus, Package, TrendingUp, TrendingDown, Share2, MoreVertical, History, Users, Star, ThumbsUp, Lock, BarChart3, Award, QrCode, Medal, Settings, Code, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DOMPurify from "dompurify";
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

  // Helper to escape HTML entities for safe innerHTML usage
  const escapeHtml = (str: string | undefined | null): string => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
      
      const safeInitials = user?.user_metadata?.full_name?.substring(0, 2)?.toUpperCase() || user?.email?.substring(0, 2)?.toUpperCase() || 'JD';
      const safeDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Vendor';
      const safeCryptoSymbol = selectedOffer.crypto_symbol;
      const safeFiatCurrency = selectedOffer.fiat_currency;
      const safePaymentMethods = Array.isArray(selectedOffer.payment_methods) 
        ? selectedOffer.payment_methods.join(', ') 
        : selectedOffer.payment_methods;

      // Build the UI using DOM elements instead of innerHTML
      const mainWrapper = document.createElement('div');
      mainWrapper.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      mainWrapper.style.borderRadius = '24px';
      mainWrapper.style.padding = '32px';
      mainWrapper.style.color = 'white';

      // Header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.gap = '16px';
      header.style.marginBottom = '24px';

      const initialsCircle = document.createElement('div');
      initialsCircle.style.width = '60px';
      initialsCircle.style.height = '60px';
      initialsCircle.style.background = 'rgba(255,255,255,0.2)';
      initialsCircle.style.borderRadius = '50%';
      initialsCircle.style.display = 'flex';
      initialsCircle.style.alignItems = 'center';
      initialsCircle.style.justifyContent = 'center';
      initialsCircle.style.fontSize = '24px';
      initialsCircle.style.fontWeight = 'bold';
      initialsCircle.textContent = safeInitials;

      const headerInfo = document.createElement('div');
      const nameLabel = document.createElement('div');
      nameLabel.style.fontSize = '20px';
      nameLabel.style.fontWeight = 'bold';
      nameLabel.textContent = safeDisplayName;
      const verifiedLabel = document.createElement('div');
      verifiedLabel.style.fontSize = '14px';
      verifiedLabel.style.opacity = '0.9';
      verifiedLabel.textContent = 'Verified Trader';
      headerInfo.appendChild(nameLabel);
      headerInfo.appendChild(verifiedLabel);

      header.appendChild(initialsCircle);
      header.appendChild(headerInfo);
      mainWrapper.appendChild(header);

      // Offer Type Badge
      const badge = document.createElement('div');
      badge.style.display = 'inline-block';
      badge.style.background = selectedOffer.offer_type === 'buy' ? '#C4F82A' : '#ffffff';
      badge.style.color = '#000';
      badge.style.padding = '8px 16px';
      badge.style.borderRadius = '8px';
      badge.style.fontWeight = 'bold';
      badge.style.fontSize = '14px';
      badge.style.marginBottom = '16px';
      badge.textContent = `${selectedOffer.offer_type.toUpperCase()} ${safeCryptoSymbol}`;
      mainWrapper.appendChild(badge);

      // Main Offer Details
      const detailsBox = document.createElement('div');
      detailsBox.style.background = 'rgba(255,255,255,0.15)';
      detailsBox.style.borderRadius = '16px';
      detailsBox.style.padding = '24px';
      detailsBox.style.marginBottom = '24px';

      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = '1fr 1fr';
      grid.style.gap = '20px';

      const priceDiv = document.createElement('div');
      const priceLabel = document.createElement('div');
      priceLabel.style.fontSize = '14px';
      priceLabel.style.opacity = '0.9';
      priceLabel.style.marginBottom = '4px';
      priceLabel.textContent = 'Price';
      const priceValue = document.createElement('div');
      priceValue.style.fontSize = '28px';
      priceValue.style.fontWeight = 'bold';
      priceValue.textContent = `${selectedOffer.fixed_price?.toLocaleString()} ${safeFiatCurrency}`;
      priceDiv.appendChild(priceLabel);
      priceDiv.appendChild(priceValue);

      const amountDiv = document.createElement('div');
      const amountLabel = document.createElement('div');
      amountLabel.style.fontSize = '14px';
      amountLabel.style.opacity = '0.9';
      amountLabel.style.marginBottom = '4px';
      amountLabel.textContent = 'Amount';
      const amountValue = document.createElement('div');
      amountValue.style.fontSize = '28px';
      amountValue.style.fontWeight = 'bold';
      amountValue.textContent = `${selectedOffer.available_amount} ${safeCryptoSymbol}`;
      amountDiv.appendChild(amountLabel);
      amountDiv.appendChild(amountValue);

      grid.appendChild(priceDiv);
      grid.appendChild(amountDiv);
      detailsBox.appendChild(grid);

      // Limits
      const limitsSection = document.createElement('div');
      limitsSection.style.marginTop = '16px';
      limitsSection.style.paddingTop = '16px';
      limitsSection.style.borderTop = '1px solid rgba(255,255,255,0.2)';
      const limitsLabel = document.createElement('div');
      limitsLabel.style.fontSize = '14px';
      limitsLabel.style.opacity = '0.9';
      limitsLabel.style.marginBottom = '4px';
      limitsLabel.textContent = 'Limits';
      const limitsValue = document.createElement('div');
      limitsValue.style.fontSize = '18px';
      limitsValue.style.fontWeight = '600';
      limitsValue.textContent = `${selectedOffer.min_amount.toLocaleString()} - ${selectedOffer.max_amount.toLocaleString()} ${safeFiatCurrency}`;
      limitsSection.appendChild(limitsLabel);
      limitsSection.appendChild(limitsValue);
      detailsBox.appendChild(limitsSection);

      // Payment Methods
      const paymentSection = document.createElement('div');
      paymentSection.style.marginTop = '16px';
      paymentSection.style.paddingTop = '16px';
      paymentSection.style.borderTop = '1px solid rgba(255,255,255,0.2)';
      const paymentLabel = document.createElement('div');
      paymentLabel.style.fontSize = '14px';
      paymentLabel.style.opacity = '0.9';
      paymentLabel.style.marginBottom = '4px';
      paymentLabel.textContent = 'Payment Method';
      const paymentValue = document.createElement('div');
      paymentValue.style.fontSize = '16px';
      paymentValue.style.fontWeight = '600';
      paymentValue.textContent = safePaymentMethods;
      paymentSection.appendChild(paymentLabel);
      paymentSection.appendChild(paymentValue);
      detailsBox.appendChild(paymentSection);

      mainWrapper.appendChild(detailsBox);

      // QR Code
      const qrWrapper = document.createElement('div');
      qrWrapper.style.display = 'flex';
      qrWrapper.style.justifyContent = 'center';
      qrWrapper.style.marginBottom = '24px';
      const qrInner = document.createElement('div');
      qrInner.style.background = 'white';
      qrInner.style.padding = '16px';
      qrInner.style.borderRadius = '16px';
      const qrImg = document.createElement('img');
      qrImg.src = qrCodeDataUrl;
      qrImg.style.display = 'block';
      qrImg.style.width = '180px';
      qrImg.style.height = '180px';
      qrInner.appendChild(qrImg);
      qrWrapper.appendChild(qrInner);
      mainWrapper.appendChild(qrWrapper);

      // Footer
      const shareFooter = document.createElement('div');
      shareFooter.style.textAlign = 'center';
      shareFooter.style.paddingTop = '20px';
      shareFooter.style.borderTop = '1px solid rgba(255,255,255,0.2)';
      
      const logoWrapper = document.createElement('div');
      logoWrapper.style.display = 'flex';
      logoWrapper.style.alignItems = 'center';
      logoWrapper.style.justifyContent = 'center';
      logoWrapper.style.gap = '12px';
      logoWrapper.style.marginBottom = '8px';
      
      const logoIcon = document.createElement('div');
      logoIcon.style.width = '40px';
      logoIcon.style.height = '40px';
      logoIcon.style.background = '#C4F82A';
      logoIcon.style.borderRadius = '10px';
      logoIcon.style.display = 'flex';
      logoIcon.style.alignItems = 'center';
      logoIcon.style.justifyContent = 'center';
      logoIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #000;">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      `;
      
      const logoText = document.createElement('div');
      logoText.style.fontSize = '32px';
      logoText.style.fontWeight = 'bold';
      logoText.textContent = 'pexly';
      
      logoWrapper.appendChild(logoIcon);
      logoWrapper.appendChild(logoText);
      shareFooter.appendChild(logoWrapper);
      
      const scanText = document.createElement('div');
      scanText.style.fontSize = '14px';
      scanText.style.opacity = '0.9';
      scanText.textContent = 'Scan QR code to trade instantly';
      shareFooter.appendChild(scanText);
      
      mainWrapper.appendChild(shareFooter);
      container.appendChild(mainWrapper);

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

      <div className="min-h-screen flex flex-col bg-background relative">
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="max-w-md mx-4 border-primary/20 shadow-2xl">
            <CardContent className="pt-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <Clock className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
              <p className="text-muted-foreground mb-6">
                My Offers dashboard is currently unavailable. We are working hard to bring this feature to you!
              </p>
              <Button onClick={() => window.history.back()} variant="default" className="w-full">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
        <main className="flex-1 container mx-auto px-4 py-6 opacity-50 pointer-events-none">
          {/* Mobile Header */}
          <div className="lg:hidden">
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
                  <DropdownMenuItem onClick={() => navigate('/favorite-offers')}>
                    <Star className="h-4 w-4 mr-2" />
                    Favorite Offers
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/trusted-users')}>
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Trusted Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/blocked-users')}>
                    <Lock className="h-4 w-4 mr-2" />
                    Blocked Users
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/trade-statistics')}>
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
                  <DropdownMenuItem onClick={() => navigate('/developer')}>
                    <Code className="h-4 w-4 mr-2" />
                    Developer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-muted-foreground mb-8">
              View and manage your created offers
            </p>
          </div>

          {/* Desktop 2-Column Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Left Sidebar - Navigation Menu */}
            <div className="lg:col-span-3">
              <Card className="bg-card border-border sticky top-6">
                <CardContent className="p-4">
                  <h2 className="text-lg font-bold mb-4">Menu</h2>
                  <nav className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start bg-primary/10"
                      onClick={() => navigate('/my-offers')}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      My Offers
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/trade-history')}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Trade History
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/p2p')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Recent Trade Partners
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/favorite-offers')}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Favorite Offers
                    </Button>
                    <Separator className="my-2" />
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/trusted-users')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/blocked-users')}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Blocked Users
                    </Button>
                    <Separator className="my-2" />
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/trade-statistics')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Trade Statistics
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/merchant-application')}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Become a Merchant
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/profile')}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Share Profile
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/medals')}
                    >
                      <Medal className="h-4 w-4 mr-2" />
                      Medals
                    </Button>
                    <Separator className="my-2" />
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/account-settings')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => navigate('/developer')}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Developer
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-9">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">My Offers</h1>
                  <Link href="/create-offer">
                    <Button variant="outline" size="icon">
                      <Plus className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
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
                <div className="grid grid-cols-1 gap-4">
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
            </div>
          </div>

          {/* Mobile Stats and Offers - Only show on mobile */}
          <div className="lg:hidden">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </main>

        <PexlyFooter />
      </div>
    </>
  );
}
