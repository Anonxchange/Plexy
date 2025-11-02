import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  TrendingUp, 
  Heart, 
  Globe, 
  Zap,
  ArrowRight,
  Briefcase,
  Code,
  DollarSign,
  Target
} from "lucide-react";
import { Link } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";

const jobCategories = ["All Positions", "Engineering", "Product", "Design", "Marketing", "Operations", "Customer Support"];

const jobs = [
  {
    id: 1,
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote / San Francisco",
    type: "Full-time",
    description: "Build beautiful, performant user interfaces for our cryptocurrency platform using React and TypeScript.",
    requirements: ["5+ years React experience", "TypeScript expertise", "Web3 knowledge preferred"]
  },
  {
    id: 2,
    title: "Product Manager - P2P Trading",
    department: "Product",
    location: "Remote / New York",
    type: "Full-time",
    description: "Lead the strategy and execution for our peer-to-peer trading platform, working with cross-functional teams.",
    requirements: ["3+ years PM experience", "Fintech background", "Data-driven mindset"]
  },
  {
    id: 3,
    title: "Senior Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Design intuitive and delightful experiences for our global cryptocurrency marketplace.",
    requirements: ["4+ years product design", "Figma mastery", "Financial products experience"]
  },
  {
    id: 4,
    title: "Marketing Lead",
    department: "Marketing",
    location: "Remote / London",
    type: "Full-time",
    description: "Drive growth and brand awareness for Pexly across global markets.",
    requirements: ["5+ years marketing", "Crypto industry experience", "Growth hacking skills"]
  },
  {
    id: 5,
    title: "Blockchain Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Develop and maintain our blockchain infrastructure and smart contracts.",
    requirements: ["Solidity expertise", "DeFi experience", "Security-first mindset"]
  },
  {
    id: 6,
    title: "Customer Success Manager",
    department: "Customer Support",
    location: "Remote",
    type: "Full-time",
    description: "Ensure our users have exceptional experiences and resolve complex issues.",
    requirements: ["3+ years customer support", "Crypto knowledge", "Multilingual preferred"]
  }
];

const benefits = [
  { icon: DollarSign, title: "Competitive Salary", description: "Top-tier compensation packages with equity" },
  { icon: Globe, title: "Remote First", description: "Work from anywhere in the world" },
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive health, dental, and vision coverage" },
  { icon: TrendingUp, title: "Growth & Learning", description: "$2,000 annual learning budget" },
  { icon: Users, title: "Amazing Team", description: "Work with talented people from 40+ countries" },
  { icon: Zap, title: "Crypto Benefits", description: "Crypto bonuses and early access to features" }
];

const values = [
  { icon: Target, title: "Mission Driven", description: "We're building the future of finance" },
  { icon: Users, title: "Customer First", description: "Every decision starts with our users" },
  { icon: Code, title: "Innovation", description: "We embrace new ideas and technologies" },
  { icon: Globe, title: "Global Impact", description: "Financial freedom for everyone, everywhere" }
];

export default function Careers() {
  const [selectedCategory, setSelectedCategory] = useState("All Positions");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = jobs.filter(job => {
    const matchesCategory = selectedCategory === "All Positions" || job.department === selectedCategory;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24 max-w-6xl">
          <div className="text-center space-y-6">
            <Badge className="mb-4" variant="secondary">
              <Briefcase className="h-3 w-3 mr-1" />
              We're Hiring
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              Join the Future of <span className="text-primary">Crypto Trading</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Help us build the world's most trusted peer-to-peer cryptocurrency marketplace. 
              Work with a talented team making financial freedom accessible to everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-base" asChild>
                <a href="#positions">
                  View Open Positions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <Link to="/about">Learn About Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 lg:py-16 border-b">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-primary">150+</div>
              <div className="text-sm lg:text-base text-muted-foreground mt-2">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-primary">40+</div>
              <div className="text-sm lg:text-base text-muted-foreground mt-2">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-primary">$2B+</div>
              <div className="text-sm lg:text-base text-muted-foreground mt-2">Volume Traded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-primary">5M+</div>
              <div className="text-sm lg:text-base text-muted-foreground mt-2">Users Worldwide</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Join Pexly?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We take care of our team so they can do their best work
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="positions" className="py-12 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Open Positions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find your perfect role and join our mission
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search positions..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {jobCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Job Listings */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No positions found. Try adjusting your search.</p>
                </CardContent>
              </Card>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <h3 className="text-xl font-semibold">{job.title}</h3>
                          <Badge variant="secondary">{job.department}</Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">{job.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{job.type}</span>
                          </div>
                        </div>
                      </div>
                      <Button className="lg:w-auto w-full">
                        Apply Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 lg:p-12 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                Don't see the right role?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                We're always looking for talented people. Send us your resume and tell us how you'd like to contribute.
              </p>
              <Button size="lg" variant="outline">
                Send General Application
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}
