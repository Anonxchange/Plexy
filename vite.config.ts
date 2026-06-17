import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
//  vite.config.vercel.ts
//
//  Use this file when deploying to Vercel:
//    vercel.json  →  "buildCommand": "vite build --config vite.config.vercel.ts"
//
//  Key differences vs vite.config.ts (Replit):
//   • No PORT / BASE_PATH env-var requirements  (Vercel injects its own)
//   • No Replit-specific plugins (cartographer, devBanner, runtimeErrorOverlay)
//   • base: "/"             — Vercel serves from the domain root
//   • outDir: "dist/public" — Vercel output dir set in vercel.json
//   • Full manualChunks     — splits vendor bundles for better CDN caching
//   • worker.format: "es"   — required for signing.worker.ts (ES module worker)
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  root: path.resolve(__dirname),
  base: "/",
  envPrefix: "VITE_",

  plugins: [react()],

  css: {
    postcss: {
      plugins: [
        // @ts-ignore
        require("tailwindcss"),
        // @ts-ignore
        require("autoprefixer"),
      ],
    },
  },

  define: {
    global: "globalThis",
  },

  resolve: {
    alias: {
      "@":       path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "src", "shared"),
      "@assets": path.resolve(__dirname, "..", "..", "attached_assets"),

      // @noble/hashes v2 exports use .js suffix in its exports map but the
      // source imports without .js (e.g. "@noble/hashes/sha3").
      // These aliases bypass the exports-map check so Vite resolves directly.
      "@noble/hashes/sha256":    path.resolve(__dirname, "node_modules/@noble/hashes/sha2.js"),
      "@noble/hashes/sha512":    path.resolve(__dirname, "node_modules/@noble/hashes/sha2.js"),
      "@noble/hashes/sha3":      path.resolve(__dirname, "node_modules/@noble/hashes/sha3.js"),
      "@noble/hashes/ripemd160": path.resolve(__dirname, "node_modules/@noble/hashes/legacy.js"),
      "@noble/hashes/hmac":      path.resolve(__dirname, "node_modules/@noble/hashes/hmac.js"),
      "@noble/hashes/utils":     path.resolve(__dirname, "node_modules/@noble/hashes/utils.js"),
      "@noble/hashes/scrypt":    path.resolve(__dirname, "node_modules/@noble/hashes/scrypt.js"),
      "@noble/hashes/pbkdf2":    path.resolve(__dirname, "node_modules/@noble/hashes/pbkdf2.js"),
    },
    dedupe: ["react", "react-dom"],
  },

  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },

  // Web Worker config — signing.worker.ts must be an ES module worker
  worker: {
    format: "es",
  },

  build: {
    outDir:                path.resolve(__dirname, "dist/public"),
    emptyOutDir:           true,
    assetsInlineLimit:     0,
    sourcemap:             false,
    minify:                "esbuild",
    cssCodeSplit:          true,
    target:                "es2020",
    chunkSizeWarningLimit: 1000,
    reportCompressedSize:  false,

    // Skip preload injection for heavy lazy chunks so the main thread
    // doesn't block on them during initial load.
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
          // ── Core React ──────────────────────────────────────────────────
          "vendor-react": ["react", "react-dom"],

          // ── Radix UI (always needed) ─────────────────────────────────────
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-slot",
            "@radix-ui/react-tooltip",
          ],

          // ── Radix UI (lazy — not preloaded) ──────────────────────────────
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

          // ── Icon library (large, lazy) ────────────────────────────────────
          "vendor-icons": ["@hugeicons/react", "@hugeicons/core-free-icons"],

          // ── Database / auth ───────────────────────────────────────────────
          "vendor-db": ["@supabase/ssr"],

          // ── General utilities ─────────────────────────────────────────────
          "vendor-utils": ["@tanstack/react-query", "wouter", "zod"],
        },
      },
    },
  },

  server: {
    port: 5000,
    hmr:  true,
    fs: {
      strict: true,
      deny: [".env", ".env.*", "*.pem", "*.key", "*.p12", "*.pfx", "**/.git/**"],
    },
  },

  preview: {
    port: 4173,
  },
});
