import { useHead } from "@unhead/react";
import {
  AlertCircle,
  ChevronDown,
  ShoppingBag,
  Gift,
  Wallet,
  Clock,
  Mail,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AppFooter } from "@/components/app-footer";
import { LegalPageHero } from "@/components/legal-page-hero";
import { Link } from "wouter";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function RefundPolicy() {
  useHead({
    title: "Refund Policy | Pexly",
    meta: [
      {
        name: "description",
        content:
          "Pexly's refund policy for Shop & Dropshipping orders and Gift Card purchases — eligibility, request process, timelines, and resolution.",
      },
    ],
  });
  const [openLegal, setOpenLegal] = useState(false);

  const legalSections = [
    {
      category: "Agreements",
      links: [
        { text: "Terms & Conditions", href: "/terms" },
        { text: "VIP Terms", href: "/vip-terms" },
      ],
    },
    {
      category: "Policies",
      links: [
        { text: "Privacy Policy", href: "/privacy" },
        { text: "Cookie Policy", href: "/cookie-policy" },
        { text: "AML Policy", href: "/aml-policy" },
        { text: "Refund Policy", href: "/refund-policy" },
      ],
    },
    {
      category: "Other",
      links: [
        { text: "Vendor Reminder", href: "/vendor-reminder" },
        { text: "Risk Disclosure", href: "/risk-disclosure" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LegalPageHero
        title="Refund Policy"
        subtitle="Transparent rules for refunds on Shop & Dropshipping orders and Gift Card purchases on Pexly."
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

            {/* Column 2: Refund Policy Content */}
            <div className="md:col-span-3 space-y-8">

              <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  The English version of legal agreements and policies is considered as the only current and valid version of this document. Any translated version is provided for your convenience only. Translated versions are not legally binding and cannot replace the English versions. In the event of disagreement or conflict, the English language legal agreements and policies shall prevail.
                </p>
              </div>

              <div>
                <p className="text-muted-foreground leading-relaxed">
                  This Refund Policy ("Policy") explains how refunds are handled for purchases made through Pexly's Shop &amp; Dropshipping and Gift Card services. Pexly operates two distinct commerce flows, each with different fulfilment partners and risk profiles, and each is governed by its own refund rules set out below. By placing an order through either service, you acknowledge that you have read and accepted this Policy together with our{" "}
                  <Link href="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link> and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Scope of This Policy</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  This Policy applies exclusively to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>Physical and digital goods purchased through Pexly Shop and dropshipping merchants integrated with the platform.</li>
                  <li>Digital gift cards and vouchers purchased through Pexly's Gift Card marketplace.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  It does <span className="font-semibold text-foreground">not</span> apply to spot trades, perpetual futures, swaps, prediction markets, staking, on-chain transactions, airtime top-ups, or any other digital asset activity. Those services are governed by the relevant sections of the{" "}
                  <Link href="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>.
                </p>
              </div>

              {/* ─── SHOP & DROPSHIPPING ─────────────────────────────── */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  Part 1 — Shop &amp; Dropshipping Refund Policy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Shop &amp; Dropshipping orders are fulfilled by independent third-party suppliers and brands. Pexly facilitates discovery, checkout, and crypto payment, but the supplier is responsible for sourcing, shipping, and after-sales handling of the product. The rules below set out when and how a refund may be issued.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">1.1 When You Are Eligible for a Refund</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You may request a refund for a Shop or dropshipping order in the following situations:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><span className="font-semibold text-foreground">Item not delivered</span> — your order has not been delivered within the maximum advertised delivery window (typically 30 days from dispatch, unless a longer window is shown on the product page).</li>
                  <li><span className="font-semibold text-foreground">Wrong item received</span> — the product you received does not match the item description, variant, size, or colour you ordered.</li>
                  <li><span className="font-semibold text-foreground">Damaged on arrival</span> — the product arrived broken, defective, or damaged in transit, and the issue is reported within 7 calendar days of delivery with photographic evidence.</li>
                  <li><span className="font-semibold text-foreground">Materially defective</span> — the product fails to function as described within the manufacturer's stated warranty window and cannot be repaired or replaced.</li>
                  <li><span className="font-semibold text-foreground">Order cancellation before dispatch</span> — you cancel the order before the supplier marks it as shipped (cancellation window is typically 12 hours from order confirmation, or as displayed at checkout).</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">1.2 What Is Not Eligible for a Refund</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The following situations are not covered by this Policy:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Buyer's remorse, change of mind, or no longer wanting the item once it has shipped.</li>
                  <li>Custom-made, made-to-order, personalised, or print-on-demand items.</li>
                  <li>Perishable goods, intimate apparel, hygiene products, and items that cannot be resold for safety or health reasons.</li>
                  <li>Sealed digital goods, software licences, or downloadable products once the licence or download has been delivered.</li>
                  <li>Damage caused by misuse, accident, normal wear and tear, or failure to follow the manufacturer's instructions.</li>
                  <li>Orders where the delivery address provided by the buyer was incorrect, incomplete, or unreachable by the courier.</li>
                  <li>Items returned without prior authorisation from Pexly support or the supplier.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">1.3 How to Request a Refund</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To request a refund for a Shop or dropshipping order:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Open <Link href="/dashboard" className="text-primary hover:underline">your dashboard</Link> and locate the order under <span className="font-semibold text-foreground">Orders &amp; Shipments</span>.</li>
                  <li>Select <span className="font-semibold text-foreground">Request Refund</span> on the order and choose the relevant reason from the list.</li>
                  <li>Attach clear, well-lit photographs (and, where applicable, a short video) showing the defect, damage, or wrong item — including any packaging labels or tracking information.</li>
                  <li>Provide your order number, the item SKU, and a brief description of the issue.</li>
                  <li>Submit the request. You will receive a confirmation in-app and by email within 24 hours.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">1.4 Review Timelines</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><span className="font-semibold text-foreground">Acknowledgement:</span> within 1 business day of submission.</li>
                  <li><span className="font-semibold text-foreground">Supplier review:</span> up to 7 business days while the supplier verifies the claim and any returned item.</li>
                  <li><span className="font-semibold text-foreground">Decision:</span> issued within 10 business days of submission for the majority of cases. Complex cases involving cross-border returns may take up to 21 business days.</li>
                  <li><span className="font-semibold text-foreground">Settlement:</span> approved refunds are settled to your Pexly wallet within 3 business days of the decision.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">1.5 Returns &amp; Restocking</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Where a return is required, the supplier or Pexly will provide return instructions and, in most cases, a prepaid return label. Buyers must:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Ship the item back within 14 calendar days of receiving return authorisation.</li>
                  <li>Use a tracked shipping service and share the tracking number with support.</li>
                  <li>Return the item in its original condition, with all original packaging, tags, and accessories.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  A restocking fee of up to 15% may be applied on items returned for non-defect reasons (e.g. order cancellation after dispatch where the supplier permits cancellation as a goodwill gesture). Original shipping fees are non-refundable unless the return is caused by a supplier error.
                </p>
              </div>

              {/* ─── GIFT CARDS ──────────────────────────────────────── */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mt-12">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Gift className="h-6 w-6 text-primary" />
                  Part 2 — Gift Cards Refund Policy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Gift cards are pre-paid, denominated digital instruments issued by third-party brands and distributors. Once a code is delivered, it is functionally equivalent to cash and is treated as such. The rules below differ materially from the Shop policy because gift cards cannot be reclaimed once revealed.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">2.1 General Rule — All Sales Are Final</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All gift card purchases on Pexly are <span className="font-semibold text-foreground">final and non-refundable</span> once the redemption code has been generated and made visible to you in your dashboard. This includes situations where you purchased the wrong brand, the wrong denomination, the wrong region, or simply changed your mind. By revealing or copying the code, you are deemed to have accepted delivery.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">2.2 Limited Exceptions</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Notwithstanding the general rule above, Pexly will investigate and, where verified, refund or replace gift cards in the following narrowly-defined cases:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><span className="font-semibold text-foreground">Code never delivered</span> — payment was completed but no code was issued to your dashboard within 24 hours.</li>
                  <li><span className="font-semibold text-foreground">Invalid or already-redeemed code</span> — the code as delivered cannot be redeemed at the issuer due to a verifiable supplier or issuer error, and you have not redeemed it yourself.</li>
                  <li><span className="font-semibold text-foreground">Incorrect denomination or brand</span> — the card delivered does not match the brand, value, or region shown at checkout.</li>
                  <li><span className="font-semibold text-foreground">Issuer revocation</span> — the issuer cancels or invalidates the card within 24 hours of issue for reasons that are not attributable to you.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">2.3 What Is Not Eligible</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Codes that have already been redeemed, partially redeemed, or transferred to a third party.</li>
                  <li>Cards purchased for the wrong region, brand, or denomination where the correct details were displayed at checkout.</li>
                  <li>Cards rejected by the issuer because of restrictions tied to your account, location, or method of redemption.</li>
                  <li>Codes shared, posted publicly, or compromised after delivery to your dashboard.</li>
                  <li>Cards purchased on promotional offers explicitly marked "non-refundable" at checkout.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">2.4 How to Report a Gift Card Issue</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Issues must be reported promptly to be eligible:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Open the gift card order in your <Link href="/dashboard" className="text-primary hover:underline">dashboard</Link> and select <span className="font-semibold text-foreground">Report Issue</span>.</li>
                  <li>Choose the issue type (not delivered, invalid code, wrong card, issuer revocation).</li>
                  <li>Provide the order ID, the masked code (where requested), the date and method of attempted redemption, and a screenshot of the error message returned by the issuer.</li>
                  <li>Submit the report within <span className="font-semibold text-foreground">24 hours</span> of the original purchase. Reports made after this window cannot be honoured because the supplier reconciliation period will have closed.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">2.5 Verification &amp; Resolution</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><span className="font-semibold text-foreground">Acknowledgement:</span> within 1 business day.</li>
                  <li><span className="font-semibold text-foreground">Issuer verification:</span> up to 5 business days while Pexly confirms with the supplier or issuer that the code was not redeemed.</li>
                  <li><span className="font-semibold text-foreground">Resolution:</span> where the claim is verified, Pexly will at its sole discretion either (a) replace the gift card with an equivalent valid code, or (b) refund the original purchase amount to your Pexly wallet.</li>
                  <li><span className="font-semibold text-foreground">Settlement:</span> approved refunds are credited within 3 business days of the decision.</li>
                </ul>
              </div>

              {/* ─── REFUND METHOD ───────────────────────────────────── */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Wallet className="h-6 w-6 text-primary" />
                  Refund Method &amp; Crypto Volatility
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Approved refunds are credited to your Pexly wallet in the same digital asset originally used for payment. Refunds are based on the <span className="font-semibold text-foreground">fiat-equivalent amount paid at the time of purchase</span>, which means the amount of crypto returned may be different from the amount of crypto originally spent due to market price movements between purchase and refund.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly is not responsible for any loss or gain caused by changes in the price of digital assets between the date of purchase and the date of refund. By accepting a refund, you waive any claim against Pexly arising from such price movements.
                </p>
              </div>

              {/* ─── SLA ─────────────────────────────────────────────── */}
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  Service Level Summary
                </h2>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="px-4 py-3 font-semibold">Stage</th>
                        <th className="px-4 py-3 font-semibold">Shop &amp; Dropshipping</th>
                        <th className="px-4 py-3 font-semibold">Gift Cards</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">Reporting window</td>
                        <td className="px-4 py-3">7 days from delivery / 30 days from dispatch (non-delivery)</td>
                        <td className="px-4 py-3">24 hours from purchase</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">Acknowledgement</td>
                        <td className="px-4 py-3">1 business day</td>
                        <td className="px-4 py-3">1 business day</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">Decision</td>
                        <td className="px-4 py-3">Up to 10 business days (21 for cross-border)</td>
                        <td className="px-4 py-3">Up to 5 business days</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">Settlement</td>
                        <td className="px-4 py-3">3 business days after approval</td>
                        <td className="px-4 py-3">3 business days after approval</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">Refund destination</td>
                        <td className="px-4 py-3">Pexly wallet (same asset as payment)</td>
                        <td className="px-4 py-3">Pexly wallet (same asset as payment) or replacement code</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ─── DISPUTES ────────────────────────────────────────── */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Disputes &amp; Escalation</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you disagree with a refund decision, you may escalate the matter by replying to your case email within 14 calendar days of the decision and requesting a senior review. An independent reviewer will reassess the evidence and respond within 10 business days.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly does not arbitrate disputes between you and a third-party brand, supplier, or gift card issuer beyond what is set out in this Policy. Where the underlying claim concerns the issuer's product, terms, or warranty, you remain free to pursue your rights directly with the issuer.
                </p>
              </div>

              {/* ─── COVERED / NOT COVERED QUICK LIST ────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <h3 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Typically refundable
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground ml-2">
                    <li>Order never delivered within the stated window</li>
                    <li>Wrong, defective, or damaged item received</li>
                    <li>Cancellation before dispatch</li>
                    <li>Gift card never delivered or invalid code</li>
                    <li>Mismatch between checkout and delivered card</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5">
                  <h3 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Not refundable
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground ml-2">
                    <li>Change of mind after dispatch</li>
                    <li>Custom, perishable, or hygiene items</li>
                    <li>Incorrect address provided by the buyer</li>
                    <li>Already-redeemed or shared gift card codes</li>
                    <li>Wrong brand or region purchased in error</li>
                  </ul>
                </div>
              </div>

              {/* ─── IMPORTANT NOTICE ────────────────────────────────── */}
              <div className="bg-amber-500/10 p-6 rounded-lg border border-amber-500/20">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                  Important Notice
                </h2>
                <div className="space-y-3 text-sm">
                  <p className="font-semibold uppercase">
                    REFUNDS ARE ISSUED IN THE SAME DIGITAL ASSET USED FOR PAYMENT, BASED ON THE FIAT-EQUIVALENT AMOUNT PAID AT THE TIME OF PURCHASE. THE QUANTITY OF CRYPTO RETURNED MAY DIFFER FROM THE QUANTITY ORIGINALLY SPENT DUE TO MARKET VOLATILITY.
                  </p>
                  <p className="font-semibold uppercase">
                    GIFT CARD CODES THAT HAVE BEEN REVEALED, COPIED, OR REDEEMED ARE TREATED AS DELIVERED CASH AND CANNOT BE REFUNDED EXCEPT IN THE LIMITED CASES SET OUT IN THIS POLICY. PROTECT YOUR CODES AS YOU WOULD PROTECT CASH.
                  </p>
                </div>
              </div>

              {/* ─── CONTACT ─────────────────────────────────────────── */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                  <Mail className="h-6 w-6 text-primary" />
                  Contact &amp; Support
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  For refund requests, status updates, or questions about this Policy, please contact our support team:
                </p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">In-app:</span>{" "}
                    <Link href="/support" className="text-primary hover:underline">Support Center</Link>
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Email:</span>{" "}
                    <a href="mailto:support@pexly.app" className="text-primary hover:underline">support@pexly.app</a>
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Contact form:</span>{" "}
                    <Link href="/contact" className="text-primary hover:underline">pexly.app/contact</Link>
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed text-sm mt-4">
                  When contacting support, please include your order ID, the date of purchase, and any supporting screenshots so we can resolve your case as quickly as possible.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Updates to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Policy from time to time to reflect changes in our services, partner agreements, or applicable law. The date at the top of this page indicates when the Policy was last revised. Continued use of Pexly Shop, dropshipping, or Gift Card services after an update constitutes acceptance of the revised Policy.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
