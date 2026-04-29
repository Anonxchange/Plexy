import { useHead } from "@unhead/react";
import { lazy, Suspense, useRef, useState, useEffect } from "react";
import { HeroSection } from "@/components/hero-section";
import { AppFooter } from "@/components/app-footer";
import { CTASection } from "@/components/cta-section";
import { TrustStats } from "@/components/trust-stats";
import { useSchema, homePageSchema } from "@/hooks/use-schema";

const PartnerCarousel = lazy(() =>
  import("@/components/partner-carousel").then(m => ({ default: m.PartnerCarousel }))
);
const HowItWorks = lazy(() =>
  import("@/components/how-it-works").then(m => ({ default: m.HowItWorks }))
);
const FeatureCarousel = lazy(() =>
  import("@/components/feature-carousel").then(m => ({ default: m.FeatureCarousel }))
);
const PaymentMethods = lazy(() =>
  import("@/components/payment-methods").then(m => ({ default: m.PaymentMethods }))
);
const Testimonials = lazy(() =>
  import("@/components/testimonials").then(m => ({ default: m.Testimonials }))
);
const StillHaveQuestions = lazy(() =>
  import("@/components/still-have-questions").then(m => ({ default: m.StillHaveQuestions }))
);

/**
 * 🔥 Skeleton Loader (used everywhere)
 */
function SectionSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div
      style={{ minHeight: height }}
      className="w-full animate-pulse px-6 py-8 space-y-4"
    >
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-40 bg-gray-200 rounded w-full" />
    </div>
  );
}

/**
 * LazyMount — mounts only when near viewport.
 * minHeight is kept on the container at all times so layout shifts are
 * prevented both before and during the transition from skeleton to content.
 * Once the real content has rendered and committed, the constraint is lifted.
 */
function LazyMount({
  children,
  height = 500,
  fallback,
}: {
  children: React.ReactNode;
  height?: number;
  fallback?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // After content mounts, give the browser one frame to paint before
  // releasing the minHeight constraint. This prevents the surrounding
  // layout from shifting mid-render.
  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  return (
    <div ref={ref} style={settled ? undefined : { minHeight: height }}>
      {mounted ? (
        <Suspense fallback={fallback ?? <SectionSkeleton height={height} />}>
          {children}
        </Suspense>
      ) : (
        <SectionSkeleton height={height} />
      )}
    </div>
  );
}

export default function Home() {
  useHead({ title: "Pexly | Non-Custodial Crypto Marketplace", meta: [{ name: "description", content: "Pexly is your all-in-one decentralized market. Swap cryptocurrencies, earn yield through staking, buy gift cards, top up mobile credit, pay utility bills, shop with crypto, and explore blockchain data — all without giving up custody of your assets. Non-custodial, borderless, and built for everyone." }] });
  useSchema(homePageSchema, "home-page-schema");

  return (
    <div className="min-h-screen relative">
      {/* Instant load */}
      <HeroSection />

      {/* Smooth skeleton instead of blank */}
      <Suspense fallback={<SectionSkeleton height={80} />}>
        <PartnerCarousel />
      </Suspense>

      {/* Lazy sections with skeletons */}
      <LazyMount height={600}>
        <HowItWorks />
      </LazyMount>

      <LazyMount height={500}>
        <FeatureCarousel />
      </LazyMount>

      <LazyMount height={500}>
        <PaymentMethods />
      </LazyMount>

      <TrustStats />

      <div className="pb-16">
        <LazyMount height={600}>
          <Testimonials />
        </LazyMount>
      </div>

      <LazyMount height={300}>
        <StillHaveQuestions />
      </LazyMount>

      <CTASection />

      <div className="bg-[#1a1a1a] -mt-16">
        <AppFooter />
      </div>
    </div>
  );
}
