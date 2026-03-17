const partners = [
  { name: "AsterDEX", logo: "https://assets.coingecko.com/coins/images/30980/small/token-logo.png" },
  { name: "RocketX", logo: "https://cdn.rocketx.exchange/pd135zq/images/exchange/rocketx_pool_10.png" },
  { name: "Coinbase", logo: "https://logo.clearbit.com/coinbase.com" },
  { name: "Reloadly", logo: "https://logo.clearbit.com/reloadly.com" },
  { name: "Polymarket", logo: "https://logo.clearbit.com/polymarket.com" },
  { name: "Shopify", logo: "https://logo.clearbit.com/shopify.com" },
];

export function PartnerCarousel() {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-900/50 py-4 overflow-hidden border-y border-zinc-200 dark:border-zinc-800 backdrop-blur-sm" style={{ contain: "content" }}>
      {/*
        will-change:transform promotes this element to its own compositor layer.
        The translateX animation then runs entirely on the GPU thread and cannot
        trigger a layout recalculation on the main thread.
      */}
      <div
        className="flex gap-16 items-center animate-scroll [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)] [will-change:transform]"
      >
        {[...partners, ...partners].map((partner, index) => (
          <div 
            key={`${partner.name}-${index}`} 
            className="flex items-center gap-3 min-w-fit whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity"
          >
            {partner.logo && (
              <img 
                src={partner.logo} 
                alt=""
                role="presentation"
                className="w-8 h-8 object-contain rounded-sm"
                loading="lazy"
              />
            )}
            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-base tracking-tight">
              {partner.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
