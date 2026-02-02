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
