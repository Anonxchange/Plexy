import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lightbulb, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PexlyFooter } from "@/components/pexly-footer";

export default function SubmitIdea() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the email content
      const emailBody = `
New Idea Submission from Pexly

Name: ${formData.name}
Email: ${formData.email}
Title: ${formData.title}

Description:
${formData.description}

---
Submitted from Pexly Ideas Portal
      `.trim();

      // For now, we'll use mailto as a fallback
      // In production, this should call a backend endpoint that sends emails
      const mailtoLink = `mailto:support@pexly.app?subject=${encodeURIComponent(`New Idea: ${formData.title}`)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open mailto link
      window.location.href = mailtoLink;

      // Show success message
      toast({
        title: "Idea Submitted!",
        description: "Thank you for your submission. We'll review your idea and get back to you soon.",
      });

      setIsSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({ name: "", email: "", title: "", description: "" });
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
              <Lightbulb className="w-10 h-10 text-lime-600" />
            </div>
            <h1 className="text-4xl font-bold">Submit Your Idea</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a feature request or suggestion for Pexly? We'd love to hear from you!
              Share your ideas and help us improve the platform.
            </p>
          </div>

          {/* Form Card */}
          <Card className="rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle>Tell us your idea</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you at support@pexly.app
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                  <h3 className="text-2xl font-semibold">Thank You!</h3>
                  <p className="text-muted-foreground text-center">
                    Your idea has been submitted successfully.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Idea Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Brief title for your idea"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe your idea in detail. What problem does it solve? How would it improve Pexly?"
                      value={formData.description}
                      onChange={handleChange}
                      rows={8}
                      required
                      className="resize-none"
                    />
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Your submission will be sent to our support team at{" "}
                      <span className="text-primary font-medium">support@pexly.app</span>.
                      We review all ideas and will respond within 48 hours.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Idea
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center mb-12">
            <p className="text-sm text-muted-foreground">
              For urgent support inquiries, please visit our{" "}
              <a href="/support" className="text-primary hover:underline">
                support page
              </a>
              .
            </p>
          </div>
        </div>
      </div>
      
      <PexlyFooter />
    </>
  );
}
