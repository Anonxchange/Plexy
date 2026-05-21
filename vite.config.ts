import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "client",
  envDir: "../",
  base: "/",

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),

      // @noble/hashes ships subpath specifiers not listed in its exports map.
      // Vite 7's strict resolver rejects them at build time without these.
      // Each alias points directly to the real file on disk.
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
          "vendor-db": ["@supabase/ssr"],
          "vendor-utils": ["@tanstack/react-query", "wouter", "zod"],
        },
      },
    },
  },

  // Dev server — loopback only (Vite default: 127.0.0.1).
  // Only your machine can reach it. No header-based allowedHosts needed
  // because the OS drops packets from any other source before Vite sees them.
  server: {
    port: 5000,
    hmr: true,
    fs: {
      strict: true,
      deny: [".env", ".env.*", "*.pem", "*.key", "*.p12", "*.pfx", "**/.git/**"],
    },
  },

  // Preview server — same loopback-only rule.
  // Use `vite preview` locally before pushing to Vercel to catch build regressions.
  preview: {
    port: 4173,
  },

  // Production: `vite build` emits static files to /dist.
  // Vercel's CDN serves them — no Vite server runs in production.
  // Security headers (HSTS, CSP, X-Frame-Options) belong in vercel.json.
});
