import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Calendar, Clock, User, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase";
import { PexlyFooter } from "@/components/pexly-footer";

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

  useEffect(() => {
    if (params?.postId) {
      fetchPost(params.postId);
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
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/blog')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-8">
        {post.image_url && (
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-[#B4F22E] text-black hover:bg-[#9FD624]">
                {post.category}
              </Badge>
            </div>
          </div>
        )}

        {!post.image_url && (
          <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-[#B4F22E]/80 via-[#8BC34A]/60 to-[#4CAF50]/80">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📰</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-white/20 backdrop-blur text-white hover:bg-white/30">
                {post.category}
              </Badge>
            </div>
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#B4F22E]/20 flex items-center justify-center">
                <User className="h-5 w-5 text-[#B4F22E]" />
              </div>
              <div>
                <p className="font-medium text-foreground">{post.author}</p>
                <p className="text-sm">Author</p>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-center gap-2">
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

        <div className="flex items-center justify-between">
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
