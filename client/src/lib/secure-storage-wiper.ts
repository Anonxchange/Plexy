const IDB_NAME = 'pexly_storage';

/**
 * Deletes the pexly IndexedDB database and resets the cached connection.
 * Any existing open connection will be closed before deletion.
 */
async function deleteIndexedDB(): Promise<void> {
  try {
    const { closeDBConnection } = await import('./ids');
    await closeDBConnection();
  } catch {
    // Continue with best-effort deletion if the storage module is unavailable.
  }

  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(IDB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => {
        // Do not leave a pending deletion that can stall the next login's
        // attempt to reopen the wallet cache.
        resolve();
      };
    } catch {
      resolve();
    }
  });
}

/**
 * Wipes all browser-side storage after logout:
 *   1. Clears localStorage entirely
 *   2. Clears sessionStorage entirely
 *   3. Deletes the IndexedDB wallet database
 *
 * This ensures no decrypted wallet data, cached keys, or session tokens
 * survive after the user signs out.
 */
export async function wipeSecureStorage(): Promise<void> {
  try {
    localStorage.clear();
  } catch {
    // Safari private mode may throw – best effort
  }

  try {
    sessionStorage.clear();
  } catch {
    // Safari private mode may throw – best effort
  }

  await deleteIndexedDB();

  // The connection was reset before deletion so the next login opens a fresh DB.
  try {
    const { resetDBConnection } = await import('./ids');
    resetDBConnection();
  } catch {
    // Non-fatal if import fails
  }
}
