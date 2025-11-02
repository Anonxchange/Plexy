import { Cookie, Settings, BarChart3, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background py-20 px-4">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Cookie className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="block text-foreground">Cookie Policy</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Learn about how we use cookies and similar technologies on our platform
          </p>

          <p className="text-sm text-muted-foreground">
            Last Updated: November 2, 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Settings className="h-6 w-6 text-primary" />
                  Types of Cookies We Use
                </h2>
                
                <div className="space-y-6 mt-6">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-lg mb-2">Essential Cookies</h3>
                    <p className="text-muted-foreground">
                      These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt-out of these cookies.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary/60 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Functional Cookies</h3>
                    <p className="text-muted-foreground">
                      These cookies enable the website to provide enhanced functionality and personalization, such as remembering your preferences and settings.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary/40 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Analytics Cookies</h3>
                    <p className="text-muted-foreground">
                      These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our platform.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary/20 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Marketing Cookies</h3>
                    <p className="text-muted-foreground">
                      These cookies are used to track visitors across websites to display relevant advertisements and measure the effectiveness of our marketing campaigns.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">How We Use Cookies</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>To keep you signed in to your account</li>
                  <li>To remember your preferences and settings</li>
                  <li>To understand how you use our platform and improve our services</li>
                  <li>To protect against fraud and enhance security</li>
                  <li>To deliver relevant content and advertisements</li>
                  <li>To analyze platform performance and user behavior</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Third-Party Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may also use third-party service providers who set cookies on your device to provide services on our behalf. These include analytics providers, advertising networks, and social media platforms. These third parties have their own privacy policies.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  Managing Your Cookie Preferences
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You have the right to decide whether to accept or reject cookies. You can:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Use our cookie consent banner when you first visit our website</li>
                  <li>Modify your browser settings to block or delete cookies</li>
                  <li>Opt-out of third-party advertising cookies through industry opt-out pages</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Please note that blocking certain cookies may affect the functionality of our platform and your user experience.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Browser Controls</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Most web browsers allow you to control cookies through their settings. You can usually find these settings in the "options" or "preferences" menu of your browser. Here are links to cookie management guides for popular browsers:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Google Chrome</li>
                  <li>Mozilla Firefox</li>
                  <li>Safari</li>
                  <li>Microsoft Edge</li>
                  <li>Opera</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business operations. We encourage you to review this page periodically.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Questions About Cookies?</h3>
                    <p className="text-sm text-muted-foreground">
                      If you have any questions about our use of cookies, please contact us at{" "}
                      <a href="mailto:privacy@pexly.com" className="text-primary hover:underline">
                        privacy@pexly.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}
