export const SITE_ORIGIN = "https://www.pexly.app";

export function buildCanonicalUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${clean === "/" ? "/" : clean.replace(/\/+$/, "")}`;
}

export const siteMetadata = {
  title: "Pexly — Your wallet, your way to pay",
  description:
    "Spend crypto directly from your own wallet. Buy gift cards, top up mobile phones, pay utility bills, and shop global products on Pexly.",
  url: "https://www.pexly.app/",
  image: "https://www.pexly.app/hero-bg.webp",
  imageAlt: "Pexly — digital services with your own wallet",
  siteName: "Pexly",
} as const;

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.pexly.app/#organization",
      name: "Pexly",
      alternateName: "Pexly",
      url: "https://www.pexly.app/",
      description: siteMetadata.description,
      foundingDate: "2024",
      logo: {
        "@type": "ImageObject",
        url: "https://www.pexly.app/favicon.webp",
        width: "512",
        height: "512",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "technical support",
          availableLanguage: ["English"],
          areaServed: "Worldwide",
        },
      ],
      sameAs: [],
      knowsAbout: [
        "Non-custodial wallets",
        "Crypto gift cards",
        "Mobile top-ups",
        "Utility bill payments",
        "Global online shopping",
      ],
      slogan: "Your wallet, your way to pay",
    },
    {
      "@type": "WebSite",
      "@id": "https://www.pexly.app/#website",
      url: "https://www.pexly.app/",
      name: "Pexly",
      description: siteMetadata.description,
      publisher: {
        "@id": "https://www.pexly.app/#organization",
      },
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.pexly.app/#software",
      name: "Pexly Marketplace",
      description:
        "Pexly connects digital services and global shopping with crypto users paying directly from wallets they control without custodying user funds.",
      provider: {
        "@id": "https://www.pexly.app/#organization",
      },
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
} as const;

type EntryDocumentOptions = {
  basePath: string;
  development: boolean;
  entryFile: string;
  cssFiles?: string[];
};

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function createEntryDocument({
  basePath,
  development,
  entryFile,
  cssFiles = [],
}: EntryDocumentOptions) {
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const assetUrl = (file: string) => `${base}${file.replace(/^\/+/, "")}`;
  const stylesheets = cssFiles
    .map(
      (file) =>
        `<link rel="stylesheet" crossorigin href="${escapeAttribute(assetUrl(file))}" />`,
    )
    .join("\n    ");
  const viteClient = development
    ? `<script type="module" src="${escapeAttribute(assetUrl("@vite/client"))}"></script>`
    : "";
  const entryUrl = development ? assetUrl("src/main.tsx") : assetUrl(entryFile);
  const structuredData = JSON.stringify(siteStructuredData).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="UTF-8" />
    <meta property="csp-nonce" content="" />
    <meta name="cf-country" content="" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <title>${escapeAttribute(siteMetadata.title)}</title>
    <meta name="description" content="${escapeAttribute(siteMetadata.description)}" />
    <link rel="canonical" href="${escapeAttribute(siteMetadata.url)}" />
    <meta property="og:title" content="${escapeAttribute(siteMetadata.title)}" />
    <meta property="og:description" content="${escapeAttribute(siteMetadata.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeAttribute(siteMetadata.url)}" />
    <meta property="og:image" content="${escapeAttribute(siteMetadata.image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttribute(siteMetadata.imageAlt)}" />
    <meta property="og:site_name" content="${escapeAttribute(siteMetadata.siteName)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(siteMetadata.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(siteMetadata.description)}" />
    <meta name="twitter:image" content="${escapeAttribute(siteMetadata.image)}" />
    <meta name="twitter:image:alt" content="${escapeAttribute(siteMetadata.imageAlt)}" />
    <link rel="icon" type="image/webp" href="${escapeAttribute(assetUrl("favicon.webp"))}" />
    <link rel="preload" href="${escapeAttribute(assetUrl("assets/fonts/plus-jakarta-sans-52d04440.woff2"))}" as="font" type="font/woff2" crossorigin />
    <script id="pexly-site-structured-data" type="application/ld+json">${structuredData}</script>
    ${stylesheets}
    ${viteClient}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" crossorigin src="${escapeAttribute(entryUrl)}"></script>
  </body>
</html>`;
}
