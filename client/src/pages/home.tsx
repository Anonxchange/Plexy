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
