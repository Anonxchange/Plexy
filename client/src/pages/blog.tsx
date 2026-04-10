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
      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap backdrop-blur-sm ${
        active
          ? "bg-[#B4F22E] text-black shadow-lg shadow-[#B4F22E]/30"
          : "bg-white/40 dark:bg-white/10 border border-white/60 dark:border-white/20 text-foreground hover:bg-white/60 dark:hover:bg-white/20"
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

/* Reusable glass container */
function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`
        bg-white/60 dark:bg-white/5
        backdrop-blur-2xl
        border border-white/70 dark:border-white/10
        shadow-2xl shadow-black/10
        rounded-3xl
        ${className}
      `}
    >
      {children}
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
    /* ── Page wrapper with gradient backdrop for glass to pop ── */
    <div className="min-h-screen relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(180,242,46,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(180,242,46,0.07) 0%, transparent 60%), var(--background)",
      }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute top-40 -left-32 w-96 h-96 rounded-full bg-[#B4F22E]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-60 -right-20 w-80 h-80 rounded-full bg-[#B4F22E]/8 blur-3xl" />

      {/* ── HERO CARD ── */}
      <section className="px-3 pt-4 pb-2 sm:px-4 lg:px-6 relative z-10">
        <div className="max-w-2xl lg:max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0f1a04] p-7 md:p-10 min-h-[280px] md:min-h-[340px] flex flex-col justify-end">
            {/* Glow blobs inside hero */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#B4F22E]/25 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-[#B4F22E]/10 rounded-full blur-2xl pointer-events-none" />
            {/* Glass shine strip at top */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative z-10 max-w-lg">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
                Newsroom
              </h1>
              <p className="text-white/65 text-base md:text-lg mb-8 leading-relaxed">
                The latest on what's happening at Pexly — crypto insights, product updates, and our weekly newsletter.
              </p>
              <button
                onClick={() => document.getElementById("signup-section")?.scrollIntoView({ behavior: "smooth" })}
                className="px-6 py-3 rounded-xl bg-white/90 backdrop-blur-sm text-black font-semibold text-sm hover:bg-white transition-colors shadow-lg"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY PILLS ── */}
      <section className="px-3 py-3 sm:px-4 lg:px-6 relative z-10">
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

      {/* ── LATEST (hero article — "All" only) ── */}
      {!loading && latest && selectedCategory === "All" && (
        <section className="px-3 pb-2 sm:px-4 lg:px-6 relative z-10">
          <div className="max-w-2xl lg:max-w-4xl mx-auto">
            <div
              className="rounded-3xl bg-[#0f0f0f] cursor-pointer group flex flex-col overflow-hidden ring-1 ring-white/10 shadow-2xl"
              style={{ minHeight: 480 }}
              onClick={() => setLocation(`/blog/${latest.id}`)}
            >
              {/* Dark top: label + framed image (60%) */}
              <div className="flex flex-col flex-[3] px-4 pt-5 pb-3 md:px-6 md:pt-6">
                <span className="text-[#B4F22E]/70 text-xs font-semibold uppercase tracking-widest mb-3">
                  Latest
                </span>
                <div className="relative flex-1 rounded-2xl overflow-hidden">
                  {latest.image_url ? (
                    <img
                      src={sanitizeImageUrl(latest.image_url)}
                      alt={latest.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <GradientCard gradient={latest.gradient} className="w-full h-full min-h-[200px]" />
                  )}
                  {/* Glass shine on image */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Text section (40%) with glass tint */}
              <div className="flex-[2] px-5 pt-4 pb-6 md:px-7 md:pb-7 bg-gradient-to-b from-[#0f0f0f] to-[#141414]">
                <h2 className="text-xl md:text-2xl font-bold text-white leading-snug mb-2 group-hover:text-[#B4F22E] transition-colors line-clamp-2">
                  {latest.title}
                </h2>
                {latest.excerpt && (
                  <p className="text-white/50 text-sm leading-relaxed mb-3 line-clamp-2">
                    {latest.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-white/30 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
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
      <section className="px-3 pb-2 sm:px-4 lg:px-6 relative z-10">
        <div className="max-w-2xl lg:max-w-4xl mx-auto">
          <Glass className="p-5 md:p-7">
            <h2 className="text-xl font-bold text-foreground mb-5">
              {selectedCategory === "All" ? "What's new?" : selectedCategory}
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl overflow-hidden animate-pulse flex flex-col" style={{ minHeight: 380 }}>
                    <div className="flex-[13] bg-muted/60" />
                    <div className="flex-[7] bg-muted/30 p-4 space-y-2">
                      <div className="h-4 bg-muted/60 rounded w-3/4" />
                      <div className="h-3 bg-muted/40 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : whatsNew.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No articles found.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {whatsNew.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setLocation(`/blog/${post.id}`)}
                      className="rounded-2xl overflow-hidden cursor-pointer group flex flex-col
                        ring-1 ring-black/10 dark:ring-white/10
                        shadow-lg shadow-black/10
                        hover:shadow-xl hover:shadow-[#B4F22E]/10
                        hover:ring-[#B4F22E]/30
                        transition-all duration-300"
                      style={{ minHeight: 380 }}
                    >
                      {/* Image — 65% */}
                      <div className="flex-[13] overflow-hidden relative">
                        {post.image_url ? (
                          <img
                            src={sanitizeImageUrl(post.image_url)}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <GradientCard gradient={post.gradient} className="w-full h-full" />
                        )}
                        {/* Subtle glass sheen on image */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10 pointer-events-none" />
                      </div>

                      {/* Text — 35% dark glass */}
                      <div className="flex-[7] bg-[#0f0f0f] flex flex-col justify-center px-4 py-4 relative">
                        {/* Glass top edge shimmer */}
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-[#B4F22E] transition-colors duration-200">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-white/45 text-xs leading-relaxed line-clamp-2 mt-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center mt-7">
                    <button
                      onClick={() => setVisible((v) => v + BATCH)}
                      className="px-8 py-3 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/60 dark:border-white/10 text-foreground text-sm font-semibold hover:bg-white/60 dark:hover:bg-white/10 transition-all"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </Glass>
        </div>
      </section>

      {/* ── SIGN UP CARD ── */}
      <section id="signup-section" className="px-3 py-2 pb-10 sm:px-4 lg:px-6 relative z-10">
        <div className="max-w-2xl lg:max-w-4xl mx-auto">
          <Glass className="p-6 md:p-8">
            {/* Lime accent line */}
            <div className="w-10 h-1 rounded-full bg-[#B4F22E] mb-5" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Sign up to receive weekly updates.
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed text-sm">
              Each week we break down complex crypto topics in just one minute, delivered directly to your inbox.
            </p>
            <button className="px-7 py-3.5 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-80 transition-opacity shadow-lg">
              Sign up
            </button>
          </Glass>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}
