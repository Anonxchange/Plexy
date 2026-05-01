import { useHead } from "@unhead/react";
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Mail, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sanitizeBlogHtml, sanitizeImageUrl } from "@/lib/sanitize";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  image_url: string | null;
  read_time: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter((w) => w.length > 0).length;
  return `${Math.ceil(words / wordsPerMinute)} min read`;
}

function formatContent(content: string): string {
  let f = content
    .replace(/\n\n/g, '</p><p class="mb-5">')
    .replace(/\n/g, "<br/>")
    .replace(/^/, '<p class="mb-5">')
    .replace(/$/, "</p>");
  f = f.replace(
    /(https?:\/\/[^\s<]+\.(jpg|jpeg|png|gif|webp))/gi,
    '<img src="$1" alt="Blog image" class="w-full rounded-2xl my-8 shadow-md" />'
  );
  f = f.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  f = f.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>');
  f = f.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-8 mb-3">$1</h3>');
  return f;
}

function ShareButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      {children}
    </button>
  );
}

export default function BlogPost() {
  const [, params] = useRoute("/blog/:postId");
  const [, setLocation] = useLocation();
  const supabase = createClient();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useHead({
    title: post ? `${post.title} | Pexly Blog` : "Blog | Pexly",
    meta: [{ name: "description", content: post?.excerpt || "Read this Pexly blog post for insights on cryptocurrency, blockchain, and decentralized finance." }],
  });

  useEffect(() => {
    if (params?.postId) {
      fetchPost(params.postId);
      fetchComments(params.postId);
    }
  }, [params?.postId]);

  const fetchPost = async (postId: string) => {
    try {
      const { data, error } = await supabase.from("blog_posts").select("*").eq("id", postId).single();
      if (error) throw error;
      setPost(data);
      if (data?.category) {
        const { data: related } = await supabase
          .from("blog_posts").select("*").eq("category", data.category).neq("id", postId).limit(4);
        setRelatedPosts(related || []);
      }
    } catch (e) {
      console.error("Error fetching post:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("blog_comments").select(`*, user_profiles (username)`).eq("post_id", postId).order("created_at", { ascending: false });
      if (error) throw error;
      setComments(data || []);
    } catch (e) {
      console.error("Error fetching comments:", e);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to post a comment", variant: "destructive" });
      return;
    }
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("blog_comments").insert({ post_id: params?.postId, user_id: user.id, content: newComment.trim() });
      if (error) throw error;
      toast({ title: "Comment posted" });
      setNewComment("");
      fetchComments(params?.postId!);
    } catch {
      toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading article...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Article not found</h1>
        <Button onClick={() => setLocation("/blog")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const updatedDate = new Date(post.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const readTime = post.read_time || calculateReadTime(post.content);

  const shareButtons = (
    <div className="flex items-center gap-2 flex-wrap">
      <ShareButton onClick={handleCopyLink} label="Copy link">
        {copied ? (
          <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
          </svg>
        )}
      </ShareButton>
      <ShareButton onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, "_blank")} label="Share on X">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </ShareButton>
      <ShareButton onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.title + " " + window.location.href)}`, "_blank")} label="Share on WhatsApp">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      </ShareButton>
      <ShareButton onClick={() => window.open(`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(window.location.href)}`, "_blank")} label="Share via email">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      </ShareButton>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* ── TOP BAR ── */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/blog")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </button>
          {post.category && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full border border-border text-muted-foreground">
              {post.category}
            </span>
          )}
        </div>
      </div>

      {/* ── HERO IMAGE (full width) ── */}
      <div className="w-full bg-muted" style={{ maxHeight: 500, overflow: "hidden" }}>
        {post.image_url ? (
          <img
            src={sanitizeImageUrl(post.image_url)}
            alt={post.title}
            className="w-full object-cover"
            style={{ maxHeight: 500 }}
          />
        ) : (
          <div className="w-full flex items-center justify-center bg-gradient-to-br from-[#B4F22E]/20 to-[#B4F22E]/5" style={{ height: 380 }}>
            <span className="text-7xl opacity-20">📰</span>
          </div>
        )}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-16 xl:gap-20">

          {/* ── LEFT: ARTICLE ── */}
          <article className="min-w-0">

            {/* Title block */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-5">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {(post.author || "P")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{post.author || "Pexly Team"}</p>
                  <p className="text-xs text-muted-foreground leading-tight">Author</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{readTime}</span>
              </div>
            </div>

            {/* Share row — visible on mobile, hidden on desktop (shown in sidebar) */}
            <div className="lg:hidden mb-8">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Share</p>
              {shareButtons}
            </div>

            {/* Content */}
            {/* Using dangerouslySetInnerHTML is necessary here due to dynamic content requirements */}
            {/* skipcq: JS-0337 */}
            <div
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:text-foreground prose-headings:font-bold
                prose-p:text-foreground/85 prose-p:leading-[1.85]
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground
                prose-img:rounded-2xl prose-img:shadow-md
                prose-li:text-foreground/85
                prose-blockquote:border-primary prose-blockquote:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(formatContent(post.content)) }}
            />

            {/* Updated date */}
            <p className="text-xs text-muted-foreground mt-10 pt-6 border-t border-border">
              Last updated {updatedDate}
            </p>

            {/* ── COMMENTS ── */}
            <div className="mt-12 pt-10 border-t border-border">
              <h3 className="text-xl font-bold mb-6">Comments ({comments.length})</h3>
              {user ? (
                <div className="mb-8">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full min-h-[100px] p-4 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                    placeholder="Share your thoughts..."
                  />
                  <div className="flex justify-end mt-2">
                    <Button onClick={handleSubmitComment} disabled={submitting || !newComment.trim()} className="bg-primary text-black hover:bg-primary/90">
                      {submitting ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-5 border border-border rounded-xl bg-muted/40 text-center">
                  <p className="text-muted-foreground mb-3 text-sm">Sign in to join the conversation</p>
                  <Button onClick={() => setLocation("/signin")} variant="outline" size="sm">Sign In</Button>
                </div>
              )}
              <div className="space-y-5">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No comments yet. Be the first!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3 pb-5 border-b border-border last:border-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {comment.user_profiles?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{comment.user_profiles?.username || "Anonymous"}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </article>

          {/* ── RIGHT: STICKY SIDEBAR ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-8">

              {/* Share */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Share this article</p>
                {shareButtons}
              </div>

              <div className="border-t border-border" />

              {/* Article info */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Article info</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>{readTime}</span>
                  </div>
                  {post.category && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-0.5">🏷</span>
                      <span>{post.category}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Newsletter */}
              <div className="bg-foreground text-background rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center mb-4">
                  <Mail className="h-5 w-5 text-background" />
                </div>
                <h3 className="font-bold text-base mb-2">Stay in the loop</h3>
                <p className="text-background/65 text-xs leading-relaxed mb-4">
                  Weekly crypto insights delivered to your inbox.
                </p>
                <div className="space-y-2">
                  <Input
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-background/20 bg-background/10 text-background placeholder:text-background/40 focus-visible:ring-primary text-sm h-9"
                  />
                  <Button size="sm" className="w-full rounded-lg bg-primary text-black hover:bg-primary/90 font-semibold h-9 text-sm">
                    Subscribe
                  </Button>
                </div>
              </div>

              {/* Related articles */}
              {relatedPosts.length > 0 && (
                <>
                  <div className="border-t border-border" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Related articles</p>
                    <div className="space-y-4">
                      {relatedPosts.slice(0, 3).map((related) => (
                        <div
                          key={related.id}
                          onClick={() => setLocation(`/blog/${related.id}`)}
                          className="flex gap-3 cursor-pointer group"
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                            {related.image_url ? (
                              <img src={sanitizeImageUrl(related.image_url)} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#B4F22E]/20 to-[#B4F22E]/5 flex items-center justify-center">
                                <span className="text-xl opacity-30">📰</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                              {related.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(related.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setLocation("/blog")} className="mt-4 text-xs text-primary hover:underline font-medium">
                      Browse all articles →
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ── MOBILE: Newsletter + Related (below article) ── */}
      <div className="lg:hidden border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
          <div className="bg-foreground text-background rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-background/10 flex items-center justify-center mx-auto mb-5">
              <Mail className="h-6 w-6 text-background" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Subscribe to our newsletter</h2>
            <p className="text-background/70 mb-6 text-sm max-w-xs mx-auto">Get the latest crypto news and Pexly updates delivered to your inbox.</p>
            <div className="flex items-center gap-2 bg-background rounded-full p-1.5 max-w-sm mx-auto">
              <Input
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 text-foreground placeholder:text-muted-foreground flex-1 h-10"
              />
              <Button size="sm" className="rounded-full px-5 h-10 bg-primary text-black hover:bg-primary/90 font-semibold flex-shrink-0">
                Subscribe
              </Button>
            </div>
          </div>

          {relatedPosts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-5">Related articles</h2>
              <div className="space-y-3">
                {relatedPosts.map((related) => (
                  <div
                    key={related.id}
                    onClick={() => setLocation(`/blog/${related.id}`)}
                    className="flex gap-4 cursor-pointer group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all"
                  >
                    <div className="w-24 flex-shrink-0 overflow-hidden">
                      {related.image_url ? (
                        <img src={sanitizeImageUrl(related.image_url)} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#B4F22E]/20 to-[#B4F22E]/5 flex items-center justify-center min-h-[80px]">
                          <span className="text-2xl opacity-30">📰</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{related.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(related.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}
