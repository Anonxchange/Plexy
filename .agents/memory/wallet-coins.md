---
name: Wallet coin visibility
description: User's standing requirement for the wallet coin list.
---

Show all supported coins whether a wallet is connected or not, and keep them visible when connected with zero balances. Leave the design unchanged for now.

**Why:** The user explicitly requested persistent coin visibility and deferred the HTML design conversion.

**How to apply:** Coin metadata must not depend on connection or successful balance reads. Display confirmed zero separately from disconnected, loading, or unavailable balances; do not bypass wallet verification to show the list.

Group the asset list by coin symbol rather than showing each network as a separate coin. Put network selection in Send and Receive, and include Bitcoin, Solana and TRON.

**Why:** The user explicitly requested USDT/USDC/ETH-style rows with chain choices when depositing or sending, and identified the three missing coins.

**How to apply:** Aggregate only known balances, label partial totals, and use each selected network's own compatible wallet address. Do not use an EVM address for Bitcoin, Solana or TRON.

During development, `link-wallet` should be callable from any origin without an origin-allowlist secret.

**Why:** The user rejected the extra secret and explicitly said the application is still in development.

**How to apply:** Keep signature, session, signed-message consistency, expiry and single-use nonce checks. Do not reintroduce an origin secret during development. Review the development policy before production rather than assuming the user approved production restrictions.
