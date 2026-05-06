import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ShoppingBag, Loader2, Trash2, ExternalLink, PackageSearch,
  Clock, Package, Search, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HistoryItem {
  id: string;
  product_id: string;
  product_title: string;
  product_image: string | null;
  price: number | null;
  currency: string | null;
  viewed_at: string;
}

export interface SavedOrder {
  id: string;
  productTitle: string;
  productImage?: string;
  price: number;
  currency: string;
  checkoutUrl: string;
  placedAt: string;
  status: "pending" | "processing" | "shipped" | "delivered";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function loadSavedOrders(): SavedOrder[] {
  try {
    return JSON.parse(localStorage.getItem("pexly_orders") || "[]");
  } catch {
    return [];
  }
}

const STATUS_COLORS: Record<SavedOrder["status"], string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  processing: "bg-blue-500/10 text-blue-600",
  shipped: "bg-purple-500/10 text-purple-600",
  delivered: "bg-green-500/10 text-green-600",
};

// ─── Tabs ────────────────────────────────────────────────────────────────────
type Tab = "viewed" | "orders" | "status";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "viewed",  label: "Recently Viewed", icon: <Clock className="h-3.5 w-3.5" /> },
  { id: "orders",  label: "My Orders",       icon: <Package className="h-3.5 w-3.5" /> },
  { id: "status",  label: "Order Status",    icon: <PackageSearch className="h-3.5 w-3.5" /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export function ShopHistorySection() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("viewed");

  // ── Recently Viewed ──
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  // ── My Orders ──
  const [orders, setOrders] = useState<SavedOrder[]>([]);

  // ── Order Status lookup ──
  const [orderNumber, setOrderNumber] = useState("");
  const [orderEmail, setOrderEmail] = useState("");

  useEffect(() => {
    if (user) fetchHistory();
    setOrders(loadSavedOrders());
  }, [user]);

  async function fetchHistory() {
    setLoading(true);
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("shop_history")
        .select("id, product_id, product_title, product_image, price, currency, viewed_at")
        .eq("user_id", user!.id)
        .order("viewed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setHistory(data || []);
    } catch {
      toast.error("Failed to load shop history.");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(id: string) {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase.from("shop_history").delete().eq("id", id);
      if (error) throw error;
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch {
      toast.error("Failed to remove item.");
    }
  }

  async function clearAllHistory() {
    setClearing(true);
    try {
      const supabase = await getSupabase();
      const { error } = await supabase.from("shop_history").delete().eq("user_id", user!.id);
      if (error) throw error;
      setHistory([]);
      toast.success("History cleared.");
    } catch {
      toast.error("Failed to clear history.");
    } finally {
      setClearing(false);
    }
  }

  function removeOrder(id: string) {
    const updated = orders.filter((o) => o.id !== id);
    localStorage.setItem("pexly_orders", JSON.stringify(updated));
    setOrders(updated);
  }

  function clearOrders() {
    localStorage.removeItem("pexly_orders");
    setOrders([]);
    toast.success("Order history cleared.");
  }

  function handleTrackOrder() {
    if (!orderNumber.trim()) {
      toast.error("Please enter an order number.");
      return;
    }
    const num = orderNumber.trim().replace(/^#/, "");
    const email = encodeURIComponent(orderEmail.trim());
    const url = email
      ? `https://shopify.com/customer-center/lookup?order_number=${num}&email=${email}`
      : `https://shopify.com/customer-center/lookup?order_number=${num}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // ─── Render tabs ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Recently Viewed ── */}
      {activeTab === "viewed" && (
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No browsing history yet.</p>
                <p className="text-xs mt-1">Products you view in the shop will appear here.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllHistory}
                    disabled={clearing}
                    className="text-destructive hover:text-destructive text-xs"
                  >
                    {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                    Clear all
                  </Button>
                </div>
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product_title}</p>
                        {item.price != null && (
                          <p className="text-sm text-muted-foreground">{item.currency} {item.price.toLocaleString()}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{timeAgo(item.viewed_at)}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => navigate(`/shop/product/${encodeURIComponent(item.product_id)}`)}
                          title="View product"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── My Orders ── */}
      {activeTab === "orders" && (
        <Card>
          <CardContent className="p-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No orders yet.</p>
                <p className="text-xs mt-1 max-w-xs mx-auto">
                  Orders placed through the shop will appear here automatically.
                </p>
                <Button
                  variant="outline" size="sm" className="mt-4 text-xs"
                  onClick={() => navigate("/shop")}
                >
                  Browse the shop
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-3">
                  <Button
                    variant="ghost" size="sm"
                    onClick={clearOrders}
                    className="text-destructive hover:text-destructive text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear all
                  </Button>
                </div>
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {order.productImage ? (
                          <img src={order.productImage} alt={order.productTitle} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{order.productTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.currency} {order.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{timeAgo(order.placedAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => window.open(order.checkoutUrl, "_blank", "noopener,noreferrer")}
                            title="View order"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeOrder(order.id)}
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Order Status ── */}
      {activeTab === "status" && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <PackageSearch className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <h3 className="text-sm font-semibold">Track Your Order</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Enter your order number from your confirmation email to check the status of your shipment.
              </p>
            </div>

            <div className="space-y-3 max-w-sm mx-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Order Number</label>
                <Input
                  placeholder="e.g. 1001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email Address <span className="font-normal text-muted-foreground/60">(optional)</span></label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={orderEmail}
                  onChange={(e) => setOrderEmail(e.target.value)}
                  className="h-10 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleTrackOrder()}
                />
              </div>
              <Button className="w-full h-10" onClick={handleTrackOrder}>
                <Search className="h-4 w-4 mr-2" />
                Track Order
              </Button>
            </div>

            {orders.length > 0 && (
              <div className="max-w-sm mx-auto pt-2 border-t border-border/60">
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <RotateCcw className="h-3 w-3" />
                  Recent orders
                </p>
                <div className="space-y-1.5">
                  {orders.slice(0, 3).map((order) => (
                    <button
                      key={order.id}
                      onClick={() => window.open(order.checkoutUrl, "_blank", "noopener,noreferrer")}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{order.productTitle}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(order.placedAt)}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ml-2 flex-shrink-0 ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
