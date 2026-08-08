// src/pages/my-numbers.tsx
//
// "My Numbers" — every order the signed-in user has ever made, live SMS code
// polling, cancel, and Reuse (server 1 only, also pay-first).
//
// Route it at /my-numbers — that is the redirect_url korapay-initiate sends
// after payment (`/my-numbers?ref=<reference>`).

import { useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useMyNumbers,
  useCancelOrder,
  useInitiateOrder,
  goToCheckout,
  type SmsOrder,
} from "@/hooks/use-sms-orders";
import {
  Phone, Copy, RefreshCw, Clock, CheckCircle2, XCircle, Loader2, MessageSquare,
} from "@/lib/icons";

const STATUS: Record<SmsOrder["status"], { label: string; cls: string }> = {
  pending:         { label: "Awaiting payment", cls: "text-orange-600 bg-orange-500/10" },
  paid:            { label: "Getting number…",  cls: "text-blue-600 bg-blue-500/10" },
  fulfilled:       { label: "Waiting for SMS",  cls: "text-blue-600 bg-blue-500/10" },
  code_received:   { label: "Code received",    cls: "text-green-600 bg-green-500/10" },
  failed:          { label: "Failed",           cls: "text-destructive bg-destructive/10" },
  refund_required: { label: "Refund pending",   cls: "text-orange-600 bg-orange-500/10" },
  cancelled:       { label: "Cancelled",        cls: "text-muted-foreground bg-muted" },
  expired:         { label: "Expired",          cls: "text-muted-foreground bg-muted" },
};

function copy(value: string, what: string) {
  navigator.clipboard.writeText(value);
  toast.success(`${what} copied`);
}

function OrderCard({ order }: { order: SmsOrder }) {
  const cancel = useCancelOrder();
  const initiate = useInitiateOrder();
  const s = STATUS[order.status] ?? STATUS.pending;
  const busy = order.status === "paid" || order.awaiting_code;

  const handleReuse = async () => {
    try {
      const res = await initiate.mutateAsync({
        server: order.server,
        appId: order.app_id,
        countryId: order.country_id ?? undefined,
        intent: "reuse",
        reuseOf: order.id,
      });
      goToCheckout(res);
    } catch (e: any) {
      toast.error(e.message ?? "Could not start reuse");
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-primary">
            {(order.app_name ?? "#").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate">
            {order.app_name ?? `App ${order.app_id}`}
          </p>
          <p className="text-xs text-muted-foreground">
            SMS {order.server} · ₦{Number(order.amount).toLocaleString("en-NG")} ·{" "}
            {new Date(order.created_at).toLocaleString()}
            {order.intent === "reuse" && " · reuse"}
          </p>
        </div>
        <span className={cn("text-[11px] font-bold uppercase px-2 py-1 rounded-lg shrink-0 flex items-center gap-1", s.cls)}>
          {busy && <Loader2 className="h-3 w-3 animate-spin" />}
          {s.label}
        </span>
      </div>

      {order.phone_number && (
        <button
          onClick={() => copy(order.phone_number!, "Number")}
          className="w-full flex items-center justify-between bg-muted rounded-xl px-4 py-3 text-left"
        >
          <span className="font-mono font-bold text-foreground">{order.phone_number}</span>
          <Copy className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {order.sms_code ? (
        <button
          onClick={() => copy(order.sms_code!, "Code")}
          className="w-full flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-mono text-xl font-extrabold tracking-widest">{order.sms_code}</span>
          </span>
          <Copy className="h-4 w-4 text-green-600" />
        </button>
      ) : order.awaiting_code ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" /> Waiting for the SMS to arrive…
        </p>
      ) : null}

      {order.sms_full_text && (
        <p className="text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">{order.sms_full_text}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {order.status === "pending" && order.checkout_url && (
          <a
            href={order.checkout_url}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
          >
            Complete payment
          </a>
        )}
        {order.awaiting_code && (
          <button
            onClick={() => cancel.mutate(order.id)}
            disabled={cancel.isPending}
            className="px-4 py-2 rounded-xl border border-border text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" /> Cancel & refund
          </button>
        )}
        {order.can_reuse && (
          <button
            onClick={handleReuse}
            disabled={initiate.isPending}
            className="px-4 py-2 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", initiate.isPending && "animate-spin")} />
            Reuse this number
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyNumbers() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const justPaidRef = useMemo(() => new URLSearchParams(searchStr).get("ref"), [searchStr]);
  const { data: orders, isLoading, refetch, isFetching } = useMyNumbers();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" /> My numbers
          </h1>
          <button
            onClick={() => refetch()}
            className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </button>
        </div>

        {justPaidRef && (
          <div className="mb-5 flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl px-4 py-3">
            <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Payment received. Your number appears here the moment it is assigned — this page
              refreshes on its own.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (orders?.length ?? 0) === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground mb-5">You haven't bought a number yet.</p>
            <button
              onClick={() => setLocation("/virtual-numbers")}
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold"
            >
              Get a number
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders!.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        )}
      </div>
    </div>
  );
}
