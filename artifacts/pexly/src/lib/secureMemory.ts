/**
 * Secure memory utilities for wiping sensitive key material from the JS heap.
 *
 * JS has no guaranteed memory erasure, but zeroing typed arrays removes the
 * plaintext from the reachable object graph so it can be GC'd sooner and
 * reduces the window for heap-inspection attacks (e.g. memory dumps, DevTools
 * heap snapshots). Always call these after you are done with private keys.
 */

/**
 * Zeroes every byte of a Uint8Array in place.
 */
export function wipeBytes(bytes: Uint8Array | null | undefined): void {
  if (bytes instanceof Uint8Array) bytes.fill(0);
}

/**
 * Zeroes the private key and chain code of an @scure/bip32 HDKey instance.
 * The HDKey exposes these as direct Uint8Array references to its internal
 * buffers, so filling them in place removes the secret material from the
 * backing buffer even though the object itself still exists.
 */
export function wipeHDKey(key: any): void {
  if (!key) return;
  try {
    if (key.privateKey instanceof Uint8Array) key.privateKey.fill(0);
  } catch { /* getter may throw on already-zeroed keys */ }
  try {
    if (key.chainCode instanceof Uint8Array) key.chainCode.fill(0);
  } catch { /* ignore */ }
}

/**
 * Runs an async function and guarantees `wipe()` is called afterward,
 * even if the function throws. Mirrors try/finally for use in expression
 * contexts.
 *
 * @example
 * return withWipe(
 *   async () => { ... use key ... },
 *   () => wipeHDKey(key)
 * );
 */
export async function withWipe<T>(
  fn: () => Promise<T>,
  wipe: () => void
): Promise<T> {
  try {
    return await fn();
  } finally {
    wipe();
  }
}
