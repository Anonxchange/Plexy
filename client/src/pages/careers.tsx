import { Button } from "@/components/ui/button";
import heroIllustration from "@/assets/svg-image-1 13.svg";
import iconRemote from "@/assets/svg-image-1 14.svg";
import iconFlexible from "@/assets/svg-image-1 15.svg";
import iconPto from "@/assets/svg-image-1 16.svg";
import iconInsurance from "@/assets/svg-image-1 17.svg";
import iconGrowth from "@/assets/svg-image-1 18.svg";
import iconTime from "@/assets/svg-image-1 19.svg";
import { ArrowRight } from "lucide-react";

const perks = [
  {
    title: "100% remote work",
    description:
      "Work from anywhere in the world. We believe great talent isn't limited by geography.",
    icon: iconRemote,
  },
  {
    title: "Flexible hours",
    description:
      "Design your own schedule. We focus on results, not when you clock in or out.",
    icon: iconFlexible,
  },
  {
    title: "Unlimited PTO",
    description:
      "Take the time you need to recharge. Your well-being matters as much as your work.",
    icon: iconPto,
  },
  {
    title: "Medical insurance",
    description:
      "Comprehensive health coverage for you and your family, because health comes first.",
    icon: iconInsurance,
  },
  {
    title: "Career growth",
    description:
      "Clear paths for advancement with mentorship, learning budgets, and growth opportunities.",
    icon: iconGrowth,
  },
  {
    title: "Great culture",
    description:
      "Join a diverse, inclusive team that celebrates wins together and supports each other.",
    icon: iconTime,
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    handle: "@sarahchen",
    quote:
      "Joining Pexly was the best career decision I've made. The remote-first culture and supportive team have helped me grow both professionally and personally.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    handle: "@marcusj",
    quote:
      "The creative freedom here is unmatched. I'm able to explore new ideas and see them come to life in products that impact millions of users.",
    avatar: "MJ",
  },
  {
    name: "Elena Rodriguez",
    handle: "@elenar",
    quote:
      "What sets Pexly apart is the genuine care for employee well-being. The flexible hours let me be present for my family while doing meaningful work.",
    avatar: "ER",
  },
  {
    name: "David Park",
    handle: "@davidp",
    quote:
      "I love the technical challenges we solve every day. Building a global p2p platform requires innovative thinking and a great team.",
    avatar: "DP",
  },
];

const positions = [
  {
    title: "Junior Frontend Developer",
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
    title: "Customer Support Agent",
    location: "Remote",
    type: "Part time",
  },
];

const Careers = () => {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 md:px-20 pt-32 pb-20 max-w-7xl mx-auto">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">

          {/* Text */}
          <div className="md:w-1/2 text-left">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Come and join our{" "}
              <span className="text-primary">fast growing team.</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
              At Pexly, we're building the future of peer-to-peer finance. Join a
              passionate team of innovators, creators, and problem-solvers who
              are redefining how the world trades.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-full px-8 py-6 text-lg font-semibold">
                Browse positions
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold"
              >
                Our company story
              </Button>
            </div>
          </div>

          {/* SVG Illustration */}
          <div className="relative md:absolute md:right-[-140px] md:top-1/2 md:-translate-y-[30%] md:w-[600px] mt-6 md:mt-0 w-full max-w-[300px] md:max-w-[600px] mx-auto">
     <img
    src={heroIllustration}
    alt="Hero illustration"
    className="w-full h-auto pointer-events-none select-none"
  />
</div>

        </div>
      </section>

      {/* Perks Section */}
      <section className="px-6 md:px-20 py-24 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Company <span className="text-primary">perks.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We invest in our people. At Pexly, you'll find benefits designed to
              support your life, not just your work.
            </p>
          </div>
          <div className="flex gap-4">
            <Button className="rounded-full px-8 py-4 font-semibold">
              Join our team
            </Button>
            <Button variant="outline" className="rounded-full px-8 py-4 font-semibold">
              More about us
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {perks.map((perk, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-[32px] p-10 flex flex-col items-center text-center hover:border-primary/50 transition-colors"
            >
              <div className="w-24 h-24 mb-8 bg-muted rounded-full flex items-center justify-center p-4">
                <img src={perk.icon} alt={perk.title} className="w-full h-full object-contain" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{perk.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {perk.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 md:px-20 py-24 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-20">
          <div className="md:w-1/3">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
              What <span className="text-primary">our team</span> says about us.
            </h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Don't just take our word for it. Here's what our team members have
              to say about the culture and opportunities at Pexly.
            </p>
            <Button className="rounded-full px-10 py-6 text-lg font-semibold">
              Join our team
            </Button>
          </div>

          <div className="md:w-2/3 grid md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-[32px] p-8 hover:border-primary/50 transition-colors"
              >
                <p className="text-card-foreground/80 text-lg mb-8 leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-primary font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{t.name}</h4>
                    <p className="text-primary text-sm font-medium">{t.handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="px-6 md:px-20 py-24 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-20">
          <div className="md:w-1/3">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
              Open <span className="text-primary">positions.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Ready to make an impact? Explore our current openings and find your
              next challenge in the world of crypto and fintech.
            </p>
            <Button className="rounded-full px-10 py-6 text-lg font-semibold">
              Contact us
            </Button>
          </div>

          <div className="md:w-2/3">
            <div className="bg-card border border-border rounded-[40px] overflow-hidden">
              <div className="divide-y divide-border">
                {positions.map((position, index) => (
                  <a
                    key={index}
                    href="#"
                    className="flex items-center justify-between p-10 group hover:bg-muted/50 transition-all"
                  >
                    <div>
                      <h4 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {position.title}
                      </h4>
                      <p className="text-muted-foreground text-lg flex items-center gap-3">
                        {position.location}
                        <span className="w-10 h-[1px] bg-border"></span>
                        <span className="text-primary">{position.type}</span>
                      </p>
                    </div>
                    <ArrowRight className="w-8 h-8 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
};

export default Careers;
