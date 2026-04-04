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

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { X, ChevronLeft, Send, Loader2, Sparkles } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type View = "home" | "ai-chat";

type AiMessage = { role: "user" | "assistant"; content: string };

/* ─── AI streaming ───────────────────────────────────────────────────────── */

const AI_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pexly-chat`;

async function streamAiChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: AiMessage[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  try {
    const resp = await fetch(AI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      onError((data as { error?: string }).error || "Something went wrong. Please try again.");
      return;
    }

    if (!resp.body) { onError("No response received."); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") { onDone(); return; }
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
    onDone();
  } catch {
    onError("Connection failed. Please try again.");
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   ROOT WIDGET
   ═══════════════════════════════════════════════════════════════════════════ */

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>("home");

  const goHome = useCallback(() => setView("home"), []);
  const openAiChat = useCallback(() => setView("ai-chat"), []);

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
          height: isOpen ? "90dvh" : 0,
          transition: "transform 300ms cubic-bezier(.16,1,.3,1), opacity 300ms cubic-bezier(.16,1,.3,1), height 300ms cubic-bezier(.16,1,.3,1)",
        }}
      >
        {isOpen && (
          <>
            {view === "home" && (
              <HomeView
                onClose={() => setIsOpen(false)}
                onOpenAiChat={openAiChat}
              />
            )}
            {view === "ai-chat" && (
              <AIChatView
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

function HomeView({ onClose, onOpenAiChat }: { onClose: () => void; onOpenAiChat: () => void }) {
  const { user } = useAuth();
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
          <h2 className="text-2xl font-bold text-white leading-tight">Hi {displayName} 👋</h2>
          <p className="text-sm text-white/60 mt-1">How can we help you?</p>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors mt-0.5">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6">
        <button
          onClick={onOpenAiChat}
          className="w-full flex items-center gap-3 bg-[#B4F22E]/8 hover:bg-[#B4F22E]/15 border border-[#B4F22E]/25 hover:border-[#B4F22E]/50 rounded-2xl px-4 py-4 text-left transition-all group"
        >
          <span className="w-10 h-10 rounded-xl bg-[#B4F22E]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#B4F22E]/30 transition-colors">
            <Sparkles className="w-5 h-5 text-[#B4F22E]" />
          </span>
          <div>
            <p className="font-semibold text-sm text-foreground">Ask AI instantly</p>
            <p className="text-xs text-muted-foreground mt-0.5">Get answers in seconds</p>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border">
        <p className="text-[11px] text-center text-muted-foreground">
          Powered by <span className="font-semibold text-foreground">Pexly</span> AI
        </p>
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

/* ═══════════════════════════════════════════════════════════════════════════
   AI CHAT VIEW
   ═══════════════════════════════════════════════════════════════════════════ */

const AI_QUICK_CHIPS = [
  "How do I swap crypto?",
  "How do I stake?",
  "Gift card not delivered",
  "Wallet setup help",
];

function AIChatView({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: AiMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    const upsert = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    await streamAiChat({
      messages: updated,
      onDelta: upsert,
      onDone: () => setIsLoading(false),
      onError: (err) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Sorry, ${err}` },
        ]);
        setIsLoading(false);
      },
    });
  }, [input, isLoading, messages]);

  const isStreaming = isLoading && messages[messages.length - 1]?.role === "assistant";

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
                <Sparkles className="w-4 h-4 text-[#B4F22E]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#B4F22E] rounded-full border-2 border-[#1c1c1c]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">Pexly AI</p>
              <p className="text-[10px] mt-0.5 text-[#B4F22E]">
                {isLoading && !isStreaming ? "Thinking…" : isStreaming ? "Typing…" : "Instant answers · always on"}
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
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B4F22E]/15 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#B4F22E]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Ask me anything</p>
              <p className="text-xs text-muted-foreground mt-1">I know everything about Pexly</p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {AI_QUICK_CHIPS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-border bg-muted hover:border-[#B4F22E]/40 hover:bg-[#B4F22E]/8 px-3 py-1 text-xs text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div key={i} className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-[#B4F22E]/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-[#B4F22E]" />
                </div>
              )}
              <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? "bg-[#B4F22E] text-black rounded-br-sm font-medium"
                      : "bg-muted border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* Streaming / thinking indicator */}
        {isLoading && !isStreaming && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-[#B4F22E]/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-[#B4F22E]" />
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
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 border border-border focus-within:border-[#B4F22E]/50 transition-colors"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Pexly AI…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-7 h-7 rounded-full bg-[#B4F22E] flex items-center justify-center transition-all disabled:opacity-30 hover:bg-[#c8ff44] active:scale-95"
          >
            {isLoading && !isStreaming ? (
              <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-black" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

