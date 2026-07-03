import { useHead } from "@unhead/react";
import { useRoute, Link } from "wouter";
import {
  ChevronRight,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Home as HomeIcon,
  ArrowLeft,
  AlertTriangle,
  Info,
  PlayCircle,
} from '@/lib/icons';
import { useState } from "react";
import { FloatingChatButton } from "@/components/floating-chat-button";
import { supportArticles, supportCategories } from "@/lib/support-content";

/* ─── Tip / Warning callout boxes ─────────────────────────────────────── */

const TipBox = ({ text }: { text: string }) => (
  <div className="flex gap-3 rounded-xl border border-blue-500/25 bg-blue-500/8 px-4 py-3.5 my-5">
    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-foreground/90 leading-relaxed">{text}</p>
  </div>
);

const WarningBox = ({ text }: { text: string }) => (
  <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3.5 my-5">
    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-foreground/90 leading-relaxed">{text}</p>
  </div>
);

/* ─── YouTube embed ───────────────────────────────────────────────────── */

const VideoEmbed = ({ url }: { url: string }) => {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="my-6 rounded-2xl overflow-hidden border border-border shadow-sm bg-black aspect-video relative">
      {playing ? (
        <iframe
          src={`${url}?autoplay=1`}
          title="Guide video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <button
          onClick={() => setPlaying(true)}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/90 to-primary/70 hover:from-primary hover:to-primary/80 transition-all group"
          aria-label="Play video guide"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <PlayCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white/90 text-sm font-semibold tracking-wide">Watch video guide</span>
        </button>
      )}
    </div>
  );
};

/* ─── Paragraph renderer (handles \n\n as paragraph breaks) ────────────── */

const ArticleBody = ({ text }: { text: string }) => {
  const paragraphs = text.split("\n\n").filter(Boolean);
  if (paragraphs.length <= 1) {
    return <p className="text-foreground/80 leading-relaxed mb-4">{text}</p>;
  }
  return (
    <div className="space-y-4 mb-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-foreground/80 leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
};

/* ─── Main page ──────────────────────────────────────────────────────── */

const SupportArticlePage = () => {
  const [, params] = useRoute("/support/article/:slug");
  const slug = params?.slug ?? "";
  const article = supportArticles[slug];

  const [helpful, setHelpful] = useState<"yes" | "no" | null>(null);

  useHead({
    title: article ? `${article.title} | Pexly Help` : "Article not found | Pexly Help",
    meta: [{ name: "description", content: article?.description ?? "" }],
  });

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-2xl font-bold text-foreground">Article not found</p>
        <p className="text-muted-foreground text-sm">This article may have moved or been removed.</p>
        <Link href="/support" className="text-primary font-medium hover:underline underline-offset-2 text-sm">
          ← Back to Help Center
        </Link>
        <FloatingChatButton />
      </div>
    );
  }

  const relatedArticles = (article.related ?? [])
    .map((s) => supportArticles[s])
    .filter(Boolean);

  const sectionsWithHeadings = article.sections.filter((s) => s.heading);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Slim hero / nav bar */}
      <header className="bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
        <div
          className="absolute -right-24 top-1/2 w-64 h-64 pointer-events-none"
          style={{ background: "#4F46E5", borderRadius: "50%", transform: "translate(40%, -40%)", opacity: 0.5 }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
          <nav className="flex items-center justify-between mb-4">
            <Link href="/" className="text-black font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
              Pexly
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 text-black/80 hover:text-black hover:bg-black/5 rounded-lg transition-colors text-sm font-medium">
                <HomeIcon className="w-3.5 h-3.5" />
                Home
              </Link>
              <Link href="/support" className="px-3 py-1.5 text-black/80 hover:text-black hover:bg-black/5 rounded-lg transition-colors text-sm font-medium">
                Help Center
              </Link>
            </div>
          </nav>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-black/70 text-xs flex-wrap">
            <Link href="/support" className="hover:text-black transition-colors">Help Center</Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <Link href={`/support/${article.categorySlug}`} className="hover:text-black transition-colors">
              {article.category}
            </Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <span className="text-black font-medium truncate max-w-[200px]">{article.title}</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ── Main article ── */}
          <article className="flex-1 min-w-0">
            {/* Back link */}
            <Link
              href={`/support/${article.categorySlug}`}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {article.category}
            </Link>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
              {article.title}
            </h1>
            <p className="text-muted-foreground mb-6 text-base leading-relaxed">{article.description}</p>

            {/* Meta */}
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-border">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                {article.readTime}
              </span>
              <span className="text-xs text-muted-foreground">Updated Jul 2025</span>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              {article.sections.map((section, si) => (
                <section key={si} id={`section-${si}`}>
                  {section.heading && (
                    <h2 className="text-xl font-semibold text-foreground mb-4">{section.heading}</h2>
                  )}

                  {section.content && <ArticleBody text={section.content} />}

                  {/* Video embed (appears after section intro, before steps) */}
                  {section.videoUrl && <VideoEmbed url={section.videoUrl} />}

                  {/* Warning box */}
                  {section.warning && <WarningBox text={section.warning} />}

                  {/* Steps */}
                  {section.steps && section.steps.length > 0 && (
                    <ol className="space-y-5 mt-4">
                      {section.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-4">
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm mb-1">{step.title}</p>
                            <p className="text-foreground/75 text-sm leading-relaxed">{step.description}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* Tip box (appears after steps) */}
                  {section.tip && <TipBox text={section.tip} />}
                </section>
              ))}
            </div>

            {/* Was this helpful */}
            <div className="mt-14 pt-8 border-t border-border">
              {helpful === null ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <p className="text-sm font-medium text-foreground">Was this article helpful?</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHelpful("yes")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 hover:border-primary/40 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Yes, thanks
                    </button>
                    <button
                      onClick={() => setHelpful("no")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Not really
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${helpful === "yes" ? "bg-green-500/15" : "bg-muted"}`}>
                    {helpful === "yes"
                      ? <ThumbsUp className="w-4 h-4 text-green-500" />
                      : <ThumbsDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {helpful === "yes" ? "Glad that helped!" : "Thanks for the feedback."}
                    </p>
                    {helpful === "no" && (
                      <Link href="/contact" className="text-xs text-primary hover:underline underline-offset-2">
                        Submit a support request →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
            {/* Table of contents */}
            {sectionsWithHeadings.length > 1 && (
              <div className="bg-card border border-border rounded-xl p-4 sticky top-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  In this article
                </p>
                <nav className="space-y-1">
                  {sectionsWithHeadings.map((section, si) => (
                    <a
                      key={si}
                      href={`#section-${article.sections.indexOf(section)}`}
                      className="block text-sm text-muted-foreground hover:text-foreground hover:text-primary transition-colors py-1 leading-snug border-l-2 border-transparent hover:border-primary pl-3"
                    >
                      {section.heading}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Related articles
                </p>
                <div className="space-y-1">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/support/article/${rel.slug}`}
                      className="flex items-start gap-2 py-2 group"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
                        {rel.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Still need help */}
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-foreground mb-1">Still stuck?</p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Our support team responds within 24 to 48 hours.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                Contact support
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 px-6 mt-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© Pexly Technologies, Inc.</span>
          <div className="flex items-center gap-4">
            <Link href="/support" className="hover:text-foreground transition-colors">Help Center</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

      <FloatingChatButton />
    </div>
  );
};

export default SupportArticlePage;
