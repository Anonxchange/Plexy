---
name: Wallet connector constraints
description: External wallet SDK dependency and RPC availability constraints.
---

Do not force the official Reown Bitcoin adapter through the package firewall or override its Bitcoin library to a different major version.

**Why:** Installing the Reown Bitcoin adapter failed because it pins `bitcoinjs-lib` 6.1.7, which the package firewall rejected. The latest adapter metadata inspected (2.0.0) still had that dependency. Overriding it to version 7 risks breaking transaction construction.

**How to apply:** Keep the direct Sats Connect integration and current safe Bitcoin address library, or reassess the official adapter when its upstream dependency is fixed. Do not assume a newer adapter release has removed the blocked dependency; inspect it first.

SDK support for a network does not prove its relay RPC is available.

**Why:** A read-only check of Reown's TRON RPC returned HTTP 503 while the official TRON node API returned HTTP 200 with browser CORS support. The Solana relay worked independently.

**How to apply:** Verify each network's actual RPC separately before depending on it for transfers. Keep transaction preparation independent of an unavailable relay, and require wallet signatures and immutable sender/recipient/amount validation. Treat a broadcast timeout as unknown submission status, not proof a payment failed.

Keep wallet SDK initialization off the public page startup path.

**Why:** The user reported a long white loading screen after multi-chain wallet tools were introduced. Globally imported connector SDKs were blocking the first render even on pages that did not use them.

**How to apply:** Initialize connectors for wallet actions or the wallet page, and restore existing connections after the initial screen paints. Keep page providers and form state mounted during initialization; loading wallet tools must not reset a sign-in form, cart, or Supabase session. Read-only coin metadata must not eagerly import connectors.
