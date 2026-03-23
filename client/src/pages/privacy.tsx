
import { useHead } from "@unhead/react";
import { Lock, Eye, Database, Shield, UserCheck, AlertCircle, Globe, FileText, Users, Bell, ChevronDown } from "lucide-react";
import { AppFooter } from "@/components/app-footer";
import { LegalPageHero } from "@/components/legal-page-hero";
import { Link } from "wouter";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function Privacy() {
  useHead({ title: "Privacy Policy | Pexly", meta: [{ name: "description", content: "How Pexly collects, uses, and protects your personal data." }] });
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
      <LegalPageHero
        title="Privacy Notice"
        subtitle="Pexly takes steps to protect your privacy and personal data"
        lastUpdated="February 26, 2025"
      />

      {/* Content — overlaps hero above and footer below */}
      <section className="relative z-10 -mt-20 pb-0">
        <div className="w-full bg-background rounded-3xl shadow-2xl px-6 md:px-12 py-10 -mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* Column 1: Legal Documents sidebar */}
            <div className="md:col-span-1">
              <div className="sticky top-24">
                <Collapsible open={openLegal} onOpenChange={setOpenLegal} className="md:hidden">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-colors mb-6">
                    <h3 className="text-lg font-semibold">Legal Documents</h3>
                    <ChevronDown className={`h-5 w-5 text-primary transition-transform ${openLegal ? "rotate-180" : ""}`} />
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

                {/* Desktop sidebar — always visible */}
                <div className="hidden md:block">
                  <div className="rounded-xl border border-primary/20 bg-background/70 backdrop-blur-md shadow-md overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-primary/15 bg-primary/5">
                      <h3 className="text-sm font-semibold">Legal Documents</h3>
                    </div>
                    <div className="p-3 space-y-3">
                      {legalSections.map((section) => (
                        <div key={section.category}>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase">{section.category}</h4>
                          <div className="space-y-1.5 ml-2">
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
            </div>

            {/* Column 2: Content */}
            <div className="md:col-span-3 space-y-8">
              <div className="space-y-8">

                <div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    In this Privacy Notice ("Notice"), we describe the types of personal information we may collect from you in connection with your use of our websites including, but not limited to, https://pexly.app/, the Pexly Wallet, our online trading interface, mobile application, social media pages, or other online properties (collectively, the "Website"), or when you use any of the products, interface features, technologies, or functions we offer (collectively, the "Services").
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    This Notice is designed to help you obtain information about our privacy practices and to help you understand your privacy choices when you use our Website and Interface. Please note that our offerings may vary by region.
                  </p>
                  <p className="text-muted-foreground leading-relaxed font-semibold">
                    For all purposes, the English language version of this privacy notice shall be the original, governing instrument. In the event of any conflict between the English language version of this privacy notice and any subsequent translation into any other language, the English language version shall govern and control.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Database className="h-6 w-6 text-primary" />
                    Personal Information We Collect
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    The following account activity information consists solely of user-generated content, metadata, and technical logs created as a result of user interactions with the Pexly software. The collection or display of such information does not constitute monitoring, verification, approval, or control of any transaction or settlement.
                  </p>

                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        Biographical Data
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>Name</li>
                        <li>Email Address</li>
                        <li>Phone Number</li>
                        <li>Country</li>
                        <li>Full Address</li>
                        <li>Date of Birth</li>
                      </ul>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Pexly Account Details
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>Username</li>
                        <li>User Profile Information in the "Bio" section</li>
                        <li>Profile Picture</li>
                        <li>Joined Date</li>
                        <li>Default Currency</li>
                        <li>Time Zone</li>
                        <li>Default Language</li>
                      </ul>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Pexly Account Activity
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>Transaction History</li>
                        <li>Trading Activity (Spot, Perpetuals, Predictions, Swap)</li>
                        <li>Staking &amp; Earn Activity</li>
                        <li>Shop &amp; Gift Card Orders</li>
                        <li>Airtime Purchase Records</li>
                        <li>Affiliate Name, ID, Link, and Referral Transactions</li>
                        <li>Account Notifications</li>
                        <li>Account Status</li>
                      </ul>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-foreground">Government-Issued Identification</h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>ID documents for KYC verification</li>
                        <li>Selfies and liveness verification data</li>
                        <li>Proof of address documents</li>
                      </ul>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-foreground">Device and Technical Information</h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>IP addresses and device identifiers</li>
                        <li>Browser type and version</li>
                        <li>Operating system</li>
                        <li>Usage data and preferences</li>
                        <li>Location data</li>
                        <li>Cookies and similar tracking technologies</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Eye className="h-6 w-6 text-primary" />
                    How We Use Your Information
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We use the information we collect to:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <h3 className="font-semibold mb-2 text-foreground">Infrastructure Support</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Provide, maintain, and improve our software</li>
                        <li>Process technical data and related information</li>
                        <li>Enable platform trading and service functionality</li>
                      </ul>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <h3 className="font-semibold mb-2 text-foreground">Security &amp; Compliance</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Verify your identity and prevent fraud</li>
                        <li>Comply with legal obligations and regulatory requirements</li>
                        <li>Detect, investigate, and prevent fraudulent transactions</li>
                      </ul>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <h3 className="font-semibold mb-2 text-foreground">Communication</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Send technical notices, updates, and support messages</li>
                        <li>Communicate about products, services, and events</li>
                        <li>Respond to your inquiries and requests</li>
                      </ul>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <h3 className="font-semibold mb-2 text-foreground">Analytics &amp; Improvement</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Monitor and analyze trends, usage, and activities</li>
                        <li>Improve user experience and platform functionality</li>
                        <li>Develop new features and services</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    Data Security
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. Our security measures include:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Encryption</h4>
                        <p className="text-xs text-muted-foreground">Data encrypted in transit and at rest</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Secure Servers</h4>
                        <p className="text-xs text-muted-foreground">Protected infrastructure with firewalls</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Regular Audits</h4>
                        <p className="text-xs text-muted-foreground">Continuous security monitoring</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Access Controls</h4>
                        <p className="text-xs text-muted-foreground">Restricted data access policies</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mt-4 italic">
                    However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    Information Sharing
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4 font-semibold">
                    We do not sell your personal information.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We may share your information with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Service providers who assist in operating our platform</li>
                    <li>Legal and regulatory authorities when required by law</li>
                    <li>Professional advisors such as lawyers and auditors</li>
                    <li>Third parties in connection with a merger, sale, or acquisition</li>
                    <li>Integrated third-party service partners as necessary to fulfil your requested service</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required by law. When we no longer need your information, we will securely delete or anonymize it. Retention periods vary based on data type and regulatory requirements.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <UserCheck className="h-6 w-6 text-primary" />
                    Your Rights
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Depending on your location, you may have the following rights:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                      <h4 className="font-semibold mb-1">Access</h4>
                      <p className="text-sm text-muted-foreground">Request a copy of your personal information</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                      <h4 className="font-semibold mb-1">Correction</h4>
                      <p className="text-sm text-muted-foreground">Update inaccurate or incomplete information</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                      <h4 className="font-semibold mb-1">Deletion</h4>
                      <p className="text-sm text-muted-foreground">Request removal of your personal data</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                      <h4 className="font-semibold mb-1">Restriction</h4>
                      <p className="text-sm text-muted-foreground">Object to or restrict processing activities</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                      <h4 className="font-semibold mb-1">Portability</h4>
                      <p className="text-sm text-muted-foreground">Receive your data in a portable format</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                      <h4 className="font-semibold mb-1">Withdraw Consent</h4>
                      <p className="text-sm text-muted-foreground">Revoke consent at any time</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Cookies and Tracking
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We use cookies and similar tracking technologies to collect and use information about your use of our platform. For more information, please see our{" "}
                    <Link href="/cookie-policy" className="text-primary hover:underline font-medium">
                      Cookie Policy
                    </Link>
                    .
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Globe className="h-6 w-6 text-primary" />
                    International Data Transfers
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We may transfer personal information to other countries, for example, for customer service or to process transactions. Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
                  <h2 className="text-2xl font-bold mb-4">State-Specific Privacy Rights</h2>
                  <div className="space-y-4">
                    <div className="bg-background/80 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                        <span className="text-primary">•</span> California Residents
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        If your Pexly account has a California mailing address, we will not share personal information we collect about you except to the extent permitted under California law. California residents have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, to request deletion, and to opt-out of the sale of personal information.
                      </p>
                    </div>
                    <div className="bg-background/80 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                        <span className="text-primary">•</span> Vermont Residents
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        If your Pexly account has a Vermont address, we will not share personal information we collect about you with nonaffiliates unless the law allows or you provide authorization.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete it.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.
                  </p>
                </div>

                <div className="bg-muted/50 p-6 rounded-lg border-l-4 border-primary">
                  <div className="flex gap-3">
                    <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2">Contact Us</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        If you have questions about this Privacy Notice or wish to exercise your rights, please contact us at:
                      </p>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          <strong>Email:</strong>{" "}
                          <a href="mailto:privacy@pexly.com" className="text-primary hover:underline">
                            privacy@pexly.com
                          </a>
                        </p>
                        <p className="text-muted-foreground">
                          <strong>Address:</strong> 4023 Kennett Pike #50541, Wilmington, DE 19807
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
