import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
//  vite.config.vercel.ts  —  Vercel production build config
//
//  COPY THIS FILE to your GitHub repo root, then add vercel.json:
//    {
//      "buildCommand": "vite build --config vite.config.vercel.ts",
//      "outputDirectory": "dist",
//      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
//    }
//
//  Repo layout this config assumes:
//    /                        ← project root (where this file lives)
//    ├── client/
//    │   ├── index.html       ← Vite entry point
//    │   └── src/
//    │       └── main.tsx
//    ├── node_modules/
//    ├── package.json
//    └── vite.config.vercel.ts
//
//  ⚠️  SECURITY — read before editing:
//   1. ESM context (package.json "type":"module"): use import.meta.dirname,
//      NOT __dirname. Use await import(), NOT require().
//   2. Every env var prefixed VITE_ ends up as PLAIN TEXT in the JS bundle.
//      Never prefix secrets with VITE_ (API keys, HMAC secrets, DB passwords).
//      → VITE_IMAGE_PROXY_SECRET must be moved to a server-side Edge Function
//        before going to production.
//   3. server/preview blocks are intentionally absent — Vercel never starts
//      them. Only the build section matters here.
// ─────────────────────────────────────────────────────────────────────────────

// ⚠️  ACTION REQUIRED before production deploy:
//
//  VITE_IMAGE_PROXY_SECRET is bundled in plain text into every visitor's
//  browser — making the HMAC signature it protects worthless.
//  Fix: rename to IMAGE_PROXY_SECRET (drop VITE_ prefix) and move the
//  signing logic into a Vercel Edge Function or API route.

export default defineConfig({
  // index.html lives in client/ — this is the Vite "root" (entry point dir)
  root:      path.resolve(import.meta.dirname, "client"),
  // .env files live one level up (project root)
  envDir:    path.resolve(import.meta.dirname),
  envPrefix: "VITE_",
  base:      "/",

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
      // @ → client/src (matches tsconfig paths)
      "@":       path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),

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
    // Output to dist/ at the project root (one level above client/)
    outDir:                path.resolve(import.meta.dirname, "dist"),
    emptyOutDir:           true,
    assetsInlineLimit:     0,
    sourcemap:             false,   // never true in production — exposes source code
    minify:                "esbuild",
    cssCodeSplit:          true,
    target:                "es2020",
    chunkSizeWarningLimit: 1000,
    reportCompressedSize:  false,

    // Skip preload injection for heavy lazy chunks — keeps main thread fast.
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

  // server / preview blocks intentionally absent.
  // Vercel runs only `vite build` — it never starts a dev or preview server.
});
