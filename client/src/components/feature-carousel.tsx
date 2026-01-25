export function FeatureCarousel() {
  return (
    <section className="w-full py-12 lg:py-24 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-20">
          
          {/* LEFT — IMAGE */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-500">
            <img
              src="/assets/svg-image-1-2.svg"
              alt="Crypto feature illustration"
              className="w-full h-auto object-cover aspect-[4/3]"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none" />
          </div>

          {/* RIGHT — TEXT */}
          <div className="text-left space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Live Crypto. <br />
                <span className="text-primary">Pay Anywhere.</span> <br />
                Get 10% Back.
              </h2>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Spend crypto seamlessly, earn rewards instantly, and enjoy
                next-generation payments wherever you go.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-full text-lg transition-all shadow-lg hover:shadow-primary/20 active:scale-95">
                Join our team
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
