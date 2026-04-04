import { useHead } from "@unhead/react";
import {
  Menu,
  Search,
  User,
  ChevronRight,
  Star,
  Shield,
  RefreshCw,
  Layout,
  ShoppingBag,
  History,
  TrendingUp,
  Home as HomeIcon,
  Phone,
  MessageCircle,
  Sparkles,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  X,
  Mail,
  LucideIcon,
} from "lucide-react";
import { FloatingChatButton } from "@/components/floating-chat-button";
import { useState } from "react";
import { Link } from "wouter";

interface Category {
  icon: LucideIcon;
  title: string;
  description: string;
  slug: string;
}

interface CategoryCardProps extends Category {
  delay?: number;
}

const CategoryCard = ({ icon: Icon, title, description, slug, delay = 0 }: CategoryCardProps) => (
  <Link
    href={`/support/${slug}`}
    className="group flex items-center justify-between p-5 border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer animate-fade-in"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="flex items-start gap-4 flex-1 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground mb-0.5">{title}</h3>
        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{description}</p>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-3" />
  </Link>
);

const categories: Category[] = [
  {
    icon: Sparkles,
    title: "Get started",
    description: "Create your Pexly wallet, customize your accounts, and learn about the key features.",
    slug: "get-started",
  },
  {
    icon: ShoppingBag,
    title: "Shop",
    description: "Buy products with crypto or list your own items to sell in the Pexly marketplace.",
    slug: "shop",
  },
  {
    icon: User,
    title: "Account and settings",
    description: "Manage your wallets, account names, recovery phrases, privacy, and device settings in Pexly.",
    slug: "account-settings",
  },
  {
    icon: RefreshCw,
    title: "Buy and sell tokens",
    description: "Use on-ramps and off-ramps to buy, sell, or withdraw tokens — and fix common purchase issues.",
    slug: "buy-sell",
  },
  {
    icon: Layout,
    title: "Apps",
    description: "Connect Pexly to apps, manage your connection settings, and troubleshoot connections.",
    slug: "apps",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Protect your wallet from scams, phishing, and hacks — plus tips on staying safe.",
    slug: "security",
  },
  {
    icon: TrendingUp,
    title: "Staking",
    description: "Use liquid staking with PSOL or stake SOL natively to earn rewards.",
    slug: "staking",
  },
  {
    icon: History,
    title: "Trading",
    description: "Swap, bridge, or trade tokens and perps — plus understand gas, slippage, and trade execution.",
    slug: "trading",
  },
];

const promotedArticles = [
  { title: "Get started with Pexly", slug: "get-started-with-pexly" },
  { title: "Create a new Pexly wallet", slug: "create-wallet" },
  { title: "Receive tokens in Pexly", slug: "receive-tokens" },
  { title: "How to buy in the Pexly Shop", slug: "shop-guide" },
  { title: "Send tokens from Pexly", slug: "send-tokens" },
  { title: "Buy tokens in Pexly", slug: "buy-tokens" },
  { title: "Get help from Pexly", slug: "get-help" },
  { title: "What to do if I was scammed?", slug: "scam-recovery" },
];

const HelpCenter = () => {
  useHead({
    title: "Help Center | Pexly",
    meta: [{ name: "description", content: "Browse support articles or contact our team for help with your Pexly wallet." }],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const q = searchQuery.trim().toLowerCase();

  const filteredCategories = q
    ? categories.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    : categories;

  const filteredArticles = q
    ? promotedArticles.filter((a) => a.title.toLowerCase().includes(q))
    : promotedArticles;

  const hasResults = filteredCategories.length > 0 || filteredArticles.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Warning Banner */}
      <div className="bg-[#FF7A45] py-3 px-6 text-white text-center flex items-center justify-center gap-3">
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">!</div>
        <p className="text-sm font-medium">
          Pexly Support will NEVER DM you or ask for your Secret Recovery Phrase!
        </p>
      </div>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[340px] overflow-hidden bg-gradient-to-br from-primary to-primary/80">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -left-32 top-1/2 w-[500px] h-[500px] animate-curve-float"
              style={{ background: "#4F46E5", borderRadius: "50%", transform: "translate(-60%, -30%)" }}
            />
            <div
              className="absolute -right-32 top-1/2 w-[500px] h-[500px] animate-curve-float-reverse"
              style={{ background: "#4F46E5", borderRadius: "50%", transform: "translate(60%, -20%)" }}
            />
            <Sparkles className="absolute top-20 left-[15%] w-4 h-4 text-white/60 animate-sparkle" />
            <Sparkles className="absolute top-32 right-[20%] w-3 h-3 text-white/60 animate-sparkle-delay-1" />
            <Sparkles className="absolute bottom-24 left-[25%] w-3 h-3 text-white/60 animate-sparkle-delay-2" />
            <Sparkles className="absolute bottom-32 right-[15%] w-4 h-4 text-white/60 animate-sparkle" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
            {/* Nav */}
            <nav className="flex items-center justify-between mb-12">
              <Link href="/" className="text-black font-bold text-2xl tracking-tight hover:opacity-80 transition-opacity">
                Pexly
              </Link>

              {/* Desktop nav links */}
              <div className="hidden md:flex items-center gap-1">
                <Link href="/" className="flex items-center gap-2 px-4 py-2 text-black/80 hover:text-black hover:bg-black/5 rounded-lg transition-colors text-sm font-medium">
                  <HomeIcon className="w-4 h-4" />
                  Home
                </Link>
                <Link href="/contact" className="flex items-center gap-2 px-4 py-2 text-black/80 hover:text-black hover:bg-black/5 rounded-lg transition-colors text-sm font-medium">
                  <Mail className="w-4 h-4" />
                  Contact
                </Link>
              </div>

              {/* Mobile hamburger */}
              <div className="relative md:hidden">
                <button
                  className="text-black p-2 hover:bg-black/5 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Open menu"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-xl border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-muted/50 transition-colors text-sm">
                      <HomeIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Home</span>
                    </Link>
                    <Link href="/contact" className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-muted/50 transition-colors border-t border-border text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Contact</span>
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">How can we help you?</h1>
              <div className="relative max-w-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for answers…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-4 pl-14 pr-10 rounded-full bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 text-base shadow-lg"
                />
                {searchQuery && (
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          {q && !hasResults && (
            <div className="text-center py-20">
              <p className="text-foreground text-lg mb-2 font-medium">No results for "{searchQuery}"</p>
              <p className="text-muted-foreground text-sm">
                Try different keywords or{" "}
                <Link href="/contact" className="text-primary underline underline-offset-2 font-medium">
                  contact support
                </Link>
                .
              </p>
            </div>
          )}

          {/* Desktop two-column layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left — categories */}
            {filteredCategories.length > 0 && (
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-foreground mb-3 px-1">
                  {q ? "Matching categories" : "Browse by topic"}
                </h2>
                {/* Two-column grid on md+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCategories.map((category, index) => (
                    <div
                      key={category.title}
                      className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
                    >
                      <CategoryCard {...category} delay={index * 0.04} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Right — promoted articles + contact CTA */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
              {filteredArticles.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-3 px-1">
                    {q ? "Matching articles" : "Popular articles"}
                  </h2>
                  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    {filteredArticles.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/support/article/${article.slug}`}
                        className="group flex items-center justify-between px-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Star className="w-4 h-4 text-[#FF7A45] fill-[#FF7A45] flex-shrink-0" />
                          <span className="text-foreground text-sm font-medium truncate">{article.title}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Still need help */}
              {!q && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-5 text-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-foreground font-semibold text-sm mb-1">Still need help?</p>
                  <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
                    Our support team is here to help you with anything.
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                  >
                    <Mail className="w-4 h-4" />
                    Submit a request
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 mt-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">© Pexly Technologies, Inc.</p>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                <Globe className="w-4 h-4" />
                <span>English (US)</span>
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </button>

              <div className="flex items-center gap-2">
                <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" aria-label="Twitter" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <FloatingChatButton />
    </div>
  );
};

export default HelpCenter;
