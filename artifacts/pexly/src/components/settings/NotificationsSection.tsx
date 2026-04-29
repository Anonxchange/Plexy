import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Loader2, Bell, Mail, MessageSquare, Shield, TrendingUp, Megaphone, Smartphone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface NotificationPrefs {
  // Delivery channels
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  // Activity
  price_alerts: boolean;
  transaction_updates: boolean;
  // Security
  login_notifications: boolean;
  suspicious_activity: boolean;
  // Marketing
  marketing_emails: boolean;
}

const DEFAULTS: NotificationPrefs = {
  push_notifications: true,
  email_notifications: true,
  sms_notifications: false,
  price_alerts: true,
  transaction_updates: true,
  login_notifications: true,
  suspicious_activity: true,
  marketing_emails: false,
};

const STORAGE_KEY = "pexly-notif-prefs";

function loadFromStorage(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function PreferenceRow({ icon, label, description, checked, onChange }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex-shrink-0 text-muted-foreground mt-0.5">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="flex-shrink-0" />
    </div>
  );
}

export function NotificationsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const [prefs, setPrefs] = useState<NotificationPrefs>(loadFromStorage());
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setFetching(false);
      return;
    }
    supabase
      .from("user_profiles")
      .select("notification_preferences")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.notification_preferences) {
          const merged = { ...DEFAULTS, ...data.notification_preferences };
          setPrefs(merged);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {}
        }
        setFetching(false);
      });
  }, [user?.id]);

  const set = (key: keyof NotificationPrefs) => (value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      } catch {}

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

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-1">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Control where and how you receive alerts from Pexly.
        </p>
      </div>

      {/* Delivery channels */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Delivery channels
        </h4>
        <div className="divide-y divide-border rounded-xl border bg-card px-4">
          <PreferenceRow
            icon={<Bell className="h-4 w-4" />}
            label="Push notifications"
            description="Receive real-time alerts in your browser or mobile app"
            checked={prefs.push_notifications}
            onChange={set("push_notifications")}
          />
          <PreferenceRow
            icon={<Mail className="h-4 w-4" />}
            label="Email notifications"
            description="Get important updates delivered to your inbox"
            checked={prefs.email_notifications}
            onChange={set("email_notifications")}
          />
          <PreferenceRow
            icon={<MessageSquare className="h-4 w-4" />}
            label="SMS notifications"
            description="Receive critical alerts via text message"
            checked={prefs.sms_notifications}
            onChange={set("sms_notifications")}
          />
        </div>
      </section>

      {/* Activity */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Activity
        </h4>
        <div className="divide-y divide-border rounded-xl border bg-card px-4">
          <PreferenceRow
            icon={<Smartphone className="h-4 w-4" />}
            label="Transaction updates"
            description="Notifications about your payments and account activity"
            checked={prefs.transaction_updates}
            onChange={set("transaction_updates")}
          />
          <PreferenceRow
            icon={<TrendingUp className="h-4 w-4" />}
            label="Price alerts"
            description="Get notified about significant cryptocurrency price movements"
            checked={prefs.price_alerts}
            onChange={set("price_alerts")}
          />
        </div>
      </section>

      {/* Security */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Security
        </h4>
        <div className="divide-y divide-border rounded-xl border bg-card px-4">
          <PreferenceRow
            icon={<Shield className="h-4 w-4" />}
            label="Login notifications"
            description="Get alerted when your account is signed into from a new device or location"
            checked={prefs.login_notifications}
            onChange={set("login_notifications")}
          />
          <PreferenceRow
            icon={<Shield className="h-4 w-4" />}
            label="Suspicious activity alerts"
            description="Receive warnings about unusual account behaviour"
            checked={prefs.suspicious_activity}
            onChange={set("suspicious_activity")}
          />
        </div>
      </section>

      {/* Marketing */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Marketing
        </h4>
        <div className="divide-y divide-border rounded-xl border bg-card px-4">
          <PreferenceRow
            icon={<Megaphone className="h-4 w-4" />}
            label="Marketing emails"
            description="Promotions, tips, and platform news delivered to your inbox"
            checked={prefs.marketing_emails}
            onChange={set("marketing_emails")}
          />
        </div>
      </section>

      <Button
        onClick={handleSave}
        disabled={loading || saved}
        className="w-full sm:w-auto min-w-[140px]"
      >
        {saved ? (
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Saved
          </span>
        ) : loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </span>
        ) : (
          "Save changes"
        )}
      </Button>
    </div>
  );
}
