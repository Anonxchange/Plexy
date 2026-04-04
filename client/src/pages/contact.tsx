import { useHead } from "@unhead/react";
import {
  Menu,
  Search,
  Globe,
  Facebook,
  Twitter,
  Sparkles,
  ChevronDown,
  Paperclip,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useState, useRef } from "react";
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
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";

const services = [
  { id: "account", label: "Account" },
  { id: "verification", label: "Verification" },
  { id: "deposit", label: "Deposit" },
  { id: "withdrawal", label: "Withdrawal" },
  { id: "visa", label: "Visa Card" },
  { id: "wallet", label: "Wallet & Recovery" },
  { id: "other", label: "Other" },
];

const subOptions: Record<string, { id: string; label: string }[]> = {
  account: [
    { id: "login", label: "Login Issues" },
    { id: "2fa", label: "2FA Reset" },
    { id: "profile", label: "Profile Update" },
    { id: "security", label: "Security Concern" },
  ],
  verification: [
    { id: "kyc_level_1", label: "ID Verification (Level 1)" },
    { id: "kyc_level_2", label: "Address Verification (Level 2)" },
    { id: "kyc_pending", label: "Verification Pending Too Long" },
    { id: "kyc_failed", label: "Verification Failed" },
  ],
  deposit: [
    { id: "missing_deposit", label: "Missing Deposit" },
    { id: "fee_query", label: "Fee Question" },
    { id: "history", label: "Transaction History" },
  ],
  withdrawal: [
    { id: "withdrawal_pending", label: "Pending Withdrawal" },
    { id: "fee_query", label: "Fee Question" },
    { id: "history", label: "Transaction History" },
  ],
  visa: [
    { id: "card_order", label: "Card Ordering" },
    { id: "card_activation", label: "Card Activation" },
    { id: "spending_limits", label: "Spending Limits" },
    { id: "card_lost", label: "Lost / Stolen Card" },
  ],
  wallet: [
    { id: "recovery_phrase", label: "Recovery Phrase" },
    { id: "lost_access", label: "Lost Access to Wallet" },
    { id: "import_wallet", label: "Importing a Wallet" },
  ],
  other: [],
};

const subLabels: Record<string, string> = {
  account: "What is your account request about?",
  verification: "What is your verification request about?",
  deposit: "What is your deposit request about?",
  withdrawal: "What is your withdrawal request about?",
  visa: "What is your Visa card request about?",
  wallet: "What is your wallet request about?",
};

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

const ContactPage = () => {
  useHead({
    title: "Contact Us | Pexly",
    meta: [{ name: "description", content: "Reach the Pexly support team for help with your account or any platform questions." }],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [requestType, setRequestType] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSubOptions = subOptions[selectedService] ?? [];

  const validate = () => {
    const next: Record<string, string> = {};
    if (!selectedService) next.service = "Please select a topic.";
    if (currentSubOptions.length > 0 && !requestType) next.requestType = "Please select a request type.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Please enter a valid email.";
    if (!subject.trim()) next.subject = "Subject is required.";
    if (!description.trim()) next.description = "Please describe your issue.";
    else if (description.trim().length < 20) next.description = "Please provide more detail (at least 20 characters).";
    return next;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) return false;
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return false;
      return true;
    });
    setAttachments((prev) => [...prev, ...valid].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const { error } = await supabase.from("support_requests").insert({
        email: email.trim(),
        service: selectedService,
        request_type: requestType || null,
        subject: subject.trim(),
        description: description.trim(),
        has_attachments: attachments.length > 0,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(
        err?.message?.includes("does not exist")
          ? "Our support system is being set up. Please email support@pexly.app directly."
          : "Something went wrong. Please try again or email support@pexly.app."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[380px] overflow-hidden bg-gradient-to-br from-primary to-primary/80">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -left-32 top-1/2 w-[500px] h-[500px] animate-curve-float"
              style={{ background: "#4F46E5", borderRadius: "50%", transform: "translate(-60%, -30%)" }}
            />
            <div
              className="absolute -right-32 top-1/2 w-[500px] h-[500px] animate-curve-float-reverse"
              style={{ background: "#4F46E5", borderRadius: "50%", transform: "translate(60%, -20%)" }}
            />
            <Sparkles className="absolute top-20 left-[15%] w-4 h-4 text-lime animate-sparkle" />
            <Sparkles className="absolute top-32 right-[20%] w-3 h-3 text-lime animate-sparkle-delay-1" />
            <Sparkles className="absolute bottom-24 left-[25%] w-3 h-3 text-lime animate-sparkle-delay-2" />
            <Sparkles className="absolute bottom-32 right-[15%] w-4 h-4 text-lime animate-sparkle" />
          </div>

          <div className="relative z-10 container mx-auto px-4 py-8">
            <nav className="flex items-center justify-between mb-14 pb-4">
              <Link href="/" className="text-foreground font-bold text-2xl tracking-tight hover:opacity-80 transition-opacity">
                Pexly
              </Link>
              <Link href="/support" className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">
                Help Center
              </Link>
            </nav>

            <div className="mb-6 flex items-center gap-2 text-foreground/80 text-sm">
              <Link href="/support" className="hover:text-foreground transition-colors">Help Center</Link>
              <span>/</span>
              <span className="font-medium text-foreground">Submit a request</span>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-8">Submit a request</h1>
              <div className="relative max-w-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search Help Center"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      window.location.href = `/support?q=${encodeURIComponent(searchQuery.trim())}`;
                    }
                  }}
                  className="w-full py-4 pl-14 pr-6 rounded-full bg-white text-gray-900 placeholder:text-muted-foreground focus:outline-none text-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-2xl px-4 py-16">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Request submitted</h2>
              <p className="text-gray-500 mb-2">
                We've received your message and will reply to <strong>{email}</strong> as soon as possible.
              </p>
              <p className="text-gray-400 text-sm mb-8">Typical response time: 24–48 hours</p>
              <Link href="/support" className="text-primary font-medium hover:underline underline-offset-2">
                Back to Help Center
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-7">
              {/* Topic */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 block">
                  What can we help you with? <span className="text-red-500">*</span>
                </label>
                <Select value={selectedService} onValueChange={(val) => { setSelectedService(val); setRequestType(""); setErrors((e) => ({ ...e, service: "", requestType: "" })); }}>
                  <SelectTrigger className={`w-full h-12 text-base rounded-md bg-white text-gray-900 ${errors.service ? "border-red-400" : "border-gray-300"}`}>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.service && <p className="text-xs text-red-500 mt-1">{errors.service}</p>}
              </div>

              {selectedService && (
                <div className="space-y-7 animate-fade-in">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">
                      Your email address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors((err) => ({ ...err, email: "" })); }}
                      className={`h-12 text-gray-900 ${errors.email ? "border-red-400" : "border-gray-300"}`}
                      placeholder="you@example.com"
                      required
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  {/* Request type sub-select */}
                  {currentSubOptions.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 block">
                        {subLabels[selectedService] ?? "What is your request about?"} <span className="text-red-500">*</span>
                      </label>
                      <Select value={requestType} onValueChange={(val) => { setRequestType(val); setErrors((e) => ({ ...e, requestType: "" })); }}>
                        <SelectTrigger className={`w-full h-12 text-base rounded-md bg-white text-gray-900 ${errors.requestType ? "border-red-400" : "border-gray-300"}`}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentSubOptions.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.requestType && <p className="text-xs text-red-500 mt-1">{errors.requestType}</p>}
                    </div>
                  )}

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={subject}
                      onChange={(e) => { setSubject(e.target.value); setErrors((err) => ({ ...err, subject: "" })); }}
                      className={`h-12 text-gray-900 ${errors.subject ? "border-red-400" : "border-gray-300"}`}
                      placeholder="Brief summary of your issue"
                      required
                    />
                    {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); setErrors((err) => ({ ...err, description: "" })); }}
                      className={`min-h-[150px] resize-none text-gray-900 ${errors.description ? "border-red-400" : "border-gray-300"}`}
                      placeholder="Please describe your issue in detail. Include any relevant transaction IDs or screenshots."
                      required
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors.description
                        ? <p className="text-xs text-red-500">{errors.description}</p>
                        : <p className="text-xs text-gray-400">A member of our team will respond as soon as possible.</p>
                      }
                      <span className={`text-xs ${description.length < 20 && description.length > 0 ? "text-red-400" : "text-gray-400"}`}>
                        {description.length} chars
                      </span>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">
                      Attachments <span className="text-gray-400 font-normal">(optional, max 3 files, 5 MB each)</span>
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-gray-50 group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                          <Paperclip className="w-5 h-5" />
                        </div>
                        <span className="text-sm text-gray-500">Click to add files (PNG, JPG, PDF)</span>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={ACCEPTED_TYPES.join(",")}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {attachments.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {attachments.map((f, i) => (
                          <li key={i} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                            <span className="truncate max-w-[80%]">{f.name}</span>
                            <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors ml-2">
                              <X className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Server error */}
                  {submitError && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 px-8 bg-[#002B24] hover:bg-[#002B24]/90 text-white font-semibold rounded-md transition-colors disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Submit request"}
                  </Button>
                </div>
              )}
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-100 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-gray-500 text-sm">© Pexly Technologies, Inc.</p>
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

      <FloatingHelpButton />
    </div>
  );
};

export default ContactPage;
