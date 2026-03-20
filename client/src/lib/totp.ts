import { hmac } from "@noble/hashes/hmac";
import { sha1 } from "@noble/hashes/sha1";
import { base32 } from "@scure/base";

const DIGITS = 6;
const STEP = 30; // seconds per window

/** Generate a cryptographically random base32 secret (20 bytes → 32-char string, no padding). */
export function generateSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return base32.encode(bytes).replace(/=/g, "");
}

/** Build the otpauth:// URI consumed by authenticator apps. */
export function buildOtpAuthUri(secret: string, account: string, issuer = "Pexly"): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP),
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?${params.toString()}`;
}

/** Compute the TOTP code for a given time-step counter. */
function computeHOTP(key: Uint8Array, counter: number): string {
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const hash = hmac(sha1, key, msg);
  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  return (code % Math.pow(10, DIGITS)).toString().padStart(DIGITS, "0");
}

function decodeSecret(secret: string): Uint8Array {
  const normalized = secret.replace(/\s/g, "").toUpperCase();
  const padded = normalized.length % 8 === 0 ? normalized : normalized + "=".repeat(8 - (normalized.length % 8));
  return base32.decode(padded);
}

/** Generate the current TOTP code (useful for showing a live code). */
export function generateTOTP(secret: string): string {
  const key = decodeSecret(secret);
  const counter = Math.floor(Date.now() / 1000 / STEP);
  return computeHOTP(key, counter);
}

/**
 * Verify a TOTP token against a secret.
 * Accepts codes from one window before or after the current window to account for clock drift.
 */
export function verifyTOTP(token: string, secret: string, windowDrift = 1): boolean {
  if (!token || token.length !== DIGITS || !/^\d+$/.test(token)) return false;
  const key = decodeSecret(secret);
  const counter = Math.floor(Date.now() / 1000 / STEP);
  for (let delta = -windowDrift; delta <= windowDrift; delta++) {
    if (computeHOTP(key, counter + delta) === token) return true;
  }
  return false;
}

/** Seconds remaining in the current TOTP window (for progress indicators). */
export function secondsRemaining(): number {
  return STEP - (Math.floor(Date.now() / 1000) % STEP);
}
