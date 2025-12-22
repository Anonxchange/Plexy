import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Detect Replit + dev environment
const isReplitDev =
  process.env.NODE_ENV !== "production" &&
  process.env.REPL_ID !== undefined;

export default defineConfig(async () => ({
  plugins: [
    react(),

    // ✅ Replit plugins ONLY in dev
    ...(isReplitDev
      ? [
          (await import("@replit/vite-plugin-runtime-error-modal")).default(),
          (await import("@replit/vite-plugin-cartographer")).cartographer(),
          (await import("@replit/vite-plugin-dev-banner")).devBanner(),
        ]
      : []),
  ],

  // 👇 Frontend root
  root: path.resolve(import.meta.dirname, "client"),

  // 👇 .env files live in project root
  envDir: path.resolve(import.meta.dirname),

  // 👇 Correct base path for Vercel
  base: "/",

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  build: {
    // ✅ MUST be relative to `root`
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },

  // 🔧 Dev server only
  server: {
    host: "0.0.0.0",
    port: 5000,
  },

  // 🔧 Preview server
  preview: {
    host: "0.0.0.0",
    port: 5000,
  },
}));
