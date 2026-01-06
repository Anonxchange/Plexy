import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// Detect Replit + dev environment
const isReplitDev =
  process.env.NODE_ENV !== "production" &&
  process.env.REPL_ID !== undefined;

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

  if (isReplitDev) {
    // Dynamic import to avoid errors in production builds
    plugins.push((async () => {
      const { default: runtimeErrorModal } = await import("@replit/vite-plugin-runtime-error-modal");
      return runtimeErrorModal();
    })() as unknown as PluginOption);
    
    plugins.push((async () => {
      const { devBanner } = await import("@replit/vite-plugin-dev-banner");
      return devBanner();
    })() as unknown as PluginOption);
  }

  return {
    plugins,
    root: path.resolve(import.meta.dirname, "client"),
    envDir: path.resolve(import.meta.dirname),
    base: "/",
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
        "stream": "stream-browserify",
        "buffer": "buffer",
      },
    },
    build: {
      outDir: "../dist",
      emptyOutDir: true,
      assetsInlineLimit: 0,
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
      hmr: {
        overlay: false,
        clientPort: 443,
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
    },
  };
});
