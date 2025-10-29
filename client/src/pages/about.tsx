import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Users, DollarSign, Clock, Globe, Check, Building2, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";

export default function About() {
  const [expandedYears, setExpandedYears] = useState<string[]>(["2025"]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const toggleYear = (year: string) => {
    setExpandedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const heroImages = [
    "/hero-1.jpeg",
    "/hero-2.jpeg",
    "/hero-3.jpeg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const stats = [
    { value: "100K+", label: "Users Worldwide", icon: Users },
    { value: "$5M+", label: "Daily Trading Volume (USD)", icon: DollarSign },
    { value: "24/7", label: "Customer Support", icon: Clock },
    { value: "150+", label: "Countries", icon: Globe },
  ];

  const timeline = [
    {
      year: "2025",
      title: "Growing. Innovating. Leading.",
      milestones: [
        "Launched Pexly Pay for instant crypto payments",
        "Expanded P2P trading to 150+ countries",
        "Reached 100,000+ active users globally",
        "Introduced advanced trading features and analytics"
      ]
    },
    {
      year: "2024",
      title: "Building the Foundation",
      milestones: [
        "Platform beta launch with core trading features",
        "Established partnerships with major crypto exchanges",
        "Implemented multi-layer security protocols",
        "Introduced mobile app for iOS and Android"
      ]
    },
    {
      year: "2023",
      title: "The Beginning",
      milestones: [
        "Pexly founded with a vision to democratize crypto trading",
        "Secured initial funding and regulatory compliance",
        "Built core development team",
        "Started development of the trading platform"
      ]
    }
  ];

  const regulators = [
    "Financial Conduct Authority (FCA)",
    "Securities and Exchange Commission (SEC)",
    "Monetary Authority of Singapore (MAS)"
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="px-4 py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <p className="text-lg text-muted-foreground">Welcome to Pexly</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              #TheCryptoGateway to Financial Freedom
            </h1>
            <Link href="/signup">
              <Button size="lg" className="mt-4 px-8 py-6 text-lg">
                Join Us
              </Button>
            </Link>
          </div>
        </section>

        {/* Hero Image Carousel */}
        <section className="w-full">
          <div className="relative h-[300px] md:h-[400px] overflow-hidden">
            {heroImages.map((image, index) => {
              return (
                <div
                  key={index}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                    currentImageIndex === index ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ backgroundImage: `url(${image})` }}
                />
              );
            })}
            
            {/* Indicator Dots */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentImageIndex === index
                      ? "bg-white w-8"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* At a Glance */}
        <section className="px-4 py-16 bg-card/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12">At a Glance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Icon className="h-8 w-8 text-primary" />
                      <h3 className="text-4xl md:text-5xl font-bold">{stat.value}</h3>
                    </div>
                    <p className="text-lg text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Our Vision */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-muted-foreground">Our Vision</h2>
            <h3 className="text-3xl md:text-5xl font-bold leading-tight mb-8">
              Unleashing the full potential of crypto with next generation tools, support, and opportunities
            </h3>
            <Button size="lg" variant="default">
              Learn More
            </Button>
          </div>
        </section>

        {/* Our Story - Timeline */}
        <section className="px-4 py-16 bg-card/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12">Our Story</h2>
            <div className="space-y-4">
              {timeline.map((item) => (
                <div key={item.year} className="border-b border-border">
                  <button
                    onClick={() => toggleYear(item.year)}
                    className="w-full py-6 flex items-center justify-between hover:bg-accent/50 transition-colors rounded-lg px-4"
                  >
                    <div className="text-left">
                      <h3 className="text-4xl md:text-5xl font-bold mb-2">{item.year}</h3>
                      {expandedYears.includes(item.year) && (
                        <p className="text-lg text-muted-foreground">{item.title}</p>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-8 w-8 text-primary transition-transform ${
                        expandedYears.includes(item.year) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedYears.includes(item.year) && (
                    <div className="px-4 pb-8 space-y-4">
                      {item.milestones.map((milestone, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                          <p className="text-base">{milestone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Regulators */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Our Regulators</h2>
            <div className="space-y-4">
              {regulators.map((regulator, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <Check className="h-6 w-6 text-primary flex-shrink-0" />
                  <p className="text-lg">{regulator}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Partners */}
        <section className="px-4 py-16 bg-card/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">Our Partners</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {[
                "Blockchain Alliance",
                "CryptoSecure",
                "Digital Assets Group",
                "FinTech Innovations",
                "Global Exchange Network",
                "Quantum Ledger"
              ].map((partner, i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg bg-background border border-border flex items-center justify-center hover:border-primary transition-colors px-4"
                >
                  <p className="text-foreground/70 font-semibold text-base">{partner}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Sponsorships - Professional Layout */}
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Sponsorships</h2>
            
            {/* Scrolling Partners */}
            <div className="relative overflow-hidden bg-muted/30 rounded-xl p-8 mb-8">
              <div className="flex gap-12 animate-scroll">
                {[
                  "BMW Motorsport",
                  "Emirates Airlines", 
                  "Mastercard",
                  "Adobe Creative Cloud",
                  "Spotify Premium",
                  "Microsoft Azure",
                  "Coinbase",
                  "Binance",
                  "PayPal",
                  "Stripe",
                  "Amazon Web Services",
                  "Google Cloud",
                  "Samsung Electronics",
                  "Sony Interactive",
                  "Dell Technologies",
                  "Visa",
                  "American Express",
                  "Netflix",
                  "Apple",
                  "Tesla",
                  "Oracle",
                  "IBM",
                  "Intel",
                  "NVIDIA",
                  "Adobe",
                  "Salesforce"
                ].map((sponsor, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 h-20 px-10 flex items-center justify-center text-xl font-semibold text-foreground/70 whitespace-nowrap hover:text-foreground transition-colors"
                  >
                    {sponsor}
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {[
                  "BMW Motorsport",
                  "Emirates Airlines", 
                  "Mastercard",
                  "Adobe Creative Cloud",
                  "Spotify Premium",
                  "Microsoft Azure",
                  "Coinbase",
                  "Binance",
                  "PayPal",
                  "Stripe",
                  "Amazon Web Services",
                  "Google Cloud",
                  "Samsung Electronics",
                  "Sony Interactive",
                  "Dell Technologies",
                  "Visa",
                  "American Express",
                  "Netflix",
                  "Apple",
                  "Tesla",
                  "Oracle",
                  "IBM",
                  "Intel",
                  "NVIDIA",
                  "Adobe",
                  "Salesforce"
                ].map((sponsor, i) => (
                  <div
                    key={`dup-${i}`}
                    className="flex-shrink-0 h-20 px-10 flex items-center justify-center text-xl font-semibold text-foreground/70 whitespace-nowrap hover:text-foreground transition-colors"
                  >
                    {sponsor}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-muted-foreground">
              Trusted by leading companies worldwide
            </p>
          </div>
        </section>

        {/* Come Work With Us */}
        <section className="px-4 py-16 bg-background">
          <div className="max-w-4xl mx-auto">
            {/* Office Images Grid */}
            <div className="grid grid-cols-2 gap-4 mb-12">
              {[
                "/office-1.jpeg",
                "/office-2.jpeg", 
                "/office-3.jpeg",
                "/office-4.jpeg"
              ].map((img, i) => (
                <div
                  key={i}
                  className="h-48 md:h-64 bg-cover bg-center"
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))}
            </div>
            
            {/* Text Content */}
            <div className="text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Come Work With Us</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our core values define who we are. We listen, care, and improve to create a faster, fairer, and more humane trading environment for our users.
              </p>
              <Button size="lg" className="mt-6">
                Search Jobs
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">Join Pexly</h2>
            <p className="text-lg text-muted-foreground">
              Embark on your crypto journey today.
            </p>
            <Link href="/signup">
              <Button size="lg" className="mt-4 px-8 py-6 text-lg">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Footer is hidden on About page */}
    </div>
  );
}
