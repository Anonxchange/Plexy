import { Users, Globe, DollarSign, ShieldCheck } from "lucide-react";

const stats = [
  { icon: Users, value: "14M+", label: "Active Users" },
  { icon: Globe, value: "140+", label: "Countries" },
  { icon: DollarSign, value: "$120M+", label: "Monthly Volume" },
  { icon: ShieldCheck, value: "99.9%", label: "Success Rate" },
];

export function TrustStats() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Trusted Globally</h2>
          <p className="text-xl text-primary-foreground/90">Join millions of users trading crypto worldwide</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center space-y-4" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center mx-auto border border-primary-foreground/20">
                <stat.icon className="h-8 w-8" />
              </div>
              <div className="text-4xl lg:text-5xl font-bold tracking-tight">{stat.value}</div>
              <div className="text-base font-medium text-primary-foreground/90">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
