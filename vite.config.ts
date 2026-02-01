import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(() => {
  const plugins: PluginOption[] = [
    react(),
    wasm(),
    topLevelAwait(),
    nodePolyfills({
      globals: {
        Buffer: true,
        process: true,
      },
      protocolImports: true,
    }),
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
        "stream": "stream-browserify",
        "buffer": "buffer",
      },
    },
    build: {
      outDir: "../dist",
      emptyOutDir: true,
      assetsInlineLimit: 2048,
      sourcemap: false,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug", "console.trace"],
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
      cssMinify: true,
      target: "esnext",
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("wouter")) {
                return "vendor-react";
              }
              if (id.includes("ethers") || id.includes("viem") || id.includes("bitcoinjs-lib")) {
                return "vendor-crypto";
              }
              if (id.includes("@radix-ui")) {
                return "vendor-ui";
              }
              if (id.includes("lucide-react") || id.includes("date-fns") || id.includes("recharts") || id.includes("framer-motion")) {
                return "vendor-utils";
              }
              if (id.includes("@aws-sdk") || id.includes("@supabase")) {
                return "vendor-cloud";
              }
              if (id.includes("face-api.js") || id.includes("canvas")) {
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
      allowedHosts: true as const,
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
      allowedHosts: true as const,
    },
  };
});
