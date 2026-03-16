import { lazy, Suspense } from "react";
import { HeroSection } from "@/components/hero-section";
import { PartnerCarousel } from "@/components/partner-carousel";
import { AppFooter } from "@/components/app-footer";
import { useSchema, homePageSchema } from "@/hooks/use-schema";

const HowItWorks = lazy(() => import("@/components/how-it-works").then(m => ({ default: m.HowItWorks })));
const FeatureCarousel = lazy(() => import("@/components/feature-carousel").then(m => ({ default: m.FeatureCarousel })));
const PaymentMethods = lazy(() => import("@/components/payment-methods").then(m => ({ default: m.PaymentMethods })));
const TrustStats = lazy(() => import("@/components/trust-stats").then(m => ({ default: m.TrustStats })));
const Testimonials = lazy(() => import("@/components/testimonials").then(m => ({ default: m.Testimonials })));
const CTASection = lazy(() => import("@/components/cta-section").then(m => ({ default: m.CTASection })));

function SectionShell({ children, height = 500 }: { children: React.ReactNode; height?: number }) {
  return (
    <div style={{ contentVisibility: "auto", containIntrinsicSize: `0 ${height}px` }}>
      {children}
    </div>
  );
}

export default function Home() {
  useSchema(homePageSchema, "home-page-schema");

  return (
    <div className="min-h-screen relative">
      <HeroSection />
      <PartnerCarousel />
      <Suspense fallback={<div style={{ height: 600 }} />}>
        <SectionShell height={600}>
          <HowItWorks />
        </SectionShell>
      </Suspense>
      <Suspense fallback={<div style={{ height: 500 }} />}>
        <SectionShell height={500}>
          <FeatureCarousel />
        </SectionShell>
      </Suspense>
      <Suspense fallback={<div style={{ height: 500 }} />}>
        <SectionShell height={500}>
          <PaymentMethods />
        </SectionShell>
      </Suspense>
      <Suspense fallback={<div style={{ height: 400 }} />}>
        <SectionShell height={400}>
          <TrustStats />
        </SectionShell>
      </Suspense>
      <Suspense fallback={<div style={{ height: 600 }} />}>
        <SectionShell height={600}>
          <Testimonials />
        </SectionShell>
      </Suspense>
      <Suspense fallback={<div style={{ height: 400 }} />}>
        <SectionShell height={400}>
          <CTASection />
        </SectionShell>
      </Suspense>
      <AppFooter />
    </div>
  );
}
