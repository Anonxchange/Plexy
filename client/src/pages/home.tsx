import { lazy, Suspense, useRef, useState, useEffect } from "react";
import { HeroSection } from "@/components/hero-section";
import { AppFooter } from "@/components/app-footer";
import { useSchema, homePageSchema } from "@/hooks/use-schema";

const PartnerCarousel = lazy(() => import("@/components/partner-carousel").then(m => ({ default: m.PartnerCarousel })));
const HowItWorks = lazy(() => import("@/components/how-it-works").then(m => ({ default: m.HowItWorks })));
const FeatureCarousel = lazy(() => import("@/components/feature-carousel").then(m => ({ default: m.FeatureCarousel })));
const PaymentMethods = lazy(() => import("@/components/payment-methods").then(m => ({ default: m.PaymentMethods })));
const TrustStats = lazy(() => import("@/components/trust-stats").then(m => ({ default: m.TrustStats })));
const Testimonials = lazy(() => import("@/components/testimonials").then(m => ({ default: m.Testimonials })));
const CTASection = lazy(() => import("@/components/cta-section").then(m => ({ default: m.CTASection })));

/**
 * LazyMount — only inserts children into the DOM once the placeholder
 * div is within `rootMargin` of the viewport. Before that, the section
 * occupies its reserved height but contributes zero DOM nodes.
 */
function LazyMount({ children, height = 500, fallback }: {
  children: React.ReactNode;
  height?: number;
  fallback?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

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

  return (
    <div ref={ref} style={mounted ? undefined : { minHeight: height }}>
      {mounted
        ? <Suspense fallback={fallback ?? <div style={{ minHeight: height }} />}>{children}</Suspense>
        : null}
    </div>
  );
}

export default function Home() {
  useSchema(homePageSchema, "home-page-schema");

  return (
    <div className="min-h-screen relative">
      <HeroSection />

      <Suspense fallback={<div style={{ height: 64 }} />}>
        <PartnerCarousel />
      </Suspense>

      <LazyMount height={600}><HowItWorks /></LazyMount>
      <LazyMount height={500}><FeatureCarousel /></LazyMount>
      <LazyMount height={500}><PaymentMethods /></LazyMount>
      <LazyMount height={400}><TrustStats /></LazyMount>
      <LazyMount height={600}><Testimonials /></LazyMount>
      <LazyMount height={400}><CTASection /></LazyMount>

      <AppFooter />
    </div>
  );
}
