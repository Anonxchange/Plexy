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
    root: path.resolve(process.cwd(), "client"),
    envDir: path.resolve(process.cwd()),
    base: "/",
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "client", "src"),
        "@shared": path.resolve(process.cwd(), "shared"),
        "@assets": path.resolve(process.cwd(), "attached_assets"),
      },
    },
    define: {
      // ensure the key is a string so Vite replaces occurrences correctly
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
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('wouter')) {
                return 'vendor-core';
              }
              if (id.includes('@tanstack') || id.includes('react-query')) {
                return 'vendor-query';
              }
              if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
                return 'vendor-ui';
              }
              if (id.includes('@noble') || id.includes('@scure')) {
                return 'vendor-crypto';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('react-hook-form') || id.includes('zod')) {
                return 'vendor-forms';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
      // safer HMR defaults — show overlay so runtime errors are visible in the browser
      hmr: {
        overlay: true,
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