const features = [
  {
    name: "Alex, Crypto Trader",
    quote: "\u201cFinally full control of my wallet without giving up my keys\u201d",
    description: "Moved from a custodial exchange. Now holds his own keys and trades peer-to-peer with zero platform risk.",
    image: "/images/trust-person-1.webp",
    alt: "Alex, crypto trader smiling against blue sky",
    namePosition: "top",
  },
  {
    name: "Priya, Online Merchant",
    quote: "\u201cNo more tracking, no more profiling \u2014 just pure privacy\u201d",
    description: "Runs an international shop. Switched to Pexly for private payments — no IP logging, no balance tracking.",
    image: "/images/trust-person-2.webp",
    alt: "Priya, online merchant holding phone against blue sky",
    namePosition: "bottom",
  },
  {
    name: "Tom, DeFi Enthusiast",
    quote: "\u201cThe instant alert saved me from a risky dApp connection\u201d",
    description: "Gets real-time alerts before connecting to any dApp. Caught a malicious contract before it could drain his wallet.",
    image: "/images/trust-person-3.webp",
    alt: "Tom, DeFi enthusiast excited with phone against blue sky",
    namePosition: "top",
  },
  {
    name: "Maria, Freelancer",
    quote: "\u201cHaven\u2019t missed a single opportunity since switching\u201d",
    description: "Receives cross-border payments instantly. No bank delays, no conversion fees eating into her earnings.",
    image: "/images/trust-person-4.webp",
    alt: "Maria, freelancer smiling confidently against blue sky",
    namePosition: "bottom",
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

      <div className="max-w-6xl mx-auto px-4 lg:px-6 relative">
        {/* Header — "Seamless finance / in action" style */}
        <div className="text-center mb-8">
          <p className="text-primary-foreground/80 text-xl md:text-2xl font-semibold mb-1">
            Seamless security
          </p>
          <h2 className="text-7xl md:text-8xl lg:text-9xl font-black italic leading-none tracking-tight">
            in action
          </h2>
        </div>

        {/* FEATURE CARDS — 2 col on desktop, 1 col on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {features.map((item, i) => (
            <div
              key={i}
              className="rounded-[22px] overflow-hidden relative"
              style={{ minHeight: 480 }}
            >
              {/* Full-bleed photo */}
              <img
                src={item.image}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />

              {/* Left blur vignette */}
              <div
                className="absolute inset-y-0 left-0 w-16 pointer-events-none z-10"
                style={{
                  backdropFilter: "blur(7px)",
                  WebkitBackdropFilter: "blur(7px)",
                  maskImage: "linear-gradient(to right, black 0%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to right, black 0%, transparent 100%)",
                }}
              />
              {/* Right blur vignette */}
              <div
                className="absolute inset-y-0 right-0 w-16 pointer-events-none z-10"
                style={{
                  backdropFilter: "blur(7px)",
                  WebkitBackdropFilter: "blur(7px)",
                  maskImage: "linear-gradient(to left, black 0%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to left, black 0%, transparent 100%)",
                }}
              />

              {/* Name at TOP (cards 1 & 3) */}
              {item.namePosition === "top" && (
                <>
                  {/* Top gradient for readability */}
                  <div
                    className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-10"
                    style={{
                      background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
                    }}
                  />
                  <div className="absolute top-0 left-0 right-0 px-5 pt-5 z-20">
                    <p className="text-white font-semibold text-lg drop-shadow-md">
                      {item.name}
                    </p>
                  </div>
                </>
              )}

              {/* Bottom text overlay — always present for quote & description */}
              <div
                className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-24 z-20"
                style={{
                  background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.55) 55%, transparent 100%)",
                }}
              >
                {/* Name at BOTTOM (cards 2 & 4) */}
                {item.namePosition === "bottom" && (
                  <p className="text-white font-semibold text-lg mb-2 drop-shadow-md">
                    {item.name}
                  </p>
                )}
                <p className="text-white font-bold text-xl leading-snug mb-3 italic">
                  {item.quote}
                </p>
                <p className="text-white/75 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Closing text block — after last card */}
        <div className="mt-10 text-center max-w-2xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-black text-primary-foreground leading-tight mb-4">
            Enterprise-grade security,<br />consumer-friendly experience
          </h3>
          <p className="text-primary-foreground/70 text-base md:text-lg mb-5 leading-relaxed">
            Pexly uses cutting-edge tech and encryption to keep your crypto safe from prying eyes and sticky fingers.
          </p>
          <p className="text-primary-foreground font-bold italic text-lg md:text-xl">
            Your security, your way, no manual required
          </p>
        </div>
      </div>
    </section>
  );
};
