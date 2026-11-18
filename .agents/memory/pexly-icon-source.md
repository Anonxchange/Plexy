---
name: Pexly icon source
description: Pexly's product UI should use Hugeicons as its sole icon library.
---

Use Hugeicons as the only icon library in Pexly product code. Do not add Lucide or React Icons imports or direct dependencies to the Pexly artifact.

**Why:** The user wants one consistent source for product icons.

**How to apply:** For shared initial UI such as the header, import only the specific Hugeicons needed so using the shared icon source does not eagerly load the full icon catalog. The separate mockup sandbox is outside this product UI rule.
