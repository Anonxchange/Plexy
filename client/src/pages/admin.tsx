
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, FileCheck, Settings, BarChart3, Gift } from '@/lib/icons';
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user?.id) {
      setChecking(false);
      return;
    }
    supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(!!data?.is_admin);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [user]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Your account does not have admin privileges.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const adminSections = [
    {
      icon: FileCheck,
      title: "Verification Management",
      description: "Review and approve user verification requests",
      href: "/admin/verifications",
      badge: "Active"
    },
    {
      icon: FileCheck,
      title: "Blog Management",
      description: "Create and manage blog posts",
      href: "/admin/blog",
      badge: "Active"
    },
    {
      icon: Gift,
      title: "Gift Card Management",
      description: "Upload and manage gift cards",
      href: "/admin/gift-cards",
      badge: "Active"
    },
    {
      icon: Users,
      title: "User Management",
      description: "Manage user accounts and permissions",
      href: "/admin/users",
      badge: "Coming Soon"
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "View platform statistics and insights",
      href: "/admin/analytics",
      badge: "Coming Soon"
    },
    {
      icon: Settings,
      title: "System Settings",
      description: "Configure platform settings and parameters",
      href: "/admin/settings",
      badge: "Coming Soon"
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and monitor the Pexly platform
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.title}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                if (section.badge === "Active") {
                  setLocation(section.href);
                }
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Status:{" "}
                    <span
                      className={
                        section.badge === "Active"
                          ? "text-green-600 font-semibold"
                          : "text-yellow-600 font-semibold"
                      }
                    >
                      {section.badge}
                    </span>
                  </span>
                  {section.badge === "Active" && (
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
