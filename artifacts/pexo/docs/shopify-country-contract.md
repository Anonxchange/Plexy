# Shopify country settings

The frontend continues to use the existing Supabase `shopify-storefront`
function. Its source is now kept at
`supabase/functions/shopify-storefront/index.ts`, based on the user's uploaded
function. It uses the same store, API version, token secret, and query names.

Browser verification confirmed that the existing function rejects
`getLocalization` with HTTP 400 (`Invalid query name`). The existing
`cartBuyerIdentityUpdate` operation also returned HTTP 400. These operations
have now been added to the source. The external function still runs the old
code until that source is applied to the existing Supabase project. This task
does not deploy or modify that live project.

After merge, apply this function source through the existing Supabase function
release process. No new credentials, providers, markets, or databases are
required. Keep its existing `SHOPIFY_STOREFRONT_ACCESS_TOKEN` secret in Supabase.
Then confirm that real configured markets load, prices use Shopify's supported
currencies, and a disposable cart updates country without completing checkout.

The uploaded `reloadly-products` function already forwards `countryCode` (and
product/category filters) to Reloadly. It needs no country-selection changes.
Its existing provider credentials and database cache are unchanged.

In addition to its existing catalog and cart query names, the updated function
exposes the allowlisted `getLocalization` operation:

```graphql
query getLocalization {
  localization {
    availableCountries {
      isoCode
      name
      currency { isoCode }
    }
  }
}
```

The expected JSON envelope, consistent with the existing storefront wrapper:

```json
{
  "data": {
    "localization": {
      "availableCountries": [
        { "isoCode": "GB", "name": "United Kingdom", "currency": { "isoCode": "GBP" } }
      ]
    }
  }
}
```

The country shown above is a shape example, not a configured market claim.
Country codes must come from the real Shopify response, not a static ISO list.

Catalog queries must retain their `@inContext(country: $country)` context.
`cartCreate` must apply `input.buyerIdentity.countryCode`.
`cartBuyerIdentityUpdate` must accept `cartId` and `buyerIdentity`.
The updated `cartQuery` includes:

- `checkoutUrl`, `totalQuantity`, and `lines.edges.node.quantity`
- `buyerIdentity.countryCode` to verify the cart's actual delivery context
- `lines.edges.node.cost.totalAmount { amount currencyCode }`
- merchandise variant ID, price, `availableForSale`, product title and images

The frontend re-reads the cart after a delivery-country change, uses actual
returned currencies, and blocks checkout while a cart update is pending or
failed. It warns when returned items disappear or become unavailable.

If the localization operation cannot be verified, the header explains that
delivery markets are unavailable and does not claim arbitrary countries are
enabled. Gift cards and top-ups keep their independent preference.

Both supplied functions already permit browser CORS preflights. The storefront
continues echoing the requested Supabase client headers. Never log authorization
headers, API keys, or session tokens while checking.

## Local verification

Run:

```sh
pnpm --filter @workspace/pexo run typecheck
node --test scripts/test-country-preferences.cjs scripts/test-shopify-function.cjs
```

The function tests execute this actual handler in isolation. The integration
tests then call it through the frontend service with a simulated Shopify
transport: they do not create live carts, place orders, or verify real enabled
markets. Desktop/mobile browser verification covered the shared digital
preference; live delivery testing remains dependent on the external function
running the updated source.
