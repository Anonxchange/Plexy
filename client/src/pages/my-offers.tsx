
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PexlyFooter } from "@/components/pexly-footer";
import { Plus, Package, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "wouter";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

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

  const activeOffers = offers.filter(o => o.is_active);
  const pausedOffers = offers.filter(o => !o.is_active);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-semibold mb-2">Please sign in</h3>
              <p className="text-muted-foreground mb-6">
                You need to be signed in to view your offers
              </p>
              <Link href="/signin">
                <Button>Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <PexlyFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Offers</h1>
          <Link href="/create-offer">
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="h-5 w-5" />
              Create Offer
            </Button>
          </Link>
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
          <div className="space-y-4">
            {offers.map((offer) => (
              <Card key={offer.id} className="bg-card border-border hover:bg-elevate-1 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge 
                          variant={offer.offer_type === "buy" ? "default" : "secondary"}
                          className={offer.offer_type === "buy" ? "bg-primary" : ""}
                        >
                          {offer.offer_type.toUpperCase()}
                        </Badge>
                        <h3 className="text-xl font-bold">
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

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Method</p>
                          <p className="font-medium">
                            {Array.isArray(offer.payment_methods) 
                              ? offer.payment_methods.join(", ") 
                              : offer.payment_methods}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Currency</p>
                          <p className="font-medium">{offer.fiat_currency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-medium">
                            {offer.fixed_price?.toLocaleString()} {offer.fiat_currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Limits</p>
                          <p className="font-medium">
                            {offer.min_amount} - {offer.max_amount} {offer.fiat_currency}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <PexlyFooter />
    </div>
  );
}
