import { useState, useCallback } from "react";

const KEY = "pexly_favorites";

function load(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]")); }
  catch { return new Set(); }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(load);

  const toggle = useCallback((symbol: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      localStorage.setItem(KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isFavorite = useCallback((symbol: string) => favorites.has(symbol), [favorites]);

  return { favorites, toggle, isFavorite };
}
