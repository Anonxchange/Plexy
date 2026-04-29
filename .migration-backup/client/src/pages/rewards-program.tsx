
import { useHead } from "@unhead/react";
import { Crown, Gift, TrendingUp, Star, AlertCircle, ChevronDown } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { LegalPageHero } from "@/components/legal-page-hero";
import { Link } from "wouter";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function RewardsProgram() {
  useHead({ title: "Rewards Program | Pexly", meta: [{ name: "description", content: "Terms and eligibility requirements for the Pexly Rewards Program." }] });
  const [openLegal, setOpenLegal] = useState(false);

  const legalSections = [
    {
      category: "Agreements",
      links: [
        { text: "Terms & Conditions", href: "/terms" },
        { text: "Rewards Program T&C", href: "/rewards-program" },
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
        { text: "Risk Disclosure", href: "/risk-disclosure" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LegalPageHero
        title="Rewards Program"
        subtitle="Exclusive benefits and tiered rewards for our most active community members"
        lastUpdated="March 30, 2025"
      />

      <section className="relative z-10 -mt-20 pb-0">
        <div className="w-full bg-background rounded-3xl shadow-2xl px-6 md:px-12 py-10 -mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="sticky top-24">
              <Collapsible open={openLegal} onOpenChange={setOpenLegal} className="md:hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-colors mb-6">
                  <h3 className="text-lg font-semibold">Legal Documents</h3>
                  <ChevronDown
                    className={`h-5 w-5 text-primary transition-transform ${openLegal ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="mb-6">
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4 mt-2">
                    {legalSections.map((section) => (
                      <div key={section.category}>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">{section.category}</h4>
                        <div className="space-y-2 ml-2">
                          {section.links.map((link) => (
                            <div key={link.text}>
                              <Link to={link.href} className="text-foreground hover:text-primary hover:underline font-medium text-sm">
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

              <div className="hidden md:block">
                <div className="flex items-center justify-between w-full p-4 rounded-t-lg border-x-2 border-t-2 border-primary/30 bg-primary/5">
                  <h3 className="text-lg font-semibold">Legal Documents</h3>
                </div>
                <div className="bg-muted/30 rounded-b-lg border-x-2 border-b-2 border-primary/30 p-4 space-y-6">
                  {legalSections.map((section) => (
                    <div key={section.category}>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">{section.category}</h4>
                      <div className="space-y-3 ml-2">
                        {section.links.map((link) => (
                          <div key={link.text}>
                            <Link to={link.href} className="text-foreground hover:text-primary hover:underline font-medium text-sm block">
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

          <div className="md:col-span-2 space-y-8">
            <div className="space-y-8">

              <div>
                <h2 className="text-2xl font-bold mb-4">Program Overview</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Pexly Rewards Program recognises and rewards our most engaged community members with exclusive benefits, reduced fees, and premium access. Tier status is earned through your activity on the platform — including swap volume, staking participation, and referrals — and is reviewed on a rolling 30-day basis.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Star className="h-6 w-6 text-primary" />
                  1. Eligibility
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Any registered Pexly user with a verified account may participate in the Rewards Program. To qualify for a reward tier, users must meet one or more of the following criteria within a rolling 30-day window:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Minimum swap volume of $10,000 USD equivalent</li>
                  <li>Active participation in supported staking products</li>
                  <li>Successful referral of 3 or more verified active users</li>
                  <li>Completion of all verification levels including Enhanced Due Diligence</li>
                  <li>Special invitation from the Pexly team</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Gift className="h-6 w-6 text-primary" />
                  2. Rewards & Benefits
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Rewards Program members enjoy the following benefits based on their tier:
                </p>

                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-lg mb-2">Reduced Swap Fees</h3>
                    <p className="text-muted-foreground">
                      Fee reductions of up to 50% on all swaps, applied automatically based on your active tier
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/80 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Priority Support</h3>
                    <p className="text-muted-foreground">
                      Access to a dedicated priority support queue with faster response times
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/60 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Enhanced Staking Yields</h3>
                    <p className="text-muted-foreground">
                      Boosted staking rewards on eligible assets for Gold tier and above
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/40 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Early Feature Access</h3>
                    <p className="text-muted-foreground">
                      First access to new platform features, supported assets, and product launches
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/20 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Exclusive Events</h3>
                    <p className="text-muted-foreground">
                      Invitations to community events, product briefings, and partner experiences for Diamond members
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  3. Reward Tiers
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The Rewards Program has three tiers, based on rolling 30-day swap volume:
                </p>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-4 rounded-lg border-l-4 border-amber-500">
                    <h3 className="font-semibold text-lg mb-1">Gold</h3>
                    <p className="text-sm text-muted-foreground">$10,000+ monthly swap volume • 20% fee reduction • Enhanced staking yields</p>
                  </div>
                  <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg border-l-4 border-primary">
                    <h3 className="font-semibold text-lg mb-1">Platinum</h3>
                    <p className="text-sm text-muted-foreground">$50,000+ monthly swap volume • 35% fee reduction • Priority support</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500/10 to-transparent p-4 rounded-lg border-l-4 border-purple-500">
                    <h3 className="font-semibold text-lg mb-1">Diamond</h3>
                    <p className="text-sm text-muted-foreground">$200,000+ monthly swap volume • 50% fee reduction • All benefits + exclusive events</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">4. Tier Qualification & Review</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Tier status is evaluated on a rolling 30-day basis. Upgrades take effect within 24 hours of meeting the criteria. Downgrades occur at the next review cycle if the minimum activity threshold is no longer met. Users will receive an in-app notification of any tier change.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">5. Referral Rewards</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Users who refer new verified members to Pexly earn referral rewards as part of the program:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Referral rewards are credited once the referred user completes verification and their first transaction</li>
                  <li>Self-referrals and abuse of the referral system will result in reward forfeiture and possible account suspension</li>
                  <li>Pexly reserves the right to adjust referral reward rates at any time with reasonable notice</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">6. Program Modifications & Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly reserves the right to modify, suspend, or discontinue the Rewards Program or any of its benefits at any time. We will provide at least 14 days' notice for material changes affecting active tier members. Pexly may remove a user from the program at any time for violations of our Terms & Conditions or AML Policy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">7. Non-Transferability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Reward tier status and benefits are personal and non-transferable. They cannot be sold, transferred, or assigned to any other individual or entity. Any attempt to do so will result in immediate removal from the program.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">8. Compliance</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Rewards Program members remain subject to all platform Terms & Conditions, Privacy Policy, and AML Policy. Reward tier status does not exempt users from any compliance or regulatory requirements.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg border-l-4 border-primary">
                <div className="flex gap-3">
                  <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Questions about the Rewards Program?</h3>
                    <p className="text-sm text-muted-foreground">
                      Contact our team at{" "}
                      <a href="mailto:rewards@pexly.com" className="text-primary hover:underline">
                        rewards@pexly.com
                      </a>
                    </p>
                  </div>
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
