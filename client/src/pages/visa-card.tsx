import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowRight, Smartphone, Wifi, ArrowLeftRight, CreditCard, Snowflake, Info, Ban, Lock, Check, Star, Globe, Headphones, ShoppingCart, CheckCircle, PlusCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Placeholder image paths - using existing assets where possible or public placeholders
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
  <section className="px-4 pt-6 pb-10">
    <div className="hero-card rounded-3xl p-7 md:p-10 relative overflow-hidden bg-primary/20">
      <div className="absolute left-7 md:left-10 top-7 md:top-10 w-1.5 h-28 rounded-full overflow-hidden">
        <div className="w-full h-1/3 bg-red-500" />
        <div className="w-full h-1/3 bg-yellow-400" />
        <div className="w-full h-1/3 bg-green-500" />
      </div>
      <div className="pl-5">
        <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-8">
          Hold your crypto wherever you like, spend it with the Pexly Card
        </h1>
        <Button size="lg" className="mb-4">Get your card</Button>
        <p className="text-white/70 text-base">Your card is free.</p>
      </div>
    </div>
  </section>
);

// ============ DEPOSIT SECTION ============
const DepositSection = () => (
  <section className="px-4 py-10">
    <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 text-center">
      Deposit crypto,<br />pay with a tap
    </h2>
    <p className="text-white/60 text-lg mb-8 text-center">
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
  <section className="px-4 py-10">
    <div className="flex items-center justify-center gap-8 py-6">
      <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 p-0.5">
        <div className="w-full h-full bg-background rounded-full flex items-center justify-center border border-white/10">
          <div className="w-7 h-5 rounded bg-gradient-to-r from-blue-500 via-green-400 to-yellow-500" />
        </div>
      </div>
      <div className="text-white">
        <svg className="w-11 h-11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      </div>
    </div>
    <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 text-center">Crypto in, money out</h2>
    <p className="text-white/60 text-lg text-center">Use the Pexly Card with Google Wallet. Apple Pay coming soon.</p>
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
  <section className="px-4 py-12 pb-20">
    <div className="space-y-10">
      {features.map((feature, index) => (
        <div key={index} className="opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards" style={{ animationDelay: `${index * 150}ms` }}>
          <div className="text-white/70 mb-3">{feature.icon}</div>
          <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
          <p className="text-white/50 text-base leading-relaxed">{feature.description}</p>
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
  <section className="px-4 py-16">
    <div className="relative mb-10">
      <div className="mx-auto w-64 h-80 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-48 h-64 bg-white/5 rounded-2xl mx-auto flex flex-col items-center justify-center p-4">
            <span className="text-white/40 text-sm">Cards</span>
            <div className="w-32 h-20 bg-teal-700 rounded-lg mt-2 flex items-center justify-center">
              <span className="text-white/80 text-xs font-bold">Pexly</span>
            </div>
            <div className="mt-4 text-left w-full">
              <span className="text-white/40 text-xs">Balance</span>
              <p className="text-white font-bold">€427.87</p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-8 right-4 bg-white rounded-xl px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-teal-600 rounded flex items-center justify-center"><Check className="text-white w-3 h-3" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-900">Pexly Card</p>
            <p className="text-xs text-gray-500">1 new notification</p>
          </div>
        </div>
      </div>
      <div className="absolute top-1/3 right-2 space-y-2">
        <div className="bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium">Freeze</div>
        <div className="bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium">Revoke</div>
      </div>
    </div>
    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">Easily accessible<br />security features</h2>
    <p className="text-white/60 text-lg mb-8">Light on complexity, heavy on safety - You're in control.</p>
    <Button variant="outline" className="mb-12">Get Your Card</Button>
    <div className="space-y-4">
      {securityFeatures.map((feature, index) => (
        <div key={index} className="flex items-center gap-4 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="text-white/70">{feature.icon}</div>
          <p className="text-white"><span className="font-semibold">{feature.title}</span> <span className="text-white/60">{feature.description}</span></p>
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
    <section className="px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">Virtual, or in<br />your pocket</h2>
      <p className="text-white/60 text-lg mb-8">Choose the card that suits your lifestyle.</p>
      <div className="relative mb-8">
        <div className="w-full max-w-sm mx-auto">
          {activeCard === 'virtual' ? (
            <div className="aspect-[1.6/1] bg-teal-700 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0"><svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none"><path d="M-50,100 Q80,50 150,120 T350,80" stroke="#ef4444" strokeWidth="60" fill="none" opacity="0.8"/></svg></div>
              <span className="relative text-white font-bold text-xl">Pexly</span>
              <div className="absolute bottom-6 right-6"><span className="text-white font-bold text-xl tracking-wider">VISA</span></div>
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
        <button onClick={() => setActiveCard('virtual')} className={`text-xl font-bold transition-colors ${activeCard === 'virtual' ? 'text-white' : 'text-white/40'}`}>Virtual</button>
        <button onClick={() => setActiveCard('physical')} className={`text-xl font-bold transition-colors ${activeCard === 'physical' ? 'text-white' : 'text-white/40'}`}>Physical</button>
      </div>
      <div className="space-y-3">
        {cardFeatures.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <Check className="w-5 h-5 text-white/60" />
            <span className="text-white">{feature.text}</span>
            {feature.comingSoon && <span className="bg-white/20 text-white/80 text-xs px-2 py-1 rounded-full">Coming soon</span>}
          </div>
        ))}
        {activeCard === 'virtual' && <div className="flex items-center gap-3"><Check className="w-5 h-5 text-white/60" /><span className="text-white">Start using it right away</span></div>}
      </div>
      <Button className="mt-8">Get your card</Button>
    </section>
  );
};

// ============ TRUSTPILOT SECTION ============
const TrustpilotSection = () => (
  <section className="px-4 py-16 text-center">
    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Our customers<br />love us</h2>
    <div className="flex items-center justify-center gap-3 mb-6">
      <div className="flex items-center gap-1"><Star className="w-5 h-5 text-emerald-400 fill-emerald-400" /><span className="text-white font-bold">Trustpilot</span></div>
      <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((star) => (<div key={star} className="w-7 h-7 bg-emerald-400 flex items-center justify-center"><Star className="w-4 h-4 text-white fill-white" /></div>))}</div>
      <span className="text-white/80">4.8</span>
    </div>
    <Button variant="outline">Read reviews</Button>
  </section>
);

// ============ CARD DETAILS SECTION ============
const CardDetailsSection = () => (
  <section className="px-4 py-12 space-y-8 bg-white text-black rounded-t-[3rem]">
    <div className="border-b border-black/10 pb-6">
      <div className="flex items-center gap-3 mb-2"><CreditCard className="w-5 h-5 text-black/60" /><span className="text-black font-semibold">Card network</span></div>
      <p className="text-black/80 ml-8 font-medium">VISA</p>
    </div>
    <div className="border-b border-black/10 pb-6">
      <div className="flex items-center gap-3 mb-2"><BitcoinIcon className="w-5 h-5" /><span className="text-black font-semibold">Supported currencies</span></div>
      <div className="text-black/80 ml-8 font-medium space-y-1">
        <p>Bitcoin.</p>
        <p>Bitcoin on Lightning Network.</p>
        <p>Ethereum.</p>
      </div>
    </div>
    <div className="border-b border-black/10 pb-6">
      <div className="flex items-center gap-3 mb-2"><Globe className="w-5 h-5 text-black/60" /><span className="text-black font-semibold">Eligible countries</span></div>
      <p className="text-black/60 ml-8 text-sm leading-relaxed font-medium">Austria, Belgium, Bulgaria, Croatia, Republic of Cyprus, Czech Republic, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain and Sweden.</p>
      <p className="text-teal-600 ml-8 mt-3 text-sm font-semibold">Please <span className="underline cursor-pointer">check the list of countries or regions</span> where the Pexly Card is not supported.</p>
    </div>
    <div className="border-b border-black/10 pb-6">
      <div className="flex items-center gap-3 mb-2"><Headphones className="w-5 h-5 text-black/60" /><span className="text-black font-semibold">Customer service</span></div>
      <p className="text-black/80 ml-8 font-medium">24/7</p>
    </div>
    <div className="border-b border-black/10 pb-6">
      <div className="flex items-center gap-3 mb-2"><ShoppingCart className="w-5 h-5 text-black/60" /><span className="text-black font-semibold">Spending limits</span></div>
      <div className="ml-8 font-medium space-y-1">
        <p className="text-black/80">Starter</p>
        <p className="text-black/80">€7,500 per day</p>
        <p className="text-black/80">€7,500 per month</p>
        <p className="text-black/40 text-sm mt-2 font-normal">Payments and cash out transactions share the same limits.</p>
      </div>
    </div>
    <div className="border-b border-black/10 pb-6">
      <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-5 h-5 text-black/60" /><span className="text-black font-semibold">No-fee</span></div>
      <div className="ml-8 text-black/80 space-y-1 font-medium">
        <p>Account setup.</p>
        <p>Virtual card creation.</p>
        <p>Physical card creation.</p>
        <p>Monthly usage.</p>
        <p>Foreign transactions.</p>
        <p>Card transactions.</p>
        <p>Cash out fee.</p>
      </div>
    </div>
    <div className="border-b border-black/10 pb-6">
      <div className="flex items-center gap-3 mb-2"><PlusCircle className="w-5 h-5 text-black/60" /><span className="text-black font-semibold">Deposit fee</span></div>
      <div className="ml-8 font-medium space-y-1">
        <p className="text-black/80 font-bold text-lg">1.99%</p>
        <p className="text-black/40 text-sm mt-2 font-normal leading-relaxed">This is the fixed fee charged by Pexly on top of the variable cost of exchange, based on our card partner's live market price at the moment the payment is confirmed.</p>
      </div>
    </div>
    <div className="pb-6">
      <div className="flex items-center gap-3 mb-2"><Smartphone className="w-5 h-5 text-black/60" /><span className="text-black font-semibold">Experience</span></div>
      <p className="text-black/80 ml-8 font-medium">The Pexly Card is available both in the <span className="font-bold">app</span> and on our <span className="font-bold">website</span></p>
    </div>
    <div className="text-black/40 text-xs space-y-3 font-medium px-2">
      <p>*Different limits are available according to your level of identity verification. Obtaining a Pexly Card involves a verification procedure managed by our card partner.</p>
      <p>**Unfortunately the Cash Out feature is currently unavailable for Swedish residents.</p>
      <p>***Physical card reorders are subject to a fee.</p>
    </div>
    <Button variant="default" className="w-full h-12 rounded-full font-bold">Discover more</Button>
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
  <section className="px-4 py-16 bg-white text-black">
    <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">Frequently asked questions</h2>
    <p className="text-black/60 mb-8 font-medium">Check out our <span className="text-black underline font-bold">Knowledge Base</span> page for more FAQs</p>
    <Accordion type="single" collapsible className="space-y-0">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`} className="border-b border-black/10">
          <AccordionTrigger className="text-black text-left font-bold py-5 hover:no-underline text-lg">{faq.question}</AccordionTrigger>
          <AccordionContent className="text-black/60 pb-5 font-medium leading-relaxed">{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);

// ============ FOOTER SECTION ============
const FooterSection = () => (
  <footer className="px-4 py-12 bg-white border-t border-black/5">
    <div className="flex flex-wrap justify-center gap-3 mb-6">
      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-sm"><span className="text-white font-bold text-lg">₿</span></div>
    </div>
  </footer>
);

const VisaCard = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
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
    </div>
  );
};

export default VisaCard;
