import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import { SiApple, SiGoogleplay } from "react-icons/si";
import mobileAppImage from "@assets/svg-image-1-3.svg";

export function CTASection() {
  return (
    <section className="py-12 lg:py-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16">
          
          {/* LEFT — TEXT & CTA */}
          <div className="text-center lg:text-left space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Start trading on Pexly today
              </h2>
              <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto lg:mx-0">
                Trade Bitcoin, Ethereum, Tether and more with over 14 million global users
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
                data-testid="button-app-store"
              >
                <SiApple className="h-5 w-5" />
                Download on App Store
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
                data-testid="button-play-store"
              >
                <SiGoogleplay className="h-5 w-5" />
                Get it on Google Play
              </Button>
            </div>

            <div className="pt-2">
              <Button
                size="lg"
                variant="outline"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                data-testid="button-sign-up-cta"
              >
                <Smartphone className="h-5 w-5 mr-2" />
                Sign up now
              </Button>
            </div>
          </div>

          {/* RIGHT — IMAGE */}
          <div className="flex justify-center lg:justify-end">
            <img
              src={mobileAppImage}
              alt="Pexly Mobile App Screens"
              width={615}
              height={550}
              className="max-w-full h-auto max-h-[550px] object-contain scale-110"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
