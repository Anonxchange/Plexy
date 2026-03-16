import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const deferNonCriticalCss: Plugin = {
  name: "defer-non-critical-css",
  apply: "build",
  transformIndexHtml(html) {
    return html.replace(
      /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/g,
      `<link rel="preload" as="style" crossorigin onload="this.onload=null;this.rel='stylesheet'" href="$1">\n    <noscript><link rel="stylesheet" crossorigin href="$1"></noscript>`
    );
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
    },
  },

  define: {
    global: "globalThis",
  },

  optimizeDeps: {
    include: [
      "@noble/curves",
      "@noble/hashes",
      "@scure/bip32",
      "@scure/bip39",
      "@scure/btc-signer",
    ],
    esbuildOptions: {
      target: "es2020",
    },
  },

  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsInlineLimit: 2048,
    sourcemap: false,
    minify: "esbuild",
    cssCodeSplit: true,
    target: "es2020",
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,

    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-ui": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
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
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
          ],
          "vendor-icons": ["lucide-react"],
          "vendor-charts": ["recharts"],
          "vendor-canvas": ["html2canvas"],
          "vendor-db": ["@supabase/supabase-js"],
           "vendor-crypto": [
            "@scure/bip32",
            "@scure/bip39",
            "@scure/btc-signer",
            "@scure/base",
            "@noble/curves",
            "@noble/hashes",
            "@noble/ed25519",
            "@noble/secp256k1",
            ],
          "vendor-utils": [
            "@tanstack/react-query",
            "wouter",
            "zod",
          ],
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
