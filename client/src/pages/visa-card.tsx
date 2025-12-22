import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowRight, Smartphone, Wifi, ArrowLeftRight, CreditCard, Snowflake, Info, Ban, Lock, Check, Star, Globe, Headphones, ShoppingCart, CheckCircle, PlusCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
// Unsplash image URLs
const lifestylePasta = "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&q=80&w=800";
const lifestyleBeach = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800";
const lifestyleBike = "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800";

// ============ CRYPTO ICONS ============
const BitcoinIcon = ({ className }: { className?: string }) => (
  <div className={className || "crypto-icon bg-crypto-bitcoin/20"}>
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="hsl(36 100% 50%)" />
      <path d="M15.5 10.5c.3-1.2-.7-1.8-2-2.2l.4-1.6-1-.3-.4 1.6c-.3-.1-.5-.1-.8-.2l.4-1.6-1-.2-.4 1.6c-.2-.1-.4-.1-.7-.2l-1.3-.3-.3 1.1s.7.2.7.2c.4.1.5.4.5.6l-.5 2.1c0 0 .1 0 .1 0l-.1 0-.7 2.9c-.1.2-.2.4-.6.3 0 0-.7-.2-.7-.2l-.5 1.2 1.3.3c.2.1.4.1.7.2l-.4 1.6 1 .3.4-1.6c.3.1.6.1.8.2l-.4 1.6 1 .2.4-1.6c1.7.3 2.9.2 3.5-1.3.4-1.2 0-1.9-.9-2.4.7-.1 1.2-.6 1.3-1.5zm-2.3 3.2c-.3 1.2-2.4.6-3 .4l.5-2.2c.6.2 2.8.5 2.5 1.8zm.3-3.3c-.3 1.1-2 .5-2.5.4l.5-2c.5.1 2.3.4 2 1.6z" fill="hsl(0 0% 100%)" />
    </svg>
  </div>
);

const EthereumIcon = () => (
  <div className="crypto-icon bg-crypto-ethereum/20">
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M12 1.5L5.5 12.5L12 16.5L18.5 12.5L12 1.5Z" fill="hsl(0 0% 85%)" />
      <path d="M12 16.5L5.5 12.5L12 22.5L18.5 12.5L12 16.5Z" fill="hsl(0 0% 70%)" />
    </svg>
  </div>
);

const USDCIcon = () => (
  <div className="crypto-icon bg-crypto-usdc/20">
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <circle cx="12" cy="12" r="10" fill="hsl(165 100% 40%)" />
      <path d="M12 6v1.5m0 9V18m3-6c0-1.5-1.5-2.5-3-2.5s-3 1-3 2.5 1.5 2.5 3 2.5 3-1 3-2.5z" stroke="hsl(0 0% 100%)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
);

const BNBIcon = () => (
  <div className="crypto-icon bg-crypto-bnb/20">
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <circle cx="12" cy="12" r="10" fill="hsl(45 100% 50%)" />
      <path d="M12 6L8 10l2 2-2 2 4 4 4-4-2-2 2-2-4-4z" fill="hsl(0 0% 100%)" />
    </svg>
  </div>
);

const CryptoIconsRow = () => (
  <div className="flex items-center justify-center gap-4">
    <BitcoinIcon />
    <EthereumIcon />
    <USDCIcon />
    <BNBIcon />
  </div>
);

// ============ HERO CARD ============
const HeroCard = () => (
  <section className="px-4 pt-4 pb-6">
    <div className="rounded-3xl p-6 md:p-8 relative overflow-hidden border-2 border-cyan-600/40 dark:border-cyan-500/60 bg-gradient-to-br from-cyan-50/50 dark:from-cyan-950/30 to-teal-50/50 dark:to-teal-950/30">
      <div className="absolute left-6 md:left-8 top-6 md:top-8 w-1.5 h-24 rounded-full overflow-hidden">
        <div className="w-full h-1/3 bg-red-500" />
        <div className="w-full h-1/3 bg-yellow-400" />
        <div className="w-full h-1/3 bg-green-500" />
      </div>
      <div className="pl-5">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-5">
          Hold your crypto wherever you like, spend it with the Pexly Card
        </h1>
        <p className="text-muted-foreground text-base mb-6">Your card is free.</p>
      </div>
    </div>
  </section>
);

// ============ DEPOSIT SECTION ============
const DepositSection = () => (
  <section className="px-4 py-10">
    <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4">
      Deposit crypto,<br />pay with a tap
    </h2>
    <p className="text-muted-foreground text-lg mb-8">
      Top up your Pexly Card with EUR using BTC, ETH, USDC, BNB and more.
    </p>
    <CryptoIconsRow />
  </section>
);

// ============ LIFESTYLE CAROUSEL ============
const lifestyleCards = [
  { id: 1, image: lifestylePasta, tagline: "Easier than finding pasta in Italy." },
  { id: 2, image: lifestyleBeach, tagline: "Easier than a picnic at the beach." },
  { id: 3, image: lifestyleBike, tagline: "Easier than renting a bike in the Netherlands." },
];

const LifestyleCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToNext = () => {
    const nextIndex = (activeIndex + 1) % lifestyleCards.length;
    setActiveIndex(nextIndex);
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth * 0.75;
      scrollRef.current.scrollTo({ left: nextIndex * (cardWidth + 16), behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 overflow-hidden">
      <div ref={scrollRef} className="flex gap-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {lifestyleCards.map((card) => (
          <div key={card.id} className="lifestyle-card flex-shrink-0 w-[75vw] md:w-[380px] aspect-[4/5] rounded-3xl snap-center relative overflow-hidden" style={{ backgroundImage: `url(${card.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
            <div className="absolute top-4 left-4 p-2.5 rounded-full bg-white/10 backdrop-blur-md">
              <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 z-10">
              <h3 className="text-xl font-semibold text-white mb-1">Spend crypto.</h3>
              <p className="text-lg text-white/90 font-medium leading-snug">{card.tagline}</p>
              <div className="mt-6 inline-flex items-center gap-3 px-4 py-3 border border-white/25 rounded-xl bg-white/5 backdrop-blur-sm">
                <span className="text-sm font-medium text-white/90">Pexly</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-4 border border-white/50 rounded" />
                  <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="6" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="18" cy="12" r="2" />
                  </svg>
                </div>
              </div>
              <button className="absolute bottom-6 left-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowUpRight className="w-5 h-5 text-white" />
              </button>
            </div>
            <button onClick={scrollToNext} className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors z-20">
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

// ============ WALLET SECTION ============
const WalletSection = () => (
  <section className="px-4 py-6">
    <div className="flex items-center justify-center gap-8 py-3">
      <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 p-0.5">
        <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
          <div className="w-7 h-5 rounded bg-gradient-to-r from-blue-500 via-green-400 to-yellow-500" />
        </div>
      </div>
      <div className="text-foreground">
        <svg className="w-11 h-11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      </div>
    </div>
    <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-2">Crypto in, money out</h2>
    <p className="text-muted-foreground text-lg mb-6">Use the Pexly Card with Google Wallet. Apple Pay coming soon.</p>
    <div className="flex justify-center">
      <img src="/assets/IMG_3068.jpeg" alt="Crypto payments" className="w-full max-w-md rounded-2xl" />
    </div>
  </section>
);

// ============ FEATURES SECTION ============
const features = [
  { icon: <Smartphone className="w-6 h-6" />, title: "Digital payments", description: "Pay online everywhere VISA is accepted." },
  { icon: <Wifi className="w-6 h-6" />, title: "Pay in store", description: "Both with PIN or contactless." },
  { icon: <ArrowLeftRight className="w-6 h-6" />, title: "Cash out with SEPA**", description: "Send money from the card to your bank account." },
  { icon: <CreditCard className="w-6 h-6" />, title: "ATM Withdrawals", description: "Withdraw cash from ATMs with the physical card." },
];

const FeaturesSection = () => (
  <section className="px-4 py-8 pb-12">
    <div className="space-y-6">
      {features.map((feature, index) => (
        <div key={index}>
          <div className="text-muted-foreground mb-3">{feature.icon}</div>
          <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
          <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
        </div>
      ))}
    </div>
  </section>
);

// ============ SECURITY SECTION ============
const securityFeatures = [
  { icon: <Snowflake className="w-5 h-5" />, title: "Freeze", description: "your card on the go." },
  { icon: <Info className="w-5 h-5" />, title: "Instant", description: "usage notifications." },
  { icon: <Ban className="w-5 h-5" />, title: "Revoke", description: "the card instantly." },
  { icon: <Lock className="w-5 h-5" />, title: "3D Secure", description: "on every transaction." },
];

const SecuritySection = () => (
  <section className="px-4 py-10">
    <div className="mb-8 flex justify-center">
      <img src="/assets/IMG_3066.jpeg" alt="Payment options" className="w-full max-w-sm md:max-w-xs rounded-2xl border border-border shadow-sm" />
    </div>
    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">Easily accessible<br />security features</h2>
    <p className="text-muted-foreground text-lg mb-6">Light on complexity, heavy on safety — You're in control.</p>
    <div className="space-y-3">
      {securityFeatures.map((feature, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="text-foreground">{feature.icon}</div>
          <p className="text-foreground"><span className="font-semibold">{feature.title}</span> <span className="text-muted-foreground">{feature.description}</span></p>
        </div>
      ))}
    </div>
  </section>
);

// ============ CARD TYPES SECTION ============
const CardTypesSection = () => {
  const [activeCard, setActiveCard] = useState<'virtual' | 'physical'>('virtual');
  const virtualFeatures = [{ text: "Google Wallet", available: true }, { text: "Apple Wallet", available: true, comingSoon: true }];
  const physicalFeatures = [{ text: "Google Wallet", available: true }, { text: "Apple Wallet", available: true, comingSoon: true }, { text: "NFC Payments", available: true }, { text: "ATM withdrawals", available: true }];
  const cardFeatures = activeCard === 'virtual' ? virtualFeatures : physicalFeatures;

  return (
    <section className="px-4 py-10">
      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">Virtual, or in<br />your pocket</h2>
      <p className="text-muted-foreground text-lg mb-8">Choose the card that suits your lifestyle.</p>
      <div className="relative mb-8">
        <div className="w-full max-w-sm mx-auto">
          {activeCard === 'virtual' ? (
            <div className="aspect-[1.6/1] bg-primary rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0"><svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none"><path d="M-50,100 Q80,50 150,120 T350,80" stroke="#ef4444" strokeWidth="60" fill="none" opacity="0.8"/></svg></div>
              <span className="relative text-primary-foreground font-bold text-xl">Pexly</span>
              <div className="absolute bottom-6 right-6"><span className="text-primary-foreground font-bold text-xl tracking-wider">VISA</span></div>
            </div>
          ) : (
            <div className="aspect-[1.6/1] bg-red-500 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0"><svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none"><path d="M-20,150 Q100,50 180,120 T380,60" stroke="#166534" strokeWidth="80" fill="none" opacity="0.9"/></svg></div>
              <span className="relative text-white font-bold text-xl">Pexly</span>
              <div className="absolute top-1/2 left-6 -translate-y-1/2 flex items-center gap-2">
                <div className="w-10 h-8 bg-yellow-400 rounded-sm grid grid-cols-2 gap-0.5 p-1"><div className="bg-yellow-600 rounded-sm"></div><div className="bg-yellow-600 rounded-sm"></div><div className="bg-yellow-600 rounded-sm"></div><div className="bg-yellow-600 rounded-sm"></div></div>
                <div className="text-white/80 text-2xl">)))</div>
              </div>
              <div className="absolute bottom-6 right-6"><span className="text-white font-bold text-xl tracking-wider">VISA</span></div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-8 mb-6">
        <button onClick={() => setActiveCard('virtual')} className={`text-xl font-bold transition-colors ${activeCard === 'virtual' ? 'text-foreground' : 'text-muted-foreground'}`}>Virtual</button>
        <button onClick={() => setActiveCard('physical')} className={`text-xl font-bold transition-colors ${activeCard === 'physical' ? 'text-foreground' : 'text-muted-foreground'}`}>Physical</button>
      </div>
      <div className="space-y-3">
        {cardFeatures.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <Check className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">{feature.text}</span>
            {feature.comingSoon && <span className="bg-secondary text-muted-foreground text-xs px-2 py-1 rounded-full">Coming soon</span>}
          </div>
        ))}
        {activeCard === 'virtual' && <div className="flex items-center gap-3"><Check className="w-5 h-5 text-muted-foreground" /><span className="text-foreground">Start using it right away</span></div>}
      </div>
      <button className="mt-8 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors">Get your card</button>
    </section>
  );
};

// ============ TRUSTPILOT SECTION ============
const TrustpilotSection = () => (
  <section className="px-4 py-10 text-center">
    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Our customers<br />love us</h2>
    <div className="flex items-center justify-center gap-3 mb-6">
      <div className="flex items-center gap-1"><Star className="w-5 h-5 text-emerald-500 fill-emerald-500" /><span className="text-foreground font-bold">Trustpilot</span></div>
      <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((star) => (<div key={star} className="w-7 h-7 bg-emerald-500 flex items-center justify-center"><Star className="w-4 h-4 text-white fill-white" /></div>))}</div>
      <span className="text-muted-foreground">4.8</span>
    </div>
    <button className="bg-secondary text-foreground font-semibold px-6 py-3 rounded-full hover:bg-secondary/80 transition-colors border border-border">Read reviews</button>
  </section>
);

// ============ CARD DETAILS SECTION ============
const CardDetailsSection = () => (
  <section className="px-4 py-8 space-y-6">
    <div className="border-b border-border pb-6">
      <div className="flex items-center gap-3 mb-2"><CreditCard className="w-5 h-5 text-muted-foreground" /><span className="text-foreground font-semibold">Card network</span></div>
      <p className="text-muted-foreground ml-8">VISA</p>
    </div>
    <div className="border-b border-border pb-6">
      <div className="flex items-center gap-3 mb-2"><BitcoinIcon className="w-5 h-5" /><span className="text-foreground font-semibold">Supported currencies</span></div>
      <p className="text-muted-foreground ml-8">Bitcoin.<br />Bitcoin on Lightning Network.<br />Ethereum.</p>
    </div>
    <div className="border-b border-border pb-6">
      <div className="flex items-center gap-3 mb-2"><Globe className="w-5 h-5 text-muted-foreground" /><span className="text-foreground font-semibold">Eligible countries</span></div>
      <p className="text-muted-foreground ml-8 text-sm leading-relaxed">Austria, Belgium, Bulgaria, Croatia, Republic of Cyprus, Czech Republic, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain and Sweden.</p>
      <p className="text-primary ml-8 mt-3 text-sm">Please <span className="font-semibold underline">check the list of countries or regions</span> where the Pexly Card is not supported.</p>
    </div>
    <div className="border-b border-border pb-6">
      <div className="flex items-center gap-3 mb-2"><Headphones className="w-5 h-5 text-muted-foreground" /><span className="text-foreground font-semibold">Customer service</span></div>
      <p className="text-muted-foreground ml-8">24/7</p>
    </div>
    <div className="border-b border-border pb-6">
      <div className="flex items-center gap-3 mb-2"><ShoppingCart className="w-5 h-5 text-muted-foreground" /><span className="text-foreground font-semibold">Spending limits</span></div>
      <div className="ml-8"><p className="text-muted-foreground">Starter</p><p className="text-muted-foreground">€7,500 per day</p><p className="text-muted-foreground">€7,500 per month</p><p className="text-muted-foreground/70 text-sm mt-2">Payments and cash out transactions share the same limits.</p></div>
    </div>
    <div className="border-b border-border pb-6">
      <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-5 h-5 text-muted-foreground" /><span className="text-foreground font-semibold">No-fee</span></div>
      <div className="ml-8 text-muted-foreground space-y-1"><p>Account setup.</p><p>Virtual card creation.</p><p>Physical card creation.</p><p>Monthly usage.</p><p>Foreign transactions.</p><p>Card transactions.</p><p>Cash out fee.</p></div>
    </div>
    <div className="border-b border-border pb-6">
      <div className="flex items-center gap-3 mb-2"><PlusCircle className="w-5 h-5 text-muted-foreground" /><span className="text-foreground font-semibold">Deposit fee</span></div>
      <div className="ml-8"><p className="text-foreground font-semibold">1.99%</p><p className="text-muted-foreground/70 text-sm mt-2">This is the fixed fee charged by Pexly on top of the variable cost of exchange, based on our card partner's live market price at the moment the payment is confirmed.</p></div>
    </div>
    <div className="pb-6">
      <div className="flex items-center gap-3 mb-2"><Smartphone className="w-5 h-5 text-muted-foreground" /><span className="text-foreground font-semibold">Experience</span></div>
      <p className="text-muted-foreground ml-8">The Pexly Card is available both in the <span className="font-semibold">app</span> and on our <span className="font-semibold">website</span></p>
    </div>
    <div className="text-muted-foreground/60 text-sm space-y-3">
      <p>*Different limits are available according to your level of identity verification. Obtaining a Pexly Card involves a verification procedure managed by our card partner.</p>
      <p>**Unfortunately the Cash Out feature is currently unavailable for Swedish residents.</p>
      <p>***Physical card reorders are subject to a fee.</p>
    </div>
    <button className="w-full bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors">Discover more</button>
  </section>
);

// ============ FAQ SECTION ============
const faqs = [
  { question: "Why should you get a Pexly Card?", answer: "Get the Pexly Card to effortlessly spend your crypto directly from any wallet, ensuring privacy and security with every transaction. It's accessible for EU nationals and residents, requiring only an ID to start making swift and secure purchases. All of this, while experiencing unparalleled support with our industry-leading customer service, making your crypto-fueled lifestyle and daily activities seamless and reliable." },
  { question: "Where can I use the Pexly Card?", answer: "You can use the Pexly Card anywhere VISA is accepted, both online and in physical stores. This includes millions of merchants worldwide." },
  { question: "What fees are associated with the Pexly Card?", answer: "The Pexly Card has no fees for account setup, virtual card creation, physical card creation, monthly usage, foreign transactions, card transactions, or cash out. There is a 1.99% deposit fee charged on top of the exchange rate." },
  { question: "What are the spending limits for the Pexly Card?", answer: "Starter tier limits are €7,500 per day and €7,500 per month. Higher limits are available based on your identity verification level." },
  { question: "Who is eligible to apply for the Pexly Card?", answer: "EU nationals and residents from eligible countries can apply. You'll need to complete identity verification through our card partner." },
  { question: "How do I order a physical card?", answer: "After creating your virtual card, you can order a physical card directly from the Pexly app or website. Physical card creation is free, though reorders may be subject to a fee." },
];

const FAQSection = () => (
  <section className="px-4 py-10">
    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Frequently asked questions</h2>
    <p className="text-muted-foreground mb-8">Check out our <span className="text-foreground underline">Knowledge Base</span> page for more FAQs</p>
    <Accordion type="single" collapsible className="space-y-0">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
          <AccordionTrigger className="text-foreground text-left font-semibold py-5 hover:no-underline">{faq.question}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-5">{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);

// ============ FOOTER SECTION ============
const FooterSection = () => (
  <footer className="px-4 py-8 bg-secondary">
    <div className="flex flex-wrap justify-center gap-3 mb-6">
      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center"><span className="text-white font-bold text-lg">₿</span></div>
      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center"><span className="text-white font-bold text-lg">⚡</span></div>
      <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center"><span className="text-white font-bold text-lg">◆</span></div>
      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center"><span className="text-white font-bold text-sm">$</span></div>
      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center"><span className="text-white font-bold text-sm">₮</span></div>
      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-emerald-400 rounded-full flex items-center justify-center"><span className="text-white font-bold text-sm">S</span></div>
      <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center"><span className="text-white font-bold text-sm">—</span></div>
      <div className="w-10 h-10 bg-pink-400 rounded-full flex items-center justify-center"><span className="text-white font-bold text-sm">∞</span></div>
      <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center border border-border"><span className="text-white font-bold text-sm">F</span></div>
      <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center border border-border"><span className="text-foreground font-bold text-xs"></span></div>
    </div>
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      <div className="h-8 px-3 bg-background rounded flex items-center justify-center border border-border"><span className="text-foreground font-semibold text-xs">G Pay</span></div>
      <div className="h-8 px-3 bg-background rounded flex items-center justify-center border border-border"><span className="text-blue-600 font-bold text-xs">VISA</span></div>
      <div className="h-8 px-3 bg-background rounded flex items-center justify-center border border-border"><div className="flex"><div className="w-4 h-4 bg-red-500 rounded-full -mr-1"></div><div className="w-4 h-4 bg-yellow-500 rounded-full"></div></div></div>
      <div className="h-8 px-3 bg-background rounded flex items-center justify-center border border-border"><span className="text-pink-600 font-bold text-xs">iDEAL</span></div>
    </div>
    <div className="text-center text-muted-foreground text-sm">© 2024 Pexly. All rights reserved.</div>
  </footer>
);

// ============ MAIN PAGE ============
const VisaCard = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroCard />
      <DepositSection />
      <LifestyleCarousel />
      <WalletSection />
      <FeaturesSection />
      <SecuritySection />
      <CardTypesSection />
      <TrustpilotSection />
      <CardDetailsSection />
      <FAQSection />
      <FooterSection />
    </main>
  );
};

export default VisaCard;
