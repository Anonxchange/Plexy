import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Asset paths from public folder
const floatingMan = "/assets/IMG_3195.png";
const floatingWoman = "/assets/IMG_3208.png";
const rocketImage = "/assets/IMG_3216.png";
const creativeEyes = "/assets/IMG_3200.png";
const handsImage = "/assets/IMG_3196.png";
const customerImage = "/assets/IMG_3193.png";

const testimonials = [
  {
    name: "Podaz Store",
    type: "Digital Merchant",
    text: "I was recently in contact with Pexly's Customer Success team. The service was one of the best I have experienced – their agents were informative and helpful. Even with a small amount of information, they managed to detect the problem and solve it quickly.",
  },
  {
    name: "TechStartup Inc",
    type: "Crypto Trader",
    text: "Pexly's platform speed is incredible. Our trades execute in seconds, which has significantly improved our efficiency. The 24/7 support team is always responsive and knowledgeable.",
  },
  {
    name: "Creative Studio",
    type: "Design Agency",
    text: "The P2P marketplace made it so easy to manage our crypto assets. We had a professional setup running in just a few hours. Highly recommend for anyone starting their crypto journey.",
  },
];

const historyItems = [
  { year: "2018", text: "Pexly was founded with a mission to make cryptocurrency trading accessible to everyone worldwide." },
  { year: "2019", text: "We launched our first-class P2P marketplace supporting 50+ payment methods." },
  { year: "2020", text: "The Pexly brand was officially expanded with enhanced security features and escrow protection." },
  { year: "2021", text: "We reached our first million users worldwide and expanded across 100+ countries." },
  { year: "2022", text: "Pexly introduced an innovative lightning network integration for instant transfers." },
  { year: "2023", text: "We launched the AI-powered trading assistant for market analysis." },
  { year: "2024", text: "Reached 14 million customers and expanded payment methods to 500+." },
  { year: "2025", text: "Introduced advanced institutional features and continued global expansion." },
];

const strengths = [
  {
    title: "Seamless trading tools",
    description:
      "Regardless of your background or technical expertise, our trading and management tools have been created with user experience and security in mind. Control everything in one place with Pexly, from wallet management and offers to secure escrow trades. Have more time for what matters with our intuitive P2P marketplace – start trading within minutes, without limits.",
  },
  {
    title: "Transaction speed",
    description:
      "We want crypto traders and business owners to move forward, and fast. Imagine having your trades completed in milliseconds anywhere in the world with our globally distributed network and secure escrow system. Give your trading the best experience, and watch as your portfolio grows.",
  },
  {
    title: "Dedicated 24/7 support",
    description:
      "We are here for every committed crypto hustler who aims to rock the market. Our Customer Success team speaks 8+ languages, so you can confidently communicate your thoughts and concerns in your own language. Spend less time worrying about technical issues – we promise to get back to you quickly with helpful solutions.",
  },
];

const HeroSection = () => {
  return (
    <section className="bg-white text-black flex items-center relative overflow-hidden">
      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 pt-1 pb-8 md:pt-4 md:pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal leading-tight">
            <span className="block">Three.</span>
            <span className="block">Two.</span>
            <span className="block">Online.</span>
          </h1>
          <p className="mt-8 text-xl text-gray-600 max-w-lg hidden lg:block">
            Pexly is a leading global P2P cryptocurrency marketplace, 
            connecting millions of traders worldwide with zero hassle.
          </p>
        </motion.div>

        {/* Decorative Elements */}
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px] pointer-events-none">
          {/* Purple Circle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute left-1/4 top-1/2 -translate-y-1/2 w-48 md:w-64 lg:w-96 aspect-square"
          >
            <div className="w-full h-full rounded-full border-[12px] md:border-[16px] border-primary/20" />
          </motion.div>

          {/* Floating Man */}
          <motion.img
            src={floatingMan}
            alt="Professional floating"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute left-0 bottom-10 w-40 md:w-56 lg:w-80 object-contain animate-float grayscale"
            style={{ filter: "grayscale(100%)" }}
          />

          {/* Floating Woman */}
          <motion.img
            src={floatingWoman}
            alt="Professional floating"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute right-0 top-1/4 w-32 md:w-44 lg:w-64 object-contain animate-float-delayed grayscale"
            style={{ filter: "grayscale(100%)" }}
          />
        </div>

        {/* Dots Navigation Indicator */}
        <div className="absolute bottom-8 right-8 flex gap-1.5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i === 0 ? "bg-primary" : "bg-gray-200"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const AboutSection = () => {
  return (
    <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-8 md:py-12 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-serif italic text-4xl md:text-5xl lg:text-6xl font-normal mb-8 lg:text-left text-center"
          >
            About us
          </motion.h2>

          <h3 className="font-sans font-bold text-2xl md:text-3xl mb-6">
            Find your online success with Pexly
          </h3>
          <p className="font-sans text-lg md:text-xl leading-relaxed opacity-90">
            Pexly is on a mission to make cryptocurrency trading accessible to everyone worldwide – 
            from institutional traders to aspiring crypto enthusiasts. With our fast trading 
            technology, secure escrow system, and easy-to-operate dashboard you can succeed 
            in the crypto market faster and easier.
          </p>
        </motion.div>

        <div className="relative hidden lg:flex justify-center items-center">
          {/* Decorative Figure */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-md"
          >
            <img
              src={floatingMan}
              alt="Person walking"
              className="w-full object-contain grayscale brightness-200 opacity-20"
            />
          </motion.div>
        </div>

        {/* Blueprint Lines Background */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{
            backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
      </div>
    </section>
  );
};

const GlobalSection = () => {
  return (
    <section className="bg-gradient-to-br from-background via-primary/10 to-background text-foreground relative overflow-hidden border-t border-primary/10">
      <div className="px-6 md:px-12 lg:px-20 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <h2 className="font-sans font-bold text-2xl md:text-3xl mb-6">
            Globally recognized crypto marketplace
          </h2>
          
          <p className="font-sans text-lg md:text-xl leading-relaxed opacity-90 mb-6">
            Launched in 2018 as a fintech tech startup, Pexly is now a leading 
            provider of P2P trading solutions, and we serve over 14 million people from 140+ countries
          </p>
          
          <p className="font-sans text-lg md:text-xl leading-relaxed opacity-90 mb-6">
            Staying true to our reputation, we've been listed among the fastest-growing fintech companies
            for three years in a row. We'll continue improving our services, unlocking new markets, 
            and being part of even more crypto success stories.
          </p>
          
          <p className="font-sans text-lg md:text-xl leading-relaxed opacity-90">
            *Recognized by <a href="#" className="underline font-medium hover:opacity-80 transition-opacity">Financial Times</a>.
          </p>
        </motion.div>

        {/* Rocket Image */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 flex justify-center"
        >
          <div 
            className="relative w-64 md:w-80 p-8 bg-primary rounded-2xl"
            style={{
              backgroundImage: "linear-gradient(to right, rgba(0, 0, 0, 0.15) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 1.5px, transparent 1.5px)",
              backgroundSize: "40px 40px"
            }}
          >
            <img
              src={rocketImage}
              alt="Rocket launching - symbolizing growth"
              className="w-full object-contain"
            />
          </div>
        </motion.div>

        {/* Blueprint Lines Background */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
      </div>
    </section>
  );
};

const HistorySection = () => {
  const [currentIndex, setCurrentIndex] = useState(1);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : historyItems.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < historyItems.length - 1 ? prev + 1 : 0));
  };

  return (
    <section className="bg-white py-8 md:py-12">
      <div className="px-6 md:px-12 lg:px-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif italic text-4xl md:text-5xl lg:text-6xl font-normal text-center mb-12"
        >
          Our history
        </motion.h2>

        {/* Timeline Dots */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {historyItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all flex-shrink-0 ${
                index === currentIndex
                  ? "bg-black w-8"
                  : "bg-gray-200 hover:bg-gray-400"
              }`}
            />
          ))}
          <div className="flex-1" />
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Timeline Cards */}
        <div className="overflow-hidden">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="bg-white border-l-4 border-primary p-8 rounded-lg shadow-sm"
          >
            <span className="text-5xl md:text-6xl font-serif font-bold text-primary mb-4 block">
              {historyItems[currentIndex].year}
            </span>
            <p className="font-sans text-lg md:text-xl text-gray-600 leading-relaxed">
              {historyItems[currentIndex].text}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const StrengthsSection = () => {
  return (
    <section className="bg-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif italic text-4xl md:text-5xl lg:text-6xl font-normal text-center mb-16"
        >
          Our strengths
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-12">
          {strengths.map((strength, index) => (
            <motion.div
              key={strength.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <h3 className="font-sans font-bold text-xl md:text-2xl mb-4 text-black">
                {strength.title}
              </h3>
              <p className="font-sans text-lg text-gray-600 leading-relaxed">
                {strength.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="bg-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif italic text-4xl md:text-5xl lg:text-6xl font-normal mb-4"
          >
            Millions of satisfied customers
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 font-sans text-lg md:text-xl mb-8"
          >
            Don't just take our word for it – millions of customers are happy using Pexly.
          </motion.p>

          <div className="flex gap-2 mb-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === activeIndex ? "bg-primary w-8" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full hidden lg:flex">
            Read more reviews
          </Button>
        </div>

        <div>
          {/* Testimonial Card */}
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white border-l-4 border-primary p-10 rounded-lg shadow-sm min-h-[300px] flex flex-col justify-center"
          >
            <div className="mb-6">
              <h3 className="font-sans font-bold text-xl text-black">{testimonials[activeIndex].name}</h3>
              <p className="text-primary text-base font-sans">{testimonials[activeIndex].type}</p>
            </div>
            <p className="text-gray-600 font-sans text-xl leading-relaxed italic">
              "{testimonials[activeIndex].text}"
            </p>
          </motion.div>

          <div className="text-center mt-8 lg:hidden">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full w-full">
              Read more reviews
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const TechnologySection = () => {
  return (
    <section className="bg-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1">
          {/* Creative Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="relative max-w-md mx-auto lg:mx-0"
          >
            <div 
              className="p-8"
              style={{
                backgroundImage: "linear-gradient(to right, rgba(107, 70, 229, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(107, 70, 229, 0.1) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }}
            >
              <img
                src={creativeEyes}
                alt="Creative vision"
                className="w-full object-contain grayscale"
              />
            </div>
          </motion.div>
        </div>

        <div className="order-1 lg:order-2">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-gray-400 font-sans uppercase tracking-widest text-sm mb-4 block"
          >
            TECHNOLOGY
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif italic text-4xl md:text-5xl lg:text-6xl font-normal mb-6"
          >
            Innovation on the go
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mb-6"
          >
            As one of the fastest and most efficient P2P marketplace providers around, we keep 
            adapting to the latest tech advancements in the industry. We constantly improve our 
            security infrastructure with advanced encryption, lightning-powered tech 
            stack, and our custom-built dashboard.
          </motion.p>

          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            href="#"
            className="text-primary font-sans font-medium hover:underline underline-offset-4 transition-all inline-block mb-12"
          >
            Learn more about our tech
          </motion.a>
        </div>
      </div>
    </section>
  );
};

const PeopleSection = () => {
  return (
    <section className="bg-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-gray-400 font-sans uppercase tracking-widest text-sm mb-4 block"
          >
            PEOPLE
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif italic text-4xl md:text-5xl lg:text-6xl font-normal mb-6"
          >
            A passionate team of hustlers
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mb-6"
          >
            We're one of the world's largest P2P cryptocurrency marketplace providers, with 
            over 900 employees in 54 countries. Like our dedication to our clients, we take 
            care of our own so that we can grow professionally and take our customers to 
            the next level. Join Pexly and hustle with us!
          </motion.p>

          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            href="#"
            className="text-primary font-sans font-medium hover:underline underline-offset-4 transition-all inline-block mb-12"
          >
            See career opportunities
          </motion.a>
        </div>

        <div>
          {/* Hands Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="relative max-w-md mx-auto"
          >
            <div 
              className="p-8 relative"
              style={{
                backgroundImage: "linear-gradient(to right, rgba(107, 70, 229, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(107, 70, 229, 0.1) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }}
            >
              <img
                src={handsImage}
                alt="Hands reaching - teamwork"
                className="w-full object-contain grayscale"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const CustomerObsessionSection = () => {
  return (
    <section className="bg-white py-8 md:py-12 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-gray-400 font-sans uppercase tracking-widest text-sm mb-4 block"
          >
            CUSTOMER OBSESSION
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif italic text-4xl md:text-5xl lg:text-6xl font-normal mb-6"
          >
            Before we speak, we listen
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mb-6"
          >
            You, The Customer, hold the highest rank at Pexly. Your feedback is key to improving our marketplace, processes, and overall customer satisfaction. We always seek out our clients' input through surveys, online reviews, and one-on-one interviews.
          </motion.p>

          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            href="#"
            className="text-primary font-sans font-medium hover:underline underline-offset-4 transition-all inline-block mb-12"
          >
            Contact us
          </motion.a>
        </div>

        <div>
          {/* Image with blueprint H pattern background */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-lg h-[400px] md:h-[500px]">
              {/* Blueprint H pattern SVG */}
              <svg
                className="absolute left-0 md:left-8 top-0 w-[200px] md:w-[280px] h-full"
                viewBox="0 0 200 400"
                fill="none"
                preserveAspectRatio="xMidYMid meet"
              >
                <line x1="40" y1="40" x2="40" y2="360" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeOpacity="0.1" />
                <line x1="160" y1="40" x2="160" y2="360" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeOpacity="0.1" />
                <line x1="40" y1="80" x2="160" y2="80" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeOpacity="0.1" />
                <line x1="40" y1="320" x2="160" y2="320" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeOpacity="0.1" />
                <line x1="40" y1="80" x2="160" y2="200" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeOpacity="0.1" />
                <line x1="40" y1="320" x2="160" y2="200" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeOpacity="0.1" />
                <rect x="20" y="60" width="160" height="280" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.05" fill="none" />
              </svg>

              {/* Purple rectangle bar accent */}
              <div className="absolute left-4 md:left-16 top-[40%] w-40 md:w-56 h-6 md:h-8 bg-primary opacity-20 z-10" />

              {/* Person image */}
              <img 
                src={customerImage} 
                alt="Customer listening"
                className="absolute right-0 md:right-0 top-1/2 -translate-y-1/2 z-20 w-[280px] md:w-[400px] lg:w-[450px] grayscale object-contain"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ReviewsSection = () => {
  const reviews = [
    { text: "Pexly truly is a very solid platform", brand: "BITCATCHA" },
    { text: "Best for top-notch security", brand: "PCMAG.COM" },
    { text: "It feels like a premium marketplace", brand: "QUICKSPROUT" },
  ];

  return (
    <section className="bg-white py-8 md:py-12 border-t border-gray-100 overflow-hidden">
      <div className="px-6 md:px-12 lg:px-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8">
          {reviews.map((review, index) => (
            <motion.div
              key={review.brand}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="text-center group flex-1"
            >
              <div className="relative inline-block mb-4">
                <span className="absolute -left-8 top-1/2 -translate-y-1/2 text-primary/20 text-4xl font-serif italic">
                  {"("}
                </span>
                <p className="font-sans font-bold text-lg md:text-xl text-black px-4">
                  "{review.text}"
                </p>
                <span className="absolute -right-8 top-1/2 -translate-y-1/2 text-primary/20 text-4xl font-serif italic">
                  {")"}
                </span>
              </div>
              <div className="flex justify-center mt-2">
                <span className="text-gray-400 font-sans font-black text-xl tracking-tighter opacity-30 group-hover:opacity-50 transition-opacity uppercase">
                  {review.brand}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <AboutSection />
      <GlobalSection />
      <HistorySection />
      <StrengthsSection />
      <TestimonialsSection />
      <TechnologySection />
      <PeopleSection />
      <CustomerObsessionSection />
      <ReviewsSection />
    </div>
  );
}
