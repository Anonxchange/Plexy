import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import { createEntryDocument } from "./src/lib/site-document.ts";

// Pexly is deployed at the domain root; do not let a Vercel environment variable
// accidentally generate asset URLs for a different path.
const basePath = "/";

const artifactRoot = path.resolve(import.meta.dirname);

const reactDocumentEntry: Plugin = {
  name: "pexly-react-document-entry",
  configureServer(server) {
    server.middlewares.use((_request, response, next) => {
      response.removeHeader("X-Powered-By");
      response.removeHeader("Server");
      const originalSetHeader = response.setHeader.bind(response);
      response.setHeader = ((name: string, value: number | string | readonly string[]) => {
        const lower = name.toLowerCase();
        if (lower === "x-powered-by" || lower === "server") return response;
        return originalSetHeader(name, value);
      }) as typeof response.setHeader;
      next();
    });
    server.middlewares.use((request, response, next) => {
      if (request.method !== "GET" || !request.headers.accept?.includes("text/html")) {
        next();
        return;
      }

      const pathname = new URL(request.url ?? "/", "http://vite.local").pathname;
      const extension = path.extname(pathname);
      if (extension && extension.toLowerCase() !== ".html") {
        next();
        return;
      }

      response.statusCode = 200;
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.setHeader("Cache-Control", "no-cache");
      const document = createEntryDocument({
        basePath,
        development: true,
        entryFile: "src/main.tsx",
      });
      void server
        .transformIndexHtml(pathname, document)
        .then((transformedDocument) => response.end(transformedDocument))
        .catch(next);
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((_request, response, next) => {
      response.removeHeader("X-Powered-By");
      response.removeHeader("Server");
      const originalSetHeader = response.setHeader.bind(response);
      response.setHeader = ((name: string, value: number | string | readonly string[]) => {
        const lower = name.toLowerCase();
        if (lower === "x-powered-by" || lower === "server") return response;
        return originalSetHeader(name, value);
      }) as typeof response.setHeader;
      next();
    });
  },
  config() {
    return {
      build: {
        rolldownOptions: {
          input: path.resolve(artifactRoot, "src/main.tsx"),
          output: {
            strictExecutionOrder: true,
            codeSplitting: {
              groups: [
                {
                  name: "wallet-vendor",
                  test: /node_modules[\\/](?:@reown|wagmi|viem|@solana|@tronweb3|tronweb|bitcoinjs-lib)(?:[\\/]|$)/,
                  priority: 30,
                  maxSize: 350_000,
                  minSize: 40_000,
                },
                {
                  name: "charts-vendor",
                  test: /node_modules[\\/](?:recharts|d3-[^\\/]+)(?:[\\/]|$)/,
                  priority: 20,
                  maxSize: 250_000,
                  minSize: 30_000,
                },
                {
                  name: "vendor",
                  test: /node_modules[\\/]/,
                  priority: 1,
                  maxSize: 350_000,
                  minSize: 60_000,
                },
              ],
            },
          },
        },
      },
    };
  },
  generateBundle(_options, bundle) {
    const entry = Object.values(bundle).find(
      (output) =>
        output.type === "chunk" &&
        output.isEntry &&
        output.facadeModuleId?.endsWith("/src/main.tsx"),
    );
    if (!entry || entry.type !== "chunk") {
      this.error("Could not find the React application entry bundle.");
    }

    const viteMetadata = (entry as typeof entry & {
      viteMetadata?: { importedCss?: Set<string> };
    }).viteMetadata;

    const documentHtml = createEntryDocument({
      basePath,
      development: false,
      entryFile: entry.fileName,
      cssFiles: [...(viteMetadata?.importedCss ?? [])],
    });

    // 1. Emit index.html for Vercel static hosting
    this.emitFile({
      type: "asset",
      fileName: "index.html",
      source: documentHtml,
    });

    // 2. Keep runtime-entry.json for server runtime compatibility
    this.emitFile({
      type: "asset",
      fileName: "runtime-entry.json",
      source: JSON.stringify({ html: documentHtml }),
    });
  },
};

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), reactDocumentEntry],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  define: { global: "globalThis" },
  worker: { format: "es" },
  root: artifactRoot,
  build: {
    manifest: true,
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
