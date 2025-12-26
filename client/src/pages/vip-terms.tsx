
import { Crown, Gift, TrendingUp, Star, AlertCircle, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";
import { Link } from "wouter";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function VIPTerms() {
  const [openLegal, setOpenLegal] = useState(false);

  const legalSections = [
    {
      category: "Agreements",
      links: [
        { text: "Terms & Conditions", href: "/terms" },
        { text: "VIP Terms", href: "/vip-terms" },
      ]
    },
    {
      category: "Policies",
      links: [
        { text: "Privacy Policy", href: "/privacy" },
        { text: "Cookie Policy", href: "/cookie-policy" },
        { text: "AML Policy", href: "/aml-policy" },
      ]
    },
    {
      category: "Other",
      links: [
        { text: "Vendor Reminder", href: "/vendor-reminder" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-20 px-4">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
              <Crown className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="block text-primary-foreground">VIP Program</span>
            <span className="block text-primary-foreground/90">VIP Program T&C</span>
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Elite benefits and exclusive privileges for our most valued traders
          </p>

          <p className="text-sm text-primary-foreground/70">
            Last Updated: November 2, 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Legal Documents */}
          <div className="md:col-span-1">
            <div className="sticky top-24">
              <Collapsible open={openLegal} onOpenChange={setOpenLegal} className="md:hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-colors mb-6">
                  <h3 className="text-lg font-semibold">Legal Documents</h3>
                  <ChevronDown
                    className={`h-5 w-5 text-primary transition-transform ${
                      openLegal ? "rotate-180" : ""
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="mb-6">
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4 mt-2">
                    {legalSections.map((section) => (
                      <div key={section.category}>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
                          {section.category}
                        </h4>
                        <div className="space-y-2 ml-2">
                          {section.links.map((link) => (
                            <div key={link.text}>
                              <Link
                                to={link.href}
                                className="text-foreground hover:text-primary hover:underline font-medium text-sm"
                              >
                                {link.text}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Desktop version - always visible */}
              <div className="hidden md:block">
                <div className="flex items-center justify-between w-full p-4 rounded-t-lg border-x-2 border-t-2 border-primary/30 bg-primary/5">
                  <h3 className="text-lg font-semibold">Legal Documents</h3>
                </div>
                <div className="bg-muted/30 rounded-b-lg border-x-2 border-b-2 border-primary/30 p-4 space-y-6">
                  {legalSections.map((section) => (
                    <div key={section.category}>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
                        {section.category}
                      </h4>
                      <div className="space-y-3 ml-2">
                        {section.links.map((link) => (
                          <div key={link.text}>
                            <Link
                              to={link.href}
                              className="text-foreground hover:text-primary hover:underline font-medium text-sm block"
                            >
                              {link.text}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Content */}
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">VIP Program Overview</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Pexly VIP Program is an invitation-only membership tier designed to reward our most active and loyal traders with exclusive benefits, personalized services, and premium features.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Star className="h-6 w-6 text-primary" />
                  1. Eligibility Requirements
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To qualify for VIP status, users must meet one or more of the following criteria:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Minimum 30-day trading volume of $100,000 USD equivalent</li>
                  <li>Minimum account balance of $50,000 USD equivalent</li>
                  <li>Completion of all verification levels including Enhanced Due Diligence</li>
                  <li>Active trading history of at least 6 months on the platform</li>
                  <li>Referral of 10 or more active verified users</li>
                  <li>Special invitation from the Pexly executive team</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Gift className="h-6 w-6 text-primary" />
                  2. VIP Benefits
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  VIP members enjoy the following exclusive benefits:
                </p>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-lg mb-2">Reduced Trading Fees</h3>
                    <p className="text-muted-foreground">
                      Up to 50% reduction on all trading fees, including P2P and spot trading
                    </p>
                  </div>

                  <div className="border-l-4 border-primary/80 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Dedicated Account Manager</h3>
                    <p className="text-muted-foreground">
                      24/7 access to a personal account manager for priority support
                    </p>
                  </div>

                  <div className="border-l-4 border-primary/60 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Higher Limits</h3>
                    <p className="text-muted-foreground">
                      Increased daily and monthly transaction limits (up to $500,000 per day)
                    </p>
                  </div>

                  <div className="border-l-4 border-primary/40 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Exclusive Events</h3>
                    <p className="text-muted-foreground">
                      Invitations to VIP networking events, conferences, and F1 VIP passes
                    </p>
                  </div>

                  <div className="border-l-4 border-primary/20 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Early Access</h3>
                    <p className="text-muted-foreground">
                      First access to new features, tokens, and trading pairs
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  3. Maintaining VIP Status
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To maintain VIP status, members must:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Maintain a minimum monthly trading volume of $50,000 USD equivalent</li>
                  <li>Keep a minimum account balance of $25,000 USD equivalent</li>
                  <li>Remain in good standing with all platform policies</li>
                  <li>Complete annual re-verification if required</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  VIP status is reviewed quarterly. Failure to meet the maintenance requirements may result in downgrade or removal from the VIP program.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">4. VIP Tiers</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The VIP program consists of multiple tiers:
                </p>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 rounded-lg border-l-4 border-amber-500">
                    <h3 className="font-semibold text-lg mb-1">VIP 1 (Gold)</h3>
                    <p className="text-sm text-muted-foreground">$100K+ monthly volume • 25% fee reduction</p>
                  </div>
                  <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg border-l-4 border-primary">
                    <h3 className="font-semibold text-lg mb-1">VIP 2 (Platinum)</h3>
                    <p className="text-sm text-muted-foreground">$500K+ monthly volume • 35% fee reduction</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500/10 to-transparent p-4 rounded-lg border-l-4 border-purple-500">
                    <h3 className="font-semibold text-lg mb-1">VIP 3 (Diamond)</h3>
                    <p className="text-sm text-muted-foreground">$2M+ monthly volume • 50% fee reduction</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">5. Invitation Process</h2>
                <p className="text-muted-foreground leading-relaxed">
                  VIP invitations are issued automatically when eligibility requirements are met, or by special invitation. Once eligible, you will receive an email notification with instructions to activate your VIP benefits. Activation requires acceptance of these terms and completion of any additional verification requirements.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">6. Termination of VIP Status</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly reserves the right to revoke VIP status at any time for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Violation of platform Terms & Conditions</li>
                  <li>Suspicious or fraudulent activity</li>
                  <li>Failure to maintain minimum requirements</li>
                  <li>Abuse of VIP privileges</li>
                  <li>Requests from regulatory or law enforcement authorities</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">7. Non-Transferability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  VIP status is personal and non-transferable. It cannot be sold, transferred, or assigned to any other individual or entity. Any attempt to do so will result in immediate termination of VIP privileges.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">8. Program Modifications</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly reserves the right to modify, suspend, or discontinue the VIP program or any of its benefits at any time. We will provide 30 days' notice for significant changes affecting existing VIP members.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">9. Compliance with General Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  VIP members remain subject to all platform Terms & Conditions, Privacy Policy, and AML Policy. VIP status does not exempt users from any compliance or regulatory requirements.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg border-l-4 border-primary">
                <div className="flex gap-3">
                  <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Interested in VIP Status?</h3>
                    <p className="text-sm text-muted-foreground">
                      To apply for VIP membership or learn more about exclusive benefits, contact our VIP team at{" "}
                      <a href="mailto:vip@pexly.com" className="text-primary hover:underline">
                        vip@pexly.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}
