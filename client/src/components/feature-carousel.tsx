export function FeatureCarousel() {
  return (
    <section className="w-full py-16 lg:py-24 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
          
          {/* LEFT — IMAGE */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="/assets/svg-image-1%2023.svg"
              alt="Crypto feature illustration"
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* RIGHT — TEXT */}
          <div className="text-left text-white">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Live Crypto. Pay Anywhere. Get 10% Back.
            </h2>

            <p className="text-gray-300 mb-6 max-w-md">
              Spend crypto seamlessly, earn rewards instantly, and enjoy
              next-generation payments wherever you go.
            </p>

            <button className="bg-lime-400 hover:bg-lime-300 text-black font-semibold px-6 py-3 rounded-full transition">
              Join our team
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
