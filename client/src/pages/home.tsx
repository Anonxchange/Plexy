import React, { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Loading skeleton for the hero section
const HeroSkeleton = () => (
  <div className="min-h-[85vh] flex items-center bg-muted animate-pulse">
    <div className="max-w-7xl mx-auto px-4 lg:px-8 w-full space-y-8">
      <div className="h-8 w-48 bg-muted-foreground/20 rounded-full" />
      <div className="space-y-4">
        <div className="h-20 w-3/4 bg-muted-foreground/20 rounded-xl" />
        <div className="h-20 w-1/2 bg-muted-foreground/20 rounded-xl" />
      </div>
      <div className="h-12 w-2/3 bg-muted-foreground/20 rounded-lg" />
    </div>
  </div>
);

// Generic section skeleton
const SectionSkeleton = () => (
  <div className="py-20 space-y-8">
    <div className="max-w-6xl mx-auto px-4 space-y-4">
      <div className="h-10 w-1/3 bg-muted animate-pulse rounded-lg mx-auto" />
      <div className="h-6 w-1/2 bg-muted animate-pulse rounded-lg mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

import { HeroSection } from "@/components/hero-section";
import { CryptoTicker } from "@/components/crypto-ticker";
import { FeatureCarousel } from "@/components/feature-carousel";
import { HowItWorks } from "@/components/how-it-works";
import { PaymentMethods } from "@/components/payment-methods";
import { TrustStats } from "@/components/trust-stats";
import { Testimonials } from "@/components/testimonials";
import { CTASection } from "@/components/cta-section";
import { useSchema, homePageSchema } from "@/hooks/use-schema";

export default function Home() {
  useSchema(homePageSchema, "home-page-schema");
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Artificial delay to show skeleton loading, or could be tied to data fetching
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <HeroSkeleton />
        <div className="h-14 bg-muted animate-pulse border-y border-border" />
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <HeroSection />
      <CryptoTicker />
      <HowItWorks />
      <FeatureCarousel />
      <PaymentMethods />
      <TrustStats />
      <Testimonials />
      <CTASection />
    </div>
  );
}
