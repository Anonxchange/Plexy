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
        // Don't eagerly preload chunks only needed on demand
        const lazyPrefixes = [
          // "vendor-db", ← removed: Supabase is needed on every page for session checks
          "vendor-ui-x",
          "vendor-charts",
          "vendor-canvas",
          "vendor-crypto",
          "vendor-motion",
        ];
        if (lazyPrefixes.some((p) => filename.includes(p))) return [];
        return deps;
      },
    },

    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],

          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-slot",
            "@radix-ui/react-tooltip",
          ],

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

          "vendor-icons": ["lucide-react"],

          "vendor-db": ["@supabase/supabase-js"],

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
