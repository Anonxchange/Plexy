
import { useHead } from "@unhead/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  Code2,
  Zap,
  Shield,
  Globe,
  Webhook,
  Key,
  ArrowRight,
  CheckCircle2,
  Terminal,
  BookOpen,
  GitBranch,
  Lock,
} from '@/lib/icons';
import { useToast } from "@/hooks/use-toast";

const FEATURES = [
  {
    icon: Key,
    title: "REST API",
    description: "Full programmatic access to trades, wallets, orders, and user data via a clean RESTful interface.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Real-time event notifications delivered to your endpoint — trades, deposits, withdrawals, and more.",
  },
  {
    icon: Shield,
    title: "OAuth 2.0",
    description: "Industry-standard authentication so your integrations stay secure and your users stay in control.",
  },
  {
    icon: Globe,
    title: "SDKs",
    description: "Official libraries for JavaScript, Python, and Go so you can ship integrations faster.",
  },
  {
    icon: Terminal,
    title: "Sandbox Environment",
    description: "A full-featured test environment with mock balances so you can build and debug without risk.",
  },
  {
    icon: GitBranch,
    title: "Versioned Endpoints",
    description: "Stable, versioned API contracts. We never break your integration without advance notice.",
  },
];

const COMING_SOON_ITEMS = [
  "API key management with granular permissions",
  "Webhook delivery logs and retry controls",
  "Interactive API explorer in-browser",
  "OAuth app registration portal",
  "Rate limit dashboards and quota management",
  "TypeScript SDK with full type coverage",
];

const CODE_SNIPPET = `// Fetch wallet balance
const response = await fetch("https://api.pexly.com/v1/wallet/balance", {
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
});

const { balances } = await response.json();
// { BTC: "0.05821", ETH: "1.234", USDT: "420.00" }`;

export function Developer() {
  useHead({
    title: "Developer API | Pexly",
    meta: [{ name: "description", content: "Build on Pexly. Access our REST API, webhooks, and SDKs to integrate crypto trading into your application." }],
  });

  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    toast({
      title: "You're on the list",
      description: "We'll notify you the moment developer access opens.",
    });
    setEmail("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="relative container mx-auto px-4 py-20 lg:py-28 max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <Zap className="h-3.5 w-3.5 mr-1.5 inline" />
              Coming Soon
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Build on{" "}
              <span className="text-primary">Pexly</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              A developer-first API for crypto trading, P2P, and wallet infrastructure.
              Get early access and be the first to build on our platform.
            </p>

            {!submitted ? (
              <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-11 text-base"
                />
                <Button type="submit" size="lg" className="whitespace-nowrap">
                  Notify me
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 text-primary font-medium text-lg">
                <CheckCircle2 className="h-5 w-5" />
                You're on the early access list
              </div>
            )}
          </div>
        </section>

        {/* Code Preview */}
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="rounded-xl border border-border bg-muted/40 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/60">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">pexly-api-example.ts</span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm font-mono text-foreground/80 leading-relaxed">
              <code>{CODE_SNIPPET}</code>
            </pre>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 pb-16 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything you need to build</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete developer toolkit — from authentication to real-time data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What's coming checklist */}
        <section className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4 py-16 max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Developer portal preview</h2>
              <p className="text-muted-foreground">
                Here's what you'll have access to when the portal launches.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMING_SOON_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-3 bg-card border border-border rounded-lg px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-10">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-5">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to build?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join the waitlist for early API access. No spam — just a single email when we're ready.
            </p>
            {!submitted ? (
              <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-11"
                />
                <Button type="submit" className="whitespace-nowrap">
                  Get early access
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 text-primary font-medium">
                <CheckCircle2 className="h-5 w-5" />
                You're on the list — we'll be in touch
              </div>
            )}
          </div>
        </section>

      </main>

      <PexlyFooter />
    </div>
  );
}
