import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import { SiApple, SiGoogleplay } from "react-icons/si";
import mobileAppImage from "@assets/svg-image-1-3.svg";

export function CTASection() {
  return (
    <section className="py-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center space-y-2">
        <div className="flex justify-center">
          <img 
            src={mobileAppImage} 
            alt="Pexly Mobile App Screens" 
            className="max-w-full h-auto max-h-96 object-contain"
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl lg:text-4xl font-bold">Start trading on Pexly today</h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Trade Bitcoin, Ethereum, Tether and more with over 14 million global users
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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

        <div className="pt-4">
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
    </section>
  );
}
