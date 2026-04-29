/**
 * Client-side validators — used to check data shapes before display.
 * These are NOT a substitute for server-side validation.
 *
 * IMPORTANT: Never sanitize wallet addresses, tx hashes, or IDs.
 * Only validate their format and reject if invalid.
 */

export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value) && !isNaN(value);
}

export function isValidAmount(value: unknown): value is number {
  return isValidNumber(value) && value >= 0;
}

export function isValidPositiveAmount(value: unknown): value is number {
  return isValidNumber(value) && value > 0;
}

export function isValidCryptoSymbol(symbol: unknown): symbol is string {
  return typeof symbol === "string" && /^[A-Z0-9]{1,10}$/.test(symbol);
}

export function isValidUuid(id: unknown): id is string {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
}

export function isValidTxHash(hash: unknown): hash is string {
  return typeof hash === "string" && /^(0x)?[a-fA-F0-9]{64}$/.test(hash);
}

export function isValidEthAddress(address: unknown): address is string {
  return typeof address === "string" && /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidBtcAddress(address: unknown): address is string {
  return (
    typeof address === "string" &&
    /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)
  );
}

export function isValidSolAddress(address: unknown): address is string {
  return (
    typeof address === "string" &&
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
  );
}

export function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
