import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "client",
  envDir: "../",
  envPrefix: "VITE_",

  base: "/",

  plugins: [react()],

  resolve: {
    alias: {
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
          "vendor-icons": ["@hugeicons/react", "@hugeicons/core-free-icons"],
          "vendor-db": ["@supabase/ssr"],
          "vendor-utils": ["@tanstack/react-query", "wouter", "zod"],
        },
      },
    },
  },

  server: {
    port: 5000,
    hmr: true,
    fs: {
      strict: true,
      deny: [".env", ".env.*", "*.pem", "*.key", "*.p12", "*.pfx", "**/.git/**"],
    },
  },

  preview: {
    port: 4173,
  },
});
