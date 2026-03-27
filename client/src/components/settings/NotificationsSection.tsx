import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface NotificationPrefs {
  trade_updates: boolean;
  price_alerts: boolean;
  new_offers: boolean;
  marketing_emails: boolean;
  login_notifications: boolean;
  suspicious_activity: boolean;
}

const DEFAULTS: NotificationPrefs = {
  trade_updates: true,
  price_alerts: true,
  new_offers: true,
  marketing_emails: false,
  login_notifications: true,
  suspicious_activity: true,
};

function loadFromStorage(): NotificationPrefs {
  try {
    const raw = localStorage.getItem("pexly-notif-prefs");
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

export function NotificationsSection() {
  const { user } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();

  const [prefs, setPrefs] = useState<NotificationPrefs>(loadFromStorage());
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_profiles")
      .select("notification_preferences")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.notification_preferences) {
          const merged = { ...DEFAULTS, ...data.notification_preferences };
          setPrefs(merged);
          localStorage.setItem("pexly-notif-prefs", JSON.stringify(merged));
        }
      });
  }, [user?.id]);

  const set = (key: keyof NotificationPrefs) => (value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem("pexly-notif-prefs", JSON.stringify(prefs));
      if (user?.id) {
        const { error } = await supabase
          .from("user_profiles")
          .update({ notification_preferences: prefs })
          .eq("id", user.id);
        if (error) throw error;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast({ title: "Error", description: "Failed to save preferences", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Notifications</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Control which alerts and updates you receive
        </p>
      </div>

      {/* Trading */}
      <div>
        <h4 className="text-base font-semibold mb-3">Trading</h4>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Trade Updates</p>
                <p className="text-sm text-muted-foreground">Notifications about your active trades</p>
              </div>
              <Switch checked={prefs.trade_updates} onCheckedChange={set("trade_updates")} />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium">Price Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified of significant price changes</p>
              </div>
              <Switch checked={prefs.price_alerts} onCheckedChange={set("price_alerts")} />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium">New Offers</p>
                <p className="text-sm text-muted-foreground">Notifications about new trading offers</p>
              </div>
              <Switch checked={prefs.new_offers} onCheckedChange={set("new_offers")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <div>
        <h4 className="text-base font-semibold mb-3">Security Alerts</h4>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
              </div>
              <Switch checked={prefs.login_notifications} onCheckedChange={set("login_notifications")} />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium">Suspicious Activity Alerts</p>
                <p className="text-sm text-muted-foreground">Receive alerts about unusual account activity</p>
              </div>
              <Switch checked={prefs.suspicious_activity} onCheckedChange={set("suspicious_activity")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing */}
      <div>
        <h4 className="text-base font-semibold mb-3">Marketing</h4>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Emails</p>
                <p className="text-sm text-muted-foreground">Promotional content, tips, and platform updates</p>
              </div>
              <Switch checked={prefs.marketing_emails} onCheckedChange={set("marketing_emails")} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={loading} className="min-w-[120px]">
        {saved ? (
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Saved
          </span>
        ) : loading ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
