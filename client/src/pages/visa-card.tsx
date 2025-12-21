import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowRight, Smartphone, Wifi, ArrowLeftRight, CreditCard, Snowflake, Info, Ban, Lock, Check, Star, Globe, Headphones, ShoppingCart, CheckCircle, PlusCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Placeholder image paths
const lifestylePasta = "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&q=80&w=800";
const lifestyleBeach = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800";
const lifestyleBike = "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800";

const BitcoinIcon = ({ className }: { className?: string }) => (
  <div className={className || "w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center"}>
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="hsl(36 100% 50%)" />
      <path d="M15.5 10.5c.3-1.2-.7-1.8-2-2.2l.4-1.6-1-.3-.4 1.6c-.3-.1-.5-.1-.8-.2l.4-1.6-1-.2-.4 1.6c-.2-.1-.4-.1-.7-.2l-1.3-.3-.3 1.1s.7.2.7.2c.4.1.5.4.5.6l-.5 2.1c0 0 .1 0 .1 0l-.1 0-.7 2.9c-.1.2-.2.4-.6.3 0 0-.7-.2-.7-.2l-.5 1.2 1.3.3c.2.1.4.1.7.2l-.4 1.6 1 .3.4-1.6c.3.1.6.1.8.2l-.4 1.6 1 .2.4-1.6c1.7.3 2.9.2 3.5-1.3.4-1.2 0-1.9-.9-2.4.7-.1 1.2-.6 1.3-1.5zm-2.3 3.2c-.3 1.2-2.4.6-3 .4l.5-2.2c.6.2 2.8.5 2.5 1.8zm.3-3.3c-.3 1.1-2 .5-2.5.4l.5-2c.5.1 2.3.4 2 1.6z" fill="white" />
    </svg>
  </div>
);

const EthereumIcon = () => (
  <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M12 1.5L5.5 12.5L12 16.5L18.5 12.5L12 1.5Z" fill="hsl(0 0% 65%)" />
      <path d="M12 16.5L5.5 12.5L12 22.5L18.5 12.5L12 16.5Z" fill="hsl(0 0% 50%)" />
    </svg>
  </div>
);

const USDCIcon = () => (
  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <circle cx="12" cy="12" r="10" fill="hsl(215 100% 50%)" />
      <path d="M12 6v1.5m0 9V18m3-6c0-1.5-1.5-2.5-3-2.5s-3 1-3 2.5 1.5 2.5 3 2.5 3-1 3-2.5z" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
);

const BNBIcon = () => (
  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <circle cx="12" cy="12" r="10" fill="hsl(45 100% 50%)" />
      <path d="M12 6L8 10l2 2-2 2 4 4 4-4-2-2 2-2-4-4z" fill="white" />
    </svg>
  </div>
);

const HeroCard = () => (
  <section className="px-4 pt-12 pb-16">
    <div className="rounded-[3rem] p-10 md:p-20 relative overflow-hidden bg-white text-black text-center border border-black/5 shadow-sm">
      <div className="flex justify-center mb-10">
        <div className="w-1.5 h-32 rounded-full overflow-hidden flex flex-col">
          <div className="w-full h-1/3 bg-red-500" />
          <div className="w-full h-1/3 bg-yellow-400" />
          <div className="w-full h-1/3 bg-green-500" />
        </div>
      </div>
      <h1 className="text-4xl md:text-7xl font-black leading-tight mb-12 max-w-4xl mx-auto tracking-tighter">
        Hold your crypto wherever you like, spend it with the Pexly Card
      </h1>
      <Button size="lg" className="bg-black text-white hover:bg-black/90 rounded-full px-12 py-8 text-xl font-black mb-8 shadow-2xl">Get your card</Button>
      <p className="text-black/40 text-lg font-bold">Your card is free.</p>
    </div>
  </section>
);

const DepositSection = () => (
  <section className="px-4 py-24 bg-white">
    <h2 className="text-5xl md:text-8xl font-black text-black leading-none mb-8 text-center tracking-tightest">
      Deposit crypto,<br />pay with a tap
    </h2>
    <p className="text-black/40 text-2xl mb-12 text-center max-w-2xl mx-auto font-bold leading-relaxed">
      Top up your Pexly Card with EUR using BTC, ETH, USDC, BNB and more.
    </p>
    <div className="flex items-center justify-center gap-6">
      <BitcoinIcon />
      <EthereumIcon />
      <USDCIcon />
      <BNBIcon />
    </div>
  </section>
);

const LifestyleCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cards = [
    { image: lifestylePasta, tagline: "Easier than finding pasta in Italy." },
    { image: lifestyleBeach, tagline: "Easier than a picnic at the beach." },
    { image: lifestyleBike, tagline: "Easier than renting a bike in the Netherlands." },
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div ref={scrollRef} className="flex gap-6 px-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        {cards.map((card, i) => (
          <div key={i} className="flex-shrink-0 w-[85vw] md:w-[480px] aspect-[3/4] rounded-[3rem] snap-center relative overflow-hidden shadow-2xl group">
            <img src={card.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-12">
              <h3 className="text-3xl font-black text-white mb-4">Spend crypto.</h3>
              <p className="text-2xl text-white/90 font-bold leading-tight mb-8">{card.tagline}</p>
              <div className="flex justify-between items-center">
                <div className="px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
                  <span className="text-white font-black italic">Pexly</span>
                </div>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <ArrowUpRight className="w-7 h-7 text-black" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const WalletSection = () => (
  <section className="px-4 py-32 bg-white text-center">
    <div className="flex justify-center gap-12 mb-16">
      <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center shadow-sm">
        <Smartphone className="w-10 h-10 text-black" />
      </div>
      <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center shadow-sm">
        <Wifi className="w-10 h-10 text-black" />
      </div>
    </div>
    <h2 className="text-5xl md:text-8xl font-black text-black leading-none mb-8 tracking-tightest">Crypto in, money out</h2>
    <p className="text-black/40 text-2xl font-bold max-w-2xl mx-auto">Use the Pexly Card with Google Wallet. Apple Pay coming soon.</p>
  </section>
);

const FeaturesSection = () => (
  <section className="px-6 py-32 bg-white text-black border border-black/5 rounded-[4rem] mx-4 mb-24">
    <div className="grid md:grid-cols-2 gap-24 max-w-6xl mx-auto">
      {[
        { icon: <Smartphone />, title: "Digital payments", desc: "Pay online everywhere VISA is accepted." },
        { icon: <Wifi />, title: "Pay in store", desc: "Both with PIN or contactless." },
        { icon: <ArrowLeftRight />, title: "Cash out with SEPA**", desc: "Send money from the card to your bank account." },
        { icon: <CreditCard />, title: "ATM Withdrawals", desc: "Withdraw cash from ATMs with the physical card." }
      ].map((f, i) => (
        <div key={i}>
          <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center mb-8">{React.cloneElement(f.icon as any, { className: "w-8 h-8 text-black" })}</div>
          <h3 className="text-3xl font-black mb-4">{f.title}</h3>
          <p className="text-black/40 text-xl font-bold leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

const SecuritySection = () => (
  <section className="px-4 py-32 bg-white">
    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
      <div className="relative">
        <div className="aspect-[3/4] bg-black/5 rounded-[4rem] shadow-sm border border-black/5 p-10 flex flex-col">
          <div className="flex justify-between items-start mb-12">
            <span className="text-black/40 font-black uppercase tracking-widest">Cards</span>
            <div className="w-12 h-10 bg-black/10 rounded-xl" />
          </div>
          <div className="w-full h-32 bg-[#166534] rounded-[2rem] flex items-center px-8 mb-12 shadow-inner">
            <span className="text-white font-black italic text-4xl">Pexly</span>
          </div>
          <div className="mt-auto">
            <span className="text-black/40 font-black uppercase tracking-widest block mb-2">Balance</span>
            <p className="text-black text-6xl font-black">€427.87</p>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 bg-white border-4 border-black/5 rounded-[2rem] p-8 shadow-2xl animate-bounce hidden md:flex items-center gap-6">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center"><Check className="text-white w-6 h-6" /></div>
          <div>
            <p className="text-xl font-black">Pexly Card</p>
            <p className="text-lg font-bold text-black/40">1 new notification</p>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-5xl md:text-7xl font-black text-black mb-10 leading-tight tracking-tightest">Easily accessible<br />security features</h2>
        <p className="text-black/40 text-2xl mb-12 font-bold leading-relaxed">Light on complexity, heavy on safety - You're in control.</p>
        <div className="grid gap-10">
          {[
            { icon: <Snowflake />, title: "Freeze", desc: "your card on the go." },
            { icon: <Info />, title: "Instant", desc: "usage notifications." },
            { icon: <Ban />, title: "Revoke", desc: "the card instantly." },
            { icon: <Lock />, title: "3D Secure", desc: "on every transaction." }
          ].map((s, i) => (
            <div key={i} className="flex gap-6 items-start">
              <div className="text-black mt-1">{React.cloneElement(s.icon as any, { className: "w-8 h-8" })}</div>
              <p className="text-2xl font-bold text-black"><span className="font-black">{s.title}</span> <span className="text-black/40">{s.desc}</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const CardTypesSection = () => {
  const [active, setActive] = useState<'v' | 'p'>('v');
  return (
    <section className="px-4 py-32 bg-black/5 rounded-[5rem] mx-4 mb-24">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl md:text-8xl font-black text-black mb-16 tracking-tightest">Virtual, or in<br />your pocket</h2>
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div className={`aspect-[1.6/1] rounded-[3rem] p-12 relative overflow-hidden shadow-2xl transition-all duration-700 ${active === 'v' ? 'bg-[#166534]' : 'bg-[#dc2626]'}`}>
            <span className="text-white font-black italic text-5xl">Pexly</span>
            <div className="absolute bottom-12 right-12 text-white font-black text-4xl italic tracking-widest">VISA</div>
          </div>
          <div>
            <div className="flex gap-12 mb-12 border-b-4 border-black/5 pb-8">
              <button onClick={() => setActive('v')} className={`text-4xl font-black transition-all ${active === 'v' ? 'text-black scale-110' : 'text-black/20'}`}>Virtual</button>
              <button onClick={() => setActive('p')} className={`text-4xl font-black transition-all ${active === 'p' ? 'text-black scale-110' : 'text-black/20'}`}>Physical</button>
            </div>
            <div className="space-y-6">
              {['Google Wallet', 'Apple Wallet', 'NFC Payments', 'ATM withdrawals'].map((f, i) => (
                <div key={i} className="flex items-center gap-6">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>
                  <span className="text-2xl font-black text-black">{f}</span>
                </div>
              ))}
            </div>
            <Button className="mt-16 bg-black text-white hover:bg-black/90 rounded-full h-20 px-12 text-2xl font-black shadow-2xl">Get your card</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const CardDetailsSection = () => (
  <section className="px-6 py-32 max-w-5xl mx-auto">
    <h2 className="text-5xl font-black mb-20 text-center tracking-tight">Card details</h2>
    <div className="grid gap-12">
      {[
        { icon: <CreditCard />, title: "Card network", val: "VISA" },
        { icon: <BitcoinIcon className="w-6 h-6 bg-transparent" />, title: "Currencies", val: "Bitcoin, Ethereum, USDC, BNB" },
        { icon: <Globe />, title: "Countries", val: "EU & EEA countries" },
        { icon: <ShoppingCart />, title: "Limits", val: "€7,500/day, €7,500/month" }
      ].map((d, i) => (
        <div key={i} className="flex items-center gap-10 border-b border-black/5 pb-10">
          <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center">{React.cloneElement(d.icon as any, { className: "w-7 h-7 text-black" })}</div>
          <div>
            <h4 className="text-black/40 font-black uppercase tracking-widest text-sm mb-1">{d.title}</h4>
            <p className="text-3xl font-black text-black">{d.val}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const FAQSection = () => (
  <section className="px-4 py-32 bg-white">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-5xl md:text-7xl font-black text-black mb-16 tracking-tightest">Common questions</h2>
      <Accordion type="single" collapsible className="space-y-6">
        {[
          { q: "Why choose Pexly?", a: "Effortlessly spend your crypto directly from any wallet, ensuring privacy and security with every transaction. Accessible for EU nationals and residents." },
          { q: "Where can I use it?", a: "Anywhere VISA is accepted worldwide, online and in-store." },
          { q: "What are the fees?", a: "Zero monthly fees, zero card creation fees. Just a 1.99% deposit fee." }
        ].map((faq, i) => (
          <AccordionItem key={i} value={`i-${i}`} className="border-none bg-black/5 rounded-[2.5rem] px-10 shadow-sm">
            <AccordionTrigger className="text-2xl font-black py-10 hover:no-underline text-left leading-tight">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-xl font-bold text-black/40 pb-10 leading-relaxed">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

const VisaCard = () => (
  <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white font-sans antialiased overflow-x-hidden">
    <HeroCard />
    <DepositSection />
    <LifestyleCarousel />
    <WalletSection />
    <FeaturesSection />
    <SecuritySection />
    <CardTypesSection />
    <CardDetailsSection />
    <FAQSection />
    <footer className="py-20 text-center border-t border-black/5 bg-white">
      <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
        <span className="text-white font-black text-3xl">₿</span>
      </div>
      <p className="text-black/20 font-black uppercase tracking-[0.3em] text-xs">© 2025 Pexly. All rights reserved.</p>
    </footer>
  </div>
);

export default VisaCard;
