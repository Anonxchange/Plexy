import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Asset paths from public folder
const floatingMan = "/assets/IMG_1541.png";
const floatingWoman = "/assets/IMG_1764.png";
const rocketImage = "/assets/IMG_2941.webp";
const creativeEyes = "/assets/IMG_3127.webp";
const handsImage = "/assets/IMG_2939.webp";

const testimonials = [
  {
    name: "Podaz Store",
    type: "Online shop",
    text: "I was recently in contact with Hostinger's Customer Success team. The service was one of the best I have experienced – their agents were informative and helpful. Even with a small amount of information, they managed to detect the problem and solve it quickly.",
  },
  {
    name: "TechStartup Inc",
    type: "Technology",
    text: "Hostinger's hosting speed is incredible. Our website loads in under a second, which has significantly improved our conversion rates. The 24/7 support team is always responsive and knowledgeable.",
  },
  {
    name: "Creative Studio",
    type: "Design Agency",
    text: "The Website Builder made it so easy to create our portfolio. We had a professional-looking site up and running in just a few hours. Highly recommend for anyone starting their online journey.",
  },
];

const historyItems = [
  { year: "2004", text: "Hostinger was founded in Kaunas, Lithuania with a mission to make web hosting accessible." },
  { year: "2008", text: "We launched the first-class cPanel web hosting brand Hosting24.com." },
  { year: "2011", text: "Hostinger brand was officially launched with free hosting services." },
  { year: "2014", text: "We reached our first million users worldwide and expanded globally." },
  { year: "2017", text: "Hostinger introduced the innovative hPanel control panel." },
  { year: "2019", text: "We launched the AI-powered Website Builder for easy site creation." },
  { year: "2021", text: "Reached 4 million customers and expanded to 150+ countries." },
  { year: "2023", text: "Introduced advanced AI features and continued global expansion." },
];

const strengths = [
  {
    title: "Seamless management tools",
    description:
      "Regardless of your background or technical expertise, our site-building and management tools have been created with user experience and power in mind. Control everything in one place with hPanel, from domains and web hosting to email accounts and more. Have more time for what matters with our AI-powered drag-and-drop Hostinger Website Builder – create and publish a website within minutes, without limits.",
  },
  {
    title: "Website speed",
    description:
      "We want website creators and business owners to move forward, and fast. Imagine having your site load in milliseconds anywhere in the world with our globally distributed servers and 99.9% uptime guarantee. Give your audience the best user experience, and watch as your site rankings improve.",
  },
  {
    title: "Dedicated 24/7 support",
    description:
      "We are here for every committed online hustler who aims to rock the web. Our Customer Success team speaks 8+ languages, so you can confidently communicate your thoughts and concerns in your own language. Spend less time worrying about technical issues – we promise to get back to you quickly with helpful solutions.",
  },
];

const HeroSection = () => {
  return (
    <section className="bg-white text-black min-h-[80vh] relative overflow-hidden">
      <div className="px-6 md:px-12 lg:px-20 py-16 md:py-24">
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
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[60%] h-full pointer-events-none">
          {/* Purple Circle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute left-1/4 top-1/2 -translate-y-1/2 w-48 md:w-64 lg:w-80 aspect-square"
          >
            <div className="w-full h-full rounded-full border-[12px] md:border-[16px] border-[#6b46e5]" />
          </motion.div>

          {/* Light Purple Circle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="absolute right-10 top-1/4 w-20 md:w-32 aspect-square rounded-full bg-[#6b46e5]/20"
          />

          {/* Small Purple Dot */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="absolute left-1/3 bottom-1/4 w-3 aspect-square rounded-full bg-[#6b46e5]"
          />

          {/* Floating Man */}
          <motion.img
            src={floatingMan}
            alt="Professional floating"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute left-0 bottom-10 w-40 md:w-56 lg:w-72 object-contain animate-float grayscale"
            style={{ filter: "grayscale(100%)" }}
          />

          {/* Floating Woman */}
          <motion.img
            src={floatingWoman}
            alt="Professional floating"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute right-10 top-1/4 w-32 md:w-44 lg:w-56 object-contain animate-float-delayed grayscale"
            style={{ filter: "grayscale(100%)" }}
          />
        </div>

        {/* Dots Navigation Indicator */}
        <div className="absolute bottom-8 right-8 flex gap-1.5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i === 0 ? "bg-[#6b46e5]" : "bg-gray-200"}`}
            />
          ))}
        </div>

        {/* Plus Icon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute left-6 bottom-1/3 text-gray-400 text-2xl font-light"
        >
          +
        </motion.div>
      </div>
    </section>
  );
};

const AboutSection = () => {
  return (
    <section className="bg-[#6b46e5] text-white relative overflow-hidden">
      <div className="px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-serif italic text-4xl md:text-5xl lg:text-6xl font-normal text-center mb-12 md:mb-16"
        >
          About us
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl"
        >
          <h3 className="font-sans font-bold text-2xl md:text-3xl mb-6">
            Find your online success with Hostinger
          </h3>
          <p className="font-sans text-lg md:text-xl leading-relaxed opacity-90">
            Hostinger is on a mission to make online presence accessible to everyone worldwide – 
            from developers to aspiring bloggers and business owners. With our fast hosting 
            technology, AI-powered Website Builder, and easy-to-operate hPanel you can succeed 
            online faster and easier.
          </p>
        </motion.div>

        {/* Blueprint Lines Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{
            backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* Decorative Figure */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute right-0 bottom-0 w-40 md:w-56"
        >
          <img
            src={floatingMan}
            alt="Person walking"
            className="w-full object-contain grayscale brightness-200"
          />
        </motion.div>
      </div>
    </section>
  );
};

const GlobalSection = () => {
  return (
    <section className="bg-[#6b46e5] text-white relative overflow-hidden border-t border-white/10">
      <div className="px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <h2 className="font-sans font-bold text-2xl md:text-3xl mb-6">
            Globally recognized web host
          </h2>
          
          <p className="font-sans text-lg md:text-xl leading-relaxed opacity-90 mb-6">
            Launched in 2004 as a Lithuania-based tech startup, Hostinger is now a leading 
            provider of web hosting solutions, and we serve over 4 million people from 150+ countries
          </p>
          
          <p className="font-sans text-lg md:text-xl leading-relaxed opacity-90 mb-6">
            Staying true to our reputation, and listed among the FT 1000 ranking of Europe's 
            fastest-growing companies for the sixth year in a row, we'll continue improving 
            our services, unlocking new markets, and being part of even more success stories.
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
            className="relative w-64 md:w-80 p-8"
            style={{
              backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
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
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
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
    <section className="bg-white py-16 md:py-24">
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
            className="bg-white border-l-4 border-[#6b46e5] p-8 rounded-lg shadow-sm"
          >
            <span className="text-5xl md:text-6xl font-serif font-bold text-[#6b46e5] mb-4 block">
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
    <section className="bg-white py-16 md:py-24">
      <div className="px-6 md:px-12 lg:px-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif italic text-4xl md:text-5xl lg:text-6xl font-normal text-center mb-16"
        >
          Our strengths
        </motion.h2>

        <div className="space-y-12">
          {strengths.map((strength, index) => (
            <motion.div
              key={strength.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h3 className="font-sans font-bold text-xl md:text-2xl mb-4 text-black">
                {strength.title}
              </h3>
              <p className="font-sans text-lg md:text-xl text-gray-600 leading-relaxed">
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
    <section className="bg-white py-16 md:py-24">
      <div className="px-6 md:px-12 lg:px-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif italic text-4xl md:text-5xl lg:text-6xl font-normal text-center mb-4"
        >
          Millions of satisfied customers
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center text-gray-500 font-sans text-lg md:text-xl mb-12"
        >
          Don't just take our word for it – millions of customers are happy using Hostinger.
        </motion.p>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === activeIndex ? "bg-[#6b46e5]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Testimonial Card */}
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto bg-white border-l-4 border-[#6b46e5] p-8 rounded-lg shadow-sm"
        >
          <div className="mb-4">
            <h3 className="font-sans font-bold text-lg text-black">{testimonials[activeIndex].name}</h3>
            <p className="text-[#6b46e5] text-sm font-sans">{testimonials[activeIndex].type}</p>
          </div>
          <p className="text-gray-600 font-sans text-lg leading-relaxed">
            {testimonials[activeIndex].text}
          </p>
        </motion.div>

        <div className="text-center mt-12">
          <Button className="bg-[#6b46e5] hover:bg-[#5a3bc4] text-white px-8 py-6 text-lg rounded-full">
            Read more reviews
          </Button>
        </div>
      </div>
    </section>
  );
};

const TechnologySection = () => {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="px-6 md:px-12 lg:px-20">
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
          As one of the fastest and most efficient web hosting service providers around, we keep 
          adapting to the latest tech advancements in the industry. We constantly improve our 
          servers' infrastructure with advanced anti-DDoS solutions, LiteSpeed-powered tech 
          stack, and our custom-built control panel – hPanel.
        </motion.p>

        <motion.a
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          href="#"
          className="text-[#6b46e5] font-sans font-medium hover:underline underline-offset-4 transition-all inline-block mb-12"
        >
          Learn more about our tech
        </motion.a>

        {/* Creative Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="relative max-w-md mx-auto"
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
    </section>
  );
};

const CustomerObsessionSection = () => {
  return (
    <section className="bg-white py-16 md:py-24 border-t border-gray-100">
      <div className="px-6 md:px-12 lg:px-20">
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
          Your success is our success
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="font-sans text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mb-6"
        >
          At Hostinger, we put customers at the center of everything we do. From intuitive 
          tools to responsive support, every decision is made with your success in mind. 
          We're not just a hosting provider – we're your partner in building an impactful 
          online presence.
        </motion.p>

        <motion.a
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          href="#"
          className="text-[#6b46e5] font-sans font-medium hover:underline underline-offset-4 transition-all inline-block"
        >
          Read our customer stories
        </motion.a>
      </div>
    </section>
  );
};

const PeopleSection = () => {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="px-6 md:px-12 lg:px-20">
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
          We're one of the world's largest hosting and AI website builder providers, with 
          over 900 employees in 54 countries. Like our dedication to our clients, we take 
          care of our own so that we can grow professionally and take our customers to 
          the next level. Join Hostinger and hustle with us!
        </motion.p>

        <motion.a
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          href="#"
          className="text-[#6b46e5] font-sans font-medium hover:underline underline-offset-4 transition-all inline-block mb-12"
        >
          See career opportunities
        </motion.a>

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
            {/* Purple accent shapes */}
            <div className="absolute top-1/2 left-1/3 w-8 h-16 bg-[#6b46e5] transform -rotate-45 opacity-20" />
            <div className="absolute bottom-1/3 left-1/2 w-4 h-12 bg-[#6b46e5] transform rotate-12 opacity-20" />
          </div>
        </motion.div>
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
      <CustomerObsessionSection />
      <PeopleSection />
    </div>
  );
}
