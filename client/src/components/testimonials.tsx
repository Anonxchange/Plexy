import { Star, BadgeCheck } from "lucide-react";

const row1 = [
  {
    name: "Sarah Johnson",
    rating: 5,
    content: "Spot trading on Pexly is so clean and fast. I've grown my portfolio significantly just using their trading interface. Best platform I've used.",
  },
  {
    name: "Michael Chen",
    rating: 5,
    content: "The perpetual trading features are top-notch. Tight spreads, fast execution, and a great mobile experience. Pexly is my daily trading platform.",
  },
  {
    name: "Maria Rodriguez",
    rating: 5,
    content: "I love that Pexly is non-custodial. I keep full control of my private keys while still getting a full-featured trading experience. Truly refreshing.",
  },
  {
    name: "Ahmed Hassan",
    rating: 5,
    content: "Using Pexly to pay utility bills with crypto is a game changer. I top up my mobile and pay bills directly — no bank needed. Absolutely brilliant.",
  },
  {
    name: "James Wilson",
    rating: 5,
    content: "The wallet is seamless. Sending and receiving crypto is instant, and the blockchain explorer built right in makes everything transparent.",
  },
];

const row2 = [
  {
    name: "Olivia Martinez",
    rating: 5,
    content: "I use Pexly for spot trading every day. The interface is clean, execution is fast, and I always feel in control of my trades.",
  },
  {
    name: "David Kim",
    rating: 5,
    content: "I've tried many crypto platforms but Pexly stands out. The perpetual trading tools are professional-grade without being overwhelming.",
  },
  {
    name: "Amara Osei",
    rating: 5,
    content: "Buying gift cards with crypto on Pexly is so convenient. I shop with my crypto earnings and the process takes seconds. Highly recommend.",
  },
  {
    name: "Lena Fischer",
    rating: 5,
    content: "Pexly is the first crypto platform I actually found easy. Spot trading, staking, gift cards — everything is in one place. Full control. Love it!",
  },
  {
    name: "Carlos Mendez",
    rating: 5,
    content: "The perpetual futures on Pexly give me the leverage and precision I need. Fast fills, competitive fees, and a rock-solid platform. Absolutely recommend.",
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
      ))}
    </div>
  );
}

function TestimonialCard({ name, rating, content }: { name: string; rating: number; content: string }) {
  return (
    <div className="flex-shrink-0 w-72 bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 mx-3">
      <div className="flex items-center justify-between">
        <StarRating count={rating} />
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border rounded-full px-2 py-0.5">
          <BadgeCheck className="h-3.5 w-3.5 text-black dark:text-white" />
          Verified Review
        </span>
      </div>
      <p className="text-sm text-foreground leading-relaxed flex-1">{content}</p>
      <p className="text-sm font-semibold text-foreground">{name}</p>
    </div>
  );
}

export function Testimonials() {
  const doubled1 = [...row1, ...row1];
  const doubled2 = [...row2, ...row2];

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="h-5 w-5" style={{ fill: "#00B67A", color: "#00B67A" }} />
            ))}
          </div>
          <span className="font-semibold text-foreground">TrustScore</span>
          <span className="text-muted-foreground text-sm">(107K Reviews)</span>
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
          See what our users say
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          With over 100,000 reviews, Pexly is one of the most reviewed and highest-scoring crypto platforms in the world.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex overflow-hidden">
          <div className="flex animate-marquee-left">
            {doubled1.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>

        <div className="flex overflow-hidden">
          <div className="flex animate-marquee-right">
            {doubled2.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
