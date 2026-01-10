import { 
  Menu, 
  Search, 
  Globe, 
  Facebook, 
  Twitter, 
  Sparkles,
  ChevronDown,
  Paperclip
} from "lucide-react";
import { useState } from "react";
import { FloatingHelpButton } from "../components/floating-help-button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const ContactPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [requestType, setRequestType] = useState("");

  const services = [
    { id: "account", label: "Account" },
    { id: "verification", label: "Verification" },
    { id: "deposit", label: "Deposit" },
    { id: "withdrawal", label: "Withdrawal" },
    { id: "p2p", label: "P2P Trading" },
    { id: "visa", label: "Visa Card" },
    { id: "other", label: "Other" },
  ];

  const accountRequestTypes = [
    { id: "login", label: "Login Issues" },
    { id: "2fa", label: "2FA Reset" },
    { id: "profile", label: "Profile Update" },
    { id: "security", label: "Security Concern" },
  ];

  const verificationRequestTypes = [
    { id: "kyc_level_1", label: "ID Verification (Level 1)" },
    { id: "kyc_level_2", label: "Address Verification (Level 2)" },
    { id: "kyc_pending", label: "Verification Pending Too Long" },
    { id: "kyc_failed", label: "Verification Failed" },
  ];

  const transactionRequestTypes = [
    { id: "deposit_missing", label: "Missing Deposit" },
    { id: "withdrawal_pending", label: "Pending Withdrawal" },
    { id: "fee_query", label: "Fee Question" },
    { id: "history", label: "Transaction History" },
  ];

  const p2pRequestTypes = [
    { id: "dispute", label: "Trade Dispute" },
    { id: "scam_report", label: "Report a User" },
    { id: "offer_issue", label: "Issue Creating Offer" },
    { id: "payment_proof", label: "Payment Proof Issues" },
  ];

  const visaRequestTypes = [
    { id: "card_order", label: "Card Ordering" },
    { id: "card_activation", label: "Card Activation" },
    { id: "spending_limits", label: "Spending Limits" },
    { id: "card_lost", label: "Lost/Stolen Card" },
  ];

  const getSubOptions = () => {
    switch (selectedService) {
      case "account": return accountRequestTypes;
      case "verification": return verificationRequestTypes;
      case "deposit":
      case "withdrawal": return transactionRequestTypes;
      case "p2p": return p2pRequestTypes;
      case "visa": return visaRequestTypes;
      default: return [];
    }
  };

  const getSubLabel = () => {
    switch (selectedService) {
      case "account": return "What is your account request about?";
      case "verification": return "What is your verification request about?";
      case "deposit":
      case "withdrawal": return "What is your transaction request about?";
      case "p2p": return "What is your P2P request about?";
      case "visa": return "What is your Visa card request about?";
      default: return "What is your request about?";
    }
  };

  const HeroSection = () => {
    return (
      <section className="relative min-h-[400px] overflow-hidden bg-gradient-to-br from-primary to-primary/80">
        {/* Decorative curves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Left curve */}
          <div 
            className="absolute -left-32 top-1/2 w-[500px] h-[500px] animate-curve-float"
            style={{
              background: "#4F46E5",
              borderRadius: "50%",
              transform: "translate(-60%, -30%)",
            }}
          />
          {/* Right curve */}
          <div 
            className="absolute -right-32 top-1/2 w-[500px] h-[500px] animate-curve-float-reverse"
            style={{
              background: "#4F46E5",
              borderRadius: "50%",
              transform: "translate(60%, -20%)",
            }}
          />
          
          {/* Decorative sparkles */}
          <Sparkles className="absolute top-20 left-[15%] w-4 h-4 text-lime animate-sparkle" />
          <Sparkles className="absolute top-32 right-[20%] w-3 h-3 text-lime animate-sparkle-delay-1" />
          <Sparkles className="absolute bottom-24 left-[25%] w-3 h-3 text-lime animate-sparkle-delay-2" />
          <Sparkles className="absolute bottom-32 right-[15%] w-4 h-4 text-lime animate-sparkle" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-14 pb-4">
            <a href="/" className="text-foreground font-bold text-2xl tracking-tight hover:opacity-80 transition-opacity">
              Pexly<span style={{ color: "#4F46E5" }}>P2P</span>
            </a>
            <button className="text-foreground">
              <Menu className="w-6 h-6" />
            </button>
          </nav>

          {/* Breadcrumbs */}
          <div className="mb-8 flex items-center gap-2 text-foreground/80 text-sm">
            <span>Frequently asked questions</span>
            <span>/</span>
            <span className="font-medium">Submit a request</span>
          </div>

          {/* Hero content */}
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-8">
              Submit a request
            </h1>
            
            {/* Search bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 pl-14 pr-6 rounded-full bg-white text-gray-900 placeholder:text-muted-foreground focus:outline-none text-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">
        <HeroSection />

        <div className="container mx-auto max-w-2xl px-4 py-16">
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                What can we help you with?
              </label>
              <Select value={selectedService} onValueChange={(val) => {
                setSelectedService(val);
                setRequestType("");
              }}>
                <SelectTrigger className="w-full h-12 text-base border-gray-300 rounded-md bg-white text-gray-900">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedService && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    Your email address <span className="text-red-500">*</span>
                  </label>
                  <Input type="email" className="h-12 border-gray-300 text-gray-900" required />
                </div>

                {getSubOptions().length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">
                      {getSubLabel()} <span className="text-red-500">*</span>
                    </label>
                    <Select value={requestType} onValueChange={setRequestType}>
                      <SelectTrigger className="w-full h-12 text-base border-gray-300 rounded-md bg-white text-gray-900">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubOptions().map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <Input className="h-12 border-gray-300 text-gray-900" required />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea className="min-h-[150px] border-gray-300 resize-none text-gray-900" required />
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    Please enter the details of your request. A member of our support staff will respond as soon as possible.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    Attachments (optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-gray-50 group">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <span className="text-sm text-gray-500">
                        Add file or drop files here
                      </span>
                    </div>
                  </div>
                </div>

                <Button className="w-32 h-12 bg-[#002B24] hover:bg-[#002B24]/90 text-white font-semibold rounded-md transition-colors">
                  Submit
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-100 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-gray-500 text-sm">Frequently asked questions</p>
            
            <div className="flex flex-wrap items-center justify-center gap-8">
              <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm">
                <Globe className="w-5 h-5" />
                <span>English (US)</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-6">
                <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Help Button */}
      <FloatingHelpButton />
    </div>
  );
};

export default ContactPage;
