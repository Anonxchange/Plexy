import { openDB, IDBPDatabase } from 'idb';

export const DB_NAME = 'pexly_storage';
const DB_VERSION = 1;

export interface PexlyDB {
  wallets: {
    key: string;
    value: any;
  };
  swap_history: {
    key: string;
    value: any;
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<PexlyDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<PexlyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('wallets')) {
          db.createObjectStore('wallets');
        }
        if (!db.objectStoreNames.contains('swap_history')) {
          db.createObjectStore('swap_history');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

export async function getValue(store: keyof PexlyDB, key: string) {
  const db = await getDB();
  return db.get(store, key);
}

export async function setValue(store: keyof PexlyDB, key: string, value: any) {
  const db = await getDB();
  return db.put(store, value, key);
}

export async function deleteValue(store: keyof PexlyDB, key: string) {
  const db = await getDB();
  return db.delete(store, key);
}

export async function getAllValues(store: keyof PexlyDB) {
  const db = await getDB();
  return db.getAll(store);
}

/**
 * Resets the cached IDB connection so a fresh one is opened on next access.
 * Call this after deleting the database (e.g. on logout).
 */
export function resetDBConnection(): void {
  dbPromise = null;
}
