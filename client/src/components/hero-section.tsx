import React, { lazy, Suspense } from "react";

const Globe = lazy(() => import("@/components/globe").then(m => ({ default: m.Globe })));
const HeroForm = lazy(() => import("@/components/hero-form").then(m => ({ default: m.HeroForm })));

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background min-h-[85vh] flex items-center">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <Suspense fallback={null}>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-40 pointer-events-none z-0"
          style={{ contain: "strict", willChange: "transform" }}
        >
          <ErrorBoundary fallback={<div className="w-full h-full bg-primary/5 rounded-full blur-3xl" />}>
            <Globe />
          </ErrorBoundary>
        </div>
      </Suspense>

      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 relative z-10 w-full">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* Text column — renders immediately, no heavy imports */}
          <div className="text-center lg:text-left space-y-6 lg:space-y-8 max-w-4xl mx-auto lg:mx-0 mb-8 lg:mb-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-xl shadow-lg">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-semibold">Trusted by 14M+ users worldwide</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold leading-[1.1] lg:leading-[1.05] tracking-tight">
              <span className="block text-foreground">Trade crypto</span>
              <span className="block bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                your way
              </span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-xl xl:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 lg:max-w-xl">
              Unlock the power of decentralized finance. Earn, shop, and manage crypto seamlessly simple, secure, and for everyone.
            </p>

            <div className="flex justify-between lg:justify-start items-center pt-4 max-w-[340px] mx-auto lg:mx-0 lg:max-w-none gap-4 lg:gap-12">
              <div className="text-center lg:text-left flex-1 lg:flex-none lg:w-[120px]">
                <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-foreground">140+</div>
                <div className="text-[10px] sm:text-sm text-muted-foreground uppercase tracking-wider whitespace-nowrap lg:mt-1">Countries</div>
              </div>
              <div className="text-center lg:text-left flex-1 lg:flex-none lg:w-[180px]">
                <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-foreground">500+</div>
                <div className="text-[10px] sm:text-sm text-muted-foreground uppercase tracking-wider whitespace-nowrap lg:mt-1">Payment methods</div>
              </div>
              <div className="text-center lg:text-left flex-1 lg:flex-none lg:w-[120px]">
                <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-foreground">14M+</div>
                <div className="text-[10px] sm:text-sm text-muted-foreground uppercase tracking-wider whitespace-nowrap lg:mt-1">Users</div>
              </div>
            </div>
          </div>

          {/* Form column — lazy-loaded, does not block LCP text above */}
          <div className="max-w-3xl mx-auto lg:mx-0 w-full">
            <Suspense fallback={
              <div className="h-[450px] bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl animate-pulse" />
            }>
              <HeroForm />
            </Suspense>
          </div>

        </div>
      </div>
    </section>
  );
}
