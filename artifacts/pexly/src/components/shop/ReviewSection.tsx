import { useState, useEffect } from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  display_name: string | null;
}

interface ReviewSectionProps {
  productId: string;
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const dim = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? "cursor-default" : "cursor-pointer"}
        >
          <Star
            className={`${dim} transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function averageRating(reviews: Review[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

function ratingLabel(n: number) {
  if (n >= 4.5) return "Excellent";
  if (n >= 3.5) return "Good";
  if (n >= 2.5) return "Average";
  if (n >= 1.5) return "Poor";
  return "Terrible";
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
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  async function fetchReviews() {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, user_id, rating, comment, created_at, display_name")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReviews(data || []);
      if (user) {
        const mine = (data || []).find((r: Review) => r.user_id === user.id);
        if (mine) {
          setMyReview(mine);
          setMyRating(mine.rating);
          setMyComment(mine.comment || "");
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    if (!user) return;
    if (myRating < 1) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = await getSupabase();
      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        "User";

      const payload = {
        product_id: productId,
        user_id: user.id,
        rating: myRating,
        comment: myComment.trim() || null,
        display_name: displayName,
      };

      let error;
      if (myReview) {
        ({ error } = await supabase
          .from("product_reviews")
          .update({ rating: myRating, comment: payload.comment })
          .eq("id", myReview.id));
      } else {
        ({ error } = await supabase.from("product_reviews").insert(payload));
      }

      if (error) throw error;
      toast.success(myReview ? "Review updated!" : "Review submitted!");
      setShowForm(false);
      await fetchReviews();
    } catch {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const avg = averageRating(reviews);
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="mt-12 space-y-8">
      <Separator />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-xl font-bold">Reviews</h2>
            {reviews.length > 0 && (
              <span className="text-sm text-muted-foreground">({reviews.length})</span>
            )}
          </div>
          {user && !showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              {myReview ? "Edit your review" : "Write a review"}
            </Button>
          )}
        </div>

        {/* Summary */}
        {reviews.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-6 p-5 rounded-xl border border-border/60 bg-card/50">
            <div className="flex flex-col items-center justify-center gap-1 min-w-[90px]">
              <span className="text-4xl font-bold">{avg.toFixed(1)}</span>
              <StarRating value={Math.round(avg)} readonly size="sm" />
              <span className="text-xs text-muted-foreground">{ratingLabel(avg)}</span>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingCounts.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-4 text-right text-muted-foreground">{star}</span>
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-4 text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Write / Edit form */}
        {showForm && user && (
          <div className="rounded-xl border border-primary/30 bg-card p-5 space-y-4">
            <p className="font-semibold text-sm">{myReview ? "Update your review" : "Your review"}</p>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Rating</p>
              <StarRating value={myRating} onChange={setMyRating} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Comment (optional)</p>
              <Textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{myComment.length}/1000</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={submitReview} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {myReview ? "Update" : "Submit"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!user && (
          <p className="text-sm text-muted-foreground">
            <a href="/signin" className="underline hover:text-foreground">Sign in</a> to leave a review.
          </p>
        )}

        {/* Review list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {(review.display_name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{review.display_name || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(review.created_at)}</p>
                    </div>
                  </div>
                  <StarRating value={review.rating} readonly size="sm" />
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
