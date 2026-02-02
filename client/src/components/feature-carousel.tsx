export function FeatureCarousel() {
  return (
    <section className="w-full py-12 lg:py-20 bg-background overflow-hidden">
      <div className="max-w-8xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16">
          
          {/* LEFT — IMAGE */}
          <div className="relative">
            <img
              src="/assets/svg-image-1-2.svg"
              alt="Crypto feature illustration"
              className="w-full h-auto"
              width="600"
              height="450"
            />
          </div>

          {/* RIGHT — TEXT */}
          <div className="text-left space-y-6 lg:pl-16">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Live Crypto. <br />
                <span className="text-primary">Pay Anywhere.</span> <br />
                Get 10% Back.
              </h2>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Spend crypto seamlessly, earn rewards instantly, and enjoy
                next-generation payments wherever you go.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-full text-base transition-all shadow-md active:scale-95">
                Join our team
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
