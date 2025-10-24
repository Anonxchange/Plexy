import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Bell, 
  CheckCircle2, 
  MessageSquare,
  ArrowLeftRight,
  Settings as SettingsIcon
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
  const [activeTab, setActiveTab] = useState("trades");

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    // Play sound for unread notifications on page load
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else if (diffDays < 7) {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'trade':
        return <ArrowLeftRight className="h-4 w-4" />;
      case 'system':
        return <Bell className="h-4 w-4" />;
      case 'offer':
        return <MessageSquare className="h-4 w-4" />;
      case 'payment':
        return <ArrowLeftRight className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAvatarColor = (type: Notification['type']) => {
    switch (type) {
      case 'trade':
        return 'bg-cyan-500';
      case 'system':
        return 'bg-green-500';
      case 'offer':
        return 'bg-orange-500';
      case 'payment':
        return 'bg-cyan-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Separate chat messages from other trade notifications
  const chatNotifications = notifications.filter(n => 
    n.type === 'trade' && n.metadata?.messageType === 'chat'
  );
  const tradeNotifications = notifications.filter(n => 
    (n.type === 'trade' || n.type === 'offer' || n.type === 'payment') && 
    n.metadata?.messageType !== 'chat'
  );
  const systemNotifications = notifications.filter(n => 
    n.type === 'system' || n.type === 'price_alert'
  );
  const unreadTradeCount = tradeNotifications.filter(n => !n.read).length;
  const unreadChatCount = chatNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Messenger</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              onClick={handleMarkAllAsRead}
            >
              <SettingsIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger 
              value="trades" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent relative py-3"
            >
              Trades
              {(unreadTradeCount + unreadChatCount) > 0 && (
                <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-green-500 hover:bg-green-600 text-xs rounded-full">
                  {unreadTradeCount + unreadChatCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="partners" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              Partners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trades" className="mt-0">
            <ScrollArea className="h-[calc(100vh-140px)]">
              <div className="divide-y divide-border">
                {tradeNotifications.length === 0 && chatNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No trade notifications yet</p>
                  </div>
                ) : (
                  <>
                  {tradeNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-3 p-4 hover:bg-accent cursor-pointer transition-colors ${
                        !notification.read ? 'bg-accent/30' : ''
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12">
                          {notification.metadata?.counterpart_avatar ? (
                            <AvatarImage src={notification.metadata.counterpart_avatar} alt="User" />
                          ) : null}
                          <AvatarFallback className={`${getAvatarColor(notification.type)} text-white`}>
                            {notification.metadata?.counterpart_name?.substring(0, 2)?.toUpperCase() || getNotificationIcon(notification.type)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm truncate">
                              {notification.title}
                            </h3>
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                      </div>

                      {!notification.read && (
                        <Badge className="h-5 min-w-5 px-1.5 bg-green-500 hover:bg-green-600 text-xs rounded-full flex-shrink-0">
                          1
                        </Badge>
                      )}
                    </div>
                  ))}
                  </>
                )}

                {chatNotifications.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="p-4">
                      <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                        Trade chats
                      </h2>
                      <div className="space-y-3">
                        {chatNotifications.map((notification) => {
                          const isCancelled = notification.metadata?.tradeStatus === 'cancelled';
                          const countryFlag = notification.metadata?.counterpart_country === 'Nigeria' ? '🇳🇬' : '🌍';
                          
                          return (
                            <div
                              key={`chat-${notification.id}`}
                              onClick={() => handleNotificationClick(notification)}
                              className={`flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                                !notification.read ? 'bg-accent/30' : ''
                              } ${isCancelled ? 'opacity-60' : ''}`}
                            >
                              <div className="relative flex-shrink-0">
                                <Avatar className="h-10 w-10">
                                  {notification.metadata?.counterpart_avatar ? (
                                    <AvatarImage src={notification.metadata.counterpart_avatar} alt={notification.metadata?.counterpart_name || 'User'} />
                                  ) : null}
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {notification.metadata?.counterpart_name?.substring(0, 2)?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 text-sm">
                                  {countryFlag}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <h3 className="font-medium text-sm truncate">
                                      {notification.metadata?.counterpart_name || `Trade #${notification.metadata?.tradeId?.substring(0, 8) || 'Unknown'}`}
                                    </h3>
                                    {isCancelled && (
                                      <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                                        Cancelled
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatTime(notification.metadata?.lastMessageAt || notification.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {notification.metadata?.lastMessage || notification.message}
                                </p>
                              </div>

                              {!notification.read && notification.metadata?.messageCount > 0 && (
                                <Badge className="h-5 min-w-5 px-1.5 bg-green-500 hover:bg-green-600 text-xs rounded-full flex-shrink-0">
                                  {notification.metadata.messageCount}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="partners" className="mt-0">
            <ScrollArea className="h-[calc(100vh-140px)]">
              <div className="divide-y divide-border">
                {systemNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No partner notifications yet</p>
                  </div>
                ) : (
                  systemNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-3 p-4 hover:bg-accent cursor-pointer transition-colors ${
                        !notification.read ? 'bg-accent/30' : ''
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12">
                          {notification.metadata?.counterpart_avatar ? (
                            <AvatarImage src={notification.metadata.counterpart_avatar} alt="User" />
                          ) : null}
                          <AvatarFallback className={`${getAvatarColor(notification.type)} text-white`}>
                            {notification.metadata?.counterpart_name?.substring(0, 2)?.toUpperCase() || getNotificationIcon(notification.type)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm truncate">
                              {notification.title}
                            </h3>
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                      </div>

                      {!notification.read && (
                        <Badge className="h-5 min-w-5 px-1.5 bg-green-500 hover:bg-green-600 text-xs rounded-full flex-shrink-0">
                          1
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
