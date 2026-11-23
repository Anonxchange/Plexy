import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

const root = process.cwd();
const outputDir = path.join(root, "dist/public");
const manifestPath = path.join(outputDir, ".vite/manifest.json");
const routes = [
  "/",
  "/gift-cards",
  "/gift-cards/all",
  "/shop",
  "/mobile-topup",
  "/about-us",
  "/teams",
  "/career",
  "/blogs",
];

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function replaceMeta(html, attribute, key, value) {
  const escaped = escapeHtml(value);
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, "i");
  const tag = `<meta ${attribute}="${key}" content="${escaped}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `    ${tag}\\n  </head>`);
}

function applyMetadata(template, rendered) {
  let html = template.replace(/<title>[\\s\\S]*?<\\/title>/i, `<title>${escapeHtml(rendered.title)}</title>`);
  html = replaceMeta(html, "name", "description", rendered.description);
  html = replaceMeta(html, "property", "og:title", rendered.title);
  html = replaceMeta(html, "property", "og:description", rendered.description);
  html = replaceMeta(html, "property", "og:url", rendered.canonical);
  html = replaceMeta(html, "name", "twitter:title", rendered.title);
  html = replaceMeta(html, "name", "twitter:description", rendered.description);
  const canonical = `<link rel="canonical" href="${escapeHtml(rendered.canonical)}" />`;
  if (/<link\\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\\s+rel=["']canonical["'][^>]*>/i, canonical);
  }
  return html;
}

function collectCss(manifest, entryKeys) {
  const css = new Set();
  const visited = new Set();
  function visit(key) {
    if (visited.has(key)) return;
    visited.add(key);
    const item = manifest[key];
    if (!item) return;
    for (const file of item.css ?? []) css.add(file);
    for (const imported of [...(item.imports ?? []), ...(item.dynamicImports ?? [])]) visit(imported);
  }
  entryKeys.forEach(visit);
  return [...css];
}

async function main() {
  let template = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
  let manifest = {};
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch {
    console.warn("[prerender] Vite manifest not found; route HTML will still be generated without route-specific CSS.");
  }

  const server = await createServer({
    configFile: path.join(root, "vite.config.ts"),
    root,
    appType: "custom",
    server: { middlewareMode: true, hmr: false },
    logLevel: "error",
  });

  try {
    const { renderSeoPage } = await server.ssrLoadModule("/src/seo-prerender-entry.tsx");
    const pageFiles = {
      "/": "src/pages/current-html/home.tsx",
      "/gift-cards": "src/pages/current-html/gift-cards.tsx",
      "/gift-cards/all": "src/pages/current-html/gift-cards-all.tsx",
      "/shop": "src/pages/current-html/physical-products.tsx",
      "/mobile-topup": "src/pages/mobile-topup.tsx",
      "/about-us": "src/pages/current-html/about-us.tsx",
      "/teams": "src/pages/current-html/teams.tsx",
      "/career": "src/pages/current-html/career.tsx",
      "/blogs": "src/pages/current-html/blogs.tsx",
    };

    let generated = 0;
    let skipped = 0;
    for (const route of routes) {
      try {
        const rendered = renderSeoPage(route);
        const title = rendered.match(/<!-- PEXLY_SEO_TITLE:([\\s\\S]*?) -->/)?.[1];
        const description = rendered.match(/<!-- PEXLY_SEO_DESCRIPTION:([\\s\\S]*?) -->/)?.[1];
        const canonical = rendered.match(/<!-- PEXLY_SEO_CANONICAL:([\\s\\S]*?) -->/)?.[1];
        if (!title || !description || !canonical) throw new Error("Missing route metadata markers.");

        const markup = rendered.replace(/\\n?  <!-- PEXLY_SEO_(?:TITLE|DESCRIPTION|CANONICAL):[\\s\\S]*? -->/g, "");
        let html = applyMetadata(template, { title, description, canonical });
        const entryKeys = ["src/main.tsx", pageFiles[route], "src/components/marketing/current-marketing-page.tsx"];
        const styles = collectCss(manifest, entryKeys);
        if (styles.length) {
          const links = styles.map(file => `<link rel="stylesheet" href="/${file.replace(/^\\//, "")}" />`).join("\\n    ");
          html = html.replace("</head>", `    ${links}\\n  </head>`);
        }
        html = html.replace('<div id="root"></div>', `${markup}\\n    <div id="root"></div>`);
        const destinations = route === "/" ? ["index.html", "en/index.html"] : [`${route.slice(1)}/index.html`, `en${route}/index.html`];
        for (const relative of destinations) {
          const destination = path.join(outputDir, relative);
          await fs.mkdir(path.dirname(destination), { recursive: true });
          await fs.writeFile(destination, html, "utf8");
        }
        generated += 1;
        console.log(`[prerender] ${route}`);
      } catch (error) {
        skipped += 1;
        console.warn(`[prerender] Skipped ${route}:`, error?.stack ?? error);
      }
    }
    if (!generated) throw new Error("No SEO pages could be prerendered.");
    console.log(`[prerender] Generated ${generated} routes; skipped ${skipped}.`);
  } finally {
    await server.close();
  }
}

main().catch(error => {
  console.error("[prerender] Failed:", error);
  process.exitCode = 1;
});
