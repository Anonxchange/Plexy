# Fix Guide: Vercel Missing Header & Prerender Fallback Issues

## Root Cause

When building for Vercel (`vite build` followed by `node scripts/prerender.mjs`), three things cause pages to load without the header or display stale prerendered homepage markup on non-marketing routes:

1. **`scripts/prerender.mjs` overwrites `dist/public/index.html`** with `<section id="seo-prerender">...</section>` containing the rendered homepage (`PexlyHomepage`) above `<div id="root"></div>`.
2. **`vercel.json` rewrites every non-prerendered route** (`/(.*) -> /`) to `dist/public/index.html`, so routes like `/privacy`, `/terms`, `/refund-policy`, `/support`, `/contact`, `/signin`, `/signup`, and `/wallet` receive the prerendered homepage HTML instead of a clean SPA shell.
3. **`#seo-prerender` is only removed in `CurrentMarketingPage`** (`artifacts/pexo/src/components/marketing/current-marketing-page.tsx`), not globally in `App.tsx`. Meanwhile, `.current-source-page .px-nav { display: none !important; }` in `artifacts/pexo/src/styles.css` hides the `<header>` inside the prerendered markup.

---

## Step-by-Step Code Fixes

### 1. Remove `#seo-prerender` globally when React mounts

**File:** `artifacts/pexo/src/App.tsx`

Inside `App()` (around line 352), add a `useEffect` that removes `#seo-prerender` on every route—not just marketing routes:

```tsx
  useEffect(() => {
    i18n.changeLanguage(langBase ? langBase.slice(1) : "en");
  }, [langBase]);

  useEffect(() => {
    document.documentElement.classList.add("pexly-app-ready");
    document.getElementById("seo-prerender")?.remove();
  }, []);
```

---

### 2. Preserve a clean SPA fallback HTML for non-prerendered routes

**File:** `artifacts/pexo/scripts/prerender.mjs`

Right after reading the un-prerendered `dist/public/index.html` template (line 62), write a clean `_spa.html` copy before `prerender.mjs` overwrites `index.html`:

```js
async function main() {
  let template = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
  await fs.writeFile(path.join(outputDir, "_spa.html"), template, "utf8");
  let manifest = {};
```

**File:** `vercel.json`

Point the final catch-all SPA rewrite (lines 45–48) to `/_spa.html` instead of `/`:

```json
    {
      "source": "/(.*)",
      "destination": "/_spa.html"
    }
```

**Result:**
- `/` and the other 8 prerendered SEO routes still serve their static prerendered `index.html` files.
- `/privacy`, `/terms`, `/refund-policy`, `/support`, `/contact`, `/signin`, `/signup`, `/wallet`, `/product/*`, etc. serve the clean `_spa.html` shell without flashing or leaving homepage markup in the DOM.

---

### 3. Keep the prerendered header visible before JS hydrates

**File:** `artifacts/pexo/src/styles.css`

Around line 679, scope the `.px-nav` hide rule to `#root` so it only hides the duplicate exported `<header>` rendered inside React's `#root` (where `<AppHeader />` is rendered separately), while keeping the static `<header>` inside `#seo-prerender` visible until JS removes `#seo-prerender`:

**Before:**
```css
.current-source-page .px-nav {
  display: none !important;
}
```

**After:**
```css
#root .current-source-page .px-nav {
  display: none !important;
}
```

---

### 4. (Optional) Sync the updated Legal Pages styling

If you also want the all-white legal page hero card and heavier theme font weights from this workspace on Vercel, copy `artifacts/pexo/src/pages/legal-pages.tsx` to your GitHub `main` branch.

> **Important:** Keep your GitHub repo's `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and root `package.json` `pnpm` scripts intact for Vercel—do not overwrite those with the npm workspace config used inside AI Studio.

---

## Vercel Dashboard & Deployment Checklist

1. **Environment Variables** (Vercel Project → **Settings → Environment Variables**, enabled for **Production** and **Preview**):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_REOWN_PROJECT_ID`
   - `VITE_TURNSTILE_SITE_KEY`
2. **Clear Build Cache on Redeploy**:
   - In Vercel → **Deployments → Redeploy**, uncheck *"Use existing Build Cache"* (or enable *"Clear Build Cache"*) so `VITE_*` variables and updated assets are cleanly baked into the new bundle.
3. **Verify Live Routes**:
   - Open `/` and `/privacy` in the browser and check **DevTools → Console** to confirm zero uncaught runtime errors and that `<header id="pxnav">` (`AppHeader`) renders immediately.
