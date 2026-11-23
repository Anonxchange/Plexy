import { useHead } from "@unhead/react";
import { Link } from "wouter";
import { buildCanonicalUrl } from "@/lib/site-document";

type LegalSection = { title: string; paragraphs: string[]; bullets?: string[] };

const legalDocuments: Record<"privacy" | "terms" | "refund" | "dispute", {
  title: string;
  eyebrow: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}> = {
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Your information and your choices",
    intro: "This Privacy Policy explains how Pexly collects, uses, stores, protects and shares information when you visit our website, create an account, connect a wallet, place an order, contact support or otherwise use our services. We aim to collect only information that is reasonably needed to operate the marketplace, protect users and complete the services they request.",
    updated: "23 November 2026",
    sections: [
      { title: "1. Who this policy applies to", paragraphs: [
        "In this policy, Pexly, we, us and our refer to the Pexly website, marketplace and the people responsible for operating and supporting those services. You and your refer to a person who visits or uses the services.",
        "Pexly is a service brand. The legal operating entity and registered office details will be added to this notice when the relevant registration and operating arrangements have been finalised. This policy does not represent that a company has already been incorporated or registered in any particular country.",
        "This policy applies to information processed through pexly.app and related pages, checkout journeys, customer support channels and features that link to this policy. A third party service may have its own privacy notice, which applies to the information it collects directly."
      ]},
      { title: "2. Information we may collect", paragraphs: [
        "The information collected depends on the features you choose to use. We may collect account information such as your email address, account identifiers, authentication records, profile details and preferences. We may collect order information such as the products or services requested, order references, amounts, currencies, order status, delivery details and relevant transaction records.",
        "When you contact support, we may process your email address, the subject and contents of your message, attachments you choose to provide and our correspondence with you. Please do not send passwords, wallet recovery phrases, private keys or other authentication secrets in a support request.",
        "For physical product orders, we may need delivery information such as your name, delivery address, telephone number and delivery instructions. For digital gift cards and mobile top ups, we may process recipient details and the information required by the relevant supplier to fulfil the order.",
        "When you use a connected wallet or pay with cryptocurrency, technical transaction information may be visible on the relevant public blockchain. Depending on the payment route, we may receive a transaction hash, wallet address, network, token, payment amount, confirmation status and information supplied by the payment processor. Public blockchain data is not controlled by Pexly.",
        "We may automatically receive technical information such as your IP address, device type, browser type, operating system, approximate region, language, pages visited, referral information, timestamps, diagnostic events and security logs. Cookies and similar technologies may be used as described below."
      ]},
      { title: "3. How we use information", paragraphs: [
        "We use information to provide and maintain the marketplace, create and secure accounts, remember your preferences, display relevant products and services, prepare orders, confirm payments, arrange fulfilment, provide customer support and communicate important service notices.",
        "We may also use information to prevent fraud, abuse, unauthorised access and unlawful activity; investigate payment or delivery disputes; enforce our terms; maintain backups; troubleshoot errors; measure service performance; improve usability; and meet legal or regulatory obligations that apply to the relevant service.",
        "We do not use your information for a purpose that is materially incompatible with the reason it was collected without providing any notice or obtaining any permission required by applicable law."
      ]},
      { title: "4. Non custodial wallet information", paragraphs: [
        "Pexly is designed to support non custodial use. Where a wallet is generated or connected through a Pexly feature, control of the wallet and its recovery information remains with the user. Pexly does not ask you to send your recovery phrase or private keys to our support team.",
        "Wallet functionality may involve information stored locally on your device or in an encrypted application vault. The exact information available to Pexly depends on the feature and the technical design in use. You are responsible for keeping your device secure, protecting your password and backing up any recovery information that the wallet feature tells you to retain.",
        "Never disclose a recovery phrase, private key, one time password or password to anyone claiming to represent Pexly. Pexly support will not need those secrets to investigate an order."
      ]},
      { title: "5. Cookies and similar technologies", paragraphs: [
        "We may use essential storage technologies to keep the website working, maintain sessions, remember security preferences, preserve cart and checkout information and store your cookie choices. Where used, optional analytics or preference technologies help us understand how the website is used and improve the experience.",
        "You can manage available cookie choices through the Cookie Preferences control in the website footer. You can also use your browser settings to restrict or delete cookies and local storage. Blocking essential technologies may prevent some account, cart, wallet or checkout features from working correctly.",
        "The technologies used may change as the website develops. Where applicable law requires consent before optional cookies or similar technologies are used, we will request that consent."
      ]},
      { title: "6. When information is shared", paragraphs: [
        "We may share the minimum information reasonably necessary with service providers that help us host the website, operate databases, authenticate accounts, process payments, provide customer support, deliver messages, detect abuse, analyse performance or fulfil orders. These providers may process information only for the services they provide to us and subject to appropriate contractual or other safeguards.",
        "For gift cards, mobile top ups and physical products, relevant order details may be sent to the supplier, distributor, delivery company or fulfilment partner responsible for completing the order. Payment details may be shared with the payment service you select. Those organisations may act under their own terms and privacy notices.",
        "We may disclose information where reasonably necessary to comply with a valid legal request, protect users, investigate suspected fraud, enforce our terms, protect the rights or safety of Pexly or others, or establish or defend legal claims.",
        "We do not sell personal information to advertisers. We do not give advertisers access to private customer conversations."
      ]},
      { title: "7. International processing", paragraphs: [
        "Our service providers and fulfilment partners may operate in different countries. This means information may be processed in a country other than the one where you live. Where applicable law requires safeguards for an international transfer, we will take steps intended to provide those safeguards.",
        "The availability of products, gift cards, mobile networks, payment methods and delivery services can vary by location. We may use location information to show availability or assess whether a supplier can fulfil a request."
      ]},
      { title: "8. How long information is kept", paragraphs: [
        "We keep information for as long as reasonably necessary for the purpose for which it was collected. Account and security records may be retained while an account is active and for a reasonable period afterwards. Order and transaction records may be retained for support, reconciliation, fraud prevention, accounting and dispute handling. Support correspondence may be retained long enough to resolve the request and maintain a reliable service history.",
        "Retention periods depend on the type of information, the sensitivity of the information, operational requirements and any legal obligations that apply. When information is no longer needed, we take reasonable steps to delete it, anonymise it or securely dispose of it."
      ]},
      { title: "9. Security", paragraphs: [
        "We use technical and organisational measures intended to protect information against unauthorised access, loss, misuse, alteration and disclosure. No website, device, network or method of electronic storage is completely secure. We cannot promise that information will never be affected by a security incident.",
        "You should use a unique password, keep your device and browser updated, enable available account security features, sign out on shared devices and never share authentication secrets. Contact support promptly if you believe your account or an order has been accessed without permission."
      ]},
      { title: "10. Your privacy choices and rights", paragraphs: [
        "Depending on where you live and the laws that apply, you may have rights to request access to personal information, correct inaccurate information, request deletion, restrict or object to certain processing, receive a portable copy, withdraw consent or complain to a relevant privacy authority.",
        "These rights are subject to applicable legal conditions and exceptions. For example, we may need to retain certain order, security or transaction records to resolve a dispute, prevent fraud or comply with a legal obligation.",
        "To make a privacy request, email support@pexly.app with the subject Privacy Request. Tell us what you are asking for and provide enough information for us to identify the relevant account or request. Do not include your password, private key or wallet recovery phrase. We may need to verify your identity before responding."
      ]},
      { title: "11. Children", paragraphs: [
        "The services are intended for adults and are not directed to children. You must not create an account or use a service if you are below the age at which you can legally enter into the relevant agreement where you live. If you believe a child has provided personal information to Pexly, contact us so that we can review the matter."
      ]},
      { title: "12. Third party websites and services", paragraphs: [
        "The website may contain links to external websites, wallet applications, payment providers, suppliers and other services. Pexly does not control the privacy practices or security of those third parties. Review their terms and privacy notices before providing information or completing a transaction with them."
      ]},
      { title: "13. Changes to this policy", paragraphs: [
        "We may update this policy when our services, technology or legal obligations change. The updated version will be published on this page with a revised date. If a change materially affects how information is handled, we will provide additional notice where required."
      ]},
      { title: "14. Contact", paragraphs: [
        "For questions, privacy requests or concerns about this policy, contact support@pexly.app. Please use the subject Privacy Request when asking us to exercise a privacy right."
      ]}
    ]
  },
  terms: {
    title: "Terms of Service",
    eyebrow: "Rules for using the Pexly marketplace",
    intro: "These Terms of Service govern access to and use of Pexly, including browsing, accounts, wallet related features, gift card purchases, mobile top ups, physical product orders, checkout and customer support. Please read them carefully before using the services. By accessing or using Pexly, you agree to these terms. If you do not agree, do not use the services.",
    updated: "23 November 2026",
    sections: [
      { title: "1. About Pexly and these terms", paragraphs: [
        "Pexly is a service brand for a marketplace that enables users to explore selected products and services and, where available, pay using supported cryptocurrency or other displayed payment methods. The marketplace may include digital gift cards, mobile airtime or data top ups, physical products and wallet related tools.",
        "Pexly is not presented in these terms as a registered company in any particular country. The legal operating entity, registered office and formal jurisdiction details will be added when the relevant registration and operating arrangements have been completed. These terms do not create or imply a claim that a United Kingdom company registration has already been completed.",
        "These terms apply together with any checkout information, product description, service specific conditions, privacy notice and refund policy displayed for the relevant transaction. If a specific product or supplier condition conflicts with these general terms, the specific condition applies only to the extent it clearly relates to that product or service and is lawful."
      ]},
      { title: "2. Eligibility and account responsibility", paragraphs: [
        "You may use Pexly only if you can legally enter into a binding agreement and are permitted to use the relevant service under the laws that apply to you. The services are intended for adults. You must provide accurate information, keep your account details current and protect your sign in credentials.",
        "You are responsible for activity carried out through your account and for maintaining the security of your device, email account, password and any connected wallet. Notify us promptly if you suspect unauthorised access. We may ask for reasonable information to verify an account or investigate a transaction, but you must never provide a wallet recovery phrase or private key.",
        "You must not create an account using false information, impersonate another person, use another person's payment method without permission or attempt to bypass a security or eligibility control."
      ]},
      { title: "3. What Pexly provides", paragraphs: [
        "Pexly provides access to marketplace listings and related checkout or account tools. Product and service availability can change without notice. A listing is an invitation to place an order and is not a guarantee that a supplier will always have stock, that a particular region is supported or that a payment method will remain available.",
        "The description, denomination, currency, region, delivery method, validity information and other conditions shown for an item form an important part of the offer. You must review them before placing an order. Images are illustrative unless the listing expressly says otherwise.",
        "Pexly may use independent suppliers, distributors, payment processors, blockchain networks, delivery companies and other third parties to provide parts of the service. Some parts of the transaction are therefore subject to the availability, rules and processing times of those third parties."
      ]},
      { title: "4. Non custodial wallet features", paragraphs: [
        "Pexly is designed around non custodial use. Where you create or connect a wallet, you remain responsible for the wallet, its private keys, recovery phrase, device security and transactions that you authorise. Pexly does not take possession of your wallet recovery phrase and does not control assets held in a wallet that remains under your control.",
        "Blockchain transactions are generally irreversible once confirmed. You are responsible for checking the destination address, network, asset, amount and transaction fee before signing or broadcasting a transaction. Sending an asset over the wrong network or to an incorrect address may result in permanent loss.",
        "Pexly cannot recover assets lost because you disclosed a recovery phrase, lost access to your device, approved a malicious transaction, used an incorrect address or selected an unsupported network. Wallet software and blockchain networks may experience outages, congestion, forks, delays or technical failures outside our control."
      ]},
      { title: "5. Cryptocurrency payments and pricing", paragraphs: [
        "Supported assets, networks, payment providers, exchange rates and payment instructions are displayed during checkout. The amount shown may depend on market prices, network conditions, provider rates and the time at which the payment quote is created. A quote may expire and may need to be refreshed.",
        "You are responsible for paying the exact amount requested to the correct address on the correct network and within the stated payment window. Network fees are charged by the relevant network or service provider and may change. Pexly does not control blockchain confirmation times or network fees.",
        "A payment may be delayed, underpaid, overpaid, sent on the wrong network, sent after an expiry time or not recognised by a payment provider. Contact support with the order reference and transaction hash if this happens. Do not send additional funds unless checkout or support provides verified instructions.",
        "A displayed cryptocurrency equivalent is an estimate unless checkout expressly identifies it as a fixed quote. The amount ultimately recognised for an order is determined by the payment instructions and provider confirmation applicable to that order."
      ]},
      { title: "6. Orders and acceptance", paragraphs: [
        "When you submit an order, you are making a request to purchase the selected item or service at the displayed price and under the stated conditions. An order is not necessarily accepted merely because you click a purchase button or see a pending status. Acceptance may depend on payment confirmation, stock availability, supplier validation and any checks reasonably required to prevent fraud or fulfil the order.",
        "We may reject, cancel or place an order on hold where an item is unavailable, a price or listing contains an obvious error, payment cannot be verified, a supplier declines fulfilment, information is incomplete, fraud is suspected or the transaction would create a legal or security risk. Where payment has already been received, the refund policy will apply.",
        "You should check your order details before submitting payment. This includes the item, denomination, quantity, recipient information, region, network, delivery address and total amount. You are responsible for errors in information you enter, subject to any rights that cannot lawfully be excluded."
      ]},
      { title: "7. Gift cards and digital products", paragraphs: [
        "Gift cards and other digital products may be issued by independent brands, merchants, distributors or suppliers. Their use may be subject to separate terms, geographic restrictions, expiry dates, redemption rules and limitations imposed by the issuer.",
        "You are responsible for checking the brand, country, currency, denomination and redemption requirements before purchase. A gift card may not work in a country or account region different from the one specified in its listing. Once a valid digital code has been delivered or displayed, it may be treated as used or disclosed even if you have not redeemed it.",
        "Pexly does not control the issuer's website, point of sale systems, account restrictions, product catalogue or future acceptance of a gift card. If a code appears invalid or has already been redeemed, contact support promptly and do not publish the code or share it with anyone else."
      ]},
      { title: "8. Mobile top ups", paragraphs: [
        "Mobile top ups are fulfilled through third party network operators, aggregators or suppliers. Availability depends on the destination country, operator, telephone number, service type and supplier systems.",
        "You must carefully verify the recipient telephone number, country, network and top up amount before payment. A successful top up sent to an incorrect number may not be recoverable. Delivery times can vary and a supplier may report a pending status while processing the request.",
        "If a top up fails or remains unresolved, contact support with the order reference and correct recipient details. We may need to request a status check from the supplier before confirming whether a reversal or refund is available."
      ]},
      { title: "9. Physical products and delivery", paragraphs: [
        "Physical products are subject to stock availability, product specifications, shipping options, destination restrictions, customs requirements and the delivery terms displayed at checkout. Delivery estimates are estimates and may be affected by carriers, weather, customs, supplier processing or events outside our reasonable control.",
        "You must provide a complete and accurate delivery address and contact details. Additional charges such as customs duties, import taxes or local handling fees may apply where disclosed or imposed by the destination authorities. Unless checkout states otherwise, those charges are your responsibility.",
        "Inspect an order promptly after delivery. If an item is damaged, incorrect or missing, contact support with the order reference and clear evidence within a reasonable time so that we can investigate with the supplier or carrier."
      ]},
      { title: "10. Fees, taxes and third party charges", paragraphs: [
        "The price and any service charge displayed at checkout form the amount requested for the order. Blockchain network fees, payment provider charges, currency conversion costs, customs duties, taxes or other third party charges may apply depending on the payment method, product and destination.",
        "You are responsible for determining whether your use of Pexly creates tax reporting or payment obligations for you. Pexly does not provide tax, accounting, investment or legal advice. If you are unsure about your obligations, seek advice from a qualified professional."
      ]},
      { title: "11. Acceptable use", paragraphs: [
        "You must use Pexly lawfully and honestly. You must not use the services to facilitate fraud, money laundering, sanctions evasion, theft, unauthorised payments, identity abuse, harassment, exploitation, prohibited goods or any other unlawful activity.",
        "You must not interfere with the website, probe or bypass security controls, introduce malicious code, scrape or overload the service, reverse engineer protected components except where the law permits, manipulate prices or order states, submit false disputes or attempt to access another user's account or information.",
        "We may restrict, suspend or refuse access where we reasonably believe that conduct breaches these terms, threatens users or the service, creates legal exposure or presents a security risk. Where appropriate and lawful, we may ask for further information or explain the action taken."
      ]},
      { title: "12. Third party services", paragraphs: [
        "Some features depend on independent payment processors, wallet software, blockchain networks, gift card issuers, mobile operators, suppliers and delivery partners. Those third parties are not controlled by Pexly. Their services may be subject to separate terms, privacy notices, fees, outages and eligibility requirements.",
        "A link to a third party website is provided for convenience and does not mean that Pexly endorses every statement, product or service on that website. You should review the relevant third party terms before proceeding."
      ]},
      { title: "13. Service availability and changes", paragraphs: [
        "We aim to keep Pexly available and accurate, but we do not guarantee uninterrupted access, error free operation, continuous availability of a particular product or compatibility with every device. We may update, suspend, replace or discontinue a feature for maintenance, security, supplier, commercial or legal reasons.",
        "We may correct errors in product information, pricing, availability or technical content. If a correction materially affects an order already placed, we will take reasonable steps to communicate with you and resolve the order in accordance with applicable law and the refund policy."
      ]},
      { title: "14. Intellectual property", paragraphs: [
        "The Pexly name, branding, website design, software, text, graphics and other materials are owned by or licensed to the relevant rights holders. You may use the website for its intended personal or business purchasing purpose, but you may not copy, republish, sell, modify or commercially exploit protected material without permission, except where applicable law allows.",
        "Brand names, gift card marks and product images belonging to third parties remain the property of their respective owners. Their appearance on Pexly does not imply ownership by Pexly or a partnership beyond the relationship expressly described."
      ]},
      { title: "15. Disclaimers and limitation of responsibility", paragraphs: [
        "To the extent permitted by applicable law, Pexly is provided on an as available basis. We do not guarantee that the marketplace will meet every requirement, that third party services will remain available or that blockchain transactions will be confirmed within a particular period.",
        "Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited, including any mandatory consumer rights. Subject to that protection, Pexly will not be responsible for indirect or consequential loss, loss of anticipated profit, loss of opportunity, loss caused by an independent third party or loss arising from your failure to protect your credentials or verify transaction details.",
        "Nothing in these terms makes Pexly the custodian of assets held in a wallet that you control. We are not a bank, investment adviser or guarantor of cryptocurrency value. Cryptocurrency prices can change rapidly and you may lose value."
      ]},
      { title: "16. Suspension and termination", paragraphs: [
        "You may stop using Pexly at any time. We may suspend or terminate access where necessary to protect the service, comply with law, respond to a security incident, address suspected misuse or enforce these terms.",
        "Suspension does not remove obligations or rights that arose before the suspension. Pending orders, payment investigations, refunds, legal claims and provisions that by their nature should continue may remain relevant after access ends."
      ]},
      { title: "17. Complaints and disputes", paragraphs: [
        "If you have a concern about an order or the service, contact support@pexly.app first and include the order reference, a clear explanation and relevant evidence. We will review the information and may contact a supplier or payment provider where necessary.",
        "We intend to resolve genuine concerns fairly and in a reasonable time. Nothing in this section removes any mandatory right you may have to use a court, regulator, consumer protection body or other dispute process available under the laws that apply to you."
      ]},
      { title: "18. Changes to these terms", paragraphs: [
        "We may revise these terms as the marketplace develops or as legal and operational requirements change. The current version will be published on this page with its latest update date. Changes apply from publication unless a later effective date is stated. Continued use after a change takes effect means you accept the revised terms, to the extent permitted by law."
      ]},
      { title: "19. Contact", paragraphs: [
        "Questions about these terms, orders or the services can be sent to support@pexly.app. For an order related request, include your order reference and the email address associated with the order. Never include your password, private key or wallet recovery phrase."
      ]}
    ]
  },
  refund: {
    title: "Refund and Cancellation Policy",
    eyebrow: "How cancellations, failed orders and refunds are handled",
    intro: "This policy explains when an order placed through Pexly may be cancelled, corrected or refunded. Different rules apply to digital gift cards, mobile top ups and physical products because each category is fulfilled in a different way. Any rights that cannot legally be excluded under the laws that apply to you remain unaffected by this policy.",
    updated: "23 November 2026",
    sections: [
      { title: "1. Before placing an order", paragraphs: [
        "Please review the product description, denomination, quantity, country, currency, recipient details, delivery address, payment network, fees and total amount before confirming an order. Some purchases are processed automatically and may be sent to an independent supplier as soon as payment is confirmed.",
        "If you notice an error before payment, do not complete the transaction. If you have already paid, contact support@pexly.app immediately with your order reference. We will check whether the order can still be stopped. A cancellation cannot be guaranteed once a supplier has begun processing or a digital item has been issued."
      ]},
      { title: "2. General refund principles", paragraphs: [
        "A refund is assessed against the order status, the type of product, the reason for the request, supplier records and any mandatory consumer rights that apply. A payment being received does not by itself mean that an order has been successfully fulfilled.",
        "Where Pexly confirms that an order was not fulfilled and a refund is due, we will explain the available refund route. Depending on the payment method and provider, a refund may be returned through the original payment method, credited through a supported process or handled in another lawful way agreed with you.",
        "Cryptocurrency payments require special care. Blockchain transfers cannot simply be reversed. If a cryptocurrency refund is approved, the return method, asset, network, amount and any applicable network cost will be confirmed with you before the refund is sent. The value of a cryptocurrency refund in another currency may differ from the original value because exchange rates can change.",
        "We will not ask for your wallet recovery phrase or private key to process a refund. We may ask you to confirm a refund address or provide reasonable order verification. Check any refund address carefully before confirming it."
      ]},
      { title: "3. Gift cards and digital products", paragraphs: [
        "Digital gift cards and codes are often delivered immediately or shortly after payment. Once a valid code has been issued, displayed, sent or otherwise made available to you, the code may be treated as disclosed and may no longer be eligible for cancellation or a change of mind refund, except where required by applicable law or where the product is defective, invalid, duplicated or not supplied as described.",
        "If a code does not work, appears to have been redeemed before delivery or is for a different denomination or region from the order, contact support promptly. Do not redeem, alter, publish or share the code while the investigation is open. We may request screenshots of the error, the order reference and information from the issuer or supplier.",
        "We may need to verify the code status with the issuer or distributor. If the supplier confirms that the code was validly issued and redeemed after delivery, a refund may not be available. If the investigation confirms that the code was invalid, already used before delivery or incorrectly supplied, we will offer an appropriate remedy subject to applicable law and supplier procedures.",
        "A gift card's expiry date, country restriction, currency, redemption method and issuer conditions are important. A refund may not be available where a code cannot be redeemed because the customer selected the wrong country, account region, brand or denomination, or did not follow the issuer's redemption instructions, except where applicable law requires otherwise."
      ]},
      { title: "4. Mobile airtime and data top ups", paragraphs: [
        "Mobile top ups are submitted to an independent operator, aggregator or fulfilment supplier. A top up may move through pending, processing, successful, failed or reversed states. A pending status is not proof of failure, and a supplier may need time to return a final status.",
        "If a top up fails, is reversed or is confirmed by the supplier as not delivered, we will review whether a refund or replacement is available. We may need to wait for the supplier's final confirmation before taking action. We will keep the order under review where the status remains unresolved.",
        "Please verify the recipient telephone number, destination country, mobile operator and amount before paying. A top up successfully delivered to the number entered at checkout is generally not refundable because the customer entered an incorrect number. This does not limit any remedy required by applicable law or where the supplier confirms an error in its own processing.",
        "If the recipient says a top up has not arrived, contact support with the order reference and recipient number. Do not place repeated replacement orders while the first transaction is still being investigated unless you are willing to pay for each order."
      ]},
      { title: "5. Physical products", paragraphs: [
        "If you receive a physical product that is damaged, defective, incorrect or materially different from its description, contact support as soon as reasonably possible. Include the order reference, photographs of the item and packaging, and a description of the problem. Keep the item and packaging until we provide instructions.",
        "Where a return is required, we will explain the return address, packaging requirements and any return authorisation process. Do not send an item to an address that has not been confirmed by support. The responsibility for return shipping will depend on the reason for return, supplier arrangements and applicable consumer law.",
        "If you change your mind about a physical product, cancellation or return eligibility depends on whether the order has entered fulfilment, the condition of the item, the product category and the consumer rights that apply to your purchase. Certain goods may be excluded from change of mind returns where the law permits, including goods made to your specifications, perishable goods, sealed hygiene goods after opening or other legally exempt categories.",
        "A product must not be returned because of ordinary wear, damage caused after delivery, misuse or failure to follow the product instructions. This does not affect rights relating to a genuine defect or a product that was not as described."
      ]},
      { title: "6. Orders that have not been fulfilled", paragraphs: [
        "If an order cannot be fulfilled because the item is unavailable, the supplier declines the order or a technical issue prevents delivery, we will investigate and communicate the available options. Depending on the circumstances, the remedy may be a replacement, a cancellation or a refund.",
        "If payment was received but no order was created or the checkout status is unclear, contact support with the payment transaction reference, date, amount, asset and network. We will check the available payment records. Do not send a second payment until the first payment has been investigated."
      ]},
      { title: "7. Incorrect details supplied by the customer", paragraphs: [
        "You are responsible for checking the information entered at checkout. This includes recipient telephone numbers, gift card region, email address, product selection, quantity, delivery address, cryptocurrency network and destination wallet address.",
        "If incorrect information is supplied, contact support immediately. We will try to stop or correct the order where the supplier and transaction status allow it. Once a digital code has been issued, a top up has been delivered or a physical parcel has been dispatched, correction or cancellation may no longer be possible."
      ]},
      { title: "8. Payment errors, duplicate payments and underpayments", paragraphs: [
        "If you believe you paid twice for one order, paid the wrong amount or sent funds using the wrong network, contact support with each relevant transaction hash and the order reference. We will compare the payment records and determine whether a duplicate payment or recoverable payment error occurred.",
        "An underpayment or late payment may not automatically complete an order. An overpayment or payment sent to an incorrect address may require manual investigation and may not be recoverable. Network fees, provider fees and exchange rate changes may affect the amount that can be returned. We will explain any confirmed deduction before processing a refund where practicable."
      ]},
      { title: "9. How to request a refund", paragraphs: [
        "Email support@pexly.app with the subject Refund Request. Include your order reference, the email address used for the order, the product or service, the date of purchase and a clear explanation of why you are requesting a refund.",
        "For a digital product, include the error message or relevant evidence but do not post the full gift card code in a public message. For a mobile top up, include the recipient number and country. For a physical product, include photographs where the issue relates to damage, defects or an incorrect item. For a cryptocurrency payment, include the transaction hash and network.",
        "We may ask follow up questions or request reasonable evidence from the supplier, issuer, carrier or payment provider. Providing complete and accurate information helps us investigate more quickly."
      ]},
      { title: "10. Review and processing times", paragraphs: [
        "We aim to acknowledge refund requests within a reasonable period and to investigate them without unnecessary delay. Some cases can be resolved quickly, while others depend on confirmation from an independent supplier, mobile operator, payment provider or delivery company.",
        "Once a refund is approved, the time it takes to appear depends on the payment method and the organisations involved. Bank or card processing times are controlled by the relevant provider. Cryptocurrency refunds also depend on network conditions and confirmation times. We cannot guarantee an exact arrival time before the provider or network completes the transfer."
      ]},
      { title: "11. Abuse of the refund process", paragraphs: [
        "We may investigate repeated, inconsistent or potentially fraudulent refund claims. We may ask for additional evidence and may restrict an account where there is reasonable evidence of abuse, chargeback fraud, false claims or attempts to obtain duplicate value. Any action will remain subject to applicable law and mandatory consumer protections."
      ]},
      { title: "12. Your legal rights", paragraphs: [
        "This policy describes our normal operational process. It does not remove, reduce or replace any statutory rights, cancellation rights, guarantees or remedies that cannot lawfully be excluded in the place where you live or where the transaction is regulated. If a mandatory legal right provides a more favourable remedy than this policy, that legal right takes precedence."
      ]},
      { title: "13. Contact", paragraphs: [
        "To request a cancellation, report a failed order or ask about a refund, email support@pexly.app. Include your order reference and enough information for us to locate the transaction. Never send your password, private key or wallet recovery phrase."
      ]}
    ]
  },
  dispute: {
    title: "Dispute Resolution",
    eyebrow: "How order, delivery and payment disputes are reviewed",
    intro: "This Dispute Resolution guide explains how to report and resolve an issue with a gift card order, mobile top-up, physical product shipment or cryptocurrency payment on Pexly. Our goal is to investigate every claim fairly using verifiable order, supplier and blockchain records.",
    updated: "23 November 2026",
    sections: [
      { title: "1. Scope of dispute resolution", paragraphs: [
        "This process covers purchases and payment attempts initiated through pexly.app, including digital gift cards, mobile airtime and data top-ups, physical products and non-custodial cryptocurrency checkout sessions.",
        "Because Pexly connects you with independent digital suppliers, mobile operators, fulfilment carriers and payment processors, resolving a dispute may require verifying status logs directly with those third-party providers."
      ]},
      { title: "2. Before opening a dispute", paragraphs: [
        "Before submitting a formal dispute, please double-check the basic transaction details so we can isolate the issue quickly:"
      ], bullets: [
        "Confirm that your cryptocurrency transaction has reached sufficient network confirmations on the exact network and destination address shown at checkout.",
        "For gift cards, verify the card's country, currency, brand and redemption instructions shown on the product page.",
        "For mobile top-ups, check that the recipient phone number, country code and mobile operator were entered accurately and allow a few minutes if the status is still pending.",
        "For physical products, review the carrier tracking link and delivery window in your order confirmation."
      ]},
      { title: "3. Step 1 — Submit a dispute to Pexly support", paragraphs: [
        "Contact our team through the Contact Us page or by emailing support@pexly.app with the subject Dispute Resolution. Provide complete information in your initial message so your case can be assigned without back-and-forth delays:"
      ], bullets: [
        "Your order reference and the email address associated with the order.",
        "The cryptocurrency asset, network, amount sent and transaction hash (txid), if payment was made on-chain.",
        "A clear description of what went wrong (such as non-delivery, an invalid code, an underpayment or a damaged parcel).",
        "Supporting evidence such as checkout screenshots, carrier notices or photographs of damaged packaging — never include private keys, passwords or wallet recovery phrases."
      ]},
      { title: "4. Step 2 — Investigation and supplier verification", paragraphs: [
        "Once your dispute is logged, Pexly reviews internal checkout telemetry, payment processor callbacks and order fulfilment records. Where an issue involves an external issuer, mobile aggregator or shipping carrier, we open a verification request with that provider.",
        "During an active investigation, please do not publish, share or attempt to repeatedly redeem a disputed gift card code, and do not place duplicate replacement orders unless you intend to pay for each order separately."
      ]},
      { title: "5. Gift card and digital code disputes", paragraphs: [
        "If a digital code fails to redeem, shows an unexpected balance or appears redeemed prior to delivery, include screenshots showing the brand's error message alongside your order reference.",
        "Where the supplier confirms a code was defective, duplicated or improperly issued before delivery, Pexly will arrange a replacement code or a refund in line with our Refund and Cancellation Policy. Codes that were validly issued and redeemed after delivery, or purchased for an incompatible country or account region, are generally not eligible for reversal unless required by law."
      ]},
      { title: "6. Mobile top-up disputes", paragraphs: [
        "Mobile top-ups pass through independent telecom aggregators and local operators. A top-up showing a pending status may still be processing on the carrier's network.",
        "If a carrier confirms that a top-up failed or was reversed, we will issue a retry or refund. Once an operator confirms successful delivery to the recipient number entered at checkout, the top-up cannot normally be clawed back."
      ]},
      { title: "7. Physical product and shipping disputes", paragraphs: [
        "If a physical order arrives damaged, defective or incomplete, or fails to arrive within the estimated delivery window, notify support promptly and retain all original packaging and labels until review instructions are provided.",
        "Where a return or replacement is approved, support will confirm the authorised return address, carrier steps and whether return shipping is covered under applicable consumer protections."
      ]},
      { title: "8. Cryptocurrency payment and settlement disputes", paragraphs: [
        "Because blockchain transfers are non-custodial and irreversible once confirmed, disputes involving underpayments, late payments after quote expiry, overpayments or transfers sent on an unsupported network require manual reconciliation with our payment gateway.",
        "Include the exact transaction hash and sending network when contacting support. Where a recoverable refund is approved, any applicable network transaction fees and exchange rate movements between purchase and refund time will be confirmed with you before funds are sent."
      ]},
      { title: "9. Timelines and escalation", paragraphs: [
        "Most straightforward payment and order checks are reviewed within 1 to 3 business days. Cases requiring formal logs from a gift card issuer, telecom operator or international shipping carrier can take 5 to 10 business days or longer depending on partner response times.",
        "If you believe a closed dispute overlooked key evidence, reply to the same support thread or email support@pexly.app requesting a senior review and reference your original ticket ID."
      ]},
      { title: "10. Statutory and consumer rights", paragraphs: [
        "Using Pexly's internal dispute process does not waive or restrict any mandatory statutory rights, consumer guarantees or rights to seek resolution through a competent court, regulator or consumer protection body under the laws that apply where you live."
      ]}
    ]
  }
};

function LegalDocument({ kind }: { kind: "privacy" | "terms" | "refund" | "dispute" }) {
  const document = legalDocuments[kind];
  const path =
    kind === "privacy"
      ? "/privacy"
      : kind === "terms"
        ? "/terms"
        : kind === "refund"
          ? "/refund-policy"
          : "/dispute-resolution";
  const description = document.intro.slice(0, 155);
  const canonical = buildCanonicalUrl(path);

  useHead({
    title: `${document.title} | Pexly`,
    meta: [
      { name: "description", content: description },
      { property: "og:title", content: `${document.title} | Pexly` },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
    ],
    link: [{ rel: "canonical", key: "canonical", href: canonical }],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-5 pt-6 pb-2 md:px-8 md:pt-10">
        <section className="rounded-3xl bg-[#f3f4ef] px-6 py-14 text-center dark:bg-card md:px-12 md:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#5d7932] dark:text-primary">
              {document.eyebrow}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {document.title} – Pexly
            </h1>
          </div>
        </section>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-10 md:px-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
        <main className="min-w-0">
          <header className="mb-8 border-b border-border pb-7">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {document.title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-muted-foreground">
              <span>Last updated: {document.updated}</span>
              <span aria-hidden="true">·</span>
              <span>Applies to pexly.app</span>
            </div>
            <p className="mt-5 text-[15px] font-medium leading-8 text-foreground/85 md:text-base">
              {document.intro}
            </p>
          </header>

          <div className="mb-8 rounded-2xl border border-border bg-[#f3f4ef]/70 p-5 text-sm font-medium leading-7 text-foreground/80 dark:bg-card">
            Please read this document together with the information shown at checkout and the terms that apply to any independent supplier or payment service you choose to use. If you have a question about a specific order, contact <a className="font-bold text-foreground underline underline-offset-4" href="mailto:support@pexly.app">support@pexly.app</a>.
          </div>

          <div className="space-y-10">
            {document.sections.map((section, index) => (
              <section key={section.title} id={`section-${index + 1}`} className="scroll-mt-24">
                <h3 className="mb-3.5 text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  {section.title}
                </h3>
                <div className="space-y-4">
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className="text-[15px] font-medium leading-8 text-foreground/80">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="list-disc space-y-2 pl-6 text-[15px] font-medium leading-8 text-foreground/80">
                      {section.bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-14 border-t border-border pt-8">
            <p className="text-sm font-medium leading-7 text-foreground/80">
              For help with an account, payment or order, visit our <Link href="/support" className="font-bold text-foreground underline underline-offset-4">Help Center</Link> or <Link href="/contact" className="font-bold text-foreground underline underline-offset-4">contact Pexly support</Link>.
            </p>
          </div>
        </main>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold text-foreground">Legal documents</h2>
            <nav className="mt-4 flex flex-col gap-3 text-sm">
              <Link href="/terms" className={kind === "terms" ? "font-bold text-[#5d7932] dark:text-primary" : "font-medium text-muted-foreground hover:text-foreground"}>Terms of Service</Link>
              <Link href="/privacy" className={kind === "privacy" ? "font-bold text-[#5d7932] dark:text-primary" : "font-medium text-muted-foreground hover:text-foreground"}>Privacy Policy</Link>
              <Link href="/refund-policy" className={kind === "refund" ? "font-bold text-[#5d7932] dark:text-primary" : "font-medium text-muted-foreground hover:text-foreground"}>Refund and Cancellation Policy</Link>
              <Link href="/dispute-resolution" className={kind === "dispute" ? "font-bold text-[#5d7932] dark:text-primary" : "font-medium text-muted-foreground hover:text-foreground"}>Dispute Resolution</Link>
            </nav>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-[#f3f4ef] p-5 dark:bg-card">
            <h2 className="text-sm font-bold text-foreground">Need assistance?</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-foreground/75">Our support team can help with questions about an order or these documents.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/contact" className="inline-flex text-sm font-bold text-foreground underline underline-offset-4">Contact support</Link>
              <a href="mailto:support@pexly.app" className="inline-flex text-sm font-bold text-foreground underline underline-offset-4">Email support@pexly.app</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function PrivacyPage() { return <LegalDocument kind="privacy" />; }
export function TermsPage() { return <LegalDocument kind="terms" />; }
export function RefundPolicyPage() { return <LegalDocument kind="refund" />; }
export function DisputeResolutionPage() { return <LegalDocument kind="dispute" />; }
