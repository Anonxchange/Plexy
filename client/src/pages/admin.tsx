
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Users, FileCheck, Settings, BarChart3, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Check if admin session exists in localStorage
      const adminSession = localStorage.getItem('admin_session');
      if (adminSession) {
        try {
          const session = JSON.parse(adminSession);
          if (session.expiresAt > Date.now()) {
            setIsAuthenticated(true);
            setCheckingSession(false);
            return;
          } else {
            localStorage.removeItem('admin_session');
          }
        } catch (e) {
          localStorage.removeItem('admin_session');
        }
      }

      // Check if user has admin role in database
      if (user?.id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin) {
          setIsAuthenticated(true);
          setCheckingSession(false);
          return;
        }
      }

      setCheckingSession(false);
    };

    checkAdminAccess();
  }, [user]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "PexlyAdmin2024!") {
      const session = {
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      };
      localStorage.setItem('admin_session', JSON.stringify(session));
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Checking access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Enter the admin password to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
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
      icon: Shield,
      title: "Merchant Management",
      description: "Review and approve merchant applications",
      href: "/admin/merchants",
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
                    Status: <span className={section.badge === "Active" ? "text-green-600 font-semibold" : "text-yellow-600 font-semibold"}>{section.badge}</span>
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
