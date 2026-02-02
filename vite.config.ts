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
      global: 'globalThis',
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
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-toast',
              'class-variance-authority',
              'clsx',
              'tailwind-merge',
            ],
            'vendor-crypto': [
              '@noble/curves',
              '@noble/hashes',
              '@scure/bip32',
              '@scure/bip39',
              '@scure/btc-signer',
            ],
            'vendor-supabase': [
              '@supabase/supabase-js',
              '@supabase/ssr',
            ],
            'vendor-charts': ['recharts'],
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          },
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
      hmr: {
        overlay: false,
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
