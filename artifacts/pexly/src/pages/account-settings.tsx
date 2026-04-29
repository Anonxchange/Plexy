import { useHead } from "@unhead/react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { LocalizationSection } from "@/components/settings/LocalizationSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { ConnectedAppsSection } from "@/components/settings/ConnectedAppsSection";
import { VerificationSection } from "@/components/settings/VerificationSection";
import { ShopHistorySection } from "@/components/settings/ShopHistorySection";

export default function AccountSettings() {
  useHead({
    title: "Account Settings | Pexly",
    meta: [{ name: "description", content: "Update your security preferences, linked payment methods, and personal information." }],
  });

  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const urlParams = new URLSearchParams(window.location.search);
  const sectionFromUrl = urlParams.get("section");
  const [activeSection, setActiveSection] = useState(sectionFromUrl || "profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!loading && !user) {
    setLocation("/signin");
    return null;
  }

  const handleSectionChange = (id: string) => {
    if (id === "devices") {
      setLocation("/devices");
      return;
    }
    setActiveSection(id);
    setSidebarOpen(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection />;
      case "localization":
        return <LocalizationSection />;
      case "security":
        return <SecuritySection />;
      case "notifications":
        return <NotificationsSection />;
      case "verification":
        return <VerificationSection />;
      case "connected":
        return <ConnectedAppsSection />;
      case "shop-history":
        return <ShopHistorySection />;
      default:
        return (
          <Card>
            <CardContent className="p-12">
              <p className="text-muted-foreground">This section is coming soon</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Account</h1>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <SettingsSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <SettingsSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Account settings</h2>
                </div>
                {renderSection()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}
