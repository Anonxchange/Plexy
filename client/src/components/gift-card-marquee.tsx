import { useGiftCardProducts } from "@/hooks/use-reloadly";
import { useLocation } from "wouter";

/** Known popular gift card brand logos — shown while real data loads / as fallback */
const SEED_LOGOS = [
  { name: "Amazon",      logo: "https://logo.clearbit.com/amazon.com" },
  { name: "Netflix",     logo: "https://logo.clearbit.com/netflix.com" },
  { name: "Spotify",     logo: "https://logo.clearbit.com/spotify.com" },
  { name: "Apple",       logo: "https://logo.clearbit.com/apple.com" },
  { name: "Google Play", logo: "https://logo.clearbit.com/google.com" },
  { name: "Steam",       logo: "https://logo.clearbit.com/steampowered.com" },
  { name: "PlayStation", logo: "https://logo.clearbit.com/playstation.com" },
  { name: "Xbox",        logo: "https://logo.clearbit.com/xbox.com" },
  { name: "Uber",        logo: "https://logo.clearbit.com/uber.com" },
  { name: "Airbnb",      logo: "https://logo.clearbit.com/airbnb.com" },
  { name: "Visa",        logo: "https://logo.clearbit.com/visa.com" },
  { name: "Nike",        logo: "https://logo.clearbit.com/nike.com" },
  { name: "Adidas",      logo: "https://logo.clearbit.com/adidas.com" },
  { name: "DoorDash",    logo: "https://logo.clearbit.com/doordash.com" },
  { name: "eBay",        logo: "https://logo.clearbit.com/ebay.com" },
  { name: "Walmart",     logo: "https://logo.clearbit.com/walmart.com" },
];

interface LogoItem { name: string; logo: string }

export function GiftCardMarquee() {
  const [, setLocation] = useLocation();
  const { data } = useGiftCardProducts({ size: 40 });

  const logos: LogoItem[] = (() => {
    if (data?.content && data.content.length > 0) {
      const fromApi = data.content
        .filter(p => p.logoUrls?.[0])
        .map(p => ({ name: p.brand?.brandName || p.productName, logo: p.logoUrls[0] }));
      return fromApi.length >= 6 ? fromApi : SEED_LOGOS;
    }
    return SEED_LOGOS;
  })();

  // Duplicate for seamless infinite loop
  const track = [...logos, ...logos];

  const speed = `${Math.max(20, logos.length * 1.8)}s`;

  return (
    <div
      className="rounded-2xl border border-slate-100 dark:border-border bg-white dark:bg-card overflow-hidden shadow-sm cursor-pointer"
      onClick={() => setLocation("/gift-cards")}
    >
      {/* Header label */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 inline-block" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground">
            Gift Cards
          </span>
        </div>
        <span className="text-[11px] font-semibold text-primary bg-primary/8 px-2.5 py-0.5 rounded-full">
          Shop Now →
        </span>
      </div>

      {/* Marquee track */}
      <div className="relative overflow-hidden pb-3 px-0">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-white dark:from-card to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-white dark:from-card to-transparent pointer-events-none" />

        <style>{`
          @keyframes gift-marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .gift-marquee-track {
            display: flex;
            width: max-content;
            animation: gift-marquee ${speed} linear infinite;
          }
          .gift-marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="gift-marquee-track gap-3 px-4" style={{ gap: "12px", paddingLeft: "16px", paddingRight: "16px" }}>
          {track.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className="w-11 h-11 rounded-xl bg-white dark:bg-muted border border-slate-100 dark:border-border flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm"
            >
              <img
                src={item.logo}
                alt={item.name}
                className="w-8 h-8 object-contain"
                loading="lazy"
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
