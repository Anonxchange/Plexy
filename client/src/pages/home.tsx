import { HeroSection } from "@/components/hero-section";
import { CryptoTicker } from "@/components/crypto-ticker";
import { HowItWorks } from "@/components/how-it-works";
import { PaymentMethods } from "@/components/payment-methods";
import { TrustStats } from "@/components/trust-stats";
import { Testimonials } from "@/components/testimonials";
import { CTASection } from "@/components/cta-section";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <CryptoTicker />
      <HowItWorks />
      <PaymentMethods />
      <TrustStats />
      <Testimonials />
      <CTASection />
    </div>
  );
}
