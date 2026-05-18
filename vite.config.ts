import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const deferNonCriticalCss: Plugin = {
  name: "defer-non-critical-css",
  apply: "build",
  transformIndexHtml(html) {
    const noscripts: string[] = [];
    const updated = html.replace(
      /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/g,
      (_, href) => {
        noscripts.push(`<link rel="stylesheet" crossorigin href="${href}">`);
        return `<link rel="preload" as="style" crossorigin href="${href}">`;
      }
    );
    const noscriptBlock = noscripts.length
      ? `\n    <noscript>${noscripts.join("\n    ")}</noscript>`
      : "";
    return noscriptBlock
      ? updated.replace("</head>", `${noscriptBlock}\n  </head>`)
      : updated;
  },
};

const preloadEntryScript: Plugin = {
  name: "preload-entry-script",
  apply: "build",
  transformIndexHtml(html) {
    const match = html.match(/<script type="module" crossorigin src="([^"]+\.js)">/);
    if (!match) return html;
    const entrySrc = match[1];
    return html.replace(
      "<head>",
      `<head>\n  <link rel="modulepreload" crossorigin href="${entrySrc}">`
    );
  },
};

export default defineConfig({
  root: "client",
  envDir: "../",
  base: "/",

  plugins: [react(), deferNonCriticalCss, preloadEntryScript],

  resolve: {
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      "@noble/hashes/sha256":    path.resolve(__dirname, "node_modules/@noble/hashes/sha2.js"),
      "@noble/hashes/sha512":    path.resolve(__dirname, "node_modules/@noble/hashes/sha2.js"),
      "@noble/hashes/sha3":      path.resolve(__dirname, "node_modules/@noble/hashes/sha3.js"),
      "@noble/hashes/ripemd160": path.resolve(__dirname, "node_modules/@noble/hashes/legacy.js"),
      "@noble/hashes/hmac":      path.resolve(__dirname, "node_modules/@noble/hashes/hmac.js"),
      "@noble/hashes/utils":     path.resolve(__dirname, "node_modules/@noble/hashes/utils.js"),
    },
  },

  define: {
    global: "globalThis",
  },

  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },

  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    sourcemap: false,
    minify: "esbuild",
    cssCodeSplit: true,
    target: "es2020",
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,

    modulePreload: {
      resolveDependencies: (filename, deps) => {
        // Don't eagerly preload chunks only needed on demand:
        // - vendor-supabase  → auth code not needed until user interacts
        // - vendor-motion    → animations only on specific pages
        // - vendor-charts    → chart pages only
        // - vendor-crypto    → wallet/signing pages only
        // - vendor-canvas    → canvas pages only
        // - vendor-ui-x      → extended Radix primitives, not on every page
        const lazyPrefixes = [
          "vendor-supabase",
          "vendor-motion",
          "vendor-charts",
          "vendor-crypto",
          "vendor-canvas",
          "vendor-ui-x",
        ];
        if (lazyPrefixes.some((p) => filename.includes(p))) return [];
        return deps;
      },
    },

    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── React core + router ────────────────────────────────────────
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/scheduler/") ||
            id.includes("/node_modules/wouter/")
          ) {
            return "vendor-react";
          }

          // ── Supabase (auth — heavy, deferred until needed) ─────────────
          if (id.includes("@supabase/")) {
            return "vendor-supabase";
          }

          // ── Crypto / wallet (only loaded on wallet/signing pages) ───────
          if (
            id.includes("@scure/") ||
            id.includes("@noble/") ||
            id.includes("@ethereumjs/") ||
            id.includes("/scrypt-js/") ||
            id.includes("/idb/")
          ) {
            return "vendor-crypto";
          }

          // ── Charts (recharts + d3 — only on chart pages) ────────────────
          if (
            id.includes("/recharts/") ||
            id.includes("/d3-") ||
            id.includes("/d3/") ||
            id.includes("/victory-")
          ) {
            return "vendor-charts";
          }

          // ── Framer Motion (only on animated pages) ──────────────────────
          if (id.includes("/framer-motion/")) {
            return "vendor-motion";
          }

          // ── Core Radix UI (used on every page — keep in eager bundle) ───
          if (
            id.includes("@radix-ui/react-dialog") ||
            id.includes("@radix-ui/react-dropdown-menu") ||
            id.includes("@radix-ui/react-slot") ||
            id.includes("@radix-ui/react-tooltip")
          ) {
            return "vendor-ui";
          }

          // ── Extended Radix UI (less-critical primitives) ─────────────────
          if (id.includes("@radix-ui/")) {
            return "vendor-ui-x";
          }

          // ── TanStack Query ───────────────────────────────────────────────
          if (id.includes("@tanstack/")) {
            return "vendor-tanstack";
          }

          // ── i18n ─────────────────────────────────────────────────────────
          if (
            id.includes("/i18next/") ||
            id.includes("/react-i18next/")
          ) {
            return "vendor-i18n";
          }

          // ── Icons ─────────────────────────────────────────────────────────
          if (id.includes("/lucide-react/")) {
            return "vendor-icons";
          }

          // ── Everything else from node_modules ─────────────────────────────
          if (id.includes("/node_modules/")) {
            return "vendor-misc";
          }
        },
      },
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
  },

  preview: {
    host: "0.0.0.0",
    port: 5000,
  },
});
