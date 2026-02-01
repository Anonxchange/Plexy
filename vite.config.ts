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
    build: {
      outDir: "../dist",
      emptyOutDir: true,
      assetsInlineLimit: 2048,
      sourcemap: false,
      minify: "esbuild",
      cssMinify: true,
      cssCodeSplit: true,
      target: "es2020",
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("wouter") || id.includes("@tanstack/react-query")) {
                return "vendor-react";
              }
              if (id.includes("ethers") || id.includes("viem") || id.includes("bitcoinjs-lib") || id.includes("ox") || id.includes("@coinbase/wallet-sdk") || id.includes("@base-org/account") || id.includes("@walletconnect")) {
                return "vendor-crypto";
              }
              if (id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("framer-motion")) {
                return "vendor-ui";
              }
              if (id.includes("@aws-sdk") || id.includes("@supabase") || id.includes("@neondatabase")) {
                return "vendor-cloud";
              }
              if (id.includes("face-api.js") || id.includes("canvas") || id.includes("html2canvas")) {
                return "vendor-media";
              }
              return "vendor";
            }
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
