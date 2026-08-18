import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
//  vite.config.ts — Vercel production build config (Vite 8 / Rolldown, Tailwind v4)
//
//  What changed vs. the previous version:
//   1. Tailwind now runs through @tailwindcss/vite. The css.postcss block is
//      GONE — passing `tailwindcss` as a PostCSS plugin is a v3 API and throws
//      in v4 ("The PostCSS plugin has moved to a separate package").
//      This also fixes the @fontsource-*/index.css failures: those only broke
//      because the PostCSS chain ran Tailwind over every imported stylesheet.
//   2. build.rollupOptions.output.manualChunks (object form) is not supported
//      by Rolldown → replaced with build.rollupOptions.output.advancedChunks.
//   3. optimizeDeps.esbuildOptions is deprecated in Vite 8 → removed.
//   4. minify switched from "esbuild" to Rolldown's built-in "oxc" so the
//      build no longer needs the (now unbundled) esbuild binary.
//
//  ⚠️  SECURITY: every VITE_-prefixed env var ships as plain text in the
//  browser bundle. VITE_IMAGE_PROXY_SECRET must be renamed to
//  IMAGE_PROXY_SECRET and its signing logic moved into a Vercel Edge Function.
// ─────────────────────────────────────────────────────────────────────────────

const LAZY_CHUNKS = ["vendor-ui-x", "vendor-charts", "vendor-canvas", "vendor-motion"];

function deferCriticalCss() {
  return {
    name: "defer-critical-css",
    transformIndexHtml(html) {
      return html.replace(
        /<link\s+([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']([^"']+\.css)["']([^>]*)>/i,
        '<link rel="preload" as="style" href="$3" onload="this.rel=\'stylesheet\';this.onload=null;" /><link rel="stylesheet" href="$3" media="print" onload="this.media=\'all\';this.onload=null;" />'
      );
    },
  };
}

export default defineConfig({
  root: path.resolve(import.meta.dirname, "client"),
  envDir: path.resolve(import.meta.dirname),
  envPrefix: "VITE_",
  base: "/",

  plugins: [react(), tailwindcss(), deferCriticalCss()],

  define: {
    global: "globalThis",
  },

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),

      // @noble/hashes v2 exports use a .js suffix in its exports map but source
      // imports omit it. These aliases resolve directly to the correct file.
      "@noble/hashes/sha256": path.resolve(import.meta.dirname, "node_modules/@noble/hashes/sha2.js"),
      "@noble/hashes/sha512": path.resolve(import.meta.dirname, "node_modules/@noble/hashes/sha2.js"),
      "@noble/hashes/sha3": path.resolve(import.meta.dirname, "node_modules/@noble/hashes/sha3.js"),
      "@noble/hashes/ripemd160": path.resolve(import.meta.dirname, "node_modules/@noble/hashes/legacy.js"),
      "@noble/hashes/hmac": path.resolve(import.meta.dirname, "node_modules/@noble/hashes/hmac.js"),
      "@noble/hashes/utils": path.resolve(import.meta.dirname, "node_modules/@noble/hashes/utils.js"),
      "@noble/hashes/scrypt": path.resolve(import.meta.dirname, "node_modules/@noble/hashes/scrypt.js"),
      "@noble/hashes/pbkdf2": path.resolve(import.meta.dirname, "node_modules/@noble/hashes/pbkdf2.js"),
    },
    dedupe: ["react", "react-dom"],
  },

  // Web Worker — signing.worker.ts must be an ES module worker
  worker: {
    format: "es",
  },

  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    sourcemap: false, // never true in production — exposes source code
    minify: "oxc", // Rolldown's native minifier (no esbuild dependency)
    cssCodeSplit: true,
    target: "es2020",
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,

    // Skip preload injection for heavy lazy chunks — keeps main thread fast.
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        if (LAZY_CHUNKS.some((p) => filename.includes(p))) return [];
        return deps;
      },
    },

    rollupOptions: {
      output: {
        // Rolldown replacement for manualChunks. `test` matches module ids.
        advancedChunks: {
          groups: [
            {
              name: "vendor-react",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            {
              name: "vendor-ui",
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]react-(dialog|dropdown-menu|slot|tooltip)[\\/]/,
              priority: 25,
            },
            {
              name: "vendor-ui-x",
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-icons",
              test: /[\\/]node_modules[\\/]@hugeicons[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-db",
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-utils",
              test: /[\\/]node_modules[\\/](@tanstack[\\/]react-query|wouter|zod)[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },

  // server / preview blocks intentionally absent.
  // Vercel runs only `vite build` — it never starts a dev or preview server.
});
