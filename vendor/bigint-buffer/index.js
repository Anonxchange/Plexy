"use strict";

// Pexly's browser-only implementation of bigint-buffer's four-function API.
// The vulnerable upstream native N-API loader is intentionally not included.
// Keep conversions byte-for-byte compatible with upstream dist/browser.js.

function assertBuffer(buf, name) {
  if (!Buffer.isBuffer(buf)) throw new TypeError(name + " expects a Buffer");
}
function assertBigInt(num, name) {
  if (typeof num !== "bigint") throw new TypeError(name + " expects a bigint");
}
function assertWidth(width, name) {
  if (!Number.isSafeInteger(width) || width < 0 || width > 1024 * 1024) {
    throw new RangeError(name + " width must be an integer between 0 and 1048576");
  }
}

function toBigIntLE(buf) {
  assertBuffer(buf, "toBigIntLE");
  const reversed = Buffer.from(buf);
  reversed.reverse();
  const hex = reversed.toString("hex");
  return hex.length === 0 ? 0n : BigInt("0x" + hex);
}
function toBigIntBE(buf) {
  assertBuffer(buf, "toBigIntBE");
  const hex = buf.toString("hex");
  return hex.length === 0 ? 0n : BigInt("0x" + hex);
}
function toBufferLE(num, width) {
  assertBigInt(num, "toBufferLE");
  assertWidth(width, "toBufferLE");
  const hex = num.toString(16);
  const buffer = Buffer.from(hex.padStart(width * 2, "0").slice(0, width * 2), "hex");
  buffer.reverse();
  return buffer;
}
function toBufferBE(num, width) {
  assertBigInt(num, "toBufferBE");
  assertWidth(width, "toBufferBE");
  const hex = num.toString(16);
  return Buffer.from(hex.padStart(width * 2, "0").slice(0, width * 2), "hex");
}

exports.toBigIntLE = toBigIntLE;
exports.toBigIntBE = toBigIntBE;
exports.toBufferLE = toBufferLE;
exports.toBufferBE = toBufferBE;
