import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, Loader2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  product_id: string;
  product_title: string;
  product_image: string | null;
  price: number | null;
  currency: string | null;
  viewed_at: string;
}

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

export function ShopHistorySection() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (user) fetchHistory();
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

  async function clearAll() {
    setClearing(true);
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("shop_history")
        .delete()
        .eq("user_id", user!.id);
      if (error) throw error;
      setHistory([]);
      toast.success("History cleared.");
    } catch {
      toast.error("Failed to clear history.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <CardTitle>Shop History</CardTitle>
        </div>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={clearing}
            className="text-destructive hover:text-destructive"
          >
            {clearing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Clear all
          </Button>
        )}
      </CardHeader>
      <CardContent>
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
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors group"
              >
                {/* Thumbnail */}
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product_title}</p>
                  {item.price != null && (
                    <p className="text-sm text-muted-foreground">
                      {item.currency} {item.price.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{timeAgo(item.viewed_at)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      navigate(`/shop/product/${encodeURIComponent(item.product_id)}`)
                    }
                    title="View product"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
