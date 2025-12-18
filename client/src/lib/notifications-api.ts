import { createClient } from "@/lib/supabase";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'trade' | 'price_alert' | 'offer' | 'system' | 'payment' | 'announcement' | 'account_change';
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface Announcement {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image_url: string | null;
  author: string;
  read_time: string;
  created_at: string;
}

export async function getNotifications(): Promise<Notification[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}

export async function markAllAsRead(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }

  return true;
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  metadata?: Record<string, any>
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      read: false,
      metadata
    });

  if (error) {
    console.error('Error creating notification:', error);
    return false;
  }

  return true;
}

export async function createMessageNotification(
  recipientId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string | null,
  messageContent: string,
  tradeId: string,
  tradeStatus?: string,
  counterpartCountry?: string
): Promise<boolean> {
  const supabase = createClient();

  // Check if a notification already exists for this trade
  const { data: existingNotification } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', recipientId)
    .eq('metadata->>tradeId', tradeId)
    .eq('metadata->>messageType', 'chat')
    .single();

  if (existingNotification) {
    // Update existing notification with new message
    const currentCount = existingNotification.metadata?.messageCount || 1;
    const newCount = currentCount + 1;

    const { error } = await supabase
      .from('notifications')
      .update({
        message: `${newCount} new messages`,
        read: false,
        created_at: new Date().toISOString(),
        metadata: {
          ...existingNotification.metadata,
          messageCount: newCount,
          lastMessage: messageContent,
          lastMessageAt: new Date().toISOString(),
          tradeStatus: tradeStatus || existingNotification.metadata?.tradeStatus,
          counterpart_country: counterpartCountry || existingNotification.metadata?.counterpart_country
        }
      })
      .eq('id', existingNotification.id);

    if (error) {
      console.error('Error updating message notification:', error);
      return false;
    }
  } else {
    // Create new notification for this trade
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        title: senderName,
        message: messageContent,
        type: 'trade',
        read: false,
        metadata: {
          tradeId,
          counterpart_name: senderName,
          counterpart_avatar: senderAvatar,
          counterpart_country: counterpartCountry || 'Nigeria',
          url: `/trade/${tradeId}`,
          messageType: 'chat',
          messageCount: 1,
          lastMessage: messageContent,
          lastMessageAt: new Date().toISOString(),
          tradeStatus: tradeStatus || 'active'
        }
      });

    if (error) {
      console.error('Error creating message notification:', error);
      return false;
    }
  }

  return true;
}

export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  const supabase = createClient();

  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createAccountChangeNotification(
  userId: string,
  changeType: 'password_changed' | '2fa_enabled' | '2fa_disabled' | 'email_changed' | 'phone_changed' | 'login_attempt',
  metadata?: Record<string, any>
): Promise<boolean> {
  const supabase = createClient();
  
  const changeMessages: Record<string, { title: string; message: string }> = {
    password_changed: {
      title: 'Password Changed',
      message: 'Your account password has been successfully changed.'
    },
    '2fa_enabled': {
      title: 'Two-Factor Authentication Enabled',
      message: 'Two-factor authentication has been enabled on your account for added security.'
    },
    '2fa_disabled': {
      title: 'Two-Factor Authentication Disabled',
      message: 'Two-factor authentication has been disabled on your account.'
    },
    email_changed: {
      title: 'Email Address Changed',
      message: 'Your account email address has been updated.'
    },
    phone_changed: {
      title: 'Phone Number Changed',
      message: 'Your account phone number has been updated.'
    },
    login_attempt: {
      title: 'Login Attempt From New IP',
      message: 'Your account was logged in from an unfamiliar IP address.'
    }
  };

  const change = changeMessages[changeType] || { title: 'Account Changed', message: 'Your account has been modified.' };

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: change.title,
      message: change.message,
      type: 'account_change',
      read: false,
      metadata: {
        changeType,
        ...metadata
      }
    });

  if (error) {
    console.error('Error creating account change notification:', error);
    return false;
  }

  return true;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, excerpt, content, category, image_url, author, read_time, created_at')
    .eq('category', 'Announcement')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }

  return data || [];
}

export function subscribeToAnnouncements(
  callback: (announcement: Announcement) => void
) {
  const supabase = createClient();

  const channel = supabase
    .channel('announcements')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'blog_posts',
        filter: `category=eq.Announcement`
      },
      (payload) => {
        callback(payload.new as Announcement);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}