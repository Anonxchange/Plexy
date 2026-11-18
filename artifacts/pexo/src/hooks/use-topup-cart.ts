import { useSyncExternalStore } from "react";
import { toast } from "sonner";

export interface SavedTopup {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  image?: string;
  metadata: {
    service: "mobile-topup";
    operatorId: number;
    recipientPhone: string;
    recipientCountryCode: string;
    operatorName: string;
  };
}

const KEY = "pexly_topup_cart";
let snapshot: SavedTopup[] = [];
let lastRaw: string | null | undefined;
const listeners = new Set<() => void>();

function read(): SavedTopup[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === lastRaw) return snapshot;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    snapshot = Array.isArray(parsed) ? parsed.filter((item): item is SavedTopup =>
      typeof item?.id === "string" && typeof item?.title === "string" &&
      Number.isFinite(item?.amount) && item.amount > 0 &&
      typeof item?.currency === "string" && /^[a-z]{3}$/i.test(item.currency) &&
      item?.metadata?.service === "mobile-topup" &&
      Number.isFinite(item.metadata.operatorId) &&
      typeof item.metadata.recipientPhone === "string" &&
      typeof item.metadata.recipientCountryCode === "string"
    ) : [];
    lastRaw = raw;
  } catch {
    // A blocked browser store must not crash the header.
    return snapshot;
  }
  return snapshot;
}

function emit() {
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function write(items: SavedTopup[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  lastRaw = undefined;
  read();
  emit();
}

export function removeSavedTopup(id: string) {
  write(read().filter(item => item.id !== id));
}

export function useTopupCart() {
  const items = useSyncExternalStore(subscribe, read, () => snapshot);
  return {
    items,
    addItem(item: Omit<SavedTopup, "id">) {
      try {
        write([...read(), { ...item, id: crypto.randomUUID() }]);
        toast.success("Top-up added to cart");
        return true;
      } catch {
        toast.error("Could not save this top-up. Allow browser storage and try again.");
        return false;
      }
    },
    removeItem(id: string) {
      try {
        removeSavedTopup(id);
      } catch {
        toast.error("Could not update the cart. Please try again.");
      }
    },
  };
}
