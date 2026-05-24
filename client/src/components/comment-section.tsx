import { useState } from "react";
import { MessageSquare, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Comment {
  id:     string;
  author: string;
  text:   string;
  ts:     number;
}

interface Props {
  marketId:        string;
  isAuthenticated: boolean;
  commentCount?:   number;
}

export function CommentSection({ isAuthenticated, commentCount }: Props) {
  const [comments,     setComments]     = useState<Comment[]>([]);
  const [text,         setText]         = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setComments(prev => [
        {
          id:     crypto.randomUUID(),
          author: "You",
          text:   text.trim(),
          ts:     Date.now(),
        },
        ...prev,
      ]);
      setText("");
      setSubmitting(false);
    }, 300);
  }

  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-bold">Comments</span>
        {(commentCount ?? 0) > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {(commentCount! + comments.length).toLocaleString()}
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
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
              placeholder="Share your thoughts on this market…"
              rows={2}
              className={cn(
                "flex-1 resize-none rounded-xl border border-border bg-muted/40 px-3.5 py-2.5",
                "text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
                "transition-all",
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
              <span className="font-semibold text-foreground">Sign in</span> to join the discussion
            </p>
          </div>
        )}
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <MessageSquare className="w-8 h-8 opacity-20" />
          <p className="text-sm">No comments yet. Be the first to share your thoughts.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">
                  {c.author.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{c.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(c.ts, "MMM d · h:mm a")}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                  {c.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
