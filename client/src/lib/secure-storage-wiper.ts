const IDB_NAME = 'pexly_storage';

/**
 * Deletes the pexly IndexedDB database and resets the cached connection.
 * Any existing open connection will be closed before deletion.
 */
async function deleteIndexedDB(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(IDB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => {
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

  // Reset the cached IDB promise so a fresh connection is opened next login
  try {
    const { resetDBConnection } = await import('./ids');
    resetDBConnection();
  } catch {
    // Non-fatal if import fails
  }
}
