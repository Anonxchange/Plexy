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
    assetsInlineLimit: 2048,
    sourcemap: false,
    minify: "esbuild",
    cssCodeSplit: true,
    target: "es2020",
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,

    modulePreload: {
      resolveDependencies: (filename, deps) => {
        const lazyPrefixes = ["vendor-ui-x", "vendor-charts", "vendor-canvas", "vendor-crypto"];
        if (lazyPrefixes.some((p) => filename.includes(p))) return [];
        return deps;
      },
    },

    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],

          // Radix UI packages required for the initial render:
          // AppHeader needs slot, avatar, dialog, dropdown-menu.
          // TooltipProvider (context-only, lightweight) needs tooltip.
          // Toast is excluded — Toaster is now lazy-loaded.
          "vendor-ui": [
            "@radix-ui/react-avatar",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-slot",
            "@radix-ui/react-tooltip",
          ],

          // Extended UI – only used inside lazy-loaded pages/dialogs.
          // This chunk is never preloaded on the home page.
          "vendor-ui-x": [
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

          // vendor-charts, vendor-canvas, vendor-crypto intentionally removed
          // from manualChunks. Recharts, html2canvas, and the crypto libs are
          // only imported by lazy-loaded pages so Rollup will co-locate them in
          // those lazy chunks – they are never fetched on the initial page load.

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
