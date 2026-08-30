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
} from "@/lib/icons";
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
        lastUpdated="August 30, 2026"
      />

      {/* Content — overlaps hero above and footer below */}
      <section className="relative z-10 -mt-20 pb-0">
        <div className="w-full bg-background rounded-3xl shadow-2xl px-6 md:px-12 py-10 -mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Legal Documents sidebar */}
            <div className="md:col-span-1">
              <div className="sticky top-24">
                <Collapsible
                  open={openLegal}
                  onOpenChange={setOpenLegal}
                  className="md:hidden"
                >
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

                <div className="hidden md:block">
                  <div className="rounded-xl border border-primary/20 bg-background/70 backdrop-blur-md shadow-md overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-primary/15 bg-primary/5">
                      <h3 className="text-sm font-semibold">
                        Legal Documents
                      </h3>
                    </div>

                    <div className="p-3 space-y-3">
                      {legalSections.map((section) => (
                        <div key={section.category}>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase">
                            {section.category}
                          </h4>

                          <div className="space-y-1.5 ml-2">
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
            </div>

            {/* Column 2: Refund Policy Content */}
            <div className="md:col-span-3 space-y-8">
              {/* Language Notice */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  The English version of Pexly's legal agreements and policies
                  is the current and controlling version of these documents.
                  Any translated version is provided for convenience only and
                  is not legally binding. In the event of any disagreement or
                  conflict between the English version and a translated
                  version, the English version shall prevail.
                </p>
              </div>

              {/* Introduction */}
              <div>
                <p className="text-muted-foreground leading-relaxed">
                  This Refund Policy ("Policy") explains how refunds are
                  handled for purchases made through Pexly's Shop &
                  Dropshipping and Gift Card services. Pexly operates distinct
                  commerce flows, each with different fulfilment partners and
                  product characteristics, and each is governed by the refund
                  rules set out below. By placing an order through either
                  service, you acknowledge that you have read and accepted
                  this Policy together with our{" "}
                  <Link
                    to="/terms"
                    className="text-primary hover:underline"
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              {/* Scope */}
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Scope of This Policy
                </h2>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  This Policy applies to:
                </p>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>
                    Physical and digital goods purchased through Pexly Shop and
                    participating dropshipping merchants integrated with the
                    platform.
                  </li>
                  <li>
                    Digital gift cards and vouchers purchased through Pexly's
                    Gift Card marketplace.
                  </li>
                </ul>

                <p className="text-muted-foreground leading-relaxed">
                  It does{" "}
                  <span className="font-semibold text-foreground">not</span>{" "}
                  apply to spot trades, perpetual futures, swaps, prediction
                  markets, staking, on-chain transactions, airtime top-ups, or
                  other digital asset activities. Those services are governed
                  by the relevant sections of the{" "}
                  <Link
                    to="/terms"
                    className="text-primary hover:underline"
                  >
                    Terms &amp; Conditions
                  </Link>
                  .
                </p>
              </div>

              {/* SHOP & DROPSHIPPING */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  Part 1 — Shop &amp; Dropshipping Refund Policy
                </h2>

                <p className="text-muted-foreground leading-relaxed">
                  Shop &amp; Dropshipping orders may be fulfilled by
                  independent third-party suppliers and brands. Pexly
                  facilitates product discovery, checkout, payment processing,
                  and order management, while the applicable supplier is
                  responsible for sourcing, fulfilment, shipping, and
                  supplier-side after-sales handling. Pexly will assist
                  customers with eligible refund and order issues in accordance
                  with this Policy and applicable law.
                </p>
              </div>

              {/* 1.1 ELIGIBILITY */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  1.1 When You Are Eligible for a Refund
                </h3>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  Subject to applicable law and the specific terms displayed
                  for an order, you may request a refund for a Shop or
                  Dropshipping order in the following situations:
                </p>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    <span className="font-semibold text-foreground">
                      Item not delivered
                    </span>{" "}
                    — your order has not been delivered within the maximum
                    delivery window stated on the applicable product page or
                    at checkout.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Wrong item received
                    </span>{" "}
                    — the product received does not materially match the item
                    description, variant, size, colour, or other material
                    specifications of the order.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Damaged on arrival
                    </span>{" "}
                    — the product arrived broken, defective, or materially
                    damaged in transit, and the issue is reported within 7
                    calendar days of delivery with reasonable supporting
                    evidence.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Materially defective
                    </span>{" "}
                    — the product fails to function substantially as described
                    within any applicable manufacturer or supplier warranty
                    period and cannot reasonably be repaired or replaced.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Order cancellation before dispatch
                    </span>{" "}
                    — you request cancellation before the supplier marks the
                    order as shipped. The applicable cancellation period,
                    where one is provided, will be displayed at checkout or in
                    your order information.
                  </li>
                </ul>
              </div>

              {/* 1.2 NOT ELIGIBLE */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  1.2 What Is Not Eligible for a Refund
                </h3>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  Subject to any rights that cannot legally be excluded, the
                  following circumstances are generally not covered:
                </p>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    Buyer's remorse, change of mind, or no longer wanting an
                    item after it has been shipped.
                  </li>

                  <li>
                    Custom-made, made-to-order, personalised, or
                    print-on-demand items, except where required by applicable
                    law or where the item is defective or materially different
                    from what was ordered.
                  </li>

                  <li>
                    Perishable goods, intimate apparel, hygiene products, and
                    other goods that cannot reasonably be resold for safety or
                    health reasons, except where required by applicable law.
                  </li>

                  <li>
                    Sealed digital goods, software licences, or downloadable
                    products after the licence or download has been delivered,
                    except where required by applicable law.
                  </li>

                  <li>
                    Damage caused by misuse, accident, normal wear and tear, or
                    failure to follow applicable manufacturer instructions.
                  </li>

                  <li>
                    Orders where the delivery address supplied by the buyer was
                    incorrect, incomplete, or otherwise undeliverable.
                  </li>

                  <li>
                    Items returned without prior authorisation from Pexly or
                    the applicable supplier where authorisation is required.
                  </li>
                </ul>
              </div>

              {/* 1.3 REQUEST */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  1.3 How to Request a Refund
                </h3>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  To request a refund for a Shop or Dropshipping order:
                </p>

                <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    Open{" "}
                    <Link
                      to="/dashboard"
                      className="text-primary hover:underline"
                    >
                      your dashboard
                    </Link>{" "}
                    and locate the order under{" "}
                    <span className="font-semibold text-foreground">
                      Orders &amp; Shipments
                    </span>
                    .
                  </li>

                  <li>
                    Select{" "}
                    <span className="font-semibold text-foreground">
                      Request Refund
                    </span>{" "}
                    and choose the relevant reason.
                  </li>

                  <li>
                    Attach clear photographs and, where applicable, a short
                    video showing the defect, damage, or incorrect item,
                    including relevant packaging labels or tracking
                    information.
                  </li>

                  <li>
                    Provide your order number, item SKU where applicable, and a
                    brief description of the issue.
                  </li>

                  <li>
                    Submit the request. A confirmation will be provided
                    through the available account or communication channels.
                  </li>
                </ol>
              </div>

              {/* 1.4 TIMELINES */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  1.4 Review Timelines
                </h3>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    <span className="font-semibold text-foreground">
                      Acknowledgement:
                    </span>{" "}
                    within 1 business day of submission.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Supplier review:
                    </span>{" "}
                    up to 7 business days where supplier verification is
                    required.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Decision:
                    </span>{" "}
                    generally within 10 business days of submission. Complex
                    cases, including cross-border returns, may take up to 21
                    business days.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Refund processing:
                    </span>{" "}
                    approved refunds will normally be initiated within 3
                    business days after the refund decision.
                  </li>
                </ul>
              </div>

              {/* 1.5 RETURNS */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  1.5 Returns &amp; Restocking
                </h3>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  Where a return is required, Pexly or the applicable supplier
                  will provide return instructions. Whether a prepaid return
                  label is provided depends on the reason for the return and
                  the supplier's applicable return arrangements.
                </p>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  Where a return is authorised, buyers must:
                </p>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    Ship the item back within 14 calendar days of receiving
                    return authorisation, unless a different period is
                    specified.
                  </li>

                  <li>
                    Use a tracked shipping service where instructed and
                    provide the tracking number to support.
                  </li>

                  <li>
                    Return the item in its original condition where reasonably
                    possible, including original packaging, tags, and
                    accessories.
                  </li>
                </ul>

                <p className="text-muted-foreground leading-relaxed mt-4">
                  A restocking fee of up to 15% may apply to certain
                  non-defective returns or cancellations where the applicable
                  supplier permits such a return. Original shipping fees are
                  generally non-refundable unless the return or refund results
                  from a supplier error, defective item, incorrect item, or
                  other circumstance requiring reimbursement under applicable
                  law.
                </p>
              </div>

              {/* GIFT CARDS */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mt-12">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Gift className="h-6 w-6 text-primary" />
                  Part 2 — Gift Cards Refund Policy
                </h2>

                <p className="text-muted-foreground leading-relaxed">
                  Gift cards are prepaid digital instruments issued or
                  distributed by third-party brands, merchants, or
                  distributors. Because gift card codes may have monetary
                  value and can be transferred or redeemed once delivered,
                  refunds are subject to the rules below.
                </p>
              </div>

              {/* 2.1 GENERAL RULE */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  2.1 General Rule — Gift Card Sales
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  Gift card purchases are generally{" "}
                  <span className="font-semibold text-foreground">
                    final and non-refundable
                  </span>{" "}
                  once the redemption code has been generated and made
                  available to you, except for the limited circumstances
                  described below or where applicable law provides otherwise.
                  This includes cases where a customer purchased the wrong
                  brand, denomination, or region when the correct details were
                  clearly displayed before purchase.
                </p>
              </div>

              {/* 2.2 EXCEPTIONS */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  2.2 Limited Exceptions
                </h3>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly will investigate and, where a claim is verified,
                  provide an appropriate remedy for the following situations:
                </p>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    <span className="font-semibold text-foreground">
                      Code never delivered
                    </span>{" "}
                    — payment was completed but no code was issued or made
                    available within the applicable delivery period.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Invalid or already-redeemed code
                    </span>{" "}
                    — the code cannot be redeemed due to a verifiable supplier
                    or issuer error, provided the issue was not caused by the
                    customer.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Incorrect denomination or brand
                    </span>{" "}
                    — the card delivered does not match the brand, value, or
                    region confirmed at checkout.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Issuer revocation
                    </span>{" "}
                    — the issuer invalidates the card for reasons not
                    attributable to the customer.
                  </li>
                </ul>
              </div>

              {/* 2.3 NOT ELIGIBLE */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  2.3 What Is Not Eligible
                </h3>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    Codes that have already been redeemed, partially redeemed,
                    or transferred to a third party, except where an issuer or
                    supplier error is verified.
                  </li>

                  <li>
                    Cards purchased for the wrong region, brand, or
                    denomination where the correct details were clearly
                    displayed at checkout.
                  </li>

                  <li>
                    Cards rejected by the issuer because of restrictions
                    associated with the customer's account, location, or method
                    of redemption, where Pexly was not responsible for the
                    restriction.
                  </li>

                  <li>
                    Codes shared, publicly posted, or compromised after
                    delivery to the customer's account.
                  </li>

                  <li>
                    Promotional cards explicitly marked as non-refundable at
                    checkout, except where applicable law provides otherwise.
                  </li>
                </ul>
              </div>

              {/* 2.4 REPORT */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  2.4 How to Report a Gift Card Issue
                </h3>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  Gift card issues should be reported as soon as possible so
                  that Pexly and the relevant supplier or issuer can verify the
                  transaction.
                </p>

                <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    Open the gift card order in your{" "}
                    <Link
                      to="/dashboard"
                      className="text-primary hover:underline"
                    >
                      dashboard
                    </Link>{" "}
                    and select{" "}
                    <span className="font-semibold text-foreground">
                      Report Issue
                    </span>
                    .
                  </li>

                  <li>
                    Choose the relevant issue type, such as not delivered,
                    invalid code, incorrect card, or issuer-related issue.
                  </li>

                  <li>
                    Provide the order ID, masked code where requested, date and
                    method of attempted redemption, and any relevant
                    screenshot or error message from the issuer.
                  </li>

                  <li>
                    Report the issue within{" "}
                    <span className="font-semibold text-foreground">
                      24 hours
                    </span>{" "}
                    where possible. Certain supplier or issuer claims may
                    become difficult to verify after longer periods.
                  </li>
                </ol>
              </div>

              {/* 2.5 VERIFICATION */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  2.5 Verification &amp; Resolution
                </h3>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    <span className="font-semibold text-foreground">
                      Acknowledgement:
                    </span>{" "}
                    within 1 business day.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Issuer verification:
                    </span>{" "}
                    up to 5 business days where verification with the supplier
                    or issuer is required.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Resolution:
                    </span>{" "}
                    where the claim is verified, Pexly may provide an
                    equivalent replacement code or process a refund, depending
                    on the circumstances and applicable supplier arrangements.
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Refund processing:
                    </span>{" "}
                    approved refunds will normally be initiated within 3
                    business days after the decision.
                  </li>
                </ul>
              </div>

              {/* REFUND METHOD */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Wallet className="h-6 w-6 text-primary" />
                  Refund Method &amp; Payment Processing
                </h2>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  Approved refunds will generally be processed using the
                  original payment method used for the purchase. The time it
                  takes for the refund to appear in the customer's account may
                  vary depending on the bank, card issuer, payment processor,
                  or other payment service involved.
                </p>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  Where the original payment method cannot technically receive
                  a refund, Pexly may provide an alternative refund method,
                  subject to applicable law and reasonable verification
                  requirements.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  For purchases made using cryptocurrency or other digital
                  assets, the refund amount may be calculated using the
                  applicable fiat-equivalent value of the eligible purchase at
                  the time of the original transaction, unless otherwise
                  required by the applicable payment terms or law. Due to
                  digital asset price movements, the quantity of cryptocurrency
                  received at refund may therefore differ from the quantity
                  originally used for payment.
                </p>
              </div>

              {/* SLA */}
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
                        <th className="px-4 py-3 font-semibold">
                          Shop &amp; Dropshipping
                        </th>
                        <th className="px-4 py-3 font-semibold">
                          Gift Cards
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border text-muted-foreground">
                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Reporting window
                        </td>
                        <td className="px-4 py-3">
                          7 days from delivery for damage/defect claims; as
                          soon as reasonably possible for non-delivery claims
                        </td>
                        <td className="px-4 py-3">
                          Report as soon as possible; 24 hours recommended
                        </td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Acknowledgement
                        </td>
                        <td className="px-4 py-3">1 business day</td>
                        <td className="px-4 py-3">1 business day</td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Decision
                        </td>
                        <td className="px-4 py-3">
                          Up to 10 business days; up to 21 for complex
                          cross-border cases
                        </td>
                        <td className="px-4 py-3">
                          Generally within 5 business days where issuer
                          verification is required
                        </td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Refund processing
                        </td>
                        <td className="px-4 py-3">
                          Normally initiated within 3 business days after
                          approval
                        </td>
                        <td className="px-4 py-3">
                          Normally initiated within 3 business days after
                          approval
                        </td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3 font-medium text-foreground">
                          Refund destination
                        </td>
                        <td className="px-4 py-3">
                          Generally the original payment method
                        </td>
                        <td className="px-4 py-3">
                          Generally the original payment method or an
                          equivalent replacement code where applicable
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DISPUTES */}
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Disputes &amp; Escalation
                </h2>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you disagree with a refund decision, you may escalate the
                  matter by replying to your case communication within 14
                  calendar days of the decision and requesting a further
                  review. Pexly will reassess the information available and
                  respond within a reasonable period.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Where an issue concerns the independent terms, warranty,
                  restrictions, or policies of a third-party brand, supplier,
                  or gift card issuer, Pexly may assist with the claim but
                  cannot guarantee a remedy that is outside the applicable
                  supplier or issuer terms.
                </p>
              </div>

              {/* QUICK LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <h3 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Typically refundable
                  </h3>

                  <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground ml-2">
                    <li>Order not delivered within the stated window</li>
                    <li>Wrong, materially defective, or damaged item</li>
                    <li>Eligible cancellation before dispatch</li>
                    <li>Gift card never delivered</li>
                    <li>Verified invalid gift card code</li>
                    <li>
                      Mismatch between the card confirmed at checkout and the
                      card delivered
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5">
                  <h3 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Generally not refundable
                  </h3>

                  <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground ml-2">
                    <li>Change of mind after dispatch</li>
                    <li>Custom or personalised items where permitted</li>
                    <li>Perishable or hygiene-restricted items</li>
                    <li>Incorrect address provided by the buyer</li>
                    <li>Already-redeemed gift card codes</li>
                    <li>
                      Wrong brand or region purchased in error when clearly
                      displayed at checkout
                    </li>
                  </ul>
                </div>
              </div>

              {/* IMPORTANT NOTICE */}
              <div className="bg-amber-500/10 p-6 rounded-lg border border-amber-500/20">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                  Important Notice
                </h2>

                <div className="space-y-3 text-sm">
                  <p className="font-semibold uppercase">
                    APPROVED REFUNDS ARE GENERALLY PROCESSED TO THE ORIGINAL
                    PAYMENT METHOD USED FOR THE PURCHASE. PROCESSING TIMES MAY
                    VARY DEPENDING ON THE BANK, CARD ISSUER, PAYMENT PROCESSOR,
                    OR OTHER PAYMENT SERVICE.
                  </p>

                  <p className="font-semibold uppercase">
                    FOR CRYPTOCURRENCY PAYMENTS, THE DIGITAL ASSET AMOUNT
                    RETURNED MAY DIFFER FROM THE AMOUNT ORIGINALLY SPENT DUE TO
                    CHANGES IN DIGITAL ASSET PRICES BETWEEN THE PURCHASE AND
                    REFUND DATES.
                  </p>

                  <p className="font-semibold uppercase">
                    GIFT CARD CODES THAT HAVE BEEN REVEALED, COPIED, SHARED, OR
                    REDEEMED MAY NOT BE REFUNDABLE EXCEPT WHERE A VALID
                    EXCEPTION UNDER THIS POLICY OR APPLICABLE LAW APPLIES.
                  </p>
                </div>
              </div>

              {/* CONTACT */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                  <Mail className="h-6 w-6 text-primary" />
                  Contact &amp; Support
                </h2>

                <p className="text-muted-foreground leading-relaxed mb-3">
                  For refund requests, status updates, or questions about this
                  Policy, please contact our support team:
                </p>

                <ul className="space-y-1.5 text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">
                      In-app:
                    </span>{" "}
                    <Link
                      to="/support"
                      className="text-primary hover:underline"
                    >
                      Support Center
                    </Link>
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Email:
                    </span>{" "}
                    <a
                      href="mailto:support@pexly.app"
                      className="text-primary hover:underline"
                    >
                      support@pexly.app
                    </a>
                  </li>

                  <li>
                    <span className="font-semibold text-foreground">
                      Contact form:
                    </span>{" "}
                    <Link
                      to="/contact"
                      className="text-primary hover:underline"
                    >
                      pexly.app/contact
                    </Link>
                  </li>
                </ul>

                <p className="text-muted-foreground leading-relaxed text-sm mt-4">
                  When contacting support, please include your order ID, the
                  date of purchase, and any relevant supporting screenshots or
                  documentation so we can review your request efficiently.
                </p>
              </div>

              {/* UPDATES */}
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Updates to This Policy
                </h2>

                <p className="text-muted-foreground leading-relaxed">
                  We may update this Policy from time to time to reflect
                  changes in our services, partner arrangements, payment
                  methods, or applicable law. The date at the top of this page
                  indicates when the Policy was last revised. Where required,
                  material changes will be communicated through appropriate
                  channels. Continued use of Pexly Shop, Dropshipping, or Gift
                  Card services after an update constitutes acceptance of the
                  revised Policy to the extent permitted by applicable law.
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
