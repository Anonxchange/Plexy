
import { FileText, Shield, AlertCircle, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";
import { Link } from "wouter";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function Terms() {
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
            <span className="block text-primary-foreground">User Agreement</span>
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Please read these terms and conditions carefully before using Pexly services
          </p>

          <p className="text-sm text-primary-foreground/80">
            Last Updated: February 26, 2025
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

          {/* Column 2: Terms Content */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-muted-foreground leading-relaxed text-sm">
                The English version of legal agreements and policies is considered as the only current and valid version of this document. Any translated version is provided for your convenience only, to facilitate reading and understanding of the English version. Any translated versions are not legally binding and cannot replace the English versions. In the event of disagreement or conflict, the English language legal agreements and policies shall prevail.
              </p>
            </div>

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
              <h2 className="text-2xl font-bold mb-4">Pexly Wallet Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Pexly serves as a non-custodial digital wallet software intended for digital assets such as cryptocurrencies and virtual commodities ("Digital Assets"). This means that you, and only you, have complete control over and responsibility for your Digital Assets and private keys, thereby authorizing transactions from your wallet address autonomously. Please be fully aware that because Pexly operates as a non-custodial wallet software, all associated activities and potential risks of loss are entirely under your management at all times. Pexly equips you to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                <li>Generate wallet addresses and associated private keys that enable you to send and receive various digital assets</li>
                <li>Explore and utilize third-party decentralized application(s) ("DApp(s)") and third-party decentralized exchanges ("DEX") through integrated services</li>
                <li>Conduct swaps or trade digital assets utilizing DApp features provided by independent third-party service providers</li>
                <li>Deploy specific digital assets in a third-party 'Proof of Stake' network through staking services ("Staking Service")</li>
                <li>Gain access to digital asset price information provided by independent third-party service providers</li>
                <li>Broadcast Digital Asset Transaction data to various blockchain networks supported by Pexly</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Please remember that your usage of Pexly's features and services underpins your acceptance of the risks associated with digital asset management and transaction activities, including network variability, cybersecurity threats, and market volatility.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Wallet Address, Private Key, and Backup Capabilities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                An encrypted backup of certain information associated with your wallet can be stored on eligible devices. The wallet address is linked to the private key; together, they permit the authorization of the transfer of Digital Assets from and into that wallet address. You bear exclusive responsibility for the preservation and security of your private key and any mnemonic phrase ("Secret Phrase") related to your wallet.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                It is imperative to safeguard access information for your wallet address, secret phrase, and private key. Equally crucial is the backup of your private keys, backup phrases, or passwords. Failing to do so may result in losing authority over Digital Assets tied to your wallet. Please note that we do not gain or retain your wallet password, encrypted private key, unencrypted private key, or secret phrase connected to your wallet. Furthermore, we cannot produce a replacement password for your wallet if you forgot your primary password.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In case you have not securely preserved a backup of any private key and wallet address pair existing in your wallet, remember that all Digital Assets associated with such a wallet address will be unreachable. Hence, we expressly disclaim any responsibility or liability in the event you are unable to access your wallet for any reason, including but not limited to your failure to secure your wallet address, Secret Phrase, and private key information.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Protecting your Digital Assets requires your full caution and alertness. Pexly operations are premised on the principle that you're fully aware of the importance of your Digital Assets and will execute necessary steps to safeguard them. You agree to be solely responsible for any actions you perform within Pexly and acknowledge the risks associated with digital asset management.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Use of DApps and DEX</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When accessing or using decentralized applications (DApps) or decentralized exchanges (DEX), including but not limited to the DApp functionality within our Services such as the "Trade/Swap Digital Assets" feature, you are required to understand and agree to the following terms:
              </p>
              <ul className="list-disc list-inside space-y-3 text-muted-foreground ml-4">
                <li>Pexly does not control, endorse, or take responsibility for your engagement with or use of DApps or DEX. Pexly has no liability or obligation related to your use of DApps or DEX, including but not limited to any transactions that are disputed or result in losses.</li>
                <li>The amount that you can trade through DEX each day is subject to the rules and limitations set by the third-party developers of the Smart Contracts. Pexly does not control these limits and is not responsible for enforcing them.</li>
                <li>All transactions on the blockchain are final and cannot be reversed. This means that any transaction made via DApps or DEX is entirely under your control and responsibility. You take full responsibility for the outcomes of any issues related to these transactions, including but not limited to transfers to incorrect addresses or problems with the node servers you have selected.</li>
                <li>Using DApps or DEX may result in handling or service fees associated with the third-party Smart Contracts. These fees are determined by the third-party developers and are not controlled by Pexly. Users should review the fee information provided by the third-party service providers before engaging in any transactions.</li>
                <li>Pexly reserves the right to introduce charges in the future at its discretion. Any fee updates will apply to transactions conducted after the updated fees come into effect.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By using DApps and DEX via Pexly, you acknowledge and accept these associated risks and potential fees. Pexly strives to create a user-friendly environment that rigorously adheres to legal standards and regulations.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">P2P Transactions and Smart Contracts</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Pexly facilitates peer-to-peer (P2P) transactions between users through smart contracts deployed on blockchain networks. These smart contracts automatically execute the terms agreed upon by both parties in a transaction. When utilizing P2P services with smart contracts, you acknowledge and agree to the following:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                <li>Pexly does not control or execute smart contracts. Execution is handled entirely by the respective blockchain network.</li>
                <li>Once a smart contract transaction is initiated, it cannot be reversed or modified by Pexly or any party involved.</li>
                <li>All P2P transactions are final and binding upon smart contract execution on the blockchain.</li>
                <li>Pexly assumes no liability for disputes arising from P2P transactions, including disagreements about transaction terms or Smart Contract outcomes.</li>
                <li>Users are solely responsible for ensuring they understand the terms of any P2P transaction and smart contract before initiating it.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                By utilizing P2P services and smart contracts via Pexly, you acknowledge these conditions and accept the immutable nature of blockchain transactions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Gift Card Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Pexly offers gift card services through third-party providers that allow users to purchase, trade, and exchange gift cards for various retailers and brands. When utilizing gift card services, you acknowledge and agree to the following:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                <li>Pexly does not control or operate the gift card services. These services are provided by independent third-party providers.</li>
                <li>Pexly assumes no liability for the validity, authenticity, or functionality of any gift cards purchased or traded through our platform.</li>
                <li>Once a gift card transaction is completed and confirmed, Pexly cannot reverse, modify, or refund the transaction unless the third-party provider permits such actions.</li>
                <li>Users are responsible for verifying the balance and terms of any gift card before accepting it in a transaction.</li>
                <li>Pexly does not guarantee the redemption, acceptance, or value of gift cards by their respective issuers or retailers.</li>
                <li>Any disputes regarding gift card authenticity, balance, or redemption must be addressed directly with the gift card issuer or the third-party service provider.</li>
                <li>Gift card services are subject to the terms and conditions of both the third-party service provider and the respective gift card issuer.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                By using gift card services via Pexly, you acknowledge these conditions and accept full responsibility for your gift card transactions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Airtime and Mobile Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Pexly offers airtime and mobile top-up services through third-party providers that enable users to purchase mobile credits and services from various telecommunications providers globally. When utilizing airtime and mobile services, you acknowledge and agree to the following:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                <li>Pexly does not control or operate the airtime and mobile services. These services are provided by independent third-party providers and telecommunications companies.</li>
                <li>Pexly assumes no liability for delays, failures, or errors in airtime delivery or mobile service provisioning.</li>
                <li>Once an airtime purchase is completed and confirmed on the blockchain, Pexly cannot reverse, modify, or refund the transaction unless the third-party provider permits such actions.</li>
                <li>Users are responsible for providing accurate mobile phone numbers and subscriber information. Pexly is not liable for incorrect airtime delivery due to user error.</li>
                <li>Pexly does not guarantee the availability or pricing of airtime services from specific telecommunications providers.</li>
                <li>Service availability and airtime rates may vary by region, provider, and current market conditions and are subject to change without notice.</li>
                <li>Any disputes regarding airtime delivery, pricing, or mobile service issues must be addressed directly with the telecommunications provider or the third-party service provider.</li>
                <li>Airtime services are subject to the terms and conditions of both the third-party service provider and the respective telecommunications company.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                By using airtime and mobile services via Pexly, you acknowledge these conditions and accept full responsibility for your airtime transactions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Digital Asset Transactions</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For all intended Digital Asset transactions to be effectuated, they must be validated and chronicled in the respective Digital Asset's public blockchain. These networks, which are decentralized and peer-to-peer, are bolstered by independent third parties and are not under the ownership, control, or operation of Pexly.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Pexly has no control over these blockchain networks and, therefore, cannot guarantee the confirmation and execution of any transaction details that you submit via our Services. By opting to use Pexly, you must acknowledge and consent to the following:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                <li>Pexly is not equipped to cancel or modify your transaction</li>
                <li>Blockchain networks might delay or fail to complete the transaction details you've submitted</li>
                <li>Pexly does not store, transmit, or receive Digital Assets. All related actions occur wholly within the framework of the applicable blockchain protocol</li>
                <li>Any transfer that relates to any Digital Asset is processed on the applicable blockchain network and not on a network owned or operated by Pexly</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                By employing Pexly's services, you accept all inherent risks associated with the transaction process and the volatile nature of Digital Assets.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Accuracy of Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                You represent and guarantee that any information you provide via the Services is precise and comprehensive. You accept and understand that we hold no responsibility for any errors or omissions made by you in any Digital Asset transactions initiated via the Services. To avoid potential issues, we strongly urge you to meticulously review the details of your transaction before initiating a Digital Asset transfer.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Wallet Registration and Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To utilize Pexly, you will need to either import an existing wallet or create a new one. Upon the creation of a wallet, a private key will be generated for you. In the event of unauthorized use of your private key or any other security breaches related to your wallet, you agree to notify us immediately.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You understand and agree that all risks associated with the use of our Services are assumed by you, and you will bear full responsibility for maintaining the confidentiality and security of your private key. To avoid loss of access to or control over your wallet, we strongly advise that you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                <li>Generate a unique and strong password not used elsewhere</li>
                <li>Refrain from storing your private key and Secret Phrase in plain text online or in unsecured physical locations</li>
                <li>Restrict access to your devices and wallet</li>
                <li>Ensure protection from malware on your devices and networks</li>
                <li>Immediately inform us of any known or suspected security breaches related to your wallet</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We hold no liability for activities on your wallet, whether they are authorized by you or not.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Third Party Services and Content</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our platform connects you to a variety of services provided by our partners, which include but are not limited to peer-to-peer (P2P) transactions, smart contracts, crypto to crypto exchanges ("swap"), buying and selling of cryptocurrencies, services to display balances in fiat currency, cryptocurrency rate displays, decentralized finance applications, gift card trading and purchases, airtime and mobile top-up services, and other digital asset services. Note that we do not have any control over these third-party services ("Third Party Services").
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your engagement with these services and the associated informational content, products, or services ("Third Party Content") is purely voluntary, and any reliance on such content is done at your own risk. While this Agreement regulates your engagement with our service, your interaction with Third Party Content and Services will likely be subjected to additional terms and conditions set by the respective third-party providers.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We deny any liability and responsibility related to your use of these Third Party Services. Any disputes or complaints relating to these services should be directed to the respective third-party provider.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Payment and Fees</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The fees related to the Services, or any aspect thereof, are primarily established by our third-party partners and are available on pexly.com and/or in the Pexly application. These fees can include, but are not limited to, cost for account management, transaction fees, withdrawal fees, gas fees, or charges for specific services offered by our partnering entities.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Please note that these charges are controlled by the third-party entities and we neither influence nor regulate the creation or modification of these fees. In certain instances, Pexly may receive a revenue share from such fees exercised by third parties. However, receiving revenue does not grant us any control or decision-making power over these charges.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Any update or adjustment to such fee structure will be promptly reflected on our website and/or mobile application. Your continued use of our Services following such updates indicates your acceptance of these changes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Transaction Fees</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your virtual currency transactions may incur transaction fees, such as mining fees, which are mandated by the virtual currency system or blockchain network you choose to use. Before initiating a transaction, it is your responsibility to ensure that your wallet has a sufficient balance and/or "gas" (network processing power) to complete the transaction fully.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                It is crucial to note that we hold no control or influence over these fees or the fee setting mechanisms of third-party systems. Consequently, we are not liable for any transaction failures or financial losses you may experience due to inappropriately entered transaction fees.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Taxes</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your tax obligations concerning your transactions made through our Services are solely your responsibility. You are required to determine what, if any, taxes apply to your transactions. We expressly clarify that our role does not include determining if taxes apply to your transactions. We are not in the business of collecting, reporting, withholding, or remitting any taxes arising from any Digital Asset-related transactions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Intellectual Property License</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Subject to your agreement and adherence with these Terms, we provide you a non-exclusive, non-sublicensable, and non-transferable license to utilize Pexly strictly for your personal or internal business use. Unless otherwise explicitly stated in these Terms, you are prohibited from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Reproducing, altering, adapting, or creating derivative works of any part of Pexly</li>
                <li>Leasing, distributing, selling, sublicensing, transferring, or enabling access to Pexly</li>
                <li>Using Pexly for the benefit of any third party</li>
                <li>Integrating Pexly into any product or service you offer to a third party without our prior written approval</li>
                <li>Circumventing mechanisms in Pexly designed to limit your use</li>
                <li>Performing reverse engineering, disassembling, decompiling, or seeking to extract or derive the source code underlying Pexly</li>
                <li>Removing or obscuring any proprietary or other notices integrated into Pexly</li>
                <li>Using Pexly for competitive analysis purposes or to develop competitive products</li>
              </ul>
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
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}
