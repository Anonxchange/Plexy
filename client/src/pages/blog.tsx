import { useHead } from "@unhead/react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Calendar } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { createClient } from "@/lib/supabase";
import { useSchema, blogPageSchema } from "@/hooks/use-schema";
import { sanitizeImageUrl } from "@/lib/sanitize";

const BATCH = 6;

const gradients = [
  "from-[#B4F22E] via-[#9FD624] to-[#8BC34A]",
  "from-[#8BC34A] via-[#B4F22E] to-[#CDDC39]",
  "from-[#B4F22E]/90 via-[#7CB342] to-[#558B2F]",
  "from-[#9FD624] via-[#B4F22E] to-[#C6FF00]",
  "from-[#8BC34A] via-[#9FD624] to-[#B4F22E]",
  "from-[#B4F22E] via-[#8BC34A] to-[#689F38]",
];

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
        active
          ? "bg-[#B4F22E] text-black"
          : "bg-card border border-border text-foreground hover:border-[#B4F22E]/50"
      }`}
    >
      {label}
    </button>
  );
}

function GradientCard({ gradient, className }: { gradient: string; className?: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} ${className} flex items-center justify-center`}>
      <span className="text-5xl opacity-30">📰</span>
    </div>
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

  const filtered = blogPosts.filter(
    (p) => selectedCategory === "All" || p.category === selectedCategory
  );

  const latest = filtered[0];
  const whatsNew = filtered.slice(1, visible + 1);
  const hasMore = visible + 1 < filtered.length;

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO CARD ── */}
      <section className="px-3 pt-4 pb-2 sm:px-4 lg:px-6">
        <div className="max-w-2xl lg:max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a2a0a] p-7 md:p-10 min-h-[280px] md:min-h-[340px] flex flex-col justify-end">
            {/* Lime glow blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#B4F22E]/20 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-[#B4F22E]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-lg">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                Newsroom
              </h1>
              <p className="text-white/70 text-base md:text-lg mb-8 leading-relaxed">
                The latest on what's happening at Pexly — crypto insights, product updates, and our weekly newsletter.
              </p>
              <button
                onClick={() => document.getElementById("signup-section")?.scrollIntoView({ behavior: "smooth" })}
                className="px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY PILLS ── */}
      <section className="px-3 py-3 sm:px-4 lg:px-6">
        <div className="max-w-2xl lg:max-w-4xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {loading
              ? ["All", "Guides", "Updates", "Resources"].map((c) => (
                  <Pill key={c} label={c} active={c === "All"} onClick={() => {}} />
                ))
              : categories.map((c) => (
                  <Pill
                    key={c}
                    label={c}
                    active={selectedCategory === c}
                    onClick={() => { setSelectedCategory(c); setVisible(BATCH); }}
                  />
                ))}
          </div>
        </div>
      </section>

      {/* ── LATEST (hero article) ── */}
      {!loading && latest && (
        <section className="px-3 pb-2 sm:px-4 lg:px-6">
          <div className="max-w-2xl lg:max-w-4xl mx-auto">
            <div
              className="rounded-3xl overflow-hidden bg-[#111] cursor-pointer group"
              onClick={() => setLocation(`/blog/${latest.id}`)}
            >
              {/* Image */}
              <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden">
                <span className="absolute top-5 left-5 z-10 text-white/60 text-xs font-semibold uppercase tracking-widest">
                  Latest
                </span>
                {latest.image_url ? (
                  <img
                    src={sanitizeImageUrl(latest.image_url)}
                    alt={latest.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <GradientCard gradient={latest.gradient} className="w-full h-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              </div>

              {/* Info */}
              <div className="p-6 md:p-8">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-snug mb-3 group-hover:text-[#B4F22E] transition-colors">
                  {latest.title}
                </h2>
                {latest.excerpt && (
                  <p className="text-white/60 text-sm md:text-base leading-relaxed mb-4 line-clamp-2">
                    {latest.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-white/40 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {latest.formattedDate}
                  </span>
                  {latest.author && <span>· {latest.author}</span>}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── WHAT'S NEW ── */}
      <section className="px-3 pb-2 sm:px-4 lg:px-6">
        <div className="max-w-2xl lg:max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-5 md:p-7">
            <h2 className="text-xl font-bold text-foreground mb-6">
              {selectedCategory === "All" ? "What's new?" : selectedCategory}
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-muted rounded-2xl mb-3" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : whatsNew.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No articles found.</p>
            ) : (
              <>
                {/* Desktop: 2-column grid. Mobile: single stack */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {whatsNew.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setLocation(`/blog/${post.id}`)}
                      className="rounded-2xl overflow-hidden bg-background border border-border cursor-pointer hover:border-[#B4F22E]/40 hover:shadow-md transition-all group"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full h-48 overflow-hidden">
                        {post.image_url ? (
                          <img
                            src={sanitizeImageUrl(post.image_url)}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <GradientCard gradient={post.gradient} className="w-full h-full" />
                        )}
                      </div>

                      {/* Card info */}
                      <div className="p-4">
                        <h3 className="font-bold text-foreground text-base leading-snug mb-3 line-clamp-2 group-hover:text-[#B4F22E] transition-colors">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#B4F22E]/10 text-[#B4F22E] border border-[#B4F22E]/20">
                            {post.category}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {post.formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setVisible((v) => v + BATCH)}
                      className="px-8 py-3 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── SIGN UP CARD ── */}
      <section id="signup-section" className="px-3 py-2 pb-10 sm:px-4 lg:px-6">
        <div className="max-w-2xl lg:max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Sign up to receive weekly updates.
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
              Each week we break down complex crypto topics in just one minute, delivered directly to your inbox.
            </p>
            <button
              className="px-7 py-3.5 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-80 transition-opacity"
            >
              Sign up
            </button>
          </div>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}
