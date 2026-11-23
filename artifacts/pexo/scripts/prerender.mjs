import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.join(process.cwd(), "dist/public");

// Keep one clean Vite document for Vercel's SPA fallback. Do not generate
// static copies of marketing pages or inject a second homepage before React.
const indexPath = path.join(outputDir, "index.html");
const fallbackPath = path.join(outputDir, "_spa.html");
const template = await fs.readFile(indexPath, "utf8");

await fs.writeFile(fallbackPath, template, "utf8");
console.log("[spa] Prepared clean SPA fallback document.");
