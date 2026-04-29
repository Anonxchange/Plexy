
import { useHead } from "@unhead/react";
import { FileText, Shield, AlertCircle, ChevronDown } from "lucide-react";
import { AppFooter } from "@/components/app-footer";
import { LegalPageHero } from "@/components/legal-page-hero";
import { Link } from "wouter";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function Terms() {
  useHead({ title: "Terms of Service | Pexly", meta: [{ name: "description", content: "The terms of service governing your use of the Pexly platform." }] });
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
        { text: "Refund Policy", href: "/refund-policy" },
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
        title="User Agreement"
        subtitle="Please read these terms and conditions carefully before using Pexly services"
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

            {/* Column 2: Terms Content */}
            <div className="md:col-span-3 space-y-8">

              <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  The English version of legal agreements and policies is considered as the only current and valid version of this document. Any translated version is provided for your convenience only. Translated versions are not legally binding and cannot replace the English versions. In the event of disagreement or conflict, the English language legal agreements and policies shall prevail.
                </p>
              </div>

              <div>
                <p className="text-muted-foreground leading-relaxed">
                  You agree and understand that by signing up to Pexly and using the interface, you are agreeing to enter into this user agreement (the "Agreement") by and between you and Pexly.app, and be legally bound by its terms and conditions. By accessing and using Pexly, you are entering into a legally binding contract. If any term or condition of this User Agreement is unacceptable to you, please do not visit, access, or use Pexly. Use of the words "Pexly", "company", "we", "us," or "our" in this User Agreement refers to Pexly.app.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Services Definition</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly is a comprehensive digital asset trading platform offering a suite of integrated financial products and tools. The services provided by Pexly include, but are not limited to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>Spot Trading — buy and sell digital assets at live market prices</li>
                  <li>Perpetual Futures Trading — leveraged derivatives with no expiry date</li>
                  <li>Prediction Markets — forecast verifiable real-world and crypto events</li>
                  <li>Crypto Swap — instant cross-asset conversions</li>
                  <li>Non-Custodial Wallet — self-custody digital asset management where only you control your keys</li>
                  <li>Shop &amp; Dropshipping — purchase physical and digital products with crypto</li>
                  <li>Staking &amp; Earn — participate in yield-generating protocols</li>
                  <li>Gift Cards — purchase and trade gift cards from global brands</li>
                  <li>Airtime &amp; Mobile Top-Up — mobile credit purchases worldwide</li>
                  <li>Market Data &amp; Analytics — live prices, charts, and market intelligence</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly.app and its related interface are owned and operated by Pexly. Your use of the interface is also governed by our{" "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
                  <Link href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Regulatory Compliance</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Your conduct on Pexly is subject to the laws, regulations, and rules of your local jurisdiction and any applicable governmental authority. Pexly operates strictly as a technology and services provider:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Compliance with applicable regional digital asset regulations</li>
                  <li>Laws, regulations, and rules of relevant tax authorities</li>
                  <li>Applicable guidance regarding digital asset trading platforms</li>
                  <li>The Bank Secrecy Act and similar global anti-money laundering frameworks where applicable</li>
                  <li>Adherence to global sanctions lists including OFAC where technical measures permit</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  You represent that you are acting in compliance with and are legally bound by this User Agreement as well as the Applicable Laws in your jurisdiction.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Updates</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may make changes or updates to this Agreement for legal or regulatory reasons or at our discretion. If you continue to use the interface after these updates, you agree to the updated Agreement. The updated version will supersede all prior versions. We reserve the right to discontinue or make changes to any of the platform's features or services.
                </p>
              </div>

              <div className="bg-amber-500/10 p-6 rounded-lg border border-amber-500/20">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                  Important Risk Notice
                </h2>
                <div className="space-y-3 text-sm">
                  <p className="font-semibold uppercase">
                    THE VALUE OF DIGITAL ASSETS CAN GO UP OR DOWN. THERE CAN BE SUBSTANTIAL RISK THAT YOU LOSE MONEY TRADING, HOLDING, OR USING LEVERAGE ON DIGITAL ASSETS. YOU ARE RESPONSIBLE FOR ASSESSING WHETHER USING PEXLY IS SUITABLE FOR YOU.
                  </p>
                  <p className="font-semibold uppercase">
                    THE TREATMENT OF DIGITAL ASSETS VARIES BY JURISDICTION. THE PLATFORM IS NOT INTENDED FOR USE WHERE PROHIBITED BY LAW. DUE TO CHANGING REGULATORY REQUIREMENTS, PEXLY MAY RESTRICT ACCESS TO CERTAIN SERVICES WHERE REGULATORY POLICY PREVENTS THEIR OFFERING.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">What Pexly Is</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly is a multi-product digital asset trading platform providing users with access to spot markets, perpetual futures, prediction markets, crypto swaps, staking, and ancillary services. Pexly operates as a technology and services provider and does not operate as a licensed financial institution, investment advisor, or custody provider of client funds.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Spot Trading</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly's Spot Trading service enables users to buy and sell digital assets at current market prices. When using Spot Trading, you acknowledge and agree to the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Spot trades are executed at the best available market price at the time of your order. Prices may fluctuate between order placement and execution.</li>
                  <li>All spot trades are final once confirmed. Pexly does not guarantee the ability to cancel or modify an order once submitted to the market.</li>
                  <li>You are solely responsible for ensuring sufficient balance in your account before placing any trade.</li>
                  <li>Trading fees applicable to spot transactions will be displayed prior to order confirmation and are subject to change at Pexly's discretion.</li>
                  <li>Pexly does not guarantee liquidity, market depth, or continuous availability of any trading pair.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Perpetual Futures Trading</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly offers Perpetual Futures contracts — leveraged derivative instruments that allow users to speculate on the price of digital assets without an expiry date. By accessing Perpetual Futures, you acknowledge and agree to the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>Perpetual futures trading involves significant risk, including the possibility of losing your entire margin balance. Leverage amplifies both gains and losses.</li>
                  <li>Positions may be automatically liquidated if your margin falls below the required maintenance margin threshold. Pexly is not liable for losses resulting from liquidation.</li>
                  <li>Funding rates are applied periodically and may result in charges or credits to your account depending on market conditions and your position direction.</li>
                  <li>Pexly reserves the right to adjust leverage limits, margin requirements, or available contracts at any time in response to market conditions or regulatory requirements.</li>
                  <li>You are solely responsible for understanding perpetual contract mechanics before trading. Pexly does not provide trading advice or recommendations.</li>
                </ul>
                <p className="text-muted-foreground text-sm font-semibold uppercase">
                  PERPETUAL FUTURES ARE HIGH-RISK INSTRUMENTS. YOU MAY LOSE ALL FUNDS DEPOSITED AS MARGIN. ONLY TRADE WITH FUNDS YOU CAN AFFORD TO LOSE.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Prediction Markets</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly's Prediction Markets allow users to forecast the outcomes of future events, including cryptocurrency price movements, market milestones, and other verifiable events. By participating in Prediction Markets, you acknowledge and agree to the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Prediction Markets involve speculative activity. Outcomes are uncertain and you may lose the full amount staked on any prediction.</li>
                  <li>Market outcomes are determined based on publicly verifiable data at resolution time. Pexly reserves the right to select the resolution source and methodology for each market.</li>
                  <li>In the event of ambiguous, disputed, or unresolvable outcomes, Pexly may void a market and return staked funds at its sole discretion.</li>
                  <li>Participation in Prediction Markets may be restricted in certain jurisdictions. It is your responsibility to ensure such activity is lawful in your location.</li>
                  <li>Pexly does not guarantee the accuracy, timeliness, or availability of data used to resolve prediction markets.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Crypto Swap</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly's Swap feature enables users to instantly convert one digital asset to another. When using Swap, you acknowledge the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Swap rates are provided at the time of quote and may be subject to slippage depending on market conditions and the size of the transaction.</li>
                  <li>Swap transactions are final once confirmed and cannot be reversed. You are responsible for reviewing all details before confirming any swap.</li>
                  <li>Swap services may be facilitated through integrated third-party liquidity providers. Pexly is not responsible for the acts or omissions of these providers.</li>
                  <li>Network processing fees may apply and will be displayed prior to confirmation. These fees are not controlled by Pexly.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Staking &amp; Earn</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly provides access to staking and yield products through integrated third-party protocols. By participating in Staking or Earn products, you acknowledge and agree that:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Staking and Earn products are provided by independent third-party protocols. Pexly does not guarantee returns, yields, or the security of any staking protocol.</li>
                  <li>Staked assets may be subject to unbonding periods during which they cannot be withdrawn or traded.</li>
                  <li>Yields and APR figures are estimates and subject to change based on protocol conditions, network participation, and market factors.</li>
                  <li>You are responsible for understanding the mechanics and risks of any staking or earn product before participating.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">No Financial Advice</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly does not provide financial, investment, legal, or tax advice. All information provided through the platform is for general informational purposes only. Nothing on Pexly constitutes a recommendation to buy, sell, or hold any digital asset or to engage in any particular trading strategy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">User Responsibility &amp; Risk</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Users acknowledge and agree that they bear full responsibility for their trading decisions, position management, and all financial outcomes arising from the use of any Pexly service. Digital asset trading carries inherent risk, including the risk of total loss. You should only use funds you can afford to lose and should seek independent financial advice if necessary.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Regulatory Positioning</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly operates as a technology and services provider and does not engage in regulated financial activities such as banking, fund management, or custody of client assets on their behalf. The platform provides a technology interface for user-governed interactions with integrated financial products.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Pexly Non-Custodial Wallet</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly provides a non-custodial, self-custody wallet interface for managing digital assets. This means you, and only you, hold your private keys and have complete control over your Digital Assets. Pexly does not hold, control, or have access to your funds at any time. Pexly equips you to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>Generate and manage wallet addresses where only you control the private keys</li>
                  <li>View balances, transaction history, and asset performance across supported networks</li>
                  <li>Initiate swaps, trades, staking, and other integrated platform services from within the wallet interface</li>
                  <li>Send and receive supported digital assets directly on-chain</li>
                  <li>Access gift cards, airtime, shop purchases, and other services using your wallet</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Because Pexly is a non-custodial wallet, all associated activities and potential risks of loss are entirely under your control at all times. Pexly cannot freeze, reverse, or recover funds on your behalf.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Wallet Security &amp; Private Keys</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You bear exclusive responsibility for the preservation and security of your private key and recovery phrase ("Secret Phrase") associated with your wallet. Pexly does not store, retain, or have access to your private key, unencrypted private key, or Secret Phrase. If you lose access to these, your funds cannot be recovered by Pexly or any third party.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To protect your wallet and account, we strongly advise that you:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>Create a unique and strong password not used on any other platform</li>
                  <li>Enable two-factor authentication (2FA) on your account</li>
                  <li>Never store your private key or Secret Phrase in plain text online or in unsecured locations</li>
                  <li>Never share your private key, Secret Phrase, or login credentials with anyone</li>
                  <li>Restrict access to your devices and wallet at all times</li>
                  <li>Ensure your devices and networks are protected against malware and phishing</li>
                  <li>Immediately notify us of any suspected security breach related to your account</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly holds no liability for unauthorized activities on your wallet or account that result from your failure to maintain adequate security of your credentials.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Gift Card Services</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly offers gift card services through third-party providers. When utilizing gift card services, you acknowledge and agree to the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>Gift card services are operated by independent third-party providers. Pexly does not control their systems or inventory.</li>
                  <li>Pexly assumes no liability for the validity, authenticity, or functionality of any gift cards purchased through the platform.</li>
                  <li>Once a gift card transaction is completed and confirmed, Pexly cannot reverse or refund the transaction unless the third-party provider permits such actions.</li>
                  <li>Users are responsible for verifying the balance and terms of any gift card before completing a transaction.</li>
                  <li>Any disputes regarding gift card authenticity or redemption must be addressed directly with the gift card issuer or third-party service provider.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Airtime &amp; Mobile Top-Up</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly offers airtime and mobile top-up services through third-party providers. When utilizing these services, you acknowledge and agree to the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>Airtime and mobile services are provided by independent third-party telecommunications providers. Pexly does not control delivery timelines or availability.</li>
                  <li>Pexly assumes no liability for delays, failures, or errors in airtime delivery or service provisioning.</li>
                  <li>You are responsible for providing accurate phone numbers and subscriber information. Pexly is not liable for incorrect delivery due to user error.</li>
                  <li>Service availability and rates may vary by region and provider and are subject to change without notice.</li>
                  <li>Disputes regarding airtime delivery must be addressed directly with the telecommunications provider or third-party service provider.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Shop &amp; Dropshipping</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly's Shop integration allows users to purchase physical and digital products from integrated merchant partners and dropshipping providers using their digital asset balance. By using the Shop, you acknowledge and agree to the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>Shop products and inventory are supplied by independent third-party merchants and dropshipping partners. Pexly does not manufacture, warehouse, or directly fulfill any physical products.</li>
                  <li>Product availability, pricing, shipping estimates, and delivery timelines are set by the respective merchant partner and are subject to change without notice.</li>
                  <li>Once a shop order is confirmed and payment is processed, it may not be possible to cancel the order. Cancellation and refund eligibility is determined by the merchant partner's policy.</li>
                  <li>Pexly assumes no liability for delays, damaged goods, incorrect items, or non-delivery caused by third-party fulfillment partners or shipping carriers.</li>
                  <li>Digital product orders (e.g., software licenses, subscriptions) are typically non-refundable once delivered. Review product terms before completing any purchase.</li>
                  <li>Disputes regarding product quality, delivery, or fulfillment must be raised with Pexly Support, who will liaise with the applicable merchant partner on your behalf.</li>
                  <li>All purchases made via the Pexly Shop are subject to the terms and conditions of both Pexly and the respective merchant or fulfillment partner.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Digital Asset Transactions</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When you initiate a Digital Asset transaction on Pexly, the transaction is processed through Pexly's platform infrastructure and any applicable integrated third-party systems. By using Pexly, you acknowledge and consent to the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>Pexly may not be able to cancel or reverse a transaction once it has been submitted and confirmed</li>
                  <li>Network processing times and transaction finality may vary depending on market conditions and network load</li>
                  <li>You are responsible for reviewing all transaction details, including amounts, destination addresses, and applicable fees, before confirming any transaction</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Third-Party Services &amp; Content</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our platform connects you to a variety of services provided by our partners and integrated providers, including but not limited to: spot and derivatives trading, crypto swaps, prediction markets, staking protocols, gift card services, airtime top-up, and market data feeds. Pexly does not control these third-party services.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Your engagement with any third-party service is voluntary. While this Agreement governs your use of Pexly, your interaction with third-party content and services may be subject to additional terms set by those respective providers.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly denies any liability related to your use of third-party services. Disputes should be directed to the respective third-party provider.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Payment &amp; Fees</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Fees related to Pexly services are set by Pexly or, where applicable, by integrated third-party partners. Applicable fees will be displayed prior to using any service to which a fee applies. Fees may include, but are not limited to: trading fees, swap fees, network fees, and service charges.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly reserves the right to adjust its fee structure at any time. Any updates will be reflected on the platform prior to taking effect.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Transaction Fees</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Certain transactions on Pexly may incur network processing fees. These fees will be displayed clearly before you confirm any transaction. It is your responsibility to ensure your account has a sufficient balance to cover both the transaction amount and any applicable fees. Pexly is not liable for transaction failures resulting from insufficient account balance.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Taxes</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your tax obligations concerning transactions made through Pexly are solely your responsibility. You are required to determine what, if any, taxes apply to your activity on the platform. Pexly does not collect, report, withhold, or remit taxes arising from your use of the platform.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Intellectual Property License</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Subject to your agreement with these Terms, we grant you a non-exclusive, non-sublicensable, and non-transferable license to use Pexly strictly for your personal or internal business use. Unless otherwise stated, you are prohibited from:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Reproducing, altering, adapting, or creating derivative works of any part of Pexly</li>
                  <li>Leasing, distributing, selling, sublicensing, or transferring access to Pexly</li>
                  <li>Using Pexly for the benefit of any third party without prior written approval</li>
                  <li>Circumventing mechanisms in Pexly designed to limit your use</li>
                  <li>Performing reverse engineering, disassembling, or decompiling any part of the platform</li>
                  <li>Removing or obscuring any proprietary notices integrated into Pexly</li>
                  <li>Using Pexly for competitive analysis or to develop competing products</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  1. General
                </h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>It is your responsibility to read the Agreement carefully and periodically review it as posted on the Pexly Website. Your continued use of the Services shall signify your acceptance to be bound by the then-current Agreement.</li>
                  <li>Failure or delay by Pexly in enforcing or partially enforcing any provision of the Agreement shall not be construed as a waiver of any of our rights or remedies.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  2. Account &amp; Registration
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    In order to use the Services, you will need to register an Account through our platform. During registration, we will ask for certain information including but not limited to your name, address, and other personal information to verify your identity. We may, in our sole and absolute discretion, refuse to maintain an Account for you.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    By using your Account, you agree that you will use our Services for yourself only. Unless expressly authorized by Pexly, you are only allowed to maintain one Account and may not sell, borrow, share, or otherwise make your Account available to any other person or entity.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You are solely responsible for creating a strong password and maintaining adequate security and control of any IDs, passwords, PINs, API keys, or other codes used to access our Services.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">3. Legal Processes Affecting Your Account</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We have the right to immediately suspend your access to your Pexly Account. You agree and understand that Digital Assets held in your Pexly Account may be subject to freezing, forfeiture, or seizure by a law enforcement agency and may be wholly and permanently unrecoverable.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">4. Binding Arbitration</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 font-semibold uppercase">
                  ARBITRATION MEANS THAT YOU WAIVE YOUR RIGHT TO A JUDGE OR JURY IN A COURT PROCEEDING AND YOUR GROUNDS FOR APPEALS ARE LIMITED.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You and Pexly agree that any dispute arising out of or relating to this Agreement or the Services shall be finally settled in binding arbitration, on an individual basis, in accordance with the American Arbitration Association's rules for arbitration of consumer-related disputes.
                </p>
                <p className="text-muted-foreground leading-relaxed font-semibold uppercase">
                  CLASS ACTION WAIVER: TO THE EXTENT PERMISSIBLE BY LAW, ALL CLAIMS WILL ONLY BE BROUGHT ON AN INDIVIDUAL BASIS, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE ACTION, OR REPRESENTATIVE PROCEEDING.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">5. Privacy Policy &amp; Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We endeavor to take all reasonable steps to protect your personal information. However, we cannot guarantee the security of any data you disclose online. You accept the inherent security risks of providing information and dealing online over the Internet and will not hold us responsible for any breach of security unless it is due to our negligence.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Please view our official{" "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">6. No Warranty, Limitation of Liability &amp; Assumption of Risk</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 font-semibold uppercase">
                  THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY GUARANTEES, REPRESENTATIONS OR WARRANTIES, WHETHER EXPRESS, IMPLIED OR STATUTORY. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PEXLY SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND/OR NON-INFRINGEMENT.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly does not provide investment, tax, or legal advice. Pexly is not registered with the U.S. Securities and Exchange Commission and does not offer securities services or investment advice. You are solely responsible for determining whether any investment, investment strategy, or related transaction is appropriate for you.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">7. Release of Pexly &amp; Indemnity</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have a dispute arising from the use of our Services, you release Pexly, its affiliates, and service providers, and each of their respective officers, directors, employees, agents, and representatives from any and all claims, demands, and damages of every kind and nature arising out of or in any way connected with such disputes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">8. Trading on Pexly</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The platform allows users to access spot, perpetual futures, prediction markets, and other integrated trading products. When you initiate any transaction on Pexly, it is consummated pursuant to this Agreement and any additional product-specific terms displayed at the time of the transaction.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-semibold uppercase">
                    IT IS YOUR RESPONSIBILITY TO REVIEW ALL TRANSACTION DETAILS CAREFULLY BEFORE CONFIRMING. ALL CONFIRMED TRANSACTIONS ARE FINAL. PEXLY CANNOT GUARANTEE THE RECOVERY OF FUNDS LOST DUE TO USER ERROR.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">9. Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you believe an error has occurred in connection with your use of the platform, you should contact Pexly Support as promptly as possible. Pexly will review your case in accordance with this Agreement.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  You acknowledge and agree that Pexly's decision regarding a support case is conclusive and final as described in this Agreement. Pexly will have no liability in connection with decisions made in good faith pursuant to this Agreement.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">10. Fees for Using Pexly Services</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Creating a Wallet is free. Pexly charges fees for certain services; applicable fees will be displayed prior to you using any service to which a fee applies. Our fees are subject to change and Pexly reserves the right to adjust its pricing and fees at any time.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">11. Prohibited Use</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When accessing or using the Services, you agree that you will not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Use our Services in any manner that could interfere with, disrupt, or inhibit other users from fully enjoying our Services</li>
                  <li>Engage in any activity which could violate any law, statute, ordinance, or regulation</li>
                  <li>Introduce to the Services any virus, Trojan, worms, logic bombs, or other harmful material</li>
                  <li>Engage in market manipulation, wash trading, spoofing, or any form of deceptive trading activity</li>
                  <li>Attempt to gain unauthorized access to any part of the platform or its related systems</li>
                  <li>Engage in transactions involving items that infringe or violate any copyright, trademark, or other proprietary right</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">12. Jurisdiction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This Agreement and your use of the Website and Services shall be governed by and construed in accordance with the laws of the Republic of Panama, without regard to principles of conflict of laws.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Questions?</h3>
                    <p className="text-sm text-muted-foreground">
                      If you have any questions about this User Agreement, please contact our support team at{" "}
                      <a href="mailto:support@pexly.app" className="text-primary hover:underline">
                        support@pexly.app
                      </a>
                    </p>
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
