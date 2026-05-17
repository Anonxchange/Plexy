import { useGiftCardProducts } from "@/hooks/use-reloadly";
import { useLocation } from "wouter";
import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

const SEED_CARDS = [
  { name: "Netflix",     logo: "https://logo.clearbit.com/netflix.com",      bg: "#E50914" },
  { name: "Spotify",     logo: "https://logo.clearbit.com/spotify.com",      bg: "#1DB954" },
  { name: "Apple",       logo: "https://logo.clearbit.com/apple.com",        bg: "#1c1c1e" },
  { name: "Google Play", logo: "https://logo.clearbit.com/play.google.com",  bg: "#4285F4" },
  { name: "Amazon",      logo: "https://logo.clearbit.com/amazon.com",       bg: "#FF9900" },
  { name: "Steam",       logo: "https://logo.clearbit.com/steampowered.com", bg: "#1B2838" },
  { name: "PlayStation", logo: "https://logo.clearbit.com/playstation.com",  bg: "#003087" },
  { name: "Xbox",        logo: "https://logo.clearbit.com/xbox.com",         bg: "#107C10" },
  { name: "Nike",        logo: "https://logo.clearbit.com/nike.com",         bg: "#111111" },
  { name: "Airbnb",      logo: "https://logo.clearbit.com/airbnb.com",       bg: "#FF5A5F" },
  { name: "Uber",        logo: "https://logo.clearbit.com/uber.com",         bg: "#000000" },
  { name: "DoorDash",    logo: "https://logo.clearbit.com/doordash.com",     bg: "#FF3008" },
];

interface CardItem { name: string; logo: string; bg?: string }

function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-muted animate-pulse" style={{ flex: "1 1 0", minWidth: "72px" }}>
      <div className="h-[72px] w-full bg-muted-foreground/10" />
    </div>
  );
}

function GiftCard({ card, onClick }: { card: CardItem; onClick: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = card.name.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className="rounded-2xl overflow-hidden border border-border hover:scale-[1.04] active:scale-95 transition-transform focus:outline-none"
      style={{ flex: "1 1 0", minWidth: "72px", scrollSnapAlign: "start", background: card.bg ?? "hsl(var(--muted))" }}
    >
      <div className="h-[72px] w-full flex items-center justify-center p-2">
        {imgFailed ? (
          <span
            className="text-3xl font-black select-none"
            style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
          >
            {initial}
          </span>
        ) : (
          <img
            src={card.logo}
            alt={card.name}
            className="w-full h-full object-contain drop-shadow-sm"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
    </button>
  );
}

export function GiftCardMarquee() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGiftCardProducts({ size: 40 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const cards: CardItem[] = (() => {
    if (data?.content && data.content.length > 0) {
      const seen = new Set<string>();
      const unique: CardItem[] = [];
      for (const p of data.content) {
        if (!p.logoUrls?.[0]) continue;
        const key = (p.brand?.brandName || p.productName || "").toLowerCase().trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        unique.push({ name: p.brand?.brandName || p.productName, logo: p.logoUrls[0] });
      }
      return unique.length >= 4 ? unique : SEED_CARDS;
    }
    return SEED_CARDS;
  })();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-2 cursor-pointer"
        onClick={() => setLocation("/gift-cards")}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 inline-block" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Gift Cards
          </span>
        </div>
        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-primary">
          Shop Now <ChevronRight className="w-3 h-3" />
        </span>
      </div>

      {/* Horizontal scroll row */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto px-4 pb-3 scrollbar-hide"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" as any }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : cards.map(card => (
              <GiftCard
                key={card.name}
                card={card}
                onClick={() => setLocation("/gift-cards")}
              />
            ))}
      </div>
    </div>
  );
}
