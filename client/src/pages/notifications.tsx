import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Bell, 
  CheckCircle2, 
  Settings as SettingsIcon,
  ArrowLeft,
  Shield,
  DollarSign,
  FileCheck,
  AlertCircle,
  LogIn
} from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type Notification
} from "@/lib/notifications-api";
import { useAuth } from "@/lib/auth-context";
import { notificationSounds } from "@/lib/notification-sounds";

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("notifications");
  const [hideRead, setHideRead] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
      notificationSounds.play('message_received');
    }
  }, [notifications.length]);

  const loadNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }

    if (notification.metadata?.tradeId) {
      navigate(`/trade/${notification.metadata.tradeId}`);
    } else if (notification.metadata?.url) {
      navigate(notification.metadata.url);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.type === 'system') {
      if (notification.message.toLowerCase().includes('login')) {
        return <LogIn className="h-5 w-5 text-purple-500" />;
      } else if (notification.message.toLowerCase().includes('verified')) {
        return <Shield className="h-5 w-5 text-green-500" />;
      } else if (notification.message.toLowerCase().includes('approved')) {
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      } else if (notification.message.toLowerCase().includes('rejected')) {
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      }
    } else if (notification.type === 'payment') {
      return <DollarSign className="h-5 w-5 text-blue-500" />;
    } else if (notification.type === 'trade') {
      return <FileCheck className="h-5 w-5 text-cyan-500" />;
    }
    return <Bell className="h-5 w-5 text-gray-500" />;
  };

  const systemNotifications = notifications.filter(n => n.type === 'system');
  const generalNotifications = notifications.filter(n => n.type !== 'system');
  const campaignNotifications: Notification[] = []; // Placeholder for campaign notifications

  const displayedNotifications = hideRead 
    ? generalNotifications.filter(n => !n.read)
    : generalNotifications;

  const systemUnreadCount = systemNotifications.filter(n => !n.read).length;
  const notificationsUnreadCount = generalNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Notifications</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleMarkAllAsRead}
            >
              <CheckCircle2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => navigate('/account-settings')}
            >
              <SettingsIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 px-4 pb-3">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="hide-read" 
              checked={hideRead}
              onCheckedChange={(checked) => setHideRead(checked as boolean)}
            />
            <label 
              htmlFor="hide-read" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Hide read notifications
            </label>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0 justify-start px-4">
            <TabsTrigger 
              value="system" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-4 py-3 relative"
            >
              <span className="text-sm">System</span>
              {systemUnreadCount > 0 && (
                <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-purple-500 hover:bg-purple-600 text-xs rounded-full">
                  {systemUnreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-4 py-3 relative"
            >
              <span className="text-sm">Notifications</span>
              {notificationsUnreadCount > 0 && (
                <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-purple-500 hover:bg-purple-600 text-xs rounded-full">
                  {notificationsUnreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="campaign" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-4 py-3"
            >
              <span className="text-sm">Campaign</span>
            </TabsTrigger>
          </TabsList>

          {/* System Tab */}
          <TabsContent value="system" className="mt-0">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="divide-y divide-border">
                {systemNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-30" />
                    <p className="text-sm text-muted-foreground">No system notifications</p>
                  </div>
                ) : (
                  systemNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-3 p-4 hover:bg-accent cursor-pointer transition-colors ${
                        !notification.read ? 'bg-purple-500/5' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                          {getNotificationIcon(notification)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="divide-y divide-border">
                {displayedNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-30" />
                    <p className="text-sm text-muted-foreground">
                      {hideRead ? 'No unread notifications' : 'No notifications yet'}
                    </p>
                  </div>
                ) : (
                  displayedNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-3 p-4 hover:bg-accent cursor-pointer transition-colors ${
                        !notification.read ? 'bg-purple-500/5' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                          {getNotificationIcon(notification)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Campaign Tab */}
          <TabsContent value="campaign" className="mt-0">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">No campaign notifications</p>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}