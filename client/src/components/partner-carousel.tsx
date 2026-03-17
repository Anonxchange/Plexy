const partners = [
  { name: "AsterDEX", logo: "/logos/IMG_4583.png", invert: false },
  { name: "RocketX", logo: "/logos/IMG_4589.webp", invert: false },
  { name: "Coinbase", logo: "/logos/coinbase-logo.svg", invert: true },
  { name: "Reloadly", logo: "/logos/IMG_4585.png", invert: false },
  { name: "Polymarket", logo: "/logos/IMG_4584.png", invert: false },
  { name: "Shopify", logo: "/logos/shopify-logo.svg", invert: true },
  { name: "GoPlus Security", logo: "/logos/IMG_4590.webp", invert: false },
];

export function PartnerCarousel() {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-900/50 py-4 overflow-hidden border-y border-zinc-200 dark:border-zinc-800 backdrop-blur-sm" style={{ contain: "content" }}>
      <div
        className="animate-scroll [will-change:transform]"
        style={{
          display: "flex",
          gap: "4rem",
          alignItems: "center",
          width: "max-content",
          maskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
        }}
      >
        {[...partners, ...partners].map((partner, index) => (
          <div
            key={`${partner.name}-${index}`}
            className="flex items-center gap-3 whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity"
          >
            <img
              src={partner.logo}
              alt=""
              role="presentation"
              width={32}
              height={32}
              className={`w-8 h-8 object-contain rounded-sm${partner.invert ? " dark:brightness-0 dark:invert" : ""}`}
              loading="lazy"
              decoding="async"
            />
            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-base tracking-tight">
              {partner.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
