import { HeroSection } from "@/components/hero-section";
import { PartnerCarousel } from "@/components/partner-carousel";
import { FeatureCarousel } from "@/components/feature-carousel";
import { HowItWorks } from "@/components/how-it-works";
import { PaymentMethods } from "@/components/payment-methods";
import { TrustStats } from "@/components/trust-stats";
import { Testimonials } from "@/components/testimonials";
import { CTASection } from "@/components/cta-section";
import { useSchema, homePageSchema } from "@/hooks/use-schema";

export default function Home() {
  useSchema(homePageSchema, "home-page-schema");

  return (
    <div className="min-h-screen relative">
      <HeroSection />
      <PartnerCarousel />
      <HowItWorks />
      <FeatureCarousel />
      <PaymentMethods />
      <TrustStats />
      <Testimonials />
      <CTASection />
    </div>
  );
}
