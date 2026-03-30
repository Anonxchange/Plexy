
import { useHead } from "@unhead/react";
import { ShieldOff, AlertTriangle, Scale, Cpu, Globe, AlertCircle, ChevronDown } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { LegalPageHero } from "@/components/legal-page-hero";
import { Link } from "wouter";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function RiskDisclosure() {
  useHead({ title: "Risk Disclosure | Pexly", meta: [{ name: "description", content: "Important risk disclosures for users of the Pexly non-custodial platform." }] });
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
        title="Risk Disclosure"
        subtitle="Please read this document carefully before using the Pexly platform"
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
                <h2 className="text-2xl font-bold mb-4">Important Notice</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly is a non-custodial software platform. We do not hold, control, manage, or have access to your funds, private keys, or digital assets at any time. By using Pexly, you acknowledge that you are solely responsible for the security and management of your own assets. This disclosure outlines the key risks you should understand before using our platform.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <ShieldOff className="h-6 w-6 text-primary" />
                  1. Non-Custodial Nature of the Platform
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly provides software tools only. We are not a financial institution, bank, broker, or money services business. This means:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>We never take possession of your cryptocurrency or fiat funds</li>
                  <li>We cannot reverse, cancel, or recover any transaction you initiate</li>
                  <li>We cannot restore access to wallets or accounts if you lose your credentials</li>
                  <li>Your private keys and seed phrases are your sole responsibility</li>
                  <li>Loss of your private key or seed phrase means permanent, irreversible loss of access to your assets</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                  2. Market & Price Risk
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Cryptocurrency markets are highly volatile. You should be aware that:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>The value of digital assets can fluctuate dramatically within short time periods</li>
                  <li>Past performance of any asset is not indicative of future results</li>
                  <li>You may lose some or all of the value of your assets</li>
                  <li>Market conditions can change rapidly due to regulatory news, macroeconomic events, or market sentiment</li>
                  <li>Pexly does not provide investment advice and nothing on this platform constitutes a recommendation to buy or sell any asset</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Cpu className="h-6 w-6 text-primary" />
                  3. Smart Contract & Technology Risk
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Blockchain technology and smart contracts carry inherent technical risks:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Smart contracts may contain bugs or vulnerabilities that could result in loss of funds</li>
                  <li>Blockchain networks can experience congestion, forks, or outages that affect transaction processing</li>
                  <li>On-chain transactions are irreversible once confirmed — there is no undo</li>
                  <li>Gas fees and network costs are beyond Pexly's control and may vary significantly</li>
                  <li>Third-party protocols or bridges used through our interface carry their own independent risks</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Globe className="h-6 w-6 text-primary" />
                  4. Regulatory & Legal Risk
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The regulatory environment for cryptocurrency is evolving rapidly and varies by jurisdiction:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Cryptocurrency may be restricted, taxed, or prohibited in your country — you are responsible for ensuring compliance with local laws</li>
                  <li>Regulatory changes could affect the availability or legality of certain features on the platform</li>
                  <li>Tax treatment of cryptocurrency transactions varies by jurisdiction — consult a qualified tax advisor</li>
                  <li>Pexly may be required to restrict access to users in certain jurisdictions to comply with applicable law</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Scale className="h-6 w-6 text-primary" />
                  5. Security Risk
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  While Pexly implements industry-standard security measures, no system is immune to risk:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Phishing attacks, malware, and social engineering targeting crypto users are common — always verify you are on the official Pexly domain</li>
                  <li>Never share your seed phrase or private key with anyone, including anyone claiming to be Pexly support</li>
                  <li>Compromised devices or browsers may expose your wallet credentials to third parties</li>
                  <li>You are responsible for securing your own account credentials and enabling two-factor authentication</li>
                  <li>Pexly will never ask for your private key, seed phrase, or full password via any channel</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">6. No Financial Advice</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nothing on the Pexly platform constitutes financial, investment, legal, or tax advice. All market data, price information, and content provided is for informational purposes only. You should conduct your own research and consult qualified professionals before making any financial decisions. Trading and investing in digital assets involves substantial risk of loss and is not appropriate for all individuals.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">7. No Warranty</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly provides its platform on an "as is" and "as available" basis without any warranties, express or implied. We do not guarantee uninterrupted access, accuracy of third-party data, or the performance of any underlying blockchain network. Your use of the platform is entirely at your own risk.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">8. Your Acknowledgement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By using Pexly, you confirm that you have read and understood this Risk Disclosure, that you are aware of the risks involved in using a non-custodial cryptocurrency platform, and that you are solely responsible for any decisions made and actions taken using our software.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg border-l-4 border-primary">
                <div className="flex gap-3">
                  <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Questions?</h3>
                    <p className="text-sm text-muted-foreground">
                      If you have questions about this Risk Disclosure, please contact us at{" "}
                      <a href="mailto:legal@pexly.com" className="text-primary hover:underline">
                        legal@pexly.com
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
