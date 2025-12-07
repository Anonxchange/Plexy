export function FeatureCarousel() {
  return (
    <div className="w-full py-12 md:py-20 lg:py-24 overflow-hidden relative">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-3">
          Live Crypto. Pay Anywhere. Get 10% Back.
        </h2>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-auto object-cover"
            poster="/assets/person_trading_crypto_at_desk.jpg"
          >
            <source src="/assets/person_trading_crypto_at_desk.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
