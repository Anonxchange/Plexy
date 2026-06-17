import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
//  vite.config.vercel.ts  —  Vercel production config
//
//  Usage in vercel.json:
//    "buildCommand": "vite build --config vite.config.vercel.ts"
//
//  Key differences vs vite.config.ts (Replit dev):
//   • No PORT / BASE_PATH env-var requirements
//   • No Replit-specific plugins (cartographer, devBanner, runtimeErrorOverlay)
//   • base: "/"             — Vercel serves from the domain root
//   • outDir: "dist/public" — matched by vercel.json outputDirectory
//   • Full manualChunks     — vendor bundle splitting for CDN cache efficiency
//   • worker.format: "es"   — required for signing.worker.ts (ES module worker)
//
//  ⚠️  SECURITY — read before editing:
//   1. This file runs as an ES module (package.json "type":"module").
//      Use import.meta.dirname — NOT __dirname.
//      Use await import()      — NOT require().
//   2. Every env var prefixed VITE_ is bundled as PLAIN TEXT in the output JS.
//      Never prefix secrets (API keys, HMAC secrets, DB passwords) with VITE_.
//      → VITE_IMAGE_PROXY_SECRET must be renamed + moved to a server-side
//        edge function before going to production. See comment below.
//   3. server.allowedHosts and server.cors must be explicit lists, never true.
//      Setting either to `true` enables DNS-rebinding / CORS attacks (CVE-2025-24010).
// ─────────────────────────────────────────────────────────────────────────────

// ⚠️  ACTION REQUIRED before production deploy:
//
//  VITE_IMAGE_PROXY_SECRET is currently exposed to every user's browser
//  (any VITE_ var ends up in the JS bundle in plain text).
//  An HMAC secret that is public provides zero security guarantee.
//
//  Fix:
//   1. Rename to IMAGE_PROXY_SECRET (no VITE_ prefix) in your Vercel env vars.
//   2. Move the HMAC signing/verification into a Vercel Edge Function or
//      API route — it must never run in client-side code.
//   3. Remove the VITE_IMAGE_PROXY_SECRET reference from image-proxy.ts.

export default defineConfig({
  // ── ESM note: use import.meta.dirname, NOT __dirname ────────────────────
  root:      path.resolve(import.meta.dirname),
  base:      "/",
  envPrefix: "VITE_",

  plugins: [react()],

  css: {
    postcss: {
      plugins: [
        // ESM: use await import(), NOT require()
        (await import("tailwindcss")).default,
        (await import("autoprefixer")).default,
      ],
    },
  },

  define: {
    global: "globalThis",
  },

  resolve: {
    alias: {
      "@":       path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "src", "shared"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),

      // @noble/hashes v2 exports use .js suffix in its exports map but source
      // imports without .js (e.g. "@noble/hashes/sha3"). These aliases let Vite
      // bypass the exports-map check and resolve directly to the correct file.
      "@noble/hashes/sha256":    path.resolve(import.meta.dirname, "node_modules/@noble/hashes/sha2.js"),
      "@noble/hashes/sha512":    path.resolve(import.meta.dirname, "node_modules/@noble/hashes/sha2.js"),
      "@noble/hashes/sha3":      path.resolve(import.meta.dirname, "node_modules/@noble/hashes/sha3.js"),
      "@noble/hashes/ripemd160": path.resolve(import.meta.dirname, "node_modules/@noble/hashes/legacy.js"),
      "@noble/hashes/hmac":      path.resolve(import.meta.dirname, "node_modules/@noble/hashes/hmac.js"),
      "@noble/hashes/utils":     path.resolve(import.meta.dirname, "node_modules/@noble/hashes/utils.js"),
      "@noble/hashes/scrypt":    path.resolve(import.meta.dirname, "node_modules/@noble/hashes/scrypt.js"),
      "@noble/hashes/pbkdf2":    path.resolve(import.meta.dirname, "node_modules/@noble/hashes/pbkdf2.js"),
    },
    dedupe: ["react", "react-dom"],
  },

  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },

  // Web Worker — signing.worker.ts must be an ES module worker
  worker: {
    format: "es",
  },

  build: {
    outDir:                path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir:           true,
    assetsInlineLimit:     0,
    sourcemap:             false,   // never true in production — exposes source code
    minify:                "esbuild",
    cssCodeSplit:          true,
    target:                "es2020",
    chunkSizeWarningLimit: 1000,
    reportCompressedSize:  false,

    // Skip preload injection for heavy lazy chunks — main thread loads
    // faster when these are deferred.
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        const lazyPrefixes = [
          "vendor-ui-x",
          "vendor-charts",
          "vendor-canvas",
          "vendor-motion",
        ];
        if (lazyPrefixes.some((p) => filename.includes(p))) return [];
        return deps;
      },
    },

    rollupOptions: {
      output: {
        manualChunks: {
          // ── Core React ─────────────────────────────────────────────────
          "vendor-react": ["react", "react-dom"],

          // ── Radix UI (critical path — preloaded) ────────────────────────
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-slot",
            "@radix-ui/react-tooltip",
          ],

          // ── Radix UI (lazy — not preloaded) ─────────────────────────────
          "vendor-ui-x": [
            "@radix-ui/react-toast",
            "@radix-ui/react-avatar",
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
          ],

          // ── Icon library (large, lazy) ───────────────────────────────────
          "vendor-icons": ["@hugeicons/react", "@hugeicons/core-free-icons"],

          // ── Database / auth ──────────────────────────────────────────────
          "vendor-db": ["@supabase/ssr"],

          // ── Utilities ────────────────────────────────────────────────────
          "vendor-utils": ["@tanstack/react-query", "wouter", "zod"],
        },
      },
    },
  },

  // ── server / preview blocks intentionally omitted ───────────────────────
  //
  //  Vercel runs ONLY `vite build` — it never starts the dev server or the
  //  preview server. Defining server/preview here would be dead config and
  //  could mislead future maintainers into thinking port 5000 / 4173 means
  //  something in production.
  //
  //  If you need to test the production build locally before deploying:
  //    PORT=4173 vite preview --config vite.config.vercel.ts
  //  and add server/preview overrides in a local-only vite.config.local.ts.
});
