import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig(() => {
  const plugins: PluginOption[] = [
    react(),
    wasm(),
    topLevelAwait(),
  ];

  return {
    plugins,
    root: "client",
    envDir: "../",
    base: "/",
    resolve: {
      alias: {
        "react": path.resolve(__dirname, "node_modules/react"),
        "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    define: {
      'global': 'globalThis',
    },
    optimizeDeps: {
      include: [
        '@noble/curves',
        '@noble/hashes',
        '@scure/bip32',
        '@scure/bip39',
        '@scure/btc-signer',
      ],
      esbuildOptions: {
        target: 'es2020',
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
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // Core framework (must stay isolated)
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('wouter')
            ) {
              return 'vendor-core';
            }

            // UI libs (safe to isolate)
            if (
              id.includes('@radix-ui') ||
              id.includes('lucide-react') ||
              id.includes('class-variance-authority') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge')
            ) {
              return 'vendor-ui';
            }

            // Data / backend
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }

            if (id.includes('@tanstack') || id.includes('react-query')) {
              return 'vendor-query';
            }

            // Charts
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }

            // Forms
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'vendor-forms';
            }

            // Everything else (including crypto)
            return 'vendor';
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
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
    },
  };
});