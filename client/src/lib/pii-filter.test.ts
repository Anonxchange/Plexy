/**
 * Unit tests for the PII / sensitive-data filter.
 *
 * Run:    pnpm --filter @workspace/pexly test
 * Single: pnpm --filter @workspace/pexly test -- src/lib/pii-filter.test.ts
 *
 * Every fixture is one of:
 *   - SAFE     → must be allowed through (real UI copy)
 *   - REJECT   → must be blocked, optionally with a specific reason code
 *
 * Reason codes are checked when present so that future regex tweaks
 * cannot silently swap which rule rejects which kind of input.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  shouldTranslate,
  isLikelyPII,
  type PIIReason,
} from "./pii-filter.ts";

type Fixture = {
  input: string;
  expect: "SAFE" | "REJECT";
  reason?: PIIReason;
  why: string;
};

const SAFE_UI_COPY: Fixture[] = [
  { input: "Get Started",                                    expect: "SAFE", why: "button label" },
  { input: "Buy Crypto",                                     expect: "SAFE", why: "nav label" },
  { input: "Your money minus the middleman",                 expect: "SAFE", why: "headline" },
  { input: "Your all in one decentralized marketplace to swap, shop, stake, top up mobile, and pay bills. Non custodial, always.",
                                                             expect: "SAFE", why: "long marketing copy under length cap" },
  { input: "We use cookies to enhance your experience and analyze site traffic.",
                                                             expect: "SAFE", why: "cookie banner" },
  { input: "Trusted by 50M+ users",                          expect: "SAFE", why: "stat with year-like number under 6 digits" },
  { input: "Since 2015",                                     expect: "SAFE", why: "year is fewer than 6 digits" },
  { input: "Pay with what you already use",                  expect: "SAFE", why: "tagline" },
  { input: "Sign In",                                        expect: "SAFE", why: "auth link" },
  { input: "Wallet",                                         expect: "SAFE", why: "single nav word" },
  { input: "Frequently asked questions",                     expect: "SAFE", why: "section header" },
  { input: "Your password must be at least 8 characters long.",
                                                             expect: "SAFE", why: "form helper text — bare digit allowed" },
  { input: "24/7 support available",                         expect: "SAFE", why: "marketing slash-form digits" },
  { input: "Need help? Contact us.",                         expect: "SAFE", why: "punctuation tolerant" },
  { input: "Hello — welcome back!",                          expect: "SAFE", why: "em-dash and exclamation" },
];

const REJECT_PII: Fixture[] = [
  // ─── Wallet addresses ────────────────────────────────────────────────────
  { input: "0x742d35Cc6634C0532925a3b844Bc9e7595f6E842",
    expect: "REJECT", reason: "evm-hex",          why: "EVM wallet address" },
  { input: "Send to 0x742d35Cc6634C0532925a3b844Bc9e7595f6E842 now",
    expect: "REJECT", reason: "evm-hex",          why: "EVM addr embedded in sentence" },
  { input: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    expect: "REJECT", reason: "identifier-token", why: "BTC legacy address (single token)" },
  { input: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    expect: "REJECT", reason: "identifier-token", why: "BTC bech32 address (single token)" },
  { input: "DRpbCBMxVnDK7maPGv7USv6V2FDhTdsKf5SrPxTjmhw3",
    expect: "REJECT", reason: "identifier-token", why: "Solana base58 address" },
  // ─── Transaction hashes / signatures ─────────────────────────────────────
  { input: "0xb1c5e8c9b2c3a4d5e6f7081928374650a1b2c3d4e5f60718293a4b5c6d7e8f90",
    expect: "REJECT", reason: "evm-hex",          why: "EVM transaction hash" },
  { input: "deadbeefcafef00d1234567890abcdef",
    expect: "REJECT", reason: "long-hex",         why: "raw hex hash" },
  // ─── Private keys ────────────────────────────────────────────────────────
  { input: "5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ",
    expect: "REJECT", reason: "wif-key",          why: "WIF private key starting with 5" },
  { input: "L1aW4aubDFB7yfras2S1mJzjCpHgSJDR5b6Y1c1Y9kxKx5kzxoVc",
    expect: "REJECT", reason: "wif-key",          why: "WIF private key starting with L" },
  { input: "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
    expect: "REJECT", reason: "evm-hex",          why: "raw EVM private key (32 bytes hex)" },
  // ─── Extended public/private keys ────────────────────────────────────────
  { input: "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz",
    expect: "REJECT", reason: "bip32-key",        why: "BIP32 xpub" },
  { input: "xprv9s21ZrQH143K3GJpoapnV8SFfukcVBSfeCficPSGfubmSFDxo1kuHnLisriDvSnRRuL2Qrg5ggqHKNVpxR86QEC8w35uxmGoggxtQTPvfUu",
    expect: "REJECT", reason: "bip32-key",        why: "BIP32 xprv (private!)" },
  { input: "zpub6jftahH18ngZxLmXaKw3GSZzZsszmt9WqedkyZdezFtWRFBZqsQH5hyUmb4pCEeZGmVfQuP5bedXTB8is6fTv19U1GQRyQUKQGUTzyHACMF",
    expect: "REJECT", reason: "bip32-key",        why: "BIP84 zpub (segwit)" },
  // ─── Seed phrases ────────────────────────────────────────────────────────
  { input: "abandon ability able about above absent absorb abstract absurd abuse access accident",
    expect: "REJECT", reason: "mnemonic",         why: "12-word BIP39" },
  { input: "legal winner thank year wave sausage worth useful legal winner thank yellow legal winner thank year wave sausage worth useful legal winner thank yellow",
    expect: "REJECT", reason: "mnemonic",         why: "24-word BIP39" },
  { input: "letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter always",
    expect: "REJECT", reason: "mnemonic",         why: "18-word BIP39" },
  // ─── JWTs ────────────────────────────────────────────────────────────────
  { input: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMTIzIn0.signaturepart",
    expect: "REJECT", reason: "jwt",              why: "compact JWT" },
  // ─── UUIDs ───────────────────────────────────────────────────────────────
  { input: "Order 550e8400-e29b-41d4-a716-446655440000 confirmed",
    expect: "REJECT", reason: "uuid",             why: "UUID embedded in sentence" },
  // ─── Emails ──────────────────────────────────────────────────────────────
  { input: "user@example.com",                  expect: "REJECT", reason: "email",      why: "bare email" },
  { input: "Contact alice.smith@example.co.uk", expect: "REJECT", reason: "email",      why: "email in sentence" },
  // ─── Phone numbers ───────────────────────────────────────────────────────
  { input: "+1 (555) 123-4567",                 expect: "REJECT", reason: "phone-intl", why: "US phone" },
  { input: "Call +234 803 123 4567 today",      expect: "REJECT", reason: "phone-intl", why: "intl phone in sentence" },
  // ─── Codes / OTPs / IDs ──────────────────────────────────────────────────
  { input: "Your verification code is 123456",  expect: "REJECT", reason: "long-digit", why: "6-digit OTP" },
  { input: "Reference: 9876543210",             expect: "REJECT", reason: "long-digit", why: "long account number" },
  // ─── URLs ────────────────────────────────────────────────────────────────
  { input: "Visit https://pexly.com/help",      expect: "REJECT", reason: "url",        why: "https URL" },
  { input: "Try www.example.org for details",   expect: "REJECT", reason: "url",        why: "www-prefixed URL" },
  // ─── Length / shape ──────────────────────────────────────────────────────
  { input: "x".repeat(501),                     expect: "REJECT", reason: "too-long",   why: "over the 500-char cap" },
  { input: "x",                                 expect: "REJECT", reason: "too-short",  why: "single char" },
  { input: "$$$ +++ ---",                       expect: "REJECT", reason: "all-symbols",why: "no letters at all" },
  { input: "12345.67",                          expect: "REJECT", reason: "all-symbols",why: "pure number" },
  { input: "Pexly",                             expect: "REJECT", reason: "verbatim",   why: "brand name on verbatim list" },
  { input: "BTC",                               expect: "REJECT", reason: "verbatim",   why: "ticker on verbatim list" },
  { input: "ABC123-XYZ_456!@#",                 expect: "REJECT", reason: "low-letter-density",
    why: "more digits/symbols than letters" },
];

function describePII(reason: PIIReason | undefined): string {
  return reason ?? "(any reason)";
}

describe("pii-filter / shouldTranslate / isLikelyPII", () => {
  describe("SAFE: real UI copy must be translatable", () => {
    for (const f of SAFE_UI_COPY) {
      it(`accepts: ${f.why} — ${JSON.stringify(f.input.slice(0, 60))}`, () => {
        const reason = isLikelyPII(f.input);
        assert.equal(
          reason,
          null,
          `expected SAFE but rejected as "${reason}". Input: ${JSON.stringify(f.input)}`,
        );
        assert.equal(shouldTranslate(f.input), true);
      });
    }
  });

  describe("REJECT: PII / secrets / non-copy must be blocked", () => {
    for (const f of REJECT_PII) {
      it(`rejects ${describePII(f.reason)}: ${f.why}`, () => {
        const reason = isLikelyPII(f.input);
        assert.notEqual(
          reason,
          null,
          `expected REJECT (${describePII(f.reason)}) but accepted. Input: ${JSON.stringify(f.input)}`,
        );
        if (f.reason) {
          assert.equal(
            reason,
            f.reason,
            `expected reason "${f.reason}" but got "${reason}". ` +
              `Input: ${JSON.stringify(f.input)}`,
          );
        }
        assert.equal(shouldTranslate(f.input), false);
      });
    }
  });

  describe("regression: trimming and case-insensitivity", () => {
    it("trims whitespace before evaluating", () => {
      assert.equal(shouldTranslate("   Get Started   "), true);
      assert.equal(shouldTranslate("\n\tBuy Crypto\n"), true);
    });
    it("rejects an EVM address regardless of surrounding spaces", () => {
      assert.equal(
        shouldTranslate("   0x742d35Cc6634C0532925a3b844Bc9e7595f6E842   "),
        false,
      );
    });
    it("verbatim list is case-sensitive on purpose (e.g. 'btc' is fine to translate as common noun)", () => {
      assert.equal(shouldTranslate("btc"), true); // lowercase, not on the verbatim list
      assert.equal(shouldTranslate("BTC"), false); // exact ticker symbol
    });
  });
});
