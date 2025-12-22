import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Detect Replit + dev environment
const isReplitDev =
  process.env.NODE_ENV !== "production" &&
  process.env.REPL_ID !== undefined;

export default defineConfig(async () => {
  const plugins = [
    react(),
  ];

  if (isReplitDev) {
    try {
      const runtimeErrorModal = await import("@replit/vite-plugin-runtime-error-modal");
      const devBanner = await import("@replit/vite-plugin-dev-banner");
      
      plugins.push(runtimeErrorModal.default());
      plugins.push(devBanner.devBanner());
    } catch (e) {
      console.error("Failed to load Replit plugins:", e);
    }
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
