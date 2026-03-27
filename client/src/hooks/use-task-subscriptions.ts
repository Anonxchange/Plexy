import { useState, useCallback } from "react";

const STORAGE_KEY = "pexly-task-subscriptions";

function readSubscriptions(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeSubscriptions(set: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

export function useTaskSubscriptions() {
  const [subs, setSubs] = useState<Set<string>>(readSubscriptions);

  const subscribe = useCallback((taskId: string) => {
    setSubs((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      writeSubscriptions(next);
      return next;
    });
  }, []);

  const unsubscribe = useCallback((taskId: string) => {
    setSubs((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      writeSubscriptions(next);
      return next;
    });
  }, []);

  const toggle = useCallback((taskId: string) => {
    setSubs((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      writeSubscriptions(next);
      return next;
    });
  }, []);

  const isSubscribed = useCallback(
    (taskId: string) => subs.has(taskId),
    [subs],
  );

  return { subs, subscribe, unsubscribe, toggle, isSubscribed };
}

export function getSubscribedTaskIds(): string[] {
  return [...readSubscriptions()];
}
