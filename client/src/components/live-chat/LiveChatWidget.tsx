/**
 * LiveChatWidget — Intercom-style in-app support chat
 *
 * Architecture:
 *  - Floating FAB button → slide-in panel (right desktop / bottom mobile)
 *  - Home view   : greeting + previous conversations
 *  - Chat view   : real-time message thread via Supabase Realtime
 *  - Bot layer   : keyword-matched auto-reply with typing indicator
 *
 * Supabase tables required (run in SQL editor):
 * ─────────────────────────────────────────────
 *   create table support_conversations (
 *     id uuid default gen_random_uuid() primary key,
 *     user_id uuid references auth.users,
 *     visitor_id text,
 *     status text default 'open',
 *     last_message text,
 *     last_message_at timestamptz default now(),
 *     created_at timestamptz default now()
 *   );
 *
 *   create table support_messages (
 *     id uuid default gen_random_uuid() primary key,
 *     conversation_id uuid references support_conversations not null,
 *     content text not null,
 *     sender_type text not null,   -- 'user' | 'agent' | 'bot'
 *     created_at timestamptz default now()
 *   );
 *
 *   alter publication supabase_realtime add table support_messages;
 *   alter table support_conversations enable row level security;
 *   alter table support_messages enable row level security;
 *   create policy "open" on support_conversations for all using (true) with check (true);
 *   create policy "open" on support_messages for all using (true) with check (true);
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, Send, Loader2, MessageSquare, Clock } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type View = "home" | "conversation";

interface Message {
  id: string;
  content: string;
  sender_type: "user" | "agent" | "bot";
  created_at: string;
}

interface Conversation {
  id: string;
  last_message: string | null;
  last_message_at: string;
  status: string;
  created_at: string;
}

/* ─── Bot keyword responses ──────────────────────────────────────────────── */

/** Returns "__ESCALATE__" when the user wants a human agent. */
function getBotReply(input: string): string {
  const t = input.toLowerCase();

  /* ── Escalation / human request ── */
  if (/\b(human|agent|real person|customer care|customer support|speak to someone|talk to someone|representative|live agent|live support|connect me|speak with|talk with|actual person)\b/.test(t))
    return "__ESCALATE__";

  /* ── Greetings ── */
  if (/\b(hi|hello|hey|hiya|howdy|good morning|good afternoon|good evening)\b/.test(t))
    return "Hi there! 👋 Welcome to Pexly support. I'm here to help with anything about our platform — swaps, staking, gift cards, mobile top-ups, wallet, and more. What can I help you with?";

  /* ── What is Pexly / about ── */
  if (/\b(what is pexly|about pexly|what does pexly|how does pexly work|tell me about|what can pexly)\b/.test(t))
    return "Pexly is a non-custodial decentralised platform. You keep full custody of your assets at all times — we never hold your funds. Features include: crypto swaps across 10+ blockchains, staking for yield, gift card purchases, mobile top-ups, utility bill payments, a blockchain explorer, and a Web3 shop. All from one place. 🌍";

  /* ── Swap ── */
  if (/\b(swap|exchange|convert|cross.?chain|bridge)\b/.test(t))
    return "Our Swap feature lets you exchange cryptocurrencies across 10+ blockchains — BTC, ETH, USDT, USDC, SOL, BNB, TRX, XRP, and more. It's fully non-custodial, meaning your assets go directly to your wallet. You'll see the exact rate and network fee before confirming. Head to the Swap page to get started! 🔄";

  /* ── Staking ── */
  if (/\b(stak|yield|earn|apy|apr|interest|passive)\b/.test(t))
    return "Pexly's Staking feature lets you earn yield on your crypto through Stader Labs — a trusted liquid staking protocol. You can stake ETH, BNB, MATIC, FTM, and HBAR. Staking is non-custodial: you get liquid staking tokens (like MaticX or BNBx) that you can unstake any time. Visit the Earn page to see live APY rates! 📈";

  /* ── Gift cards ── */
  if (/\b(gift card|giftcard|voucher|redeem|gift code)\b/.test(t))
    return "Our Gift Cards feature lets you buy digital gift cards using crypto — instantly, with no KYC needed for most purchases. We support hundreds of brands including Amazon, Google Play, Apple, Steam, and more across 140+ countries. Go to the Gift Cards page, pick your brand and amount, and pay with any supported crypto. 🎁";

  /* ── Mobile top-up / airtime ── */
  if (/\b(mobile|airtime|top.?up|top up|recharge|phone|data plan|sim)\b/.test(t))
    return "With Mobile Top-Up, you can recharge any mobile number worldwide using crypto — no account needed. We support thousands of operators in 140+ countries. Just enter the phone number, pick a data or airtime plan, and pay with crypto. It's instant! Visit the Mobile Top-Up page to get started. 📱";

  /* ── Utility bills ── */
  if (/\b(utility|bill|electricity|water|internet|cable|tv|energy|power|gas bill|dstv|gotv)\b/.test(t))
    return "The Utility Bills feature lets you pay electricity, water, internet, TV subscriptions, and more using crypto — covering providers in 100+ countries. Go to the Bills page, select your country and service provider, enter your account number, and pay. It processes in minutes! ⚡";

  /* ── Explorer / blockchain ── */
  if (/\b(explorer|blockchain|block|transaction hash|txid|tx id|address lookup|on.?chain|on chain|view transaction)\b/.test(t))
    return "The Pexly Explorer lets you look up any blockchain transaction, wallet address, or block across multiple chains. Just paste a transaction hash or wallet address into the search bar on the Explorer page. It's a read-only tool — no login needed. 🔍";

  /* ── Wallet ── */
  if (/\b(wallet|send crypto|receive crypto|deposit|withdraw|balance|address|receive address)\b/.test(t))
    return "Pexly's built-in wallet is non-custodial — your private keys are generated and stored securely on your device. You can send and receive BTC, ETH, USDT, SOL, and other supported assets. To get your receive address, go to Wallet → Receive. For sending, use Wallet → Send and double-check the address before confirming, as crypto transfers are irreversible.";

  /* ── Transaction / transfer issues ── */
  if (/\b(transaction|transfer|missing|not arrived|stuck|pending|delayed|lost)\b/.test(t))
    return "If a transaction is pending or hasn't arrived, please check the Explorer using your transaction hash to see its on-chain status. Delays are usually caused by network congestion. If it's been over 2 hours and the transaction shows confirmed on-chain but funds aren't in your wallet, please share the transaction ID and our team will look into it. 🔎";

  /* ── Market / prices ── */
  if (/\b(price|market|chart|btc price|eth price|usdt|markets|spot|perpetual|futures)\b/.test(t))
    return "You can track live crypto prices on the Markets page, which shows real-time prices, charts, and market cap data for hundreds of assets. We also have a Spot trading interface and Perpetual contracts for more advanced trading. Visit the Markets or Trade tabs at the top of the app! 📊";

  /* ── Shop ── */
  if (/\b(shop|shopping|product|buy with crypto|store|purchase)\b/.test(t))
    return "The Pexly Shop lets you buy real products using cryptocurrency — from electronics and fashion to everyday essentials. Browse the Shop page, add items to your cart, and check out with your preferred crypto. It's a seamless Web3 shopping experience! 🛍️";

  /* ── Non-custodial / security / keys ── */
  if (/\b(non.?custodial|custody|keys|private key|seed phrase|mnemonic|self.?custody|your keys|safe|secure|safety)\b/.test(t))
    return "Pexly is 100% non-custodial — we never hold your funds or private keys. Your wallet keys are generated on your device and only you have access to them. Always back up your seed phrase offline and never share it with anyone, including Pexly support staff. 🔒";

  /* ── Fees ── */
  if (/\b(fee|fees|cost|charge|commission|how much does it cost)\b/.test(t))
    return "Pexly charges no platform fees on most features. For swaps, you pay only the network (gas) fee and a small liquidity provider spread, which is shown before you confirm. Gift cards, mobile top-ups, and utility bills include the provider's processing cost in the displayed price — no hidden fees. Check each feature page for the exact breakdown before confirming. 💰";

  /* ── Account / verification / KYC ── */
  if (/\b(account|verify|kyc|identity|document|id verification|passport|selfie)\b/.test(t))
    return "Account verification on Pexly is quick. For basic features you only need an email. For higher limits and advanced features, identity verification (KYC) may be required — you'll need a government-issued ID and a selfie. Verification usually takes 24–48 hours. Go to Settings → Verification to check your current level and submit documents. ✅";

  /* ── Login / password / 2FA ── */
  if (/\b(password|login|sign in|sign up|access|locked|reset|2fa|two.?factor|authenticator|passkey)\b/.test(t))
    return "For login issues, use the 'Forgot Password' link on the sign-in page to reset via email. If you have 2FA enabled and lost access to your authenticator app, you'll need to go through account recovery — please contact support with your registered email and proof of identity. We also support Passkeys for faster, passwordless sign-in. 🔑";

  /* ── Bug / error / broken ── */
  if (/\b(bug|error|broken|crash|issue|not working|problem|glitch|loading|blank|white screen|failed)\b/.test(t))
    return "Sorry something isn't working right! Please describe what you're seeing (any error message, which page, what you were trying to do) and we'll investigate right away. A screenshot or screen recording is very helpful if you can share one. 🐛";

  /* ── Refund / dispute / fraud ── */
  if (/\b(refund|scam|fraud|unauthorized|hacked|suspicious|stolen)\b/.test(t))
    return "This sounds serious and we take it very seriously. Please provide your account email, a description of what happened, and any transaction IDs involved. A senior agent will review your case as a priority. You can also email us directly at support@pexly.app. 🚨";

  /* ── Default ── */
  return "Thanks for reaching out! 🙏 I'm not sure I fully understood that. Could you provide more detail? If you need anything specific about swaps, staking, gift cards, mobile top-ups, utility bills, the explorer, or your wallet — I'm here to help. Or type 'speak to an agent' to connect with a human. 💬";
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getOrCreateVisitorId(): string {
  const key = "pexly_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86_400_000) return formatTime(iso);
  if (diff < 604_800_000)
    return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT WIDGET
   ═══════════════════════════════════════════════════════════════════════════ */

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [conversationId, setConversationId] = useState<string | null>(null);

  const openConversation = useCallback((id: string) => {
    setConversationId(id);
    setView("conversation");
  }, []);

  const goHome = useCallback(() => {
    setView("home");
    setConversationId(null);
  }, []);

  return (
    <>
      {/* ── Floating button ── */}
      <FloatingButton isOpen={isOpen} onClick={() => setIsOpen((v) => !v)} />

      {/* ── Backdrop (mobile) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Slide-in panel ── */}
      <div
        className={`fixed z-50 flex flex-col bg-card border border-border shadow-2xl
          bottom-0 left-0 right-0 rounded-t-[24px]
          sm:bottom-6 sm:right-6 sm:left-auto sm:rounded-[20px] sm:w-[380px] sm:max-h-[600px]
          ${isOpen
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-full opacity-0 pointer-events-none sm:translate-y-2 sm:opacity-0"
          }`}
        style={{
          height: isOpen ? "75dvh" : 0,
          transition: "transform 300ms cubic-bezier(.16,1,.3,1), opacity 300ms cubic-bezier(.16,1,.3,1), height 300ms cubic-bezier(.16,1,.3,1)",
        }}
      >
        {isOpen && (
          <>
            {view === "home" && (
              <HomeView
                onClose={() => setIsOpen(false)}
                onOpenConversation={openConversation}
              />
            )}
            {view === "conversation" && conversationId && (
              <ConversationView
                conversationId={conversationId}
                onBack={goHome}
                onClose={() => setIsOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FLOATING BUTTON
   ═══════════════════════════════════════════════════════════════════════════ */

function FloatingButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="fixed bottom-6 right-6 z-50"
      style={{ animation: "fcb-in .4s cubic-bezier(.16,1,.3,1) both" }}
    >
      <style>{`
        @keyframes fcb-in { from { opacity:0; transform:translateY(12px) scale(.92); } to { opacity:1; transform:none; } }
        @keyframes fcb-label { from { opacity:0; max-width:0; margin-left:0; } to { opacity:1; max-width:120px; margin-left:10px; } }
        .fcb-label { animation: fcb-label .22s cubic-bezier(.16,1,.3,1) forwards; overflow:hidden; white-space:nowrap; }
      `}</style>
      <button
        type="button"
        aria-label={isOpen ? "Close support chat" : "Open support chat"}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: 52,
          minWidth: 52,
          padding: hovered && !isOpen ? "0 18px 0 14px" : "0",
          borderRadius: 9999,
          background: isOpen
            ? "linear-gradient(145deg,#1c1c1c 0%,#111 100%)"
            : hovered
              ? "linear-gradient(145deg,#1c1c1c 0%,#111 100%)"
              : "linear-gradient(145deg,#1a1a1a 0%,#0f0f0f 100%)",
          boxShadow: hovered
            ? "0 1px 2px rgba(0,0,0,.08),0 4px 12px rgba(0,0,0,.14),0 12px 32px rgba(0,0,0,.18)"
            : "0 1px 2px rgba(0,0,0,.06),0 2px 8px rgba(0,0,0,.10),0 6px 20px rgba(0,0,0,.12)",
          border: "1px solid rgba(255,255,255,.09)",
          transform: hovered ? "translateY(-2px)" : "none",
          transition: "transform .2s,box-shadow .2s,padding .22s cubic-bezier(.16,1,.3,1),background .2s",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "transform .2s",
            transform: isOpen ? "rotate(90deg) scale(1.05)" : hovered ? "scale(1.08)" : "none",
          }}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white/90" />
          ) : (
            <svg width="26" height="26" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd" clipRule="evenodd"
                d="M2 5.5A3.5 3.5 0 0 1 5.5 2h9A3.5 3.5 0 0 1 18 5.5v7A3.5 3.5 0 0 1 14.5 16H11l-3.2 2.4A.75.75 0 0 1 6.75 18v-2H5.5A3.5 3.5 0 0 1 2 12.5v-7Z"
                fill="white" opacity=".92"
              />
              <circle cx="7" cy="9" r="1.1" fill="#0f0f0f" />
              <circle cx="10" cy="9" r="1.1" fill="#0f0f0f" />
              <circle cx="13" cy="9" r="1.1" fill="#0f0f0f" />
            </svg>
          )}
        </span>
        {hovered && !isOpen && (
          <span className="fcb-label" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.9)", letterSpacing: "-.01em" }}>
            Chat with us
          </span>
        )}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOME VIEW
   ═══════════════════════════════════════════════════════════════════════════ */

function HomeView({
  onClose,
  onOpenConversation,
}: {
  onClose: () => void;
  onOpenConversation: (id: string) => void;
}) {
  const { user } = useAuth();
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const visitorId = getOrCreateVisitorId();

  useEffect(() => {
    (async () => {
      try {
        let q = supabase
          .from("support_conversations")
          .select("id,last_message,last_message_at,status,created_at")
          .order("last_message_at", { ascending: false })
          .limit(8);

        if (user?.id) {
          q = q.eq("user_id", user.id);
        } else {
          q = q.eq("visitor_id", visitorId);
        }

        const { data } = await q;
        setConversations((data as Conversation[]) ?? []);
      } catch {
        /* table may not exist yet — silently handled */
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const startConversation = async () => {
    setStarting(true);
    try {
      const payload: Record<string, string> = {};
      if (user?.id) payload.user_id = user.id;
      else payload.visitor_id = visitorId;

      const { data, error } = await supabase
        .from("support_conversations")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      const convId = (data as { id: string }).id;

      await supabase.from("support_messages").insert({
        conversation_id: convId,
        content: `Hi ${user?.email?.split("@")[0] ?? "there"}! 👋 Welcome to Pexly support. How can we help you today?`,
        sender_type: "bot",
      });

      onOpenConversation(convId);
    } catch {
      onOpenConversation("demo");
    } finally {
      setStarting(false);
    }
  };

  const displayName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-start justify-between px-5 pt-6 pb-8 rounded-t-[24px] sm:rounded-t-[20px] flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#141414 0%,#1c1c1c 100%)" }}
      >
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5">Pexly Support</p>
          <h2 className="text-2xl font-bold text-white leading-tight">
            Hi {displayName} 👋
          </h2>
          <p className="text-sm text-white/60 mt-1">How can we help you?</p>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors mt-0.5">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* New conversation CTA */}
        <button
          onClick={startConversation}
          disabled={starting}
          className="w-full flex items-center gap-3 bg-muted hover:bg-muted/80 border border-border rounded-2xl px-4 py-3.5 text-left transition-all hover:border-[#B4F22E]/40 group"
        >
          <span className="w-9 h-9 rounded-xl bg-[#B4F22E]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#B4F22E]/25 transition-colors">
            {starting ? (
              <Loader2 className="w-4 h-4 text-[#B4F22E] animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4 text-[#B4F22E]" />
            )}
          </span>
          <div>
            <p className="font-semibold text-sm text-foreground">Send us a message</p>
            <p className="text-xs text-muted-foreground mt-0.5">We reply within 2 hours</p>
          </div>
        </button>

        {/* Previous conversations */}
        {!loading && conversations.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
              Previous conversations
            </p>
            <div className="space-y-1.5">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onOpenConversation(c.id)}
                  className="w-full flex items-center gap-3 bg-muted/50 hover:bg-muted border border-border rounded-xl px-4 py-3 text-left transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-[#B4F22E]/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-[#B4F22E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate font-medium">
                      {c.last_message ?? "Conversation started"}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                      <p className="text-[11px] text-muted-foreground">{formatDate(c.last_message_at)}</p>
                    </div>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      c.status === "open" ? "bg-[#B4F22E]" : "bg-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border">
        <p className="text-[11px] text-center text-muted-foreground">
          Powered by <span className="font-semibold text-foreground">Pexly</span> Support
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONVERSATION VIEW
   ═══════════════════════════════════════════════════════════════════════════ */

function ConversationView({
  conversationId,
  onBack,
  onClose,
}: {
  conversationId: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const visitorId = getOrCreateVisitorId();

  /* Load existing messages */
  useEffect(() => {
    if (conversationId === "demo") {
      setMessages([{
        id: "demo-1",
        content: "Hi! 👋 Welcome to Pexly support. How can we help you today?",
        sender_type: "bot",
        created_at: new Date().toISOString(),
      }]);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("id,content,sender_type,created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) ?? []);
    })();
  }, [conversationId]);

  /* Subscribe to new messages via Supabase Realtime */
  useEffect(() => {
    if (conversationId === "demo") return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  /* Auto-scroll on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    const optimisticId = crypto.randomUUID();
    const optimistic: Message = {
      id: optimisticId,
      content: text,
      sender_type: "user",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      if (conversationId !== "demo") {
        await supabase.from("support_messages").insert({
          conversation_id: conversationId,
          content: text,
          sender_type: "user",
        });

        await supabase
          .from("support_conversations")
          .update({ last_message: text, last_message_at: new Date().toISOString() })
          .eq("id", conversationId);
      }

      /* Bot auto-reply */
      setBotTyping(true);
      await delay(1200 + Math.random() * 600);
      setBotTyping(false);

      const botResult = getBotReply(text);

      if (botResult === "__ESCALATE__") {
        /* Mark conversation as escalated in DB */
        if (conversationId !== "demo") {
          await supabase
            .from("support_conversations")
            .update({ status: "escalated" })
            .eq("id", conversationId);
        }
        setEscalated(true);

        const escalateMsg = "I'm connecting you to a customer care agent now. 🧑‍💼 Please hold on — an agent will join this conversation shortly. Our typical response time is under 2 hours. You can also reach us directly at support@pexly.app.";

        if (conversationId !== "demo") {
          await supabase.from("support_messages").insert({
            conversation_id: conversationId,
            content: escalateMsg,
            sender_type: "bot",
          });
        } else {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), content: escalateMsg, sender_type: "bot", created_at: new Date().toISOString() },
          ]);
        }
      } else {
        if (conversationId !== "demo") {
          await supabase.from("support_messages").insert({
            conversation_id: conversationId,
            content: botResult,
            sender_type: "bot",
          });
        } else {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), content: botResult, sender_type: "bot", created_at: new Date().toISOString() },
          ]);
        }
      }
    } catch {
      /* Realtime subscription will add the agent message */
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 flex-shrink-0 rounded-t-[24px] sm:rounded-t-[20px]"
        style={{ background: "linear-gradient(135deg,#141414 0%,#1c1c1c 100%)" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white/50 hover:text-white/90 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#B4F22E]/20 flex items-center justify-center">
                <span className="text-sm font-bold text-[#B4F22E]">P</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1c1c1c]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">Pexly Support</p>
              <p className="text-[10px] mt-0.5" style={{ color: escalated ? "#B4F22E" : "rgba(255,255,255,0.4)" }}>
                {botTyping ? "Typing…" : escalated ? "Connecting you to an agent…" : "Online · replies in ~2h"}
              </p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {/* Escalation banner */}
        {escalated && !botTyping && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-[#B4F22E]/10 border border-[#B4F22E]/30 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B4F22E] animate-pulse" />
              <p className="text-[11px] font-medium text-[#B4F22E]">Agent joining soon · avg. wait ~2h</p>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {botTyping && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-[#B4F22E]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-[#B4F22E]">P</span>
            </div>
            <div className="bg-muted border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-border bg-card rounded-b-[24px] sm:rounded-b-[20px]">
        <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 border border-border focus-within:border-[#B4F22E]/50 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={escalated ? "Message the agent…" : "Message support…"}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            autoFocus
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-7 h-7 rounded-full bg-[#B4F22E] flex items-center justify-center transition-all disabled:opacity-30 hover:bg-[#c8ff44] active:scale-95"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-black" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Message bubble ─────────────────────────────────────────────────────── */

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender_type === "user";

  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar (agent/bot only) */}
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-[#B4F22E]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-[#B4F22E]">P</span>
        </div>
      )}

      <div className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-[#B4F22E] text-black rounded-br-sm font-medium"
              : "bg-muted border border-border text-foreground rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

/* ─── Typing indicator ───────────────────────────────────────────────────── */

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <style>{`
        @keyframes td-bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-5px); } }
        .td { animation: td-bounce 1.2s infinite; }
        .td:nth-child(2) { animation-delay:.2s; }
        .td:nth-child(3) { animation-delay:.4s; }
      `}</style>
      {[0, 1, 2].map((i) => (
        <span key={i} className="td w-1.5 h-1.5 rounded-full bg-muted-foreground/50 block" />
      ))}
    </div>
  );
}

/* ─── Utils ──────────────────────────────────────────────────────────────── */

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
