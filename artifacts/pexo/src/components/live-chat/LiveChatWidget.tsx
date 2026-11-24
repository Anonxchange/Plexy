/**
 * LiveChatWidget — In-app Pexly Support & AI Assistant
 *
 * Architecture:
 *  - Floating FAB button → slide-in panel (right desktop / bottom mobile)
 *  - Persisted session conversation (survives modal close, Home navigation, and page hops)
 *  - Home view   : greeting + categorized & expandable Pexly marketplace FAQs + Help/Contact links
 *  - AI view     : streaming Pexly Assistant with pre-response thinking shimmer,
 *                  mature plain-text formatting, copy/retry actions, page-aware quick chips,
 *                  and contextual Pexly route shortcuts
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  X,
  ChevronLeft,
  Send,
  Loader2,
  Search,
  ArrowRight,
  ArrowDown,
  ArrowUpRight,
  Gift,
  Zap,
  Coins,
  Smartphone,
  ShoppingBag,
  Globe,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Scale,
  Receipt,
  PackageSearch,
  Truck,
  Copy,
  Check,
  RefreshCw,
  RotateCcw,
  Headphones,
  type LucideIcon,
} from "@/lib/icons";

/* ─── Types & Constants ──────────────────────────────────────────────────── */

type View = "home" | "ai-chat";

type ChatRole = "user" | "assistant";

type AiMessage = {
  id: string;
  role: ChatRole;
  content: string;
  isError?: boolean;
};

type ApiMessage = {
  role: ChatRole;
  content: string;
};

type PendingPrompt = {
  id: number;
  text: string;
};

type PageContext = "gift-cards" | "topup" | "shop" | "general";

const AI_AVATAR_SRC = "/assets/aistudio/support-avatar-3d-512_e954ed41.webp?v=2";
const AI_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pexly-chat`;
const MIN_THINKING_MS = 450;
const CHAT_STORAGE_KEY = "pexly.livechat.messages.v1";
const MAX_STORED_MESSAGES = 40;

function makeMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ─── Session Persistence Helpers ────────────────────────────────────────── */

function loadStoredMessages(): AiMessage[] {
  try {
    const raw = window.sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m): m is AiMessage =>
          Boolean(m) &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      )
      .slice(-MAX_STORED_MESSAGES)
      .map((m) => ({
        id: typeof m.id === "string" ? m.id : makeMessageId(),
        role: m.role,
        content: m.content,
        isError: Boolean(m.isError),
      }));
  } catch {
    return [];
  }
}

function saveStoredMessages(messages: AiMessage[]): void {
  try {
    if (messages.length === 0) {
      window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)),
      );
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

/* ─── AI Streaming ───────────────────────────────────────────────────────── */

async function streamAiChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: ApiMessage[];
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

    if (!resp.body) {
      onError("No response received.");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buff = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buff += decoder.decode(value, { stream: true });
      const lines = buff.split("\n");
      buff = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;
        try {
          const json = JSON.parse(raw);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) onDelta(delta);
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
    onDone();
  } catch (err: unknown) {
    onError(err instanceof Error ? err.message : "Network error. Please try again.");
  }
}

/* ─── Mature Text Formatting & Clipboard Cleanup ─────────────────────────── */

function toPlainClipboardText(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderInlineSegments(text: string): ReactNode[] {
  const cleaned = text.replace(/`([^`]+)`/g, "$1");
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|__([^_]+)__/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      const plain = cleaned.slice(lastIndex, match.index).replace(/\*\*/g, "").replace(/\*/g, "");
      if (plain) nodes.push(plain);
    }
    const boldText = (match[1] ?? match[2] ?? "").replace(/\*\*/g, "").replace(/\*/g, "");
    if (boldText) {
      nodes.push(
        <strong key={`b-${key++}`} className="font-semibold text-foreground">
          {boldText}
        </strong>,
      );
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    const tail = cleaned.slice(lastIndex).replace(/\*\*/g, "").replace(/\*/g, "");
    if (tail) nodes.push(tail);
  }

  return nodes.length ? nodes : [cleaned.replace(/\*\*/g, "").replace(/\*/g, "")];
}

function FormattedAssistantMessage({ content }: { content: string }) {
  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) return null;

  const blocks = normalized.split(/\n\n+/);

  return (
    <div className="space-y-2 text-[13.5px] leading-[1.55] text-foreground">
      {blocks.map((block, bIdx) => {
        const lines = block
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        const isBulletList = lines.length > 0 && lines.every((l) => /^([-*•]|\d+\.)\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-1">
              {lines.map((line, lIdx) => {
                const ordered = line.match(/^(\d+\.)\s+(.*)$/);
                const bulletText = line.replace(/^([-*•]|\d+\.)\s+/, "");
                return (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className="mt-[2px] flex-shrink-0 text-xs font-semibold text-muted-foreground">
                      {ordered ? ordered[1] : "•"}
                    </span>
                    <span className="min-w-0 flex-1">{renderInlineSegments(bulletText)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <div key={bIdx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              if (/^#{1,6}\s+/.test(line)) {
                const heading = line.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "").replace(/\*/g, "");
                return (
                  <p key={lIdx} className="font-semibold text-foreground">
                    {heading}
                  </p>
                );
              }
              const listMatch = line.match(/^([-*•]|\d+\.)\s+(.*)$/);
              if (listMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1">
                    <span className="mt-[2px] flex-shrink-0 text-xs font-semibold text-muted-foreground">
                      {/^\d+\./.test(listMatch[1]) ? listMatch[1] : "•"}
                    </span>
                    <span className="min-w-0 flex-1">{renderInlineSegments(listMatch[2])}</span>
                  </div>
                );
              }
              return <p key={lIdx}>{renderInlineSegments(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Context & Direct Navigation Shortcuts ──────────────────────────────── */

type RouteAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

function getPageContext(pathname: string): PageContext {
  if (pathname.startsWith("/gift-cards")) return "gift-cards";
  if (pathname.startsWith("/mobile-topup")) return "topup";
  if (pathname.startsWith("/shop")) return "shop";
  return "general";
}

function getSuggestedRoutes(userText: string, assistantText: string, isError?: boolean): RouteAction[] {
  const combined = `${userText} ${assistantText}`.toLowerCase();
  const actions: RouteAction[] = [];

  const pushUnique = (action: RouteAction) => {
    if (!actions.some((a) => a.href === action.href)) {
      actions.push(action);
    }
  };

  if (
    isError ||
    /(missing|not arrived|hasn't arrived|didn't arrive|refund|dispute|human|agent|ticket|support|failed|problem|issue|stuck)/.test(
      combined,
    )
  ) {
    pushUnique({ label: "Contact Support", href: "/contact", icon: Headphones });
  }

  if (/(gift card|giftcard|voucher|redeem|pin|digital code|brand)/.test(combined)) {
    pushUnique({ label: "Browse Gift Cards", href: "/gift-cards", icon: Gift });
  }

  if (/(top-up|top up|topup|airtime|mobile data|carrier|recharge)/.test(combined)) {
    pushUnique({ label: "Mobile Top-Up", href: "/mobile-topup", icon: Smartphone });
  }

  if (/(shop|physical|shipping|delivery tracking|merchandise|product order)/.test(combined)) {
    pushUnique({ label: "Open Shop", href: "/shop", icon: ShoppingBag });
  }

  if (/(wallet|connect|metamask|reown|balance|usdt|usdc|btc|eth|sol)/.test(combined)) {
    pushUnique({ label: "Open Wallet", href: "/wallet", icon: Wallet });
  }

  if (/(checkout|cart|pay now|complete order)/.test(combined)) {
    pushUnique({ label: "Go to Checkout", href: "/checkout", icon: Receipt });
  }

  if (/(refund policy|dispute resolution)/.test(combined)) {
    pushUnique({ label: "Refund Policy", href: "/refund-policy", icon: Scale });
  }

  return actions.slice(0, 2);
}

/* ─── Assistant Profile Avatar ───────────────────────────────────────────── */

function AssistantAvatar({
  size = "sm",
  thinking = false,
  showOnline = false,
}: {
  size?: "xs" | "sm" | "md" | "lg";
  thinking?: boolean;
  showOnline?: boolean;
}) {
  const sizeClass =
    size === "lg"
      ? "w-14 h-14"
      : size === "md"
        ? "w-10 h-10"
        : size === "sm"
          ? "w-9 h-9"
          : "w-7 h-7";

  return (
    <div className={`relative flex-shrink-0 ${sizeClass}`}>
      {thinking && (
        <span
          aria-hidden="true"
          className="pexly-ai-ring absolute -inset-[3px] rounded-full pointer-events-none"
        />
      )}
      <div className="relative w-full h-full rounded-full overflow-hidden">
        <img
          src={AI_AVATAR_SRC}
          alt="Pexly Support Assistant"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
      {showOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#B4F22E] rounded-full border-2 border-[#141414] dark:border-[#0f0f0f]" />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN WIDGET COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function LiveChatWidget() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [messages, setMessages] = useState<AiMessage[]>(() => loadStoredMessages());
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt | null>(null);
  const promptIdRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const pageContext = useMemo(() => getPageContext(location), [location]);

  // Persist messages in sessionStorage whenever they change
  useEffect(() => {
    saveStoredMessages(messages);
  }, [messages]);

  // Close panel on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Lock background page scroll on mobile bottom-sheet view while open
  useEffect(() => {
    if (!isOpen) return;
    const mq = window.matchMedia("(max-width: 639px)");
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    const syncLock = () => {
      if (mq.matches) {
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        html.style.overscrollBehavior = "none";
        body.style.overscrollBehavior = "none";
      } else {
        html.style.overflow = prevHtmlOverflow;
        body.style.overflow = prevBodyOverflow;
        html.style.overscrollBehavior = prevHtmlOverscroll;
        body.style.overscrollBehavior = prevBodyOverscroll;
      }
    };

    syncLock();
    mq.addEventListener("change", syncLock);
    return () => {
      mq.removeEventListener("change", syncLock);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, [isOpen]);

  // Prevent wheel & touch scroll chaining from inside the modal to the page behind it
  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;

    const findScrollableParent = (target: EventTarget | null): HTMLElement | null => {
      let el = target instanceof HTMLElement ? target : null;
      while (el && el !== panel) {
        const style = window.getComputedStyle(el);
        const canScrollY =
          (style.overflowY === "auto" || style.overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight;
        if (canScrollY) return el;
        el = el.parentElement;
      }
      return null;
    };

    const onWheel = (e: WheelEvent) => {
      const scrollable = findScrollableParent(e.target);
      if (!scrollable) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const atTop = scrollable.scrollTop <= 0 && e.deltaY < 0;
      const atBottom =
        scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1 &&
        e.deltaY > 0;
      if (atTop || atBottom) {
        e.preventDefault();
      }
      e.stopPropagation();
    };

    const onTouchMove = (e: TouchEvent) => {
      const scrollable = findScrollableParent(e.target);
      if (!scrollable) {
        e.preventDefault();
      }
      e.stopPropagation();
    };

    panel.addEventListener("wheel", onWheel, { passive: false });
    panel.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      panel.removeEventListener("wheel", onWheel);
      panel.removeEventListener("touchmove", onTouchMove);
    };
  }, [isOpen]);

  const goHome = useCallback(() => {
    setView("home");
    setPendingPrompt(null);
  }, []);

  const openAiChat = useCallback((initialMessage?: string) => {
    if (initialMessage?.trim()) {
      promptIdRef.current += 1;
      setPendingPrompt({ id: promptIdRef.current, text: initialMessage.trim() });
    } else {
      setPendingPrompt(null);
    }
    setView("ai-chat");
  }, []);

  const handleClearPrompt = useCallback(() => {
    setPendingPrompt(null);
  }, []);

  const handleResetChat = useCallback(() => {
    setMessages([]);
    setPendingPrompt(null);
  }, []);

  const handleNavigate = useCallback(
    (href: string) => {
      setLocation(href);
      setIsOpen(false);
    },
    [setLocation],
  );

  return (
    <>
      <style>{`
        @keyframes pexly-ai-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pexly-shimmer-sweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pexly-dot-pulse {
          0%, 80%, 100% { opacity: 0.28; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1.1); }
        }
        .pexly-ai-ring {
          background: conic-gradient(from 0deg, #B4F22E, rgba(180,242,46,0.18), #14924f, #B4F22E);
          animation: pexly-ai-spin 1.15s linear infinite;
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
        }
        .pexly-shimmer-line {
          background: linear-gradient(90deg, rgba(120,130,126,0.14) 0%, rgba(180,242,46,0.28) 50%, rgba(120,130,126,0.14) 100%);
          background-size: 200% 100%;
          animation: pexly-shimmer-sweep 1.4s ease-in-out infinite;
        }
        .pexly-think-dot {
          animation: pexly-dot-pulse 1.2s ease-in-out infinite;
        }
        .pexly-think-dot:nth-child(2) { animation-delay: 0.2s; }
        .pexly-think-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {/* ── Floating button ── */}
      <FloatingButton isOpen={isOpen} onClick={() => setIsOpen((v) => !v)} />

      {/* ── Backdrop (mobile) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden touch-none overscroll-none"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Slide-in panel ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Pexly Support Chat"
        aria-hidden={!isOpen}
        className={`fixed z-50 flex flex-col bg-card border border-border shadow-2xl overscroll-contain
          bottom-0 left-0 right-0 rounded-t-[24px] max-h-[92dvh]
          sm:bottom-6 sm:right-6 sm:left-auto sm:rounded-[20px] sm:w-[430px] lg:w-[450px] sm:max-w-[calc(100vw-3rem)] sm:max-h-[calc(100dvh-3rem)]
          ${
            isOpen
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-full opacity-0 pointer-events-none sm:translate-y-2 sm:opacity-0"
          }`}
        style={{
          height: isOpen ? "clamp(540px, 84dvh, 820px)" : 0,
          transition:
            "transform 300ms cubic-bezier(.16,1,.3,1), opacity 300ms cubic-bezier(.16,1,.3,1), height 300ms cubic-bezier(.16,1,.3,1)",
        }}
      >
        {isOpen && (
          <>
            {view === "home" && (
              <HomeView
                messageCount={messages.length}
                onClose={() => setIsOpen(false)}
                onOpenAiChat={openAiChat}
              />
            )}
            {view === "ai-chat" && (
              <AIChatView
                pageContext={pageContext}
                messages={messages}
                setMessages={setMessages}
                pendingPrompt={pendingPrompt}
                onClearPendingPrompt={handleClearPrompt}
                onResetChat={handleResetChat}
                onNavigate={handleNavigate}
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
          background:
            isOpen || hovered
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 5.5A3.5 3.5 0 0 1 5.5 2h9A3.5 3.5 0 0 1 18 5.5v7A3.5 3.5 0 0 1 14.5 16H11l-3.2 2.4A.75.75 0 0 1 6.75 18v-2H5.5A3.5 3.5 0 0 1 2 12.5v-7Z"
                fill="white"
                opacity=".92"
              />
              <circle cx="7" cy="9" r="1.1" fill="#0f0f0f" />
              <circle cx="10" cy="9" r="1.1" fill="#0f0f0f" />
              <circle cx="13" cy="9" r="1.1" fill="#0f0f0f" />
            </svg>
          )}
        </span>
        {hovered && !isOpen && (
          <span className="fcb-label text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
            Need help?
          </span>
        )}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOME VIEW
   ═══════════════════════════════════════════════════════════════════════════ */

type FaqTopic = {
  question: string;
  icon: LucideIcon;
};

const ALL_FAQS: FaqTopic[] = [
  { question: "How do I buy gift cards with crypto?", icon: Gift },
  { question: "How fast are gift card codes delivered?", icon: Zap },
  { question: "Which cryptocurrencies are accepted at checkout?", icon: Coins },
  { question: "How do mobile airtime and data top-ups work?", icon: Smartphone },
  { question: "How do I order physical products in the Shop?", icon: ShoppingBag },
  { question: "Why do available gift cards vary by country?", icon: Globe },
  { question: "How do I connect my wallet to Pexly?", icon: Wallet },
  { question: "Do I need an account or KYC to buy gift cards?", icon: ShieldCheck },
  { question: "What if my gift card code has not arrived?", icon: AlertCircle },
  { question: "How do refunds and dispute resolution work?", icon: Scale },
  { question: "Are there extra fees when paying from my wallet?", icon: Receipt },
  { question: "How do I track my order or contact support?", icon: PackageSearch },
];

function HomeView({
  messageCount,
  onClose,
  onOpenAiChat,
}: {
  messageCount: number;
  onClose: () => void;
  onOpenAiChat: (initialMessage?: string) => void;
}) {
  const { user } = useAuth();
  const displayName = user?.email?.split("@")[0] ?? "there";
  const [search, setSearch] = useState("");

  const hasSessionThread = messageCount > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? ALL_FAQS.filter((item) => item.question.toLowerCase().includes(q))
      : ALL_FAQS.slice(0, 5);
  }, [search]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header — intentionally dark/branded in both themes */}
      <div className="px-5 pt-5 pb-6 rounded-t-[24px] sm:rounded-t-[20px] flex-shrink-0 bg-[#141414] dark:bg-[#0f0f0f]">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Pexly Support</p>
          <button
            type="button"
            aria-label="Close support chat"
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors -mt-0.5"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <h2 className="text-[24px] font-bold text-white/50 leading-tight">Hello {displayName}</h2>
        <h2 className="text-[24px] font-bold text-white leading-tight mt-0.5">How can we assist you?</h2>

        {/* Ask / Resume Pexly Assistant CTA */}
        <button
          type="button"
          onClick={() => onOpenAiChat()}
          className="mt-5 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#B4F22E]/40 rounded-2xl px-4 py-3.5 text-left transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <AssistantAvatar size="md" showOnline />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-white">Pexly Assistant</p>
                {hasSessionThread && (
                  <span className="rounded-md bg-[#B4F22E]/15 border border-[#B4F22E]/35 px-1.5 py-0.5 text-[10px] font-semibold text-[#B4F22E] leading-none">
                    Resume
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-0.5 truncate">
                {hasSessionThread
                  ? `Continue active conversation (${messageCount} messages)`
                  : "Gift cards, top-ups, shop & wallet help"}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-white/35 group-hover:text-[#B4F22E] transition-colors flex-shrink-0" />
        </button>
      </div>

      {/* FAQ section — fully theme-aware */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-card">
        {/* Search bar */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5 bg-muted border border-border rounded-xl px-3.5 py-2.5 focus-within:border-[#B4F22E]/50 transition-colors">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gift cards, top-ups, orders…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* FAQ list */}
        <div className="px-4 pb-4">
          {filtered.length === 0 ? (
            <button
              type="button"
              onClick={() => onOpenAiChat(search.trim() || undefined)}
              className="w-full text-xs text-muted-foreground hover:text-foreground text-center py-6 transition-colors"
            >
              No matching topics found — ask Pexly Assistant instead
            </button>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(({ question, icon: Icon }) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => onOpenAiChat(question)}
                  className="w-full flex items-center justify-between py-3 text-left gap-3 group hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-muted border border-border/80 flex items-center justify-center flex-shrink-0 text-muted-foreground group-hover:text-[#14924f] dark:group-hover:text-[#B4F22E] group-hover:border-[#B4F22E]/40 transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-sm text-foreground/90 group-hover:text-foreground transition-colors leading-snug">
                      {question}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-[#14924f] dark:group-hover:text-[#B4F22E] flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-card text-center rounded-b-[24px] sm:rounded-b-[20px]">
        <p className="text-xs text-muted-foreground">Powered by Pexly Support</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRE-RESPONSE THINKING / LOADING SHIMMER BUBBLE
   ═══════════════════════════════════════════════════════════════════════════ */

function ThinkingBubble() {
  return (
    <div
      className="flex items-end gap-2.5"
      role="status"
      aria-live="polite"
      aria-label="Pexly Assistant is preparing a response"
    >
      <AssistantAvatar size="xs" thinking />
      <div className="w-[250px] sm:w-[285px] bg-muted/90 border border-border rounded-2xl rounded-bl-sm px-3.5 py-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="pexly-think-dot w-1.5 h-1.5 rounded-full bg-[#14924f] dark:bg-[#B4F22E]" />
            <span className="pexly-think-dot w-1.5 h-1.5 rounded-full bg-[#14924f] dark:bg-[#B4F22E]" />
            <span className="pexly-think-dot w-1.5 h-1.5 rounded-full bg-[#14924f] dark:bg-[#B4F22E]" />
          </span>
          <span className="text-[11.5px] font-medium text-muted-foreground">Preparing response</span>
        </div>
        <div className="space-y-1.5" aria-hidden="true">
          <div className="pexly-shimmer-line h-2 w-full rounded-full" />
          <div className="pexly-shimmer-line h-2 w-3/4 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AI CHAT VIEW
   ═══════════════════════════════════════════════════════════════════════════ */

type QuickChip = {
  label: string;
  icon: LucideIcon;
};

const QUICK_CHIPS_BY_CONTEXT: Record<PageContext, QuickChip[]> = {
  "gift-cards": [
    { label: "Buy a gift card with crypto", icon: Gift },
    { label: "How fast are gift card codes delivered?", icon: Zap },
    { label: "Why do gift cards vary by country?", icon: Globe },
    { label: "Connect my wallet", icon: Wallet },
  ],
  topup: [
    { label: "Mobile top-up coverage", icon: Smartphone },
    { label: "Supported carriers & data plans", icon: Globe },
    { label: "How fast is airtime delivered?", icon: Zap },
    { label: "Which cryptocurrencies are accepted?", icon: Coins },
  ],
  shop: [
    { label: "Shop order & shipping", icon: Truck },
    { label: "How do I track my order?", icon: PackageSearch },
    { label: "Refunds and dispute resolution", icon: Scale },
    { label: "Pay from connected wallet", icon: Wallet },
  ],
  general: [
    { label: "Buy a gift card with crypto", icon: Gift },
    { label: "Mobile top-up coverage", icon: Smartphone },
    { label: "Shop order & shipping", icon: Truck },
    { label: "Connect my wallet", icon: Wallet },
  ],
};

const EMPTY_SUBTITLE_BY_CONTEXT: Record<PageContext, string> = {
  "gift-cards": "Ask about gift card brands, instant code delivery, regional currency, or wallet checkout.",
  topup: "Ask about supported mobile carriers, airtime & data bundles, or instant top-up delivery.",
  shop: "Ask about physical product orders, shipping timelines, tracking, or returns.",
  general: "Ask about gift card delivery, mobile top-ups, physical orders, or wallet payments.",
};

function AIChatView({
  pageContext,
  messages,
  setMessages,
  pendingPrompt,
  onClearPendingPrompt,
  onResetChat,
  onNavigate,
  onBack,
  onClose,
}: {
  pageContext: PageContext;
  messages: AiMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AiMessage[]>>;
  pendingPrompt: PendingPrompt | null;
  onClearPendingPrompt: () => void;
  onResetChat: () => void;
  onNavigate: (href: string) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingDelay, setIsThinkingDelay] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handledPromptIdRef = useRef<number | null>(null);
  const delayTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const pinnedToBottomRef = useRef(true);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    return () => {
      if (delayTimerRef.current !== null) window.clearTimeout(delayTimerRef.current);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollContainerRef.current;
    pinnedToBottomRef.current = true;
    setShowScrollBottom(false);
    if (!el) return;
    if (behavior === "auto") {
      el.scrollTop = el.scrollHeight;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (pinnedToBottomRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (pinnedToBottomRef.current) {
      scrollToBottom("auto");
    }
  }, [messages, isLoading, isThinkingDelay, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom <= 80;
    pinnedToBottomRef.current = isNearBottom;
    setShowScrollBottom(!isNearBottom);
  }, []);

  const runAssistantRequest = useCallback(
    async (conversationWithUser: AiMessage[]) => {
      setIsLoading(true);
      setIsThinkingDelay(true);
      pinnedToBottomRef.current = true;
      setShowScrollBottom(false);

      if (delayTimerRef.current !== null) {
        window.clearTimeout(delayTimerRef.current);
      }

      const assistantId = makeMessageId();
      let assistantContent = "";
      let delayComplete = false;
      let streamFinished = false;

      const flushToMessages = () => {
        if (!assistantContent.trim()) return;
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === assistantId);
          if (exists) {
            return prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m));
          }
          return [...prev, { id: assistantId, role: "assistant", content: assistantContent }];
        });
      };

      delayTimerRef.current = window.setTimeout(() => {
        delayComplete = true;
        setIsThinkingDelay(false);
        flushToMessages();
        if (streamFinished) {
          setIsLoading(false);
        }
      }, MIN_THINKING_MS);

      const apiMessages: ApiMessage[] = conversationWithUser
        .filter((m) => !m.isError)
        .map(({ role, content }) => ({ role, content }));

      await streamAiChat({
        messages: apiMessages,
        onDelta: (chunk) => {
          assistantContent += chunk;
          if (delayComplete) {
            flushToMessages();
          }
        },
        onDone: () => {
          streamFinished = true;
          if (delayComplete) {
            flushToMessages();
            setIsLoading(false);
          }
        },
        onError: (err) => {
          if (delayTimerRef.current !== null) {
            window.clearTimeout(delayTimerRef.current);
            delayTimerRef.current = null;
          }
          setIsThinkingDelay(false);
          setMessages((prev) => [
            ...prev,
            {
              id: makeMessageId(),
              role: "assistant",
              content: `We ran into an issue completing that request (${err}). You can retry below or reach our support team directly.`,
              isError: true,
            },
          ]);
          setIsLoading(false);
        },
      });
    },
    [setMessages],
  );

  const send = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || isLoading) return;

      const userMsg: AiMessage = { id: makeMessageId(), role: "user", content: text };
      const updated = [...messagesRef.current, userMsg];
      setMessages(updated);
      setInput("");
      await runAssistantRequest(updated);
    },
    [input, isLoading, setMessages, runAssistantRequest],
  );

  const handleRetry = useCallback(
    async (errorIndex: number) => {
      if (isLoading) return;
      const before = messagesRef.current.slice(0, errorIndex);
      if (before.length === 0) return;
      setMessages(before);
      await runAssistantRequest(before);
    },
    [isLoading, setMessages, runAssistantRequest],
  );

  const handleCopy = useCallback((msg: AiMessage) => {
    const clean = toPlainClipboardText(msg.content);
    if (!clean) return;
    navigator.clipboard?.writeText(clean).then(() => {
      setCopiedId(msg.id);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedId((curr) => (curr === msg.id ? null : curr));
      }, 1800);
    }).catch(() => {
      // Ignore clipboard failure in restricted contexts
    });
  }, []);

  // Auto-send incoming FAQ / search prompt cleanly once per prompt id
  useEffect(() => {
    if (
      pendingPrompt &&
      handledPromptIdRef.current !== pendingPrompt.id &&
      !isLoading
    ) {
      handledPromptIdRef.current = pendingPrompt.id;
      const text = pendingPrompt.text;
      onClearPendingPrompt();
      void send(text);
    }
  }, [pendingPrompt, isLoading, onClearPendingPrompt, send]);

  const lastIsAssistant = messages[messages.length - 1]?.role === "assistant";
  const showThinkingBubble = isLoading && (isThinkingDelay || !lastIsAssistant);
  const isStreamingText = isLoading && !isThinkingDelay && lastIsAssistant;
  const quickChips = QUICK_CHIPS_BY_CONTEXT[pageContext];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header — intentionally dark/branded in both themes */}
      <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0 rounded-t-[24px] sm:rounded-t-[20px] bg-[#141414] dark:bg-[#0f0f0f]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back to support topics"
            onClick={onBack}
            className="text-white/55 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <AssistantAvatar size="sm" thinking={showThinkingBubble} showOnline={!showThinkingBubble} />
            <div>
              <p className="text-sm font-semibold text-white leading-none">Pexly Assistant</p>
              <p className="text-[11px] mt-1 text-[#B4F22E]">
                {showThinkingBubble
                  ? "Preparing response..."
                  : isStreamingText
                    ? "Responding..."
                    : "Support Assistant · Online"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && !isLoading && (
            <button
              type="button"
              title="Start new chat"
              aria-label="Start new chat"
              onClick={onResetChat}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-2 py-1 text-[11px] font-medium text-white/75 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>New chat</span>
            </button>
          )}
          <button
            type="button"
            aria-label="Close support chat"
            onClick={onClose}
            className="text-white/45 hover:text-white/85 transition-colors p-0.5"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Messages — fully theme-aware */}
      <div className="relative flex-1 min-h-0 bg-card">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto overscroll-contain px-4 py-4 space-y-3.5"
        >
          {/* Empty state */}
          {messages.length === 0 && !showThinkingBubble && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-4 px-2">
              <AssistantAvatar size="lg" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {pageContext === "gift-cards"
                    ? "Gift Cards Assistant"
                    : pageContext === "topup"
                      ? "Mobile Top-Up Assistant"
                      : pageContext === "shop"
                        ? "Shop & Order Assistant"
                        : "How can I help today?"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
                  {EMPTY_SUBTITLE_BY_CONTEXT[pageContext]}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                {quickChips.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => void send(label)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted hover:border-[#B4F22E]/60 hover:bg-[#B4F22E]/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#14924f] dark:text-[#B4F22E] flex-shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const isLastMessage = i === messages.length - 1;
            const isMessageStreaming = isLastMessage && isStreamingText;
            const prevUserText =
              !isUser && i > 0 && messages[i - 1]?.role === "user"
                ? messages[i - 1].content
                : "";
            const routeActions =
              !isUser && !isMessageStreaming
                ? getSuggestedRoutes(prevUserText, msg.content, msg.isError)
                : [];
            const isCopied = copiedId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isUser && <AssistantAvatar size="xs" />}
                <div className={`max-w-[84%] flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl ${
                      isUser
                        ? "bg-[#B4F22E] text-black rounded-br-sm text-sm font-medium leading-relaxed"
                        : msg.isError
                          ? "bg-destructive/10 border border-destructive/30 text-foreground rounded-bl-sm"
                          : "bg-muted border border-border text-foreground rounded-bl-sm"
                    }`}
                  >
                    {isUser ? msg.content : <FormattedAssistantMessage content={msg.content} />}
                  </div>

                  {/* Completed assistant actions: Copy, Retry, and Direct Marketplace Links */}
                  {!isUser && !isMessageStreaming && (
                    <div className="flex flex-wrap items-center gap-1.5 pl-0.5">
                      {!msg.isError && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-[#14924f] dark:text-[#B4F22E]" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}

                      {msg.isError && !isLoading && (
                        <button
                          type="button"
                          onClick={() => void handleRetry(i)}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted hover:border-[#B4F22E]/60 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      )}

                      {routeActions.map((action) => {
                        const ActionIcon = action.icon;
                        return (
                          <button
                            key={action.href}
                            type="button"
                            onClick={() => onNavigate(action.href)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-card hover:border-[#B4F22E]/60 hover:bg-[#B4F22E]/10 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors"
                          >
                            <ActionIcon className="w-3 h-3 text-[#14924f] dark:text-[#B4F22E]" />
                            <span>{action.label}</span>
                            <ArrowUpRight className="w-2.5 h-2.5 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pre-response loading shimmer effect */}
          {showThinkingBubble && <ThinkingBubble />}

          <div ref={bottomRef} />
        </div>

        {/* Scroll to bottom floating pill */}
        {showScrollBottom && (
          <button
            type="button"
            aria-label="Scroll to latest messages"
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-3 right-4 w-8 h-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-foreground hover:border-[#B4F22E] transition-colors"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Input — fully theme-aware */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-border bg-card rounded-b-[24px] sm:rounded-b-[20px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 border border-border focus-within:border-[#B4F22E]/50 transition-colors"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about an order, gift card, or wallet…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            disabled={isLoading}
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || isLoading}
            className="w-7 h-7 rounded-full bg-[#B4F22E] flex items-center justify-center transition-all disabled:opacity-30 hover:bg-[#c8ff44] active:scale-95"
          >
            {showThinkingBubble ? (
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
