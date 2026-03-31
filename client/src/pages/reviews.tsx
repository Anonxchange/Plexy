import { useHead } from "@unhead/react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Star, CheckCircle2, ExternalLink, PenLine, ChevronDown,
  MapPin, Mail, Globe, Info, ChevronRight, Shield, Zap,
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";

const TRUSTPILOT_URL = "https://www.trustpilot.com/review/pexly.app";
const TRUSTPILOT_WRITE_URL = "https://www.trustpilot.com/review/pexly.app/evaluate";

const ratingBreakdown = [
  { stars: 5, label: "5-star", count: 2847, percentage: 78, color: "#00b67a" },
  { stars: 4, label: "4-star", count: 542,  percentage: 15, color: "#73cf11" },
  { stars: 3, label: "3-star", count: 182,  percentage: 5,  color: "#ffce00" },
  { stars: 2, label: "2-star", count: 36,   percentage: 1,  color: "#ff8622" },
  { stars: 1, label: "1-star", count: 36,   percentage: 1,  color: "#ff3722" },
];

const allReviews = [
  { id: 1,  author: "Michael Chen",    location: "Singapore",         rating: 5, date: "2025-01-10", verified: true, title: "Best Crypto Platform I've Used",       content: "I've been using Pexly for over a year now and it's been fantastic. The interface is clean, transactions are instant, and I've never had any issues. Customer support is quick to respond when needed." },
  { id: 2,  author: "Sarah Johnson",   location: "United Kingdom",    rating: 5, date: "2025-01-08", verified: true, title: "Fast and Secure Transactions",          content: "The platform is very user-friendly and transactions are lightning fast. I especially love the variety of payment methods available. My first purchase here was seamless from start to finish." },
  { id: 3,  author: "Carlos Rodriguez",location: "Spain",             rating: 5, date: "2025-01-05", verified: true, title: "Excellent for Beginners",               content: "As someone new to crypto, Pexly made it really easy to get started. The verification process was straightforward and the interface is intuitive. Highly recommend for anyone looking to buy crypto!" },
  { id: 4,  author: "Aisha Mohammed",  location: "United Arab Emirates", rating: 4, date: "2025-01-03", verified: true, title: "Great Experience Overall",          content: "Very satisfied with Pexly. The app is smooth and reliable. Minor improvement areas around payment method selection, but once set up everything works perfectly. Customer service is excellent." },
  { id: 5,  author: "James Wilson",    location: "United States",     rating: 5, date: "2025-01-01", verified: true, title: "Trustworthy and Reliable",             content: "I've been using Pexly without a single problem. The security features give me peace of mind and the fees are very competitive compared to other platforms. Five stars, no question." },
  { id: 6,  author: "Yuki Tanaka",     location: "Japan",             rating: 5, date: "2024-12-28", verified: true, title: "Perfect for International Users",       content: "Being able to use the platform from Japan with multiple currency options is amazing. Pexly has made cryptocurrency accessible to me in ways other platforms haven't managed. Excellent service!" },
  { id: 7,  author: "Priya Sharma",    location: "India",             rating: 4, date: "2024-12-20", verified: true, title: "Smooth Onboarding",                     content: "Getting verified and making my first purchase took less than 10 minutes. The app feels professional and modern. Would love more coin options but overall very happy with the experience." },
  { id: 8,  author: "Lucas Müller",    location: "Germany",           rating: 5, date: "2024-12-15", verified: true, title: "Finally a Crypto App That Works",        content: "I've tried many crypto platforms and Pexly is by far the most polished. Everything just works. The gift card feature is a bonus I didn't expect and use regularly now." },
  { id: 9,  author: "Fatima Al-Hassan",location: "Nigeria",           rating: 3, date: "2024-12-10", verified: true, title: "Good but Room to Improve",              content: "Overall a solid platform. A few features feel incomplete and I had a delay with one transaction, but support resolved it quickly. I'll keep using it and hope to see continued improvements." },
  { id: 10, author: "Omar Al-Rashid",  location: "Saudi Arabia",      rating: 5, date: "2024-12-05", verified: true, title: "Exceptional Service",                   content: "Pexly is the best crypto app I've used in the Gulf region. The interface is clean and modern, transactions process within seconds, and the wallet management tools are second to none." },
  { id: 11, author: "Elena Vasquez",   location: "Mexico",            rating: 5, date: "2024-11-28", verified: true, title: "Reliable and Fast",                     content: "I've recommended Pexly to all my friends. The buy flow is incredibly smooth and I love how transparent the fees are. Nothing hidden, everything clear." },
  { id: 12, author: "David Okonkwo",   location: "Ghana",             rating: 4, date: "2024-11-20", verified: true, title: "Great Platform, Minor Quirks",           content: "Overall a really solid app. The staking feature is excellent and I like the rewards system. A couple of minor UI quirks but nothing that affects the experience much. Would highly recommend." },
  { id: 13, author: "Anna Kowalski",   location: "Poland",            rating: 5, date: "2024-11-15", verified: true, title: "Love the Simplicity",                   content: "I was intimidated by crypto before Pexly. The app made everything so easy to understand. The gift card feature is a great bonus — I use it every week. Five stars, no hesitation." },
  { id: 14, author: "Ravi Patel",      location: "Canada",            rating: 2, date: "2024-11-10", verified: true, title: "Needs Improvement",                     content: "The app looks great but I had trouble getting my verification approved — it took over a week. Once set up it works fine, but the onboarding process needs to be faster and clearer." },
  { id: 15, author: "Mei Lin",         location: "Taiwan",            rating: 5, date: "2024-11-05", verified: true, title: "My Go-To Crypto App",                   content: "Switched from two other platforms to Pexly six months ago and haven't looked back. The market prices section is incredibly useful and the UI is the cleanest I've seen in the industry." },
  { id: 16, author: "Tom Eriksson",    location: "Sweden",            rating: 4, date: "2024-10-28", verified: true, title: "Solid Product with Great Support",       content: "Had a question about a transaction and the support team resolved it within the hour. That's genuinely impressive for a crypto platform. The app itself is polished and performs well." },
  { id: 17, author: "Kwame Boateng",   location: "Kenya",             rating: 1, date: "2024-10-20", verified: true, title: "Disappointing Experience",              content: "I had a transaction stuck for three days with no explanation. Support took a long time to respond. I hope they improve, as the app itself looks promising. Not what I expected based on the reviews." },
  { id: 18, author: "Isabella Romano", location: "Italy",             rating: 5, date: "2024-10-15", verified: true, title: "Perfect for Daily Use",                 content: "I use Pexly every day to check prices and manage my portfolio. The explorer feature is great, and I love how everything is in one place. Genuinely the best crypto app available right now." },
];

const trustpilotPrinciples = [
  { title: "We're open to all",               body: "Anyone can write a review on Trustpilot — there are no barriers." },
  { title: "We champion verified reviews",    body: "Companies can invite their customers to leave reviews, making feedback more reliable." },
  { title: "We fight fake reviews",           body: "Our fraud detection systems and human moderators work around the clock to remove fake reviews." },
  { title: "We show the latest reviews",      body: "Recent reviews carry more weight, ensuring the most current experiences are surfaced." },
  { title: "We encourage constructive feedback", body: "Reviewers are guided to write useful, balanced reviews that help other consumers." },
  { title: "We verify reviewers",             body: "We use technical and human methods to verify that reviewers are real people with genuine experiences." },
  { title: "We advocate against bias",        body: "Pexly cannot edit, remove, or hide reviews. All genuine feedback is published as-is." },
];

type Tab = "reviews" | "about" | "summary";

const starColor = (rating: number) => {
  if (rating === 5) return "#00b67a";
  if (rating === 4) return "#73cf11";
  if (rating === 3) return "#ffce00";
  if (rating === 2) return "#ff8622";
  return "#ff3722";
};

function StarRow({ rating, size = 16, colored = false }: { rating: number; size?: number; colored?: boolean }) {
  const color = colored ? starColor(rating) : undefined;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{
          width: size, height: size,
          fill: i <= rating ? (color ?? "currentColor") : "transparent",
          color: i <= rating ? (color ?? "currentColor") : "var(--muted-foreground)",
          opacity: i <= rating ? 1 : 0.2,
        }} className={i <= rating && !color ? "fill-primary text-primary" : ""} />
      ))}
    </span>
  );
}

function RatingLabel({ score }: { score: number }) {
  if (score >= 4.5) return <span className="font-semibold text-[#00b67a]">Excellent</span>;
  if (score >= 3.5) return <span className="font-semibold text-[#73cf11]">Great</span>;
  if (score >= 2.5) return <span className="font-semibold text-[#ffce00]">Average</span>;
  return <span className="font-semibold text-muted-foreground">Poor</span>;
}

export default function Reviews() {
  useHead({
    title: "Reviews | Pexly",
    meta: [{ name: "description", content: "See what thousands of verified users say about Pexly — rated Excellent on Trustpilot." }],
  });

  const [activeTab, setActiveTab]         = useState<Tab>("reviews");
  const [filterRating, setFilterRating]   = useState<number | null>(null);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [openPrinciple, setOpenPrinciple] = useState<string | null>(null);
  const [page, setPage]                   = useState(1);
  const perPage = 5;

  const totalReviews  = ratingBreakdown.reduce((s, r) => s + r.count, 0);
  const averageRating = ratingBreakdown.reduce((s, r) => s + r.stars * r.count, 0) / totalReviews;
  const avgDisplay    = averageRating.toFixed(1);

  const filtered = useMemo(() => {
    const list = filterRating ? allReviews.filter((r) => r.rating === filterRating) : [...allReviews];
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filterRating]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  const tabs: { key: Tab; label: string }[] = [
    { key: "reviews", label: "Reviews" },
    { key: "about",   label: "About" },
    { key: "summary", label: "Summary" },
  ];

  /* ── Shared breakdown widget (used in both sidebar + reviews tab on mobile) ── */
  const BreakdownRows = ({ compact = false }: { compact?: boolean }) => (
    <div className={`space-y-${compact ? "2" : "3"}`}>
      {ratingBreakdown.map((item) => (
        <button
          key={item.stars}
          onClick={() => { setFilterRating(filterRating === item.stars ? null : item.stars); setPage(1); if (!compact) setActiveTab("reviews"); }}
          className={`w-full flex items-center gap-2.5 transition-opacity ${filterRating && filterRating !== item.stars ? "opacity-35" : ""}`}
        >
          <div className={`${compact ? "w-6 h-6" : "w-7 h-7"} rounded-md shrink-0 flex items-center justify-center`}
            style={{ backgroundColor: item.color + "22", border: `1.5px solid ${item.color}` }}>
            <Star style={{ width: compact ? 10 : 12, height: compact ? 10 : 12, fill: item.color, color: item.color }} />
          </div>
          <span className={`${compact ? "text-xs w-10" : "text-sm w-12"} text-muted-foreground shrink-0 text-left`}>{item.label}</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
          </div>
          <span className="text-xs text-muted-foreground w-7 text-right shrink-0">{item.percentage}%</span>
        </button>
      ))}
      {filterRating && (
        <button onClick={() => { setFilterRating(null); setPage(1); }} className="text-xs text-primary hover:underline">Clear filter</button>
      )}
    </div>
  );

  /* ── Tab content render functions (closures over state) ── */
  const renderReviews = () => (
    <>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        <Info className="h-4 w-4 inline mr-1.5 text-primary" />
        Companies on Trustpilot aren't allowed to offer incentives or pay to hide reviews.
        Reviews are the opinions of individual users and not of Trustpilot.{" "}
        <a href={TRUSTPILOT_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Read more</a>
      </div>

      {/* Mobile-only breakdown (desktop has it in sidebar) */}
      <div className="lg:hidden rounded-2xl border bg-background p-5">
        <div className="flex items-center gap-3 mb-4">
          <StarRow rating={Math.round(averageRating)} size={20} />
          <span className="font-bold text-xl">{avgDisplay}</span>
          <RatingLabel score={averageRating} />
        </div>
        <BreakdownRows />
      </div>

      {paginated.length === 0 ? (
        <div className="rounded-2xl border bg-background p-10 text-center">
          <p className="font-semibold mb-1">No reviews</p>
          <p className="text-sm text-muted-foreground">No reviews match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((review) => (
            <div key={review.id} className="rounded-2xl border bg-background p-5 lg:p-6">
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {review.author.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{review.author}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(review.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{review.location}</p>
                </div>
              </div>
              <StarRow rating={review.rating} size={16} colored />
              <p className="font-semibold text-sm mt-2 mb-1.5">{review.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
              {review.verified && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00b67a]" />
                  <span className="text-xs text-muted-foreground">Verified review</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 rounded-2xl border bg-background overflow-hidden">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="py-3.5 text-sm font-medium text-center border-r hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Previous
        </button>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className="py-3.5 text-sm font-medium text-center hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Next page
        </button>
      </div>

      <div className="rounded-2xl border bg-background p-5">
        <div className="flex items-center gap-2 mb-4">
          <p className="font-bold text-lg">The Trustpilot Experience</p>
          <svg viewBox="0 0 126.07 120.56" className="h-5 w-5 fill-[#00b67a]" aria-hidden="true">
            <path d="M63 0l19.5 59.9H126L82.7 96.9l16.7 51.4L63 112.5l-36.4 35.8 16.7-51.4L0 59.9h43.5z"/>
          </svg>
        </div>
        <div className="space-y-2">
          {trustpilotPrinciples.map((p) => (
            <Collapsible key={p.title} open={openPrinciple === p.title}
              onOpenChange={() => setOpenPrinciple(openPrinciple === p.title ? null : p.title)}>
              <CollapsibleTrigger className="w-full flex items-center justify-between rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors px-4 py-3 text-sm font-medium text-left">
                {p.title}
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openPrinciple === p.title ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-3 text-sm text-muted-foreground">{p.body}</CollapsibleContent>
            </Collapsible>
          ))}
        </div>
        <a href={TRUSTPILOT_URL} target="_blank" rel="noopener noreferrer" className="block mt-5">
          <Button className="w-full rounded-full h-11 font-semibold">Take a closer look</Button>
        </a>
      </div>
    </>
  );

  const renderAbout = () => (
    <>
      <div className="rounded-2xl border bg-background p-5 lg:p-6 space-y-4">
        <h2 className="font-bold text-lg">Company details</h2>
        <div>
          <Badge variant="outline" className="text-xs rounded-full mb-3">Cryptocurrency Service</Badge>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Written by the company</p>
          <p className={`text-sm text-muted-foreground leading-relaxed ${!showFullAbout ? "line-clamp-4" : ""}`}>
            Pexly is a self-custody crypto wallet and integrated digital services app built for full user control.
            Pexly is easy to use and designed for people who want to fully own and control their digital assets.
            From beginners to experienced users, Pexly makes it simple and secure to manage crypto, buy spot/perp
            trade, sell gift cards, and top up mobile airtime. Every feature is built with security and simplicity
            in mind — your keys, your crypto, always.
          </p>
          {!showFullAbout && (
            <button onClick={() => setShowFullAbout(true)} className="text-sm text-primary hover:underline mt-1">See more</button>
          )}
        </div>
      </div>
      <div className="rounded-2xl border bg-background p-5 lg:p-6 space-y-3">
        <h2 className="font-bold text-lg">Contact info</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" /><span>310005, United States</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <a href="mailto:support@pexly.app" className="text-primary hover:underline">support@pexly.app</a>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <a href="https://pexly.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">pexly.app</a>
        </div>
      </div>
    </>
  );

  const renderSummary = () => (
    <>
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <p className="font-semibold text-sm">You should know</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Pexly is a non-custodial crypto platform — you always control your funds.</p>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        </div>
      </div>
      <div className="rounded-2xl border bg-background p-4 flex items-center justify-between gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground flex-1">We use technology to protect platform integrity, but we don't fact-check reviews</p>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      <div className="rounded-2xl border bg-background p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-1">
          <StarRow rating={Math.round(averageRating)} size={22} />
          <span className="text-2xl font-bold">{avgDisplay}</span>
        </div>
        <RatingLabel score={averageRating} />
        <p className="text-sm text-muted-foreground mt-0.5">Based on {totalReviews.toLocaleString()} reviews</p>
        <a href={TRUSTPILOT_URL} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#00b67a] hover:underline">
          <svg viewBox="0 0 126.07 120.56" className="h-3.5 w-3.5 fill-[#00b67a]"><path d="M63 0l19.5 59.9H126L82.7 96.9l16.7 51.4L63 112.5l-36.4 35.8 16.7-51.4L0 59.9h43.5z"/></svg>
          Trustpilot
        </a>
      </div>
      <div className="rounded-2xl border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <p className="font-semibold">Recent reviews</p>
          <button onClick={() => setActiveTab("reviews")} className="text-sm text-primary hover:underline">See all</button>
        </div>
        {allReviews.slice(0, 3).map((r, i) => (
          <div key={r.id} className={`px-5 py-4 ${i < 2 ? "border-b" : ""}`}>
            <div className="flex items-center justify-between mb-1">
              <StarRow rating={r.rating} size={14} colored />
              <span className="text-xs text-muted-foreground">
                {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <p className="text-sm font-semibold mb-0.5">{r.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{r.content}</p>
            <p className="text-xs text-muted-foreground mt-1">— {r.author}, {r.location}</p>
          </div>
        ))}
      </div>
    </>
  );

  /* ── Shared sidebar content ── */
  const Sidebar = () => (
    <aside className="sticky top-6 space-y-4">
      {/* Company card */}
      <div className="bg-background rounded-2xl border p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border">
            <Zap className="h-8 w-8 text-primary fill-primary" />
          </div>
          <a href="https://pexly.app" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs">
              Visit website <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        </div>
        <Badge variant="outline" className="gap-1.5 mb-3 text-xs font-medium rounded-full">
          <CheckCircle2 className="h-3 w-3 text-[#00b67a]" /> Claimed profile
        </Badge>
        <h1 className="text-xl font-bold mb-2">Pexly</h1>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-sm border-b-2 border-foreground pb-0.5">Reviews {totalReviews.toLocaleString()}</span>
          <span className="text-muted-foreground">·</span>
          <StarRow rating={Math.round(averageRating)} size={16} />
          <span className="font-semibold text-sm">{avgDisplay}</span>
        </div>
        <p className="text-primary text-sm font-medium mb-5">Cryptocurrency Service</p>
        <a href={TRUSTPILOT_WRITE_URL} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full gap-2 rounded-full h-11 font-semibold">
            <PenLine className="h-4 w-4" /> Write a review
          </Button>
        </a>
      </div>

      {/* Rating + breakdown */}
      <div className="bg-background rounded-2xl border p-5">
        <div className="flex items-center gap-3 mb-1">
          <StarRow rating={Math.round(averageRating)} size={20} />
          <span className="text-xl font-bold">{avgDisplay}</span>
        </div>
        <RatingLabel score={averageRating} />
        <p className="text-sm text-muted-foreground mt-0.5 mb-4">Based on {totalReviews.toLocaleString()} reviews</p>
        <BreakdownRows compact />
      </div>

      {/* Contact */}
      <div className="bg-background rounded-2xl border p-5 space-y-2.5">
        <p className="font-semibold text-sm mb-1">Contact info</p>
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" /><span>310005, United States</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <a href="mailto:support@pexly.app" className="text-primary hover:underline">support@pexly.app</a>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <a href="https://pexly.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">pexly.app</a>
        </div>
      </div>

      {/* Trustpilot badge */}
      <a href={TRUSTPILOT_URL} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 bg-[#00b67a] hover:bg-[#00a167] transition-colors rounded-2xl px-5 py-3.5 shadow-sm">
        <svg viewBox="0 0 126.07 120.56" className="h-5 w-5 fill-white shrink-0"><path d="M63 0l19.5 59.9H126L82.7 96.9l16.7 51.4L63 112.5l-36.4 35.8 16.7-51.4L0 59.9h43.5z"/></svg>
        <div><p className="text-white font-bold text-sm leading-none">Trustpilot</p><p className="text-white/75 text-xs mt-0.5">See our reviews</p></div>
        <ExternalLink className="h-3.5 w-3.5 text-white/70 ml-auto shrink-0" />
      </a>
    </aside>
  );

  const TabBar = ({ border = false }: { border?: boolean }) => (
    <div className={`flex ${border ? "border-t" : ""}`}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => setActiveTab(t.key)}
          className={`flex-1 py-3.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === t.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}>
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">

      {/* ── DESKTOP ── */}
      <div className="hidden lg:block">
        {/* Breadcrumb */}
        <div className="bg-background border-b">
          <div className="container mx-auto max-w-6xl px-6 py-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Cryptocurrency Service</span><span>›</span>
            <span className="font-medium text-foreground">Pexly</span>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-6 py-8">
          <div className="grid grid-cols-[300px_1fr] gap-8 items-start">
            <Sidebar />

            <div className="min-w-0">
              {/* Tab bar */}
              <div className="bg-background rounded-2xl border mb-5 overflow-hidden">
                <div className="flex">
                  {tabs.map((t) => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                      className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === t.key
                          ? "border-foreground text-foreground bg-muted/30"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {activeTab === "reviews" && renderReviews()}
                {activeTab === "about"   && renderAbout()}
                {activeTab === "summary" && renderSummary()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="lg:hidden">
        <div className="bg-background border-b">
          <div className="container mx-auto max-w-2xl px-4 py-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border">
                <Zap className="h-8 w-8 text-primary fill-primary" />
              </div>
              <a href="https://pexly.app" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                  Visit website <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
            <Badge variant="outline" className="gap-1.5 mb-3 text-xs font-medium rounded-full">
              <CheckCircle2 className="h-3 w-3 text-[#00b67a]" /> Claimed profile
            </Badge>
            <h1 className="text-2xl font-bold mb-1">Pexly</h1>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm border-b-2 border-foreground pb-0.5">Reviews {totalReviews.toLocaleString()}</span>
              <span className="text-muted-foreground">·</span>
              <StarRow rating={Math.round(averageRating)} size={18} />
              <span className="font-semibold">{avgDisplay}</span>
            </div>
            <p className="text-primary text-sm font-medium mb-5">Cryptocurrency Service</p>
            <a href={TRUSTPILOT_WRITE_URL} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full gap-2 rounded-full h-12 text-base font-semibold">
                <PenLine className="h-4 w-4" /> Write a review
              </Button>
            </a>
          </div>
          <div className="container mx-auto max-w-2xl px-4">
            <TabBar border />
          </div>
        </div>
        <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4">
          {activeTab === "reviews" && renderReviews()}
          {activeTab === "about"   && renderAbout()}
          {activeTab === "summary" && renderSummary()}
        </div>
      </div>

      {/* Sticky bottom bar (mobile only) */}
      <div className="lg:hidden sticky bottom-0 bg-background/95 backdrop-blur border-t px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StarRow rating={Math.round(averageRating)} size={14} />
            <span className="text-sm font-semibold">{avgDisplay}</span>
            <span className="text-xs text-muted-foreground">· {totalReviews.toLocaleString()} reviews</span>
          </div>
          <a href={TRUSTPILOT_WRITE_URL} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-1.5 rounded-full shrink-0">
              <PenLine className="h-3.5 w-3.5" /> Write a review
            </Button>
          </a>
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}
