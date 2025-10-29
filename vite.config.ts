import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"), // 👈 index.html entry lives here
  envDir: path.resolve(import.meta.dirname), // 👈 .env files live in project root
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"), // ✅ final build goes here
    emptyOutDir: true,
    assetsInlineLimit: 0, // Don't inline assets, keep them as separate files for better caching
  },
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    }
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  },
});