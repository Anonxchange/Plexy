
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bell, Mail, MessageSquare, DollarSign, TrendingUp, Megaphone } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";

export default function NotificationSettings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  // Notification preferences
  const [tradeUpdates, setTradeUpdates] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newOffers, setNewOffers] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotificationSettings();
    }
  }, [user]);

  const loadNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('notification_preferences')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.notification_preferences) {
        const prefs = data.notification_preferences;
        setTradeUpdates(prefs.trade_updates ?? true);
        setPriceAlerts(prefs.price_alerts ?? true);
        setNewOffers(prefs.new_offers ?? true);
        setMarketingEmails(prefs.marketing_emails ?? false);
        setPushNotifications(prefs.push_notifications ?? true);
        setEmailNotifications(prefs.email_notifications ?? true);
        setSmsNotifications(prefs.sms_notifications ?? false);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      const preferences = {
        trade_updates: tradeUpdates,
        price_alerts: priceAlerts,
        new_offers: newOffers,
        marketing_emails: marketingEmails,
        push_notifications: pushNotifications,
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications,
      };

      const { error } = await supabase
        .from('user_profiles')
        .update({ notification_preferences: preferences })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Notification settings updated",
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/account-settings?section=notifications')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Notification Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications in your browser or mobile app
                  </p>
                </div>
                <Switch 
                  checked={pushNotifications} 
                  onCheckedChange={(checked) => {
                    setPushNotifications(checked);
                    saveNotificationSettings();
                  }} 
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Get important updates via email
                  </p>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={(checked) => {
                    setEmailNotifications(checked);
                    saveNotificationSettings();
                  }} 
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS Notifications
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Receive critical alerts via SMS
                  </p>
                </div>
                <Switch 
                  checked={smsNotifications} 
                  onCheckedChange={(checked) => {
                    setSmsNotifications(checked);
                    saveNotificationSettings();
                  }} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Trade Updates
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about your active trades
                  </p>
                </div>
                <Switch 
                  checked={tradeUpdates} 
                  onCheckedChange={(checked) => {
                    setTradeUpdates(checked);
                    saveNotificationSettings();
                  }} 
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Price Alerts
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about price changes
                  </p>
                </div>
                <Switch 
                  checked={priceAlerts} 
                  onCheckedChange={(checked) => {
                    setPriceAlerts(checked);
                    saveNotificationSettings();
                  }} 
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    New Offers
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new trading offers are posted
                  </p>
                </div>
                <Switch 
                  checked={newOffers} 
                  onCheckedChange={(checked) => {
                    setNewOffers(checked);
                    saveNotificationSettings();
                  }} 
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    Marketing Emails
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Receive promotional content and platform updates
                  </p>
                </div>
                <Switch 
                  checked={marketingEmails} 
                  onCheckedChange={(checked) => {
                    setMarketingEmails(checked);
                    saveNotificationSettings();
                  }} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLocation('/notifications')}
            >
              View All Notifications
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLocation('/account-settings')}
            >
              Back to Settings
            </Button>
          </div>
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}
