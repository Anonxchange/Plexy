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
      cssMinify: true,
      cssCodeSplit: true,
      target: "es2020",
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              // Crypto libraries and their dependencies (includes buffer, base-x, etc.)
              if (
                id.includes("@noble") || 
                id.includes("@scure") || 
                id.includes("bitcoinjs-lib") || 
                id.includes("tiny-secp256k1") || 
                id.includes("ecpair") || 
                id.includes("bip32") || 
                id.includes("bip39") ||
                id.includes("base-x") ||
                id.includes("bs58") ||
                id.includes("typeforce") ||
                id.includes("varuint-bitcoin") ||
                id.includes("wif") ||
                id.includes("pushdata-bitcoin") ||
                id.includes("uint8array-tools")
              ) {
                return "crypto-core";
              }
              // React core - check before generic react match
              if (id.includes("react-dom") || id.includes("/react/") || id.includes("wouter") || id.includes("@tanstack/react-query")) {
                return "vendor-react";
              }
              // UI components
              if (id.includes("@radix-ui") || id.includes("lucide-react")) {
                return "vendor-ui";
              }
              // Animation
              if (id.includes("framer-motion")) {
                return "vendor-motion";
              }
              // Supabase
              if (id.includes("@supabase")) {
                return "vendor-supabase";
              }
              // Media processing
              if (id.includes("face-api.js") || id.includes("html2canvas")) {
                return "vendor-media";
              }
              // Charts
              if (id.includes("recharts") || id.includes("d3-")) {
                return "vendor-charts";
              }
            }
            // Don't return anything for unmatched - let Vite decide
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
