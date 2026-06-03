import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, User, Loader2, ChevronDown } from '@/lib/icons';
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useComments, PolymarketComment } from "@/hooks/use-polymarket";

const PAGE_SIZE = 30;

interface LocalComment {
  id:    string;
  text:  string;
  ts:    number;
  local: true;
}

interface Props {
  eventId:         string | undefined;
  isAuthenticated: boolean;
  commentCount?:   number;
  onSignIn?:       () => void;
}

function Avatar({ profile }: { profile?: PolymarketComment["profile"] }) {
  if (profile?.profileImage) {
    return (
      <img
        src={profile.profileImage}
        alt={profile.name ?? ""}
        className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
      />
    );
  }
  const initial = (profile?.name ?? profile?.pseudonym ?? "?").slice(0, 1).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-xs font-bold text-primary">{initial}</span>
    </div>
  );
}

function CommentRow({ c }: { c: PolymarketComment }) {
  const name = c.profile?.displayUsernamePublic
    ? (c.profile.name ?? c.profile.pseudonym)
    : (c.profile?.pseudonym ?? `${c.userAddress.slice(0, 6)}…`);

  return (
    <div className="flex gap-3 px-5 py-4">
      <Avatar profile={c.profile} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-semibold leading-none">{name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
          </span>
          {c.reactionCount > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">❤️ {c.reactionCount}</span>
          )}
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
          {c.body}
        </p>
      </div>
    </div>
  );
}

export function CommentSection({ eventId, isAuthenticated, commentCount, onSignIn }: Props) {
  const [offset,        setOffset]        = useState(0);
  const [allComments,   setAllComments]   = useState<PolymarketComment[]>([]);
  const [localComments, setLocalComments] = useState<LocalComment[]>([]);
  const [text,          setText]          = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const seenIds = useRef(new Set<string>());

  const { data: page, isFetching, isLoading } = useComments(eventId, offset, PAGE_SIZE);

  // Accumulate pages without duplicates
  useEffect(() => {
    if (!page) return;
    const fresh = page.filter(c => !seenIds.current.has(c.id));
    if (fresh.length === 0) return;
    fresh.forEach(c => seenIds.current.add(c.id));
    setAllComments(prev => offset === 0 ? fresh : [...prev, ...fresh]);
  }, [page, offset]);

  // Reset when event changes
  useEffect(() => {
    seenIds.current = new Set();
    setAllComments([]);
    setOffset(0);
  }, [eventId]);

  const hasMore = (page?.length ?? 0) >= PAGE_SIZE;
  const totalCount = commentCount ?? (allComments.length + localComments.length);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setLocalComments(prev => [{
        id:    crypto.randomUUID(),
        text:  text.trim(),
        ts:    Date.now(),
        local: true,
      }, ...prev]);
      setText("");
      setSubmitting(false);
    }, 300);
  }

  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-bold">Comments</span>
        {totalCount > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {totalCount.toLocaleString()}
          </span>
        )}
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-b border-border">
        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); }
              }}
              placeholder="Share your thoughts on this market…"
              rows={2}
              className={cn(
                "flex-1 resize-none rounded-xl border border-border bg-muted/40 px-3.5 py-2.5",
                "text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all",
              )}
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className={cn(
                "shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all",
                text.trim() && !submitting
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              <button
                className="font-semibold text-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
                onClick={onSignIn}
              >
                Sign in
              </button>
              {" "}to join the discussion
            </p>
          </div>
        )}
      </div>

      {/* Comments list */}
      {isLoading && offset === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading comments…</span>
        </div>
      ) : allComments.length === 0 && localComments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <MessageSquare className="w-8 h-8 opacity-20" />
          <p className="text-sm">No comments yet. Be the first to share your thoughts.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {/* Newly posted local comments first */}
          {localComments.map(c => (
            <div key={c.id} className="flex gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">Y</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">You</span>
                  <span className="text-xs text-muted-foreground">just now</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">{c.text}</p>
              </div>
            </div>
          ))}

          {/* Paginated API comments */}
          {allComments.map(c => <CommentRow key={c.id} c={c} />)}

          {/* Load more */}
          {hasMore && (
            <div className="px-5 py-4 flex justify-center">
              <button
                disabled={isFetching}
                onClick={() => setOffset(prev => prev + PAGE_SIZE)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border transition-all",
                  isFetching
                    ? "text-muted-foreground cursor-not-allowed"
                    : "hover:bg-muted text-foreground",
                )}
              >
                {isFetching
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Loading…</>
                  : <><ChevronDown className="w-4 h-4" />Load more comments</>
                }
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
