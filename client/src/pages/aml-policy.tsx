
import { ShieldCheck, AlertTriangle, Search, FileCheck, AlertCircle, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";
import { Link } from "wouter";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function AMLPolicy() {
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
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="block text-primary-foreground">Anti-Money Laundering Policy</span>
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Our commitment to preventing money laundering and terrorist financing
          </p>

          <p className="text-sm text-primary-foreground/80">
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
                <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly is committed to maintaining the highest standards of anti-money laundering (AML) and counter-terrorist financing (CTF) compliance. This policy outlines our procedures to prevent our platform from being used for money laundering or terrorist financing activities.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <FileCheck className="h-6 w-6 text-primary" />
                  1. Know Your Customer (KYC)
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We implement robust KYC procedures to verify the identity of our users:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Verification of government-issued identification documents</li>
                  <li>Proof of address verification</li>
                  <li>Liveness detection to prevent identity fraud</li>
                  <li>Enhanced due diligence for high-risk customers</li>
                  <li>Ongoing monitoring of customer transactions and behavior</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Search className="h-6 w-6 text-primary" />
                  2. Transaction Monitoring
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We employ sophisticated systems to monitor and analyze transactions:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Real-time transaction screening against sanctions lists</li>
                  <li>Detection of unusual transaction patterns</li>
                  <li>Automated alerts for suspicious activities</li>
                  <li>Regular review of high-value and high-frequency transactions</li>
                  <li>Analysis of transaction sources and destinations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                  3. Suspicious Activity Reporting
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We are required to report suspicious activities to the relevant authorities:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Transactions that appear to have no economic or lawful purpose</li>
                  <li>Unusual patterns inconsistent with expected customer behavior</li>
                  <li>Attempts to avoid reporting or recordkeeping requirements</li>
                  <li>Transactions involving high-risk jurisdictions</li>
                  <li>Any activities that may relate to terrorist financing</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">4. Risk Assessment</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We conduct ongoing risk assessments to identify and mitigate AML/CTF risks:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Customer risk rating based on various factors</li>
                  <li>Geographic risk assessment</li>
                  <li>Product and service risk evaluation</li>
                  <li>Delivery channel risk analysis</li>
                  <li>Regular review and update of risk assessment procedures</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">5. Record Keeping</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We maintain comprehensive records of all transactions and customer information for a minimum of 5 years, or as required by applicable law. This includes identification documents, transaction records, and any reports filed with authorities.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">6. Training and Awareness</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our staff receives regular training on AML/CTF requirements, red flags, and reporting procedures. We ensure that all team members understand their responsibilities in preventing money laundering and terrorist financing.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">7. Prohibited Activities</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The following activities are strictly prohibited on our platform:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Money laundering or layering of illicit funds</li>
                  <li>Terrorist financing or support</li>
                  <li>Transactions involving sanctioned individuals or entities</li>
                  <li>Trade in illegal goods or services</li>
                  <li>Structuring transactions to avoid detection or reporting</li>
                  <li>Use of the platform for any illegal purposes</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">8. Sanctions Compliance</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We screen all users and transactions against international sanctions lists, including OFAC, UN, and EU sanctions. We do not provide services to individuals or entities in sanctioned jurisdictions or on sanctions lists.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">9. Cooperation with Authorities</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We fully cooperate with law enforcement and regulatory authorities in their investigations of money laundering, terrorist financing, or other illegal activities. We respond promptly to lawful requests for information.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">10. Policy Updates</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This AML policy is reviewed and updated regularly to ensure compliance with evolving regulations and industry best practices. Material changes will be communicated to users through our platform.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Report Suspicious Activity</h3>
                    <p className="text-sm text-muted-foreground">
                      If you suspect any money laundering or terrorist financing activities, please report immediately to{" "}
                      <a href="mailto:compliance@pexly.com" className="text-primary hover:underline">
                        compliance@pexly.com
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
