import { Globe, MapPin, AlertCircle, Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";

export default function RestrictedCountries() {
  const restrictedCountries = [
    "Afghanistan", "Belarus", "Burma (Myanmar)", "Central African Republic",
    "Cuba", "Democratic Republic of Congo", "Iran", "Iraq", "Lebanon",
    "Libya", "Mali", "Nicaragua", "North Korea", "Russia", "Somalia",
    "South Sudan", "Sudan", "Syria", "Ukraine (Crimea, Donetsk, and Luhansk regions)",
    "Venezuela", "Yemen", "Zimbabwe"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background py-20 px-4">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="block text-foreground">Restricted Countries</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Due to regulatory and compliance requirements, Pexly services are not available in certain jurisdictions
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
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  Geographic Restrictions
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  In compliance with international sanctions, anti-money laundering regulations, and local laws, Pexly does not provide services to users located in or residents of the following countries and territories:
                </p>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {restrictedCountries.map((country, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-destructive flex-shrink-0" />
                      <span className="text-sm">{country}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Why Are These Countries Restricted?</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  These restrictions are in place for several reasons:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>International sanctions imposed by the United Nations, United States, European Union, or other regulatory bodies</li>
                  <li>High-risk jurisdictions identified by the Financial Action Task Force (FATF)</li>
                  <li>Countries with inadequate anti-money laundering and counter-terrorist financing controls</li>
                  <li>Jurisdictions where cryptocurrency services are prohibited or heavily restricted</li>
                  <li>Regions with ongoing armed conflicts or political instability</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Verification Process</h2>
                <p className="text-muted-foreground leading-relaxed">
                  During the registration and verification process, we check your IP address, phone number, and identification documents to ensure you are not located in a restricted jurisdiction. If we detect that you are accessing our platform from a restricted country, your account will be suspended or denied.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">VPN and Proxy Usage</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Using VPNs, proxies, or other tools to circumvent geographic restrictions is strictly prohibited and constitutes a violation of our Terms & Conditions. Accounts found to be using such methods will be immediately suspended, and any funds may be frozen pending investigation.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Traveling to Restricted Countries</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you are a verified user traveling to a restricted country, you may experience limited or no access to our platform. We recommend that you avoid conducting transactions while in these jurisdictions. Your account will remain active, but access will be restricted based on your current location.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Changes to Restricted List</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This list of restricted countries is subject to change based on evolving international sanctions, regulatory requirements, and risk assessments. We will update this page as restrictions are added or removed. Users are responsible for staying informed about these changes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Already Have an Account?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you currently reside in a country that becomes restricted after you've registered, we will provide advance notice and assistance in withdrawing your funds before your account is suspended. However, we cannot guarantee the availability of withdrawal methods to all restricted jurisdictions.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Questions About Restrictions?</h3>
                    <p className="text-sm text-muted-foreground">
                      If you have questions about geographic restrictions or believe you've been incorrectly flagged, please contact our compliance team at{" "}
                      <a href="mailto:compliance@pexly.com" className="text-primary hover:underline">
                        compliance@pexly.com
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
