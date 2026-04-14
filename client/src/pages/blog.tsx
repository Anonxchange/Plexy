import { useHead } from "@unhead/react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Calendar, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { createClient } from "@/lib/supabase";
import { useSchema, blogPageSchema } from "@/hooks/use-schema";
import { sanitizeImageUrl } from "@/lib/sanitize";

const BATCH = 12;

const gradients = [
  "from-[#B4F22E] via-[#9FD624] to-[#8BC34A]",
  "from-[#8BC34A] via-[#B4F22E] to-[#CDDC39]",
  "from-[#B4F22E]/90 via-[#7CB342] to-[#558B2F]",
  "from-[#9FD624] via-[#B4F22E] to-[#C6FF00]",
  "from-[#8BC34A] via-[#9FD624] to-[#B4F22E]",
  "from-[#B4F22E] via-[#8BC34A] to-[#689F38]",
];

function GradientCard({ gradient, className }: { gradient: string; className?: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} ${className} flex items-center justify-center`}>
      <span className="text-5xl opacity-30">📰</span>
    </div>
  );
}

function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-sm">
      {label}
    </span>
  );
}

export default function Blog() {
  useHead({ title: "Blog | Pexly", meta: [{ name: "description", content: "Cryptocurrency news, product updates, DeFi insights, and blockchain guides from the Pexly team." }] });
  useSchema(blogPageSchema, "blog-page-schema");
  const supabase = createClient();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(BATCH);
  const [search, setSearch] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setBlogPosts(
          (data || []).map((p: any, i: number) => ({
            ...p,
            gradient: gradients[i % gradients.length],
            formattedDate: new Date(p.created_at).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            }),
          }))
        );
      } catch (e) {
        console.error("Error fetching blog posts:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = ["All", ...Array.from(new Set(blogPosts.map((p) => p.category).filter(Boolean)))];

  const filtered = blogPosts.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = blogPosts.slice(0, 5);
  const gridPosts = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const prevFeatured = () => setFeaturedIndex((i) => (i === 0 ? featuredPosts.length - 1 : i - 1));
  const nextFeatured = () => setFeaturedIndex((i) => (i === featuredPosts.length - 1 ? 0 : i + 1));

  const featured = featuredPosts[featuredIndex];

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO BANNER ── */}
      <section className="relative w-full overflow-hidden rounded-b-[2.5rem] md:rounded-b-[3.5rem]" style={{ minHeight: 340 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f1208] to-[#0a1400]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#B4F22E]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#B4F22E]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center" style={{ minHeight: 340 }}>
          <div className="max-w-xl py-16">
            <p className="text-[#B4F22E]/70 text-xs font-semibold uppercase tracking-widest mb-3">Pexly Blog</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight tracking-tight">
              Your gateway to Web3
            </h1>
            <p className="text-white/55 text-base md:text-lg leading-relaxed mb-8 max-w-md">
              Learn all about crypto and explore what's trending in the Web3 world — guides, news, and product updates.
            </p>
            <button
              onClick={() => document.getElementById("articles-section")?.scrollIntoView({ behavior: "smooth" })}
              className="px-6 py-3 rounded-xl bg-[#B4F22E] text-black font-semibold text-sm hover:bg-[#c8ff3a] transition-colors shadow-lg shadow-[#B4F22E]/20"
            >
              Explore articles
            </button>
          </div>
        </div>
      </section>

      {/* ── MOST-READ CAROUSEL ── */}
      {!loading && featuredPosts.length > 0 && (
        <section className="bg-background border-b border-border py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Most-read by Pexly users</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevFeatured}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextFeatured}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div ref={carouselRef} className="overflow-hidden">
              {featured && (
                <div
                  className="flex rounded-2xl overflow-hidden border border-border shadow-sm cursor-pointer group hover:border-[#B4F22E]/40 transition-colors"
                  style={{ minHeight: 280 }}
                  onClick={() => setLocation(`/blog/${featured.id}`)}
                >
                  {/* Image — left 55% */}
                  <div className="relative w-[55%] flex-shrink-0 overflow-hidden">
                    {featured.image_url ? (
                      <img
                        src={sanitizeImageUrl(featured.image_url)}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <GradientCard gradient={featured.gradient} className="w-full h-full min-h-[280px]" />
                    )}
                    {featured.category && (
                      <div className="absolute top-4 left-4 flex items-center gap-1.5">
                        <CategoryBadge label={featured.category} />
                        {featuredPosts.filter(p => p.category === featured.category).length > 1 && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-sm">
                            +{featuredPosts.filter(p => p.category === featured.category).length - 1}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Text — right 45% */}
                  <div className="flex-1 bg-card flex flex-col justify-center px-8 py-8">
                    <h3 className="text-xl md:text-2xl font-bold text-card-foreground leading-snug mb-3 group-hover:text-[#B4F22E] transition-colors line-clamp-3">
                      {featured.title}
                    </h3>
                    {featured.excerpt && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-5">
                        {featured.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{featured.formattedDate}</span>
                      {featured.author && <><span>·</span><span>{featured.author}</span></>}
                    </div>
                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5 mt-6">
                      {featuredPosts.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setFeaturedIndex(i); }}
                          className={`rounded-full transition-all ${i === featuredIndex ? "w-5 h-1.5 bg-[#B4F22E]" : "w-1.5 h-1.5 bg-border hover:bg-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── ARTICLES SECTION ── */}
      <section id="articles-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Heading */}
        <div className="mb-7">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">A crypto education</h2>
          <p className="text-muted-foreground text-sm">Resources spanning all topics and difficulty levels.</p>
        </div>

        {/* Search */}
        <div className="relative mb-7 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisible(BATCH); }}
            placeholder="Search articles"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#B4F22E]/40 focus:border-[#B4F22E]/60 transition-all"
          />
        </div>

        {/* Topic pills */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-foreground mb-3">Popular topics</p>
          <div className="flex flex-wrap gap-2">
            {loading
              ? ["All", "Guides", "Updates", "DeFi", "Bitcoin"].map((c) => (
                  <button key={c} className="px-4 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground">
                    {c}
                  </button>
                ))
              : categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setSelectedCategory(c); setVisible(BATCH); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedCategory === c
                        ? "border-[#B4F22E] bg-[#B4F22E] text-black shadow-sm shadow-[#B4F22E]/20"
                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-8" />

        {/* Article grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse border border-border">
                <div className="aspect-[16/9] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : gridPosts.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No articles found.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setLocation(`/blog/${post.id}`)}
                  className="rounded-2xl overflow-hidden cursor-pointer group border border-border hover:border-[#B4F22E]/40 hover:shadow-lg hover:shadow-[#B4F22E]/8 transition-all duration-300 bg-card"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {post.image_url ? (
                      <img
                        src={sanitizeImageUrl(post.image_url)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <GradientCard gradient={post.gradient} className="w-full h-full" />
                    )}
                    {post.category && (
                      <div className="absolute top-3 left-3">
                        <CategoryBadge label={post.category} />
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="p-4">
                    <h3 className="font-bold text-card-foreground text-base leading-snug line-clamp-2 group-hover:text-[#B4F22E] transition-colors duration-200 mb-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{post.formattedDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisible((v) => v + BATCH)}
                  className="px-8 py-3 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted hover:border-foreground/30 transition-all"
                >
                  Load more articles
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-lg">
            <div className="w-10 h-1 rounded-full bg-[#B4F22E] mb-5" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Sign up to receive weekly updates.
            </h2>
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
              Each week we break down complex crypto topics in just one minute, delivered directly to your inbox.
            </p>
            <button className="px-7 py-3.5 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-80 transition-opacity shadow-lg">
              Sign up
            </button>
          </div>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}
