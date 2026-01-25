export function FeatureCarousel() {
  return (
    <section className="w-full py-8 lg:py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] items-center lg:gap-16">
          
          {/* LEFT — IMAGE */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl max-w-xl">
            <img
              src="/assets/svg-image-1%2023.svg"
              alt="Crypto feature illustration"
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
          </div>

          {/* RIGHT — TEXT */}
          <div className="text-left text-black dark:text-white max-w-md">
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">
              Live Crypto. Pay Anywhere. Get 10% Back.
            </h2>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Spend crypto seamlessly, earn rewards instantly, and enjoy
              next-generation payments wherever you go.
            </p>

            <button className="bg-lime-400 hover:bg-lime-300 text-black font-semibold px-5 py-2 rounded-full transition">
              Join our team
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
