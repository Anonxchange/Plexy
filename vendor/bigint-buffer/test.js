"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { toBigIntLE, toBigIntBE, toBufferLE, toBufferBE } = require("./index.js");

test("big-endian conversion round trips", () => {
  const input = Buffer.from("00000000000f4240", "hex");
  assert.equal(toBigIntBE(input), 1000000n);
  assert.deepEqual(toBufferBE(1000000n, 8), input);
});

test("little-endian conversion round trips", () => {
  const input = Buffer.from("40420f0000000000", "hex");
  assert.equal(toBigIntLE(input), 1000000n);
  assert.deepEqual(toBufferLE(1000000n, 8), input);
});

test("u64 and u128 boundaries", () => {
  assert.equal(toBigIntBE(Buffer.from("ffffffffffffffff", "hex")), 2n ** 64n - 1n);
  assert.equal(toBigIntLE(Buffer.from("ffffffffffffffff", "hex")), 2n ** 64n - 1n);
  assert.equal(toBigIntBE(Buffer.from("ffffffffffffffffffffffffffffffff", "hex")), 2n ** 128n - 1n);
});

test("empty buffers and zero widths", () => {
  assert.equal(toBigIntBE(Buffer.alloc(0)), 0n);
  assert.equal(toBigIntLE(Buffer.alloc(0)), 0n);
  assert.deepEqual(toBufferBE(42n, 0), Buffer.alloc(0));
  assert.deepEqual(toBufferLE(42n, 0), Buffer.alloc(0));
});

test("rejects invalid input instead of invoking native code", () => {
  assert.throws(() => toBigIntLE(null), TypeError);
  assert.throws(() => toBigIntBE(new Uint8Array([1])), TypeError);
  assert.throws(() => toBufferLE(42, 8), TypeError);
  assert.throws(() => toBufferBE(42n, -1), RangeError);
  assert.throws(() => toBufferBE(42n, 1.5), RangeError);
});
