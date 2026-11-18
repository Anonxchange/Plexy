---
name: Marketplace scope
description: User's scope for the imported Pezx marketplace.
---

The user requested importing https://github.com/Anonxchange/Pezx, addressing its Shopify market conflict, and providing universal search with suggestions for gift cards, mobile top-ups, and real products.

**Why:** These are the user's explicit product requirements, not a request to create a replacement storefront or migrate providers.

**How to apply:** Preserve the imported product and existing providers. Treat all three catalogs as part of one discovery experience while keeping their separate fulfillment and availability rules.

The header is the only country-changing control for gift cards and mobile top-ups. Do not add duplicate country changers to their heroes or pages. Preserve Shopify delivery-market pricing.

**Why:** The user explicitly requested one source in the header and emphasized that Shopify prices rely on markets.

**How to apply:** Digital pages consume the header preference without their own picker. Keep Shopify's independent delivery preference and contextual prices intact.

Do not bypass Shopify market validation to make catalog browsing work when the external localization operation is unavailable.

**Why:** The user emphasized market-based prices; Shopify can return primary-market prices for unsupported country contexts rather than an error.

**How to apply:** Require a verified delivery market for priced catalog reads as well as cart operations, and report the external function deployment blocker honestly.
