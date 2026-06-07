import { getSupabase } from "@/lib/supabase";
import { asterMarket, type Ticker24h } from "@/lib/asterdex-service";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'trade' | 'price_alert' | 'system' | 'payment' | 'announcement' | 'account_change';
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
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) { console.error('Error fetching notifications:', error); return []; }
    return data || [];
  } catch {
    return [];
  }
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    if (error) { console.error('Error marking notification as read:', error); return false; }
    return true;
  } catch {
    return false;
  }
}

export async function markAllAsRead(): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) { console.error('Error marking all as read:', error); return false; }
    return true;
  } catch {
    return false;
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
    if (error) { console.error('Error deleting notification:', error); return false; }
    return true;
  } catch {
    return false;
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.from('notifications').insert({ user_id: userId, title, message, type, read: false, metadata });
    if (error) { console.error('Error creating notification:', error); return false; }
    return true;
  } catch {
    return false;
  }
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
  try {
    const supabase = await getSupabase();

    const { data: existingNotification } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', recipientId)
      .eq('metadata->>tradeId', tradeId)
      .eq('metadata->>messageType', 'chat')
      .single();

    if (existingNotification) {
      const newCount = (existingNotification.metadata?.messageCount || 1) + 1;
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
            counterpart_country: counterpartCountry || existingNotification.metadata?.counterpart_country,
          },
        })
        .eq('id', existingNotification.id);
      if (error) { console.error('Error updating message notification:', error); return false; }
    } else {
      const { error } = await supabase.from('notifications').insert({
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
          tradeStatus: tradeStatus || 'active',
        },
      });
      if (error) { console.error('Error creating message notification:', error); return false; }
    }
    return true;
  } catch {
    return false;
  }
}

export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
): () => void {
  let cleanup: (() => void) | null = null;

  getSupabase()
    .then((supabase) => {
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          (payload) => { callback(payload.new as Notification); }
        )
        .subscribe();

      cleanup = () => { supabase.removeChannel(channel); };
    })
    .catch(() => {
      // Supabase not configured — realtime disabled, notifications still work from initial fetch
    });

  return () => { cleanup?.(); };
}

export async function createAccountChangeNotification(
  userId: string,
  changeType: 'password_changed' | '2fa_enabled' | '2fa_disabled' | 'email_changed' | 'phone_changed' | 'login_attempt',
  metadata?: Record<string, any>
): Promise<boolean> {
  const changeMessages: Record<string, { title: string; message: string }> = {
    password_changed:  { title: 'Password Changed',                    message: 'Your account password has been successfully changed.' },
    '2fa_enabled':     { title: 'Two-Factor Authentication Enabled',   message: 'Two-factor authentication has been enabled on your account for added security.' },
    '2fa_disabled':    { title: 'Two-Factor Authentication Disabled',  message: 'Two-factor authentication has been disabled on your account.' },
    email_changed:     { title: 'Email Address Changed',               message: 'Your account email address has been updated.' },
    phone_changed:     { title: 'Phone Number Changed',                message: 'Your account phone number has been updated.' },
    login_attempt:     { title: 'New Sign-In Detected',                message: 'Your account was accessed from a new location or device.' },
  };
  const change = changeMessages[changeType] || { title: 'Account Changed', message: 'Your account has been modified.' };

  try {
    const supabase = await getSupabase();
    const { error } = await supabase.from('notifications').insert({
      user_id: userId, title: change.title, message: change.message,
      type: 'system', read: false, metadata: { changeType, notificationSubtype: 'account_change', ...metadata },
    });
    if (error) { console.error('Error creating account change notification:', error); return false; }
    return true;
  } catch {
    return false;
  }
}

export async function sendCoinReceivedNotification(
  userId: string,
  tx: { id: string; crypto_symbol: string; amount: number; type: string; tx_hash?: string | null; from_address?: string | null }
): Promise<void> {
  try {
    const supabase = await getSupabase();

    const { data } = await supabase
      .from('user_profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    const prefs = data?.notification_preferences as Record<string, boolean> | null;
    if (prefs && prefs.transaction_updates === false) return;

    const amount = Number(tx.amount);
    const symbol = tx.crypto_symbol?.toUpperCase() ?? '';
    const formattedAmount = amount < 0.0001
      ? amount.toExponential(4)
      : amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 8 });

    const sourceLabel: Record<string, string> = { deposit: 'external transfer', swap: 'swap', escrow_release: 'completed trade' };
    const source = sourceLabel[tx.type] ?? 'transfer';

    const message = tx.from_address
      ? `${formattedAmount} ${symbol} received from ${tx.from_address.slice(0, 6)}…${tx.from_address.slice(-4)} via ${source}.`
      : `${formattedAmount} ${symbol} received via ${source}.`;

    await supabase.from('notifications').insert({
      user_id: userId, title: `${formattedAmount} ${symbol} Received`, message,
      type: 'payment', read: false,
      metadata: { transactionId: tx.id, crypto_symbol: symbol, amount, txType: tx.type, tx_hash: tx.tx_hash ?? null, from_address: tx.from_address ?? null, url: '/wallet' },
    });
  } catch {
    // Never block the calling flow
  }
}

export async function sendLoginNotificationIfEnabled(
  userId: string,
  deviceInfo: { browser: string; os: string; deviceName: string },
  ipAddress: string
): Promise<void> {
  try {
    const supabase = await getSupabase();

    const { data } = await supabase
      .from('user_profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    const prefs = data?.notification_preferences as Record<string, boolean> | null;
    if (prefs && prefs.login_notifications === false) return;

    const now = new Date();
    const timeStr = now.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    const message = `Signed in on ${deviceInfo.deviceName} via ${deviceInfo.browser} (${deviceInfo.os})${ipAddress ? ` from ${ipAddress}` : ''}. ${timeStr}`;

    await supabase.from('notifications').insert({
      user_id: userId, title: 'New Sign-In to Your Account', message,
      type: 'system', read: false,
      metadata: { changeType: 'login_attempt', notificationSubtype: 'account_change', browser: deviceInfo.browser, os: deviceInfo.os, deviceName: deviceInfo.deviceName, ipAddress, signedInAt: now.toISOString() },
    });
  } catch {
    // Never block the auth flow
  }
}

// ─── Market Movers ───────────────────────────────────────────────────────────
// Fires once per 24h per user (localStorage gate) when market_movers pref is on.
// Reuses asterMarket.spotTicker() / futuresTicker() — the same AsterDex public API
// that MarketsSection already calls. Derives top-3 gainers / losers / hot coins
// and inserts one price_alert notification per coin, staggered 300ms apart.


const COIN_NAMES: Record<string, string> = {
  BTC:'Bitcoin', ETH:'Ethereum', BNB:'BNB', SOL:'Solana', XRP:'XRP',
  DOGE:'Dogecoin', ADA:'Cardano', AVAX:'Avalanche', DOT:'Polkadot',
  MATIC:'Polygon', LINK:'Chainlink', LTC:'Litecoin', UNI:'Uniswap',
  ATOM:'Cosmos', NEAR:'NEAR Protocol', APT:'Aptos', ARB:'Arbitrum',
  OP:'Optimism', PEPE:'Pepe', WIF:'dogwifhat', TON:'Toncoin',
  SUI:'Sui', INJ:'Injective', TIA:'Celestia', NOT:'Notcoin',
};

function mmCoinName(sym: string) { return COIN_NAMES[sym.toUpperCase()] || sym; }

function mmFmtPrice(p: number) {
  if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (p >= 1)    return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
}


export async function fetchAndCreateMarketMoversNotifications(userId: string): Promise<void> {
  try {
    const supabase = await getSupabase();

    // Respect user pref
    const { data } = await supabase
      .from('user_profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single();
    const prefs = data?.notification_preferences as Record<string, boolean> | null;
    if (prefs && prefs.market_movers === false) return;

    // 24-hour cooldown per user (per device — localStorage)
    const lsKey = `pexly_mm_ts_${userId}`;
    const lastRun = parseInt(localStorage.getItem(lsKey) || '0', 10);
    if (Date.now() - lastRun < 24 * 60 * 60 * 1000) return;

    // Use the same AsterDex public API that MarketsSection already uses — proven to work
    const [spotRaw, futuresRaw]: [Ticker24h[], Ticker24h[]] = await Promise.all([
      asterMarket.spotTicker(),
      asterMarket.futuresTicker(),
    ]);

    // Build a set of symbols that have a perpetual contract — used for routing
    const futuresSymbols = new Set(
      (futuresRaw as Ticker24h[]).filter(t => t.symbol.endsWith('USDT')).map(t => t.symbol)
    );

    // USDT pairs only, min $2M 24h volume
    const coins = (spotRaw as Ticker24h[])
      .filter(t => t.symbol.endsWith('USDT') && parseFloat(t.quoteVolume) > 2_000_000)
      .map(t => ({
        symbol:  t.symbol.replace('USDT', ''),
        // Pair format must match what MarketsSection stores: "BTC/USDT" not "BTCUSDT"
        pair:    `${t.symbol.replace('USDT', '')}/USDT`,
        price:   parseFloat(t.lastPrice),
        change:  parseFloat(t.priceChangePercent),
        volume:  parseFloat(t.quoteVolume),
        isPerp:  futuresSymbols.has(t.symbol),
      }));

    const byChange = [...coins].sort((a, b) => b.change - a.change);
    const gainers  = byChange.slice(0, 3);
    const losers   = byChange.slice(-3).reverse();
    const hot      = [...coins].sort((a, b) => b.volume - a.volume).slice(0, 3);

    type Entry = { title: string; message: string; metadata: Record<string, any> };
    const entries: Entry[] = [
      ...gainers.map(c => ({
        title:    `${c.symbol} up ${c.change.toFixed(1)}% today 🚀`,
        message:  `${mmCoinName(c.symbol)} is surging, currently at ${mmFmtPrice(c.price)}. Tap to trade.`,
        metadata: { symbol: c.symbol, pair: c.pair, marketType: c.isPerp ? 'perp' : 'spot', priceChange: c.change, price: c.price, category: 'gainer' },
      })),
      ...losers.map(c => ({
        title:    `${c.symbol} down ${Math.abs(c.change).toFixed(1)}% today 📉`,
        message:  `${mmCoinName(c.symbol)} has dropped to ${mmFmtPrice(c.price)} in 24h. Tap to view.`,
        metadata: { symbol: c.symbol, pair: c.pair, marketType: c.isPerp ? 'perp' : 'spot', priceChange: c.change, price: c.price, category: 'loser' },
      })),
      ...hot.map(c => ({
        title:    `${c.symbol} is trending 🔥`,
        message:  `${mmCoinName(c.symbol)} is one of today's most traded coins — at ${mmFmtPrice(c.price)}. Tap to trade.`,
        metadata: { symbol: c.symbol, pair: c.pair, marketType: c.isPerp ? 'perp' : 'spot', priceChange: c.change, price: c.price, category: 'hot' },
      })),
    ];

    for (const entry of entries) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title:   entry.title,
        message: entry.message,
        type:    'price_alert',
        read:    false,
        metadata: entry.metadata,
      });
      await new Promise(r => setTimeout(r, 300));
    }

    localStorage.setItem(lsKey, String(Date.now()));
  } catch {
    // Never block the auth flow
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, excerpt, content, category, image_url, author, read_time, created_at')
      .eq('category', 'Announcement')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) { console.error('Error fetching announcements:', error); return []; }
    return data || [];
  } catch {
    return [];
  }
}

export interface WalletTx {
  id: string;
  type: 'deposit' | 'withdrawal';
  crypto_symbol: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  created_at: string;
}

export async function getDeposits(): Promise<WalletTx[]> {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('id, type, crypto_symbol, amount, status, tx_hash, from_address, to_address, created_at')
      .eq('user_id', user.id)
      .eq('type', 'deposit')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { console.error('Error fetching deposits:', error); return []; }
    return (data || []) as WalletTx[];
  } catch {
    return [];
  }
}

export async function getWithdrawals(): Promise<WalletTx[]> {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('id, type, crypto_symbol, amount, status, tx_hash, from_address, to_address, created_at')
      .eq('user_id', user.id)
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { console.error('Error fetching withdrawals:', error); return []; }
    return (data || []) as WalletTx[];
  } catch {
    return [];
  }
}

export function subscribeToAnnouncements(
  callback: (announcement: Announcement) => void
): () => void {
  let cleanup: (() => void) | null = null;

  getSupabase()
    .then((supabase) => {
      const channel = supabase
        .channel('announcements')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'blog_posts', filter: `category=eq.Announcement` },
          (payload) => { callback(payload.new as Announcement); }
        )
        .subscribe();
      cleanup = () => { supabase.removeChannel(channel); };
    })
    .catch(() => {});

  return () => { cleanup?.(); };
}
