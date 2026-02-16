import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { createClient } from "@/lib/supabase";
import { useSchema, blogPageSchema } from "@/hooks/use-schema";

function calculateReadTime(content: string): string {
  if (!content) return "1 min read";
  const wordsPerMinute = 200;
  const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(word => word.length > 0).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return `${readTime} min read`;
}

function validateImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return "";
  
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  // Prevent protocol-based XSS (javascript:, data:, vbscript:, etc.)
  const lowerUrl = trimmedUrl.toLowerCase();
  
  // Strict check for allowed protocols only
  const isHttp = lowerUrl.startsWith("http://");
  const isHttps = lowerUrl.startsWith("https://");
  const isRelative = trimmedUrl.startsWith("/") && !trimmedUrl.startsWith("//");
  const isImageBlob = lowerUrl.startsWith("data:image/");

  if (!isHttp && !isHttps && !isRelative && !isImageBlob) {
    console.warn("Invalid image URL protocol detected:", trimmedUrl);
    return "";
  }

  try {
    if (isRelative) {
      // Basic character validation for relative paths to prevent injection
      // Allow only safe characters: alphanumeric, /, ., -, _, ?, &, =, #, +
      if (/^[a-zA-Z0-9\/\.\-\_\?\&\=\#\+]+$/.test(trimmedUrl)) {
        return trimmedUrl;
      }
      return "";
    }

    if (isImageBlob) {
      return trimmedUrl;
    }

    const parsed = new URL(trimmedUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      // Additional sanitization for the URL to prevent DOM-based XSS
      // We encode the URL parts to ensure it can't be used for injection
      return parsed.origin + encodeURI(parsed.pathname) + encodeURI(parsed.search) + encodeURI(parsed.hash);
    }
    return "";
  } catch {
    return "";
  }
}

const categories = [
  "Latest news",
  "Announcement",
  "Promotion",
  "Series",
  "Knowledge",
  "Forum"
];

const featuredPosts = [
  {
    id: 1,
    title: "Pexly Will Soon Launch A New Look, Now Opening An Early Beta Access For Users",
    category: "Announcement",
    image: "/featured-1.jpg",
    gradient: "from-[#B4F22E]/80 via-[#8BC34A]/60 to-[#4CAF50]/80"
  },
  {
    id: 2,
    title: "The Role of Bug Bounties in Strengthening Pexly's Security",
    category: "Security",
    image: "/featured-2.jpg",
    gradient: "from-[#B4F22E]/70 via-[#9FD624]/60 to-[#7CB342]/80"
  },
  {
    id: 3,
    title: "How to Earn Crypto Without Trading: The Smart Guide for Beginners",
    category: "Knowledge",
    image: "/featured-3.jpg",
    gradient: "from-[#8BC34A]/80 via-[#B4F22E]/60 to-[#CDDC39]/80"
  },
  {
    id: 4,
    title: "More Friends, More Coins - Earn Up to $130 With Referrals",
    category: "Promotion",
    image: "/featured-4.jpg",
    gradient: "from-[#B4F22E]/90 via-[#9FD624]/70 to-[#8BC34A]/80"
  },
  {
    id: 5,
    title: "Understanding P2P Trading: Complete Guide for 2025",
    category: "Knowledge",
    image: "/featured-5.jpg",
    gradient: "from-[#7CB342]/80 via-[#B4F22E]/60 to-[#9FD624]/80"
  }
];

const gradients = [
  "from-[#B4F22E] via-[#9FD624] to-[#8BC34A]",
  "from-[#8BC34A] via-[#B4F22E] to-[#CDDC39]",
  "from-[#B4F22E]/90 via-[#7CB342] to-[#558B2F]",
  "from-[#9FD624] via-[#B4F22E] to-[#C6FF00]",
  "from-[#8BC34A] via-[#9FD624] to-[#B4F22E]",
  "from-[#B4F22E] via-[#8BC34A] to-[#689F38]",
  "from-[#9FD624] via-[#B4F22E] to-[#CDDC39]",
  "from-[#7CB342] via-[#B4F22E] to-[#9FD624]"
];

export default function Blog() {
  useSchema(blogPageSchema, "blog-page-schema");
  const supabase = createClient();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("Latest news");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithGradients = (data || []).map((post: any, index: number) => ({
        ...post,
        gradient: gradients[index % gradients.length],
        date: new Date(post.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '/')
      }));

      setBlogPosts(postsWithGradients);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredPosts = blogPosts.filter(post => post.featured).slice(0, 5);

  useEffect(() => {
    if (featuredPosts.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredPosts.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [featuredPosts.length]);

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === "Latest news" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredPosts.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredPosts.length) % featuredPosts.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Featured Carousel */}
      <section className="px-4 lg:px-8 pt-6 pb-4">
        <div className="max-w-lg lg:max-w-7xl mx-auto">
          {featuredPosts.length > 0 ? (
          <div className="relative">
            {/* Carousel Container */}
            <div className="relative overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {featuredPosts.map((post) => (
                  <div key={post.id} className="w-full flex-shrink-0">
                    <div className={`relative h-56 md:h-72 bg-gradient-to-br ${post.gradient} rounded-2xl overflow-hidden`}>
                      {/* Pexly Logo */}
                      <div className="absolute top-4 left-4">
                        <span className="text-white/90 font-bold text-lg">Pexly</span>
                      </div>

                      {/* Decorative Elements */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          {/* Abstract shapes */}
                          <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-white/20 rounded-lg transform rotate-12"></div>
                          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/15 rounded-full"></div>
                          <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-white/10 rounded-lg transform -rotate-12"></div>

                          {/* Content hint */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-xl p-3 w-32 md:w-40">
                            <div className="space-y-2">
                              <div className="h-2 bg-white/40 rounded w-full"></div>
                              <div className="h-2 bg-white/30 rounded w-3/4"></div>
                              <div className="h-2 bg-white/20 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Badge */}
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-white text-xs font-medium">#{post.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button 
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Featured Title */}
            <div className="mt-4 px-2">
              <h2 className="text-xl md:text-2xl font-bold text-foreground text-center leading-tight">
                {featuredPosts[currentSlide].title}
              </h2>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {featuredPosts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? "bg-[#B4F22E]" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
          ) : null}
        </div>
      </section>

      {/* Category Tabs */}
      <section className="px-4 lg:px-8 py-4 border-b">
        <div className="max-w-lg lg:max-w-7xl mx-auto">
          <div className="flex gap-6 lg:gap-8 overflow-x-auto pb-2 scrollbar-hide lg:justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap text-sm font-medium pb-2 border-b-2 transition-colors ${
                  selectedCategory === category
                    ? "text-[#B4F22E] border-[#B4F22E]"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="px-4 lg:px-8 py-4">
        <div className="max-w-lg lg:max-w-3xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-12 h-12 rounded-full border-2 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="px-4 lg:px-8 pb-8">
        <div className="max-w-lg lg:max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Loading articles...</p>
              </CardContent>
            </Card>
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No articles found. Try adjusting your search.</p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <Card 
                key={post.id} 
                className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => setLocation(`/blog/${post.id}`)}
              >
                {/* Cover Image or Gradient Banner */}
                <div className="relative h-48 md:h-56 overflow-hidden">
                  {post.image_url ? (
                    <>
                      <img
                        src={validateImageUrl(post.image_url)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </>
                  ) : (
    <div className={`w-full h-full bg-gradient-to-br ${post.gradient}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">📰</span>
          </div>
        </div>
      </div>
    </div>
  )}
                  
                  {/* Pexly Logo */}
                  <div className="absolute top-4 left-4">
                    <span className="text-white/90 font-bold text-lg drop-shadow-md">Pexly</span>
                  </div>

                  {/* Category badge */}
                  <div className="absolute top-4 right-4 bg-[#B4F22E] backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-black text-xs font-semibold">{post.category}</span>
                  </div>
                </div>

                {/* Article Info */}
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold text-foreground leading-tight mb-3 line-clamp-2 group-hover:text-[#B4F22E] transition-colors">
                    {post.title}
                  </h3>
                  
                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{post.author || 'Pexly Team'}</span>
                      </div>
                      <span>•</span>
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#B4F22E] font-medium">
                      <Clock className="h-4 w-4" />
                      <span>{post.read_time || calculateReadTime(post.content)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          </div>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}
