const features = [
  {
    name: "Alex, Crypto Trader",
    quote: "\u201cFinally full control of my wallet without giving up my keys\u201d",
    description: "Moved from a custodial exchange. Now holds his own keys and trades peer-to-peer with zero platform risk.",
    image: "/images/trust-person-1.webp",
    alt: "Alex, crypto trader smiling against blue sky",
  },
  {
    name: "Priya, Online Merchant",
    quote: "\u201cNo more tracking, no more profiling \u2014 just pure privacy\u201d",
    description: "Runs an international shop. Switched to Pexly for private payments — no IP logging, no balance tracking.",
    image: "/images/trust-person-2.webp",
    alt: "Priya, online merchant holding phone against blue sky",
  },
  {
    name: "Tom, DeFi Enthusiast",
    quote: "\u201cThe instant alert saved me from a risky dApp connection\u201d",
    description: "Gets real-time alerts before connecting to any dApp. Caught a malicious contract before it could drain his wallet.",
    image: "/images/trust-person-3.webp",
    alt: "Tom, DeFi enthusiast excited with phone against blue sky",
  },
  {
    name: "Maria, Freelancer",
    quote: "\u201cHaven\u2019t missed a single opportunity since switching\u201d",
    description: "Receives cross-border payments instantly. No bank delays, no conversion fees eating into her earnings.",
    image: "/images/trust-person-4.webp",
    alt: "Maria, freelancer smiling confidently against blue sky",
  },
];

export const TrustStats = () => {
  return (
    <section
      id="features"
      className="py-12 bg-primary text-primary-foreground relative overflow-hidden rounded-3xl -mt-10 z-10"
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Centre glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[96rem] mx-auto px-4 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-primary-foreground/80 text-xl md:text-2xl font-semibold mb-1">
            Seamless security
          </p>
          <h2 className="text-7xl md:text-8xl lg:text-9xl font-black italic leading-none tracking-tight">
            in action
          </h2>
        </div>

        {/* FEATURE CARDS — 1 col on mobile (unchanged), 4 col on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {features.map((item, i) => (
            <div
              key={i}
              className="rounded-[32px] overflow-hidden relative h-[480px] lg:h-[560px] xl:h-[640px] 2xl:h-[720px]"
            >
              {/* Full-bleed photo */}
              <img
                src={item.image}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />

              {/* Name — always at top */}
              <div className="absolute top-0 left-0 right-0 px-5 pt-5 z-20">
                <p className="text-white font-semibold text-lg" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.55)" }}>
                  {item.name}
                </p>
              </div>

              {/* Bottom section — quote then description */}
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-6 z-20">
                <p className="text-white font-bold text-lg leading-snug italic mb-3">
                  {item.quote}
                </p>
                <p
                  className="text-white/90 text-sm leading-relaxed"
                  style={{
                    backdropFilter: "blur(3px)",
                    WebkitBackdropFilter: "blur(3px)",
                  }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Closing text block */}
        <div className="mt-10 text-center max-w-2xl mx-auto lg:max-w-4xl lg:text-left lg:flex lg:items-end lg:justify-between lg:gap-12">
          <div className="lg:max-w-xl">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary-foreground leading-tight mb-4">
              Enterprise-grade security,<br />consumer-friendly experience
            </h3>
            <p className="text-primary-foreground/70 text-base md:text-lg mb-5 leading-relaxed">
              Pexly uses cutting-edge tech and encryption to keep your crypto safe from prying eyes and sticky fingers.
            </p>
            <p className="text-primary-foreground font-bold italic text-lg md:text-xl">
              Your security, your way, no manual required
            </p>
          </div>

          {/* Desktop-only feature pills */}
          <div className="hidden lg:flex flex-col gap-3 shrink-0 pb-1">
            {[
              "End-to-end encryption",
              "Zero knowledge proofs",
              "On-chain escrow protection",
              "Biometric authentication",
              "Real-time threat alerts",
            ].map((feat) => (
              <div
                key={feat}
                className="flex items-center gap-3 bg-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors rounded-xl px-4 py-3"
              >
                <div className="w-5 h-5 rounded-full bg-primary-foreground/25 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span className="text-primary-foreground/90 text-sm font-medium whitespace-nowrap">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
