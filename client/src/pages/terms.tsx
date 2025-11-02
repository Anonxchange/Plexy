
import { Scale, FileText, Shield, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";
import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background py-20 px-4">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Scale className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="block text-foreground">User Agreement</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Please read these terms and conditions carefully before using Pexly services
          </p>

          <p className="text-sm text-muted-foreground">
            Last Updated: February 26, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12">
            <div className="space-y-8">
              <div>
                <p className="text-muted-foreground leading-relaxed">
                  You agree and understand that by signing up to Pexly and using the services, you are agreeing to enter into this user agreement (the "Agreement") by and between you and Pexly Global Corp., and be legally bound by its terms and conditions, so please read them carefully. By accessing and using Pexly, you're entering into a legally binding contract, with the waiving of certain legal rights such as a jury trial and class actions. If any term or condition of this User Agreement is unacceptable to you, please do not visit, access, or use Pexly. Use of the words "Pexly" "company", "we,","us," or "our" in this User Agreement refers to Pexly Global Corp., and any or all of its affiliates.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Services Definition</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The services are: a marketplace to enable buyers and sellers of "Digital Assets" (such term to be broadly understood to include digital currencies such as Bitcoin, Ether, and others supported by Pexly subject to change from time to time) to engage in transactions with each other (the "Marketplace") and the offer of a hosted digital wallet service for purposes of accessing the Marketplace (the "Pexly Account" or "Account"), holding and releasing Digital Assets as instructed upon completion of a purchase of Digital Assets and any other services described in this Agreement (collectively the "Services" and individually, a "Service") provided by us, to you as an individual ("user" or "you").
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Pexly.com and its related Services are owned and operated by Pexly. Your use of the Services will also be governed by our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Regulatory Compliance</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Your conduct on Pexly is subject to the laws, regulations, and rules of any applicable governmental or regulatory authority (the "Applicable Laws and Regulations") including, but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Money Service Business ("MSB") regulations under the Financial Crimes Enforcement Network ("FinCEN")</li>
                  <li>Laws, regulations, and rules of relevant tax authorities</li>
                  <li>Applicable regulations and guidance set forth by FinCEN</li>
                  <li>The Bank Secrecy Act of 1970 ("BSA")</li>
                  <li>The USA PATRIOT Act of 2001 ("Patriot Act")</li>
                  <li>AML/CTF provisions as mandated by U.S. federal law and any other rules and regulations regarding AML/CTF</li>
                  <li>Issuances from the Office of Foreign Assets Control ("OFAC")</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  You unequivocally agree and understand that by using Pexly in any capacity, you agree and understand to act in compliance with and be legally bound by this User Agreement as well as the Applicable Laws and Regulations.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Updates</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may make changes or updates to this Agreement for legal or regulatory reasons or at our discretion. If you continue to use the Services after these updates, you agree to the updated Agreement. The updated version will supersede all prior versions. We reserve the right to discontinue or make changes to any of the Services. If you have supplied us with an email address, we may also notify you by email that the Agreement has been changed or updated.
                </p>
              </div>

              <div className="bg-amber-500/10 p-6 rounded-lg border border-amber-500/20">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                  Important Notice Regarding Digital Assets
                </h2>
                <div className="space-y-3 text-sm">
                  <p className="font-semibold uppercase">
                    THE VALUE OF DIGITAL ASSETS CAN GO UP OR DOWN. THERE CAN BE SUBSTANTIAL RISK THAT YOU LOSE MONEY BUYING, SELLING, TRADING OR HOLDING DIGITAL ASSETS. YOU ARE RESPONSIBLE FOR ASSESSING WHETHER DEALING IN DIGITAL ASSETS IS SUITABLE FOR YOU.
                  </p>
                  <p className="font-semibold uppercase">
                    THE TREATMENT OF DIGITAL ASSETS VARIES BY JURISDICTION. THE SERVICES ARE NOT AVAILABLE WHERE PROHIBITED BY LAW OR BY PEXLY POLICY. DUE TO CHANGING REGULATORY REQUIREMENTS AND INTERPRETATION IN THE DIGITAL ASSET MARKETS, PEXLY MAY USE ITS SOLE DISCRETION TO REJECT USERS, PROHIBIT USE OF PART OR ALL OF THE SERVICES AND / OR CLOSE, FREEZE OR SUSPEND PEXLY ACCOUNTS WHERE PEXLY HAS DETERMINED THAT REGULATORY POLICY PREVENTS THE OFFERING OF THE SERVICES. PEXLY IS NOT LIABLE FOR ANY LOSS OR DAMAGE RESULTING FROM SUCH TEMPORARY OR PERMANENT LOSS OF ACCESS OR USE TO ANY SERVICE.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">About Pexly Services</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The Pexly Services are: the Pexly Marketplace and the Pexly Account.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly offers a peer-to-peer marketplace which facilitates the purchase and sale of certain select Digital Assets through various payment methods. Payment methods are negotiated and exchanged on a peer-to-peer basis between the buyers in the Marketplace ("Buyers") and sellers in the Marketplace ("Sellers"). Users agree upon which payment methods to use to complete a transaction and are fully responsible and liable for using such payment methods in a lawful manner.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pexly offers a hosted digital wallet (the "Pexly Account" or "Account") through a digital asset wallet provider. Users are able to post offers to buy or sell Digital Assets through the Marketplace. The creator of the offer is responsible for listing terms of the transaction, including the payment methods the Seller will accept. Once an offer is selected by another Pexly user, the Seller's Digital Assets are locked as part of our transaction procedures (the "Pexly Escrow") until all conditions necessary to consummate the transaction have occurred.
                </p>
                <p className="text-muted-foreground leading-relaxed font-semibold uppercase">
                  PEXLY DOES NOT ACT AS A PAYMENT PROCESSOR. ALL LIABILITY FOR SENDING AND RECEIVING PAYMENT AND CONFIRMING THE VALIDITY OF THE TRANSACTIONS LIE BETWEEN THE BUYER AND SELLER.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  1. General
                </h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>It is your responsibility to read the Agreement carefully and periodically review this Agreement as posted on the Pexly Website. Your continued use of the Services shall signify your acceptance to be bound by the then-current Agreement.</li>
                  <li>Failure or delay by Pexly in enforcing or partially enforcing any provision of the Agreement shall not be construed as a waiver of any of our rights or remedies.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  2. Account & Registration
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    In order to use the Services, you will need to register an Account through our Website. During the registration process, we will ask you for certain information, including but not limited to, your name, address and other personal information to verify your identity. We may, in our sole and absolute discretion, refuse to maintain an Account for you.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    By using your Account, you agree and represent that you will use our Services for yourself and you may not use your Account to act as an intermediary or broker for any other third party, person or entity. Unless expressly authorized by Pexly, you are only allowed to have one Account and are not allowed to sell, borrow, share or otherwise make available your Account or any detail necessary to access your Account to people or entities other than yourself.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You are solely responsible for creating a strong password and maintaining adequate security and control of any and all IDs, passwords, hints, personal identification numbers (PINs), API keys or any other codes that you use to access our Services.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">3. Legal Processes Affecting Your Account</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We have the right to immediately suspend your access to your Pexly Account. You agree and understand that the Digital Assets held in your Pexly Account may be subject to freezing, forfeiture to, or seizure by a law enforcement agency and/or subject to any similar limitation on its use, may be wholly and permanently unrecoverable and unusable.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">4. Binding Arbitration</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 font-semibold uppercase">
                  ARBITRATION MEANS THAT YOU WAIVE YOUR RIGHT TO A JUDGE OR JURY IN A COURT PROCEEDING AND YOUR GROUNDS FOR APPEALS ARE LIMITED.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You and Pexly agree that any dispute arising out of or relating to this Agreement or the Services, shall be finally settled in binding arbitration, on an individual basis, in accordance with the American Arbitration Association's rules for arbitration of consumer-related disputes.
                </p>
                <p className="text-muted-foreground leading-relaxed font-semibold uppercase">
                  CLASS ACTION WAIVER: TO THE EXTENT PERMISSIBLE BY LAW, ALL CLAIMS WILL ONLY BE BROUGHT ON AN INDIVIDUAL BASIS, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE ACTION, OR REPRESENTATIVE PROCEEDING.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">5. Privacy Policy & Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We endeavor to take all reasonable steps to protect your personal information. However, we cannot guarantee the security of any data you disclose online. You accept the inherent security risks of providing information and dealing online over the Internet and will not hold us responsible for any breach of security unless this is due to our negligence.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Please view our official <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">6. No Warranty, Limitation of Liability & Assumption of Risk</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 font-semibold uppercase">
                  THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY GUARANTEES, REPRESENTATIONS OR WARRANTIES, WHETHER EXPRESS, IMPLIED OR STATUTORY. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PEXLY SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND/OR NON-INFRINGEMENT.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Pexly does not provide investment, tax, or legal advice. Pexly is not registered with the U.S. Securities and Exchange Commission and does not offer securities services or investment advice. All transactions through our Marketplace are conducted on a peer-to-peer basis between the Seller and Buyer and you are solely responsible for determining whether any investment, investment strategy or related transaction is appropriate for you.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">7. Release of Pexly & Indemnity</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have a dispute with one or more users of our Services, you release Pexly, its affiliates and service providers, and each of its or their respective officers, directors, employees, agents and representatives, from any and all claims, demands and damages (actual and consequential) of every kind and nature arising out of or in any way connected with such disputes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">8. Transactions on Pexly's Marketplace</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The Website allows users to solicit offers to buy or sell Digital Assets. When a user initiates a transaction for the purchase or sale of Digital Assets, the transaction is consummated pursuant to this Agreement and to the additional terms, if any, detailed by the user or the user's counterparty.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-semibold uppercase">
                    IT IS YOUR RESPONSIBILITY TO CAREFULLY READ THE SELLER'S OFFER TERMS AND CONDITIONS AND FOLLOW THEM EXACTLY. IF YOU DO NOT FOLLOW THE OFFER TERMS AND CONDITIONS, YOUR PAYMENT WILL NOT BE ACCEPTED. PEXLY CANNOT ASSIST YOU IN A DISPUTE PROCESS TO RECOVER YOUR PAYMENT IF YOU DO NOT FOLLOW THE TERMS.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">9. Dispute Resolution Process</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When a Buyer and a Seller cannot come to an agreeable solution, Pexly's support team ("Pexly Support") can help. Either party can initiate the dispute resolution process with respect to a transaction.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  You acknowledge and agree that Pexly's decision regarding a dispute is conclusive, final and binding as described in this Agreement. Pexly will have no liability to either a Buyer or a Seller in connection with its decisions.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">10. Fees for Using Pexly Services</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Creating a Wallet is free. Pexly charges fees for Services, applicable fees will be displayed prior to you using any Service to which a fee applies. Our fees are subject to change and Pexly reserves the right to adjust its pricing and fees at any time.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">11. Prohibited Use</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When accessing or using the Services, you agree that you will use the Services in accordance with the terms and conditions in this Agreement and not commit any unlawful act. Without limiting the generality of the foregoing, you agree that you will not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Use our Services in any manner that could interfere with, disrupt, negatively affect or inhibit other users from fully enjoying our Services</li>
                  <li>Engage in any activity which could violate any law, statute, ordinance, or regulation</li>
                  <li>Introduce to the Services any virus, Trojan, worms, logic bombs or other harmful material</li>
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
                      <a href="mailto:legal@pexly.com" className="text-primary hover:underline">
                        legal@pexly.com
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
