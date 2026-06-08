import { useState, useCallback, useEffect } from "react";

const KEY = "pexly_favorites";

function load(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]")); }
  catch { return new Set(); }
}

let shared: Set<string> | null = null;
const listeners = new Set<(favs: Set<string>) => void>();

function getShared(): Set<string> {
  if (shared === null) shared = load();
  return shared;
}

function broadcast(next: Set<string>) {
  shared = next;
  listeners.forEach(fn => fn(new Set(next)));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(getShared()));

  useEffect(() => {
    listeners.add(setFavorites);
    return () => { listeners.delete(setFavorites); };
  }, []);

  const toggle = useCallback((symbol: string) => {
    const next = new Set(getShared());
    if (next.has(symbol)) next.delete(symbol);
    else next.add(symbol);
    localStorage.setItem(KEY, JSON.stringify([...next]));
    broadcast(next);
  }, []);

  const isFavorite = useCallback((symbol: string) => favorites.has(symbol), [favorites]);

  return { favorites, toggle, isFavorite };
}
