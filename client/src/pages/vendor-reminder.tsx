import { Store, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";

export default function VendorReminder() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background py-20 px-4">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Store className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="block text-foreground">Vendor Reminder</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Important guidelines and best practices for P2P vendors on Pexly
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
                <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  As a vendor on the Pexly P2P marketplace, you play a crucial role in providing liquidity and facilitating trades for our community. This reminder outlines your responsibilities and best practices to ensure a safe and successful trading experience.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  Vendor Responsibilities
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  As a vendor, you must:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Maintain sufficient cryptocurrency balance to fulfill your active offers</li>
                  <li>Respond to trade requests within 15 minutes during your active trading hours</li>
                  <li>Provide clear and accurate payment instructions</li>
                  <li>Release cryptocurrency promptly upon confirmed payment receipt</li>
                  <li>Communicate professionally and respectfully with all buyers</li>
                  <li>Honor the prices and terms stated in your offers</li>
                  <li>Keep your contact information and payment details up to date</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-6 w-6 text-primary" />
                  Prohibited Activities
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The following activities are strictly forbidden and may result in account suspension:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Requesting buyers to cancel confirmed trades without valid reason</li>
                  <li>Asking for payment outside the platform's escrow system</li>
                  <li>Demanding additional fees not specified in the offer terms</li>
                  <li>Refusing to release cryptocurrency after receiving confirmed payment</li>
                  <li>Using offensive, threatening, or discriminatory language</li>
                  <li>Creating multiple accounts to manipulate your reputation or trading volume</li>
                  <li>Colluding with buyers to manipulate prices or trading statistics</li>
                  <li>Requesting personal information beyond what's necessary for the transaction</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Response Time Requirements</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Vendors are expected to maintain prompt response times:
                </p>
                <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Initial Response:</span>
                    <span className="text-primary font-semibold">Within 15 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Payment Confirmation:</span>
                    <span className="text-primary font-semibold">Within 30 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Cryptocurrency Release:</span>
                    <span className="text-primary font-semibold">Within 1 hour of confirmed payment</span>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Failure to meet these requirements may negatively impact your vendor rating and could result in temporary or permanent suspension of trading privileges.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Payment Methods</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When accepting payments:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Ensure all payment accounts are registered in your verified name</li>
                  <li>Only accept payments from the buyer's verified payment account</li>
                  <li>Verify payment receipt through official channels (bank app, payment provider)</li>
                  <li>Never accept cash payments or third-party transfers</li>
                  <li>Be aware of payment reversals and chargebacks for certain methods</li>
                  <li>Document all payment confirmations for dispute resolution</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                  Fraud Prevention
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Protect yourself from fraud by:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Verifying payment confirmations directly with your bank or payment provider</li>
                  <li>Being cautious of screenshot-only payment proofs</li>
                  <li>Reporting suspicious buyer behavior immediately</li>
                  <li>Not releasing cryptocurrency until payment is fully confirmed and irreversible</li>
                  <li>Checking buyer verification level and trade history before accepting trades</li>
                  <li>Setting minimum trade amounts to reduce exposure to small-scale fraud</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  In case of disputes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Remain calm and professional in all communications</li>
                  <li>Provide all requested evidence to our support team promptly</li>
                  <li>Do not release cryptocurrency during an active dispute</li>
                  <li>Cooperate fully with the dispute resolution process</li>
                  <li>Accept that Pexly's decision in disputes is final and binding</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Vendor Ratings and Reputation</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your vendor rating is calculated based on completion rate, response time, release speed, and buyer feedback. Maintaining a high rating (95%+) provides access to higher trading limits and increased visibility in the marketplace. Ratings below 85% may result in reduced trading privileges.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Offer Management</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Best practices for managing your offers:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Set realistic prices based on current market rates</li>
                  <li>Clearly state all terms and conditions in your offer description</li>
                  <li>Pause or disable offers when you're unavailable to trade</li>
                  <li>Update payment information immediately if account details change</li>
                  <li>Set appropriate minimum and maximum trade limits</li>
                  <li>Specify your active trading hours accurately</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Tax and Legal Compliance</h2>
                <p className="text-muted-foreground leading-relaxed">
                  As a vendor, you are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Complying with all applicable tax laws in your jurisdiction</li>
                  <li>Maintaining accurate records of all transactions</li>
                  <li>Reporting cryptocurrency income as required by local regulations</li>
                  <li>Ensuring you have necessary licenses or permits for high-volume trading</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Account Suspension</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your vendor account may be suspended for violations including but not limited to: repeated late responses, frequent trade cancellations, evidence of fraud, poor customer service, or violation of platform terms. Severe violations may result in permanent account termination and forfeiture of funds.
                </p>
              </div>

              <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
                <div className="flex gap-3">
                  <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Vendor Support</h3>
                    <p className="text-sm text-muted-foreground">
                      For vendor-specific questions or support, contact our vendor success team at{" "}
                      <a href="mailto:vendors@pexly.com" className="text-primary hover:underline">
                        vendors@pexly.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg">
                <p className="text-sm text-muted-foreground italic">
                  By continuing to operate as a vendor on Pexly, you acknowledge that you have read, understood, and agree to comply with these guidelines. Failure to adhere to these standards may result in penalties including but not limited to: warning notices, trading restrictions, account suspension, or permanent ban from the platform.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}
