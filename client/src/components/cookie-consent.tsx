import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem("cookie-consent");
      if (!consent) {
        setTimeout(() => setIsVisible(true), 100);
      }
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("cookie-consent", "accepted");
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-foreground">
              This website uses cookies to ensure you get the best experience on our website.{" "}
              <a 
                href="/privacy" 
                className="text-primary hover:underline font-medium"
              >
                Learn more
              </a>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAccept}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              I accept
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
