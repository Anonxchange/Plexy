import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PexlyFooter } from "@/components/pexly-footer";
import { Plus, Package, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "wouter";

interface Offer {
  id: string;
  type: "buy" | "sell";
  crypto: string;
  amount: string;
  paymentMethod: string;
  currency: string;
  rate: number;
  status: "active" | "paused" | "inactive";
  createdAt: Date;
}

export function MyOffers() {
  const [offers] = useState<Offer[]>([
    {
      id: "1",
      type: "sell",
      crypto: "BTC",
      amount: "0.1",
      paymentMethod: "Bank Transfer",
      currency: "NGN",
      rate: 177374519.15,
      status: "active",
      createdAt: new Date("2024-10-01"),
    },
    {
      id: "2",
      type: "buy",
      crypto: "USDT",
      amount: "5000",
      paymentMethod: "Mobile Money",
      currency: "NGN",
      rate: 1580,
      status: "paused",
      createdAt: new Date("2024-09-28"),
    },
  ]);

  const activeOffers = offers.filter(o => o.status === "active");
  const pausedOffers = offers.filter(o => o.status === "paused");

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
        {offers.length === 0 ? (
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
                          variant={offer.type === "buy" ? "default" : "secondary"}
                          className={offer.type === "buy" ? "bg-primary" : ""}
                        >
                          {offer.type === "buy" ? "BUY" : "SELL"}
                        </Badge>
                        <h3 className="text-xl font-bold">
                          {offer.amount} {offer.crypto}
                        </h3>
                        <Badge 
                          variant="outline"
                          className={
                            offer.status === "active" 
                              ? "border-primary text-primary" 
                              : "border-muted-foreground text-muted-foreground"
                          }
                        >
                          {offer.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Method</p>
                          <p className="font-medium">{offer.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Currency</p>
                          <p className="font-medium">{offer.currency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rate</p>
                          <p className="font-medium">
                            {offer.rate.toLocaleString()} {offer.currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Created</p>
                          <p className="font-medium">
                            {offer.createdAt.toLocaleDateString()}
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
                          className={offer.status === "active" ? "text-destructive" : "text-primary"}
                        >
                          {offer.status === "active" ? "Pause" : "Activate"}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
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
