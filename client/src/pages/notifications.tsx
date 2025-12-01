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
  LogIn,
  Megaphone,
  Clock,
  User,
  ChevronRight
} from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getAnnouncements,
  type Notification,
  type Announcement
} from "@/lib/notifications-api";
import { useAuth } from "@/lib/auth-context";
import { notificationSounds } from "@/lib/notification-sounds";

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTab, setActiveTab] = useState("notifications");
  const [hideRead, setHideRead] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('readAnnouncementIds');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadAnnouncements();
    }
  }, [user]);

  const loadAnnouncements = async () => {
    const data = await getAnnouncements();
    setAnnouncements(data);
  };

  const markAnnouncementAsRead = (id: string) => {
    const newReadIds = new Set(readAnnouncementIds);
    newReadIds.add(id);
    setReadAnnouncementIds(newReadIds);
    localStorage.setItem('readAnnouncementIds', JSON.stringify(Array.from(newReadIds)));
  };

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
  const campaignNotifications: Notification[] = [];

  const displayedNotifications = hideRead 
    ? generalNotifications.filter(n => !n.read)
    : generalNotifications;

  const unreadAnnouncementCount = announcements.filter(a => !readAnnouncementIds.has(a.id)).length;
  const systemUnreadCount = systemNotifications.filter(n => !n.read).length + unreadAnnouncementCount;
  const notificationsUnreadCount = generalNotifications.filter(n => !n.read).length;

  const handleAnnouncementClick = (announcement: Announcement) => {
    markAnnouncementAsRead(announcement.id);
    navigate(`/blog/${announcement.id}`);
  };

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
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b bg-transparent h-auto p-0">
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
                {announcements.length === 0 && systemNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-30" />
                    <p className="text-sm text-muted-foreground">No system notifications</p>
                  </div>
                ) : (
                  <>
                    {announcements.map((announcement) => (
                      <div
                        key={`announcement-${announcement.id}`}
                        onClick={() => {
                          markAnnouncementAsRead(announcement.id);
                          setSelectedAnnouncement(announcement);
                        }}
                        className={`flex items-start gap-3 p-4 hover:bg-accent cursor-pointer transition-colors ${
                          !readAnnouncementIds.has(announcement.id) ? 'bg-[#B4F22E]/10' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {announcement.image_url ? (
                            <img
                              src={announcement.image_url}
                              alt={announcement.title}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-[#B4F22E]/20 flex items-center justify-center">
                              <Megaphone className="h-6 w-6 text-[#B4F22E]" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-[#B4F22E] text-black text-xs hover:bg-[#9FD624]">
                              Announcement
                            </Badge>
                            {!readAnnouncementIds.has(announcement.id) && (
                              <span className="h-2 w-2 rounded-full bg-[#B4F22E]"></span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                            {announcement.title}
                          </p>
                          {announcement.excerpt && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {announcement.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{formatTime(announcement.created_at)}</span>
                            {announcement.read_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {announcement.read_time}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 self-center">
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                    
                    {systemNotifications.map((notification) => (
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
                    ))}
                  </>
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

      {/* Announcement Detail View */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-4">
          <div className="bg-background w-full max-w-2xl rounded-lg shadow-xl max-h-[calc(100vh-32px)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex-1">
                <Badge className="bg-[#B4F22E] text-black text-xs hover:bg-[#9FD624] mb-2">
                  Announcement
                </Badge>
                <h1 className="text-2xl font-bold text-foreground">
                  {selectedAnnouncement.title}
                </h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAnnouncement(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Meta information */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{selectedAnnouncement.author || 'Pexly Team'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(selectedAnnouncement.created_at)}</span>
                  </div>
                  {selectedAnnouncement.read_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{selectedAnnouncement.read_time}</span>
                    </div>
                  )}
                </div>

                {/* Cover image */}
                {selectedAnnouncement.image_url && (
                  <div className="mb-6">
                    <img
                      src={selectedAnnouncement.image_url}
                      alt={selectedAnnouncement.title}
                      className="w-full h-64 rounded-lg object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div
                    className="text-foreground/90 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: selectedAnnouncement.content?.replace(/\n/g, '<br />') || selectedAnnouncement.excerpt || ''
                    }}
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setSelectedAnnouncement(null)}
              >
                Close
              </Button>
              <Button
                className="ml-auto bg-[#B4F22E] text-black hover:bg-[#9FD624]"
                onClick={() => {
                  setSelectedAnnouncement(null);
                  navigate(`/blog/${selectedAnnouncement.id}`);
                }}
              >
                View Full Blog Post
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}