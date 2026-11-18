// Keep the current visit usable when cookies/storage have been disabled.
const memory = new Map<string, string>();
export const safeStorage = {
  getItem(key: string): string | null {
    try { return window.localStorage.getItem(key); }
    catch { return memory.get(key) ?? null; }
  },
  setItem(key: string, value: string) {
    memory.set(key, value);
    try { window.localStorage.setItem(key, value); } catch { /* Session-only. */ }
  },
  removeItem(key: string) {
    memory.delete(key);
    try { window.localStorage.removeItem(key); } catch { /* Session-only. */ }
  },
};
