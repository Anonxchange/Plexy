# Vercel SPA Routing

Pexly uses a client-rendered React application. The production build serves the clean Vite document for the homepage and application routes, then lets the client router render the requested page.

## Build

The Pexly build runs Vite only:

```sh
vite build --config vite.config.ts
```

There is no server-side SEO prerender step. The build does not generate route-specific HTML documents or insert a second copy of page content before the React root.

## Vercel routing

The catch-all rewrite in `vercel.json` points to `/`, which serves the clean `dist/public/index.html` emitted by Vite. This allows client-side routes such as `/privacy`, `/terms`, `/support`, `/signin`, `/wallet`, and product routes to load the same app shell and be resolved by the React router.

The sitemap rewrites remain separate and stay above the catch-all rewrite.

## SEO behavior

Page metadata managed by the application can still update in the browser after React loads. However, the initial HTML response is no longer pre-rendered per route. Crawlers and social preview bots that do not execute JavaScript may not see route-specific content, metadata, or structured data.

If server-rendered SEO is needed later, implement it as a separate architecture rather than reintroducing a build-time script that overwrites the SPA entry document.

## Verification after deployment

Check these routes directly, including refreshes: `/`, `/gift-cards`, `/shop`, `/privacy`, `/terms`, `/support`, `/signin`, and `/wallet`.

Each should return the React app shell and render its own route without showing homepage content on unrelated routes.
