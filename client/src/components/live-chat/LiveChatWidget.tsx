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

function getBotReply(input: string): string {
  const t = input.toLowerCase();
  if (/\b(hi|hello|hey|hiya|howdy)\b/.test(t))
    return "Hi there! 👋 How can I help you today?";
  if (/\b(fee|fees|cost|charge|rate|commission)\b/.test(t))
    return "Our fees are transparent and competitive. You can view them on the Fees page. Is there a specific fee you'd like to know about?";
  if (/\b(trade|buy|sell|offer|p2p)\b/.test(t))
    return "For trade-related questions, please share your trade ID so we can look into it faster. You can find it in your active trades.";
  if (/\b(wallet|send|receive|deposit|withdraw|transaction)\b/.test(t))
    return "For wallet issues, please describe what happened and include the transaction ID if you have one. Our team will investigate.";
  if (/\b(account|verify|kyc|identity|document|id)\b/.test(t))
    return "For account and verification questions, please make sure your documents are clear and up to date. Verification usually takes 24–48 hours.";
  if (/\b(password|login|sign in|access|locked|reset)\b/.test(t))
    return "For login issues, try the 'Forgot Password' link on the sign-in page. If you're still having trouble, our team can help.";
  if (/\b(bug|error|broken|crash|issue|problem|glitch)\b/.test(t))
    return "Sorry to hear something isn't working! Please describe what you see (including any error messages) and we'll look into it right away.";
  if (/\b(refund|dispute|scam|fraud|chargeback)\b/.test(t))
    return "This sounds urgent. Please provide your trade ID and details of what happened. A senior agent will review this as a priority.";
  return "Thanks for reaching out! 🙏 A support agent will be with you shortly. Our typical response time is under 2 hours.";
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
          bottom-0 left-0 right-0 rounded-t-[24px] max-h-[90dvh]
          sm:bottom-6 sm:right-6 sm:left-auto sm:rounded-[20px] sm:w-[380px] sm:max-h-[600px]
          ${isOpen
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-4 opacity-0 pointer-events-none sm:translate-y-2"
          }`}
        style={{
          height: isOpen ? undefined : 0,
          transition: "transform 300ms cubic-bezier(.16,1,.3,1), opacity 300ms cubic-bezier(.16,1,.3,1)",
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

      const reply = getBotReply(text);

      if (conversationId !== "demo") {
        await supabase.from("support_messages").insert({
          conversation_id: conversationId,
          content: reply,
          sender_type: "bot",
        });
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), content: reply, sender_type: "bot", created_at: new Date().toISOString() },
        ]);
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
              <p className="text-[10px] text-white/40 mt-0.5">
                {botTyping ? "Typing…" : "Online · replies in ~2h"}
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
            placeholder="Message support…"
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
