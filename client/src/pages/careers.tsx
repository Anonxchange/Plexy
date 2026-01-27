import { Button } from "@/components/ui/button";
import heroIllustration from "@/assets/svg-image-1 19.svg";
import perksIllustration from "@/assets/svg-image-1 13.svg";
import iconRemote from "@/assets/svg-image-1 14.svg";
import iconFlexible from "@/assets/svg-image-1 15.svg";
import iconPto from "@/assets/svg-image-1 16.svg";
import iconInsurance from "@/assets/svg-image-1 17.svg";
import iconGrowth from "@/assets/svg-image-1 18.svg";
import { ArrowRight } from "lucide-react";

const perks = [
  {
    title: "100% remote work",
    description: "Work from anywhere in the world. We believe great talent isn't limited by geography.",
    icon: iconRemote,
  },
  {
    title: "Flexible hours",
    description: "Design your own schedule. We focus on results, not when you clock in or out.",
    icon: iconFlexible,
  },
  {
    title: "Unlimited PTO",
    description: "Take the time you need to recharge. Your well-being matters as much as your work.",
    icon: iconPto,
  },
  {
    title: "Medical insurance",
    description: "Comprehensive health coverage for you and your family, because health comes first.",
    icon: iconInsurance,
  },
  {
    title: "Career growth",
    description: "Clear paths for advancement with mentorship, learning budgets, and growth opportunities.",
    icon: iconGrowth,
  },
  {
    title: "Great culture",
    description: "Join a diverse, inclusive team that celebrates wins together and supports each other.",
    icon: iconFlexible,
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Senior Developer",
    quote: "Joining Pexly.app was the best career decision I've made. The remote-first culture and supportive team have helped me grow both professionally and personally.",
  },
  {
    name: "Marcus Johnson",
    role: "Product Designer",
    quote: "The creative freedom here is unmatched. I'm able to explore new ideas and see them come to life in products that impact millions of users.",
  },
  {
    name: "Elena Rodriguez",
    role: "Engineering Manager",
    quote: "What sets Pexly.app apart is the genuine care for employee well-being. The flexible hours let me be present for my family while doing meaningful work.",
  },
];

const positions = [
  {
    title: "Frontend Developer",
    location: "San Francisco, CA",
    type: "Part time",
  },
  {
    title: "UI/UX and Product Designer",
    location: "London, UK",
    type: "Full time",
  },
  {
    title: "Head of Branding",
    location: "Remote",
    type: "Full time",
  },
  {
    title: "Senior Backend Developer",
    location: "San Francisco, CA",
    type: "Full time",
  },
  {
    title: "Marketing Manager",
    location: "Remote",
    type: "Part time",
  },
];

const Careers = () => {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-start px-6 pt-32 pb-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-4xl">
          Come and join our{" "}
          <span className="text-primary">fast growing team.</span>
        </h1>

        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          At Pexly.app, we're building the future of digital experiences. Join a passionate team of innovators, creators, and problem-solvers who are redefining what's possible in tech.
        </p>

        <div className="flex flex-col w-full max-w-md gap-4">
          <Button size="lg" className="w-full">
            Browse positions
          </Button>
          <Button variant="outline" size="lg" className="w-full">
            Our company story
          </Button>
        </div>
      </section>

      {/* Perks Section */}
      <section className="px-6 py-20">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="w-72 md:w-96 -mt-16 mb-4">
            <img 
              src={perksIllustration} 
              alt="Company perks" 
              className="w-full h-auto"
            />
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Company <span className="text-primary">perks.</span>
          </h2>

          <p className="text-muted-foreground text-lg max-w-xl mb-10">
            We invest in our people. At Pexly.app, you'll find benefits designed to support your life, not just your work.
          </p>

          <div className="flex flex-col w-full max-w-md gap-4">
            <Button size="lg" className="w-full">
              Join our team
            </Button>
            <Button variant="outline" size="lg" className="w-full">
              More about us
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {perks.map((perk, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 mb-6">
                <img 
                  src={perk.icon} 
                  alt={perk.title} 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold mb-3">{perk.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {perk.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-20 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              What our team <span className="text-primary">says.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Don't just take our word for it. Here's what our team members have to say about working at Pexly.app.
            </p>
          </div>

          <div className="grid gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-2xl p-8"
              >
                <p className="text-lg mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <span className="text-primary font-bold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Our culture.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            At Pexly.app, we believe in transparency, creativity, and continuous learning. We're not just building products—we're building a community where everyone can thrive and do their best work.
          </p>
          
          <Button size="lg" className="mb-16">
            Join our team
          </Button>

          <div className="w-full mb-16">
            <img 
              src={heroIllustration}
              alt="Our culture at Pexly" 
              className="w-full h-auto rounded-2xl"
            />
          </div>

          {/* Open Positions */}
          <div className="text-left">
            <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Open <span className="text-primary">positions.</span>
            </h3>
            <div className="divide-y divide-border border-t border-b border-border">
              {positions.map((position, index) => (
                <a
                  key={index}
                  href="#"
                  className="flex items-center justify-between py-8 group hover:bg-muted/30 transition-colors px-4 -mx-4"
                >
                  <div>
                    <h4 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {position.title}
                    </h4>
                    <p className="text-muted-foreground">
                      {position.location} <span className="mx-2">——</span>{" "}
                      <span className="text-primary">{position.type}</span>
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to build the <span className="text-primary">future?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            If you're passionate about technology and want to make a real impact, we want to hear from you. Join us on our mission to redefine digital experiences.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg">
              View all openings
            </Button>
            <Button variant="outline" size="lg">
              Contact recruiting
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Careers;
