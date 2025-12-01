import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Calendar, Clock, User, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase";
import { PexlyFooter } from "@/components/pexly-footer";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(word => word.length > 0).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return `${readTime} min read`;
}

function formatContent(content: string): string {
  let formatted = content
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, '</p>');
  
  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+\.(jpg|jpeg|png|gif|webp))/gi,
    '<img src="$1" alt="Blog image" class="w-full rounded-xl my-6 shadow-lg" />'
  );
  
  formatted = formatted.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold">$1</strong>'
  );
  
  formatted = formatted.replace(
    /^## (.+)$/gm,
    '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>'
  );
  
  formatted = formatted.replace(
    /^### (.+)$/gm,
    '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>'
  );
  
  return formatted;
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
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (params?.postId) {
      fetchPost(params.postId);
      fetchComments(params.postId);
    }
  }, [params?.postId]);

  const fetchPost = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);

      if (data?.category) {
        const { data: related } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('category', data.category)
          .neq('id', postId)
          .limit(3);
        
        setRelatedPosts(related || []);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          user_profiles (username)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post a comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: params?.postId,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment posted successfully",
      });

      setNewComment("");
      fetchComments(params?.postId!);
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Article not found</h1>
        <Button onClick={() => setLocation('/blog')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const readTime = post.read_time || calculateReadTime(post.content);

  return (
    <div className="min-h-screen bg-background">
      {/* Full-width responsive image */}
      {post.image_url && (
        <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {!post.image_url && (
        <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden bg-gradient-to-br from-[#B4F22E]/80 via-[#8BC34A]/60 to-[#4CAF50]/80">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">📰</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back button and content */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/blog')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{post.category}</Badge>
            </div>
            
            <Separator orientation="vertical" className="h-4" />
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{formattedDate}</span>
            </div>
            
            <Separator orientation="vertical" className="h-4" />
            
            <div className="flex items-center gap-2">
              <span className="text-sm">by {post.author}</span>
            </div>
          </div>

          {/* Social Sharing Icons */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10"
              onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank')}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10"
              onClick={async () => {
                await navigator.clipboard.writeText(window.location.href);
              }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </Button>
            <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{readTime}</span>
            </div>
          </div>
        </header>

        {post.excerpt && (
          <div className="bg-muted/50 rounded-xl p-6 mb-8 border-l-4 border-[#B4F22E]">
            <p className="text-lg text-muted-foreground italic">
              {post.excerpt}
            </p>
          </div>
        )}

        <Separator className="mb-8" />

        <div 
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:text-foreground 
            prose-p:text-foreground/90 
            prose-p:leading-relaxed
            prose-a:text-[#B4F22E] 
            prose-a:no-underline 
            hover:prose-a:underline
            prose-strong:text-foreground
            prose-img:rounded-xl
            prose-img:shadow-lg"
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
        />

        <Separator className="my-12" />

        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#B4F22E]/20 flex items-center justify-center">
              <User className="h-6 w-6 text-[#B4F22E]" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{post.author}</p>
              <p className="text-sm text-muted-foreground">Content Writer at Pexly</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Article
          </Button>
        </div>

        {/* Comments Section */}
        <div className="border-t pt-8">
          <h3 className="text-2xl font-bold mb-6">Comments ({comments.length})</h3>
          
          {/* Comment Form */}
          {user ? (
            <div className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full min-h-[120px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#B4F22E] bg-background"
                placeholder="Share your thoughts..."
              />
              <div className="flex justify-end mt-3">
                <Button 
                  onClick={handleSubmitComment}
                  disabled={submitting || !newComment.trim()}
                  className="bg-[#B4F22E] text-black hover:bg-[#9FD624]"
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-6 border rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground mb-4">Please sign in to post a comment</p>
              <Button onClick={() => setLocation('/signin')} variant="outline">
                Sign In
              </Button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#B4F22E]/20 text-[#B4F22E]">
                        {comment.user_profiles?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">
                          {comment.user_profiles?.username || 'Anonymous'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-foreground/90">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="bg-muted/30 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <div
                  key={related.id}
                  onClick={() => setLocation(`/blog/${related.id}`)}
                  className="bg-background rounded-xl overflow-hidden border hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {related.image_url ? (
                    <img
                      src={related.image_url}
                      alt={related.title}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-[#B4F22E]/60 to-[#8BC34A]/60 flex items-center justify-center">
                      <span className="text-2xl">📰</span>
                    </div>
                  )}
                  <div className="p-4">
                    <Badge variant="secondary" className="mb-2">
                      {related.category}
                    </Badge>
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {related.read_time || calculateReadTime(related.content)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <PexlyFooter />
    </div>
  );
}
